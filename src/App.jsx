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

// Import the new components

// ProtectedRoute component for role-based access
const ProtectedRoute = ({ children, allowedRoles }) => {
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
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
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

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

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
        console.log("No user signed in");
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

        {/* Admin-only routes */}
        <Route
          path="/stock"
          element={userRole === "admin" ? <Stock /> : <Navigate to="/home" />}
        />
        <Route
          path="/consulting"
          element={
            userRole === "admin" ? (
              <Consulting userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Shared routes */}

        <Route
          path="/insights"
          element={userRole ? <Insights /> : <Navigate to="/login" />}
        />

        {/* Admin + Staff */}
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
          path="/returns"
          element={
            ["admin", "staff"].includes(userRole) ? (
              <Returns userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Admin + Lab */}
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

        {/* Public */}
        <Route path="/home" element={<Home />} />

        {/* Fallback */}
        <Route
          path="*"
          element={<Typography variant="h6">404 - Page Not Found</Typography>}
        />
      </Routes>
    </Router>
  );
}

export default App;
