// web/src/hooks/useSystemSettings.js
import { useEffect, useMemo, useState } from "react";
import { getFirestore, collection, doc, onSnapshot } from "firebase/firestore";

const DEFAULT_SETTINGS = {
  security: {
    sessionTimeoutMins: 30,
  },
};

export default function useSystemSettings() {
  const db = useMemo(() => getFirestore(), []);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = doc(collection(db, "app_settings"), "system");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : DEFAULT_SETTINGS;
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        setLoading(false);
      },
      (err) => {
        setError(err?.message || String(err));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db]);

  return { settings, loading, error };
}


