import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";

function Navbar({ userRole }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Medicine Inventory
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              edge="end"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem component={Link} to="/home" onClick={handleMenuClose}>
                Home
              </MenuItem>
              {userRole === "admin" && (
                <MenuItem
                  component={Link}
                  to="/stock"
                  onClick={handleMenuClose}
                >
                  Stock
                </MenuItem>
              )}
              <MenuItem component={Link} to="/sales" onClick={handleMenuClose}>
                Sales
              </MenuItem>
              <MenuItem
                component={Link}
                to="/insights"
                onClick={handleMenuClose}
              >
                Sales-Insights
              </MenuItem>
              <MenuItem
                component={Link}
                to="/patient-registration"
                onClick={handleMenuClose}
              >
                OPD Ticket
              </MenuItem>
              <MenuItem
                component={Link}
                to="/lab-tests"
                onClick={handleMenuClose}
              >
                Lab
              </MenuItem>
              <MenuItem
                component={Link}
                to="/patient-records"
                onClick={handleMenuClose}
              >
                Patient Records
              </MenuItem>
              <MenuItem
                component={Link}
                to="/dashboard"
                onClick={handleMenuClose}
              >
                Dashboard
              </MenuItem>
              {(userRole === "admin" || userRole === "staff") && (
                <MenuItem
                  component={Link}
                  to="/Returns"
                  onClick={handleMenuClose}
                >
                  Returns
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <Box
            sx={{ display: "flex", flexGrow: 1, justifyContent: "flex-end" }}
          >
            <Button color="inherit" component={Link} to="/home">
              Home
            </Button>
            {userRole === "admin" && (
              <Button color="inherit" component={Link} to="/stock">
                Stock
              </Button>
            )}
            <Button color="inherit" component={Link} to="/sales">
              Sales
            </Button>
            <Button color="inherit" component={Link} to="/insights">
              Sales-Insights
            </Button>
            <Button color="inherit" component={Link} to="/patient-registration">
              OPD Ticket
            </Button>
            {userRole === "admin" || userRole === "lab" ? (
              <Button color="inherit" component={Link} to="/lab-tests">
                Lab
              </Button>
            ) : null}

            <Button color="inherit" component={Link} to="/patient-records">
              Patient Records
            </Button>
            <Button color="inherit" component={Link} to="/dashboard">
              Dashboard
            </Button>
            {(userRole === "admin" || userRole === "staff") && (
              <Button color="inherit" component={Link} to="/Returns">
                Returns
              </Button>
            )}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
