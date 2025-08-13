import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Box,
  Alert,
  Divider,
  Grid,
  Paper,
  Card,
  CardContent,
} from "@mui/material";
import dayjs from "dayjs";

function PatientRegistration({ userRole }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    address: "",
    phone: "",
    appointmentDate: "",
    billNo: `BILL-${dayjs().format("YYYYMMDD-HHmm")}`, // Changed to billNo
    doctorId: "",
    opdPrice: "",
  });
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [billDetails, setBillDetails] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Doctors"));
        const doctorList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDoctors(doctorList);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctors. Please check your permissions.");
      }
    };
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userRole || !["admin", "staff"].includes(userRole)) {
      setError("Invalid user role. Please log in with valid credentials.");
      return;
    }

    const requiredFields = [
      "name",
      "age",
      "gender",
      "address",
      "phone",
      "appointmentDate",
      "doctorId",
      "opdPrice",
    ];
    for (let field of requiredFields) {
      if (!formData[field]) {
        setError(
          `Please fill in the ${field
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()}.`
        );
        return;
      }
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be 10 digits.");
      return;
    }

    if (isNaN(formData.age) || formData.age <= 0 || formData.age > 150) {
      setError("Please enter a valid age.");
      return;
    }

    if (isNaN(formData.opdPrice) || formData.opdPrice <= 0) {
      setError("Please enter a valid OPD price.");
      return;
    }

    try {
      const patientData = {
        address: formData.address,
        age: String(formData.age), // Ensure age is a string
        appointmentDate: formData.appointmentDate,
        billNo: formData.billNo,
        createdAt: dayjs().toISOString(), // Current timestamp in ISO format
        createdBy: userRole,
        diagnoses: [], // Empty array as specified
        doctorId: formData.doctorId,
        gender: formData.gender,
        name: formData.name,
        opdPrice: String(formData.opdPrice), // Ensure opdPrice is a string
        phone: formData.phone,
      };
      const docRef = await addDoc(collection(db, "Patients"), patientData);
      setSuccess("Patient registered successfully!");
      setBillDetails({ ...formData, id: docRef.id });
    } catch (err) {
      console.error("Error registering patient:", err);
      setError("Failed to register patient. Please try again.");
    }
  };

  const handlePrintBill = () => {
    const selectedDoctor = doctors.find(
      (doc) => doc.id === billDetails.doctorId
    ) || {
      nameEnglish: "Unknown",
      nameNepali: "अज्ञात",
      designationEnglish: "N/A",
      designationNepali: "N/A",
      nmcNumber: "N/A",
      degrees: [],
    };

    const degreeLinesEnglish = selectedDoctor.degrees
      .map((deg) => `${deg.degreeEnglish} (${deg.institutionEnglish})`)
      .join("<br />");
    const degreeLinesNepali = selectedDoctor.degrees
      .map((deg) => `${deg.degreeNepali} (${deg.institutionNepali})`)
      .join("<br />");

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 12px 23px 9px 38px;
              box-sizing: border-box;
              position: relative;
              height: 1100px;
            }
      
            .clinic-name {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              color: #1e90ff;
              margin-top: 10px;
              margin-bottom: 5px;
            }
      
            .clinic-address {
              text-align: center;
              font-size: 12px;
              margin-bottom: 5px;
            }
      
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 10px;
            }
      
            .header-left {
              width: 45%;
              font-size: 14px;
            }
      
            .header-right {
              width: 45%;
              text-align: right;
              font-size: 14px;
            }
      
            .nmc-top {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 5px;
            }
      
            .doctor-info p {
              margin: 2px 0;
            }
      
            .logo-center {
              width: 10%;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
            }
      
            .logo-center img {
              max-width: 100px;
              max-height: 100px;
            }
      
            .line {
              border-top: 2px solid #000;
              margin: 10px 0;
            }
      
            .patient-info {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              margin-bottom: 10px;
            }
      
            .patient-info span {
              display: inline-block;
              min-width: 80px;
              border-bottom: 1px dotted #000;
              margin-left: 5px;
            }
      
            .vital-signs {
              text-align: right;
              margin-top: 10px;
              margin-right: 30px;
              font-size: 14px;
            }
      
            .vital-signs p {
              margin: 4px 0;
            }
      
            .footer {
              position: absolute;
              bottom: 10px;
              width: 100%;
              text-align: center;
              font-size: 12px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="clinic-name">SADEV CLINIC</div>
          <div class="clinic-address">Pratima Chowk, Birgunj - 13, Parsa, Madhesh Province, Nepal</div>
          <div class="clinic-address"><strong>N.M.C. NO. ${selectedDoctor.nmcNumber}</strong></div>
      
          <div class="header">
            <div class="header-left">
              <div class="nmc-top">N.M.C. NO. ${selectedDoctor.nmcNumber}</div>
              <div class="doctor-info">
                <strong>${selectedDoctor.nameEnglish}</strong><br />
                ${degreeLinesEnglish}<br />
                <strong>${selectedDoctor.designationEnglish}</strong>
              </div>
            </div>
      
            <div class="logo-center">
              <img src="../../doc.png" alt="Clinic Logo" />
            </div>
      
            <div class="header-right">
              <div class="nmc-top">N.M.C. NO. ${selectedDoctor.nmcNumber}</div>
              <strong>${selectedDoctor.nameNepali}</strong><br />
              ${degreeLinesNepali}<br />
              <strong>${selectedDoctor.designationNepali}</strong>
            </div>
          </div>
      
          <div class="line"></div>
      
          <div class="patient-info">
            Name:<span>${billDetails.name}</span>
            Age:<span>${billDetails.age}</span>
            Sex:<span>${billDetails.gender}</span>
          </div>
          <div class="patient-info">
            Address:<span>${billDetails.address}</span>
            Date:<span>${billDetails.appointmentDate}</span>
            OPD Fee:<span>${billDetails.opdPrice}</span>
          </div>
      
          <div class="line"></div>
      
          <div class="vital-signs">
            <strong>Vital Sign:</strong><br />
            RR: _______<br />
            PR: _______<br />
            SPO₂: _______<br />
            BP: _______<br />
            Temp: _______
          </div>
      
          <div class="footer">
            नोट १४ दिन पछि पुनः फी लाग्ने छ।<br />
            <strong>SADEV CLINIC</strong><br />
            Pratima Chowk, Birgunj - 13, Parsa, Madhesh Province, Nepal (हुनमान मन्दिरको ठीक पछाडि)<br />
            📞 +977-9809246610 | +977-9709498572 | 9861026910
          </div>
        </body>
      </html>
      `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Box sx={{ maxWidth: "800px", mx: "auto", p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography
          variant="h5"
          gutterBottom
          align="center"
          sx={{ mb: 3, color: "primary.main" }}
        >
          Patient Registration
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Appointment Date"
                name="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={handleChange}
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                size="small"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Assign Doctor</InputLabel>
                <Select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  label="Assign Doctor"
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.nameEnglish} ({doctor.designationEnglish})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="OPD Price (NPR)"
                name="opdPrice"
                type="number"
                value={formData.opdPrice}
                onChange={handleChange}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bill Number"
                name="billNo" // Changed to billNo
                value={formData.billNo}
                disabled
                size="small"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="medium"
              sx={{ px: 4 }}
            >
              Register Patient
            </Button>
          </Box>
        </form>

        {billDetails && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2 }}>
              Registration Summary
            </Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2">
                      <strong>Bill No:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={8}>
                    <Typography variant="body2">
                      {billDetails.billNo} {/* Changed to billNo */}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2">
                      <strong>Patient:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={8}>
                    <Typography variant="body2">{billDetails.name}</Typography>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2">
                      <strong>Age/Sex:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={8}>
                    <Typography variant="body2">
                      {billDetails.age}/{billDetails.gender}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2">
                      <strong>Doctor:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={8}>
                    <Typography variant="body2">
                      {doctors.find((doc) => doc.id === billDetails.doctorId)
                        ?.nameEnglish || "Unknown"}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2">
                      <strong>OPD Fee:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={8}>
                    <Typography variant="body2">
                      NPR {billDetails.opdPrice}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handlePrintBill}
                size="medium"
              >
                Print Bill
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default PatientRegistration;
