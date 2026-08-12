import { useState, useEffect, useMemo, useCallback } from "react";

import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Tooltip,
  Divider,
  Checkbox,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Science as ScienceIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  limit,
  doc,
  writeBatch,
  serverTimestamp,
  getDocs,
  where,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { appCache } from "../utils/appCache";

const PAYMENT_STATUSES = ["paid", "partial", "unpaid"];
const PAYMENT_METHODS = ["Cash", "PhonePe", "Card"];

function LabBilling() {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [removedTests, setRemovedTests] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  // Real-time listener
  // Use shared cache instead of separate listener
  // Use shared cache for lab orders
  // Use shared appCache for lab orders
  // Real-time listener
  useEffect(() => {
    let unsubscribe;
    let interval;

    // Subscribe to real-time updates
    const q = query(
      collection(db, "labOrders"),
      where("orderStatus", "in", [
        "pending-billing",
        "pending-collection",
        "processing",
        "completed",
      ]),
      orderBy("createdAt", "desc"),
      limit(30),
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLabOrders(orders);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return labOrders;
    const term = searchTerm.toLowerCase();
    return labOrders.filter(
      (o) =>
        o.patientName?.toLowerCase().includes(term) ||
        o.patientPhone?.includes(term) ||
        o.billNo?.toLowerCase().includes(term),
    );
  }, [labOrders, searchTerm]);

  // Categorized orders
  const pendingBilling = useMemo(
    () => filteredOrders.filter((o) => o.orderStatus === "pending-billing"),
    [filteredOrders],
  );

  const billedOrders = useMemo(
    () => filteredOrders.filter((o) => o.orderStatus !== "pending-billing"),
    [filteredOrders],
  );

  // Earnings calculations
  const earningsData = useMemo(() => {
    const billed = filteredOrders.filter((o) => o.paymentStatus === "paid");
    const total = billed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayBilled = billed.filter((o) => {
      const date = o.billedAt?.toDate?.() || o.createdAt?.toDate?.();
      return date?.toDateString() === new Date().toDateString();
    });
    const todayTotal = todayBilled.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0,
    );
    return {
      total,
      todayTotal,
      totalCount: billed.length,
      todayCount: todayBilled.length,
    };
  }, [filteredOrders]);

  // Calculate total for pending tests only
  const calculateTotal = useCallback(
    (tests, discountVal, removedTestNames = []) => {
      const activeTests = (tests || []).filter(
        (t) =>
          !removedTestNames.includes(t.name) &&
          t.billingStatus !== "billed" &&
          t.billingStatus !== "paid",
      );
      const subtotal = activeTests.reduce((sum, t) => sum + (t.price || 0), 0);
      return Math.max(0, subtotal - (parseFloat(discountVal) || 0));
    },
    [],
  );

  // Open payment dialog
  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setRemovedTests([]);
    const pendingTests = (order.tests || []).filter(
      (t) => t.billingStatus !== "billed" && t.billingStatus !== "paid",
    );
    const total = pendingTests.reduce((sum, t) => sum + (t.price || 0), 0);
    setPaidAmount(total.toString());
    setDiscount("0");
    setPaymentStatus("paid");
    setShowPaymentDialog(true);
  };

  const handleToggleTest = (testName) => {
    setRemovedTests((prev) =>
      prev.includes(testName)
        ? prev.filter((t) => t !== testName)
        : [...prev, testName],
    );
  };

  const handlePaymentStatusChange = (status) => {
    setPaymentStatus(status);
    if (status === "paid") {
      const total = calculateTotal(
        selectedOrder?.tests || [],
        discount,
        removedTests,
      );
      setPaidAmount(total.toString());
    } else if (status === "unpaid") {
      setPaidAmount("0");
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedOrder) return;
    setShowPaymentDialog(false);
    setShowConfirmDialog(true);
  };

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedOrder) return;
    setProcessing(true);

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, "labOrders", selectedOrder.id);
      const total = calculateTotal(selectedOrder.tests, discount, removedTests);

      const updatedTests = (selectedOrder.tests || []).map((t) => {
        if (removedTests.includes(t.name)) {
          return {
            ...t,
            billingStatus: "cancelled",
            cancelledAt: new Date().toISOString(),
          };
        }
        if (t.billingStatus === "billed" || t.billingStatus === "paid")
          return t;
        return {
          ...t,
          billingStatus: "paid",
          paidAt: new Date().toISOString(),
        };
      });

      const allBilled = updatedTests.every(
        (t) =>
          t.billingStatus === "billed" ||
          t.billingStatus === "paid" ||
          t.billingStatus === "cancelled",
      );

      const updateData = {
        tests: updatedTests,
        orderStatus: allBilled ? "pending-collection" : "pending-billing",
        paymentStatus: "paid",
        totalAmount: (selectedOrder.totalAmount || 0) + total,
        discount: parseFloat(discount) || 0,
        paidAmount: parseFloat(paidAmount) || total,
        paymentMethod,
        removedTests: removedTests,
        billedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.update(orderRef, updateData);
      await batch.commit();
      await appCache.invalidateLabOrders();

      setSnackbar({
        open: true,
        message: `Payment of NPR ${total} processed! ${allBilled ? "All tests billed." : ""}`,
        severity: "success",
      });
      setShowConfirmDialog(false);
      setSelectedOrder(null);
      setRemovedTests([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error: " + error.message,
        severity: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Search by bill number
  const handleSearchByBill = async () => {
    if (!searchTerm.trim()) {
      setSnackbar({
        open: true,
        message: "Enter a bill number to search",
        severity: "warning",
      });
      return;
    }
    setSearchLoading(true);
    try {
      const patientsQuery = query(
        collection(db, "Patients"),
        where("billNo", "==", searchTerm.trim()),
        limit(1),
      );
      const patientSnapshot = await getDocs(patientsQuery);
      if (!patientSnapshot.empty) {
        const patientData = patientSnapshot.docs[0].data();
        const ordersQuery = query(
          collection(db, "labOrders"),
          where("patientId", "==", patientSnapshot.docs[0].id),
          orderBy("createdAt", "desc"),
          limit(5),
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        setSearchResult({
          patient: { id: patientSnapshot.docs[0].id, ...patientData },
          orders: ordersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
        });
        setShowSearchDialog(true);
      } else {
        setSnackbar({
          open: true,
          message: "No patient found",
          severity: "warning",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Search error: " + error.message,
        severity: "error",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const map = {
      "pending-billing": {
        label: "Pending Billing",
        color: "warning",
        icon: <PendingIcon />,
      },
      "pending-collection": {
        label: "Sent to Lab",
        color: "info",
        icon: <ScienceIcon />,
      },
      processing: {
        label: "Processing",
        color: "secondary",
        icon: <ScienceIcon />,
      },
      completed: {
        label: "Completed",
        color: "success",
        icon: <CheckCircleIcon />,
      },
    };
    const s = map[status] || { label: status, color: "default", icon: null };
    return <Chip icon={s.icon} label={s.label} color={s.color} size="small" />;
  };

  const activeTests = selectedOrder
    ? (selectedOrder.tests || []).filter((t) => !removedTests.includes(t.name))
    : [];

  // Calculate subtotal for pending tests only
  const pendingTests = selectedOrder
    ? (selectedOrder.tests || []).filter(
        (t) => t.billingStatus !== "billed" && t.billingStatus !== "paid",
      )
    : [];
  const subtotal = pendingTests
    .filter((t) => !removedTests.includes(t.name))
    .reduce((sum, t) => sum + (t.price || 0), 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);
  const pendingAmount =
    paymentStatus === "partial" ? total - (parseFloat(paidAmount) || 0) : 0;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary">
            🧪 Lab Billing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process payments for prescribed lab tests
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip
            icon={<ReceiptIcon />}
            label={`${pendingBilling.length} Pending`}
            color="warning"
          />
          <Chip
            icon={<AssessmentIcon />}
            label={`NPR ${earningsData.todayTotal.toLocaleString()} Today`}
            color="success"
            variant="outlined"
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<SearchIcon />}
            onClick={handleSearchByBill}
            disabled={searchLoading}
          >
            Search Bill
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab
          label={`Pending Billing (${pendingBilling.length})`}
          icon={<PendingIcon />}
          iconPosition="start"
        />
        <Tab
          label={`Billed Orders (${billedOrders.length})`}
          icon={<CheckCircleIcon />}
          iconPosition="start"
        />
        <Tab
          label={`Earnings`}
          icon={<AssessmentIcon />}
          iconPosition="start"
        />
      </Tabs>

      {/* Search Bar */}
      <Box display="flex" gap={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Filter by name, phone or bill number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
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
          sx={{ flex: 1, maxWidth: 500 }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSearchByBill}
          disabled={searchLoading || !searchTerm}
        >
          {searchLoading ? <CircularProgress size={16} /> : "Search"}
        </Button>
      </Box>

      {/* Pending Billing Tab */}
      {activeTab === 0 &&
        (pendingBilling.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", flex: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: "#10b981", mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              All caught up!
            </Typography>
            <Typography color="text.secondary">No pending lab bills</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: "#fef3c7" }}>
                  <TableCell>
                    <strong>#</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Patient</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Bill No</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Tests</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Pending Amount</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Doctor</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Action</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingBilling.map((order, index) => {
                  const pendingTestCount = (order.tests || []).filter(
                    (t) =>
                      t.billingStatus !== "billed" &&
                      t.billingStatus !== "paid",
                  ).length;
                  const pendingAmount = (order.tests || [])
                    .filter(
                      (t) =>
                        t.billingStatus !== "billed" &&
                        t.billingStatus !== "paid",
                    )
                    .reduce((s, t) => s + (t.price || 0), 0);
                  return (
                    <TableRow key={order.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.patientName}
                        </Typography>
                        <Typography variant="caption">
                          {order.patientPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {order.billNo || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {(order.tests || [])
                            .filter(
                              (t) =>
                                t.billingStatus !== "billed" &&
                                t.billingStatus !== "paid",
                            )
                            .slice(0, 3)
                            .map((t, i) => (
                              <Chip
                                key={i}
                                label={t.name}
                                size="small"
                                sx={{ fontSize: "0.65rem" }}
                              />
                            ))}
                          {pendingTestCount > 3 && (
                            <Chip
                              label={`+${pendingTestCount - 3}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="primary">
                          NPR {pendingAmount}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.doctorName || "N/A"}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleOpenPayment(order)}
                          sx={{
                            bgcolor: "#f59e0b",
                            "&:hover": { bgcolor: "#d97706" },
                            fontSize: "0.75rem",
                          }}
                        >
                          Bill
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ))}

      {/* Billed Orders Tab */}
      {activeTab === 1 &&
        (billedOrders.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", flex: 1 }}>
            <ReceiptIcon sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
            <Typography color="text.secondary">No billed orders yet</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>#</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Patient</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Tests</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Payment</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billedOrders.map((order, index) => (
                  <TableRow key={order.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.patientName}
                      </Typography>
                      <Typography variant="caption">
                        {order.patientPhone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {(order.tests || []).slice(0, 3).map((t, i) => (
                          <Chip
                            key={i}
                            label={`${t.name} ${t.billingStatus === "paid" ? "✓" : ""}`}
                            size="small"
                            color={
                              t.billingStatus === "paid" ? "success" : "default"
                            }
                            variant={
                              t.billingStatus === "paid" ? "filled" : "outlined"
                            }
                            sx={{ fontSize: "0.65rem" }}
                          />
                        ))}
                        {(order.tests || []).length > 3 && (
                          <Chip
                            label={`+${order.tests.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>NPR {order.totalAmount || 0}</TableCell>
                    <TableCell>{getStatusChip(order.orderStatus)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentStatus || "unpaid"}
                        size="small"
                        color={
                          order.paymentStatus === "paid" ? "success" : "warning"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {order.billedAt?.toDate?.()?.toLocaleDateString() ||
                          order.createdAt?.toDate?.()?.toLocaleDateString() ||
                          "N/A"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ))}

      {/* Earnings Tab */}
      {activeTab === 2 && (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f0fdf4" }}>
                <Typography variant="caption" color="text.secondary">
                  Today's Collection
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  NPR {earningsData.todayTotal.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#eff6ff" }}>
                <Typography variant="caption" color="text.secondary">
                  Today's Bills
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  {earningsData.todayCount}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fefce8" }}>
                <Typography variant="caption" color="text.secondary">
                  Total Collection
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  NPR {earningsData.total.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fdf2f8" }}>
                <Typography variant="caption" color="text.secondary">
                  Total Bills
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  {earningsData.totalCount}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" gutterBottom>
            Recent Transactions
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Patient</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Amount</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Method</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders
                  .filter((o) => o.paymentStatus === "paid")
                  .slice(0, 20)
                  .map((order, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {order.patientName}
                        </Typography>
                      </TableCell>
                      <TableCell>NPR {order.totalAmount || 0}</TableCell>
                      <TableCell>{order.paymentMethod || "N/A"}</TableCell>
                      <TableCell>
                        {order.billedAt?.toDate?.()?.toLocaleDateString() ||
                          order.createdAt?.toDate?.()?.toLocaleDateString() ||
                          "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => !processing && setShowPaymentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">💳 Lab Test Billing</Typography>
            <IconButton onClick={() => setShowPaymentDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={8}>
                <Paper sx={{ p: 2, mb: 2, bgcolor: "#f8fafc" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Patient Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedOrder.patientName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {selectedOrder.patientPhone}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Age:</strong> {selectedOrder.patientAge} yrs
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Gender:</strong> {selectedOrder.patientGender}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Bill No:</strong>{" "}
                        {selectedOrder.billNo || "N/A"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="subtitle2" gutterBottom>
                  Tests ({activeTests.length} selected)
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    Uncheck to remove, green = already paid
                  </Typography>
                </Typography>

                {/* Deduplicate tests before displaying */}
                {(() => {
                  // Remove duplicates
                  const uniqueTests = [];
                  const seenNames = new Set();
                  (selectedOrder.tests || []).forEach((test) => {
                    if (!seenNames.has(test.name)) {
                      seenNames.add(test.name);
                      uniqueTests.push(test);
                    }
                  });

                  return uniqueTests.map((test, i) => {
                    const isRemoved = removedTests.includes(test.name);
                    const isAlreadyBilled =
                      test.billingStatus === "billed" ||
                      test.billingStatus === "paid";
                    return (
                      <Paper
                        key={i}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          opacity: isRemoved ? 0.4 : 1,
                          bgcolor: isAlreadyBilled
                            ? "#f0fdf4"
                            : isRemoved
                              ? "#f5f5f5"
                              : "#fff",
                          border: isAlreadyBilled
                            ? "2px solid #10b981"
                            : "1px solid #e0e0e0",
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          {!isAlreadyBilled && (
                            <Checkbox
                              checked={!isRemoved}
                              onChange={() => handleToggleTest(test.name)}
                              size="small"
                            />
                          )}
                          {isAlreadyBilled && (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: isRemoved
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              {test.name}
                            </Typography>
                            {isAlreadyBilled && (
                              <Typography
                                variant="caption"
                                color="success.main"
                              >
                                ✅ Already paid
                              </Typography>
                            )}
                            {!isAlreadyBilled && (
                              <Typography
                                variant="caption"
                                color="warning.main"
                              >
                                ⚠️ Pending payment
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={
                            isAlreadyBilled
                              ? "success.main"
                              : isRemoved
                                ? "text.secondary"
                                : "primary"
                          }
                        >
                          {isAlreadyBilled ? "PAID" : `NPR ${test.price || 0}`}
                        </Typography>
                      </Paper>
                    );
                  });
                })()}
              </Grid>

              <Grid item xs={4}>
                <Paper
                  sx={{ p: 2, bgcolor: "#f8fafc", position: "sticky", top: 0 }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Payment Summary
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Active Tests</Typography>
                    <Typography variant="body2">
                      {
                        activeTests.filter(
                          (t) =>
                            t.billingStatus !== "billed" &&
                            t.billingStatus !== "paid",
                        ).length
                      }
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Already Paid</Typography>
                    <Typography variant="body2" color="success.main">
                      {
                        activeTests.filter(
                          (t) =>
                            t.billingStatus === "billed" ||
                            t.billingStatus === "paid",
                        ).length
                      }
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Removed</Typography>
                    <Typography variant="body2" color="error">
                      {removedTests.length}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">
                      Subtotal (new tests)
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      NPR {subtotal}
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    label="Discount (NPR)"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    fullWidth
                    sx={{ mt: 1 }}
                  />
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    mt={1}
                    mb={0.5}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                    >
                      NPR {total}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    Payment Status
                  </Typography>
                  <Box display="flex" gap={0.5} mb={1}>
                    {PAYMENT_STATUSES.map((status) => (
                      <Chip
                        key={status}
                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                        onClick={() => handlePaymentStatusChange(status)}
                        color={paymentStatus === status ? "primary" : "default"}
                        variant={
                          paymentStatus === status ? "filled" : "outlined"
                        }
                        size="small"
                        sx={{ cursor: "pointer", textTransform: "capitalize" }}
                      />
                    ))}
                  </Box>
                  {paymentStatus !== "paid" && (
                    <TextField
                      size="small"
                      label="Paid Amount"
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      fullWidth
                      sx={{ mb: 1 }}
                    />
                  )}
                  {paymentStatus === "partial" && (
                    <Typography variant="caption" color="error">
                      Pending: NPR {pendingAmount}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Payment Method
                  </Typography>
                  <Box display="flex" gap={0.5} mt={0.5}>
                    {PAYMENT_METHODS.map((method) => (
                      <Chip
                        key={method}
                        label={method}
                        onClick={() => setPaymentMethod(method)}
                        color={paymentMethod === method ? "primary" : "default"}
                        variant={
                          paymentMethod === method ? "filled" : "outlined"
                        }
                        size="small"
                        sx={{ cursor: "pointer" }}
                      />
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleConfirmPayment}
                    disabled={
                      activeTests.filter(
                        (t) =>
                          t.billingStatus !== "billed" &&
                          t.billingStatus !== "paid",
                      ).length === 0 || processing
                    }
                    startIcon={
                      processing ? (
                        <CircularProgress size={18} />
                      ) : (
                        <PaymentIcon />
                      )
                    }
                    sx={{ mt: 2, py: 1.5, borderRadius: 2, fontWeight: "bold" }}
                  >
                    Process Payment
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Confirm Payment</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, bgcolor: "#f8fafc" }}>
            <Typography variant="body2" gutterBottom>
              <strong>Patient:</strong> {selectedOrder?.patientName}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>New Tests to Bill:</strong>{" "}
              {
                activeTests.filter(
                  (t) =>
                    t.billingStatus !== "billed" && t.billingStatus !== "paid",
                ).length
              }
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Subtotal:</strong> NPR {subtotal}
            </Typography>
            {discountAmount > 0 && (
              <Typography variant="body2" gutterBottom color="error">
                <strong>Discount:</strong> -NPR {discountAmount}
              </Typography>
            )}
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" color="primary">
              <strong>Total:</strong> NPR {total}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Payment:</strong> {paymentStatus.toUpperCase()} •{" "}
              {paymentMethod}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmDialog(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            variant="contained"
            color="success"
            disabled={processing}
            startIcon={
              processing ? <CircularProgress size={16} /> : <CheckCircleIcon />
            }
          >
            {processing ? "Processing..." : "Confirm & Send to Lab"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Search Results Dialog */}
      <Dialog
        open={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">🔍 Search Results</Typography>
            <IconButton onClick={() => setShowSearchDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {searchResult && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, bgcolor: "#f8fafc" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Patient Information
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {searchResult.patient.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Bill No:</strong> {searchResult.patient.billNo}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {searchResult.patient.phone}
                </Typography>
              </Paper>
              <Typography variant="subtitle2" gutterBottom>
                Lab Orders ({searchResult.orders.length})
              </Typography>
              {searchResult.orders.length === 0 ? (
                <Typography color="text.secondary">
                  No lab orders found.
                </Typography>
              ) : (
                searchResult.orders.map((order, i) => (
                  <Paper
                    key={i}
                    sx={{ p: 1.5, mb: 1, border: "1px solid #e0e0e0" }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Order #{i + 1}
                        </Typography>
                        <Typography variant="caption">
                          {order.createdAt?.toDate?.()?.toLocaleDateString() ||
                            "N/A"}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1} alignItems="center">
                        {getStatusChip(order.orderStatus)}
                        <Chip
                          label={order.paymentStatus || "unpaid"}
                          size="small"
                          color={
                            order.paymentStatus === "paid"
                              ? "success"
                              : "warning"
                          }
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                      {(order.tests || []).map((t, j) => (
                        <Chip
                          key={j}
                          label={`${t.name} ${t.result ? "✓" : ""}`}
                          size="small"
                          color={t.result ? "success" : "default"}
                          variant={t.result ? "filled" : "outlined"}
                        />
                      ))}
                    </Box>
                    {order.totalAmount && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Total:</strong> NPR {order.totalAmount}
                      </Typography>
                    )}
                  </Paper>
                ))
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSearchDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default LabBilling;
