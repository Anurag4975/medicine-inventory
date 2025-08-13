import { useRef } from "react";
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import { FaPrint } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";

const Receipt = ({ receipt }) => {
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt_${receipt?.id || "unknown"}`,
    onBeforePrint: () => console.log("Printing started"),
    onAfterPrint: () => console.log("Printing finished"),
  });

  // Debug medicines array
  console.log("Medicines:", receipt.medicines);

  return (
    <Paper
      elevation={5}
      sx={{
        p: 1.5,
        flexGrow: 1,
        borderRadius: 2,
        background: "linear-gradient(135deg, #FFFFFF, #F5F7FA)",
        "@media print": {
          background: "none",
          boxShadow: "none",
          padding: 0,
        },
      }}
    >
      <div ref={receiptRef}>
        <Box
          sx={{
            p: 1,
            border: "2px solid #1976D2",
            borderRadius: 2,
            maxHeight: "300px",
            overflowY: "auto",
            "@media print": {
              maxHeight: "none",
              overflowY: "visible",
              border: "1px solid #000",
            },
          }}
        >
          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: "bold", color: "#1976D2" }}
          >
            SADEV MEDICAL HALL
          </Typography>
          <Typography
            align="center"
            sx={{ color: "#455A64", fontSize: "0.9rem" }}
          >
            Birgunj-13, Parsa
          </Typography>
          <Typography
            align="center"
            sx={{ color: "#455A64", fontSize: "0.9rem" }}
          >
            Pan no: 108956245
          </Typography>
          <Typography
            variant="h6"
            align="center"
            sx={{ mt: 1, fontWeight: "bold", color: "#1976D2" }}
          >
            Receipt
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            Bill Number: {receipt.billNumber}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            Patient: {receipt.patient.name}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            Age: {receipt.patient.age}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            Gender: {receipt.patient.gender}
          </Typography>
          {receipt.patient.address && (
            <Typography sx={{ fontSize: "0.9rem" }}>
              Address: {receipt.patient.address}
            </Typography>
          )}
          <Table
            size="small"
            sx={{
              mt: 1,
              "@media print": {
                pageBreakInside: "auto",
                "& tr": {
                  pageBreakInside: "avoid",
                  pageBreakAfter: "auto",
                },
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ background: "#1976D2" }}>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                  }}
                >
                  Medicine
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                  }}
                >
                  Brand
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                  }}
                >
                  Price/Tab
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                  }}
                >
                  Qty
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                  }}
                >
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receipt.medicines.map((med, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ fontSize: "0.8rem" }}>
                    {med.medicineName}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{med.brand}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>
                    NPR {med.pricePerTab.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>
                    {med.quantity}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>
                    NPR {med.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography sx={{ mt: 1, fontSize: "0.9rem" }}>
            Discount: NPR {receipt.discount.toFixed(2)}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            Payment Type:{" "}
            {receipt.paymentType === "fullyPaid"
              ? "Fully Paid"
              : receipt.paymentType === "partiallyPaid"
              ? "Partially Paid"
              : "Credit"}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            Payment Method: {receipt.paymentMethod || "Offline"}
          </Typography>
          {receipt.paymentType === "partiallyPaid" && (
            <>
              <Typography sx={{ fontSize: "0.9rem" }}>
                Paid Amount: NPR {receipt.paidAmount.toFixed(2)}
              </Typography>
              <Typography sx={{ fontSize: "0.9rem" }}>
                Credit Amount: NPR {receipt.creditAmount.toFixed(2)}
              </Typography>
            </>
          )}
          <Typography sx={{ mt: 1, fontWeight: "bold", fontSize: "1rem" }}>
            Total Amount: NPR {receipt.totalAmount.toFixed(2)}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            Sale Date: {new Date(receipt.saleDate).toLocaleString()}
          </Typography>
        </Box>
      </div>
      <Button
        variant="outlined"
        onClick={handlePrint}
        sx={{
          mt: 1,
          mx: "auto",
          display: "block",
          color: "#1976D2",
          borderColor: "#1976D2",
          "&:hover": { borderColor: "#115293", color: "#115293" },
          transition: "all 0.3s ease",
          "@media print": {
            display: "none",
          },
        }}
      >
        <FaPrint style={{ marginRight: "5px" }} /> Print Receipt
      </Button>
    </Paper>
  );
};

export default Receipt;
