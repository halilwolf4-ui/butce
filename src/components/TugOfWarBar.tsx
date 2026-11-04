import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatMoney } from '../types';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

interface TugOfWarBarProps {
  income: number;
  expense: number;
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  isLight?: boolean;
}

export const TugOfWarBar: React.FC<TugOfWarBarProps> = ({
  income,
  expense,
  incomeBreakdown,
  expenseBreakdown,
  isLight = false
}) => {
  const [activeTooltip, setActiveTooltip] = useState<'income' | 'expense' | null>(null);

  const total = income + expense;
  let incomePct = total > 0 ? (income / total) * 100 : 50;
  let expensePct = total > 0 ? (expense / total) * 100 : 50;

  // Clamp visually so both remain clickable
  if (total > 0) {
    if (incomePct > 92) {
      incomePct = 92;
      expensePct = 8;
    } else if (expensePct > 92) {
      expensePct = 92;
      incomePct = 8;
    }
  }

  const activeData = activeTooltip === 'income' ? incomeBreakdown : expenseBreakdown;
  const items = Object.entries(activeData)
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1]);
  const activeTotal = items.reduce((sum, [_, v]) => sum + v, 0);

  const netDiff = income - expense;
  const isSurplus = netDiff >= 0;

  return (
    <div className="relative mb-5">
      {/* Title & Quick Stats */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-black uppercase tracking-wider font-mono ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            Yıllık Denge
          </span>
          <span className="text-[10px] text-slate-500 font-mono">(Dokun & Gör)</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono font-bold tabular-nums">
          <span
            className={
              isSurplus
                ? isLight ? 'text-[#4361ee]' : 'text-emerald-400'
                : isLight ? 'text-[#f72585]' : 'text-rose-400'
            }
          >
            {isSurplus ? '+' : ''}{formatMoney(netDiff)}
          </span>
          <span className="text-[10px] text-slate-400">net</span>
        </div>
      </div>

      {/* Main Bar Track - Sharp & Stylized */}
      <div
        className={`relative h-4 rounded-md overflow-hidden cursor-pointer select-none p-0.5 border shadow-inner transition-colors ${
          isLight
            ? 'bg-slate-100 border-[#4361ee]/20'
            : 'bg-[#120f1e] border-[#372d4c]'
        }`}
      >
        <div className="flex h-full w-full rounded-sm overflow-hidden relative">
          {/* Income Side */}
          <div
            style={{ width: `${incomePct}%` }}
            onClick={() => setActiveTooltip(activeTooltip === 'income' ? null : 'income')}
            className={`h-full relative flex items-center justify-start pl-2 transition-all ${
              isLight
                ? 'bg-gradient-to-r from-[#3a0ca3] via-[#4361ee] to-[#4cc9f0]'
                : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400'
            }`}
          >
            {incomePct > 18 && (
              <span className="text-[9px] font-black text-white uppercase tracking-wider font-mono truncate">
                Gelir %{Math.round((income / (total || 1)) * 100)}
              </span>
            )}
          </div>

          {/* Center Dividing Notch */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white/70 z-10 pointer-events-none" />

          {/* Expense Side */}
          <div
            style={{ width: `${expensePct}%` }}
            onClick={() => setActiveTooltip(activeTooltip === 'expense' ? null : 'expense')}
            className={`h-full relative flex items-center justify-end pr-2 transition-all ${
              isLight
                ? 'bg-gradient-to-r from-[#7209b7] via-[#f72585] to-[#f72585]'
                : 'bg-gradient-to-r from-rose-500 via-pink-600 to-[#7209b7]'
            }`}
          >
            {expensePct > 18 && (
              <span className="text-[9px] font-black text-white uppercase tracking-wider font-mono truncate">
                Gider %{Math.round((expense / (total || 1)) * 100)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sub-label indicators */}
      <div className="flex justify-between items-center mt-1.5 px-0.5 text-[11px] font-mono text-slate-400">
        <button
          onClick={() => setActiveTooltip(activeTooltip === 'income' ? null : 'income')}
          className={`flex items-center gap-1.5 transition-colors ${
            isLight ? 'hover:text-[#4361ee]' : 'hover:text-emerald-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-sm inline-block ${
              isLight ? 'bg-[#4361ee]' : 'bg-emerald-400'
            }`}
          />
          <span className="font-bold">Gelir ({formatMoney(income)})</span>
        </button>
        <button
          onClick={() => setActiveTooltip(activeTooltip === 'expense' ? null : 'expense')}
          className={`flex items-center gap-1.5 transition-colors ${
            isLight ? 'hover:text-[#f72585]' : 'hover:text-rose-400'
          }`}
        >
          <span className="font-bold">Gider ({formatMoney(expense)})</span>
          <span
            className={`w-2 h-2 rounded-sm inline-block ${
              isLight ? 'bg-[#f72585]' : 'bg-rose-400'
            }`}
          />
        </button>
      </div>

      {/* Tooltip / Breakdown Card - Sharp corners */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`mt-2.5 p-3 rounded-lg border-2 shadow-2xl z-20 ${
              isLight
                ? 'bg-white border-[#4361ee]/40 text-slate-900 shadow-slate-300/40'
                : 'bg-[#181427] border-[#3e3455] text-slate-100 shadow-black'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                {activeTooltip === 'income' ? (
                  <div
                    className={`p-1 rounded-md ${
                      isLight ? 'bg-[#4361ee]/15 text-[#4361ee]' : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div
                    className={`p-1 rounded-md ${
                      isLight ? 'bg-[#f72585]/15 text-[#f72585]' : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-black font-mono leading-none">
                    {activeTooltip === 'income' ? 'Yıllık Gelir Dağılımı' : 'Yıllık Gider Dağılımı'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Toplam: {formatMoney(activeTotal)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTooltip(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-center py-3 text-xs text-slate-400 font-mono">Kayıtlı veri bulunamadı</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map(([name, amount], idx) => {
                  const pct = activeTotal > 0 ? Math.round((amount / activeTotal) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-bold truncate max-w-[170px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {name}
                        </span>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="text-slate-400 text-[11px] font-mono">%{pct}</span>
                          <span
                            className={`font-black font-mono text-[11px] ${
                              activeTooltip === 'income'
                                ? isLight ? 'text-[#4361ee]' : 'text-emerald-400'
                                : isLight ? 'text-[#f72585]' : 'text-rose-400'
                            }`}
                          >
                            {formatMoney(amount)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 rounded-sm bg-black/20 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-sm ${
                            activeTooltip === 'income'
                              ? isLight ? 'bg-[#4361ee]' : 'bg-emerald-400'
                              : isLight ? 'bg-[#f72585]' : 'bg-rose-400'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
