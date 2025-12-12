import React, { useState } from "react";
import UsersTab from "./UsersTab";
import AdminPrescriptionsOverview from "./AdminPrescriptionsOverview";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div style={{ padding: "4px", color: "white", minHeight: "100vh" }}>

      {/* DASHBOARD TITLE */}
      <h1
        style={{
          textAlign: "center",
          marginBottom: "25px",
          fontSize: "28px",
          fontWeight: "700",
          letterSpacing: "1px",
        }}
      >
        Online Medication & Prescription Tracker
      </h1>

      {/* TOP TABS */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20, justifyContent: "center" }}>
        <button
          className="btn"
          onClick={() => setActiveTab("users")}
          style={{
            background: activeTab === "users" ? "#00D675" : "#222",
            color: activeTab === "users" ? "black" : "white",
          }}
        >
          Users
        </button>

        <button
          className="btn"
          onClick={() => setActiveTab("prescriptions")}
          style={{
            background: activeTab === "prescriptions" ? "#00D675" : "#222",
            color: activeTab === "prescriptions" ? "black" : "white",
          }}
        >
          Prescriptions
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "prescriptions" && <AdminPrescriptionsOverview />}
    </div>
  );
}
