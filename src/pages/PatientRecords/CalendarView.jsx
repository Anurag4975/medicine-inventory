import React, { useState } from "react";
import { Box, Typography, IconButton, Fade, Tooltip } from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  Today as TodayIcon,
} from "@mui/icons-material";
import moment from "moment";

const CalendarView = ({
  patients = [], // Default to empty array
  onSelectDate,
  selectedDate,
  width = 260,
}) => {
  const [currentMonth, setCurrentMonth] = useState(moment());

  const getDaysInMonth = () => {
    const startOfMonth = currentMonth.clone().startOf("month").startOf("week");
    const endOfMonth = currentMonth.clone().endOf("month").endOf("week");
    const days = [];
    let day = startOfMonth.clone();
    while (day.isSameOrBefore(endOfMonth, "day")) {
      days.push(day.clone());
      day.add(1, "day");
    }
    return days;
  };

  const getPatientCountForDate = (date) => {
    if (!patients || !Array.isArray(patients)) {
      return 0; // Return 0 if patients is not an array
    }
    const dateStr = date.format("YYYY-MM-DD");
    return patients.filter((p) => p.appointmentDate === dateStr).length;
  };

  const daysOfWeek = moment.weekdaysShort();

  const goToToday = () => {
    setCurrentMonth(moment());
    onSelectDate(moment());
  };

  return (
    <Box
      sx={{
        width: width,
        p: 1.5,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* Header with Month Navigation */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
        sx={{
          pb: 1,
          borderBottom: "1px solid",
          borderColor: "primary.main",
        }}
      >
        <Box display="flex" alignItems="center" gap={2} p={2}>
          <IconButton
            size="small"
            onClick={() =>
              setCurrentMonth(currentMonth.clone().subtract(1, "month"))
            }
            sx={{
              p: 0.5,
              borderRadius: 1,
              bgcolor: "action.hover",
              "&:hover": { bgcolor: "primary.light", color: "white" },
              transition: "all 0.2s ease",
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body2"
            fontWeight="600"
            sx={{
              minWidth: 100,
              textAlign: "center",
              color: "primary.main",
              fontSize: "0.8rem",
              letterSpacing: "0.3px",
            }}
          >
            {currentMonth.format("MMM YYYY")}
          </Typography>
          <IconButton
            size="small"
            onClick={() =>
              setCurrentMonth(currentMonth.clone().add(1, "month"))
            }
            sx={{
              p: 0.5,
              borderRadius: 1,
              bgcolor: "action.hover",
              "&:hover": { bgcolor: "primary.light", color: "white" },
              transition: "all 0.2s ease",
            }}
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Box>
        <Tooltip title="Go to Today" arrow>
          <IconButton
            size="small"
            onClick={goToToday}
            sx={{
              p: 0.5,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "white",
              "&:hover": { bgcolor: "primary.dark" },
              transition: "all 0.2s ease",
            }}
          >
            <TodayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {/* Days of Week Header */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(7, 1fr)"
        gap={0.5}
        mb={0.5}
      >
        {daysOfWeek.map((dayName) => (
          <Typography
            key={dayName}
            variant="caption"
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: "0.65rem",
              color: "text.secondary",
              textTransform: "uppercase",
              py: 0.5,
            }}
          >
            {dayName.charAt(0)} {}
          </Typography>
        ))}
      </Box>
      {/* Calendar Days Grid */}
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5}>
        {getDaysInMonth().map((day, i) => {
          const patientCount = getPatientCountForDate(day);
          const isCurrentMonth = day.month() === currentMonth.month();
          const isSelected = selectedDate && day.isSame(selectedDate, "day");
          const isToday = day.isSame(moment(), "day");
          return (
            <Fade in timeout={50 + i * 10} key={i}>
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 28,
                  minWidth: 28,
                  borderRadius: 1,
                  backgroundColor: isSelected
                    ? "primary.main"
                    : isToday
                    ? "primary.light"
                    : "transparent",
                  color:
                    isSelected || isToday
                      ? "white"
                      : !isCurrentMonth
                      ? "text.disabled"
                      : "text.primary",
                  border:
                    isToday && !isSelected
                      ? "1px solid"
                      : "1px solid transparent",
                  borderColor:
                    isToday && !isSelected ? "primary.main" : "transparent",
                  cursor: isCurrentMonth ? "pointer" : "default",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: isSelected ? "scale(1.1)" : "scale(1)",
                  "&:hover": isCurrentMonth
                    ? {
                        bgcolor: isSelected ? "primary.dark" : "primary.light",
                        color: "white",
                        transform: "scale(1.15)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      }
                    : {},
                }}
                onClick={() => isCurrentMonth && onSelectDate(day)}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {day.date()}
                </Typography>
                {patientCount > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 1,
                      right: 1,
                      minWidth: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: isSelected || isToday ? "white" : "error.main",
                      color: isSelected || isToday ? "error.main" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.5rem",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {patientCount > 9 ? "+" : patientCount}
                  </Box>
                )}
              </Box>
            </Fade>
          );
        })}
      </Box>
    </Box>
  );
};

export default CalendarView;
