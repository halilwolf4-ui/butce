// --- UTILS ---
function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR').format(amount) + " ₺";
}
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TR_MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

// --- STATE ---
let currentUser = localStorage.getItem('budgetApp_currentUser') || null;
let currentMonth = null;
let transactionContext = null;
let selectedYear = new Date().getFullYear();

// --- LOCAL STORAGE ---
function getSavedData() {
    if (!currentUser) return { months: [], settings: { cycleStartDay: 1 }, debts: [], recurring: [] };
    const data = localStorage.getItem('budgetApp_data_' + currentUser);
    let parsed = { months: [], settings: { cycleStartDay: 1 }, debts: [], recurring: [] };
    if (data) {
        let d = JSON.parse(data);
        if(d.months) parsed.months = d.months;
        if(d.settings) parsed.settings = d.settings;
        if(d.debts) parsed.debts = d.debts;
        if(d.recurring) parsed.recurring = d.recurring;
    }
    return parsed;
}
function setSavedData(data) {
    if (!currentUser) return;
    localStorage.setItem('budgetApp_data_' + currentUser, JSON.stringify(data));
}

// --- SETTINGS ---
function saveSettings() {
    const data = getSavedData();
    let day = parseInt(document.getElementById('cycleDayInput').value);
    if(isNaN(day) || day < 1) day = 1;
    if(day > 31) day = 31;
    data.settings.cycleStartDay = day;
    setSavedData(data);
    loadOverview();
}

function getCycleString(monthIndex) {
    const data = getSavedData();
    const day = data.settings.cycleStartDay;
    if (day === 1) return TR_MONTHS[monthIndex];
    
    let nextIdx = (monthIndex + 1) % 12;
    let endDay = day - 1;
    if(endDay === 0) endDay = 30; // approx
    
    return `${day} ${TR_MONTHS_SHORT[monthIndex]} - ${endDay} ${TR_MONTHS_SHORT[nextIdx]}`;
}

// --- CALENDAR OVERVIEW ---
function changeYear(delta) {
    selectedYear += delta;
    loadOverview();
}

let xAxisExpanded = false;
let globalIncomeBreakdown = {};
let globalExpenseBreakdown = {};

function updateAutocompleteSuggestions() {
    const data = getSavedData();
    const months = data.months || [];
    
    let incomesSet = new Set();
    let categoriesSet = new Set();

    months.forEach(m => {
        if(m.incomes) {
            m.incomes.forEach(inc => incomesSet.add(inc.name));
        }
        if(m.categories) {
            m.categories.forEach(cat => {
                categoriesSet.add(cat.name);
                cat.items.forEach(item => categoriesSet.add(item.name));
            });
        }
    });

    const incDatalist = document.getElementById('income-suggestions');
    if(incDatalist) {
        incDatalist.innerHTML = Array.from(incomesSet).map(name => `<option value="${name}">`).join('');
    }
    const catDatalist = document.getElementById('category-suggestions');
    if(catDatalist) {
        catDatalist.innerHTML = Array.from(categoriesSet).map(name => `<option value="${name}">`).join('');
    }
}

function loadOverview() {
    updateAutocompleteSuggestions();

    document.getElementById('currentYearDisplay').innerText = selectedYear;
    const yearLabelEl = document.getElementById('yearLabel');
    if(yearLabelEl) yearLabelEl.innerText = selectedYear;
    const topYearLabelEl = document.getElementById('topYearLabel');
    if(topYearLabelEl) topYearLabelEl.innerText = selectedYear;
    const data = getSavedData();
    const months = data.months || [];
    
    const cycleInput = document.getElementById('cycleDayInput');
    if(cycleInput) cycleInput.value = data.settings.cycleStartDay;
    
    let totalAccumulated = 0;
    let annualIncome = 0;
    let annualExpense = 0;
    
    globalIncomeBreakdown = {};
    globalExpenseBreakdown = {};
    const categoryTotals = {};

    months.forEach(m => {
        if (m.id && m.id.includes('-')) {
            totalAccumulated += m.remaining || 0;
            
            if (m.id.startsWith(selectedYear + '-')) {
                annualIncome += m.income || 0;
                annualExpense += m.expense || 0;
                
                if (m.incomes) {
                    m.incomes.forEach(inc => {
                        if (inc.amount > 0) {
                            globalIncomeBreakdown[inc.name] = (globalIncomeBreakdown[inc.name] || 0) + inc.amount;
                        }
                    });
                }
                
                if (m.categories) {
                    m.categories.forEach(cat => {
                        cat.items.forEach(item => {
                            if (item.amount > 0) {
                                let label = cat.isDebtCategory ? "Borç: " + cat.name : item.name;
                                globalExpenseBreakdown[label] = (globalExpenseBreakdown[label] || 0) + item.amount;
                                
                                if (!cat.isDebtCategory && !cat.isRecurringCategory) {
                                    categoryTotals[item.name] = (categoryTotals[item.name] || 0) + item.amount;
                                }
                            }
                        });
                    });
                }
            }
        }
    });

    const accumulatedDisplay = document.getElementById('totalAccumulatedDisplay');
    if(accumulatedDisplay) accumulatedDisplay.innerText = formatMoney(totalAccumulated);
    const incDisplay = document.getElementById('annualIncomeDisplay');
    if(incDisplay) incDisplay.innerText = formatMoney(annualIncome);
    const expDisplay = document.getElementById('annualExpenseDisplay');
    if(expDisplay) expDisplay.innerText = formatMoney(annualExpense);
    
    let totalGlobalDebt = data.debts.reduce((acc, d) => acc + d.remainingAmount, 0);
    document.getElementById('globalDebtDisplay').innerText = formatMoney(totalGlobalDebt);

    const sortedCats = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]).slice(0, 5);
    let catsHtml = '';
    if (sortedCats.length === 0) {
        catsHtml = '<p style="color:var(--text-muted);text-align:center;">Harcama yok</p>';
    } else {
        sortedCats.forEach((c, idx) => {
            catsHtml += `<div style="display:flex;justify-content:space-between;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:4px;">
                <span>${idx+1}. ${c[0]}</span><span style="font-weight:700;color:var(--accent-red)">${formatMoney(c[1])}</span>
            </div>`;
        });
    }
    document.getElementById('topCategoriesList').innerHTML = catsHtml;
    
    renderXAxis(annualIncome, annualExpense);

    const listContainer = document.getElementById('monthsList');
    listContainer.innerHTML = '';

    for (let i = 0; i < 12; i++) {
        const monthId = `${selectedYear}-${i}`;
        const existingMonth = months.find(m => m.id === monthId);
        
        const card = document.createElement('div');
        card.onclick = () => openMonth(selectedYear, i);
        
        const titleStr = getCycleString(i);

        if (existingMonth) {
            card.className = 'month-card';
            const isNegative = existingMonth.remaining < 0;
            const colorClass = isNegative ? 'negative' : '';
            const symbol = isNegative ? '' : '+';
            
            card.innerHTML = `
                <div class="mc-info">
                    <h3>${titleStr}</h3>
                    <p>G: ${formatMoney(existingMonth.income || 0)} <br> Ç: ${formatMoney(existingMonth.expense || 0)}</p>
                </div>
                <div class="mc-amount ${colorClass}">
                    ${symbol}${formatMoney(existingMonth.remaining || 0)}
                </div>
            `;
        } else {
            card.className = 'month-card empty';
            card.innerHTML = `
                <div class="mc-info" style="margin-top:auto; margin-bottom:auto;">
                    <h3>${titleStr}</h3>
                    <p>Kayıt Yok</p>
                </div>
            `;
        }
        listContainer.appendChild(card);
    }
}

let currentTooltip = null;

function renderXAxis(income, expense) {
    const incDiv = document.getElementById('xAxisIncome');
    const expDiv = document.getElementById('xAxisExpense');
    if(!incDiv || !expDiv) return;
    
    let total = income + expense;
    if (total === 0) {
        incDiv.style.width = '50%';
        expDiv.style.width = '50%';
        incDiv.innerHTML = '';
        expDiv.innerHTML = '';
        return;
    }
    
    let incPct = (income / total) * 100;
    let expPct = (expense / total) * 100;
    
    if (incPct > 95) { incPct = 95; expPct = 5; }
    if (expPct > 95) { expPct = 95; incPct = 5; }
    
    incDiv.style.width = incPct + '%';
    expDiv.style.width = expPct + '%';
    
    incDiv.innerHTML = '';
    expDiv.innerHTML = '';
}

function toggleXAxis(type) {
    const tooltip = document.getElementById('xAxisTooltip');
    if (!tooltip) return;
    
    if (currentTooltip === type) {
        tooltip.classList.remove('visible');
        currentTooltip = null;
        return;
    }
    
    currentTooltip = type;
    tooltip.className = 'x-axis-tooltip visible ' + (type === 'income' ? 'income-pos' : 'expense-pos');
    
    const data = type === 'income' ? globalIncomeBreakdown : globalExpenseBreakdown;
    const items = Object.entries(data).filter(e => e[1] > 0).sort((a,b) => b[1] - a[1]);
    const total = items.reduce((acc, curr) => acc + curr[1], 0);
    
    if (items.length === 0) {
        tooltip.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:12px;">Veri yok</div>';
        return;
    }
    
    let html = '';
    items.forEach(e => {
        let pct = Math.round((e[1] / total) * 100);
        html += `<div class="x-axis-tooltip-item">
            <span>${e[0]}</span>
            <span class="x-axis-tooltip-pct ${type === 'income' ? 'inc' : 'exp'}">%${pct}</span>
        </div>`;
    });
    
    tooltip.innerHTML = html;
}

// --- MONTH INITIALIZATION ---
function getLatestMonthTemplate(data) {
    if (!data.months || data.months.length === 0) return null;
    let sorted = [...data.months].sort((a, b) => {
        let partsA = a.id.split('-');
        let partsB = b.id.split('-');
        if(partsA[0] !== partsB[0]) return parseInt(partsA[0]) - parseInt(partsB[0]);
        return parseInt(partsA[1]) - parseInt(partsB[1]);
    });
    return sorted[sorted.length - 1]; 
}

function createEmptyMonthFromTemplate(monthId, year, monthIndex, template) {
    let newMonth = JSON.parse(JSON.stringify(template));
    newMonth.id = monthId;
    newMonth.name = `${TR_MONTHS[monthIndex]} ${year}`;
    newMonth.monthIdx = monthIndex;
    newMonth.income = 0;
    newMonth.expense = 0;
    newMonth.remaining = 0;
    
    newMonth.incomes.forEach(inc => {
        inc.amount = 0;
        inc.transactions = [];
    });
    
    newMonth.categories.forEach(cat => {
        cat.items.forEach(item => {
            item.amount = 0;
            item.transactions = [];
        });
    });
    
    return newMonth;
}

function syncRecurringItemsToCurrentMonth() {
    if (!currentMonth) return;
    const data = getSavedData();
    
    // Process Incomes
    let recurringIncomes = data.recurring.filter(r => r.type === 'income');
    recurringIncomes.forEach(r => {
        let existing = currentMonth.incomes.find(inc => inc.linkedRecurringId === r.id);
        if (existing) {
            existing.name = r.name;
            existing.targetAmount = r.amount;
        } else {
            currentMonth.incomes.unshift({ id: generateId(), linkedRecurringId: r.id, name: r.name, targetAmount: r.amount, amount: 0, transactions: [] });
        }
    });
    
    // Process Expenses
    let recurringExpenses = data.recurring.filter(r => r.type === 'expense');
    if (recurringExpenses.length > 0) {
        let recCat = currentMonth.categories.find(c => c.isRecurringCategory);
        if (!recCat) {
            recCat = { id: generateId(), name: "Kalıcı Giderler", color: "blue", isRecurringCategory: true, items: [] };
            currentMonth.categories.unshift(recCat);
        }
        recurringExpenses.forEach(r => {
            let existing = recCat.items.find(item => item.linkedRecurringId === r.id);
            if (existing) {
                existing.name = r.name;
                existing.targetAmount = r.amount;
            } else {
                recCat.items.push({ id: generateId(), linkedRecurringId: r.id, name: r.name, targetAmount: r.amount, amount: 0, transactions: [], sliderLocked: true });
            }
        });
    }

    // Cleanup logic: If a recurring item was deleted from settings, decouple it in the month view so it just becomes a regular editable item.
    currentMonth.incomes.forEach(inc => {
        if (inc.linkedRecurringId && !data.recurring.find(r => r.id === inc.linkedRecurringId)) {
            delete inc.linkedRecurringId;
            delete inc.targetAmount;
        }
    });
    currentMonth.categories.forEach(cat => {
        cat.items.forEach(item => {
            if (item.linkedRecurringId && !data.recurring.find(r => r.id === item.linkedRecurringId)) {
                delete item.linkedRecurringId;
                delete item.targetAmount;
                item.sliderLocked = false;
            }
        });
    });
}

function openMonth(year, monthIndex) {
    const monthId = `${year}-${monthIndex}`;
    const data = getSavedData();
    const existingMonth = data.months.find(m => m.id === monthId);
    
    if (existingMonth) {
        currentMonth = JSON.parse(JSON.stringify(existingMonth));
    } else {
        const latestTemplate = getLatestMonthTemplate(data);
        if (latestTemplate) {
            currentMonth = createEmptyMonthFromTemplate(monthId, year, monthIndex, latestTemplate);
        } else {
            currentMonth = {
                id: monthId,
                name: `${TR_MONTHS[monthIndex]} ${year}`,
                monthIdx: monthIndex,
                incomes: [],
                categories: [
                    {
                        id: generateId(),
                        name: "Ev ve Faturalar",
                        color: "red",
                        items: [
                            { id: generateId(), name: "Faturalar", amount: 0, transactions: [], sliderLocked: true }
                        ]
                    },
                    {
                        id: generateId(),
                        name: "Mutfak ve Ulaşım",
                        color: "yellow",
                        items: [
                            { id: generateId(), name: "Market", amount: 0, transactions: [], sliderLocked: true }
                        ]
                    }
                ]
            };
        }
    }
    
    syncRecurringItemsToCurrentMonth();
    
    document.getElementById('editorMonthTitle').innerText = TR_MONTHS[monthIndex] + " " + year;
    const cycleStr = getCycleString(monthIndex);
    document.getElementById('editorDateRange').innerText = cycleStr !== TR_MONTHS[monthIndex] ? `(${cycleStr})` : '';
    
    renderEditor();
    switchTab('this-month');
}

function openCurrentMonth() {
    const today = new Date();
    selectedYear = today.getFullYear();
    openMonth(selectedYear, today.getMonth());
}

function resetCurrentMonth() {
    if(!currentMonth) return;
    if(confirm('Bu aya ait tüm verileri sıfırlamak istediğinize emin misiniz? (Kaydettiğinizde geçerli olur)')) {
        const data = getSavedData();
        const latestTemplate = getLatestMonthTemplate(data);
        
        if (latestTemplate && latestTemplate.id !== currentMonth.id) {
            currentMonth = createEmptyMonthFromTemplate(currentMonth.id, selectedYear, currentMonth.monthIdx, latestTemplate);
        } else {
            currentMonth = {
                id: currentMonth.id,
                name: `${TR_MONTHS[currentMonth.monthIdx]} ${selectedYear}`,
                monthIdx: currentMonth.monthIdx,
                incomes: [],
                categories: []
            };
        }
        syncRecurringItemsToCurrentMonth();
        renderEditor();
    }
}

// --- RECURRING SETTINGS MANAGEMENT ---
function openRecurringModal() {
    const data = getSavedData();
    const list = document.getElementById('recurringList');
    list.innerHTML = '';
    
    if (data.recurring.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:14px;">Kayıtlı kalıcı işlem yok.</p>';
    } else {
        data.recurring.forEach(r => {
            let badge = r.type === 'income' ? '<span style="color:var(--accent-green); font-size:12px;">(Gelir)</span>' : '<span style="color:var(--accent-red); font-size:12px;">(Gider)</span>';
            list.innerHTML += `
                <div style="background:var(--card-bg); padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <div style="font-weight:700; margin-bottom:5px;">${r.name} ${badge}</div>
                        <div style="font-size:14px; font-weight:800; color:#fff;">${formatMoney(r.amount)}</div>
                    </div>
                    <button class="btn-icon danger" style="padding:6px; background:transparent;" onclick="deleteRecurringItem('${r.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
        });
    }
    document.getElementById('recurringManagerModal').classList.add('open');
}

function addRecurringItem() {
    const type = document.getElementById('newRecurringType').value;
    const name = document.getElementById('newRecurringName').value;
    const amount = parseFloat(document.getElementById('newRecurringAmount').value);
    
    if (!name || isNaN(amount) || amount <= 0) {
        return alert("Lütfen tüm alanları geçerli doldurun.");
    }
    
    const data = getSavedData();
    data.recurring.push({
        id: generateId(),
        type: type,
        name: name,
        amount: amount
    });
    setSavedData(data);
    
    document.getElementById('newRecurringName').value = '';
    document.getElementById('newRecurringAmount').value = '';
    openRecurringModal();
    
    // Automatically update current month if it's open
    if(currentMonth) {
        syncRecurringItemsToCurrentMonth();
        renderEditor();
    }
}

function deleteRecurringItem(id) {
    if(confirm("Bu kalıcı işlemi silmek istediğinize emin misiniz? (Mevcut aylardaki işlemlere dokunulmaz, sadece serbest kalırlar)")) {
        const data = getSavedData();
        data.recurring = data.recurring.filter(r => r.id !== id);
        setSavedData(data);
        openRecurringModal();
        
        if(currentMonth) {
            syncRecurringItemsToCurrentMonth();
            renderEditor();
        }
    }
}


// --- DEBT MANAGEMENT ---
function openDebtManager() {
    const data = getSavedData();
    const list = document.getElementById('debtsList');
    list.innerHTML = '';
    
    if (data.debts.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:14px;">Kayıtlı borç yok.</p>';
    } else {
        data.debts.forEach(d => {
            list.innerHTML += `
                <div style="background:var(--card-bg); padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <div style="font-weight:700; margin-bottom:5px;">${d.name}</div>
                        <div style="font-size:12px; color:var(--text-muted);">Aylık: ${formatMoney(d.installmentAmount)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="color:var(--accent-red); font-weight:800; font-size:16px;">${formatMoney(d.remainingAmount)}</div>
                        <button class="btn-text" style="color:var(--text-muted); font-size:12px; padding:0; margin-top:5px;" onclick="deleteDebt('${d.id}')">Sil</button>
                    </div>
                </div>
            `;
        });
    }
    document.getElementById('debtManagerModal').classList.add('open');
}

function addDebt() {
    const name = document.getElementById('newDebtName').value;
    const total = parseFloat(document.getElementById('newDebtAmount').value);
    const months = parseInt(document.getElementById('newDebtInstallments').value);
    
    if (!name || isNaN(total) || isNaN(months) || months <= 0 || total <= 0) {
        return alert("Lütfen tüm alanları geçerli doldurun.");
    }
    
    const installmentAmount = Math.ceil(total / months);
    
    const data = getSavedData();
    data.debts.push({
        id: generateId(),
        name: name,
        totalAmount: total,
        remainingAmount: total,
        installments: months,
        installmentAmount: installmentAmount
    });
    
    setSavedData(data);
    
    document.getElementById('newDebtName').value = '';
    document.getElementById('newDebtAmount').value = '';
    document.getElementById('newDebtInstallments').value = '';
    
    openDebtManager();
    loadOverview();
}

function deleteDebt(id) {
    if(confirm("Bu borcu tamamen silmek istediğinize emin misiniz?")) {
        const data = getSavedData();
        data.debts = data.debts.filter(d => d.id !== id);
        setSavedData(data);
        openDebtManager();
        loadOverview();
    }
}

function openPayDebtModal() {
    const data = getSavedData();
    if(data.debts.length === 0) {
        return alert("Ödenecek global borcunuz bulunmuyor. Önce Genel Bakış'tan borç ekleyin.");
    }
    
    const select = document.getElementById('payDebtSelect');
    select.innerHTML = '<option value="">-- Borç Seçin --</option>';
    data.debts.forEach(d => {
        if (d.remainingAmount > 0) {
            select.innerHTML += `<option value="${d.id}" data-amount="${d.installmentAmount}">${d.name} (Kalan: ${formatMoney(d.remainingAmount)})</option>`;
        }
    });
    
    document.getElementById('payDebtAmount').value = '';
    document.getElementById('payDebtModal').classList.add('open');
}

function updatePayDebtAmount() {
    const select = document.getElementById('payDebtSelect');
    if (select.selectedIndex > 0) {
        const amt = select.options[select.selectedIndex].getAttribute('data-amount');
        document.getElementById('payDebtAmount').value = amt;
    } else {
        document.getElementById('payDebtAmount').value = '';
    }
}

function confirmPayDebt() {
    const select = document.getElementById('payDebtSelect');
    const debtId = select.value;
    const amount = parseFloat(document.getElementById('payDebtAmount').value);
    
    if(!debtId || isNaN(amount) || amount <= 0) {
        return alert("Lütfen borç seçin ve geçerli bir tutar girin.");
    }
    
    const data = getSavedData();
    const debtIndex = data.debts.findIndex(d => d.id === debtId);
    if(debtIndex < 0) return;
    
    const debt = data.debts[debtIndex];
    let actualPaid = amount;
    if(actualPaid > debt.remainingAmount) actualPaid = debt.remainingAmount;
    
    debt.remainingAmount -= actualPaid;
    setSavedData(data); 
    
    ensureDebtCategoryExists();
    const debtCat = currentMonth.categories.find(c => c.isDebtCategory);
    
    let debtItem = debtCat.items.find(i => i.linkedDebtId === debt.id);
    if (!debtItem) {
        debtItem = { id: generateId(), linkedDebtId: debt.id, name: debt.name, amount: 0, transactions: [], sliderLocked: true };
        debtCat.items.push(debtItem);
    }
    
    const today = new Date();
    debtItem.transactions.push({ id: generateId(), amount: actualPaid, desc: "Taksit Ödemesi", date: today.getDate() + "/" + (today.getMonth()+1) });
    
    closeModal('payDebtModal');
    renderEditor();
}

function ensureDebtCategoryExists() {
    if (!currentMonth) return;
    let debtCat = currentMonth.categories.find(c => c.isDebtCategory);
    if (!debtCat) {
        debtCat = { id: generateId(), name: "Borç Ödemeleri", color: "red", isDebtCategory: true, items: [] };
        currentMonth.categories.push(debtCat);
    }
}

function restoreGlobalDebt(debtId, amountToRestore) {
    const data = getSavedData();
    const debt = data.debts.find(d => d.id === debtId);
    if (debt) {
        debt.remainingAmount += amountToRestore;
        if(debt.remainingAmount > debt.totalAmount) debt.remainingAmount = debt.totalAmount;
        setSavedData(data);
    }
}

// --- REGULAR TRANSACTIONS ---
function calculateTotals() {
    let totalIncome = 0;
    let totalExpense = 0;

    currentMonth.incomes.forEach(inc => {
        let sum = inc.transactions ? inc.transactions.reduce((acc, tx) => acc + tx.amount, 0) : 0;
        inc.amount = sum;
        totalIncome += sum;
    });

    // Clean up empty debt items before calculating
    currentMonth.categories.forEach(cat => {
        if (cat.isDebtCategory) {
            cat.items = cat.items.filter(item => item.transactions && item.transactions.length > 0);
        }
    });
    
    // Remove debt category if empty
    currentMonth.categories = currentMonth.categories.filter(cat => !(cat.isDebtCategory && cat.items.length === 0));

    currentMonth.categories.forEach(cat => {
        cat.items.forEach(item => {
            let sum = item.transactions ? item.transactions.reduce((acc, tx) => acc + tx.amount, 0) : 0;
            item.amount = sum;
            totalExpense += sum;
        });
    });

    const remaining = totalIncome - totalExpense;

    document.getElementById('totalIncomeDisplay').innerText = formatMoney(totalIncome);
    document.getElementById('totalExpenseDisplay').innerText = formatMoney(totalExpense);
    document.getElementById('remainingDisplay').innerText = formatMoney(remaining);

    const summaryBox = document.getElementById('summaryBox');
    if (remaining < 0) {
        summaryBox.classList.add('negative');
        document.getElementById('remainingDisplay').innerText = formatMoney(remaining) + " (Açık!)";
    } else {
        summaryBox.classList.remove('negative');
    }
}

function quickPay(type, catIndex, itemIndex) {
    let item = type === 'income' ? currentMonth.incomes[catIndex] : currentMonth.categories[catIndex].items[itemIndex];
    if(!item.targetAmount) return;
    
    const today = new Date();
    const dateStr = today.getDate() + "/" + (today.getMonth()+1);
    const tx = { id: generateId(), amount: item.targetAmount, desc: "Kalıcı İşlem", date: dateStr };
    
    item.transactions.push(tx);
    renderEditor();
}

function deleteTransaction(type, catIndex, itemIndex, txId) {
    if(!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    
    let item = type === 'income' ? currentMonth.incomes[catIndex] : currentMonth.categories[catIndex].items[itemIndex];
    let txIndex = item.transactions.findIndex(t => t.id === txId);
    
    if(txIndex >= 0) {
        const deletedAmount = item.transactions[txIndex].amount;
        item.transactions.splice(txIndex, 1);
        
        // If this is a global debt payment, restore the debt
        if (type === 'expense' && currentMonth.categories[catIndex].isDebtCategory) {
            restoreGlobalDebt(item.linkedDebtId, deletedAmount);
        }
        
        renderEditor();
    }
}


function renderEditor() {
    if (!currentMonth) return;
    calculateTotals();
    
    const incContainer = document.getElementById('incomesContainer');
    incContainer.innerHTML = '';
    currentMonth.incomes.forEach((inc, index) => {
        let isPermanent = !!inc.linkedRecurringId;
        
        let quickBtn = isPermanent ? `<button class="btn-primary" style="padding:4px 10px; font-size:12px; margin-right:5px; background:var(--accent-green);" onclick="quickPay('income', ${index})">💰 ${formatMoney(inc.targetAmount)} Al</button>` : '';
        
        let nameInput = isPermanent ? `<span style="font-weight:700; color:var(--accent-green); margin-right:10px;">${inc.name}</span>` : `<input type="text" class="editable-title" list="income-suggestions" value="${inc.name}" onchange="updateIncomeName(${index}, this.value)">`;
        
        let deleteBtn = isPermanent ? '' : `<button class="btn-icon danger" style="margin-left:5px;" onclick="deleteIncome(${index})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>`;

        incContainer.innerHTML += `
            <div class="card" style="margin-bottom:15px; padding:15px; ${isPermanent ? 'border:1px solid rgba(46, 213, 115, 0.3);' : ''}">
                <div class="input-header">
                    ${nameInput}
                    <div class="actions-wrap">
                        ${quickBtn}
                        <span class="item-total" style="color:var(--accent-green); margin-right:10px;">${formatMoney(inc.amount)}</span>
                        ${isPermanent ? '' : `<button class="btn-icon primary" style="margin-left:5px;" onclick="openTransactionModal('income', ${index}, null)">+</button>`}
                        ${deleteBtn}
                    </div>
                </div>
                ${renderTransactionsDetailed(inc.transactions, 'income', index, null)}
            </div>
        `;
    });

    const catContainer = document.getElementById('categoriesContainer');
    catContainer.innerHTML = '';
    currentMonth.categories.forEach((cat, catIndex) => {
        let itemsHtml = '';
        let isDebtCat = cat.isDebtCategory;
        let isRecurringCat = cat.isRecurringCategory;

        cat.items.forEach((item, itemIndex) => {
            let isPermanent = !!item.linkedRecurringId;
            let isLocked = item.sliderLocked !== false; 
            let lockIcon = isLocked ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' 
                                    : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>'; 
            
            let sliderHtml = (isDebtCat || isPermanent) ? '' : `
                <div class="slider-container" style="display: ${isLocked ? 'none' : 'block'}; margin-top: 15px;">
                    <input type="range" class="styled-slider" min="0" max="50000" step="50" value="${item.amount}" oninput="document.getElementById('amount-display-${catIndex}-${itemIndex}').innerText = formatMoney(this.value)" onchange="sliderChanged(${catIndex}, ${itemIndex}, this.value)">
                </div>
            `;
            
            let nameInput = (isDebtCat || isPermanent) ? `<span style="font-weight:700; color:var(--accent-blue);">${item.name}</span>` : `<input type="text" class="editable-title" list="category-suggestions" style="font-size:15px; font-weight:400;" value="${item.name}" onchange="updateItemName(${catIndex}, ${itemIndex}, this.value)">`;

            let quickBtn = (isPermanent) ? `<button class="btn-primary" style="padding:4px 10px; font-size:12px; margin-right:5px; background:var(--accent-red);" onclick="quickPay('expense', ${catIndex}, ${itemIndex})">💸 ${formatMoney(item.targetAmount)} Öde</button>` : '';

            let toolsHtml = '';
            if(!isDebtCat && !isPermanent) {
                toolsHtml = `
                    <button class="btn-icon primary" style="margin-left:5px;" title="Parça parça ekle" onclick="openTransactionModal('expense', ${catIndex}, ${itemIndex})">+</button>
                    <button class="btn-icon" style="margin-left:5px;" title="${isLocked ? 'Kilidi aç' : 'Kilitle'}" onclick="toggleSliderLock(${catIndex}, ${itemIndex})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${lockIcon}</svg>
                    </button>
                    <button class="btn-icon danger" style="margin-left:5px;" onclick="deleteItem(${catIndex}, ${itemIndex})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                `;
            }

            itemsHtml += `
                <div class="input-group">
                    <div class="input-header">
                        ${nameInput}
                        <div class="actions-wrap">
                            ${quickBtn}
                            <span class="item-total" id="amount-display-${catIndex}-${itemIndex}" style="margin-right:10px;">${formatMoney(item.amount)}</span>
                            ${toolsHtml}
                        </div>
                    </div>
                    ${sliderHtml}
                    ${renderTransactionsDetailed(item.transactions, 'expense', catIndex, itemIndex)}
                </div>
            `;
        });
        
        let catTitleHtml = (isDebtCat || isRecurringCat) ? `<span style="font-weight:800; font-size:16px; color:var(--accent-blue)">${cat.name}</span>` : `<input type="text" class="editable-cat-title" list="category-suggestions" value="${cat.name}" onchange="updateCategoryName(${catIndex}, this.value)">`;
        
        let deleteBtn = (isDebtCat || isRecurringCat) ? '' : `<button class="btn-icon danger" style="background:transparent; border:none; margin-bottom:10px;" onclick="deleteCategory(${catIndex})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>`;
        let addItemBtn = (isDebtCat || isRecurringCat) ? '' : `<button class="btn-text" onclick="addItem(${catIndex})" style="color:var(--text-muted); margin-top:10px;">+ Yeni Kalem</button>`;

        catContainer.innerHTML += `
            <div class="card" ${(isDebtCat || isRecurringCat) ? 'style="border-color:rgba(52, 152, 219, 0.3);"' : ''}>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    ${catTitleHtml}
                    ${deleteBtn}
                </div>
                ${itemsHtml}
                ${addItemBtn}
            </div>
        `;
    });
}

function renderTransactionsDetailed(transactions, type, catIndex, itemIndex) {
    if (!transactions || transactions.length === 0) return '';
    let html = `<div class="transaction-list show">`;
    transactions.forEach((tx, idx) => {
        let sign = tx.amount > 0 ? '+' : '';
        html += `
            <div class="tx-item">
                <span>${tx.date} - ${tx.desc || 'İşlem'}</span>
                <div style="display:flex; align-items:center;">
                    <span class="tx-amount" style="margin-right:10px;">${sign}${formatMoney(tx.amount)}</span>
                    <button class="btn-icon danger" style="padding:2px; background:transparent;" title="İşlemi Sil" onclick="deleteTransaction('${type}', ${catIndex}, ${itemIndex}, '${tx.id}')">✖</button>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

// --- DYNAMIC ACTIONS ---
function toggleSliderLock(catIndex, itemIndex) {
    const item = currentMonth.categories[catIndex].items[itemIndex];
    item.sliderLocked = item.sliderLocked === false ? true : false;
    renderEditor();
}

function sliderChanged(catIndex, itemIndex, value) {
    const val = parseFloat(value);
    const item = currentMonth.categories[catIndex].items[itemIndex];
    let tx = item.transactions.find(t => t.desc === "Sürgü ile ayarlandı");
    if(tx) {
        tx.amount = val;
    } else {
        item.transactions = [{ id: generateId(), amount: val, desc: "Sürgü ile ayarlandı", date: new Date().getDate() + "/" + (new Date().getMonth()+1) }];
    }
    renderEditor();
}

function addIncomeItem() {
    currentMonth.incomes.push({ id: generateId(), name: "Yeni Gelir", amount: 0, transactions: [] });
    renderEditor();
}
function updateIncomeName(index, val) {
    currentMonth.incomes[index].name = val;
}
function deleteIncome(index) {
    if(confirm('Bu geliri silmek istediğinize emin misiniz?')) {
        currentMonth.incomes.splice(index, 1);
        renderEditor();
    }
}

function addCategory() {
    currentMonth.categories.push({ id: generateId(), name: "Yeni Kategori", color: "blue", items: [] });
    renderEditor();
}
function updateCategoryName(index, val) {
    currentMonth.categories[index].name = val;
}
function deleteCategory(index) {
    if(confirm('Kategoriyi silmek istediğinize emin misiniz?')) {
        currentMonth.categories.splice(index, 1);
        renderEditor();
    }
}

function addItem(catIndex) {
    currentMonth.categories[catIndex].items.push({ id: generateId(), name: "Yeni Kalem", amount: 0, transactions: [], sliderLocked: true });
    renderEditor();
}
function updateItemName(catIndex, itemIndex, val) {
    currentMonth.categories[catIndex].items[itemIndex].name = val;
}
function deleteItem(catIndex, itemIndex) {
    if(confirm('Bu kalemi silmek istediğinize emin misiniz?')) {
        currentMonth.categories[catIndex].items.splice(itemIndex, 1);
        renderEditor();
    }
}

// --- MODAL (TRANSACTIONS) ---
function openTransactionModal(type, index1, index2) {
    transactionContext = { type, index1, index2 };
    let title = type === 'income' ? currentMonth.incomes[index1].name : currentMonth.categories[index1].items[index2].name;
    document.getElementById('modalTitle').innerText = title + " Ekle";
    document.getElementById('modalSubtitle').innerText = "Bu kaleme tutar ekleyin.";
    document.getElementById('transactionAmount').value = "";
    document.getElementById('transactionDesc').value = "";
    document.getElementById('transactionModal').classList.add('open');
}

function closeModal(modalId = 'transactionModal') {
    document.getElementById(modalId).classList.remove('open');
    if(modalId === 'transactionModal') transactionContext = null;
}

function confirmTransaction() {
    const amt = parseFloat(document.getElementById('transactionAmount').value);
    if (!amt || amt <= 0) return alert("Geçerli bir tutar girin.");
    const desc = document.getElementById('transactionDesc').value.trim();
    const today = new Date();
    const dateStr = today.getDate() + "/" + (today.getMonth()+1);
    const tx = { id: generateId(), amount: amt, desc: desc, date: dateStr };
    
    if (transactionContext.type === 'income') {
        currentMonth.incomes[transactionContext.index1].transactions.push(tx);
    } else {
        currentMonth.categories[transactionContext.index1].items[transactionContext.index2].transactions.push(tx);
    }
    closeModal('transactionModal');
    renderEditor();
}

// --- SAVE & CLEAR ---
function saveMonth() {
    if (!currentMonth) return;
    
    let totalIncome = currentMonth.incomes.reduce((acc, inc) => acc + inc.amount, 0);
    let totalExpense = 0;
    currentMonth.categories.forEach(cat => { cat.items.forEach(item => totalExpense += item.amount); });
    currentMonth.remaining = totalIncome - totalExpense;
    currentMonth.income = totalIncome;
    currentMonth.expense = totalExpense;

    const data = getSavedData();
    const existingIndex = data.months.findIndex(m => m.id === currentMonth.id);
    if (existingIndex >= 0) {
        data.months[existingIndex] = currentMonth;
    } else {
        data.months.push(currentMonth);
    }
    
    data.months = data.months.filter(m => m.id && m.id.includes('-'));
    setSavedData(data);
    switchTab('overview');
}

function clearAllData() {
    if(confirm("Tüm kayıtlı bütçeler ve HESABINIZ SİLİNECEK. Emin misiniz?")) {
        if(currentUser) {
            localStorage.removeItem('budgetApp_data_' + currentUser);
            let users = JSON.parse(localStorage.getItem('budgetApp_users') || '{}');
            delete users[currentUser];
            localStorage.setItem('budgetApp_users', JSON.stringify(users));
            logout();
        }
    }
}
// --- UI / TABS ---
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    
    // Update bottom nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    let navItem = document.getElementById('nav-' + tabName);
    if(navItem) navItem.classList.add('active');
    
    if (tabName === 'overview') loadOverview();
}

// Init
const savedTheme = localStorage.getItem('budgetApp_theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    const checkbox = document.getElementById('checkbox');
    if (checkbox) checkbox.checked = true;
}

// --- AUTHENTICATION ---
let isLoginMode = true;
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Giriş Yap' : 'Kayıt Ol';
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? 'Giriş Yap' : 'Hesap Oluştur';
    document.getElementById('auth-toggle-btn').innerText = isLoginMode ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap';
}

function handleAuthSubmit() {
    const user = document.getElementById('auth-username').value.trim();
    const pass = document.getElementById('auth-password').value.trim();
    if(!user || !pass) return alert("Kullanıcı adı ve şifre zorunludur.");
    
    let users = JSON.parse(localStorage.getItem('budgetApp_users') || '{}');
    
    if (isLoginMode) {
        if (!users[user]) return alert("Kullanıcı bulunamadı.");
        if (users[user].password !== btoa(pass)) return alert("Hatalı şifre.");
        loginUser(user);
    } else {
        if (users[user]) return alert("Bu kullanıcı adı zaten alınmış.");
        
        users[user] = { password: btoa(pass) };
        localStorage.setItem('budgetApp_users', JSON.stringify(users));
        
        let oldData = localStorage.getItem('budgetApp_data');
        if (oldData && Object.keys(users).length === 1) {
            if(confirm("Daha önceki şifresiz bütçe verilerinizi bu yeni hesaba aktarmak ister misiniz?")) {
                localStorage.setItem('budgetApp_data_' + user, oldData);
                localStorage.removeItem('budgetApp_data');
            }
        }
        loginUser(user);
    }
}

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('budgetApp_currentUser', user);
    document.getElementById('auth-screen').style.display = 'none';
    switchTab('overview');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('budgetApp_currentUser');
    location.reload();
}

function checkAuthOnLoad() {
    if (!currentUser) {
        document.getElementById('auth-screen').style.display = 'flex';
    } else {
        document.getElementById('auth-screen').style.display = 'none';
        switchTab('overview');
    }
}

// --- BACKUP & RESTORE ---
function downloadBackup() {
    if(!currentUser) return;
    const dataStr = localStorage.getItem('budgetApp_data_' + currentUser) || "{}";
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `Butce_Yedek_${currentUser}.json`;

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function uploadBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.months !== undefined) {
                localStorage.setItem('budgetApp_data_' + currentUser, JSON.stringify(data));
                alert("Yedek başarıyla yüklendi!");
                location.reload();
            } else {
                alert("Geçersiz yedek dosyası.");
            }
        } catch (err) {
            alert("Dosya okunamadı.");
        }
    };
    reader.readAsText(file);
}

checkAuthOnLoad();

// --- THEME ---
function toggleTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light-theme');
        localStorage.setItem('budgetApp_theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('budgetApp_theme', 'dark');
    }
}

// --- CAROUSEL LOGIC ---
let currentSlide = 0;
function goToSlide(index) {
    currentSlide = index;
    document.getElementById('carouselTrack').style.transform = `translateX(-${index * 50}%)`;
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        if(i === index) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

const carouselContainer = document.getElementById('overviewCarousel');
let startX = 0;
let isDragging = false;

if (carouselContainer) {
    carouselContainer.addEventListener('mousedown', e => { startX = e.pageX; isDragging = true; });
    carouselContainer.addEventListener('touchstart', e => { startX = e.touches[0].pageX; isDragging = true; });

    carouselContainer.addEventListener('mouseup', handleDragEnd);
    carouselContainer.addEventListener('touchend', handleDragEnd);
}

function handleDragEnd(e) {
    if(!isDragging) return;
    isDragging = false;
    let endX = e.type.includes('mouse') ? e.pageX : e.changedTouches[0].pageX;
    let diff = startX - endX;
    
    if (diff > 50 && currentSlide < 1) goToSlide(currentSlide + 1);
    else if (diff < -50 && currentSlide > 0) goToSlide(currentSlide - 1);
}
