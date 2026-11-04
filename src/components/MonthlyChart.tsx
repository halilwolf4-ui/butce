import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MonthData, formatMoney, TR_MONTHS } from '../types';
import { LineChart as LineIcon, PieChart as PieIcon, Activity, Calendar, X, ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react';

interface MonthlyChartProps {
  month: MonthData;
  isLight?: boolean;
}

interface DayExpenseItem {
  itemName: string;
  categoryName: string;
  desc?: string;
  amount: number;
}

interface SubItemData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryWithSubItems {
  name: string;
  amount: number;
  color: string;
  percentage: number;
  items: SubItemData[];
}

const CATEGORY_COLORS = [
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#14b8a6', // teal
];

// Color palette generator for sub-items based on parent category color
const generateSubColors = (baseColor: string, count: number): string[] => {
  const palettes: Record<string, string[]> = {
    '#06b6d4': ['#06b6d4', '#22d3ee', '#38bdf8', '#0891b2', '#0284c7', '#67e8f9', '#a5f3fc', '#0e7490'],
    '#f43f5e': ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#f472b6', '#db2777', '#fecdd3', '#be123c'],
    '#10b981': ['#10b981', '#34d399', '#6ee7b7', '#059669', '#14b8a6', '#2dd4bf', '#a7f3d0', '#047857'],
    '#f59e0b': ['#f59e0b', '#fbbf24', '#fcd34d', '#d97706', '#f97316', '#fb923c', '#fef08a', '#b45309'],
    '#8b5cf6': ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6366f1', '#818cf8', '#ddd6fe', '#6d28d9'],
    '#ec4899': ['#ec4899', '#f472b6', '#f9a8d4', '#db2777', '#d946ef', '#e879f9', '#fce7f3', '#be185d'],
    '#3b82f6': ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#0284c7', '#38bdf8', '#bfdbfe', '#1d4ed8'],
    '#14b8a6': ['#14b8a6', '#2dd4bf', '#5eead4', '#0d9488', '#06b6d4', '#22d3ee', '#99f6e4', '#0f766e'],
  };

  const fallback = [
    baseColor,
    '#38bdf8',
    '#a78bfa',
    '#34d399',
    '#fb7185',
    '#fbbf24',
    '#2dd4bf',
    '#f472b6'
  ];

  const palette = palettes[baseColor] || fallback;
  return Array.from({ length: Math.max(count, 1) }, (_, i) => palette[i % palette.length]);
};

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ month, isLight = false }) => {
  const [chartType, setChartType] = useState<'line' | 'pie'>('line');
  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number } | null>(null);
  const [popupDay, setPopupDay] = useState<number | null>(null);
  
  // Drill-down Category & Sub-item selection
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSegmentName, setActiveSegmentName] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract month and year info
  const { year, monthIdx, monthName } = useMemo(() => {
    const parts = month.id.split('-');
    const y = parseInt(parts[0], 10);
    const mIdx = parseInt(parts[1], 10);
    return {
      year: isNaN(y) ? new Date().getFullYear() : y,
      monthIdx: isNaN(mIdx) ? 0 : mIdx,
      monthName: TR_MONTHS[mIdx] || 'Bu Ay'
    };
  }, [month.id]);

  // Extract daily spending EXCLUDING recurring/fixed expenses (kalıcı harcamalar) & debts
  const { dailyData, dayExpensesMap } = useMemo(() => {
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    const totals: Record<number, number> = {};
    const expensesMap: Record<number, DayExpenseItem[]> = {};

    for (let i = 1; i <= daysInMonth; i++) {
      totals[i] = 0;
      expensesMap[i] = [];
    }

    month.categories.forEach(cat => {
      // Kalıcı harcamaları ve borç kategorilerini grafikten hariç tut
      if (cat.isRecurringCategory || cat.isDebtCategory) return;

      cat.items.forEach(item => {
        // Kalıcı gider ile bağlı kalemleri de hariç tut
        if (item.linkedRecurringId || item.linkedDebtId) return;

        if (item.transactions && item.transactions.length > 0) {
          item.transactions.forEach(tx => {
            if (tx.amount > 0 && tx.date) {
              let day = NaN;
              if (tx.date.includes('/')) {
                day = parseInt(tx.date.split('/')[0], 10);
              } else if (tx.date.includes('-')) {
                const parts = tx.date.split('-');
                day = parseInt(parts[2] || parts[0], 10);
              } else if (tx.date.includes('.')) {
                day = parseInt(tx.date.split('.')[0], 10);
              }

              if (!isNaN(day) && day >= 1 && day <= daysInMonth) {
                totals[day] = (totals[day] || 0) + tx.amount;
                expensesMap[day].push({
                  itemName: item.name,
                  categoryName: cat.name,
                  desc: tx.desc,
                  amount: tx.amount
                });
              }
            }
          });
        }
      });
    });

    const entries = Object.entries(totals).map(([d, val]) => ({
      day: parseInt(d, 10),
      amount: val
    }));

    const maxVal = Math.max(...entries.map(e => e.amount), 500);

    return {
      dailyData: { entries, maxVal, daysInMonth },
      dayExpensesMap: expensesMap
    };
  }, [month, year, monthIdx]);

  // Extract category & sub-item spending with drill-down data
  const categoryData = useMemo(() => {
    const list: CategoryWithSubItems[] = [];
    let totalCatExpense = 0;

    month.categories.forEach((cat, idx) => {
      if (cat.isRecurringCategory || cat.isDebtCategory) return;

      const baseColor = cat.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
      const validItems: { name: string; amount: number }[] = [];
      let catSum = 0;

      cat.items.forEach(item => {
        if (item.linkedRecurringId || item.linkedDebtId) return;
        const amt = item.amount || 0;
        if (amt > 0) {
          catSum += amt;
          validItems.push({ name: item.name, amount: amt });
        }
      });

      if (catSum > 0) {
        totalCatExpense += catSum;

        // Generate sub-item colors and percentages
        const subColors = generateSubColors(baseColor, validItems.length);
        const subItemsList: SubItemData[] = validItems.map((v, sIdx) => ({
          name: v.name,
          amount: v.amount,
          percentage: catSum > 0 ? Math.round((v.amount / catSum) * 100) : 0,
          color: subColors[sIdx % subColors.length]
        })).sort((a, b) => b.amount - a.amount);

        list.push({
          name: cat.name,
          amount: catSum,
          color: baseColor,
          percentage: 0,
          items: subItemsList
        });
      }
    });

    list.sort((a, b) => b.amount - a.amount);
    list.forEach(c => {
      c.percentage = totalCatExpense > 0 ? Math.round((c.amount / totalCatExpense) * 100) : 0;
    });

    return { list, total: totalCatExpense };
  }, [month]);

  // Dimensions for responsive clean coordinate system
  const chartWidth = 370;
  const chartHeight = 124;
  const paddingLeft = 46;
  const paddingRight = 10;
  const paddingTop = 14;
  const paddingBottom = 22;
  const baseY = chartHeight - paddingBottom;
  const midY = (paddingTop + baseY) / 2;

  // Generate SVG path for line chart with coordinates
  const { pathD, areaD, points } = useMemo(() => {
    const { entries, maxVal } = dailyData;

    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = chartHeight - paddingTop - paddingBottom;

    const pts = entries.map((entry, idx) => {
      const x = paddingLeft + (idx / Math.max(entries.length - 1, 1)) * usableWidth;
      const y = baseY - (entry.amount / maxVal) * usableHeight;
      return { x, y, day: entry.day, amount: entry.amount };
    });

    if (pts.length === 0) return { pathD: '', areaD: '', points: [] };

    // Bezier smoothing
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const area = `${d} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;

    return { pathD: d, areaD: area, points: pts };
  }, [dailyData, chartWidth, chartHeight, paddingLeft, paddingRight, paddingTop, paddingBottom, baseY]);

  // 1-Second Hold Timer Management (Detailed Daily Spending Popup)
  const resetTimerForDay = useCallback((day: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setPopupDay(day);
    }, 1000);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // Interactive Drag / Scrub Handler
  const handlePointerMoveCoords = useCallback(
    (clientX: number) => {
      if (!svgRef.current || points.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const relX = clientX - rect.left;
      const svgX = (relX / rect.width) * chartWidth;

      let closestPt = points[0];
      let minDiff = Math.abs(points[0].x - svgX);

      for (let i = 1; i < points.length; i++) {
        const diff = Math.abs(points[i].x - svgX);
        if (diff < minDiff) {
          minDiff = diff;
          closestPt = points[i];
        }
      }

      setHoveredDay({ day: closestPt.day, amount: closestPt.amount });
      resetTimerForDay(closestPt.day);
    },
    [points, chartWidth, resetTimerForDay]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsInteracting(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerMoveCoords(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteracting && e.buttons === 0 && e.pointerType === 'touch') return;
    handlePointerMoveCoords(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsInteracting(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  const handlePointerLeave = () => {
    if (!isInteracting) {
      clearTimer();
      setHoveredDay(null);
    }
  };

  // Selected Category Drill-down Object
  const currentSelectedCat = useMemo(() => {
    if (!selectedCategory) return null;
    return categoryData.list.find(c => c.name === selectedCategory) || null;
  }, [selectedCategory, categoryData]);

  // Donut chart segments: either main categories OR sub-items of selected category
  const donutSegments = useMemo(() => {
    const radius = 42;
    const cx = 60;
    const cy = 60;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    let currentAngle = -90;

    if (currentSelectedCat) {
      // Sub-items of the selected category
      const subTotal = currentSelectedCat.amount;
      if (subTotal === 0 || currentSelectedCat.items.length === 0) return [];

      return currentSelectedCat.items.map(item => {
        const ratio = item.amount / subTotal;
        const strokeDasharray = `${ratio * circumference} ${circumference}`;
        const rotation = currentAngle;
        currentAngle += ratio * 360;

        return {
          name: item.name,
          amount: item.amount,
          color: item.color,
          percentage: item.percentage,
          cx,
          cy,
          radius,
          strokeWidth,
          strokeDasharray,
          rotation
        };
      });
    }

    // Main Categories
    const { list, total } = categoryData;
    if (total === 0 || list.length === 0) return [];

    return list.map(item => {
      const ratio = item.amount / total;
      const strokeDasharray = `${ratio * circumference} ${circumference}`;
      const rotation = currentAngle;
      currentAngle += ratio * 360;

      return {
        name: item.name,
        amount: item.amount,
        color: item.color,
        percentage: item.percentage,
        cx,
        cy,
        radius,
        strokeWidth,
        strokeDasharray,
        rotation
      };
    });
  }, [categoryData, currentSelectedCat]);

  const activeDayExpenses = popupDay !== null ? dayExpensesMap[popupDay] || [] : [];
  const activeDayTotal = popupDay !== null ? dailyData.entries.find(e => e.day === popupDay)?.amount || 0 : 0;
  const currentHoveredPt = hoveredDay ? points.find(p => p.day === hoveredDay.day) : null;

  return (
    <div
      className={`rounded-lg p-3.5 border-2 transition-all relative overflow-hidden ${
        isLight
          ? 'bg-white border-[#4361ee]/25 shadow-sm'
          : 'bg-[#181427] border-[#372d4c] shadow-lg'
      }`}
    >
      {/* Header with Title & Chart Mode Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center ${
              isLight ? 'bg-[#4361ee]/15 text-[#4361ee]' : 'bg-cyan-500/10 text-cyan-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black tracking-tight font-mono ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                {chartType === 'line'
                  ? 'Günlük Harcama Trendi'
                  : currentSelectedCat
                  ? `${currentSelectedCat.name} (Alt Kalemler)`
                  : 'Kategori Dağılımı'}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400'
                }`}
              >
                Kalıcı Hariç
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {chartType === 'line'
                ? hoveredDay
                  ? `Gün ${hoveredDay.day} (${monthName}): ${formatMoney(hoveredDay.amount)}`
                  : 'Grafikte parmağınızla gezinebilirsiniz'
                : currentSelectedCat
                ? `Kategori Toplamı: ${formatMoney(currentSelectedCat.amount)} (%${currentSelectedCat.percentage})`
                : `Toplam: ${formatMoney(categoryData.total)} • Başlığa dokunup alt kalemleri görün`}
            </p>
          </div>
        </div>

        {/* Toggle Pills */}
        <div
          className={`flex items-center p-0.5 rounded-md border ${
            isLight
              ? 'bg-slate-100 border-slate-200'
              : 'bg-[#120f1e] border-[#372d4c]'
          }`}
        >
          <button
            onClick={() => {
              setChartType('line');
              setPopupDay(null);
            }}
            className={`p-1.5 rounded-md transition-all ${
              chartType === 'line'
                ? isLight
                  ? 'bg-[#4361ee] text-white shadow-sm'
                  : 'bg-cyan-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Çizgi Grafik"
          >
            <LineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setChartType('pie');
              setPopupDay(null);
            }}
            className={`p-1.5 rounded-md transition-all ${
              chartType === 'pie'
                ? isLight
                  ? 'bg-[#4361ee] text-white shadow-sm'
                  : 'bg-cyan-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pasta / Donut Grafik"
          >
            <PieIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative min-h-[140px] flex items-center justify-center">
        {chartType === 'line' ? (
          <div className="w-full relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-32 overflow-visible select-none cursor-ew-resize"
              style={{ touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerLeave}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={chartWidth - paddingRight}
                y2={paddingTop}
                stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={paddingLeft}
                y1={midY}
                x2={chartWidth - paddingRight}
                y2={midY}
                stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={paddingLeft}
                y1={baseY}
                x2={chartWidth - paddingRight}
                y2={baseY}
                stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}
                strokeWidth="1"
              />

              {/* Y-Axis Left Divider Line */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={baseY}
                stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}
                strokeWidth="1"
              />

              {/* Y-Axis Coordinate Labels */}
              <g className={isLight ? 'fill-slate-500 font-mono text-[9px]' : 'fill-slate-400 font-mono text-[9px]'}>
                <text x={paddingLeft - 5} y={paddingTop + 3} textAnchor="end" fontWeight="600">
                  {formatMoney(dailyData.maxVal)}
                </text>
                <text x={paddingLeft - 5} y={midY + 3} textAnchor="end" fontWeight="500">
                  {formatMoney(Math.round(dailyData.maxVal / 2))}
                </text>
                <text x={paddingLeft - 5} y={baseY + 3} textAnchor="end" fontWeight="500">
                  0 ₺
                </text>
              </g>

              {/* Gradient Area Fill */}
              {areaD && (
                <path d={areaD} fill="url(#areaGradient)" />
              )}

              {/* Glowing Line Stroke */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="drop-shadow(0 2px 6px rgba(6, 182, 212, 0.4))"
                />
              )}

              {/* Data points */}
              {points.map((pt, idx) => {
                const hasSpend = pt.amount > 0;
                if (!hasSpend) return null;
                return (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="2.5"
                    fill="#06b6d4"
                    opacity="0.9"
                  />
                );
              })}

              {/* Active Hover / Drag Indicator */}
              {currentHoveredPt && (
                <g className="pointer-events-none">
                  <line
                    x1={currentHoveredPt.x}
                    y1={paddingTop}
                    x2={currentHoveredPt.x}
                    y2={baseY}
                    stroke={isLight ? '#4361ee' : '#38bdf8'}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.9"
                  />
                  <circle
                    cx={currentHoveredPt.x}
                    cy={currentHoveredPt.y}
                    r="6"
                    fill={isLight ? '#4361ee' : '#38bdf8'}
                    stroke={isLight ? '#ffffff' : '#0f172a'}
                    strokeWidth="2.5"
                  />
                </g>
              )}

              {/* X-Axis Day Labels */}
              <g className={isLight ? 'fill-slate-500 font-mono text-[9px]' : 'fill-slate-400 font-mono text-[9px]'}>
                {points[0] && (
                  <text x={points[0].x} y="118" textAnchor="middle">
                    1
                  </text>
                )}
                {points[7] && (
                  <text x={points[7].x} y="118" textAnchor="middle">
                    8
                  </text>
                )}
                {points[14] && (
                  <text x={points[14].x} y="118" textAnchor="middle">
                    15
                  </text>
                )}
                {points[21] && (
                  <text x={points[21].x} y="118" textAnchor="middle">
                    22
                  </text>
                )}
                {points[points.length - 1] && (
                  <text x={points[points.length - 1].x} y="118" textAnchor="middle">
                    {dailyData.daysInMonth}
                  </text>
                )}
              </g>
            </svg>
          </div>
        ) : (
          /* Drill-down Donut / Pie View */
          <div className="w-full flex items-center justify-between gap-3 py-1">
            {/* SVG Animated Donut */}
            <div
              className="relative shrink-0 w-28 h-28 flex items-center justify-center group cursor-pointer"
              onClick={() => {
                // If drilled in, clicking center returns to main view
                if (currentSelectedCat) {
                  setSelectedCategory(null);
                  setActiveSegmentName(null);
                }
              }}
              title={currentSelectedCat ? 'Ana kategorilere dönmek için tıklayın' : undefined}
            >
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 transition-transform duration-500">
                {/* Background Ring with accent color glow when selected */}
                <circle
                  cx="60"
                  cy="60"
                  r="42"
                  fill="transparent"
                  stroke={
                    currentSelectedCat
                      ? `${currentSelectedCat.color}25`
                      : isLight
                      ? 'rgba(0,0,0,0.06)'
                      : 'rgba(255,255,255,0.06)'
                  }
                  strokeWidth="14"
                />

                {donutSegments.map((seg, idx) => {
                  const isHighlighted = activeSegmentName === seg.name;
                  return (
                    <circle
                      key={`${currentSelectedCat?.name || 'main'}-${seg.name}-${idx}`}
                      cx={seg.cx}
                      cy={seg.cy}
                      r={seg.radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHighlighted ? 18 : 14}
                      strokeDasharray={seg.strokeDasharray}
                      style={{
                        transformOrigin: 'center',
                        transform: `rotate(${seg.rotation}deg)`,
                        transition: 'stroke-dasharray 0.45s ease, stroke-width 0.2s ease, stroke 0.45s ease, transform 0.45s ease'
                      }}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveSegmentName(seg.name)}
                      onMouseLeave={() => setActiveSegmentName(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentSelectedCat) {
                          // Drill down into clicked category
                          setSelectedCategory(seg.name);
                          setActiveSegmentName(null);
                        } else {
                          setActiveSegmentName(activeSegmentName === seg.name ? null : seg.name);
                        }
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center Stat / Drill-down Status */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
                {currentSelectedCat ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <span
                      className="text-[9px] font-black uppercase tracking-wider truncate max-w-[70px]"
                      style={{ color: currentSelectedCat.color }}
                    >
                      {currentSelectedCat.name}
                    </span>
                    <span className={`text-[11px] font-black font-mono leading-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                      {formatMoney(currentSelectedCat.amount)}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono mt-0.5 opacity-80">
                      ← Geri
                    </span>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Gider</span>
                    <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                      {formatMoney(categoryData.total)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category / Sub-items Legend List */}
            <div className="flex-1 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {/* If drilled down into a category, show Parent Header + Sub-items */}
              {currentSelectedCat ? (
                <div className="space-y-1.5">
                  {/* Active Parent Category Bar & Back Button */}
                  <div
                    onClick={() => {
                      setSelectedCategory(null);
                      setActiveSegmentName(null);
                    }}
                    className={`flex items-center justify-between p-1.5 rounded-md border cursor-pointer transition-all ${
                      isLight
                        ? 'bg-[#4361ee]/10 border-[#4361ee]/30 text-slate-800 hover:bg-[#4361ee]/15'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                      <ArrowLeft className="w-3 h-3 shrink-0" />
                      <span className="font-bold text-[11px] truncate">
                        {currentSelectedCat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-black shrink-0">
                      <span>%{currentSelectedCat.percentage}</span>
                      <span>({formatMoney(currentSelectedCat.amount)})</span>
                    </div>
                  </div>

                  {/* Sub-items List */}
                  {currentSelectedCat.items.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">Alt harcama kalemi yok</p>
                  ) : (
                    currentSelectedCat.items.map((sub, idx) => {
                      const isHighlighted = activeSegmentName === sub.name;
                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setActiveSegmentName(sub.name)}
                          onMouseLeave={() => setActiveSegmentName(null)}
                          onClick={() => setActiveSegmentName(isHighlighted ? null : sub.name)}
                          className={`flex items-center justify-between text-xs p-1 rounded-md cursor-pointer transition-colors ${
                            isHighlighted
                              ? isLight
                                ? 'bg-slate-200/80'
                                : 'bg-white/[0.12]'
                              : isLight
                              ? 'hover:bg-slate-100'
                              : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate max-w-[125px]">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sub.color }}
                            />
                            <span className={`truncate text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              {sub.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] tabular-nums font-mono">
                            <span className="text-slate-400">%{sub.percentage}</span>
                            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              {formatMoney(sub.amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Main Category List */
                categoryData.list.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Harcama bulunmuyor</p>
                ) : (
                  categoryData.list.map((cat, idx) => {
                    const isHighlighted = activeSegmentName === cat.name;
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setActiveSegmentName(cat.name)}
                        onMouseLeave={() => setActiveSegmentName(null)}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setActiveSegmentName(null);
                        }}
                        className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition-all ${
                          isHighlighted
                            ? isLight
                              ? 'bg-slate-200/80 shadow-sm'
                              : 'bg-white/[0.08] shadow-sm'
                            : isLight
                            ? 'hover:bg-slate-100'
                            : 'hover:bg-white/[0.04]'
                        }`}
                        title="Alt kalemlerini görmek için tıklayın"
                      >
                        <div className="flex items-center gap-1.5 truncate max-w-[125px]">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span
                            className={`truncate font-medium text-[11px] ${
                              isLight ? 'text-slate-700' : 'text-slate-300'
                            }`}
                          >
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] tabular-nums font-mono">
                          <span className="text-slate-400 text-[10px]">%{cat.percentage}</span>
                          <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            {formatMoney(cat.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        )}

        {/* 2-Second Hold Daily Expenses Popup */}
        <AnimatePresence>
          {popupDay !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 6 }}
              transition={{ duration: 0.18 }}
              className={`absolute inset-x-2 top-0 bottom-0 z-30 rounded-lg p-3 backdrop-blur-md border flex flex-col shadow-2xl ${
                isLight
                  ? 'bg-white/95 border-[#4361ee]/40 text-slate-800'
                  : 'bg-[#151022]/95 border-cyan-500/40 text-slate-100'
              }`}
            >
              {/* Popup Header */}
              <div className="flex items-center justify-between border-b pb-2 mb-2 border-inherit/20">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center ${
                      isLight ? 'bg-[#4361ee]/15 text-[#4361ee]' : 'bg-cyan-500/20 text-cyan-400'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono">
                      {popupDay} {monthName} {year}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Toplam:{' '}
                      <strong className={isLight ? 'text-[#f72585]' : 'text-cyan-400'}>
                        {formatMoney(activeDayTotal)}
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setPopupDay(null)}
                  className={`p-1 rounded-md transition-colors ${
                    isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-300'
                  }`}
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Popup Body - List of daily items */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {activeDayExpenses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-2">
                    <ShoppingBag className="w-5 h-5 text-slate-400 mb-1 opacity-50" />
                    <p className="text-[11px] text-slate-400 font-mono">Bu güne ait harcama kaydı yok</p>
                  </div>
                ) : (
                  activeDayExpenses.map((exp, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between text-xs p-1.5 rounded border ${
                        isLight
                          ? 'bg-slate-50 border-slate-200/80'
                          : 'bg-[#1b152b] border-[#362b4c]'
                      }`}
                    >
                      <div className="truncate max-w-[190px]">
                        <div className="font-semibold text-[11px] truncate flex items-center gap-1">
                          <span>{exp.itemName}</span>
                          {exp.desc && (
                            <span className="text-[10px] text-slate-400 font-normal truncate">
                              ({exp.desc})
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">
                          {exp.categoryName}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold text-[11px] tabular-nums ${
                          isLight ? 'text-[#f72585]' : 'text-cyan-400'
                        }`}
                      >
                        {formatMoney(exp.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
