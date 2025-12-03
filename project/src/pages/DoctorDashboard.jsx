import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { User } from "lucide-react";

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [adherence, setAdherence] = useState(0);

  useEffect(() => {
    if (!auth?.currentUser) return;
    const uid = auth.currentUser.uid;

    // Fetch doctor's profile
    const userRef = collection(db, "users");
    const qUser = query(userRef, where("uid", "==", uid));
    const unsubUser = onSnapshot(qUser, (snap) => {
      const data = snap.docs[0]?.data();
      setDoctor(data);
    });

    // Fetch prescriptions belonging to doctor
    const presRef = collection(db, "prescriptions");
    const qPres = query(presRef, where("doctorId", "==", uid));
    const unsubPres = onSnapshot(qPres, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPrescriptions(list);

      setStats({
        total: list.length,
        approved: list.filter((p) => p.status === "approved").length,
        pending: list.filter((p) => p.status === "pending").length,
      });
    });

    return () => {
      unsubUser();
      unsubPres();
    };
  }, []);

  const formatDate = (ts) => {
    if (!ts) return "-";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="doctor-dashboard">

      {/* ─────────── DASHBOARD HEADER ─────────── */}
<div className="dashboard-header">

  {/* TITLE IN CENTER */}
  <h1 className="dashboard-title">
    Online Medication & Prescription Tracker
  </h1>

  {/* DOCTOR PROFILE BELOW (LEFT ALIGNED) */}
  <div className="dashboard-profile">
    <User size={30} color="#00D675" />
    <span className="profile-name">Dr. {doctor?.fullName || "Doctor"}</span>
  </div>

</div>


      {/* ─────────── STAT CARDS ─────────── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Prescriptions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{adherence}%</div>
          <div className="stat-label">Avg Patient Adherence</div>
        </div>
      </div>

      {/* ─────────── PENDING TABLE ─────────── */}
      <section className="pending-section">
        <h2>Pending Prescriptions</h2>

        {prescriptions.filter((p) => p.status === "pending").length === 0 ? (
          <p className="empty-note">No pending prescriptions 🎉</p>
        ) : (
          <div className="table-wrap">
            <table className="pres-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Medicines</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions
                  .filter((p) => p.status === "pending")
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{p.patientId}</td>
                      <td>{p.medicines.map((m) => m.name).join(", ")}</td>
                      <td>{formatDate(p.createdAt)}</td>
                      <td style={{ color: "#f0a500" }}>Pending</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
