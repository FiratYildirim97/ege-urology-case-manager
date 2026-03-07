import React, { useState } from 'react';

interface LoginProps {
    onLogin: (password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Şifre kontrolü (Basit bir şifre: egeuro2)
        if (password === 'egeuro2') {
            onLogin(password);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl mb-4 shadow-lg shadow-blue-200">
                        <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">EGE ÜROLOJİ</h1>
                    <p className="text-sm text-slate-500 mt-1">Asistan Yönetim Paneli Girişi</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            Giriş Şifresi
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border transition-all outline-none text-lg ${
                                error 
                                ? 'border-red-500 bg-red-50 text-red-900 animate-shake' 
                                : 'border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
                            }`}
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-xs mt-2 ml-1 font-medium animate-fade-in">
                                <i className="fa-solid fa-circle-exclamation mr-1"></i>
                                Hatalı şifre, lütfen tekrar deneyin.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Giriş Yap
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">
                        Bu panel sadece yetkili asistanlar içindir.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
