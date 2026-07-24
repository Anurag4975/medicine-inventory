import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Person as PersonIcon, Print as PrintIcon } from "@mui/icons-material";
import moment from "moment";

const PatientViewDialog = ({ patient, doctors, onClose, onPrint }) => {
  if (!patient) return null;

  return (
    <Dialog open={!!patient} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
        <PersonIcon sx={{ mr: 1 }} />
        Patient Record: {patient.name}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Patient Info Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Patient Information
            </Typography>
            <Box>
              <Typography variant="body2">
                <strong>Bill No:</strong> {patient.billNo}
              </Typography>
              <Typography variant="body2">
                <strong>Age:</strong> {patient.age}
              </Typography>
              <Typography variant="body2">
                <strong>Gender:</strong> {patient.gender}
              </Typography>
              <Typography variant="body2">
                <strong>Visit Date:</strong>{" "}
                {moment(patient.appointmentDate).format("LL")}
              </Typography>
              <Typography variant="body2">
                <strong>Phone:</strong> {patient.phone}
              </Typography>

              <Typography variant="body2">
                <strong>Address:</strong> {patient.address}
              </Typography>
            </Box>
          </Grid>

          {/* Consultation Details Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Consultation Details
            </Typography>
            <Box>
              <Typography variant="body2">
                <strong>Chief Complaints:</strong>{" "}
                {patient.chiefComplaints || "N/A"}
              </Typography>
              <Typography variant="body2">
                <strong>Examination Findings:</strong>{" "}
                {patient.onExamination || "N/A"}
              </Typography>
              <Typography variant="body2">
                <strong>Medical History:</strong> {patient.knownCaseOf || "N/A"}
              </Typography>
              <Typography variant="body2">
                <strong>Diagnosis:</strong>{" "}
                {patient.diagnoses?.[0]?.text || "N/A"}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          {/* Tests Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Lab Tests
            </Typography>
            {patient.prescribedTests?.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {patient.prescribedTests.map((test, i) => (
                  <Chip key={i} label={test} />
                ))}
              </Box>
            ) : (
              <Typography variant="body2">No tests prescribed.</Typography>
            )}
            {patient.testResults &&
              Object.keys(patient.testResults).length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Results:
                  </Typography>
                  {Object.entries(patient.testResults).map(([test, result]) => (
                    <Typography key={test} variant="body2">
                      <strong>{test}:</strong> {result}
                    </Typography>
                  ))}
                </Box>
              )}
          </Grid>
          {/* Prescription Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Prescription
            </Typography>
            {patient.prescription?.length > 0 ? (
              <List dense sx={{ p: 0 }}>
                {patient.prescription.map((med, i) => (
                  <ListItem key={i} sx={{ p: 0 }}>
                    <ListItemText
                      primary={`${med.medicine} (${med.type})`}
                      secondary={med.note}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2">No medication prescribed.</Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          {/* Advice Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Medical Advice
            </Typography>
            <Typography variant="body2">
              {patient.medicalAdvice || "N/A"}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onPrint(patient)} startIcon={<PrintIcon />}>
          Print Record
        </Button>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatientViewDialog;
