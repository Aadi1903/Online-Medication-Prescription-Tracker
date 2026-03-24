// Client popup Google provider flow
import React from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

export default function GoogleSignInButton({ onSuccess }) {
  async function signIn() {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      // res.user available
      if (onSuccess) onSuccess(res.user);
    } catch (err) {
      console.error("Google sign in error:", err);
      alert("Google sign in failed");
    }
  }

  return (
    <button className="gbtn" onClick={signIn}>
      Sign in with Google
    </button>
  );
}
