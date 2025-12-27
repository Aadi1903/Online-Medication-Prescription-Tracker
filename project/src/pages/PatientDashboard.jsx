import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { User } from "lucide-react";

export default function PatientDashboard({ setPage }) {
  const [userName, setUserName] = useState("Patient");
  const [prescriptions, setPrescriptions] = useState([]);
  const [reminders, setReminders] = useState([]);

  // Stats
  const [takenCount, setTakenCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [adherenceScore, setAdherenceScore] = useState(100);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Fetch User Name
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) setUserName(snap.data().fullName || "Patient");
    });

    // 2. Combined Listener for Prescriptions and Reminders (Robust Filtering)
    const qPresc = query(
      collection(db, "prescriptions"),
      where("patientEmail", "==", user.email)
    );
    const qRem = query(
      collection(db, "reminders"),
      where("patientId", "==", user.uid)
    );

    let activePresIds = new Set();
    let latestRemData = [];

    const updateAnalytics = (reminders, activeIds) => {
      // Robust Filtering: Only use reminders that belong to an existing prescription
      const data = reminders.filter(r => activeIds.has(r.prescriptionId));

      // Calculate Stats
      const taken = data.filter(r => r.status === "taken").length;
      const missed = data.filter(r => r.status === "skipped").length;
      const total = taken + missed;
      const score = total === 0 ? 100 : Math.round((taken / total) * 100);

      setReminders(data.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      }));
      setTakenCount(taken);
      setMissedCount(missed);
      setAdherenceScore(score);
    };

    const unsubPresc = onSnapshot(qPresc, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPrescriptions(list);
      activePresIds = new Set(list.map(d => d.id));
      updateAnalytics(latestRemData, activePresIds);
    });

    const unsubRem = onSnapshot(qRem, (snapshot) => {
      latestRemData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      updateAnalytics(latestRemData, activePresIds);
    });

    return () => {
      unsubPresc();
      unsubRem();
    };
  }, []);

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

        {/* PATIENT PROFILE BELOW (LEFT ALIGNED) */}
        <div className="dashboard-profile" style={{ justifyContent: "flex-start" }}>
          <User size={30} color="#00D675" />
          <span className="profile-name">{userName}</span>
        </div>



      </div>

      {/* STATS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px", marginBottom: "40px" }}>

        {/* -- CARD 1: PRESCRIPTIONS RECEIVED -- */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>PRESCRIPTIONS GOT</h3>
          <div style={{ fontSize: "3.5rem", fontWeight: "900", color: "#fff" }}>
            {prescriptions.length}
          </div>
          <p style={{ margin: "5px 0 0 0", opacity: 0.5, fontSize: "0.9rem" }}>Active plans assigned by doctors</p>
        </div>

        {/* -- CARD 2: ADHERENCE SCORE -- */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>HEALTH SCORE</h3>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            <div style={{ position: "relative", width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Simple CSS Circle */}
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: `conic-gradient(${adherenceScore >= 80 ? "#00D675" : adherenceScore >= 50 ? "#ffa500" : "#ff5252"} ${adherenceScore}%, rgba(255,255,255,0.1) 0)`
              }}></div>
              <div style={{
                position: "absolute", width: "85%", height: "85%", background: "#111", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column"
              }}>
                <span style={{ fontSize: "1.8rem", fontWeight: "800", color: "#fff" }}>{adherenceScore}%</span>
              </div>
            </div>
          </div>
          <p style={{ margin: "5px 0 0 0", opacity: 0.5, fontSize: "0.9rem" }}>
            {adherenceScore === 100 ? "Perfect streak! 🎉" : adherenceScore >= 80 ? "Doing great! Keep it up." : "Try not to miss doses."}
          </p>
        </div>

        {/* -- CARD 3: DOSES MISSED -- */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>DOSES MISSED</h3>
          <div style={{ fontSize: "3.5rem", fontWeight: "900", color: missedCount > 0 ? "#ff5252" : "#00D675" }}>
            {missedCount}
          </div>
          <p style={{ margin: "5px 0 0 0", opacity: 0.5, fontSize: "0.9rem" }}>
            {missedCount === 0 ? "You haven't missed any!" : "Doses marked as skipped"}
          </p>
        </div>

      </div>

      {/* RECENT ACTIVITY LOG */}
      <div style={{ ...cardStyle, minHeight: "200px" }}>
        <h3 style={{ ...cardTitleStyle, marginBottom: "20px" }}>RECENT ACTIVITY</h3>

        {reminders.length === 0 ? (
          <p style={{ opacity: 0.5, fontStyle: "italic" }}>No activity recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reminders.slice(0, 3).map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", padding: "12px 16px",
                background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)"
              }}>
                <div style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: r.status === "taken" ? "#00D675" : "#ff5252",
                  marginRight: "15px"
                }}></div>

                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: "600", color: "#fff", display: "block" }}>{r.medicineName}</span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>
                    {r.status === "taken" ? "Marked as Taken" : "Skipped Dose"}
                  </span>
                </div>

                <div style={{ fontSize: "0.8rem", opacity: 0.4 }}>
                  {r.timestamp?.seconds ? new Date(r.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                </div>
              </div>
            ))}
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <span
                onClick={() => setPage("reminders")}
                style={{ fontSize: "0.8rem", color: "#00D675", cursor: "pointer", opacity: 0.8 }}
              >
                View Full History in Reminders Tab →
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

const cardStyle = {
  background: "rgba(20, 20, 20, 0.6)",
  backdropFilter: "blur(12px)",
  padding: "30px",
  borderRadius: "24px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
};

const cardTitleStyle = {
  fontSize: "0.85rem",
  fontWeight: "700",
  letterSpacing: "1.2px",
  color: "#aaa",
  marginBottom: "10px",
  textTransform: "uppercase"
};
