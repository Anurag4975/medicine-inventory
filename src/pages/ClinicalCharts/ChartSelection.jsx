import React from "react";
import { Box, Card, Typography, CardActionArea } from "@mui/material";
import { Activity, Scale, Droplet } from "lucide-react";

const ChartSelection = ({ onSelectChart, selectedChartId }) => {
  const charts = [
    {
      id: "bp",
      title: "Blood Pressure Log",
      description: "Systolic/Diastolic tracking sheet.",
      icon: <Activity size={24} color="#d32f2f" />,
    },
    {
      id: "glucose",
      title: "Glucose Chart",
      description: "Fasting & PP sugar monitoring.",
      icon: <Droplet size={24} color="#1976D2" />,
    },
    {
      id: "weight",
      title: "BMI & Weight",
      description: "Weight management tracker.",
      icon: <Scale size={24} color="#388e3c" />,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography
        variant="h6"
        sx={{ color: "#1976D2", fontWeight: "bold", mb: 1 }}
      >
        Available Charts
      </Typography>
      {charts.map((chart) => (
        <Card
          key={chart.id}
          variant="outlined"
          sx={{
            borderColor:
              selectedChartId === chart.id ? "#1976D2" : "rgba(0,0,0,0.12)",
            bgcolor: selectedChartId === chart.id ? "#e3f2fd" : "white",
          }}
        >
          <CardActionArea onClick={() => onSelectChart(chart.id)} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1,
                  bgcolor: "white",
                  borderRadius: "50%",
                  boxShadow: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {chart.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {chart.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {chart.description}
                </Typography>
              </Box>
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
};

export default ChartSelection;
