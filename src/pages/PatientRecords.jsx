import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Chip,
  Avatar,
  Tooltip,
  Slide,
  Fade,
  Divider,
  CircularProgress,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MedicalServices as MedicalServicesIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  Paid as PaidIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Search as SearchIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/system";
import moment from "moment";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  animation: `${fadeIn} 0.5s ease-out`,
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[8],
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    transition: "background-color 0.2s ease",
  },
  "&.Mui-selected": {
    backgroundColor: theme.palette.action.selected,
  },
}));

const DiagnosisItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.grey[100],
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.grey[200],
    transform: "translateX(5px)",
  },
}));

const PatientRecords = ({ userRole }) => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [editIndex, setEditIndex] = useState(null);
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarPatients, setSimilarPatients] = useState([]);
  const [showInsights, setShowInsights] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [specificDate, setSpecificDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch patients
        const patientSnapshot = await getDocs(collection(db, "Patients"));
        const patientData = patientSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          diagnoses: doc.data().diagnoses || [],
        }));

        // Fetch doctors
        const doctorSnapshot = await getDocs(collection(db, "Doctors"));
        const doctorData = doctorSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPatients(patientData);
        setFilteredPatients(patientData);
        setDoctors(doctorData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Function to get doctor name from ID
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? doctor.name : "Not assigned";
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(
      (patient) =>
        patient.billNo?.toLowerCase().includes(query) ||
        patient.phone?.toLowerCase().includes(query) ||
        patient.name?.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
    );

    setFilteredPatients(filtered);
  };

  const getFilteredInsights = () => {
    let filtered = [...patients];

    switch (filterType) {
      case "today":
        filtered = filtered.filter((p) =>
          moment(p.appointmentDate).isSame(moment(), "day")
        );
        break;
      case "month":
        filtered = filtered.filter((p) =>
          moment(p.appointmentDate).isSame(moment(), "month")
        );
        break;
      case "specific":
        if (specificDate) {
          filtered = filtered.filter((p) =>
            moment(p.appointmentDate).isSame(moment(specificDate), "day")
          );
        }
        break;
      default:
        break;
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (patient) =>
          patient.billNo?.toLowerCase().includes(searchQuery) ||
          patient.phone?.toLowerCase().includes(searchQuery) ||
          patient.name?.toLowerCase().includes(searchQuery)
      );
    }

    return filtered;
  };

  const calculateTotalEarnings = () => {
    const filtered = getFilteredInsights();
    return filtered.reduce(
      (sum, patient) => sum + (parseFloat(patient.opdPrice) || 0),
      0
    );
  };

  const handleOpenDialog = (patient, mode, index = null) => {
    setSelectedPatient(patient);
    setDialogMode(mode);
    setEditIndex(index);

    if (mode === "view" && index !== null) {
      setDiagnosis(patient.diagnoses[index].text);
    } else if (mode === "edit" && index !== null) {
      setDiagnosis(patient.diagnoses[index].text);
    } else {
      setDiagnosis("");
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPatient(null);
    setDialogMode("add");
    setEditIndex(null);
    setDiagnosis("");
  };

  const handleSaveDiagnosis = async () => {
    if (!diagnosis.trim() || !selectedPatient || dialogMode === "view") return;

    try {
      const patientRef = doc(db, "Patients", selectedPatient.id);
      let updatedDiagnoses = [...selectedPatient.diagnoses];

      if (dialogMode === "edit" && editIndex !== null) {
        updatedDiagnoses[editIndex] = {
          ...updatedDiagnoses[editIndex],
          text: diagnosis,
          updatedAt: new Date().toISOString(),
        };
      } else if (dialogMode === "add") {
        updatedDiagnoses.push({
          text: diagnosis,
          date: new Date().toISOString(),
          doctor: userRole,
          updatedAt: new Date().toISOString(),
        });
      }

      await updateDoc(patientRef, { diagnoses: updatedDiagnoses });

      const updatedPatients = patients.map((p) =>
        p.id === selectedPatient.id ? { ...p, diagnoses: updatedDiagnoses } : p
      );

      setPatients(updatedPatients);
      setFilteredPatients(updatedPatients);
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving diagnosis: ", error);
      alert("Failed to save diagnosis: " + error.message);
    }
  };

  const handleDeleteDiagnosis = async (patient, index) => {
    if (!window.confirm("Are you sure you want to delete this diagnosis?"))
      return;

    try {
      const patientRef = doc(db, "Patients", patient.id);
      const updatedDiagnoses = patient.diagnoses.filter((_, i) => i !== index);

      await updateDoc(patientRef, { diagnoses: updatedDiagnoses });

      const updatedPatients = patients.map((p) =>
        p.id === patient.id ? { ...p, diagnoses: updatedDiagnoses } : p
      );

      setPatients(updatedPatients);
      setFilteredPatients(updatedPatients);
    } catch (error) {
      console.error("Error deleting diagnosis: ", error);
      alert("Failed to delete diagnosis: " + error.message);
    }
  };

  const togglePatientExpansion = (patientId) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
      setSimilarPatients([]);
    } else {
      setExpandedPatient(patientId);
      const patient = patients.find((p) => p.id === patientId);
      findSimilarPatients(patient);
    }
  };

  const findSimilarPatients = (patient) => {
    if (!patient) return;

    const similar = patients.filter((p) => {
      if (p.id === patient.id) return false;

      let matchCount = 0;
      if (p.name?.toLowerCase() === patient.name?.toLowerCase()) matchCount++;
      if (p.email === patient.email) matchCount++;
      if (p.gender === patient.gender) matchCount++;

      return matchCount >= 2;
    });

    setSimilarPatients(similar);
  };

  const renderGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case "male":
        return <MaleIcon color="primary" />;
      case "female":
        return <FemaleIcon color="secondary" />;
      default:
        return <PersonIcon />;
    }
  };

  const renderDiagnosisActions = (patient, index) => {
    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        <Tooltip title="View Diagnosis">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(patient, "view", index);
            }}
          >
            <VisibilityIcon color="info" />
          </IconButton>
        </Tooltip>

        {userRole === "admin" && (
          <>
            <Tooltip title="Edit Diagnosis">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDialog(patient, "edit", index);
                }}
              >
                <EditIcon color="primary" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Diagnosis">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDiagnosis(patient, index);
                }}
              >
                <DeleteIcon color="error" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    );
  };

  // Function to check if appointment is older than 15 days
  const isPastDue = (appointmentDate) => {
    if (!appointmentDate) return false;
    const appointment = moment(appointmentDate);
    const currentDate = moment();
    const daysDifference = currentDate.diff(appointment, "days");
    return daysDifference > 15;
  };

  return (
    <StyledPaper elevation={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          <MedicalServicesIcon
            color="primary"
            sx={{ verticalAlign: "middle", mr: 1 }}
          />
          Patient Records
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <ToggleButton
            value="insights"
            selected={showInsights}
            onChange={() => setShowInsights(!showInsights)}
          >
            <BarChartIcon sx={{ mr: 1 }} />
            {showInsights ? "Records" : "Insights"}
          </ToggleButton>
          <Chip
            avatar={<Avatar>{userRole?.charAt(0).toUpperCase()}</Avatar>}
            label={`Logged in as ${userRole || "user"}`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      <TextField
        fullWidth
        label="Search patients..."
        value={searchQuery}
        onChange={handleSearch}
        margin="normal"
        InputProps={{
          startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
        }}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : showInsights ? (
        <>
          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Filter"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="specific">Specific Date</MenuItem>
              </Select>
            </FormControl>
            {filterType === "specific" && (
              <TextField
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                label="Select Date"
              />
            )}
          </Box>

          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.main" }}>
                <TableCell sx={{ color: "common.white" }}>Patient</TableCell>
                <TableCell sx={{ color: "common.white" }}>Visit Date</TableCell>
                <TableCell sx={{ color: "common.white" }}>Fee (NPR)</TableCell>
                <TableCell sx={{ color: "common.white" }}>Bill No</TableCell>
                <TableCell sx={{ color: "common.white" }}>Doctor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredInsights().map((patient) => (
                <StyledTableRow
                  key={patient.id}
                  sx={{
                    backgroundColor: isPastDue(patient.appointmentDate)
                      ? "error.light"
                      : "inherit",
                  }}
                >
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>
                    {moment(patient.appointmentDate).format("MMM D, YYYY")}
                  </TableCell>
                  <TableCell>NPR {patient.opdPrice || "0"}</TableCell>
                  <TableCell>{patient.billNo}</TableCell>
                  <TableCell>{getDoctorName(patient.doctorId)}</TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Total Earnings: NPR {calculateTotalEarnings().toFixed(2)}
          </Typography>
        </>
      ) : filteredPatients.length === 0 ? (
        <Typography
          variant="h6"
          color="textSecondary"
          align="center"
          sx={{ mt: 4 }}
        >
          No patients found matching your search criteria
        </Typography>
      ) : (
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "primary.main" }}>
              <TableCell sx={{ color: "common.white" }}>Patient</TableCell>
              <TableCell sx={{ color: "common.white" }}>Contact</TableCell>
              <TableCell sx={{ color: "common.white" }}>Appointment</TableCell>
              <TableCell sx={{ color: "common.white" }}>Bill No</TableCell>
              <TableCell sx={{ color: "common.white" }}>Fee (NPR)</TableCell>
              <TableCell sx={{ color: "common.white" }}>Doctor</TableCell>
              <TableCell sx={{ color: "common.white" }}>Diagnoses</TableCell>
              <TableCell sx={{ color: "common.white" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.map((patient) => (
              <React.Fragment key={patient.id}>
                <StyledTableRow
                  hover
                  onClick={() => togglePatientExpansion(patient.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {renderGenderIcon(patient.gender)}
                      <Box sx={{ ml: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          {patient.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {patient.age
                            ? `${patient.age} years`
                            : "Age not specified"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PhoneIcon
                        fontSize="small"
                        color="action"
                        sx={{ mr: 1 }}
                      />
                      <Typography>{patient.phone || "N/A"}</Typography>
                    </Box>
                    {patient.email && (
                      <Typography variant="body2" color="textSecondary">
                        {patient.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <EventIcon
                        fontSize="small"
                        color="action"
                        sx={{ mr: 1 }}
                      />
                      <Typography>
                        {patient.appointmentDate
                          ? moment(patient.appointmentDate).format(
                              "MMM D, YYYY"
                            )
                          : "N/A"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PaidIcon
                        fontSize="small"
                        color="action"
                        sx={{ mr: 1 }}
                      />
                      <Typography>{patient.billNo || "N/A"}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>NPR {patient.opdPrice || "0"}</TableCell>
                  <TableCell>{getDoctorName(patient.doctorId)}</TableCell>
                  <TableCell>
                    {patient.diagnoses.length > 0 ? (
                      <Box>
                        <Chip
                          label={`${patient.diagnoses.length} diagnosis(es)`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          Last:{" "}
                          {moment(
                            patient.diagnoses[patient.diagnoses.length - 1].date
                          ).fromNow()}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography color="textSecondary">
                        No diagnoses
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(patient, "add");
                      }}
                      startIcon={<MedicalServicesIcon />}
                    >
                      Add Diagnosis
                    </Button>
                    <IconButton
                      onClick={() => togglePatientExpansion(patient.id)}
                    >
                      <ExpandLessIcon />
                    </IconButton>
                  </TableCell>
                </StyledTableRow>

                <TableRow>
                  <TableCell
                    colSpan={8}
                    sx={{
                      p: 0,
                      borderBottom:
                        expandedPatient === patient.id
                          ? "1px solid rgba(224, 224, 224, 1)"
                          : 0,
                    }}
                  >
                    <Collapse
                      in={expandedPatient === patient.id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box sx={{ p: 3, backgroundColor: "background.paper" }}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <MedicalServicesIcon sx={{ mr: 1 }} />
                          Medical History for {patient.name}
                        </Typography>

                        {patient.diagnoses.length > 0 ? (
                          <Box>
                            {patient.diagnoses.map((diag, index) => (
                              <Fade in={true} key={index}>
                                <DiagnosisItem>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle2"
                                      color="primary"
                                    >
                                      {moment(diag.date).format(
                                        "MMMM Do YYYY, h:mm a"
                                      )}
                                    </Typography>
                                    {diag.updatedAt && (
                                      <Typography
                                        variant="caption"
                                        color="textSecondary"
                                      >
                                        Updated:{" "}
                                        {moment(diag.updatedAt).fromNow()}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Typography paragraph sx={{ mt: 1, mb: 1 }}>
                                    {diag.text}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="textSecondary"
                                    >
                                      {diag.doctor
                                        ? `Diagnosed by: ${diag.doctor}`
                                        : ""}
                                    </Typography>
                                    {renderDiagnosisActions(patient, index)}
                                  </Box>
                                </DiagnosisItem>
                              </Fade>
                            ))}
                          </Box>
                        ) : (
                          <Typography
                            color="textSecondary"
                            sx={{ fontStyle: "italic" }}
                          >
                            No medical history recorded for this patient.
                          </Typography>
                        )}

                        {similarPatients.length > 0 && (
                          <Slide
                            direction="up"
                            in={similarPatients.length > 0}
                            mountOnEnter
                            unmountOnExit
                          >
                            <Box sx={{ mt: 4 }}>
                              <Divider sx={{ mb: 2 }} />
                              <Typography variant="subtitle1" gutterBottom>
                                <strong>Note:</strong> Found{" "}
                                {similarPatients.length} similar patient(s)
                                based on matching information:
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 2,
                                }}
                              >
                                {similarPatients.map((similar) => (
                                  <Paper
                                    key={similar.id}
                                    elevation={2}
                                    sx={{ p: 2, minWidth: 200 }}
                                  >
                                    <Typography variant="subtitle2">
                                      {similar.name}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      Phone: {similar.phone}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      Email: {similar.email || "N/A"}
                                    </Typography>
                                    <Typography variant="caption">
                                      {similar.diagnoses.length} diagnoses
                                    </Typography>
                                  </Paper>
                                ))}
                              </Box>
                            </Box>
                          </Slide>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        TransitionComponent={Slide}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{ backgroundColor: "primary.main", color: "common.white" }}
        >
          {dialogMode === "view"
            ? "Viewing Diagnosis"
            : dialogMode === "edit"
            ? "Editing Diagnosis"
            : "Adding New Diagnosis"}
          {selectedPatient && ` for ${selectedPatient.name}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedPatient && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Patient Information:</Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
                <Chip
                  icon={<PersonIcon />}
                  label={`Name: ${selectedPatient.name}`}
                />
                <Chip
                  icon={<PhoneIcon />}
                  label={`Phone: ${selectedPatient.phone}`}
                />
                {selectedPatient.email && (
                  <Chip label={`Email: ${selectedPatient.email}`} />
                )}
                <Chip label={`Age: ${selectedPatient.age || "N/A"}`} />
                <Chip label={`Gender: ${selectedPatient.gender || "N/A"}`} />
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            label="Diagnosis Details"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            margin="normal"
            multiline
            rows={6}
            disabled={dialogMode === "view"}
            variant="outlined"
            sx={{ mt: 2 }}
          />

          {dialogMode === "edit" && (
            <Typography variant="caption" color="textSecondary">
              Last updated:{" "}
              {selectedPatient?.diagnoses[editIndex]?.updatedAt
                ? moment(
                    selectedPatient.diagnoses[editIndex].updatedAt
                  ).fromNow()
                : "Never"}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            {dialogMode === "view" ? "Close" : "Cancel"}
          </Button>
          {dialogMode !== "view" && (
            <Button
              onClick={handleSaveDiagnosis}
              variant="contained"
              disabled={!diagnosis.trim()}
            >
              Save Diagnosis
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </StyledPaper>
  );
};

export default PatientRecords;
