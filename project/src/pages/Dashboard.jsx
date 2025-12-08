import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc  } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";


import DoctorDashboard from "./DoctorDashboard";
import PatientDashboard from "./PatientDashboard";
import PharmacistDashboard from "./PharmacistDashboard";
import AdminDashboard from "./AdminDashboard";

import DoctorPrescriptions from "./DoctorPrescriptions";
import PatientPrescriptions from "./PatientPrescriptions";
import AdminPrescriptions from "./AdminPrescriptions";


import DoctorReminders from "./DoctorReminders";
import PatientReminders from "./PatientReminders";

import BottomNav from "../components/BottomNav";

export default function Dashboard({ user }) {
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Load user role from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setRole(snap.data().role);
        } else {
          console.warn("⚠ No user document found in Firestore");
          setRole(null);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Show loading until Firestore user data is ready
  if (loading || !role) {
    return <div style={{ color: "white", padding: 20 }}>Loading user data...</div>;
  }

  console.log("Role =", role);
  console.log("Page =", page);

  return (
    <div style={{ height: "100vh", overflow: "hidden", paddingBottom: "70px" }}>

      {/* --------------------------------------- */}
      {/*             DASHBOARD SCREEN            */}
      {/* --------------------------------------- */}
      {page === "dashboard" && role === "doctor" && <DoctorDashboard />}
      {page === "dashboard" && role === "patient" && <PatientDashboard />}
      {page === "dashboard" && role === "pharmacist" && <PharmacistDashboard />}
      {page === "dashboard" && role === "admin" && <AdminDashboard />}

      {/* --------------------------------------- */}
      {/*             PRESCRIPTIONS               */}
      {/* --------------------------------------- */}
      {page === "prescriptions" && role === "doctor" && <DoctorPrescriptions />}
      {page === "prescriptions" && role === "patient" && <PatientPrescriptions />}
      {page === "prescriptions" && role === "pharmacist" && <div>Pharmacy Prescription Panel</div>}
      {page === "prescriptions" && role === "admin" && <AdminPrescriptions />}

      {/* --------------------------------------- */}
      {/*               REMINDERS                 */}
      {/* --------------------------------------- */}
      {page === "reminders" && role === "doctor" && <DoctorReminders />}
      {page === "reminders" && role === "patient" && <PatientReminders />}
      {page === "reminders" && role === "pharmacist" && <div>No reminders for Pharmacist</div>}
      {page === "reminders" && role === "admin" && <div>No reminders for Admin</div>}

      {/* --------------------------------------- */}
      {/*                 PROFILE                 */}
      {/* --------------------------------------- */}
      {page === "profile" && (
  // <ProfileSection role={role} user={user} />
  <div style={{ width: "40vw", minHeight: "50vh" }}>
  <ProfileSection role={role} user={user} />
</div>

)}



      {/* --------------------------------------- */}
      {/*              BOTTOM NAV BAR             */}
      {/* --------------------------------------- */}
      <BottomNav current={page} setCurrent={setPage} />
    </div>
  );
}



function ProfileSection({ role }) {
  const [data, setData] = React.useState({});
  const [edit, setEdit] = React.useState(false);

  // ✅ FETCH FULL USER FROM FIRESTORE (THIS FIXES ALL "Not Available")
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;

      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setData(snap.data()); // ✅ THIS IS THE REAL PROFILE DATA
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    await updateDoc(doc(db, "users", auth.currentUser.uid), data);
    setEdit(false);
  };

  return (
    <div style={profileContainer}>
      <div style={profileCard}>
        <div style={roleBadge}>{role.toUpperCase()}</div>

        <h2 style={{ textAlign: "center" }}>Profile</h2>

        <ProfileField label="Full Name" value={data.fullName} edit={edit} onChange={(v) => setData({ ...data, fullName: v })} />
        <ProfileField label="Email" value={data.email} />
        <ProfileField label="Role" value={data.role} />

        {role === "doctor" && (
          <>
            <ProfileField label="Specialization" value={data.specialization} edit={edit} onChange={(v) => setData({ ...data, specialization: v })} />
            <ProfileField label="License Number" value={data.licenseNumber} edit={edit} onChange={(v) => setData({ ...data, licenseNumber: v })} />
            <ProfileField label="Experience" value={data.experience} edit={edit} onChange={(v) => setData({ ...data, experience: v })} />
          </>
        )}

        {role === "patient" && (
          <>
            <ProfileField label="Age" value={data.age} edit={edit} onChange={(v) => setData({ ...data, age: v })} />
            <ProfileField label="Medical History" value={data.medicalHistory} edit={edit} onChange={(v) => setData({ ...data, medicalHistory: v })} />
          </>
        )}

        {role === "pharmacist" && (
          <>
            <ProfileField label="Shop Name" value={data.shopName} edit={edit} onChange={(v) => setData({ ...data, shopName: v })} />
            <ProfileField label="License Number" value={data.licenseNumber} edit={edit} onChange={(v) => setData({ ...data, licenseNumber: v })} />
            <ProfileField label="Shop Address" value={data.shopAddress} edit={edit} onChange={(v) => setData({ ...data, shopAddress: v })} />
          </>
        )}

        {/* {role === "admin" && (
          <ProfileField label="Admin UID" value={auth.currentUser.uid} />
        )} */}

        <div style={{ marginTop: 20, textAlign: "center" }}>
          {edit ? (
            <button style={saveBtn} onClick={handleSave}>Save</button>
          ) : (
            <button style={editBtn} onClick={() => setEdit(true)}>Edit Profile</button>
          )}

          <button style={logoutBtn} onClick={() => auth.signOut()}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
function ProfileField({ label, value, edit, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, color: "#aaa" }}>{label}</div>

      {edit ? (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #444",
            background: "#111",
            color: "white",
            outline: "none",
          }}
        />
      ) : (
        <div style={{ fontSize: 16 }}>
          {value || "Not Available"}
        </div>
      )}
    </div>
  );
}
const profileContainer = {
  minHeight: "100vh",
  background: "#0d0d0d",
  padding: "20px",
};


const profileCard = {
  width: "80%",
  maxWidth: "500px",   // ✅ Wide like a proper page
  margin: "0 auto",
  background: "#111",
  borderRadius: "16px",
  padding: "32px",
  color: "white",
  boxShadow: "0 0 25px rgba(0,0,0,0.6)",
};


const roleBadge = {
  background: "#2563eb",
  color: "white",
  textAlign: "center",
  padding: "6px 14px",
  borderRadius: "20px",
  fontSize: "12px",
  width: "fit-content",
  margin: "0 auto 12px",
};

const saveBtn = {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#22c55e",
  color: "white",
  marginRight: 10,
  cursor: "pointer",
};

const editBtn = {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  marginRight: 10,
  cursor: "pointer",
};

const logoutBtn = {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
};

