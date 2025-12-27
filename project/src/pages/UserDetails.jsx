import React from "react";
import { X, User, Mail, Calendar, Shield, Stethoscope, Briefcase, FileBadge, Activity, Building, MapPin } from "lucide-react";

export default function UserDetails({ user, onClose }) {
  const getRoleTheme = (role) => {
    return { color: "#00D675", bg: "rgba(0, 214, 117, 0.1)" };
  };

  const theme = getRoleTheme(user.role);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px"
      }}
    >
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          maxWidth: "450px",
          borderRadius: "32px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            zIndex: 10
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.05)"}
        >
          <X size={20} />
        </button>

        {/* HEADER AREA */}
        <div style={{ padding: "40px 30px 20px", textAlign: "center", background: "linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#fff", margin: "0 0 5px 0" }}>{user.fullName}</h2>
          <div style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "100px",
            background: theme.bg,
            color: theme.color,
            fontSize: "0.8rem",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            {user.role}
          </div>
        </div>

        {/* DETAILS GRID */}
        <div style={{ padding: "0 30px 40px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <DetailItem label="Email Address" value={user.email} />
          <DetailItem label="Joined System" value={user.createdAt} />

          {user.role === "doctor" && (
            <>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "10px 0" }}></div>
              <DetailItem label="Specialization" value={user.specialization} />
              <DetailItem label="Experience" value={user.experience} />
              <DetailItem label="License Number" value={user.licenseNumber} />
            </>
          )}

          {user.role === "patient" && (
            <>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "10px 0" }}></div>
              <DetailItem label="Age" value={user.age} />
              <DetailItem label="Medical History" value={user.medicalHistory} />
            </>
          )}

          {user.role === "pharmacist" && (
            <>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "10px 0" }}></div>
              <DetailItem label="Shop Name" value={user.shopName} />
              <DetailItem label="Shop Address" value={user.shopAddress} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "15px",
      padding: "12px 16px",
      background: "rgba(255,255,255,0.02)",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.04)"
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <div style={{ fontSize: "1rem", color: "#fff", fontWeight: "500" }}>{value || "Not specified"}</div>
      </div>
    </div>
  );
}
