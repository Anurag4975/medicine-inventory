import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import moment from "moment";

const logo = "../../doc.png";
const clinicName = "SADEV MEDICAL HALL";
const clinicAddress =
  "Pratima Chowk, Birgunj - 13, Parsa, Madhesh Province, Nepal";
const clinicAddressExtra = "(हनुमान  मन्दिरको ठीक पछाडि)";
const contactLine = "📞 +977-9809246610 | +977-9709498572 | 9861026910";

const OPDTicket = React.forwardRef(
  (
    {
      patient,
      diagnosis,
      tests = [],
      prescription = [],
      knownCaseOf,
      chiefComplaints,
      onExamination,
      medicalAdvice,
      testResults = {},
    },
    ref,
  ) => {
    const [doctor, setDoctor] = useState(null);
    useEffect(() => {
      if (!patient?.doctorId) return;
      const fetchDoctor = async () => {
        const snap = await getDoc(doc(db, "Doctors", patient.doctorId));
        if (snap.exists()) setDoctor(snap.data());
      };
      fetchDoctor();
    }, [patient?.doctorId]);

    if (!patient || !doctor) return null;

    const degreesEng =
      doctor.degrees
        ?.map(
          (d) => `${d.degreeEnglish?.trim()} (${d.institutionEnglish?.trim()})`,
        )
        .join("\n") || "";
    const degreesNep =
      doctor.degrees
        ?.map(
          (d) => `${d.degreeNepali?.trim()} (${d.institutionNepali?.trim()})`,
        )
        .join("\n") || "";

    return (
      <Box
        ref={ref}
        sx={{
          width: "210mm",
          minHeight: "297mm",
          p: "12px 23px 9px 38px",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Clinic header */}
        <Typography
          variant="h4"
          align="center"
          sx={{ color: "#1e90ff", fontWeight: "bold", fontSize: 22, mb: 0.5 }}
        >
          {clinicName}
        </Typography>
        <Typography
          variant="body2"
          align="center"
          sx={{ fontSize: 12, mb: 0.5 }}
        >
          {clinicAddress}
        </Typography>

        {/* Doctor header */}
        <Grid container sx={{ mb: 1 }}>
          <Grid item xs={4}>
            <Typography sx={{ fontSize: 12, fontWeight: "bold" }}>
              N.M.C. NO. {doctor.nmcNumber}
            </Typography>
            <Typography sx={{ fontSize: 14, whiteSpace: "pre-line" }}>
              <strong>Dr. {doctor.nameEnglish}</strong>
              <br />
              {degreesEng}
              <br />
              <strong>{doctor.designationEnglish}</strong>
            </Typography>
          </Grid>
          <Grid
            item
            xs={4}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="Clinic Logo"
              sx={{ maxWidth: 100, maxHeight: 100 }}
            />
          </Grid>
          <Grid item xs={4} sx={{ textAlign: "right" }}>
            <Typography sx={{ fontSize: 12, fontWeight: "bold" }}>
              N.M.C. NO. {doctor.nmcNumber}
            </Typography>
            <Typography sx={{ fontSize: 14 }}>
              {doctor.degrees?.[0]?.degreeNepali} (
              <span style={{ whiteSpace: "nowrap" }}>
                {doctor.degrees?.[0]?.institutionNepali}
              </span>
              )
              <br />
              {doctor.degrees?.[1]?.degreeNepali} (
              <span style={{ whiteSpace: "nowrap" }}>
                {doctor.degrees?.[1]?.institutionNepali}
              </span>
              )
              <br />
              <strong>{doctor.designationNepali}</strong>
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ borderTop: "2px solid #000", my: 1 }} />

        {/* Patient block */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={4}>
            Name:{" "}
            <Box
              component="span"
              sx={{
                borderBottom: "1px dotted #000",
                minWidth: 80,
                ml: 0.5,
                display: "inline-block",
              }}
            >
              {patient.name}
            </Box>
          </Grid>
          <Grid item xs={4}>
            Age:{" "}
            <Box
              component="span"
              sx={{
                borderBottom: "1px dotted #000",
                minWidth: 30,
                ml: 0.5,
                display: "inline-block",
              }}
            >
              {patient.age}
            </Box>
          </Grid>
          <Grid item xs={4}>
            Sex:{" "}
            <Box
              component="span"
              sx={{
                borderBottom: "1px dotted #000",
                minWidth: 30,
                ml: 0.5,
                display: "inline-block",
              }}
            >
              {patient.gender}
            </Box>
          </Grid>
          <Grid item xs={4}>
            Address:{" "}
            <Box
              component="span"
              sx={{
                borderBottom: "1px dotted #000",
                minWidth: 80,
                ml: 0.5,
                display: "inline-block",
              }}
            >
              {patient.address}
            </Box>
          </Grid>
          <Grid item xs={4}>
            Date:{" "}
            <Box
              component="span"
              sx={{
                borderBottom: "1px dotted #000",
                minWidth: 80,
                ml: 0.5,
                display: "inline-block",
              }}
            >
              {moment(patient.appointmentDate).format("MMM D, YYYY")}
            </Box>
          </Grid>
          <Grid item xs={4}>
            Patient ID:{" "}
            <Box
              component="span"
              sx={{
                borderBottom: "1px dotted #000",
                minWidth: 80,
                ml: 0.5,
                display: "inline-block",
              }}
            >
              {patient.billNo}
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ borderTop: "2px solid #000", my: 1 }} />

        {/* Main Content: Two Columns */}
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          {/* LEFT COLUMN */}
          <Grid item xs={6}>
            {/* Known Case Of */}
            <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
              K/C/O
            </Typography>
            <Box
              sx={{
                minHeight: 30,
                p: 1,
                fontSize: 12,
                mb: 2,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                borderBottom: "1px dotted #000",
              }}
            >
              {knownCaseOf ||
                "..................................................................."}
            </Box>
            {/* C/C (Chief Complaints) */}
            <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
              C/C
            </Typography>
            <Box
              sx={{
                minHeight: 40,
                p: 1,
                fontSize: 12,
                mb: 2,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                //borderBottom: "1px dotted #000",
              }}
            >
              {chiefComplaints || "No chief complaints provided."}
            </Box>
            {/* Advice (Tests & Results) */}
            {tests && tests.length > 0 && (
              <>
                <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
                  Advice
                </Typography>
                <Table size="small" sx={{ width: "100%", fontSize: 14, mb: 2 }}>
                  <TableBody>
                    {tests.map((test, i) => (
                      <TableRow key={i}>
                        <TableCell
                          sx={{
                            width: "40%",
                            borderBottom: "none",
                            p: "2px 4px",
                            fontWeight: "bold",
                            fontSize: 12,
                          }}
                        >
                          {test}:
                        </TableCell>
                        <TableCell
                          sx={{
                            width: "60%",
                            borderBottom: "none",
                            p: "2px 4px",
                            fontSize: 12,
                          }}
                        >
                          <Box
                            sx={{
                              whiteSpace: "pre-wrap",
                              // borderBottom: "1px dotted #000",
                              minHeight: "18px",
                              fontSize: 12,
                              lineHeight: 1.4,
                            }}
                          >
                            {testResults[test] || "No results available."}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Grid>
          {/* RIGHT COLUMN */}
          <Grid item xs={6}>
            {/* On Examination */}
            <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
              On Examination
            </Typography>
            <Box
              sx={{
                minHeight: 40,
                p: 1,
                fontSize: 12,
                mb: 2,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                // borderBottom: "1px dotted #000",
              }}
            >
              {onExamination || "No examination details provided."}
            </Box>
            {/* Diagnosis */}
            <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
              Diagnosis
            </Typography>
            <Box
              sx={{
                minHeight: 40,
                p: 1,
                fontSize: 12,
                mb: 2,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                //borderBottom: "1px dotted #000",
              }}
            >
              {diagnosis || "No diagnosis provided."}
            </Box>
            {/* Prescription */}
            <Typography sx={{ fontWeight: "bold", mt: 1, mb: 1, fontSize: 14 }}>
              R<sub>x</sub>
            </Typography>
            <Box component="table" sx={{ fontSize: 11, width: "100%", mb: 1 }}>
              <tbody>
                {prescription
                  ?.filter((p) => p.medicine)
                  .map((p, i) => (
                    <tr key={i}>
                      <td style={{ width: "5%", verticalAlign: "top" }}>
                        {i + 1}.
                      </td>
                      <td style={{ width: "10%", verticalAlign: "top" }}>
                        {p.type}
                      </td>
                      <td style={{ width: "15%", verticalAlign: "top" }}>
                        {p.medicine}
                      </td>
                      <td style={{ width: "20%", verticalAlign: "top" }}>
                        {p.note}
                      </td>
                    </tr>
                  ))}
                {(!prescription ||
                  prescription.filter((p) => p.medicine).length === 0) && (
                  <tr>
                    <td colSpan={4}>
                      ..................................................................
                    </td>
                  </tr>
                )}
              </tbody>
            </Box>
            {/* Medical Advice */}
            <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>
              Medical Advice
            </Typography>
            <Box
              sx={{
                minHeight: 50,
                p: 1,
                fontSize: 12,
                mb: 2,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {medicalAdvice ||
                "..................................................................."}
            </Box>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            left: 38,
            right: 23,
            textAlign: "center",
            fontSize: 12,
            borderTop: "1px solid #000",
            pt: 1,
          }}
        >
          <Typography sx={{ fontSize: 12 }}>
            नोट १४ दिन पछि पुनः फी लाग्ने छ।
          </Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: 12 }}>
            {clinicName}
          </Typography>
          <Typography sx={{ fontSize: 12 }}>
            {clinicAddress} {clinicAddressExtra}
          </Typography>
          <Typography sx={{ fontSize: 12 }}>{contactLine}</Typography>
        </Box>
      </Box>
    );
  },
);

export default OPDTicket;
