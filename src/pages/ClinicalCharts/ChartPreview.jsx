import React from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
} from "@mui/material";
import { Printer } from "lucide-react";
import BPChart from "./BPChart";

const ChartPreview = ({ selectedChartId, patientData }) => {
  const [days, setDays] = React.useState(15);

  const handlePrint = () => {
    // Simple and secure - let the browser handle everything
    window.print();
  };

  if (!selectedChartId) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f5f5",
          borderRadius: 2,
          border: "1px dashed #ccc",
          p: 4,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select a chart from the left menu to preview here.
        </Typography>
      </Box>
    );
  }

  let ChartComponent;
  switch (selectedChartId) {
    case "bp":
      ChartComponent = (
        <>
          <Box sx={{ mb: 2 }} className="no-print">
            <TextField
              select
              label="Select Days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              sx={{ width: "200px" }}
            >
              {[7, 15, 30, 60, 90].map((day) => (
                <MenuItem key={day} value={day}>
                  {day} Days
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <BPChart patientData={patientData} days={days} />
        </>
      );
      break;
    default:
      ChartComponent = <Box p={4}>Chart coming soon...</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Screen content */}
      <Box
        className="no-print"
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#1976D2", fontWeight: "bold" }}
          >
            Preview
          </Typography>
          <Button
            variant="contained"
            startIcon={<Printer size={18} />}
            onClick={handlePrint}
            sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#115293" } }}
          >
            Print Chart
          </Button>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            bgcolor: "#f8f9fa",
            p: 3,
            borderRadius: 2,
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Paper
            elevation={2}
            sx={{
              width: "100%",
              maxWidth: "210mm",
              minHeight: "297mm",
              bgcolor: "white",
              p: 3,
            }}
            className="printable-area"
          >
            {ChartComponent}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ChartPreview;
