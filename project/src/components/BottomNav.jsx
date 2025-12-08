import React from "react";
import { LayoutDashboard, FileHeart, AlarmClock, User, Home } from "lucide-react";

export default function BottomNav({ current, setCurrent }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { id: "prescriptions", label: "Prescriptions", icon: <FileHeart size={18} /> },
    { id: "reminders", label: "Reminders", icon: <AlarmClock size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
  ];

  return (
    <div style={styles.nav}>
      {items.map((item) => {
        const active = current === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setCurrent(item.id)}
            style={{
              ...styles.btn,
              background: active ? "#00D675" : "transparent",
              color: active ? "#000" : "#fff",
            }}
          >
            <div style={styles.inner}>
              {item.icon}
              <span style={{ fontSize: "10px" }}>{item.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  nav: {
    position: "fixed",
    bottom: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "60%",
    display: "flex",
    justifyContent: "space-around",
    padding: "0px 0",
    background: "#0d0d0d",
    borderRadius: "20px",
    border: "1px solid #222",
    boxShadow: "0px 4px 20px rgba(0,0,0,0.4)",
  },

  btn: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontSize: "6px",
    background: "transparent",
    color: "#fff",
  },

  inner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
};
