import { useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function PatientDetails({
  patient,
  setPatient,
  discount,
  setDiscount,
  paymentType,
  setPaymentType,
  paidAmount,
  setPaidAmount,
  paymentMethod,
  setPaymentMethod,
}) {
  const [nameSuggestions, setNameSuggestions] = useState([]);

  const fetchPatientSuggestions = async (name) => {
    if (name.length < 2) {
      setNameSuggestions([]);
      return;
    }

    try {
      const salesQuery = query(
        collection(db, "Sales"),
        where("patient.name", ">=", name),
        where("patient.name", "<=", name + "\uf8ff")
      );
      const querySnapshot = await getDocs(salesQuery);
      const uniquePatients = new Map();
      querySnapshot.forEach((doc) => {
        const patientData = doc.data().patient;
        if (!uniquePatients.has(patientData.name)) {
          uniquePatients.set(patientData.name, patientData);
        }
      });
      setNameSuggestions(Array.from(uniquePatients.values()));
    } catch (error) {
      console.error("Error fetching patient suggestions:", error);
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setPatient({ ...patient, name });
    fetchPatientSuggestions(name);
  };

  const handleSuggestionSelect = (selectedPatient) => {
    setPatient({
      name: selectedPatient.name,
      age: selectedPatient.age || "",
      gender: selectedPatient.gender || "",
      address: selectedPatient.address || "",
      phone: selectedPatient.phone || "",
    });
    setNameSuggestions([]);
  };

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        backgroundColor: "#fff",
        boxShadow: 1,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Patient Details
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ position: "relative" }}>
          <TextField
            fullWidth
            label="Patient Name"
            value={patient.name}
            onChange={handleNameChange}
            required
          />
          {nameSuggestions.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 10,
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                maxHeight: 200,
                overflowY: "auto",
                mt: 1,
              }}
            >
              {nameSuggestions.map((suggestion, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  {suggestion.name}
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <TextField
          fullWidth
          label="Phone Number"
          value={patient.phone || ""}
          onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
          type="tel"
        />
        <TextField
          fullWidth
          label="Age"
          value={patient.age}
          onChange={(e) => setPatient({ ...patient, age: e.target.value })}
          type="number"
        />
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            value={patient.gender}
            onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
            label="Gender"
          >
            <MenuItem value="">Select Gender</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Address"
          value={patient.address}
          onChange={(e) => setPatient({ ...patient, address: e.target.value })}
        />
        <TextField
          fullWidth
          label="Discount (Rs)"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          type="number"
        />
        <FormControl fullWidth>
          <InputLabel>Payment Type</InputLabel>
          <Select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            label="Payment Type"
          >
            <MenuItem value="fullyPaid">Fully Paid</MenuItem>
            <MenuItem value="partiallyPaid">Partially Paid</MenuItem>
            <MenuItem value="credit">Credit</MenuItem>
          </Select>
        </FormControl>
        {paymentType !== "credit" && (
          <TextField
            fullWidth
            label="Paid Amount (Rs)"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            type="number"
          />
        )}
        <FormControl component="fieldset" required>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Payment Method
          </Typography>
          <RadioGroup
            row
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            name="payment-method"
          >
            <FormControlLabel
              value="Offline"
              control={<Radio />}
              label="Offline"
            />
            <FormControlLabel
              value="Online"
              control={<Radio />}
              label="Online"
            />
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
  );
}
