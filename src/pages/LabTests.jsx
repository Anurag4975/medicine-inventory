import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import TestManagement from "./Lab/TestManagement";
import Billing from "./Lab/Billing";
import Insights from "./Lab/Insights";

const LabTests = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3, height: "100%" }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: "bold", color: "primary.main" }}
      >
        Laboratory Management System
      </Typography>
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Test Management" />
        <Tab label="Billing" />
        <Tab label="Insights" />
      </Tabs>
      {tabValue === 0 && <TestManagement />}
      {tabValue === 1 && <Billing />}
      {tabValue === 2 && <Insights />}
    </Box>
  );
};

export default LabTests;
