import React, { useState, useMemo, useEffect } from "react";
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
  Button,
} from "@mui/material";
import { BrainCircuit, Printer } from "lucide-react";
import { usePrint } from "./usePrint";

const LAWTON_IADL_ITEMS = [
  {
    id: "A",
    activity: "Ability to Use Telephone",
    options: [
      {
        score: 1,
        text: "Operates telephone on own initiative; looks up and dials numbers",
      },
      { score: 1, text: "Dials a few well-known numbers" },
      { score: 1, text: "Answers telephone, but does not dial" },
      { score: 0, text: "Does not use telephone at all" },
    ],
  },
  {
    id: "B",
    activity: "Shopping",
    options: [
      { score: 1, text: "Takes care of all shopping needs independently" },
      { score: 0, text: "Shops independently for small purchases" },
      { score: 0, text: "Needs to be accompanied on any shopping trip" },
      { score: 0, text: "Completely unable to shop" },
    ],
  },
  {
    id: "C",
    activity: "Food Preparation",
    options: [
      {
        score: 1,
        text: "Plans, prepares, and serves adequate meals independently",
      },
      {
        score: 0,
        text: "Prepares adequate meals if supplied with ingredients",
      },
      {
        score: 0,
        text: "Heats and serves prepared meals or prepares meals but does not maintain adequate diet",
      },
      { score: 0, text: "Needs to have meals prepared and served" },
    ],
  },
  {
    id: "D",
    activity: "Housekeeping",
    options: [
      {
        score: 1,
        text: "Maintains house alone with occasional assistance (heavy work)",
      },
      {
        score: 1,
        text: "Performs light daily tasks such as dishwashing, bed making",
      },
      {
        score: 1,
        text: "Performs light daily tasks, but cannot maintain acceptable level of cleanliness",
      },
      { score: 1, text: "Needs help with all home maintenance tasks" },
      { score: 0, text: "Does not participate in any housekeeping tasks" },
    ],
  },
  {
    id: "E",
    activity: "Laundry",
    options: [
      { score: 1, text: "Does personal laundry completely" },
      { score: 1, text: "Launders small items, rinses socks, stockings, etc." },
      { score: 0, text: "All laundry must be done by others" },
    ],
  },
  {
    id: "F",
    activity: "Mode of Transportation",
    options: [
      {
        score: 1,
        text: "Travels independently on public transportation or drives own car",
      },
      {
        score: 1,
        text: "Arranges own travel via taxi, but does not otherwise use public transportation",
      },
      {
        score: 1,
        text: "Travels on public transportation when assisted or accompanied by another",
      },
      {
        score: 0,
        text: "Travel limited to taxi or automobile with assistance of another",
      },
      { score: 0, text: "Does not travel at all" },
    ],
  },
  {
    id: "G",
    activity: "Responsibility for Own Medications",
    options: [
      {
        score: 1,
        text: "Is responsible for taking medication in correct dosages at correct time",
      },
      {
        score: 0,
        text: "Takes responsibility if medication is prepared in advance in separate dosages",
      },
      { score: 0, text: "Is not capable of dispensing own medication" },
    ],
  },
  {
    id: "H",
    activity: "Ability to Handle Finances",
    options: [
      {
        score: 1,
        text: "Manages financial matters independently (budgets, writes checks, pays rent and bills, goes to bank); collects and keeps track of income",
      },
      {
        score: 1,
        text: "Manages day-to-day purchases, but needs help with banking, major purchases, etc.",
      },
      { score: 0, text: "Incapable of handling money" },
    ],
  },
];

export function LawtonIADLChart() {
  const { printRef, handlePrint } = usePrint(
    "Lawton Instrumental Activities of Daily Living Scale"
  );
  const [scores, setScores] = useState({});
  const [date, setDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    setDate(formattedDate);
  }, []);

  const handleScoreChange = (id, score) => {
    setScores({ ...scores, [id]: score });
  };

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  }, [scores]);

  return (
    <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent ref={printRef} id="print-root" sx={{ p: { xs: 2, sm: 5 } }}>
        {/* Header Section */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Box
            className="no-print"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <BrainCircuit size={28} color="#6a1b9a" />
            <Typography variant="h5" fontWeight={700}>
              Lawton IADL Scale
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            className="print-header"
            sx={{ display: "none", mb: 2 }}
          >
            Lawton Instrumental Activities of Daily Living Scale
          </Typography>

          {/* Patient Details Input */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 3,
              mt: 3,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{ width: { xs: "100%", sm: "55%" }, mb: { xs: 2, sm: 0 } }}
            >
              <Typography variant="body1" component="span" fontWeight="bold">
                Patient’s Name:{" "}
              </Typography>
              <input
                type="text"
                className="print-input"
                style={{
                  width: "60%",
                  border: "none",
                  borderBottom: "1px solid #000",
                  outline: "none",
                }}
              />
            </Box>
            <Box sx={{ width: { xs: "100%", sm: "40%" } }}>
              <Typography variant="body1" component="span" fontWeight="bold">
                Date:{" "}
              </Typography>
              <input
                type="text"
                className="print-input"
                value={date}
                readOnly
                style={{
                  width: "60%",
                  border: "none",
                  borderBottom: "1px solid #000",
                  outline: "none",
                }}
              />
            </Box>
          </Box>

          {/* Instructions */}
          <Box
            className="no-print"
            sx={{
              mb: 3,
              p: 1.5,
              bgcolor: "purple.50",
              border: "1px solid #d1c4e9",
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "purple.900" }}
            >
              <strong>Instructions:</strong> For each category, circle the item
              description that most closely resembles the client’s highest
              functional level (either 0 or 1).
            </Typography>
          </Box>

          {/* Lawton IADL Table */}
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{ minWidth: 800, border: "1px solid #000", mb: 3 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      width: "50px",
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                      textAlign: "center",
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "200px",
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                    }}
                  >
                    Activity
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                      textAlign: "center",
                    }}
                  >
                    Score
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {LAWTON_IADL_ITEMS.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell
                      sx={{
                        borderRight: "1px solid #000",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {item.id}
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid #000", fontWeight: "bold" }}
                    >
                      {item.activity}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: "1px solid #000",
                        textAlign: "center",
                      }}
                    >
                      <select
                        value={scores[item.id] || ""}
                        onChange={(e) =>
                          handleScoreChange(item.id, Number(e.target.value))
                        }
                        style={{
                          width: "100%",
                          padding: "4px",
                          border: "none",
                          borderBottom: "1px solid #ccc",
                          outline: "none",
                          textAlign: "center",
                        }}
                        className="print-input"
                      >
                        <option value="">Select</option>
                        {item.options.map((option, i) => (
                          <option key={i} value={option.score}>
                            {option.score}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      {item.options.map((option, i) => (
                        <Box key={i} sx={{ mb: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={
                              scores[item.id] === option.score
                                ? "bold"
                                : "normal"
                            }
                          >
                            {option.text}
                          </Typography>
                        </Box>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Total Score Area */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Box
              sx={{
                border: "2px solid #000",
                p: 1,
                width: "250px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "#f3e5f5",
              }}
            >
              <Typography fontWeight="bold">TOTAL SCORE:</Typography>
              <Typography
                variant="h6"
                color="purple.dark"
                fontWeight="bold"
                sx={{ width: "50px", textAlign: "center" }}
              >
                {/* UI Display */}
                <span style={{ "@media print": { display: "none" } }}>
                  {totalScore}
                </span>
                {/* Print Display */}
                <input
                  type="text"
                  readOnly
                  value={totalScore}
                  className="print-input"
                  style={{
                    width: "100%",
                    borderBottom: "none",
                    display: "none",
                    "@media print": { display: "block" },
                  }}
                />
              </Typography>
            </Box>
          </Box>

          {/* Scoring & Footer */}
          <Box className="no-print" sx={{ borderTop: "1px solid #000", pt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Scoring:
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              • 8 = High (patient independent)
              <br />• 0 = Low (patient very dependent)
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem", display: "block", mt: 2 }}
            >
              Lawton, M.P., & Brody, E.M. (1969). Assessment of older people:
              Self-maintaining and instrumental activities of daily living. The
              Gerontologist, 9(3), 179-186.
              <br />
              Copyright © The Gerontological Society of America. Reproduced
              [Adapted] by permission of the publisher.
            </Typography>
          </Box>

          {/* Print Button (Hidden in Print) */}
          <Box className="no-print" sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Printer size={18} />}
              onClick={handlePrint}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Print Assessment
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
