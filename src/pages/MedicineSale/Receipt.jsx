import { useRef } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FaPrint } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";

const Receipt = ({ receipt }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt_${receipt?.billNumber || "unknown"}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 1.5 },
        borderRadius: 2,
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #dbeafe",
        boxShadow: "0 1px 6px rgba(0, 0, 0, 0.05)",
        "@media print": {
          background: "none",
          boxShadow: "none",
          padding: 0,
          border: "none",
        },
      }}
    >
      {/* Print-optimized receipt (80mm thermal) */}
      <div ref={receiptRef}>
        <Box
          sx={{
            maxWidth: "80mm",
            margin: "0 auto",
            fontFamily: "'Courier New', monospace",
            fontSize: "11px",
            lineHeight: "1.3",
            color: "#000",
            bgcolor: "#fff",
            p: 1.5,
            "@media print": {
              maxWidth: "100%",
              padding: "6px",
              fontSize: "10px",
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              textAlign: "center",
              mb: 1,
              pb: 0.75,
              borderBottom: "2px dashed #000",
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "0.5px",
                mb: 0.3,
                "@media print": { fontSize: "13px" },
              }}
            >
              SADEV MEDICAL HALL
            </Typography>
            <Typography
              sx={{ fontSize: "10px", "@media print": { fontSize: "9px" } }}
            >
              Birgunj-13, Parsa
            </Typography>
            <Typography
              sx={{ fontSize: "10px", "@media print": { fontSize: "9px" } }}
            >
              PAN: 108956245
            </Typography>
          </Box>

          {/* Bill Info */}
          <Box sx={{ mb: 1 }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: "11px",
                mb: 0.3,
                textAlign: "center",
              }}
            >
              CASH RECEIPT
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
              }}
            >
              <span>Bill:</span>
              <span style={{ fontWeight: "bold" }}>{receipt.billNumber}</span>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
              }}
            >
              <span>Date:</span>
              <span>
                {new Date(receipt.saleDate).toLocaleString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </Box>
          </Box>

          {/* Patient */}
          <Box sx={{ mb: 1, pb: 0.75, borderBottom: "1px dashed #000" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
              }}
            >
              <span>Patient:</span>
              <span style={{ fontWeight: "bold" }}>{receipt.patient.name}</span>
            </Box>
            {receipt.patient.age && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                }}
              >
                <span>Age/Gender:</span>
                <span>
                  {receipt.patient.age}Y / {receipt.patient.gender}
                </span>
              </Box>
            )}
            {receipt.patient.phone && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                }}
              >
                <span>Phone:</span>
                <span>{receipt.patient.phone}</span>
              </Box>
            )}
          </Box>

          {/* Items Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "3fr 1fr 1fr 1fr",
              gap: 0.3,
              fontSize: "9px",
              fontWeight: "bold",
              pb: 0.3,
              borderBottom: "1px solid #000",
              mb: 0.3,
            }}
          >
            <span>ITEM</span>
            <span style={{ textAlign: "right" }}>RATE</span>
            <span style={{ textAlign: "right" }}>QTY</span>
            <span style={{ textAlign: "right" }}>AMT</span>
          </Box>

          {/* Items */}
          <Box sx={{ mb: 0.75 }}>
            {receipt.medicines.map((med, index) => (
              <Box key={index} sx={{ mb: 0.3 }}>
                <Box sx={{ fontSize: "10px", fontWeight: "bold" }}>
                  {med.medicineName}
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "3fr 1fr 1fr 1fr",
                    gap: 0.3,
                    fontSize: "9px",
                    color: "#333",
                  }}
                >
                  <span style={{ fontSize: "8px" }}>({med.brand})</span>
                  <span style={{ textAlign: "right" }}>
                    {med.pricePerTab.toFixed(2)}
                  </span>
                  <span style={{ textAlign: "right" }}>{med.quantity}</span>
                  <span style={{ textAlign: "right", fontWeight: "bold" }}>
                    {med.total.toFixed(2)}
                  </span>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Totals */}
          <Box sx={{ borderTop: "1px solid #000", pt: 0.3, mb: 0.3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
              }}
            >
              <span>Subtotal:</span>
              <span>
                NPR {(receipt.totalAmount + receipt.discount).toFixed(2)}
              </span>
            </Box>
            {receipt.discount > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                }}
              >
                <span>Discount:</span>
                <span>- NPR {receipt.discount.toFixed(2)}</span>
              </Box>
            )}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                fontWeight: "bold",
                mt: 0.3,
                pt: 0.3,
                borderTop: "2px solid #000",
              }}
            >
              <span>TOTAL:</span>
              <span>NPR {receipt.totalAmount.toFixed(2)}</span>
            </Box>
          </Box>

          {/* Payment */}
          <Box
            sx={{
              mb: 1,
              fontSize: "9px",
              borderTop: "1px dashed #000",
              pt: 0.3,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Payment:</span>
              <span style={{ fontWeight: "bold" }}>
                {receipt.paymentType === "fullyPaid"
                  ? "PAID"
                  : receipt.paymentType === "partiallyPaid"
                  ? "PARTIAL"
                  : "CREDIT"}
              </span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Method:</span>
              <span>
                {receipt.paymentMethod === "Online" ? "DIGITAL" : "CASH"}
              </span>
            </Box>
            {receipt.paymentType === "partiallyPaid" && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 0.2,
                  }}
                >
                  <span>Paid:</span>
                  <span>NPR {receipt.paidAmount.toFixed(2)}</span>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    color: "#dc2626",
                  }}
                >
                  <span>Due:</span>
                  <span>NPR {receipt.creditAmount.toFixed(2)}</span>
                </Box>
              </>
            )}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              textAlign: "center",
              fontSize: "9px",
              pt: 0.75,
              borderTop: "2px dashed #000",
            }}
          >
            <Typography sx={{ fontSize: "9px", mb: 0.3 }}>
              Thank you for your visit!
            </Typography>
            <Typography sx={{ fontSize: "8px", fontStyle: "italic" }}>
              Check medicines before leaving
            </Typography>
            <Typography sx={{ fontSize: "8px", mt: 0.3 }}>
              No exchange/refund
            </Typography>
          </Box>
        </Box>
      </div>

      {/* Print Button */}
      <Button
        variant="contained"
        onClick={handlePrint}
        fullWidth
        size="small"
        sx={{
          mt: 1,
          bgcolor: "#0369a1",
          "&:hover": {
            bgcolor: "#0c4a6e",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(3, 105, 161, 0.3)",
          },
          transition: "all 0.15s ease",
          borderRadius: 1.5,
          py: 0.75,
          fontWeight: 700,
          fontSize: "0.8rem",
          textTransform: "none",
          letterSpacing: "0.2px",
          boxShadow: "0 2px 8px rgba(3, 105, 161, 0.2)",
          "@media print": {
            display: "none",
          },
        }}
      >
        <FaPrint style={{ marginRight: "6px", fontSize: "0.75rem" }} /> Print
        Receipt
      </Button>
    </Paper>
  );
};

export default Receipt;
