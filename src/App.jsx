import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { appCache } from "./utils/appCache";
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

  // Initialize shared cache listeners ONCE - BEFORE routes render
  useEffect(() => {
    appCache.initialize();

    return () => {
      appCache.destroy();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check sessionStorage first
          const cachedRole = sessionStorage.getItem("userRole");
          if (cachedRole) {
            setUserRole(cachedRole);
            setLoading(false);
            return;
          }

          const userDocRef = doc(db, "Users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            setUserRole(role);
            sessionStorage.setItem("userRole", role);
          } else {
            setUserRole(null);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
        sessionStorage.removeItem("userRole");
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
        <Route path="/home" element={<Home userRole={userRole} />} />
        <Route
          path="/stock"
          element={userRole === "admin" ? <Stock /> : <Navigate to="/home" />}
        />
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
