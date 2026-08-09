import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  Tooltip,
  IconButton,
  Badge,
  Fade,
  Zoom,
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon,
  Science as ScienceIcon,
  AttachMoney as AttachMoneyIcon,
  Groups as GroupsIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Payments as PaymentsIcon,
  Receipt as ReceiptIcon,
  MedicalServices as MedicalIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
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
  deleteDoc,
  where,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { appCache, CACHE_KEYS, cacheEvents } from "../utils/appCache";

// ---------------------------------------------------------------------------
// Helper: Extract latest visit data
// ---------------------------------------------------------------------------
const getLatestVisitData = (patient) => {
  if (!patient) return {};
  if (patient.pastVisits && patient.pastVisits.length > 0) {
    const latestVisit = patient.pastVisits[patient.pastVisits.length - 1];
    return {
      diagnosis:
        latestVisit.diagnosis ||
        patient.diagnoses?.[patient.diagnoses.length - 1]?.text ||
        "",
      tests: latestVisit.prescribedTests || patient.prescribedTests || [],
      prescription: latestVisit.prescription || patient.prescription || [],
      chiefComplaints:
        latestVisit.chiefComplaints || patient.chiefComplaints || "",
      onExamination: latestVisit.onExamination || patient.onExamination || "",
      medicalAdvice: latestVisit.medicalAdvice || patient.medicalAdvice || "",
      testResults: latestVisit.testResults || patient.testResults || {},
    };
  }
  return {
    diagnosis: patient.diagnoses?.[patient.diagnoses.length - 1]?.text || "",
    tests: patient.prescribedTests || [],
    prescription: patient.prescription || [],
    chiefComplaints: patient.chiefComplaints || "",
    onExamination: patient.onExamination || "",
    medicalAdvice: patient.medicalAdvice || "",
    testResults: patient.testResults || {},
  };
};

// ---------------------------------------------------------------------------
// Styled Components
// ---------------------------------------------------------------------------
const ModernPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
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
    transition: "all 0.2s ease-in-out",
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
    },
  },
  "& .MuiTabs-indicator": { display: "none" },
}));

const getStatusColor = (theme, status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return theme.palette.success.main;
    case "cancelled":
      return theme.palette.error.main;
    case "test-completed":
      return theme.palette.info.main;
    case "in-progress":
      return theme.palette.warning.main;
    default:
      return theme.palette.warning.main;
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircleIcon fontSize="small" />;
    case "test-completed":
      return <ScienceIcon fontSize="small" />;
    case "cancelled":
      return <CancelIcon fontSize="small" />;
    case "in-progress":
      return <MedicalIcon fontSize="small" />;
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
    transition: "all 0.2s ease",
    "& .MuiChip-icon": { fontSize: "16px" },
    "&:hover": { backgroundColor: alpha(color, 0.2) },
  };
});

const EarningCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5, 3),
  borderRadius: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
  marginBottom: theme.spacing(3),
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.15)}`,
  },
}));

const StatCard = styled(Paper)(({ theme, color = "primary" }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.08)} 0%, ${alpha(theme.palette[color].main, 0.03)} 100%)`,
  border: `1px solid ${alpha(theme.palette[color].main, 0.15)}`,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 4px 12px ${alpha(theme.palette[color].main, 0.12)}`,
  },
}));

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
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
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [calendarDate, setCalendarDate] = useState(moment());
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [earningPatients, setEarningPatients] = useState([]);
  const [earningLoading, setEarningLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(moment());
  const ticketRef = useRef();

  // ---------------------------------------------------------------------------
  // Data Fetching - USES SHARED CACHE (NO DUPLICATE LISTENERS)
  // ---------------------------------------------------------------------------
  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Doctors
        const doctorMap = await appCache.getDoctors();
        setDoctors(doctorMap);

        // Lab tests
        const labTestsSnapshot = await getDocs(collection(db, "labTests"));
        setLabTests(
          labTestsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );

        // Medicines - use cached immediately
        const cachedStock = appCache.getCachedStock();
        if (cachedStock && cachedStock.length > 0) {
          setMedicines(cachedStock);
        }

        // Subscribe for updates
        const unsubStock = cacheEvents.on(CACHE_KEYS.STOCK, (data) => {
          if (data && data.length > 0) {
            setMedicines(data);
          }
        });

        return () => {
          if (unsubStock) unsubStock();
        };
      } catch (err) {
        console.error("Error:", err);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Patient Queue - with historical date support and real-time updates for today
  useEffect(() => {
    if (!calendarDate) return;

    let timeout;
    let unsubscribe;
    let isSubscribed = true;

    // ALWAYS set loading to false after 3 seconds max
    timeout = setTimeout(() => {
      if (isSubscribed) setLoading(false);
    }, 3000);

    const dateStr = calendarDate.format("YYYY-MM-DD");
    const todayStr = moment().format("YYYY-MM-DD");

    // For today's date, try cache first and subscribe to updates
    if (dateStr === todayStr) {
      // Try cache first for immediate display
      const cached = appCache.getCachedPatients?.() || [];
      if (cached.length > 0) {
        const todaysPatients = cached.filter(
          (p) => p.appointmentDate === dateStr,
        );
        if (todaysPatients.length > 0 && isSubscribed) {
          setAllPatients(todaysPatients);
          setLoading(false);
          clearTimeout(timeout);
        }
      }

      // Subscribe to shared cache for real-time updates
      unsubscribe = cacheEvents.on(CACHE_KEYS.PATIENT_QUEUE, (data) => {
        if (data && isSubscribed) {
          const filteredData = data.filter(
            (p) => p.appointmentDate === dateStr,
          );
          setAllPatients(filteredData);
          setLoading(false);
          setLastUpdate(moment());
          clearTimeout(timeout);
        }
      });

      // Fallback direct fetch for today
      setTimeout(async () => {
        if (isSubscribed && allPatients.length === 0) {
          try {
            const q = query(
              collection(db, "Patients"),
              where("appointmentDate", "==", dateStr),
              where("status", "in", [
                "waiting",
                "waiting-for-results",
                "in-progress",
                "test-completed",
              ]),
              orderBy("createdAt", "asc"),
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            if (data.length > 0 && isSubscribed) {
              setAllPatients(data);
              setLoading(false);
              clearTimeout(timeout);
            }
          } catch (e) {
            console.error("Fallback fetch error:", e);
          }
        }
      }, 2000);
    } else {
      // For historical/future dates, fetch directly from Firestore
      const fetchHistoricalPatients = async () => {
        try {
          setLoading(true);
          const q = query(
            collection(db, "Patients"),
            where("appointmentDate", "==", dateStr),
            orderBy("createdAt", "asc"),
          );

          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (isSubscribed) {
            setAllPatients(data);
            setLoading(false);
            setLastUpdate(moment());
            clearTimeout(timeout);
          }
        } catch (err) {
          console.error("Error fetching historical patients:", err);
          if (isSubscribed) {
            // If index doesn't exist yet, try without ordering
            try {
              const q = query(
                collection(db, "Patients"),
                where("appointmentDate", "==", dateStr),
              );
              const snapshot = await getDocs(q);
              const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              if (isSubscribed) {
                setAllPatients(data);
                setLoading(false);
                clearTimeout(timeout);
              }
            } catch (fallbackErr) {
              console.error("Fallback fetch error:", fallbackErr);
              if (isSubscribed) {
                setAllPatients([]);
                setLoading(false);
                clearTimeout(timeout);
              }
            }
          }
        }
      };

      fetchHistoricalPatients();
    }

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
      clearTimeout(timeout);
    };
  }, [calendarDate]);

  // Today's earnings - keep this listener (different query from shared cache)
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
          }))
          .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
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

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------
  const filteredPatients = useMemo(
    () =>
      allPatients.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [allPatients, searchTerm],
  );

  const earningsData = useMemo(() => {
    const total = earningPatients.reduce((sum, p) => sum + p.amount, 0);
    const paidCount = earningPatients.filter(
      (p) => p.paymentStatus === "paid",
    ).length;
    const pendingCount = earningPatients.length - paidCount;
    const averageAmount =
      earningPatients.length > 0 ? total / earningPatients.length : 0;
    return {
      total,
      count: earningPatients.length,
      paidCount,
      pendingCount,
      averageAmount,
    };
  }, [earningPatients]);

  const patientForPrint = printPatient || viewPatient;
  const visitData = getLatestVisitData(patientForPrint);

  // ---------------------------------------------------------------------------
  // Print Logic
  // ---------------------------------------------------------------------------
  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
    onAfterPrint: () => setSuccess("Ticket printed successfully"),
  });

  useEffect(() => {
    if (printPatient) {
      setTimeout(() => {
        handlePrint();
        setPrintPatient(null);
      }, 100);
    }
  }, [printPatient, handlePrint]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------
  const handleDelete = useCallback(async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this patient record permanently?",
      )
    ) {
      try {
        await deleteDoc(doc(db, "Patients", id));
        setSuccess("Patient record deleted successfully");
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
        setSuccess(`Consultation cancelled for ${patient.name}`);
      } catch (err) {
        console.error("Error cancelling patient:", err);
        setError("Failed to cancel consultation.");
      }
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setCalendarDate(moment());
    setShowCalendar(false);
  }, []);

  const handleRefresh = useCallback(() => {
    // Force re-fetch by toggling calendar date
    const currentDate = calendarDate.clone();
    setCalendarDate(moment("2000-01-01")); // Temporary date to trigger re-fetch
    setTimeout(() => {
      setCalendarDate(currentDate);
      setSuccess("Data refreshed successfully");
    }, 100);
  }, [calendarDate]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Consultation View
  // ---------------------------------------------------------------------------
  if (selectedPatient) {
    return (
      <ConsultationView
        patient={selectedPatient}
        availableTests={labTests}
        availableMedicines={medicines}
        onCancel={() => setSelectedPatient(null)}
        onSave={() => {
          setSelectedPatient(null);
          setSuccess("Consultation saved successfully");
        }}
        userRole={userRole}
        doctors={doctors}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Main Dashboard
  // ---------------------------------------------------------------------------
  return (
    <ModernPaper elevation={0}>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        mb={3}
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="600" color="primary">
            Consultant Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Typography variant="body2" color="textSecondary">
              {moment().format("dddd, MMMM D, YYYY")}
            </Typography>
            <Tooltip title={`Last updated: ${lastUpdate.format("hh:mm A")}`}>
              <Typography variant="caption" color="textSecondary">
                • Auto-updating
              </Typography>
            </Tooltip>
          </Box>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} size="small" color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Chip
            icon={<AccessTimeIcon />}
            label={`${filteredPatients.length} Patients`}
            variant="outlined"
            color="primary"
            size="small"
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <StyledTabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab
            icon={
              <Badge
                badgeContent={filteredPatients.length}
                color="primary"
                max={99}
              >
                <GroupsIcon fontSize="small" />
              </Badge>
            }
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

      {/* Patient Queue Tab */}
      <Fade in={activeTab === 0} mountOnEnter unmountOnExit>
        <Box>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <StatCard>
                <Typography variant="caption" color="textSecondary">
                  Waiting
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {allPatients.filter((p) => p.status === "waiting").length}
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard>
                <Typography variant="caption" color="textSecondary">
                  In Progress
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {allPatients.filter((p) => p.status === "in-progress").length}
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard color="info">
                <Typography variant="caption" color="textSecondary">
                  Test Results
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {
                    allPatients.filter(
                      (p) =>
                        p.status === "test-completed" ||
                        p.status === "waiting-for-results",
                    ).length
                  }
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard color="success">
                <Typography variant="caption" color="textSecondary">
                  Completed
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {allPatients.filter((p) => p.status === "completed").length}
                </Typography>
              </StatCard>
            </Grid>
          </Grid>

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
                sx={{ borderRadius: 2, textTransform: "none", px: 2 }}
              >
                {calendarDate.format("MMM D, YYYY")}
              </Button>
              {searchTerm && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="medium"
                  color="error"
                  sx={{ borderRadius: 2, textTransform: "none", px: 2 }}
                >
                  Clear
                </Button>
              )}
            </Grid>
          </Grid>

          <Zoom in={showCalendar}>
            <Box sx={{ mb: 3 }}>
              {showCalendar && (
                <CalendarView
                  onSelectDate={(date) => {
                    setCalendarDate(date);
                    setShowCalendar(false);
                  }}
                  selectedDate={calendarDate}
                />
              )}
            </Box>
          </Zoom>

          <PatientList
            patients={filteredPatients}
            isWaitingList={true}
            doctors={doctors}
            onSelectPatient={setSelectedPatient}
            onCancelPatient={handleCancelPatient}
            onDeletePatient={handleDelete}
            setViewPatient={setViewPatient}
            setPrintPatient={setPrintPatient}
            StatusChipComponent={StatusChip}
          />
        </Box>
      </Fade>

      {/* Earnings Tab */}
      <Fade in={activeTab === 1} mountOnEnter unmountOnExit>
        <Box>
          <EarningCard elevation={0}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Today's OPD Revenue
                </Typography>
                {earningLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography
                    variant="h4"
                    fontWeight="700"
                    color={theme.palette.success.dark}
                  >
                    NPR {earningsData.total.toLocaleString("en-IN")}
                  </Typography>
                )}
              </Box>
            </Box>
            {!earningLoading && (
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  icon={<GroupsIcon />}
                  label={`${earningsData.count} Visits`}
                  size="small"
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }}
                />
                <Chip
                  icon={<PaymentsIcon />}
                  label={`${earningsData.paidCount} Paid`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                {earningsData.pendingCount > 0 && (
                  <Chip
                    icon={<PendingIcon />}
                    label={`${earningsData.pendingCount} Pending`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </EarningCard>

          {/* Earnings Table */}
          {!earningLoading && earningPatients.length > 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Amount (NPR)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earningPatients.map((patient) => (
                    <TableRow key={patient.id} hover>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          icon={
                            patient.paymentStatus === "paid" ? (
                              <CheckCircleIcon />
                            ) : (
                              <PendingIcon />
                            )
                          }
                          label={patient.paymentStatus || "pending"}
                          size="small"
                          color={
                            patient.paymentStatus === "paid"
                              ? "success"
                              : "warning"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          icon={getStatusIcon(patient.status)}
                          label={patient.status || "pending"}
                          status={patient.status}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Fade>

      {/* Patient View Dialog */}
      <PatientViewDialog
        patient={viewPatient}
        doctors={doctors}
        onClose={() => setViewPatient(null)}
        onPrint={setPrintPatient}
      />

      {/* Hidden Print */}
      <div style={{ display: "none" }}>
        <div ref={ticketRef}>
          <OPDTicket
            patient={patientForPrint}
            diagnosis={visitData.diagnosis}
            tests={visitData.tests}
            prescription={visitData.prescription}
            knownCaseOf={patientForPrint?.knownCaseOf || ""}
            chiefComplaints={visitData.chiefComplaints}
            onExamination={visitData.onExamination}
            medicalAdvice={visitData.medicalAdvice}
            testResults={visitData.testResults}
            doctor={doctors[patientForPrint?.doctorId]}
          />
        </div>
      </div>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </ModernPaper>
  );
};

export default Consulting;
