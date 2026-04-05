import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './HistoryPage.css';

/* ── Mode badge colours (matching DealDetails) ── */
const MODE_COLORS = {
    Bank: { bg: '#dbeafe', color: '#1e40af', icon: '' },
    Other: { bg: '#f8fafc', color: '#475569', icon: '' },
};

const MODES = ['ALL', 'Bank', 'Other'];

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);

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

/* ── Skeleton ── */
const SkeletonList = () => (
    <div className="hp-skeleton-list">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="hp-skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
    </div>
);

/* ── Single transaction card ── */
const TransactionCard = ({ payment, onClick }) => {
    const deal = payment.dealId || {};
    const modeStyle = MODE_COLORS[payment.modeOfPayment] || MODE_COLORS.Other;
    const byName = payment.createdBy?.contactPersonName || payment.createdBy?.name || payment.createdBy?.companyName || 'Unknown';

    return (
        <div className="hp-card" onClick={() => onClick(deal._id)} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick(deal._id)}>

            {/* Middle: deal info */}
            <div className="hp-card-body">
                <div className="hp-card-title">
                    {deal.villageName || '—'}
                    {deal.surveyNumber && (
                        <span className="hp-card-survey">#{deal.surveyNumber}</span>
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
                    <span className="hp-card-amount-mobile">{formatCurrency(payment.amount)}</span>
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
                <span className="hp-card-amount">{formatCurrency(payment.amount)}</span>
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
    const [loading, setLoading] = useState(true);
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
                    <div className="hp-summary-row">
                        <div className="hp-chip">
                            <span className="hp-chip-label">Total Records</span>
                            <span className="hp-chip-value">{total.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="hp-chip">
                            <span className="hp-chip-label">Shown on Page</span>
                            <span className="hp-chip-value">{payments.length}</span>
                        </div>
                        <div className="hp-chip">
                            <span className="hp-chip-label">Page Amount</span>
                            <span className="hp-chip-value">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Filters Bar ── */}
            <div className="hp-filters-wrap">
                <div className="hp-filters">
                    {/* Search */}
                    <div className="hp-search-wrap">
                        <svg className="hp-search-icon" width="15" height="15" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            className="hp-search-input"
                            placeholder="Search by village name…"
                            value={search}
                            onChange={handleSearchChange}
                            aria-label="Search by village name"
                        />
                    </div>

                    {/* Mode filter */}
                    <select
                        className="hp-select"
                        value={mode}
                        onChange={handleModeChange}
                        aria-label="Filter by payment mode"
                    >
                        {MODES.map(m => (
                            <option key={m} value={m}>{m === 'ALL' ? 'All Modes' : m}</option>
                        ))}
                    </select>

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
                {error && <div className="hp-error-banner">⚠️ {error}</div>}

                {loading ? (
                    <SkeletonList />
                ) : payments.length === 0 ? (
                    <div className="hp-empty">
                        <span className="hp-empty-icon">📭</span>
                        <h3>No transactions found</h3>
                        <p>{search || mode !== 'ALL' ? 'Try adjusting your filters.' : 'No payments have been recorded yet.'}</p>
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
