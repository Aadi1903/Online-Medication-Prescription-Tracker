import React, { useState } from "react";
import UsersTab from "./UsersTab";
import AdminPrescriptionsOverview from "./AdminPrescriptionsOverview";
import { User } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="hide-scrollbar" style={{ padding: "20px", color: "white", maxWidth: "1200px", margin: "0 auto", height: "100vh", overflowY: "auto" }}>

      {/* HEADER MATCHING DOCTOR DASHBOARD */}
      <div className="dashboard-header" style={{ marginBottom: "40px" }}>

        {/* TITLE IN CENTER */}
        <h1 className="dashboard-title">
          Online Medication & Prescription Tracker
        </h1>
        {/* <p style={{ fontSize: "1.1rem", opacity: 0.6, marginTop: "0.1px" }}>
          Stay consistent to keep your adherence score high!
        </p> */}

        {/* ADMIN PROFILE BELOW (LEFT ALIGNED) */}
        <div className="dashboard-profile" style={{ justifyContent: "flex-start" }}>
          <User size={30} color="#00D675" />
          <span className="profile-name">Admin</span>
        </div>
      </div>

      {/* CUSTOM TAB SWITCHER */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "40px",
        background: "rgba(255,255,255,0.03)",
        padding: "6px",
        borderRadius: "16px",
        width: "fit-content",
        margin: "0 auto 40px",
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            padding: "12px 40px",
            borderRadius: "12px",
            border: "none",
            background: activeTab === "users" ? "#00D675" : "transparent",
            color: activeTab === "users" ? "#000" : "#888",
            fontSize: "1rem",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            border: activeTab === "users" ? "1px solid rgba(0, 214, 117, 0.3)" : "none"
          }}
        >
          Manage Users
        </button>

        <button
          onClick={() => setActiveTab("prescriptions")}
          style={{
            padding: "12px 40px",
            borderRadius: "12px",
            border: "none",
            background: activeTab === "prescriptions" ? "#00D675" : "transparent",
            color: activeTab === "prescriptions" ? "#000" : "#888",
            fontSize: "1rem",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            border: activeTab === "prescriptions" ? "1px solid rgba(0, 214, 117, 0.3)" : "none"
          }}
        >
          Prescriptions
        </button>
      </div>

      {/* TAB CONTENT */}
      <div style={{ minHeight: "60vh" }}>
        {activeTab === "users" && <UsersTab />}
        {activeTab === "prescriptions" && <AdminPrescriptionsOverview />}
      </div>
    </div>
  );
}
