import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Print as PrintIcon } from "@mui/icons-material";
import moment from "moment";

// Client-side helper - no additional Firestore reads
const getLatestVisitData = (patient) => {
  if (!patient) return {};

  if (patient.pastVisits && patient.pastVisits.length > 0) {
    const latestVisit = patient.pastVisits[patient.pastVisits.length - 1];
    return {
      chiefComplaints:
        latestVisit.chiefComplaints || patient.chiefComplaints || "",
      diagnosis:
        latestVisit.diagnosis ||
        patient.diagnoses?.[patient.diagnoses.length - 1]?.text ||
        "",
      onExamination: latestVisit.onExamination || patient.onExamination || "",
      medicalAdvice: latestVisit.medicalAdvice || patient.medicalAdvice || "",
      prescribedTests:
        latestVisit.prescribedTests || patient.prescribedTests || [],
      prescription: latestVisit.prescription || patient.prescription || [],
      testResults: latestVisit.testResults || patient.testResults || {},
    };
  }

  return {
    chiefComplaints: patient.chiefComplaints || "",
    diagnosis: patient.diagnoses?.[patient.diagnoses.length - 1]?.text || "",
    onExamination: patient.onExamination || "",
    medicalAdvice: patient.medicalAdvice || "",
    prescribedTests: patient.prescribedTests || [],
    prescription: patient.prescription || [],
    testResults: patient.testResults || {},
  };
};

const PatientViewDialog = ({ patient, doctors, onClose, onPrint }) => {
  if (!patient) return null;

  const visitData = getLatestVisitData(patient);
  const doctor = doctors[patient.doctorId];

  return (
    <Dialog
      open={!!patient}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Patient Record: {patient.name}</Typography>
          <Chip
            label={patient.status || "N/A"}
            color={patient.status === "completed" ? "success" : "warning"}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Patient Information */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Patient Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">
              Bill No
            </Typography>
            <Typography variant="body2">{patient.billNo || "N/A"}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">
              Age
            </Typography>
            <Typography variant="body2">{patient.age || "N/A"}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">
              Gender
            </Typography>
            <Typography variant="body2">{patient.gender || "N/A"}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">
              Visit Date
            </Typography>
            <Typography variant="body2">
              {patient.appointmentDate
                ? moment(patient.appointmentDate).format("MMMM D, YYYY")
                : "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">
              Phone
            </Typography>
            <Typography variant="body2">{patient.phone || "N/A"}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">
              Address
            </Typography>
            <Typography variant="body2">{patient.address || "N/A"}</Typography>
          </Grid>
          {doctor && (
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Doctor
              </Typography>
              <Typography variant="body2">
                Dr. {doctor.nameEnglish || "N/A"}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Consultation Details */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Consultation Details
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary">
              Chief Complaints
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {visitData.chiefComplaints || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary">
              Examination Findings
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {visitData.onExamination || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary">
              Medical History
            </Typography>
            <Typography variant="body2">
              {patient.knownCaseOf || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary">
              Diagnosis
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="error.main">
              {visitData.diagnosis || "N/A"}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Lab Tests */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Lab Tests
        </Typography>
        {visitData.prescribedTests.length > 0 ? (
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visitData.prescribedTests.map((test, index) => (
                <TableRow key={index}>
                  <TableCell>{test}</TableCell>
                  <TableCell>
                    {visitData.testResults[test] || "Pending"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            No tests prescribed.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Prescription */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Prescription
        </Typography>
        {visitData.prescription.length > 0 ? (
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Medicine</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Dosage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visitData.prescription.map((med, index) => (
                <TableRow key={index}>
                  <TableCell>{med.medicine || "N/A"}</TableCell>
                  <TableCell>{med.type || "N/A"}</TableCell>
                  <TableCell>{med.note || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            No medication prescribed.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Medical Advice */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Medical Advice
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {visitData.medicalAdvice || "N/A"}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => onPrint(patient)}
          color="primary"
        >
          Print Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatientViewDialog;
