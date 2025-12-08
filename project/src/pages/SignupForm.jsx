import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignupForm({ switchToLogin, showToast }) {
  const [role, setRole] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // Doctor fields
  const [doctor, setDoctor] = useState({
    licenseNumber: "",
    specialization: "",
  });

  // Pharmacist fields
  const [pharm, setPharm] = useState({
    shopName: "",
    shopAddress: "",
  });

  // Patient fields
  const [patient, setPatient] = useState({
    age: "",
    medicalHistory: "",
  });

  function handleChange(e) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  function handleDoctor(e) {
    setDoctor((d) => ({ ...d, [e.target.name]: e.target.value }));
  }

  function handlePharm(e) {
    setPharm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  function handlePatient(e) {
    setPatient((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await updateProfile(userCred.user, { displayName: form.fullName });

      const profile = {
        uid: userCred.user.uid,
        fullName: form.fullName,
        email: form.email,
        role,
        createdAt: new Date().toISOString(),
      };

      if (role === "doctor") {
        profile.licenseNumber = doctor.licenseNumber;
        profile.specialization = doctor.specialization;
      }

      if (role === "pharmacist") {
        profile.shopName = pharm.shopName;
        profile.shopAddress = pharm.shopAddress;
      }

      if (role === "patient") {
        profile.age = patient.age;
        profile.medicalHistory = patient.medicalHistory;
      }

      await setDoc(doc(db, "users", userCred.user.uid), profile);

      showToast("Account created successfully!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2 className="title">Sign Up</h2>

      <input name="fullName" onChange={handleChange} className="input" placeholder="Full Name" required />
      <input name="email" onChange={handleChange} type="email" className="input" placeholder="Email" required />
      <input name="password" onChange={handleChange} type="password" className="input" placeholder="Password" minLength={6} required />

      <select className="input" value={role} onChange={(e) => setRole(e.target.value)} required>
        <option value="">Select Role</option>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
        <option value="pharmacist">Pharmacist</option>
        <option value="admin">Admin</option>
      </select>

      {role === "doctor" && (
        <>
          <input
            name="licenseNumber"
            className="input"
            placeholder="Medical License Number"
            value={doctor.licenseNumber}
            onChange={handleDoctor}
          />
          <input
            name="specialization"
            className="input"
            placeholder="Specialization"
            value={doctor.specialization}
            onChange={handleDoctor}
          />
        </>
      )}

      {role === "pharmacist" && (
        <>
          <input
            name="shopName"
            className="input"
            placeholder="Shop Name"
            value={pharm.shopName}
            onChange={handlePharm}
          />
          <input
            name="shopAddress"
            className="input"
            placeholder="Shop Address"
            value={pharm.shopAddress}
            onChange={handlePharm}
          />
        </>
      )}

      {role === "patient" && (
        <>
          <input
            name="age"
            type="number"
            className="input"
            placeholder="Age"
            value={patient.age}
            onChange={handlePatient}
          />
          <textarea
            name="medicalHistory"
            className="input"
            placeholder="Medical History"
            value={patient.medicalHistory}
            onChange={handlePatient}
          />
        </>
      )}

      <button className="btn" type="submit">Sign Up</button>
    </form>
  );
}
