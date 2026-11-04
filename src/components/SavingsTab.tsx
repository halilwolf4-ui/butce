import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SavingsItem,
  SavingsCategoryType,
  SavingsHistoryEntry,
  SAVINGS_CATEGORIES,
  GoalJar,
  formatMoney,
  generateId
} from '../types';
import { generateSampleHistory } from '../utils/storage';
import {
  PieChart as PieIcon,
  Sparkles,
  Percent,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Wallet,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  PiggyBank,
  Target,
  ArrowDownLeft,
  Calendar,
  Gift,
  Palette,
  RefreshCw,
  AlertTriangle,
  History,
  Activity
} from 'lucide-react';

export const GOAL_COLORS = [
  { label: 'Turkuaz', value: '#06b6d4', bg: 'bg-[#06b6d4]' },
  { label: 'Neon Pembe', value: '#f72585', bg: 'bg-[#f72585]' },
  { label: 'Zümrüt Yeşili', value: '#10b981', bg: 'bg-[#10b981]' },
  { label: 'Altın Sarısı', value: '#f59e0b', bg: 'bg-[#f59e0b]' },
  { label: 'Siber Mor', value: '#8b5cf6', bg: 'bg-[#8b5cf6]' },
  { label: 'Kobalt Mavi', value: '#3b82f6', bg: 'bg-[#3b82f6]' },
  { label: 'Ateş Turuncusu', value: '#f97316', bg: 'bg-[#f97316]' },
  { label: 'Yakut Kırmızısı', value: '#ef4444', bg: 'bg-[#ef4444]' }
];

export const TIME_RANGES = [
  { id: '30D', label: '30G', days: 30, title: 'Son 30 Gün' },
  { id: '3M', label: '3A', days: 90, title: 'Son 3 Ay' },
  { id: '6M', label: '6A', days: 180, title: 'Son 6 Ay' },
  { id: '1Y', label: '1Y', days: 365, title: 'Son 1 Yıl' },
  { id: '2Y', label: '2Y', days: 730, title: 'Son 2 Yıl' },
  { id: '5Y', label: '5Y', days: 1825, title: 'Son 5 Yıl' }
] as const;

export type TimeRangeType = (typeof TIME_RANGES)[number]['id'];

// Helper to get days since last update
export function getDaysSinceUpdate(item: SavingsItem): number {
  if (item.lastUpdatedTimestamp) {
    return Math.max(0, Math.floor((Date.now() - item.lastUpdatedTimestamp) / (24 * 60 * 60 * 1000)));
  }
  if (item.updatedAt) {
    const parts = item.updatedAt.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      return Math.max(0, Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)));
    }
  }
  return 35; // default outdated if no date exists
}

// Mini SVG Sparkline Component for History
const Sparkline: React.FC<{ history?: SavingsHistoryEntry[]; currentAmount: number; color?: string }> = ({
  history,
  currentAmount,
  color = '#06b6d4'
}) => {
  const points = useMemo(() => {
    const data = history && history.length > 0 ? [...history] : [{ date: 'Başlangıç', timestamp: Date.now(), amount: currentAmount }];
    if (data[data.length - 1]?.amount !== currentAmount) {
      data.push({ date: 'Bugün', timestamp: Date.now(), amount: currentAmount });
    }
    return data.map(d => d.amount);
  }, [history, currentAmount]);

  if (points.length < 2) {
    return (
      <div className="h-6 w-16 flex items-center justify-center text-[9px] font-mono text-slate-500">
        Sabit
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 64;
  const height = 24;

  const svgPoints = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * (width - 4) + 2;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const isUp = points[points.length - 1] >= points[0];

  return (
    <div className="flex items-center gap-1">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={isUp ? '#10b981' : '#f43f5e'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
        />
      </svg>
    </div>
  );
};

interface SavingsTabProps {
  savings: SavingsItem[];
  goalJars?: GoalJar[];
  cashBuffer: number;
  onUpdateSavings: (updated: SavingsItem[]) => void;
  onUpdateGoalJars?: (updated: GoalJar[]) => void;
  isLight: boolean;
  onOpenAddModal: () => void;
}

export const SavingsTab: React.FC<SavingsTabProps> = ({
  savings,
  goalJars = [],
  cashBuffer,
  onUpdateSavings,
  onUpdateGoalJars,
  isLight,
  onOpenAddModal
}) => {
  const [activeView, setActiveView] = useState<'portfolio' | 'goals'>('portfolio');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(() => goalJars[0]?.id || '');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  // Interactive Chart State (Overall or Single Asset & Time Ranges: 30D, 3M, 6M, 1Y, 2Y, 5Y)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('30D');
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Selected Asset for Chart drilldown
  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    return savings.find(s => s.id === selectedAssetId) || null;
  }, [savings, selectedAssetId]);

  // Bulk Portfolio Update Modal
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [bulkInputs, setBulkInputs] = useState<Record<string, string>>({});

  // Modals for Goal Jars
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositMode, setDepositMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [goalAmountInput, setGoalAmountInput] = useState('');
  const [isCoinDropping, setIsCoinDropping] = useState(false);

  // Edit Goal Form State
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalCategory, setEditGoalCategory] = useState<GoalJar['category']>('Tatil');
  const [editGoalColor, setEditGoalColor] = useState('#06b6d4');
  const [editGoalNote, setEditGoalNote] = useState('');

  // Check if Portfolio has any items not updated for 30+ days (1 month)
  const { hasOutdatedSavings, maxDaysSinceUpdate } = useMemo(() => {
    if (savings.length === 0) return { hasOutdatedSavings: false, maxDaysSinceUpdate: 0 };
    let maxDays = 0;
    let isStale = false;
    savings.forEach(item => {
      const days = getDaysSinceUpdate(item);
      if (days > maxDays) maxDays = days;
      if (days >= 30) isStale = true;
    });
    return { hasOutdatedSavings: isStale, maxDaysSinceUpdate: maxDays };
  }, [savings]);

  // Open Bulk Update Modal
  const handleOpenBulkUpdate = () => {
    const initialValues: Record<string, string> = {};
    savings.forEach(s => {
      initialValues[s.id] = String(s.amount);
    });
    setBulkInputs(initialValues);
    setIsBulkUpdateOpen(true);
  };

  // Save Bulk Updates
  const handleSaveBulkUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const now = Date.now();

    const updated = savings.map(item => {
      const inputVal = bulkInputs[item.id];
      const parsedVal = inputVal !== undefined ? parseFloat(inputVal.replace(',', '.')) : item.amount;
      const newAmount = !isNaN(parsedVal) && parsedVal >= 0 ? parsedVal : item.amount;

      // Append to history if value changed or creating fresh point
      const currentHistory = Array.isArray(item.history) ? [...item.history] : [];
      if (currentHistory.length === 0 || currentHistory[currentHistory.length - 1].amount !== newAmount) {
        currentHistory.push({
          date: dateStr,
          timestamp: now,
          amount: newAmount
        });
      }

      return {
        ...item,
        amount: newAmount,
        initialAmount: item.initialAmount || (currentHistory[0]?.amount || newAmount),
        updatedAt: dateStr,
        lastUpdatedTimestamp: now,
        history: currentHistory
      };
    });

    onUpdateSavings(updated);
    setIsBulkUpdateOpen(false);
  };

  // Active Goal Jar
  const activeGoal = useMemo(() => {
    return goalJars.find(g => g.id === selectedGoalId) || goalJars[0] || null;
  }, [goalJars, selectedGoalId]);

  // Open Edit Goal Modal
  const handleOpenEditGoal = (goal: GoalJar) => {
    setEditGoalName(goal.name);
    setEditGoalTarget(String(goal.targetAmount));
    setEditGoalCategory(goal.category || 'Diğer');
    setEditGoalColor(goal.color || '#06b6d4');
    setEditGoalNote(goal.note || '');
    setIsEditGoalOpen(true);
  };

  // Save Goal Edits
  const handleSaveGoalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal || !onUpdateGoalJars) return;
    const targetAmt = parseFloat(editGoalTarget);
    if (!editGoalName.trim() || isNaN(targetAmt) || targetAmt <= 0) {
      alert('Lütfen geçerli bir isim ve hedef tutar giriniz.');
      return;
    }

    const updated = goalJars.map(g =>
      g.id === activeGoal.id
        ? {
            ...g,
            name: editGoalName.trim(),
            targetAmount: targetAmt,
            category: editGoalCategory,
            color: editGoalColor,
            note: editGoalNote.trim() || undefined
          }
        : g
    );

    onUpdateGoalJars(updated);
    setIsEditGoalOpen(false);
  };

  // Total Portfolio Value
  const totalSavings = useMemo(() => {
    return savings.reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [savings]);

  // Generate Continuous Timeline Performance Data for Selected Range & Asset/Portfolio
  const chartData = useMemo(() => {
    const rangeConfig = TIME_RANGES.find(r => r.id === timeRange) || TIME_RANGES[0];
    const days = rangeConfig.days;
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const steps = 14;
    const stepDuration = (now - cutoff) / (steps - 1);

    const getItemAmountAt = (item: SavingsItem, t: number): number => {
      const currentVal = item.amount || 0;
      const initialVal = item.initialAmount !== undefined ? item.initialAmount : (item.history?.[0]?.amount ?? currentVal);
      const history = Array.isArray(item.history) && item.history.length > 0
        ? [...item.history].sort((a, b) => a.timestamp - b.timestamp)
        : [];

      if (history.length === 0) {
        const createdAt = item.lastUpdatedTimestamp ? item.lastUpdatedTimestamp - 30 * 86400000 : now - 30 * 86400000;
        if (t <= createdAt) return initialVal;
        if (t >= now) return currentVal;
        const progress = (t - createdAt) / (now - createdAt || 1);
        return initialVal + (currentVal - initialVal) * progress;
      }

      if (t >= history[history.length - 1].timestamp) {
        return currentVal;
      }

      if (t <= history[0].timestamp) {
        const t0 = history[0].timestamp - 30 * 86400000;
        if (t <= t0) return initialVal;
        const prog = (t - t0) / (history[0].timestamp - t0 || 1);
        return initialVal + (history[0].amount - initialVal) * prog;
      }

      for (let i = 0; i < history.length - 1; i++) {
        const p1 = history[i];
        const p2 = history[i + 1];
        if (t >= p1.timestamp && t <= p2.timestamp) {
          const ratio = (t - p1.timestamp) / (p2.timestamp - p1.timestamp || 1);
          return p1.amount + (p2.amount - p1.amount) * ratio;
        }
      }

      return currentVal;
    };

    const points: { date: string; fullDate: string; timestamp: number; amount: number }[] = [];
    const monthNamesShort = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    for (let i = 0; i < steps; i++) {
      const t = i === steps - 1 ? now : cutoff + i * stepDuration;
      const dateObj = new Date(t);
      const day = dateObj.getDate();
      const month = monthNamesShort[dateObj.getMonth()];
      const year = String(dateObj.getFullYear()).slice(-2);

      let shortLabel = `${day} ${month}`;
      if (days > 180) {
        shortLabel = `${month} '${year}`;
      }
      if (i === steps - 1) {
        shortLabel = 'Bugün';
      }

      let totalVal = 0;
      if (selectedAsset) {
        totalVal = getItemAmountAt(selectedAsset, t);
      } else {
        totalVal = savings.reduce((sum, item) => sum + getItemAmountAt(item, t), 0);
      }

      points.push({
        date: shortLabel,
        fullDate: dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        timestamp: t,
        amount: Math.round(totalVal)
      });
    }

    const amounts = points.map(p => p.amount);
    const minVal = Math.min(...amounts);
    const maxVal = Math.max(...amounts);
    const startVal = points[0]?.amount || 0;
    const currentVal = points[points.length - 1]?.amount || 0;
    const diff = currentVal - startVal;
    const diffPct = startVal > 0 ? ((diff / startVal) * 100).toFixed(1) : '0';
    const isUp = diff >= 0;

    return {
      points,
      minVal,
      maxVal,
      startVal,
      currentVal,
      diff,
      diffPct,
      isUp,
      rangeConfig
    };
  }, [savings, selectedAsset, timeRange]);

  // Combined Total Tampon
  const combinedTotalTampon = Math.max(0, cashBuffer) + totalSavings;
  const cashPct = combinedTotalTampon > 0 ? Math.round((Math.max(0, cashBuffer) / combinedTotalTampon) * 100) : 50;
  const savingsPct = combinedTotalTampon > 0 ? 100 - cashPct : 50;

  // Breakdown by savings category
  const categoryBreakdown = useMemo(() => {
    const map: Record<SavingsCategoryType, { total: number; count: number; items: SavingsItem[] }> = {
      fon: { total: 0, count: 0, items: [] },
      altin: { total: 0, count: 0, items: [] },
      vadeli: { total: 0, count: 0, items: [] },
      borsa: { total: 0, count: 0, items: [] },
      kripto: { total: 0, count: 0, items: [] },
      doviz: { total: 0, count: 0, items: [] },
      diger: { total: 0, count: 0, items: [] }
    };

    savings.forEach(item => {
      const type = item.type || 'diger';
      if (map[type]) {
        map[type].total += item.amount || 0;
        map[type].count += 1;
        map[type].items.push(item);
      }
    });

    return map;
  }, [savings]);

  const getCategoryMeta = (type: SavingsCategoryType) => {
    return SAVINGS_CATEGORIES.find(c => c.type === type) || SAVINGS_CATEGORIES[0];
  };

  const getCategoryIcon = (type: SavingsCategoryType) => {
    switch (type) {
      case 'fon':
        return <PieIcon className="w-4 h-4 text-cyan-400" />;
      case 'altin':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'vadeli':
        return <Percent className="w-4 h-4 text-emerald-400" />;
      case 'borsa':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'kripto':
        return <Zap className="w-4 h-4 text-purple-400" />;
      case 'doviz':
        return <DollarSign className="w-4 h-4 text-pink-400" />;
      default:
        return <Wallet className="w-4 h-4 text-teal-400" />;
    }
  };

  const handleDeleteItem = (id: string) => {
    onUpdateSavings(savings.filter(s => s.id !== id));
  };

  const handleStartEdit = (item: SavingsItem) => {
    setEditingItemId(item.id);
    setEditAmount(String(item.amount));
  };

  const handleSaveEdit = (id: string) => {
    const val = parseFloat(editAmount);
    if (!isNaN(val) && val >= 0) {
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      const now = Date.now();

      onUpdateSavings(
        savings.map(s => {
          if (s.id !== id) return s;
          const currentHistory = Array.isArray(s.history) ? [...s.history] : [];
          currentHistory.push({ date: dateStr, timestamp: now, amount: val });
          return {
            ...s,
            amount: val,
            updatedAt: dateStr,
            lastUpdatedTimestamp: now,
            history: currentHistory
          };
        })
      );
    }
    setEditingItemId(null);
  };

  // Goal Jar Handlers
  const handleCreateGoal = (
    name: string,
    targetAmount: number,
    category: GoalJar['category'],
    color: string,
    note?: string
  ) => {
    if (!onUpdateGoalJars) return;

    const newGoal: GoalJar = {
      id: generateId(),
      name,
      targetAmount,
      currentAmount: 0,
      category: category || 'Diğer',
      color: color || '#06b6d4',
      note,
      createdAt: new Date().toLocaleDateString('tr-TR')
    };

    const updated = [...goalJars, newGoal];
    onUpdateGoalJars(updated);
    setSelectedGoalId(newGoal.id);
    setIsCreateGoalOpen(false);
  };

  const handleDepositWithdrawGoal = (amount: number, mode: 'deposit' | 'withdraw') => {
    if (!activeGoal || !onUpdateGoalJars) return;
    const current = activeGoal.currentAmount || 0;
    const newAmount = mode === 'deposit' ? current + amount : Math.max(0, current - amount);

    if (mode === 'deposit') {
      setIsCoinDropping(true);
      setTimeout(() => setIsCoinDropping(false), 900);
    }

    const updated = goalJars.map(g => (g.id === activeGoal.id ? { ...g, currentAmount: newAmount } : g));
    onUpdateGoalJars(updated);
    setIsDepositOpen(false);
    setGoalAmountInput('');
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!onUpdateGoalJars) return;
    if (confirm('Bu kumbarayı silmek istediğinize emin misiniz?')) {
      const updated = goalJars.filter(g => g.id !== goalId);
      onUpdateGoalJars(updated);
      if (selectedGoalId === goalId) {
        setSelectedGoalId(updated[0]?.id || '');
      }
    }
  };

  const goalPercentage = activeGoal
    ? Math.min(100, Math.max(0, Math.round((activeGoal.currentAmount / Math.max(1, activeGoal.targetAmount)) * 100)))
    : 0;

  const liquidY = 150 - (goalPercentage / 100) * 115;
  const goalColor = activeGoal?.color || '#06b6d4';

  // Interactive SVG Path & Coordinate Calculations
  const svgWidth = 500;
  const svgHeight = 175;
  const padTop = 18;
  const padBottom = 26;
  const padLeft = 14;
  const padRight = 14;

  const innerWidth = svgWidth - padLeft - padRight;
  const innerHeight = svgHeight - padTop - padBottom;

  const yRange = chartData.maxVal - chartData.minVal || Math.max(10, chartData.currentVal * 0.1);
  const yMin = Math.max(0, chartData.minVal - yRange * 0.08);
  const yMax = chartData.maxVal + yRange * 0.08;
  const adjustedRange = yMax - yMin || 1;

  const coordinates = chartData.points.map((p, idx) => {
    const x = padLeft + (idx / Math.max(1, chartData.points.length - 1)) * innerWidth;
    const y = padTop + innerHeight - ((p.amount - yMin) / adjustedRange) * innerHeight;
    return { x, y, ...p };
  });

  const linePath = coordinates.reduce((path, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[idx - 1];
    const cpX1 = prev.x + (pt.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (pt.x - prev.x) / 2;
    const cpY2 = pt.y;
    return `${path} C ${cpX1},${cpY1} ${cpX2},${cpY2} ${pt.x},${pt.y}`;
  }, '');

  const lastCoord = coordinates[coordinates.length - 1] || { x: padLeft, y: padTop };
  const firstCoord = coordinates[0] || { x: padLeft, y: padTop };
  const areaPath = `${linePath} L ${lastCoord.x},${svgHeight - padBottom} L ${firstCoord.x},${svgHeight - padBottom} Z`;

  const activePoint = hoveredPointIdx !== null && coordinates[hoveredPointIdx] ? coordinates[hoveredPointIdx] : null;
  const displayedAmount = activePoint ? activePoint.amount : chartData.currentVal;
  const displayedDate = activePoint ? activePoint.fullDate : `${chartData.rangeConfig.title} Performansı`;
  const hoverDiff = activePoint ? activePoint.amount - chartData.startVal : chartData.diff;
  const hoverPct = chartData.startVal > 0 ? ((hoverDiff / chartData.startVal) * 100).toFixed(1) : '0';
  const hoverIsUp = hoverDiff >= 0;

  return (
    <div className="space-y-4 pb-24 pt-1">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>Birikim &</span>
            <span
              className={
                isLight
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#f72585] to-[#4361ee]'
                  : 'text-cyan-400 font-extrabold'
              }
            >
              Varlıklar
            </span>
            <PiggyBank className={`w-5 h-5 ${isLight ? 'text-[#7209b7]' : 'text-cyan-400'}`} />
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Fon, altın, hisse ve hedef kumbaralarınız
          </p>
        </div>

        {/* Action Buttons: Portföyü Güncelle + Varlık/Kumbara Ekle */}
        <div className="flex items-center gap-2">
          {activeView === 'portfolio' ? (
            <>
              {/* TOPLU PORTFÖY GÜNCELLEME BUTONU (1 AY GEÇTİYSE KIRMIZI VE ÜNLEMLİ) */}
              <button
                onClick={handleOpenBulkUpdate}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs shadow-md transition-all active:scale-95 ${
                  hasOutdatedSavings
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/40 border-2 border-rose-300'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 text-[#4361ee] border-2 border-[#4361ee]/40'
                    : 'bg-[#221b33] hover:bg-[#2e2445] text-cyan-300 border-2 border-cyan-400/40'
                }`}
                title={hasOutdatedSavings ? 'Varlıklarınız 1 aydır güncellenmedi!' : 'Tüm varlık değerlerini güncelle'}
              >
                {hasOutdatedSavings ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{hasOutdatedSavings ? 'Güncelle (!)' : 'Güncelle'}</span>
              </button>

              <button
                onClick={onOpenAddModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs shadow-md active:scale-95 transition-all ${
                  isLight
                    ? 'bg-gradient-to-r from-[#f72585] to-[#4361ee] text-white shadow-[#4361ee]/20'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-cyan-500/25'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Varlık Ekle</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCreateGoalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs shadow-md active:scale-95 transition-all ${
                isLight
                  ? 'bg-gradient-to-r from-[#f72585] via-[#7209b7] to-[#4361ee] text-white shadow-[#4361ee]/20'
                  : 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kumbara Aç</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented View Switcher: Portföy vs Kumbaralar */}
      <div
        className={`flex p-1 rounded-lg border-2 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#141220] border-[#372d4c]'
        }`}
      >
        <button
          onClick={() => setActiveView('portfolio')}
          className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all relative ${
            activeView === 'portfolio'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'bg-[#221b33] text-cyan-400 shadow-md border border-[#4d3d6b]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieIcon className="w-4 h-4" />
          <span>Varlık Portföyü ({savings.length})</span>
          {hasOutdatedSavings && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveView('goals')}
          className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
            activeView === 'goals'
              ? isLight
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'bg-[#221b33] text-cyan-400 shadow-md border border-[#4d3d6b]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Hedef Kumbaraları ({goalJars.length})</span>
        </button>
      </div>

      {/* SECTION 1: VARLIK PORTFÖYÜ & ÇİZGİ GRAFİKLERİ */}
      {activeView === 'portfolio' && (
        <div className="space-y-4">
          {/* Outdated Stale Portfolio Warning Card (Shown when > 30 days) */}
          {hasOutdatedSavings && (
            <div
              onClick={handleOpenBulkUpdate}
              className={`p-3 rounded-lg border-2 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                isLight
                  ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm hover:border-rose-400'
                  : 'bg-rose-950/30 border-rose-500/50 text-rose-200 shadow-md hover:border-rose-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-rose-500 text-white shadow-sm shrink-0">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-black font-mono flex items-center gap-1.5">
                    <span>1 Aydır Portföy Güncellenmedi!</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 font-normal">
                      {maxDaysSinceUpdate} gün önce
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                    Güncel altın, fon ve hisse fiyatlarını girmek için dokunun.
                  </p>
                </div>
              </div>

              <button className="px-2.5 py-1 rounded-md bg-rose-500 text-white text-xs font-mono font-bold shrink-0 shadow-sm">
                Güncelle 🔄
              </button>
            </div>
          )}

          {/* INTERACTIVE PORTFOLIO & ASSET PERFORMANCE LINE CHART */}
          <div
            className={`p-4 rounded-lg border-2 relative overflow-hidden transition-all ${
              isLight
                ? 'bg-gradient-to-br from-white via-[#f8f9fe] to-[#eef2ff] border-[#4361ee] shadow-[0_4px_20px_rgba(67,97,238,0.12)]'
                : 'bg-gradient-to-br from-[#1a1428] via-[#141222] to-[#0e101a] border-[#3e3455] shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
            }`}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                chartData.isUp
                  ? isLight
                    ? 'bg-gradient-to-r from-emerald-400 via-[#4361ee] to-teal-400'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400'
                  : 'bg-gradient-to-r from-rose-500 via-orange-400 to-amber-500'
              }`}
            />

            {/* Top Filter Bar: Asset Title + Time Range Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1 pt-0.5">
              {/* Left: Active Selection Indicator */}
              <div className="flex items-center gap-1.5 min-w-0">
                {selectedAsset ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded border truncate max-w-[150px] ${
                        isLight
                          ? 'bg-[#4361ee]/10 text-[#4361ee] border-[#4361ee]/30'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-400/30'
                      }`}
                      title={selectedAsset.name}
                    >
                      {selectedAsset.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedAssetId(null);
                        setHoveredPointIdx(null);
                      }}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-500/20 hover:bg-slate-500/40 text-slate-300 transition-colors flex items-center gap-1 active:scale-95"
                      title="Tüm portföye geri dön"
                    >
                      <X className="w-3 h-3" />
                      <span>Tümü</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-[#4361ee]' : 'text-cyan-400'}`} />
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider ${
                        isLight ? 'text-[#4361ee]' : 'text-cyan-400'
                      }`}
                    >
                      TOPLAM PORTFÖY
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">({savings.length} Varlık)</span>
                  </div>
                )}
              </div>

              {/* Right: Time Range Selector Buttons (30G, 3A, 6A, 1Y, 2Y, 5Y) */}
              <div
                className={`flex items-center p-0.5 rounded-lg border shrink-0 ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0f0d1a] border-[#372d4c]'
                }`}
              >
                {TIME_RANGES.map(range => (
                  <button
                    key={range.id}
                    onClick={() => {
                      setTimeRange(range.id);
                      setHoveredPointIdx(null);
                    }}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] font-mono transition-all ${
                      timeRange === range.id
                        ? isLight
                          ? 'bg-white text-[#4361ee] shadow-sm font-black'
                          : 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-400/40 font-black'
                        : isLight
                        ? 'text-slate-500 hover:text-slate-800'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={range.title}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Value & Growth Header */}
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h2
                    className={`text-2xl sm:text-3xl font-black tabular-nums font-mono tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-slate-100'
                    }`}
                  >
                    {formatMoney(activePoint ? activePoint.amount : chartData.currentVal)}
                  </h2>

                  <div
                    className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      hoverIsUp
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {hoverIsUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>
                      {hoverIsUp ? '+' : ''}
                      {formatMoney(hoverDiff)} ({hoverIsUp ? '+' : ''}
                      {hoverPct}%)
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {displayedDate}
                </div>
              </div>

              <div className="text-right text-[10px] font-mono text-slate-400 hidden sm:block shrink-0">
                <div>
                  Dönem Zirve: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{formatMoney(chartData.maxVal)}</strong>
                </div>
                <div>
                  Dönem Dip: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{formatMoney(chartData.minVal)}</strong>
                </div>
              </div>
            </div>

            {/* SVG Performance Line & Area Chart */}
            <div className="relative mt-2 w-full h-[175px] touch-none select-none">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                onMouseLeave={() => setHoveredPointIdx(null)}
                onTouchEnd={() => setHoveredPointIdx(null)}
                onMouseMove={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clientX = e.clientX - rect.left;
                  const normalizedX = (clientX / (rect.width || 1)) * svgWidth;
                  let closestIdx = 0;
                  let minDistance = Infinity;
                  coordinates.forEach((pt, idx) => {
                    const dist = Math.abs(pt.x - normalizedX);
                    if (dist < minDistance) {
                      minDistance = dist;
                      closestIdx = idx;
                    }
                  });
                  setHoveredPointIdx(closestIdx);
                }}
                onTouchMove={e => {
                  if (e.touches.length > 0) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clientX = e.touches[0].clientX - rect.left;
                    const normalizedX = (clientX / (rect.width || 1)) * svgWidth;
                    let closestIdx = 0;
                    let minDistance = Infinity;
                    coordinates.forEach((pt, idx) => {
                      const dist = Math.abs(pt.x - normalizedX);
                      if (dist < minDistance) {
                        minDistance = dist;
                        closestIdx = idx;
                      }
                    });
                    setHoveredPointIdx(closestIdx);
                  }
                }}
              >
                <defs>
                  <linearGradient id="chartFillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartData.isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.32" />
                    <stop offset="60%" stopColor={chartData.isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={chartData.isUp ? '#10b981' : '#f43f5e'} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0.2, 0.5, 0.8].map((fraction, i) => {
                  const yPos = padTop + innerHeight * fraction;
                  return (
                    <line
                      key={i}
                      x1={padLeft}
                      y1={yPos}
                      x2={svgWidth - padRight}
                      y2={yPos}
                      stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Area fill */}
                <path d={areaPath} fill="url(#chartFillGrad)" />

                {/* Line stroke */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={chartData.isUp ? '#10b981' : '#f43f5e'}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hover crosshair vertical line */}
                {hoveredPointIdx !== null && (
                  <g>
                    <line
                      x1={coordinates[hoveredPointIdx].x}
                      y1={padTop}
                      x2={coordinates[hoveredPointIdx].x}
                      y2={svgHeight - padBottom}
                      stroke={isLight ? '#4361ee' : '#06b6d4'}
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={coordinates[hoveredPointIdx].x}
                      cy={coordinates[hoveredPointIdx].y}
                      r="6"
                      fill={chartData.isUp ? '#10b981' : '#f43f5e'}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="shadow-lg"
                    />
                  </g>
                )}

                {/* Latest point indicator (when not hovered) */}
                {hoveredPointIdx === null && (
                  <circle
                    cx={lastCoord.x}
                    cy={lastCoord.y}
                    r="4.5"
                    fill={chartData.isUp ? '#10b981' : '#f43f5e'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}

                {/* Bottom date axis markers */}
                {coordinates
                  .filter((_, idx) => idx === 0 || idx === Math.floor(coordinates.length / 2) || idx === coordinates.length - 1)
                  .map((pt, i) => (
                    <text
                      key={i}
                      x={pt.x}
                      y={svgHeight - 8}
                      textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
                      fontSize="9"
                      fontFamily="monospace"
                      fill={isLight ? '#64748b' : '#94a3b8'}
                    >
                      {pt.date}
                    </text>
                  ))}
              </svg>
            </div>
          </div>

          {/* Detailed Savings Items List with Interactive Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Kayıtlı Varlıklar & İstatistikler ({savings.length} Kalem)
                </span>
                <p className="text-[10px] font-mono text-slate-500">
                  Grafiğini görmek için bir varlığa dokunun
                </p>
              </div>

              <button
                onClick={handleOpenBulkUpdate}
                className={`text-xs font-mono font-bold flex items-center gap-1 ${
                  hasOutdatedSavings
                    ? 'text-rose-500 animate-pulse'
                    : isLight
                    ? 'text-[#4361ee]'
                    : 'text-cyan-400'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Toplu Güncelle</span>
              </button>
            </div>

            {savings.length === 0 ? (
              <div
                className={`text-center py-8 border-2 border-dashed rounded-lg p-6 ${
                  isLight ? 'border-slate-300 bg-white' : 'border-[#372d4c] bg-[#141220]'
                }`}
              >
                <Coins className="w-10 h-10 text-cyan-400/50 mx-auto mb-2" />
                <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  Henüz birikim eklemediniz
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Yatırım fonu, altın, vadeli mevduat veya borsa hisselerinizi ekleyin.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savings.map(item => {
                  const meta = getCategoryMeta(item.type);
                  const isEditing = editingItemId === item.id;
                  const isSelected = selectedAssetId === item.id;
                  const daysAgo = getDaysSinceUpdate(item);
                  const isStale = daysAgo >= 30;

                  // Profit/Loss calculation
                  const cost = item.initialAmount || item.history?.[0]?.amount || item.amount;
                  const profitDiff = item.amount - cost;
                  const profitPct = cost > 0 ? ((profitDiff / cost) * 100).toFixed(1) : '0';
                  const isProfit = profitDiff > 0;
                  const isLoss = profitDiff < 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isEditing) {
                          if (isSelected) {
                            setSelectedAssetId(null);
                          } else {
                            setSelectedAssetId(item.id);
                          }
                          setHoveredPointIdx(null);
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer select-none ${
                        isSelected
                          ? isLight
                            ? 'bg-blue-50/90 border-[#4361ee] shadow-md ring-2 ring-[#4361ee]/30'
                            : 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-2 ring-cyan-400/40'
                          : isStale
                          ? isLight
                            ? 'bg-rose-50/40 border-rose-300 shadow-sm hover:border-rose-400'
                            : 'bg-rose-950/15 border-rose-500/40 hover:border-rose-400'
                          : isLight
                          ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                          : 'bg-[#181427] border-[#372d4c] hover:border-[#4d3d6b]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Icon & Info */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`p-2 rounded-md shrink-0 ${
                              isSelected
                                ? isLight
                                  ? 'bg-[#4361ee] text-white'
                                  : 'bg-cyan-400 text-slate-950'
                                : isLight
                                ? 'bg-slate-100'
                                : 'bg-white/[0.05]'
                            }`}
                          >
                            {getCategoryIcon(item.type)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-xs font-black truncate ${
                                  isSelected
                                    ? isLight
                                      ? 'text-[#4361ee]'
                                      : 'text-cyan-300'
                                    : isLight
                                    ? 'text-slate-900'
                                    : 'text-slate-100'
                                }`}
                              >
                                {item.name}
                              </h4>
                              <span
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded-sm shrink-0 border"
                                style={{
                                  backgroundColor: `${meta.color}15`,
                                  color: meta.color,
                                  borderColor: `${meta.color}30`
                                }}
                              >
                                {meta.label.split(' ')[0]}
                              </span>

                              {isSelected && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold shrink-0">
                                  Grafik Aktif 📈
                                </span>
                              )}
                            </div>

                            {/* Profit/Loss & Update Date Tag */}
                            <div className="flex items-center gap-2 text-[10px] font-mono mt-1 flex-wrap">
                              {/* Kar/Zarar Badge */}
                              <span
                                className={`font-bold flex items-center gap-0.5 ${
                                  isProfit
                                    ? 'text-emerald-500'
                                    : isLoss
                                    ? 'text-rose-500'
                                    : 'text-slate-400'
                                }`}
                              >
                                {isProfit && <TrendingUp className="w-3 h-3" />}
                                {isLoss && <TrendingDown className="w-3 h-3" />}
                                {profitDiff !== 0
                                  ? `${isProfit ? '+' : ''}${formatMoney(profitDiff)} (%${isProfit ? '+' : ''}${profitPct})`
                                  : 'Maliyet: ' + formatMoney(cost)}
                              </span>

                              <span className="text-slate-500">·</span>

                              {/* Days ago tag */}
                              <span
                                className={`flex items-center gap-1 ${
                                  isStale ? 'text-rose-500 font-bold' : 'text-slate-400'
                                }`}
                              >
                                {isStale && <AlertTriangle className="w-3 h-3" />}
                                <span>{daysAgo === 0 ? 'Bugün' : `${daysAgo} gün önce`}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Center: Sparkline Trend Graph */}
                        <div className="hidden sm:flex flex-col items-center shrink-0 px-2">
                          <span className="text-[8px] font-mono text-slate-500 mb-0.5">Mini Trend</span>
                          <Sparkline history={item.history} currentAmount={item.amount} />
                        </div>

                        {/* Right: Amount & Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isEditing ? (
                            <div
                              className="flex items-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              <input
                                type="number"
                                autoFocus
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                className={`w-24 h-7 px-2 text-xs font-mono font-bold rounded border ${
                                  isLight
                                    ? 'bg-white border-[#4361ee] text-slate-900'
                                    : 'bg-[#120f1e] border-cyan-400 text-white'
                                }`}
                              />
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 rounded bg-slate-500 text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div
                                className={`text-xs font-black font-mono ${
                                  isLight ? 'text-slate-900' : 'text-slate-100'
                                }`}
                              >
                                {formatMoney(item.amount)}
                              </div>
                            </div>
                          )}

                          {!isEditing && (
                            <div
                              className="flex items-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                                title="Değeri Güncelle"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`"${item.name}" varlığını silmek istediğinize emin misiniz?`)) {
                                    handleDeleteItem(item.id);
                                    if (selectedAssetId === item.id) {
                                      setSelectedAssetId(null);
                                    }
                                  }
                                }}
                                className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: HEDEF KUMBARALARI (PIGGY BANK) */}
      {activeView === 'goals' && (
        <div className="space-y-4">
          {/* Goal Selector - FLEX WRAP GRID */}
          <div className="flex flex-wrap gap-2 items-center">
            {goalJars.map(goal => {
              const isSelected = activeGoal?.id === goal.id;
              const pct = Math.min(100, Math.round((goal.currentAmount / Math.max(1, goal.targetAmount)) * 100));

              return (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoalId(goal.id)}
                  className={`px-3 py-1.5 rounded-lg border-2 text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                    isSelected
                      ? isLight
                        ? 'bg-white border-[#4361ee] text-[#4361ee] shadow-sm ring-2 ring-[#4361ee]/20'
                        : 'bg-[#1e172e] border-cyan-400 text-cyan-300 shadow-md ring-2 ring-cyan-400/20'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      : 'bg-[#120f1e] border-[#372d4c] text-slate-400 hover:border-[#534370]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: goal.color || '#06b6d4' }}
                  />
                  <span>{goal.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                      pct >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    %{pct}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setIsCreateGoalOpen(true)}
              className={`px-2.5 py-1.5 rounded-lg border-2 border-dashed text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                isLight
                  ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  : 'border-[#372d4c] text-slate-400 hover:text-cyan-300 hover:border-cyan-400/50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Kumbara</span>
            </button>
          </div>

          {/* LARGE ANIMATED PIGGY BANK STAGE */}
          {activeGoal ? (
            <div
              className={`p-5 rounded-xl border-2 relative overflow-hidden flex flex-col items-center justify-center transition-all ${
                isLight
                  ? 'bg-gradient-to-b from-white via-slate-50 to-blue-50/40 border-[#4361ee]/30 shadow-lg'
                  : 'bg-gradient-to-b from-[#181427] via-[#131020] to-[#0c0a15] border-[#3e3455] shadow-2xl'
              }`}
            >
              <div
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: goalColor }}
              />

              {/* Top Meta Info with EDIT & DELETE BUTTONS */}
              <div className="w-full flex items-center justify-between mb-2 z-10">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: `${goalColor}15`,
                      color: goalColor,
                      borderColor: `${goalColor}40`
                    }}
                  >
                    {activeGoal.category || 'Hedef'}
                  </span>
                  {activeGoal.note && (
                    <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                      {activeGoal.note}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditGoal(activeGoal)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-bold border transition-all ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                    title="Kumbarayı Düzenle (Fiyat, İsim, Renk)"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Düzenle</span>
                  </button>

                  <button
                    onClick={() => handleDeleteGoal(activeGoal.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Kumbarayı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ANIMATED SVG PIGGY BANK WITH LIQUID WAVE */}
              <div className="relative w-full max-w-[280px] h-[190px] flex items-center justify-center my-1">
                <AnimatePresence>
                  {isCoinDropping && (
                    <motion.div
                      initial={{ y: -35, opacity: 0, scale: 0.8 }}
                      animate={{ y: 25, opacity: [0, 1, 1, 0], scale: [0.8, 1.1, 1] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.75, ease: 'easeIn' }}
                      className="absolute top-2 left-[56%] -translate-x-1/2 z-30"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 border-2 border-yellow-100 shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center text-[10px] font-black font-mono text-amber-950">
                        ₺
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-xl overflow-visible">
                  <defs>
                    <linearGradient id={`liquid-grad-${activeGoal.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={goalColor} stopOpacity="0.95" />
                      <stop offset="60%" stopColor={goalColor} stopOpacity="0.75" />
                      <stop offset="100%" stopColor={isLight ? '#3b82f6' : '#120f24'} stopOpacity="0.95" />
                    </linearGradient>

                    <linearGradient id="glass-edge" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
                    </linearGradient>

                    <clipPath id={`pig-cavity-${activeGoal.id}`}>
                      <path d="M 32,95 C 32,54 68,36 120,36 C 172,36 208,54 208,95 C 208,136 172,154 120,154 C 68,154 32,136 32,95 Z" />
                    </clipPath>
                  </defs>

                  <path
                    d="M 68,42 Q 54,12 80,24 Z"
                    fill={isLight ? '#f1f5f9' : '#221a36'}
                    stroke={isLight ? '#cbd5e1' : '#4d3d6b'}
                    strokeWidth="3"
                  />
                  <path
                    d="M 106,38 Q 120,12 130,26 Z"
                    fill={isLight ? '#f1f5f9' : '#221a36'}
                    stroke={isLight ? '#cbd5e1' : '#4d3d6b'}
                    strokeWidth="3"
                  />

                  <path
                    d="M 206,95 Q 230,80 222,102 Q 216,114 228,118"
                    fill="none"
                    stroke={isLight ? '#94a3b8' : '#5b4a7d'}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  <rect
                    x="62"
                    y="145"
                    width="20"
                    height="24"
                    rx="6"
                    fill={isLight ? '#e2e8f0' : '#1e182f'}
                    stroke={isLight ? '#cbd5e1' : '#4d3d6b'}
                    strokeWidth="2.5"
                  />
                  <rect
                    x="158"
                    y="145"
                    width="20"
                    height="24"
                    rx="6"
                    fill={isLight ? '#e2e8f0' : '#1e182f'}
                    stroke={isLight ? '#cbd5e1' : '#4d3d6b'}
                    strokeWidth="2.5"
                  />

                  <rect
                    x="125"
                    y="29"
                    width="30"
                    height="7"
                    rx="3.5"
                    fill={isLight ? '#94a3b8' : '#0d0b17'}
                    stroke={isLight ? '#cbd5e1' : '#6b5494'}
                    strokeWidth="2"
                  />

                  <path
                    d="M 32,95 C 32,54 68,36 120,36 C 172,36 208,54 208,95 C 208,136 172,154 120,154 C 68,154 32,136 32,95 Z"
                    fill={isLight ? '#f8fafc' : '#141022'}
                    stroke="none"
                  />

                  <g clipPath={`url(#pig-cavity-${activeGoal.id})`}>
                    <motion.path
                      d={`M -60,${liquidY} Q -30,${liquidY - 6} 0,${liquidY} T 60,${liquidY} T 120,${liquidY} T 180,${liquidY} T 240,${liquidY} T 300,${liquidY} L 300,180 L -60,180 Z`}
                      animate={{ x: [0, -60] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                      fill={`url(#liquid-grad-${activeGoal.id})`}
                    />

                    <motion.path
                      d={`M -60,${liquidY + 2} Q -30,${liquidY + 7} 0,${liquidY + 2} T 60,${liquidY + 2} T 120,${liquidY + 2} T 180,${liquidY + 2} T 240,${liquidY + 2} T 300,${liquidY + 2} L 300,180 L -60,180 Z`}
                      animate={{ x: [-60, 0] }}
                      transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
                      fill={goalColor}
                      fillOpacity="0.35"
                    />

                    <motion.path
                      d={`M -60,${liquidY} Q -30,${liquidY - 6} 0,${liquidY} T 60,${liquidY} T 120,${liquidY} T 180,${liquidY} T 240,${liquidY} T 300,${liquidY}`}
                      animate={{ x: [0, -60] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                      fill="none"
                      stroke="rgba(255,255,255,0.75)"
                      strokeWidth="2.5"
                    />

                    <motion.circle
                      cx="90"
                      cy="145"
                      r="3"
                      fill="rgba(255,255,255,0.6)"
                      animate={{ y: [0, -65], opacity: [0, 0.8, 0] }}
                      transition={{ duration: 2.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.circle
                      cx="145"
                      cy="150"
                      r="4"
                      fill="rgba(255,255,255,0.5)"
                      animate={{ y: [0, -75], opacity: [0, 0.7, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, delay: 0.9 }}
                    />
                    <motion.circle
                      cx="60"
                      cy="135"
                      r="2.5"
                      fill="rgba(255,255,255,0.6)"
                      animate={{ y: [0, -50], opacity: [0, 0.9, 0] }}
                      transition={{ duration: 2.1, repeat: Infinity, delay: 0.5 }}
                    />
                  </g>

                  <path
                    d="M 32,95 C 32,54 68,36 120,36 C 172,36 208,54 208,95 C 208,136 172,154 120,154 C 68,154 32,136 32,95 Z"
                    fill="none"
                    stroke={goalColor}
                    strokeWidth="3.5"
                  />

                  <rect
                    x="18"
                    y="82"
                    width="22"
                    height="28"
                    rx="9"
                    fill={isLight ? '#ffffff' : '#231b38'}
                    stroke={goalColor}
                    strokeWidth="3"
                  />
                  <circle cx="25" cy="96" r="2.5" fill={goalColor} />
                  <circle cx="33" cy="96" r="2.5" fill={goalColor} />

                  <circle cx="68" cy="74" r="5.5" fill={isLight ? '#0f172a' : '#ffffff'} />
                  <circle cx="66" cy="72" r="2" fill="#ffffff" />

                  <path
                    d="M 55,56 C 80,44 140,44 175,54"
                    fill="none"
                    stroke="url(#glass-edge)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Percentage Badge */}
              <div className="text-center mt-1 z-10">
                <div
                  className="text-2xl sm:text-3xl font-black font-mono tracking-tight"
                  style={{ color: goalColor }}
                >
                  %{goalPercentage} DOLDU
                </div>

                <div className="text-sm font-black font-mono mt-0.5">
                  <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>
                    {formatMoney(activeGoal.currentAmount)}
                  </span>
                  <span className="text-slate-400"> / {formatMoney(activeGoal.targetAmount)}</span>
                </div>

                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Hedefe ulaşmak için{' '}
                  <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>
                    {formatMoney(Math.max(0, activeGoal.targetAmount - activeGoal.currentAmount))}
                  </strong>{' '}
                  kaldı
                </div>
              </div>

              {/* Quick Action Buttons: Para Ekle & Para Çek */}
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs mt-4 z-10">
                <button
                  onClick={() => {
                    setDepositMode('deposit');
                    setIsDepositOpen(true);
                  }}
                  className={`h-10 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
                    isLight
                      ? 'bg-[#4361ee] text-white shadow-[#4361ee]/25'
                      : 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-emerald-500/25'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Kumbara'ya Ekle</span>
                </button>

                <button
                  onClick={() => {
                    setDepositMode('withdraw');
                    setIsDepositOpen(true);
                  }}
                  className={`h-10 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-1.5 border-2 transition-all active:scale-95 ${
                    isLight
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'border-[#3e3455] text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Para Çek</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`text-center py-12 border-2 border-dashed rounded-xl p-6 ${
                isLight ? 'border-slate-300 bg-white' : 'border-[#372d4c] bg-[#141220]'
              }`}
            >
              <PiggyBank className="w-12 h-12 text-cyan-400/40 mx-auto mb-2" />
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Henüz Hedef Kumbaranız Yok
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Yaz tatili, yeni telefon veya acil durum fonu için bir kumbara açın.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 1. TOPLU PORTFÖY GÜNCELLEME MODALI (BULK UPDATE) */}
      <AnimatePresence>
        {isBulkUpdateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkUpdateOpen(false)}
              className="fixed inset-0 bg-black/80"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-md max-h-[85vh] rounded-lg border-2 shadow-2xl p-4 z-10 flex flex-col overflow-hidden ${
                isLight ? 'bg-white border-[#4361ee]/30 text-slate-900' : 'bg-[#181427] border-[#3e3455] text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-black font-mono">Portföy Değerlerini Güncelle</h3>
                    <p className="text-[10px] font-mono text-slate-400">
                      Tüm fon, altın, hisse ve kripto değerlerinizi tek ekranda güncelleyin
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsBulkUpdateOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBulkUpdate} className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {savings.map(item => {
                  const currentVal = item.amount;
                  const inputVal = bulkInputs[item.id] !== undefined ? bulkInputs[item.id] : String(currentVal);
                  const parsed = parseFloat(inputVal.replace(',', '.'));
                  const newNum = !isNaN(parsed) && parsed >= 0 ? parsed : currentVal;
                  const diff = newNum - currentVal;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-md border-2 flex items-center justify-between gap-2 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#120f1e] border-[#372d4c]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black truncate">{item.name}</span>
                          <span className="text-[9px] font-mono text-slate-400">
                            (Eski: {formatMoney(currentVal)})
                          </span>
                        </div>
                        {diff !== 0 && (
                          <div
                            className={`text-[10px] font-mono font-bold mt-0.5 ${
                              diff > 0 ? 'text-emerald-500' : 'text-rose-500'
                            }`}
                          >
                            {diff > 0 ? '+' : ''}
                            {formatMoney(diff)} (%{((diff / Math.max(1, currentVal)) * 100).toFixed(1)})
                          </div>
                        )}
                      </div>

                      <div className="w-32 shrink-0">
                        <input
                          type="number"
                          step="any"
                          value={bulkInputs[item.id] !== undefined ? bulkInputs[item.id] : currentVal}
                          onChange={e =>
                            setBulkInputs(prev => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))
                          }
                          placeholder={String(currentVal)}
                          className={`w-full h-8 px-2.5 rounded-md border text-xs font-mono font-bold text-right focus:outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-[#4361ee]'
                              : 'bg-[#181427] border-[#372d4c] text-slate-100 focus:border-cyan-400'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 sticky bottom-0 bg-inherit flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkUpdateOpen(false)}
                    className="flex-1 h-9 rounded-md border font-mono font-bold text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 h-9 rounded-md font-mono font-bold text-xs shadow-md active:scale-95 ${
                      isLight
                        ? 'bg-gradient-to-r from-[#f72585] to-[#4361ee] text-white shadow-[#4361ee]/20'
                        : 'bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                    }`}
                  >
                    Tüm Değerleri Kaydet 💾
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. CREATE GOAL MODAL */}
      <AnimatePresence>
        {isCreateGoalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateGoalOpen(false)}
              className="fixed inset-0 bg-black/80"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-sm rounded-lg border-2 shadow-2xl p-4 z-10 ${
                isLight ? 'bg-white border-[#4361ee]/30 text-slate-900' : 'bg-[#181427] border-[#3e3455] text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-black font-mono">Yeni Hedef Kumbara Oluştur</h3>
                </div>
                <button onClick={() => setIsCreateGoalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const targetAmt = parseFloat(goalAmountInput);
                  const form = e.currentTarget;
                  const name = (form.elements.namedItem('goalName') as HTMLInputElement).value;
                  const category = (form.elements.namedItem('goalCat') as HTMLSelectElement).value as GoalJar['category'];
                  const color = (form.elements.namedItem('goalColor') as HTMLInputElement).value || '#06b6d4';
                  const note = (form.elements.namedItem('goalNote') as HTMLInputElement).value;

                  if (!name.trim() || isNaN(targetAmt) || targetAmt <= 0) {
                    alert('Lütfen geçerli bir kumbara adı ve hedef tutar giriniz.');
                    return;
                  }
                  handleCreateGoal(name.trim(), targetAmt, category, color, note);
                  setGoalAmountInput('');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                    Kumbara Hedefi / Adı
                  </label>
                  <input
                    name="goalName"
                    type="text"
                    required
                    placeholder="Örn: Yaz Tatili, iPhone 16, Acil Durum Fonu"
                    className={`w-full h-9 px-3 rounded-md border-2 text-xs font-bold focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                    Hedef Tutar (₺)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={goalAmountInput}
                    onChange={e => setGoalAmountInput(e.target.value)}
                    className={`w-full h-10 px-3 rounded-md border-2 text-base font-black font-mono focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-white'
                    }`}
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                    Domuzcuk & Sıvı Rengi
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {GOAL_COLORS.map(c => (
                      <label key={c.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="goalColor"
                          value={c.value}
                          defaultChecked={c.value === '#06b6d4'}
                          className="sr-only peer"
                        />
                        <div
                          className={`w-6 h-6 rounded-full border-2 border-transparent peer-checked:ring-2 peer-checked:ring-white peer-checked:scale-110 transition-all shadow-sm ${c.bg}`}
                          title={c.label}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                      Kategori
                    </label>
                    <select
                      name="goalCat"
                      className={`w-full h-8 px-2 rounded-md border text-xs font-medium focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-slate-100'
                      }`}
                    >
                      <option value="Tatil">🌴 Tatil</option>
                      <option value="Teknoloji">📱 Teknoloji</option>
                      <option value="Acil Durum">🛡️ Acil Durum</option>
                      <option value="Araba">🚗 Araba</option>
                      <option value="Ev">🏠 Ev</option>
                      <option value="Kişisel">✨ Kişisel</option>
                      <option value="Diğer">📦 Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                      Kısa Not (İsteğe Bağlı)
                    </label>
                    <input
                      name="goalNote"
                      type="text"
                      placeholder="Örn: 6 ay sonra"
                      className={`w-full h-8 px-2.5 rounded-md border text-xs focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateGoalOpen(false)}
                    className="flex-1 h-9 rounded-md border font-mono font-bold text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 h-9 rounded-md font-mono font-bold text-xs shadow-md active:scale-95 ${
                      isLight ? 'bg-[#4361ee] text-white' : 'bg-cyan-400 text-slate-950'
                    }`}
                  >
                    Kumbarayı Aç
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. EDIT GOAL MODAL */}
      <AnimatePresence>
        {isEditGoalOpen && activeGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditGoalOpen(false)}
              className="fixed inset-0 bg-black/80"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-sm rounded-lg border-2 shadow-2xl p-4 z-10 ${
                isLight ? 'bg-white border-[#4361ee]/30 text-slate-900' : 'bg-[#181427] border-[#3e3455] text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-black font-mono">Kumbarayı Düzenle</h3>
                </div>
                <button onClick={() => setIsEditGoalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGoalEdit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                    Kumbara Hedefi / Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={editGoalName}
                    onChange={e => setEditGoalName(e.target.value)}
                    placeholder="Örn: Yeni Telefon, Yaz Tatili"
                    className={`w-full h-9 px-3 rounded-md border-2 text-xs font-bold focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                    Hedef Fiyat / Tutar (₺)
                  </label>
                  <input
                    type="number"
                    required
                    value={editGoalTarget}
                    onChange={e => setEditGoalTarget(e.target.value)}
                    placeholder="0"
                    className={`w-full h-10 px-3 rounded-md border-2 text-base font-black font-mono focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-white'
                    }`}
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                    Domuzcuk & Sıvı Rengi
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {GOAL_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setEditGoalColor(c.value)}
                        className={`w-6 h-6 rounded-full border-2 transition-all shadow-sm ${c.bg} ${
                          editGoalColor === c.value
                            ? 'ring-2 ring-white scale-110 border-white'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                      Kategori
                    </label>
                    <select
                      value={editGoalCategory}
                      onChange={e => setEditGoalCategory(e.target.value as GoalJar['category'])}
                      className={`w-full h-8 px-2 rounded-md border text-xs font-medium focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-slate-100'
                      }`}
                    >
                      <option value="Tatil">🌴 Tatil</option>
                      <option value="Teknoloji">📱 Teknoloji</option>
                      <option value="Acil Durum">🛡️ Acil Durum</option>
                      <option value="Araba">🚗 Araba</option>
                      <option value="Ev">🏠 Ev</option>
                      <option value="Kişisel">✨ Kişisel</option>
                      <option value="Diğer">📦 Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                      Kısa Not
                    </label>
                    <input
                      type="text"
                      value={editGoalNote}
                      onChange={e => setEditGoalNote(e.target.value)}
                      placeholder="Örn: Fiyat güncellendi"
                      className={`w-full h-8 px-2.5 rounded-md border text-xs focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditGoalOpen(false)}
                    className="flex-1 h-9 rounded-md border font-mono font-bold text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 h-9 rounded-md font-mono font-bold text-xs shadow-md active:scale-95 ${
                      isLight ? 'bg-[#4361ee] text-white' : 'bg-cyan-400 text-slate-950'
                    }`}
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. DEPOSIT / WITHDRAW MODAL */}
      <AnimatePresence>
        {isDepositOpen && activeGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDepositOpen(false)}
              className="fixed inset-0 bg-black/80"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-sm rounded-lg border-2 shadow-2xl p-4 z-10 ${
                isLight ? 'bg-white border-[#4361ee]/30 text-slate-900' : 'bg-[#181427] border-[#3e3455] text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-black font-mono">
                    {depositMode === 'deposit' ? 'Kumbaraya Para Ekle' : 'Kumbaradan Para Çek'}
                  </h3>
                </div>
                <button onClick={() => setIsDepositOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-3 p-2 rounded-md bg-white/5 border border-white/10 text-xs font-mono">
                <div className="text-slate-400">Hedef: {activeGoal.name}</div>
                <div className="font-bold text-cyan-400">
                  Mevcut: {formatMoney(activeGoal.currentAmount)} / {formatMoney(activeGoal.targetAmount)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[500, 1000, 2500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setGoalAmountInput(String(val))}
                    className="py-1 rounded border text-xs font-mono font-bold bg-white/5 hover:bg-white/10 border-white/10"
                  >
                    +{formatMoney(val)}
                  </button>
                ))}
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const val = parseFloat(goalAmountInput);
                  if (isNaN(val) || val <= 0) {
                    alert('Lütfen geçerli bir tutar giriniz.');
                    return;
                  }
                  handleDepositWithdrawGoal(val, depositMode);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[10px] font-black font-mono uppercase tracking-wider mb-1 text-slate-400">
                    {depositMode === 'deposit' ? 'Eklenecek Tutar (₺)' : 'Çekilecek Tutar (₺)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    autoFocus
                    required
                    placeholder="0"
                    value={goalAmountInput}
                    onChange={e => setGoalAmountInput(e.target.value)}
                    className={`w-full h-11 px-3 rounded-md border-2 text-xl font-black font-mono focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#120f1e] border-[#372d4c] text-white'
                    }`}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDepositOpen(false)}
                    className="flex-1 h-9 rounded-md border font-mono font-bold text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 h-9 rounded-md font-mono font-bold text-xs shadow-md active:scale-95 ${
                      depositMode === 'deposit'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-rose-500 text-white font-black'
                    }`}
                  >
                    {depositMode === 'deposit' ? '💰 Kumbaraya At' : '💸 Çek'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* --- ADD SAVINGS ASSET MODAL --- */
interface AddSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<SavingsItem, 'id'>) => void;
  isLight: boolean;
}

export const AddSavingsModal: React.FC<AddSavingsModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLight
}) => {
  const [type, setType] = useState<SavingsCategoryType>('fon');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || isNaN(amt) || amt < 0) {
      return;
    }
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const now = Date.now();

    onAdd({
      type,
      name: name.trim(),
      amount: amt,
      initialAmount: amt,
      note: note.trim() || undefined,
      updatedAt: dateStr,
      lastUpdatedTimestamp: now,
      history: [{ date: dateStr, timestamp: now, amount: amt }]
    });
    setName('');
    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className={`relative w-full max-w-sm sm:max-w-md max-h-[85vh] rounded-lg border-2 shadow-2xl p-4 z-10 flex flex-col overflow-y-auto ${
          isLight
            ? 'bg-white border-[#4361ee]/30 text-slate-900 shadow-slate-400/25'
            : 'bg-[#181427] border-[#3e3455] text-slate-100 shadow-black'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-2.5 mb-2.5 border-b ${
            isLight ? 'border-slate-200' : 'border-white/[0.08]'
          }`}
        >
          <h3
            className={`text-sm font-black font-mono tracking-tight ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}
          >
            Yeni Birikim / Varlık Ekle
          </h3>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${
              isLight
                ? 'border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'border-[#3e3455] text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label
              className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              Varlık Türü
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SAVINGS_CATEGORIES.map(cat => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => setType(cat.type)}
                  className={`p-1.5 rounded-md text-left border-2 text-[11px] font-mono font-bold transition-all ${
                    type === cat.type
                      ? isLight
                        ? 'bg-[#4361ee]/15 border-[#4361ee] text-[#4361ee]'
                        : 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      : 'bg-[#120f1e] border-[#372d4c] text-slate-400 hover:border-[#524470]'
                  }`}
                >
                  <div className="truncate">{cat.label.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              Varlık Adı
            </label>
            <input
              type="text"
              required
              placeholder="Örn: TI2 Fonu, 24 Ayar Gram Altın, THYAO..."
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full h-9 px-3 rounded-md border-2 text-xs font-bold focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                  : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              Güncel Değer (₺)
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`w-full h-10 px-3 rounded-md border-2 text-base font-black font-mono focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                  : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              Hedef / Not (İsteğe bağlı)
            </label>
            <input
              type="text"
              placeholder="Örn: Acil durum, Emeklilik, Ev peşinatı..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className={`w-full h-9 px-3 rounded-md border-2 text-xs font-medium focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                  : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
              }`}
            />
          </div>

          <div className="flex gap-2 pt-1.5">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 h-9 rounded-md border-2 font-mono font-bold text-xs transition-colors ${
                isLight
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-[#3e3455] text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              İptal
            </button>
            <button
              type="submit"
              className={`flex-1 h-9 rounded-md font-mono font-bold text-xs shadow-md active:scale-98 transition-all ${
                isLight
                  ? 'bg-gradient-to-r from-[#f72585] to-[#4361ee] text-white shadow-[#4361ee]/20'
                  : 'bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              Varlığı Ekle
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
