import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  Box,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  Container,
  Fade,
  alpha,
  Avatar,
} from "@mui/material";
import {
  Home as HomeIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Analytics as AnalyticsIcon,
  PersonAdd as PersonAddIcon,
  Science as ScienceIcon,
  People as PeopleIcon,
  Dashboard as DashboardIcon,
  Undo as UndoIcon,
  Payment as PaymentIcon,
  Biotech as BiotechIcon,
} from "@mui/icons-material";

const iconColors = {
  "/stock": "#FF9800",
  "/sales": "#2196F3",
  "/insights": "#9C27B0",
  "/patient-registration": "#F44336",
  "/lab-billing": "#00BCD4",
  "/lab-workstation": "#4CAF50",
  "/patient-records": "#795548",
  "/dashboard": "#607D8B",
  "/Returns": "#E91E63",
  "/consulting": "#FF5722",
  "/clinical-charts": "#4CAF50",
};

const navigationItems = [
  {
    label: "Consulting",
    icon: <PeopleIcon sx={{ fontSize: 24 }} />,
    path: "/consulting",
    description: "Manage patient consultations",
  },
  {
    label: "Stock Management",
    icon: <InventoryIcon sx={{ fontSize: 24 }} />,
    path: "/stock",
    adminOnly: true,
    description: "Manage inventory and stock levels",
  },
  {
    label: "Sales",
    icon: <ShoppingCartIcon sx={{ fontSize: 24 }} />,
    path: "/sales",
    description: "Process sales and transactions",
  },
  {
    label: "Sales Insights",
    icon: <AnalyticsIcon sx={{ fontSize: 24 }} />,
    path: "/insights",
    description: "Analytics and sales reports",
  },
  {
    label: "OPD Registration",
    icon: <PersonAddIcon sx={{ fontSize: 24 }} />,
    path: "/patient-registration",
    description: "Register new patients",
  },
  {
    label: "Lab Billing",
    icon: <PaymentIcon sx={{ fontSize: 24 }} />,
    path: "/lab-billing",
    description: "Process lab test payments",
  },
  {
    label: "Lab Workstation",
    icon: <BiotechIcon sx={{ fontSize: 24 }} />,
    path: "/lab-workstation",
    description: "Process lab tests and results",
  },
  {
    label: "Patient Records",
    icon: <PeopleIcon sx={{ fontSize: 24 }} />,
    path: "/patient-records",
    description: "View patient information",
  },
  {
    label: "Doctors",
    icon: <DashboardIcon sx={{ fontSize: 24 }} />,
    path: "/dashboard",
    description: "Doctors Management",
  },
  {
    label: "Clinical Charts",
    icon: <ScienceIcon sx={{ fontSize: 24 }} />,
    path: "/clinical-charts",
    description: "View and manage patient clinical charts",
  },
  {
    label: "Returns & Refunds",
    icon: <UndoIcon sx={{ fontSize: 24 }} />,
    path: "/Returns",
    restricted: true,
    description: "Handle returns and refunds",
  },
];

function Home({ userRole }) {
  const navigate = useNavigate();
  const [role, setRole] = useState(userRole);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
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

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    return hour < 12
      ? "Good Morning"
      : hour < 17
        ? "Good Afternoon"
        : "Good Evening";
  };

  const getRoleDisplayName = (role) => {
    const roles = {
      admin: "Administrator",
      staff: "Staff Member",
      lab: "Lab Technician",
    };
    return roles[role] || "User";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4, position: "relative" }}>
        <Fade in={fadeIn} timeout={800}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundClip: "text",
                color: "transparent",
                mb: 1,
                fontSize: { xs: "1.8rem", md: "2.5rem" },
              }}
            >
              {getWelcomeMessage()}!
            </Typography>
            <Typography variant="h5" sx={{ color: "#555", mb: 2 }}>
              Welcome to <strong>SADEV</strong>
            </Typography>
            {role && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: alpha("#667eea", 0.1),
                  borderRadius: "20px",
                  px: 2,
                  py: 0.5,
                  border: `1px solid ${alpha("#667eea", 0.2)}`,
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    mr: 1,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    fontSize: "0.8rem",
                  }}
                >
                  {role.charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{ color: "#667eea", fontWeight: 600 }}
                >
                  Logged in as {getRoleDisplayName(role)}
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
        <Grid container spacing={2} justifyContent="center">
          {navigationItems.map((item, index) => {
            if (
              (item.adminOnly && role !== "admin") ||
              (item.restricted && role !== "admin" && role !== "staff")
            ) {
              return null;
            }
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.label}>
                <Fade in={fadeIn} timeout={800 + index * 100}>
                  <Card
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      background: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.12)",
                        "& .icon-container": {
                          transform: "scale(1.05)",
                          background: alpha(
                            iconColors[item.path] || "#9E9E9E",
                            0.2,
                          ),
                        },
                      },
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent sx={{ p: 2, textAlign: "center" }}>
                      <Box
                        className="icon-container"
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: "12px",
                          background: alpha(
                            iconColors[item.path] || "#9E9E9E",
                            0.1,
                          ),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 1.5,
                          transition: "all 0.3s ease",
                          color: iconColors[item.path] || "#9E9E9E",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 0.5, color: "#333" }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#666", fontSize: "0.8rem" }}
                      >
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            );
          })}
        </Grid>
        <Fade in={fadeIn} timeout={1000}>
          <Box
            sx={{
              mt: 4,
              p: 2,
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Typography variant="h6" sx={{ color: "#555", mb: 1 }}>
              SADEV
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#777", maxWidth: 500, mx: "auto" }}
            >
              Developed by SADEV - Your trusted partner in software
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default Home;
