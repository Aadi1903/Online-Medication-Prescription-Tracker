import React, { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Toast from "./components/Toast";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Toast state
  const [toast, setToast] = useState(null);

  // Toast function
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="center">Loading...</div>;

  return (
    <>
      {/* Toast UI */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Pass showToast to children */}
      {user ? (
        <Dashboard user={user} showToast={showToast} />
      ) : (
        <AuthPage showToast={showToast} />
      )}
    </>
  );
}
