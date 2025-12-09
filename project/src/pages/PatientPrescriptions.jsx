import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const userEmail = auth.currentUser.email;

    const presRef = collection(db, "prescriptions");

    const q = query(
      presRef,
      where("patientEmail", "==", userEmail),
      where("status", "==", "approved")
    );

    // ✅ REAL-TIME LISTENER (NO REFRESH NEEDED)
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();

          // ✅ BACK-FILL DOCTOR NAME IF MISSING
          if (!data.doctorName && data.doctorId) {
            const docSnap = await getDoc(doc(db, "users", data.doctorId));
            if (docSnap.exists()) {
              const doctorData = docSnap.data();
              data.doctorName = doctorData?.fullName || "Not Available";
              data.specialization =
                doctorData?.specialization || data.specialization || "Not Available";
            }
          }

          return { id: d.id, ...data };
        })
      );

      setPrescriptions(list);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* ✅ HIDE SCROLLBAR CSS */}
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* ✅ SCROLLABLE CENTER CONTAINER */}
      <div
        className="hide-scrollbar"
        style={{
          padding: "20px",
          color: "white",
          height: "calc(100vh - 120px)", // ✅ FULL HEIGHT WITH NAV SAFE
          overflowY: "auto",            // ✅ SCROLL FIX
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2>My Prescriptions</h2>

        {prescriptions.length === 0 && <p>No approved prescriptions yet.</p>}

        {prescriptions.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#111",
              padding: "20px",
              margin: "15px 0",
              borderRadius: "12px",
              border: "1px solid #333",
              width: "50%",
              minWidth: "360px",
            }}
          >
            <h3>Prescription</h3>

            <p><strong>Doctor:</strong> {item.doctorName || "Not Available"}</p>
            <p><strong>Specialization:</strong> {item.specialization || "Not Available"}</p>

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
    </>
  );
}
