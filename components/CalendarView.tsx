import React, { useState, useMemo } from 'react';
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

    const todayStr = new Date().toISOString().split('T')[0];
    
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

    const calendarGrid = generateCalendarGrid();
    const dailySurgeries = surgeries.filter(s => s.date === selectedDate);

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
        </section>
    );
};

export default CalendarView;