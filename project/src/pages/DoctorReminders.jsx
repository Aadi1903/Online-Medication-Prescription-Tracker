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
        return;
      }

      // TOTAL TAKEN VS TOTAL DOSES
      const taken = data.filter((r) => r.taken === true).length;
      setAdherence(Math.round((taken / data.length) * 100));

      // PATIENT-WISE ADHERENCE
      const patientMap = {};
      data.forEach((r) => {
        if (!patientMap[r.patientId]) {
          patientMap[r.patientId] = { total: 0, taken: 0, name: r.patientName || "Unknown" };
        }
        patientMap[r.patientId].total += 1;
        if (r.taken) patientMap[r.patientId].taken += 1;
      });

      const patientList = Object.keys(patientMap).map((id) => ({
        patientId: id,
        patientName: patientMap[id].name,
        percent: Math.round((patientMap[id].taken / patientMap[id].total) * 100),
        missed: patientMap[id].total - patientMap[id].taken,
      }));

      setPatientStats(patientList);

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
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#fff", margin: 0 }}>
          Reminder Analytics
        </h2>
        <p style={{ color: "#9aa19a", marginTop: 10, fontSize: "1.1rem" }}>
          Monitor patient adherence and identify frequently missed medications.
        </p>
      </div>

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
                      <td style={{ color: "#4facfe", fontWeight: "600" }}>{p.patientName}</td>
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

