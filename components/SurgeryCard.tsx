import React from 'react';
import { Surgery } from '../types';
import { formatDateShort } from '../services/utils';

interface SurgeryCardProps {
    surgery: Surgery;
    showDate?: boolean;
    onEdit: (surgery: Surgery) => void;
    onDelete: (id: string) => void;
}

const SurgeryCard: React.FC<SurgeryCardProps> = ({ surgery, showDate, onEdit, onDelete }) => {
    const handleDelete = () => {
        if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
            if (surgery.id) onDelete(surgery.id);
        }
    };

    return (
        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-3">
            {showDate && (
                <div className="absolute -top-3 left-3 bg-slate-800 text-[10px] text-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <i className="fa-solid fa-calendar-day text-[9px]"></i> {formatDateShort(surgery.date)}
                </div>
            )}
            
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-hospital-user text-slate-400 text-xs"></i>
                        <p className="font-semibold text-sm text-slate-800 truncate">
                            {surgery.patientName}
                            {surgery.age && <span className="text-slate-500 font-normal ml-1">({surgery.age})</span>}
                        </p>
                    </div>
                    <p className="text-blue-600 font-medium text-sm mt-0.5">{surgery.operation}</p>
                </div>
                <div className="flex flex-col gap-1">
                    <button onClick={() => onEdit(surgery)} className="text-xs text-orange-500 hover:text-orange-700 p-1 rounded-full bg-orange-50 transition">
                        <i className="fa-solid fa-pen"></i>
                    </button>
                    <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700 p-1 rounded-full bg-red-50 transition">
                        <i className="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 flex items-center justify-between gap-2 text-[11px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <i className="fa-solid fa-user-doctor text-slate-400"></i> {surgery.professor}
                    </div>
                    {surgery.resident && (
                        <div className="text-slate-900 font-normal">
                            {surgery.resident}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1">
                {surgery.protocol && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-[10px] font-medium text-slate-600 border border-slate-100">
                        <i className="fa-solid fa-hashtag mr-1"></i>{surgery.protocol}
                    </span>
                )}
                {surgery.phone && (
                    <a href={`tel:${surgery.phone}`} className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition">
                        <i className="fa-solid fa-phone"></i>{surgery.phone}
                    </a>
                )}
                {surgery.urine && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <i className="fa-solid fa-vial-circle-check"></i>{surgery.urine}
                    </span>
                )}
                {surgery.anesthesia && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <i className="fa-solid fa-syringe"></i>{surgery.anesthesia}
                    </span>
                )}
                {surgery.isSecondRoom && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-semibold text-blue-700 border border-blue-200">
                        <i className="fa-solid fa-door-open mr-1"></i>2. Salon
                    </span>
                )}
                {surgery.isRemaining && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-[10px] font-semibold text-red-700 border border-red-200">
                        <i className="fa-solid fa-circle-exclamation mr-1"></i>Kalan
                    </span>
                )}
                {surgery.isMDP && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-semibold text-purple-700 border border-purple-200">
                        MDP
                    </span>
                )}
                {surgery.isKG && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-[10px] font-semibold text-teal-700 border border-teal-200">
                        KG
                    </span>
                )}
            </div>

            {surgery.note && (
                <div className="mt-2 text-[11px] text-slate-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex gap-2">
                    <i className="fa-solid fa-note-sticky text-amber-400 mt-0.5"></i>
                    <span>{surgery.note}</span>
                </div>
            )}
        </div>
    );
};

export default SurgeryCard;