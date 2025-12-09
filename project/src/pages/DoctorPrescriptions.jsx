import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  addDoc,
  updateDoc,
  collection,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc
} from "firebase/firestore";

export default function DoctorPrescriptions() {
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", duration: "", instructions: "" }
  ]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // ✅ AUTO-FILL EMAIL FROM PATIENT NAME
  useEffect(() => {
    const fetchEmail = async () => {
      if (!patientName) return;

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
  }, [patientName]);

  // ✅ FETCH DOCTOR PRESCRIPTIONS
  useEffect(() => {
    const doctorId = auth.currentUser.uid;

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

  const handleSubmit = async () => {
    try {
      if (!patientName || !patientEmail) {
        alert("Enter valid patient name & email!");
        return;
      }

      const doctorId = auth.currentUser.uid;

      const doctorSnap = await getDoc(doc(db, "users", doctorId));
      const doctorData = doctorSnap.data();

      if (editingId) {
        await updateDoc(doc(db, "prescriptions", editingId), {
          patientName,
          patientEmail,
          medicines,
          updatedAt: serverTimestamp(),
        });

        alert("Prescription updated!");
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

        alert("Prescription added!");
      }

      setPatientName("");
      setPatientEmail("");
      setMedicines([{ name: "", dosage: "", duration: "", instructions: "" }]);

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setPatientName(p.patientName || "");
    setPatientEmail(p.patientEmail || "");
    setMedicines(p.medicines);
  };

  return (
    <div style={{ display: "flex", height: "100vh", color: "white" }}>
      
<div style={{ width: "45%", padding: 20, borderRight: "1px solid #222" }} className="hide-scrollbar">
  
  <h2>{editingId ? "Update Prescription" : "Add Prescription"}</h2>

  {/* ✅ PATIENT NAME */}
  <input
    className="input"
    placeholder="Patient Name"
    value={patientName}
    onChange={(e) => setPatientName(e.target.value)}
  />

  {/* ✅ EMAIL STRICTLY BELOW NAME (AUTO-FILLED) */}
  <input
    className="input"
    placeholder="Patient Email"
    value={patientEmail}
    onChange={(e) => setPatientEmail(e.target.value)}
    style={{ marginTop: 10 }}
  />

  <h3>Medicines</h3>

  {medicines.map((m, index) => (
    <div key={index} style={{ marginBottom: 10 }}>
      <input
        className="input"
        placeholder="Name"
        value={m.name}
        onChange={(e) => updateMedicine(index, "name", e.target.value)}
      />
      <input
        className="input"
        placeholder="Dosage"
        value={m.dosage}
        onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
      />
      <input
        className="input"
        placeholder="Duration"
        value={m.duration}
        onChange={(e) => updateMedicine(index, "duration", e.target.value)}
      />
      <input
        className="input"
        placeholder="Instructions"
        value={m.instructions}
        onChange={(e) => updateMedicine(index, "instructions", e.target.value)}
      />
    </div>
  ))}

  <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
    <button className="btn" onClick={addMedicineField}>
      + Add Medicine
    </button>

    <button className="btn" onClick={handleSubmit}>
      {editingId ? "Update Prescription" : "Submit Prescription"}
    </button>
  </div>
</div>

      {/* ✅ RIGHT SIDE */}
      <div style={{ width: "55%", padding: 20 }} className="hide-scrollbar">
        <h2>Your Prescriptions</h2>

        {prescriptions.map((p) => (
          <div
            key={p.id}
            style={{
              marginBottom: 12,
              background: "#111",
              borderRadius: 12,
              padding: 15,
              border: "1px solid #222",
            }}
          >
            <p><strong>Patient:</strong> {p.patientName}</p>
            <p><strong>Email:</strong> {p.patientEmail}</p>

            <p><strong>Status:</strong> {p.status}</p>

            <p><strong>Medicines:</strong></p>
            <ul>
              {p.medicines.map((m, i) => (
                <li key={i}>{m.name} — {m.dosage}</li>
              ))}
            </ul>

            <button className="btn" style={{ marginTop: 10 }} onClick={() => handleEdit(p)}>
              ✏️ Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
