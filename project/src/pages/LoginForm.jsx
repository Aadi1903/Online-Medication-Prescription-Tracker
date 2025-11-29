import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginForm({ switchToSignup }) {
  const [form, setForm] = useState({ email: "", password: "" });

  async function submit(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
    } catch (err) {
      console.error(err);
      alert(err.message || "Login failed");
    }
  }

  async function googleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      alert("Google Sign-in failed");
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

      {/* GOOGLE BUTTON HERE */}
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
