import React, { useState, useEffect } from 'react';
import { Surgery, TabType } from './types';
import { subscribeToSurgeries, deleteSurgery } from './services/firebase';
import CalendarView from './components/CalendarView';
import AddSurgeryForm from './components/AddSurgeryForm';
import SurgeryList from './components/SurgeryList';

const App: React.FC = () => {
    const [surgeries, setSurgeries] = useState<Surgery[]>([]);
    const [currentTab, setCurrentTab] = useState<TabType>('calendar');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToSurgeries((data) => {
            setSurgeries(data);
        });
        return () => unsubscribe();
    }, []);

    const handleEdit = (surgery: Surgery) => {
        setEditingSurgery(surgery);
        setCurrentTab('add');
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteSurgery(id);
        } catch (e) {
            alert("Silme hatası");
        }
    };

    const handleFormComplete = (date: string) => {
        setSelectedDate(date);
        setEditingSurgery(null);
        setCurrentTab('calendar');
    };

    const handleNav = (tab: TabType) => {
        if (tab === 'add') {
            setEditingSurgery(null); // Reset form for new entry
        }
        setCurrentTab(tab);
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50">
            {/* Header */}
            <header className="px-4 pt-3 pb-2 flex justify-between items-center sticky top-0 z-40 bg-slate-50/80 backdrop-blur">
                <div>
                    <h1 className="text-lg font-extrabold tracking-tight text-slate-800">EGE ÜROLOJİ</h1>
                    <p className="text-[11px] text-slate-500 -mt-0.5">Ameliyat Listesi Asistanı</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                        <i className="fa-solid fa-user-md"></i>
                   </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4">
                {currentTab === 'calendar' && (
                    <CalendarView 
                        surgeries={surgeries} 
                        selectedDate={selectedDate} 
                        onDateSelect={setSelectedDate}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
                {currentTab === 'add' && (
                    <AddSurgeryForm 
                        initialDate={selectedDate} 
                        editData={editingSurgery} 
                        onComplete={handleFormComplete} 
                    />
                )}
                {currentTab === 'list' && (
                    <SurgeryList 
                        surgeries={surgeries} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                    />
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 p-2 pb-[env(safe-area-inset-bottom)] flex justify-between gap-1 z-50">
                <button 
                    onClick={() => handleNav('calendar')} 
                    className={`flex-1 flex flex-col items-center py-1 rounded-full text-[10px] font-medium transition ${currentTab === 'calendar' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
                >
                    <i className="fa-solid fa-calendar-days text-xl mb-1"></i>
                    Takvim
                </button>
                <button 
                    onClick={() => handleNav('add')} 
                    className={`flex-1 flex flex-col items-center py-1 rounded-full text-[10px] font-medium transition ${currentTab === 'add' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
                >
                    <i className="fa-solid fa-plus-circle text-xl mb-1"></i>
                    Yeni Vaka
                </button>
                <button 
                    onClick={() => handleNav('list')} 
                    className={`flex-1 flex flex-col items-center py-1 rounded-full text-[10px] font-medium transition ${currentTab === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
                >
                    <i className="fa-solid fa-list-ul text-xl mb-1"></i>
                    Tüm Liste
                </button>
            </nav>
        </div>
    );
};

export default App;