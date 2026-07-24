import React, { useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  useTheme,
  Grid,
  IconButton,
} from "@mui/material";
import {
  Activity,
  Smile,
  Brain,
  User,
  Home,
  Dumbbell,
  ArrowLeft,
} from "lucide-react";
import { BPChart } from "./BPChart";
import { GDSChart } from "./GDSChart";
import { MMSEChart } from "./MMSEChart";
import { KatzADLChart } from "./KatzADLChart";
import { LawtonIADLChart } from "./LawtonIADLChart";
import { SARCFSarcomaChart } from "./SARCFSarcomaChart";

export default function ClinicalCharts() {
  const [activeChart, setActiveChart] = useState(null);
  const theme = useTheme();

  const handleCardClick = (chartType) => {
    setActiveChart(chartType);
  };

  const ChartCard = ({ title, desc, icon: Icon, type, color }) => (
    <Card
      onClick={() => handleCardClick(type)}
      sx={{
        height: "100%",
        cursor: "pointer",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          boxShadow: `0 4px 20px ${color}25`,
          borderColor: color,
          transform: "translateY(-2px)",
          "& .icon-box": {
            transform: "scale(1.1)",
            bgcolor: `${color}25`,
          },
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box
            className="icon-box"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 56,
              minHeight: 56,
              borderRadius: 2,
              bgcolor: `${color}12`,
              color: color,
              transition: "all 0.2s ease",
            }}
          >
            <Icon size={32} strokeWidth={2} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                mb: 0.5,
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                lineHeight: 1.4,
              }}
            >
              {desc}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      {/* Header Area */}
      <Box sx={{ mb: 3 }}>
        {activeChart && (
          <IconButton
            onClick={() => setActiveChart(null)}
            sx={{
              mb: 2,
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
                bgcolor: "primary.lighter",
              },
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
        )}

        {!activeChart && (
          <>
            <Typography
              variant="h5"
              component="h1"
              fontWeight={700}
              sx={{ mb: 0.5 }}
            >
              Clinical Monitoring Tools
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a tool to generate a printable chart
            </Typography>
          </>
        )}
      </Box>

      {/* Selection Menu */}
      {!activeChart && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <ChartCard
              title="Blood Pressure Tracker"
              desc="5-day AM/PM log for self-monitoring"
              icon={Activity}
              type="bp"
              color={theme.palette.error.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ChartCard
              title="Geriatric Depression Scale"
              desc="15-item screening for depression"
              icon={Smile}
              type="gds"
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ChartCard
              title="Mini-Mental State Exam"
              desc="30-point cognitive impairment test"
              icon={Brain}
              type="mmse"
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ChartCard
              title="Katz ADL Index"
              desc="6-point daily living independence measure"
              icon={User}
              type="katz"
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ChartCard
              title="Lawton IADL Scale"
              desc="8-point instrumental activities measure"
              icon={Home}
              type="iadl"
              color={theme.palette.info.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ChartCard
              title="SARC-F Questionnaire"
              desc="5-item sarcopenia screening tool"
              icon={Dumbbell}
              type="sarcf"
              color={theme.palette.error.dark}
            />
          </Grid>
        </Grid>
      )}

      {/* Active Chart View */}
      {activeChart === "bp" && (
        <Box sx={{ animation: "fadeIn 0.3s ease-in" }}>
          <BPChart />
        </Box>
      )}
      {activeChart === "gds" && (
        <Box sx={{ animation: "fadeIn 0.3s ease-in" }}>
          <GDSChart />
        </Box>
      )}
      {activeChart === "mmse" && (
        <Box sx={{ animation: "fadeIn 0.3s ease-in" }}>
          <MMSEChart />
        </Box>
      )}
      {activeChart === "katz" && (
        <Box sx={{ animation: "fadeIn 0.3s ease-in" }}>
          <KatzADLChart />
        </Box>
      )}
      {activeChart === "iadl" && (
        <Box sx={{ animation: "fadeIn 0.3s ease-in" }}>
          <LawtonIADLChart />
        </Box>
      )}
      {activeChart === "sarcf" && (
        <Box sx={{ animation: "fadeIn 0.3s ease-in" }}>
          <SARCFSarcomaChart />
        </Box>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Container>
  );
}
