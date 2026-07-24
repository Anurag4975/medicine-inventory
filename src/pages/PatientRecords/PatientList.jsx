import React from "react";
import { List, Box, Typography, Divider } from "@mui/material";
import PatientListItem from "./PatientListItem";

const PatientList = ({
  patients,
  isWaitingList,
  doctors,
  onSelectPatient,
  onCancelPatient,
  onDeletePatient,

  setPrintPatient,
}) => {
  return (
    <Box sx={{ mt: 2, maxHeight: 600, overflow: "auto" }}>
      <List>
        {patients.length > 0 ? (
          patients.map((patient, index) => (
            <React.Fragment key={patient.id}>
              <PatientListItem
                patient={patient}
                isWaitingList={isWaitingList}
                doctor={doctors[patient.doctorId]}
                onSelectPatient={onSelectPatient}
                onCancelPatient={onCancelPatient}
                onDeletePatient={onDeletePatient}
                setPrintPatient={setPrintPatient}
              />
              {index < patients.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ textAlign: "center", p: 4, color: "text.secondary" }}>
            <Typography>
              {isWaitingList
                ? "No patients are currently waiting."
                : "No records found for the selected date."}
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

export default PatientList;
