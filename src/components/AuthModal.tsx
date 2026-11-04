import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { X, User, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string | null;
  onLogin: (username: string) => void;
  onLogout: () => void;
  isLight?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  isLight = false
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setError('Kullanıcı adı ve şifre zorunludur.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('budgetApp_users') || '{}');

    if (isLoginMode) {
      if (!users[u]) {
        setError('Kullanıcı bulunamadı. Lütfen kayıt olun.');
        return;
      }
      if (users[u].password !== btoa(p)) {
        setError('Hatalı şifre girdiniz.');
        return;
      }
      onLogin(u);
      onClose();
    } else {
      if (users[u]) {
        setError('Bu kullanıcı adı zaten alınmış.');
        return;
      }
      users[u] = { password: btoa(p) };
      localStorage.setItem('budgetApp_users', JSON.stringify(users));
      onLogin(u);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80"
      />

      {/* Modal Box - Sharp & Compact */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className={`relative w-full max-w-sm rounded-lg border-2 p-4 shadow-2xl overflow-hidden z-10 ${
          isLight
            ? 'bg-white border-[#4361ee]/30 text-slate-900 shadow-slate-400/25'
            : 'bg-[#181427] border-[#3e3455] text-slate-100 shadow-black'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${
            isLight
              ? 'border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              : 'border-[#3e3455] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {currentUser ? (
          <div className="text-center space-y-3 py-1">
            <div className="w-12 h-12 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-500 mx-auto flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className={`text-base font-black font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Aktif Hesap: {currentUser}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Verileriniz bu kullanıcı altında güvende.</p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full h-9 rounded-md bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 font-mono font-bold text-xs hover:bg-rose-500/20 transition-colors"
              >
                Çıkış Yap
              </button>
              <button
                onClick={onClose}
                className={`w-full h-9 rounded-md border-2 font-mono font-bold text-xs transition-colors ${
                  isLight
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'border-[#3e3455] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                Kapat
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <BrandLogo size={42} className="mx-auto mb-1.5" />
              <h3 className={`text-base font-black font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {isLoginMode ? 'Giriş Yap' : 'Yeni Hesap Oluştur'}
              </h3>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Bütçe ve harcama verilerinizi şifreleyin
              </p>
            </div>

            {error && (
              <div className="p-2 rounded-md bg-rose-500/10 border-2 border-rose-500/25 text-rose-500 text-xs font-mono font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <label className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="kullanici_adi"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className={`w-full h-9 pl-9 pr-3 rounded-md border-2 text-xs font-bold focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                        : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full h-9 pl-9 pr-3 rounded-md border-2 text-xs font-bold focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                        : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full h-9 rounded-md font-mono font-bold text-xs shadow-md active:scale-[0.98] transition-all ${
                  isLight
                    ? 'bg-gradient-to-r from-[#f72585] via-[#7209b7] to-[#4361ee] text-white shadow-[#4361ee]/20'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                {isLoginMode ? 'Giriş Yap' : 'Hesap Oluştur ve Başla'}
              </button>
            </form>

            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError(null);
                }}
                className={`text-xs font-mono font-bold hover:underline ${
                  isLight ? 'text-[#4361ee]' : 'text-cyan-400'
                }`}
              >
                {isLoginMode
                  ? 'Hesabınız yok mu? Yeni Hesap Açın'
                  : 'Zaten hesabınız var mı? Giriş Yapın'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
