import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

const roleColors = {
  admin: "#ff6b6b",
  staff: "#4ecdc4",
  lab: "#45b7d1",
  default: "#95a5a6",
};

const navItems = [
  { label: "Home", path: "/home" },
  // Sales & Billing - Admin & Staff
  {
    label: "Sales & Billing",
    path: "/sales",
    roles: ["admin", "staff"],
  },
  // Lab Workstation - Admin & Lab
  {
    label: "Lab Workstation",
    path: "/lab-queue",
    roles: ["admin", "lab"],
  },
  { label: "Sales Report", path: "/insights", roles: ["admin", "staff"] },
  { label: "OPD Ticket", path: "/patient-registration" },
  { label: "Lab Tests", path: "/lab-tests", roles: ["admin", "lab"] },
  {
    label: "Charts",
    path: "/clinical-charts",
    roles: ["admin", "staff"],
  },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Consult", path: "/consulting", roles: ["admin", "staff"] },
  { label: "Returns", path: "/returns", roles: ["admin", "staff"] },
];

function Navbar({ userRole }) {
  const navigate = useNavigate();
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
    (item) =>
      !(item.adminOnly && userRole !== "admin") &&
      !(item.roles && !item.roles.includes(userRole)),
  );

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${alpha("#fff", 0.1)}`,
        px: { xs: 1, sm: 2 },
      }}
    >
      <Toolbar sx={{ minHeight: 60 }}>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              background: alpha("#fff", 0.15),
              borderRadius: "8px",
              padding: "6px 12px",
              mr: 1,
            }}
          >
            <LocalHospitalIcon sx={{ color: "#fff", fontSize: 20, mr: 0.5 }} />
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
                background: roleColors[userRole] || roleColors.default,
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 20,
                "& .MuiChip-label": { px: 1 },
              }}
            />
          )}
        </Box>

        {isMobile ? (
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
                  borderRadius: 1,
                  minWidth: 180,
                  "& .MuiMenuItem-root": {
                    color: "#fff",
                    py: 1,
                    px: 2,
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
                >
                  {item.label}
                </MenuItem>
              ))}
              <MenuItem
                onClick={handleLogout}
                sx={{ borderTop: `1px solid ${alpha("#fff", 0.2)}`, mt: 0.5 }}
              >
                <LogoutIcon sx={{ mr: 1, fontSize: 16 }} /> Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {filteredNavItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                to={item.path}
                sx={{
                  color: "#fff",
                  fontWeight: 500,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  textTransform: "none",
                  fontSize: "0.85rem",
                  "&:hover": {
                    background: alpha("#fff", 0.1),
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                color: "#fff",
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                textTransform: "none",
                background: alpha("#fff", 0.1),
                "&:hover": {
                  background: alpha("#ff6b6b", 0.2),
                },
              }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
