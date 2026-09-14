import React, { useState, useMemo, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  normalizeCustomerRow, 
  generateSampleCohort 
} from '../lib/mlEngine';
import BatchRiskDistribution from './visualizations/BatchRiskDistribution';
import BatchRiskMatrix from './visualizations/BatchRiskMatrix';
import BatchSegmentDrivers from './visualizations/BatchSegmentDrivers';

const PAGE_SIZE = 15;

const RISK_FILTER_OPTIONS = [
  { value: 'All', label: 'All Risk Tiers', color: 'rgba(255, 255, 255, 0.4)' },
  { value: 'High Risk', label: 'High Risk (≥ 60%)', color: '#ff3366' },
  { value: 'Medium Risk', label: 'Medium Risk (35% - 60%)', color: '#ffac52' },
  { value: 'Low Risk', label: 'Low Risk (< 35%)', color: '#00f298' }
];

// Custom Dropdown matching Single Profile architecture & glassmorphic styling
function BatchFilterSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('click', handleDocClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedOpt = options.find(o => o.value === value) || options[0];

  return (
    <div className={`custom-select ${isOpen ? 'open' : ''}`} ref={containerRef}>
      <div className="css-specular-wrapper">
        <div 
          className="select-trigger" 
          tabIndex={0}
          onClick={() => setIsOpen(prev => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(prev => !prev);
            }
          }}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOpt.color && (
              <span 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: selectedOpt.color, boxShadow: `0 0 6px ${selectedOpt.color}` }} 
              />
            )}
            <span className="value-text">{selectedOpt.label}</span>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="shrink-0 ml-2"
            style={{
              width: '16px',
              height: '16px',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              opacity: 0.6
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
      <div className="select-content">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <div 
              key={opt.value}
              className={`select-item ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <svg 
                className="check" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <div className="flex items-center gap-2">
                {opt.color && (
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: opt.color }} 
                  />
                )}
                <span>{opt.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BatchPredictor({ 
  onInspectCustomer, 
  onNavigate,
  customers = [],
  setCustomers,
  stagedFile = null,
  setStagedFile,
  isProcessing = false,
  setIsProcessing
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [batchVizTab, setBatchVizTab] = useState('distribution'); // 'distribution' | 'matrix' | 'drivers'
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Stage Uploaded CSV
  const handleFile = (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setStagedFile({
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            rowCount: results.data.length,
            rawData: results.data
          });
        } else {
          alert('The uploaded CSV file is empty.');
        }
      },
      error: (err) => {
        console.error("CSV error:", err);
        alert('Failed to parse CSV file.');
      }
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Stage Sample Cohort
  const handleLoadSample = () => {
    const sample = generateSampleCohort();
    setStagedFile({
      name: 'Sample_Telco_Cohort_100.csv',
      size: '18.4 KB',
      rowCount: sample.length,
      rawData: sample
    });
  };

  // Process Batch Prediction on User Click
  const handleProcessBatch = () => {
    if (!stagedFile || !stagedFile.rawData) return;
    setIsProcessing(true);
    setTimeout(() => {
      const scored = stagedFile.rawData.map((row, idx) => normalizeCustomerRow(row, idx));
      setCustomers(scored);
      setIsProcessing(false);
      setCurrentPage(1);
    }, 200);
  };

  const handleClearCohort = () => {
    setCustomers([]);
    setStagedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download Template CSV
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        customerID: 'TEMPLATE-001',
        gender: 'Female',
        SeniorCitizen: 'No',
        Partner: 'Yes',
        Dependents: 'No',
        tenure: 12,
        PhoneService: 'Yes',
        MultipleLines: 'No',
        InternetService: 'Fiber optic',
        OnlineSecurity: 'No',
        OnlineBackup: 'Yes',
        DeviceProtection: 'No',
        TechSupport: 'No',
        StreamingTV: 'Yes',
        StreamingMovies: 'No',
        Contract: 'Month-to-month',
        PaperlessBilling: 'Yes',
        PaymentMethod: 'Electronic check',
        MonthlyCharges: 79.85,
        TotalCharges: 958.20
      },
      {
        customerID: 'TEMPLATE-002',
        gender: 'Male',
        SeniorCitizen: 'No',
        Partner: 'No',
        Dependents: 'No',
        tenure: 48,
        PhoneService: 'Yes',
        MultipleLines: 'Yes',
        InternetService: 'DSL',
        OnlineSecurity: 'Yes',
        OnlineBackup: 'Yes',
        DeviceProtection: 'Yes',
        TechSupport: 'Yes',
        StreamingTV: 'No',
        StreamingMovies: 'No',
        Contract: 'Two year',
        PaperlessBilling: 'No',
        PaymentMethod: 'Credit card (automatic)',
        MonthlyCharges: 65.20,
        TotalCharges: 3129.60
      }
    ];
    const csvContent = Papa.unparse(templateData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'telco_customer_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Scored Cohort to CSV
  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const exportRows = customers.map(c => ({
      customerID: c.id,
      churn_probability: (c.prob * 100).toFixed(1) + '%',
      risk_tier: c.riskTier,
      annual_revenue_loss_at_risk: '$' + c.annualLoss.toFixed(2),
      recommended_action: c.topAction,
      tenure_months: c.tenure,
      Contract: c.Contract,
      InternetService: c.InternetService,
      MonthlyCharges: c.MonthlyCharges,
      TotalCharges: c.TotalCharges,
      PaymentMethod: c.PaymentMethod,
      PaperlessBilling: c.PaperlessBilling
    }));

    const csvContent = Papa.unparse(exportRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telco_churn_scored_cohort_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter & Search
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = searchTerm === '' || 
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.Contract.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.InternetService.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.PaymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTier = filterTier === 'All' || c.riskTier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [customers, searchTerm, filterTier]);

  // Aggregate KPIs
  const { totalCount, highRiskCount, highRiskPct, avgChurnPct, totalLoss } = useMemo(() => {
    const total = customers.length;
    if (total === 0) return { totalCount: 0, highRiskCount: 0, highRiskPct: 0, avgChurnPct: 0, totalLoss: 0 };
    const high = customers.filter(c => c.riskTier === 'High Risk').length;
    const highPct = Math.round((high / total) * 100);
    const avg = Math.round((customers.reduce((acc, c) => acc + c.prob, 0) / total) * 100);
    const loss = customers
      .filter(c => c.riskTier === 'High Risk')
      .reduce((acc, c) => acc + c.annualLoss, 0);

    return {
      totalCount: total,
      highRiskCount: high,
      highRiskPct: highPct,
      avgChurnPct: avg,
      totalLoss: loss
    };
  }, [customers]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  return (
    <div id="workspace-view" style={{ width: '100%' }}>
      {/* Top Workspace Bar */}
      <div className="workspace-breadcrumb">
        <button 
          type="button" 
          className="back-home-btn" 
          onClick={() => onNavigate && onNavigate('landing')}
          style={{ textDecoration: 'none', border: 'none' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back to Overview</span>
        </button>
      </div>

      {/* Main Application Layout */}
      <div className="container">
        <div id="batch-view" style={{ display: 'block', width: '100%', marginTop: '16px' }}>
          
          {/* Upload Dropzone Panel */}
          <div className="panel batch-upload-panel">
            {stagedFile && customers.length === 0 ? (
              <div 
                className="staged-csv-card" 
                style={{
                  background: 'rgba(0, 242, 152, 0.04)',
                  border: '1.5px solid rgba(0, 242, 152, 0.3)',
                  borderRadius: '16px',
                  padding: '44px 28px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0, 242, 152, 0.08)'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(0, 242, 152, 0.12)',
                  border: '1px solid rgba(0, 242, 152, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fx-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.45rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  {stagedFile.name}
                </div>
                <p style={{ color: 'var(--fx-muted)', fontSize: '0.92rem', marginBottom: '28px', maxWidth: '520px' }}>
                  <strong style={{ color: 'var(--fx-green)' }}>{stagedFile.rowCount} customer records</strong> detected ({stagedFile.size}). Click below to run client-side batch ML scoring.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button 
                    type="button"
                    className="flow-button"
                    style={{ width: 'auto', padding: '0 32px', height: '48px', margin: 0 }}
                    onClick={handleProcessBatch}
                    disabled={isProcessing}
                  >
                    <span className="text" style={{ fontSize: '0.92rem' }}>
                      {isProcessing ? 'Scoring Cohort...' : `⚡ Process & Score Cohort (${stagedFile.rowCount} Records)`}
                    </span>
                    <span className="circle"></span>
                  </button>
                  <button 
                    type="button"
                    className="btn-outline"
                    style={{ padding: '12px 24px', fontSize: '0.88rem' }}
                    onClick={handleClearCohort}
                  >
                    Cancel / Choose Another File
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={`dropzone ${isDragging ? 'dragover' : ''}`}
                id="csv-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv" 
                  style={{ display: 'none' }} 
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <div className="dropzone-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--fx-green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="dropzone-title">
                  {customers.length > 0 ? 'Upload New Customer CSV' : 'Drag & Drop Customer CSV Here'}
                </div>
                <p className="dropzone-sub">
                  {customers.length > 0 
                    ? `Currently displaying ${customers.length} scored accounts. Upload a new CSV to score another cohort.`
                    : 'Upload Telco customer data (19 features) to score the cohort in-browser.'}
                </p>
                <div className="dropzone-actions flex items-center justify-center gap-4 flex-wrap mt-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    type="button" 
                    className="btn-outline px-6 py-3 text-sm font-semibold tracking-wide hover:bg-white/10 hover:border-white/30 hover:text-white transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span>📁</span>
                    <span>Browse Files</span>
                  </button>
                  {customers.length > 0 && (
                    <button
                      type="button"
                      className="btn-outline px-6 py-3 text-sm font-semibold tracking-wide hover:bg-red-500/10 hover:border-red-500/40 transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                      style={{ borderColor: 'rgba(255, 51, 102, 0.35)', color: 'var(--risk-high)' }}
                      onClick={handleClearCohort}
                    >
                      <span>🗑️</span>
                      <span>Clear Active Cohort</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Batch Analytics KPI Summary Cards & Table Panel - Rendered ONLY after processing */}
          {customers.length > 0 && (
            <>
              <div className="batch-kpi-grid" id="batch-kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-label">Customers Scored</div>
                  <div className="kpi-val" id="kpi-total">{totalCount.toLocaleString()}</div>
                  <div className="kpi-sub">Portfolio size</div>
                </div>
                <div className="kpi-card danger">
                  <div className="kpi-label">High Flight-Risk</div>
                  <div className="kpi-val" id="kpi-high-risk">{highRiskCount.toLocaleString()}</div>
                  <div className="kpi-sub" id="kpi-high-pct">{highRiskPct}% of cohort</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Average Churn Rate</div>
                  <div className="kpi-val" id="kpi-avg-rate">{avgChurnPct}%</div>
                  <div className="kpi-sub">Mean probability</div>
                </div>
                <div className="kpi-card warning">
                  <div className="kpi-label">Total Revenue at Risk</div>
                  <div className="kpi-val" id="kpi-revenue-loss">
                    ${totalLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="kpi-sub">High-risk cohort annual loss</div>
                </div>
              </div>

              {/* BATCH VISUAL ANALYTICS SUITE */}
              <div className="panel batch-analytics-panel" id="batch-analytics-panel" style={{ display: 'block', marginTop: '24px', padding: '28px 32px' }}>
                {/* Visual Analytics Tab Switcher Header */}
                <div className="viz-tabs-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
                  <div>
                    <div className="section-title" style={{ margin: 0, fontSize: '1.05rem' }}>Cohort Analytics</div>
                  </div>

                  {/* Tab Navigation Buttons */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 self-start md:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setBatchVizTab('distribution')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        batchVizTab === 'distribution'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-semibold'
                          : 'text-text-muted hover:text-white border border-transparent'
                      }`}
                    >
                      <span>📊</span>
                      <span>Risk Distribution</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBatchVizTab('matrix')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        batchVizTab === 'matrix'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(0,242,152,0.25)] font-semibold'
                          : 'text-text-muted hover:text-white border border-transparent'
                      }`}
                    >
                      <span>🗺️</span>
                      <span>Revenue Scatter Matrix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBatchVizTab('drivers')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        batchVizTab === 'drivers'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(255,172,82,0.25)] font-semibold'
                          : 'text-text-muted hover:text-white border border-transparent'
                      }`}
                    >
                      <span>⚡</span>
                      <span>Segment Drivers</span>
                    </button>
                  </div>
                </div>

                {/* Active Tab View */}
                <div className="viz-tab-body">
                  {batchVizTab === 'distribution' && (
                    <BatchRiskDistribution 
                      customers={customers} 
                      activeFilterTier={filterTier} 
                      onSelectTier={(tier) => {
                        setFilterTier(tier);
                        setCurrentPage(1);
                      }} 
                    />
                  )}
                  {batchVizTab === 'matrix' && (
                    <BatchRiskMatrix 
                      customers={customers} 
                      onInspectCustomer={onInspectCustomer} 
                    />
                  )}
                  {batchVizTab === 'drivers' && (
                    <BatchSegmentDrivers 
                      customers={customers} 
                      onFilterSearch={(term) => {
                        setSearchTerm(term);
                        setCurrentPage(1);
                      }} 
                    />
                  )}
                </div>
              </div>

              {/* Batch Table & Controls Panel */}
              <div className="panel batch-table-panel" id="batch-table-panel">
                <div className="batch-toolbar">
                  <div className="batch-search-wrap">
                    <input 
                      type="text" 
                      id="batch-search-input" 
                      placeholder="Search Customer ID, Contract, or Internet..." 
                      className="batch-search"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <div className="batch-filter-wrap">
                    <BatchFilterSelect 
                      value={filterTier}
                      onChange={(tier) => {
                        setFilterTier(tier);
                        setCurrentPage(1);
                      }}
                      options={RISK_FILTER_OPTIONS}
                    />
                  </div>

                  {/* Flow Button for CSV Export */}
                  <button 
                    type="button" 
                    className="flow-button batch-export-btn" 
                    id="export-csv-btn"
                    onClick={handleExportCSV}
                  >
                    <svg className="arr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span className="text">Export Scored CSV</span>
                    <span className="circle"></span>
                    <svg className="arr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="batch-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Tenure</th>
                        <th>Contract</th>
                        <th>Monthly Bill</th>
                        <th>Churn Risk</th>
                        <th>Risk Tier</th>
                        <th>Revenue at Risk</th>
                        <th>Recommended Action</th>
                        <th style={{ textAlign: 'right' }}>Inspect</th>
                      </tr>
                    </thead>
                    <tbody id="batch-table-body">
                      {paginatedCustomers.map((c) => {
                        const tierClass = c.riskTier === 'High Risk' ? 'high' : (c.riskTier === 'Medium Risk' ? 'medium' : 'low');
                        const color = c.riskTier === 'High Risk' ? 'var(--risk-high)' : (c.riskTier === 'Medium Risk' ? 'var(--risk-medium)' : 'var(--fx-green)');
                        return (
                          <tr key={c.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.id}</td>
                            <td>{c.tenure} mo</td>
                            <td>{c.Contract}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>${Number(c.MonthlyCharges || 0).toFixed(2)}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
                              {c.pct}%
                            </td>
                            <td>
                              <span className={`risk-badge ${tierClass}`}>{c.riskTier}</span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>${c.annualLoss.toFixed(2)}/yr</td>
                            <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.topAction}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                type="button" 
                                className="table-inspect-btn" 
                                onClick={() => onInspectCustomer(c)}
                              >
                                Inspect &rarr;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="batch-pagination">
                  <div className="pagination-info" id="pagination-info">
                    Showing {filteredCustomers.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} - {Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length} customers
                  </div>
                  <div className="pagination-controls">
                    <button 
                      type="button" 
                      className="btn-outline page-btn" 
                      id="page-prev-btn" 
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      &larr; Prev
                    </button>
                    <span className="page-current" id="page-current-num">{currentPage}</span>
                    <button 
                      type="button" 
                      className="btn-outline page-btn" 
                      id="page-next-btn" 
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
