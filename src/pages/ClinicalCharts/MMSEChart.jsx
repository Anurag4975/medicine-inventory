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

const MMSE_QUESTIONS = [
  {
    id: 1,
    maxScore: 5,
    question:
      "Orientation to Time: 'What is the year? Season? Date? Day of the week? Month?'",
  },
  {
    id: 2,
    maxScore: 5,
    question:
      "Orientation to Place: 'Where are we now: State? County? Town/city? Hospital? Floor?'",
  },
  {
    id: 3,
    maxScore: 3,
    question:
      "Registration: The examiner names three unrelated objects clearly and slowly, then asks the patient to name all three of them. Number of trials: ___",
  },
  {
    id: 4,
    maxScore: 5,
    question:
      "Attention and Calculation: 'I would like you to count backward from 100 by sevens.' (93, 86, 79, 72, 65, …) Stop after five answers. Alternative: 'Spell WORLD backwards.' (D-L-R-O-W)",
  },
  {
    id: 5,
    maxScore: 3,
    question:
      "Recall: 'Earlier I told you the names of three things. Can you tell me what those were?'",
  },
  {
    id: 6,
    maxScore: 2,
    question:
      "Naming: Show the patient two simple objects, such as a wristwatch and a pencil, and ask the patient to name them.",
  },
  {
    id: 7,
    maxScore: 1,
    question: "Repetition: 'Repeat the phrase: “No ifs, ands, or buts.”'",
  },
  {
    id: 8,
    maxScore: 3,
    question:
      "3-Stage Command: 'Take the paper in your right hand, fold it in half, and put it on the floor.' (The examiner gives the patient a piece of blank paper.)",
  },
  {
    id: 9,
    maxScore: 1,
    question:
      "Reading: 'Please read this and do what it says.' (Written instruction is 'Close your eyes.')",
  },
  {
    id: 10,
    maxScore: 1,
    question:
      "Writing: 'Make up and write a sentence about anything.' (This sentence must contain a noun and a verb.)",
  },
  {
    id: 11,
    maxScore: 1,
    question:
      "Visuospatial: 'Please copy this picture.' (The examiner gives the patient a blank piece of paper and asks him/her to draw the symbol below. All 10 angles must be present and two must intersect.)",
  },
];

export function MMSEChart() {
  const { printRef, handlePrint } = usePrint(
    "Mini-Mental State Examination (MMSE)"
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

  const handleScoreChange = (id, value) => {
    const num =
      value === ""
        ? ""
        : Math.min(
            Number(value),
            MMSE_QUESTIONS.find((q) => q.id === id).maxScore
          );
    setScores((prev) => ({ ...prev, [id]: num >= 0 ? num : "" }));
  };

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((sum, s) => sum + (Number(s) || 0), 0);
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
            <BrainCircuit size={28} color="#1976d2" />
            <Typography variant="h5" fontWeight={700}>
              MMSE
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            className="print-header"
            sx={{ display: "none", mb: 2 }}
          >
            Mini-Mental State Examination (MMSE)
          </Typography>

          {/* Patient Details */}
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
                value={date}
                readOnly
                className="print-input"
                style={{
                  width: "60%",
                  border: "none",
                  borderBottom: "1px solid #000",
                  outline: "none",
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* MMSE Table */}
        <Box sx={{ overflowX: "auto" }}>
          <Table
            size="small"
            sx={{ minWidth: 700, border: "1px solid #000", mb: 3 }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: "60px",
                    fontWeight: "bold",
                    borderRight: "1px solid #000",
                    textAlign: "center",
                  }}
                >
                  Max Score
                </TableCell>
                <TableCell
                  sx={{
                    width: "60px",
                    fontWeight: "bold",
                    borderRight: "1px solid #000",
                    textAlign: "center",
                  }}
                >
                  Patient’s Score
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Questions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MMSE_QUESTIONS.map((q) => (
                <TableRow
                  key={q.id}
                  sx={{ height: q.id === 11 ? "120px" : "auto" }}
                >
                  <TableCell
                    sx={{ borderRight: "1px solid #000", textAlign: "center" }}
                  >
                    {q.maxScore}
                  </TableCell>
                  <TableCell
                    sx={{ borderRight: "1px solid #000", textAlign: "center" }}
                  >
                    <input
                      type="number"
                      min="0"
                      max={q.maxScore}
                      value={scores[q.id] || ""}
                      onChange={(e) => handleScoreChange(q.id, e.target.value)}
                      style={{
                        width: "60%",
                        border: "none",
                        borderBottom: "1px solid #ccc",
                        outline: "none",
                        textAlign: "center",
                      }}
                      className="print-input"
                    />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Typography variant="body2">{q.question}</Typography>
                    {q.id === 11 && (
                      <Box sx={{ mt: 1, textAlign: "center" }}>
                        <svg
                          width="120"
                          height="70"
                          viewBox="0 0 120 70"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20,20 L40,10 L65,20 L70,40 L55,60 L30,60 L15,40 Z
                               M55,20 L75,10 L100,20 L105,40 L90,60 L65,60 L50,40 Z"
                            fill="none"
                            stroke="black"
                            strokeWidth="2"
                          />
                        </svg>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Total Score */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Box
            sx={{
              border: "2px solid #000",
              p: 1,
              width: "200px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#e3f2fd",
            }}
          >
            <Typography fontWeight="bold">TOTAL SCORE:</Typography>
            <Typography variant="h6" color="primary.dark" fontWeight="bold">
              {totalScore} / 30
            </Typography>
          </Box>
        </Box>

        {/* Print Button */}
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
      </CardContent>
    </Card>
  );
}
