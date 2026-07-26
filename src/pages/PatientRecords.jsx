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
  Alert,
  Button,
  Paper,
  alpha,
  useTheme,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import moment from "moment";
import { styled } from "@mui/material/styles";
import PatientList from "./PatientRecords/PatientList";
import PatientViewDialog from "./PatientRecords/PatientViewDialog";
import { useReactToPrint } from "react-to-print";
import OPDTicket from "./OPDTicket";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  where,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// Helper function to extract latest visit data (client-side, no additional reads)
const getLatestVisitData = (patient) => {
  if (!patient) return {};

  // Check if pastVisits exists and has entries
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

  // Fallback to root level data
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

const FilterSection = ({
  searchTerm,
  setSearchTerm,
  selectedDate,
  setSelectedDate,
  statusFilter,
  setStatusFilter,
  clearFilters,
  onSearch,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      onSearch();
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        background: "linear-gradient(135deg, #f5f5f5, #e0e0e0)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by name, phone, or bill no."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm("")}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={onSearch}
          size="small"
        >
          Search
        </Button>
        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          sx={{ minWidth: 150 }}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={clearFilters}
          size="small"
        >
          Clear Filters
        </Button>
      </Box>
    </Paper>
  );
};

const PatientRecords = ({ userRole }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState({});
  const [viewPatient, setViewPatient] = useState(null);
  const [printPatient, setPrintPatient] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const [statusFilter, setStatusFilter] = useState("completed");
  const ticketRef = useRef();

  // Fetch doctors once (single read for all doctors)
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

  // Fetch records for the selected date (real-time listener - single query)
  useEffect(() => {
    if (searchTerm) return; // Don't listen when searching

    setLoading(true);
    const q = query(
      collection(db, "Patients"),
      where("appointmentDate", "==", selectedDate),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const patientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(patientsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching patients:", err);
        setError("Failed to load patient data.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [selectedDate, searchTerm]);

  // Search (batched queries - efficient)
  const handleSearch = useCallback(async () => {
    if (!searchTerm) {
      setError("Please enter a search term.");
      return;
    }

    try {
      setLoading(true);
      const term = searchTerm.trim();

      // Run all queries in parallel (still 3 reads max)
      const queries = [
        query(
          collection(db, "Patients"),
          where("name", ">=", term),
          where("name", "<=", term + "\uf8ff"),
          limit(20),
        ),
        query(
          collection(db, "Patients"),
          where("phone", "==", term),
          limit(20),
        ),
        query(
          collection(db, "Patients"),
          where("billNo", "==", term),
          limit(20),
        ),
      ];

      const snapshots = await Promise.all(queries.map((q) => getDocs(q)));

      const patientsData = [];
      const seenIds = new Set();

      snapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          if (!seenIds.has(doc.id)) {
            patientsData.push({ id: doc.id, ...doc.data() });
            seenIds.add(doc.id);
          }
        });
      });

      setPatients(patientsData);
      setLoading(false);
    } catch (err) {
      console.error("Error searching patients:", err);
      setError("Failed to search patient data.");
      setLoading(false);
    }
  }, [searchTerm]);

  // Filter patients by status (client-side, no reads)
  const filteredPatients = useMemo(() => {
    let result = [...patients];
    if (statusFilter !== "all") {
      result = result.filter(
        (patient) =>
          patient.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }
    return result;
  }, [patients, statusFilter]);

  // Fetch full patient details for view (single document read)
  const fetchFullPatientDetails = useCallback(async (patientId) => {
    try {
      const docRef = doc(db, "Patients", patientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error("Error fetching patient details:", err);
      setError("Failed to load patient details.");
      return null;
    }
  }, []);

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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate(moment().format("YYYY-MM-DD"));
    setStatusFilter("completed");
  };

  const handleViewPatient = useCallback(
    async (patient) => {
      const fullPatientDetails = await fetchFullPatientDetails(patient.id);
      if (fullPatientDetails) {
        setViewPatient(fullPatientDetails);
      } else {
        setError("Patient details not found.");
      }
    },
    [fetchFullPatientDetails],
  );

  // Prepare print data using helper function (client-side processing)
  const patientForPrint = printPatient || viewPatient;
  const visitData = getLatestVisitData(patientForPrint);

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
            Patient Records
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            {moment().format("dddd, MMMM D, YYYY")}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip
            icon={<CheckCircleIcon />}
            label={`${filteredPatients.length} Records`}
            variant="outlined"
            color="success"
            size="small"
          />
        </Box>
      </Box>

      <FilterSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        clearFilters={clearFilters}
        onSearch={handleSearch}
      />

      <Box sx={{ mb: 3 }}>
        <StyledTabs value={0} aria-label="patient lists">
          <Tab
            label={`Records (${filteredPatients.length})`}
            icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
          />
        </StyledTabs>
      </Box>

      <PatientList
        patients={filteredPatients}
        isWaitingList={false}
        doctors={doctors}
        onSelectPatient={handleViewPatient}
        setPrintPatient={setPrintPatient}
      />

      <PatientViewDialog
        patient={viewPatient}
        doctors={doctors}
        onClose={() => setViewPatient(null)}
        onPrint={setPrintPatient}
      />

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

      {!!error && (
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setError(null)}
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1400,
            width: "auto",
            minWidth: 300,
            maxWidth: 500,
            boxShadow: theme.shadows[6],
          }}
        >
          {error}
        </Alert>
      )}
    </ModernPaper>
  );
};

export default PatientRecords;
