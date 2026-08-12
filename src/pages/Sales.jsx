import { useState, useEffect, useCallback, useMemo } from "react";
import { appCache, CACHE_KEYS, cacheEvents } from "../utils/appCache";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
  Tooltip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  LocalPharmacy as PharmacyIcon,
  Payment as PaymentIcon,
  Medication as MedicationIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  ShoppingBag as ShoppingBagIcon,
} from "@mui/icons-material";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDoc, doc, writeBatch } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Main Sales Component
// ---------------------------------------------------------------------------
function Sales() {
  // State
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
  });
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // FIXED: userRole as proper state instead of undefined propUserRole
  const [userRole, setUserRole] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Stock data via shared cache
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);

  // Today's patients via shared cache
  const [todaysPatients, setTodaysPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  // Subscribe to shared stock data
  useEffect(() => {
    // Get cached data immediately
    const cached = appCache.getCachedStock();
    if (cached && cached.length > 0) {
      setStocks(cached);
      setStocksLoading(false);
    }

    const unsubscribe = cacheEvents.on(CACHE_KEYS.STOCK, (data) => {
      if (data && data.length > 0) {
        setStocks(data);
        setStocksLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to shared patients data
  useEffect(() => {
    const cached = appCache.getCachedPatients();
    if (cached && cached.length > 0) {
      const withPrescriptions = cached.filter((p) => {
        const hasPrescription =
          (p.prescription && p.prescription.length > 0) ||
          (p.pastVisits &&
            p.pastVisits[p.pastVisits.length - 1]?.prescription?.length > 0);
        return hasPrescription;
      });
      setTodaysPatients(withPrescriptions);
      setPatientsLoading(false);
    }

    const unsubscribe = cacheEvents.on(CACHE_KEYS.TODAYS_PATIENTS, (data) => {
      if (data && data.length > 0) {
        const withPrescriptions = data.filter((p) => {
          const hasPrescription =
            (p.prescription && p.prescription.length > 0) ||
            (p.pastVisits &&
              p.pastVisits[p.pastVisits.length - 1]?.prescription?.length > 0);
          return hasPrescription;
        });
        setTodaysPatients(withPrescriptions);
        setPatientsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Auth - now properly sets userRole state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const cachedRole = sessionStorage.getItem("userRole");
        if (cachedRole) {
          setUserRole(cachedRole);
        } else {
          try {
            const userDoc = await getDoc(doc(db, "Users", user.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role;
              setUserRole(role);
              sessionStorage.setItem("userRole", role);
            }
          } catch (err) {
            console.error("Error fetching user role:", err);
          }
        }
      } else {
        setUserRole(null);
        sessionStorage.removeItem("userRole");
      }
    });
    return () => unsubscribe();
  }, []);

  // Medicine types for filtering
  const medicineTypes = useMemo(() => {
    const types = new Set(stocks.map((s) => s.type).filter(Boolean));
    return ["all", ...Array.from(types)];
  }, [stocks]);

  // Filtered stocks
  const filteredStocks = useMemo(() => {
    let result = stocks;
    if (selectedCategory !== "all") {
      result = result.filter((s) => s.type === selectedCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.medicineName?.toLowerCase().includes(term) ||
          s.type?.toLowerCase().includes(term) ||
          s.brand?.toLowerCase().includes(term),
      );
    }
    return result;
  }, [stocks, searchTerm, selectedCategory]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return todaysPatients;
    const term = patientSearch.toLowerCase();
    return todaysPatients.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.billNo?.toLowerCase().includes(term) ||
        p.phone?.includes(term),
    );
  }, [todaysPatients, patientSearch]);

  // Totals
  const subtotal = useMemo(
    () => selectedMedicines.reduce((sum, item) => sum + item.total, 0),
    [selectedMedicines],
  );
  const discountAmount = discount ? parseFloat(discount) || 0 : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Add medicine to cart
  const addMedicine = useCallback(
    (medicine) => {
      setSelectedMedicines((prev) => {
        const existing = prev.find((item) => item.id === medicine.id);
        if (existing) {
          if (existing.quantity >= medicine.quantity) {
            showSnackbar(`Only ${medicine.quantity} available`, "error");
            return prev;
          }
          return prev.map((item) =>
            item.id === medicine.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  total: (item.quantity + 1) * item.price,
                }
              : item,
          );
        }
        return [
          ...prev,
          {
            id: medicine.id,
            medicineName: medicine.medicineName,
            type: medicine.type || "Tab",
            quantity: 1,
            price: medicine.price || 0,
            total: medicine.price || 0,
          },
        ];
      });
    },
    [showSnackbar],
  );

  const removeMedicine = useCallback((id) => {
    setSelectedMedicines((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id, change) => {
      setSelectedMedicines((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const newQuantity = item.quantity + change;
          if (newQuantity < 1) return item;
          const stockItem = stocks.find((s) => s.id === id);
          if (stockItem && newQuantity > stockItem.quantity) {
            showSnackbar(`Only ${stockItem.quantity} available`, "error");
            return item;
          }
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.price,
          };
        }),
      );
    },
    [stocks, showSnackbar],
  );

  const getPatientPrescription = useCallback((patientData) => {
    if (patientData.pastVisits && patientData.pastVisits.length > 0) {
      return (
        patientData.pastVisits[patientData.pastVisits.length - 1]
          .prescription || []
      );
    }
    return patientData.prescription || [];
  }, []);

  const addPatientPrescription = useCallback(
    (patientData) => {
      setPatient({
        name: patientData.name || "",
        age: patientData.age || "",
        gender: patientData.gender || "",
        phone: patientData.phone || "",
        address: patientData.address || "",
      });

      const prescription = getPatientPrescription(patientData);
      if (prescription.length === 0) {
        showSnackbar("No prescription found", "warning");
        return;
      }

      prescription.forEach((med) => {
        const stockItem = stocks.find((s) => s.id === med.medicineId);
        if (stockItem) {
          setSelectedMedicines((prev) => {
            const existing = prev.find((item) => item.id === stockItem.id);
            if (existing) return prev;
            return [
              ...prev,
              {
                id: stockItem.id,
                medicineName: med.medicine || stockItem.medicineName,
                type: med.type || stockItem.type || "Tab",
                quantity: 1,
                price: stockItem.price || 0,
                total: stockItem.price || 0,
              },
            ];
          });
        }
      });

      showSnackbar(`Loaded prescription for ${patientData.name}`);
    },
    [stocks, getPatientPrescription, showSnackbar],
  );

  const clearCart = useCallback(() => {
    setSelectedMedicines([]);
    setPatient({ name: "", age: "", gender: "", phone: "", address: "" });
    setDiscount("");
  }, []);

  const handleSubmitSale = async () => {
    if (selectedMedicines.length === 0) {
      showSnackbar("Please add medicines", "error");
      return;
    }

    setProcessing(true);

    try {
      const now = new Date();
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const billNumber = `SALE-${datePart}-${timePart}-${randomPart}`;

      const saleData = {
        billNumber,
        patient: patient.name ? patient : null,
        medicines: selectedMedicines.map((m) => ({
          id: m.id,
          medicineName: m.medicineName,
          type: m.type,
          quantity: m.quantity,
          price: m.price,
          total: m.total,
        })),
        subtotal,
        discount: discountAmount,
        totalAmount: total,
        paymentMethod,
        saleDate: now.toISOString(),
        seller: { uid: auth.currentUser?.uid || "unknown", role: userRole },
      };

      const batch = writeBatch(db);
      const saleRef = doc(collection(db, "Sales"));
      batch.set(saleRef, saleData);

      selectedMedicines.forEach((med) => {
        const stockItem = stocks.find((s) => s.id === med.id);
        if (stockItem) {
          batch.update(doc(db, "Stock", med.id), {
            quantity: stockItem.quantity - med.quantity,
            lastUpdated: now.toISOString(),
          });
        }
      });

      await batch.commit();
      await appCache.invalidateStock();

      setReceipt({ ...saleData, id: saleRef.id });
      setShowReceipt(true);
      showSnackbar("Sale completed!");
      clearCart();
    } catch (error) {
      console.error("Sale error:", error);
      showSnackbar(error.message || "Failed to record sale", "error");
    } finally {
      setProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f0f2f5",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <PharmacyIcon sx={{ fontSize: 24 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1.1rem" }}>
          Pharmacy POS
        </Typography>
        <Box sx={{ flex: 1 }} />
        {receipt && (
          <Tooltip title="Last receipt">
            <IconButton
              size="small"
              onClick={() => setShowReceipt(true)}
              sx={{ color: "#fff" }}
            >
              <ReceiptIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Main Layout */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT - Medicine Browser */}
        <Box
          sx={{
            width: "280px",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #e0e0e0",
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              💊 Medicines
            </Typography>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                sx: { fontSize: "0.85rem" },
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
            <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
              {medicineTypes.slice(0, 6).map((type) => (
                <Chip
                  key={type}
                  label={type === "all" ? "All" : type}
                  size="small"
                  onClick={() => setSelectedCategory(type)}
                  color={selectedCategory === type ? "primary" : "default"}
                  variant={selectedCategory === type ? "filled" : "outlined"}
                  sx={{ fontSize: "0.7rem", height: 24, cursor: "pointer" }}
                />
              ))}
            </Box>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {stocksLoading ? (
              <Box textAlign="center" py={4}>
                <CircularProgress size={20} />
              </Box>
            ) : (
              filteredStocks.map((stock) => (
                <Box
                  key={stock.id}
                  onClick={() => addMedicine(stock)}
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                    transition: "all 0.15s",
                    "&:hover": { bgcolor: "#e3f2fd" },
                    borderLeft:
                      stock.quantity <= 10
                        ? "3px solid #ff9800"
                        : "3px solid transparent",
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" noWrap>
                    {stock.medicineName}
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box display="flex" gap={0.5}>
                      <Chip
                        label={stock.type || "Tab"}
                        size="small"
                        sx={{ height: 18, fontSize: "0.6rem" }}
                      />
                      {stock.quantity <= 10 && (
                        <Chip
                          label={`${stock.quantity} left`}
                          color="warning"
                          size="small"
                          sx={{ height: 18, fontSize: "0.6rem" }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="primary"
                    >
                      NPR {stock.price?.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* CENTER - Cart */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: "#fff",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 1.5,
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <ShoppingBagIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Current Sale
              </Typography>
              <Chip
                label={`${selectedMedicines.length} items`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            {selectedMedicines.length > 0 && (
              <Button
                size="small"
                color="error"
                onClick={clearCart}
                startIcon={<DeleteIcon />}
              >
                Clear All
              </Button>
            )}
          </Box>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {selectedMedicines.length === 0 ? (
              <Box textAlign="center" py={10} color="text.secondary">
                <ShoppingBagIcon sx={{ fontSize: 64, opacity: 0.15, mb: 2 }} />
                <Typography variant="h6">Cart is empty</Typography>
                <Typography variant="body2">
                  Click medicines or select a patient
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Medicine
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="center">
                        Price
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="center">
                        Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">
                        Total
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="center">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedMedicines.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {item.medicineName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.type}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          NPR {item.price?.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            gap={0.5}
                          >
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.id, -1)}
                              sx={{ border: "1px solid #e0e0e0" }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography
                              fontWeight="bold"
                              sx={{ minWidth: 30, textAlign: "center" }}
                            >
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.id, 1)}
                              sx={{ border: "1px solid #e0e0e0" }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="primary">
                            NPR {item.total?.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeMedicine(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
          <Box
            sx={{ borderTop: "1px solid #e0e0e0", bgcolor: "#fafafa", p: 3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={7}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  <PersonIcon
                    fontSize="small"
                    sx={{ mr: 0.5, verticalAlign: "middle" }}
                  />
                  Patient Information
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      label="Name"
                      value={patient.name}
                      onChange={(e) =>
                        setPatient({ ...patient, name: e.target.value })
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      label="Phone"
                      value={patient.phone}
                      onChange={(e) =>
                        setPatient({ ...patient, phone: e.target.value })
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      size="small"
                      label="Age"
                      value={patient.age}
                      onChange={(e) =>
                        setPatient({ ...patient, age: e.target.value })
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      size="small"
                      label="Gender"
                      value={patient.gender}
                      onChange={(e) =>
                        setPatient({ ...patient, gender: e.target.value })
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      size="small"
                      label="Address"
                      value={patient.address}
                      onChange={(e) =>
                        setPatient({ ...patient, address: e.target.value })
                      }
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={5}>
                <Box
                  sx={{
                    bgcolor: "#fff",
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      NPR {subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    label="Discount"
                    type="number"
                    value={discount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (!isNaN(val) && Number(val) >= 0))
                        setDiscount(val);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">NPR</InputAdornment>
                      ),
                    }}
                    fullWidth
                    sx={{ mb: 1 }}
                  />
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      NPR {total.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    Payment Method
                  </Typography>
                  <Box display="flex" gap={0.5} mb={2}>
                    {["Cash", "PhonePe", "Card"].map((method) => (
                      <Chip
                        key={method}
                        label={method}
                        onClick={() => setPaymentMethod(method)}
                        color={paymentMethod === method ? "primary" : "default"}
                        variant={
                          paymentMethod === method ? "filled" : "outlined"
                        }
                        size="small"
                        sx={{ cursor: "pointer", flex: 1 }}
                      />
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={selectedMedicines.length === 0 || processing}
                    startIcon={
                      processing ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <PaymentIcon />
                      )
                    }
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: "bold" }}
                  >
                    {processing
                      ? "Processing..."
                      : `Complete Sale • NPR ${total.toFixed(2)}`}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* RIGHT - Patients */}
        <Box
          sx={{
            width: "280px",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #e0e0e0",
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              👨‍⚕️ Today's Patients
            </Typography>
            <TextField
              size="small"
              placeholder="Search patients..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              InputProps={{
                sx: { fontSize: "0.85rem" },
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Box>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {patientsLoading ? (
              <Box textAlign="center" py={4}>
                <CircularProgress size={20} />
              </Box>
            ) : filteredPatients.length === 0 ? (
              <Box textAlign="center" py={4} color="text.secondary">
                <HospitalIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                <Typography variant="body2">
                  No patients with prescriptions
                </Typography>
              </Box>
            ) : (
              filteredPatients.map((p) => {
                const prescription = getPatientPrescription(p);
                return (
                  <Box
                    key={p.id}
                    onClick={() => addPatientPrescription(p)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      "&:hover": { bgcolor: "#e3f2fd" },
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.age} yrs • {p.gender}
                        </Typography>
                        {p.phone && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {p.phone}
                          </Typography>
                        )}
                      </Box>
                      <Badge
                        badgeContent={prescription.length}
                        color="primary"
                        size="small"
                      >
                        <MedicationIcon fontSize="small" color="action" />
                      </Badge>
                    </Box>
                    <Typography variant="caption" color="primary">
                      {p.billNo}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => !processing && setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Confirm Sale</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedMedicines.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.medicineName}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="right">
                      NPR {item.total?.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              NPR {total.toFixed(2)}
            </Typography>
          </Box>
          {patient.name && (
            <Typography variant="body2" mt={1}>
              Patient: {patient.name} • {paymentMethod}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmDialog(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitSale}
            variant="contained"
            color="success"
            disabled={processing}
            startIcon={
              processing ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {processing ? "Processing..." : "Confirm Sale"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">🧾 Receipt</Typography>
            <IconButton onClick={() => setShowReceipt(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {receipt && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Bill No: {receipt.billNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {new Date(receipt.saleDate).toLocaleString()}
              </Typography>
              {receipt.patient?.name && (
                <Typography variant="body2" color="text.secondary">
                  Patient: {receipt.patient.name}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              {receipt.medicines.map((med, i) => (
                <Box
                  key={i}
                  display="flex"
                  justifyContent="space-between"
                  mb={0.5}
                >
                  <Typography variant="body2">
                    {med.medicineName} ×{med.quantity}
                  </Typography>
                  <Typography variant="body2">
                    NPR {med.total?.toFixed(2)}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1.5 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  NPR {receipt.totalAmount?.toFixed(2)}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mt={1}
              >
                Payment: {receipt.paymentMethod}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Sales;
