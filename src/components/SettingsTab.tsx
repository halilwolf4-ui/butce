import React, { useRef } from 'react';
import { AppData } from '../types';
import { BrandLogo } from './BrandLogo';
import {
  Repeat,
  Calendar,
  Download,
  Upload,
  LogOut,
  Trash2,
  ChevronRight
} from 'lucide-react';

interface SettingsTabProps {
  data: AppData;
  onUpdateSettings: (newCycleDay: number) => void;
  onOpenRecurringModal: () => void;
  onDownloadBackup: () => void;
  onUploadBackup: (file: File) => void;
  onLogout: () => void;
  onClearAllData: () => void;
  currentUser: string | null;
  onOpenAuth: () => void;
  isLight: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  data,
  onUpdateSettings,
  onOpenRecurringModal,
  onDownloadBackup,
  onUploadBackup,
  onLogout,
  onClearAllData,
  currentUser,
  onOpenAuth,
  isLight
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBackup(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cycleDay = data.settings.cycleStartDay || 1;

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Header - FIXED: Visible in Light Mode */}
      <div>
        <h1
          className={`text-2xl font-black tracking-tight ${
            isLight ? 'text-slate-900' : 'text-slate-100'
          }`}
        >
          Ayarlar
        </h1>
        <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Hesap, veri yedekleme ve bütçe döngüsü tercihleri
        </p>
      </div>

      {/* Account Info Card - Sharp */}
      <div
        onClick={onOpenAuth}
        className={`p-3.5 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-all ${
          isLight
            ? 'bg-white border-[#4361ee]/25 hover:border-[#4361ee] shadow-sm'
            : 'bg-[#181427] border-[#372d4c] hover:border-cyan-400/50 shadow-md'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center font-mono font-black text-lg shadow-sm ${
              isLight
                ? 'bg-gradient-to-r from-[#f72585] to-[#4361ee] text-white'
                : 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950'
            }`}
          >
            {currentUser ? currentUser.charAt(0).toUpperCase() : 'G'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3
                className={`text-sm font-black ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {currentUser ? currentUser : 'Misafir Kullanıcı'}
              </h3>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm border ${
                  isLight
                    ? 'bg-[#4361ee]/10 text-[#4361ee] border-[#4361ee]/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }`}
              >
                {currentUser ? 'Şifreli Hesap' : 'Yerel Veri'}
              </span>
            </div>
            <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {currentUser ? 'Hesap değiştirmek veya çıkış yapmak için dokunun' : 'Şifre belirlemek için hesap açın'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>

      {/* Preferences Group */}
      <div className="space-y-2">
        <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 px-1">
          Bütçe & Kalıcı Kalemler
        </span>

        {/* Kalıcı İşlemler Trigger */}
        <div
          onClick={onOpenRecurringModal}
          className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
            isLight
              ? 'bg-white border-[#4361ee]/20 hover:border-[#4361ee] shadow-sm'
              : 'bg-[#181427] border-[#372d4c] hover:border-cyan-400/40 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center ${
                isLight ? 'bg-[#4361ee]/10 text-[#4361ee]' : 'bg-cyan-500/10 text-cyan-400'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h4
                className={`text-xs font-black ${
                  isLight ? 'text-slate-900' : 'text-slate-200'
                }`}
              >
                Kalıcı İşlemler (Maaş, Kira vb.)
              </h4>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {data.recurring.length} adet kayıtlı kalıcı işlem
              </p>
            </div>
          </div>
          <button
            className={`px-3 py-1 rounded-md font-mono font-bold text-xs shadow-sm transition-colors ${
              isLight ? 'bg-[#4361ee] text-white' : 'bg-cyan-500 text-slate-950'
            }`}
          >
            Yönet
          </button>
        </div>

        {/* Ay Başı / Hesap Kesim Günü */}
        <div
          className={`p-3.5 rounded-lg border-2 ${
            isLight
              ? 'bg-white border-[#4361ee]/20 shadow-sm'
              : 'bg-[#181427] border-[#372d4c]'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  isLight ? 'bg-amber-500/15 text-amber-600' : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4
                  className={`text-xs font-black ${
                    isLight ? 'text-slate-900' : 'text-slate-200'
                  }`}
                >
                  Maaş Döngüsü / Kesim Günü
                </h4>
                <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Her ayın kaçında yeni bütçe başlasın?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="31"
                value={cycleDay}
                onChange={e => {
                  let val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) val = 1;
                  if (val > 31) val = 31;
                  onUpdateSettings(val);
                }}
                className={`w-14 h-9 rounded-md text-center font-black font-mono focus:outline-none border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-[#4361ee]'
                    : 'bg-[#120f1e] border-[#372d4c] text-cyan-400'
                }`}
              />
              <span className="text-xs font-mono font-bold text-slate-400">. gün</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono leading-normal pl-12">
            Örn: 15 seçerseniz bütçeniz &apos;15 Ekim - 14 Kasım&apos; döngüsüne göre hesaplanır.
          </p>
        </div>
      </div>

      {/* Backup & Data Management */}
      <div className="space-y-2">
        <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 px-1">
          Veri & Yedekleme
        </span>

        {/* Download Backup */}
        <div
          onClick={onDownloadBackup}
          className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
            isLight
              ? 'bg-white border-[#4361ee]/20 hover:border-[#4361ee] shadow-sm'
              : 'bg-[#181427] border-[#372d4c] hover:border-cyan-400/40 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center ${
                isLight ? 'bg-emerald-500/15 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4
                className={`text-xs font-black ${
                  isLight ? 'text-slate-900' : 'text-slate-200'
                }`}
              >
                Yedeği İndir (.json)
              </h4>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tüm aylar, borçlar ve kalıcı işlemleri dışa aktar
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Upload Backup */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
            isLight
              ? 'bg-white border-[#4361ee]/20 hover:border-[#4361ee] shadow-sm'
              : 'bg-[#181427] border-[#372d4c] hover:border-cyan-400/40 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center ${
                isLight ? 'bg-[#4361ee]/15 text-[#4361ee]' : 'bg-sky-500/10 text-sky-400'
              }`}
            >
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h4
                className={`text-xs font-black ${
                  isLight ? 'text-slate-900' : 'text-slate-200'
                }`}
              >
                Yedeği Yükle (.json)
              </h4>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Daha önce kaydedilmiş JSON yedeğini geri yükle
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold font-mono uppercase tracking-wider text-rose-500 px-1">
          Hesap & Veri İşlemleri
        </span>

        {currentUser && (
          <div
            onClick={onLogout}
            className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
              isLight
                ? 'bg-white border-rose-200 hover:border-rose-400 shadow-sm'
                : 'bg-[#181427] border-rose-500/30 hover:border-rose-400/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <h4
                  className={`text-xs font-black ${
                    isLight ? 'text-slate-900' : 'text-slate-200'
                  }`}
                >
                  Hesaptan Çıkış Yap
                </h4>
                <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Bu cihazdaki oturumu sonlandır
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        )}

        <div
          onClick={onClearAllData}
          className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
            isLight
              ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-100/70'
              : 'bg-[#24121d] border-rose-500/30 hover:bg-[#301627]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-rose-500">
                Hesabımı ve Tüm Verilerimi Sil
              </h4>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Kayıtlı bütçe ve kullanıcı verilerini tamamen temizler
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-500" />
        </div>
      </div>

      {/* App Branding & Version Footer */}
      <div className="pt-3 text-center space-y-1">
        <BrandLogo size={28} className="mx-auto opacity-70" />
        <p className={`text-xs font-black font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          Büyüteç Bütçe v2.0
        </p>
        <p className="text-[10px] text-slate-400 font-mono">
          Kişisel Bütçe ve Harcama Yönetimi Asistanınız · 2026
        </p>
      </div>
    </div>
  );
};
