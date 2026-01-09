import React, { useState, useEffect, useCallback } from 'react';
import UserTopbar from "../../components/UserTopbar";

const InvoiceFraudDetectiveGame = ({ onComplete }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [foundFrauds, setFoundFrauds] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [showHint, setShowHint] = useState(false);
  const [clickedInvoices, setClickedInvoices] = useState(new Set());
  const [gameStarted, setGameStarted] = useState(false);
  const [levelTransition, setLevelTransition] = useState(false);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showJustification, setShowJustification] = useState(null);

  const levels = [
    {
      title: "Basic Invoice Fraud Detection",
      description: "Find 3 fraudulent invoices in these accounting documents",
      language: "Invoice",
      timeLimit: 90,
      invoices: [
        { 
          id: 1, 
          vendor: "Office Supplies Inc.", 
          amount: "$2,450.00", 
          invoiceNum: "INV-2024-001", 
          description: "Office supplies for Q1 - pens, paper, folders", 
          bankDetails: "Wells Fargo - Account: 1234567890",
          isFraud: false, 
          points: 50, 
          hint: "This appears to be a legitimate office supply invoice with reasonable amounts",
          correctJustification: "✅ CORRECT: This is a legitimate business expense. The amount is reasonable for office supplies, vendor appears established, and banking details look normal.",
          wrongJustification: "❌ INCORRECT: This is a legitimate office supply invoice with standard business amounts and proper vendor information."
        },
        { 
          id: 2, 
          vendor: "IT Solutions LLC", 
          amount: "$15,750.00", 
          invoiceNum: "INV-2024-002", 
          description: "Software licensing and maintenance", 
          bankDetails: "Bank of America - Account: 9876543210",
          isFraud: false, 
          points: 50, 
          hint: "Software licensing costs are typical business expenses",
          correctJustification: "✅ CORRECT: This is a legitimate business expense. The amount is reasonable for software licensing, vendor appears established, and banking details are from a major bank.",
          wrongJustification: "❌ INCORRECT: This is a legitimate software licensing invoice - a normal business expense with appropriate amounts and vendor information."
        },
        { 
          id: 3, 
          vendor: "Consulting Services Pro", 
          amount: "$85,000.00", 
          invoiceNum: "INV-2024-003", 
          description: "Strategic consulting for business optimization", 
          bankDetails: "First National Bank - Account: 5555666677",
          isFraud: true, 
          points: 120, 
          hint: "This amount seems unusually high for consulting. Check if this vendor is approved.",
          correctJustification: "✅ CORRECT: This is suspicious! Red flags include: extremely high amount for consulting services ($85,000), vague description, and the vendor may not be in the approved vendor list.",
          wrongJustification: "❌ INCORRECT: This invoice shows multiple red flags - unusually high consulting fees, vague service description, and should be verified against approved vendor lists."
        },
        { 
          id: 4, 
          vendor: "Maintenance & Repair Co.", 
          amount: "$3,200.00", 
          invoiceNum: "INV-2024-004", 
          description: "HVAC system maintenance and repairs", 
          bankDetails: "Chase Bank - Account: 1111222233",
          isFraud: false, 
          points: 50, 
          hint: "HVAC maintenance is a regular business expense" 
        },
        { 
          id: 5, 
          vendor: "Office Supplies Inc.", 
          amount: "$2,450.00", 
          invoiceNum: "INV-2024-005", 
          description: "Office supplies for Q1 - pens, paper, folders", 
          bankDetails: "Different Bank - Account: 9999888877",
          isFraud: true, 
          points: 100, 
          hint: "This is identical to invoice #1 but with different bank details - duplicate billing!",
          correctJustification: "✅ CORRECT: This is fraudulent! This invoice is identical to INV-2024-001 (same vendor, amount, description) but with different banking details - classic duplicate billing scam.",
          wrongJustification: "❌ INCORRECT: This is definitely fraud - it's a duplicate of invoice #1 with identical details but different bank account information."
        },
        { 
          id: 6, 
          vendor: "Emergency IT Repair", 
          amount: "$12,500.00", 
          invoiceNum: "URGENT-001", 
          description: "Emergency server repair - payment needed immediately", 
          bankDetails: "Offshore Bank - Account: 0000111122",
          isFraud: true, 
          points: 110, 
          hint: "Urgent payment requests and offshore banking are red flags for fraud",
          correctJustification: "✅ CORRECT: This is fraudulent! Red flags include: urgency language ('payment needed immediately'), suspicious invoice number format, offshore banking, and emergency repairs without proper authorization.",
          wrongJustification: "❌ INCORRECT: This invoice shows clear fraud indicators - urgent payment demands, offshore banking, and lacks proper emergency service authorization procedures."
        }
      ],
      frauds: [3, 5, 6]
    },
    {
      title: "Advanced Financial Fraud Analysis",
      description: "Find 2 sophisticated financial fraud attempts",
      language: "Invoice",
      timeLimit: 120,
      invoices: [
        { 
          id: 7, 
          vendor: "Legal Services Partners", 
          amount: "$8,750.00", 
          invoiceNum: "LSP-2024-101", 
          description: "Contract review and legal consultation services", 
          bankDetails: "Trust Bank - Account: 4444555566",
          isFraud: false, 
          points: 60, 
          hint: "Legal services are legitimate business expenses" 
        },
        { 
          id: 8, 
          vendor: "Marketing Solutions Ltd", 
          amount: "$45,000.00", 
          invoiceNum: "MKT-2024-201", 
          description: "Digital marketing campaign - Q2 social media advertising", 
          bankDetails: "Regional Bank - Account: 7777888899",
          isFraud: true, 
          points: 150, 
          hint: "This vendor was recently flagged in our system. Verify if this is an approved vendor." 
        },
        { 
          id: 9, 
          vendor: "Facilities Management Corp", 
          amount: "$6,200.00", 
          invoiceNum: "FMC-2024-301", 
          description: "Monthly cleaning and janitorial services", 
          bankDetails: "Community Bank - Account: 2222333344",
          isFraud: false, 
          points: 60, 
          hint: "Facilities management is a regular operational expense" 
        },
        { 
          id: 10, 
          vendor: "Tech Upgrade Solutions", 
          amount: "$75,000.00", 
          invoiceNum: "TUS-2024-401", 
          description: "Hardware upgrade - new servers and networking equipment", 
          bankDetails: "International Bank - Account: 6666777788",
          isFraud: true, 
          points: 140, 
          hint: "Large tech purchases should go through IT approval. Check if this was properly authorized." 
        }
      ],
      frauds: [8, 10]
    },
    {
      title: "Expert-Level Vendor Impersonation",
      description: "Find 3 advanced vendor impersonation and payment redirection frauds",
      language: "Invoice",
      timeLimit: 150,
      invoices: [
        { 
          id: 11, 
          vendor: "Global Consulting Partners", 
          amount: "$28,500.00", 
          invoiceNum: "GCP-2024-501", 
          description: "Strategic business consulting - Q3 operational review", 
          bankDetails: "First National Bank - Account: 3333444455",
          isFraud: false, 
          points: 70, 
          hint: "This appears to be a legitimate consulting engagement with proper documentation" 
        },
        { 
          id: 12, 
          vendor: "Office Supplies Inc.", 
          amount: "$4,200.00", 
          invoiceNum: "OSI-2024-601", 
          description: "Office supplies - Q3 bulk order for all departments", 
          bankDetails: "Wells Fargo - Account: 1234567891",
          isFraud: true, 
          points: 160, 
          hint: "Notice the slight difference in account number from previous legitimate invoices - this could be payment redirection fraud" 
        },
        { 
          id: 13, 
          vendor: "CloudTech Solutions", 
          amount: "$95,000.00", 
          invoiceNum: "CTS-2024-701", 
          description: "Cloud infrastructure upgrade - annual licensing and migration services", 
          bankDetails: "Tech Credit Union - Account: 5555666678",
          isFraud: true, 
          points: 180, 
          hint: "This vendor name is very similar to our legitimate CloudTech Systems provider - check for typosquatting" 
        },
        { 
          id: 14, 
          vendor: "Insurance Partners LLC", 
          amount: "$15,600.00", 
          invoiceNum: "IP-2024-801", 
          description: "Business liability insurance - quarterly premium payment", 
          bankDetails: "State Insurance Bank - Account: 7777888800",
          isFraud: false, 
          points: 70, 
          hint: "Insurance premiums are regular business expenses with predictable amounts" 
        },
        { 
          id: 15, 
          vendor: "Maintenance & Repair Co.", 
          amount: "$8,900.00", 
          invoiceNum: "MRC-2024-901", 
          description: "Emergency HVAC repair - urgent weekend service call", 
          bankDetails: "Offshore Banking Solutions - Account: 9999000011",
          isFraud: true, 
          points: 170, 
          hint: "Legitimate maintenance companies don't typically use offshore banking - this is suspicious" 
        },
        { 
          id: 16, 
          vendor: "Professional Development Corp", 
          amount: "$12,300.00", 
          invoiceNum: "PDC-2024-1001", 
          description: "Employee training and certification programs - Q3 batch", 
          bankDetails: "Education Credit Union - Account: 2222333345",
          isFraud: false, 
          points: 70, 
          hint: "Employee training is a standard business investment with reasonable costs" 
        }
      ],
      frauds: [12, 13, 15]
    },
    {
      title: "Master-Level Financial Crime Detection",
      description: "Find 4 highly sophisticated financial crimes and money laundering attempts",
      language: "Invoice",
      timeLimit: 180,
      invoices: [
        { 
          id: 17, 
          vendor: "International Trade Solutions", 
          amount: "$156,000.00", 
          invoiceNum: "ITS-2024-1101", 
          description: "Import/export consulting - customs and regulatory compliance", 
          bankDetails: "Global Commerce Bank - Account: 4444555567",
          isFraud: false, 
          points: 80, 
          hint: "International trade consulting is legitimate for companies with global operations" 
        },
        { 
          id: 18, 
          vendor: "Research & Analytics Ltd", 
          amount: "$89,500.00", 
          invoiceNum: "RAL-2024-1201", 
          description: "Market research and competitive analysis - comprehensive industry report", 
          bankDetails: "Cryptocurrency Exchange Bank - Account: BC1QXY789",
          isFraud: true, 
          points: 200, 
          hint: "Legitimate businesses don't typically request payment to cryptocurrency accounts - major red flag" 
        },
        { 
          id: 19, 
          vendor: "Legal Services Partners", 
          amount: "$67,800.00", 
          invoiceNum: "LSP-2024-1301", 
          description: "Intellectual property protection - patent filing and trademark registration", 
          bankDetails: "Trust Bank - Account: 4444555566",
          isFraud: false, 
          points: 80, 
          hint: "IP protection services are legitimate legal expenses for businesses" 
        },
        { 
          id: 20, 
          vendor: "Consulting Excellence Group", 
          amount: "$234,000.00", 
          invoiceNum: "CEG-2024-1401", 
          description: "Strategic transformation consulting - 6-month engagement", 
          bankDetails: "Shell Company Bank - Account: 0000111133",
          isFraud: true, 
          points: 220, 
          hint: "Extremely high consulting fees with vague descriptions often indicate fraudulent billing schemes" 
        },
        { 
          id: 21, 
          vendor: "Facilities Management Corp", 
          amount: "$45,600.00", 
          invoiceNum: "FMC-2024-1501", 
          description: "Building renovation - executive floor upgrades and security enhancements", 
          bankDetails: "Money Laundering Bank - Account: 1111222244",
          isFraud: true, 
          points: 190, 
          hint: "The bank name itself is suspicious - legitimate banks don't have names like this" 
        },
        { 
          id: 22, 
          vendor: "Technology Partners Inc", 
          amount: "$78,900.00", 
          invoiceNum: "TPI-2024-1601", 
          description: "Software licensing - annual enterprise suite renewal", 
          bankDetails: "Tech Solutions Bank - Account: 6666777789",
          isFraud: false, 
          points: 80, 
          hint: "Software licensing renewals are standard IT expenses" 
        },
        { 
          id: 23, 
          vendor: "Marketing Excellence Ltd", 
          amount: "$125,000.00", 
          invoiceNum: "MEL-2024-1701", 
          description: "Brand repositioning campaign - comprehensive marketing overhaul", 
          bankDetails: "Suspicious Transactions Bank - Account: 9999888877",
          isFraud: true, 
          points: 210, 
          hint: "Another obviously suspicious bank name combined with high marketing costs - likely money laundering" 
        }
      ],
      frauds: [18, 20, 21, 23]
    }
  ];

  const currentLevelData = levels[currentLevel];

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameOver || timeLeft <= 0 || levelTransition) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (currentLevel < levels.length - 1) {
            setLevelTransition(true);
            setTimeout(() => {
              setCurrentLevel(prev => prev + 1);
              setFoundFrauds(new Set());
              setClickedInvoices(new Set());
              setTimeLeft(levels[currentLevel + 1].timeLimit);
              setLevelTransition(false);
            }, 1000);
          } else {
            setGameOver(true);
            onComplete('invoicefraud', score, getTotalPossibleScore());
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft, currentLevel, levelTransition, onComplete, score]);

  const handleInvoiceClick = (invoiceId) => {
    const invoice = currentLevelData.invoices.find(i => i.id === invoiceId);
    const newClickedInvoices = new Set(clickedInvoices);
    newClickedInvoices.add(invoiceId);
    setClickedInvoices(newClickedInvoices);

    // Show justification for the click
    if (invoice.isFraud) {
      setShowJustification({ invoiceId, message: invoice.correctJustification, isCorrect: true });
    } else {
      setShowJustification({ invoiceId, message: invoice.wrongJustification, isCorrect: false });
    }

    // Auto-hide justification after 5 seconds
    setTimeout(() => {
      setShowJustification(null);
    }, 5000);

    if (invoice.isFraud && !foundFrauds.has(invoiceId)) {
      const newFoundFrauds = new Set(foundFrauds);
      newFoundFrauds.add(invoiceId);
      setFoundFrauds(newFoundFrauds);
      setScore(score + invoice.points);
      setStreak(streak + 1);
      
      if (newFoundFrauds.size === currentLevelData.frauds.length) {
        setTimeout(() => {
          if (currentLevel < levels.length - 1) {
            setShowLevelComplete(true);
            setTimeout(() => {
              setShowLevelComplete(false);
              setLevelTransition(true);
              setTimeout(() => {
                setCurrentLevel(currentLevel + 1);
                setFoundFrauds(new Set());
                setClickedInvoices(new Set());
                setTimeLeft(levels[currentLevel + 1].timeLimit);
                setLevelTransition(false);
              }, 1000);
            }, 2000);
          } else {
            setGameOver(true);
            onComplete('invoicefraud', score + invoice.points, getTotalPossibleScore());
          }
        }, 500);
      }
    } else if (!invoice.isFraud) {
      setWrongClicks(wrongClicks + 1);
      setStreak(0);
    }
  };

  const getTotalPossibleScore = () => {
    return levels.reduce((total, level) => {
      return total + level.invoices.filter(i => i.isFraud).reduce((sum, i) => sum + i.points, 0);
    }, 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start screen
  if (!gameStarted) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4">
          <div className="invoice-fraud-game">
            <div className="text-center">
              <div className="mb-4">
                <h2 className="display-6 fw-bold text-primary mb-3">
                  🕵️ Invoice Fraud Detective
                </h2>
                <p className="lead mb-4 text-muted">
                  Dynamic Biz Accounting Team Training<br/>
                  Master the art of detecting fraudulent invoices and financial scams.
                </p>
              </div>
              
              <div className="row g-4 mb-5">
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-primary">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-layers display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.length}</div>
                      <div className="small opacity-75">Fraud Levels</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-warning">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-receipt display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.reduce((sum, level) => sum + level.frauds.length, 0)}</div>
                      <div className="small opacity-75">Frauds to Find</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-success">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-trophy display-6 mb-3"></i>
                      <div className="h3 mb-2">{getTotalPossibleScore()}</div>
                      <div className="small opacity-75">Maximum Score</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-info">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-clock display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.reduce((sum, level) => sum + level.timeLimit, 0)}s</div>
                      <div className="small opacity-75">Total Time Limit</div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-primary btn-lg px-5 py-3 shadow-lg"
                onClick={() => setGameStarted(true)}
              >
                <i className="bi bi-search me-2"></i>
                Start Fraud Detection
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Level complete screen
  if (showLevelComplete) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4">
          <div className="text-center py-5">
            <div className="mb-4">
              <i className="bi bi-check-circle-fill text-success display-1"></i>
            </div>
            <h2 className="text-success mb-3">Level Complete!</h2>
            <p className="lead">Excellent fraud detection on {currentLevelData.title}</p>
            {currentLevel < levels.length - 1 && (
              <p className="text-muted">Loading next accounting challenge...</p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Level transition screen
  if (levelTransition) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-4" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4>Loading Next Fraud Challenge...</h4>
            <p className="text-muted">Prepare for more sophisticated fraud detection!</p>
          </div>
        </div>
      </>
    );
  }

  // Game over screen
  if (gameOver) {
    const percentage = Math.round((score / getTotalPossibleScore()) * 100);
    
    return (
      <>
        <UserTopbar />
        <div className="container my-4">
          <div className="text-center">
            <div className="mb-4">
              <i className={`bi ${
                percentage >= 80 ? 'bi-award-fill text-success' :
                percentage >= 60 ? 'bi-award text-warning' : 'bi-bookmark text-info'
              } display-1`}></i>
            </div>
            
            <h2 className="mb-4">Invoice Fraud Detection Complete!</h2>
            
            <div className="row justify-content-center mb-4">
              <div className="col-lg-6">
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-5">
                    <div className="display-3 fw-bold text-primary mb-2">{score}</div>
                    <div className="h5 text-muted mb-3">Final Score ({percentage}%)</div>
                    
                    <div className={`alert ${
                      percentage >= 80 ? 'alert-success' :
                      percentage >= 60 ? 'alert-warning' : 'alert-info'
                    } mb-4`}>
                      <i className={`bi ${
                        percentage >= 80 ? 'bi-award-fill' :
                        percentage >= 60 ? 'bi-award' : 'bi-bookmark'
                      } me-2`}></i>
                      {percentage >= 80 ? 'Fraud Expert! Outstanding financial security skills.' :
                       percentage >= 60 ? 'Fraud Analyst! Good detection instincts, keep improving.' :
                       'Fraud Trainee! Practice makes perfect - keep learning.'}
                    </div>

                    <div className="text-start">
                      <div className="small text-muted mb-2">Accounting Team Member</div>
                      <div className="h6 text-primary">Dynamic Biz Invoice Fraud Detection Certified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-3">
              <button 
                className="btn btn-primary btn-lg px-4"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Train Again
              </button>
              <button 
                className="btn btn-outline-secondary btn-lg px-4"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-house me-2"></i>
                Back to Games
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Main game interface
  return (
    <>
      <UserTopbar />
      <div className="container my-4">
        <div className="invoice-fraud-game">
          {/* Game header */}
          <div className="row align-items-center mb-4">
            <div className="col-md-4">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Menu
              </button>
            </div>
            
            <div className="col-md-4 text-center">
              <h4 className="mb-1">Level {currentLevel + 1}: {currentLevelData.title}</h4>
              <small className="text-muted">{currentLevelData.description}</small>
            </div>
            
            <div className="col-md-4 text-end">
              <div className="row g-2">
                <div className="col-12">
                  <div className="h5 mb-1 text-primary">
                    Score: {score}
                    {streak > 1 && <span className="badge bg-success ms-2">×{streak}</span>}
                  </div>
                </div>
                <div className="col-6">
                  <div className={`small ${timeLeft <= 20 ? 'text-danger fw-bold' : 'text-warning'}`}>
                    <i className="bi bi-clock me-1"></i>
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <div className="col-6">
                  <div className="small text-info">
                    Found: {foundFrauds.size}/{currentLevelData.frauds.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="alert alert-warning border-0 mb-4">
            <div className="d-flex align-items-start">
              <i className="bi bi-exclamation-triangle me-3 mt-1"></i>
              <div>
                <strong>Accounting Team Mission:</strong> Click on invoices that you identify as fraudulent. 
                Look for duplicate invoices, suspicious amounts, unverified vendors, and unusual banking details. 
                Find all {currentLevelData.frauds.length} fraudulent invoices to complete this level!
              </div>
            </div>
          </div>

          {/* Justification alert */}
          {showJustification && (
            <div className={`alert ${showJustification.isCorrect ? 'alert-success' : 'alert-danger'} mb-4`}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <i className={`bi ${showJustification.isCorrect ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                  <strong>{showJustification.message}</strong>
                </div>
                <button 
                  className="btn-close" 
                  onClick={() => setShowJustification(null)}
                  aria-label="Close"
                ></button>
              </div>
            </div>
          )}

          {/* Invoice list */}
          <div className="row g-3">
            {currentLevelData.invoices.map(invoice => (
              <div key={invoice.id} className="col-lg-6">
                <div 
                  className={`card invoice-card ${
                    clickedInvoices.has(invoice.id) ? 
                      (invoice.isFraud ? 'border-danger bg-danger-subtle' : 'border-success bg-success-subtle') 
                      : 'border-secondary'
                  } ${foundFrauds.has(invoice.id) ? 'found-fraud' : ''}`}
                  onClick={() => handleInvoiceClick(invoice.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Invoice:</strong> {invoice.invoiceNum}
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success">{invoice.amount}</div>
                      {foundFrauds.has(invoice.id) && (
                        <div className="badge bg-danger">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          FRAUD! +{invoice.points}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <strong>Vendor:</strong> {invoice.vendor}
                    </div>
                    <div className="mb-2">
                      <strong>Description:</strong> {invoice.description}
                    </div>
                    <div className="mb-2">
                      <strong>Banking:</strong> {invoice.bankDetails}
                    </div>
                    {clickedInvoices.has(invoice.id) && showHint && (
                      <div className="alert alert-info mt-3 mb-0">
                        <i className="bi bi-lightbulb me-2"></i>
                        {invoice.hint}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Game controls */}
          <div className="row mt-4">
            <div className="col-md-6">
              <button 
                className={`btn ${showHint ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setShowHint(!showHint)}
              >
                <i className="bi bi-lightbulb me-1"></i>
                {showHint ? 'Hide Hints' : 'Show Hints'}
              </button>
            </div>
            <div className="col-md-6 text-end">
              <div className="text-muted small">
                Wrong clicks: {wrongClicks} | Streak: {streak}
              </div>
            </div>
          </div>

          {/* CSS Styles */}
          <style jsx>{`
            .invoice-fraud-game {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .invoice-card {
              transition: all 0.3s ease;
              border-radius: 12px;
            }
            
            .invoice-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .found-fraud {
              animation: pulse 1s ease-in-out;
            }
            
            /* Gradient cards - light mode */
            .bg-gradient-primary {
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
              color: #1976d2 !important;
            }
            
            .bg-gradient-warning {
              background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%) !important;
              color: #f57c00 !important;
            }
            
            .bg-gradient-success {
              background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%) !important;
              color: #388e3c !important;
            }
            
            .bg-gradient-info {
              background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%) !important;
              color: #00796b !important;
            }
            
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
            
            /* Light mode - ensure proper contrast */
            .invoice-fraud-game .card {
              background: #ffffff !important;
              color: #212529 !important;
              border: 1px solid #dee2e6 !important;
            }
            
            .invoice-fraud-game .card-header {
              background: #f8f9fa !important;
              color: #495057 !important;
              border-bottom: 1px solid #dee2e6 !important;
            }
            
            .invoice-fraud-game .text-muted {
              color: #6c757d !important;
            }
            
            .invoice-fraud-game .text-dark {
              color: #212529 !important;
            }
            
            .invoice-fraud-game .text-secondary {
              color: #6c757d !important;
            }
            
            .invoice-fraud-game .alert-warning {
              background: linear-gradient(135deg, #fff3cd, #ffeaa7) !important;
              color: #856404 !important;
              border: 1px solid #ffeaa7 !important;
            }
            
            .invoice-fraud-game .alert-info {
              background: linear-gradient(135deg, #d1ecf1, #bee5eb) !important;
              color: #0c5460 !important;
              border: 1px solid #b6d4da !important;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              /* Gradient cards - dark mode */
              .bg-gradient-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
              }
              
              .bg-gradient-warning {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
                color: white !important;
              }
              
              .bg-gradient-success {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
                color: white !important;
              }
              
              .bg-gradient-info {
                background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important;
                color: white !important;
              }
              
              .invoice-fraud-game .card,
              .invoice-card {
                background: #1a202c !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
              
              .invoice-fraud-game .card-header {
                background: #2d3748 !important;
                color: #e2e8f0 !important;
                border-bottom: 1px solid #4a5568 !important;
              }
              
              .invoice-fraud-game .text-muted {
                color: #a0aec0 !important;
              }
              
              .invoice-fraud-game .text-dark {
                color: #e2e8f0 !important;
              }
              
              .invoice-fraud-game .text-secondary {
                color: #a0aec0 !important;
              }
              
              .invoice-fraud-game .alert-warning {
                background: linear-gradient(135deg, #744210, #92400e) !important;
                color: #fef3c7 !important;
                border: 1px solid #92400e !important;
              }
              
              .invoice-fraud-game .alert-info {
                background: linear-gradient(135deg, #2a4365, #2c5282) !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default InvoiceFraudDetectiveGame;
