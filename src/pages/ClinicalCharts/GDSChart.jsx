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
  Button,
} from "@mui/material";
import { BrainCircuit, Printer } from "lucide-react";
import { usePrint } from "./usePrint";

const GDS_QUESTIONS = [
  { id: 1, text: "Are you basically satisfied with your life?", target: "NO" },
  {
    id: 2,
    text: "Have you dropped many of your activities and interests?",
    target: "YES",
  },
  { id: 3, text: "Do you feel that your life is empty?", target: "YES" },
  { id: 4, text: "Do you often get bored?", target: "YES" },
  { id: 5, text: "Are you in good spirits most of the time?", target: "NO" },
  {
    id: 6,
    text: "Are you afraid that something bad is going to happen to you?",
    target: "YES",
  },
  { id: 7, text: "Do you feel happy most of the time?", target: "NO" },
  { id: 8, text: "Do you often feel helpless?", target: "YES" },
  {
    id: 9,
    text: "Do you prefer to stay at home, rather than going out and doing new things?",
    target: "YES",
  },
  {
    id: 10,
    text: "Do you feel you have more problems with memory than most people?",
    target: "YES",
  },
  { id: 11, text: "Do you think it is wonderful to be alive?", target: "NO" },
  {
    id: 12,
    text: "Do you feel pretty worthless the way you are now?",
    target: "YES",
  },
  { id: 13, text: "Do you feel full of energy?", target: "NO" },
  {
    id: 14,
    text: "Do you feel that your situation is hopeless?",
    target: "YES",
  },
  {
    id: 15,
    text: "Do you think that most people are better off than you are?",
    target: "YES",
  },
];

export function GDSChart() {
  const { printRef, handlePrint } = usePrint(
    "Geriatric Depression Scale (Short Form)"
  );
  const [gdsAnswers, setGdsAnswers] = useState({});

  const handleAnswerChange = (id, answer) => {
    setGdsAnswers((prev) => ({
      ...prev,
      [id]: answer,
    }));
  };

  const calculatedScore = useMemo(() => {
    return GDS_QUESTIONS.reduce((score, q) => {
      const userAnswer = gdsAnswers[q.id];
      if (userAnswer && userAnswer === q.target) {
        return score + 1;
      }
      return score;
    }, 0);
  }, [gdsAnswers]);

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
            <BrainCircuit size={28} color="#00796b" />
            <Typography variant="h5" fontWeight={700}>
              Geriatric Depression Scale (Short Form)
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            className="print-header"
            sx={{ display: "none", mb: 2 }}
          >
            Geriatric Depression Scale (Short Form)
          </Typography>

          {/* Patient Details Input */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 1,
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
                Date: {new Date().toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>
        {/* Instructions */}

        {/* Questionnaire Table */}
        <Box sx={{ overflowX: "auto" }}>
          <Table
            size="small"
            sx={{ minWidth: 500, border: "1px solid #000", mb: 3 }}
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
                  No.
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", borderRight: "1px solid #000" }}
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
                  Answer
                </TableCell>
                <TableCell
                  sx={{
                    width: "80px",
                    fontWeight: "bold",
                    textAlign: "center",
                    bgcolor: "#f0f4c3 !important",
                  }}
                >
                  Score
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {GDS_QUESTIONS.map((q) => {
                const isTarget = gdsAnswers[q.id] === q.target;
                const score = isTarget ? 1 : 0;
                const answered = !!gdsAnswers[q.id];
                return (
                  <TableRow key={q.id} sx={{ height: "40px" }}>
                    <TableCell
                      sx={{
                        borderRight: "1px solid #000",
                        textAlign: "center",
                      }}
                    >
                      {q.id}.
                    </TableCell>
                    <TableCell sx={{ borderRight: "1px solid #000" }}>
                      {q.text}
                    </TableCell>

                    {/* Answer Cell */}
                    <TableCell
                      sx={{
                        borderRight: "1px solid #000",
                        textAlign: "center",
                      }}
                    >
                      {/* UI Controls */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 1,
                          "@media print": { display: "none" },
                        }}
                      >
                        <Button
                          size="small"
                          variant={
                            gdsAnswers[q.id] === "YES"
                              ? "contained"
                              : "outlined"
                          }
                          color={
                            gdsAnswers[q.id] === "YES" ? "primary" : "inherit"
                          }
                          onClick={() => handleAnswerChange(q.id, "YES")}
                          sx={{ minWidth: 50, px: 1, textTransform: "none" }}
                        >
                          YES
                        </Button>
                        <Button
                          size="small"
                          variant={
                            gdsAnswers[q.id] === "NO" ? "contained" : "outlined"
                          }
                          color={
                            gdsAnswers[q.id] === "NO" ? "primary" : "inherit"
                          }
                          onClick={() => handleAnswerChange(q.id, "NO")}
                          sx={{ minWidth: 50, px: 1, textTransform: "none" }}
                        >
                          NO
                        </Button>
                      </Box>

                      {/* Print Display */}
                      <Box
                        sx={{
                          display: "none",
                          "@media print": { display: "block" },
                        }}
                      >
                        {answered ? (
                          <Typography variant="body2" fontWeight="bold">
                            {gdsAnswers[q.id]}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontStyle="italic"
                          >
                            ______
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Score Cell */}
                    <TableCell
                      sx={{
                        textAlign: "center",
                        fontWeight: "bold",
                        bgcolor: "#f5f5dc",
                      }}
                    >
                      {/* UI Display */}
                      <Box
                        sx={{ "@media print": { display: "none" } }}
                        color={score === 1 ? "primary.main" : "text.secondary"}
                      >
                        {answered ? score : "-"}
                      </Box>
                      {/* Print Display */}
                      <Box
                        sx={{
                          display: "none",
                          "@media print": { display: "block" },
                        }}
                      >
                        {answered ? (
                          <Typography variant="body2" fontWeight="bold">
                            {score}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontStyle="italic"
                          >
                            0
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
        {/* Total Score Area */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Box
            sx={{
              border: "2px solid #000",
              p: 1,
              width: "200px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#e0f2f1",
            }}
          >
            <Typography fontWeight="bold">TOTAL SCORE:</Typography>
            <Typography
              variant="h6"
              color="primary.dark"
              fontWeight="bold"
              sx={{ width: "50px", textAlign: "center" }}
            >
              {/* UI Display */}
              <span sx={{ "@media print": { display: "none" } }}>
                {calculatedScore}
              </span>
              {/* Print Display */}
              <input
                type="text"
                readOnly
                value={calculatedScore}
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

        {/* Print Button (Hidden in Print) */}
        <Box className="no-print" sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<Printer size={18} />}
            onClick={handlePrint}
            sx={{ borderRadius: 2, px: 4 }}
            disabled={Object.keys(gdsAnswers).length !== GDS_QUESTIONS.length}
          >
            {Object.keys(gdsAnswers).length !== GDS_QUESTIONS.length
              ? `Answer All (${Object.keys(gdsAnswers).length}/${
                  GDS_QUESTIONS.length
                })`
              : "Print Assessment"}
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={1}
            sx={{
              opacity:
                Object.keys(gdsAnswers).length !== GDS_QUESTIONS.length ? 1 : 0,
            }}
          >
            Please answer all questions to enable printing.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
