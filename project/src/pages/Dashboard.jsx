import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import BottomNav from "../components/BottomNav";
import PrescriptionManager from "./PrescriptionManager";
import DoctorDashboard from "./DoctorDashboard";
import DoctorReminders from "./DoctorReminders";



export default function Dashboard({ user }) {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={{ height: "100vh", paddingBottom: "70px" }}>
      {/* MAIN CONTENT */}
      <div style={{ padding: "20px" }}>
        {page === "dashboard" && <DoctorDashboard />}
        {page === "prescriptions" && <PrescriptionManager />}
        {page === "reminders" && <DoctorReminders />}

        {page === "profile" && (
          <div>
            <h2>Profile</h2>
            <p>Name: {user.displayName || user.email}</p>
            <p>Email: {user.email}</p>
            <button className="btn" onClick={() => signOut(auth)}>Logout</button>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <BottomNav current={page} setCurrent={setPage} />
    </div>
  );
}
