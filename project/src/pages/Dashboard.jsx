import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import BottomNav from "../components/BottomNav";

export default function Dashboard({ user }) {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={{ height: "100vh", paddingBottom: "70px" }}>
      {/* MAIN CONTENT */}
      <div style={{ padding: "20px" }}>
        {page === "dashboard" && <h2>Dashboard</h2>}
        {page === "prescriptions" && <h2>Prescriptions Page</h2>}
        {page === "reminders" && <h2>Reminders Page</h2>}
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
