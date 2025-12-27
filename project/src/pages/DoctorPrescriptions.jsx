import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc
} from "firebase/firestore";
import { Trash2, Edit3, Plus } from "lucide-react";

export default function DoctorPrescriptions({ showToast }) {
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", duration: "", instructions: "" }
  ]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // ✅ AUTO-FILL EMAIL FROM PATIENT NAME (SKIP IF EDITING)
  useEffect(() => {
    // If we are editing an existing prescription, don't overwrite the email
    // The editingId check isn't enough because handleEdit sets it, but this effect runs when patientName changes.
    // However, if the user MANUALLY types a name, we want to fetch key. 
    // Best logic: Only fetch if patientName changed and we are NOT in the middle of setting up an edit.
    // Actually simpler: when handleEdit runs, it sets patientName, triggering this.
    // We can add a simple check: if the fetched email is different and we just started editing, maybe we should be careful.
    // BUT the user said "for emailid i have to click edit btn twice". This implies the effect resets it.

    // Fix: We'll use a ref to track if the change was programmatic (from edit)
    // For now, let's just allow the effect but make sure handleEdit sets state AFTER the effect would run?
    // impossible.
    // Better fix: check if the 'patientName' matches the 'editing' patient. 

    const fetchEmail = async () => {
      // If we are editing, we trust the prescription's email initially. 
      // User can change name, which might trigger new fetch.

      if (!patientName) return;
      if (editingId) return; // ✅ CRITICAL FIX: Don't auto-fetch if in edit mode to avoid overwriting

      const q = query(
        collection(db, "users"),
        where("name", "==", patientName),
        where("role", "==", "patient")
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        setPatientEmail(snap.docs[0].data().email);
      } else {
        setPatientEmail("");
      }
    };

    fetchEmail();
  }, [patientName, editingId]);

  // ✅ FETCH DOCTOR PRESCRIPTIONS
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const doctorId = user.uid;

    const q = query(
      collection(db, "prescriptions"),
      where("doctorId", "==", doctorId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // ✅ FIX OLD RECORDS: BACK-FILL NAME IF MISSING
          if (!data.patientName && data.patientEmail) {
            const uq = query(
              collection(db, "users"),
              where("email", "==", data.patientEmail)
            );
            const usnap = await getDocs(uq);

            if (!usnap.empty) {
              data.patientName = usnap.docs[0].data().name;

              await updateDoc(doc(db, "prescriptions", docSnap.id), {
                patientName: data.patientName
              });
            }
          }

          return { id: docSnap.id, ...data };
        })
      );

      setPrescriptions(list);
    });

    return () => unsubscribe();
  }, []);

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addMedicineField = () => {
    setMedicines([
      ...medicines,
      { name: "", dosage: "", duration: "", instructions: "" },
    ]);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this prescription?")) {
      try {
        // ✅ CASCADED DELETE: Remove associated reminders
        const q = query(collection(db, "reminders"), where("prescriptionId", "==", id));
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "reminders", d.id)));
        await Promise.all(deletePromises);

        await deleteDoc(doc(db, "prescriptions", id));
        if (showToast) showToast("Prescription and its history deleted!", "success");
      } catch (err) {
        console.error("Error deleting:", err);
        if (showToast) showToast("Failed to delete fully", "error");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (!patientName || !patientEmail) return showToast("Fill all details!", "error");

      const doctorId = auth.currentUser.uid;
      const doctorSnap = await getDoc(doc(db, "users", doctorId));
      const doctorData = doctorSnap.data();

      if (editingId) {
        // ✅ SYNC REMINDERS ON EDIT
        const oldPrescSnap = await getDoc(doc(db, "prescriptions", editingId));
        const oldData = oldPrescSnap.data();

        await updateDoc(doc(db, "prescriptions", editingId), {
          patientName,
          patientEmail,
          medicines,
          updatedAt: serverTimestamp(),
        });

        // Fetch all existing reminders for this prescription
        const remQ = query(collection(db, "reminders"), where("prescriptionId", "==", editingId));
        const remSnap = await getDocs(remQ);

        const updatePromises = remSnap.docs.map(async (remDoc) => {
          const remData = remDoc.data();
          const remRef = doc(db, "reminders", remDoc.id);

          // 1. Check if patient info changed
          const updates = {};
          if (patientName !== oldData.patientName) updates.patientName = patientName;

          // 2. Check if medicine was renamed or removed
          const currentMedNames = medicines.map(m => m.name);
          if (!currentMedNames.includes(remData.medicineName)) {
            // Medicine removed or renamed. 
            // If it was renamed, we could try to find the match, 
            // but simpler/safer: if the name is not in current list, delete reminder history for that medicine
            return deleteDoc(remRef);
          }

          if (Object.keys(updates).length > 0) {
            return updateDoc(remRef, updates);
          }
        });

        await Promise.all(updatePromises);

        if (showToast) showToast("Prescription and reminders updated!", "success");
        setEditingId(null);
      } else {
        await addDoc(collection(db, "prescriptions"), {
          doctorId,
          doctorName: doctorData?.fullName || "",
          specialization: doctorData?.specialization || "",
          patientName,
          patientEmail,
          medicines,
          status: "pending",
          createdAt: serverTimestamp(),
        });
        if (showToast) showToast("Prescription created successfully!", "success");
      }

      setPatientName("");
      setPatientEmail("");
      setEditingId(null); // Ensure edit mode is cleared
      setMedicines([{ name: "", dosage: "", duration: "", instructions: "" }]);

    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message, "error");
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setPatientName(p.patientName || "");
    setPatientEmail(p.patientEmail || "");
    setMedicines(p.medicines);
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString();
  };

  return (
    <div className="hide-scrollbar" style={{ display: "flex", gap: "30px", padding: "30px", height: "100vh", color: "white", overflow: "hidden" }}>

      {/* ──────── LEFT CARD: FORM ──────── */}
      <div className="hide-scrollbar" style={{
        flex: "0 0 40%",
        background: "rgba(20, 20, 20, 0.6)",
        backdropFilter: "blur(10px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "30px",
        overflowY: "auto"
      }}>

        <h2 style={{ fontSize: "1.8rem", margin: 0, color: "#fff" }}>
          {editingId ? "Update Prescription" : "Create New"}
        </h2>
        <p style={{ margin: "5px 0 20px 0", color: "#aaa", fontSize: "0.9rem" }}>
          Fill patient details and medicine info
        </p>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: "20px" }}></div>

        <h4 style={{ color: "#00D675", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "1px", marginBottom: "15px" }}>
          Patient Info
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            placeholder="Full Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Patient Email"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", marginBottom: "15px" }}>
          <h4 style={{ color: "#00D675", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "1px", margin: 0 }}>
            Medicines
          </h4>
          <button onClick={addMedicineField} style={{ background: "none", border: "none", color: "#00D675", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", fontWeight: "600" }}>
            <Plus size={16} /> Add More
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {medicines.map((m, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <input
                placeholder="Medicine Name"
                value={m.name}
                onChange={(e) => updateMedicine(i, "name", e.target.value)}
                style={{ ...inputStyle, marginBottom: "10px" }}
              />
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <input
                  placeholder="Dosage"
                  value={m.dosage}
                  onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Duration"
                  value={m.duration}
                  onChange={(e) => updateMedicine(i, "duration", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <textarea
                placeholder="Special Instruction"
                value={m.instructions}
                onChange={(e) => updateMedicine(i, "instructions", e.target.value)}
                style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
              />
            </div>
          ))}
        </div>

        <button onClick={handleSubmit} style={saveBtnStyle}>
          {editingId ? "Update Prescription" : "Save Prescription"}
        </button>

      </div>


      {/* ──────── RIGHT SIDE: HISTORY ──────── */}
      <div className="hide-scrollbar" style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.8rem", margin: 0, color: "#fff" }}>Recent History</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0, 214, 117, 0.1)", padding: "6px 12px", borderRadius: "20px" }}>
            <div style={{ width: "8px", height: "8px", background: "#00D675", borderRadius: "50%" }}></div>
            <span style={{ color: "#00D675", fontWeight: "700", fontSize: "0.9rem" }}>{prescriptions.length} Active Prescriptions</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {prescriptions.map((p) => (
            <div key={p.id} style={{
              background: "rgba(20, 20, 20, 0.6)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>

              {/* Row 1: Name + Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#fff" }}>{p.patientName}</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Edit3 size={18} color="#aaa" style={{ cursor: "pointer" }} onClick={() => handleEdit(p)} />
                  <Trash2 size={18} color="#ff5252" style={{ cursor: "pointer" }} onClick={() => handleDelete(p.id)} />
                </div>
              </div>

              {/* Row 2: Email + Date */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#888" }}>
                <span>{p.patientEmail}</span>
                <span>{formatDate(p.createdAt)}</span>
              </div>

              {/* Row 3: Pres Data */}
              <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px" }}>
                {p.medicines.map((m, idx) => (
                  <span key={idx} style={{ display: "inline-block", marginRight: "10px", fontSize: "0.85rem", color: "#ddd" }}>
                    {m.name} ({m.dosage})
                  </span>
                ))}
              </div>

              {/* Row 4: Status */}
              <div style={{ alignSelf: "flex-start" }}>
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  color: (p.status || "pending").toLowerCase() === "pending" ? "#ffa500" : "#00D675",
                  background: (p.status || "pending").toLowerCase() === "pending" ? "rgba(255, 165, 0, 0.1)" : "rgba(0, 214, 117, 0.1)",
                  padding: "4px 10px",
                  borderRadius: "12px"
                }}>
                  {p.status || "Pending"}
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "12px",
  borderRadius: "8px",
  color: "white",
  outline: "none",
  fontSize: "0.9rem"
};

const saveBtnStyle = {
  width: "100%",
  padding: "14px",
  background: "#00D675",
  color: "#000",
  border: "none",
  borderRadius: "10px",
  fontWeight: "700",
  fontSize: "1rem",
  cursor: "pointer",
  marginTop: "20px"
};
