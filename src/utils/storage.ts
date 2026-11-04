import {
  AppData,
  MonthData,
  SavingsItem,
  GoalJar,
  RecurringItem,
  SavingsCategoryType,
  SavingsHistoryEntry,
  TR_MONTHS,
  generateId
} from '../types';

export function generateSampleHistory(
  amount: number,
  type: SavingsCategoryType = 'fon'
): SavingsHistoryEntry[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const multipliers: Record<SavingsCategoryType, { daysAgo: number; ratio: number }[]> = {
    altin: [
      { daysAgo: 1825, ratio: 0.18 },
      { daysAgo: 1095, ratio: 0.32 },
      { daysAgo: 730, ratio: 0.48 },
      { daysAgo: 365, ratio: 0.65 },
      { daysAgo: 180, ratio: 0.78 },
      { daysAgo: 90, ratio: 0.86 },
      { daysAgo: 30, ratio: 0.91 },
      { daysAgo: 20, ratio: 0.935 },
      { daysAgo: 10, ratio: 0.965 },
      { daysAgo: 3, ratio: 0.988 },
      { daysAgo: 0, ratio: 1.0 }
    ],
    borsa: [
      { daysAgo: 1825, ratio: 0.22 },
      { daysAgo: 1095, ratio: 0.40 },
      { daysAgo: 730, ratio: 0.62 },
      { daysAgo: 365, ratio: 0.75 },
      { daysAgo: 180, ratio: 1.08 },
      { daysAgo: 90, ratio: 0.98 },
      { daysAgo: 30, ratio: 0.91 },
      { daysAgo: 20, ratio: 0.88 },
      { daysAgo: 10, ratio: 0.95 },
      { daysAgo: 3, ratio: 0.98 },
      { daysAgo: 0, ratio: 1.0 }
    ],
    kripto: [
      { daysAgo: 1825, ratio: 0.15 },
      { daysAgo: 1095, ratio: 0.35 },
      { daysAgo: 730, ratio: 0.45 },
      { daysAgo: 365, ratio: 0.58 },
      { daysAgo: 180, ratio: 1.15 },
      { daysAgo: 90, ratio: 0.85 },
      { daysAgo: 30, ratio: 0.86 },
      { daysAgo: 20, ratio: 0.91 },
      { daysAgo: 10, ratio: 0.95 },
      { daysAgo: 3, ratio: 0.98 },
      { daysAgo: 0, ratio: 1.0 }
    ],
    vadeli: [
      { daysAgo: 1825, ratio: 0.25 },
      { daysAgo: 1095, ratio: 0.42 },
      { daysAgo: 730, ratio: 0.55 },
      { daysAgo: 365, ratio: 0.70 },
      { daysAgo: 180, ratio: 0.82 },
      { daysAgo: 90, ratio: 0.90 },
      { daysAgo: 30, ratio: 0.955 },
      { daysAgo: 20, ratio: 0.97 },
      { daysAgo: 10, ratio: 0.985 },
      { daysAgo: 3, ratio: 0.995 },
      { daysAgo: 0, ratio: 1.0 }
    ],
    fon: [
      { daysAgo: 1825, ratio: 0.20 },
      { daysAgo: 1095, ratio: 0.38 },
      { daysAgo: 730, ratio: 0.52 },
      { daysAgo: 365, ratio: 0.68 },
      { daysAgo: 180, ratio: 0.80 },
      { daysAgo: 90, ratio: 0.89 },
      { daysAgo: 30, ratio: 0.93 },
      { daysAgo: 20, ratio: 0.955 },
      { daysAgo: 10, ratio: 0.978 },
      { daysAgo: 3, ratio: 0.994 },
      { daysAgo: 0, ratio: 1.0 }
    ],
    doviz: [
      { daysAgo: 1825, ratio: 0.24 },
      { daysAgo: 1095, ratio: 0.45 },
      { daysAgo: 730, ratio: 0.60 },
      { daysAgo: 365, ratio: 0.78 },
      { daysAgo: 180, ratio: 0.88 },
      { daysAgo: 90, ratio: 0.93 },
      { daysAgo: 30, ratio: 0.965 },
      { daysAgo: 20, ratio: 0.978 },
      { daysAgo: 10, ratio: 0.99 },
      { daysAgo: 3, ratio: 0.997 },
      { daysAgo: 0, ratio: 1.0 }
    ],
    diger: [
      { daysAgo: 1825, ratio: 0.30 },
      { daysAgo: 1095, ratio: 0.50 },
      { daysAgo: 730, ratio: 0.65 },
      { daysAgo: 365, ratio: 0.80 },
      { daysAgo: 180, ratio: 0.88 },
      { daysAgo: 90, ratio: 0.93 },
      { daysAgo: 30, ratio: 0.96 },
      { daysAgo: 20, ratio: 0.975 },
      { daysAgo: 10, ratio: 0.99 },
      { daysAgo: 3, ratio: 0.995 },
      { daysAgo: 0, ratio: 1.0 }
    ]
  };

  const schedule = multipliers[type] || multipliers.diger;

  return schedule.map(item => {
    const t = now - item.daysAgo * dayMs;
    const d = new Date(t);
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    return {
      date: item.daysAgo === 0 ? 'Bugün' : dateStr,
      timestamp: t,
      amount: Math.round(amount * item.ratio)
    };
  });
}

export function createDefaultData(): AppData {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const sampleRecurring: RecurringItem[] = [
    { id: 'rec-inc-1', type: 'income', name: 'Ana Maaş', amount: 48500, paymentDay: 15, categoryTag: 'Maaş' },
    { id: 'rec-exp-1', type: 'expense', name: 'Ev Kirası', amount: 16000, paymentDay: 15, isSubscription: false, categoryTag: 'Kira' },
    { id: 'rec-exp-2', type: 'expense', name: 'Site Aidatı', amount: 1450, paymentDay: 18, isSubscription: false, categoryTag: 'Aidat' },
    { id: 'rec-exp-3', type: 'expense', name: 'Netflix 4K', amount: 299, paymentDay: 5, isSubscription: true, categoryTag: 'Dizi/Film' },
    { id: 'rec-exp-4', type: 'expense', name: 'Spotify Aile', amount: 99, paymentDay: 8, isSubscription: true, categoryTag: 'Müzik' },
    { id: 'rec-exp-5', type: 'expense', name: 'Fiber İnternet', amount: 480, paymentDay: 22, isSubscription: true, categoryTag: 'İnternet' }
  ];

  const sampleGoalJars: GoalJar[] = [
    {
      id: 'goal-1',
      name: 'Yaz Tatili & Seyahat',
      targetAmount: 35000,
      currentAmount: 21000,
      category: 'Tatil',
      color: '#06b6d4',
      note: 'Ege Kıyı Turu 🌴'
    },
    {
      id: 'goal-2',
      name: 'Yeni Telefon (Pro)',
      targetAmount: 65000,
      currentAmount: 34000,
      category: 'Teknoloji',
      color: '#f72585',
      note: 'Yıl Sonu Cihaz Yenileme 📱'
    },
    {
      id: 'goal-3',
      name: 'Acil Durum Kumbarası',
      targetAmount: 100000,
      currentAmount: 48000,
      category: 'Acil Durum',
      color: '#10b981',
      note: '6 Aylık Sabit Gider Güvencesi 🛡️'
    }
  ];

  const sampleDebts = [
    {
      id: 'debt-1',
      name: 'Kredi Kartı Taksiti',
      totalAmount: 24000,
      remainingAmount: 16000,
      installments: 6,
      installmentAmount: 4000
    },
    {
      id: 'debt-2',
      name: 'Teknoloji Kredisi',
      totalAmount: 18000,
      remainingAmount: 12000,
      installments: 9,
      installmentAmount: 2000
    }
  ];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const sampleSavings: SavingsItem[] = [
    {
      id: 'sav-1',
      name: 'Para Piyasası Fonu (PPF)',
      type: 'fon',
      amount: 45000,
      initialAmount: 9000,
      note: 'Acil Durum Fonu',
      updatedAt: '01/10/2026',
      lastUpdatedTimestamp: now - 3 * dayMs,
      history: generateSampleHistory(45000, 'fon')
    },
    {
      id: 'sav-2',
      name: 'Gram Altın (Banka & Fiziki)',
      type: 'altin',
      amount: 85000,
      initialAmount: 15300,
      note: '18 Gram Altın Portföyü',
      updatedAt: '01/10/2026',
      lastUpdatedTimestamp: now - 3 * dayMs,
      history: generateSampleHistory(85000, 'altin')
    },
    {
      id: 'sav-3',
      name: '32 Günlük Vadeli Mevduat',
      type: 'vadeli',
      amount: 60000,
      initialAmount: 15000,
      note: '%48 Yıllık Oran',
      updatedAt: '15/08/2026',
      lastUpdatedTimestamp: now - 38 * dayMs, // > 30 days to test the reminder!
      history: generateSampleHistory(60000, 'vadeli')
    },
    {
      id: 'sav-4',
      name: 'BIST 30 Endeks Hisseleri',
      type: 'borsa',
      amount: 32000,
      initialAmount: 7040,
      note: 'THYAO, TUPRS, EREGL',
      updatedAt: '28/09/2026',
      lastUpdatedTimestamp: now - 6 * dayMs,
      history: generateSampleHistory(32000, 'borsa')
    },
    {
      id: 'sav-5',
      name: 'BTC / ETH Soğuk Cüzdan',
      type: 'kripto',
      amount: 22000,
      initialAmount: 3300,
      note: 'Uzun Vadeli HODL',
      updatedAt: '02/10/2026',
      lastUpdatedTimestamp: now - 2 * dayMs,
      history: generateSampleHistory(22000, 'kripto')
    }
  ];

  // Seed current month and previous month
  const months: MonthData[] = [];

  const prevMonthIdx = (currentMonthIdx + 11) % 12;
  const prevYear = currentMonthIdx === 0 ? currentYear - 1 : currentYear;
  months.push({
    id: `${prevYear}-${prevMonthIdx}`,
    name: `${TR_MONTHS[prevMonthIdx]} ${prevYear}`,
    monthIdx: prevMonthIdx,
    income: 51200,
    expense: 34800,
    remaining: 16400,
    incomes: [
      {
        id: generateId(),
        linkedRecurringId: 'rec-inc-1',
        name: 'Ana Maaş',
        amount: 48500,
        targetAmount: 48500,
        transactions: [{ id: generateId(), amount: 48500, desc: 'Maaş Ödemesi', date: '15/' + (prevMonthIdx + 1) }]
      },
      {
        id: generateId(),
        name: 'Freelance & Ek Gelir',
        amount: 2700,
        transactions: [{ id: generateId(), amount: 2700, desc: 'Tasarım İşi', date: '22/' + (prevMonthIdx + 1) }]
      }
    ],
    categories: [
      {
        id: generateId(),
        name: 'Kalıcı Giderler',
        isRecurringCategory: true,
        items: [
          {
            id: generateId(),
            linkedRecurringId: 'rec-exp-1',
            name: 'Ev Kirası',
            amount: 16000,
            targetAmount: 16000,
            transactions: [{ id: generateId(), amount: 16000, desc: 'Kira Transferi', date: '15/' + (prevMonthIdx + 1) }]
          },
          {
            id: generateId(),
            linkedRecurringId: 'rec-exp-2',
            name: 'Site Aidatı',
            amount: 1450,
            targetAmount: 1450,
            transactions: [{ id: generateId(), amount: 1450, desc: 'Aidat', date: '18/' + (prevMonthIdx + 1) }]
          }
        ]
      },
      {
        id: generateId(),
        name: 'Ev ve Faturalar',
        items: [
          {
            id: generateId(),
            name: 'Elektrik & Su & Doğalgaz',
            amount: 2150,
            transactions: [{ id: generateId(), amount: 2150, desc: 'Faturalar', date: '19/' + (prevMonthIdx + 1) }],
            sliderLocked: true
          },
          {
            id: generateId(),
            name: 'İnternet & Telefon',
            amount: 700,
            transactions: [{ id: generateId(), amount: 700, desc: 'Turkcell & Superonline', date: '20/' + (prevMonthIdx + 1) }],
            sliderLocked: true
          }
        ]
      },
      {
        id: generateId(),
        name: 'Market ve Mutfak',
        items: [
          {
            id: generateId(),
            name: 'Süpermarket Alışverişi',
            amount: 8500,
            transactions: [
              { id: generateId(), amount: 3200, desc: 'Haftalık Market', date: '04/' + (prevMonthIdx + 1) },
              { id: generateId(), amount: 2800, desc: 'Kasap & Manav', date: '12/' + (prevMonthIdx + 1) },
              { id: generateId(), amount: 2500, desc: 'Genel Eksikler', date: '24/' + (prevMonthIdx + 1) }
            ],
            sliderLocked: true
          }
        ]
      },
      {
        id: generateId(),
        name: 'Borç Ödemeleri',
        isDebtCategory: true,
        items: [
          {
            id: generateId(),
            linkedDebtId: 'debt-1',
            name: 'Kredi Kartı Taksiti',
            amount: 4000,
            transactions: [{ id: generateId(), amount: 4000, desc: 'Taksit 1/6', date: '16/' + (prevMonthIdx + 1) }],
            sliderLocked: true
          },
          {
            id: generateId(),
            linkedDebtId: 'debt-2',
            name: 'Teknoloji Kredisi',
            amount: 2000,
            transactions: [{ id: generateId(), amount: 2000, desc: 'Taksit 1/9', date: '17/' + (prevMonthIdx + 1) }],
            sliderLocked: true
          }
        ]
      }
    ]
  });

  // Current active month
  months.push({
    id: `${currentYear}-${currentMonthIdx}`,
    name: `${TR_MONTHS[currentMonthIdx]} ${currentYear}`,
    monthIdx: currentMonthIdx,
    income: 48500,
    expense: 27950,
    remaining: 20550,
    incomes: [
      {
        id: generateId(),
        linkedRecurringId: 'rec-inc-1',
        name: 'Ana Maaş',
        amount: 48500,
        targetAmount: 48500,
        transactions: [{ id: generateId(), amount: 48500, desc: 'Kalıcı İşlem', date: '01/' + (currentMonthIdx + 1) }]
      },
      {
        id: generateId(),
        name: 'Ek Gelir',
        amount: 0,
        transactions: []
      }
    ],
    categories: [
      {
        id: generateId(),
        name: 'Kalıcı Giderler',
        isRecurringCategory: true,
        items: [
          {
            id: generateId(),
            linkedRecurringId: 'rec-exp-1',
            name: 'Ev Kirası',
            amount: 16000,
            targetAmount: 16000,
            transactions: [{ id: generateId(), amount: 16000, desc: 'Kalıcı İşlem', date: '02/' + (currentMonthIdx + 1) }],
            sliderLocked: true
          },
          {
            id: generateId(),
            linkedRecurringId: 'rec-exp-2',
            name: 'Site Aidatı',
            amount: 1450,
            targetAmount: 1450,
            transactions: [{ id: generateId(), amount: 1450, desc: 'Kalıcı İşlem', date: '03/' + (currentMonthIdx + 1) }],
            sliderLocked: true
          }
        ]
      },
      {
        id: generateId(),
        name: 'Ev ve Faturalar',
        items: [
          {
            id: generateId(),
            name: 'Faturalar',
            amount: 2500,
            transactions: [{ id: generateId(), amount: 2500, desc: 'Elektrik & İnternet', date: '04/' + (currentMonthIdx + 1) }],
            sliderLocked: true
          }
        ]
      },
      {
        id: generateId(),
        name: 'Mutfak ve Ulaşım',
        items: [
          {
            id: generateId(),
            name: 'Market',
            amount: 4000,
            transactions: [
              { id: generateId(), amount: 2200, desc: 'Migros Sanal Market', date: '02/' + (currentMonthIdx + 1) },
              { id: generateId(), amount: 1800, desc: 'Hafta Sonu Alışverişi', date: '05/' + (currentMonthIdx + 1) }
            ],
            sliderLocked: false
          },
          {
            id: generateId(),
            name: 'Akaryakıt / Ulaşım',
            amount: 0,
            transactions: [],
            sliderLocked: false
          }
        ]
      },
      {
        id: generateId(),
        name: 'Borç Ödemeleri',
        isDebtCategory: true,
        items: [
          {
            id: generateId(),
            linkedDebtId: 'debt-1',
            name: 'Kredi Kartı Taksiti',
            amount: 4000,
            transactions: [{ id: generateId(), amount: 4000, desc: 'Taksit Ödemesi', date: '03/' + (currentMonthIdx + 1) }],
            sliderLocked: true
          }
        ]
      }
    ]
  });

  return {
    months,
    settings: {
      cycleStartDay: 1
    },
    debts: sampleDebts,
    recurring: sampleRecurring,
    savings: sampleSavings,
    goalJars: sampleGoalJars
  };
}

export function getCurrentUser(): string | null {
  return localStorage.getItem('budgetApp_currentUser') || null;
}

export function setCurrentUser(username: string | null): void {
  if (username) {
    localStorage.setItem('budgetApp_currentUser', username);
  } else {
    localStorage.removeItem('budgetApp_currentUser');
  }
}

export function loadUserData(username?: string): AppData {
  const user = username || getCurrentUser() || 'demo_user';
  const raw = localStorage.getItem('budgetApp_data_' + user);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const defaultData = createDefaultData();
      const loadedSavings = Array.isArray(parsed.savings) ? parsed.savings : defaultData.savings;

      // Auto-enrich existing savings with rich multi-year test history if fewer than 5 data points exist
      const enrichedSavings = loadedSavings.map((item: SavingsItem) => {
        if (!item.history || item.history.length < 5) {
          const type = item.type || 'fon';
          const generatedHist = generateSampleHistory(item.amount, type);
          return {
            ...item,
            initialAmount: item.initialAmount || generatedHist[0]?.amount || Math.round(item.amount * 0.25),
            history: generatedHist,
            lastUpdatedTimestamp: item.lastUpdatedTimestamp || Date.now() - 3 * 86400000
          };
        }
        return item;
      });

      return {
        months: Array.isArray(parsed.months) ? parsed.months : [],
        settings: parsed.settings && typeof parsed.settings.cycleStartDay === 'number'
          ? parsed.settings
          : { cycleStartDay: 1 },
        debts: Array.isArray(parsed.debts) ? parsed.debts : [],
        recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
        savings: enrichedSavings,
        goalJars: Array.isArray(parsed.goalJars) ? parsed.goalJars : (defaultData.goalJars || [])
      };
    } catch {
      // fallback
    }
  }

  // If user is guest/first time or empty, return seeded data
  const defaultData = createDefaultData();
  saveUserData(defaultData, user);
  return defaultData;
}

export function saveUserData(data: AppData, username?: string): void {
  const user = username || getCurrentUser() || 'demo_user';
  localStorage.setItem('budgetApp_data_' + user, JSON.stringify(data));
}

export function syncRecurringToMonth(month: MonthData, recurring: AppData['recurring']): MonthData {
  const updatedMonth = JSON.parse(JSON.stringify(month)) as MonthData;

  // Process Incomes
  const recurringIncomes = recurring.filter(r => r.type === 'income');
  recurringIncomes.forEach(r => {
    const existing = updatedMonth.incomes.find(inc => inc.linkedRecurringId === r.id);
    if (existing) {
      existing.name = r.name;
      existing.targetAmount = r.amount;
    } else {
      updatedMonth.incomes.unshift({
        id: generateId(),
        linkedRecurringId: r.id,
        name: r.name,
        targetAmount: r.amount,
        amount: 0,
        transactions: []
      });
    }
  });

  // Process Expenses
  const recurringExpenses = recurring.filter(r => r.type === 'expense');
  if (recurringExpenses.length > 0) {
    let recCat = updatedMonth.categories.find(c => c.isRecurringCategory);
    if (!recCat) {
      recCat = {
        id: generateId(),
        name: 'Kalıcı Giderler',
        color: 'blue',
        isRecurringCategory: true,
        items: []
      };
      updatedMonth.categories.unshift(recCat);
    }
    recurringExpenses.forEach(r => {
      const existing = recCat!.items.find(item => item.linkedRecurringId === r.id);
      if (existing) {
        existing.name = r.name;
        existing.targetAmount = r.amount;
      } else {
        recCat!.items.push({
          id: generateId(),
          linkedRecurringId: r.id,
          name: r.name,
          targetAmount: r.amount,
          amount: 0,
          transactions: [],
          sliderLocked: true
        });
      }
    });
  }

  // Decouple removed recurring items
  updatedMonth.incomes.forEach(inc => {
    if (inc.linkedRecurringId && !recurring.find(r => r.id === inc.linkedRecurringId)) {
      delete inc.linkedRecurringId;
      delete inc.targetAmount;
    }
  });

  updatedMonth.categories.forEach(cat => {
    cat.items.forEach(item => {
      if (item.linkedRecurringId && !recurring.find(r => r.id === item.linkedRecurringId)) {
        delete item.linkedRecurringId;
        delete item.targetAmount;
        item.sliderLocked = false;
      }
    });
  });

  return updatedMonth;
}
