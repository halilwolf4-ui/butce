import React, { useState, useRef, useMemo } from 'react';
import { AppData, TR_MONTHS, TR_MONTHS_SHORT, formatMoney, getCycleString } from '../types';
import { BrandLogo } from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';
import { TugOfWarBar } from './TugOfWarBar';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ArrowUpRight,
  User,
  Plus,
  PiggyBank,
  Wallet,
  Activity
} from 'lucide-react';

interface OverviewTabProps {
  data: AppData;
  selectedYear: number;
  onYearChange: (delta: number) => void;
  onSelectMonth: (year: number, monthIdx: number) => void;
  onOpenDebtManager: () => void;
  onOpenAuth: () => void;
  onOpenSavings: () => void;
  currentUser: string | null;
  isLight: boolean;
  onToggleTheme: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  selectedYear,
  onYearChange,
  onSelectMonth,
  onOpenDebtManager,
  onOpenAuth,
  onOpenSavings,
  currentUser,
  isLight,
  onToggleTheme
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Total savings/investments portfolio
  const totalSavings = useMemo(() => {
    return (data.savings || []).reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [data.savings]);

  // Calculate accumulated cash buffer, annual income, expense, and category breakdowns
  const {
    cashBuffer,
    annualIncome,
    annualExpense,
    globalIncomeBreakdown,
    globalExpenseBreakdown,
    topCategories
  } = useMemo(() => {
    let acc = 0;
    let aIncome = 0;
    let aExpense = 0;
    const incMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};
    const catItemTotals: Record<string, number> = {};

    data.months.forEach(m => {
      acc += m.remaining || 0;

      if (m.id.startsWith(`${selectedYear}-`)) {
        aIncome += m.income || 0;
        aExpense += m.expense || 0;

        m.incomes?.forEach(inc => {
          if (inc.amount > 0) {
            incMap[inc.name] = (incMap[inc.name] || 0) + inc.amount;
          }
        });

        m.categories?.forEach(cat => {
          cat.items.forEach(item => {
            if (item.amount > 0) {
              expMap[cat.name] = (expMap[cat.name] || 0) + item.amount;
              if (!cat.isDebtCategory && !cat.isRecurringCategory) {
                catItemTotals[item.name] = (catItemTotals[item.name] || 0) + item.amount;
              }
            }
          });
        });
      }
    });

    const sortedCats = Object.entries(catItemTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      cashBuffer: acc,
      annualIncome: aIncome,
      annualExpense: aExpense,
      globalIncomeBreakdown: incMap,
      globalExpenseBreakdown: expMap,
      topCategories: sortedCats
    };
  }, [data.months, selectedYear]);

  // Combined total net worth (Cash Buffer + Investment Portfolio)
  const totalNetWorth = cashBuffer + totalSavings;

  const totalRemainingDebt = useMemo(() => {
    return data.debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [data.debts]);

  const cycleDay = data.settings.cycleStartDay || 1;

  // Handle scroll snap detection
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    const newIdx = Math.round(scrollLeft / (clientWidth || 1));
    if (newIdx !== carouselIndex && newIdx >= 0 && newIdx <= 1) {
      setCarouselIndex(newIdx);
    }
  };

  const scrollToSlide = (idx: number) => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.clientWidth;
    carouselRef.current.scrollTo({
      left: idx * width,
      behavior: 'smooth'
    });
    setCarouselIndex(idx);
  };

  return (
    <div className="space-y-3.5 pb-16">
      {/* Top Header - Sharp & Stylized */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={36} withGlow={false} />
          <div>
            <h1
              className={`text-xl font-black tracking-tight leading-none flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              Büyüteç{' '}
              <span
                className={`font-black ${
                  isLight
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#f72585] via-[#7209b7] to-[#4361ee]'
                    : 'text-cyan-400'
                }`}
              >
                Bütçe
              </span>
            </h1>
            <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {currentUser ? `@${currentUser}` : 'Kişisel Bütçe Asistanı'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton isLight={isLight} />

          {/* User Profile Avatar Trigger */}
          <button
            onClick={onOpenAuth}
            className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
              isLight
                ? 'bg-white border-[#4361ee]/30 text-[#4361ee] hover:bg-[#4361ee]/10'
                : 'bg-[#1c182b] border-[#3e3455] text-slate-300 hover:text-white'
            }`}
            title="Kullanıcı & Güvenlik"
          >
            <User className={`w-4 h-4 ${isLight ? 'text-[#4361ee]' : 'text-cyan-400'}`} />
          </button>

          {/* Theme Switcher */}
          <ThemeToggle isLight={isLight} onToggle={onToggleTheme} />
        </div>
      </div>

      {/* SWIPEABLE CAROUSEL - SHARP & STYLIZED */}
      <div className="relative">
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-2.5 pb-0.5 touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* SLIDE 1: TOPLAM BİRİKMİŞ TAMPON (USER REQUEST: SADECE NAKİT/KASA, BİRİKİMİ KATMA) */}
          <div
            className={`w-full shrink-0 snap-center p-4.5 rounded-lg border-2 relative overflow-hidden transition-all ${
              isLight
                ? 'bg-gradient-to-br from-white via-[#f8f9fe] to-[#eef2ff] border-[#4361ee] shadow-[0_4px_20px_rgba(67,97,238,0.12)]'
                : 'bg-gradient-to-br from-[#1a1428] via-[#141222] to-[#0e101a] border-[#3e3455] shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
            }`}
          >
            {/* Top Glowing Accent Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                isLight
                  ? 'bg-gradient-to-r from-[#f72585] via-[#4361ee] to-[#4cc9f0]'
                  : 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-[#7209b7]'
              }`}
            />

            <div className="flex items-center justify-between mb-1.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                <Wallet className={`w-4 h-4 ${isLight ? 'text-[#4361ee]' : 'text-emerald-400'}`} />
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${
                    isLight ? 'text-[#4361ee]' : 'text-emerald-400'
                  }`}
                >
                  TOPLAM BİRİKMİŞ TAMPON
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider border ${
                  isLight
                    ? 'bg-[#4361ee]/10 text-[#4361ee] border-[#4361ee]/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                Nakit Kasa
              </span>
            </div>

            {/* BIG BUFFER NUMBER - ONLY CASH/SURPLUS, SAVINGS EXCLUDED */}
            <div className="my-1.5">
              <h2
                className={`text-3xl font-black tabular-nums font-mono tracking-tight ${
                  cashBuffer < 0
                    ? 'text-rose-500'
                    : isLight
                    ? 'text-slate-900'
                    : 'text-emerald-400'
                }`}
              >
                {formatMoney(cashBuffer)}
              </h2>
            </div>

            {/* SUBTEXT BREAKDOWN: YATIRIM VE BİRİKİM AYRINTISI */}
            <div
              onClick={onOpenSavings}
              className={`mt-2.5 pt-2 border-t cursor-pointer group ${
                isLight ? 'border-slate-200' : 'border-[#2d2542]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className={`w-3.5 h-3.5 ${isLight ? 'text-[#7209b7]' : 'text-cyan-400'}`} />
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                    Yatırım & Birikim:{' '}
                    <strong className={`font-mono font-bold ${isLight ? 'text-[#7209b7]' : 'text-cyan-400'}`}>
                      {formatMoney(totalSavings)}
                    </strong>
                  </span>
                </div>
                <div
                  className={`flex items-center gap-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isLight ? 'text-[#4361ee]' : 'text-cyan-400'
                  }`}
                >
                  <span>Yatırımlar</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>

              <div
                className={`flex items-center justify-between text-[10px] mt-1 font-mono ${
                  isLight ? 'text-slate-500' : 'text-[#a89ba5]'
                }`}
              >
                <span>Toplam Finansal Güç (Tampon + Portföy):</span>
                <span
                  className={`font-bold ${
                    isLight ? 'text-[#f72585]' : 'text-slate-200'
                  }`}
                >
                  {formatMoney(totalNetWorth)}
                </span>
              </div>
            </div>
          </div>

          {/* SLIDE 2: EN ÇOK HARCANANLAR (TOP 10) - SHARP & STYLIZED */}
          <div
            className={`w-full shrink-0 snap-center p-4.5 rounded-lg border-2 relative overflow-hidden transition-all ${
              isLight
                ? 'bg-gradient-to-br from-white via-[#fff5f8] to-[#fef0f4] border-[#f72585] shadow-[0_4px_20px_rgba(247,37,133,0.12)]'
                : 'bg-gradient-to-br from-[#20131e] via-[#16121f] to-[#0e101a] border-[#52293f] shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
            }`}
          >
            {/* Top Glowing Accent Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                isLight
                  ? 'bg-gradient-to-r from-[#f72585] to-[#7209b7]'
                  : 'bg-gradient-to-r from-rose-500 via-amber-500 to-[#7209b7]'
              }`}
            />

            <div className="flex items-center justify-between mb-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                <Activity className={`w-4 h-4 ${isLight ? 'text-[#f72585]' : 'text-rose-400'}`} />
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${
                    isLight ? 'text-[#f72585]' : 'text-rose-400'
                  }`}
                >
                  En Çok Harcananlar ({selectedYear})
                </span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
                  isLight
                    ? 'bg-[#f72585]/10 text-[#f72585] border-[#f72585]/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                Top 10
              </span>
            </div>

            {topCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Bu yıl henüz harcama kaydı yok</p>
            ) : (
              <div className="space-y-1.5 max-h-[96px] overflow-y-auto pr-1">
                {topCategories.map(([catName, amt], idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between text-xs py-1 border-b last:border-none ${
                      isLight ? 'border-slate-200' : 'border-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`truncate max-w-[170px] text-[11px] font-medium ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      {idx + 1}. {catName}
                    </span>
                    <span
                      className={`font-black tabular-nums font-mono text-[11px] ${
                        isLight ? 'text-[#f72585]' : 'text-rose-400'
                      }`}
                    >
                      {formatMoney(amt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carousel Sharp Dots indicator */}
        <div className="flex justify-center items-center gap-1.5 mt-2">
          <button
            onClick={() => scrollToSlide(0)}
            className={`h-1 rounded-sm transition-all ${
              carouselIndex === 0
                ? isLight
                  ? 'w-6 bg-[#4361ee]'
                  : 'w-6 bg-cyan-400'
                : isLight
                ? 'w-2 bg-slate-300'
                : 'w-2 bg-[#3e3455]'
            }`}
            title="Birikmiş Tampon"
          />
          <button
            onClick={() => scrollToSlide(1)}
            className={`h-1 rounded-sm transition-all ${
              carouselIndex === 1
                ? isLight
                  ? 'w-6 bg-[#f72585]'
                  : 'w-6 bg-rose-400'
                : isLight
                ? 'w-2 bg-slate-300'
                : 'w-2 bg-[#3e3455]'
            }`}
            title="En Çok Harcananlar"
          />
        </div>
      </div>

      {/* Global Debt Card - Sharp & Stylized */}
      <div
        onClick={onOpenDebtManager}
        className={`p-3.5 rounded-lg border-2 cursor-pointer relative overflow-hidden transition-all group ${
          isLight
            ? 'bg-gradient-to-r from-white via-[#fff0f4] to-[#ffe5ec] border-[#f72585]/40 hover:border-[#f72585] shadow-sm'
            : 'bg-gradient-to-r from-[#21121d] via-[#1a1426] to-[#12111d] border-[#4a263c] hover:border-[#7a3b61] shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-md border flex items-center justify-center ${
                isLight
                  ? 'bg-[#f72585]/10 border-[#f72585]/30 text-[#f72585]'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              }`}
            >
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  isLight ? 'text-[#f72585]' : 'text-rose-400'
                }`}
              >
                Toplam Kalan Borç
              </span>
              <div
                className={`text-xl font-black tabular-nums font-mono ${
                  isLight ? 'text-[#f72585]' : 'text-rose-400'
                }`}
              >
                {formatMoney(totalRemainingDebt)}
              </div>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
              isLight ? 'text-[#f72585]' : 'text-slate-400 group-hover:text-rose-400'
            }`}
          >
            <span>Yönet</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* X-Axis Tug of War Bar */}
      <TugOfWarBar
        income={annualIncome}
        expense={annualExpense}
        incomeBreakdown={globalIncomeBreakdown}
        expenseBreakdown={globalExpenseBreakdown}
        isLight={isLight}
      />

      {/* Year Selector - Sharp corners */}
      <div className="flex items-center justify-between px-1 pt-0.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onYearChange(-1)}
            className={`p-2 rounded-lg border transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
                : 'bg-[#1c182b] border-[#3e3455] text-slate-300 hover:bg-[#252038]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3
            className={`text-lg font-black tracking-tight px-2 font-mono ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}
          >
            {selectedYear}
          </h3>
          <button
            onClick={() => onYearChange(1)}
            className={`p-2 rounded-lg border transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
                : 'bg-[#1c182b] border-[#3e3455] text-slate-300 hover:bg-[#252038]'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className={`text-xs font-mono font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Döngü:{' '}
          <span className={`font-bold ${isLight ? 'text-[#4361ee]' : 'text-cyan-400'}`}>
            {cycleDay === 1 ? '1-30' : `${cycleDay}. Gün`}
          </span>
        </div>
      </div>

      {/* 12 Months Grid - Sharp & Stylized */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, monthIdx) => {
          const monthId = `${selectedYear}-${monthIdx}`;
          const existingMonth = data.months.find(m => m.id === monthId);
          const cycleLabel = getCycleString(monthIdx, cycleDay);
          const isNegative = existingMonth ? existingMonth.remaining < 0 : false;

          return (
            <div
              key={monthIdx}
              onClick={() => onSelectMonth(selectedYear, monthIdx)}
              className={`p-2.5 rounded-lg border-2 cursor-pointer select-none transition-all flex flex-col justify-between min-h-[90px] active:scale-[0.97] ${
                existingMonth
                  ? isLight
                    ? 'bg-white border-[#4361ee]/30 hover:border-[#4361ee] shadow-sm'
                    : 'bg-[#181427] border-[#372d4c] hover:border-cyan-400/50 shadow-sm'
                  : isLight
                  ? 'bg-slate-100/70 border-dashed border-slate-300 text-slate-400 hover:border-[#4361ee]'
                  : 'bg-[#141220]/60 border-dashed border-[#2f2742] text-slate-500 hover:border-[#524470]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}
                  >
                    {TR_MONTHS[monthIdx]}
                  </span>
                  {existingMonth && (
                    <span
                      className={`w-1.5 h-1.5 rounded-sm ${
                        isNegative
                          ? isLight ? 'bg-[#f72585]' : 'bg-rose-400'
                          : isLight ? 'bg-[#4361ee]' : 'bg-emerald-400'
                      }`}
                    />
                  )}
                </div>
                <div className={`text-[10px] truncate mt-0.5 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {cycleDay === 1 ? TR_MONTHS_SHORT[monthIdx] : cycleLabel}
                </div>
              </div>

              {existingMonth ? (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span>G: {formatMoney(existingMonth.income)}</span>
                  </div>
                  <div
                    className={`text-xs font-black font-mono tracking-tight mt-0.5 tabular-nums ${
                      isNegative
                        ? isLight ? 'text-[#f72585]' : 'text-rose-400'
                        : isLight ? 'text-[#4361ee]' : 'text-emerald-400'
                    }`}
                  >
                    {!isNegative && '+'}
                    {formatMoney(existingMonth.remaining)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-slate-500 py-1">
                  <Plus className="w-3 h-3" />
                  <span>Başlat</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
