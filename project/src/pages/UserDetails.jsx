export default function UserDetails({ user, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#111",
          padding: 25,
          borderRadius: 14,
          width: "350px",
          border: "1px solid #333",
        }}
      >
        <h2>User Details</h2>

        <p><strong>Name:</strong> {user.fullName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Created At:</strong> {user.createdAt}</p>

        {user.role === "doctor" && (
          <>
            <p><strong>Specialization:</strong> {user.specialization}</p>
            <p><strong>Experience:</strong> {user.experience}</p>
            <p><strong>License:</strong> {user.licenseNumber}</p>
          </>
        )}

        {user.role === "patient" && (
          <>
            <p><strong>Age:</strong> {user.age}</p>
            <p><strong>Medical History:</strong> {user.medicalHistory}</p>
          </>
        )}

        {user.role === "pharmacist" && (
          <>
            <p><strong>Shop Name:</strong> {user.shopName}</p>
            <p><strong>Shop Address:</strong> {user.shopAddress}</p>
          </>
        )}

        <button
          className="btn"
          onClick={onClose}
          style={{ marginTop: 15 }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
