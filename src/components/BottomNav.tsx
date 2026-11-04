import React from 'react';
import { LayoutDashboard, Coins, PiggyBank, Settings } from 'lucide-react';

export type TabType = 'overview' | 'this-month' | 'savings' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isLight?: boolean;
  hasOutdatedSavings?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  isLight = false,
  hasOutdatedSavings = false
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center">
      <div
        className={`w-full max-w-md pointer-events-auto h-16 px-3 pb-safe flex items-center justify-around border-t transition-none ${
          isLight
            ? 'bg-white border-[#e2e8f0] shadow-[0_-4px_24px_rgba(67,97,238,0.08)]'
            : 'bg-[#141220] border-[#2e2540] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Tab 1: Genel Bakış */}
        <button
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2 relative group flex-1 ${
            activeTab === 'overview'
              ? isLight ? 'text-[#4361ee] font-black' : 'text-cyan-400 font-bold'
              : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-[#8d8299] hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5" />
            {activeTab === 'overview' && (
              <span
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm ${
                  isLight ? 'bg-[#4361ee]' : 'bg-cyan-400'
                }`}
              />
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-1">Genel</span>
        </button>

        {/* Tab 2: Bu Ay */}
        <button
          onClick={() => onTabChange('this-month')}
          className={`flex flex-col items-center justify-center py-1 px-2 relative group flex-1 ${
            activeTab === 'this-month'
              ? isLight ? 'text-[#f72585] font-black' : 'text-cyan-400 font-bold'
              : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-[#8d8299] hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <div
              className={`p-1 rounded-md ${
                activeTab === 'this-month'
                  ? isLight
                    ? 'bg-[#f72585]/10 text-[#f72585]'
                    : 'bg-cyan-500/20 text-cyan-400'
                  : ''
              }`}
            >
              <Coins className="w-5 h-5" />
            </div>
            {activeTab === 'this-month' && (
              <span
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm ${
                  isLight ? 'bg-[#f72585]' : 'bg-cyan-400'
                }`}
              />
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">Bu Ay</span>
        </button>

        {/* Tab 3: Birikim (with Red Warning Badge when Outdated) */}
        <button
          onClick={() => onTabChange('savings')}
          className={`flex flex-col items-center justify-center py-1 px-2 relative group flex-1 ${
            activeTab === 'savings'
              ? isLight ? 'text-[#7209b7] font-black' : 'text-cyan-400 font-bold'
              : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-[#8d8299] hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <div
              className={`p-1 rounded-md ${
                activeTab === 'savings'
                  ? isLight
                    ? 'bg-[#7209b7]/10 text-[#7209b7]'
                    : 'bg-cyan-500/20 text-cyan-400'
                  : ''
              }`}
            >
              <PiggyBank className="w-5 h-5" />
            </div>

            {/* Outdated Stale Portfolio Warning Badge */}
            {hasOutdatedSavings && (
              <span
                className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black animate-pulse shadow-md shadow-rose-500/50"
                title="Varlık portföyünüz 1 aydır güncellenmedi!"
              >
                !
              </span>
            )}

            {activeTab === 'savings' && (
              <span
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm ${
                  isLight ? 'bg-[#7209b7]' : 'bg-cyan-400'
                }`}
              />
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">Birikim</span>
        </button>

        {/* Tab 4: Ayarlar */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2 relative group flex-1 ${
            activeTab === 'settings'
              ? isLight ? 'text-[#4361ee] font-black' : 'text-cyan-400 font-bold'
              : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-[#8d8299] hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Settings className="w-5 h-5" />
            {activeTab === 'settings' && (
              <span
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm ${
                  isLight ? 'bg-[#4361ee]' : 'bg-cyan-400'
                }`}
              />
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-1">Ayarlar</span>
        </button>
      </div>
    </div>
  );
};
