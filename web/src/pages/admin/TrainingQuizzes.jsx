// web/src/pages/admin/TrainingQuizzes.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDocs,
  where,
  writeBatch,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import Topbar from "../../components/Topbar";

const ROLES = ["admin", "security", "accounting", "marketing", "developer", "design"];

export default function TrainingQuizzes() {
  const db = useMemo(() => getFirestore(), []);
  const functions = useMemo(() => getFunctions(), []);
  const auth = useMemo(() => getAuth(), []);
  
  const [quizzes, setQuizzes] = useState([]);
  const [selectKey, setSelectKey] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [selectedQuizResults, setSelectedQuizResults] = useState(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const [activeTab, setActiveTab] = useState('create'); // 'create', 'assign', 'results'

  const [qForm, setQForm] = useState({
    title: "",
    description: "",
    roles: ["accounting"],
    questions: [{ text: "", options: ["", "", "", ""], correctIndex: 0 }],
    timeLimitMinutes: 0,
    passingScore: 70,
  });

  const [aForm, setAForm] = useState({
    quizId: "",
    targetType: "roles",
    roles: ["accounting"],
    userIds: "",
    dueDate: "",
  });

  const resetBanners = () => {
    setErr("");
    setOk("");
  };

  // Live data
  useEffect(() => {
    const u1 = onSnapshot(
      query(collection(db, "quizzes"), orderBy("createdAt", "desc")),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuizzes(list);
        // Force remount of select to avoid stale option labels in some browsers
        setSelectKey(k => k + 1);
        setAForm((prev) => {
          // If no selection yet, pick first quiz
          if (!prev.quizId && list[0]) return { ...prev, quizId: list[0].id };
          // If current selection no longer exists (deleted), pick first quiz or clear
          if (prev.quizId && !list.some(q => q.id === prev.quizId)) {
            return { ...prev, quizId: list[0] ? list[0].id : "" };
          }
          return prev;
        });
      },
      (e) => setErr(e.message || String(e))
    );
    
    const u2 = onSnapshot(
      query(collection(db, "quiz_assignments"), orderBy("createdAt", "desc")),
      (snap) => setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setErr(e.message || String(e))
    );

    // Listen to quiz results
    const u3 = onSnapshot(
      query(collection(db, "quiz_results"), orderBy("createdAt", "desc")),
      (snap) => setQuizResults(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.error("Error loading quiz results:", e)
    );
    
    return () => {
      u1();
      u2();
      u3();
    };
  }, [db]);

  // Quiz helpers
  const addQuestion = () =>
    setQForm((f) => ({
      ...f,
      questions: [...f.questions, { text: "", options: ["", "", "", ""], correctIndex: 0 }],
    }));

  const removeQuestion = (index) => {
    if (qForm.questions.length > 1) {
      setQForm((f) => ({
        ...f,
        questions: f.questions.filter((_, i) => i !== index),
      }));
    }
  };

  const validateQuiz = () => {
    const title = (qForm.title || "").trim();
    if (!title) return "Quiz title is required.";
    if (qForm.questions.length === 0) return "At least one question is required.";
    
    for (let i = 0; i < qForm.questions.length; i++) {
      const q = qForm.questions[i];
      if (!q.text.trim()) return `Question ${i + 1}: text is required.`;
      if (!Array.isArray(q.options) || q.options.length !== 4) return `Question ${i + 1}: needs 4 options.`;
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) return `Question ${i + 1}, Option ${j + 1}: text is required.`;
      }
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) {
        return `Question ${i + 1}: correct answer index must be 0–3.`;
      }
    }
    if (typeof qForm.timeLimitMinutes !== 'number' || qForm.timeLimitMinutes < 0) return 'Time limit must be 0 or a positive number.';
    if (typeof qForm.passingScore !== 'number' || qForm.passingScore < 0 || qForm.passingScore > 100) return 'Passing score must be between 0 and 100.';
    return "";
  };

  const createQuiz = async (e) => {
    e.preventDefault();
    resetBanners();
    const v = validateQuiz();
    if (v) return setErr(v);
    setSavingQuiz(true);
    try {
      // Normalize roles to lowercase
      const normalizedRoles = qForm.roles.map(r => r.toLowerCase());
      
      await addDoc(collection(db, "quizzes"), {
        title: qForm.title.trim(),
        description: (qForm.description || "").trim(),
        roles: normalizedRoles,
        // Ensure Firestore rules allow read for targeted users
        targets: {
          all: false,
          roles: normalizedRoles,
          users: []
        },
        questions: qForm.questions,
        // Quiz configuration
        timeLimitMinutes: Number(qForm.timeLimitMinutes) || 0,
        passingScore: Number(qForm.passingScore) || 70,
        published: true,
        createdAt: serverTimestamp(),
      });
      setQForm({
        title: "",
        description: "",
        roles: ["accounting"],
        questions: [{ text: "", options: ["", "", "", ""], correctIndex: 0 }],
        timeLimitMinutes: 0,
        passingScore: 70,
      });
      setOk("Quiz saved successfully.");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setSavingQuiz(false);
    }
  };

  // Assignment helpers
  const validateAssignment = () => {
    if (!aForm.quizId) return "Select a quiz to assign.";
    if (aForm.targetType === "roles" && (!aForm.roles || aForm.roles.length === 0)) {
      return "Select at least one role.";
    }
    if (aForm.targetType === "users") {
      const ids = (aForm.userIds || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length === 0) return "Provide at least one user ID.";
    }
    return "";
  };

  const assignQuiz = async (e) => {
    e.preventDefault();
    resetBanners();
    const v = validateAssignment();
    if (v) return setErr(v);
    
    if (!auth.currentUser) {
      setErr("You must be logged in to assign quizzes.");
      return;
    }
    
    setSavingAssign(true);
    try {
      const ids = aForm.targetType === "users"
        ? (aForm.userIds || "").split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const dueTs = aForm.dueDate ? Timestamp.fromDate(new Date(aForm.dueDate)) : null;
      
      // Normalize roles to lowercase
      const normalizedRoles = aForm.targetType === "roles" 
        ? aForm.roles.map(r => r.toLowerCase()) 
        : [];

      // Include quiz metadata snapshot on the assignment so UIs can render even when quiz doc can't be read
      const selectedQuiz = quizzes.find(q => q.id === aForm.quizId) || null;

      const assignmentData = {
        quizId: aForm.quizId,
        quizTitle: selectedQuiz?.title || null,
        quizDescription: selectedQuiz?.description || null,
        questions: selectedQuiz?.questions || [],
        timeLimitMinutes: selectedQuiz?.timeLimitMinutes || 0,
        passingScore: selectedQuiz?.passingScore || 70,
        targetType: aForm.targetType,
        roles: normalizedRoles,
        userIds: aForm.targetType === "users" ? ids : [],
        dueDate: dueTs,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
      };

      await addDoc(collection(db, "quiz_assignments"), assignmentData);

      // Send notifications to assigned users
      try {
        const selectedQuiz = quizzes.find(q => q.id === aForm.quizId);
        const call = httpsCallable(functions, "broadcastQuizNotification");
        const result = await call({
          quizId: aForm.quizId,
          quizTitle: selectedQuiz?.title || "Quiz Assignment",
          message: `You have been assigned a new quiz: ${selectedQuiz?.title || "New Quiz"}. Please complete it by the due date.`,
          targetType: aForm.targetType,
          roles: normalizedRoles,
          userIds: ids,
        });
        console.log('Quiz notification result:', result.data);
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the assignment if notification fails
      }

      setAForm({
        quizId: aForm.quizId,
        targetType: "roles",
        roles: ["accounting"],
        userIds: "",
        dueDate: "",
      });
      setOk("Quiz assigned successfully.");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setSavingAssign(false);
    }
  };

  // Delete functions
  const deleteQuiz = async (quizId, quizTitle) => {
    resetBanners();
    const okGo = window.confirm(
      `Delete quiz "${quizTitle || quizId}"?\nThis will also delete all its assignments and results.`
    );
    if (!okGo) return;

    setDeletingId(quizId);
  // Optimistically clear selection so UI doesn't show deleted quiz while we delete
  setAForm(prev => (prev.quizId === quizId ? { ...prev, quizId: "" } : prev));
  setSelectKey(k => k + 1);
    try {
      const batch = writeBatch(db);
      
      // Delete assignments for this quiz
      const assignmentsSnap = await getDocs(query(collection(db, "quiz_assignments"), where("quizId", "==", quizId)));
      assignmentsSnap.forEach((d) => batch.delete(d.ref));
      
      // Delete results for this quiz
      const resultsSnap = await getDocs(query(collection(db, "quiz_results"), where("quizId", "==", quizId)));
      resultsSnap.forEach((d) => batch.delete(d.ref));
      
      // Delete quiz
      batch.delete(doc(db, "quizzes", quizId));
      await batch.commit();

      // Immediately remove the deleted quiz from local state and update assign selection using the new list
      setQuizzes((prev) => {
        const newList = prev.filter((q) => q.id !== quizId);
        setAForm((prevA) => {
          if (prevA.quizId === quizId) {
            return { ...prevA, quizId: newList[0]?.id || "" };
          }
          return prevA;
        });
        // bump selectKey so the <select> remounts and won't show stale labels
        setSelectKey(k => k + 1);
        return newList;
      });

      setOk("Quiz, assignments, and results deleted.");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    resetBanners();
    const okGo = window.confirm("Delete this assignment?");
    if (!okGo) return;
    setDeletingId(assignmentId);
    try {
      await deleteDoc(doc(db, "quiz_assignments", assignmentId));
      setOk("Assignment deleted.");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setDeletingId(null);
    }
  };

  // Results functions
  const loadQuizResults = async (quizId) => {
    setLoadingResults(true);
    try {
      const q = query(
        collection(db, "quiz_results"), 
        where("quizId", "==", quizId),
        orderBy("score", "desc")
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSelectedQuizResults(results);
      setActiveTab('results');
    } catch (e) {
      setErr("Error loading quiz results: " + (e?.message || String(e)));
    } finally {
      setLoadingResults(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "—";
    }
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
  };

  const mapQuizTitle = useMemo(
    () => Object.fromEntries(quizzes.map((q) => [q.id, q.title])),
    [quizzes]
  );

  return (
    <>
      <Topbar />
      <div className="container py-4" style={{ maxWidth: 1200 }}>
        <div className="policies-header mb-4">
          <h3 className="fw-bold mb-0 policies-title">
            <i className="bi bi-patch-question me-2"></i>
            Training & Quizzes Management
          </h3>
          <p className="text-muted mb-0 mt-1">Create quizzes, assign them to users, and track results</p>
        </div>

        {err && (
          <div className="alert alert-danger alert-enhanced" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {err}
          </div>
        )}
        {ok && (
          <div className="alert alert-success alert-enhanced" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {ok}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="card border-0 policy-card mb-4">
          <div className="card-body p-0">
            <nav className="nav nav-pills nav-fill quiz-nav">
              <button 
                className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create Quiz
              </button>
              <button 
                className={`nav-link ${activeTab === 'assign' ? 'active' : ''}`}
                onClick={() => setActiveTab('assign')}
              >
                <i className="bi bi-send me-2"></i>
                Assign Quiz
              </button>
              <button 
                className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                <i className="bi bi-graph-up me-2"></i>
                View Results
              </button>
              <button 
                className={`nav-link ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage')}
              >
                <i className="bi bi-list-ul me-2"></i>
                Manage Quizzes
              </button>
            </nav>
          </div>
        </div>

        {/* Create Quiz Tab */}
        {activeTab === 'create' && (
          <div className="card border-0 policy-card mb-4">
            <div className="card-header policy-card-header">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-plus-circle me-2"></i>
                Create New Quiz
              </h5>
            </div>
            <div className="card-body">
              <form className="row g-3" onSubmit={createQuiz}>
                <div className="col-md-6">
                  <label className="form-label form-label-enhanced">
                    <i className="bi bi-card-text me-1"></i>
                    Quiz Title
                  </label>
                  <input
                    className="form-control form-control-enhanced"
                    required
                    value={qForm.title}
                    onChange={(e) => setQForm({ ...qForm, title: e.target.value })}
                    placeholder="e.g., Security Awareness Quiz"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label form-label-enhanced">
                    <i className="bi bi-people me-1"></i>
                    Target Roles
                  </label>
                  <select
                    className="form-select form-control-enhanced"
                    multiple
                    value={qForm.roles}
                    onChange={(e) =>
                      setQForm({
                        ...qForm,
                        roles: Array.from(e.target.selectedOptions).map((o) => o.value),
                      })
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="form-text form-text-enhanced">
                    <i className="bi bi-info-circle me-1"></i>
                    Hold Ctrl/Cmd to select multiple roles.
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label form-label-enhanced">
                    <i className="bi bi-text-paragraph me-1"></i>
                    Description
                  </label>
                  <input
                    className="form-control form-control-enhanced"
                    value={qForm.description}
                    onChange={(e) => setQForm({ ...qForm, description: e.target.value })}
                    placeholder="Brief description of the quiz"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label form-label-enhanced">
                    <i className="bi bi-clock me-1"></i>
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="form-control form-control-enhanced"
                    value={qForm.timeLimitMinutes}
                    onChange={(e) => setQForm({ ...qForm, timeLimitMinutes: Number(e.target.value) })}
                    placeholder="0 for no limit"
                  />
                  <div className="form-text form-text-enhanced">0 = no time limit</div>
                </div>

                <div className="col-md-3">
                  <label className="form-label form-label-enhanced">
                    <i className="bi bi-award me-1"></i>
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="form-control form-control-enhanced"
                    value={qForm.passingScore}
                    onChange={(e) => setQForm({ ...qForm, passingScore: Number(e.target.value) })}
                  />
                  <div className="form-text form-text-enhanced">Percentage required to pass the quiz</div>
                </div>

                {qForm.questions.map((q, qi) => (
                  <div className="col-12" key={qi}>
                    <div className="card border-0 question-card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-semibold mb-0">
                            <i className="bi bi-question-circle me-2"></i>
                            Question {qi + 1}
                          </h6>
                          {qForm.questions.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeQuestion(qi)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <input
                            className="form-control form-control-enhanced"
                            value={q.text}
                            onChange={(e) => {
                              const qs = [...qForm.questions];
                              qs[qi] = { ...qs[qi], text: e.target.value };
                              setQForm({ ...qForm, questions: qs });
                            }}
                            placeholder="Enter your question here..."
                            required
                          />
                        </div>
                        
                        <div className="row g-2">
                          {q.options.map((op, oi) => (
                            <div className="col-md-6" key={oi}>
                              <label className="form-label form-label-enhanced">
                                <i className="bi bi-list-ul me-1"></i>
                                Option {oi + 1}
                                {q.correctIndex === oi && (
                                  <span className="badge bg-success-subtle text-success ms-2">
                                    <i className="bi bi-check-circle-fill me-1"></i>
                                    Correct
                                  </span>
                                )}
                              </label>
                              <input
                                className="form-control form-control-enhanced"
                                value={op}
                                onChange={(e) => {
                                  const qs = [...qForm.questions];
                                  const opts = [...qs[qi].options];
                                  opts[oi] = e.target.value;
                                  qs[qi] = { ...qs[qi], options: opts };
                                  setQForm({ ...qForm, questions: qs });
                                }}
                                placeholder={`Option ${oi + 1}`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3">
                          <label className="form-label form-label-enhanced mb-2">
                            <i className="bi bi-check-circle me-1"></i>
                            Correct Answer
                          </label>
                          <div className="d-flex gap-2">
                            {[0, 1, 2, 3].map((i) => (
                              <label className="form-check form-check-inline" key={i}>
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={`correct_${qi}`}
                                  checked={q.correctIndex === i}
                                  onChange={() => {
                                    const qs = [...qForm.questions];
                                    qs[qi] = { ...qs[qi], correctIndex: i };
                                    setQForm({ ...qForm, questions: qs });
                                  }}
                                />
                                <span className="form-check-label">Option {i + 1}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="col-12 d-flex gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-enhanced" 
                    onClick={addQuestion}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Question
                  </button>
                  <button className="btn btn-primary btn-enhanced" disabled={savingQuiz}>
                    {savingQuiz ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Save Quiz
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Quiz Tab */}
        {activeTab === 'assign' && (
          <div className="card border-0 policy-card mb-4">
            <div className="card-header policy-card-header">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-send me-2"></i>
                Assign Quiz to Users
              </h5>
            </div>
            <div className="card-body">
              <form className="row g-3" onSubmit={assignQuiz}>
                <div className="col-md-4">
                  <label className="form-label form-label-enhanced">
                    <i className="bi bi-patch-question me-1"></i>
                    Select Quiz
                  </label>
                  <select
                    key={selectKey}
                    className="form-select form-control-enhanced"
                    value={aForm.quizId}
                    onChange={(e) => setAForm({ ...aForm, quizId: e.target.value })}
                    required
                  >
                    <option value="">Choose a quiz...</option>
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label form-label-enhanced">
                    <i className="bi bi-bullseye me-1"></i>
                    Assignment Target
                  </label>
                  <select
                    className="form-select form-control-enhanced"
                    value={aForm.targetType}
                    onChange={(e) => setAForm({ ...aForm, targetType: e.target.value })}
                  >
                    <option value="roles">By Role(s)</option>
                    <option value="users">Specific User(s)</option>
                  </select>
                </div>

                {aForm.targetType === "roles" ? (
                  <div className="col-md-3">
                    <label className="form-label form-label-enhanced">
                      <i className="bi bi-people me-1"></i>
                      Select Roles
                    </label>
                    <select
                      className="form-select form-control-enhanced"
                      multiple
                      value={aForm.roles}
                      onChange={(e) =>
                        setAForm({
                          ...aForm,
                          roles: Array.from(e.target.selectedOptions).map((o) => o.value),
                        })
                      }
                      required
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-md-3">
                    <label className="form-label form-label-enhanced">
                      <i className="bi bi-person me-1"></i>
                      User IDs
                    </label>
                    <input
                      className="form-control form-control-enhanced"
                      placeholder="uid1, uid2, uid3..."
                      value={aForm.userIds}
                      onChange={(e) => setAForm({ ...aForm, userIds: e.target.value })}
                      required
                    />
                    <div className="form-text form-text-enhanced">
                      Separate multiple user IDs with commas
                    </div>
                  </div>
                )}

                <div className="col-md-2">
                  <label className="form-label form-label-enhanced">
                    <i className="bi bi-calendar-event me-1"></i>
                    Due Date
                  </label>
                  <input
                    className="form-control form-control-enhanced"
                    type="date"
                    value={aForm.dueDate}
                    onChange={(e) => setAForm({ ...aForm, dueDate: e.target.value })}
                  />
                </div>

                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary btn-enhanced" disabled={savingAssign}>
                    {savingAssign ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Assigning…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Assign Quiz & Notify Users
                      </>
                    )}
                  </button>
                </div>
              </form>

              <hr className="my-4" />
              <h5 className="fw-semibold mb-3">
                <i className="bi bi-list-check me-2"></i>
                Recent Assignments
              </h5>

              <div className="table-responsive">
                <table className="table policy-table align-middle">
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>Target</th>
                      <th>Due Date</th>
                      <th>Created</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id} className="policy-row">
                        <td>{mapQuizTitle[a.quizId] || a.quizId}</td>
                        <td>
                          {a.targetType === "roles"
                            ? (a.roles || []).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")
                            : `${(a.userIds || []).length} specific user(s)`}
                        </td>
                        <td>
                          {a.dueDate
                            ? formatDate(a.dueDate)
                            : "No deadline"}
                        </td>
                        <td>{formatDate(a.createdAt)}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-danger btn-action"
                            onClick={() => deleteAssignment(a.id)}
                            disabled={deletingId === a.id}
                          >
                            {deletingId === a.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1"></span>
                                Deleting…
                              </>
                            ) : (
                              <>
                                <i className="bi bi-trash me-1"></i>
                                Delete
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-secondary empty-state">
                          <div className="py-4">
                            <i className="bi bi-inbox display-4 mb-3 d-block"></i>
                            <p className="mb-0">No quiz assignments found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="card border-0 policy-card mb-4">
            <div className="card-header policy-card-header">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-graph-up me-2"></i>
                Quiz Results & Analytics
              </h5>
            </div>
            <div className="card-body">
              {!selectedQuizResults ? (
                <div>
                  <p className="text-muted mb-4">Select a quiz to view detailed results and user performance.</p>
                  <div className="row g-3">
                    {quizzes.map((quiz) => {
                      const quizResultsCount = quizResults.filter(r => r.quizId === quiz.id).length;
                      return (
                        <div key={quiz.id} className="col-md-6 col-lg-4">
                          <div className="card quiz-results-card">
                            <div className="card-body">
                              <h6 className="fw-semibold mb-2">{quiz.title}</h6>
                              <p className="small text-muted mb-3">{quiz.description || "No description"}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="badge bg-info-subtle text-info">
                                  {quizResultsCount} Result{quizResultsCount !== 1 ? 's' : ''}
                                </span>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => loadQuizResults(quiz.id)}
                                  disabled={loadingResults}
                                >
                                  {loadingResults ? (
                                    <span className="spinner-border spinner-border-sm me-1"></span>
                                  ) : (
                                    <i className="bi bi-eye me-1"></i>
                                  )}
                                  View Results
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h6 className="fw-semibold mb-1">
                        Results for: {mapQuizTitle[selectedQuizResults[0]?.quizId] || "Unknown Quiz"}
                      </h6>
                      <p className="text-muted small mb-0">{selectedQuizResults.length} submissions</p>
                    </div>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setSelectedQuizResults(null)}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Back to Quiz List
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table policy-table align-middle">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Time Taken</th>
                          <th>Submitted At</th>
                          <th className="text-end">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuizResults.map((result) => {
                          const totalQuestions = result.totalQuestions || result.answers?.length || 0;
                          const percentage = totalQuestions > 0 ? Math.round((result.score / totalQuestions) * 100) : 0;
                          const scoreColor = getScoreColor(result.score, totalQuestions);
                          
                          return (
                            <tr key={result.id} className="policy-row">
                              <td>
                                <div className="fw-semibold">{result.userName || result.userId}</div>
                                <small className="text-muted">{result.userEmail || result.userId}</small>
                              </td>
                              <td>
                                <span className={`badge bg-${scoreColor}-subtle text-${scoreColor}`}>
                                  {result.score}/{totalQuestions}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                    <div 
                                      className={`progress-bar bg-${scoreColor}`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="small">{percentage}%</span>
                                </div>
                              </td>
                              <td>
                                {result.timeSpent ? `${Math.round(result.timeSpent / 60)} min` : "—"}
                              </td>
                              <td>{formatDate(result.createdAt)}</td>
                              <td className="text-end">
                                <span className={`badge bg-${scoreColor}-subtle text-${scoreColor}`}>
                                  {percentage >= 80 ? "Excellent" : percentage >= 60 ? "Passed" : "Needs Review"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {selectedQuizResults.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-secondary empty-state">
                              <div className="py-4">
                                <i className="bi bi-graph-up display-4 mb-3 d-block"></i>
                                <p className="mb-0">No quiz results yet</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage Quizzes Tab */}
        {activeTab === 'manage' && (
          <div className="card border-0 policy-card">
            <div className="card-header policy-card-header">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-list-ul me-2"></i>
                Manage Existing Quizzes
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table policy-table align-middle">
                  <thead>
                    <tr>
                      <th>Quiz Details</th>
                      <th>Target Roles</th>
                      <th>Questions</th>
                      <th>Time / Passing</th>
                      <th>Results</th>
                      <th>Created</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((q) => {
                      const resultsCount = quizResults.filter(r => r.quizId === q.id).length;
                      const assignmentsCount = assignments.filter(a => a.quizId === q.id).length;
                      
                      return (
                        <tr key={q.id} className="policy-row">
                          <td>
                            <div className="fw-semibold policy-title-cell">{q.title}</div>
                            <div className="small text-secondary">{q.description || "No description"}</div>
                            {assignmentsCount > 0 && (
                              <span className="badge bg-primary-subtle text-primary mt-1">
                                {assignmentsCount} Assignment{assignmentsCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td className="small">
                            {q.roles?.length > 0 ? 
                              q.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ") : 
                              "No roles assigned"
                            }
                          </td>
                          <td>
                            <span className="badge bg-info-subtle text-info">
                              {q.questions?.length || 0} Question{(q.questions?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="small">
                            <div>{q.timeLimitMinutes && q.timeLimitMinutes > 0 ? `${q.timeLimitMinutes} min` : 'No limit'}</div>
                            <div className="text-muted">Pass: {q.passingScore ?? 70}%</div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-success-subtle text-success">
                                {resultsCount} Result{resultsCount !== 1 ? 's' : ''}
                              </span>
                              {resultsCount > 0 && (
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => loadQuizResults(q.id)}
                                  disabled={loadingResults}
                                >
                                  <i className="bi bi-eye me-1"></i>
                                  View
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="small">
                            {formatDate(q.createdAt)}
                          </td>
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              <button
                                className="btn btn-sm btn-outline-primary btn-action"
                                onClick={() => {
                                  setAForm(prev => ({ ...prev, quizId: q.id }));
                                  setActiveTab('assign');
                                }}
                                title="Assign this quiz"
                              >
                                <i className="bi bi-send"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger btn-action"
                                onClick={() => deleteQuiz(q.id, q.title)}
                                disabled={deletingId === q.id}
                                title="Delete quiz, assignments, and results"
                              >
                                {deletingId === q.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <i className="bi bi-trash"></i>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {quizzes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-secondary empty-state">
                          <div className="py-4">
                            <i className="bi bi-inbox display-4 mb-3 d-block"></i>
                            <p className="mb-0">No quizzes found</p>
                            <button 
                              className="btn btn-primary mt-2"
                              onClick={() => setActiveTab('create')}
                            >
                              <i className="bi bi-plus-circle me-2"></i>
                              Create Your First Quiz
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="small text-secondary mt-3">
                <i className="bi bi-info-circle me-1"></i>
                Deleting a quiz will also remove all related assignments and user results.
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* Enhanced Quiz Management Styles */
        .policies-header {
          padding: 1.5rem 0;
          border-bottom: 2px solid rgba(var(--bs-primary-rgb), 0.1);
          margin-bottom: 2rem !important;
        }

        .policies-title {
          color: var(--bs-primary);
          font-size: 2rem;
          font-weight: 700;
          text-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* Navigation Tabs */
        .quiz-nav {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border-radius: 12px;
          padding: 0.5rem;
        }

        .quiz-nav .nav-link {
          border: none;
          border-radius: 8px;
          color: var(--bs-secondary);
          transition: all 0.3s ease;
          font-weight: 500;
          margin: 0 0.25rem;
        }

        .quiz-nav .nav-link:hover {
          background: rgba(var(--bs-primary-rgb), 0.1);
          color: var(--bs-primary);
          transform: translateY(-1px);
        }

        .quiz-nav .nav-link.active {
          background: var(--bs-primary);
          color: white;
          box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.3);
        }

        /* Quiz Cards */
        .question-card {
          background: linear-gradient(135deg, rgba(var(--bs-light-rgb), 0.8), rgba(var(--bs-light-rgb), 0.4));
          border-radius: 16px;
          border-left: 4px solid var(--bs-primary);
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }

        .question-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .quiz-results-card {
          border: 2px solid rgba(var(--bs-primary-rgb), 0.1);
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .quiz-results-card:hover {
          border-color: var(--bs-primary);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }

        /* Enhanced Form Controls */
        .policy-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .policy-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 48px rgba(0,0,0,0.12);
        }

        .policy-card-header {
          background: linear-gradient(135deg, var(--bs-primary), #0056b3);
          color: white;
          border: none !important;
          padding: 1.25rem 1.5rem;
          font-weight: 600;
        }

        .form-label-enhanced {
          font-weight: 600;
          color: var(--bs-dark);
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .form-control-enhanced,
        .form-select {
          border: 2px solid rgba(var(--bs-primary-rgb), 0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.9);
        }

        /* Ensure select dropdowns are readable in dark mode and have consistent text color */
        .form-select option {
          color: inherit;
          background: inherit;
        }
        .form-select[multiple] {
          min-height: 120px;
        }

        .form-control-enhanced:focus,
        .form-select:focus {
          border-color: var(--bs-primary);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.15);
          background: white;
          transform: translateY(-1px);
        }

        .form-text-enhanced {
          color: var(--bs-secondary);
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
        }

        .btn-enhanced {
          border-radius: 20px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
          border-width: 2px;
          display: inline-flex;
          align-items: center;
        }

        .btn-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .btn-action {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
        }

        .btn-action:hover {
          transform: translateY(-1px);
        }

        /* Table Styles */
        .policy-table {
          margin: 0;
        }

        .policy-table thead th {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border: none;
          font-weight: 600;
          color: var(--bs-dark);
          padding: 1rem;
          border-radius: 0;
          position: relative;
        }

        .policy-table thead th::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--bs-primary), transparent);
        }

        .policy-row {
          transition: all 0.3s ease;
        }

        .policy-row:hover {
          background: rgba(var(--bs-primary-rgb), 0.02);
          transform: scale(1.002);
        }

        .policy-row td {
          padding: 1rem;
          border-color: rgba(0,0,0,0.05);
          vertical-align: middle;
        }

        .policy-title-cell {
          color: var(--bs-dark);
          font-size: 1.1rem;
        }

        .empty-state {
          padding: 3rem 1rem !important;
        }

        .empty-state i {
          color: var(--bs-secondary);
          opacity: 0.5;
        }

        .alert-enhanced {
          border: none;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          font-weight: 500;
        }

        /* Progress bars */
        .progress {
          background-color: rgba(0,0,0,0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-bar {
          transition: width 0.3s ease;
        }

        /* Badge Styles */
        .badge {
          font-weight: 500;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.75rem;
        }

        .bg-primary-subtle { background-color: #dbeafe !important; }
        .text-primary { color: #2563eb !important; }
        .bg-success-subtle { background-color: #dcfce7 !important; }
        .text-success { color: #16a34a !important; }
        .bg-warning-subtle { background-color: #fef3c7 !important; }
        .text-warning { color: #d97706 !important; }
        .bg-danger-subtle { background-color: #fee2e2 !important; }
        .text-danger { color: #dc2626 !important; }
        .bg-info-subtle { background-color: #dbeafe !important; }
        .text-info { color: #0891b2 !important; }

        /* Dark theme adjustments */
        [data-bs-theme="dark"] .policies-title {
          color: white;
        }
        
        [data-bs-theme="dark"] .policy-title-cell {
          color: var(--bs-light) !important;
        }

        [data-bs-theme="dark"] .form-label-enhanced {
          color: var(--bs-light);
        }

        [data-bs-theme="dark"] .policy-card {
          background: rgba(33, 37, 41, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        [data-bs-theme="dark"] .question-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        }

        [data-bs-theme="dark"] .form-control-enhanced,
        [data-bs-theme="dark"] .form-select {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: var(--bs-light);
        }

        /* Dark mode select option visibility */
        [data-bs-theme="dark"] .form-select option {
          color: var(--bs-light) !important;
          background: rgba(0,0,0,0.5) !important;
        }

        [data-bs-theme="dark"] .form-control-enhanced:focus,
        [data-bs-theme="dark"] .form-select:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--bs-primary);
        }

        [data-bs-theme="dark"] .policy-table thead th {
          background: linear-gradient(135deg, #2c3034, #1a1d20);
          color: var(--bs-light);
        }

        [data-bs-theme="dark"] .policy-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        [data-bs-theme="dark"] .quiz-nav {
          background: linear-gradient(135deg, #2c3034, #1a1d20);
        }

        [data-bs-theme="dark"] .quiz-results-card {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .policies-title {
            font-size: 1.5rem;
          }
          
          .btn-enhanced {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
          }
          
          .policy-card-header {
            padding: 1rem;
          }

          .quiz-nav .nav-link {
            font-size: 0.875rem;
            padding: 0.5rem 0.75rem;
          }
        }

        /* Animation for loading states */
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
        }
      `}</style>
    </>
  );
}