import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import dayjs from "dayjs";
import { Print as PrintIcon, Edit as EditIcon } from "@mui/icons-material";

function PatientRegistration({ userRole }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    address: "",
    phone: "",
    appointmentDate: dayjs().format("YYYY-MM-DD"),
    billNo: `BILL-${dayjs().format("YYYYMMDD-HHmm")}`,
    doctorId: "",
    opdPrice: "",
    discount: 0,
    discountedPrice: "",
    followUp: false,
    followUpDate: "",
    paymentStatus: "paid",
  });
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [billDetails, setBillDetails] = useState(null);
  const [searchBillNo, setSearchBillNo] = useState("");
  const [matchedPatient, setMatchedPatient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

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

  useEffect(() => {
    if (formData.opdPrice && formData.discount) {
      const price = parseFloat(formData.opdPrice);
      const discount = parseFloat(formData.discount);
      const discounted = price - (price * discount) / 100;
      setFormData((prev) => ({
        ...prev,
        discountedPrice: discounted.toFixed(2),
      }));
    }
  }, [formData.opdPrice, formData.discount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchBillNo = async () => {
    setError("");
    setSuccess("");
    try {
      const q = query(
        collection(db, "Patients"),
        where("billNo", "==", searchBillNo.trim()),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError("No patient found with this Bill No.");
        setMatchedPatient(null);
        return;
      }
      const docSnap = snapshot.docs[0];
      const patient = { id: docSnap.id, ...docSnap.data() };
      setMatchedPatient(patient);
      setFormData({
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        address: patient.address,
        phone: patient.phone,
        appointmentDate: patient.appointmentDate,
        billNo: patient.billNo,
        doctorId: patient.doctorId,
        opdPrice: patient.opdPrice,
        discount: patient.discount || 0,
        discountedPrice: patient.discountedPrice || patient.opdPrice,
        followUp: patient.followUp || false,
        followUpDate: patient.followUpDate || "",
        paymentStatus: patient.paymentStatus || "pending",
      });
      setEditMode(true);
      setSuccess("Patient record found. You can update the details.");
    } catch (err) {
      console.error("Error searching for patient:", err);
      setError("Failed to search for patient. Please try again.");
    }
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
            .toLowerCase()}.`,
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

    if (
      formData.discount &&
      (formData.discount < 0 || formData.discount > 100)
    ) {
      setError("Discount must be between 0 and 100.");
      return;
    }

    try {
      const patientData = {
        address: formData.address,
        age: String(formData.age),
        appointmentDate: formData.appointmentDate,
        billNo: formData.billNo,
        createdAt: editMode
          ? matchedPatient?.createdAt || dayjs().toISOString()
          : dayjs().toISOString(),
        createdBy: userRole,
        diagnoses: editMode ? matchedPatient?.diagnoses || [] : [],
        doctorId: formData.doctorId,
        gender: formData.gender,
        name: formData.name,
        opdPrice: String(formData.opdPrice),
        discountedPrice: String(formData.discountedPrice || formData.opdPrice),
        discount: String(formData.discount || "0"),
        phone: formData.phone,
        followUp: formData.followUp,
        followUpDate: formData.followUpDate || "",
        paymentStatus: formData.paymentStatus,
        updatedAt: dayjs().toISOString(),
        status: "waiting",
      };

      if (editMode) {
        if (matchedPatient) {
          await updateDoc(doc(db, "Patients", matchedPatient.id), patientData);
          setSuccess("Patient record updated successfully!");
        }
      } else {
        await addDoc(collection(db, "Patients"), patientData);
        setSuccess("Patient registered successfully!");
      }

      setBillDetails({ ...formData });
    } catch (err) {
      console.error("Error saving patient:", err);
      setError("Failed to save patient. Please try again.");
    }
  };

  const handlePrintBill = () => {
    const selectedDoctor = doctors.find(
      (doc) => doc.id === billDetails.doctorId,
    );

    // Calculate financial figures
    const originalPrice = parseFloat(billDetails.opdPrice || 0);
    const discountPercent = parseFloat(billDetails.discount || 0);
    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = parseFloat(billDetails.discountedPrice || originalPrice);

    // 1. Create a hidden iframe
    const iframe = document.createElement("iframe");
    // Position it off-screen so it's invisible but technically "displayable"
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.top = "-1000px";
    iframe.style.left = "-1000px";
    document.body.appendChild(iframe);

    // 2. Write the content (same bill HTML/CSS as before)
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill Receipt - ${billDetails.billNo}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 10px; color: #000; }
            .receipt-container { max-width: 300px; margin: 0; }
            .header { text-align: center; margin-bottom: 10px; }
            .clinic-name { font-size: 18px; font-weight: bold; margin: 0; }
            .clinic-info { font-size: 11px; margin: 1px 0; }
            .bill-title { text-align: center; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 5px 0; padding: 2px 0; font-size: 12px;}
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
            .table-container { margin-top: 5px; width: 100%; border-collapse: collapse; }
            .table-container th { text-align: left; border-bottom: 1px solid #000; font-size: 11px; padding: 2px 0; }
            .table-container td { font-size: 11px; padding: 2px 0; text-align: right; }
            .table-container td:first-child { text-align: left; }
            .totals { margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 2px; }
            .footer { text-align: center; font-size: 9px; margin-top: 15px; border-top: 1px solid #ccc; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="clinic-name">SADEV CLINIC</div>
              <div class="clinic-info">Pratima Chowk, Birgunj - 13</div>
              <div class="clinic-info">Phone: +977-9809246610</div>
            </div>
            <div class="bill-title">CASH RECEIPT</div>
            <div class="info-row">
              <span>Bill: ${billDetails.billNo}</span>
              <span>${billDetails.appointmentDate}</span>
            </div>
            <div class="info-row">
              <span>Pt: ${billDetails.name}</span>
            </div>
            <div class="info-row">
              <span>${billDetails.age}Y / ${billDetails.gender}</span>
              <span>${billDetails.phone}</span>
            </div>
            <div class="info-row">
              <span>Dr: ${selectedDoctor?.nameEnglish || "General"}</span>
            </div>
            <table class="table-container">
              <thead><tr><th>Desc</th><th style="text-align:right;">Amt</th></tr></thead>
              <tbody>
                <tr><td>OPD Fee</td><td>${originalPrice.toFixed(2)}</td></tr>
                ${
                  discountPercent > 0
                    ? `<tr><td>Disc (${discountPercent}%)</td><td>-${discountAmount.toFixed(
                        2,
                      )}</td></tr>`
                    : ""
                }
              </tbody>
            </table>
            <div class="totals">
              <div class="total-row">
                <span>Total:</span>
                <span>NPR ${finalPrice.toFixed(2)}</span>
              </div>
            </div>
            <div class="footer">
              <p>User: ${userRole || "Staff"}</p>
              <p>Computer Generated Invoice</p>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // 3. Print and Cleanup
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Remove the iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      gender: "",
      address: "",
      phone: "",
      appointmentDate: dayjs().format("YYYY-MM-DD"),
      billNo: `BILL-${dayjs().format("YYYYMMDD-HHmm")}`,
      doctorId: "",
      opdPrice: "",
      discount: 0,
      discountedPrice: "",
      followUp: false,
      followUpDate: "",
      paymentStatus: "pending",
    });
    setEditMode(false);
    setBillDetails(null);
    setSearchBillNo("");
    setMatchedPatient(null);
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
          {editMode ? "Update Patient Registration" : "Patient Registration"}
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

        <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
          <TextField
            label="Search by Bill No"
            value={searchBillNo}
            onChange={(e) => setSearchBillNo(e.target.value)}
            size="small"
            sx={{ mr: 2, flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleSearchBillNo}
            disabled={!searchBillNo.trim()}
          >
            Search
          </Button>
          {editMode && (
            <Button
              variant="outlined"
              onClick={resetForm}
              sx={{ ml: 2 }}
              color="secondary"
            >
              New Registration
            </Button>
          )}
        </Box>

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
            <Grid item xs={6} sm={3}>
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
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Discount (%)"
                name="discount"
                type="number"
                value={formData.discount}
                onChange={handleChange}
                size="small"
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Discounted Price (NPR)"
                name="discountedPrice"
                value={formData.discountedPrice}
                disabled
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  label="Payment Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Follow Up</InputLabel>
                <Select
                  name="followUp"
                  value={formData.followUp}
                  onChange={(e) => {
                    handleChange(e);
                    if (!e.target.value) {
                      setFormData((prev) => ({
                        ...prev,
                        followUpDate: "",
                      }));
                    }
                  }}
                  label="Follow Up"
                >
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.followUp && (
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Follow Up Date"
                  name="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bill Number"
                name="billNo"
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
              {editMode ? "Update Patient" : "Register Patient"}
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
                      {billDetails.billNo}
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
                      NPR {billDetails.discountedPrice || billDetails.opdPrice}
                      {billDetails.discount > 0 && (
                        <Chip
                          label={`${billDetails.discount}% off`}
                          size="small"
                          color="secondary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                  </Grid>

                  {billDetails.followUp && (
                    <>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="body2">
                          <strong>Follow Up:</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={8}>
                        <Typography variant="body2">
                          {billDetails.followUpDate}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handlePrintBill}
                size="medium"
                startIcon={<PrintIcon />}
              >
                Print Receipt
              </Button>
              {editMode && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setOpenEditDialog(true)}
                  size="medium"
                  startIcon={<EditIcon />}
                >
                  Edit Details
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Patient Details</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
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
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleSubmit({ preventDefault: () => {} });
              setOpenEditDialog(false);
            }}
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PatientRegistration;
