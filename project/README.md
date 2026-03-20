# Online Medication Prescription Tracker

A comprehensive web application designed to streamline the process of medication prescription and tracking. Built with React and Firebase, it provides dedicated interfaces for Doctors, Patients, Pharmacists, and Administrators to interact securely and efficiently.

## Features

- **Role-Based Access Control**
  - **Admin**: Oversee the entire system, manage users, and view system-wide prescriptions and reminders.
  - **Doctor**: Create and manage prescriptions, view patient history, and set medication reminders.
  - **Patient**: Access personal prescriptions, track medication schedules, and receive reminders.
  - **Pharmacist**: View and verify prescriptions to dispense medications accurately.
  
- **Secure Authentication**: Powered by Firebase Authentication, including Google Sign-In and standard Email/Password login.
- **Real-Time Database**: Uses Firebase Firestore to store and sync user profiles, prescriptions, and reminders instantly.
- **Responsive UI**: A modern, dark-themed user interface built with custom CSS, ensuring a smooth experience across devices.

## Tech Stack

- **Frontend**: React 18, Vite
- **Charting**: Recharts
- **Backend/BaaS**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Vanilla CSS

## Setup Instructions

1. **Clone the repository** (if applicable) or download the source code.
2. **Navigate to the project directory**:
   ```bash
   cd project
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure Firebase**:
   - The application relies on Firebase. Ensure `src/firebase.js` is correctly configured with your Firebase project credentials. (The project currently comes with default keys).

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
6. **Access the application**: Open `http://localhost:5173` in your browser.

## Project Structure

- `src/pages/`: Contains the main route components, including authentication and the role-specific Dashboards (Admin, Doctor, Patient, Pharmacist).
- `src/components/`: Reusable UI components like `Toast`, `BottomNav`, and `GoogleSignInButton`.
- `src/firebase.js`: Firebase configuration and initialization.
- `src/App.jsx`: Main application wrapper handling authentication state and global Toast notifications.

## Documentation

For more detailed technical documentation, please refer to the `docs/` directory.
