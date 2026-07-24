import React from "react";
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Fade,
} from "@mui/material";
import {
  Person as PersonIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  MedicalServices as MedicalServicesIcon,
  AccessTime as TimeIcon,
  Badge as BadgeIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  PhoneIphone as PhoneIcon, // Added Phone Icon
} from "@mui/icons-material";
import moment from "moment";
import { HighlightedListItem } from "./StyledComponents";

const PatientListItem = ({
  patient,
  isWaitingList,
  doctor,
  onSelectPatient,
  onCancelPatient,
  onDeletePatient,
  setPrintPatient,
}) => {
  const isTestCompleted = patient.status === "test-completed";
  const ListItemComponent = isTestCompleted ? HighlightedListItem : ListItem;

  const getStatusChip = (status) => {
    const statusConfig = {
      "test-completed": {
        color: "success",
        label: "Test Completed",
        icon: "✓",
      },
      diagnosing: {
        color: "warning",
        label: "Diagnosing",
        icon: "⚡",
      },
      "waiting-for-results": {
        color: "warning",
        label: "Awaiting Results",
        icon: "⏳",
      },
      testing: {
        color: "info",
        label: "In Testing",
        icon: "🔬",
      },
      prescription: {
        color: "info",
        label: "Prescription",
        icon: "💊",
      },
      waiting: {
        color: "default",
        label: "Waiting",
        icon: "⏰",
      },
    };

    const config =
      statusConfig[patient.status?.toLowerCase()] || statusConfig.waiting;

    return (
      <Chip
        label={
          <Box display="flex" alignItems="center" gap={0.5}>
            <span>{config.icon}</span>
            {config.label}
          </Box>
        }
        color={config.color}
        size="small"
        sx={{
          fontWeight: 700,
          "& .MuiChip-label": {
            px: 1.5,
          },
        }}
      />
    );
  };

  const getAvatarColor = (status) => {
    if (isTestCompleted) return "success.main";
    if (
      ["diagnosing", "waiting-for-results", "in-progress"].includes(
        status?.toLowerCase(),
      )
    )
      return "warning.main";
    if (["testing", "prescription"].includes(status?.toLowerCase()))
      return "info.main";
    return "primary.main";
  };

  return (
    <Fade in timeout={300}>
      <ListItemComponent
        sx={{
          borderRadius: 3,
          mb: 1.5,
          border: "1px solid",
          borderColor: isTestCompleted ? "success.light" : "divider",
          bgcolor: isTestCompleted ? "success.50" : "background.paper",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
            borderColor: isTestCompleted ? "success.main" : "primary.light",
          },
        }}
        secondaryAction={
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {isWaitingList ? (
              <>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => onSelectPatient(patient)}
                  startIcon={<MedicalServicesIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                    bgcolor: isTestCompleted ? "success.main" : "primary.main",
                    "&:hover": {
                      bgcolor: isTestCompleted
                        ? "success.dark"
                        : "primary.dark",
                      transform: "scale(1.02)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {isTestCompleted ? "Review Results" : "Start Consultation"}
                </Button>

                <Tooltip title="Cancel Appointment" arrow>
                  <IconButton
                    size="medium"
                    onClick={() => onCancelPatient(patient)}
                    sx={{
                      bgcolor: "error.50",
                      color: "error.main",
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "error.main",
                        color: "white",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Patient Record" arrow>
                  <IconButton
                    size="medium"
                    onClick={() => onDeletePatient(patient.id)}
                    sx={{
                      bgcolor: "grey.100",
                      color: "grey.600",
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "grey.600",
                        color: "white",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => onSelectPatient(patient)}
                  startIcon={<VisibilityIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderColor: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.main",
                      color: "white",
                      transform: "scale(1.02)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  View
                </Button>

                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => setPrintPatient(patient)}
                  startIcon={<PrintIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderColor: "info.main",
                    color: "info.main",
                    "&:hover": {
                      bgcolor: "info.main",
                      color: "white",
                      transform: "scale(1.02)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Print
                </Button>
              </>
            )}
          </Box>
        }
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              bgcolor: getAvatarColor(patient.status),
              width: 52,
              height: 52,
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              border: "3px solid white",
            }}
          >
            <PersonIcon sx={{ fontSize: 28 }} />
          </Avatar>
        </ListItemAvatar>

        <ListItemText
          primary={
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                mb: 0.5,
                fontSize: "1.1rem",
              }}
            >
              {patient.name}
            </Typography>
          }
          secondary={
            <Box>
              {isWaitingList ? (
                <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                  {/* AGE */}
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <PersonIcon
                      fontSize="small"
                      color="action"
                      sx={{ fontSize: 16 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "text.secondary" }}
                    >
                      Age: {patient.age}
                    </Typography>
                  </Box>

                  {/* BILL NO */}
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <BadgeIcon
                      fontSize="small"
                      color="action"
                      sx={{ fontSize: 16 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "text.secondary" }}
                    >
                      Bill: #{patient.billNo}
                    </Typography>
                  </Box>

                  {/* PHONE NUMBER - ENHANCED VISIBILITY */}
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    sx={{
                      bgcolor: "primary.50",
                      px: 1,
                      py: 0.2,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "primary.100",
                    }}
                  >
                    <PhoneIcon sx={{ fontSize: 16, color: "primary.main" }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        color: "primary.dark",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {patient.phone || "No Phone"}
                    </Typography>
                  </Box>

                  {getStatusChip(patient.status)}
                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <TimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Visited:{" "}
                      {moment(patient.appointmentDate).format("MMM DD, YYYY")}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <MedicalServicesIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Dr. {doctor?.nameEnglish || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          }
        />
      </ListItemComponent>
    </Fade>
  );
};

export default PatientListItem;
