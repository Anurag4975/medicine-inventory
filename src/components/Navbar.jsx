import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  LocalHospital as LocalHospitalIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Science as ScienceIcon,
  Assessment as AssessmentIcon,
  BarChart as ChartsIcon,
  Dashboard as DashboardIcon,
  AssignmentReturn as ReturnsIcon,
} from "@mui/icons-material";

const roleColors = {
  admin: "#ff6b6b",
  staff: "#4ecdc4",
  lab: "#45b7d1",
  default: "#95a5a6",
};

// Updated to match your actual routes from Home page
const navItems = [
  { label: "Home", path: "/home", icon: <HomeIcon fontSize="small" /> },
  {
    label: "OPD Ticket",
    path: "/patient-registration",
    icon: <ReceiptIcon fontSize="small" />,
  },
  {
    label: "Consult",
    path: "/consulting",
    icon: <PeopleIcon fontSize="small" />,
    roles: ["admin", "staff"],
  },
  {
    label: "Sales",
    path: "/sales",
    icon: <ShoppingCartIcon fontSize="small" />,
    roles: ["admin", "staff"],
  },
  {
    label: "Sales Report",
    path: "/insights",
    icon: <AssessmentIcon fontSize="small" />,
    roles: ["admin", "staff"],
  },
  {
    label: "Lab Tests",
    path: "/lab-tests",
    icon: <ScienceIcon fontSize="small" />,
    roles: ["admin", "lab"],
  },
  {
    label: "Patient Records",
    path: "/patient-records",
    icon: <PeopleIcon fontSize="small" />,
  },
  {
    label: "Charts",
    path: "/clinical-charts",
    icon: <ChartsIcon fontSize="small" />,
    roles: ["admin", "staff"],
  },
  {
    label: "Doctors",
    path: "/dashboard",
    icon: <DashboardIcon fontSize="small" />,
  },
  {
    label: "Returns",
    path: "/Returns",
    icon: <ReturnsIcon fontSize="small" />,
    roles: ["admin", "staff"],
  },
];

function Navbar({ userRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:900px)");
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  );

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderBottom: `1px solid ${alpha("#fff", 0.1)}`,
      }}
    >
      <Toolbar sx={{ minHeight: 60, px: { xs: 1, sm: 2 } }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <Box
            component={Link}
            to="/home"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              background: alpha("#fff", 0.15),
              borderRadius: "8px",
              padding: "6px 12px",
              textDecoration: "none",
              "&:hover": {
                background: alpha("#fff", 0.25),
              },
            }}
          >
            <LocalHospitalIcon sx={{ color: "#fff", fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "0.5px",
              }}
            >
              SADEV
            </Typography>
          </Box>
          {userRole && (
            <Chip
              label={userRole.toUpperCase()}
              size="small"
              sx={{
                ml: 1,
                background: roleColors[userRole] || roleColors.default,
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          )}
        </Box>

        {/* Desktop Navigation */}
        {!isMobile ? (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {/* Main navigation items */}
            {filteredNavItems.slice(0, 6).map((item) => (
              <Button
                key={item.label}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  color: "#fff",
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  textTransform: "none",
                  fontSize: "0.85rem",
                  background:
                    location.pathname === item.path
                      ? alpha("#fff", 0.2)
                      : "transparent",
                  "&:hover": {
                    background: alpha("#fff", 0.15),
                  },
                }}
              >
                {item.label}
              </Button>
            ))}

            {/* More items dropdown if needed */}
            {filteredNavItems.length > 6 && (
              <>
                <Button
                  onClick={handleMenuOpen}
                  sx={{
                    color: "#fff",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "6px",
                    textTransform: "none",
                    fontSize: "0.85rem",
                    "&:hover": {
                      background: alpha("#fff", 0.15),
                    },
                  }}
                >
                  More ▾
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      background: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 2,
                      minWidth: 200,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  {filteredNavItems.slice(6).map((item) => (
                    <MenuItem
                      key={item.label}
                      component={Link}
                      to={item.path}
                      onClick={handleMenuClose}
                      sx={{ py: 1, gap: 1 }}
                    >
                      {item.icon}
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}

            {/* Logout button */}
            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                ml: 1,
                color: "#fff",
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                textTransform: "none",
                background: alpha("#ff6b6b", 0.2),
                "&:hover": {
                  background: alpha("#ff6b6b", 0.4),
                },
              }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          /* Mobile Navigation */
          <>
            <IconButton
              color="inherit"
              edge="end"
              onClick={handleMenuOpen}
              sx={{
                background: alpha("#fff", 0.1),
                "&:hover": { background: alpha("#fff", 0.2) },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 2,
                  minWidth: 200,
                  "& .MuiMenuItem-root": {
                    color: "#fff",
                    py: 1.5,
                    px: 2,
                    fontSize: "0.9rem",
                    "&:hover": { background: alpha("#fff", 0.1) },
                  },
                },
              }}
            >
              {filteredNavItems.map((item) => (
                <MenuItem
                  key={item.label}
                  component={Link}
                  to={item.path}
                  onClick={handleMenuClose}
                  selected={location.pathname === item.path}
                  sx={{ gap: 1 }}
                >
                  {item.icon}
                  {item.label}
                </MenuItem>
              ))}
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleLogout();
                }}
                sx={{
                  borderTop: `1px solid ${alpha("#fff", 0.2)}`,
                  mt: 1,
                  color: "#ff6b6b !important",
                  gap: 1,
                }}
              >
                <LogoutIcon sx={{ fontSize: 18 }} /> Logout
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
