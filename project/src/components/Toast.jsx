import React from "react";

export default function Toast({ message, type }) {
  const colors = {
    success: "#22c55e",
    error: "#ef4444",
    info: "#3b82f6",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: colors[type] || "#333",
        color: "white",
        padding: "12px 20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 9999,
        fontSize: "15px",
        fontWeight: "500",
      }}
    >
      {message}
    </div>
  );
}
