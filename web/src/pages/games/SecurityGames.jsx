import React, { useState, useEffect, useCallback } from 'react';
import UserTopbar from "../../components/UserTopbar";

const PhishingSpotterGame = ({ onComplete }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [foundThreats, setFoundThreats] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showHint, setShowHint] = useState(false);
  const [clickedEmails, setClickedEmails] = useState(new Set());
  const [gameStarted, setGameStarted] = useState(false);
  const [levelTransition, setLevelTransition] = useState(false);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const levels = [
    {
      title: "Email Security Analysis",
      description: "Find 3 phishing attempts in these security emails",
      language: "Email",
      timeLimit: 60,
      emails: [
        { 
          id: 1, 
          from: "security@bank-urgent.com", 
          subject: "URGENT: Verify Account", 
          body: "Your account will be suspended! Click: http://verify-now.com/urgent", 
          isPhishing: true, 
          points: 100, 
          hint: "Check the domain - is it really from your bank?" 
        },
        { 
          id: 2, 
          from: "hr@dynamicbiz.com", 
          subject: "Team Meeting", 
          body: "Hi team, meeting at 2 PM today in conference room B.", 
          isPhishing: false, 
          points: 50, 
          hint: "This looks like normal internal communication" 
        },
        { 
          id: 3, 
          from: "ceo@dynamicbiz.com", 
          subject: "Wire Transfer Needed", 
          body: "I need you to wire $50,000 urgently. Details attached.", 
          isPhishing: true, 
          points: 120, 
          hint: "CEOs don't usually request wire transfers via email" 
        },
        { 
          id: 4, 
          from: "winner@lottery.com", 
          subject: "You Won $1M!", 
          body: "Congratulations! Claim your prize now!", 
          isPhishing: true, 
          points: 90, 
          hint: "Too good to be true offers are usually scams" 
        }
      ],
      threats: [1, 3, 4]
    },
    {
      title: "Advanced Threat Detection",
      description: "Find 2 sophisticated phishing attempts",
      language: "Email",
      timeLimit: 90,
      emails: [
        { 
          id: 5, 
          from: "security-alert@microsoft.com", 
          subject: "Security Alert: Unusual Activity", 
          body: "We detected unusual sign-in activity. Secure your account: https://account.microsoft.com.security-check.net/verify", 
          isPhishing: true, 
          points: 150, 
          hint: "Look carefully at the full URL - is it really Microsoft?" 
        },
        { 
          id: 6, 
          from: "it@dynamicbiz.com", 
          subject: "System Maintenance Notice", 
          body: "Scheduled maintenance tonight 11PM-1AM EST. Systems may be unavailable.", 
          isPhishing: false, 
          points: 50, 
          hint: "This appears to be legitimate IT communication" 
        },
        { 
          id: 7, 
          from: "vendor@securitytools.com", 
          subject: "Critical Security Patch", 
          body: "Critical vulnerability discovered. Download patch: [attachment: security_patch.exe]", 
          isPhishing: true, 
          points: 130, 
          hint: "Legitimate vendors don't send patches as email attachments" 
        }
      ],
      threats: [5, 7]
    },
    {
      title: "Business Email Compromise (BEC)",
      description: "Detect sophisticated CEO fraud and executive impersonation attacks",
      language: "Email",
      timeLimit: 120,
      emails: [
        { 
          id: 8, 
          from: "ceo@dynamicbiz.com", 
          subject: "Confidential Acquisition - Urgent Wire Transfer", 
          body: "I'm in confidential negotiations to acquire TechStart Inc. Need you to wire $2.5M to escrow account immediately. Details: Bank of Switzerland, Account: CH9300762011623852957. Keep this strictly confidential until announcement.", 
          isPhishing: true, 
          points: 180, 
          hint: "Even emails from CEO addresses can be spoofed. Large wire transfers should always be verified through multiple channels" 
        },
        { 
          id: 9, 
          from: "legal@dynamicbiz.com", 
          subject: "Quarterly Legal Review Meeting", 
          body: "Hi Security Team, please join us for the quarterly legal and compliance review meeting on Friday at 2 PM in Conference Room A. Agenda attached.", 
          isPhishing: false, 
          points: 60, 
          hint: "This appears to be legitimate internal communication from the legal department" 
        },
        { 
          id: 10, 
          from: "cfo@dynamicbiz.com", 
          subject: "Re: Budget Approval for Q4 Security Tools", 
          body: "Your security tool budget request is approved. However, I need you to purchase through our new preferred vendor: SecureTools-Pro.net. Use company credit card ending in 4829. Login with your AD credentials to place order.", 
          isPhishing: true, 
          points: 170, 
          hint: "Requests to use unfamiliar vendors and enter AD credentials on external sites are major red flags" 
        },
        { 
          id: 11, 
          from: "board-secretary@dynamicbiz.com", 
          subject: "Emergency Board Resolution - Electronic Signature Required", 
          body: "The board needs your electronic signature on an emergency resolution regarding the security incident response plan. Please sign electronically here: secure-board-docs.com/sign. Time sensitive - needed within 2 hours.", 
          isPhishing: true, 
          points: 160, 
          hint: "Urgent requests for electronic signatures on external sites, especially for sensitive documents, are suspicious" 
        }
      ],
      threats: [8, 10, 11]
    },
    {
      title: "Advanced Persistent Threats (APT)",
      description: "Identify nation-state and sophisticated criminal group tactics",
      language: "Email",
      timeLimit: 150,
      emails: [
        { 
          id: 12, 
          from: "security-update@microsoft-security.com", 
          subject: "Critical Zero-Day Patch - Immediate Installation Required", 
          body: "Microsoft Security Response Center has identified a critical zero-day vulnerability affecting all Windows systems. Download and install emergency patch immediately: https://microsoft-security.com.update-center.org/patch-kb5029924.exe", 
          isPhishing: true, 
          points: 200, 
          hint: "Look carefully at the domain - it's not the real Microsoft domain. APT groups often use similar-looking domains" 
        },
        { 
          id: 13, 
          from: "threat-intel@dynamicbiz.com", 
          subject: "Weekly Threat Intelligence Briefing", 
          body: "This week's threat landscape update: Increased APT activity targeting software companies. New phishing campaigns using COVID-19 themes. Recommend increased vigilance.", 
          isPhishing: false, 
          points: 70, 
          hint: "Internal threat intelligence briefings are legitimate security communications" 
        },
        { 
          id: 14, 
          from: "research@cybersecurity-institute.org", 
          subject: "Invitation: Exclusive APT Research Collaboration", 
          body: "We're conducting classified research on APT groups targeting your industry. As a security professional, you're invited to participate. Please download our secure research portal: apt-research-secure.org/portal.exe and enter your company's security details for verification.", 
          isPhishing: true, 
          points: 190, 
          hint: "Requests to download executables and share company security details, even for 'research', are highly suspicious" 
        },
        { 
          id: 15, 
          from: "nist@nist.gov", 
          subject: "NIST Cybersecurity Framework Update", 
          body: "The National Institute of Standards and Technology has released an updated Cybersecurity Framework. Download the official document from our secure portal: nist-framework-update.gov.secure.com/download", 
          isPhishing: true, 
          points: 180, 
          hint: "Government impersonation with suspicious domains is a common APT tactic. Real NIST communications come from nist.gov" 
        }
      ],
      threats: [12, 14, 15]
    },
    {
      title: "Supply Chain & Third-Party Threats",
      description: "Detect attacks targeting vendor relationships and software supply chains",
      language: "Email",
      timeLimit: 180,
      emails: [
        { 
          id: 16, 
          from: "security@cloudprovider-aws.com", 
          subject: "Urgent: Account Compromise Detected", 
          body: "We've detected suspicious activity on your AWS account. Your account will be suspended in 24 hours unless you verify your identity. Click here to secure your account: aws-security-verification.com/urgent-verify", 
          isPhishing: true, 
          points: 210, 
          hint: "Cloud provider impersonation is common. Real AWS emails come from amazon.com or amazonaws.com domains" 
        },
        { 
          id: 17, 
          from: "vendor-management@dynamicbiz.com", 
          subject: "Q4 Vendor Security Assessment Schedule", 
          body: "Please review the attached Q4 vendor security assessment schedule. We'll be conducting security reviews of all critical vendors including CloudProvider, SecurityTools Inc, and DataBackup Solutions.", 
          isPhishing: false, 
          points: 80, 
          hint: "Internal vendor management communications about security assessments are legitimate business processes" 
        },
        { 
          id: 18, 
          from: "support@securitytools-inc.com", 
          subject: "Critical Security Update - SolarWinds-Style Backdoor Discovered", 
          body: "URGENT: We've discovered a SolarWinds-style backdoor in our security monitoring software. Download the emergency patch immediately: securitytools-emergency-patch.com/download. This affects all customers and must be installed within 6 hours to prevent compromise.", 
          isPhishing: true, 
          points: 220, 
          hint: "References to major incidents like SolarWinds are used to create urgency. Verify through official vendor channels" 
        },
        { 
          id: 19, 
          from: "compliance@github.com", 
          subject: "Repository Security Scan Results", 
          body: "Our automated security scan has identified potential vulnerabilities in your private repositories. View detailed report and remediation steps: github-security-scan.com/report/dynamicbiz. Immediate action required to maintain compliance.", 
          isPhishing: true, 
          points: 200, 
          hint: "GitHub security notifications come from github.com domains, not third-party sites. Always verify through the official platform" 
        },
        { 
          id: 20, 
          from: "security@databackup-solutions.com", 
          subject: "Backup Verification Test - Monthly Security Check", 
          body: "This is our monthly backup verification test. Please confirm that your backup systems are operational by replying to this email. No action required from your end - this is just our standard security verification process.", 
          isPhishing: false, 
          points: 80, 
          hint: "Legitimate vendors often conduct routine security verification checks through established communication channels" 
        }
      ],
      threats: [16, 18, 19]
    },
    {
      title: "Master-Level Security Operations",
      description: "Handle the most sophisticated and targeted security threats",
      language: "Email",
      timeLimit: 200,
      emails: [
        { 
          id: 21, 
          from: "incident-response@fbi.gov", 
          subject: "Classified: National Security Investigation - Immediate Response Required", 
          body: "This is Agent Sarah Johnson from the FBI Cyber Division. We're investigating a national security threat involving your company. You are required to provide immediate access to your security logs. Download our secure evidence collection tool: fbi-cyber-secure.gov.evidence-portal.com/collect", 
          isPhishing: true, 
          points: 250, 
          hint: "Government impersonation for evidence collection. Real FBI communications go through official legal channels, not email downloads" 
        },
        { 
          id: 22, 
          from: "ciso@dynamicbiz.com", 
          subject: "Red Team Exercise - Week 3 Results", 
          body: "Great work on the ongoing red team exercise. The external team has identified several areas for improvement. Full debrief scheduled for Friday. Keep up the excellent defensive work!", 
          isPhishing: false, 
          points: 90, 
          hint: "Internal communications about security exercises and red team activities are part of normal security operations" 
        },
        { 
          id: 23, 
          from: "whistleblower@protonmail.com", 
          subject: "CONFIDENTIAL: Security Breach Cover-up Evidence", 
          body: "I'm a former employee with evidence of a major security breach cover-up at Dynamic Biz. The executives are hiding a ransomware attack that compromised customer data. I have internal documents and communications as proof. Meet me at secure-whistleblower-portal.onion.com to receive the evidence.", 
          isPhishing: true, 
          points: 240, 
          hint: "Fake whistleblower attempts often try to damage reputation and trick employees into visiting malicious sites" 
        },
        { 
          id: 24, 
          from: "threat-actor@protonmail.com", 
          subject: "We Have Your Data - Negotiation Required", 
          body: "We have successfully infiltrated your network and exfiltrated sensitive customer data and source code. We are professional cybercriminals, not destructive. Pay 50 Bitcoin to prevent public release. Negotiation portal: dark-negotiation-portal.onion.com/dynamicbiz", 
          isPhishing: true, 
          points: 230, 
          hint: "Direct extortion attempts should be immediately reported to law enforcement and incident response teams" 
        },
        { 
          id: 25, 
          from: "security-researcher@university.edu", 
          subject: "Responsible Disclosure: Critical Vulnerability Found", 
          body: "I'm a security researcher at State University. I've discovered a critical vulnerability in your web application that could lead to data exposure. I'm following responsible disclosure practices. Please provide a security contact for coordinated disclosure. Technical details available upon verification.", 
          isPhishing: false, 
          points: 90, 
          hint: "Legitimate security researchers follow responsible disclosure practices and don't demand immediate payment or access" 
        },
        { 
          id: 26, 
          from: "insider-threat@protonmail.com", 
          subject: "Your Colleague is Selling Company Secrets", 
          body: "I have evidence that John Smith from your security team is selling company secrets to competitors. I have screenshots of his communications and bank transfers. I can provide this evidence for $10,000 Bitcoin payment. Contact me at insider-evidence-portal.onion.com", 
          isPhishing: true, 
          points: 220, 
          hint: "Attempts to create internal distrust and paranoia are psychological warfare tactics used by threat actors" 
        }
      ],
      threats: [21, 23, 24, 26]
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
              setClickedEmails(new Set());
              setTimeLeft(levels[currentLevel + 1].timeLimit);
              setLevelTransition(false);
            }, 1000);
          } else {
            setGameOver(true);
            onComplete('phishingspotter', score, getTotalPossibleScore());
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft, currentLevel, levelTransition, onComplete, score]);

  const handleEmailClick = (emailId) => {
    const email = currentLevelData.emails.find(e => e.id === emailId);
    const newClickedEmails = new Set(clickedEmails);
    newClickedEmails.add(emailId);
    setClickedEmails(newClickedEmails);

    if (email.isPhishing && !foundThreats.has(emailId)) {
      const newFoundThreats = new Set(foundThreats);
      newFoundThreats.add(emailId);
      setFoundThreats(newFoundThreats);
      setScore(score + email.points);
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
                setClickedEmails(new Set());
                setTimeLeft(levels[currentLevel + 1].timeLimit);
                setLevelTransition(false);
              }, 1000);
            }, 2000);
          } else {
            setGameOver(true);
            onComplete('phishingspotter', score + email.points, getTotalPossibleScore());
          }
        }, 500);
      }
    } else if (!email.isPhishing) {
      setWrongClicks(wrongClicks + 1);
      setStreak(0);
    }
  };

  const getTotalPossibleScore = () => {
    return levels.reduce((total, level) => {
      return total + level.emails.filter(e => e.isPhishing).reduce((sum, e) => sum + e.points, 0);
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
          <div className="phishing-spotter-game">
            <div className="text-center">
              <div className="mb-4">
                <h2 className="display-6 fw-bold text-primary mb-3">
                  🎯 Phishing Spotter Challenge
                </h2>
                <p className="lead mb-4 text-muted">
                  Dynamic Biz Security Team Training<br/>
                  Master the art of detecting phishing attempts and social engineering attacks.
                </p>
              </div>
              
              <div className="row g-4 mb-5">
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-primary">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-layers display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.length}</div>
                      <div className="small opacity-75">Security Levels</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-warning">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-envelope-exclamation display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.reduce((sum, level) => sum + level.threats.length, 0)}</div>
                      <div className="small opacity-75">Threats to Find</div>
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
                <i className="bi bi-shield-exclamation me-2"></i>
                Start Phishing Detection
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
            <p className="lead">Great work on {currentLevelData.title}</p>
            {currentLevel < levels.length - 1 && (
              <p className="text-muted">Loading next security challenge...</p>
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
            <h4>Loading Next Security Challenge...</h4>
            <p className="text-muted">Get ready for the next level!</p>
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
            
            <h2 className="mb-4">Phishing Detection Complete!</h2>
            
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
                      {percentage >= 80 ? 'Security Expert! Outstanding threat detection skills.' :
                       percentage >= 60 ? 'Security Analyst! Good instincts, keep improving.' :
                       'Security Trainee! Practice makes perfect - keep learning.'}
                    </div>

                    <div className="text-start">
                      <div className="small text-muted mb-2">Security Team Member</div>
                      <div className="h6 text-primary">Dynamic Biz Phishing Detection Certified</div>
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
        <div className="phishing-spotter-game">
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
                  <div className={`small ${timeLeft <= 10 ? 'text-danger fw-bold' : 'text-warning'}`}>
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
                <strong>Security Team Mission:</strong> Click on emails that you identify as phishing attempts. 
                Avoid clicking legitimate emails. Find all {currentLevelData.threats.length} threats to complete this level!
              </div>
            </div>
          </div>

          {/* Email list */}
          <div className="row g-3">
            {currentLevelData.emails.map(email => (
              <div key={email.id} className="col-12">
                <div 
                  className={`card email-card ${
                    clickedEmails.has(email.id) ? 
                      (email.isPhishing ? 'border-danger bg-danger-subtle' : 'border-success bg-success-subtle') 
                      : 'border-secondary'
                  } ${foundThreats.has(email.id) ? 'found-threat' : ''}`}
                  onClick={() => handleEmailClick(email.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <strong>From:</strong> {email.from}
                    </div>
                    <div>
                      <strong>Subject:</strong> {email.subject}
                    </div>
                    {foundThreats.has(email.id) && (
                      <div className="badge bg-success">
                        <i className="bi bi-check-circle me-1"></i>
                        Found! +{email.points}
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <p className="mb-0">{email.body}</p>
                    {clickedEmails.has(email.id) && showHint && (
                      <div className="alert alert-info mt-3 mb-0">
                        <i className="bi bi-lightbulb me-2"></i>
                        {email.hint}
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
            .phishing-spotter-game {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .email-card {
              transition: all 0.3s ease;
              border-radius: 12px;
            }
            
            .email-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .found-threat {
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
            .phishing-spotter-game .card,
            .email-card {
              background: #ffffff !important;
              color: #212529 !important;
              border: 1px solid #dee2e6 !important;
            }
            
            .phishing-spotter-game .card-header {
              background: #f8f9fa !important;
              color: #495057 !important;
              border-bottom: 1px solid #dee2e6 !important;
            }
            
            .phishing-spotter-game .text-muted {
              color: #6c757d !important;
            }
            
            .phishing-spotter-game .text-dark {
              color: #212529 !important;
            }
            
            .phishing-spotter-game .text-secondary {
              color: #6c757d !important;
            }
            
            .phishing-spotter-game .alert-info {
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
              
              .phishing-spotter-game .card,
              .email-card {
                background: #1a202c !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
              
              .phishing-spotter-game .card-header {
                background: #2d3748 !important;
                color: #e2e8f0 !important;
                border-bottom: 1px solid #4a5568 !important;
              }
              
              .phishing-spotter-game .text-muted {
                color: #a0aec0 !important;
              }
              
              .phishing-spotter-game .text-dark {
                color: #e2e8f0 !important;
              }
              
              .phishing-spotter-game .text-secondary {
                color: #a0aec0 !important;
              }
              
              .phishing-spotter-game .alert-info {
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

export default PhishingSpotterGame;
