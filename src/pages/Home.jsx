import { Typography, Box } from "@mui/material";

function Home() {
  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Medicine Inventory
      </Typography>
      <Typography variant="body1">
        Manage your stock, track sales, and more!
      </Typography>
    </Box>
  );
}

export default Home;
