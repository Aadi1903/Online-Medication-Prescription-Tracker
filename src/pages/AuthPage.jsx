import React, { useState } from "react";
import SignupForm from "./SignupForm";
import LoginForm from "./LoginForm";

export default function AuthPage({ showToast }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'

  return (
    <div className="page">
      {mode === "login" ? (
        <LoginForm
          switchToSignup={() => setMode("signup")}
          showToast={showToast}   // ✅ FIX: PASS TO LOGIN
        />
      ) : (
        <SignupForm
          switchToLogin={() => setMode("login")}
          showToast={showToast}   // ✅ FIX: PASS TO SIGNUP
        />
      )}
    </div>
  );
}
