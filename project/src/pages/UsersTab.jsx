import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import UserDetails from "./UserDetails";

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [popupUser, setPopupUser] = useState(null);
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const doctors = users.filter((u) => u.role === "doctor");
  const patients = users.filter((u) => u.role === "patient");
  const pharmacists = users.filter((u) => u.role === "pharmacist");
  const admins = users.filter((u) => u.role === "admin");

  const filteredUsers =
    filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  return (
    <div style={{ width: "100%", height: "80vh", padding: 10 }}>

      {/* HEADING + FILTER ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Users Overview</h2>

        {/* Filter on RIGHT */}
        <select
          className="input"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ width: 160, padding: "5px 8px", fontSize: 14 }}
        >
          <option value="all">All Users</option>
          <option value="doctor">Doctors</option>
          <option value="patient">Patients</option>
          <option value="pharmacist">Pharmacists</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* EVERYTHING BELOW SCROLLS */}
      <div
        className="hide-scrollbar"
        style={{
          overflowY: "scroll",
          maxHeight: "72vh",
          marginTop: 15,
          paddingRight: 5,
          paddingBottom: 80,
        }}
      >
        {/* Stats Cards */}
        <div style={{ display: "flex", gap: 20, marginBottom: 15 }}>
          <div className="dash-card">
            <h3>{doctors.length}</h3>
            <p>Doctors</p>
          </div>
          <div className="dash-card">
            <h3>{patients.length}</h3>
            <p>Patients</p>
          </div>
          <div className="dash-card">
            <h3>{pharmacists.length}</h3>
            <p>Pharmacists</p>
          </div>
          <div className="dash-card">
            <h3>{admins.length}</h3>
            <p>Admins</p>
          </div>
        </div>

        {/* USER LIST */}
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            style={{
              background: "#111",
              padding: 15,
              borderRadius: 12,
              marginBottom: 10,
              border: "1px solid #222",
            }}
          >
            <p><strong>{u.fullName}</strong></p>
            <p style={{ opacity: 0.7 }}>{u.email}</p>

            <button className="btn" onClick={() => setPopupUser(u)}>
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* POPUP */}
      {popupUser && (
        <UserDetails user={popupUser} onClose={() => setPopupUser(null)} />
      )}
    </div>
  );
}
