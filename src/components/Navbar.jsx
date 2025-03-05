import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Navbar({ userRole }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Medicine Inventory
        </Typography>
        <Button color="inherit" component={Link} to="/">
          Home
        </Button>
        {userRole === "admin" && (
          <Button color="inherit" component={Link} to="/stock">
            Stock
          </Button>
        )}
        <Button color="inherit" component={Link} to="/Sales">
          Sales
        </Button>
        <Button color="inherit" component={Link} to="/insights">
          Insights
        </Button>
        <Button color="inherit" component={Link} to="/dashboard">
          Dashboard
        </Button>
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
