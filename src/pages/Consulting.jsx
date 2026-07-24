import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Button,
  Grid,
  Chip,
  Paper,
  alpha,
  useTheme,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon,
  Science as ScienceIcon,
  AttachMoney as AttachMoneyIcon,
  Groups as GroupsIcon,
} from "@mui/icons-material";
import moment from "moment";
import { styled } from "@mui/material/styles";
import PatientList from "./PatientRecords/PatientList";
import ConsultationView from "./ConsultationView";
import PatientViewDialog from "./PatientRecords/PatientViewDialog";
import CalendarView from "./PatientRecords/CalendarView";
import FilterControls from "./PatientRecords/FilterControls";
import { useReactToPrint } from "react-to-print";
import OPDTicket from "./OPDTicket";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  where,
  query,
} from "firebase/firestore";

// Modern styled components
const ModernPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(
    theme.palette.background.paper,
    0.8,
  )} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  maxWidth: "1280px",
  margin: "0 auto",
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  minHeight: "auto",
  "& .MuiTab-root": {
    borderRadius: theme.spacing(1),
    minHeight: "auto",
    padding: theme.spacing(1, 2),
    margin: theme.spacing(0, 0.5),
    minWidth: "auto",
    fontSize: "0.875rem",
    fontWeight: 500,
    textTransform: "none",
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
    },
  },
  "& .MuiTabs-indicator": {
    display: "none",
  },
}));

// Helper: resolve just the color for a given status (safe to use inside a
// styled() function since it only returns CSS values, never a JSX element).
const getStatusColor = (theme, status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return theme.palette.success.main;
    case "cancelled":
      return theme.palette.error.main;
    case "test-completed":
      return theme.palette.info.main;
    default:
      return theme.palette.warning.main;
  }
};

// Helper: resolve the actual icon element for a given status. This must be
// passed via the real `icon` prop on <Chip>/<StatusChip>, NOT returned from
// inside the styled() callback — putting a JSX element inside a styled()
// return value crashes Emotion ("Cannot convert a Symbol value to a string")
// because React elements carry an internal Symbol that isn't valid CSS.
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircleIcon fontSize="small" />;
    case "test-completed":
      return <ScienceIcon fontSize="small" />;
    case "cancelled":
      return undefined;
    default:
      return <AccessTimeIcon fontSize="small" />;
  }
};

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "status",
})(({ theme, status }) => {
  const color = getStatusColor(theme, status);
  return {
    backgroundColor: alpha(color, 0.1),
    color: color,
    fontWeight: 600,
    fontSize: "0.75rem",
    height: "28px",
    "& .MuiChip-icon": {
      fontSize: "16px",
    },
  };
});

// --- OPD Earnings feature: small styled summary card ---
const EarningCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderRadius: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(
    theme.palette.success.main,
    0.08,
  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
  marginBottom: theme.spacing(3),
}));

const Consulting = ({ userRole }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [allPatients, setAllPatients] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [printPatient, setPrintPatient] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [calendarDate, setCalendarDate] = useState(moment());
  const [showCalendar, setShowCalendar] = useState(false);
  const ticketRef = useRef();

  // --- OPD Earnings feature: which tab is active ---
  const [activeTab, setActiveTab] = useState(0); // 0 = Patient Queue, 1 = Earnings

  // --- OPD Earnings feature: today's earning records + totals ---
  const [earningPatients, setEarningPatients] = useState([]);
  const [earningLoading, setEarningLoading] = useState(true);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Doctors"));
        const doctorMap = {};
        querySnapshot.forEach((doc) => {
          doctorMap[doc.id] = doc.data();
        });
        setDoctors(doctorMap);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Could not fetch doctor information.");
      }
    };
    fetchDoctors();
  }, []);

  // Fetch patients — now includes "test-completed"
  const fetchPatientsForDate = (date) => {
    if (!date) return;
    const dateStr = date.format("YYYY-MM-DD");
    const q = query(
      collection(db, "Patients"),
      where("appointmentDate", "==", dateStr),
      where("status", "in", [
        "waiting",
        "waiting-for-results",
        "in-progress",
        "test-completed", // Added
      ]),
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const patientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllPatients(patientsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching patients:", err);
        setError("Failed to load patient data in real-time.");
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    const unsubscribe = fetchPatientsForDate(calendarDate);
    return () => unsubscribe && unsubscribe();
  }, [calendarDate]);

  // --- OPD Earnings feature: always track TODAY's earning records,
  // independent of whatever date the calendar filter above is showing.
  // Includes every status except "cancelled" (fee is charged at
  // registration time regardless of consultation status). ---
  useEffect(() => {
    const todayStr = moment().format("YYYY-MM-DD");
    const earningsQuery = query(
      collection(db, "Patients"),
      where("appointmentDate", "==", todayStr),
    );

    const unsubscribe = onSnapshot(
      earningsQuery,
      (snapshot) => {
        const records = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((p) => p.status !== "cancelled")
          .map((p) => ({
            ...p,
            amount: parseFloat(p.discountedPrice ?? p.opdPrice ?? 0) || 0,
          }));
        setEarningPatients(records);
        setEarningLoading(false);
      },
      (err) => {
        console.error("Error fetching today's earnings:", err);
        setEarningLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const todayEarning = React.useMemo(
    () => earningPatients.reduce((sum, p) => sum + p.amount, 0),
    [earningPatients],
  );
  const todayVisitCount = earningPatients.length;

  // Fetch lab tests and medicines
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [labTestsSnapshot, medicinesSnapshot] = await Promise.all([
          getDocs(collection(db, "labTests")),
          getDocs(collection(db, "Stock")),
        ]);
        setLabTests(
          labTestsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setMedicines(
          medicinesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      } catch (err) {
        console.error("Error fetching lab tests/medicines:", err);
        setError("Failed to load necessary medical data.");
      }
    };
    fetchData();
  }, []);

  // Filter patients by search term
  const filteredPatients = React.useMemo(
    () =>
      allPatients.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [allPatients, searchTerm],
  );

  // Print logic
  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
  });

  useEffect(() => {
    if (printPatient) {
      handlePrint();
      setPrintPatient(null);
    }
  }, [printPatient, handlePrint]);

  // Event handlers
  const handleDelete = useCallback(async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this patient record permanently?",
      )
    ) {
      try {
        await deleteDoc(doc(db, "Patients", id));
      } catch (err) {
        console.error("Error deleting patient:", err);
        setError("Failed to delete patient record.");
      }
    }
  }, []);

  const handleCancelPatient = useCallback(async (patient) => {
    if (
      window.confirm(
        `Are you sure you want to cancel the consultation for ${patient.name}?`,
      )
    ) {
      try {
        await updateDoc(doc(db, "Patients", patient.id), {
          status: "cancelled",
        });
      } catch (err) {
        console.error("Error cancelling patient:", err);
        setError("Failed to cancel consultation.");
      }
    }
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
    setCalendarDate(moment());
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="textSecondary">
          Loading Patient Records...
        </Typography>
      </Box>
    );
  }

  if (selectedPatient) {
    return (
      <ConsultationView
        patient={selectedPatient}
        availableTests={labTests}
        availableMedicines={medicines}
        onCancel={() => setSelectedPatient(null)}
        onSave={() => setSelectedPatient(null)}
        userRole={userRole}
      />
    );
  }

  return (
    <ModernPaper elevation={0}>
      <Box
        display="flex"
        alignItems="center"
        mb={3}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4" fontWeight="600" color="primary">
            Consultant Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            {moment().format("dddd, MMMM D, YYYY")}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip
            icon={<AccessTimeIcon />}
            label={`${filteredPatients.length} Active Patients`}
            variant="outlined"
            color="primary"
            size="small"
          />
        </Box>
      </Box>

      {/* --- OPD Earnings feature: tab switcher --- */}
      <Box sx={{ mb: 3 }}>
        <StyledTabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab
            icon={<GroupsIcon fontSize="small" />}
            iconPosition="start"
            label="Patient Queue"
          />
          <Tab
            icon={<AttachMoneyIcon fontSize="small" />}
            iconPosition="start"
            label="Earnings"
          />
        </StyledTabs>
      </Box>

      {activeTab === 0 && (
        <>
          <Grid container spacing={2} alignItems="center" mb={3}>
            <Grid item xs={12} md={8}>
              <FilterControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                clearFilters={clearFilters}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={4}
              display="flex"
              justifyContent="flex-end"
              gap={1}
            >
              <Button
                variant={showCalendar ? "contained" : "outlined"}
                startIcon={<CalendarIcon />}
                onClick={() => setShowCalendar(!showCalendar)}
                size="medium"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 2,
                }}
              >
                {calendarDate.format("MMM D, YYYY")}
              </Button>
              {searchTerm && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    px: 2,
                  }}
                >
                  Clear
                </Button>
              )}
            </Grid>
          </Grid>

          {showCalendar && (
            <Box sx={{ mb: 3 }}>
              <CalendarView
                onSelectDate={(date) => {
                  setCalendarDate(date);
                  setShowCalendar(false);
                }}
                selectedDate={calendarDate}
              />
            </Box>
          )}

          <PatientList
            patients={filteredPatients}
            isWaitingList={true}
            doctors={doctors}
            onSelectPatient={setSelectedPatient}
            onCancelPatient={handleCancelPatient}
            onDeletePatient={handleDelete}
            setViewPatient={setViewPatient}
            setPrintPatient={setPrintPatient}
            StatusChipComponent={StatusChip} // Pass custom chip
          />
        </>
      )}

      {activeTab === 1 && (
        <Box>
          {/* Summary card */}
          <EarningCard elevation={0}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                }}
              >
                <AttachMoneyIcon />
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Today's OPD Earning
                </Typography>
                {earningLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography
                    variant="h5"
                    fontWeight="700"
                    color={theme.palette.success.dark}
                  >
                    NPR {todayEarning.toLocaleString("en-IN")}
                  </Typography>
                )}
              </Box>
            </Box>
            {!earningLoading && (
              <Chip
                label={`${todayVisitCount} visit${todayVisitCount === 1 ? "" : "s"} today`}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.dark,
                  fontWeight: 600,
                }}
              />
            )}
          </EarningCard>

          {/* Detailed table */}
          {earningLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : earningPatients.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
              No billed visits recorded for today yet.
            </Typography>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                borderRadius: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bill No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      OPD Price
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Discount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Amount (NPR)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earningPatients
                    .slice()
                    .sort((a, b) =>
                      (a.createdAt || "").localeCompare(b.createdAt || ""),
                    )
                    .map((p, i) => (
                      <TableRow key={p.id} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{p.billNo}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>
                          {doctors[p.doctorId]?.nameEnglish || "—"}
                        </TableCell>
                        <TableCell align="right">
                          {parseFloat(p.opdPrice || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right">
                          {p.discount && Number(p.discount) > 0
                            ? `${p.discount}%`
                            : "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {p.amount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.paymentStatus || "pending"}
                            size="small"
                            sx={{ textTransform: "capitalize" }}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            icon={getStatusIcon(p.status)}
                            label={p.status}
                            status={p.status}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="right"
                      sx={{ fontWeight: 700 }}
                    >
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      NPR {todayEarning.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      <PatientViewDialog
        patient={viewPatient}
        doctors={doctors}
        onClose={() => setViewPatient(null)}
        onPrint={setPrintPatient}
      />

      <div style={{ display: "none" }}>
        <div ref={ticketRef}>
          <OPDTicket
            patient={viewPatient || printPatient}
            diagnosis={
              viewPatient?.diagnoses?.[0]?.text ||
              printPatient?.diagnoses?.[0]?.text ||
              ""
            }
            tests={
              viewPatient?.prescribedTests ||
              printPatient?.prescribedTests ||
              []
            }
            prescription={
              viewPatient?.prescription || printPatient?.prescription || []
            }
            knownCaseOf={
              viewPatient?.knownCaseOf || printPatient?.knownCaseOf || ""
            }
            chiefComplaints={
              viewPatient?.chiefComplaints ||
              printPatient?.chiefComplaints ||
              ""
            }
            onExamination={
              viewPatient?.onExamination || printPatient?.onExamination || ""
            }
            medicalAdvice={
              viewPatient?.medicalAdvice || printPatient?.medicalAdvice || ""
            }
            testResults={
              viewPatient?.testResults || printPatient?.testResults || {}
            }
            doctor={
              doctors[viewPatient?.doctorId] || doctors[printPatient?.doctorId]
            }
          />
        </div>
      </div>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </ModernPaper>
  );
};

export default Consulting;
