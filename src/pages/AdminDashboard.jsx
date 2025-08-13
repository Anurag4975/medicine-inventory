import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import Logout from "../components/Logout";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [doctorData, setDoctorData] = useState({
    nameEnglish: "",
    nameNepali: "",
    designationEnglish: "",
    designationNepali: "",
    phone: "",
    nmcNumber: "",
    degrees: [
      {
        degreeEnglish: "",
        degreeNepali: "",
        institutionEnglish: "",
        institutionNepali: "",
      },
    ],
  });
  const [editDoctorId, setEditDoctorId] = useState(null);

  // Predefined designations
  const designations = [
    "Pediatrics",
    "Geriatrician",
    "Anesthesiology",
    "Radiologist",
    "Cardiologist",
    "Allergy and Immunology",
    "General Practitioner",
    "Orthopedist",
    "Cardiology",
    "Dermatology",
    "Emergency medicine",
    "Endocrinology",
    "Family medicine",
    "Internal medicine",
    "Neurology",
    "Obstetrics and gynecology",
    "Ophthalmology",
    "Orthopedic Surgeon",
    "Pathology",
    "Psychiatry",
    "Surgery",
    "Senior Consultant Physician",
    "Other",
  ];

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Doctors"));
        const doctorData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDoctors(doctorData);
      } catch (error) {
        console.error("Error fetching doctors: ", error);
      }
    };
    fetchDoctors();
  }, []);

  const handleOpenDialog = (id = null, doctor = null) => {
    setEditDoctorId(id);
    if (id && doctor) {
      setDoctorData({
        nameEnglish: doctor.nameEnglish || "",
        nameNepali: doctor.nameNepali || "",
        designationEnglish: doctor.designationEnglish || "",
        designationNepali: doctor.designationNepali || "",
        phone: doctor.phone || "",
        nmcNumber: doctor.nmcNumber || "",
        degrees: doctor.degrees || [
          {
            degreeEnglish: "",
            degreeNepali: "",
            institutionEnglish: "",
            institutionNepali: "",
          },
        ],
      });
    } else {
      setDoctorData({
        nameEnglish: "",
        nameNepali: "",
        designationEnglish: "",
        designationNepali: "",
        phone: "",
        nmcNumber: "",
        degrees: [
          {
            degreeEnglish: "",
            degreeNepali: "",
            institutionEnglish: "",
            institutionNepali: "",
          },
        ],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditDoctorId(null);
    setDoctorData({
      nameEnglish: "",
      nameNepali: "",
      designationEnglish: "",
      designationNepali: "",
      phone: "",
      nmcNumber: "",
      degrees: [
        {
          degreeEnglish: "",
          degreeNepali: "",
          institutionEnglish: "",
          institutionNepali: "",
        },
      ],
    });
  };

  const handleChange = (e) => {
    setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
  };

  const handleDegreeChange = (index, field, value) => {
    const newDegrees = [...doctorData.degrees];
    newDegrees[index][field] = value;
    setDoctorData({ ...doctorData, degrees: newDegrees });
  };

  const addDegree = () => {
    setDoctorData({
      ...doctorData,
      degrees: [
        ...doctorData.degrees,
        {
          degreeEnglish: "",
          degreeNepali: "",
          institutionEnglish: "",
          institutionNepali: "",
        },
      ],
    });
  };

  const removeDegree = (index) => {
    if (doctorData.degrees.length > 1) {
      const newDegrees = doctorData.degrees.filter((_, i) => i !== index);
      setDoctorData({ ...doctorData, degrees: newDegrees });
    }
  };

  const handleSaveDoctor = async () => {
    // Validate required fields
    if (
      !doctorData.nameEnglish ||
      !doctorData.nameNepali ||
      !doctorData.designationEnglish ||
      !doctorData.designationNepali ||
      !doctorData.phone ||
      !doctorData.nmcNumber ||
      doctorData.degrees.some(
        (degree) =>
          !degree.degreeEnglish ||
          !degree.degreeNepali ||
          !degree.institutionEnglish ||
          !degree.institutionNepali
      )
    ) {
      alert("Please fill in all fields for the doctor and their degrees.");
      return;
    }

    try {
      if (editDoctorId) {
        // Edit existing doctor
        const doctorRef = doc(db, "Doctors", editDoctorId);
        await updateDoc(doctorRef, doctorData);
        setDoctors((prev) =>
          prev.map((doc) =>
            doc.id === editDoctorId ? { ...doc, ...doctorData } : doc
          )
        );
      } else {
        // Add new doctor
        const docRef = await addDoc(collection(db, "Doctors"), doctorData);
        setDoctors((prev) => [...prev, { id: docRef.id, ...doctorData }]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving doctor: ", error);
      alert("Failed to save doctor: " + error.message);
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;

    try {
      await deleteDoc(doc(db, "Doctors", id));
      setDoctors((prev) => prev.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Error deleting doctor: ", error);
      alert("Failed to delete doctor: " + error.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Welcome, Admin! Manage everything from here.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" component={Link} to="/stock" sx={{ mr: 2 }}>
          Manage Stock
        </Button>
        <Button
          variant="contained"
          component={Link}
          to="/purchases"
          sx={{ mr: 2 }}
        >
          View Purchases
        </Button>
        <Button
          variant="contained"
          component={Link}
          to="/insights"
          sx={{ mr: 2 }}
        >
          Data Insights
        </Button>
        <Button variant="contained" component={Link} to="/patient-registration">
          Register Patient
        </Button>
      </Box>

      {/* Doctor Management Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Manage Doctors
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
          sx={{ mb: 2 }}
        >
          Add Doctor
        </Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Doctor Name (English)</TableCell>
              <TableCell>Designation (English)</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>NMC Number</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell>{doctor.nameEnglish || "N/A"}</TableCell>
                <TableCell>{doctor.designationEnglish || "N/A"}</TableCell>
                <TableCell>{doctor.phone || "N/A"}</TableCell>
                <TableCell>{doctor.nmcNumber || "N/A"}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpenDialog(doctor.id, doctor)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteDoctor(doctor.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Logout />
      </Box>

      {/* Doctor Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editDoctorId ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Doctor Name (English)"
            name="nameEnglish"
            value={doctorData.nameEnglish}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Doctor Name (Nepali)"
            name="nameNepali"
            value={doctorData.nameNepali}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Designation (English)"
            name="designationEnglish"
            value={doctorData.designationEnglish}
            onChange={handleChange}
            margin="normal"
            required
          >
            {designations.map((designation) => (
              <MenuItem key={designation} value={designation}>
                {designation}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Designation (Nepali)"
            name="designationNepali"
            value={doctorData.designationNepali}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={doctorData.phone}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="NMC Number"
            name="nmcNumber"
            value={doctorData.nmcNumber}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Degrees
          </Typography>
          <List>
            {doctorData.degrees.map((degree, index) => (
              <ListItem
                key={index}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    width: "100%",
                    flexWrap: "wrap",
                  }}
                >
                  <TextField
                    label="Degree (English)"
                    value={degree.degreeEnglish}
                    onChange={(e) =>
                      handleDegreeChange(index, "degreeEnglish", e.target.value)
                    }
                    margin="normal"
                    required
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <TextField
                    label="Degree (Nepali)"
                    value={degree.degreeNepali}
                    onChange={(e) =>
                      handleDegreeChange(index, "degreeNepali", e.target.value)
                    }
                    margin="normal"
                    required
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <TextField
                    label="Institution (English)"
                    value={degree.institutionEnglish}
                    onChange={(e) =>
                      handleDegreeChange(
                        index,
                        "institutionEnglish",
                        e.target.value
                      )
                    }
                    margin="normal"
                    required
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <TextField
                    label="Institution (Nepali)"
                    value={degree.institutionNepali}
                    onChange={(e) =>
                      handleDegreeChange(
                        index,
                        "institutionNepali",
                        e.target.value
                      )
                    }
                    margin="normal"
                    required
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                </Box>
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={() => removeDegree(index)}
                    disabled={doctorData.degrees.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addDegree}
            sx={{ mt: 1 }}
          >
            Add Degree
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveDoctor} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;
