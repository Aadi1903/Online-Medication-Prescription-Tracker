import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
    collection,
    query,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp,
    getDocs,
    where,
    increment
} from "firebase/firestore";
import { Check, User, FileText, Pill, AlertTriangle } from "lucide-react";

export default function PharmacistPrescriptions({ showToast }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "prescriptions"));

        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort: Pending first, then by date
            list.sort((a, b) => {
                if (a.status === "dispensed" && b.status !== "dispensed") return 1;
                if (a.status !== "dispensed" && b.status === "dispensed") return -1;
                return (b.date?.seconds || 0) - (a.date?.seconds || 0); // Newest first
            });
            setPrescriptions(list);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleDispense = async (presc) => {
        // Direct action without native confirm
        try {
            // 1. Deduct Stock for each medicine
            let missingItems = [];
            if (presc.medicines) {
                for (const med of presc.medicines) {
                    const invRef = collection(db, "inventory");
                    const q = query(invRef, where("name", "==", med.name));
                    const snap = await getDocs(q);

                    if (!snap.empty) {
                        snap.forEach(async (d) => {
                            const deductAmount = parseInt(med.amount) || 1;
                            await updateDoc(doc(db, "inventory", d.id), {
                                stock: increment(-deductAmount)
                            });
                        });
                    } else {
                        missingItems.push(med.name);
                    }
                }
            }

            // 2. Update Prescription Status
            await updateDoc(doc(db, "prescriptions", presc.id), {
                status: "dispensed",
                dispensedAt: serverTimestamp()
            });

            if (missingItems.length > 0) {
                showToast(`Dispensed. Warning: ${missingItems.join(", ")} not found in inventory.`, "warning");
            } else {
                showToast("Prescription dispensed & stock deduction successful", "success");
            }

        } catch (err) {
            console.error("Error dispensing:", err);
            showToast("Failed to update status: " + err.message, "error");
        }
    };

    if (loading) return <div style={{ color: "white", padding: 20 }}>Loading prescriptions...</div>;

    return (
        <div className="hide-scrollbar" style={containerStyle}>
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>
                    Prescription Fulfillment
                </h1>
                <p style={{ color: "#888", fontSize: "1rem" }}>
                    View and process incoming patient prescriptions. (Stock is auto-deducted)
                </p>
            </div>

            <div style={grid}>
                {prescriptions.map((p) => {
                    const isDispensed = p.status === "dispensed";
                    return (
                        <div key={p.id} style={{ ...cardStyle, opacity: isDispensed ? 0.6 : 1 }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <User size={20} color="#3b82f6" />
                                    <div>
                                        <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{p.patientName || "Unknown Patient"}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#888" }}>{p.patientEmail}</div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    background: isDispensed ? "rgba(34, 197, 94, 0.1)" : "rgba(234, 179, 8, 0.1)",
                                    color: isDispensed ? "#22c55e" : "#eab308",
                                    border: `1px solid ${isDispensed ? "#22c55e" : "#eab308"}`
                                }}>
                                    {p.status ? p.status.toUpperCase() : "PENDING"}
                                </div>
                            </div>

                            {/* Doctor Info */}
                            <div style={{ marginBottom: "20px", fontSize: "0.9rem", color: "#ccc", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FileText size={16} /> Prescribed by Dr. {p.doctorName || "Unknown"}
                            </div>

                            {/* Medicines List */}
                            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "15px", marginBottom: "20px" }}>
                                {p.medicines?.map((m, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: idx === p.medicines.length - 1 ? "none" : "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <Pill size={16} color="#00D675" style={{ marginTop: 3 }} />
                                            <div>
                                                <div style={{ fontWeight: "600" }}>{m.name}</div>
                                                <div style={{ fontSize: "0.8rem", color: "#888" }}>{m.instruction || m.dosage}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: "bold" }}>{m.amount || "1"}x</div>
                                            <div style={{ fontSize: "0.8rem", color: "#888" }}>{m.duration}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action */}
                            {!isDispensed ? (
                                <button
                                    onClick={() => handleDispense(p)}
                                    style={dispenseBtn}
                                >
                                    <Check size={18} /> Mark as Dispensed
                                </button>
                            ) : (
                                <div style={{ textAlign: "center", color: "#22c55e", fontWeight: "bold", padding: "12px", border: "1px solid #22c55e", borderRadius: "10px" }}>
                                    Fulfilled & Stock Updated
                                </div>
                            )}
                        </div>
                    );
                })}
                {prescriptions.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#666" }}>
                        No Active Prescriptions found.
                    </div>
                )}
            </div>
        </div>
    );
}

const containerStyle = {
    padding: "20px",
    color: "white",
    width: "100%", // Full width
    height: "100vh",
    overflowY: "auto",
    paddingBottom: "100px",
};

const grid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // Back to 2 columns
    gap: "20px",
    width: "100%",
    maxWidth: "1400px", // Wider container to support 2 columns
    margin: "0 auto"
};

const cardStyle = {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "24px",
    transition: "all 0.3s ease",
};

const dispenseBtn = {
    width: "100%",
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    transition: "background 0.2s"
};
