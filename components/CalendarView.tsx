import React, { useState, useMemo, useEffect } from 'react';
import { Surgery } from '../types';
import { formatDateDisplay } from '../services/utils';
import SurgeryCard from './SurgeryCard';

interface CalendarViewProps {
    surgeries: Surgery[];
    selectedDate: string;
    onDateSelect: (date: string) => void;
    onEdit: (surgery: Surgery) => void;
    onDelete: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ surgeries, selectedDate, onDateSelect, onEdit, onDelete }) => {
    // Determine the month to display based on selectedDate or current Date if selected is far off? 
    // Actually, usually users want to navigate months independently of selection, but syncing them is simpler.
    // Let's keep a local state for the displayed month.
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate));
    
    // Salon Planlama State'leri
    const [isPlanning, setIsPlanning] = useState(false);
    
    // ID -> Salon Numarası (1, 2, 3) eşleşmesi
    // BAŞLANGIÇTA LOCALSTORAGE'DAN OKU
    const [placements, setPlacements] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem('surgery_placements');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    
    // VERİ DEĞİŞTİĞİNDE LOCALSTORAGE'A KAYDET
    // Not: useEffect ile tarih değişince sıfırlama işlemini kaldırdık.
    const saveToStorage = (data: Record<string, number>) => {
        localStorage.setItem('surgery_placements', JSON.stringify(data));
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        // 0 = Sunday, 1 = Monday. We want Monday as 0 index for the grid.
        // JS getDay(): 0=Sun, 1=Mon...6=Sat
        // Target: Mon=0, Tue=1... Sun=6
        const day = new Date(year, month, 1).getDay();
        return (day + 6) % 7;
    };

    const generateCalendarGrid = () => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const startDay = getFirstDayOfMonth(year, month);

        const days = [];
        // Empty slots
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const handlePrevMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        const now = new Date();
        setDisplayDate(now);
        onDateSelect(now.toISOString().split('T')[0]);
    };

    const copyToWhatsapp = () => {
        const list = surgeries.filter(s => s.date === selectedDate);
        if (list.length === 0) {
            alert("Vaka yok.");
            return;
        }
        const d = formatDateDisplay(selectedDate);
        let text = `📅 *${d} - EGE ÜROLOJİ*\n--------------------------------\n`;
        list.forEach((i, idx) => {
            const badges = `${i.isRemaining ? "🔴 " : ""}${i.isSecondRoom ? "[2. SALON] " : ""}${i.isMDP ? "[MDP] " : ""}${i.isKG ? "[KG] " : ""}`;
            text += `\n${idx + 1}. ${badges}${i.patientName} ${i.age ? `(${i.age})` : ""} ${i.protocol ? `(#${i.protocol})` : ""}\n   🔪 ${i.operation}\n   👨‍⚕️ ${i.professor}\n`;
        });
        text += `\n--------------------------------\nPlan: ${list[0].resident || '?'}`;
        
        navigator.clipboard.writeText(text)
            .then(() => alert("Kopyalandı!"))
            .catch(() => alert("Kopyalama başarısız.\n\n" + text));
    };

    const togglePlacement = (id: string, room: number) => {
        setPlacements(prev => {
            const newState = { ...prev };
            // Eğer zaten o odadaysa çıkar, değilse o odaya koy
            if (newState[id] === room) {
                delete newState[id];
            } else {
                newState[id] = room;
            }
            saveToStorage(newState);
            return newState;
        });
    };

    const removeFromPlacement = (id: string) => {
        setPlacements(prev => {
            const newState = { ...prev };
            delete newState[id];
            saveToStorage(newState);
            return newState;
        });
    };

    const calendarGrid = generateCalendarGrid();
    const dailySurgeries = surgeries.filter(s => s.date === selectedDate);

    // Planlama Modu İçin Gruplama
    const room1 = dailySurgeries.filter(s => placements[s.id!] === 1);
    const room2 = dailySurgeries.filter(s => placements[s.id!] === 2);
    const room3 = dailySurgeries.filter(s => placements[s.id!] === 3);
    const unassigned = dailySurgeries.filter(s => !placements[s.id!]);

    return (
        <section className="pb-24">
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-blue-600">
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <h2 className="font-bold text-lg text-slate-700 capitalize">
                        {displayDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-blue-600">
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                <div className="flex justify-end mb-2">
                    <button onClick={handleToday} className="px-3 py-1 text-[11px] font-semibold rounded-full border border-blue-100 bg-blue-50 text-blue-700 active:scale-95 transition">
                        Bugün
                    </button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-slate-400 font-medium mb-2">
                    <div>Pt</div><div>Sa</div><div>Ça</div><div>Pe</div><div>Cu</div><div>Ct</div><div>Pa</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-sm">
                    {calendarGrid.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`}></div>;
                        
                        const dateStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedDate;
                        const daySurgeries = surgeries.filter(s => s.date === dateStr);
                        const count = daySurgeries.length;
                        
                        let dotColorClass = '';
                        if (count > 0) {
                            if (count < 8) dotColorClass = 'bg-green-500';
                            else if (count <= 12) dotColorClass = 'bg-orange-500';
                            else dotColorClass = 'bg-red-500';
                        }

                        return (
                            <div key={day} className="flex flex-col items-center">
                                <button 
                                    onClick={() => onDateSelect(dateStr)}
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-medium text-xs transition
                                        ${isToday ? 'border-[1.5px] border-blue-500 font-bold text-blue-600' : 'text-slate-700 hover:bg-slate-100'}
                                        ${isSelected ? '!bg-blue-600 !text-white !font-bold' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                                {count > 0 && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColorClass}`}></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-between items-end mb-4 px-1">
                <div>
                    <h3 className="text-slate-500 text-xs uppercase font-bold tracking-wider">Seçili Tarih</h3>
                    <p className="text-xl font-bold text-slate-800">{formatDateDisplay(selectedDate)}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={copyToWhatsapp} className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-md transition flex items-center gap-1 active:scale-95">
                        <i className="fa-brands fa-whatsapp text-lg"></i> Listeyi Kopyala
                    </button>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-2 rounded-lg font-bold flex items-center gap-1">
                        <i className="fa-solid fa-list-check"></i> {dailySurgeries.length}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {dailySurgeries.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        <i className="fa-regular fa-folder-open mb-2 text-4xl opacity-30"></i>
                        <p>Bu tarihte kayıtlı vaka yok.</p>
                    </div>
                ) : (
                    dailySurgeries.map(surgery => (
                        <SurgeryCard 
                            key={surgery.id} 
                            surgery={surgery} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                        />
                    ))
                )}
            </div>

            {/* Planlama Butonu */}
            {dailySurgeries.length > 0 && (
                <div className="mt-6">
                    <button 
                        onClick={() => setIsPlanning(true)}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                        <i className="fa-solid fa-table-columns"></i> Salon Planlaması Yap
                    </button>
                </div>
            )}

            {/* Planlama Modalı */}
            {isPlanning && (
                <div className="fixed inset-0 bg-slate-50 z-[60] flex flex-col overflow-hidden">
                    {/* Modal Header */}
                    <div className="px-4 py-3 bg-white shadow-sm border-b border-slate-200 flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="font-bold text-slate-800">Salon Planlama</h2>
                            <p className="text-[10px] text-slate-500">{formatDateDisplay(selectedDate)}</p>
                        </div>
                        <button onClick={() => setIsPlanning(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Salonlar Tablosu */}
                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="grid grid-cols-3 gap-2 h-full min-h-[300px]">
                            {/* Salon 1 */}
                            <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-fit min-h-[150px]">
                                <div className="bg-blue-50 text-blue-700 text-xs font-bold text-center py-2 rounded-t-xl border-b border-blue-100">
                                    Salon 1
                                </div>
                                <div className="p-1 space-y-1">
                                    {room1.map((s, idx) => (
                                        <div key={s.id} onClick={() => removeFromPlacement(s.id!)} className="bg-blue-50 p-2 rounded-lg border border-blue-100 cursor-pointer active:scale-95 transition">
                                            <div className="text-[9px] font-bold text-slate-400 mb-0.5">{idx + 1}. Vaka</div>
                                            <div className="text-[10px] font-bold text-slate-800 leading-tight">{s.patientName}</div>
                                            <div className="text-[9px] text-blue-600 truncate">{s.operation}</div>
                                        </div>
                                    ))}
                                    {room1.length === 0 && <div className="text-[10px] text-slate-300 text-center py-4">Boş</div>}
                                </div>
                            </div>

                            {/* Salon 2 */}
                            <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-fit min-h-[150px]">
                                <div className="bg-purple-50 text-purple-700 text-xs font-bold text-center py-2 rounded-t-xl border-b border-purple-100">
                                    Salon 2
                                </div>
                                <div className="p-1 space-y-1">
                                    {room2.map((s, idx) => (
                                        <div key={s.id} onClick={() => removeFromPlacement(s.id!)} className="bg-purple-50 p-2 rounded-lg border border-purple-100 cursor-pointer active:scale-95 transition">
                                            <div className="text-[9px] font-bold text-slate-400 mb-0.5">{idx + 1}. Vaka</div>
                                            <div className="text-[10px] font-bold text-slate-800 leading-tight">{s.patientName}</div>
                                            <div className="text-[9px] text-purple-600 truncate">{s.operation}</div>
                                        </div>
                                    ))}
                                    {room2.length === 0 && <div className="text-[10px] text-slate-300 text-center py-4">Boş</div>}
                                </div>
                            </div>

                            {/* Salon 3 */}
                            <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-fit min-h-[150px]">
                                <div className="bg-emerald-50 text-emerald-700 text-xs font-bold text-center py-2 rounded-t-xl border-b border-emerald-100">
                                    Salon 3
                                </div>
                                <div className="p-1 space-y-1">
                                    {room3.map((s, idx) => (
                                        <div key={s.id} onClick={() => removeFromPlacement(s.id!)} className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 cursor-pointer active:scale-95 transition">
                                            <div className="text-[9px] font-bold text-slate-400 mb-0.5">{idx + 1}. Vaka</div>
                                            <div className="text-[10px] font-bold text-slate-800 leading-tight">{s.patientName}</div>
                                            <div className="text-[9px] text-emerald-600 truncate">{s.operation}</div>
                                        </div>
                                    ))}
                                    {room3.length === 0 && <div className="text-[10px] text-slate-300 text-center py-4">Boş</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bekleyenler Listesi */}
                    <div className="bg-slate-100 p-3 shrink-0 max-h-[40vh] overflow-y-auto border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Bekleyen Hastalar ({unassigned.length})</h3>
                        <div className="space-y-2">
                            {unassigned.map(s => (
                                <div key={s.id} className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-800 truncate">{s.patientName}</div>
                                        <div className="text-[10px] text-slate-500 truncate">{s.operation}</div>
                                        <div className="text-[10px] text-slate-400">{s.professor}</div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => togglePlacement(s.id!, 1)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 font-bold text-xs hover:bg-blue-100 transition shadow-sm">S1</button>
                                        <button onClick={() => togglePlacement(s.id!, 2)} className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 font-bold text-xs hover:bg-purple-100 transition shadow-sm">S2</button>
                                        <button onClick={() => togglePlacement(s.id!, 3)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition shadow-sm">S3</button>
                                    </div>
                                </div>
                            ))}
                            {unassigned.length === 0 && dailySurgeries.length > 0 && (
                                <div className="text-center text-xs text-green-600 font-medium py-2">
                                    <i className="fa-solid fa-check-circle mr-1"></i> Tüm hastalar yerleştirildi!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CalendarView;