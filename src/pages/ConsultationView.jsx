import React, { useState, useRef, useEffect } from "react";
import { appCache, CACHE_KEYS, cacheEvents } from "../utils/appCache";
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
  TableHead,
  TableCell,
  TableRow,
  CircularProgress,
  Divider,
  Badge,
} from "@mui/material";
import {
  doc,
  collection,
  arrayUnion,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
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

const clearPatientCache = (patientId) => {
  try {
    sessionStorage.removeItem(`patient_${patientId}`);
  } catch (e) {}
};

const saveToLocalQueue = (data) => {
  try {
    const pending = JSON.parse(
      localStorage.getItem("pending_consultations") || "[]",
    );
    pending.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem("pending_consultations", JSON.stringify(pending));
    return true;
  } catch (e) {
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

  const [diagnosis, setDiagnosis] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);
  const [prescription, setPrescription] = useState([
    { medicineId: "", medicine: "", type: "", note: "", stock: 0 },
  ]);
  const [knownCaseOf, setKnownCaseOf] = useState("");
  const [chiefComplaints, setChiefComplaints] = useState("");
  const [onExamination, setOnExamination] = useState("");
  const [medicalAdvice, setMedicalAdvice] = useState("");
  const [currentTestResults, setCurrentTestResults] = useState({});
  const [testResultsDialogOpen, setTestResultsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [savingMessage, setSavingMessage] = useState("");
  const [labOrders, setLabOrders] = useState([]);
  const [labOrdersLoading, setLabOrdersLoading] = useState(false);
  const [showLabOrders, setShowLabOrders] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const ticketRef = useRef();
  const typeRefs = useRef([]);
  const finalPrescription = prescription.filter(
    (p) => p.medicine && p.note && p.type,
  );
  const doctorData = doctors[patient.doctorId];

  // =========================================================================
  // INITIALIZE
  // =========================================================================
  useEffect(() => {
    if (initialized) return;
    setDiagnosis(isNewVisit ? "" : patient.diagnoses?.[0]?.text || "");
    setKnownCaseOf(patient.knownCaseOf || "");
    setChiefComplaints(isNewVisit ? "" : patient.chiefComplaints || "");
    setOnExamination(isNewVisit ? "" : patient.onExamination || "");
    setMedicalAdvice(isNewVisit ? "" : patient.medicalAdvice || "");
    setCurrentTestResults(isNewVisit ? {} : patient.testResults || {});
    if (!isNewVisit && patient.prescription?.length > 0) {
      setPrescription(patient.prescription);
    }
    loadTestsFromPatientOrLab();
    setInitialized(true);
  }, [patient?.id]);

  // =========================================================================
  // LOAD TESTS
  // =========================================================================
  const loadTestsFromPatientOrLab = async () => {
    if (isNewVisit) {
      setSelectedTests([]);
      return;
    }

    const prescribedNames = patient.prescribedTests || [];
    if (prescribedNames.length > 0 && availableTests.length > 0) {
      const matched = matchTestsToAvailable(prescribedNames, availableTests);
      if (matched.length > 0) {
        setSelectedTests(matched);
        return;
      }
    }

    if (patient?.id) {
      try {
        const q = query(
          collection(db, "labOrders"),
          where("patientId", "==", patient.id),
          orderBy("createdAt", "desc"),
          limit(5),
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const allTests = [];
          const allResults = {};
          snapshot.docs.forEach((doc) => {
            const order = doc.data();
            (order.tests || []).forEach((test) => {
              if (!allTests.find((t) => t.name === test.name)) {
                allTests.push({
                  name: test.name,
                  id: test.testId,
                  price: test.price,
                  resultFormat: test.resultFormat,
                });
              }
              if (test.result) allResults[test.name] = test.result;
            });
          });
          const matched = matchTestsToAvailable(
            allTests.map((t) => t.name),
            availableTests,
          );
          if (matched.length > 0) setSelectedTests(matched);
          if (Object.keys(allResults).length > 0)
            setCurrentTestResults((prev) => ({ ...allResults, ...prev }));
        }
      } catch (error) {
        console.error("Error loading from lab orders:", error);
      }
    }
  };

  const matchTestsToAvailable = (testNames, available) => {
    const matched = testNames
      .map((name) => {
        let found = available.find((t) => t.name === name);
        if (!found)
          found = available.find((t) => t.name?.trim() === name?.trim());
        if (!found)
          found = available.find(
            (t) => t.name?.toLowerCase() === name?.toLowerCase(),
          );
        if (!found)
          found = available.find(
            (t) => t.name?.includes(name) || name?.includes(t.name),
          );
        return found || null;
      })
      .filter(Boolean);
    const unique = [];
    const seen = new Set();
    matched.forEach((t) => {
      const key = t.id || t.name;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(t);
      }
    });
    return unique;
  };

  // =========================================================================
  // FETCH LAB ORDERS
  // =========================================================================
  const fetchLabOrders = async () => {
    if (!patient?.id) return;
    setLabOrdersLoading(true);
    try {
      const q = query(
        collection(db, "labOrders"),
        where("patientId", "==", patient.id),
        orderBy("createdAt", "desc"),
        limit(10),
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLabOrders(orders);
      const labResults = {};
      orders.forEach((order) => {
        if (order.orderStatus === "completed") {
          (order.tests || []).forEach((test) => {
            if (test.result) labResults[test.name] = test.result;
          });
        }
      });
      if (Object.keys(labResults).length > 0)
        setCurrentTestResults((prev) => ({ ...labResults, ...prev }));
    } catch (error) {
      console.error("Error fetching lab orders:", error);
    } finally {
      setLabOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (testResultsDialogOpen || showLabOrders) fetchLabOrders();
  }, [testResultsDialogOpen, showLabOrders]);

  // =========================================================================
  // PRINT
  // =========================================================================
  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
    documentTitle: `OPD_Ticket_${patient.name}_${patient.billNo}`,
    onAfterPrint: () => setShowTicket(false),
  });

  useEffect(() => {
    if (showTicket && doctorData && ticketRef.current) {
      const timer = setTimeout(() => {
        handlePrint();
        setTimeout(onSave, 1500);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showTicket, doctorData]);

  // =========================================================================
  // SAVE CONSULTATION (with smart lab order handling)
  // =========================================================================
  const saveConsultation = async (complete = false) => {
    if (!diagnosis.trim()) {
      alert("Please enter a diagnosis.");
      return;
    }
    if (complete) {
      const missing = selectedTests.filter(
        (t) => !currentTestResults[t.name]?.trim(),
      );
      if (missing.length > 0) {
        alert(`Enter results for: ${missing.map((t) => t.name).join(", ")}`);
        return;
      }
      if (!window.confirm("Mark as completed?")) return;
    }

    setIsSaving(true);
    setSavingMessage(complete ? "Completing..." : "Saving...");

    try {
      const batch = writeBatch(db);
      const patientRef = doc(db, "Patients", patient.id);
      const now = new Date().toISOString();
      let newStatus = complete
        ? "completed"
        : selectedTests.length > 0
          ? selectedTests.every((t) => currentTestResults[t.name]?.trim())
            ? "test-completed"
            : "waiting-for-results"
          : "in-progress";

      const patientUpdate = {
        knownCaseOf,
        chiefComplaints: complete ? "" : chiefComplaints,
        onExamination: complete ? "" : onExamination,
        medicalAdvice: complete ? "" : medicalAdvice,
        diagnoses: [{ text: diagnosis, date: now, doctor: userRole }],
        prescribedTests: selectedTests.map((t) => t.name),
        prescription: finalPrescription,
        testResults: currentTestResults,
        status: newStatus,
        consultationStatus: complete ? "completed" : "in-progress",
        updatedAt: now,
      };

      if (complete) {
        patientUpdate.pastVisits = arrayUnion({
          date: now,
          doctor: userRole,
          diagnosis,
          chiefComplaints,
          onExamination,
          medicalAdvice,
          prescribedTests: selectedTests.map((t) => t.name),
          prescription: finalPrescription,
          testResults: currentTestResults,
        });
        patientUpdate.prescribedTests = [];
        patientUpdate.prescription = [];
        patientUpdate.testResults = {};
        patientUpdate.currentLabOrderId = null;
      }

      // =========================================================================
      // SMART LAB ORDER - No duplicate billing
      // =========================================================================
      if (selectedTests.length > 0) {
        let orderId = patient.currentLabOrderId;
        let isNewOrder = !orderId;

        // If no currentLabOrderId, check for existing orders
        if (!orderId) {
          try {
            const existingQuery = query(
              collection(db, "labOrders"),
              where("patientId", "==", patient.id),
              orderBy("createdAt", "desc"),
              limit(1),
            );
            const existingSnapshot = await getDocs(existingQuery);

            if (!existingSnapshot.empty) {
              const latestOrder = existingSnapshot.docs[0].data();
              const hasUnbilledTests = (latestOrder.tests || []).some(
                (t) =>
                  t.billingStatus !== "billed" && t.billingStatus !== "paid",
              );

              if (
                hasUnbilledTests ||
                latestOrder.orderStatus === "pending-billing"
              ) {
                orderId = existingSnapshot.docs[0].id;
                isNewOrder = false;
              } else {
                orderId = doc(collection(db, "labOrders")).id;
                isNewOrder = true;
              }
            } else {
              orderId = doc(collection(db, "labOrders")).id;
              isNewOrder = true;
            }
          } catch (e) {
            orderId = doc(collection(db, "labOrders")).id;
            isNewOrder = true;
          }
        }

        const labOrderRef = doc(db, "labOrders", orderId);

        // Get existing tests
        // REPLACE this section (around line 200-230) in saveConsultation:

        // Get existing tests
        let existingTests = [];
        if (!isNewOrder) {
          try {
            const existingDoc = await getDoc(doc(db, "labOrders", orderId));
            if (existingDoc.exists())
              existingTests = existingDoc.data().tests || [];
          } catch (e) {}
        }

        // Separate already billed tests
        const alreadyBilledTests = existingTests.filter(
          (t) => t.billingStatus === "billed" || t.billingStatus === "paid",
        );
        const alreadyBilledNames = alreadyBilledTests.map((t) => t.name);

        // Get all existing test names (to prevent duplicates)
        const allExistingNames = existingTests.map((t) => t.name);

        // New tests: ones that DON'T exist in the order at all
        const newTestsToBill = selectedTests
          .filter((test) => !allExistingNames.includes(test.name))
          .map((test) => ({
            testId: test.id || null,
            name: test.name,
            price: test.price != null ? test.price : null,
            resultFormat: test.resultFormat || null,
            result: currentTestResults[test.name] || null,
            billingStatus: "pending",
            addedAt: now,
          }));

        // Update existing unbilled tests (don't duplicate!)
        const updatedExistingTests = existingTests
          .filter(
            (t) => t.billingStatus !== "billed" && t.billingStatus !== "paid",
          )
          .map((t) => {
            const updatedTest = selectedTests.find((st) => st.name === t.name);
            if (updatedTest) {
              return {
                ...t,
                price: updatedTest.price != null ? updatedTest.price : t.price,
                result: currentTestResults[t.name] || t.result,
                updatedAt: now,
              };
            }
            return t;
          });

        // Remove duplicates from updatedExistingTests
        const uniqueUpdatedTests = [];
        const seenNames = new Set();
        updatedExistingTests.forEach((t) => {
          if (!seenNames.has(t.name)) {
            seenNames.add(t.name);
            uniqueUpdatedTests.push(t);
          }
        });

        // Combine: billed + updated + new (NO duplicates)
        const allTests = [
          ...alreadyBilledTests,
          ...uniqueUpdatedTests,
          ...newTestsToBill,
        ];

        // Final deduplication safety check
        const finalTests = [];
        const finalNames = new Set();
        allTests.forEach((t) => {
          if (!finalNames.has(t.name)) {
            finalNames.add(t.name);
            finalTests.push(t);
          }
        });

        const hasPendingBilling = finalTests.some(
          (t) => t.billingStatus === "pending",
        );

        const orderData = {
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: patient.phone || "",
          patientAge: patient.age || "",
          patientGender: patient.gender || "",
          doctorName: userRole,
          billNo: patient.billNo || "",
          tests: finalTests,
          updatedAt: now,
        };

        if (isNewOrder) {
          orderData.createdAt = now;
          orderData.orderStatus = "pending-billing";
          orderData.paymentStatus = "unpaid";
        } else if (hasPendingBilling && newTestsToBill.length > 0) {
          orderData.orderStatus = "pending-billing";
        }

        batch.set(labOrderRef, orderData, { merge: true });
        if (isNewOrder) patientUpdate.currentLabOrderId = orderId;
      }

      batch.update(patientRef, patientUpdate);
      await batch.commit();

      clearPatientCache(patient.id);
      try {
        await appCache.invalidatePatient(patient.id);
        await appCache.invalidatePatients();
        await appCache.invalidateLabOrders();
      } catch (e) {}

      if (complete) {
        doctorData ? setShowTicket(true) : (alert("Completed!"), onSave());
      } else {
        alert("Draft saved!");
        onSave();
      }
    } catch (error) {
      console.error("Save error:", error);
      if (
        saveToLocalQueue({
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
        })
      ) {
        alert("Saved locally.");
        onSave();
      } else {
        alert("Failed: " + error.message);
      }
    } finally {
      setIsSaving(false);
      setSavingMessage("");
    }
  };

  const handleSaveDraft = () => saveConsultation(false);
  const handleCompleteConsultation = () => saveConsultation(true);
  const handleAddPrescriptionRow = () =>
    setPrescription([
      ...prescription,
      { medicineId: "", medicine: "", type: "", note: "", stock: 0 },
    ]);
  const handleRemovePrescriptionRow = (i) => {
    if (prescription.length === 1) return;
    const l = [...prescription];
    l.splice(i, 1);
    setPrescription(l);
  };
  const handlePrescriptionChange = (e, i, f) => {
    const v = e.target ? e.target.value : e;
    const l = [...prescription];
    l[i][f] = v;
    setPrescription(l);
  };
  const handleNoteKeyDown = (e, i) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (
        prescription[i].medicine &&
        prescription[i].note &&
        prescription[i].type
      ) {
        handleAddPrescriptionRow();
        setTimeout(() => {
          const ni = prescription.length;
          if (typeRefs.current[ni]) typeRefs.current[ni].focus();
        }, 100);
      }
    }
  };

  const getLabStatusChip = (s) => {
    const m = {
      "pending-billing": {
        l: "Pending Billing",
        c: "warning",
        i: <PendingIcon />,
      },
      "pending-collection": { l: "Sent to Lab", c: "info", i: <ScienceIcon /> },
      processing: { l: "Processing", c: "secondary", i: <ScienceIcon /> },
      completed: { l: "Completed", c: "success", i: <CheckCircleIcon /> },
    };
    return (
      <Chip
        icon={m[s]?.i}
        label={m[s]?.l || s}
        color={m[s]?.c || "default"}
        size="small"
      />
    );
  };

  const hasLabResults = labOrders.some(
    (o) => o.orderStatus === "completed" && o.tests?.some((t) => t.result),
  );

  return (
    <Paper sx={{ p: 3, m: 2 }}>
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

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={onCancel}>
          Back
        </Button>
        <Typography variant="h5">Consultation: {patient.name}</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={
              <Badge badgeContent={labOrders.length} color="primary">
                <ScienceIcon />
              </Badge>
            }
            onClick={() => {
              setShowLabOrders(true);
              fetchLabOrders();
            }}
            color={hasLabResults ? "success" : "primary"}
          >
            Lab Orders
          </Button>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => {
              setTestResultsDialogOpen(true);
              fetchLabOrders();
            }}
          >
            Test Results
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() =>
              doctorData ? setShowTicket(true) : alert("No doctor info")
            }
            disabled={!diagnosis || finalPrescription.length === 0}
          >
            Print OPD
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6">K/C/O</Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={knownCaseOf}
            onChange={(e) => setKnownCaseOf(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">C/C</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={chiefComplaints}
            onChange={(e) => setChiefComplaints(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">On Examination</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={onExamination}
            onChange={(e) => setOnExamination(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Diagnosis</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h6">
              Lab Tests ({selectedTests.length})
            </Typography>
            {hasLabResults && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Results available"
                color="success"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Autocomplete
            multiple
            options={availableTests}
            getOptionLabel={(o) => o.name || ""}
            value={selectedTests}
            onChange={(e, newVal) => {
              const unique = [];
              const seen = new Set();
              newVal.forEach((t) => {
                const k = t.id || t.name;
                if (!seen.has(k)) {
                  seen.add(k);
                  unique.push(t);
                }
              });
              setSelectedTests(unique);
            }}
            isOptionEqualToValue={(a, b) => a.id === b.id || a.name === b.name}
            renderInput={(p) => <TextField {...p} label="Select Tests" />}
          />
          {selectedTests.length > 0 && (
            <Table size="small" sx={{ mt: 2 }}>
              <TableBody>
                {selectedTests.map((t, idx) => (
                  <TableRow key={t.id || t.name || idx}>
                    <TableCell sx={{ fontWeight: "bold" }}>{t.name}</TableCell>
                    <TableCell>
                      {currentTestResults[t.name] ? (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: "pre-wrap" }}
                          >
                            {currentTestResults[t.name]}
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            ✓ Available
                          </Typography>
                        </Box>
                      ) : (
                        <Typography color="text.secondary">
                          Waiting for lab...
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
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h6">Rx</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddPrescriptionRow}
              size="small"
              disabled={isSaving}
            >
              Add
            </Button>
          </Box>
          {prescription.map((item, i) => (
            <Grid
              container
              spacing={1}
              key={i}
              sx={{ mb: 1.5, alignItems: "center" }}
            >
              <Grid item xs={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={item.type}
                    label="Type"
                    onChange={(e) => handlePrescriptionChange(e, i, "type")}
                    inputRef={(r) => (typeRefs.current[i] = r)}
                  >
                    {medicineTypes.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <Autocomplete
                  options={availableMedicines}
                  getOptionLabel={(o) => `${o.medicineName} (${o.quantity})`}
                  value={
                    availableMedicines.find((m) => m.id === item.medicineId) ||
                    null
                  }
                  onChange={(e, v) => {
                    const l = [...prescription];
                    if (v) {
                      l[i].medicineId = v.id;
                      l[i].medicine = v.medicineName;
                      l[i].stock = v.quantity;
                    } else {
                      l[i].medicineId = "";
                      l[i].medicine = "";
                      l[i].stock = 0;
                    }
                    setPrescription(l);
                  }}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderInput={(p) => (
                    <TextField {...p} label="Medicine" size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Note"
                  size="small"
                  value={item.note}
                  onChange={(e) => handlePrescriptionChange(e, i, "note")}
                  onKeyDown={(e) => handleNoteKeyDown(e, i)}
                  placeholder="e.g., 500mg, 1-0-1"
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  onClick={() => handleRemovePrescriptionRow(i)}
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
          <Typography variant="h6">Medical Advice</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={medicalAdvice}
            onChange={(e) => setMedicalAdvice(e.target.value)}
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
        <DialogTitle>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Test Results</Typography>
            <IconButton onClick={() => setTestResultsDialogOpen(false)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTests.length === 0 ? (
            <Typography>No tests prescribed.</Typography>
          ) : (
            <>
              {labOrders.filter((o) => o.orderStatus === "completed").length >
                0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="success.main"
                    gutterBottom
                  >
                    Lab Results (auto-filled)
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    {labOrders
                      .filter((o) => o.orderStatus === "completed")
                      .map((o) => (
                        <Box key={o.id} sx={{ mb: 1 }}>
                          {(o.tests || [])
                            .filter((t) => t.result)
                            .map((t, j) => (
                              <Box
                                key={j}
                                sx={{
                                  mb: 1,
                                  p: 1,
                                  bgcolor: "#fff",
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {t.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    whiteSpace: "pre-wrap",
                                    fontWeight: 500,
                                  }}
                                >
                                  {t.result}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                      ))}
                  </Paper>
                </Box>
              )}
              <Typography variant="subtitle2" gutterBottom>
                Manual Entry
              </Typography>
              <Table>
                <TableBody>
                  {selectedTests.map((t, idx) => (
                    <TableRow key={t.id || t.name || idx}>
                      <TableCell sx={{ fontWeight: "bold", width: "30%" }}>
                        {t.name}
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={currentTestResults[t.name] || ""}
                          onChange={(e) =>
                            setCurrentTestResults((p) => ({
                              ...p,
                              [t.name]: e.target.value,
                            }))
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: currentTestResults[t.name]
                                ? "#f0fdf4"
                                : "#fff",
                            },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestResultsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Lab Orders Dialog */}
      <Dialog
        open={showLabOrders}
        onClose={() => setShowLabOrders(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Lab Orders - {patient.name}</Typography>
            <IconButton onClick={() => setShowLabOrders(false)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {labOrdersLoading ? (
            <Box textAlign="center" py={4}>
              <CircularProgress />
            </Box>
          ) : labOrders.length === 0 ? (
            <Box textAlign="center" py={4}>
              <ScienceIcon sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
              <Typography color="text.secondary">
                No lab orders found
              </Typography>
            </Box>
          ) : (
            labOrders.map((o, i) => (
              <Paper key={o.id} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Order #{labOrders.length - i}
                    </Typography>
                    <Typography variant="caption">
                      {o.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
                      {o.totalAmount ? ` • NPR ${o.totalAmount}` : ""}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    {getLabStatusChip(o.orderStatus)}
                    <Chip
                      label={o.paymentStatus || "unpaid"}
                      size="small"
                      color={o.paymentStatus === "paid" ? "success" : "warning"}
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Test</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Billing</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(o.tests || []).map((t, j) => (
                      <TableRow key={j}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {t.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {t.result ? (
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: "pre-wrap",
                                color: "success.main",
                              }}
                            >
                              {t.result}
                            </Typography>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Pending
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              t.billingStatus === "paid" ||
                              t.billingStatus === "billed"
                                ? "Paid"
                                : "Pending"
                            }
                            size="small"
                            color={
                              t.billingStatus === "paid" ||
                              t.billingStatus === "billed"
                                ? "success"
                                : "warning"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLabOrders(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="contained"
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
          {isSaving ? "Saving..." : "Complete & Print"}
        </Button>
      </Box>

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
