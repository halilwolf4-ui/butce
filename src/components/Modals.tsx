import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Debt, RecurringItem, formatMoney } from '../types';
import {
  X,
  CreditCard,
  Repeat,
  Plus,
  Trash2,
  ChevronDown,
  Tv,
  Calendar,
  Sparkles,
  Clock,
  Music,
  Wifi,
  Home,
  Dumbbell,
  Tag
} from 'lucide-react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLight?: boolean;
}

export const BottomSheetModal: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  isLight = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
            className="fixed inset-0 bg-black/80"
          />

          {/* Centered Modal Container - Sharp & Compact (Does not cover full screen) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`relative w-full max-w-sm sm:max-w-md max-h-[85vh] flex flex-col rounded-lg border-2 shadow-2xl overflow-hidden z-10 ${
              isLight
                ? 'bg-white border-[#4361ee]/30 text-slate-900 shadow-slate-400/25'
                : 'bg-[#181427] border-[#3e3455] text-slate-100 shadow-black'
            }`}
          >
            {/* Top Accent Strip */}
            <div
              className={`h-1 w-full shrink-0 ${
                isLight
                  ? 'bg-gradient-to-r from-[#f72585] via-[#7209b7] to-[#4361ee]'
                  : 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-[#7209b7]'
              }`}
            />

            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                isLight ? 'border-slate-200' : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2">
                {icon && (
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${
                      isLight ? 'bg-[#4361ee]/10 text-[#4361ee]' : 'bg-cyan-500/10 text-cyan-400'
                    }`}
                  >
                    {icon}
                  </div>
                )}
                <div>
                  <h3
                    className={`text-sm font-black font-mono tracking-tight leading-tight ${
                      isLight ? 'text-slate-900' : 'text-slate-100'
                    }`}
                  >
                    {title}
                  </h3>
                  {subtitle && (
                    <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
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

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* --- 1. TRANSACTION MODAL --- */
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onConfirm: (amount: number, desc: string) => void;
  isLight?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  title,
  onConfirm,
  isLight = false
}) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDesc('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      alert('Lütfen geçerli bir tutar giriniz.');
      return;
    }
    onConfirm(val, desc.trim() || 'İşlem');
    onClose();
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${title} Ekle`}
      subtitle="Bu kaleme yeni tutar ekleyin"
      icon={<Plus className="w-4 h-4" />}
      isLight={isLight}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            Tutar (₺)
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              autoFocus
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`w-full h-11 pl-3 pr-10 rounded-md border-2 text-xl font-black font-mono focus:outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                  : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-600 focus:border-cyan-400'
              }`}
            />
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-base ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              ₺
            </span>
          </div>
        </div>

        <div>
          <label
            className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            Açıklama (İsteğe bağlı)
          </label>
          <input
            type="text"
            placeholder="Örn: Hafta Sonu Alışverişi, Fatura vb."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className={`w-full h-10 px-3 rounded-md border-2 text-xs font-medium focus:outline-none transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-600 focus:border-cyan-400'
            }`}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 h-10 rounded-md border-2 font-mono font-bold text-xs transition-colors ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-[#3e3455] text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            İptal
          </button>
          <button
            type="submit"
            className={`flex-1 h-10 rounded-md font-mono font-bold text-xs shadow-md active:scale-[0.98] transition-all ${
              isLight
                ? 'bg-gradient-to-r from-[#f72585] via-[#7209b7] to-[#4361ee] text-white shadow-[#4361ee]/25'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-cyan-500/25'
            }`}
          >
            Ekle
          </button>
        </div>
      </form>
    </BottomSheetModal>
  );
};

/* --- 2. DEBT MANAGER MODAL --- */
interface DebtManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts: Debt[];
  onAddDebt: (name: string, totalAmount: number, installments: number) => void;
  onDeleteDebt: (debtId: string) => void;
  isLight?: boolean;
}

export const DebtManagerModal: React.FC<DebtManagerModalProps> = ({
  isOpen,
  onClose,
  debts,
  onAddDebt,
  onDeleteDebt,
  isLight = false
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('');

  const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(amount);
    const inst = parseInt(installments, 10);
    if (!name.trim() || isNaN(tot) || tot <= 0 || isNaN(inst) || inst <= 0) {
      alert('Lütfen tüm alanları geçerli şekilde doldurun.');
      return;
    }
    onAddDebt(name.trim(), tot, inst);
    setName('');
    setAmount('');
    setInstallments('');
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Borç Yönetimi"
      subtitle={`Toplam Borç: ${formatMoney(totalRemaining)}`}
      icon={<CreditCard className="w-4 h-4 text-rose-400" />}
      isLight={isLight}
    >
      <div className="space-y-3">
        {/* Existing Debts List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {debts.length === 0 ? (
            <div
              className={`text-center py-4 border-2 border-dashed rounded-md p-3 ${
                isLight ? 'border-slate-300 bg-slate-50' : 'border-[#372d4c] bg-[#120f1e]'
              }`}
            >
              <p className={`text-xs font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Kayıtlı borcunuz bulunmuyor.
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                Aşağıdaki formu kullanarak yeni borç ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            debts.map(d => (
              <div
                key={d.id}
                className={`p-2.5 rounded-md border-2 flex items-center justify-between gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#120f1e] border-[#372d4c]'
                }`}
              >
                <div className="min-w-0">
                  <h4 className={`text-xs font-black truncate ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    {d.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span>Aylık: {formatMoney(d.installmentAmount)}</span>
                    <span>·</span>
                    <span>{d.installments} Taksit</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-black font-mono text-rose-500">
                      {formatMoney(d.remainingAmount)}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      / {formatMoney(d.totalAmount)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`"${d.name}" borcunu silmek istediğinize emin misiniz?`)) {
                        onDeleteDebt(d.id);
                      }
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Borcu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Debt Form - Sharp */}
        <form
          onSubmit={handleAdd}
          className={`p-3 rounded-md border-2 space-y-2.5 ${
            isLight
              ? 'bg-[#f8f9fe] border-[#4361ee]/20'
              : 'bg-[#141220] border-[#372d4c]'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-xs font-black font-mono uppercase tracking-wider ${
              isLight ? 'text-[#4361ee]' : 'text-cyan-400'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Borç Ekle</span>
          </div>

          <input
            type="text"
            placeholder="Borç Adı (Örn: Kredi Kartı, Telefon Kredisi)"
            value={name}
            onChange={e => setName(e.target.value)}
            className={`w-full h-9 px-3 rounded-md border-2 text-xs font-bold focus:outline-none ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
            }`}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Toplam Borç (₺)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`w-full h-9 px-3 rounded-md border-2 text-xs font-mono font-bold focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                  : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
              }`}
            />
            <input
              type="number"
              placeholder="Taksit Sayısı (Ay)"
              value={installments}
              onChange={e => setInstallments(e.target.value)}
              className={`w-full h-9 px-3 rounded-md border-2 text-xs font-mono font-bold focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                  : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
              }`}
            />
          </div>

          <button
            type="submit"
            className={`w-full h-9 rounded-md font-mono font-bold text-xs shadow-sm active:scale-[0.98] transition-all ${
              isLight
                ? 'bg-[#4361ee] text-white shadow-[#4361ee]/25'
                : 'bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            Borcu Kaydet
          </button>
        </form>
      </div>
    </BottomSheetModal>
  );
};

/* --- 3. PAY DEBT MODAL --- */
interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts: Debt[];
  onConfirmPay: (debtId: string, amount: number) => void;
  isLight?: boolean;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  isOpen,
  onClose,
  debts,
  onConfirmPay,
  isLight = false
}) => {
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [payAmount, setPayAmount] = useState('');

  const activeDebts = debts.filter(d => d.remainingAmount > 0);

  useEffect(() => {
    if (isOpen) {
      if (activeDebts.length > 0) {
        setSelectedDebtId(activeDebts[0].id);
        setPayAmount(String(activeDebts[0].installmentAmount));
      } else {
        setSelectedDebtId('');
        setPayAmount('');
      }
    }
  }, [isOpen]);

  const handleDebtChange = (id: string) => {
    setSelectedDebtId(id);
    const d = activeDebts.find(item => item.id === id);
    if (d) {
      setPayAmount(String(d.installmentAmount));
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!selectedDebtId || isNaN(amt) || amt <= 0) {
      alert('Lütfen borç seçin ve geçerli bir tutar girin.');
      return;
    }
    onConfirmPay(selectedDebtId, amt);
    onClose();
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Borç Öde"
      subtitle="Mevcut borcunuzdan taksit düşün"
      icon={<CreditCard className="w-4 h-4 text-rose-500" />}
      isLight={isLight}
    >
      {activeDebts.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <p className={`text-xs font-bold font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
            Ödenecek aktif borcunuz bulunmuyor!
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            Genel Bakış veya Ayarlar menüsünden yeni bir borç tanımlayabilirsiniz.
          </p>
          <button
            onClick={onClose}
            className={`mt-2 px-4 py-1.5 rounded-md text-xs font-mono font-bold border ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white/[0.08] border-white/[0.1] text-slate-300'
            }`}
          >
            Kapat
          </button>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-3">
          <div>
            <label
              className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              Hangi Borcu Ödüyorsunuz?
            </label>
            <div className="relative">
              <select
                value={selectedDebtId}
                onChange={e => handleDebtChange(e.target.value)}
                className={`w-full h-10 px-3 pr-8 rounded-md border-2 text-xs font-mono font-bold appearance-none focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-400'
                    : 'bg-[#120f1e] border-[#372d4c] text-slate-100 focus:border-rose-400'
                }`}
              >
                {activeDebts.map(d => (
                  <option key={d.id} value={d.id} className={isLight ? 'bg-white text-slate-900' : 'bg-[#181427] text-white'}>
                    {d.name} — Kalan: {formatMoney(d.remainingAmount)} (Taksit: {formatMoney(d.installmentAmount)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              className={`block text-[10px] font-black font-mono uppercase tracking-wider mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              Ödenecek Tutar (₺)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className={`w-full h-11 pl-3 pr-10 rounded-md border-2 text-xl font-black font-mono text-rose-500 focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 focus:border-rose-500'
                    : 'bg-[#120f1e] border-[#372d4c] focus:border-rose-500'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-base">
                ₺
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              Ödeme yapıldığında bu ayın bütçesine eklenir ve kalan borçtan düşülür.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 h-10 rounded-md border-2 font-mono font-bold text-xs transition-colors ${
                isLight
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-[#3e3455] text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-md bg-gradient-to-r from-rose-500 to-pink-500 text-white font-mono font-bold text-xs shadow-md shadow-rose-500/25 active:scale-[0.98] transition-all"
            >
              Borcu Öde
            </button>
          </div>
        </form>
      )}
    </BottomSheetModal>
  );
};

/* --- 4. RECURRING MANAGER & SUBSCRIPTION HUB MODAL --- */
interface RecurringManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurring: RecurringItem[];
  onAddRecurring: (
    type: 'income' | 'expense',
    name: string,
    amount: number,
    paymentDay?: number,
    isSubscription?: boolean,
    categoryTag?: string
  ) => void;
  onDeleteRecurring: (id: string) => void;
  isLight?: boolean;
}

const CATEGORY_PRESETS = [
  'Dizi/Film',
  'Müzik',
  'İnternet',
  'Kira',
  'Aidat',
  'Spor/Gym',
  'Yazılım',
  'Maaş',
  'Diğer'
];

export const RecurringManagerModal: React.FC<RecurringManagerModalProps> = ({
  isOpen,
  onClose,
  recurring,
  onAddRecurring,
  onDeleteRecurring,
  isLight = false
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState<string>('15');
  const [isSubscription, setIsSubscription] = useState<boolean>(false);
  const [categoryTag, setCategoryTag] = useState<string>('Dizi/Film');
  const [activeFilter, setActiveFilter] = useState<'all' | 'subscriptions' | 'fixed_expenses' | 'incomes'>('all');

  // Stats
  const { totalSubscriptions, totalExpenses, totalIncomes, subCount, expCount } = useMemo(() => {
    let subTot = 0;
    let subC = 0;
    let expTot = 0;
    let expC = 0;
    let incTot = 0;

    recurring.forEach(item => {
      if (item.type === 'expense') {
        expTot += item.amount;
        expC++;
        if (item.isSubscription) {
          subTot += item.amount;
          subC++;
        }
      } else {
        incTot += item.amount;
      }
    });

    return {
      totalSubscriptions: subTot,
      totalExpenses: expTot,
      totalIncomes: incTot,
      subCount: subC,
      expCount: expC
    };
  }, [recurring]);

  // Filtered and sorted by payment day
  const filteredItems = useMemo(() => {
    return recurring
      .filter(item => {
        if (activeFilter === 'subscriptions') return item.type === 'expense' && item.isSubscription;
        if (activeFilter === 'fixed_expenses') return item.type === 'expense' && !item.isSubscription;
        if (activeFilter === 'incomes') return item.type === 'income';
        return true;
      })
      .sort((a, b) => (a.paymentDay || 1) - (b.paymentDay || 1));
  }, [recurring, activeFilter]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    const day = parseInt(paymentDay, 10);
    if (!name.trim() || isNaN(amt) || amt <= 0) {
      alert('Lütfen geçerli bir isim ve tutar giriniz.');
      return;
    }
    const safeDay = !isNaN(day) && day >= 1 && day <= 31 ? day : 1;

    onAddRecurring(
      type,
      name.trim(),
      amt,
      safeDay,
      type === 'expense' ? isSubscription : false,
      type === 'expense' ? categoryTag : 'Maaş'
    );

    setName('');
    setAmount('');
    setIsSubscription(false);
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Abonelik & Sabit Fatura Takvimi"
      subtitle="Tekrarlayan gelir, kira, fatura ve dijital abonelikleriniz"
      icon={<Tv className="w-4 h-4 text-cyan-400" />}
      isLight={isLight}
    >
      <div className="space-y-3.5">
        {/* Subscription Hub Banner - Modern Highlight */}
        <div
          className={`p-3 rounded-lg border-2 relative overflow-hidden transition-all ${
            isLight
              ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-[#4361ee]/30 text-slate-800 shadow-sm'
              : 'bg-gradient-to-r from-[#181427] via-[#1c1432] to-[#120f1e] border-[#4b3c6e] text-slate-100 shadow-md'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono font-black uppercase tracking-wider text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aylık Sabit Yük Analizi</span>
          </div>

          <p className="text-xs font-bold leading-snug">
            Bu ay toplam <span className="text-rose-500 font-black">{expCount} adet</span> sabit ödemeye{' '}
            <span className="text-rose-500 font-black font-mono">{formatMoney(totalExpenses)}</span> ödüyorsun.
            {subCount > 0 && (
              <span className={`block text-[11px] mt-0.5 font-normal ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Bunun <strong className={isLight ? 'text-[#7209b7]' : 'text-cyan-300'}>{formatMoney(totalSubscriptions)}</strong> tutarı ({subCount} adet) Netflix, Spotify vb. aboneliklerden oluşuyor.
              </span>
            )}
          </p>

          {/* Mini Stat Pills */}
          <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-white/10 text-center">
            <div className={`p-1.5 rounded-md ${isLight ? 'bg-white/80' : 'bg-black/30'}`}>
              <div className="text-[9px] font-mono text-slate-400">Abonelikler</div>
              <div className="text-xs font-black font-mono text-cyan-400">{formatMoney(totalSubscriptions)}</div>
            </div>
            <div className={`p-1.5 rounded-md ${isLight ? 'bg-white/80' : 'bg-black/30'}`}>
              <div className="text-[9px] font-mono text-slate-400">Sabit Gider</div>
              <div className="text-xs font-black font-mono text-rose-400">{formatMoney(totalExpenses)}</div>
            </div>
            <div className={`p-1.5 rounded-md ${isLight ? 'bg-white/80' : 'bg-black/30'}`}>
              <div className="text-[9px] font-mono text-slate-400">Sabit Gelir</div>
              <div className="text-xs font-black font-mono text-emerald-400">{formatMoney(totalIncomes)}</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-mono font-bold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 border ${
              activeFilter === 'all'
                ? isLight ? 'bg-[#4361ee] text-white border-[#4361ee]' : 'bg-cyan-500 text-slate-950 border-cyan-400'
                : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#141220] text-slate-400 border-[#372d4c]'
            }`}
          >
            Tümü ({recurring.length})
          </button>
          <button
            onClick={() => setActiveFilter('subscriptions')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 border flex items-center gap-1 ${
              activeFilter === 'subscriptions'
                ? isLight ? 'bg-[#7209b7] text-white border-[#7209b7]' : 'bg-purple-500 text-white border-purple-400'
                : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#141220] text-slate-400 border-[#372d4c]'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>Abonelikler ({subCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('fixed_expenses')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 border flex items-center gap-1 ${
              activeFilter === 'fixed_expenses'
                ? isLight ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-500 text-white border-rose-400'
                : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#141220] text-slate-400 border-[#372d4c]'
            }`}
          >
            <Home className="w-3 h-3" />
            <span>Kira & Fatura</span>
          </button>
          <button
            onClick={() => setActiveFilter('incomes')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 border flex items-center gap-1 ${
              activeFilter === 'incomes'
                ? isLight ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-500 text-slate-950 border-emerald-400'
                : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#141220] text-slate-400 border-[#372d4c]'
            }`}
          >
            <span>💰 Gelirler</span>
          </button>
        </div>

        {/* Existing Items / Schedule Timeline List */}
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono text-center py-4 border-2 border-dashed rounded-md">
              Bu filtrede kayıtlı işlem yok.
            </p>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className={`p-2.5 rounded-md border-2 flex items-center justify-between gap-2 transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:border-[#4361ee]/40' : 'bg-[#120f1e] border-[#372d4c] hover:border-cyan-500/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-black truncate ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                      {item.name}
                    </span>

                    {item.isSubscription && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-sm border ${
                        isLight ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      }`}>
                        Abonelik
                      </span>
                    )}

                    {item.categoryTag && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-sm ${
                        isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-300'
                      }`}>
                        {item.categoryTag}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-bold text-cyan-500">
                      <Calendar className="w-3 h-3" />
                      Her ayın {item.paymentDay || 1}. günü
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`text-xs font-black font-mono text-right ${
                      item.type === 'income'
                        ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                        : isLight ? 'text-rose-600' : 'text-rose-400'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`"${item.name}" kalıcı işlemini silmek istediğinize emin misiniz?`)) {
                        onDeleteRecurring(item.id);
                      }
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Form */}
        <form
          onSubmit={handleAdd}
          className={`p-3 rounded-md border-2 space-y-2.5 ${
            isLight
              ? 'bg-[#f8f9fe] border-[#4361ee]/20'
              : 'bg-[#141220] border-[#372d4c]'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-xs font-black font-mono uppercase tracking-wider ${
              isLight ? 'text-[#4361ee]' : 'text-cyan-400'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Kalıcı Ödeme / Abonelik Ekle</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`h-8 rounded-md text-xs font-mono font-bold transition-all border ${
                type === 'income'
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm'
                  : isLight
                  ? 'bg-white border-slate-300 text-slate-600'
                  : 'bg-[#120f1e] border-[#372d4c] text-slate-400'
              }`}
            >
              💰 Gelir (Maaş)
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`h-8 rounded-md text-xs font-mono font-bold transition-all border ${
                type === 'expense'
                  ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                  : isLight
                  ? 'bg-white border-slate-300 text-slate-600'
                  : 'bg-[#120f1e] border-[#372d4c] text-slate-400'
              }`}
            >
              💸 Gider / Abonelik
            </button>
          </div>

          {type === 'expense' && (
            <div className="flex items-center justify-between p-2 rounded-md border bg-black/5 dark:bg-white/5 border-slate-300 dark:border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Tv className="w-3.5 h-3.5 text-purple-400" />
                <span>Dijital Abonelik mi? (Netflix, Spotify vb.)</span>
              </div>
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={e => setIsSubscription(e.target.checked)}
                className="w-4 h-4 rounded accent-[#4361ee] cursor-pointer"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-0.5">
                İşlem Adı
              </label>
              <input
                type="text"
                placeholder="Örn: Netflix 4K, Kira"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full h-8 px-2.5 rounded-md border text-xs font-bold focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                    : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-0.5">
                Tutar (₺)
              </label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`w-full h-8 px-2.5 rounded-md border text-xs font-mono font-bold focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#4361ee]'
                    : 'bg-[#120f1e] border-[#372d4c] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-0.5">
                Ödeme Günü (Ayın 1-31'i)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paymentDay}
                onChange={e => setPaymentDay(e.target.value)}
                className={`w-full h-8 px-2.5 rounded-md border text-xs font-mono font-bold focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-[#4361ee]'
                    : 'bg-[#120f1e] border-[#372d4c] text-slate-100 focus:border-cyan-400'
                }`}
              />
            </div>

            {type === 'expense' && (
              <div>
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-0.5">
                  Kategori Etiketi
                </label>
                <select
                  value={categoryTag}
                  onChange={e => setCategoryTag(e.target.value)}
                  className={`w-full h-8 px-2 rounded-md border text-xs font-medium focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#4361ee]'
                      : 'bg-[#120f1e] border-[#372d4c] text-slate-100 focus:border-cyan-400'
                  }`}
                >
                  {CATEGORY_PRESETS.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full h-9 rounded-md font-mono font-bold text-xs shadow-sm active:scale-[0.98] transition-all ${
              isLight
                ? 'bg-[#4361ee] text-white shadow-[#4361ee]/20'
                : 'bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            Kalıcı İşlemi / Aboneliği Kaydet
          </button>
        </form>
      </div>
    </BottomSheetModal>
  );
};
