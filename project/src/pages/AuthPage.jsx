import React, { useState } from "react";
import SignupForm from "./SignupForm";
import LoginForm from "./LoginForm";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  return (
    <div className="page">
      {mode === "login" ? (
        <LoginForm switchToSignup={() => setMode("signup")} />
      ) : (
        <SignupForm switchToLogin={() => setMode("login")} />
      )}
    </div>
  );
}
