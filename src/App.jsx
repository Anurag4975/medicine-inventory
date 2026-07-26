import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { Typography } from "@mui/material";

// Components & Pages
import Navbar from "./components/Navbar.jsx";
import Login from "./components/Login.jsx";
import Home from "./pages/Home.jsx";
import Stock from "./pages/Stock.jsx";
import Insights from "./pages/Insights.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import Sales from "./pages/Sales.jsx";
import PatientRecords from "./pages/PatientRecords.jsx";
import PatientRegistration from "./pages/PatientRegistration.jsx";
import LabTests from "./pages/LabTests.jsx";
import Returns from "./pages/Return.jsx";
import Consulting from "./pages/Consulting.jsx";
import ClinicalCharts from "./pages/ClinicalCharts/ClinicalCharts.jsx";

function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "Users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            console.warn("User document does not exist in Firestore");
            setUserRole(null);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Typography variant="h6">Loading...</Typography>
      </div>
    );
  }

  return (
    <Router>
      {userRole && <Navbar userRole={userRole} />}
      <Routes>
        {/* Root Route */}
        <Route
          path="/"
          element={
            userRole ? (
              userRole === "lab" ? (
                <Navigate to="/lab-tests" />
              ) : (
                <Navigate to="/home" />
              )
            ) : (
              <Login />
            )
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            !userRole ? (
              <Login />
            ) : userRole === "lab" ? (
              <Navigate to="/lab-tests" />
            ) : (
              <Navigate to="/home" />
            )
          }
        />

        {/* Public */}
        <Route path="/home" element={<Home userRole={userRole} />} />

        {/* Admin-only routes */}
        <Route
          path="/stock"
          element={userRole === "admin" ? <Stock /> : <Navigate to="/home" />}
        />

        {/* Admin + Staff routes */}
        <Route
          path="/sales"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <Sales userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/consulting"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <Consulting userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/insights"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <Insights />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patient-records"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <PatientRecords userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patient-registration"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <PatientRegistration userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/clinical-charts"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <ClinicalCharts userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Admin + Lab routes */}
        <Route
          path="/lab-tests"
          element={
            ["admin", "lab"].includes(userRole) ? (
              <LabTests />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Returns - Fixed path to match Navbar */}
        <Route
          path="/Returns"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <Returns userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        {/* Also keep lowercase version for compatibility */}
        <Route
          path="/returns"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <Returns userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Dashboards */}
        <Route
          path="/dashboard"
          element={
            userRole === "admin" ? (
              <AdminDashboard />
            ) : userRole === "staff" ? (
              <StaffDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Typography variant="h6" sx={{ textAlign: "center", mt: 4 }}>
              404 - Page Not Found
            </Typography>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
