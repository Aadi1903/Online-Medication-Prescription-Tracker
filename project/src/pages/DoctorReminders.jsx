import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function DoctorReminders() {
  const [adherence, setAdherence] = useState(0);
  const [patientStats, setPatientStats] = useState([]);
  const [topMissed, setTopMissed] = useState([]);

  useEffect(() => {
    const uid = auth.currentUser.uid;

    const remRef = collection(db, "reminders");
    const q = query(remRef, where("doctorId", "==", uid));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

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
          patientMap[r.patientId] = { total: 0, taken: 0 };
        }
        patientMap[r.patientId].total += 1;
        if (r.taken) patientMap[r.patientId].taken += 1;
      });

      const patientList = Object.keys(patientMap).map((id) => ({
        patientId: id,
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
      }));

      setTopMissed(missedList);
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 20, color: "white" }}>

      <h2>Reminder Analytics</h2>

      {/* Overall adherence */}
      <div style={cardStyle}>
        <h3>{adherence}%</h3>
        <p>Overall Patient Adherence</p>
      </div>

      {/* Patient adherence list */}
      <h3 style={{ marginTop: 30 }}>Patient-wise Adherence</h3>
      {patientStats.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No reminder data available yet.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Adherence %</th>
              <th>Missed Doses</th>
            </tr>
          </thead>
          <tbody>
            {patientStats.map((p) => (
              <tr key={p.patientId}>
                <td>{p.patientId}</td>
                <td>{p.percent}%</td>
                <td>{p.missed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Most missed medicines */}
      <h3 style={{ marginTop: 30 }}>Most Missed Medicines</h3>
      {topMissed.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No missed medicine data.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Missed Count</th>
            </tr>
          </thead>
          <tbody>
            {topMissed.map((m) => (
              <tr key={m.medicine}>
                <td>{m.medicine}</td>
                <td>{m.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}

const cardStyle = {
  background: "#111",
  padding: 20,
  borderRadius: 12,
  width: "250px",
  textAlign: "center",
  border: "1px solid #222",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 10,
};

