import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Alert,
} from "@mui/material";
import {
  FaFlask,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaUserAlt,
  FaMoneyBillWave,
  FaCheckCircle,
} from "react-icons/fa";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import dayjs from "dayjs";

const LabTestBilling = ({ selectedLabTests, setSelectedLabTests, patient }) => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Real-time listener for pending lab orders
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "labOrders"),
      where("orderStatus", "==", "pending-billing"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort: patient's orders first, then by date
        orders.sort((a, b) => {
          if (patient?.phone) {
            const aIsPatient = a.patientPhone === patient.phone;
            const bIsPatient = b.patientPhone === patient.phone;
            if (aIsPatient && !bIsPatient) return -1;
            if (!aIsPatient && bIsPatient) return 1;
          }
          return (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0);
        });

        setPendingOrders(orders);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to lab orders:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [patient?.phone]);

  // Filter orders based on search
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return pendingOrders;

    const term = searchTerm.toLowerCase();
    return pendingOrders.filter(
      (o) =>
        o.patientName?.toLowerCase().includes(term) ||
        o.patientPhone?.includes(term) ||
        o.doctorName?.toLowerCase().includes(term),
    );
  }, [pendingOrders, searchTerm]);

  const handleAddOrder = (order) => {
    // Clear previous selections and add this order's tests
    const labTests = order.tests
      .filter((t) => t.status !== "cancelled")
      .map((test) => ({
        ...test,
        orderId: order.id,
        patientName: order.patientName,
        patientPhone: order.patientPhone,
        doctorName: order.doctorName,
        type: "lab-test",
        addedAt: new Date().toISOString(),
      }));

    setSelectedLabTests(labTests);
  };

  const handleRemoveTest = (orderId, testName) => {
    const updated = selectedLabTests.filter(
      (lt) => !(lt.orderId === orderId && lt.name === testName),
    );
    setSelectedLabTests(updated);
  };

  const handleClearAll = () => {
    setSelectedLabTests([]);
  };

  // Calculate total for display
  const totalLabAmount = selectedLabTests.reduce(
    (sum, test) => sum + (test.price || 0),
    0,
  );

  // Check if an order is currently selected
  const isOrderSelected = (orderId) => {
    return selectedLabTests.some((lt) => lt.orderId === orderId);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={600}>
          Lab Test Billing:
        </Typography>
        <Typography variant="caption">
          Select one patient's lab tests to bill. After payment, lab technician
          will process the tests.
        </Typography>
      </Alert>

      {/* Selected Lab Tests */}
      {selectedLabTests.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "#f0fdf4",
            border: "2px solid #22c55e",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "#166534",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaCheckCircle style={{ marginRight: 6 }} />
              Selected for Billing ({selectedLabTests.length} tests)
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label={`Total: ₹${totalLabAmount.toFixed(2)}`}
                color="success"
                size="small"
                icon={<FaMoneyBillWave />}
              />
              <Button
                size="small"
                color="error"
                onClick={handleClearAll}
                sx={{ fontSize: "0.7rem" }}
              >
                Clear All
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selectedLabTests.map((test, idx) => (
              <Chip
                key={`${test.orderId}-${test.name}-${idx}`}
                label={`${test.name} ₹${test.price || 0}`}
                size="small"
                onDelete={() => handleRemoveTest(test.orderId, test.name)}
                color="success"
                variant="outlined"
              />
            ))}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 1 }}
          >
            Patient: {selectedLabTests[0]?.patientName} | Doctor:{" "}
            {selectedLabTests[0]?.doctorName}
          </Typography>
        </Paper>
      )}

      {/* Pending Lab Orders */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, display: "flex", alignItems: "center" }}
        >
          <FaFlask size={14} style={{ marginRight: 6 }} />
          Pending Lab Orders (Awaiting Payment)
        </Typography>
        <Chip
          label={`${pendingOrders.length} orders`}
          size="small"
          color="warning"
          variant="outlined"
        />
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder="Search patient name, phone or doctor..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 1.5 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <FaSearch size={12} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <CircularProgress size={24} />
          <Typography
            variant="caption"
            display="block"
            sx={{ mt: 1 }}
            color="text.secondary"
          >
            Loading orders...
          </Typography>
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f8fafc" }}>
          <FaFlask size={32} color="#94a3b8" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm
              ? "No matching orders found"
              : "No pending lab orders to bill"}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Lab orders from doctor prescriptions will appear here
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ maxHeight: 400, overflowY: "auto", pr: 0.5 }}>
          {filteredOrders.map((order) => {
            const isSelected = isOrderSelected(order.id);
            const isExpanded = expandedOrder === order.id;
            const isPatientOrder =
              patient?.phone && order.patientPhone === patient.phone;

            return (
              <Paper
                key={order.id}
                sx={{
                  p: 1.5,
                  mb: 1,
                  border: isPatientOrder
                    ? "2px solid #3b82f6"
                    : isSelected
                      ? "2px solid #22c55e"
                      : "1px solid #e2e8f0",
                  bgcolor: isSelected
                    ? "#f0fdf4"
                    : isPatientOrder
                      ? "#eff6ff"
                      : "white",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "#3b82f6",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {order.patientName}
                      </Typography>
                      {isPatientOrder && (
                        <Chip
                          label="Current Patient"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <FaUserAlt size={10} style={{ marginRight: 4 }} />
                        {order.patientPhone || "No phone"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Dr. {order.doctorName}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : order.id)
                      }
                    >
                      {isExpanded ? (
                        <FaChevronUp size={12} />
                      ) : (
                        <FaChevronDown size={12} />
                      )}
                    </IconButton>
                    <Button
                      size="small"
                      variant={isSelected ? "outlined" : "contained"}
                      color={isSelected ? "error" : "success"}
                      onClick={() =>
                        isSelected ? handleClearAll() : handleAddOrder(order)
                      }
                      sx={{ minWidth: 70, fontSize: "0.7rem" }}
                      disabled={!isSelected && selectedLabTests.length > 0}
                    >
                      {isSelected ? "Remove" : "Select"}
                    </Button>
                  </Box>
                </Box>

                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid #e2e8f0" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>
                            Test
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ py: 0.5, fontSize: "0.75rem" }}
                          >
                            Price
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.tests
                          .filter((t) => t.status !== "cancelled")
                          .map((test) => (
                            <TableRow key={test.name}>
                              <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>
                                {test.name}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ py: 0.5, fontSize: "0.75rem" }}
                              >
                                ₹{test.price?.toFixed(2) || "0.00"}
                              </TableCell>
                            </TableRow>
                          ))}
                        <TableRow>
                          <TableCell
                            sx={{
                              py: 0.5,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            Total
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              py: 0.5,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "success.main",
                            }}
                          >
                            ₹
                            {order.tests
                              .filter((t) => t.status !== "cancelled")
                              .reduce((sum, t) => sum + (t.price || 0), 0)
                              .toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      Ordered:{" "}
                      {dayjs(order.createdAt?.toDate()).format(
                        "DD/MM/YYYY hh:mm A",
                      )}
                    </Typography>
                  </Box>
                </Collapse>

                {/* Quick view when collapsed */}
                {!isExpanded && (
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}
                  >
                    {order.tests
                      .filter((t) => t.status !== "cancelled")
                      .slice(0, 3)
                      .map((test) => (
                        <Chip
                          key={test.name}
                          label={test.name}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.65rem" }}
                        />
                      ))}
                    {order.tests.filter((t) => t.status !== "cancelled")
                      .length > 3 && (
                      <Chip
                        label={`+${order.tests.filter((t) => t.status !== "cancelled").length - 3} more`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem" }}
                      />
                    )}
                    <Chip
                      label={`Total: ₹${order.tests
                        .filter((t) => t.status !== "cancelled")
                        .reduce((sum, t) => sum + (t.price || 0), 0)
                        .toFixed(2)}`}
                      size="small"
                      color="warning"
                      sx={{ fontSize: "0.65rem", ml: "auto" }}
                    />
                  </Box>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default LabTestBilling;
