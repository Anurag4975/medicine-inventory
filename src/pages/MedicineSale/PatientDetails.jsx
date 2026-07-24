import { useState, useEffect } from "react";
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
  useMediaQuery,
  useTheme,
  Paper,
  Divider,
} from "@mui/material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { FaUserCircle, FaMoneyBillWave } from "react-icons/fa";

export default function PatientDetails({
  patient,
  setPatient,
  discount,
  setDiscount,
  discountBy,
  setDiscountBy,
  paymentType,
  setPaymentType,
  paidAmount,
  setPaidAmount,
  paymentMethod,
  setPaymentMethod,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [discountGivers, setDiscountGivers] = useState([]);

  useEffect(() => {
    const fetchDiscountGivers = async () => {
      try {
        const [employeeSnap, doctorSnap] = await Promise.all([
          getDocs(collection(db, "Employees")),
          getDocs(collection(db, "Doctors")),
        ]);

        const employees = employeeSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          role: "Employee",
        }));

        const doctors = doctorSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().nameEnglish,
          role: "Doctor",
        }));

        setDiscountGivers([...doctors, ...employees]);
      } catch (error) {
        console.error("Error fetching discount givers:", error);
      }
    };
    fetchDiscountGivers();
  }, []);

  const fetchPatientSuggestions = async (name) => {
    if (name.length < 2) {
      setNameSuggestions([]);
      return;
    }

    try {
      const salesQuery = query(
        collection(db, "Sales"),
        where("patient.name", ">=", name),
        where("patient.name", "<=", name + "\uf8ff"),
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
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 1.5 },
        borderRadius: 2,
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e0f2fe",
        boxShadow: "0 1px 6px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* PATIENT INFO */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 0.75 }}>
          <FaUserCircle size={16} color="#0369a1" />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#0c4a6e",
              letterSpacing: "0.2px",
              fontSize: "0.95rem",
            }}
          >
            Patient Details
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              label="Patient Name *"
              value={patient.name}
              onChange={handleNameChange}
              required
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                  fontSize: "0.85rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.85rem",
                },
              }}
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
                  border: "1px solid #0ea5e9",
                  borderRadius: 1.5,
                  maxHeight: 150,
                  overflowY: "auto",
                  mt: 0.5,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                {nameSuggestions.map((suggestion, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      "&:hover": {
                        backgroundColor: "#f0f9ff",
                        borderLeft: "2px solid #0369a1",
                      },
                      transition: "all 0.15s ease",
                      fontWeight: 500,
                    }}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion.name}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" },
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              label="Phone"
              value={patient.phone || ""}
              onChange={(e) =>
                setPatient({ ...patient, phone: e.target.value })
              }
              type="tel"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                  fontSize: "0.85rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.85rem",
                },
              }}
            />
            <TextField
              fullWidth
              label="Age"
              value={patient.age}
              onChange={(e) => setPatient({ ...patient, age: e.target.value })}
              type="number"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                  fontSize: "0.85rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.85rem",
                },
              }}
            />
            <FormControl
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                  fontSize: "0.85rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.85rem",
                },
              }}
            >
              <InputLabel>Gender</InputLabel>
              <Select
                value={patient.gender}
                onChange={(e) =>
                  setPatient({ ...patient, gender: e.target.value })
                }
                label="Gender"
              >
                <MenuItem value="" sx={{ fontSize: "0.85rem" }}>
                  Select
                </MenuItem>
                <MenuItem value="Male" sx={{ fontSize: "0.85rem" }}>
                  Male
                </MenuItem>
                <MenuItem value="Female" sx={{ fontSize: "0.85rem" }}>
                  Female
                </MenuItem>
                <MenuItem value="Other" sx={{ fontSize: "0.85rem" }}>
                  Other
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            fullWidth
            label="Address"
            value={patient.address}
            onChange={(e) =>
              setPatient({ ...patient, address: e.target.value })
            }
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                bgcolor: "white",
                fontSize: "0.85rem",
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.85rem",
              },
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* PAYMENT SECTION */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 0.75 }}>
          <FaMoneyBillWave size={14} color="#16a34a" />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "#15803d",
              letterSpacing: "0.2px",
              fontSize: "0.85rem",
            }}
          >
            Payment Details
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              label="Discount (NPR)"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              type="number"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                  fontSize: "0.85rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.85rem",
                },
              }}
            />

            <FormControl
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                  fontSize: "0.85rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.85rem",
                },
              }}
            >
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                label="Payment Type"
              >
                <MenuItem value="fullyPaid" sx={{ fontSize: "0.85rem" }}>
                  Fully Paid
                </MenuItem>
                <MenuItem value="partiallyPaid" sx={{ fontSize: "0.85rem" }}>
                  Partially Paid
                </MenuItem>
                <MenuItem value="credit" sx={{ fontSize: "0.85rem" }}>
                  Credit
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {Number(discount) > 0 && (
            <FormControl
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                  fontSize: "0.85rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.85rem",
                },
              }}
            >
              <InputLabel>Discount Given By *</InputLabel>
              <Select
                value={discountBy || ""}
                onChange={(e) => setDiscountBy(e.target.value)}
                label="Discount Given By *"
              >
                <MenuItem value="" sx={{ fontSize: "0.85rem" }}>
                  Select
                </MenuItem>
                {discountGivers.map((giver) => (
                  <MenuItem
                    key={giver.id}
                    value={giver.name}
                    sx={{ fontSize: "0.85rem" }}
                  >
                    {giver.name} ({giver.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {paymentType !== "credit" && (
            <TextField
              fullWidth
              label="Paid Amount (NPR)"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              type="number"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                  fontSize: "0.85rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.85rem",
                },
              }}
            />
          )}

          <Box
            sx={{
              p: 1,
              bgcolor: "#f0fdf4",
              borderRadius: 1.5,
              border: "1px solid #bbf7d0",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.5,
                fontWeight: 600,
                color: "#15803d",
                fontSize: "0.75rem",
              }}
            >
              Payment Method
            </Typography>
            <RadioGroup
              row
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              name="payment-method"
              sx={{
                gap: 1,
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.8rem",
                },
              }}
            >
              <FormControlLabel
                value="Offline"
                control={<Radio size="small" sx={{ color: "#16a34a" }} />}
                label="Cash"
              />
              <FormControlLabel
                value="Online"
                control={<Radio size="small" sx={{ color: "#16a34a" }} />}
                label="Online"
              />
            </RadioGroup>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
