import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Grid,
  InputAdornment,
  Chip,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Print,
  Delete,
  Search,
  Phone,
  Person,
  CalendarToday,
  Receipt,
  Add,
} from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";

const LabBilling = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const receiptRef = useRef();

  // State for tests
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // State for billing
  const [selectedTests, setSelectedTests] = useState([]);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [discount, setDiscount] = useState(0);
  const [doctorName, setDoctorName] = useState("");
  const [doctorCommission, setDoctorCommission] = useState(0);

  // State for patient search
  const [searchPatientPhone, setSearchPatientPhone] = useState("");
  const [previousVisits, setPreviousVisits] = useState([]);
  const [showPatientHistory, setShowPatientHistory] = useState(false);

  // Generate bill number on mount
  useEffect(() => {
    const date = dayjs().format("YYYYMMDD");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setBillNumber(`LAB-${date}-${randomNum}`);
  }, []);

  // Fetch tests from Firebase
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "labTests"));
        const testsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTests(testsData);
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  // Search for previous patient visits
  const handlePatientSearch = async () => {
    if (!searchPatientPhone) return;

    try {
      const q = query(
        collection(db, "labReceipts"),
        where("patient.phone", "==", searchPatientPhone)
      );
      const snapshot = await getDocs(q);
      const visits = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate(),
      }));

      setPreviousVisits(visits);
      setShowPatientHistory(true);

      // If found, populate current patient info
      if (visits.length > 0) {
        const latestVisit = visits[0];
        setPatientName(latestVisit.patient.name);
        setPatientAge(latestVisit.patient.age);
        setPatientGender(latestVisit.patient.gender);
        setPatientPhone(latestVisit.patient.phone);
        setPatientAddress(latestVisit.patient.address || "");
      }
    } catch (error) {
      console.error("Error searching patient:", error);
    }
  };

  // Test selection functions
  const handleAddTest = (test) => {
    setSelectedTests([...selectedTests, { ...test, id: Date.now() }]);
  };

  const handleRemoveTest = (id) => {
    setSelectedTests(selectedTests.filter((test) => test.id !== id));
  };

  // Calculation functions
  const calculateSubtotal = () => {
    return selectedTests.reduce((sum, test) => sum + test.price, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const totalAfterDiscount = subtotal - discount;
    const commissionAmount = (totalAfterDiscount * doctorCommission) / 100;
    return totalAfterDiscount - commissionAmount;
  };

  const calculateCommission = () => {
    const subtotal = calculateSubtotal();
    return ((subtotal - discount) * doctorCommission) / 100;
  };

  // Save receipt to Firestore
  const saveReceipt = async () => {
    if (selectedTests.length === 0 || !patientName || !patientPhone) return;

    const receiptData = {
      billNumber,
      patient: {
        name: patientName,
        age: patientAge,
        gender: patientGender,
        phone: patientPhone,
        address: patientAddress,
      },
      doctor: {
        name: doctorName,
        commission: doctorCommission,
      },
      tests: selectedTests.map((test) => ({
        name: test.name,
        price: test.price,
      })),
      subtotal: calculateSubtotal(),
      discount,
      commission: calculateCommission(),
      totalAmount: calculateTotal(),
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "labReceipts"), receiptData);

      // Generate new bill number
      const date = dayjs().format("YYYYMMDD");
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setBillNumber(`LAB-${date}-${randomNum}`);

      // Clear form but keep patient info
      setSelectedTests([]);
      setDiscount(0);
      setDoctorName("");
      setDoctorCommission(0);

      return true;
    } catch (error) {
      console.error("Error saving receipt:", error);
      return false;
    }
  };

  // Print receipt
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Lab_Receipt_${billNumber}`,
    onAfterPrint: async () => {
      await saveReceipt();
    },
  });

  // Filter tests based on search
  const filteredTests = tests.filter((test) =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {loading && <LinearProgress />}

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Laboratory Billing System
      </Typography>

      <Grid container spacing={3}>
        {/* Patient Information Column */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: isMobile ? 1 : 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Patient Information
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Bill Number"
                    value={billNumber}
                    fullWidth
                    size="small"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date"
                    value={dayjs().format("DD/MM/YYYY")}
                    fullWidth
                    size="small"
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="Search Patient by Phone"
                value={searchPatientPhone}
                onChange={(e) => setSearchPatientPhone(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handlePatientSearch}
                size="small"
                sx={{ whiteSpace: "nowrap" }}
              >
                Search
              </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Patient Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  fullWidth
                  size="small"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  fullWidth
                  size="small"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Age"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={patientGender}
                    label="Gender"
                    onChange={(e) => setPatientGender(e.target.value)}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 2 }}
            >
              Referring Doctor
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Doctor Name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Commission %"
                  type="number"
                  value={doctorCommission}
                  onChange={(e) => setDoctorCommission(Number(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tests Selection Column */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: isMobile ? 1 : 3, borderRadius: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Test Selection
            </Typography>

            <TextField
              label="Search Tests"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ height: 300, overflow: "auto", mb: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Price (NPR)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test) => (
                      <TableRow key={test.id} hover>
                        <TableCell>{test.name}</TableCell>
                        <TableCell>{test.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleAddTest(test)}
                            startIcon={<Add />}
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No tests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Selected Tests
            </Typography>

            <Box sx={{ height: 200, overflow: "auto", mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Price
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedTests.length > 0 ? (
                    selectedTests.map((test) => (
                      <TableRow key={test.id} hover>
                        <TableCell>{test.name}</TableCell>
                        <TableCell align="right">
                          {test.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveTest(test.id)}
                          >
                            <Delete color="error" fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No tests selected
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Discount (NPR)"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">NPR</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Subtotal"
                    value={calculateSubtotal().toFixed(2)}
                    fullWidth
                    size="small"
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">NPR</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Doctor Commission"
                    value={`${calculateCommission().toFixed(
                      2
                    )} (${doctorCommission}%)`}
                    fullWidth
                    size="small"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Total Amount"
                    value={calculateTotal().toFixed(2)}
                    fullWidth
                    size="small"
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">NPR</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Button
              variant="contained"
              color="primary"
              startIcon={<Print />}
              onClick={handlePrint}
              disabled={
                selectedTests.length === 0 || !patientName || !patientPhone
              }
              fullWidth
              size="large"
            >
              Print Receipt & Save
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Patient History Dialog */}
      <Dialog
        open={showPatientHistory}
        onClose={() => setShowPatientHistory(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Patient History</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Previous visits for: {patientName} ({patientPhone})
          </Typography>

          {previousVisits.length > 0 ? (
            <Box sx={{ maxHeight: 400, overflow: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Bill No.</TableCell>
                    <TableCell>Tests</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previousVisits.map((visit) => (
                    <TableRow key={visit.id} hover>
                      <TableCell>
                        {dayjs(visit.date).format("DD/MM/YYYY hh:mm A")}
                      </TableCell>
                      <TableCell>{visit.billNumber}</TableCell>
                      <TableCell>
                        {visit.tests.slice(0, 2).map((test) => (
                          <div key={test.name}>{test.name}</div>
                        ))}
                        {visit.tests.length > 2 && (
                          <Typography variant="body2" color="primary">
                            +{visit.tests.length - 2} more
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        NPR {visit.totalAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              No previous visits found
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPatientHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Printable Receipt (hidden) */}
      <div style={{ display: "none" }}>
        <div ref={receiptRef}>
          <Box
            sx={{
              p: 4,
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto",
              fontFamily: "'Courier New', monospace",
            }}
          >
            <Typography
              variant="h5"
              align="center"
              sx={{ fontWeight: "bold", mb: 1 }}
            >
              SADEV MEDICAL HALL
            </Typography>
            <Typography align="center" sx={{ fontSize: "0.9rem", mb: 0.5 }}>
              Birgunj-13, Parsa | PAN: 108956245
            </Typography>
            <Typography align="center" sx={{ fontSize: "0.9rem", mb: 2 }}>
              Contact: +977 9861026910
            </Typography>

            <Typography
              variant="h6"
              align="center"
              sx={{
                fontWeight: "bold",
                mb: 2,
                textDecoration: "underline",
                fontSize: "1.2rem",
              }}
            >
              LAB TEST RECEIPT
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: "0.9rem", mb: 0.5 }}>
                <strong>Bill No:</strong> {billNumber}
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", mb: 0.5 }}>
                <strong>Date:</strong> {dayjs().format("DD/MM/YYYY hh:mm A")}
              </Typography>
              <Divider sx={{ my: 1, borderColor: "black" }} />
              <Typography sx={{ fontSize: "0.9rem", mb: 0.5 }}>
                <strong>Patient:</strong> {patientName}
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", mb: 0.5 }}>
                <strong>Age/Gender:</strong> {patientAge}/{patientGender}
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", mb: 0.5 }}>
                <strong>Phone:</strong> {patientPhone}
              </Typography>
              {doctorName && (
                <Typography sx={{ fontSize: "0.9rem", mb: 0.5 }}>
                  <strong>Referred by:</strong> Dr. {doctorName}
                </Typography>
              )}
              <Divider sx={{ my: 1, borderColor: "black" }} />
            </Box>

            <Table size="small" sx={{ border: "none", mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                    Test
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      textAlign: "right",
                    }}
                  >
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedTests.map((test, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontSize: "0.9rem" }}>
                      {test.name}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.9rem", textAlign: "right" }}>
                      {test.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Divider sx={{ my: 1, borderColor: "black" }} />

            <Box sx={{ textAlign: "right", mb: 2 }}>
              <Typography sx={{ fontSize: "0.9rem" }}>
                Subtotal: NPR {calculateSubtotal().toFixed(2)}
              </Typography>
              {discount > 0 && (
                <Typography sx={{ fontSize: "0.9rem" }}>
                  Discount: -NPR {discount.toFixed(2)}
                </Typography>
              )}
              {doctorCommission > 0 && (
                <Typography sx={{ fontSize: "0.9rem" }}>
                  Doctor Commission ({doctorCommission}%): -NPR{" "}
                  {calculateCommission().toFixed(2)}
                </Typography>
              )}
              <Typography sx={{ fontWeight: "bold", fontSize: "1rem", mt: 1 }}>
                Total: NPR {calculateTotal().toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Typography sx={{ fontSize: "0.8rem", fontStyle: "italic" }}>
                ** This is a computer generated receipt **
              </Typography>
              <Typography
                sx={{ fontSize: "0.9rem", fontWeight: "bold", mt: 1 }}
              >
                Thank you for your visit!
              </Typography>
            </Box>
          </Box>
        </div>
      </div>
    </Box>
  );
};

export default LabBilling;
