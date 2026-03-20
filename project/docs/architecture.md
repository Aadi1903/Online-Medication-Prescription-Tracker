# Project Documentation: Online Medication Prescription Tracker

## Architecture Overview

The Online Medication Prescription Tracker is a Single Page Application (SPA) built using React. It heavily relies on Firebase for its backend infrastructure, specifically utilizing Firebase Authentication for user identity management and Firestore for real-time document storage.

### Data Flow \& State Management

1. **Authentication State**: Managed at the root level (`App.jsx`) using Firebase's `onAuthStateChanged`. The application listens for authentication changes and renders either the `AuthPage` or the `Dashboard` depending on the user's logged-in status.
2. **Role Authorization**: Upon successful login, the `Dashboard.jsx` component queries Firestore (`/users/{uid}`) to retrieve the user's assigned role (`admin`, `doctor`, `patient`, or `pharmacist`).
3. **Component Routing**: Based on the resolved role and the selected Bottom Navigation tab, `Dashboard.jsx` conditionally renders the appropriate sub-dashboard, prescriptions view, reminders view, or profile page.

## Core Modules

### 1. Authentication (`AuthPage.jsx`, `LoginForm.jsx`, `SignupForm.jsx`)
Handles user onboarding and login. 
- Supports email/password registration. During registration, the user selects their role, which is securely saved to their Firestore user document.
- Supports Google Sign-In as an alternative authentication method.

### 2. Dashboards (`*Dashboard.jsx`)
Each role has a tailored dashboard:
- **PatientDashboard**: Overview of their current health status, recent prescriptions, and upcoming medication reminders.
- **DoctorDashboard**: Overview of their active patients, quick actions to create new prescriptions.
- **PharmacistDashboard**: Queue of prescriptions waiting to be dispensed.
- **AdminDashboard**: High-level system statistics (using `recharts`) showing active users across all roles and system activity.

### 3. Prescription Management (`*Prescriptions.jsx`)
- **Doctors** can draft, assign, and publish prescriptions to specific patients.
- **Patients** can only view prescriptions assigned to their UID.
- **Pharmacists** can view all verified prescriptions to confirm medication details with physical patients in the pharmacy.

### 4. Reminder System (`*Reminders.jsx`)
- Allow users to set up schedules for taking or refilling medications. Stored in Firestore and fetched based on the user's role and ID.

### 5. Unified Profile Management
A centralized `ProfileSection` in `Dashboard.jsx` adapts to the current user's role. It displays different fields based on the role (e.g., `licenseNumber` for doctors/pharmacists, `age` and `medicalHistory` for patients). 

## Database Schema (Firestore)

- **`users` Collection**
  - Document ID: `uid` (from Firebase Auth)
  - Fields: `fullName`, `email`, `role`, `specialization` (if doctor), `age`/`medicalHistory` (if patient), `shopName` (if pharmacist).

- **`prescriptions` Collection**
  - Document ID: Auto-generated
  - Fields: `patientId`, `doctorId`, `medicationDetails`, `dateIssued`, `status`.

- **`reminders` Collection**
  - Document ID: Auto-generated
  - Fields: `userId`, `medicationName`, `time`, `frequency`.
