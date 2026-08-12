import { useState, useEffect, useMemo } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  writeBatch,
  serverTimestamp,
  where,
  limit,
} from "firebase/firestore";

function LabWorkstation() {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Real-time listener for lab workstation orders (only billed/paid ones)
  useEffect(() => {
    const q = query(
      collection(db, "labOrders"),
      where("orderStatus", "in", [
        "pending-collection",
        "processing",
        "completed",
      ]),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLabOrders(orders);
        setLoading(false);
      },
      (error) => {
        console.error("LabWorkstation error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Helper to get tests that are NOT cancelled
  const getActiveTests = (order) =>
    (order.tests || []).filter((t) => t.billingStatus !== "cancelled");

  const pendingOrders = useMemo(
    () =>
      labOrders.filter(
        (o) =>
          o.orderStatus === "pending-collection" &&
          getActiveTests(o).length > 0,
      ),
    [labOrders],
  );
  const processingOrders = useMemo(
    () =>
      labOrders.filter(
        (o) => o.orderStatus === "processing" && getActiveTests(o).length > 0,
      ),
    [labOrders],
  );
  const completedOrders = useMemo(
    () =>
      labOrders.filter(
        (o) => o.orderStatus === "completed" && getActiveTests(o).length > 0,
      ),
    [labOrders],
  );

  const getCurrentOrders = () => {
    switch (activeTab) {
      case 0:
        return pendingOrders;
      case 1:
        return processingOrders;
      case 2:
        return completedOrders;
      default:
        return [];
    }
  };

  const handleStartProcessing = async (order) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "labOrders", order.id), {
        orderStatus: "processing",
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setSnackbar({
        open: true,
        message: "Test processing started!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error: " + error.message,
        severity: "error",
      });
    }
  };

  const handleOpenResults = (order) => {
    setSelectedOrder(order);
    const results = {};
    // Only show results for active tests
    getActiveTests(order).forEach((test) => {
      results[test.name] = test.result || "";
    });
    setTestResults(results);
    setShowResultDialog(true);
  };

  const handleSaveResults = async () => {
    if (!selectedOrder) return;
    setProcessing(true);

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, "labOrders", selectedOrder.id);

      const updatedTests = (selectedOrder.tests || []).map((test) => {
        if (test.billingStatus === "cancelled") return test; // keep cancelled unchanged
        const newResult = testResults[test.name] || "";
        return {
          ...test,
          result: newResult,
          status: newResult.trim() ? "completed" : "pending",
        };
      });

      const allCompleted = updatedTests.every(
        (t) => t.billingStatus === "cancelled" || t.result?.trim(),
      );

      batch.update(orderRef, {
        tests: updatedTests,
        orderStatus: allCompleted ? "completed" : "processing",
        completedAt: allCompleted ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      setSnackbar({
        open: true,
        message: allCompleted
          ? "All results saved! Order completed."
          : "Results saved!",
        severity: "success",
      });
      setShowResultDialog(false);
      setSelectedOrder(null);
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

  const currentOrders = getCurrentOrders();

  return (
    <Box
      sx={{
        p: 2,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          🔬 Lab Workstation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Process lab tests and enter results
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab
          label={`Pending (${pendingOrders.length})`}
          icon={<PendingIcon />}
          iconPosition="start"
        />
        <Tab
          label={`Processing (${processingOrders.length})`}
          icon={<PlayArrowIcon />}
          iconPosition="start"
        />
        <Tab
          label={`Completed (${completedOrders.length})`}
          icon={<CheckCircleIcon />}
          iconPosition="start"
        />
      </Tabs>

      {loading ? (
        <Box textAlign="center" py={4}>
          <CircularProgress />
        </Box>
      ) : currentOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <ScienceIcon sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
          <Typography color="text.secondary">
            No orders in this category
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ flex: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Patient</strong>
                </TableCell>
                <TableCell>
                  <strong>Tests</strong>
                </TableCell>
                <TableCell>
                  <strong>Date</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentOrders.map((order) => {
                const activeTests = getActiveTests(order);
                const cancelledCount =
                  (order.tests || []).length - activeTests.length;

                return (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.patientName}
                      </Typography>
                      <Typography variant="caption">
                        {order.patientAge}/{order.patientGender}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {activeTests.map((t, i) => (
                        <Chip
                          key={i}
                          label={`${t.name} ${t.result ? "✓" : ""}`}
                          size="small"
                          color={t.result ? "success" : "default"}
                          variant={t.result ? "filled" : "outlined"}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {cancelledCount > 0 && (
                        <Chip
                          label={`+${cancelledCount} cancelled`}
                          size="small"
                          variant="outlined"
                          color="default"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {order.createdAt?.toDate?.()?.toLocaleDateString() ||
                        "N/A"}
                    </TableCell>
                    <TableCell align="center">
                      {order.orderStatus === "pending-collection" && (
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleStartProcessing(order)}
                        >
                          Start
                        </Button>
                      )}
                      {(order.orderStatus === "processing" ||
                        order.orderStatus === "pending-collection") && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<SaveIcon />}
                          onClick={() => handleOpenResults(order)}
                          sx={{ ml: 1 }}
                        >
                          Results
                        </Button>
                      )}
                      {order.orderStatus === "completed" && (
                        <Chip
                          label="Done"
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Results Dialog */}
      <Dialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>🔬 Enter Test Results</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, bgcolor: "#f8fafc" }}>
                <Typography>
                  <strong>Patient:</strong> {selectedOrder.patientName}
                </Typography>
                <Typography>
                  <strong>ID:</strong> {selectedOrder.patientId}
                </Typography>
              </Paper>
              {/* Only show active tests */}
              {getActiveTests(selectedOrder).map((test, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {test.name}
                    {test.resultFormat && (
                      <Chip
                        label={test.resultFormat}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={testResults[test.name] || ""}
                    onChange={(e) =>
                      setTestResults({
                        ...testResults,
                        [test.name]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${test.name} result...`}
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveResults}
            variant="contained"
            color="primary"
            disabled={processing}
            startIcon={
              processing ? <CircularProgress size={16} /> : <SaveIcon />
            }
          >
            {processing ? "Saving..." : "Save Results"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default LabWorkstation;
