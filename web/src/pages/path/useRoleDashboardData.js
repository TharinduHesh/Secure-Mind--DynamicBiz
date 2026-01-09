import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// A reusable hook that centralizes the data subscriptions used by role dashboards.
// Call: const data = useRoleDashboardData(role)
// Returned shape: { user, userProfile, loading, facts, policies, policyAcks, quizAssignments, quizzes, fetchQuizIfNeeded, markFactRead, acknowledgePolicy, getUserDisplayName }
export default function useRoleDashboardData(roleParam) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [facts, setFacts] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [policyAcks, setPolicyAcks] = useState([]);
  const [factReads, setFactReads] = useState([]);
  const [quizAssignments, setQuizAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const db = useMemo(() => getFirestore(), []);

  // Auth state + load user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        // let caller handle routing, but navigate to login as a sensible default
        try { navigate('/login'); } catch(e) { /* ignore when hook is used outside router */ }
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) setUserProfile(userDoc.data());
      } catch (err) {
        console.error('useRoleDashboardData: error fetching user profile', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [db, navigate]);

  // Helper to determine effective role (explicit param wins, else user profile)
  const effectiveRole = (roleParam && String(roleParam).toLowerCase()) || (userProfile?.role && String(userProfile.role).toLowerCase()) || null;

  // Facts subscription
  useEffect(() => {
    if (!user) return;

    const factsQuery = query(collection(db, "facts"));
    const unsub = onSnapshot(factsQuery, (snapshot) => {
      const allFacts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = allFacts.filter(fact => {
        const roles = fact.roles || fact.targetRoles || [];
        if (!roles || roles.length === 0) return true;
        if (!effectiveRole) return true;
        return roles.some(r => r && String(r).toLowerCase() === effectiveRole);
      });
      setFacts(filtered);
    }, (err) => {
      console.error('useRoleDashboardData: facts subscription error', err);
      setFacts([]);
    });

    return () => unsub();
  }, [user, db, effectiveRole]);

  // Policies subscription
  useEffect(() => {
    if (!user || !userProfile) return;

    const policiesQuery = query(collection(db, "policies"), where("status", "==", "published"));
    const unsub = onSnapshot(policiesQuery, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = all.filter(policy => {
        const roles = policy.roles || [];
        if (!roles || roles.length === 0) return true;
        if (!effectiveRole) return true;
        return roles.some(r => r && String(r).toLowerCase() === effectiveRole);
      });
      setPolicies(filtered);
    }, (err) => {
      console.error('useRoleDashboardData: policies subscription error', err);
      setPolicies([]);
    });

    return () => unsub();
  }, [user, userProfile, db, effectiveRole]);

  // Policy acknowledgements for the user
  useEffect(() => {
    if (!user) return;
    const acksQuery = query(collection(db, "policy_acks"), where("userId", "==", user.uid));
    const unsub = onSnapshot(acksQuery, (snapshot) => {
      const acks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPolicyAcks(acks);
    }, (err) => {
      console.error('useRoleDashboardData: policy_acks subscription error', err);
      setPolicyAcks([]);
    });

    return () => unsub();
  }, [user, db]);

  // Fact reads for the user (to toggle Mark Read state)
  useEffect(() => {
    if (!user) return;
    const readsQuery = query(collection(db, "fact_reads"), where("userId", "==", user.uid));
    const unsub = onSnapshot(readsQuery, (snapshot) => {
      const reads = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFactReads(reads);
    }, (err) => {
      console.error('useRoleDashboardData: fact_reads subscription error', err);
      setFactReads([]);
    });

    return () => unsub();
  }, [user, db]);

  // Quiz assignments
  useEffect(() => {
    if (!user || !userProfile) return;

    const assignmentsQuery = query(collection(db, "quiz_assignments"));
    const unsub = onSnapshot(assignmentsQuery, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = all.filter(assignment => {
        if (!assignment.targetType) return true;
        if (assignment.targetType === 'all') return true;
        if (assignment.targetType === 'roles') {
          const roles = assignment.roles || [];
          if (!effectiveRole) return true;
          return roles.some(r => r && String(r).toLowerCase() === effectiveRole);
        }
        if (assignment.targetType === 'users') {
          const userIds = assignment.userIds || [];
          return userIds.includes(user.uid);
        }
        return true;
      });
      setQuizAssignments(filtered);
    }, (err) => {
      console.error('useRoleDashboardData: quiz_assignments subscription error', err);
      setQuizAssignments([]);
    });

    return () => unsub();
  }, [user, userProfile, db, effectiveRole]);

  // Quizzes collection (only published quizzes for non-admin clients)
  useEffect(() => {
    if (!user) return;

    const quizzesQuery = query(collection(db, "quizzes"), where("published", "==", true));
    const unsub = onSnapshot(quizzesQuery, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = all.filter(quiz => {
        const roles = quiz.roles || [];
        if (!roles || roles.length === 0) return true;
        if (!effectiveRole) return true;
        return roles.some(r => r && String(r).toLowerCase() === effectiveRole);
      });
      setQuizzes(filtered);
    }, (err) => {
      console.error('useRoleDashboardData: quizzes subscription error', err);
      setQuizzes([]);
    });

    return () => unsub();
  }, [user, db, effectiveRole]);

  const fetchQuizIfNeeded = async (quizId) => {
    try {
      const snap = await getDoc(doc(db, 'quizzes', quizId));
      if (snap.exists()) return { id: snap.id, ...snap.data() };
    } catch (e) {
      console.warn('useRoleDashboardData: failed to fetch quiz', quizId, e);
    }
    return null;
  };

  const markFactRead = async (factId) => {
    if (!user) return;
    try {
      const optimisticId = `${user.uid}_${factId}`;
      // Optimistic UI update
      setFactReads((prev) => {
        if (prev.some(r => r.factId === factId)) return prev;
        return [...prev, { id: optimisticId, userId: user.uid, userEmail: user.email, factId, readAt: new Date() }];
      });
      await setDoc(doc(db, "fact_reads", `${user.uid}_${factId}`), {
        userId: user.uid,
        userEmail: user.email,
        factId,
        readAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('useRoleDashboardData: error marking fact read', err);
      // Revert optimistic update on error
      setFactReads((prev) => prev.filter(r => r.factId !== factId));
    }
  };

  const acknowledgePolicy = async (policyId, policyTitle) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "policy_acks", `${user.uid}_${policyId}`), {
        userId: user.uid,
        userEmail: user.email,
        policyId,
        policyTitle,
        acknowledgedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('useRoleDashboardData: error acknowledging policy', err);
    }
  };

  const getUserDisplayName = () => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (user?.displayName) return user.displayName;
    if (userProfile?.employeeName) return userProfile.employeeName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return {
    user,
    userProfile,
    loading,
    facts,
    factReads,
    policies,
    policyAcks,
    quizAssignments,
    quizzes,
    fetchQuizIfNeeded,
    markFactRead,
    acknowledgePolicy,
    getUserDisplayName,
    effectiveRole,
  };
}
