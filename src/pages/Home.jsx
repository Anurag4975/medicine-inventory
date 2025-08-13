import { useState, useEffect } from "react";
import { Box, Button, Grid, Typography, useMediaQuery } from "@mui/material";
import {
  FaHome,
  FaBox,
  FaShoppingCart,
  FaChartLine,
  FaUserPlus,
  FaFlask,
  FaUsers,
  FaTachometerAlt,
  FaUndo,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

function Home({ userRole }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [role, setRole] = useState(userRole);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        setRole(userDoc.exists() ? userDoc.data().role : null);
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const navigationItems = [
    { label: "Home", icon: <FaHome size={32} />, path: "/home" },
    {
      label: "Stock",
      icon: <FaBox size={32} />,
      path: "/stock",
      adminOnly: true,
    },
    { label: "Sales", icon: <FaShoppingCart size={32} />, path: "/sales" },
    {
      label: "Sales-Insights",
      icon: <FaChartLine size={32} />,
      path: "/insights",
    },
    {
      label: "OPD Ticket",
      icon: <FaUserPlus size={32} />,
      path: "/patient-registration",
    },
    { label: "Lab", icon: <FaFlask size={32} />, path: "/lab-tests" },
    {
      label: "Patient Records",
      icon: <FaUsers size={32} />,
      path: "/patient-records",
    },
    {
      label: "Dashboard",
      icon: <FaTachometerAlt size={32} />,
      path: "/dashboard",
    },
    {
      label: "Returns",
      icon: <FaUndo size={32} />,
      path: "/Returns",
      restricted: true, // For admin or staff only
    },
  ];

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        textAlign: "center",
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#1976D2" }}
      >
        Welcome to Medicine Inventory
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: "#555" }}>
        Manage your stock, track sales, and more!
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {navigationItems.map((item) => {
          // Skip admin-only items for non-admins and Returns for non-admin/non-staff
          if (
            (item.adminOnly && role !== "admin") ||
            (item.restricted && role !== "admin" && role !== "staff")
          ) {
            return null;
          }
          return (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={item.label}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <Button
                variant="contained"
                onClick={() => navigate(item.path)}
                sx={{
                  width: { xs: "100%", sm: 250 },
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  bgcolor: "#1976D2",
                  "&:hover": {
                    bgcolor: "#115293",
                    transform: "scale(1.05)",
                  },
                  transition: "transform 0.3s ease, background-color 0.3s ease",
                  borderRadius: 2,
                  boxShadow: 3,
                  textTransform: "none",
                }}
              >
                <Box sx={{ mb: 1 }}>{item.icon}</Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  {item.label}
                </Typography>
              </Button>
            </Grid>
          );
        })}
      </Grid>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .MuiGrid-item { animation: fadeIn 0.5s ease-in; }
      `}</style>
    </Box>
  );
}

export default Home;
