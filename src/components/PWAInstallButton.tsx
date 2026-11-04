import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Share, X } from 'lucide-react';

interface PWAInstallButtonProps {
  isLight?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ isLight = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside installed standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Desktop PWA flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
        title="Uygulamayı Telefona İndir"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Uygulamayı İndir</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
            isLight
              ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          }`}
          title="iPhone'a İndir"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Telefona Ekle</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
            <div
              className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#101422] border-white/10 text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-cyan-400">iPhone / iPad'e Yükle</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs space-y-2.5 text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <span>Safari'nin altındaki <strong className="text-white">Paylaş (<Share className="w-3 h-3 inline text-cyan-400" />)</strong> butonuna dokunun.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <span>Aşağı kaydırıp <strong className="text-white">"Ana Ekrana Ekle"</strong> seçeneğini seçin.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Anladım
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback info button for mobile browsers that haven't fired beforeinstallprompt yet
  return (
    <button
      onClick={() => {
        alert("Chrome menüsünden (üç nokta ⋮) 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' diyerek telefonunuza indirebilirsiniz.");
      }}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold ${
        isLight
          ? 'bg-slate-100 border-slate-200 text-slate-700'
          : 'bg-white/[0.05] border-white/[0.08] text-slate-300'
      }`}
      title="Uygulama İndirme İpucu"
    >
      <Download className="w-3 h-3 text-cyan-400" />
      <span>Uygulama</span>
    </button>
  );
};
