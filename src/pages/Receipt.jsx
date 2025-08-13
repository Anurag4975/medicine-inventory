import React from "react";
import { Box, Typography, Divider } from "@mui/material";

const Receipt = ({ patient, doctor, date }) => {
  return (
    <Box className="p-4">
      <Typography variant="h5" align="center" gutterBottom>
        Hospital Name
      </Typography>
      <Typography variant="subtitle1" align="center" gutterBottom>
        Patient Receipt
      </Typography>
      <Divider sx={{ my: 2 }} />

      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography>Patient ID:</Typography>
        <Typography>{patient.id}</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography>Name:</Typography>
        <Typography>{patient.name}</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography>Age/Gender:</Typography>
        <Typography>
          {patient.age}/{patient.gender}
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography>Doctor:</Typography>
        <Typography>{doctor?.name || "N/A"}</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography>Date:</Typography>
        <Typography>{date}</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" align="center">
        Thank you for visiting our hospital
      </Typography>
    </Box>
  );
};

export default Receipt;
