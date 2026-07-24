import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import dayjs from "dayjs";

const PrintTemplate = ({ data }) => {
  if (!data) return null;

  const { patient, visit, doctor } = data;

  return (
    <Box sx={{ p: 2, fontFamily: "Arial" }}>
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: Arial;
            }
          }
        `}
      </style>

      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          SADEV CLINIC
        </Typography>
        <Typography variant="body2">
          Pratima Chowk, Birgunj - 13, Parsa, Madhesh Province, Nepal
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          N.M.C. NO. {doctor.nmcNumber}
        </Typography>
      </Box>

      <Divider sx={{ my: 1, borderWidth: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            Dr. {doctor.name}
          </Typography>
          <Typography variant="body2">{doctor.specialization}</Typography>
          <Typography variant="body2">N.M.C. NO. {doctor.nmcNumber}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {dayjs().format("DD MMM YYYY h:mm A")}
          </Typography>
          <Typography variant="body2">OPD No: {patient.billNo}</Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          Patient Information
        </Typography>
        <Typography variant="body2">Name: {patient.name}</Typography>
        <Typography variant="body2">
          Age/Sex: {patient.age} years / {patient.gender}
        </Typography>
        <Typography variant="body2">Address: {patient.address}</Typography>
        <Typography variant="body2">Phone: {patient.phone}</Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: "flex", mb: 3 }}>
        <Box sx={{ flex: 1, pr: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
            Diagnosis
          </Typography>
          {visit.diagnoses?.map((diag, idx) => (
            <Typography key={idx} variant="body2">
              - {diag.text}
            </Typography>
          ))}

          <Typography variant="body1" sx={{ fontWeight: "bold", mt: 2, mb: 1 }}>
            Lab Tests
          </Typography>
          {visit.tests?.map((test, idx) => (
            <Typography key={idx} variant="body2">
              - {test.name}: {test.details}
            </Typography>
          ))}
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
            Prescriptions
          </Typography>
          {visit.prescriptions?.map((med, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {med.medicine}
              </Typography>
              <Typography variant="body2">- Dosage: {med.dosage}</Typography>
              <Typography variant="body2">
                - Frequency: {med.frequency}
              </Typography>
              <Typography variant="body2">
                - Duration: {med.duration}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
          नोट १४ दिन पछि पुनः फी लाग्ने छ।
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          SADEV CLINIC
        </Typography>
        <Typography variant="body2">
          Pratima Chowk, Birgunj - 13, Parsa, Madhesh Province, Nepal
        </Typography>
        <Typography variant="body2">
          📞 +977-9809246610 | +977-9709498572 | 9861026910
        </Typography>
      </Box>
    </Box>
  );
};

export default PrintTemplate;
