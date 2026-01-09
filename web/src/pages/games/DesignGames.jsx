import React, { useState, useEffect, useCallback } from 'react';
import UserTopbar from "../../components/UserTopbar";

const WatermarkShieldGame = ({ onComplete, onBack }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [showHint, setShowHint] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [levelTransition, setLevelTransition] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const levels = [
    {
      title: "Email Security Awareness",
      description: "Identify the security risks in these email scenarios",
      timeLimit: 90,
      scenario: "You receive several emails during your workday at Dynamic Biz. As a member of the Watermark Shield design team, you need to identify which emails pose security risks.",
      questions: [
        {
          id: 1,
          type: "Phishing Email",
          email: {
            from: "security@dynamicbiz.com",
            subject: "URGENT: Verify Your Account Immediately",
            body: "Your account will be suspended in 24 hours. Click here to verify: http://dynamic-biz-verify.suspicious-domain.com/login"
          },
          isRisk: true,
          points: 100,
          explanation: "This is a phishing attempt. The URL doesn't match the company domain and creates urgency to bypass critical thinking.",
          hint: "Check the sender domain and the link destination carefully"
        },
        {
          id: 2,
          type: "Legitimate Internal Email",
          email: {
            from: "hr@dynamicbiz.com",
            subject: "Team Meeting Tomorrow",
            body: "Hi Watermark Shield team, we have our monthly security review meeting tomorrow at 2 PM in Conference Room B."
          },
          isRisk: false,
          points: 50,
          explanation: "This is a legitimate internal communication with no suspicious elements.",
          hint: "This appears to be normal internal communication"
        },
        {
          id: 3,
          type: "Social Engineering",
          email: {
            from: "ceo@dynamicbiz.com",
            subject: "Confidential: Wire Transfer Needed",
            body: "I'm in a meeting and need you to wire $50,000 to our new vendor immediately. I'll send details separately. Keep this confidential."
          },
          isRisk: true,
          points: 120,
          explanation: "This is a CEO fraud/Business Email Compromise attempt using authority and urgency to bypass normal procedures.",
          hint: "Be suspicious of urgent financial requests, even from executives"
        }
      ]
    },
    {
      title: "Password & Access Security",
      description: "Make secure decisions about passwords and system access",
      timeLimit: 75,
      scenario: "As a Watermark Shield team member, you encounter various password and access situations. Choose the most secure approach.",
      questions: [
        {
          id: 4,
          type: "Password Sharing Request",
          situation: "A colleague from another team asks for your design software password because they need to quickly access a file for a client presentation.",
          options: [
            { text: "Share the password since it's urgent", isCorrect: false, points: -20 },
            { text: "Log in yourself and help them get the file", isCorrect: true, points: 100 },
            { text: "Tell them to ask IT for access", isCorrect: true, points: 80 }
          ],
          explanation: "Never share passwords. Either help directly or direct them to proper channels.",
          hint: "Passwords should never be shared, even with colleagues"
        },
        {
          id: 5,
          type: "USB Device Security",
          situation: "You find a USB drive in the parking lot with 'Dynamic Biz Confidential Files' written on it. What should you do?",
          options: [
            { text: "Plug it into your computer to see what's on it", isCorrect: false, points: -50 },
            { text: "Give it to IT security to handle safely", isCorrect: true, points: 120 },
            { text: "Ignore it and leave it where you found it", isCorrect: false, points: 10 }
          ],
          explanation: "Unknown USB devices can contain malware. Always report to IT security.",
          hint: "Unknown USB devices are a common attack vector"
        }
      ]
    },
    {
      title: "Social Engineering Defense",
      description: "Recognize and respond to social engineering attempts",
      timeLimit: 60,
      scenario: "Various people contact you claiming to need information or access. As a Watermark Shield team member, identify the threats.",
      questions: [
        {
          id: 6,
          type: "Phone Call Verification",
          situation: "Someone calls claiming to be from IT support, saying they need your login credentials to fix a security issue on your account.",
          options: [
            { text: "Provide the credentials since they're from IT", isCorrect: false, points: -30 },
            { text: "Ask for their employee ID and call IT to verify", isCorrect: true, points: 100 },
            { text: "Hang up immediately without saying anything", isCorrect: false, points: 20 }
          ],
          explanation: "Always verify the identity of anyone requesting sensitive information, even if they claim to be from your company.",
          hint: "Legitimate IT staff will never ask for your password over the phone"
        },
        {
          id: 7,
          type: "Tailgating Attempt",
          email: {
            from: "visitor@dynamicbiz.com",
            subject: "Meeting with Design Team Today",
            body: "Hi, I'm here for the 3 PM meeting with the Watermark Shield team. I forgot my badge - can someone let me into the building? I'm waiting by the main entrance."
          },
          isRisk: true,
          points: 90,
          explanation: "This could be a tailgating attempt. Visitors should go through proper security procedures.",
          hint: "All visitors should be processed through official channels, not informal requests"
        }
      ]
    },
    {
      title: "Advanced Design Asset Protection",
      description: "Protect intellectual property and handle client data securely",
      timeLimit: 90,
      scenario: "As a Watermark Shield design team member, you encounter various situations involving client files, design assets, and intellectual property. Make the right security decisions to protect Dynamic Biz and our clients.",
      questions: [
        {
          id: 8,
          type: "File Sharing Security",
          situation: "A freelance contractor working on a project asks you to share the complete brand guidelines and logo files via a public Google Drive link so they can work over the weekend.",
          options: [
            { text: "Share the public link since it's urgent", isCorrect: false, points: -30 },
            { text: "Set up a secure, password-protected shared folder with limited access", isCorrect: true, points: 120 },
            { text: "Email the files directly as attachments", isCorrect: false, points: 20 }
          ],
          explanation: "Intellectual property should never be shared via public links. Use secure, controlled access methods.",
          hint: "Consider the security implications of public file sharing"
        },
        {
          id: 9,
          type: "Client Confidentiality",
          email: {
            from: "competitor.research@marketintel.com",
            subject: "Design Trends Research - Collaboration Opportunity",
            body: "Hi! We're conducting research on current design trends. We noticed your excellent work for MegaCorp. Could you share some insights about their upcoming rebranding project? We can offer compensation for your time."
          },
          isRisk: true,
          points: 140,
          explanation: "This is competitive intelligence gathering. Never share client information, even for research purposes.",
          hint: "Competitors may try to gather intelligence about your clients through seemingly innocent requests"
        },
        {
          id: 10,
          type: "Software Security",
          situation: "You receive an email about a 'critical security update' for your design software with a download link. The email looks official but you notice it's from a slightly different domain than usual.",
          options: [
            { text: "Download immediately since security is important", isCorrect: false, points: -40 },
            { text: "Verify with IT and check the official software website first", isCorrect: true, points: 130 },
            { text: "Ignore the email completely", isCorrect: false, points: 10 }
          ],
          explanation: "Always verify software updates through official channels. Fake update emails are common attack vectors.",
          hint: "Verify the sender domain and check official sources before downloading anything"
        }
      ]
    },
    {
      title: "Master-Level Creative Security",
      description: "Handle sophisticated threats targeting creative professionals",
      timeLimit: 120,
      scenario: "You're working on high-profile projects when sophisticated attackers target creative professionals. Navigate these advanced security challenges that specifically target design teams.",
      questions: [
        {
          id: 11,
          type: "Advanced Social Engineering",
          email: {
            from: "sarah.johnson@dynamicbiz.com",
            subject: "Urgent: Client Presentation Update Needed",
            body: "Hi! I'm Sarah from the new business development team. We have an emergency client presentation tomorrow and need the latest MegaCorp designs. The client specifically requested to see the 'Project Phoenix' concepts. Can you send them ASAP? My manager said you'd have access."
          },
          isRisk: true,
          points: 160,
          explanation: "This is an advanced social engineering attack using internal impersonation and urgency. Always verify requests for sensitive materials through known contacts.",
          hint: "Be suspicious of urgent requests from unknown internal contacts, especially for confidential projects"
        },
        {
          id: 12,
          type: "Supply Chain Attack",
          situation: "You receive a notification that a popular design plugin you use has been updated. The update includes new AI-powered features that seem very advanced. However, you notice the file size is much larger than previous updates and it requests unusual system permissions.",
          options: [
            { text: "Install immediately to get the new AI features", isCorrect: false, points: -50 },
            { text: "Research the update, check official sources, and consult with IT security", isCorrect: true, points: 150 },
            { text: "Wait a few weeks to see if others report issues", isCorrect: true, points: 100 }
          ],
          explanation: "Supply chain attacks often target popular software. Unusual file sizes and permissions are red flags.",
          hint: "Be cautious of software updates that seem too good to be true or request unusual permissions"
        },
        {
          id: 13,
          type: "Deepfake Detection",
          situation: "You receive a video call from someone claiming to be the CEO asking you to immediately send all design files for a 'confidential acquisition project.' The video quality is slightly poor, and while it looks like the CEO, something seems off about the voice and mannerisms.",
          options: [
            { text: "Send the files since it's the CEO", isCorrect: false, points: -60 },
            { text: "End the call and verify through official channels before sharing anything", isCorrect: true, points: 170 },
            { text: "Ask for the request in writing first", isCorrect: true, points: 120 }
          ],
          explanation: "Deepfake technology can impersonate executives. Always verify high-stakes requests through multiple channels.",
          hint: "Trust your instincts - if something feels off about a video call, it might be a deepfake attack"
        },
        {
          id: 14,
          type: "Intellectual Property Theft",
          email: {
            from: "talent.scout@creativerecruiters.com",
            subject: "Exciting Opportunity - Portfolio Review",
            body: "Hello talented designer! We represent top creative agencies and have an immediate opening that matches your skills perfectly. To fast-track your application, please upload your complete portfolio including client work to our secure portal: creativerecruiters-secure.net/upload. This is a time-sensitive opportunity!"
          },
          isRisk: true,
          points: 180,
          explanation: "This is an IP theft attempt disguised as a job opportunity. Legitimate recruiters don't ask for complete client portfolios upfront.",
          hint: "Be wary of recruiters asking for extensive client work samples, especially through unfamiliar portals"
        }
      ]
    }
  ];

  const currentLevelData = levels[currentLevel];

  // Game completion callback
  const handleGameComplete = useCallback(() => {
    setGameOver(true);
    if (onComplete) {
      onComplete('watermarkshield', score, getTotalPossibleScore());
    }
  }, [score, onComplete]);

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
              setSelectedAnswers(new Set());
              setShowHint(false);
              setWrongAnswers(0);
              setTimeLeft(levels[currentLevel + 1].timeLimit);
              setLevelTransition(false);
            }, 1000);
          } else {
            handleGameComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft, currentLevel, levelTransition, handleGameComplete]);

  const getTotalPossibleScore = () => {
    return levels.reduce((total, level) => {
      return total + level.questions.reduce((sum, question) => {
        if (question.points) return sum + question.points;
        if (question.options) return sum + Math.max(...question.options.map(opt => opt.points));
        return sum;
      }, 0);
    }, 0);
  };

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(currentLevelData.timeLimit);
    setScore(0);
    setSelectedAnswers(new Set());
    setCurrentLevel(0);
    setWrongAnswers(0);
    setStreak(0);
    setGameOver(false);
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentLevel(0);
    setSelectedAnswers(new Set());
    setShowHint(false);
    setScore(0);
    setWrongAnswers(0);
    setStreak(0);
    setGameOver(false);
    setLevelTransition(false);
    setShowLevelComplete(false);
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
          <div className="watermark-shield-game">
            <div className="text-center">
              <div className="mb-4">
                <h2 className="display-6 fw-bold text-primary mb-3">
                  🛡️ Watermark Shield Security Challenge
                </h2>
                <p className="lead mb-4 text-muted">
                  Dynamic Biz Design Team Security Awareness Training<br/>
                  Build a strong security culture by identifying threats and making secure decisions.
                </p>
              </div>
              
              <div className="row g-4 mb-5">
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-primary">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-layers display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.length}</div>
                      <div className="small opacity-75">Security Scenarios</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-warning">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-shield-exclamation display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.reduce((sum, level) => sum + level.questions.length, 0)}</div>
                      <div className="small opacity-75">Security Challenges</div>
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

              <div className="row justify-content-center mb-4">
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm bg-white">
                    <div className="card-body p-4">
                      <h5 className="card-title text-center mb-4 text-dark fw-bold">
                        <i className="bi bi-info-circle text-primary me-2"></i>
                        How to Play
                      </h5>
                      <div className="row g-4 text-start">
                        <div className="col-md-6">
                          <div className="d-flex align-items-start">
                            <div className="me-3">
                              <i className="bi bi-envelope-exclamation text-primary fs-4"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark mb-1">Identify Threats</div>
                              <div className="text-secondary small">Spot phishing emails and social engineering attempts</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-start">
                            <div className="me-3">
                              <i className="bi bi-shield-check text-success fs-4"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark mb-1">Make Secure Choices</div>
                              <div className="text-secondary small">Choose the most secure response to each scenario</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-start">
                            <div className="me-3">
                              <i className="bi bi-clock text-warning fs-4"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark mb-1">Beat the Clock</div>
                              <div className="text-secondary small">Complete each level before time runs out</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-start">
                            <div className="me-3">
                              <i className="bi bi-people text-info fs-4"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark mb-1">Build Security Culture</div>
                              <div className="text-secondary small">Learn to protect Dynamic Biz from human error</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-primary btn-lg px-5 py-3 shadow-lg"
                onClick={startGame}
              >
                <i className="bi bi-shield-check me-2"></i>
                Start Security Training
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Level complete overlay
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
            <p className="text-muted">Get ready for the next scenario!</p>
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
            
            <h2 className="mb-4">Security Training Complete!</h2>
            
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
                      {percentage >= 80 ? 'Security Champion! Excellent awareness and decision-making.' :
                       percentage >= 60 ? 'Security Defender! Good security instincts, keep improving.' :
                       'Security Learner! Practice makes perfect - keep building your skills.'}
                    </div>

                    <div className="text-start">
                      <div className="small text-muted mb-2">Watermark Shield Team Member</div>
                      <div className="h6 text-primary">Dynamic Biz Security Training Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-3">
              <button 
                className="btn btn-primary btn-lg px-4"
                onClick={resetGame}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Train Again
              </button>
              <button 
                className="btn btn-outline-secondary btn-lg px-4"
                onClick={onBack || (() => window.location.reload())}
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
        <div className="watermark-shield-game">
          {/* Game header */}
          <div className="row align-items-center mb-4">
            <div className="col-md-4">
              <button 
                className="btn btn-outline-secondary"
                onClick={onBack || resetGame}
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
                    <i className="bi bi-shield me-1"></i>
                    Watermark Shield
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario description */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="fw-bold mb-2">
                <i className="bi bi-building text-primary me-2"></i>
                Dynamic Biz Security Scenario
              </h6>
              <p className="text-muted mb-0">{currentLevelData.scenario}</p>
            </div>
          </div>

          {/* Questions */}
          <div className="row g-4">
            {currentLevelData.questions.map((question, index) => (
              <div key={question.id} className="col-12">
                <div className="card border-0 shadow-lg">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 fw-bold">
                      <i className="bi bi-question-circle text-warning me-2"></i>
                      Challenge {index + 1}: {question.type}
                    </h6>
                  </div>
                  <div className="card-body">
                    {question.email && (
                      <div className="email-preview mb-3 p-3 bg-light rounded">
                        <div className="mb-2">
                          <strong>From:</strong> {question.email.from}
                        </div>
                        <div className="mb-2">
                          <strong>Subject:</strong> {question.email.subject}
                        </div>
                        <div className="border-top pt-2">
                          {question.email.body}
                        </div>
                      </div>
                    )}
                    
                    {question.situation && (
                      <div className="situation-preview mb-3 p-3 bg-light rounded">
                        <p className="mb-0">{question.situation}</p>
                      </div>
                    )}
                    
                    <div className="d-flex gap-3 align-items-center">
                      {question.isRisk !== undefined ? (
                        <>
                          <button 
                            className={`btn ${
                              selectedAnswers.has(`${question.id}-risk`) ? 'btn-danger' : 'btn-outline-danger'
                            }`}
                            onClick={() => {
                              const newAnswers = new Set(selectedAnswers);
                              newAnswers.add(`${question.id}-risk`);
                              newAnswers.delete(`${question.id}-safe`);
                              setSelectedAnswers(newAnswers);
                            }}
                          >
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Security Risk
                          </button>
                          <button 
                            className={`btn ${
                              selectedAnswers.has(`${question.id}-safe`) ? 'btn-success' : 'btn-outline-success'
                            }`}
                            onClick={() => {
                              const newAnswers = new Set(selectedAnswers);
                              newAnswers.add(`${question.id}-safe`);
                              newAnswers.delete(`${question.id}-risk`);
                              setSelectedAnswers(newAnswers);
                            }}
                          >
                            <i className="bi bi-shield-check me-2"></i>
                            Safe/Legitimate
                          </button>
                        </>
                      ) : (
                        question.options && question.options.map((option, optIndex) => (
                          <button 
                            key={optIndex}
                            className={`btn ${
                              selectedAnswers.has(`${question.id}-${optIndex}`) ? 'btn-primary' : 'btn-outline-primary'
                            } mb-2`}
                            onClick={() => {
                              const newAnswers = new Set(selectedAnswers);
                              // Remove other options for this question
                              question.options.forEach((_, i) => {
                                newAnswers.delete(`${question.id}-${i}`);
                              });
                              newAnswers.add(`${question.id}-${optIndex}`);
                              setSelectedAnswers(newAnswers);
                            }}
                          >
                            {option.text}
                          </button>
                        ))
                      )}
                      
                      {showHint && (
                        <div className="alert alert-info mb-0 ms-3">
                          <i className="bi bi-lightbulb me-2"></i>
                          {question.hint}
                        </div>
                      )}
                    </div>
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
              <button 
                className="btn btn-success btn-lg"
                onClick={() => {
                  // Process answers and move to next level
                  let levelScore = 0;
                  currentLevelData.questions.forEach(question => {
                    if (question.isRisk !== undefined) {
                      const userAnswer = selectedAnswers.has(`${question.id}-risk`);
                      if (userAnswer === question.isRisk) {
                        levelScore += question.points;
                        setStreak(prev => prev + 1);
                      } else {
                        setWrongAnswers(prev => prev + 1);
                        setStreak(0);
                      }
                    } else if (question.options) {
                      question.options.forEach((option, optIndex) => {
                        if (selectedAnswers.has(`${question.id}-${optIndex}`) && option.isCorrect) {
                          levelScore += option.points;
                          setStreak(prev => prev + 1);
                        } else if (selectedAnswers.has(`${question.id}-${optIndex}`) && !option.isCorrect) {
                          levelScore += option.points; // Can be negative
                          setWrongAnswers(prev => prev + 1);
                          setStreak(0);
                        }
                      });
                    }
                  });
                  
                  setScore(prev => prev + levelScore);
                  
                  if (currentLevel < levels.length - 1) {
                    setShowLevelComplete(true);
                    setTimeout(() => {
                      setShowLevelComplete(false);
                      setLevelTransition(true);
                      setTimeout(() => {
                        setCurrentLevel(prev => prev + 1);
                        setSelectedAnswers(new Set());
                        setShowHint(false);
                        setTimeLeft(levels[currentLevel + 1].timeLimit);
                        setLevelTransition(false);
                      }, 1000);
                    }, 2000);
                  } else {
                    handleGameComplete();
                  }
                }}
                disabled={selectedAnswers.size === 0}
              >
                <i className="bi bi-check-circle me-2"></i>
                Submit Answers
              </button>
            </div>
          </div>

          {/* Security tips */}
          <div className="alert alert-info border-0 mt-4">
            <div className="d-flex align-items-start">
              <i className="bi bi-shield-fill-check me-3 mt-1"></i>
              <div>
                <strong>Watermark Shield Security Tips:</strong> Always verify sender authenticity, 
                never share passwords, be suspicious of urgent requests, and when in doubt, 
                consult with your team or IT security. Building a strong security culture 
                protects Dynamic Biz from human error!
              </div>
            </div>
          </div>

          {/* CSS Styles */}
          <style jsx>{`
            .watermark-shield-game {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .email-preview {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;
              font-size: 14px;
              color: #212529;
            }
            
            .situation-preview {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              font-style: italic;
              color: #856404;
            }
            
            /* Light mode - ensure proper contrast */
            .watermark-shield-game .card {
              background: #ffffff !important;
              color: #212529 !important;
              border: 1px solid #dee2e6 !important;
            }
            
            .watermark-shield-game .bg-light {
              background: #f8f9fa !important;
              color: #495057 !important;
            }
            
            .watermark-shield-game .text-muted {
              color: #6c757d !important;
            }
            
            .watermark-shield-game .text-dark {
              color: #212529 !important;
            }
            
            .watermark-shield-game .text-secondary {
              color: #6c757d !important;
            }
            
            .watermark-shield-game .alert-info {
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
              
              .email-preview {
                background: #2d3748 !important;
                border: 1px solid #4a5568 !important;
                color: #e2e8f0 !important;
              }
              
              .situation-preview {
                background: #2d3748 !important;
                border: 1px solid #4a5568 !important;
                color: #e2e8f0 !important;
              }
              
              .watermark-shield-game .card {
                background: #1a202c !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
              
              .card-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
              }
              
              .watermark-shield-game .bg-light {
                background: #2d3748 !important;
                color: #e2e8f0 !important;
              }
              
              .watermark-shield-game .text-muted {
                color: #a0aec0 !important;
              }
              
              .watermark-shield-game .text-dark {
                color: #e2e8f0 !important;
              }
              
              .watermark-shield-game .text-secondary {
                color: #a0aec0 !important;
              }
              
              .watermark-shield-game .alert-info {
                background: linear-gradient(135deg, #2a4365, #2c5282) !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
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
            
            .card {
              border-radius: 12px;
              overflow: hidden;
              animation: fadeIn 0.5s ease-out;
            }
            
            .card.shadow-lg {
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            }
            
            .btn {
              border-radius: 8px;
              font-weight: 500;
              transition: all 0.3s ease;
            }
            
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .btn-primary {
              background: linear-gradient(135deg, #007bff, #0056b3);
              border: none;
            }
            
            .btn-lg {
              padding: 0.75rem 2rem;
              font-size: 1.1rem;
            }
            
            .alert {
              border-radius: 12px;
              border: none;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .alert-success {
              background: linear-gradient(135deg, #d4edda, #c3e6cb);
              color: #155724;
            }
            
            .alert-info {
              background: linear-gradient(135deg, #cce7ff, #b3d9ff);
              color: #0c5460;
            }
            
            .alert-warning {
              background: linear-gradient(135deg, #fff3cd, #ffeaa7);
              color: #856404;
            }
            
            .badge {
              border-radius: 6px;
              font-weight: 500;
              padding: 0.4em 0.8em;
            }
            
            .spinner-border {
              width: 3rem;
              height: 3rem;
              border-width: 0.3em;
            }
            
            .display-1 {
              animation: bounceIn 1s ease-out;
            }
            
            .h5 {
              font-weight: 600;
            }
            
            /* Animations */
            @keyframes bounceIn {
              0% {
                opacity: 0;
                transform: scale(0.3);
              }
              50% {
                transform: scale(1.05);
              }
              70% {
                transform: scale(0.9);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            /* Time warning pulse */
            @keyframes urgentPulse {
              0% { color: #dc3545; transform: scale(1); }
              50% { color: #ff6b6b; transform: scale(1.05); }
              100% { color: #dc3545; transform: scale(1); }
            }
            
            .text-danger.fw-bold {
              animation: urgentPulse 1s infinite;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
              .display-1 {
                font-size: 3rem !important;
              }
              
              .display-3 {
                font-size: 2rem !important;
              }
              
              .email-preview {
                font-size: 12px;
              }
              
              .btn-lg {
                padding: 0.5rem 1.5rem;
                font-size: 1rem;
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

// Main DesignGames component that shows the games menu
const DesignGames = () => {
  const [currentGame, setCurrentGame] = useState(null);
  const [gameStats, setGameStats] = useState({
    watermarkshield: { played: false, bestScore: 0, totalScore: 0 }
  });

  const handleGameComplete = (gameId, score, maxScore) => {
    setGameStats(prev => ({
      ...prev,
      [gameId]: {
        played: true,
        bestScore: Math.max(prev[gameId]?.bestScore || 0, score),
        totalScore: maxScore
      }
    }));
    setCurrentGame(null);
  };

  const handleBackToMenu = () => {
    setCurrentGame(null);
  };

  // If a game is selected, render that game
  if (currentGame === 'watermarkshield') {
    return <WatermarkShieldGame onComplete={handleGameComplete} onBack={handleBackToMenu} />;
  }

  // Main games menu
  return (
    <>
      <UserTopbar />
      <div className="container my-4">
        <div className="design-games-menu">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold text-primary mb-3">
              🎨 Design Team Security Games
            </h1>
            <p className="lead text-muted mb-4">
              Interactive security awareness training designed specifically for the Dynamic Biz design team.
              Build strong security habits through engaging gameplay.
            </p>
          </div>

          {/* Games Grid */}
          <div className="row g-4 mb-5">
            {/* WatermarkShield Game Card */}
            <div className="col-lg-6 col-md-8 mx-auto">
              <div className="card game-card border-0 shadow-lg h-100">
                <div className="card-header bg-gradient-primary text-white text-center py-4">
                  <div className="mb-3">
                    <i className="bi bi-shield-fill-check display-4"></i>
                  </div>
                  <h3 className="card-title mb-2 fw-bold">Watermark Shield</h3>
                  <p className="card-text mb-0 opacity-75">
                    Security Awareness Challenge
                  </p>
                </div>
                
                <div className="card-body p-4">
                  <div className="mb-4">
                    <h5 className="fw-bold mb-3">Game Overview</h5>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="bi bi-envelope-exclamation text-warning me-2"></i>
                        Identify phishing emails and social engineering attempts
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-shield-check text-success me-2"></i>
                        Make secure decisions in realistic scenarios
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-people text-info me-2"></i>
                        Build security culture for the design team
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-clock text-primary me-2"></i>
                        5 challenging levels with time limits
                      </li>
                    </ul>
                  </div>

                  {/* Game Stats */}
                  {gameStats.watermarkshield.played && (
                    <div className="game-stats mb-4 p-3 bg-light rounded">
                      <h6 className="fw-bold mb-2">
                        <i className="bi bi-graph-up text-success me-2"></i>
                        Your Progress
                      </h6>
                      <div className="row g-2 text-center">
                        <div className="col-6">
                          <div className="small text-muted">Best Score</div>
                          <div className="fw-bold text-primary">
                            {gameStats.watermarkshield.bestScore}
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="small text-muted">Success Rate</div>
                          <div className="fw-bold text-success">
                            {Math.round((gameStats.watermarkshield.bestScore / gameStats.watermarkshield.totalScore) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-grid">
                    <button 
                      className="btn btn-primary btn-lg py-3"
                      onClick={() => setCurrentGame('watermarkshield')}
                    >
                      <i className="bi bi-play-circle me-2"></i>
                      {gameStats.watermarkshield.played ? 'Play Again' : 'Start Training'}
                    </button>
                  </div>
                </div>
                
                <div className="card-footer bg-transparent border-0 p-4 pt-0">
                  <div className="d-flex justify-content-between align-items-center text-muted small">
                    <span>
                      <i className="bi bi-people me-1"></i>
                      Design Team Focus
                    </span>
                    <span>
                      <i className="bi bi-stopwatch me-1"></i>
                      ~10 minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="text-center mb-4">
            <h4 className="text-muted mb-4">More Games Coming Soon</h4>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card border-0 bg-light text-muted">
                  <div className="card-body py-4">
                    <i className="bi bi-palette display-6 mb-3"></i>
                    <h6 className="fw-bold">Design Asset Security</h6>
                    <small>Protect intellectual property and design files</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-light text-muted">
                  <div className="card-body py-4">
                    <i className="bi bi-cloud-arrow-up display-6 mb-3"></i>
                    <h6 className="fw-bold">Cloud Storage Safety</h6>
                    <small>Secure file sharing and collaboration practices</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-light text-muted">
                  <div className="card-body py-4">
                    <i className="bi bi-person-badge display-6 mb-3"></i>
                    <h6 className="fw-bold">Client Data Protection</h6>
                    <small>Handling sensitive client information securely</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="alert alert-info border-0 shadow-sm">
            <div className="d-flex align-items-start">
              <i className="bi bi-lightbulb me-3 mt-1"></i>
              <div>
                <strong>Design Team Security Reminder:</strong> As creative professionals at Dynamic Biz, 
                you handle valuable intellectual property and client data. These games help build the 
                security awareness needed to protect our designs, client information, and company assets 
                from cyber threats. Remember: security is everyone's responsibility!
              </div>
            </div>
          </div>

          {/* CSS Styles */}
          <style jsx>{`
            .design-games-menu {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .game-card {
              border-radius: 16px;
              overflow: hidden;
              transition: all 0.3s ease;
              animation: fadeIn 0.6s ease-out;
            }
            
            .game-card:hover {
              transform: translateY(-8px);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
            }
            
            .bg-gradient-primary {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .card-header {
              border: none;
            }
            
            .btn {
              border-radius: 12px;
              font-weight: 600;
              transition: all 0.3s ease;
            }
            
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 16px rgba(0, 123, 255, 0.3);
            }
            
            .btn-primary {
              background: linear-gradient(135deg, #007bff, #0056b3);
              border: none;
            }
            
            .btn-lg {
              font-size: 1.1rem;
              padding: 0.75rem 2rem;
            }
            
            .alert {
              border-radius: 12px;
              border: none;
            }
            
            .alert-info {
              background: linear-gradient(135deg, #cce7ff, #b3d9ff);
              color: #0c5460;
            }
            
            .game-stats {
              border-radius: 8px;
              background: linear-gradient(135deg, #f8f9fa, #e9ecef) !important;
            }
            
            .card.bg-light {
              background: linear-gradient(135deg, #f8f9fa, #e9ecef) !important;
            }
            
            .display-4 {
              font-weight: 800;
            }
            
            .display-6 {
              opacity: 0.7;
            }
            
            /* Animations */
            @keyframes fadeIn {
              from { 
                opacity: 0; 
                transform: translateY(30px); 
              }
              to { 
                opacity: 1; 
                transform: translateY(0); 
              }
            }
            
            /* Light mode - ensure proper contrast */
            .design-games-menu .card {
              background: #ffffff !important;
              color: #212529 !important;
              border: 1px solid #dee2e6 !important;
            }
            
            .design-games-menu .card.bg-light {
              background: #f8f9fa !important;
              color: #495057 !important;
              border: 1px solid #dee2e6 !important;
            }
            
            .design-games-menu .text-muted {
              color: #6c757d !important;
            }
            
            .design-games-menu .text-dark {
              color: #212529 !important;
            }
            
            .design-games-menu .text-secondary {
              color: #6c757d !important;
            }
            
            .design-games-menu .alert-info {
              background: linear-gradient(135deg, #d1ecf1, #bee5eb) !important;
              color: #0c5460 !important;
              border: 1px solid #b6d4da !important;
            }
            
            .design-games-menu .game-stats {
              background: linear-gradient(135deg, #f8f9fa, #e9ecef) !important;
              color: #495057 !important;
              border: 1px solid #dee2e6 !important;
            }
            
            /* Dark mode support for games menu */
            @media (prefers-color-scheme: dark) {
              .design-games-menu .card {
                background: #1a202c !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
              
              .design-games-menu .card.bg-light {
                background: #2d3748 !important;
                color: #a0aec0 !important;
                border: 1px solid #4a5568 !important;
              }
              
              .design-games-menu .text-muted {
                color: #a0aec0 !important;
              }
              
              .design-games-menu .text-dark {
                color: #e2e8f0 !important;
              }
              
              .design-games-menu .text-secondary {
                color: #a0aec0 !important;
              }
              
              .design-games-menu .alert-info {
                background: linear-gradient(135deg, #2a4365, #2c5282) !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
              
              .design-games-menu .game-stats {
                background: linear-gradient(135deg, #2d3748, #4a5568) !important;
                color: #e2e8f0 !important;
                border: 1px solid #4a5568 !important;
              }
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
              .display-4 {
                font-size: 2.5rem !important;
              }
              
              .btn-lg {
                padding: 0.6rem 1.5rem;
                font-size: 1rem;
              }
              
              .card-body {
                padding: 1.5rem !important;
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default DesignGames;
