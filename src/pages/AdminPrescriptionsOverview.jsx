import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { FileText, Clock, CheckCircle, ListFilter, Search } from "lucide-react";

export default function AdminPrescriptionsOverview() {
  const [pres, setPres] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    return onSnapshot(collection(db, "prescriptions"), (snap) => {
      setPres(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const pending = pres.filter((p) => p.status === "pending");
  const approved = pres.filter((p) => p.status === "approved");

  const filtered = pres.filter((p) => {
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesSearch = p.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ width: "100%", padding: "10px" }}>

      {/* ─────────── ANALYTICS CARDS ─────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
        marginBottom: "40px"
      }}>
        <PresStatCard count={pending.length} label="Pending" color="#00D675" />
        <PresStatCard count={approved.length} label="Approved" color="#00D675" />
        <PresStatCard count={pres.length} label="Total Managed" color="#00D675" />
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
            placeholder="Search by doctor or patient email..."
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
            }}
          />
        </div>

        <div style={{ position: "relative", width: "220px" }}>
          <ListFilter size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
            <option value="all" style={{ background: "#111" }}>All Statuses</option>
            <option value="pending" style={{ background: "#111" }}>Pending</option>
            <option value="approved" style={{ background: "#111" }}>Approved</option>
          </select>
        </div>
      </div>

      {/* ─────────── PRESCRIPTION GRID ─────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "20px",
        paddingBottom: "100px"
      }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px", opacity: 0.4 }}>
            <FileText size={48} style={{ marginBottom: "15px", opacity: 0.2 }} />
            <p style={{ fontSize: "1.2rem" }}>No prescriptions found matching your search.</p>
          </div>
        ) : (
          filtered.map((p) => (
            <PrescriptionCard key={p.id} pres={p} />
          ))
        )}
      </div>
    </div>
  );
}

function PresStatCard({ count, label, color }) {
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

function PrescriptionCard({ pres }) {
  const statusColor = "#00D675";

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.02)",
      padding: "25px",
      borderRadius: "24px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      display: "flex",
      flexDirection: "column",
      gap: "15px"
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          fontSize: "0.8rem",
          color: "#666",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          Ref: {pres.id.slice(-6).toUpperCase()}
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.75rem",
          fontWeight: "800",
          color: statusColor,
          background: `${statusColor}15`,
          padding: "4px 12px",
          borderRadius: "100px",
          textTransform: "uppercase"
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColor }}></div>
          {pres.status}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "0.8rem", color: "#444", width: "70px" }}>DOCTOR</div>
          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>{pres.doctorName}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "0.8rem", color: "#444", width: "70px" }}>PATIENT</div>
          <div style={{ fontSize: "1rem", fontWeight: "600", color: "#aaa" }}>{pres.patientEmail}</div>
        </div>
      </div>

      <div style={{
        marginTop: "10px",
        paddingTop: "15px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {pres.medicines?.slice(0, 3).map((m, i) => (
            <div key={i} style={{
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#00D675",
            }}>
              {m.name}{i < Math.min(pres.medicines.length, 3) - 1 ? "," : ""}
            </div>
          ))}
          {pres.medicines?.length > 3 && (
            <div style={{ fontSize: "0.85rem", color: "#444" }}>
              +{pres.medicines.length - 3} more
            </div>
          )}
        </div>
        <div style={{ fontSize: "0.9rem", color: "#fff", fontWeight: "700" }}>
          {pres.medicines?.length || 0} items
        </div>
      </div>
    </div>
  );
}
