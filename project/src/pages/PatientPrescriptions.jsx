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
import { Stethoscope, FileText, Pill, Info, X, Calendar, MapPin } from "lucide-react";

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [drugApiInfo, setDrugApiInfo] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [selectedDrugName, setSelectedDrugName] = useState("");

  useEffect(() => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return;

    const presRef = collection(db, "prescriptions");

    const q = query(
      presRef,
      where("patientEmail", "==", userEmail),
      where("status", "==", "approved")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          if (!data.doctorName && data.doctorId) {
            const docSnap = await getDoc(doc(db, "users", data.doctorId));
            if (docSnap.exists()) {
              const doctorData = docSnap.data();
              data.doctorName = doctorData?.fullName || "Not Available";
              data.specialization = doctorData?.specialization || data.specialization || "General Physician";
            }
          }
          return { id: d.id, ...data };
        })
      );
      setPrescriptions(list);
    });

    return () => unsubscribe();
  }, []);

  const fetchDrugDetails = async (drugName) => {
    setApiLoading(true);
    setDrugApiInfo(null);
    setSelectedDrugName(drugName);
    setShowDetailsModal(true);
    try {
      const res = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${drugName}"&limit=1`);
      const data = await res.json();
      if (data.results && data.results[0]) {
        setDrugApiInfo(data.results[0]);
      } else {
        setDrugApiInfo({ error: "Detailed info not found in FDA database." });
      }
    } catch (err) {
      setDrugApiInfo({ error: "Failed to connect to FDA database." });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="hide-scrollbar" style={containerStyle}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2>
          Medical Prescriptions
        </h2>
        <p style={{ opacity: 0.5, marginTop: "10px" }}>Formal record of your approved prescriptions.</p>
      </div>

      {prescriptions.length === 0 ? (
        <div style={{ ...documentCardStyle, textAlign: "center", padding: "60px" }}>
          <p style={{ opacity: 0.4 }}>No approved prescriptions found in your medical record.</p>
        </div>
      ) : (
        prescriptions.map((item) => (
          <div key={item.id} style={documentCardStyle}>
            {/* DOCUMENT HEADER */}
            <div style={docHeaderStyle}>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={iconBoxStyle}><Stethoscope size={28} color="#00D675" /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "700" }}>Dr. {item.doctorName}</h3>
                  <p style={{ margin: 0, color: "#00D675", fontSize: "1rem", fontWeight: "600" }}>{item.specialization}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", opacity: 0.5, textTransform: "uppercase", letterSpacing: "1px" }}>Prescription ID</div>
                <div style={{ fontWeight: "700", fontFamily: "monospace" }}>#{item.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>

            <div style={dividerStyle} />

            {/* PATIENT & DATE INFO */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
              <div>
                <span style={labelStyle}>Patient</span>
                <p style={valueStyle}>{auth.currentUser.displayName || auth.currentUser.email}</p>
                <span style={labelStyle}>Issued Date</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                  <Calendar size={16} opacity={0.6} />
                  <p style={{ margin: 0 }}>{item.createdAt?.toDate?.() ? item.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently"}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={labelStyle}>Status</span>
                <div style={{ marginTop: "5px", color: "#00D675", fontWeight: "700", fontSize: "1.1rem" }}>✓ CERTIFIED APPROVED</div>
                <div style={{ marginTop: "15px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", opacity: 0.5, fontSize: "0.85rem" }}>
                  <MapPin size={14} /> Global Medical Network
                </div>
              </div>
            </div>

            {/* MEDICATIONS TABLE */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ ...labelStyle, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px", marginBottom: "20px" }}>Prescribed Medications (Rx)</h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.4, fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 0" }}>Medicine</th>
                    <th>Dosage</th>
                    <th>Duration</th>
                    <th style={{ textAlign: "right" }}>Safety Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {item.medicines?.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "20px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Pill size={16} color="#00D675" />
                          <strong style={{ fontSize: "1.1rem" }}>{m.name}</strong>
                        </div>
                        <p style={{ margin: "5px 0 0 26px", fontSize: "0.85rem", opacity: 0.6, fontStyle: "italic" }}>
                          "{m.instructions}"
                        </p>
                      </td>
                      <td style={{ fontWeight: "600" }}>{m.dosage}</td>
                      <td>{m.duration}</td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => fetchDrugDetails(m.name)} style={refBtnStyle}>
                          <Info size={14} /> Drug Info
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "40px", textAlign: "center", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "20px" }}>
              <p style={{ margin: 0, opacity: 0.3, fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase" }}>This is a digitally verified medical document</p>
            </div>
          </div>
        ))
      )}

      {/* DRUG DETAILS MODAL */}
      {showDetailsModal && (
        <div style={modalOverlayStyle}>
          <div className="hide-scrollbar" style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ ...iconBoxStyle, padding: "8px" }}><FileText size={20} color="#00D675" /></div>
                <h3 style={{ margin: 0, fontSize: "1.4rem" }}>Medical Reference: {selectedDrugName}</h3>
              </div>
              <button onClick={() => setShowDetailsModal(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>

            {apiLoading ? (
              <div style={{ padding: "40px", textAlign: "center", opacity: 0.5 }}>Querying FDA Medical Repository...</div>
            ) : (
              <div style={{ color: "#bbb", lineHeight: "1.7", fontSize: "0.95rem" }}>
                {drugApiInfo?.error ? (
                  <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", color: "#ffa500" }}>{drugApiInfo.error}</div>
                ) : (
                  <div style={{ display: "grid", gap: "25px" }}>
                    <section>
                      <h5 style={modalSectionTitle}>Clinical Indications</h5>
                      <p>{drugApiInfo?.indications_and_usage?.[0] || "Documentation not available."}</p>
                    </section>
                    <section>
                      <h5 style={modalSectionTitle}>Safety & Warnings</h5>
                      <p>{drugApiInfo?.warnings?.[0] || drugApiInfo?.drug_interactions?.[0] || "Standard safety protocols apply."}</p>
                    </section>
                    <section>
                      <h5 style={modalSectionTitle}>Dosage Guidelines</h5>
                      <p>{drugApiInfo?.dosage_and_administration?.[0] || "Follow prescribing doctor's instructions."}</p>
                    </section>
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop: "30px", textAlign: "right" }}>
              <button onClick={() => setShowDetailsModal(false)} style={{ ...refBtnStyle, background: "#00D675", color: "#000", padding: "10px 30px" }}>Dismiss Reference</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const containerStyle = {
  padding: "40px 20px",
  color: "white",
  height: "calc(100vh - 100px)",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const documentCardStyle = {
  background: "#0d0d0d",
  padding: "50px",
  borderRadius: "15px",
  border: "1px solid #1a1a1a",
  width: "100%",
  maxWidth: "850px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  marginBottom: "40px",
  position: "relative",
};

const docHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "30px",
};

const iconBoxStyle = {
  background: "rgba(0, 214, 117, 0.05)",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid rgba(0, 214, 117, 0.1)",
};

const dividerStyle = {
  height: "1px",
  background: "rgba(255,255,255,0.08)",
  margin: "0 0 30px 0",
};

const labelStyle = {
  fontSize: "0.75rem",
  opacity: 0.4,
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  fontWeight: "800",
  display: "block",
  marginBottom: "8px",
};

const valueStyle = {
  margin: "0 0 20px 0",
  fontSize: "1.2rem",
  fontWeight: "600",
};

const refBtnStyle = {
  background: "transparent",
  border: "1px solid rgba(0, 214, 117, 0.3)",
  color: "#00D675",
  padding: "6px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "0.8rem",
  fontWeight: "700",
  transition: "all 0.2s",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.9)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(10px)",
};

const modalContentStyle = {
  background: "#0d0d0d",
  padding: "40px",
  borderRadius: "20px",
  width: "90%",
  maxWidth: "750px",
  maxHeight: "85vh",
  overflowY: "auto",
  border: "1px solid #1a1a1a",
};

const closeBtnStyle = {
  background: "none",
  border: "none",
  color: "white",
  cursor: "pointer",
  opacity: 0.5,
};

const modalSectionTitle = {
  margin: "0 0 8px 0",
  fontSize: "0.9rem",
  color: "#00D675",
  textTransform: "uppercase",
  letterSpacing: "1px",
};
