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

const SARC_F_QUESTIONS = [
  {
    id: 1,
    component: "Strength",
    question:
      "How much difficulty do you have in lifting and carrying 10 pounds?",
    options: [
      { score: 0, label: "None" },
      { score: 1, label: "Some" },
      { score: 2, label: "A lot or unable" },
    ],
  },
  {
    id: 2,
    component: "Assistance in walking",
    question: "How much difficulty do you have walking across a room?",
    options: [
      { score: 0, label: "None" },
      { score: 1, label: "Some" },
      { score: 2, label: "A lot, unable or use aids" },
    ],
  },
  {
    id: 3,
    component: "Rise from a chair",
    question:
      "How much difficulty do you have transferring from a chair or bed?",
    options: [
      { score: 0, label: "None" },
      { score: 1, label: "Some" },
      { score: 2, label: "A lot, unable or use aids" },
    ],
  },
  {
    id: 4,
    component: "Climb stairs",
    question:
      "How much difficulty do you have climbing a flight of ten stairs?",
    options: [
      { score: 0, label: "None" },
      { score: 1, label: "Some" },
      { score: 2, label: "A lot or unable" },
    ],
  },
  {
    id: 5,
    component: "Falls",
    question: "How many times have you fallen in the past year?",
    options: [
      { score: 0, label: "None" },
      { score: 1, label: "1-3 falls" },
      { score: 2, label: "4 or more falls" },
    ],
  },
];

export function SARCFSarcomaChart() {
  const { printRef, handlePrint } = usePrint("SARC-F Sarcoma Questionnaire");
  const [scores, setScores] = useState({});
  const [eGFR, setEGfr] = useState("");
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
            <BrainCircuit size={28} color="#d32f2f" />
            <Typography variant="h5" fontWeight={700}>
              SARC-F Sarcoma Questionnaire
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            className="print-header"
            sx={{ display: "none", mb: 2 }}
          >
            SARC-F Sarcoma Questionnaire
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
              bgcolor: "red.50",
              border: "1px solid #ffcdd2",
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "red.900" }}
            >
              <strong>Instructions:</strong> For each question, circle the
              response that best describes the patient's ability.
            </Typography>
          </Box>

          {/* SARC-F Table */}
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{ minWidth: 800, border: "1px solid #000", mb: 3 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      width: "150px",
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                    }}
                  >
                    Component
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "300px",
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                    }}
                  >
                    Question
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "150px",
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                      textAlign: "center",
                    }}
                  >
                    Score
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SARC_F_QUESTIONS.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ borderRight: "1px solid #000" }}>
                      {item.component}
                    </TableCell>
                    <TableCell sx={{ borderRight: "1px solid #000" }}>
                      {item.question}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: "1px solid #000",
                        textAlign: "center",
                      }}
                    >
                      <select
                        value={
                          scores[item.id] !== undefined ? scores[item.id] : ""
                        }
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
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* eGFR Input */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" component="span" fontWeight="bold">
              eGFR:{" "}
            </Typography>
            <input
              type="number"
              className="print-input"
              value={eGFR}
              onChange={(e) => setEGfr(Number(e.target.value))}
              style={{
                width: "100px",
                border: "none",
                borderBottom: "1px solid #000",
                outline: "none",
                textAlign: "center",
              }}
            />
          </Box>

          {/* Total Score Area */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Box
              sx={{
                border: "2px solid #000",
                p: 1,
                width: "300px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "#ffebee",
              }}
            >
              <Typography fontWeight="bold">TOTAL SARC-F SCORE:</Typography>
              <Typography
                variant="h6"
                color="red.dark"
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem", display: "block", mt: 2 }}
            >
              SARC-F is a simple questionnaire to screen for sarcopenia. A score
              of 4 or more indicates probable sarcopenia.
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
