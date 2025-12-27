import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function PatientReminders({ showToast }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
  const prevPrescCount = useRef(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen for prescriptions
    const qPresc = query(
      collection(db, "prescriptions"),
      where("patientEmail", "==", user.email)
    );

    const unsubPresc = onSnapshot(qPresc, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (prevPrescCount.current !== 0 && list.length > prevPrescCount.current) {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        if (showToast) showToast("New prescription received!", "success");
      }

      setPrescriptions(list);
      prevPrescCount.current = list.length;
      setLoading(false);
    });

    // Listen for adherence history
    const qRem = query(
      collection(db, "reminders"),
      where("patientId", "==", user.uid)
    );

    const unsubRem = onSnapshot(qRem, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReminders(list);
    });

    return () => {
      unsubPresc();
      unsubRem();
    };
  }, []);

  const handleStatusUpdate = async (presc, medicine, status) => {
    try {
      await addDoc(collection(db, "reminders"), {
        patientId: auth.currentUser.uid,
        patientName: presc.patientName,
        doctorId: presc.doctorId,
        medicineName: medicine.name,
        prescriptionId: presc.id,
        taken: status === "taken",
        status: status,
        timestamp: serverTimestamp(),
      });
      if (showToast) {
        showToast(`${medicine.name} marked as ${status}!`, status === "taken" ? "success" : "info");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      if (showToast) showToast("Failed to update status", "error");
    }
  };

  const getDoseStats = (prescId, medName) => {
    const medReminders = reminders.filter(r => r.prescriptionId === prescId && r.medicineName === medName);
    const taken = medReminders.filter(r => r.status === "taken").length;
    const skipped = medReminders.filter(r => r.status === "skipped").length;
    return { taken, skipped, totalLogged: taken + skipped };
  };

  const getLimit = (m) => {
    // Try to parse duration first as "Total Count" based on user context
    const dur = parseInt(m.duration);
    if (!isNaN(dur) && dur > 0) return dur;

    // Fallback to dosage if duration is not a number
    const dos = parseInt(m.dosage);
    if (!isNaN(dos) && dos > 0) return dos;

    return Infinity; // No limit found
  };

  if (loading) return <div style={{ padding: 20, color: "white", }}>Loading reminders...</div>;

  return (
    <div
      className="hide-scrollbar"
      style={{
        padding: "40px 20px",
        color: "white",
        maxWidth: "1300px",
        margin: "0 auto",
        height: "100vh",
        overflowY: "auto"
      }}
    >
      <h2 style={{ textAlign: "center" }}>
        My Medication Reminders
      </h2>

      {prescriptions.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ opacity: 0.6, textAlign: "center", fontSize: "1.1rem" }}>No active prescriptions found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "30px" }}>
          {prescriptions.map((p) => {
            // Fix doctor name fallback
            const displayDoctorName = p.doctorName || p.doctorFullName || "Doctor";

            return (
              <div key={p.id} style={cardStyle}>
                {/* Doctor Header */}
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 30, paddingBottom: 20 }}>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: "1.5rem", fontWeight: "600" }}>
                    Dr. {displayDoctorName}
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontSize: "1.2rem", opacity: 0.8, color: "#00D675", fontWeight: "600" }}>{p.specialization || "General Physician"}</span>
                    <span style={{ fontSize: "1rem", opacity: 0.5 }}>{p.patientEmail}</span>
                  </div>
                </div>

                {/* Medicines List */}
                <div style={{ display: "grid", gap: "30px" }}>
                  {p.medicines.map((m, idx) => {
                    const stats = getDoseStats(p.id, m.name);
                    const limit = getLimit(m);
                    const isCompleted = stats.taken >= limit;

                    return (
                      <div key={idx} style={{
                        ...medicineEntryStyle,
                        opacity: isCompleted ? 0.6 : 1,
                        filter: isCompleted ? "grayscale(100%)" : "none",
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1.5fr 1fr", // 3 Columns
                        gap: "30px",
                        alignItems: "center"
                      }}>

                        {/* COLUMN 1: BASIC INFO */}
                        <div>
                          <span style={{ fontSize: "0.85rem", color: "#00D675", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>Medicine</span>
                          <h4 style={{ margin: "5px 0 15px 0", fontSize: "2.1rem", color: "#fff", fontWeight: "700" }}>{m.name}</h4>

                          <div style={{ display: "flex", gap: "40px" }}>
                            <div>
                              <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block", marginBottom: 5 }}>DOSAGE</span>
                              <strong style={{ fontSize: "1.3rem", color: "#00D675" }}>{m.dosage}</strong>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block", marginBottom: 5 }}>DURATION</span>
                              <strong style={{ fontSize: "1.3rem", opacity: 0.9, fontWeight: "500" }}>{m.duration}</strong>
                            </div>
                          </div>
                        </div>

                        {/* COLUMN 2: INSTRUCTIONS */}
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "15px", height: "70%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Instructions</span>
                          <p style={{ margin: 0, fontSize: "1.1rem", color: "#ddd", lineHeight: "1.6" }}>
                            {m.instructions || "No special instructions provided."}
                          </p>
                        </div>

                        {/* COLUMN 3: STATS & ACTIONS */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "flex-end", justifyContent: "center" }}>

                          {/* Stats Row */}
                          <div style={{ display: "flex", gap: "30px", textAlign: "right" }}>
                            <div>
                              <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block" }}>TAKEN</span>
                              <span style={{ fontSize: "1.8rem", fontWeight: "900", color: "#00D675" }}>
                                {stats.taken} <span style={{ fontSize: "1rem", color: "#555" }}>{limit !== Infinity ? `/ ${limit}` : ""}</span>
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block" }}>SKIPPED</span>
                              <span style={{ fontSize: "1.8rem", fontWeight: "900", color: "#ff5252" }}>
                                {stats.skipped}
                              </span>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div style={{ display: "flex", gap: "15px", width: "100%", justifyContent: "flex-end" }}>
                            {isCompleted ? (
                              <div style={{ color: "#00D675", fontWeight: "700", border: "1px solid #00D675", padding: "12px 24px", borderRadius: "12px", background: "rgba(0,214,117,0.05)" }}>
                                COMPLETED
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(p, m, "taken")}
                                  className="btn"
                                  style={{ ...btnStyle, background: "#00D675", color: "#000", padding: "12px 24px", fontSize: "1rem", flex: 1 }}
                                >
                                  Taken
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(p, m, "skipped")}
                                  className="btn"
                                  style={{ ...btnStyle, background: "transparent", border: "1px solid #ff5252", color: "#ff5252", padding: "12px 24px", fontSize: "1rem", flex: 1 }}
                                >
                                  Skipped
                                </button>
                              </>
                            )}
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: "#111",
  backdropFilter: "blur(20px)",
  padding: "45px",
  borderRadius: "20px",
  border: "1px solid #222",
  overflow: "hidden",
  width: "100%",
  maxWidth: "1100px",
  margin: "0 auto",
};

const medicineEntryStyle = {
  display: "flex",
  flexDirection: "column",
  background: "rgba(255, 255, 255, 0.03)",
  padding: "30px",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  transition: "all 0.3s ease",
};

const btnStyle = {
  borderRadius: "10px",
  border: "none",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
  outline: "none",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};
