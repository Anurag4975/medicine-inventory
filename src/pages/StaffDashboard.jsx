import { Typography, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import Logout from "../components/Logout";

function StaffDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Staff Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Welcome, Staff! Handle purchases and view stock.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          component={Link}
          to="/purchases"
          sx={{ mr: 2 }}
        >
          Record Purchase
        </Button>
        <Button variant="contained" component={Link} to="/stock">
          View Stock
        </Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Logout />
      </Box>
    </Box>
  );
}

export default StaffDashboard;
