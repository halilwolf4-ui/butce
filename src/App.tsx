/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AppData,
  MonthData,
  SavingsItem,
  GoalJar,
  TR_MONTHS,
  generateId,
  formatMoney
} from './types';
import {
  loadUserData,
  saveUserData,
  getCurrentUser,
  setCurrentUser,
  syncRecurringToMonth,
  createDefaultData
} from './utils/storage';
import { OverviewTab } from './components/OverviewTab';
import { MonthEditorTab } from './components/MonthEditorTab';
import { SavingsTab, AddSavingsModal, getDaysSinceUpdate } from './components/SavingsTab';
import { SettingsTab } from './components/SettingsTab';
import { BottomNav, TabType } from './components/BottomNav';
import {
  TransactionModal,
  DebtManagerModal,
  PayDebtModal,
  RecurringManagerModal
} from './components/Modals';
import { AuthModal } from './components/AuthModal';
import { QuickAddModal } from './components/QuickAddModal';
import { BrandLogo } from './components/BrandLogo';
import { Maximize2, Minimize2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

export default function App() {
  const [currentUser, setUser] = useState<string | null>(getCurrentUser());
  const [data, setData] = useState<AppData>(() => loadUserData(currentUser || undefined));
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Light/Dark Theme
  const [isLight, setIsLight] = useState<boolean>(() => {
    return localStorage.getItem('budgetApp_theme') === 'light';
  });

  // Mobile Frame Toggle on Desktop
  const [isFramed, setIsFramed] = useState<boolean>(true);

  // Active Month in Editor
  const [currentMonth, setCurrentMonth] = useState<MonthData | null>(null);

  // Modals State
  const [isDebtManagerOpen, setIsDebtManagerOpen] = useState(false);
  const [isPayDebtOpen, setIsPayDebtOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddSavingsOpen, setIsAddSavingsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Transaction Modal State
  const [txModal, setTxModal] = useState<{
    isOpen: boolean;
    type: 'income' | 'expense';
    catIndex: number;
    itemIndex: number | null;
    itemName: string;
  }>({
    isOpen: false,
    type: 'expense',
    catIndex: 0,
    itemIndex: null,
    itemName: ''
  });

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Update HTML Theme classes
  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light-theme');
      document.body.classList.remove('bg-[#090b10]', 'text-slate-100');
      document.body.classList.add('bg-[#f3f6fa]', 'text-slate-900');
      localStorage.setItem('budgetApp_theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('bg-[#f3f6fa]', 'text-slate-900');
      document.body.classList.add('bg-[#090b10]', 'text-slate-100');
      localStorage.setItem('budgetApp_theme', 'dark');
    }
  }, [isLight]);

  // Persist Data whenever it changes
  const updateData = useCallback((newData: AppData) => {
    setData(newData);
    saveUserData(newData, currentUser || undefined);
  }, [currentUser]);

  // Extract distinct autocomplete suggestions across all months to prevent typos
  const { allPreviousCategories, allPreviousIncomes, allPreviousItems } = useMemo(() => {
    const catSet = new Set<string>();
    const incSet = new Set<string>();
    const itemSet = new Set<string>();

    data.months.forEach(m => {
      m.incomes?.forEach(i => {
        if (i.name?.trim()) incSet.add(i.name.trim());
      });
      m.categories?.forEach(c => {
        if (c.name?.trim()) catSet.add(c.name.trim());
        c.items?.forEach(item => {
          if (item.name?.trim()) itemSet.add(item.name.trim());
        });
      });
    });

    return {
      allPreviousCategories: Array.from(catSet),
      allPreviousIncomes: Array.from(incSet),
      allPreviousItems: Array.from(itemSet)
    };
  }, [data.months]);

  // Calculate total monthly cash buffer
  const cashBuffer = useMemo(() => {
    return data.months.reduce((sum, m) => sum + (m.remaining || 0), 0);
  }, [data.months]);

  // Check if Portfolio has any items not updated for 30+ days (1 month)
  const hasOutdatedSavings = useMemo(() => {
    if (!data.savings || data.savings.length === 0) return false;
    return data.savings.some(item => getDaysSinceUpdate(item) >= 30);
  }, [data.savings]);

  // Initialize or open active month
  const openMonth = useCallback((year: number, monthIdx: number) => {
    const monthId = `${year}-${monthIdx}`;
    const existing = data.months.find(m => m.id === monthId);

    let target: MonthData;
    if (existing) {
      target = JSON.parse(JSON.stringify(existing));
    } else {
      // Find latest month to copy structure
      const sorted = [...data.months].sort((a, b) => {
        const [yA, mA] = a.id.split('-').map(Number);
        const [yB, mB] = b.id.split('-').map(Number);
        return yA !== yB ? yA - yB : mA - mB;
      });
      const template = sorted[sorted.length - 1];

      if (template) {
        target = JSON.parse(JSON.stringify(template));
        target.id = monthId;
        target.name = `${TR_MONTHS[monthIdx]} ${year}`;
        target.monthIdx = monthIdx;
        target.income = 0;
        target.expense = 0;
        target.remaining = 0;
        target.incomes.forEach(inc => {
          inc.amount = 0;
          inc.transactions = [];
        });
        target.categories.forEach(cat => {
          cat.items.forEach(item => {
            item.amount = 0;
            item.transactions = [];
          });
        });
      } else {
        target = {
          id: monthId,
          name: `${TR_MONTHS[monthIdx]} ${year}`,
          monthIdx,
          income: 0,
          expense: 0,
          remaining: 0,
          incomes: [
            {
              id: generateId(),
              name: 'Maaş',
              amount: 0,
              transactions: []
            }
          ],
          categories: [
            {
              id: generateId(),
              name: 'Ev ve Faturalar',
              items: [
                { id: generateId(), name: 'Faturalar', amount: 0, transactions: [], sliderLocked: true }
              ]
            },
            {
              id: generateId(),
              name: 'Mutfak ve Yaşam',
              items: [
                { id: generateId(), name: 'Market', amount: 0, transactions: [], sliderLocked: false }
              ]
            }
          ]
        };
      }
    }

    // Sync recurring items into month view
    const synced = syncRecurringToMonth(target, data.recurring);
    setCurrentMonth(synced);
    setActiveTab('this-month');
  }, [data.months, data.recurring]);

  // Initial load default to current month
  useEffect(() => {
    if (!currentMonth) {
      const today = new Date();
      const yr = today.getFullYear();
      const mIdx = today.getMonth();
      const mId = `${yr}-${mIdx}`;
      const found = data.months.find(m => m.id === mId);
      if (found) {
        setCurrentMonth(syncRecurringToMonth(found, data.recurring));
      } else if (data.months.length > 0) {
        setCurrentMonth(syncRecurringToMonth(data.months[data.months.length - 1], data.recurring));
      } else {
        openMonth(yr, mIdx);
      }
    }
  }, [data.months, data.recurring, currentMonth, openMonth]);

  // Save Month Handler
  const handleSaveMonth = useCallback(() => {
    if (!currentMonth) return;

    let totInc = 0;
    currentMonth.incomes.forEach(i => {
      const sum = i.transactions ? i.transactions.reduce((acc, t) => acc + t.amount, 0) : 0;
      i.amount = sum;
      totInc += sum;
    });

    let totExp = 0;
    currentMonth.categories.forEach(c => {
      c.items.forEach(i => {
        const sum = i.transactions ? i.transactions.reduce((acc, t) => acc + t.amount, 0) : 0;
        i.amount = sum;
        totExp += sum;
      });
    });

    const updatedMonth: MonthData = {
      ...currentMonth,
      income: totInc,
      expense: totExp,
      remaining: totInc - totExp
    };

    const newMonths = [...data.months];
    const existingIdx = newMonths.findIndex(m => m.id === updatedMonth.id);

    if (existingIdx >= 0) {
      newMonths[existingIdx] = updatedMonth;
    } else {
      newMonths.push(updatedMonth);
    }

    updateData({
      ...data,
      months: newMonths
    });

    setCurrentMonth(updatedMonth);
    showToast(`"${updatedMonth.name}" bütçesi kaydedildi!`);
    setActiveTab('overview');
  }, [currentMonth, data, updateData, showToast]);

  // Reset Month
  const handleResetMonth = useCallback(() => {
    if (!currentMonth) return;
    const cleared: MonthData = {
      ...currentMonth,
      income: 0,
      expense: 0,
      remaining: 0,
      incomes: currentMonth.incomes.map(i => ({ ...i, amount: 0, transactions: [] })),
      categories: currentMonth.categories.map(c => ({
        ...c,
        items: c.items.map(item => ({ ...item, amount: 0, transactions: [] }))
      }))
    };
    setCurrentMonth(cleared);
    showToast('Ay sıfırlandı. Değişikliği kalıcı yapmak için "Kaydet"e basın.', 'info');
  }, [currentMonth, showToast]);

  // Restore Debt when deleting a debt payment transaction
  const handleRestoreDebt = useCallback((debtId: string, amount: number) => {
    const updatedDebts = data.debts.map(d => {
      if (d.id === debtId) {
        return {
          ...d,
          remainingAmount: Math.min(d.totalAmount, d.remainingAmount + amount)
        };
      }
      return d;
    });
    updateData({
      ...data,
      debts: updatedDebts
    });
    showToast(`${formatMoney(amount)} tutarındaki borç bakiyesi geri yüklendi.`, 'info');
  }, [data, updateData, showToast]);

  // Add Debt
  const handleAddDebt = useCallback((name: string, totalAmount: number, installments: number) => {
    const instAmt = Math.ceil(totalAmount / installments);
    const newDebt = {
      id: generateId(),
      name,
      totalAmount,
      remainingAmount: totalAmount,
      installments,
      installmentAmount: instAmt
    };
    updateData({
      ...data,
      debts: [...data.debts, newDebt]
    });
    showToast(`"${name}" borcu başarıyla eklendi!`);
  }, [data, updateData, showToast]);

  // Delete Debt
  const handleDeleteDebt = useCallback((debtId: string) => {
    updateData({
      ...data,
      debts: data.debts.filter(d => d.id !== debtId)
    });
    showToast('Borç kaydı silindi.');
  }, [data, updateData, showToast]);

  // Pay Debt Handler
  const handleConfirmPayDebt = useCallback((debtId: string, amount: number) => {
    if (!currentMonth) return;

    const targetDebt = data.debts.find(d => d.id === debtId);
    if (!targetDebt) return;

    const actualPaid = Math.min(amount, targetDebt.remainingAmount);

    // 1. Update remaining debt balance
    const updatedDebts = data.debts.map(d => {
      if (d.id === debtId) {
        return {
          ...d,
          remainingAmount: Math.max(0, d.remainingAmount - actualPaid)
        };
      }
      return d;
    });

    // 2. Ensure "Borç Ödemeleri" category exists in currentMonth
    const updatedMonth = JSON.parse(JSON.stringify(currentMonth)) as MonthData;
    let debtCat = updatedMonth.categories.find(c => c.isDebtCategory);
    if (!debtCat) {
      debtCat = {
        id: generateId(),
        name: 'Borç Ödemeleri',
        isDebtCategory: true,
        items: []
      };
      updatedMonth.categories.push(debtCat);
    }

    let debtItem = debtCat.items.find(i => i.linkedDebtId === debtId);
    if (!debtItem) {
      debtItem = {
        id: generateId(),
        linkedDebtId: debtId,
        name: targetDebt.name,
        amount: 0,
        transactions: [],
        sliderLocked: true
      };
      debtCat.items.push(debtItem);
    }

    const today = new Date();
    debtItem.transactions = debtItem.transactions || [];
    debtItem.transactions.push({
      id: generateId(),
      amount: actualPaid,
      desc: 'Taksit Ödemesi',
      date: `${today.getDate()}/${today.getMonth() + 1}`
    });

    setCurrentMonth(updatedMonth);
    updateData({
      ...data,
      debts: updatedDebts
    });

    showToast(`${targetDebt.name} için ${formatMoney(actualPaid)} ödendi!`);
  }, [currentMonth, data, updateData, showToast]);

  // Add Recurring Item (with Subscription & Payment Day support)
  const handleAddRecurring = useCallback((
    type: 'income' | 'expense',
    name: string,
    amount: number,
    paymentDay: number = 1,
    isSubscription: boolean = false,
    categoryTag?: string
  ) => {
    const newItem = {
      id: generateId(),
      type,
      name,
      amount,
      paymentDay,
      isSubscription,
      categoryTag
    };
    const updatedRecurring = [...data.recurring, newItem];
    const updatedData = { ...data, recurring: updatedRecurring };
    updateData(updatedData);

    if (currentMonth) {
      setCurrentMonth(syncRecurringToMonth(currentMonth, updatedRecurring));
    }
    showToast(`"${name}" kalıcı işlemi / aboneliği eklendi.`);
  }, [data, updateData, currentMonth, showToast]);

  // Delete Recurring Item
  const handleDeleteRecurring = useCallback((id: string) => {
    const updatedRecurring = data.recurring.filter(r => r.id !== id);
    const updatedData = { ...data, recurring: updatedRecurring };
    updateData(updatedData);

    if (currentMonth) {
      setCurrentMonth(syncRecurringToMonth(currentMonth, updatedRecurring));
    }
    showToast('Kalıcı işlem silindi.');
  }, [data, updateData, currentMonth, showToast]);

  // Savings Handlers (USER REQUEST: Birikim yönetimi)
  const handleUpdateSavings = useCallback((updatedSavings: SavingsItem[]) => {
    const updated = {
      ...data,
      savings: updatedSavings
    };
    updateData(updated);
    showToast('Birikim portföyü güncellendi.');
  }, [data, updateData, showToast]);

  const handleAddSavings = useCallback((item: Omit<SavingsItem, 'id'>) => {
    const newItem: SavingsItem = {
      ...item,
      id: generateId()
    };
    const updatedSavings = [newItem, ...(data.savings || [])];
    updateData({
      ...data,
      savings: updatedSavings
    });
    showToast(`"${item.name}" birikimi eklendi!`);
  }, [data, updateData, showToast]);

  // Goal Jars Handlers
  const handleUpdateGoalJars = useCallback((updatedGoals: GoalJar[]) => {
    const updated = {
      ...data,
      goalJars: updatedGoals
    };
    updateData(updated);
    showToast('Hedef kumbaraları güncellendi.');
  }, [data, updateData, showToast]);

  // Update Settings (e.g. cycle start day)
  const handleUpdateSettings = useCallback((newCycleDay: number) => {
    const updated = {
      ...data,
      settings: {
        ...data.settings,
        cycleStartDay: newCycleDay
      }
    };
    updateData(updated);
    showToast(`Maaş döngü günü ${newCycleDay} olarak güncellendi.`);
  }, [data, updateData, showToast]);

  // Backup Download (.json)
  const handleDownloadBackup = useCallback(() => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Buyutec_Butce_Yedek_${currentUser || 'kullanici'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Yedek JSON dosyası indirildi!');
  }, [data, currentUser, showToast]);

  // Backup Upload (.json)
  const handleUploadBackup = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.months !== undefined && Array.isArray(parsed.months)) {
          updateData({
            ...parsed,
            savings: Array.isArray(parsed.savings) ? parsed.savings : (data.savings || [])
          });
          if (parsed.months.length > 0) {
            setCurrentMonth(parsed.months[parsed.months.length - 1]);
          }
          showToast('Yedek başarıyla yüklendi!');
        } else {
          showToast('Geçersiz yedek dosyası formatı.', 'error');
        }
      } catch {
        showToast('Dosya okunamadı veya JSON hatalı.', 'error');
      }
    };
    reader.readAsText(file);
  }, [data.savings, updateData, showToast]);

  // Auth: Login
  const handleLogin = useCallback((username: string) => {
    setCurrentUser(username);
    setUser(username);
    const userData = loadUserData(username);
    setData(userData);
    if (userData.months.length > 0) {
      setCurrentMonth(userData.months[userData.months.length - 1]);
    }
    showToast(`Hoş geldin, ${username}!`);
  }, [showToast]);

  // Auth: Logout
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setUser(null);
    const demoData = loadUserData('demo_user');
    setData(demoData);
    if (demoData.months.length > 0) {
      setCurrentMonth(demoData.months[demoData.months.length - 1]);
    }
    showToast('Hesaptan çıkış yapıldı.');
  }, [showToast]);

  // Clear All Data
  const handleClearAllData = useCallback(() => {
    if (confirm('Tüm kayıtlı bütçeler, borçlar ve HESABINIZ SİLİNECEK. Emin misiniz?')) {
      if (currentUser) {
        localStorage.removeItem('budgetApp_data_' + currentUser);
        const users = JSON.parse(localStorage.getItem('budgetApp_users') || '{}');
        delete users[currentUser];
        localStorage.setItem('budgetApp_users', JSON.stringify(users));
      }
      handleLogout();
    }
  }, [currentUser, handleLogout]);

  // Open Transaction Modal
  const handleOpenTxModal = useCallback((
    type: 'income' | 'expense',
    catIndex: number,
    itemIndex: number | null,
    itemName: string
  ) => {
    setTxModal({
      isOpen: true,
      type,
      catIndex,
      itemIndex,
      itemName
    });
  }, []);

  // Confirm Transaction Add
  const handleConfirmTransaction = useCallback((amount: number, desc: string) => {
    if (!currentMonth) return;
    const updated = JSON.parse(JSON.stringify(currentMonth)) as MonthData;
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}`;
    const newTx = {
      id: generateId(),
      amount,
      desc,
      date: dateStr
    };

    if (txModal.type === 'income') {
      const item = updated.incomes[txModal.catIndex];
      item.transactions = item.transactions || [];
      item.transactions.push(newTx);
    } else if (txModal.itemIndex !== null) {
      const item = updated.categories[txModal.catIndex].items[txModal.itemIndex];
      item.transactions = item.transactions || [];
      item.transactions.push(newTx);
    }

    setCurrentMonth(updated);
    showToast(`${txModal.itemName} için ${formatMoney(amount)} eklendi!`);
  }, [currentMonth, txModal, showToast]);

  // Quick Add Transaction Handler
  const handleConfirmQuickAdd = useCallback((
    type: 'expense' | 'income',
    catId: string,
    itemId: string,
    amount: number,
    desc: string,
    dateStr?: string,
    newItemName?: string
  ) => {
    let targetMonth = currentMonth;
    if (!targetMonth) {
      const today = new Date();
      const mId = `${today.getFullYear()}-${today.getMonth()}`;
      targetMonth = data.months.find(m => m.id === mId) || data.months[data.months.length - 1];
    }
    if (!targetMonth) return;

    const updatedMonth = JSON.parse(JSON.stringify(targetMonth)) as MonthData;
    const today = new Date();
    const txDate = dateStr || `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    let loggedItemName = '';

    const newTx = {
      id: generateId(),
      amount,
      desc: desc.trim() || (type === 'expense' ? 'Hızlı Harcama' : 'Hızlı Gelir'),
      date: txDate,
      timestamp: Date.now()
    };

    if (type === 'income') {
      let incomeItem = updatedMonth.incomes.find(i => i.id === itemId);
      if (!incomeItem && newItemName) {
        incomeItem = {
          id: generateId(),
          name: newItemName,
          amount: 0,
          transactions: []
        };
        updatedMonth.incomes.push(incomeItem);
      }
      if (incomeItem) {
        loggedItemName = incomeItem.name;
        incomeItem.transactions = incomeItem.transactions || [];
        incomeItem.transactions.push(newTx);
        incomeItem.amount = incomeItem.transactions.reduce((acc, t) => acc + t.amount, 0);
      }
    } else {
      const category = updatedMonth.categories.find(c => c.id === catId);
      if (category) {
        let catItem = category.items.find(i => i.id === itemId);
        if (!catItem && newItemName) {
          catItem = {
            id: generateId(),
            name: newItemName,
            amount: 0,
            transactions: [],
            sliderLocked: false
          };
          category.items.push(catItem);
        }
        if (catItem) {
          loggedItemName = catItem.name;
          catItem.transactions = catItem.transactions || [];
          catItem.transactions.push(newTx);
          catItem.amount = catItem.transactions.reduce((acc, t) => acc + t.amount, 0);
        }
      }
    }

    // Recompute total income, expense and remaining for this month
    let totInc = 0;
    updatedMonth.incomes.forEach(i => {
      const sum = i.transactions ? i.transactions.reduce((acc, t) => acc + t.amount, 0) : 0;
      i.amount = sum;
      totInc += sum;
    });

    let totExp = 0;
    updatedMonth.categories.forEach(c => {
      c.items.forEach(i => {
        const sum = i.transactions ? i.transactions.reduce((acc, t) => acc + t.amount, 0) : 0;
        i.amount = sum;
        totExp += sum;
      });
    });

    updatedMonth.income = totInc;
    updatedMonth.expense = totExp;
    updatedMonth.remaining = totInc - totExp;

    const newMonths = [...data.months];
    const existingIdx = newMonths.findIndex(m => m.id === updatedMonth.id);
    if (existingIdx >= 0) {
      newMonths[existingIdx] = updatedMonth;
    } else {
      newMonths.push(updatedMonth);
    }

    updateData({
      ...data,
      months: newMonths
    });

    setCurrentMonth(updatedMonth);
    showToast(`${loggedItemName || 'İşlem'} için ${formatMoney(amount)} başarıyla eklendi!`);
  }, [currentMonth, data, updateData, showToast]);

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-start ${
        isLight ? 'bg-[#f4f6fc] text-[#14172c]' : 'bg-[#0d0f17] text-[#e2dbe6]'
      }`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-2xl border flex items-center gap-2 text-xs font-mono font-bold tracking-tight ${
              toast.type === 'error'
                ? isLight ? 'bg-[#f72585] border-[#f72585] text-white' : 'bg-rose-600 border-rose-500 text-white'
                : toast.type === 'info'
                ? isLight ? 'bg-[#4361ee] border-[#4361ee] text-white' : 'bg-cyan-500 border-cyan-400 text-slate-950'
                : isLight ? 'bg-[#7209b7] border-[#7209b7] text-white' : 'bg-emerald-500 border-emerald-400 text-slate-950'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive Mobile App Container */}
      <div
        className={`w-full max-w-md min-h-screen flex flex-col justify-start relative shadow-2xl ${
          isLight ? 'bg-[#ffffff] border-x border-[#e2e8f0]' : 'bg-[#141220] border-x border-[#2b233c]'
        }`}
      >
        {/* Main Content Area - Instant Tab Switching without Lag */}
        <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              data={data}
              selectedYear={selectedYear}
              onYearChange={delta => setSelectedYear(prev => prev + delta)}
              onSelectMonth={openMonth}
              onOpenDebtManager={() => setIsDebtManagerOpen(true)}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenSavings={() => setActiveTab('savings')}
              currentUser={currentUser}
              isLight={isLight}
              onToggleTheme={() => setIsLight(!isLight)}
            />
          )}

          {activeTab === 'this-month' && currentMonth && (
            <MonthEditorTab
              currentMonth={currentMonth}
              onUpdateMonth={setCurrentMonth}
              onSaveMonth={handleSaveMonth}
              onResetMonth={handleResetMonth}
              onOpenPayDebt={() => setIsPayDebtOpen(true)}
              onBackToOverview={() => setActiveTab('overview')}
              onOpenTransactionModal={handleOpenTxModal}
              onRestoreDebt={handleRestoreDebt}
              cycleStartDay={data.settings.cycleStartDay || 1}
              isLight={isLight}
              allPreviousCategories={allPreviousCategories}
              allPreviousIncomes={allPreviousIncomes}
              allPreviousItems={allPreviousItems}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsTab
              savings={data.savings || []}
              goalJars={data.goalJars || []}
              cashBuffer={cashBuffer}
              onUpdateSavings={handleUpdateSavings}
              onUpdateGoalJars={handleUpdateGoalJars}
              isLight={isLight}
              onOpenAddModal={() => setIsAddSavingsOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              data={data}
              onUpdateSettings={handleUpdateSettings}
              onOpenRecurringModal={() => setIsRecurringOpen(true)}
              onDownloadBackup={handleDownloadBackup}
              onUploadBackup={handleUploadBackup}
              onLogout={handleLogout}
              onClearAllData={handleClearAllData}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
              isLight={isLight}
            />
          )}
        </main>

        {/* Floating Quick Action Button (Sağ Altta Açık Mavi Artı Butonu) */}
        {activeTab === 'overview' && (
          <div className="fixed bottom-20 left-0 right-0 z-40 pointer-events-none flex justify-center">
            <div className="w-full max-w-md px-4 flex justify-end pointer-events-none">
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="pointer-events-auto w-14 h-14 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center shadow-[0_6px_28px_rgba(6,182,212,0.65)] border-2 border-white/80 dark:border-cyan-200/60 transition-colors group cursor-pointer"
                title="Hızlı Giriş (+)"
                aria-label="Hızlı İşlem Girişi"
              >
                <Plus className="w-7 h-7 stroke-[2.75] text-slate-950 transition-transform duration-200 group-hover:rotate-90" />
              </motion.button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={tab => {
            if (tab === 'this-month' && !currentMonth) {
              const today = new Date();
              openMonth(today.getFullYear(), today.getMonth());
            } else {
              setActiveTab(tab);
            }
          }}
          isLight={isLight}
          hasOutdatedSavings={hasOutdatedSavings}
        />
      </div>

      {/* Modals & Dialogs */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        currentMonth={currentMonth}
        onConfirm={handleConfirmQuickAdd}
        isLight={isLight}
      />

      <TransactionModal
        isOpen={txModal.isOpen}
        onClose={() => setTxModal(prev => ({ ...prev, isOpen: false }))}
        title={txModal.itemName}
        onConfirm={handleConfirmTransaction}
        isLight={isLight}
      />

      <DebtManagerModal
        isOpen={isDebtManagerOpen}
        onClose={() => setIsDebtManagerOpen(false)}
        debts={data.debts}
        onAddDebt={handleAddDebt}
        onDeleteDebt={handleDeleteDebt}
        isLight={isLight}
      />

      <PayDebtModal
        isOpen={isPayDebtOpen}
        onClose={() => setIsPayDebtOpen(false)}
        debts={data.debts}
        onConfirmPay={handleConfirmPayDebt}
        isLight={isLight}
      />

      <RecurringManagerModal
        isOpen={isRecurringOpen}
        onClose={() => setIsRecurringOpen(false)}
        recurring={data.recurring}
        onAddRecurring={handleAddRecurring}
        onDeleteRecurring={handleDeleteRecurring}
        isLight={isLight}
      />

      <AddSavingsModal
        isOpen={isAddSavingsOpen}
        onClose={() => setIsAddSavingsOpen(false)}
        onAdd={handleAddSavings}
        isLight={isLight}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLight={isLight}
      />
    </div>
  );
}
