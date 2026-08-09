import React, { useState, useEffect } from "react";
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Paper,
  IconButton,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableRow,
  LinearProgress,
} from "@mui/material";
import {
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { appCache } from "../utils/appCache";

const ReadMonitor = () => {
  const [readCount, setReadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [details, setDetails] = useState({
    stock: 0,
    patients: 0,
    queue: 0,
    labOrders: 0,
    other: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const count = appCache.getReadCount?.() || 0;
      setReadCount(count);
      setDetails({
        stock: appCache.stockData?.length || 0,
        patients: appCache.patientsData?.length || 0,
        queue: 0,
        labOrders: appCache.labOrdersData?.length || 0,
        other: Math.max(
          0,
          count -
            (appCache.stockData?.length || 0) -
            (appCache.patientsData?.length || 0) -
            (appCache.labOrdersData?.length || 0),
        ),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const total =
    details.stock +
    details.patients +
    details.queue +
    details.labOrders +
    details.other;

  // Color based on read count
  const getColor = () => {
    if (readCount < 1000) return "success";
    if (readCount < 5000) return "info";
    if (readCount < 20000) return "warning";
    return "error";
  };

  return (
    <>
      <Tooltip title={`Firestore Reads: ${readCount.toLocaleString()}`} arrow>
        <Chip
          icon={<SpeedIcon />}
          label={readCount.toLocaleString()}
          size="small"
          color={getColor()}
          variant="outlined"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.7rem",
            height: 24,
            fontFamily: "monospace",
          }}
        />
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Paper sx={{ p: 2, minWidth: 280, maxWidth: 350 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              📊 Firestore Read Monitor
            </Typography>
            <IconButton size="small" onClick={() => setAnchorEl(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">Total Reads</Typography>
              <Typography variant="body2" fontWeight="bold" color={getColor()}>
                {readCount.toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((readCount / 50000) * 100, 100)}
              color={getColor()}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary">
              Free tier limit: 50,000/day
            </Typography>
          </Box>

          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ py: 0.5 }}>
                  <Typography variant="caption">📦 Stock</Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Typography variant="caption" fontFamily="monospace">
                    {details.stock.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {total > 0
                      ? `${((details.stock / total) * 100).toFixed(0)}%`
                      : "0%"}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ py: 0.5 }}>
                  <Typography variant="caption">👨‍⚕️ Patients</Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Typography variant="caption" fontFamily="monospace">
                    {details.patients.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {total > 0
                      ? `${((details.patients / total) * 100).toFixed(0)}%`
                      : "0%"}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ py: 0.5 }}>
                  <Typography variant="caption">🧪 Lab Orders</Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Typography variant="caption" fontFamily="monospace">
                    {details.labOrders.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {total > 0
                      ? `${((details.labOrders / total) * 100).toFixed(0)}%`
                      : "0%"}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ py: 0.5 }}>
                  <Typography variant="caption">📋 Other</Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Typography variant="caption" fontFamily="monospace">
                    {details.other.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {total > 0
                      ? `${((details.other / total) * 100).toFixed(0)}%`
                      : "0%"}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Box sx={{ mt: 1, p: 1, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              💡 <strong>Tips to reduce reads:</strong>
              <br />• All components share 4 listeners
              <br />• Data cached for 5-10 minutes
              <br />• Lab orders fetched only on dialog open
            </Typography>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default ReadMonitor;
