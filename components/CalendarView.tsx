import React, { useState, useMemo, useEffect } from 'react';
import { Surgery, ProfessorDay } from '../types';
import { formatDateDisplay } from '../services/utils';
import SurgeryCard from './SurgeryCard';
import { subscribeToProfessorDays, setProfessorDay } from '../services/firebase';

interface CalendarViewProps {
    surgeries: Surgery[];
    selectedDate: string;
    onDateSelect: (date: string) => void;
    onEdit: (surgery: Surgery) => void;
    onDelete: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ surgeries, selectedDate, onDateSelect, onEdit, onDelete }) => {
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate));
    const [isPlanning, setIsPlanning] = useState(false);
    const [professorDays, setProfessorDays] = useState<ProfessorDay[]>([]);
    const [isEditingProf, setIsEditingProf] = useState(false);
    const [profInputValue, setProfInputValue] = useState("");

    const [placements, setPlacements] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem('surgery_placements');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    
    useEffect(() => {
        localStorage.setItem('surgery_placements', JSON.stringify(placements));
    }, [placements]);

    useEffect(() => {
        const unsubscribe = subscribeToProfessorDays((data) => {
            setProfessorDays(data);
        });
        return () => unsubscribe();
    }, []);

    // Sync input value with selected date's professor
    useEffect(() => {
        const currentProf = professorDays.find(pd => pd.date === selectedDate);
        setProfInputValue(currentProf ? currentProf.professorName : "");
    }, [selectedDate, professorDays]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return (day + 6) % 7;
    };

    const generateCalendarGrid = () => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const startDay = getFirstDayOfMonth(year, month);
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
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

    const handleSaveProfessor = async () => {
        await setProfessorDay(selectedDate, profInputValue);
        setIsEditingProf(false);
    };

    const copyToWhatsapp = () => {
        const list = surgeries.filter(s => s.date === selectedDate);
        if (list.length === 0) {
            alert("Vaka yok.");
            return;
        }
        const currentProf = professorDays.find(pd => pd.date === selectedDate);
        const d = formatDateDisplay(selectedDate);
        let text = `📅 *${d} - EGE ÜROLOJİ*\n`;
        if (currentProf) text += `👨‍⚕️ *GÜNÜN HOCASI: ${currentProf.professorName.toUpperCase()}*\n`;
        text += `--------------------------------\n`;
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
            if (newState[id] === room) delete newState[id];
            else newState[id] = room;
            return newState;
        });
    };

    const removeFromPlacement = (id: string) => {
        setPlacements(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
    };

    const calendarGrid = generateCalendarGrid();
    const dailySurgeries = surgeries.filter(s => s.date === selectedDate);
    const room1 = dailySurgeries.filter(s => placements[s.id!] === 1);
    const room2 = dailySurgeries.filter(s => placements[s.id!] === 2);
    const room3 = dailySurgeries.filter(s => placements[s.id!] === 3);
    const unassigned = dailySurgeries.filter(s => !placements[s.id!]);

    return (
        <section className="pb-24 md:pb-8 flex flex-col md:flex-row md:gap-6 md:items-start">
            {/* SOL KOLON: Takvim */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-slate-100 md:w-96 md:shrink-0 md:sticky md:top-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-blue-600 transition">
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <h2 className="font-bold text-lg text-slate-700 capitalize">
                        {displayDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-blue-600 transition">
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
                        const dayProf = professorDays.find(pd => pd.date === dateStr);
                        const count = daySurgeries.length;
                        
                        let dotColorClass = '';
                        if (count > 0) {
                            if (count < 8) dotColorClass = 'bg-green-500';
                            else if (count <= 12) dotColorClass = 'bg-orange-500';
                            else dotColorClass = 'bg-red-500';
                        }

                        return (
                            <div key={day} className="flex flex-col items-center relative py-1">
                                <button 
                                    onClick={() => onDateSelect(dateStr)}
                                    className={`
                                        w-10 h-10 rounded-full flex flex-col items-center justify-center font-medium text-xs transition relative
                                        ${isToday ? 'border-[1.5px] border-blue-500 font-bold text-blue-600' : 'text-slate-700 hover:bg-slate-100'}
                                        ${isSelected ? '!bg-blue-600 !text-white !font-bold' : ''}
                                    `}
                                >
                                    <span>{day}</span>
                                    {dayProf && (
                                        <span className={`text-[7px] leading-[1] absolute bottom-1.5 font-bold uppercase ${isSelected ? 'text-white/80' : 'text-blue-500'}`}>
                                            {dayProf.professorName.split(' ').map(n => n[0]).join('.')}
                                        </span>
                                    )}
                                </button>
                                {count > 0 && <div className={`w-1.2 h-1.2 rounded-full mt-0.5 ${dotColorClass} w-[5px] h-[5px]`}></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SAĞ KOLON: Günlük Liste */}
            <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 px-1 gap-3">
                    <div>
                        <h3 className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-0.5">Seçili Tarih</h3>
                        <p className="text-xl font-bold text-slate-800">{formatDateDisplay(selectedDate)}</p>
                        
                        {/* HOCA GÜNÜ DÜZENLEME */}
                        <div className="mt-2 flex items-center gap-2">
                             <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                <i className="fa-solid fa-user-doctor text-blue-500 text-[10px]"></i>
                                {isEditingProf ? (
                                    <div className="flex items-center gap-1">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={profInputValue} 
                                            onChange={(e) => setProfInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveProfessor()}
                                            className="bg-transparent border-none outline-none text-[11px] font-bold text-blue-700 w-24 p-0"
                                            placeholder="Hoca ismi..."
                                        />
                                        <button onClick={handleSaveProfessor} className="text-green-600"><i className="fa-solid fa-check"></i></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingProf(true)}>
                                        <span className="text-[11px] font-bold text-blue-700">
                                            {profInputValue || "Hoca Ata..."}
                                        </span>
                                        <i className="fa-solid fa-pen text-[9px] text-blue-300"></i>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={copyToWhatsapp} className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-md transition flex items-center gap-1 active:scale-95">
                            <i className="fa-brands fa-whatsapp text-lg"></i> <span className="hidden sm:inline">Listeyi Kopyala</span>
                        </button>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-2 rounded-lg font-bold flex items-center gap-1">
                            <i className="fa-solid fa-list-check"></i> {dailySurgeries.length}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {dailySurgeries.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
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
            </div>

            {isPlanning && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-slate-50 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
                        <div className="px-4 py-3 bg-white shadow-sm border-b border-slate-200 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="font-bold text-slate-800">Salon Planlama</h2>
                                <p className="text-[10px] text-slate-500">{formatDateDisplay(selectedDate)}</p>
                            </div>
                            <button onClick={() => setIsPlanning(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="grid grid-cols-3 gap-3 md:gap-6 h-full min-h-[300px]">
                                <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-fit min-h-[150px] shadow-sm">
                                    <div className="bg-blue-50 text-blue-700 text-xs font-bold text-center py-2 rounded-t-xl border-b border-blue-100">Salon 1</div>
                                    <div className="p-2 space-y-2">
                                        {room1.map((s, idx) => (
                                            <div key={s.id} onClick={() => removeFromPlacement(s.id!)} className="bg-blue-50 p-3 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition">
                                                <div className="text-[9px] font-bold text-slate-400 mb-0.5">{idx + 1}. Vaka</div>
                                                <div className="text-xs font-bold text-slate-800 leading-tight">{s.patientName}</div>
                                                <div className="text-[10px] text-blue-600 truncate mt-1">{s.operation}</div>
                                            </div>
                                        ))}
                                        {room1.length === 0 && <div className="text-[10px] text-slate-300 text-center py-4">Boş</div>}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-fit min-h-[150px] shadow-sm">
                                    <div className="bg-purple-50 text-purple-700 text-xs font-bold text-center py-2 rounded-t-xl border-b border-purple-100">Salon 2</div>
                                    <div className="p-2 space-y-2">
                                        {room2.map((s, idx) => (
                                            <div key={s.id} onClick={() => removeFromPlacement(s.id!)} className="bg-purple-50 p-3 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition">
                                                <div className="text-[9px] font-bold text-slate-400 mb-0.5">{idx + 1}. Vaka</div>
                                                <div className="text-xs font-bold text-slate-800 leading-tight">{s.patientName}</div>
                                                <div className="text-[10px] text-purple-600 truncate mt-1">{s.operation}</div>
                                            </div>
                                        ))}
                                        {room2.length === 0 && <div className="text-[10px] text-slate-300 text-center py-4">Boş</div>}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-fit min-h-[150px] shadow-sm">
                                    <div className="bg-emerald-50 text-emerald-700 text-xs font-bold text-center py-2 rounded-t-xl border-b border-emerald-100">Salon 3</div>
                                    <div className="p-2 space-y-2">
                                        {room3.map((s, idx) => (
                                            <div key={s.id} onClick={() => removeFromPlacement(s.id!)} className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition">
                                                <div className="text-[9px] font-bold text-slate-400 mb-0.5">{idx + 1}. Vaka</div>
                                                <div className="text-xs font-bold text-slate-800 leading-tight">{s.patientName}</div>
                                                <div className="text-[10px] text-emerald-600 truncate mt-1">{s.operation}</div>
                                            </div>
                                        ))}
                                        {room3.length === 0 && <div className="text-[10px] text-slate-300 text-center py-4">Boş</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-100 p-4 shrink-0 max-h-[40vh] overflow-y-auto border-t border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Bekleyen Hastalar ({unassigned.length})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {unassigned.map(s => (
                                    <div key={s.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-2">
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
                                    <div className="col-span-full text-center text-sm text-green-600 font-medium py-2">
                                        <i className="fa-solid fa-check-circle mr-1"></i> Tüm hastalar yerleştirildi!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CalendarView;