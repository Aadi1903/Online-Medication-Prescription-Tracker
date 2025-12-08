import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const fetchPres = async () => {
      const userId = auth.currentUser.uid;

      const presRef = collection(db, "prescriptions");

      const q = query(
        presRef,
        where("patientId", "==", userId),
        where("status", "==", "approved")
      );

      const snap = await getDocs(q);

      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrescriptions(list);
    };

    fetchPres();
  }, []);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>My Prescriptions</h2>

      {prescriptions.length === 0 && <p>No approved prescriptions yet.</p>}

      {prescriptions.map((item) => (
        <div
          key={item.id}
          style={{
            background: "#111",
            padding: "20px",
            margin: "15px 0",
            borderRadius: "10px",
            border: "1px solid #333",
          }}
        >
          <h3>Prescription</h3>

          {/* DOCTOR INFO */}
          <p><strong>Doctor:</strong> {item.doctorName}</p>
          <p><strong>Specialization:</strong> {item.specialization}</p>

          <p>
            <strong>Date:</strong>{" "}
            {item.createdAt?.toDate?.() &&
              item.createdAt.toDate().toLocaleString()}
          </p>

          <h4 style={{ marginTop: "15px" }}>Medicines</h4>

          {item.medicines?.map((m, i) => (
            <div
              key={i}
              style={{
                background: "#181818",
                padding: "15px",
                borderRadius: "10px",
                marginTop: "10px",
              }}
            >
              <p><strong>Name:</strong> {m.name}</p>
              <p><strong>Dosage:</strong> {m.dosage}</p>
              <p><strong>Duration:</strong> {m.duration}</p>
              <p><strong>Instructions:</strong> {m.instructions}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
