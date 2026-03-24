import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";


import DoctorDashboard from "./DoctorDashboard";
import PatientDashboard from "./PatientDashboard";
import PharmacistDashboard from "./PharmacistDashboard";
import AdminDashboard from "./AdminDashboard";

import DoctorPrescriptions from "./DoctorPrescriptions";
import PatientPrescriptions from "./PatientPrescriptions";
import AdminPrescriptions from "./AdminPrescriptions";


import PharmacistPrescriptions from "./PharmacistPrescriptions";
import PharmacistReminders from "./PharmacistReminders";

import DoctorReminders from "./DoctorReminders";
import PatientReminders from "./PatientReminders";
import AdminReminders from "./AdminReminders";

import Profile from "../components/Profile";

export default function Dashboard({ user, showToast }) {
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

  return (
    <div style={{ height: "100vh", overflow: "hidden", paddingBottom: "70px" }}>

      {/* --------------------------------------- */}
      {/*             DASHBOARD SCREEN            */}
      {/* --------------------------------------- */}
      {page === "dashboard" && role === "doctor" && <DoctorDashboard />}
      {page === "dashboard" && role === "patient" && <PatientDashboard setPage={setPage} />}
      {page === "dashboard" && role === "pharmacist" && <PharmacistDashboard showToast={showToast} />}
      {page === "dashboard" && role === "admin" && <AdminDashboard />}

      {/* --------------------------------------- */}
      {/*             PRESCRIPTIONS               */}
      {/* --------------------------------------- */}
      {page === "prescriptions" && role === "doctor" && <DoctorPrescriptions showToast={showToast} />}
      {page === "prescriptions" && role === "patient" && <PatientPrescriptions />}
      {page === "prescriptions" && role === "pharmacist" && <PharmacistPrescriptions showToast={showToast} />}
      {page === "prescriptions" && role === "admin" && <AdminPrescriptions />}

      {/* --------------------------------------- */}
      {/*               REMINDERS                 */}
      {/* --------------------------------------- */}
      {page === "reminders" && role === "doctor" && <DoctorReminders />}
      {page === "reminders" && role === "patient" && <PatientReminders showToast={showToast} />}
      {page === "reminders" && role === "pharmacist" && <PharmacistReminders showToast={showToast} />}
      {page === "reminders" && role === "admin" && <AdminReminders />}

      {/* --------------------------------------- */}
      {/*                 PROFILE                 */}
      {/* --------------------------------------- */}
      {page === "profile" && (
        <div style={{ width: "40vw", minHeight: "50vh" }}>
          <Profile role={role} user={user} showToast={showToast} />
        </div>
      )}

      {/* --------------------------------------- */}
      {/*              BOTTOM NAV BAR             */}
      {/* --------------------------------------- */}
      <BottomNav current={page} setCurrent={setPage} />
    </div>
  );
}

