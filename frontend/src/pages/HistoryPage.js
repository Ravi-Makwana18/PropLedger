import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AppSelect from '../components/ui/AppSelect';
import { preloadRoute } from '../utils/preloadRoutes';
import './HistoryPage.css';

/* ── Mode badge colours (matching DealDetails) ── */
const MODE_COLORS = {
    Bank: { bg: '#dbeafe', color: '#1e40af', icon: '' },
    Other: { bg: '#f8fafc', color: '#475569', icon: '' },
};

const MODES = ['ALL', 'Bank', 'Other'];

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

// Short, human-friendly currency (Indian units): shows Crore / Lakh / K as appropriate
const formatCurrencyShort = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    const abs = Math.abs(amount || 0);
    if (abs >= 10000000) { // 1 Crore
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) { // 1 Lakh
        return `₹${(amount / 100000).toFixed(2)} Lakhs`;
    }
    if (abs >= 1000) {
        return `₹${(amount / 1000).toFixed(2)}K`;
    }
    return `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
};

const formatTime = (date) =>
    new Date(date).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });

const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

/* ── Deal type badge colours ── */
const DEAL_TYPE_STYLES = {
    Buy: { bg: '#eff6ff', color: '#1d4ed8' },
    Sell: { bg: '#fef2f2', color: '#b91c1c' },
    Other: { bg: '#f0fdf4', color: '#15803d' },
};

/* ── Single transaction card ── */
const TransactionCard = ({ payment, onClick }) => {
    const deal = payment.dealId || {};
    const modeStyle = MODE_COLORS[payment.modeOfPayment] || MODE_COLORS.Other;
    const byName = payment.createdBy?.contactPersonName || payment.createdBy?.name || payment.createdBy?.companyName || 'Unknown';

    return (
        <div
            className="hp-card app-card"
            onClick={() => onClick(deal._id)}
            onMouseEnter={() => preloadRoute('dealDetails')}
            onTouchStart={() => preloadRoute('dealDetails')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick(deal._id)}>

            {/* Middle: deal info */}
            <div className="hp-card-body">
                <div className="hp-card-title">
                    {deal.villageName || '—'}
                    {(deal.newSurveyNo || deal.surveyNumber) && (
                        <span className="hp-card-survey">#{deal.newSurveyNo || deal.surveyNumber}</span>
                    )}
                    {deal.dealType && (
                        <span
                            className="hp-card-mode-badge"
                            style={{
                                background: (DEAL_TYPE_STYLES[deal.dealType] || DEAL_TYPE_STYLES.Other).bg,
                                color: (DEAL_TYPE_STYLES[deal.dealType] || DEAL_TYPE_STYLES.Other).color
                            }}
                        >
                            {deal.dealType === 'Buy' ? 'Purchase' : deal.dealType}
                        </span>
                    )}
                    {/* amount shown on mobile inside body */}
                    <span className="hp-card-amount-mobile" title={formatCurrency(payment.amount)} aria-label={`Amount ${formatCurrency(payment.amount)}`}>
                        {formatCurrencyShort(payment.amount)}
                    </span>
                </div>

                <div className="hp-card-meta">
                    {/* Added by */}
                    <span className="hp-card-by">
                        <span className="hp-card-by-avatar">{initials(byName)}</span>
                        {byName}
                    </span>

                    {/* Recorded at (date + time) */}
                    <span className="hp-card-date">🕐 {formatTime(payment.createdAt)}</span>

                    {/* Mode badge */}
                    <span
                        className="hp-card-mode-badge"
                        style={{ background: modeStyle.bg, color: modeStyle.color }}
                    >
                        {payment.modeOfPayment}
                    </span>
                </div>
            </div>

            {/* Right: amount + arrow */}
            <div className="hp-card-right">
                <span className="hp-card-amount" title={formatCurrency(payment.amount)} aria-label={`Amount ${formatCurrency(payment.amount)}`}>
                    {formatCurrencyShort(payment.amount)}
                </span>
                <span className="hp-card-arrow">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </span>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════ */
const HistoryPage = () => {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [mode, setMode] = useState('ALL');
    const [totalAmount, setTotalAmount] = useState(0);

    // Debounce ref for search
    const debounceRef = useRef(null);

    const fetchHistory = useCallback(async (p = 1, s = search, m = mode) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: p, limit: 30 });
            if (s) params.set('search', s);
            if (m !== 'ALL') params.set('mode', m);

            const { data } = await API.get(`/api/payments/history?${params}`);
            setPayments(data.payments);
            setTotal(data.total);
            setPage(data.page);
            setPages(data.pages);

            // Compute total amount of shown records
            const sum = data.payments.reduce((acc, p) => acc + p.amount, 0);
            setTotalAmount(sum);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load transaction history.');
        } finally {
            setLoading(false);
        }
    }, [search, mode]);

    // Initial load
    useEffect(() => {
        fetchHistory(1, search, mode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced search
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchHistory(1, val, mode);
        }, 400);
    };

    // Mode filter
    const handleModeChange = (e) => {
        const val = e.target.value;
        setMode(val);
        setPage(1);
        fetchHistory(1, search, val);
    };

    // Pagination
    const handlePageChange = (p) => {
        setPage(p);
        fetchHistory(p, search, mode);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Navigate to deal
    const handleCardClick = (dealId) => {
        if (dealId) navigate(`/deals/${dealId}`);
    };

    /* Build page number range for pagination */
    const getPageRange = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
            range.push(i);
        }
        if (page - delta > 2) rangeWithDots.push(1, '...');
        else rangeWithDots.push(1);
        rangeWithDots.push(...range);
        if (page + delta < pages - 1) rangeWithDots.push('...', pages);
        else if (pages > 1) rangeWithDots.push(pages);
        return rangeWithDots;
    };

    return (
        <div className="hp-page">

            {/* ── Hero ── */}
            <div className="hp-hero">
                <div className="hp-hero-inner">
                    <div className="hp-hero-top">
                        {/* <div className="hp-hero-icon">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        </div> */}
                        <div>
                            <h1 className="hp-hero-title">Transaction History</h1>
                            <p className="hp-hero-subtitle">Complete ledger of all payment records across deals</p>
                        </div>
                    </div>

                    {/* Summary chips */}
                    <div className="hp-kpi-row">
                        <div className="hp-kpi-card">
                            <div className="hp-kpi-icon hp-kpi-icon--records">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                            </div>
                            <div className="hp-kpi-info">
                                <span className="hp-kpi-label">Total Records</span>
                                <span className="hp-kpi-value">{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="hp-kpi-card">
                            <div className="hp-kpi-icon hp-kpi-icon--page">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                            </div>
                            <div className="hp-kpi-info">
                                <span className="hp-kpi-label">Shown on Page</span>
                                <span className="hp-kpi-value">{payments.length}</span>
                            </div>
                        </div>
                        <div className="hp-kpi-card">
                            <div className="dashboard-kpi-icon dashboard-kpi-icon--portfolio">
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    {/* Rupee Symbol */}
                                    <path d="M6 4h12M6 8h12M10 8c2.5 0 4 1.5 4 3s-1.5 3-4 3H6l8 6" />
                                </svg>
                            </div>
                            <div className="hp-kpi-info">
                                <span className="hp-kpi-label">Page Amount</span>
                                <span className="hp-kpi-value" title={formatCurrency(totalAmount)}>
                                    {formatCurrencyShort(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Filters Bar ── */}
            <div className="hp-filters-wrap">
                <div className="hp-filters app-card">
                    {/* Search */}
                    <div className="hp-search-wrap">
                        <svg className="hp-search-icon" width="15" height="15" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            className="hp-search-input app-input"
                            placeholder="Search by village name…"
                            value={search}
                            onChange={handleSearchChange}
                            aria-label="Search by village name"
                        />
                    </div>

                    {/* Mode filter */}
                    <AppSelect
                        className="hp-select"
                        value={mode}
                        onChange={handleModeChange}
                        aria-label="Filter by payment mode"
                    >
                        {MODES.map(m => (
                            <option key={m} value={m}>{m === 'ALL' ? 'All Modes' : m}</option>
                        ))}
                    </AppSelect>

                    {/* Results count */}
                    {!loading && (
                        <span className="hp-filter-count">
                            {total} result{total !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="hp-content">
                {error && <div className="hp-error-banner pl-state pl-state--error">⚠️ {error}</div>}

                {loading ? (
                    <div className="history-skeleton-container">
                        <div className="history-skeleton-header">
                            <div className="skeleton-base history-skeleton-title"></div>
                        </div>
                        <div className="history-skeleton-filters">
                            <div className="skeleton-base history-skeleton-filter"></div>
                            <div className="skeleton-base history-skeleton-filter"></div>
                            <div className="skeleton-base history-skeleton-filter"></div>
                            <div className="skeleton-base history-skeleton-filter"></div>
                            <div className="skeleton-base history-skeleton-filter"></div>
                        </div>
                        <div className="history-skeleton-list">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton-base history-skeleton-item"></div>
                            ))}
                        </div>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="hp-empty pl-state pl-state--empty">
                        <span className="hp-empty-icon pl-empty-icon">📭</span>
                        <h3 className="pl-empty-title">No transactions found</h3>
                        <p className="pl-empty-desc">{search || mode !== 'ALL' ? 'Try adjusting your filters.' : 'No payments have been recorded yet.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="hp-list">
                            {payments.map(payment => (
                                <TransactionCard
                                    key={payment._id}
                                    payment={payment}
                                    onClick={handleCardClick}
                                />
                            ))}
                        </div>

                        {/* ── Pagination ── */}
                        {pages > 1 && (
                            <div className="hp-pagination">
                                <button
                                    className="hp-page-btn"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    aria-label="Previous page"
                                >
                                    ‹
                                </button>

                                {getPageRange().map((item, i) =>
                                    item === '...' ? (
                                        <span key={`dots-${i}`} className="hp-page-info">…</span>
                                    ) : (
                                        <button
                                            key={item}
                                            className={`hp-page-btn${page === item ? ' hp-page-btn--active' : ''}`}
                                            onClick={() => handlePageChange(item)}
                                        >
                                            {item}
                                        </button>
                                    )
                                )}

                                <button
                                    className="hp-page-btn"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === pages}
                                    aria-label="Next page"
                                >
                                    ›
                                </button>

                                <span className="hp-page-info">Page {page} of {pages}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
