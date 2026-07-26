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
  CircularProgress,
} from "@mui/material";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  arrayUnion,
  writeBatch,
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

// Simple cache helper
const clearPatientCache = (patientId) => {
  try {
    sessionStorage.removeItem(`patient_${patientId}`);
    sessionStorage.removeItem("stockData");
  } catch (e) {
    // Ignore cache errors
  }
};

const saveToLocalQueue = (data) => {
  try {
    const pendingConsultations = JSON.parse(
      localStorage.getItem("pending_consultations") || "[]",
    );
    pendingConsultations.push({
      ...data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(
      "pending_consultations",
      JSON.stringify(pendingConsultations),
    );
    return true;
  } catch (e) {
    console.error("Failed to save to local queue:", e);
    return false;
  }
};

const ConsultationView = ({
  patient,
  availableTests,
  availableMedicines,
  onCancel,
  onSave,
  userRole,
  doctors = {},
}) => {
  const isNewVisit = patient.status === "waiting";

  // State
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
  const [knownCaseOf, setKnownCaseOf] = useState(patient.knownCaseOf || "");
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
  const [showTicket, setShowTicket] = useState(false);
  const [savingMessage, setSavingMessage] = useState("");

  const ticketRef = useRef();
  const typeRefs = useRef([]); // Refs for Type Select fields

  const finalPrescription = prescription.filter(
    (p) => p.medicine && p.note && p.type,
  );
  const doctorData = doctors[patient.doctorId];

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
    documentTitle: `OPD_Ticket_${patient.name}_${patient.billNo}`,
    onAfterPrint: () => {
      console.log("Print completed");
      setShowTicket(false);
    },
  });

  // Trigger print when showTicket becomes true
  useEffect(() => {
    if (showTicket && doctorData && ticketRef.current) {
      const timer = setTimeout(() => {
        handlePrint();
        setTimeout(() => {
          onSave();
        }, 1500);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showTicket, doctorData]);

  // ---------------------------------------------------------------------------
  // OPTIMIZED: Single batch write for all operations
  // ---------------------------------------------------------------------------
  const saveConsultation = async (complete = false) => {
    if (!diagnosis.trim()) {
      alert("Please enter a diagnosis before saving.");
      return;
    }

    if (complete) {
      const testsWithoutResults = selectedTests.filter(
        (test) => !currentTestResults[test.name]?.trim(),
      );
      if (testsWithoutResults.length > 0) {
        alert(
          `Please enter results for: ${testsWithoutResults.map((t) => t.name).join(", ")}`,
        );
        return;
      }
      if (
        !window.confirm(
          "Mark consultation as completed? This cannot be undone.",
        )
      )
        return;
    }

    setIsSaving(true);
    setSavingMessage(
      complete ? "Completing consultation..." : "Saving draft...",
    );

    try {
      const batch = writeBatch(db);
      const patientRef = doc(db, "Patients", patient.id);

      let newStatus = "in-progress";
      if (complete) {
        newStatus = "completed";
      } else if (selectedTests.length > 0) {
        const allResultsPresent = selectedTests.every((test) =>
          currentTestResults[test.name]?.trim(),
        );
        newStatus = allResultsPresent
          ? "test-completed"
          : "waiting-for-results";
      }

      const patientUpdate = {
        knownCaseOf,
        chiefComplaints: complete ? "" : chiefComplaints,
        onExamination: complete ? "" : onExamination,
        medicalAdvice: complete ? "" : medicalAdvice,
        diagnoses: [
          { text: diagnosis, date: new Date().toISOString(), doctor: userRole },
        ],
        prescribedTests: selectedTests.map((test) => test.name),
        prescription: finalPrescription,
        testResults: currentTestResults,
        status: newStatus,
        consultationStatus: complete ? "completed" : "in-progress",
        updatedAt: new Date().toISOString(),
      };

      if (complete) {
        patientUpdate.pastVisits = arrayUnion({
          date: new Date().toISOString(),
          doctor: userRole,
          diagnosis,
          chiefComplaints,
          onExamination,
          medicalAdvice,
          prescribedTests: selectedTests.map((test) => test.name),
          prescription: finalPrescription,
          testResults: currentTestResults,
        });
        patientUpdate.prescribedTests = [];
        patientUpdate.prescription = [];
        patientUpdate.testResults = {};
        patientUpdate.currentLabOrderId = null;
      }

      if (selectedTests.length > 0) {
        let orderId = patient.currentLabOrderId;
        const isNewOrder = !orderId;

        if (isNewOrder) {
          orderId = doc(collection(db, "labOrders")).id;
        }

        const labOrderRef = doc(db, "labOrders", orderId);
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
            result: currentTestResults[test.name] || null,
          })),
          updatedAt: serverTimestamp(),
        };

        if (isNewOrder) {
          orderData.orderStatus = "pending-billing";
          orderData.createdAt = serverTimestamp();
        }

        batch.set(labOrderRef, orderData, { merge: true });

        if (isNewOrder) {
          patientUpdate.currentLabOrderId = orderId;
        }
      }

      batch.update(patientRef, patientUpdate);
      await batch.commit();
      clearPatientCache(patient.id);

      if (complete) {
        if (doctorData) {
          setShowTicket(true);
        } else {
          alert("Consultation completed successfully!");
          onSave();
        }
      } else {
        alert("Consultation draft saved successfully!");
        onSave();
      }
    } catch (error) {
      console.error("Save error:", error);

      const saved = saveToLocalQueue({
        patientId: patient.id,
        diagnosis,
        selectedTests: selectedTests.map((t) => t.name),
        prescription: finalPrescription,
        knownCaseOf,
        chiefComplaints,
        onExamination,
        medicalAdvice,
        testResults: currentTestResults,
        complete,
        userRole,
      });

      if (saved) {
        alert(
          "Network error! Consultation saved locally. Will sync when connection is restored.",
        );
        onSave();
      } else {
        alert("Failed to save: " + error.message);
      }
    } finally {
      setIsSaving(false);
      setSavingMessage("");
    }
  };

  const handleSaveDraft = () => saveConsultation(false);
  const handleCompleteConsultation = () => saveConsultation(true);

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

  // Handle Enter key in note field - add new row and focus on Type
  const handleNoteKeyDown = (e, index) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const currentItem = prescription[index];
      if (currentItem.medicine && currentItem.note && currentItem.type) {
        handleAddPrescriptionRow();
        // Focus on the Type select of the new row after render
        setTimeout(() => {
          const newIndex = prescription.length;
          if (typeRefs.current[newIndex]) {
            typeRefs.current[newIndex].focus();
          }
        }, 100);
      }
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      {/* Saving overlay */}
      {isSaving && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.3)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <CircularProgress size={60} sx={{ color: "#fff" }} />
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.5)",
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            {savingMessage}
          </Typography>
        </Box>
      )}

      {/* Header */}
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
            onClick={() => {
              if (doctorData) {
                setShowTicket(true);
              } else {
                alert("Doctor information not found. Cannot print ticket.");
              }
            }}
            disabled={!diagnosis || finalPrescription.length === 0}
          >
            Print OPD Ticket
          </Button>
        </Box>
      </Box>

      {/* Form Fields */}
      <Grid container spacing={3}>
        {/* K/C/O */}
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
            placeholder="e.g., HTN, DM, Asthma..."
          />
        </Grid>

        {/* Chief Complaints */}
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
            placeholder="Describe patient's main complaints..."
          />
        </Grid>

        {/* On Examination */}
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
            placeholder="Physical examination findings..."
          />
        </Grid>

        {/* Diagnosis */}
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
            placeholder="Enter diagnosis..."
            required
          />
        </Grid>

        {/* Lab Tests */}
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

        {/* Prescription */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h6">
              Prescription (R<sub>x</sub>)
            </Typography>
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
              spacing={1}
              key={index}
              sx={{ mb: 1.5, alignItems: "center" }}
            >
              {/* Type - Focused when new row added */}
              <Grid item xs={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={item.type}
                    label="Type"
                    onChange={(e) => handlePrescriptionChange(e, index, "type")}
                    inputRef={(ref) => (typeRefs.current[index] = ref)}
                  >
                    {medicineTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Medicine */}
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
                    <TextField
                      {...params}
                      label="Medicine"
                      size="small"
                      placeholder="Search medicine..."
                    />
                  )}
                />
              </Grid>

              {/* Note */}
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Note (Dosage & Instructions)"
                  size="small"
                  value={item.note}
                  onChange={(e) => handlePrescriptionChange(e, index, "note")}
                  onKeyDown={(e) => handleNoteKeyDown(e, index)}
                  placeholder="e.g., 500mg, 1-0-1, after food, for 7 days"
                />
              </Grid>

              {/* Delete */}
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

        {/* Medical Advice */}
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
            placeholder="Additional advice for the patient..."
          />
        </Grid>
      </Grid>

      {/* Test Results Dialog */}
      <Dialog
        open={testResultsDialogOpen}
        onClose={() => setTestResultsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Results</DialogTitle>
        <DialogContent>
          {selectedTests.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No tests prescribed yet.
            </Typography>
          ) : (
            <Table>
              <TableBody>
                {selectedTests.map((test) => (
                  <TableRow key={test.name}>
                    <TableCell sx={{ fontWeight: "bold", width: "30%" }}>
                      {test.name}
                    </TableCell>
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
                        placeholder={`Enter ${test.name} results...`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestResultsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Buttons */}
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
          {isSaving ? "Saving..." : "Complete Consultation & Print"}
        </Button>
      </Box>

      {/* Hidden OPD Ticket for printing */}
      <div style={{ display: showTicket ? "block" : "none" }}>
        <div ref={ticketRef}>
          <OPDTicket
            patient={patient}
            diagnosis={diagnosis}
            tests={selectedTests.map((t) => t.name)}
            prescription={finalPrescription}
            knownCaseOf={knownCaseOf}
            chiefComplaints={chiefComplaints}
            onExamination={onExamination}
            medicalAdvice={medicalAdvice}
            testResults={currentTestResults}
            doctor={doctorData}
          />
        </div>
      </div>
    </Paper>
  );
};

export default ConsultationView;
