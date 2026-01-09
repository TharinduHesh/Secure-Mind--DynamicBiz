import React, { useState, useEffect, useCallback } from 'react';
import UserTopbar from "../../components/UserTopbar";

const BugHunterGame = ({ onComplete }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [foundBugs, setFoundBugs] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showHint, setShowHint] = useState(false);
  const [clickedLines, setClickedLines] = useState(new Set());
  const [gameStarted, setGameStarted] = useState(false);
  const [levelTransition, setLevelTransition] = useState(false);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const levels = [
    {
      title: "User Authentication System",
      description: "Find 3 security vulnerabilities in this login system",
      language: "JavaScript",
      timeLimit: 60,
      code: `const express = require('express');
const app = express();
const db = require('./database');

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Bug 1: SQL Injection - Line 8
    const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
    
    db.query(query, (err, results) => {
        if (err) {
            console.log("Database error: " + err);
            return res.status(500).send('Internal error');
        }
        
        if (results.length > 0) {
            // Bug 2: Insecure Session - Line 16
            req.session.user = username;
            req.session.isAdmin = results[0].role === 'admin';
            
            res.json({ success: true, user: username });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.get('/admin', (req, res) => {
    // Bug 3: Missing Authorization - Line 26
    res.json({ adminData: 'sensitive information' });
});

app.listen(3000);`,
      bugs: [
        {
          line: 8,
          type: "SQL Injection",
          description: "Direct string concatenation allows SQL injection attacks",
          points: 100,
          hint: "Look for user input being directly concatenated into SQL queries"
        },
        {
          line: 16,
          type: "Insecure Session",
          description: "Session data can be manipulated by the client",
          points: 80,
          hint: "Check how session data is being set without proper validation"
        },
        {
          line: 26,
          type: "Missing Authorization",
          description: "Admin endpoint lacks authentication checks",
          points: 90,
          hint: "This admin endpoint doesn't verify user permissions"
        }
      ]
    },
    {
      title: "File Upload Handler",
      description: "Hunt down 4 vulnerabilities in this file upload system",
      language: "PHP",
      timeLimit: 90,
      code: `<?php
if ($_POST['action'] == 'upload') {
    $uploadDir = '/uploads/';
    
    // Bug 1: Path Traversal - Line 6
    $filename = $_POST['filename'];
    $fullPath = $uploadDir . $filename;
    
    // Bug 2: No File Type Validation - Line 10
    if (move_uploaded_file($_FILES['file']['tmp_name'], $fullPath)) {
        echo "File uploaded successfully to: " . $fullPath;
        
        // Bug 3: Command Injection - Line 13
        $output = shell_exec("file " . $fullPath);
        echo "File type: " . $output;
        
        // Log the upload
        $logEntry = date('Y-m-d H:i:s') . " - File uploaded: " . $filename;
        
        // Bug 4: Log Injection - Line 19
        file_put_contents('/var/log/uploads.log', $logEntry . "\\n", FILE_APPEND);
        
    } else {
        echo "Upload failed";
    }
}

// Display upload interface
echo '<div class="upload-form">';
echo '<input type="file" name="file">';
echo '<input type="text" name="filename" placeholder="Filename">';
echo '<input type="hidden" name="action" value="upload">';
echo '<button onclick="uploadFile()">Upload</button>';
echo '</div>';
?>`,
      bugs: [
        {
          line: 6,
          type: "Path Traversal",
          description: "Unsanitized filename allows directory traversal attacks",
          points: 120,
          hint: "User-controlled filename could contain '../' sequences"
        },
        {
          line: 10,
          type: "File Type Bypass",
          description: "No validation on file type or extension",
          points: 100,
          hint: "Any file type can be uploaded without checks"
        },
        {
          line: 13,
          type: "Command Injection",
          description: "Unsanitized input passed to shell_exec",
          points: 150,
          hint: "User input is passed directly to a shell command"
        },
        {
          line: 19,
          type: "Log Injection",
          description: "User input written directly to log files",
          points: 80,
          hint: "Log entries can be manipulated with user input"
        }
      ]
    },
    {
      title: "API Gateway Service",
      description: "Discover 3 critical flaws in this microservice",
      language: "Python",
      timeLimit: 75,
      code: `import requests
import jwt
from flask import Flask, request, jsonify

app = Flask(__name__)
SECRET_KEY = "dev_secret_123"

@app.route('/api/proxy', methods=['POST'])
def api_proxy():
    data = request.get_json()
    
    # Bug 1: SSRF Vulnerability - Line 13
    target_url = data.get('url')
    response = requests.get(target_url)
    
    return jsonify({
        'status': response.status_code,
        'data': response.text
    })

@app.route('/api/token', methods=['POST'])
def generate_token():
    user_data = request.get_json()
    
    # Bug 2: JWT Secret Hardcoded - Line 24
    token = jwt.encode(user_data, SECRET_KEY, algorithm='HS256')
    return jsonify({'token': token})

@app.route('/api/verify', methods=['GET'])
def verify_token():
    token = request.headers.get('Authorization')
    
    try:
        # Bug 3: No Signature Verification - Line 32
        payload = jwt.decode(token, verify=False)
        return jsonify({'valid': True, 'user': payload})
    except:
        return jsonify({'valid': False})

if __name__ == '__main__':
    app.run(debug=True)`,
      bugs: [
        {
          line: 13,
          type: "SSRF",
          description: "Server-Side Request Forgery allows internal network access",
          points: 140,
          hint: "Server can be tricked into making requests to internal services"
        },
        {
          line: 24,
          type: "Hardcoded Secret",
          description: "JWT secret is hardcoded and exposed",
          points: 90,
          hint: "Security secrets should never be hardcoded in source code"
        },
        {
          line: 32,
          type: "JWT Bypass",
          description: "JWT verification is disabled, allowing token forgery",
          points: 130,
          hint: "JWT tokens are being decoded without signature verification"
        }
      ]
    }
  ];

  const currentLevelData = levels[currentLevel];

  // Game completion callback
  const handleGameComplete = useCallback(() => {
    setGameOver(true);
    if (onComplete) {
      onComplete('bughunter', score, getTotalPossibleScore());
    }
  }, [score, onComplete]);

  // Timer effect with improved logic
  useEffect(() => {
    if (!gameStarted || gameOver || timeLeft <= 0 || levelTransition) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - move to next level or end game
          if (currentLevel < levels.length - 1) {
            setLevelTransition(true);
            setTimeout(() => {
              setCurrentLevel(prev => prev + 1);
              setFoundBugs(new Set());
              setClickedLines(new Set());
              setShowHint(false);
              setWrongClicks(0);
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
      return total + level.bugs.reduce((sum, bug) => sum + bug.points, 0);
    }, 0);
  };

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(currentLevelData.timeLimit);
    setScore(0);
    setFoundBugs(new Set());
    setClickedLines(new Set());
    setCurrentLevel(0);
    setWrongClicks(0);
    setStreak(0);
    setGameOver(false);
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentLevel(0);
    setFoundBugs(new Set());
    setClickedLines(new Set());
    setShowHint(false);
    setScore(0);
    setWrongClicks(0);
    setStreak(0);
    setGameOver(false);
    setLevelTransition(false);
    setShowLevelComplete(false);
  };

  const handleLineClick = (lineNumber) => {
    if (gameOver || !gameStarted || levelTransition) return;

    const clickedLine = lineNumber + 1;
    setClickedLines(prev => new Set([...prev, clickedLine]));

    const bug = currentLevelData.bugs.find(b => b.line === clickedLine);
    
    if (bug && !foundBugs.has(bug.line)) {
      // Found a new bug!
      setFoundBugs(prev => new Set([...prev, bug.line]));
      const bonusPoints = Math.floor(bug.points * (1 + streak * 0.1)); // Streak bonus
      setScore(prev => prev + bonusPoints);
      setStreak(prev => prev + 1);

      // Check if all bugs found in current level
      const newFoundBugs = new Set([...foundBugs, bug.line]);
      if (newFoundBugs.size >= currentLevelData.bugs.length) {
        setShowLevelComplete(true);
        setTimeout(() => {
          setShowLevelComplete(false);
          if (currentLevel < levels.length - 1) {
            // Next level
            setLevelTransition(true);
            setTimeout(() => {
              setCurrentLevel(prev => prev + 1);
              setFoundBugs(new Set());
              setClickedLines(new Set());
              setShowHint(false);
              setWrongClicks(0);
              setTimeLeft(levels[currentLevel + 1].timeLimit);
              setLevelTransition(false);
            }, 2000);
          } else {
            // Game complete
            handleGameComplete();
          }
        }, 2000);
      }
    } else if (!bug) {
      // Wrong click
      setWrongClicks(prev => prev + 1);
      setStreak(0); // Reset streak on wrong click
      // Small score penalty for wrong clicks
      setScore(prev => Math.max(0, prev - 10));
    }
  };

  const getLineClassName = (lineNumber) => {
    const lineNum = lineNumber + 1;
    const bug = currentLevelData.bugs.find(b => b.line === lineNum);
    const isClicked = clickedLines.has(lineNum);
    const isFound = foundBugs.has(lineNum);

    if (isFound) return 'code-line bug-found animate-found';
    if (isClicked && bug) return 'code-line bug-found animate-found';
    if (isClicked && !bug) return 'code-line wrong-click animate-wrong';
    if (bug && showHint) return 'code-line hint-highlight animate-hint';
    return 'code-line';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (streak >= 3) return 'text-success';
    if (streak >= 2) return 'text-warning';
    return 'text-primary';
  };

  // Start screen
  if (!gameStarted) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4">
          <div className="bughunter-game">
            <div className="text-center">
              <div className="mb-4">
                <h2 className="display-6 fw-bold text-primary mb-3">
                  🐛 Bug Hunter Challenge
                </h2>
                <p className="lead mb-4 text-muted">
                  Test your security skills by finding vulnerabilities in code!<br/>
                  Click on lines containing security bugs before time runs out.
                </p>
              </div>
              
              <div className="row g-4 mb-5">
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-primary">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-layers display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.length}</div>
                      <div className="small opacity-75">Security Challenges</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm border-0 bg-gradient-warning">
                    <div className="card-body text-center p-4">
                      <i className="bi bi-bug display-6 mb-3"></i>
                      <div className="h3 mb-2">{levels.reduce((sum, level) => sum + level.bugs.length, 0)}</div>
                      <div className="small opacity-75">Total Vulnerabilities</div>
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
                              <i className="bi bi-search text-primary fs-4"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark mb-1">Find Bugs</div>
                              <div className="text-secondary small">Click on lines with security vulnerabilities</div>
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
                              <i className="bi bi-arrow-up-right text-success fs-4"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark mb-1">Build Streaks</div>
                              <div className="text-secondary small">Consecutive correct finds give bonus points</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-start">
                            <div className="me-3">
                              <i className="bi bi-lightbulb text-info fs-4"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark mb-1">Get Hints</div>
                              <div className="text-secondary small">Use the hint button if you're stuck</div>
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
                <i className="bi bi-play-circle me-2"></i>
                Start Bug Hunt
              </button>
            </div>
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
            <h4>Loading Next Level...</h4>
            <p className="text-muted">Get ready for the next challenge!</p>
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
              <i className="bi bi-check-circle-fill text-success display-1"></i>
            </div>
            <h2 className="text-success mb-3">Level Complete!</h2>
            <p className="lead">All bugs found in {currentLevelData.title}</p>
            {currentLevel < levels.length - 1 && (
              <p className="text-muted">Loading next level...</p>
            )}
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
                percentage >= 80 ? 'bi-trophy-fill text-warning' :
                percentage >= 60 ? 'bi-shield-check text-success' : 'bi-book text-info'
              } display-1`}></i>
            </div>
            
            <h2 className="mb-4">Bug Hunt Complete!</h2>
            
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
                        percentage >= 80 ? 'bi-trophy' :
                        percentage >= 60 ? 'bi-shield-check' : 'bi-book'
                      } me-2`}></i>
                      {percentage >= 80 ? 'Elite Bug Hunter! Outstanding security awareness.' :
                       percentage >= 60 ? 'Skilled Hunter! Good security instincts.' :
                       'Learning Hunter! Keep practicing your skills.'}
                    </div>

                    <div className="row g-3 text-start">
                      <div className="col-6">
                        <div className="small text-muted">Bugs Found</div>
                        <div className="h6">{Array.from(foundBugs).length} / {levels.reduce((sum, level) => sum + level.bugs.length, 0)}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted">Wrong Clicks</div>
                        <div className="h6">{wrongClicks}</div>
                      </div>
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
                Hunt Again
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
        <div className="bughunter-game">
          {/* Game header */}
          <div className="row align-items-center mb-4">
            <div className="col-md-4">
              <button 
                className="btn btn-outline-secondary"
                onClick={resetGame}
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
                  <div className={`h5 mb-1 ${getScoreColor()}`}>
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
                    <i className="bi bi-bug me-1"></i>
                    {foundBugs.size}/{currentLevelData.bugs.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">Progress</small>
              <small className="text-muted">{Math.round((foundBugs.size / currentLevelData.bugs.length) * 100)}%</small>
            </div>
            <div className="progress" style={{height: '8px'}}>
              <div 
                className="progress-bar bg-success transition-all"
                style={{width: `${(foundBugs.size / currentLevelData.bugs.length) * 100}%`}}
              ></div>
            </div>
          </div>

          {/* Main code display */}
          <div className="card border-0 shadow-lg mb-4">
            <div className="card-header bg-dark text-light py-3">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <i className="bi bi-code-slash me-2"></i>
                  <strong>{currentLevelData.title}</strong>
                </div>
                <div className="col-md-6 text-end">
                  <span className="badge bg-secondary me-2">{currentLevelData.language}</span>
                  <button 
                    className={`btn btn-sm ${showHint ? 'btn-warning' : 'btn-outline-light'}`}
                    onClick={() => setShowHint(!showHint)}
                  >
                    <i className="bi bi-lightbulb me-1"></i>
                    {showHint ? 'Hide Hints' : 'Show Hints'}
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="code-container">
                {currentLevelData.code.split('\n').map((line, index) => (
                  <div
                    key={index}
                    className={getLineClassName(index)}
                    onClick={() => handleLineClick(index)}
                    title={showHint && currentLevelData.bugs.find(b => b.line === index + 1)?.hint}
                  >
                    <span className="line-number">{index + 1}</span>
                    <span className="line-content">{line || ' '}</span>
                    {foundBugs.has(index + 1) && (
                      <span className="bug-indicator">
                        <i className="bi bi-bug-fill text-success"></i>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Found bugs display */}
          {foundBugs.size > 0 && (
            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Vulnerabilities Found ({foundBugs.size}/{currentLevelData.bugs.length})
                </h6>
                <div className="row g-3">
                  {currentLevelData.bugs
                    .filter(bug => foundBugs.has(bug.line))
                    .map((bug, index) => (
                      <div key={index} className="col-lg-6">
                        <div className="alert alert-success border-0 shadow-sm mb-0">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="fw-bold">Line {bug.line}: {bug.type}</div>
                              <div className="small text-muted mt-1">{bug.description}</div>
                            </div>
                            <span className="badge bg-success ms-3">+{bug.points}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Game tips */}
          <div className="alert alert-info border-0">
            <div className="d-flex align-items-start">
              <i className="bi bi-lightbulb-fill me-3 mt-1"></i>
              <div>
                <strong>Security Hunting Tips:</strong> Look for SQL injection, command injection, 
                path traversal, hardcoded secrets, missing authentication, weak session handling, 
                and other common vulnerabilities. Click directly on the line number to mark potential bugs!
              </div>
            </div>
          </div>

          {/* CSS Styles */}
          <style jsx>{`
            .bughunter-game {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .code-container {
              background: #1e1e1e;
              color: #d4d4d4;
              font-family: 'Fira Code', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;
              font-size: 14px;
              line-height: 1.6;
              max-height: 500px;
              overflow-y: auto;
              border-radius: 0 0 0.5rem 0.5rem;
            }
            
            .code-line {
              display: flex;
              align-items: center;
              padding: 0.5rem 1rem;
              cursor: pointer;
              transition: all 0.2s ease;
              position: relative;
              border-left: 4px solid transparent;
            }
            
            .code-line:hover {
              background-color: #2d2d30;
              border-left-color: #007acc;
            }
            
            .line-number {
              min-width: 50px;
              text-align: right;
              margin-right: 1rem;
              color: #858585;
              font-weight: 500;
              user-select: none;
            }
            
            .line-content {
              flex-grow: 1;
              white-space: pre;
              color: #d4d4d4;
            }
            
            .bug-indicator {
              margin-left: auto;
              padding-left: 1rem;
              animation: bounceIn 0.5s ease-out;
            }
            
            .bug-found {
              background-color: #1a4d3a !important;
              border-left-color: #28a745 !important;
              box-shadow: inset 0 0 10px rgba(40, 167, 69, 0.3);
            }
            
            .bug-found .line-number {
              color: #28a745;
              font-weight: bold;
            }
            
            .wrong-click {
              background-color: #4d1a1a !important;
              border-left-color: #dc3545 !important;
              animation: shake 0.5s ease-in-out;
            }
            
            .wrong-click .line-number {
              color: #dc3545;
            }
            
            .hint-highlight {
              background-color: #4d4d1a !important;
              border-left-color: #ffc107 !important;
              animation: pulse 2s infinite;
            }
            
            .hint-highlight .line-number {
              color: #ffc107;
            }
            
            .animate-found {
              animation: slideInRight 0.5s ease-out;
            }
            
            .animate-wrong {
              animation: shake 0.6s ease-in-out;
            }
            
            .animate-hint {
              animation: pulse 2s infinite;
            }
            
            .bg-gradient-primary {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .bg-gradient-warning {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            
            .bg-gradient-success {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }
            
            .bg-gradient-info {
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            }
            
            .transition-all {
              transition: all 0.3s ease;
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
            
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
              20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.7; }
              100% { opacity: 1; }
            }
            
            @keyframes slideInRight {
              0% {
                transform: translateX(100%);
                opacity: 0;
              }
              100% {
                transform: translateX(0);
                opacity: 1;
              }
            }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            .card {
              animation: fadeIn 0.5s ease-out;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
              .code-container {
                font-size: 12px;
                max-height: 400px;
              }
              
              .code-line {
                padding: 0.3rem 0.5rem;
              }
              
              .line-number {
                min-width: 35px;
                margin-right: 0.5rem;
                font-size: 11px;
              }
              
              .display-1 {
                font-size: 3rem !important;
              }
              
              .display-3 {
                font-size: 2rem !important;
              }
            }
            
            /* Syntax highlighting for better code readability */
            .line-content {
              position: relative;
            }
            
            /* Keywords */
            .code-line:has(.line-content:contains("const")) .line-content,
            .code-line:has(.line-content:contains("let")) .line-content,
            .code-line:has(.line-content:contains("var")) .line-content,
            .code-line:has(.line-content:contains("function")) .line-content,
            .code-line:has(.line-content:contains("if")) .line-content,
            .code-line:has(.line-content:contains("else")) .line-content,
            .code-line:has(.line-content:contains("for")) .line-content,
            .code-line:has(.line-content:contains("while")) .line-content,
            .code-line:has(.line-content:contains("return")) .line-content {
              /* Enhanced readability without complex parsing */
            }
            
            /* Comments styling */
            .line-content:contains("//") {
              color: #6a9955;
            }
            
            /* String styling */
            .line-content:contains("'") {
              /* Strings would be highlighted in a full implementation */
            }
            
            /* Enhanced hover effects */
            .code-line:hover .line-number {
              color: #ffffff;
              transform: scale(1.1);
            }
            
            .code-line:hover .bug-indicator {
              transform: scale(1.2);
            }
            
            /* Progress bar enhancements */
            .progress {
              background-color: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              overflow: hidden;
            }
            
            .progress-bar {
              border-radius: 10px;
              transition: width 0.6s ease;
              background: linear-gradient(90deg, #28a745, #20c997);
            }
            
            /* Alert enhancements */
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
            
            /* Button enhancements */
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
            
            /* Card enhancements */
            .card {
              border-radius: 12px;
              overflow: hidden;
            }
            
            .card.shadow-lg {
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            }
            
            .card-header.bg-dark {
              background: linear-gradient(135deg, #212529, #343a40) !important;
            }
            
            /* Badge enhancements */
            .badge {
              border-radius: 6px;
              font-weight: 500;
              padding: 0.4em 0.8em;
            }
            
            /* Scrollbar styling for code container */
            .code-container::-webkit-scrollbar {
              width: 8px;
            }
            
            .code-container::-webkit-scrollbar-track {
              background: #1e1e1e;
            }
            
            .code-container::-webkit-scrollbar-thumb {
              background: #555;
              border-radius: 4px;
            }
            
            .code-container::-webkit-scrollbar-thumb:hover {
              background: #777;
            }
            
            /* Loading spinner enhancement */
            .spinner-border {
              width: 3rem;
              height: 3rem;
              border-width: 0.3em;
            }
            
            /* Level complete animation */
            .display-1 {
              animation: bounceIn 1s ease-out;
            }
            
            /* Score counter enhancement */
            .h5 {
              font-weight: 600;
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
          `}</style>
        </div>
      </div>
    </>
  );
};

export default BugHunterGame;