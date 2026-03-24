import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    const presSnap = await getDocs(collection(db, "prescriptions"));
    const userSnap = await getDocs(collection(db, "users"));

    const doctors = {};
    const patientsByEmail = {};
    const patientsByUid = {};

    userSnap.forEach((u) => {
      const data = u.data();

      if (data.role === "doctor") {
        doctors[u.id] = data;
      }

      if (data.role === "patient") {
        if (data.email) patientsByEmail[data.email] = data;
        patientsByUid[u.id] = data;
      }
    });

    const all = presSnap.docs.map((p) => {
      const data = p.data();

      // ✅ FIND PATIENT USING EMAIL FIRST (NEW SYSTEM), FALLBACK TO UID (OLD SYSTEM)
      const patientFromEmail = patientsByEmail[data.patientEmail];
      const patientFromUid = patientsByUid[data.patientId];

      const patientData = patientFromEmail || patientFromUid || {};

      return {
        id: p.id,
        ...data,

        // ✅ ATTACHED PATIENT DETAILS
        patientName: data.patientName || patientData.name || "Not Available",
        patientEmail: data.patientEmail || patientData.email || "Not Available",
        age: patientData.age || "Not Available",

        // ✅ ATTACHED DOCTOR DETAILS
        doctorDetails: doctors[data.doctorId] || {},
      };
    });

    setPrescriptions(all);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    await updateDoc(doc(db, "prescriptions", id), { status: "approved" });

    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
    );
  };

  const finalList = prescriptions.filter((item) => {
    const matchesFilter = filter === "all" || item.status === filter;
    const searchLower = search.toLowerCase();

    const matchesSearch =
      item.patientName?.toLowerCase().includes(searchLower) ||
      item.patientEmail?.toLowerCase().includes(searchLower) ||
      item.doctorDetails?.fullName?.toLowerCase().includes(searchLower) ||
      item.doctorDetails?.email?.toLowerCase().includes(searchLower) ||
      item.medicines?.some((m) => m.name?.toLowerCase().includes(searchLower));

    return matchesFilter && matchesSearch;
  });

  return (
    <>
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

      <div
        className="hide-scrollbar"
        style={{
          padding: "20px",
          paddingBottom: "100px",
          color: "white",
          height: "calc(100vh - 60px)",
          width: "50vw",
          overflowY: "auto",
        }}
      >
        <h2>Admin – Prescriptions</h2>

        {/* SEARCH + FILTER BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, doctor, or medicine..."
            style={{
              width: "65%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #444",
              background: "#111",
              color: "white",
            }}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              background: "#222",
              color: "white",
              border: "1px solid #555",
              borderRadius: "6px",
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {finalList.map((item) => (
          <div
            key={item.id}
            style={{
              width: "100%",
              background: "#111",
              color: "white",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "25px",
              margin: "20px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ width: "48%" }}>
                <h3>Patient Details</h3>

                {/* ✅ REQUIRED ORDER */}
                <p><strong>Patient Name:</strong> {item.patientName}</p>
                <p><strong>Email:</strong> {item.patientEmail}</p>
                <p><strong>Age:</strong> {item.age}</p>

                <p>
                  <strong>Date:</strong>{" "}
                  {item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleString()
                    : ""}
                </p>
                <p><strong>Status:</strong> {item.status}</p>
              </div>

              <div style={{ width: "48%" }}>
                <h3>Doctor Details</h3>
                <p><strong>Name:</strong> {item.doctorDetails.fullName}</p>
                <p><strong>Email:</strong> {item.doctorDetails.email}</p>
                <p><strong>Specialization:</strong> {item.doctorDetails.specialization}</p>
                <p><strong>License:</strong> {item.doctorDetails.licenseNumber}</p>
              </div>
            </div>

            <div style={{ marginTop: "25px" }}>
              <h3>Prescription Details</h3>

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
                  <p><strong>Medicine:</strong> {m.name}</p>
                  <p><strong>Dosage:</strong> {m.dosage}</p>
                  <p><strong>Duration:</strong> {m.duration}</p>
                  <p><strong>Instructions:</strong> {m.instructions}</p>
                </div>
              ))}
            </div>

{item.status === "pending" ? (
  <button
    onClick={() => handleApprove(item.id)}
    style={{
      marginTop: "20px",
      padding: "10px 22px",
      cursor: "pointer",
      background: "#28a745",
      border: "none",
      borderRadius: "8px",
      color: "white",
      fontSize: "16px",
    }}
  >
    Approve
  </button>
) : (
  <div
    style={{
      marginTop: "20px",
      background: "#a73128ff",
      color: "white",
      padding: "10px 22px",
      borderRadius: "8px",
      fontSize: "16px",
      display: "inline-block",
    }}
  >
    Approved
  </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
