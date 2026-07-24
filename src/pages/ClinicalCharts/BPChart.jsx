import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import { HeartPulse, Calendar, Clock, Sun, Moon, Printer } from "lucide-react";
import { usePrint } from "./usePrint";

const DURATION_OPTIONS = [
  { value: 5, label: "5 days" },
  { value: 7, label: "7 days" },
  { value: 10, label: "10 days" },
  { value: 14, label: "2 weeks" },
];

const inputStyle = {
  width: "100%",
  padding: "4px",
  border: "none",
  borderBottom: "1px solid #ccc",
  background: "transparent",
  fontSize: "0.9rem",
  textAlign: "center",
  fontFamily: "inherit",
  outline: "none",
};

export function BPChart() {
  const [days, setDays] = useState(5);
  const [useConsecutiveDates, setUseConsecutiveDates] = useState(true);
  const [trackMorningEvening, setTrackMorningEvening] = useState(true);
  const { printRef, handlePrint } = usePrint("Blood Pressure Tracking Chart");

  const dateItems = useMemo(() => {
    if (!useConsecutiveDates) return Array(days).fill("");
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${month}-${day}`;
    });
  }, [days, useConsecutiveDates]);

  return (
    <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent ref={printRef} id="print-root" sx={{ p: { xs: 2, sm: 4 } }}>
        {/* Print Header */}
        <Box className="print-header" sx={{ textAlign: "center", mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              mb: 0.5,
            }}
          >
            <HeartPulse size={24} color="#d32f2f" />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              BP Tracker
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Bring this chart to your next appointment
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} className="no-print" />
        {/* Controls */}
        <Box
          className="no-print"
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "grey.50",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.200",
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Duration</InputLabel>
            <Select
              value={days}
              label="Duration"
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={useConsecutiveDates}
                onChange={(e) => setUseConsecutiveDates(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Calendar size={16} />{" "}
                <Typography variant="body2">Auto-fill dates</Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={trackMorningEvening}
                onChange={(e) => setTrackMorningEvening(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Clock size={16} />{" "}
                <Typography variant="body2">AM / PM Columns</Typography>
              </Box>
            }
          />
        </Box>
        {/* Table */}
        <Box sx={{ overflowX: "auto", mb: 1 }}>
          <Table
            size="small"
            sx={{
              minWidth: 600,
              borderCollapse: "collapse",
              "& .MuiTableCell-root": {
                border: "1px solid #e0e0e0",
                px: 1,
                py: 0.75,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  rowSpan={trackMorningEvening ? 2 : 1}
                  sx={{ width: "20%", fontWeight: "bold", bgcolor: "#f8f9fa" }}
                >
                  Date
                </TableCell>
                {trackMorningEvening ? (
                  <>
                    <TableCell
                      colSpan={2}
                      align="center"
                      sx={{
                        bgcolor: "#fff3e0",
                        color: "#e65100",
                        fontWeight: "bold",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        gap={1}
                      >
                        <Sun size={16} /> Morning
                      </Box>
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      align="center"
                      sx={{
                        bgcolor: "#e3f2fd",
                        color: "#01579b",
                        fontWeight: "bold",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        gap={1}
                      >
                        <Moon size={16} /> Evening
                      </Box>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={{ fontWeight: "bold", width: "30%" }}>
                      Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "50%" }}>
                      Blood Pressure (mmHg)
                    </TableCell>
                  </>
                )}
              </TableRow>
              {trackMorningEvening && (
                <TableRow>
                  <TableCell align="center" sx={{ bgcolor: "#fff8f1" }}>
                    Time
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: "#fff8f1" }}>
                    BP (mmHg)
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: "#f1f8ff" }}>
                    Time
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: "#f1f8ff" }}>
                    BP (mmHg)
                  </TableCell>
                </TableRow>
              )}
            </TableHead>
            <TableBody>
              {dateItems.map((date, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {useConsecutiveDates ? (
                      <Typography variant="body2" fontWeight={500}>
                        {date}
                      </Typography>
                    ) : (
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Date"
                      />
                    )}
                  </TableCell>
                  {trackMorningEvening ? (
                    <>
                      <TableCell>
                        <input
                          type="text"
                          className="print-input"
                          style={{
                            ...inputStyle,
                            borderBottom: "1px solid #000",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          className="print-input"
                          style={{
                            ...inputStyle,
                            borderBottom: "1px solid #000",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          className="print-input"
                          style={{
                            ...inputStyle,
                            borderBottom: "1px solid #000",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          className="print-input"
                          style={{
                            ...inputStyle,
                            borderBottom: "1px solid #000",
                          }}
                        />
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <input
                          type="text"
                          className="print-input"
                          style={{
                            ...inputStyle,
                            borderBottom: "1px solid #000",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          className="print-input"
                          style={{
                            ...inputStyle,
                            borderBottom: "1px solid #000",
                          }}
                        />
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {/* Print Footer */}
        <Box
          className="print-footer"
          sx={{
            mt: 2,
            pt: 1,
            borderTop: "1px dashed #ccc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            <strong>Goal:</strong> &lt; 120/80 mmHg
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Record BP at the same times daily.
          </Typography>
        </Box>
        <Box className="no-print" sx={{ textAlign: "center", mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<Printer size={18} />}
            onClick={handlePrint}
            sx={{ borderRadius: 2, px: 4 }}
          >
            Print Chart
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
