import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function DoctorReminders() {
  const [adherence, setAdherence] = useState(0);
  const [patientStats, setPatientStats] = useState([]);
  const [topMissed, setTopMissed] = useState([]);

  useEffect(() => {
    const uid = auth.currentUser.uid;

    const presRef = collection(db, "prescriptions");
    const presQ = query(presRef, where("doctorId", "==", uid));

    const remRef = collection(db, "reminders");
    const remQ = query(remRef, where("doctorId", "==", uid));

    let activePresIds = new Set();
    let latestRemData = [];

    const updateAnalytics = (reminders, activeIds) => {
      const data = reminders.filter(r => activeIds.has(r.prescriptionId));

      if (data.length === 0) {
        setAdherence(0);
        setPatientStats([]);
        setTopMissed([]);
        setAlerts([]);
        return;
      }

      // TOTAL TAKEN VS TOTAL DOSES
      const taken = data.filter((r) => r.taken === true).length;
      setAdherence(Math.round((taken / data.length) * 100));

      // PATIENT-WISE ADHERENCE
      const patientMap = {};
      data.forEach((r) => {
        if (!patientMap[r.patientId]) {
          patientMap[r.patientId] = { total: 0, taken: 0, name: r.patientName || "Unknown", email: r.patientEmail || "" };
        }
        patientMap[r.patientId].total += 1;
        if (r.taken) patientMap[r.patientId].taken += 1;
      });

      const threshold = 70;
      const patientList = Object.keys(patientMap).map((id) => {
        const percent = Math.round((patientMap[id].taken / patientMap[id].total) * 100);
        return {
          patientId: id,
          patientName: patientMap[id].name,
          patientEmail: patientMap[id].email,
          percent: percent,
          missed: patientMap[id].total - patientMap[id].taken,
          isCritical: percent < threshold
        };
      });

      setPatientStats(patientList);
      setAlerts(patientList.filter(p => p.isCritical));

      // MOST MISSED MEDICINES
      const medCount = {};
      data.forEach((r) => {
        if (!r.taken) {
          if (!medCount[r.medicineName]) medCount[r.medicineName] = 0;
          medCount[r.medicineName] += 1;
        }
      });

      const missedList = Object.keys(medCount).map((m) => ({
        medicine: m,
        count: medCount[m],
      })).sort((a, b) => b.count - a.count);

      setTopMissed(missedList);
    };

    const unsubPres = onSnapshot(presQ, (pSnap) => {
      activePresIds = new Set(pSnap.docs.map(d => d.id));
      updateAnalytics(latestRemData, activePresIds);
    });

    const unsubRem = onSnapshot(remQ, (rSnap) => {
      latestRemData = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateAnalytics(latestRemData, activePresIds);
    });

    return () => {
      unsubPres();
      unsubRem();
    };
  }, []);

  const [alerts, setAlerts] = useState([]);

  return (
    <div
      className="hide-scrollbar"
      style={{
        padding: "40px",
        color: "white",
        maxWidth: "1200px",
        margin: "0 auto",
        height: "100vh",
        overflowY: "auto"
      }}
    >
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <h2 style={{ paddingTop: "1px" }}>
          Reminder Analytics
        </h2>
        <p style={{ color: "#9aa19a", marginTop: 10, fontSize: "1.1rem" }}>
          Monitor patient adherence and identify frequently missed medications.
        </p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={{
          background: "rgba(255, 82, 82, 0.1)",
          border: "1px solid rgba(255, 82, 82, 0.2)",
          borderRadius: "20px",
          padding: "25px",
          marginBottom: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.5rem" }}>⚠️</span>
            <h3 style={{ margin: 0, color: "#ff5252", fontSize: "1.3rem" }}>Critical Adherence Alerts ({alerts.length})</h3>
          </div>
          <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem" }}>
            The following patients have fallen below the 70% adherence threshold and may require immediate attention.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {alerts.map(a => (
              <div key={a.patientId} style={{
                background: "rgba(255, 82, 82, 0.15)",
                padding: "8px 16px",
                borderRadius: "30px",
                border: "1px solid rgba(255, 82, 82, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span style={{ fontWeight: "700" }}>{a.patientName}</span>
                <span style={{ color: "#ff5252", fontWeight: "800" }}>{a.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall adherence card */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: 40 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: "3.5rem", fontWeight: "800", color: "#fff", textAlign: "center" }}>{adherence}%</div>
          <p style={{ margin: "5px 0 0 0", color: "#00D675", fontSize: "1rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center" }}>
            Overall Adherence
          </p>
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", marginTop: 20 }}>
            <div style={{ width: `${adherence}%`, height: "100%", background: "#00D675", borderRadius: "3px" }}></div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Patient adherence list */}
        <div style={sectionCardStyle}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1.5rem", color: "#fff" }}>Patient-wise Adherence</h3>
          {patientStats.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No reminder data available yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="pres-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th style={{ textAlign: "center" }}>Adherence %</th>
                    <th style={{ textAlign: "right" }}>Missed</th>
                  </tr>
                </thead>
                <tbody>
                  {patientStats.map((p, idx) => (
                    <tr key={p.patientId || idx}>
                      <td style={{ color: "#4facfe", fontWeight: "600" }}>
                        {p.patientName}
                        {p.isCritical && (
                          <span style={{
                            marginLeft: "10px",
                            fontSize: "0.7rem",
                            background: "#ff5252",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            textTransform: "uppercase"
                          }}>Low</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          background: p.percent > 70 ? "rgba(0, 214, 117, 0.1)" : "rgba(255, 82, 82, 0.1)",
                          color: p.percent > 70 ? "#00D675" : "#ff5252",
                          fontSize: "0.9rem",
                          fontWeight: "700"
                        }}>
                          {p.percent}%
                        </span>
                      </td>
                      <td style={{ textAlign: "right", color: p.missed > 0 ? "#ff5252" : "#fff" }}>{p.missed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Most missed medicines */}
        <div style={sectionCardStyle}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1.5rem", color: "#fff" }}>Frequently Missed</h3>
          {topMissed.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No missed medicine data available.</p>
          ) : (
            <div className="table-wrap">
              <table className="pres-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th style={{ textAlign: "right" }}>Missed Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topMissed.map((m, idx) => (
                    <tr key={m.medicine || idx}>
                      <td style={{ fontWeight: "600" }}>{m.medicine}</td>
                      <td style={{ textAlign: "right", color: "#ff5252", fontWeight: "700" }}>{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const statCardStyle = {
  background: "rgba(13, 13, 13, 0.8)",
  backdropFilter: "blur(20px)",
  padding: "30px",
  borderRadius: "24px",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  minWidth: "300px",
};

const sectionCardStyle = {
  background: "rgba(255, 255, 255, 0.02)",
  padding: "30px",
  borderRadius: "24px",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  marginBottom: "40px",
};

