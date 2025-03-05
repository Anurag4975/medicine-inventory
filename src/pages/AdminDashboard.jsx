import { Typography, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import Logout from "../components/Logout";

function AdminDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Welcome, Admin! Manage everything from here.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" component={Link} to="/stock" sx={{ mr: 2 }}>
          Manage Stock
        </Button>
        <Button
          variant="contained"
          component={Link}
          to="/purchases"
          sx={{ mr: 2 }}
        >
          View Purchases
        </Button>
        <Button variant="contained" component={Link} to="/insights">
          Data Insights
        </Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Logout />
      </Box>
    </Box>
  );
}

export default AdminDashboard;
