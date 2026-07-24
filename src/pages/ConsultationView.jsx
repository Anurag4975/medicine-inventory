import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Autocomplete,
  Chip,
  IconButton,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import {
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  collection,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";
import OPDTicket from "./OPDTicket";

const medicineTypes = [
  "Tab",
  "Syp",
  "Inj",
  "Cap",
  "Oint",
  "Lotion",
  "Inhaler",
  "Drops",
  "Other",
];

const ConsultationView = ({
  patient,
  availableTests,
  availableMedicines,
  onCancel,
  onSave,
  userRole,
}) => {
  // If the status is "waiting", this is a brand new visit. Ignore old database arrays to prevent duplication.
  const isNewVisit = patient.status === "waiting";

  const [diagnosis, setDiagnosis] = useState(
    isNewVisit ? "" : patient.diagnoses?.[0]?.text || "",
  );

  const [selectedTests, setSelectedTests] = useState(
    isNewVisit
      ? []
      : patient.prescribedTests?.map(
          (test) =>
            availableTests.find((t) => t.name === test) || { name: test },
        ) || [],
  );

  const [prescription, setPrescription] = useState(
    !isNewVisit && patient.prescription?.length > 0
      ? patient.prescription
      : [{ medicineId: "", medicine: "", type: "", note: "", stock: 0 }],
  );

  const [knownCaseOf, setKnownCaseOf] = useState(patient.knownCaseOf || ""); // Chronic info persists across all visits
  const [chiefComplaints, setChiefComplaints] = useState(
    isNewVisit ? "" : patient.chiefComplaints || "",
  );
  const [onExamination, setOnExamination] = useState(
    isNewVisit ? "" : patient.onExamination || "",
  );
  const [medicalAdvice, setMedicalAdvice] = useState(
    isNewVisit ? "" : patient.medicalAdvice || "",
  );

  const [currentTestResults, setCurrentTestResults] = useState(
    isNewVisit ? {} : patient.testResults || {},
  );
  const [testResultsDialogOpen, setTestResultsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ticketRef = useRef();

  useEffect(() => {
    setCurrentTestResults(isNewVisit ? {} : patient.testResults || {});
  }, [patient.testResults, isNewVisit]);

  const finalPrescription = prescription.filter(
    (p) => p.medicine && p.note && p.type,
  );
  const handlePrint = useReactToPrint({ content: () => ticketRef.current });

  const handleAddPrescriptionRow = () => {
    setPrescription([
      ...prescription,
      { medicineId: "", medicine: "", type: "", note: "", stock: 0 },
    ]);
  };

  const handleRemovePrescriptionRow = (index) => {
    if (prescription.length === 1) return;
    const list = [...prescription];
    list.splice(index, 1);
    setPrescription(list);
  };

  const handlePrescriptionChange = (e, index, field) => {
    const value = e.target ? e.target.value : e;
    const list = [...prescription];
    list[index][field] = value;
    setPrescription(list);
  };

  const syncLabOrder = async (resultsSnapshot) => {
    if (selectedTests.length === 0) return null;

    // Use DB-backed ID to ensure we never duplicate the order upon re-renders
    let orderId = patient.currentLabOrderId;
    let isNewOrder = !orderId;

    if (isNewOrder) {
      orderId = doc(collection(db, "labOrders")).id;
    }

    const testsWithoutResults = selectedTests.filter(
      (test) => !resultsSnapshot[test.name]?.trim(),
    );

    const orderData = {
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone || "",
      patientAge: patient.age || "",
      patientGender: patient.gender || "",
      doctorName: userRole,
      tests: selectedTests.map((test) => ({
        testId: test.id || null,
        name: test.name,
        price: test.price != null ? test.price : null,
        resultFormat: test.resultFormat || null,
        result: resultsSnapshot[test.name] || null,
      })),
      updatedAt: serverTimestamp(),
    };

    // Only a brand-new order gets queued for billing here. An order that's
    // already "billed" or "results-done" is NOT reset back to
    // "pending-billing" just because the doctor re-saved the draft —
    // otherwise a paid order would silently bounce back to the cashier
    // queue every time the doctor touches the consultation.
    //
    // KNOWN LIMITATION: if the doctor adds a *new* test to an order that's
    // already billed, that new test won't get its own billing prompt
    // automatically. For now, treat "adding tests mid-visit after billing"
    // as a separate manual step (re-prescribe as a fresh order, or handle
    // it in Sales.jsx as an add-on charge) rather than silently reopening
    // the whole order's status.
    if (isNewOrder) {
      orderData.orderStatus = "pending-billing";
    }

    if (isNewOrder) orderData.createdAt = serverTimestamp();

    await setDoc(doc(db, "labOrders", orderId), orderData, { merge: true });
    return orderId;
  };

  const handleSaveDraft = async () => {
    if (!diagnosis.trim())
      return alert("Please enter a diagnosis before saving.");
    setIsSaving(true);
    try {
      const patientRef = doc(db, "Patients", patient.id);
      let newStatus = "in-progress";

      if (selectedTests.length > 0) {
        const allResultsPresent = selectedTests.every((test) =>
          currentTestResults[test.name]?.trim(),
        );
        newStatus = allResultsPresent
          ? "test-completed"
          : "waiting-for-results";
      }

      // Sync Lab Order first to get the ID
      const activeLabOrderId = await syncLabOrder(currentTestResults);

      await updateDoc(patientRef, {
        knownCaseOf,
        chiefComplaints,
        onExamination,
        medicalAdvice,
        diagnoses: [
          { text: diagnosis, date: new Date().toISOString(), doctor: userRole },
        ],
        prescribedTests: selectedTests.map((test) => test.name),
        prescription: finalPrescription,
        testResults: currentTestResults,
        status: newStatus,
        currentLabOrderId: activeLabOrderId || null, // Lock the order to this patient visit
        updatedAt: new Date().toISOString(),
      });

      alert("Consultation draft saved successfully!");
      onSave();
    } catch (error) {
      alert("Failed to save draft: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!diagnosis.trim())
      return alert("Please enter a diagnosis before completing.");
    const testsWithoutResults = selectedTests.filter(
      (test) => !currentTestResults[test.name]?.trim(),
    );

    if (testsWithoutResults.length > 0) {
      return alert(
        `Please enter results for: ${testsWithoutResults.map((t) => t.name).join(", ")}`,
      );
    }

    if (
      !window.confirm("Mark consultation as completed? This cannot be undone.")
    )
      return;
    setIsSaving(true);
    try {
      const patientRef = doc(db, "Patients", patient.id);

      // Update the final lab order status one last time
      await syncLabOrder(currentTestResults);

      // Package the current visit data to save into history
      const currentVisitHistory = {
        date: new Date().toISOString(),
        doctor: userRole,
        diagnosis,
        chiefComplaints,
        onExamination,
        medicalAdvice,
        prescribedTests: selectedTests.map((test) => test.name),
        prescription: finalPrescription,
        testResults: currentTestResults,
      };

      await updateDoc(patientRef, {
        knownCaseOf, // Retain chronic conditions
        status: "completed",
        consultationStatus: "completed",
        updatedAt: new Date().toISOString(),
        pastVisits: arrayUnion(currentVisitHistory), // Push to history

        // WIPE active session data so the next visit starts entirely clean
        chiefComplaints: "",
        onExamination: "",
        medicalAdvice: "",
        prescribedTests: [],
        prescription: [],
        testResults: {},
        currentLabOrderId: null,
      });

      alert("Consultation completed and saved!");
      handlePrint();
      onSave();
    } catch (error) {
      alert("Failed to save: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={onCancel}>
          Back to Dashboard
        </Button>
        <Typography variant="h5">Consultation: {patient.name}</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => setTestResultsDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Test Results
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!diagnosis || finalPrescription.length === 0}
          >
            Print OPD Ticket
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Known Case Of (K/C/O)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={knownCaseOf}
            onChange={(e) => setKnownCaseOf(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Chief Complaints (C/C)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={chiefComplaints}
            onChange={(e) => setChiefComplaints(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            On Examination
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={onExamination}
            onChange={(e) => setOnExamination(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Diagnosis
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Prescribe Lab Tests
          </Typography>
          <Autocomplete
            multiple
            options={availableTests}
            getOptionLabel={(option) => option.name}
            value={selectedTests}
            onChange={(e, newVal) => setSelectedTests(newVal)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} label="Select Tests" />
            )}
          />

          {selectedTests.length > 0 && (
            <Table size="small" sx={{ mt: 2 }}>
              <TableBody>
                {selectedTests.map((test) => (
                  <TableRow key={test.name}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {test.name}
                      {patient.testLocations?.[test.name] === "sent-out" && (
                        <Chip
                          label="Sent-Out (External)"
                          size="small"
                          color="warning"
                          sx={{ ml: 1, fontSize: "0.7rem" }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {currentTestResults[test.name] ? (
                        <Typography>{currentTestResults[test.name]}</Typography>
                      ) : (
                        <Typography color="text.secondary">
                          Waiting for lab result...
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h6">Prescription</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddPrescriptionRow}
              size="small"
              disabled={isSaving}
            >
              Add Medicine
            </Button>
          </Box>
          {prescription.map((item, index) => (
            <Grid
              container
              spacing={2}
              key={index}
              sx={{ mb: 2, alignItems: "center" }}
            >
              <Grid item xs={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={item.type}
                    label="Type"
                    onChange={(e) => handlePrescriptionChange(e, index, "type")}
                  >
                    {medicineTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <Autocomplete
                  options={availableMedicines}
                  getOptionLabel={(option) =>
                    `${option.medicineName} (${option.quantity} in stock)`
                  }
                  value={
                    availableMedicines.find((m) => m.id === item.medicineId) ||
                    null
                  }
                  onChange={(e, newVal) => {
                    const list = [...prescription];
                    if (newVal) {
                      list[index].medicineId = newVal.id;
                      list[index].medicine = newVal.medicineName;
                      list[index].stock = newVal.quantity;
                    } else {
                      list[index].medicineId = "";
                      list[index].medicine = "";
                      list[index].stock = 0;
                    }
                    setPrescription(list);
                  }}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Medicine" size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Note"
                  size="small"
                  value={item.note}
                  onChange={(e) => handlePrescriptionChange(e, index, "note")}
                  placeholder="e.g., 500mg, 1-0-1, after food, for 7 days"
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  onClick={() => handleRemovePrescriptionRow(index)}
                  color="error"
                  disabled={prescription.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Medical Advice
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={medicalAdvice}
            onChange={(e) => setMedicalAdvice(e.target.value)}
          />
        </Grid>
      </Grid>

      <Dialog
        open={testResultsDialogOpen}
        onClose={() => setTestResultsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Results</DialogTitle>
        <DialogContent>
          <Table>
            <TableBody>
              {selectedTests.map((test) => (
                <TableRow key={test.name}>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={currentTestResults[test.name] || ""}
                      onChange={(e) =>
                        setCurrentTestResults((prev) => ({
                          ...prev,
                          [test.name]: e.target.value,
                        }))
                      }
                      placeholder="Enter test results..."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestResultsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveDraft}
          disabled={isSaving || !diagnosis.trim()}
        >
          {isSaving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleCompleteConsultation}
          disabled={
            isSaving || !diagnosis.trim() || finalPrescription.length === 0
          }
        >
          {isSaving ? "Saving..." : "Complete Consultation"}
        </Button>
      </Box>
      <div style={{ display: "none" }}>
        <OPDTicket
          ref={ticketRef}
          patient={patient}
          diagnosis={diagnosis}
          tests={selectedTests.map((t) => t.name)}
          prescription={finalPrescription}
          knownCaseOf={knownCaseOf}
          chiefComplaints={chiefComplaints}
          onExamination={onExamination}
          medicalAdvice={medicalAdvice}
          testResults={currentTestResults}
        />
      </div>
    </Paper>
  );
};
export default ConsultationView;
