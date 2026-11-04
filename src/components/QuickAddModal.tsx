import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MonthData, Category, CategoryItem, IncomeItem, formatMoney } from '../types';
import {
  X,
  Plus,
  Zap,
  Tag,
  Calendar,
  Check,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: MonthData | null;
  onConfirm: (
    type: 'expense' | 'income',
    catId: string,
    itemId: string,
    amount: number,
    desc: string,
    dateStr?: string,
    newItemName?: string
  ) => void;
  isLight?: boolean;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  onConfirm,
  isLight = false
}) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [customItemMode, setCustomItemMode] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>('');

  // Today's formatted date string (DD/MM)
  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  }, []);

  const [date, setDate] = useState<string>(todayStr);

  // Available categories for currentMonth
  const categories = useMemo(() => {
    return currentMonth?.categories || [];
  }, [currentMonth]);

  // Available incomes for currentMonth
  const incomes = useMemo(() => {
    return currentMonth?.incomes || [];
  }, [currentMonth]);

  // Selected Category
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCatId);
  }, [categories, selectedCatId]);

  // Sub-items for selected category
  const subItems = useMemo(() => {
    if (!selectedCategory) return [];
    return selectedCategory.items || [];
  }, [selectedCategory]);

  // Reset or initialize when modal opens or type changes
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDesc('');
      setCustomItemMode(false);
      setCustomItemName('');
      setDate(todayStr);

      if (type === 'expense') {
        // Auto select first non-empty category or first category
        if (categories.length > 0 && !selectedCatId) {
          const firstCat = categories[0];
          setSelectedCatId(firstCat.id);
          if (firstCat.items && firstCat.items.length > 0) {
            setSelectedItemId(firstCat.items[0].id);
          } else {
            setSelectedItemId('');
          }
        }
      } else {
        // Incomes
        if (incomes.length > 0) {
          setSelectedItemId(incomes[0].id);
        } else {
          setSelectedItemId('');
        }
      }
    }
  }, [isOpen, type, categories, incomes, todayStr]);

  // When selected category changes in expense mode, auto-select its first item if current item not in it
  const handleSelectCategory = (catId: string) => {
    setSelectedCatId(catId);
    setCustomItemMode(false);
    setCustomItemName('');
    const targetCat = categories.find(c => c.id === catId);
    if (targetCat && targetCat.items && targetCat.items.length > 0) {
      setSelectedItemId(targetCat.items[0].id);
    } else {
      setSelectedItemId('');
    }
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Preset quick amount add
  const handleAddAmountPreset = (addVal: number) => {
    const currentVal = parseFloat(amount.replace(',', '.')) || 0;
    setAmount((currentVal + addVal).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      alert('Lütfen geçerli bir tutar giriniz.');
      return;
    }

    if (type === 'expense') {
      if (!selectedCatId) {
        alert('Lütfen bir ana kalem seçiniz.');
        return;
      }
      if (!selectedItemId && !customItemMode) {
        alert('Lütfen bir alt kalem seçiniz.');
        return;
      }
      if (customItemMode && !customItemName.trim()) {
        alert('Lütfen yeni alt kalemin adını yazınız.');
        return;
      }

      onConfirm(
        'expense',
        selectedCatId,
        customItemMode ? '' : selectedItemId,
        val,
        desc.trim(),
        date,
        customItemMode ? customItemName.trim() : undefined
      );
    } else {
      // Income
      if (!selectedItemId && !customItemMode) {
        alert('Lütfen bir gelir kalemi seçiniz.');
        return;
      }
      if (customItemMode && !customItemName.trim()) {
        alert('Lütfen yeni gelir kaleminin adını yazınız.');
        return;
      }

      onConfirm(
        'income',
        '',
        customItemMode ? '' : selectedItemId,
        val,
        desc.trim(),
        date,
        customItemMode ? customItemName.trim() : undefined
      );
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative w-full max-w-sm sm:max-w-md max-h-[90vh] flex flex-col rounded-xl border-2 shadow-2xl overflow-hidden z-10 ${
              isLight
                ? 'bg-white border-cyan-400/40 text-slate-900 shadow-cyan-900/10'
                : 'bg-[#151322] border-cyan-500/30 text-slate-100 shadow-black'
            }`}
          >
            {/* Top Accent Strip with vibrant cyan */}
            <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" />

            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3.5 border-b shrink-0 ${
                isLight ? 'border-slate-200 bg-slate-50/60' : 'border-white/[0.08] bg-[#1a172a]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                    isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className={`text-sm font-black font-mono tracking-tight flex items-center gap-1.5 ${
                      isLight ? 'text-slate-900' : 'text-slate-100'
                    }`}
                  >
                    Hızlı Giriş
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-400 text-slate-950">
                      HIZLI
                    </span>
                  </h3>
                  <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {currentMonth ? `${currentMonth.name} bütçesi` : 'Bu ay'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    : 'border-[#3e3455] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
              {/* Type Switcher: Harcama (Gider) / Gelir */}
              <div
                className={`grid grid-cols-2 p-1 rounded-lg border ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#1a172a] border-[#2e2642]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setCustomItemMode(false);
                  }}
                  className={`py-1.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Gider / Harcama
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCustomItemMode(false);
                  }}
                  className={`py-1.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Gelir
                </button>
              </div>

              {/* STEP 1: ANA KALEMLER */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className={`text-[10px] font-black font-mono uppercase tracking-wider flex items-center gap-1 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    <Layers className="w-3 h-3 text-cyan-400" />
                    1. Bu Ayki Ana Kalemler
                  </label>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {type === 'expense' ? `${categories.length} kategori` : `${incomes.length} kalem`}
                  </span>
                </div>

                {type === 'expense' ? (
                  categories.length === 0 ? (
                    <div
                      className={`p-3 rounded-lg border text-center text-xs font-mono ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#181427] border-[#2e2642] text-slate-400'
                      }`}
                    >
                      Bu ayda henüz ana kategori bulunmuyor.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {categories.map(cat => {
                        const isSelected = selectedCatId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleSelectCategory(cat.id)}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all text-left flex items-center gap-1.5 border cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                                : isLight
                                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                                : 'bg-[#1a172a] hover:bg-[#231f38] border-[#2e2642] text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span>{cat.name}</span>
                            <span
                              className={`text-[9px] px-1 rounded ${
                                isSelected
                                  ? 'bg-cyan-400/20 text-cyan-300'
                                  : isLight
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-white/10 text-slate-400'
                              }`}
                            >
                              {cat.items?.length || 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Income main items */
                  <div
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                      isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Gelirler kategorisi otomatik seçildi</span>
                  </div>
                )}
              </div>

              {/* STEP 2: ALT KALEMLER */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className={`text-[10px] font-black font-mono uppercase tracking-wider flex items-center gap-1 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    <Tag className="w-3 h-3 text-cyan-400" />
                    2. Alt Kalemi Seçin
                  </label>
                  {type === 'expense' && selectedCategory && (
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                      {selectedCategory.name}
                    </span>
                  )}
                </div>

                {type === 'expense' ? (
                  !selectedCategory ? (
                    <div
                      className={`p-3 rounded-lg border text-center text-xs font-mono ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-[#181427] border-[#2e2642] text-slate-500'
                      }`}
                    >
                      Lütfen önce yukarıdan bir ana kategori seçin.
                    </div>
                  ) : subItems.length === 0 && !customItemMode ? (
                    <div
                      className={`p-3 rounded-lg border text-center text-xs font-mono space-y-2 ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#181427] border-[#2e2642] text-slate-400'
                      }`}
                    >
                      <p>Bu ana kalemde henüz alt kalem bulunmuyor.</p>
                      <button
                        type="button"
                        onClick={() => setCustomItemMode(true)}
                        className="px-3 py-1 bg-cyan-400 text-slate-950 rounded text-xs font-bold font-mono hover:bg-cyan-300 transition-colors"
                      >
                        + Yeni Alt Kalem Yaz
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {subItems.map(item => {
                          const isSelected = !customItemMode && selectedItemId === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setCustomItemMode(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm font-black'
                                  : isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                                  : 'bg-[#1e1b30] hover:bg-[#282440] border-[#372f4e] text-slate-200'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              <span>{item.name}</span>
                            </button>
                          );
                        })}

                        {/* Button to type custom new sub-item if not listed */}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomItemMode(!customItemMode);
                            if (!customItemMode) setSelectedItemId('');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border border-dashed transition-all cursor-pointer ${
                            customItemMode
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                              : isLight
                              ? 'border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                              : 'border-[#43395c] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          }`}
                        >
                          + Farklı Alt Kalem
                        </button>
                      </div>

                      {customItemMode && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-1"
                        >
                          <input
                            type="text"
                            autoFocus
                            placeholder="Yeni alt kalem adı yazın..."
                            value={customItemName}
                            onChange={e => setCustomItemName(e.target.value)}
                            className={`w-full h-9 px-3 rounded-md border-2 text-xs font-mono focus:outline-none transition-all ${
                              isLight
                                ? 'bg-white border-cyan-500 text-slate-900 placeholder:text-slate-400'
                                : 'bg-[#120f1e] border-cyan-400 text-slate-100 placeholder:text-slate-600'
                            }`}
                          />
                        </motion.div>
                      )}
                    </div>
                  )
                ) : (
                  /* Income sub-items */
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {incomes.map(item => {
                        const isSelected = !customItemMode && selectedItemId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setCustomItemMode(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm font-black'
                                : isLight
                                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                                : 'bg-[#1e1b30] hover:bg-[#282440] border-[#372f4e] text-slate-200'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{item.name}</span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setCustomItemMode(!customItemMode);
                          if (!customItemMode) setSelectedItemId('');
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border border-dashed transition-all cursor-pointer ${
                          customItemMode
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                            : isLight
                            ? 'border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            : 'border-[#43395c] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        + Farklı Gelir Kalemi
                      </button>
                    </div>

                    {customItemMode && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-1"
                      >
                        <input
                          type="text"
                          autoFocus
                          placeholder="Yeni gelir kalemi adı yazın..."
                          value={customItemName}
                          onChange={e => setCustomItemName(e.target.value)}
                          className={`w-full h-9 px-3 rounded-md border-2 text-xs font-mono focus:outline-none transition-all ${
                            isLight
                              ? 'bg-white border-emerald-500 text-slate-900 placeholder:text-slate-400'
                              : 'bg-[#120f1e] border-emerald-400 text-slate-100 placeholder:text-slate-600'
                          }`}
                        />
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 3: TUTAR */}
              <div>
                <label
                  className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  3. Tutar (₺)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className={`w-full h-12 pl-3.5 pr-11 rounded-lg border-2 text-2xl font-black font-mono focus:outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                        : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-600 focus:border-cyan-400'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-xl text-cyan-400">
                    ₺
                  </span>
                </div>

                {/* Quick Add Presets */}
                <div className="flex gap-1.5 mt-2">
                  {[50, 100, 250, 500, 1000].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddAmountPreset(preset)}
                      className={`flex-1 py-1 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-[#1c182c] hover:bg-[#25203b] border-[#362e49] text-slate-300'
                      }`}
                    >
                      +{preset >= 1000 ? `${preset / 1000}b` : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 4: AÇIKLAMA (ALTINA DA AÇIKLAMA GİRSİN) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className={`text-[10px] font-black font-mono uppercase tracking-wider ${
                      isLight ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    4. Açıklama (İsteğe Bağlı)
                  </label>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tarih: {date}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Örn: Market fişi, restoran hesabı, kahve vb."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className={`w-full h-10 px-3 rounded-lg border-2 text-xs font-medium focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                      : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-600 focus:border-cyan-400'
                  }`}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 h-11 rounded-lg border-2 font-mono font-bold text-xs transition-colors cursor-pointer ${
                    isLight
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'border-[#3e3455] text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!amount || parseFloat(amount) <= 0 || (!selectedItemId && !customItemName.trim())}
                  className={`flex-[2] h-11 rounded-lg font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !amount || parseFloat(amount) <= 0 || (!selectedItemId && !customItemName.trim())
                      ? 'bg-slate-700/50 text-slate-400 border border-slate-600/40 cursor-not-allowed opacity-50'
                      : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_4px_20px_rgba(34,211,238,0.4)] active:scale-98'
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Hızlı Kaydet</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
