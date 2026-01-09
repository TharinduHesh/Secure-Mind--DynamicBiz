import React, { useState, useEffect, useCallback } from 'react';
import UserTopbar from "../../components/UserTopbar";

const MarketingScamSpotterGame = ({ onComplete }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [foundThreats, setFoundThreats] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(75);
  const [showHint, setShowHint] = useState(false);
  const [clickedPosts, setClickedPosts] = useState(new Set());
  const [gameStarted, setGameStarted] = useState(false);
  const [levelTransition, setLevelTransition] = useState(false);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showJustification, setShowJustification] = useState(null);

  const levels = [
    {
      title: "Scam Email Recognition",
      description: "Find 3 scam emails targeting marketing professionals",
      language: "Email",
      timeLimit: 75,
      posts: [
        { 
          id: 1, 
          platform: "Email", 
          author: "winner.notification@intl-lottery.com", 
          subject: "🎉 CONGRATULATIONS! YOU'VE WON €2,500,000!",
          content: "Dear Lucky Winner! You have been selected in our INTERNATIONAL LOTTERY PROGRAM! Your reference number: WIN/2024/789. To claim your €2.5 MILLION prize, send your personal details and bank information immediately. This offer expires in 24 hours! Contact: claim.agent.johnson@gmail.com",
          engagement: "Marked as spam by 1,247 users",
          isThreat: true, 
          points: 100, 
          hint: "Classic lottery scam - you can't win a lottery you never entered",
          correctJustification: "✅ CORRECT: This is a classic lottery scam. Red flags include: unsolicited lottery win, urgency tactics ('expires in 24 hours'), requesting personal/bank details, unprofessional sender domain, and contact via personal email.",
          wrongJustification: "❌ INCORRECT: This is definitely a scam. Legitimate lotteries don't contact winners via random emails or use personal Gmail addresses for claims processing."
        },
        { 
          id: 2, 
          platform: "Email", 
          author: "campaigns@dynamicbiz.com", 
          subject: "Monthly Marketing Newsletter - December 2024",
          content: "Hi Team! Here's our monthly marketing performance summary: Campaign conversions up 15%, social media engagement increased 23%, and Q4 goals are on track. Great work everyone! Best regards, Marketing Team",
          engagement: "Internal company email",
          isThreat: false, 
          points: 50, 
          hint: "This is legitimate internal company communication",
          correctJustification: "✅ CORRECT: This is legitimate internal communication. It comes from a verified company domain, contains normal business updates, uses professional language, and doesn't request sensitive information.",
          wrongJustification: "❌ INCORRECT: This is a legitimate internal email from your company's marketing team sharing performance updates - completely normal business communication."
        },
        { 
          id: 3, 
          platform: "Email", 
          author: "urgent.ceo.request@gmail.com", 
          subject: "URGENT: Confidential Task - CEO Request",
          content: "Hello, I'm currently in a board meeting and need you to handle an urgent wire transfer. Purchase $5,000 worth of iTunes gift cards and send me the codes immediately. This is confidential - do not discuss with anyone. Time sensitive! -CEO Michael Thompson", 
          engagement: "Flagged as suspicious",
          isThreat: true, 
          points: 120, 
          hint: "CEO impersonation scam - CEOs don't request gift card purchases via email",
          correctJustification: "✅ CORRECT: This is a CEO impersonation scam (Business Email Compromise). Red flags: personal Gmail address, gift card requests, urgency, secrecy demands, and CEOs don't conduct business via personal email.",
          wrongJustification: "❌ INCORRECT: This is a classic CEO fraud scam. Real executives don't use personal Gmail accounts for business or request employees to buy gift cards."
        },
        { 
          id: 4, 
          platform: "Email", 
          author: "partnerships@socialmedia-agency.com", 
          subject: "Partnership Opportunity - Influencer Campaign",
          content: "Hello Dynamic Biz Marketing Team, We specialize in B2B influencer campaigns and would like to discuss a potential partnership for your Q1 campaigns. We've helped similar companies increase brand awareness by 40%. Could we schedule a brief call? Best regards, Sarah Chen, Business Development",
          engagement: "Business inquiry",
          isThreat: false, 
          points: 50, 
          hint: "This appears to be a legitimate business partnership inquiry",
          correctJustification: "✅ CORRECT: This is a legitimate business inquiry. It comes from a professional domain, uses appropriate business language, offers specific services relevant to marketing, and doesn't ask for sensitive information.",
          wrongJustification: "❌ INCORRECT: This appears to be a legitimate business partnership proposal from a professional marketing agency - nothing suspicious about standard B2B outreach."
        },
        { 
          id: 5, 
          platform: "Email", 
          author: "prize.department@amazon-winner.net", 
          subject: "Amazon Prime MEGA Winner! $10,000 Shopping Spree!",
          content: "CONGRATULATIONS! You've been randomly selected as our Amazon Prime MEGA Winner! You've won a $10,000 shopping spree! To claim your prize, click here and enter your Amazon login and credit card details for verification. Hurry - this exclusive offer expires tonight! CLAIM NOW: bit.ly/amazon-mega-prize", 
          engagement: "Reported as phishing by 892 users",
          isThreat: true, 
          points: 110, 
          hint: "Fake Amazon prize scam - Amazon doesn't conduct random prize drawings via email",
          correctJustification: "✅ CORRECT: This is a phishing scam impersonating Amazon. Red flags: fake domain (amazon-winner.net), unsolicited prize, requests for login credentials, shortened suspicious links, and artificial urgency.",
          wrongJustification: "❌ INCORRECT: This is definitely a phishing scam. Amazon doesn't conduct random prize drawings or ask for login credentials via email links."
        },
        { 
          id: 6, 
          platform: "Email", 
          author: "support@dynamicbiz.com", 
          subject: "System Maintenance Scheduled - Weekend Downtime",
          content: "Dear Team, Our IT systems will undergo scheduled maintenance this Saturday from 2 AM to 6 AM EST. Email and internal systems may be temporarily unavailable. Please plan accordingly. For urgent issues, contact the on-call support team. Thanks, IT Support Team",
          engagement: "Official company announcement",
          isThreat: false, 
          points: 50, 
          hint: "This is standard IT maintenance communication from your company",
          correctJustification: "✅ CORRECT: This is legitimate IT communication. It comes from the official company domain, provides reasonable maintenance information, uses professional language, and offers alternative support options.",
          wrongJustification: "❌ INCORRECT: This is a standard, legitimate IT maintenance notification from your own company - completely normal business communication."
        }
      ],
      threats: [1, 3, 5]
    },
    {
      title: "Advanced Marketing Scam Detection",
      description: "Find 2 sophisticated scams targeting marketing professionals",
      language: "Email",
      timeLimit: 90,
      posts: [
        { 
          id: 7, 
          platform: "Email", 
          author: "marketing.awards@global-excellence.org", 
          subject: "🏆 WINNER: Digital Marketing Excellence Award 2024!",
          content: "Congratulations! Dynamic Biz has been selected as the winner of our prestigious Digital Marketing Excellence Award 2024! Your company has won $25,000 prize money. To claim your award and prize, please pay the $500 processing fee via Bitcoin to wallet: 1A2B3C4D... Full payment must be received within 48 hours. Awards ceremony details will be sent after payment confirmation.",
          engagement: "Reported as fraudulent by 445 recipients",
          isThreat: true, 
          points: 150, 
          hint: "Legitimate awards don't require upfront fees to claim prizes",
          correctJustification: "✅ CORRECT: This is a classic advance fee scam (419 scam) targeting businesses. Red flags: unsolicited award, upfront payment required, Bitcoin payment method, artificial urgency, and legitimate awards never require fees to claim prizes.",
          wrongJustification: "❌ INCORRECT: This is definitely a scam. Real awards organizations never require winners to pay fees upfront, especially not in Bitcoin."
        },
        { 
          id: 8, 
          platform: "Email", 
          author: "team@dynamicbiz.com", 
          subject: "Team Building Event - December 15th",
          content: "Hi everyone! We're organizing a team building event at Riverside Park on December 15th. Activities include mini-golf and BBQ lunch. Please confirm your attendance by replying to this email. Looking forward to seeing everyone there! Thanks, HR Team",
          engagement: "Internal team communication",
          isThreat: false, 
          points: 60, 
          hint: "This is normal internal HR communication about team events",
          correctJustification: "✅ CORRECT: This is legitimate internal communication from HR. It comes from the official company domain, discusses normal workplace activities, uses appropriate professional tone, and doesn't request sensitive information.",
          wrongJustification: "❌ INCORRECT: This is a normal HR email about a company team building event - completely legitimate internal communication."
        },
        { 
          id: 9, 
          platform: "Email", 
          author: "finance.recovery@tax-refund-usa.com", 
          subject: "URGENT: Unclaimed Business Tax Refund - $45,000 Available",
          content: "FINAL NOTICE: Our records show Dynamic Biz has an unclaimed business tax refund of $45,000 from 2023. This refund expires in 72 hours! To process your refund immediately, we need: 1) Business EIN number 2) Bank routing & account numbers 3) Copy of last tax return. Reply with required documents to secure your refund. Department of Revenue - Tax Recovery Division",
          engagement: "Mass distribution - 50,000+ recipients",
          isThreat: true, 
          points: 140, 
          hint: "Government agencies don't email about unclaimed refunds or ask for sensitive info via email",
          correctJustification: "✅ CORRECT: This is a government impersonation scam attempting to steal business financial information. Red flags: fake government agency, unsolicited refund claim, urgent deadline, requests for EIN and banking details via email.",
          wrongJustification: "❌ INCORRECT: This is a dangerous scam impersonating government agencies. Real tax authorities never email about unclaimed refunds or request sensitive financial information via email."
        },
        { 
          id: 10, 
          platform: "Email", 
          author: "analytics@marketingtools.com", 
          subject: "Your Marketing Analytics Report - Monthly Summary",
          content: "Hello Dynamic Biz Marketing Team, Your monthly analytics report is ready for review. This month's highlights: Website traffic increased 12%, email open rates improved to 24.5%, social media engagement up 8%. Detailed report attached. Best regards, Analytics Team",
          engagement: "Legitimate service provider",
          isThreat: false, 
          points: 60, 
          hint: "This appears to be a legitimate report from a marketing service provider",
          correctJustification: "✅ CORRECT: This is legitimate communication from a professional marketing analytics service. It uses appropriate business language, provides realistic data, comes from a professional domain, and offers standard reporting services.",
          wrongJustification: "❌ INCORRECT: This appears to be a legitimate monthly report from a marketing analytics service provider - standard business communication."
        }
      ],
      threats: [7, 9]
    },
    {
      title: "Identity Theft & Impersonation",
      description: "Handle fake identity and impersonation scam attempts",
      language: "Email",
      timeLimit: 100,
      posts: [
        { 
          id: 11, 
          platform: "Email", 
          author: "microsoft.security@outlook-security.net", 
          subject: "Security Alert: Your Microsoft Account Has Been Compromised",
          content: "URGENT SECURITY ALERT: We have detected suspicious activity on your Microsoft account linked to your business email. Your account will be permanently suspended unless you verify your identity immediately. Click here to secure your account: http://microsoft-account-verification.com/urgent Please provide your current password and business information to prevent account closure. Microsoft Security Team",
          engagement: "Blocked by security filters",
          isThreat: true, 
          points: 140, 
          hint: "Microsoft doesn't send urgent security emails asking for passwords via suspicious links",
          correctJustification: "✅ CORRECT: This is a Microsoft impersonation phishing scam. Red flags: fake domain (outlook-security.net), urgent language, suspicious verification link, requesting passwords, and Microsoft never asks for passwords via email.",
          wrongJustification: "❌ INCORRECT: This is definitely a phishing scam impersonating Microsoft. Legitimate Microsoft communications don't use fake domains or ask for passwords."
        },
        { 
          id: 12, 
          platform: "Email", 
          author: "notifications@dynamicbiz.com", 
          subject: "Password Change Confirmation",
          content: "Hello, This email confirms that your Dynamic Biz account password was successfully changed on December 10, 2024 at 3:45 PM EST. If you did not make this change, please contact IT support immediately at support@dynamicbiz.com or call (555) 123-4567. IT Security Team",
          engagement: "Official security notification",
          isThreat: false, 
          points: 70, 
          hint: "This is a legitimate security notification from your company's IT department",
          correctJustification: "✅ CORRECT: This is legitimate security communication from your company's IT department. It comes from the official domain, provides specific details, offers proper contact information, and follows standard security protocols.",
          wrongJustification: "❌ INCORRECT: This is a standard, legitimate security notification from your own company's IT department about a password change."
        },
        { 
          id: 13, 
          platform: "Email", 
          author: "customer.service@paypal-resolution.com", 
          subject: "PayPal Account Limitation - Immediate Action Required",
          content: "Dear PayPal User, Your account has been temporarily limited due to unusual activity. To restore full access, you must verify your account within 24 hours by clicking the link below and providing: • Full name and address • Credit card details • Bank account information • Social security number Link: paypal-account-restore.com/verify Failure to complete verification will result in permanent account closure. PayPal Customer Service",
          engagement: "Flagged as phishing by 2,100 users",
          isThreat: true, 
          points: 160, 
          hint: "PayPal doesn't use third-party domains or ask for SSN via email links",
          correctJustification: "✅ CORRECT: This is a PayPal impersonation phishing scam. Red flags: fake domain (paypal-resolution.com), requests for sensitive information including SSN, suspicious verification link, and artificial urgency tactics.",
          wrongJustification: "❌ INCORRECT: This is a dangerous phishing scam. Real PayPal never uses third-party domains or requests social security numbers via email."
        },
        { 
          id: 14, 
          platform: "Email", 
          author: "billing@dynamicbiz.com", 
          subject: "Monthly Software License Renewal Notice",
          content: "Dear Dynamic Biz Team, This is a reminder that your monthly software license renewal is due on December 31, 2024. Total amount: $2,450.00. Payment will be automatically charged to the card ending in 4567. If you need to update payment information, please log into your account portal at billing.dynamicbiz.com. Thank you, Billing Department",
          engagement: "Routine billing communication",
          isThreat: false, 
          points: 70, 
          hint: "This is standard billing communication from your company's billing department",
          correctJustification: "✅ CORRECT: This is legitimate billing communication. It comes from the official company domain, provides reasonable billing information, uses proper company portal links, and follows normal business procedures.",
          wrongJustification: "❌ INCORRECT: This is a legitimate billing reminder from your own company - standard business communication about software license renewal."
        },
        { 
          id: 15, 
          platform: "Email", 
          author: "netflix.billing@secure-netflix.org", 
          subject: "Netflix Payment Failed - Update Billing Info",
          content: "Hi there! Your Netflix payment couldn't be processed and your account will be suspended in 2 days. Update your payment information now to continue enjoying Netflix! Click here to update: netflix-billing-update.com We need your: - Credit card number - Expiration date - CVV code - Billing address Don't lose access to your favorite shows! Netflix Billing Team",
          engagement: "Mass phishing campaign - reported 15,000+ times",
          isThreat: true, 
          points: 180, 
          hint: "Netflix doesn't use third-party domains or ask for full credit card details via email",
          correctJustification: "✅ CORRECT: This is a Netflix impersonation phishing scam. Red flags: fake domain (secure-netflix.org), informal language ('Hi there!'), suspicious payment link, requesting complete credit card details via email.",
          wrongJustification: "❌ INCORRECT: This is a classic Netflix phishing scam. Real Netflix uses official domains and doesn't request full credit card information via email links."
        }
      ],
      threats: [11, 13, 15]
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
              setFoundThreats(new Set());
              setClickedPosts(new Set());
              setTimeLeft(levels[currentLevel + 1].timeLimit);
              setLevelTransition(false);
            }, 1000);
          } else {
            setGameOver(true);
            onComplete('marketingscamspotter', score, getTotalPossibleScore());
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft, currentLevel, levelTransition, onComplete, score]);

  const handlePostClick = (postId) => {
    const post = currentLevelData.posts.find(p => p.id === postId);
    const newClickedPosts = new Set(clickedPosts);
    newClickedPosts.add(postId);
    setClickedPosts(newClickedPosts);

    // Show justification for the click
    if (post.isThreat) {
      setShowJustification({ postId, message: post.correctJustification, isCorrect: true });
    } else {
      setShowJustification({ postId, message: post.wrongJustification, isCorrect: false });
    }

    // Auto-hide justification after 5 seconds
    setTimeout(() => {
      setShowJustification(null);
    }, 5000);

    if (post.isThreat && !foundThreats.has(postId)) {
      const newFoundThreats = new Set(foundThreats);
      newFoundThreats.add(postId);
      setFoundThreats(newFoundThreats);
      setScore(score + post.points);
      setStreak(streak + 1);
      
      if (newFoundThreats.size === currentLevelData.threats.length) {
        setTimeout(() => {
          if (currentLevel < levels.length - 1) {
            setShowLevelComplete(true);
            setTimeout(() => {
              setShowLevelComplete(false);
              setLevelTransition(true);
              setTimeout(() => {
                setCurrentLevel(currentLevel + 1);
                setFoundThreats(new Set());
                setClickedPosts(new Set());
                setTimeLeft(levels[currentLevel + 1].timeLimit);
                setLevelTransition(false);
              }, 1000);
            }, 2000);
          } else {
            setGameOver(true);
            onComplete('marketingscamspotter', score + post.points, getTotalPossibleScore());
          }
        }, 500);
      }
    } else if (!post.isThreat) {
      setWrongClicks(wrongClicks + 1);
      setStreak(0);
    }
  };

  const getTotalPossibleScore = () => {
    return levels.reduce((total, level) => {
      return total + level.posts.filter(p => p.isThreat).reduce((sum, p) => sum + p.points, 0);
    }, 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'LinkedIn': return 'bi-linkedin';
      case 'Twitter': return 'bi-twitter';
      case 'Instagram': return 'bi-instagram';
      case 'Facebook': return 'bi-facebook';
      default: return 'bi-chat-square-text';
    }
  };

  const getPlatformColor = (platform) => {
    switch(platform) {
      case 'LinkedIn': return 'text-primary';
      case 'Twitter': return 'text-info';
      case 'Instagram': return 'text-danger';
      case 'Facebook': return 'text-primary';
      default: return 'text-secondary';
    }
  };

  // Start screen
  if (!gameStarted) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4">
          <div className="social-media-defender-game">
            <div className="text-center">
            <div className="mb-4">
              <h2 className="display-6 fw-bold text-primary mb-3">
                🛡️ Marketing Scam Spotter
              </h2>
              <p className="lead mb-4 text-muted">
                Dynamic Biz Marketing Team Training<br/>
                Protect yourself and the company by identifying scam emails targeting marketing professionals.
              </p>
            </div>              <div className="row g-4 mb-5">
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-primary">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-layers display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.length}</div>
                      <div className="small opacity-75">Training Levels</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-warning">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-envelope-exclamation display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.reduce((sum, level) => sum + level.threats.length, 0)}</div>
                      <div className="small opacity-75">Scam Emails to Find</div>
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
                <i className="bi bi-shield-check me-2"></i>
                Start Scam Detection Training
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
              <i className="bi bi-shield-fill-check text-success display-1"></i>
            </div>
            <h2 className="text-success mb-3">Level Complete!</h2>
            <p className="lead">Excellent scam detection on {currentLevelData.title}</p>
            {currentLevel < levels.length - 1 && (
              <p className="text-muted">Loading next marketing scam detection challenge...</p>
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
            <h4>Loading Next Scam Detection Challenge...</h4>
            <p className="text-muted">Prepare for more sophisticated scam attempts!</p>
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
                percentage >= 80 ? 'bi-shield-fill-check text-success' :
                percentage >= 60 ? 'bi-shield-check text-warning' : 'bi-shield text-info'
              } display-1`}></i>
            </div>
            
            <h2 className="mb-4">Marketing Scam Detection Complete!</h2>
            
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
                        percentage >= 80 ? 'bi-shield-fill-check' :
                        percentage >= 60 ? 'bi-shield-check' : 'bi-shield'
                      } me-2`}></i>
                      {percentage >= 80 ? 'Scam Detection Expert! Outstanding threat identification skills.' :
                       percentage >= 60 ? 'Scam Detection Guardian! Good instincts, keep improving.' :
                       'Scam Detection Trainee! Practice makes perfect - keep learning.'}
                    </div>

                    <div className="text-start">
                      <div className="small text-muted mb-2">Marketing Team Member</div>
                      <div className="h6 text-primary">Dynamic Biz Scam Detection Certified</div>
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
        <div className="social-media-defender-game">
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
                  <div className={`small ${timeLeft <= 15 ? 'text-danger fw-bold' : 'text-warning'}`}>
                    <i className="bi bi-clock me-1"></i>
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <div className="col-6">
                  <div className="small text-info">
                    Found: {foundThreats.size}/{currentLevelData.threats.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="alert alert-info border-0 mb-4">
            <div className="d-flex align-items-start">
              <i className="bi bi-info-circle me-3 mt-1"></i>
              <div>
                <strong>Marketing Team Mission:</strong> Click on emails that could be scams, phishing attempts, or fraudulent messages targeting marketing professionals. 
                Look for fake lottery wins, CEO impersonation, advance fee scams, and suspicious business offers. 
                Find all {currentLevelData.threats.length} threats to complete this level!
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

          {/* Email messages */}
          <div className="row g-3">
            {currentLevelData.posts.map(post => (
              <div key={post.id} className="col-lg-6">
                <div 
                  className={`card email-message ${
                    clickedPosts.has(post.id) ? 
                      (post.isThreat ? 'border-danger bg-danger-subtle' : 'border-success bg-success-subtle') 
                      : 'border-secondary'
                  } ${foundThreats.has(post.id) ? 'found-threat' : ''}`}
                  onClick={() => handlePostClick(post.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-envelope-fill text-primary me-2"></i>
                      <div>
                        <strong>From:</strong> {post.author}
                        <div className="small text-muted">Subject: {post.subject}</div>
                      </div>
                    </div>
                    {foundThreats.has(post.id) && (
                      <div className="badge bg-danger">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        SCAM! +{post.points}
                      </div>
                    )}
                    {clickedPosts.has(post.id) && !post.isThreat && (
                      <div className="badge bg-success">
                        <i className="bi bi-check-circle me-1"></i>
                        Safe Email
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <p className="mb-2">{post.content}</p>
                    <div className="small text-muted mb-2">
                      <i className="bi bi-info-circle me-1"></i>
                      {post.engagement}
                    </div>
                    {clickedPosts.has(post.id) && showHint && (
                      <div className="alert alert-info mt-3 mb-0">
                        <i className="bi bi-lightbulb me-2"></i>
                        {post.hint}
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
            .social-media-defender-game {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            /* Ensure stat cards are visible in light mode */
            .social-media-defender-game .card.bg-gradient-primary,
            .social-media-defender-game .card.bg-gradient-warning,
            .social-media-defender-game .card.bg-gradient-success,
            .social-media-defender-game .card.bg-gradient-info {
              color: #fff !important;
              border: 0 !important;
              background-color: transparent !important; /* override Bootstrap card bg */
            }

            .email-message {
              transition: all 0.3s ease;
              border-radius: 12px;
            }
            
            .email-message:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .found-threat {
              background-repeat: no-repeat !important;
            }
            
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
            
            /* Light mode - ensure proper contrast */
            .social-media-game .card,
            .email-message {
              background: #ffffff !important;
              color: #212529 !important;
              border: 1px solid #dee2e6 !important;
            }
            
            .social-media-game .card-header {
              background: #f8f9fa !important;
              color: #495057 !important;
              border-bottom: 1px solid #dee2e6 !important;
            }
            
            .social-media-game .text-muted {
              color: #6c757d !important;
            }
            
            .social-media-game .text-dark {
              color: #212529 !important;
            }
            
            .social-media-game .text-secondary {
              color: #6c757d !important;
            }
            
            .social-media-game .alert-info {
              background: linear-gradient(135deg, #d1ecf1, #bee5eb) !important;
              color: #0c5460 !important;
              border: 1px solid #b6d4da !important;
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
              
              .social-media-game .card,
              .email-message {
                background: #1a202c !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
              
              .social-media-game .card-header {
                background: #2d3748 !important;
                color: #e2e8f0 !important;
                border-bottom: 1px solid #4a5568 !important;
              }
              
              .social-media-game .text-muted {
                color: #a0aec0 !important;
              }
              
              .social-media-game .text-dark {
                color: #e2e8f0 !important;
              }
              
              .social-media-game .text-secondary {
                color: #a0aec0 !important;
              }
              
              .social-media-game .alert-info {
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

export default MarketingScamSpotterGame;
