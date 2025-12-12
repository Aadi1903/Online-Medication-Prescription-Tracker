import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function AdminPrescriptionsOverview() {
  const [pres, setPres] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    return onSnapshot(collection(db, "prescriptions"), (snap) => {
      setPres(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const pending = pres.filter((p) => p.status === "pending");
  const approved = pres.filter((p) => p.status === "approved");

  const filtered =
    filterStatus === "all"
      ? pres
      : pres.filter((p) => p.status === filterStatus);

  return (
    <div style={{ width: "100%", height: "100%", padding: 10 }}>

      {/* HEADING + FILTER ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Prescription Overview</h2>

        {/* FILTER (small + right aligned) */}
        <select
          className="input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            width: 160,
            padding: "5px 8px",
            fontSize: 14,
            position: "relative",
          }}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* EVERYTHING BELOW SHOULD SCROLL */}
      <div
        className="hide-scrollbar"
        style={{
          overflowY: "scroll",
          maxHeight: "75vh",
          marginTop: 15,
          paddingRight: 5,
          paddingBottom: 80,
        }}
      >
        {/* ANALYTICS CARDS */}
        <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
          <div className="dash-card">
            <h3>{pending.length}</h3>
            <p>Pending Prescriptions</p>
          </div>

          <div className="dash-card">
            <h3>{approved.length}</h3>
            <p>Approved Prescriptions</p>
          </div>

          <div className="dash-card">
            <h3>{new Set(pres.map((p) => p.doctorId)).size}</h3>
            <p>Doctors With Prescriptions</p>
          </div>
        </div>

        {/* LIST */}
        {filtered.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#111",
              padding: 15,
              borderRadius: 12,
              marginBottom: 10,
              border: "1px solid #222",
            }}
          >
            <p><strong>Doctor:</strong> {p.doctorName}</p>
            <p><strong>Patient:</strong> {p.patientEmail}</p>
            <p><strong>Status:</strong> {p.status}</p>
            <p><strong>Total Medicines:</strong> {p.medicines?.length}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
