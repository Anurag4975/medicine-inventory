// src/pages/PatientRecords/CalendarView.jsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from "@mui/icons-material";
import moment from "moment";

const CalendarView = ({ onSelectDate, selectedDate }) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(
    moment(selectedDate).startOf("month"),
  );

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = currentMonth.startOf("month").day();
  const today = moment().format("YYYY-MM-DD");
  const selected = moment(selectedDate).format("YYYY-MM-DD");

  const handlePrevMonth = () => {
    setCurrentMonth(moment(currentMonth).subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth(moment(currentMonth).add(1, "month"));
  };

  const handleToday = () => {
    const today = moment();
    setCurrentMonth(today.startOf("month"));
    onSelectDate(today);
  };

  const handleDateClick = (day) => {
    const date = moment(currentMonth).date(day);
    onSelectDate(date);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null); // Empty cells before first day
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: "blur(10px)",
        maxWidth: 350,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={handlePrevMonth}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ minWidth: 140, textAlign: "center" }}
          >
            {currentMonth.format("MMMM YYYY")}
          </Typography>
          <IconButton
            size="small"
            onClick={handleNextMonth}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
        <Chip
          icon={<TodayIcon sx={{ fontSize: 14 }} />}
          label="Today"
          size="small"
          onClick={handleToday}
          sx={{
            cursor: "pointer",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: "0.75rem",
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
          }}
        />
      </Box>

      {/* Week Days */}
      <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
        {weekDays.map((day) => (
          <Grid item xs={12 / 7} key={day}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                fontWeight: 600,
                color: theme.palette.text.secondary,
                fontSize: "0.7rem",
                py: 0.5,
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Days */}
      <Grid container spacing={0.5}>
        {calendarDays.map((day, index) => (
          <Grid item xs={12 / 7} key={index}>
            {day ? (
              <Box
                onClick={() => handleDateClick(day)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 32,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight:
                    selected ===
                    moment(currentMonth).date(day).format("YYYY-MM-DD")
                      ? 700
                      : 400,
                  color:
                    selected ===
                    moment(currentMonth).date(day).format("YYYY-MM-DD")
                      ? "#fff"
                      : today ===
                          moment(currentMonth).date(day).format("YYYY-MM-DD")
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                  bgcolor:
                    selected ===
                    moment(currentMonth).date(day).format("YYYY-MM-DD")
                      ? theme.palette.primary.main
                      : today ===
                          moment(currentMonth).date(day).format("YYYY-MM-DD")
                        ? alpha(theme.palette.primary.main, 0.1)
                        : "transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor:
                      selected ===
                      moment(currentMonth).date(day).format("YYYY-MM-DD")
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.primary.main, 0.1),
                    transform: "scale(1.1)",
                  },
                }}
              >
                {day}
              </Box>
            ) : (
              <Box sx={{ height: 32 }} />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Quick Select */}
      <Box sx={{ display: "flex", gap: 0.5, mt: 2, flexWrap: "wrap" }}>
        <Chip
          label="Yesterday"
          size="small"
          onClick={() => {
            const yesterday = moment().subtract(1, "days");
            setCurrentMonth(yesterday.startOf("month"));
            onSelectDate(yesterday);
          }}
          sx={{
            cursor: "pointer",
            fontSize: "0.7rem",
            height: 24,
          }}
          variant="outlined"
        />
        <Chip
          label="Tomorrow"
          size="small"
          onClick={() => {
            const tomorrow = moment().add(1, "days");
            setCurrentMonth(tomorrow.startOf("month"));
            onSelectDate(tomorrow);
          }}
          sx={{
            cursor: "pointer",
            fontSize: "0.7rem",
            height: 24,
          }}
          variant="outlined"
        />
        <Chip
          label="This Week"
          size="small"
          onClick={() => {
            const startOfWeek = moment().startOf("week");
            onSelectDate(startOfWeek);
          }}
          sx={{
            cursor: "pointer",
            fontSize: "0.7rem",
            height: 24,
          }}
          variant="outlined"
        />
      </Box>
    </Paper>
  );
};

export default CalendarView;
