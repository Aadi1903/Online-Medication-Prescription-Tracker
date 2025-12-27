import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import UserDetails from "./UserDetails";
import { Users, UserCog, Stethoscope, BriefcaseMedical, Search, Filter } from "lucide-react";

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [popupUser, setPopupUser] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const doctors = users.filter((u) => u.role === "doctor");
  const patients = users.filter((u) => u.role === "patient");
  const pharmacists = users.filter((u) => u.role === "pharmacist");
  const admins = users.filter((u) => u.role === "admin");

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesSearch = u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div style={{ width: "100%", padding: "10px" }}>

      {/* ─────────── BENTO GRID STATS ─────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginBottom: "40px"
      }}>
        <StatCard count={doctors.length} label="Doctors" color="#00D675" />
        <StatCard count={patients.length} label="Patients" color="#00D675" />
        <StatCard count={pharmacists.length} label="Pharmacists" color="#00D675" />
        <StatCard count={admins.length} label="Admins" color="#00D675" />
      </div>

      {/* ─────────── SEARCH & FILTER BAR ─────────── */}
      <div style={{
        display: "flex",
        gap: "15px",
        marginBottom: "30px",
        background: "rgba(255,255,255,0.02)",
        padding: "20px",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.05)",
        alignItems: "center"
      }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "12px 12px 12px 45px",
              color: "white",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.3s ease"
            }}
          />
        </div>

        <div style={{ position: "relative", width: "220px" }}>
          <Filter size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "12px 12px 12px 45px",
              color: "white",
              fontSize: "1rem",
              outline: "none",
              appearance: "none",
              cursor: "pointer"
            }}
          >
            <option value="all" style={{ background: "#111" }}>All roles</option>
            <option value="doctor" style={{ background: "#111" }}>Doctors</option>
            <option value="patient" style={{ background: "#111" }}>Patients</option>
            <option value="pharmacist" style={{ background: "#111" }}>Pharmacists</option>
            <option value="admin" style={{ background: "#111" }}>Admins</option>
          </select>
        </div>
      </div>

      {/* ─────────── USER GRID ─────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "20px",
        paddingBottom: "100px"
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px", opacity: 0.4 }}>
            <Users size={48} style={{ marginBottom: "15px", opacity: 0.2 }} />
            <p style={{ fontSize: "1.2rem" }}>No users found matching your search.</p>
          </div>
        ) : (
          filteredUsers.map((u) => (
            <UserCard key={u.id} user={u} onDetails={() => setPopupUser(u)} />
          ))
        )}
      </div>

      {/* POPUP */}
      {popupUser && (
        <UserDetails user={popupUser} onClose={() => setPopupUser(null)} />
      )}
    </div>
  );
}

function StatCard({ count, label, color }) {
  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.03)",
      padding: "25px",
      borderRadius: "20px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      textAlign: "center"
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
      }}
    >
      <div style={{ fontSize: "2.5rem", fontWeight: "900", color: color || "#fff", lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: "0.8rem", color: "#666", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
    </div>
  );
}

function UserCard({ user, onDetails }) {
  const getRoleTheme = (role) => {
    return { color: "#00D675", bg: "rgba(0, 214, 117, 0.1)" };
  };

  const theme = getRoleTheme(user.role);

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.02)",
      padding: "25px",
      borderRadius: "24px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      display: "flex",
      flexDirection: "column",
      gap: "20px"
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: "50px",
          height: "50px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          fontWeight: "800",
          color: theme.color,
          border: `1px solid ${theme.color}30`
        }}>
          {user.fullName?.charAt(0) || "U"}
        </div>
        <span style={{
          fontSize: "0.75rem",
          padding: "5px 12px",
          borderRadius: "100px",
          background: theme.bg,
          color: theme.color,
          textTransform: "uppercase",
          letterSpacing: "1px",
          fontWeight: "800"
        }}>
          {user.role}
        </span>
      </div>

      <div>
        <div style={{
          fontSize: "1.3rem",
          fontWeight: "700",
          color: "#fff",
          marginBottom: "4px"
        }}>
          {user.fullName}
        </div>
        <div style={{ fontSize: "0.95rem", color: "#555" }}>{user.email}</div>
      </div>

      <button
        onClick={onDetails}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent",
          color: "#fff",
          fontSize: "0.95rem",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "#fff";
          e.target.style.color = "#000";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "transparent";
          e.target.style.color = "#fff";
        }}
      >
        View Details
      </button>
    </div>
  );
}
