import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import dayjs from "dayjs";
import { getDocs, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

const Insights = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("today");
  const [specificDate, setSpecificDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  // Fetch receipts from Firestore
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "labReceipts"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReceipts(data);
      } catch (error) {
        console.error("Error fetching receipts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  // Delete a receipt from Firestore and update state
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "labReceipts", id));
      setReceipts(receipts.filter((receipt) => receipt.id !== id));
    } catch (error) {
      console.error("Error deleting receipt:", error);
    }
  };

  // Filter receipts based on the selected time range
  const filterReceipts = () => {
    if (!specificDate && timeRange === "specific") return [];

    switch (timeRange) {
      case "today":
        return receipts.filter(
          (receipt) =>
            receipt.createdAt &&
            dayjs(receipt.createdAt.toDate()).isSame(dayjs(), "day")
        );
      case "week":
        return receipts.filter(
          (receipt) =>
            receipt.createdAt &&
            dayjs(receipt.createdAt.toDate()).isSame(dayjs(), "week")
        );
      case "month":
        return receipts.filter(
          (receipt) =>
            receipt.createdAt &&
            dayjs(receipt.createdAt.toDate()).isSame(dayjs(), "month")
        );
      case "year":
        return receipts.filter(
          (receipt) =>
            receipt.createdAt &&
            dayjs(receipt.createdAt.toDate()).isSame(dayjs(), "year")
        );
      case "specific":
        return receipts.filter(
          (receipt) =>
            receipt.createdAt &&
            dayjs(receipt.createdAt.toDate()).isSame(dayjs(specificDate), "day")
        );
      default:
        return receipts;
    }
  };

  // Calculate total earnings for the filtered receipts
  const totalEarnings = filterReceipts().reduce(
    (sum, receipt) => sum + (receipt.totalAmount || 0),
    0
  );

  // Get the display label for the time range
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "today":
        return "Today's Earnings";
      case "week":
        return "This Week's Earnings";
      case "month":
        return "This Month's Earnings";
      case "year":
        return "This Year's Earnings";
      case "specific":
        return `Earnings for ${dayjs(specificDate).format("DD/MM/YYYY")}`;
      default:
        return "Earnings";
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
        Earnings Insights
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Time Range Selector */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
            <MenuItem value="specific">Specific Date</MenuItem>
          </Select>
        </FormControl>

        {timeRange === "specific" && (
          <TextField
            label="Select Date"
            type="date"
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: 200 }}
          />
        )}
      </Box>

      {/* Total Earnings */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        {getTimeRangeLabel()}: NPR {totalEarnings.toFixed(2)}
      </Typography>

      {/* Receipts Table */}
      <Table sx={{ minWidth: 650, border: "1px solid #e0e0e0" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Bill No.</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Patient Name</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Phone Number</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Amount (NPR)</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filterReceipts().length > 0 ? (
            filterReceipts().map((receipt) => (
              <TableRow key={receipt.id} hover>
                <TableCell>{receipt.billNumber || "N/A"}</TableCell>
                <TableCell>{receipt.patient?.name || "N/A"}</TableCell>
                <TableCell>{receipt.patient?.phone || "N/A"}</TableCell>
                <TableCell>
                  {receipt.totalAmount?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {receipt.createdAt
                    ? dayjs(receipt.createdAt.toDate()).format("DD/MM/YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {receipt.createdAt
                    ? dayjs(receipt.createdAt.toDate()).format("hh:mm A")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDelete(receipt.id)}
                    color="error"
                    title="Delete Receipt"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                No receipts found for the selected time range
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

export default Insights;
