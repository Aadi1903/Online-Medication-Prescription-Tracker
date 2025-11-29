import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function SignupForm({ switchToLogin }) {
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  function onChange(e) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // set display name
      await updateProfile(userCred.user, { displayName: form.fullName });

      const profile = {
        uid: userCred.user.uid,
        fullName: form.fullName,
        email: form.email,
        role,
        createdAt: new Date().toISOString(),
      };

      if (role === "doctor") {
        profile.licenseNumber = document.getElementById("license")?.value || "";
        profile.specialization = document.getElementById("specialization")?.value || "";
      }
      if (role === "pharmacist") {
        profile.shopName = document.getElementById("shopName")?.value || "";
        profile.shopAddress = document.getElementById("shopAddress")?.value || "";
      }
      if (role === "patient") {
        profile.age = document.getElementById("age")?.value || null;
        profile.medicalHistory = document.getElementById("medicalHistory")?.value || "";
      }

      await setDoc(doc(db, "users", userCred.user.uid), profile);

      alert("Registered successfully.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Registration failed");
    }
  }

  async function googleSignup() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const profile = {
        uid: user.uid,
        fullName: user.displayName || "",
        email: user.email,
        role: "patient", // default role
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), profile, { merge: true });

      alert("Google Sign-up successful");
    } catch (err) {
      console.error("Google signup error:", err);
      alert("Google sign-in failed");
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2 className="title">Sign Up</h2>

      <input name="fullName" onChange={onChange} className="input" placeholder="Full Name" required />
      <input name="email" onChange={onChange} type="email" className="input" placeholder="Email" required />
      <input name="password" onChange={onChange} type="password" className="input" placeholder="Password" required />

      <select className="input" value={role} onChange={(e) => setRole(e.target.value)} required>
        <option value="">Role</option>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
        <option value="pharmacist">Pharmacist</option>
        <option value="admin">Admin</option>
      </select>

      {role === "doctor" && <>
        <input id="license" className="input" placeholder="Medical License Number" />
        <input id="specialization" className="input" placeholder="Specialization" />
      </>}

      {role === "pharmacist" && <>
        <input id="shopName" className="input" placeholder="Shop Name" />
        <input id="shopAddress" className="input" placeholder="Shop Address" />
      </>}

      {role === "patient" && <>
        <input id="age" className="input" type="number" placeholder="Age" />
        <textarea id="medicalHistory" className="input text" placeholder="Medical History" />
      </>}

      <button className="btn" type="submit">Sign Up</button>

      {/* Google Sign-up button */}
      <button type="button" className="gbtn" onClick={googleSignup}>
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          className="g-icon"
          alt="Google"
        />
        Sign up with Google
      </button>

      <p className="muted">
        Already have an account?{" "}
        <button type="button" className="link" onClick={switchToLogin}>Log in</button>
      </p>
    </form>
  );
}
