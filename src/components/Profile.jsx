import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Profile({ role, user, showToast }) {
  const [data, setData] = useState({});
  const [edit, setEdit] = useState(false);

  // Fetch full user profile from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;

      try {
        const ref = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setData(snap.data());
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (showToast) showToast("Error loading profile data", "error");
      }
    };

    fetchProfile();
  }, [showToast]);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), data);
      setEdit(false);
      if (showToast) showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Error updating profile:", err);
      if (showToast) showToast("Failed to update profile", "error");
    }
  };

  return (
    <div style={profileContainer}>
      <div style={profileCard}>
        <div style={roleBadge}>{role ? role.toUpperCase() : "USER"}</div>

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
  maxWidth: "500px",
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
