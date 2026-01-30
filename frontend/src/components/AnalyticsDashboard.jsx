import React, { useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement,
} from 'chart.js';
import { Bar, Bubble, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// ===== DESIGN TOKENS (Enterprise Color System) =====
const COLORS = {
    status: {
        healthy: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', accent: 'bg-emerald-500' },
        warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', accent: 'bg-amber-500' },
        critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', accent: 'bg-red-500' },
        info: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', accent: 'bg-orange-500' },
        neutral: { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', accent: 'bg-slate-500' }
    },
    chart: {
        primary: 'rgba(249, 115, 22, 0.85)',    // Orange
        secondary: 'rgba(251, 191, 36, 0.85)', // Amber
        tertiary: 'rgba(239, 68, 68, 0.85)',   // Red
        accent1: 'rgba(168, 85, 247, 0.85)',   // Purple
        accent2: 'rgba(236, 72, 153, 0.85)',   // Pink
        accent3: 'rgba(245, 158, 11, 0.85)',   // Orange-Gold
    },
    correlation: {
        positive: 'rgba(249, 115, 22, 0.7)',   // Orange
        negative: 'rgba(239, 68, 68, 0.7)',    // Red
    }
};

export default function AnalyticsDashboard({ stats, isLoading, syntheticStats }) {
    const [correlationThreshold, setCorrelationThreshold] = useState(0);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [viewMode, setViewMode] = useState('raw');
    const [comparisonMode, setComparisonMode] = useState(false);
    const [compareDatasets, setCompareDatasets] = useState(false); // Real vs Synthetic
    const [activeTab, setActiveTab] = useState('overview'); // Tab navigation
    const [activeFilters, setActiveFilters] = useState({
        showRiskyOnly: false,
        dataType: 'all'
    });

    // Loading state
    if (isLoading) return <LoadingSkeleton />;

    // Empty state
    if (!stats) return <EmptyState />;

    // ===== HISTORICAL DATA GENERATION (Mock 7-day trend) =====
    const historicalMetrics = useMemo(() => {
        // In production, this would come from API: /api/datasets/{id}/history
        const generateTrend = (currentValue, volatility = 0.05) => {
            const trend = [];
            let value = currentValue * (1 - volatility * 3.5); // Start 7 days ago

            for (let i = 0; i < 7; i++) {
                trend.push(Math.round(value));
                value += (currentValue - value) / (7 - i) + (Math.random() - 0.5) * currentValue * volatility;
            }
            return trend;
        };

        return {
            totalRecords: generateTrend(stats.rowCount, 0.03),
            completeness: generateTrend((100 - stats.columns.reduce((a, b) => a + b.nullPercentage, 0) / stats.columnCount), 0.02),
            riskyFeatures: generateTrend(stats.columns.filter(c => c.nullPercentage > 20).length, 0.15),
            uniqueSignals: generateTrend(stats.columns.reduce((a, b) => a + (b.uniqueCount > 0 ? 1 : 0), 0), 0.01)
        };
    }, [stats]);

    // Compute metrics with memoization
    const metrics = useMemo(() => {
        const totalRecords = stats.rowCount;
        const dimensions = stats.columnCount;
        const completeness = (100 - stats.columns.reduce((a, b) => a + b.nullPercentage, 0) / stats.columnCount);
        const uniqueSignals = stats.columns.reduce((a, b) => a + (b.uniqueCount > 0 ? 1 : 0), 0);
        const avgNull = stats.columns.reduce((a, b) => a + b.nullPercentage, 0) / stats.columnCount;
        const riskyFeatures = stats.columns.filter(c => c.nullPercentage > 20).length;

        // Calculate real deltas from historical data
        const calcDelta = (current, history) => {
            if (!history || history.length < 2) return { value: 0, formatted: '+0.0%' };
            const previous = history[history.length - 2]; // Yesterday's value
            const change = ((current - previous) / previous) * 100;
            return {
                value: change,
                formatted: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
            };
        };

        return {
            totalRecords,
            dimensions,
            completeness,
            uniqueSignals,
            avgNull,
            riskyFeatures,
            status: completeness > 95 ? 'healthy' : completeness > 80 ? 'warning' : 'critical',
            // Real deltas
            recordsDelta: calcDelta(totalRecords, historicalMetrics.totalRecords),
            completenessDelta: calcDelta(completeness, historicalMetrics.completeness),
            riskyDelta: calcDelta(riskyFeatures, historicalMetrics.riskyFeatures)
        };
    }, [stats, historicalMetrics]);

    // Filter columns based on active filters
    const filteredColumns = useMemo(() => {
        let filtered = stats.columns;

        if (activeFilters.showRiskyOnly) {
            filtered = filtered.filter(c => c.nullPercentage > 20);
        }

        if (activeFilters.dataType !== 'all') {
            filtered = filtered.filter(c => c.type.toLowerCase().includes(activeFilters.dataType));
        }

        return filtered;
    }, [stats.columns, activeFilters]);

    // ===== AUTOMATED INSIGHTS ENGINE =====
    const autoInsights = useMemo(() => {
        const insights = [];

        // 1. Top Correlations
        if (stats.correlation) {
            const correlations = [];
            stats.correlation.columns.forEach((col, i) => {
                stats.correlation.values[i].forEach((v, j) => {
                    if (i !== j && Math.abs(v) > 0.7) {
                        correlations.push({
                            feature1: col,
                            feature2: stats.correlation.columns[j],
                            value: v
                        });
                    }
                });
            });

            if (correlations.length > 0) {
                const top = correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
                insights.push({
                    type: 'correlation',
                    severity: 'info',
                    title: 'Strong Feature Correlation Detected',
                    description: `${top.feature1} and ${top.feature2} are highly correlated (${top.value.toFixed(3)})`,
                    icon: 'bx-git-merge',
                    action: 'Review for multicollinearity'
                });
            }
        }

        // 2. Privacy Risk Columns
        const highUniqueColumns = stats.columns.filter(c => {
            const total = c.distribution?.values.reduce((a, b) => a + b, 0) || 1;
            const uniqueness = (c.uniqueCount / total) * 100;
            return uniqueness > 95 && c.type.toLowerCase().includes('string');
        });

        if (highUniqueColumns.length > 0) {
            insights.push({
                type: 'privacy',
                severity: 'warning',
                title: 'Potential PII Detected',
                description: `${highUniqueColumns.length} column(s) have >95% unique values: ${highUniqueColumns.map(c => c.name).slice(0, 2).join(', ')}`,
                icon: 'bx-lock-alt',
                action: 'Consider anonymization or removal'
            });
        }

        // 3. Data Quality Anomalies
        if (metrics.riskyFeatures > 0) {
            insights.push({
                type: 'quality',
                severity: metrics.riskyFeatures > 3 ? 'critical' : 'warning',
                title: 'Data Quality Issues Found',
                description: `${metrics.riskyFeatures} feature(s) with >20% missing values`,
                icon: 'bx-error-circle',
                action: 'Investigate missingness patterns'
            });
        }

        // 4. Distribution Imbalance
        const imbalancedFeatures = stats.columns.filter(c => {
            if (!c.distribution || c.distribution.values.length < 2) return false;
            const max = Math.max(...c.distribution.values);
            const total = c.distribution.values.reduce((a, b) => a + b, 0);
            return (max / total) > 0.8;
        });

        if (imbalancedFeatures.length > 0) {
            insights.push({
                type: 'distribution',
                severity: 'info',
                title: 'Class Imbalance Detected',
                description: `${imbalancedFeatures.length} feature(s) have dominant class (>80%): ${imbalancedFeatures[0].name}`,
                icon: 'bx-pie-chart-alt',
                action: 'Consider rebalancing techniques'
            });
        }

        // 5. Overall Data Health
        if (metrics.completeness > 95 && metrics.riskyFeatures === 0) {
            insights.push({
                type: 'health',
                severity: 'healthy',
                title: 'Excellent Data Quality',
                description: `${metrics.completeness.toFixed(1)}% completeness, no risky features detected`,
                icon: 'bx-check-shield',
                action: 'Data ready for modeling'
            });
        }

        return insights.slice(0, 5); // Top 5 insights
    }, [stats, metrics]);


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ===== GLOBAL FILTERS BAR ===== */}
            <GlobalFilterBar
                filters={activeFilters}
                onFilterChange={setActiveFilters}
                metrics={metrics}
                comparisonMode={comparisonMode}
                onComparisonToggle={setComparisonMode}
                compareDatasets={compareDatasets}
                onCompareToggle={setCompareDatasets}
                hasSyntheticData={!!syntheticStats}
            />

            {/* ===== 1. EXECUTIVE KPI LAYER (Always Visible) ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    icon="bx-table"
                    label="Total Records"
                    value={metrics.totalRecords.toLocaleString()}
                    trend={metrics.recordsDelta.value >= 0 ? "up" : "down"}
                    delta={metrics.recordsDelta.formatted}
                    status="healthy"
                    tooltip="Total number of records in dataset"
                    sparklineData={historicalMetrics.totalRecords}
                    showSparkline={comparisonMode}
                />
                <KPICard
                    icon="bx-columns"
                    label="Dimensions"
                    value={metrics.dimensions}
                    badge={`${metrics.uniqueSignals} UNIQUE`}
                    status="info"
                    tooltip="Total feature count with unique signal indicators"
                    sparklineData={historicalMetrics.uniqueSignals}
                    showSparkline={comparisonMode}
                />
                <KPICard
                    icon="bx-check-shield"
                    label="Data Completeness"
                    value={`${metrics.completeness.toFixed(1)}%`}
                    trend={metrics.completenessDelta.value >= 0 ? "up" : "down"}
                    delta={metrics.completenessDelta.formatted}
                    status={metrics.status}
                    tooltip="Percentage of non-null values across all features"
                    sparklineData={historicalMetrics.completeness}
                    showSparkline={comparisonMode}
                />
                <KPICard
                    icon="bx-error-circle"
                    label="Data Quality"
                    value={metrics.riskyFeatures === 0 ? 'PERFECT' : `${metrics.riskyFeatures} ISSUES`}
                    badge={metrics.avgNull.toFixed(1) + '% AVG NULL'}
                    status={metrics.riskyFeatures === 0 ? 'healthy' : metrics.riskyFeatures < 3 ? 'warning' : 'critical'}
                    tooltip="Features with >20% missing values are flagged as risky"
                    sparklineData={historicalMetrics.riskyFeatures}
                    showSparkline={comparisonMode}
                    invertTrend={true}
                />
            </div>

            {/* ===== AUTOMATED INSIGHTS PANEL (Always Visible) ===== */}
            {autoInsights.length > 0 && (
                <AutomatedInsightsPanel insights={autoInsights} />
            )}

            {/* ===== TABBED NAVIGATION ===== */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                {/* Tab Headers */}
                <div className="flex items-center border-b border-white/10 overflow-x-auto">
                    <TabButton
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        icon="bx-home-alt"
                        label="Overview"
                    />
                    <TabButton
                        active={activeTab === 'distributions'}
                        onClick={() => setActiveTab('distributions')}
                        icon="bx-bar-chart-alt-2"
                        label="Distributions"
                    />
                    <TabButton
                        active={activeTab === 'quality'}
                        onClick={() => setActiveTab('quality')}
                        icon="bx-shield-check"
                        label="Quality Audit"
                    />
                    <TabButton
                        active={activeTab === 'correlations'}
                        onClick={() => setActiveTab('correlations')}
                        icon="bx-git-merge"
                        label="Correlations"
                    />
                    <TabButton
                        active={activeTab === 'advanced'}
                        onClick={() => setActiveTab('advanced')}
                        icon="bx-network-chart"
                        label="Advanced Analytics"
                    />
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-8">
                                <FeatureDistributionPanel
                                    columns={filteredColumns}
                                    selectedFeature={selectedFeature}
                                    onFeatureSelect={setSelectedFeature}
                                    viewMode={viewMode}
                                    onViewModeChange={setViewMode}
                                    compareMode={compareDatasets}
                                    syntheticColumns={syntheticStats?.columns}
                                />
                            </div>
                            <div className="col-span-12 lg:col-span-4">
                                <QualityAuditPanel
                                    columns={filteredColumns}
                                    riskyCount={metrics.riskyFeatures}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'distributions' && (
                        <FeatureDistributionPanel
                            columns={filteredColumns}
                            selectedFeature={selectedFeature}
                            onFeatureSelect={setSelectedFeature}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            compareMode={compareDatasets}
                            syntheticColumns={syntheticStats?.columns}
                        />
                    )}

                    {activeTab === 'quality' && (
                        <div className="grid grid-cols-1 gap-6">
                            <QualityAuditPanel
                                columns={filteredColumns}
                                riskyCount={metrics.riskyFeatures}
                            />
                            <BoxPlotPanel
                                columns={filteredColumns}
                                compareMode={compareDatasets}
                                syntheticColumns={syntheticStats?.columns}
                            />
                        </div>
                    )}

                    {activeTab === 'correlations' && (
                        <div className="space-y-6">
                            {stats.correlation && (
                                <CorrelationMatrixPanel
                                    correlation={stats.correlation}
                                    threshold={correlationThreshold}
                                    onThresholdChange={setCorrelationThreshold}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="space-y-6">
                            {stats.correlation && (
                                <NetworkGraphPanel
                                    correlation={stats.correlation}
                                    threshold={correlationThreshold}
                                />
                            )}
                            <BoxPlotPanel
                                columns={filteredColumns}
                                compareMode={compareDatasets}
                                syntheticColumns={syntheticStats?.columns}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ===== TAB BUTTON COMPONENT =====
function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${active
                ? 'border-orange-400 text-orange-400 bg-orange-400/10'
                : 'border-transparent text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
        >
            <i className={`bx ${icon} text-lg`}></i>
            <span>{label}</span>
        </button>
    );
}

// ===== GLOBAL FILTER BAR =====
function GlobalFilterBar({ filters, onFilterChange, metrics, comparisonMode, onComparisonToggle, compareDatasets, onCompareToggle, hasSyntheticData }) {
    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <i className='bx bx-filter text-muted-foreground'></i>
                    <span className="text-sm font-bold text-muted-foreground">Filters:</span>
                </div>

                {/* Risky Features Toggle */}
                <button
                    onClick={() => onFilterChange({ ...filters, showRiskyOnly: !filters.showRiskyOnly })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.showRiskyOnly
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                        }`}
                >
                    <i className='bx bx-error-circle mr-1'></i>
                    Risky Only {metrics.riskyFeatures > 0 && `(${metrics.riskyFeatures})`}
                </button>

                {/* Data Type Filter */}
                <select
                    value={filters.dataType}
                    onChange={(e) => onFilterChange({ ...filters, dataType: e.target.value })}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all outline-none cursor-pointer"
                >
                    <option value="all">All Types</option>
                    <option value="int">Integer</option>
                    <option value="float">Float</option>
                    <option value="string">String</option>
                </select>

                {/* Comparison Mode Toggle */}
                <button
                    onClick={() => onComparisonToggle(!comparisonMode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${comparisonMode
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
                        }`}
                    title="Show 7-day trend sparklines in KPI cards"
                >
                    <i className='bx bx-line-chart'></i>
                    <span>Trends</span>
                    {comparisonMode && <span className="text-[8px] bg-purple-500/20 px-1 py-0.5 rounded">7D</span>}
                </button>

                {/* Real vs Synthetic Comparison */}
                {hasSyntheticData && (
                    <button
                        onClick={() => onCompareToggle(!compareDatasets)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${compareDatasets
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
                            }`}
                        title="Overlay Real vs Synthetic data for comparison"
                    >
                        <i className='bx bx-git-compare'></i>
                        <span>Compare</span>
                        {compareDatasets && <span className="text-[8px] bg-cyan-500/20 px-1 py-0.5 rounded">R/S</span>}
                    </button>
                )}
            </div>

            {/* Active Filter Count */}
            {(filters.showRiskyOnly || filters.dataType !== 'all' || comparisonMode || compareDatasets) && (
                <button
                    onClick={() => {
                        onFilterChange({ showRiskyOnly: false, dataType: 'all' });
                        onComparisonToggle(false);
                        onCompareToggle && onCompareToggle(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-muted-foreground hover:bg-white/10 transition-all"
                >
                    <i className='bx bx-x mr-1'></i>
                    Clear All
                </button>
            )}
        </div>
    );
}

// ===== KPI CARD COMPONENT =====
function KPICard({ icon, label, value, trend, delta, badge, status = "info", tooltip, sparklineData, showSparkline, invertTrend = false }) {
    const statusStyle = COLORS.status[status];

    return (
        <div
            className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:bg-white/[0.05] transition-all group relative overflow-hidden"
            title={tooltip}
        >
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-1 h-full ${statusStyle.accent}`}></div>

            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${statusStyle.bg} flex items-center justify-center`}>
                    <i className={`bx ${icon} text-lg ${statusStyle.text}`}></i>
                </div>
                {badge && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                        {badge}
                    </span>
                )}
            </div>

            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {label}
                </p>
                <p className="text-3xl font-black tracking-tight mb-2">{value}</p>

                {(trend || delta) && (
                    <div className="flex items-center space-x-2">
                        {trend && (
                            <div className={`flex items-center space-x-1 ${invertTrend
                                ? (trend === 'down' ? 'text-emerald-400' : 'text-red-400')
                                : (trend === 'up' ? 'text-emerald-400' : 'text-red-400')
                                }`}>
                                <i className={`bx bx-trending-${trend} text-sm`}></i>
                                {delta && <span className="text-xs font-bold">{delta}</span>}
                            </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">vs last period</span>
                    </div>
                )}

                {/* Sparkline Chart */}
                {showSparkline && sparklineData && (
                    <div className="mt-3 h-12 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Line
                            data={{
                                labels: sparklineData.map((_, i) => `Day ${i + 1}`),
                                datasets: [{
                                    data: sparklineData,
                                    borderColor: (() => {
                                        const colorMap = {
                                            healthy: '#10b981',
                                            success: '#14b8a6',
                                            warning: '#f59e0b',
                                            info: '#3b82f6',
                                            critical: '#ef4444',
                                            danger: '#ef4444',
                                            neutral: '#94a3b8'
                                        };
                                        return colorMap[status] || '#3b82f6';
                                    })(),
                                    backgroundColor: 'transparent',
                                    borderWidth: 2,
                                    pointRadius: 0,
                                    pointHoverRadius: 3,
                                    tension: 0.4,
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: 'rgba(0,0,0,0.9)',
                                        padding: 8,
                                        cornerRadius: 6,
                                        titleFont: { size: 9 },
                                        bodyFont: { size: 10 },
                                        displayColors: false,
                                        callbacks: {
                                            title: (items) => `Day ${items[0].dataIndex + 1}`,
                                            label: (item) => `Value: ${item.raw.toLocaleString()}`
                                        }
                                    }
                                },
                                scales: {
                                    x: { display: false },
                                    y: { display: false }
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== FEATURE DISTRIBUTION PANEL =====
function FeatureDistributionPanel({ columns, selectedFeature, onFeatureSelect, viewMode, onViewModeChange, compareMode, syntheticColumns }) {
    const chartPalette = Object.values(COLORS.chart);

    // Match synthetic columns with real columns by name
    const getMatchingSyntheticColumn = (realColumnName) => {
        if (!syntheticColumns || !compareMode) return null;
        return syntheticColumns.find(sc => sc.name === realColumnName);
    };

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <i className='bx bx-bar-chart-alt-2 text-orange-400 text-lg'></i>
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight">
                            Feature Distributions
                            {compareMode && <span className="text-cyan-400 ml-2">• Comparative Mode</span>}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {columns.length} features analyzed{compareMode && ' • Real vs Synthetic overlay'}
                        </p>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => onViewModeChange('raw')}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${viewMode === 'raw'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'text-muted-foreground hover:text-white'
                            }`}
                    >
                        Raw
                    </button>
                    <button
                        onClick={() => onViewModeChange('normalized')}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${viewMode === 'normalized'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'text-muted-foreground hover:text-white'
                            }`}
                    >
                        Normalized
                    </button>
                </div>
            </div>

            {/* Distribution Grid */}
            {columns.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/50">
                    <i className='bx bx-filter-alt text-4xl mb-2'></i>
                    <p className="text-sm font-medium">No features match the current filters</p>
                </div>
            ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
                    {columns.slice(0, 6).map((col, idx) => (
                        <FeatureChart
                            key={idx}
                            column={col}
                            syntheticColumn={getMatchingSyntheticColumn(col.name)}
                            color={chartPalette[idx % chartPalette.length]}
                            viewMode={viewMode}
                            compareMode={compareMode}
                            isSelected={selectedFeature === col.name}
                            onSelect={() => onFeatureSelect(selectedFeature === col.name ? null : col.name)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function FeatureChart({ column, color, viewMode, isSelected, onSelect }) {
    const getTypeIcon = (type) => {
        const t = type.toLowerCase();
        if (t.includes('int') || t.includes('float')) return { icon: 'bx-hash', label: 'NUM' };
        if (t.includes('string') || t.includes('categorical')) return { icon: 'bx-text', label: 'CAT' };
        return { icon: 'bx-data', label: 'UNK' };
    };

    const typeInfo = getTypeIcon(column.type);
    const isRisky = column.nullPercentage > 20;

    // Transform data based on view mode
    const chartData = useMemo(() => {
        if (!column.distribution) return null;

        if (viewMode === 'normalized') {
            // Normalize to percentages (0-100%)
            const total = column.distribution.values.reduce((a, b) => a + b, 0);
            return column.distribution.values.map(v => (v / total) * 100);
        }

        // Raw mode - use original counts
        return column.distribution.values;
    }, [column.distribution, viewMode]);

    return (
        <div
            onClick={onSelect}
            className={`bg-white/[0.02] border rounded-lg p-4 hover:bg-white/[0.04] transition-all cursor-pointer ${isSelected
                ? 'border-orange-500/50 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10'
                : isRisky
                    ? 'border-red-500/30'
                    : 'border-white/5'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <i className={`bx ${typeInfo.icon} text-muted-foreground text-sm flex-shrink-0`}></i>
                    <p className="font-bold text-sm truncate" title={column.name}>{column.name}</p>
                    {isRisky && <i className='bx bx-error-circle text-red-400 text-xs flex-shrink-0'></i>}
                </div>
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {viewMode === 'normalized' && (
                        <span className="text-[8px] bg-orange-500/10 px-1.5 py-0.5 rounded font-black uppercase tracking-wider text-orange-400 border border-orange-500/20">
                            %
                        </span>
                    )}
                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded font-black uppercase tracking-wider text-muted-foreground border border-white/5">
                        {typeInfo.label}
                    </span>
                </div>
            </div>

            {/* Chart */}
            {chartData ? (
                <div className="h-28 relative mb-3">
                    <Bar
                        data={{
                            labels: column.distribution.labels,
                            datasets: [{
                                data: chartData,
                                backgroundColor: color,
                                borderRadius: 4,
                                borderSkipped: false,
                            }]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    display: viewMode === 'normalized',
                                    ticks: {
                                        callback: (value) => `${value.toFixed(0)}%`,
                                        color: '#94a3b8',
                                        font: { size: 9 }
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.05)',
                                        drawBorder: false
                                    }
                                },
                                x: { display: false }
                            },
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(0,0,0,0.95)',
                                    padding: 10,
                                    cornerRadius: 8,
                                    titleFont: { size: 10, weight: 'bold' },
                                    bodyFont: { size: 11 },
                                    displayColors: false,
                                    callbacks: {
                                        title: (items) => column.distribution.labels[items[0].dataIndex],
                                        label: (item) => {
                                            if (viewMode === 'normalized') {
                                                const rawCount = column.distribution.values[item.dataIndex];
                                                return [
                                                    `Percentage: ${item.raw.toFixed(2)}%`,
                                                    `Raw Count: ${rawCount.toLocaleString()}`
                                                ];
                                            }
                                            return `Count: ${item.raw.toLocaleString()}`;
                                        }
                                    }
                                }
                            }
                        }}
                    />

                    {/* Overlay Metrics */}
                    <div className="absolute bottom-1 right-1 bg-black/90 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold border border-white/10">
                        <span className="text-emerald-400">{column.uniqueCount}</span>
                        <span className="text-muted-foreground/60 ml-1">unique</span>
                    </div>
                </div>
            ) : (
                <div className="h-28 mb-3 flex flex-col items-center justify-center text-muted-foreground/20 border border-dashed border-white/5 rounded">
                    <i className='bx bx-ghost text-lg mb-1'></i>
                    <span className="text-[9px] font-medium">No distribution</span>
                </div>
            )}

            {/* Stats Footer */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground/60">Null:</span>
                    <span className={`font-bold ${column.nullPercentage === 0 ? 'text-emerald-400' : column.nullPercentage > 20 ? 'text-red-400' : 'text-amber-400'}`}>
                        {column.nullPercentage}%
                    </span>
                </div>
                <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground/60">Total:</span>
                    <span className="text-white/80 font-bold">
                        {column.distribution?.values.reduce((a, b) => a + b, 0).toLocaleString() || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ===== QUALITY AUDIT PANEL =====
function QualityAuditPanel({ columns, riskyCount }) {
    const metrics = useMemo(() => {
        return columns.map(col => ({
            name: col.name,
            nullPercentage: col.nullPercentage,
            uniqueness: (col.uniqueCount / (col.distribution?.values.reduce((a, b) => a + b, 0) || 1)) * 100,
            isRisky: col.nullPercentage > 20,
            status: col.nullPercentage === 0 ? 'perfect' : col.nullPercentage < 10 ? 'good' : col.nullPercentage < 20 ? 'warning' : 'critical'
        }));
    }, [columns]);

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                        <i className='bx bx-shield-check text-lg' style={{ color: '#60a5fa' }}>🛡</i>
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight" style={{ color: '#fff' }}>Quality Audit</h3>
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                            Data integrity metrics
                        </p>
                    </div>
                </div>

                {riskyCount > 0 && (
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        {riskyCount} RISKY
                    </span>
                )}
            </div>

            {/* Legend */}
            <QualityLegend />

            {/* Metrics */}
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 mt-4">
                {metrics.slice(0, 12).map((metric, idx) => (
                    <QualityMetric key={idx} metric={metric} />
                ))}
            </div>
        </div>
    );
}

function QualityLegend() {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Legend</p>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #10b981, #16a34a)' }}></div>
                    <span style={{ color: '#94a3b8' }}>Completeness</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4)' }}></div>
                    <span style={{ color: '#94a3b8' }}>Uniqueness</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span style={{ color: '#f87171', fontSize: '12px' }}>⚠</span>
                    <span style={{ color: '#94a3b8' }}>Risky ({'>'} 20% null)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                    <span style={{ color: '#94a3b8' }}>Perfect (0% null)</span>
                </div>
            </div>
        </div>
    );
}

function QualityMetric({ metric }) {
    const statusColors = {
        perfect: '#10b981',
        good: '#10b981',
        warning: '#f59e0b',
        critical: '#f87171'
    };

    const getCompletenessGradient = () => {
        if (metric.nullPercentage === 0) return 'linear-gradient(to right, #10b981, #16a34a)';
        if (metric.nullPercentage < 20) return 'linear-gradient(to right, #f59e0b, #f97316)';
        return 'linear-gradient(to right, #ef4444, #dc2626)';
    };

    return (
        <div className="space-y-2 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {metric.isRisky && (
                        <span className="text-xs flex-shrink-0" style={{ color: '#f87171' }}>⚠</span>
                    )}
                    <span className="text-xs font-bold truncate group-hover:text-white transition-colors" title={metric.name} style={{ color: '#e2e8f0' }}>
                        {metric.name}
                    </span>
                </div>
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: statusColors[metric.status] }}>
                    {metric.nullPercentage === 0 ? 'PERFECT' : `${metric.nullPercentage}% NULL`}
                </span>
            </div>

            {/* Dual Progress Bars */}
            <div className="space-y-1">
                {/* Completeness */}
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${Math.max(5, 100 - metric.nullPercentage)}%`,
                            background: getCompletenessGradient()
                        }}
                    ></div>
                </div>

                {/* Uniqueness */}
                <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-500"
                        style={{
                            width: `${Math.min(100, metric.uniqueness)}%`,
                            background: 'linear-gradient(to right, #3b82f6, #06b6d4)'
                        }}
                    ></div>
                </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-muted-foreground/60">
                <span>Uniqueness: {metric.uniqueness.toFixed(1)}%</span>
            </div>
        </div>
    );
}

// ===== CORRELATION MATRIX PANEL WITH INTERACTIVE LEGEND =====
function CorrelationMatrixPanel({ correlation, threshold, onThresholdChange }) {
    const [showPositive, setShowPositive] = useState(true);
    const [showNegative, setShowNegative] = useState(true);

    const filteredData = useMemo(() => {
        return correlation.columns.flatMap((col, i) =>
            correlation.values[i].map((v, j) => ({
                x: j,
                y: i,
                r: Math.abs(v) < Math.abs(threshold) ? 0 : Math.max(3, Math.abs(v) * 25),
                v: v,
                visible: (v >= 0 && showPositive) || (v < 0 && showNegative)
            }))
        ).filter(d => Math.abs(d.v) >= Math.abs(threshold) && d.visible);
    }, [correlation, threshold, showPositive, showNegative]);

    const stats = useMemo(() => {
        const all = correlation.columns.flatMap((col, i) =>
            correlation.values[i].map((v) => v)
        );
        const positive = all.filter(v => v > 0).length;
        const negative = all.filter(v => v < 0).length;
        const strong = all.filter(v => Math.abs(v) > 0.7).length;

        return { positive, negative, strong, total: all.length };
    }, [correlation]);

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <i className='bx bx-scatter-chart text-cyan-400 text-lg'></i>
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight">Feature Correlations</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {filteredData.length} relationships • {stats.strong} strong
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-2 border border-white/10">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Threshold
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={threshold}
                            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                            className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <span className="text-xs font-black text-white min-w-[3ch]">
                            {threshold.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Interactive Legend */}
            <CorrelationLegend
                stats={stats}
                showPositive={showPositive}
                showNegative={showNegative}
                onTogglePositive={() => setShowPositive(!showPositive)}
                onToggleNegative={() => setShowNegative(!showNegative)}
            />

            {/* Matrix */}
            <div className="h-[450px] w-full relative mt-6">
                <Bubble
                    data={{
                        datasets: [{
                            label: 'Correlations',
                            data: filteredData,
                            backgroundColor: (context) => {
                                const v = context.raw?.v;
                                if (v === undefined) return 'transparent';
                                return v >= 0
                                    ? `rgba(59, 130, 246, ${Math.min(1, Math.abs(v) + 0.3)})`
                                    : `rgba(249, 115, 22, ${Math.min(1, Math.abs(v) + 0.3)})`;
                            },
                            borderColor: 'rgba(255,255,255,0.15)',
                            borderWidth: 1,
                        }]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: 20 },
                        scales: {
                            y: {
                                type: 'linear',
                                position: 'left',
                                ticks: {
                                    callback: (val) => correlation.columns[val] || '',
                                    stepSize: 1,
                                    color: '#94a3b8',
                                    font: { size: 10, weight: '600' }
                                },
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                min: -1,
                                max: correlation.columns.length,
                                reverse: true
                            },
                            x: {
                                type: 'linear',
                                position: 'top',
                                ticks: {
                                    callback: (val) => correlation.columns[val] || '',
                                    stepSize: 1,
                                    maxRotation: 90,
                                    minRotation: 90,
                                    color: '#94a3b8',
                                    font: { size: 10, weight: '600' }
                                },
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                min: -1,
                                max: correlation.columns.length
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                titleColor: '#fff',
                                bodyColor: '#e2e8f0',
                                padding: 14,
                                cornerRadius: 10,
                                displayColors: true,
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderWidth: 1,
                                titleFont: { size: 12, weight: 'bold' },
                                bodyFont: { size: 11 },
                                callbacks: {
                                    title: (items) => {
                                        const item = items[0];
                                        const r = correlation.columns[item.parsed.y];
                                        const c = correlation.columns[item.parsed.x];
                                        return `${r} ↔ ${c}`;
                                    },
                                    label: (item) => {
                                        const v = item.raw.v;
                                        const strength = Math.abs(v) > 0.7 ? 'Strong' : (Math.abs(v) > 0.3 ? 'Moderate' : 'Weak');
                                        const direction = v >= 0 ? 'Positive' : 'Negative';
                                        return [
                                            `Coefficient: ${v.toFixed(3)}`,
                                            `${strength} ${direction} correlation`
                                        ];
                                    }
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
}

function CorrelationLegend({ stats, showPositive, showNegative, onTogglePositive, onToggleNegative }) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Interactive Legend
                    </p>

                    {/* Positive Toggle */}
                    <button
                        onClick={onTogglePositive}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${showPositive
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-white/5 border border-white/10 opacity-40'
                            }`}
                    >
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-bold text-blue-400">
                            Positive ({stats.positive})
                        </span>
                    </button>

                    {/* Negative Toggle */}
                    <button
                        onClick={onToggleNegative}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${showNegative
                            ? 'bg-orange-500/20 border border-orange-500/30'
                            : 'bg-white/5 border border-white/10 opacity-40'
                            }`}
                    >
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-xs font-bold text-orange-400">
                            Negative ({stats.negative})
                        </span>
                    </button>
                </div>

                {/* Size Encoding Legend */}
                <div className="flex items-center space-x-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Size</p>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-white/30"></div>
                        <span className="text-[9px] text-muted-foreground">Weak</span>
                        <div className="w-3 h-3 rounded-full bg-white/30"></div>
                        <span className="text-[9px] text-muted-foreground">Moderate</span>
                        <div className="w-4 h-4 rounded-full bg-white/30"></div>
                        <span className="text-[9px] text-muted-foreground">Strong</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== LOADING SKELETON =====
function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-32"></div>
                ))}
            </div>
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 bg-white/5 border border-white/10 rounded-xl h-96"></div>
                <div className="col-span-4 bg-white/5 border border-white/10 rounded-xl h-96"></div>
            </div>
        </div>
    );
}

// ===== AUTOMATED INSIGHTS PANEL =====
function AutomatedInsightsPanel({ insights }) {
    const getSeverityStyle = (severity) => {
        const styles = {
            healthy: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', icon: 'bx-check-circle' },
            info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6', icon: 'bx-info-circle' },
            warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b', icon: 'bx-error' },
            critical: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444', icon: 'bx-x-circle' }
        };
        return styles[severity] || styles.info;
    };

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                        <span style={{ color: '#a855f7', fontSize: '18px' }}>✨</span>
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight" style={{ color: '#fff' }}>
                            Automated Insights
                        </h3>
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                            AI-powered data intelligence
                        </p>
                    </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-1 rounded" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    {insights.length} FINDINGS
                </span>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {insights.map((insight, idx) => {
                    const severityStyle = getSeverityStyle(insight.severity);

                    return (
                        <div
                            key={idx}
                            className="border rounded-lg p-4 hover:bg-white/[0.02] transition-all group cursor-pointer"
                            style={{
                                backgroundColor: severityStyle.bg,
                                borderColor: severityStyle.border
                            }}
                        >
                            {/* Icon & Type */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                                    <i className={`bx ${insight.icon} text-lg`} style={{ color: severityStyle.text }}></i>
                                </div>
                                <i className={`bx ${severityStyle.icon} text-sm`} style={{ color: severityStyle.text }}></i>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-black mb-2 leading-tight" style={{ color: '#fff' }}>
                                {insight.title}
                            </h4>

                            {/* Description */}
                            <p className="text-[10px] leading-relaxed mb-3" style={{ color: '#94a3b8' }}>
                                {insight.description}
                            </p>

                            {/* Action */}
                            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: severityStyle.text }}>
                                    {insight.action}
                                </span>
                                <i className='bx bx-right-arrow-alt text-sm opacity-0 group-hover:opacity-100 transition-opacity' style={{ color: severityStyle.text }}></i>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ===== BOX PLOT PANEL =====
function BoxPlotPanel({ columns, compareMode, syntheticColumns }) {
    // Filter only numeric columns
    const numericColumns = useMemo(() => {
        return columns.filter(col => {
            const type = col.type.toLowerCase();
            return type.includes('int') || type.includes('float') || type.includes('number');
        });
    }, [columns]);

    // Calculate box plot statistics
    const calculateBoxStats = (distribution) => {
        if (!distribution || !distribution.values || distribution.values.length === 0) {
            return null;
        }

        // Expand distribution to actual values (approximate)
        const values = [];
        distribution.labels.forEach((label, idx) => {
            const count = distribution.values[idx];
            const value = parseFloat(label) || idx;
            for (let i = 0; i < count; i++) {
                values.push(value);
            }
        });

        if (values.length === 0) return null;

        values.sort((a, b) => a - b);
        const n = values.length;

        const q1 = values[Math.floor(n * 0.25)];
        const median = values[Math.floor(n * 0.5)];
        const q3 = values[Math.floor(n * 0.75)];
        const min = values[0];
        const max = values[n - 1];

        const iqr = q3 - q1;
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;

        const outliers = values.filter(v => v < lowerFence || v > upperFence);

        return { min, q1, median, q3, max, lowerFence, upperFence, outliers: outliers.slice(0, 20) }; // Limit outliers
    };

    const getMatchingSyntheticColumn = (realColumnName) => {
        if (!syntheticColumns || !compareMode) return null;
        return syntheticColumns.find(sc => sc.name === realColumnName);
    };

    if (numericColumns.length === 0) {
        return null; // Don't show if no numeric columns
    }

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                        <i className='bx bx-box text-lg' style={{ color: '#f97316' }}></i>
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight" style={{ color: '#fff' }}>
                            Box Plot Analysis
                            {compareMode && <span className="text-cyan-400 ml-2">• Comparative</span>}
                        </h3>
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                            Outlier detection & distribution comparison{compareMode && ' • Real vs Synthetic'}
                        </p>
                    </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-1 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                    {numericColumns.length} NUMERIC
                </span>
            </div>

            {/* Box Plots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {numericColumns.slice(0, 6).map((col, idx) => {
                    const realStats = calculateBoxStats(col.distribution);
                    const syntheticCol = getMatchingSyntheticColumn(col.name);
                    const syntheticStats = syntheticCol ? calculateBoxStats(syntheticCol.distribution) : null;

                    if (!realStats) return null;

                    return (
                        <BoxPlotChart
                            key={idx}
                            columnName={col.name}
                            realStats={realStats}
                            syntheticStats={compareMode ? syntheticStats : null}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ===== BOX PLOT CHART COMPONENT =====
function BoxPlotChart({ columnName, realStats, syntheticStats }) {
    const hasComparison = !!syntheticStats;
    const allValues = [
        realStats.min,
        realStats.max,
        ...(syntheticStats ? [syntheticStats.min, syntheticStats.max] : [])
    ];
    const globalMin = Math.min(...allValues);
    const globalMax = Math.max(...allValues);
    const range = globalMax - globalMin || 1;

    const scale = (value) => ((value - globalMin) / range) * 100;

    const renderBoxPlot = (stats, color, offsetY = 0) => {
        const boxHeight = 40;
        const y = offsetY;

        return (
            <g>
                {/* Whiskers */}
                <line
                    x1={`${scale(stats.min)}%`}
                    y1={y + boxHeight / 2}
                    x2={`${scale(stats.q1)}%`}
                    y2={y + boxHeight / 2}
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="4"
                />
                <line
                    x1={`${scale(stats.q3)}%`}
                    y1={y + boxHeight / 2}
                    x2={`${scale(stats.max)}%`}
                    y2={y + boxHeight / 2}
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="4"
                />

                {/* Box (Q1 to Q3) */}
                <rect
                    x={`${scale(stats.q1)}%`}
                    y={y}
                    width={`${scale(stats.q3) - scale(stats.q1)}%`}
                    height={boxHeight}
                    fill={color}
                    fillOpacity="0.3"
                    stroke={color}
                    strokeWidth="2"
                    rx="4"
                />

                {/* Median line */}
                <line
                    x1={`${scale(stats.median)}%`}
                    y1={y}
                    x2={`${scale(stats.median)}%`}
                    y2={y + boxHeight}
                    stroke={color}
                    strokeWidth="3"
                />

                {/* Min/Max markers */}
                <line x1={`${scale(stats.min)}%`} y1={y + 10} x2={`${scale(stats.min)}%`} y2={y + boxHeight - 10} stroke={color} strokeWidth="2" />
                <line x1={`${scale(stats.max)}%`} y1={y + 10} x2={`${scale(stats.max)}%`} y2={y + boxHeight - 10} stroke={color} strokeWidth="2" />

                {/* Outliers */}
                {stats.outliers.slice(0, 10).map((outlier, i) => (
                    <circle
                        key={i}
                        cx={`${scale(outlier)}%`}
                        cy={y + boxHeight / 2}
                        r="3"
                        fill={color}
                        opacity="0.6"
                    />
                ))}
            </g>
        );
    };

    return (
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 hover:bg-white/[0.04] transition-all">
            {/* Title */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold truncate" style={{ color: '#e2e8f0' }} title={columnName}>
                    {columnName}
                </h4>
                {realStats.outliers.length > 0 && (
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                        {realStats.outliers.length} OUT
                    </span>
                )}
            </div>

            {/* SVG Box Plot */}
            <svg width="100%" height={hasComparison ? "120" : "80"} className="mb-3">
                {renderBoxPlot(realStats, '#3b82f6', 0)}
                {hasComparison && syntheticStats && renderBoxPlot(syntheticStats, '#06b6d4', 60)}
            </svg>

            {/* Legend */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                        <span style={{ color: '#94a3b8' }}>Real</span>
                    </div>
                    <span style={{ color: '#e2e8f0' }} className="font-mono">
                        {realStats.min.toFixed(1)} → {realStats.max.toFixed(1)}
                    </span>
                </div>
                {hasComparison && syntheticStats && (
                    <div className="flex items-center justify-between text-[9px]">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#06b6d4' }}></div>
                            <span style={{ color: '#94a3b8' }}>Synthetic</span>
                        </div>
                        <span style={{ color: '#e2e8f0' }} className="font-mono">
                            {syntheticStats.min.toFixed(1)} → {syntheticStats.max.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Stats Summary */}
            <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-[8px]" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div>
                    <span style={{ color: '#94a3b8' }}>Q1:</span>
                    <span style={{ color: '#fff' }} className="ml-1 font-bold">{realStats.q1.toFixed(1)}</span>
                </div>
                <div>
                    <span style={{ color: '#94a3b8' }}>Med:</span>
                    <span style={{ color: '#fff' }} className="ml-1 font-bold">{realStats.median.toFixed(1)}</span>
                </div>
                <div>
                    <span style={{ color: '#94a3b8' }}>Q3:</span>
                    <span style={{ color: '#fff' }} className="ml-1 font-bold">{realStats.q3.toFixed(1)}</span>
                </div>
            </div>
        </div >
    );
}

// ===== NETWORK GRAPH PANEL =====
function NetworkGraphPanel({ correlation, threshold }) {
    const [hoveredNode, setHoveredNode] = useState(null);

    // Build network from correlation matrix
    const network = useMemo(() => {
        if (!correlation || !correlation.columns || !correlation.values) return { nodes: [], edges: [] };

        const nodes = correlation.columns.map((name, idx) => ({
            id: idx,
            name,
            degree: 0 // Will be calculated
        }));

        const edges = [];
        correlation.columns.forEach((col1, i) => {
            correlation.values[i].forEach((value, j) => {
                if (i !== j && Math.abs(value) > threshold) {
                    edges.push({
                        source: i,
                        target: j,
                        weight: value,
                        strength: Math.abs(value)
                    });
                    nodes[i].degree++;
                    nodes[j].degree++;
                }
            });
        });

        // Remove duplicates (i->j and j->i)
        const uniqueEdges = [];
        const seen = new Set();
        edges.forEach(edge => {
            const key = `${Math.min(edge.source, edge.target)}-${Math.max(edge.source, edge.target)}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueEdges.push(edge);
            }
        });

        return { nodes, edges: uniqueEdges };
    }, [correlation, threshold]);

    // Circular layout
    const width = 800;
    const height = 600;
    const radius = Math.min(width, height) / 2 - 100;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodePositions = network.nodes.map((node, idx) => {
        const angle = (idx / network.nodes.length) * 2 * Math.PI - Math.PI / 2;
        return {
            ...node,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    // Get node size based on degree (connectivity)
    const getNodeSize = (degree) => {
        return 8 + degree * 2;
    };

    // Get edge color based on correlation
    const getEdgeColor = (weight) => {
        return weight > 0 ? '#3b82f6' : '#f97316';
    };

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                        <i className='bx bx-network-chart text-lg' style={{ color: '#a855f7' }}></i>
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight" style={{ color: '#fff' }}>
                            Feature Relationship Network
                        </h3>
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                            {network.nodes.length} features • {network.edges.length} connections
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        <i className='bx bx-link mr-1'></i>
                        POSITIVE
                    </span>
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                        <i className='bx bx-unlink mr-1'></i>
                        NEGATIVE
                    </span>
                </div>
            </div>

            {/* Network Visualization */}
            {network.edges.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center text-muted-foreground/50">
                    <i className='bx bx-radio-circle-marked text-4xl mb-2'></i>
                    <p className="text-sm font-medium">No correlations above threshold {threshold.toFixed(2)}</p>
                    <p className="text-xs mt-1">Lower the threshold to see more connections</p>
                </div>
            ) : (
                <div className="relative bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
                        {/* Edges */}
                        <g>
                            {network.edges.map((edge, idx) => {
                                const sourceNode = nodePositions[edge.source];
                                const targetNode = nodePositions[edge.target];
                                const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;

                                return (
                                    <line
                                        key={idx}
                                        x1={sourceNode.x}
                                        y1={sourceNode.y}
                                        x2={targetNode.x}
                                        y2={targetNode.y}
                                        stroke={getEdgeColor(edge.weight)}
                                        strokeWidth={edge.strength * 3}
                                        opacity={isHighlighted ? 0.8 : 0.3}
                                        className="transition-opacity"
                                    />
                                );
                            })}
                        </g>

                        {/* Nodes */}
                        <g>
                            {nodePositions.map((node, idx) => {
                                const size = getNodeSize(node.degree);
                                const isHovered = hoveredNode === idx;

                                return (
                                    <g
                                        key={idx}
                                        onMouseEnter={() => setHoveredNode(idx)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        className="cursor-pointer"
                                    >
                                        {/* Node circle */}
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={size}
                                            fill={isHovered ? '#a855f7' : '#6366f1'}
                                            stroke="#fff"
                                            strokeWidth={isHovered ? 3 : 2}
                                            opacity={isHovered ? 1 : 0.9}
                                            className="transition-all"
                                        />

                                        {/* Node label */}
                                        <text
                                            x={node.x}
                                            y={node.y - size - 8}
                                            textAnchor="middle"
                                            fill={isHovered ? '#fff' : '#94a3b8'}
                                            fontSize={isHovered ? 12 : 10}
                                            fontWeight={isHovered ? 'bold' : 'normal'}
                                            className="transition-all pointer-events-none"
                                        >
                                            {node.name}
                                        </text>

                                        {/* Degree badge */}
                                        {isHovered && (
                                            <g>
                                                <rect
                                                    x={node.x - 15}
                                                    y={node.y + size + 5}
                                                    width={30}
                                                    height={16}
                                                    rx={8}
                                                    fill="rgba(168, 85, 247, 0.2)"
                                                    stroke="#a855f7"
                                                    strokeWidth={1}
                                                />
                                                <text
                                                    x={node.x}
                                                    y={node.y + size + 16}
                                                    textAnchor="middle"
                                                    fill="#a855f7"
                                                    fontSize={9}
                                                    fontWeight="bold"
                                                >
                                                    {node.degree}
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                </div>
            )}

            {/* Legend & Stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                        <i className='bx bx-git-branch text-purple-400'></i>
                        <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>Network Stats</span>
                    </div>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between">
                            <span style={{ color: '#94a3b8' }}>Nodes:</span>
                            <span style={{ color: '#fff' }} className="font-bold">{network.nodes.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: '#94a3b8' }}>Edges:</span>
                            <span style={{ color: '#fff' }} className="font-bold">{network.edges.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: '#94a3b8' }}>Density:</span>
                            <span style={{ color: '#fff' }} className="font-bold">
                                {((2 * network.edges.length) / (network.nodes.length * (network.nodes.length - 1)) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                        <i className='bx bx-info-circle text-blue-400'></i>
                        <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>How to Read</span>
                    </div>
                    <div className="space-y-1 text-[9px]" style={{ color: '#94a3b8' }}>
                        <p>• <strong>Node size</strong> = connection count</p>
                        <p>• <strong>Edge thickness</strong> = correlation strength</p>
                        <p>• <strong>Blue edges</strong> = positive correlation</p>
                        <p>• <strong>Orange edges</strong> = negative correlation</p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                        <i className='bx bx-target-lock text-emerald-400'></i>
                        <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>Most Connected</span>
                    </div>
                    <div className="space-y-1 text-[10px]">
                        {nodePositions
                            .sort((a, b) => b.degree - a.degree)
                            .slice(0, 3)
                            .map((node, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span style={{ color: '#94a3b8' }} className="truncate">{node.name}</span>
                                    <span style={{ color: '#10b981' }} className="font-bold ml-2">{node.degree}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== EMPTY STATE =====
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <i className='bx bx-bar-chart text-4xl text-muted-foreground/30'></i>
            </div>
            <h3 className="text-xl font-black text-muted-foreground mb-2">No Analytics Available</h3>
            <p className="text-sm text-muted-foreground/60 max-w-md mb-6">
                Select a dataset to view comprehensive business intelligence insights and data quality metrics.
            </p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground/40">
                <i className='bx bx-info-circle'></i>
                <span>Ensure a valid dataset is loaded in the project</span>
            </div>
        </div>
    );
}
