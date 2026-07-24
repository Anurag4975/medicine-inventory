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

const KATZ_ADL_ITEMS = [
  {
    id: 1,
    activity: "BATHING",
    description: [
      {
        label: "Independence (1 Point)",
        text: "Bathes self completely or needs help in bathing only a single part of the body such as the back, genital area or disabled extremity.",
      },
      {
        label: "Dependence (0 Points)",
        text: "Needs help with bathing more than one part of the body, getting in or out of the tub or shower. Requires total bathing.",
      },
    ],
  },
  {
    id: 2,
    activity: "DRESSING",
    description: [
      {
        label: "Independence (1 Point)",
        text: "Gets clothes from closets and drawers and puts on clothes and outer garments complete with fasteners. May have help tying shoes.",
      },
      {
        label: "Dependence (0 Points)",
        text: "Needs help with dressing self or needs to be completely dressed.",
      },
    ],
  },
  {
    id: 3,
    activity: "TOILETING",
    description: [
      {
        label: "Independence (1 Point)",
        text: "Goes to toilet, gets on and off, arranges clothes, cleans genital area without help.",
      },
      {
        label: "Dependence (0 Points)",
        text: "Needs help transferring to the toilet, cleaning self or uses bedpan or commode.",
      },
    ],
  },
  {
    id: 4,
    activity: "TRANSFERRING",
    description: [
      {
        label: "Independence (1 Point)",
        text: "Moves in and out of bed or chair unassisted. Mechanical transfer aids are acceptable.",
      },
      {
        label: "Dependence (0 Points)",
        text: "Needs help in moving from bed to chair or requires a complete transfer.",
      },
    ],
  },
  {
    id: 5,
    activity: "CONTINENCE",
    description: [
      {
        label: "Independence (1 Point)",
        text: "Exercises complete self-control over urination and defecation.",
      },
      {
        label: "Dependence (0 Points)",
        text: "Is partially or totally incontinent of bowel or bladder.",
      },
    ],
  },
  {
    id: 6,
    activity: "FEEDING",
    description: [
      {
        label: "Independence (1 Point)",
        text: "Gets food from plate into mouth without help. Preparation of food may be done by another person.",
      },
      {
        label: "Dependence (0 Points)",
        text: "Needs partial or total help with feeding or requires parenteral feeding.",
      },
    ],
  },
];

export function KatzADLChart() {
  const { printRef, handlePrint } = usePrint(
    "Katz Index of Independence in ADL"
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
    setScores({ ...scores, [id]: value });
  };

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce(
      (sum, score) => sum + (Number(score) || 0),
      0
    );
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
            <BrainCircuit size={28} color="#9c27b0" />
            <Typography variant="h5" fontWeight={700}>
              Katz ADL Index
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            className="print-header"
            sx={{ display: "none", mb: 2 }}
          >
            Katz Index of Independence in Activities of Daily Living
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
              border: "1px solid #e1bee7",
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "purple.900" }}
            >
              <strong>Instructions:</strong> For each activity, assign 1 point
              for independence and 0 points for dependence.
            </Typography>
          </Box>

          {/* Katz ADL Table */}
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{ minWidth: 700, border: "1px solid #000", mb: 3 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      width: "120px",
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                      textAlign: "center",
                    }}
                  >
                    Activities
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "100px",
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                      textAlign: "center",
                    }}
                  >
                    Points (1 or 0)
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {KATZ_ADL_ITEMS.map((item) => (
                  <TableRow key={item.id}>
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
                      <input
                        type="number"
                        min="0"
                        max="1"
                        className="print-input"
                        value={scores[item.id] || ""}
                        onChange={(e) =>
                          handleScoreChange(item.id, e.target.value)
                        }
                        style={{
                          width: "60%",
                          border: "none",
                          borderBottom: "1px solid #ccc",
                          outline: "none",
                          textAlign: "center",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {item.description.map((desc, i) => (
                        <Box key={i} sx={{ mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {desc.label}
                          </Typography>
                          <Typography variant="body2">{desc.text}</Typography>
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
              <Typography fontWeight="bold">TOTAL POINTS:</Typography>
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
              • 6 = High (patient independent)
              <br />• 0 = Low (patient very dependent)
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem", display: "block", mt: 2 }}
            >
              (Katz S, Ford AB, Moskowitz RW, Jackson BA, Jaffee MW. Studies of
              illness in the aged. The index of ADL: a standardized measure of
              biological and psychosocial function. JAMA. 1963;185:914-919.)
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
