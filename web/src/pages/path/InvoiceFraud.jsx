// web/src/pages/accounting/InvoiceFraud.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserTopbar from "../../components/UserTopbar";

const FraudFlag = ({ type, severity, message }) => {
  const severityColors = {
    low: 'warning',
    medium: 'danger',
    high: 'danger'
  };

  const severityIcons = {
    low: 'bi-exclamation-triangle',
    medium: 'bi-exclamation-circle',
    high: 'bi-shield-exclamation'
  };

  return (
    <div className={`alert alert-${severityColors[severity]} d-flex align-items-center`}>
      <i className={`bi ${severityIcons[severity]} me-2`}></i>
      <div>
        <strong>{type}:</strong> {message}
      </div>
    </div>
  );
};

export default function InvoiceFraud() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [manualInput, setManualInput] = useState({
    vendorName: '',
    invoiceNumber: '',
    amount: '',
    date: '',
    description: '',
    vendorEmail: '',
    bankDetails: ''
  });
  const [activeTab, setActiveTab] = useState('upload');

  // Mock analysis function - replace with actual ML/AI analysis
  const analyzeInvoice = async (data) => {
    setAnalyzing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const flags = [];
    let overallRisk = 'low';

    // Mock analysis rules
    if (data.amount && parseFloat(data.amount.replace(/[^0-9.-]/g, '')) > 10000) {
      flags.push({
        type: 'High Amount',
        severity: 'medium',
        message: 'Invoice amount exceeds $10,000. Consider additional verification.'
      });
    }

    if (data.vendorEmail && !data.vendorEmail.includes(data.vendorName.toLowerCase().replace(/\s/g, ''))) {
      flags.push({
        type: 'Email Mismatch',
        severity: 'high',
        message: 'Vendor email domain does not match vendor name pattern.'
      });
      overallRisk = 'high';
    }

    if (data.bankDetails && data.bankDetails.includes('foreign')) {
      flags.push({
        type: 'International Transfer',
        severity: 'medium',
        message: 'Banking details suggest international transfer. Verify legitimacy.'
      });
      if (overallRisk !== 'high') overallRisk = 'medium';
    }

    if (data.description && data.description.toLowerCase().includes('urgent')) {
      flags.push({
        type: 'Urgency Pressure',
        severity: 'low',
        message: 'Invoice contains urgency language which is common in fraud attempts.'
      });
    }

    // Check for round numbers (common in fake invoices)
    if (data.amount && parseFloat(data.amount.replace(/[^0-9.-]/g, '')) % 100 === 0) {
      flags.push({
        type: 'Round Amount',
        severity: 'low',
        message: 'Invoice amount is a round number, which is uncommon for legitimate services.'
      });
    }

    setAnalysisResult({
      overallRisk,
      riskScore: flags.length * 20,
      flags,
      recommendations: getRecommendations(overallRisk, flags)
    });
    
    setAnalyzing(false);
  };

  const getRecommendations = (risk, flags) => {
    const recommendations = [
      'Verify vendor legitimacy through independent channels',
      'Cross-reference invoice details with purchase orders',
      'Check payment history with this vendor'
    ];

    if (risk === 'high') {
      recommendations.unshift('STOP: Do not process payment until fraud concerns are resolved');
      recommendations.push('Contact vendor directly using previously known contact information');
      recommendations.push('Report suspicious activity to security team');
    } else if (risk === 'medium') {
      recommendations.push('Require additional approval before payment');
      recommendations.push('Verify banking details independently');
    }

    return recommendations;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // In a real implementation, you would parse the file here
      // For demo purposes, we'll use mock data
      const mockData = {
        vendorName: 'ABC Services Ltd',
        invoiceNumber: 'INV-2024-001',
        amount: '$5,500.00',
        date: '2024-01-15',
        description: 'Urgent consulting services - immediate payment required',
        vendorEmail: 'payments@suspicious-domain.com',
        bankDetails: 'Foreign bank account - Swift: ABCD1234'
      };
      analyzeInvoice(mockData);
    }
  };

  const handleManualAnalysis = (event) => {
    event.preventDefault();
    analyzeInvoice(manualInput);
  };

  const handleInputChange = (field, value) => {
    setManualInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setManualInput({
      vendorName: '',
      invoiceNumber: '',
      amount: '',
      date: '',
      description: '',
      vendorEmail: '',
      bankDetails: ''
    });
  };

  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Invoice Fraud Detective</h1>
            <p className="text-muted mb-0">Analyze invoices for potential fraud indicators</p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/accounting')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </button>
        </div>

        {/* Input Method Tabs */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-0">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  <i className="bi bi-upload me-2"></i>
                  Upload Invoice
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'manual' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manual')}
                >
                  <i className="bi bi-keyboard me-2"></i>
                  Manual Entry
                </button>
              </li>
            </ul>
          </div>
          
          <div className="card-body p-4">
            {activeTab === 'upload' ? (
              <div className="text-center">
                <div className="upload-zone border-dashed p-5 rounded-3">
                  <i className="bi bi-cloud-upload display-4 text-muted mb-3"></i>
                  <h5>Upload Invoice Document</h5>
                  <p className="text-muted mb-4">
                    Support for PDF, JPG, PNG formats. AI will extract and analyze invoice data.
                  </p>
                  <input
                    type="file"
                    id="invoice-upload"
                    className="d-none"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="invoice-upload" className="btn btn-primary">
                    <i className="bi bi-upload me-2"></i>
                    Choose File
                  </label>
                  {selectedFile && (
                    <div className="mt-3">
                      <span className="badge bg-info-subtle text-info">
                        <i className="bi bi-file-earmark me-1"></i>
                        {selectedFile.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualAnalysis}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Vendor Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={manualInput.vendorName}
                      onChange={(e) => handleInputChange('vendorName', e.target.value)}
                      placeholder="ABC Company Ltd"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Invoice Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={manualInput.invoiceNumber}
                      onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                      placeholder="INV-2024-001"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Amount</label>
                    <input
                      type="text"
                      className="form-control"
                      value={manualInput.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="$1,500.00"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Invoice Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={manualInput.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Description/Services</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={manualInput.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Description of services or products..."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Vendor Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={manualInput.vendorEmail}
                      onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
                      placeholder="vendor@company.com"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Banking Details</label>
                    <input
                      type="text"
                      className="form-control"
                      value={manualInput.bankDetails}
                      onChange={(e) => handleInputChange('bankDetails', e.target.value)}
                      placeholder="Bank name, account info..."
                    />
                  </div>
                  <div className="col-12">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-search me-2"></i>
                          Analyze Invoice
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {analyzing && (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center p-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Analyzing...</span>
              </div>
              <h5>Analyzing Invoice</h5>
              <p className="text-muted">AI is processing the invoice data for fraud indicators...</p>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-shield-check me-2"></i>
                Analysis Results
              </h5>
              <button className="btn btn-outline-secondary btn-sm" onClick={resetAnalysis}>
                <i className="bi bi-arrow-clockwise me-1"></i>
                New Analysis
              </button>
            </div>
            <div className="card-body">
              {/* Risk Summary */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="text-center p-3 rounded-3 risk-summary">
                    <div className={`risk-indicator risk-${analysisResult.overallRisk} mb-2`}>
                      <i className={`bi ${
                        analysisResult.overallRisk === 'high' ? 'bi-exclamation-triangle-fill' :
                        analysisResult.overallRisk === 'medium' ? 'bi-exclamation-circle' :
                        'bi-check-circle'
                      }`}></i>
                    </div>
                    <h6 className="fw-bold text-uppercase">
                      {analysisResult.overallRisk} Risk
                    </h6>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 rounded-3 score-summary">
                    <div className="score-number mb-2">
                      {analysisResult.riskScore}
                    </div>
                    <h6 className="fw-bold">Risk Score</h6>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 rounded-3 flags-summary">
                    <div className="flags-number mb-2">
                      {analysisResult.flags.length}
                    </div>
                    <h6 className="fw-bold">Flags Found</h6>
                  </div>
                </div>
              </div>

              {/* Fraud Flags */}
              {analysisResult.flags.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-flag me-2"></i>
                    Fraud Indicators
                  </h6>
                  {analysisResult.flags.map((flag, index) => (
                    <FraudFlag 
                      key={index} 
                      type={flag.type}
                      severity={flag.severity}
                      message={flag.message}
                    />
                  ))}
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-lightbulb me-2"></i>
                  Recommendations
                </h6>
                <ul className="list-group list-group-flush">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="list-group-item border-0 px-0">
                      <i className="bi bi-check2 text-success me-2"></i>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .upload-zone {
            border: 2px dashed #dee2e6;
            background: rgba(var(--bs-light-rgb), 0.5);
            transition: all 0.3s ease;
          }

          .upload-zone:hover {
            border-color: var(--bs-primary);
            background: rgba(var(--bs-primary-rgb), 0.05);
          }

          .risk-summary, .score-summary, .flags-summary {
            background: rgba(var(--bs-light-rgb), 0.3);
            border: 1px solid rgba(0,0,0,0.1);
          }

          .risk-indicator {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            font-size: 1.5rem;
          }

          .risk-high {
            background: #fee2e2;
            color: #dc2626;
          }

          .risk-medium {
            background: #fef3c7;
            color: #d97706;
          }

          .risk-low {
            background: #dcfce7;
            color: #16a34a;
          }

          .score-number, .flags-number {
            font-size: 2rem;
            font-weight: 700;
            color: var(--bs-primary);
          }

          /* Dark theme support */
          [data-bs-theme="dark"] .card {
            background-color: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .upload-zone {
            background: rgba(255, 255, 255, 0.05);
            border-color: #4a5568;
          }

          [data-bs-theme="dark"] .upload-zone:hover {
            background: rgba(59, 130, 246, 0.1);
            border-color: #60a5fa;
          }

          [data-bs-theme="dark"] .risk-summary,
          [data-bs-theme="dark"] .score-summary,
          [data-bs-theme="dark"] .flags-summary {
            background: rgba(255, 255, 255, 0.05);
            border-color: #4a5568;
          }
        `}</style>
      </div>
    </>
  );
}