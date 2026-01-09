// web/src/pages/accounting/Quiz.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import UserTopbar from "../../components/UserTopbar";

export default function AccountingQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const db = useMemo(() => getFirestore(), []);

  const { assignment, quiz } = location.state || {};

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizData, setQuizData] = useState(null);

  // quiz data handler
  useEffect(() => {
    console.log('QuizData updated:', quizData);
    if (quizData) {
      console.log('QuizData questions:', quizData.questions);
      console.log('QuizData questions length:', quizData.questions?.length);
    }
  }, [quizData]);
  const [loading, setLoading] = useState(true);

  // Auth state monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Fetch user profile
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate, db]);

  // Set quiz data on component mount
  useEffect(() => {
    console.log('Quiz component: Received data', { assignment, quiz });
    
    if (quiz) {
      console.log('Quiz component: Using provided quiz data');
      console.log('Quiz data structure:', quiz);
      console.log('Quiz questions:', quiz.questions);
      console.log('Quiz questions length:', quiz.questions?.length);
      setQuizData(quiz);
    } else {
      console.log('Quiz component: Using fallback quiz data');
      // Fallback quiz data for testing
      const fallbackQuiz = {
        id: 'demo-quiz',
        title: 'Accounting Security Fundamentals',
        description: 'Test your knowledge of accounting security best practices',
        questions: [
          {
            text: "What is the most secure way to handle financial passwords?",
            options: [
              "Use the same password for all financial systems for consistency",
              "Write passwords on sticky notes for easy access",
              "Use unique, complex passwords with a password manager",
              "Share passwords with trusted team members"
            ],
            correctIndex: 2
          },
          {
            text: "How should you verify the authenticity of an invoice from a new vendor?",
            options: [
              "Process it immediately to maintain good vendor relationships",
              "Contact the vendor using independently verified phone numbers",
              "Trust the email sender address as verification",
              "Only verify if the amount exceeds $10,000"
            ],
            correctIndex: 1
          },
          {
            text: "Which of the following is a red flag in a suspicious invoice?",
            options: [
              "Detailed line item descriptions",
              "Professional company letterhead",
              "Urgent payment demands with service disruption threats",
              "Standard net-30 payment terms"
            ],
            correctIndex: 2
          },
          {
            text: "What should you do if you receive an unexpected wire transfer request?",
            options: [
              "Process it quickly to avoid delays",
              "Verify through a separate communication channel",
              "Check if the email looks legitimate",
              "Forward it to your supervisor without verification"
            ],
            correctIndex: 1
          },
          {
            text: "How often should you update your financial system passwords?",
            options: [
              "Once a year",
              "Every 90 days or when compromised",
              "Only when required by the system",
              "Never, if they're complex enough"
            ],
            correctIndex: 1
          }
        ]
      };
      console.log('Fallback quiz data:', fallbackQuiz);
      console.log('Fallback quiz questions length:', fallbackQuiz.questions.length);
      setQuizData(fallbackQuiz);
    }
  }, [quiz]);

  // Redirect if no quiz data and not loading
  useEffect(() => {
    if (!loading && !assignment && !quiz && !quizData) {
      navigate('/accounting');
    }
  }, [assignment, quiz, quizData, loading, navigate]);

  // Set up timer when quiz starts
  useEffect(() => {
    if (!quizStarted || !quizData) return;
    
    const duration = 30 * 60; // 30 minutes in seconds
    setTimeRemaining(duration);

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizData]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const calculateScore = () => {
    if (!quizData || !quizData.questions) return { score: 0, percentage: 0 };
    
    let correct = 0;
    quizData.questions.forEach((question, index) => {
      if (answers[index] === question.correctIndex) {
        correct++;
      }
    });
    
    const percentage = Math.round((correct / quizData.questions.length) * 100);
    return { score: correct, percentage };
  };

  const handleSubmitQuiz = async (isTimeUp = false) => {
    if (!user || !quizData) return;
    
    setSubmitting(true);
    
    try {
      const { score: finalScore, percentage: finalPercentage } = calculateScore();
      setScore(finalScore);
      setPercentage(finalPercentage);

      // Create quiz result object
      const quizResult = {
        userId: user.uid,
        userEmail: user.email,
        userName: userProfile?.displayName || user.displayName || user.email.split('@')[0],
        quizId: quizData.id,
        assignmentId: assignment?.id || null,
        quizTitle: quizData.title,
        score: finalScore,
        percentage: finalPercentage,
        answers: answers,
        totalQuestions: quizData.questions.length,
        completedAt: serverTimestamp(),
        isTimeUp: isTimeUp,
        timeSpent: timeRemaining ? (30 * 60 - timeRemaining) : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save quiz result
      await addDoc(collection(db, "quiz_results"), quizResult);

      console.log('Quiz result saved successfully');
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "â€”";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "success";
    if (percentage >= 70) return "warning";
    return "danger";
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 90) return "Excellent! Outstanding knowledge of security practices.";
    if (percentage >= 80) return "Great job! You have a solid understanding of security fundamentals.";
    if (percentage >= 70) return "Good work! You passed, but consider reviewing some areas.";
    return "Keep learning! Review the material and try again to improve your score.";
  };

  if (loading) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4 d-flex justify-content-center align-items-center" style={{minHeight: '50vh'}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading quiz...</span>
          </div>
        </div>
      </>
    );
  }

  if (!quizData) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4" style={{ maxWidth: 800 }}>
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Quiz data not found. Please return to dashboard and try again.
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/accounting')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Return to Dashboard
          </button>
        </div>
      </>
    );
  }

  // Quiz start screen
  if (!quizStarted) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4" style={{ maxWidth: 800 }}>
          <div className="card border-0 shadow-lg">
            <div className="card-header text-center py-4 bg-primary text-white">
              <h2 className="h3 fw-bold mb-2">Ready to Start Quiz?</h2>
              <h4>{quizData.title}</h4>
              {quizData.description && (
                <p className="mb-0 opacity-75">{quizData.description}</p>
              )}
            </div>
            <div className="card-body p-5 text-center">
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="stat-card">
                    <div className="stat-number">{quizData.questions.length}</div>
                    <div className="stat-label">Questions</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card">
                    <div className="stat-number">30</div>
                    <div className="stat-label">Minutes</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card">
                    <div className="stat-number">70%</div>
                    <div className="stat-label">Pass Score</div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info mb-4">
                <h6 className="alert-heading fw-bold">
                  <i className="bi bi-info-circle me-2"></i>
                  Quiz Instructions
                </h6>
                <ul className="text-start mb-0">
                  <li>You have 30 minutes to complete this quiz</li>
                  <li>Each question has only one correct answer</li>
                  <li>You can navigate between questions before submitting</li>
                  <li>Your answers are saved automatically</li>
                  <li>You must answer all questions before submitting</li>
                  <li>Click "Submit Quiz" when you're finished</li>
                </ul>
              </div>

              <div className="d-flex gap-3 justify-content-center">
                <button 
                  className="btn btn-success btn-lg px-4"
                  onClick={() => setQuizStarted(true)}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  Start Quiz
                </button>
                <button 
                  className="btn btn-outline-secondary btn-lg px-4"
                  onClick={() => navigate('/accounting')}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Results screen
  if (showResults) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4" style={{ maxWidth: 800 }}>
          <div className="card border-0 shadow-lg quiz-results-card">
            <div className="card-header text-center py-4">
              <h2 className="h3 fw-bold mb-2">Quiz Complete!</h2>
              <h4 className="text-muted">{quizData.title}</h4>
            </div>
            <div className="card-body text-center py-5">
              <div className={`score-circle mx-auto mb-4 bg-${getScoreColor(percentage)}-subtle`}>
                <div className="score-number">
                  <span className={`display-3 fw-bold text-${getScoreColor(percentage)}`}>{percentage}</span>
                  <div className={`h5 text-${getScoreColor(percentage)}`}>%</div>
                </div>
              </div>
              
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="stat-card">
                    <div className="stat-number">{Object.keys(answers).length}</div>
                    <div className="stat-label">Answered</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="stat-card">
                    <div className="stat-number">{quizData.questions.length}</div>
                    <div className="stat-label">Total</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="stat-card">
                    <div className="stat-number">{score}</div>
                    <div className="stat-label">Correct</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="stat-card">
                    <div className="stat-number">{formatTime(timeRemaining ? (30 * 60 - timeRemaining) : 0)}</div>
                    <div className="stat-label">Time Taken</div>
                  </div>
                </div>
              </div>

              <div className={`alert ${percentage >= 70 ? 'alert-success' : 'alert-warning'} mb-4`}>
                <h6 className="fw-bold mb-2">
                  {percentage >= 70 ? (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Congratulations! You Passed
                    </>
                  ) : (
                    <>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Keep Learning
                    </>
                  )}
                </h6>
                <p className="mb-0">{getScoreMessage(percentage)}</p>
              </div>

              <div className="d-flex gap-3 justify-content-center">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate('/accounting')}
                >
                  <i className="bi bi-house me-2"></i>
                  Return to Dashboard
                </button>
                <button 
                  className="btn btn-outline-secondary btn-lg"
                  onClick={() => navigate('/accounting/progress')}
                >
                  <i className="bi bi-graph-up me-2"></i>
                  View Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Quiz taking interface
  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{ maxWidth: 800 }}>
        {/* Quiz Header */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="fw-bold mb-1">{quizData.title}</h4>
                <p className="text-muted mb-0">
                  Question {currentQuestion + 1} of {quizData.questions?.length || 0}
                </p>
              </div>
              <div className="text-end">
                <div className="fw-bold text-primary mb-1">
                  <i className="bi bi-clock me-1"></i>
                  {formatTime(timeRemaining)}
                </div>
                <div className="progress" style={{ width: 200, height: 6 }}>
                  <div 
                    className="progress-bar" 
                    style={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Question */}
        <div className="card border-0 shadow-lg question-card">
          <div className="card-body p-4 p-md-5">
            {quizData.questions && quizData.questions.length > 0 ? (
              <div className="question-content">
                <h5 className="question-text mb-4">
                  {quizData.questions[currentQuestion]?.text}
                </h5>

                <div className="options-list">
                  {quizData.questions[currentQuestion]?.options?.map((option, index) => (
                  <div 
                    key={index}
                    className={`option-card ${answers[currentQuestion] === index ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(currentQuestion, index)}
                  >
                    <div className="option-radio">
                      <input 
                        type="radio"
                        name={`question-${currentQuestion}`}
                        checked={answers[currentQuestion] === index}
                        onChange={() => {}}
                        disabled={submitting}
                      />
                    </div>
                    <div className="option-text">{option}</div>
                  </div>
                ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3">No Questions Available</h5>
                <p className="text-muted">
                  This quiz doesn't have any questions yet. Please contact your administrator.
                </p>
                <div className="mt-4">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/accounting')}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        {quizData.questions && quizData.questions.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <button 
              className="btn btn-outline-secondary"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0 || submitting}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Previous
            </button>

            <div className="d-flex gap-2">
              {currentQuestion < quizData.questions.length - 1 ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={answers[currentQuestion] === undefined || submitting}
                >
                  Next
                  <i className="bi bi-arrow-right ms-2"></i>
                </button>
              ) : (
                <button 
                  className="btn btn-success btn-lg"
                  onClick={() => handleSubmitQuiz()}
                  disabled={submitting || Object.keys(answers).length < quizData.questions.length}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Submit Quiz
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Question Overview */}
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Question Overview</h6>
            <div className="d-flex flex-wrap gap-2">
              {quizData.questions.map((_, index) => (
                <button
                  key={index}
                  className={`btn btn-sm question-nav ${
                    index === currentQuestion ? 'btn-primary' : 
                    answers[index] !== undefined ? 'btn-success' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setCurrentQuestion(index)}
                  disabled={submitting}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <small className="text-muted">
                Progress: {Object.keys(answers).length}/{quizData.questions.length} questions answered
              </small>
            </div>
          </div>
        </div>

        <style>{`
          .question-card {
            border-radius: 16px;
            min-height: 400px;
          }

          .question-text {
            font-size: 1.25rem;
            line-height: 1.6;
            color: var(--bs-dark);
          }

          .options-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .option-card {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.25rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #f8fafc;
          }

          .option-card:hover:not(.selected) {
            border-color: var(--bs-primary);
            background: rgba(var(--bs-primary-rgb), 0.05);
            transform: translateY(-1px);
          }

          .option-card.selected {
            border-color: var(--bs-primary);
            background: rgba(var(--bs-primary-rgb), 0.1);
            box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb), 0.1);
          }

          .option-radio {
            margin-top: 0.125rem;
            flex-shrink: 0;
          }

          .option-radio input[type="radio"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
          }

          .option-text {
            font-size: 1.1rem;
            line-height: 1.5;
            flex: 1;
          }

          .question-nav {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-weight: 600;
          }

          .score-circle {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 8px solid currentColor;
          }

          .score-number {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
          }

          .stat-card {
            background: rgba(var(--bs-primary-rgb), 0.1);
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
          }

          .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--bs-primary);
          }

          .stat-label {
            font-size: 0.875rem;
            color: var(--bs-secondary);
            font-weight: 500;
          }

          .quiz-results-card {
            border-radius: 20px;
            overflow: hidden;
          }

          /* Dark theme support */
          [data-bs-theme="dark"] .option-card {
            background: #374151;
            border-color: #6b7280;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .option-card:hover:not(.selected) {
            background: rgba(59, 130, 246, 0.1);
          }

          [data-bs-theme="dark"] .option-card.selected {
            background: rgba(59, 130, 246, 0.2);
          }

          [data-bs-theme="dark"] .question-text {
            color: var(--bs-light);
          }

          [data-bs-theme="dark"] .stat-card {
            background: rgba(255, 255, 255, 0.05);
          }

          [data-bs-theme="dark"] .card {
            background-color: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
          }

          @media (max-width: 768px) {
            .container {
              padding: 0 1rem;
            }
            
            .question-card .card-body {
              padding: 1.5rem !important;
            }
            
            .question-text {
              font-size: 1.1rem;
            }
            
            .option-text {
              font-size: 1rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}