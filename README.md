# Online Medication Prescription Tracker

A comprehensive web application designed to streamline the process of medication prescription and tracking. Built with React and Firebase, it provides dedicated interfaces for Doctors, Patients, Pharmacists, and Administrators to interact securely and efficiently.

## Features

- **Role-Based Access Control**
  - **Admin**: System-wide oversight, user management, and prescription auditing.
  - **Doctor**: Create, manage, and track prescriptions for specific patients.
  - **Patient**: View personal prescriptions and manage medication reminders.
  - **Pharmacist**: Verify and dispense medications based on digital prescriptions.

- **Real-Time Integration**: Uses Firebase Firestore for instant synchronization across all user roles.
- **Secure Authentication**: Integrated with Firebase Auth (Email/Password & Google Sign-In).
- **Responsive Dashboard**: tailored interfaces for each user role with a modern dark-themed UI.

## Project Structure

```text
.
├── docs/                 # Technical documentation & architecture
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── BottomNav.jsx # Role-aware navigation
│   │   ├── Profile.jsx   # Unified user profile management
│   │   ├── Toast.jsx     # Global notification system
│   │   └── ...
│   ├── pages/            # Role-specific dashboards and views
│   │   ├── AdminDashboard.jsx
│   │   ├── DoctorDashboard.jsx
│   │   ├── PatientDashboard.jsx
│   │   ├── PharmacistDashboard.jsx
│   │   ├── AuthPage.jsx  # Auth entry point
│   │   └── ...
│   ├── App.jsx           # Main application logic & auth state
│   ├── firebase.js       # Firebase configuration
│   ├── main.jsx          # React entry point
│   ├── styles.css        # Global design system & theme
├── index.html
├── package.json
└── vite.config.js
```

## Database Schema (Firestore)

- **`users`**: Stores profile information indexed by `uid`.
  - Fields: `fullName`, `email`, `role`, `specialization` (doctor), `licenseNumber` (doctor/pharmacist), `age`/`medicalHistory` (patient).
- **`prescriptions`**: Stores medical prescriptions.
  - Fields: `patientId`, `doctorId`, `medicationDetails`, `status` (pending/approved), `createdAt`.
- ****`reminders`**: User-defined medication schedules.
  - Fields: `userId`, `medicationName`, `time`, `frequency`.

## Setup Instructions

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Firebase Configuration**:
   - Update `src/firebase.js` with your project credentials if using a private instance.
4. **Development Mode**:
   ```bash
   npm run dev
   ```

## Documentation

For more detailed technical documentation, please refer to the [architecture.md](docs/architecture.md) file.
