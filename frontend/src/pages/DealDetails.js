import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DealDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [dealData, setDealData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    modeOfPayment: 'NEFT',
    amount: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDealDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDealDetails = async () => {
    try {
      const { data } = await API.get(`/deals/${id}`);
      setDealData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deal details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await API.post('/payments', {
        dealId: id,
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      });

      setSuccess('Payment added successfully');
      setShowPaymentForm(false);
      setPaymentForm({
        date: new Date().toISOString().split('T')[0],
        modeOfPayment: 'NEFT',
        amount: '',
        remarks: ''
      });
      fetchDealDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add payment');
    }
  };

  const handleDeletePayment = async (paymentId, paymentDate) => {
    if (!window.confirm(`Are you sure you want to delete the payment record from ${formatDate(paymentDate)}? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await API.delete(`/payments/${paymentId}`);
      setSuccess('Payment deleted successfully');
      fetchDealDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDeadlinePeriod = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return 'N/A';
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Check if dates are valid (not epoch date 01 Jan 1970)
    if (start.getFullYear() === 1970 && end.getFullYear() === 1970) {
      return 'N/A';
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Helper function for PDF currency formatting
    const formatPDFCurrency = (amount) => {
      const rounded = Math.round(amount);
      const str = rounded.toString();
      let result = '';
      let count = 0;
      
      // Start from the end and add commas in Indian format
      for (let i = str.length - 1; i >= 0; i--) {
        if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
          result = ',' + result;
        }
        result = str[i] + result;
        count++;
      }
      
      return 'Rs. ' + result;
    };
    
    const formatNumber = (num) => {
      const str = num.toString();
      let result = '';
      let count = 0;
      
      // Start from the end and add commas in Indian format
      for (let i = str.length - 1; i >= 0; i--) {
        if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
          result = ',' + result;
        }
        result = str[i] + result;
        count++;
      }
      
      return result;
    };
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text('Destination Dholera PVT. LTD', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('deal information report', pageWidth / 2, 30, { align: 'center' });
    
    // Deal Information
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Deal Details', 14, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let yPos = 55;
    
    const dealInfo = [
      ['Village Name', deal.villageName],
      ['Survey No.', deal.surveyNumber],
      ['Unit Price', formatPDFCurrency(deal.pricePerSqYard)],
      ['Total Area', formatNumber(deal.totalSqYard)],
      ['Total Amount', formatPDFCurrency(deal.totalAmount)],
      ['Banakhat Amount (25%)', formatPDFCurrency(deal.banakhatAmount || deal.totalAmount * 0.25)],
      ['Deadline', formatDeadlinePeriod(deal.deadlineStartDate, deal.deadlineEndDate)]
    ];
    
    dealInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value.toString(), 70, yPos);
      yPos += 8;
    });
    
    // Payment Summary
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Payment Summary', 14, yPos);
    yPos += 10;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: [
        ['Total Amount', formatPDFCurrency(deal.totalAmount)],
        ['Total Paid', formatPDFCurrency(totalPaid)],
        ['Remaining Amount', formatPDFCurrency(remainingAmount)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    // Payment History
    if (payments && payments.length > 0) {
      yPos = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text('Payment History', 14, yPos);
      yPos += 5;
      
      const paymentRows = payments.map(payment => [
        formatDate(payment.date),
        payment.modeOfPayment,
        formatPDFCurrency(payment.amount),
        payment.remarks || '-'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Mode of Payment', 'Amount', 'Remarks']],
        body: paymentRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      
      // Total Paid row
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY,
        body: [['', 'TOTAL PAID:', formatPDFCurrency(totalPaid), '']],
        theme: 'plain',
        styles: { fontStyle: 'bold', fillColor: [209, 250, 229] },
        margin: { left: 14, right: 14 }
      });
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${new Date().toLocaleString('en-IN')} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF
    doc.save(`Deal_${deal.villageName}_${deal.surveyNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="flex-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!dealData) {
    return (
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="alert alert-error">Deal not found</div>
      </div>
    );
  }

  const { deal, payments, totalPaid, remainingAmount } = dealData;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <button onClick={() => navigate(-1)} className="btn btn-outline mb-3">
        ← Back
      </button>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Deal Information */}
      <div className="card">
        <h2 className="card-header">Deal Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <strong>Village Name</strong>
            <p>{deal.villageName}</p>
          </div>
          <div>
            <strong>Survey No.</strong>
            <p>{deal.surveyNumber}</p>
          </div>
          <div>
            <strong>Unit Price</strong>
            <p>{formatCurrency(deal.pricePerSqYard)}</p>
          </div>
          <div>
            <strong>Total Area</strong>
            <p>{deal.totalSqYard.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <strong>Total Amount</strong>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {formatCurrency(deal.totalAmount)}
            </p>
          </div>
          <div>
            <strong>Banakhat Amount (25%)</strong>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
              {formatCurrency(deal.banakhatAmount || deal.totalAmount * 0.25)}
            </p>
          </div>
          <div>
            <strong>Deadline</strong>
            <p>{formatDeadlinePeriod(deal.deadlineStartDate, deal.deadlineEndDate)}</p>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="card">
        <div className="flex-between mb-3">
          <h2 className="card-header" style={{ marginBottom: 0, border: 'none', padding: 0 }}>
            Payment Summary
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ background: 'var(--light-color)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Total Amount
            </h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {formatCurrency(deal.totalAmount)}
            </p>
          </div>
          <div className="card" style={{ background: '#d1fae5', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', color: '#065f46', marginBottom: '0.5rem' }}>
              Total Paid
            </h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="card" style={{ background: remainingAmount > 0 ? '#fee2e2' : '#d1fae5', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', color: remainingAmount > 0 ? '#991b1b' : '#065f46', marginBottom: '0.5rem' }}>
              Remaining Amount
            </h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: remainingAmount > 0 ? '#991b1b' : '#065f46' }}>
              {formatCurrency(remainingAmount)}
            </p>
          </div>
        </div>

        {showPaymentForm && (
          <form onSubmit={handlePaymentSubmit} className="card" style={{ background: 'var(--light-color)' }}>
            <h3 className="mb-3">Add Payment Record</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mode of Payment <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={paymentForm.modeOfPayment}
                  onChange={(e) => setPaymentForm({ ...paymentForm, modeOfPayment: e.target.value })}
                  required
                >
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CASH">CASH</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="UPI">UPI</option>
                  <option value="NA">NA</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-textarea"
                placeholder="Enter remarks (e.g., IN HAND ALPESH BHAI)"
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                rows="2"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add Payment
            </button>
          </form>
        )}
      </div>

      {/* Payment History */}
      <div className="card">
        <h2 className="card-header">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-center">No payments recorded yet</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode of Payment</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{formatDate(payment.date)}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        background: 'var(--primary-color)',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {payment.modeOfPayment}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{formatCurrency(payment.amount)}</td>
                    <td>{payment.remarks || '-'}</td>
                    {isAdmin && (
                      <td>
                        <button
                          onClick={() => handleDeletePayment(payment._id, payment.date)}
                          className="btn btn-sm"
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            padding: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Delete Payment"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                <tr style={{ background: 'var(--light-color)', fontWeight: 'bold' }}>
                  <td colSpan="2" className="text-right">TOTAL PAID:</td>
                  <td colSpan={isAdmin ? "3" : "2"} style={{ color: 'var(--secondary-color)' }}>
                    {formatCurrency(totalPaid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', marginBottom: '2rem' }}>
        {isAdmin && (
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="btn btn-secondary"
          >
            {showPaymentForm ? 'Cancel' : '+ Add Payment'}
          </button>
        )}
        <button onClick={generatePDF} className="btn btn-primary">
          📄 Export PDF
        </button>
      </div>
    </div>
  );
};

export default DealDetails;
