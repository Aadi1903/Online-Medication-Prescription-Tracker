import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import {
  addDoc,
  updateDoc,
  collection,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function DoctorPrescriptions() {
  const [patientId, setPatientId] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", duration: "", instructions: "" }
  ]);
  const [pdfFile, setPdfFile] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Fetch previous prescriptions for doctor
  useEffect(() => {
    const doctorId = auth.currentUser.uid;

    const q = query(
      collection(db, "prescriptions"),
      where("doctorId", "==", doctorId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPrescriptions(list);
    });

    return () => unsubscribe();
  }, []);

  // Update medicine fields
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

  // Submit or update prescription
  const handleSubmit = async () => {
    try {
      const doctorId = auth.currentUser.uid;
      let pdfUrl = null;

      if (pdfFile) {
        const fileRef = ref(storage, `prescriptions/${Date.now()}_${pdfFile.name}`);
        await uploadBytes(fileRef, pdfFile);
        pdfUrl = await getDownloadURL(fileRef);
      }

      if (editingId) {
        // Update old prescription
        const refDoc = doc(db, "prescriptions", editingId);
        await updateDoc(refDoc, {
          patientId,
          medicines,
          ...(pdfUrl && { pdfUrl }),
          updatedAt: serverTimestamp(),
        });

        alert("Prescription updated!");
        setEditingId(null);
      } else {
        // New prescription
        await addDoc(collection(db, "prescriptions"), {
          doctorId,
          patientId,
          medicines,
          pdfUrl,
          status: "pending",
          createdAt: serverTimestamp(),
        });

        alert("Prescription added!");
      }

      // Reset
      setPatientId("");
      setMedicines([{ name: "", dosage: "", duration: "", instructions: "" }]);
      setPdfFile(null);

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  // Load prescription in form for editing
  const handleEdit = (p) => {
    setEditingId(p.id);
    setPatientId(p.patientId);
    setMedicines(p.medicines);
  };

  return (
    <div style={{ display: "flex", height: "100vh", color: "white" }}>
      
{/* LEFT SIDE — ADD/UPDATE FORM */}
<div style={{ width: "45%", padding: 20, borderRight: "1px solid #222" }} className="hide-scrollbar">
  
  <h2>{editingId ? "Update Prescription" : "Add Prescription"}</h2>

  <input
    className="input"
    placeholder="Patient UID"
    value={patientId}
    onChange={(e) => setPatientId(e.target.value)}
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

  {/* ✅ BUTTON SECTION WITH PROPER SPACING */}
  <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
    <button className="btn" onClick={addMedicineField}>
      + Add Medicine
    </button>

    <button className="btn" onClick={handleSubmit}>
      {editingId ? "Update Prescription" : "Submit Prescription"}
    </button>
  </div>

</div>   {/* ✅ VERY IMPORTANT: THIS LINE CLOSES THE LEFT SIDE */}



      {/* RIGHT SIDE — Prescription List */}
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
            <p><strong>Patient:</strong> {p.patientId}</p>
            <p><strong>Status:</strong> {p.status}</p>

            <p><strong>Medicines:</strong></p>
            <ul>
              {p.medicines.map((m, i) => (
                <li key={i}>{m.name} — {m.dosage}</li>
              ))}
            </ul>

            {p.pdfUrl && (
              <a href={p.pdfUrl} target="_blank" rel="noreferrer" style={{ color: "#00D675" }}>
                View PDF
              </a>
            )}

            <button className="btn" style={{ marginTop: 10 }} onClick={() => handleEdit(p)}>
              ✏️ Edit
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}
