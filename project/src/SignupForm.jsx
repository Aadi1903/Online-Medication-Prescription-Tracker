import React, { useState } from "react";

const SignupForm = () => {
  const [role, setRole] = useState("");

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Sign Up</h2>

      {/* Full Name */}
      <input type="text" placeholder="Full Name" style={styles.input} />

      {/* Email */}
      <input type="email" placeholder="Email" style={styles.input} />

      {/* Password */}
      <input type="password" placeholder="Password" style={styles.input} />

      {/* Role Dropdown */}
      <select
        style={styles.input}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="">Role</option>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
        <option value="pharmacist">Pharmacist</option>
        <option value="admin">Admin</option>
      </select>

      {/* Conditional fields based on Role */}
      {role === "doctor" && (
        <>
          <input
            type="text"
            placeholder="Medical License Number"
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Specialization"
            style={styles.input}
          />
        </>
      )}

      {role === "pharmacist" && (
        <>
          <input type="text" placeholder="Shop Name" style={styles.input} />
          <input type="text" placeholder="Shop Address" style={styles.input} />
        </>
      )}

      {role === "patient" && (
        <>
          <input type="number" placeholder="Age" style={styles.input} />
          <textarea
            placeholder="Medical History"
            style={{ ...styles.input, height: "90px" }}
          />
        </>
      )}

      <button style={styles.button}>Sign Up</button>
    </div>
  );
};

const styles = {
  container: {
    width: "350px",
    margin: "auto",
    padding: "20px",
    background: "#111",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  header: {
    color: "white",
    textAlign: "center",
    marginBottom: "10px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#1b1b1b",
    color: "#fff",
    outline: "none",
  },
  button: {
    background: "#00D675",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    color: "black",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default SignupForm;
