import React, { useState, useMemo } from 'react';
import { Surgery, FilterState } from '../types';
import { normalizeStr } from '../services/utils';
import SurgeryCard from './SurgeryCard';
import { addSurgery } from '../services/firebase';

interface SurgeryListProps {
    surgeries: Surgery[];
    onEdit: (surgery: Surgery) => void;
    onDelete: (id: string) => void;
}

const SurgeryList: React.FC<SurgeryListProps> = ({ surgeries, onEdit, onDelete }) => {
    const [filters, setFilters] = useState<FilterState>({
        professor: "",
        operation: "",
        resident: "",
        secondRoom: "",
        remaining: "",
        mdp: "",
        kg: "",
        search: ""
    });

    const [showExcelModal, setShowExcelModal] = useState(false);
    const [excelDate, setExcelDate] = useState("");
    const [uploading, setUploading] = useState(false);

    // Derived options for select dropdowns
    const uniqueProfessors = useMemo(() => (Array.from(new Set(surgeries.map(s => (s.professor || "").trim().toUpperCase()).filter(Boolean))) as string[]).sort((a,b) => a.localeCompare(b, 'tr-TR')), [surgeries]);
    const uniqueOperations = useMemo(() => (Array.from(new Set(surgeries.map(s => normalizeStr(s.operation)).filter(Boolean))) as string[]).sort((a,b) => a.localeCompare(b, 'tr-TR')), [surgeries]);
    const uniqueResidents = useMemo(() => (Array.from(new Set(surgeries.map(s => (s.resident || "").trim().toUpperCase()).filter(Boolean))) as string[]).sort((a,b) => a.localeCompare(b, 'tr-TR')), [surgeries]);

    const filteredSurgeries = useMemo(() => {
        const searchVal = normalizeStr(filters.search);
        
        return [...surgeries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).filter(s => {
            const pName = normalizeStr(s.patientName);
            const oper = normalizeStr(s.operation);
            const profe = normalizeStr(s.professor);
            const proto = normalizeStr(s.protocol);
            const resid = normalizeStr(s.resident);

            const textMatch = pName.includes(searchVal) || oper.includes(searchVal) || profe.includes(searchVal) || proto.includes(searchVal) || resid.includes(searchVal);

            if (!textMatch) return false;
            if (filters.professor && normalizeStr(s.professor).toUpperCase() !== filters.professor) return false;
            if (filters.operation && normalizeStr(s.operation) !== filters.operation) return false;
            if (filters.resident && normalizeStr(s.resident).toUpperCase() !== filters.resident) return false;
            
            if (filters.secondRoom === "second" && !s.isSecondRoom) return false;
            if (filters.secondRoom === "first" && s.isSecondRoom) return false;
            
            if (filters.remaining === "onlyRemaining" && !s.isRemaining) return false;
            if (filters.remaining === "onlyNotRemaining" && s.isRemaining) return false;
            
            if (filters.mdp === "yes" && !s.isMDP) return false;
            if (filters.mdp === "no" && s.isMDP) return false;
            
            if (filters.kg === "yes" && !s.isKG) return false;
            if (filters.kg === "no" && s.isKG) return false;

            return true;
        });
    }, [surgeries, filters]);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            professor: "", operation: "", resident: "", secondRoom: "", remaining: "", mdp: "", kg: "", search: ""
        });
    };

    const exportToCSV = (data: Surgery[], filename: string) => {
        const csvContent = "\uFEFF" + 
            "Tarih,Hasta Adı,Protokol,Yaş,İşlem,Hoca,Asistan,Telefon,İdrar,Anestezi,Notlar,2. Salon,Kalan,MDP,KG\n" +
            data.map(e => `"${e.date}","${e.patientName}","${e.protocol||''}","${e.age||''}","${e.operation}","${e.professor||''}","${e.resident||''}","${e.phone||''}","${e.urine||''}","${e.anesthesia||''}","${(e.note||'').replace(/"/g, '""')}","${e.isSecondRoom?'Evet':'Hayır'}","${e.isRemaining?'Evet':'Hayır'}","${e.isMDP?'Evet':'Hayır'}","${e.isKG?'Evet':'Hayır'}"`).join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !excelDate) return;
        const file = e.target.files[0];
        setUploading(true);

        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            alert("Excel kütüphanesi yüklenemedi.");
            setUploading(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                let totalAdded = 0;
                const dayMap: {[key:string]: number} = { "pazartesi": 0, "salı": 1, "çarşamba": 2, "perşembe": 3, "cuma": 4, "cumartesi": 5, "pazar": 6 };
                const startDate = new Date(excelDate);

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    const normalizedName = sheetName.toLowerCase().trim();
                    let dayOffset = 0;
                    let foundDay = false;
                    
                    for (const [dayName, offset] of Object.entries(dayMap)) {
                        if (normalizedName.includes(dayName)) {
                            dayOffset = offset;
                            foundDay = true;
                            break;
                        }
                    }
                    if (!foundDay && workbook.SheetNames.indexOf(sheetName) > 0) {
                        dayOffset = workbook.SheetNames.indexOf(sheetName);
                    }

                    const targetDate = new Date(startDate);
                    targetDate.setDate(startDate.getDate() + dayOffset);
                    const targetDateStr = targetDate.toISOString().split('T')[0];

                    for (const row of (jsonData as any[])) {
                         const keys = Object.keys(row);
                         const getVal = (k: string) => { const key = keys.find(key => key.trim().toUpperCase() === k); return key ? row[key] : ""; };
                         const patientName = getVal("HASTA ADI");
                         if (!patientName) continue;

                         const newDoc: Surgery = {
                            date: targetDateStr, 
                            patientName: patientName, 
                            protocol: String(getVal("PROTOKOL") || ""), 
                            phone: String(getVal("TELEFON") || ""), 
                            operation: String(getVal("OPERASYON") || ""), 
                            professor: String(getVal("HOCA") || ""), 
                            resident: String(getVal("VEREN DR") || ""), 
                            urine: String(getVal("İDRAR KÜLTÜRÜ") || ""), 
                            anesthesia: String(getVal("ANESTEZİ") || ""), 
                            age: String(getVal("YAŞ") || ""),
                            note: (getVal("NOTLAR") || "") + (getVal("YAŞ") ? ` (Yaş: ${getVal("YAŞ")})` : ""), 
                            isSecondRoom: false, isRemaining: false, isMDP: false, isKG: false,
                        };
                        await addSurgery(newDoc);
                        totalAdded++;
                    }
                }
                alert(`${totalAdded} hasta eklendi!`);
                setShowExcelModal(false);
            } catch (err: any) {
                alert("Hata: " + err.message);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const stats = {
        total: filteredSurgeries.length,
        second: filteredSurgeries.filter(s => s.isSecondRoom).length,
        remaining: filteredSurgeries.filter(s => s.isRemaining).length,
        upcoming: filteredSurgeries.filter(s => new Date(s.date) >= new Date()).length
    };

    return (
        <section className="pb-24">
             <div className="bg-white p-2 rounded-xl shadow-sm mb-4 border border-slate-100 flex items-center sticky top-0 z-10">
                <i className="fa-solid fa-search text-slate-400 ml-3"></i>
                <input 
                    type="text" 
                    placeholder="Hasta, hoca, işlem veya protokol ara..." 
                    className="w-full p-2 pl-3 outline-none text-sm bg-white text-slate-700"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                />
            </div>

            <div className="mb-3 flex gap-2">
                <button onClick={() => setShowExcelModal(true)} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl shadow flex items-center justify-center gap-2 text-xs font-bold transition">
                    <i className="fa-solid fa-file-excel text-lg"></i> Excel Dosyası Yükle
                </button>
                <button onClick={resetFilters} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-xl shadow flex items-center justify-center gap-2 text-xs font-bold transition">
                    <i className="fa-solid fa-filter-circle-xmark text-lg"></i> Sıfırla
                </button>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm mb-3 border border-slate-100 flex flex-wrap gap-2 text-xs">
                <select value={filters.professor} onChange={(e) => handleFilterChange('professor', e.target.value)} className="flex-1 min-w-[120px] px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700">
                    <option value="">Hoca: Tümü</option>
                    {uniqueProfessors.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filters.operation} onChange={(e) => handleFilterChange('operation', e.target.value)} className="flex-1 min-w-[120px] px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700">
                    <option value="">İşlem: Tümü</option>
                    {uniqueOperations.map(o => <option key={o} value={o}>{o.charAt(0).toLocaleUpperCase('tr-TR') + o.slice(1)}</option>)}
                </select>
                <select value={filters.resident} onChange={(e) => handleFilterChange('resident', e.target.value)} className="flex-1 min-w-[120px] px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700">
                    <option value="">Asistan: Tümü</option>
                    {uniqueResidents.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filters.secondRoom} onChange={(e) => handleFilterChange('secondRoom', e.target.value)} className="w-28 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700">
                    <option value="">Salon: Tümü</option><option value="second">Sadece 2. Salon</option><option value="first">Sadece 1. Salon</option>
                </select>
                <select value={filters.remaining} onChange={(e) => handleFilterChange('remaining', e.target.value)} className="w-32 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700">
                    <option value="">Kalan: Tümü</option><option value="onlyRemaining">Sadece Kalan</option><option value="onlyNotRemaining">Kalan Olmayan</option>
                </select>
                <select value={filters.mdp} onChange={(e) => handleFilterChange('mdp', e.target.value)} className="w-24 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700">
                    <option value="">MDP: Tümü</option><option value="yes">MDP</option><option value="no">MDP Değil</option>
                </select>
                <select value={filters.kg} onChange={(e) => handleFilterChange('kg', e.target.value)} className="w-24 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700">
                    <option value="">KG: Tümü</option><option value="yes">KG</option><option value="no">KG Değil</option>
                </select>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm mb-3 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-slate-400 uppercase text-[10px] font-semibold">Toplam Vaka</div><div className="text-base font-bold text-slate-800">{stats.total}</div></div>
                <div><div className="text-slate-400 uppercase text-[10px] font-semibold">2. Salon</div><div className="text-base font-bold text-slate-800">{stats.second}</div></div>
                <div><div className="text-slate-400 uppercase text-[10px] font-semibold">Kalan</div><div className="text-base font-bold text-slate-800">{stats.remaining}</div></div>
                <div><div className="text-slate-400 uppercase text-[10px] font-semibold">Bugünden Sonra</div><div className="text-base font-bold text-slate-800">{stats.upcoming}</div></div>
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => exportToCSV(surgeries, 'tum_liste.csv')} className="flex-1 px-3 py-2 text-[11px] font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold active:scale-95 transition">Tüm Listeyi CSV İndir</button>
                <button onClick={() => exportToCSV(filteredSurgeries, 'filtreli_liste.csv')} className="flex-1 px-3 py-2 text-[11px] font-semibold rounded-xl border border-blue-200 bg-blue-50 text-blue-700 active:scale-95 transition">Filtreli CSV İndir</button>
            </div>

            <div className="space-y-3">
                {filteredSurgeries.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-4">Kayıt bulunamadı.</div>
                ) : (
                    filteredSurgeries.map(s => (
                        <SurgeryCard key={s.id} surgery={s} showDate onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>

            {/* Excel Modal */}
            {showExcelModal && (
                <div className="fixed top-0 left-0 width-full height-full w-full h-full bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><i className="fa-solid fa-file-import text-emerald-600"></i> Excel İçe Aktar</h2>
                        <p className="text-xs text-slate-500 mb-4">Excel dosyanızı seçin ve <b>Pazartesi</b> gününü belirleyin.</p>
                        <div className="space-y-3">
                            <div><label className="block text-xs font-bold text-slate-700 mb-1">1. Başlangıç Tarihi (Pazartesi)</label><input type="date" value={excelDate} onChange={e => setExcelDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-1">2. Excel Dosyası</label><input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="w-full text-xs border rounded-lg p-2" disabled={!excelDate || uploading} /></div>
                        </div>
                        {uploading && <div className="mt-2 text-[10px] text-center text-slate-400">İşleniyor...</div>}
                        <div className="mt-6 flex gap-2">
                            <button onClick={() => setShowExcelModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SurgeryList;