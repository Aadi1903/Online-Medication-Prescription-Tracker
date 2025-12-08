import React, { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

export default function LoginForm({ switchToSignup, showToast }) {
  const [form, setForm] = useState({ email: "", password: "" });

  async function submit(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      showToast("Logged in successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Login failed", "error");
    }
  }

  async function googleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("Google sign-in successful!", "success");
    } catch (err) {
      console.error(err);
      showToast("Google sign-in failed", "error");
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2 className="title">Login</h2>

      <input
        className="input"
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />

      <input
        className="input"
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />

      <button className="btn" type="submit">Log In</button>

      {/* GOOGLE LOGIN */}
      <button type="button" className="gbtn" onClick={googleLogin}>
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="g-icon"
        />
        Sign in with Google
      </button>

      <p className="muted">
        No account?{" "}
        <button type="button" className="link" onClick={switchToSignup}>
          Sign up
        </button>
      </p>
    </form>
  );
}
