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

function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : null);
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
      {userRole && <Navbar userRole={userRole} />} {/* Pass userRole */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={!userRole ? <Login /> : <Navigate to="/dashboard" />}
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
          element={
            userRole === "admin" ? <Stock /> : <Navigate to="/dashboard" />
          }
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
          path="*"
          element={<Typography variant="h6">404 - Page Not Found</Typography>}
        />
      </Routes>
    </Router>
  );
}

export default App;
