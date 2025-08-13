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
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Stock from "./pages/Stock.jsx";
import Insights from "./pages/Insights.jsx";
import Login from "./components/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import Sales from "./pages/Sales.jsx";
import PatientRecords from "./pages/PatientRecords.jsx";
import PatientRegistration from "./pages/PatientRegistration.jsx"; // Import PatientRegistration
import LabTests from "./pages/LabTests.jsx";
import Returns from "./pages/Return.jsx";
function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User UID:", user.uid); // Debug: Check UID
        const userDocRef = doc(db, "Users", user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            console.log("Fetched role from Firestore:", role); // Debug: Check role
            setUserRole(role);
          } else {
            console.log("User document does not exist in Firestore");
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
          path="/stock"
          element={userRole === "admin" ? <Stock /> : <Navigate to="/home" />}
        />
        <Route
          path="/sales"
          element={userRole ? <Sales /> : <Navigate to="/login" />}
        />
        <Route
          path="/insights"
          element={userRole ? <Insights /> : <Navigate to="/login" />}
        />
        <Route
          path="/patient-records"
          element={
            userRole === "admin" || userRole === "staff" ? (
              <PatientRecords userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/lab-tests"
          element={
            userRole === "admin" || userRole === "lab" ? (
              <LabTests />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patient-registration"
          element={
            userRole === "admin" || userRole === "staff" ? (
              <PatientRegistration userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/Returns"
          element={
            userRole === "admin" || userRole === "staff" ? (
              <Returns userRole={userRole} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/home" element={<Home />} />
        <Route
          path="*"
          element={<Typography variant="h6">404 - Page Not Found</Typography>}
        />
      </Routes>
    </Router>
  );
}

export default App;
