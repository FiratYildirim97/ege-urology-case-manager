import React, { useState, useEffect } from 'react';
import { Surgery } from '../types';
import { addSurgery, updateSurgery } from '../services/firebase';

interface AddSurgeryFormProps {
    initialDate: string;
    editData: Surgery | null;
    onComplete: (date: string) => void;
}

const AddSurgeryForm: React.FC<AddSurgeryFormProps> = ({ initialDate, editData, onComplete }) => {
    const defaultState: Surgery = {
        date: initialDate,
        patientName: '',
        protocol: '',
        age: '',
        operation: '',
        professor: '',
        resident: '',
        phone: '',
        urine: 'Steril',
        anesthesia: '',
        note: '',
        isSecondRoom: false,
        isRemaining: false,
        isMDP: false,
        isKG: false
    };

    const [form, setForm] = useState<Surgery>(defaultState);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editData) {
            setForm(editData);
        } else {
            setForm({ ...defaultState, date: initialDate });
        }
    }, [editData, initialDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setForm(prev => ({ ...prev, [id]: value }));
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target;
        setForm(prev => ({ ...prev, [id]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editData && editData.id) {
                await updateSurgery(editData.id, form);
            } else {
                await addSurgery(form);
            }
            onComplete(form.date);
            setForm({ ...defaultState, date: form.date }); // Reset but keep date
        } catch (error) {
            alert("Hata oluştu: " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="pb-24">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 space-y-3">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarih</label>
                            <input type="date" id="date" required value={form.date} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Protokol</label>
                            <input type="text" id="protocol" value={form.protocol} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" placeholder="Opsiyonel" />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-[3]">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hasta Adı Soyadı</label>
                            <input type="text" id="patientName" required value={form.patientName} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" placeholder="Ad Soyad" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Yaş</label>
                            <input type="number" id="age" value={form.age} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" placeholder="Yaş" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İşlem</label>
                        <textarea id="operation" required rows={2} value={form.operation} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" placeholder="Örn: TUR-P, URS, RIRS, PCNL"></textarea>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hoca</label>
                            <input type="text" id="professor" value={form.professor} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" placeholder="Prof/Doç/Dr" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asistan</label>
                            <input type="text" id="resident" value={form.resident} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" placeholder="Planlayan" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label>
                        <input type="tel" id="phone" value={form.phone} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" placeholder="05xx xxx xx xx" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center space-x-2 cursor-pointer bg-blue-50 px-2 py-2 rounded-lg border border-blue-100 justify-center">
                            <input type="checkbox" id="isSecondRoom" checked={form.isSecondRoom} onChange={handleCheckbox} className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500" />
                            <span className="text-xs font-bold text-blue-700">2. Salon</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer bg-red-50 px-2 py-2 rounded-lg border border-red-100 justify-center">
                            <input type="checkbox" id="isRemaining" checked={form.isRemaining} onChange={handleCheckbox} className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500" />
                            <span className="text-xs font-bold text-red-700">Kalan</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 px-2 py-2 rounded-lg border border-purple-100 justify-center">
                            <input type="checkbox" id="isMDP" checked={form.isMDP} onChange={handleCheckbox} className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500" />
                            <span className="text-xs font-bold text-purple-700">MDP</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer bg-teal-50 px-2 py-2 rounded-lg border border-teal-100 justify-center">
                            <input type="checkbox" id="isKG" checked={form.isKG} onChange={handleCheckbox} className="w-4 h-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500" />
                            <span className="text-xs font-bold text-teal-700">KG</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İdrar Kültürü</label>
                        <select id="urine" value={form.urine} onChange={handleChange} className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-700">
                            <option value="Steril">Steril</option>
                            <option value="Üremeli">Üremeli</option>
                            <option value="Kontamine">Kontamine</option>
                            <option value="Bilinmiyor">Bilinmiyor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anestezi Hazırlığı</label>
                        <input type="text" id="anesthesia" value={form.anesthesia} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:outline-none focus:border-blue-500 transition bg-white text-slate-700" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notlar</label>
                        <textarea id="note" rows={2} value={form.note} onChange={handleChange} className="w-full text-sm rounded-xl border border-slate-200 p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700" placeholder="Özel not, cihaz durumu, ek istek vb."></textarea>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold shadow-md active:scale-[0.98] transition disabled:opacity-70">
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </form>
        </section>
    );
};

export default AddSurgeryForm;