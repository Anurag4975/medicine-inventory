import { useRef, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const TableView = ({
  filteredSales,
  setSales,
  setFilteredSales,
  filter,
  customDate,
  paymentFilter,
  searchQuery,
}) => {
  const [selectedSale, setSelectedSale] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const tableRef = useRef();

  const handleRowClick = (sale) => {
    if (
      (sale.paymentType === "credit" && !sale.creditResolvedDate) ||
      (sale.paymentType === "partiallyPaid" && sale.creditAmount > 0)
    ) {
      setSelectedSale(sale);
      setOpenModal(true);
    }
  };

  const handleResolveCredit = async () => {
    if (!selectedSale) return;
    try {
      const saleRef = doc(db, "Sales", selectedSale.id);
      await updateDoc(saleRef, {
        paymentType: "fullyPaid",
        creditResolvedDate: new Date().toISOString(),
        creditAmount: 0,
      });
      const updatedSales = filteredSales.map((sale) =>
        sale.id === selectedSale.id
          ? {
              ...sale,
              paymentType: "fullyPaid",
              creditResolvedDate: new Date().toISOString(),
              creditAmount: 0,
            }
          : sale
      );
      setSales(updatedSales);
      setFilteredSales(updatedSales);
      alert("Credit resolved successfully!");
    } catch (error) {
      console.error("Error resolving credit:", error);
      alert("Failed to resolve credit: " + error.message);
    } finally {
      setOpenModal(false);
      setSelectedSale(null);
    }
  };

  const calculateTotals = (salesList) => {
    const totalAmount = salesList.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const fullyCreditAmount = salesList
      .filter(
        (sale) => sale.paymentType === "credit" && !sale.creditResolvedDate
      )
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const partiallyCreditAmount = salesList
      .filter(
        (sale) => sale.paymentType === "partiallyPaid" && sale.creditAmount > 0
      )
      .reduce((sum, sale) => sum + sale.creditAmount, 0);
    return { totalAmount, fullyCreditAmount, partiallyCreditAmount };
  };

  const handlePrint = useReactToPrint({
    content: () => tableRef.current,
    documentTitle: `Sales_Insights_${filter}_${
      new Date().toISOString().split("T")[0]
    }`,
  });

  const handleSaveAsPDF = async () => {
    const element = tableRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(
      `Sales_Insights_${filter}_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const { totalAmount, fullyCreditAmount, partiallyCreditAmount } =
    calculateTotals(filteredSales);

  return filteredSales.length > 0 ? (
    <>
      <Paper
        elevation={5}
        sx={{
          p: 3,
          borderRadius: 3,
          overflow: "hidden",
          animation: "fadeInUp 1s ease",
        }}
      >
        <div ref={tableRef}>
          <Table sx={{ borderCollapse: "separate", borderSpacing: "0 10px" }}>
            <TableHead>
              <TableRow sx={{ background: "#1A237E", color: "white" }}>
                {[
                  "Bill No.",
                  "Date",
                  "Patient",
                  "Medicines Sold",
                  "Discount",
                  "Total Amount",
                  "Credit Amount",
                  "Payment",
                  "Payment Method",
                  "Credit Resolved",
                  "Seller",
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{ color: "white", fontWeight: "bold", py: 2 }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow
                  key={sale.id}
                  hover
                  onClick={() => handleRowClick(sale)}
                  sx={{
                    cursor:
                      (sale.paymentType === "credit" &&
                        !sale.creditResolvedDate) ||
                      (sale.paymentType === "partiallyPaid" &&
                        sale.creditAmount > 0)
                        ? "pointer"
                        : "default",
                    backgroundColor:
                      sale.paymentType === "partiallyPaid" &&
                      sale.creditAmount > 0
                        ? "#FFF3E0"
                        : sale.paymentType === "credit" &&
                          !sale.creditResolvedDate
                        ? "#FFEBEE"
                        : "#FFFFFF",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    },
                    borderRadius: 2,
                  }}
                >
                  <TableCell>{sale.billNumber}</TableCell>
                  <TableCell>
                    {new Date(sale.saleDate).toLocaleString()}
                  </TableCell>
                  <TableCell>{sale.patient.name}</TableCell>
                  <TableCell>
                    {sale.medicines.map((med) => (
                      <div key={med.id}>
                        {med.medicineName} ({med.quantity})
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>NPR {sale.discount.toFixed(2)}</TableCell>
                  <TableCell>NPR {sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    {sale.paymentType === "partiallyPaid"
                      ? `NPR ${sale.creditAmount.toFixed(2)}`
                      : "NPR 0.00"}
                  </TableCell>
                  <TableCell>
                    {sale.paymentType === "fullyPaid"
                      ? "Fully Paid"
                      : sale.paymentType === "partiallyPaid"
                      ? "Partially Paid"
                      : "Credit"}
                  </TableCell>
                  <TableCell>{sale.paymentMethod || "Offline"}</TableCell>
                  <TableCell>
                    {sale.paymentType === "fullyPaid"
                      ? new Date(sale.saleDate).toLocaleDateString()
                      : sale.creditResolvedDate
                      ? new Date(sale.creditResolvedDate).toLocaleDateString()
                      : "Not Resolved"}
                  </TableCell>
                  <TableCell>{sale.seller?.role || "Admin"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#4CAF50" }}
            >
              Total Amount: NPR {totalAmount.toFixed(2)}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#F44336" }}
            >
              Fully Credit: NPR {fullyCreditAmount.toFixed(2)}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#FF9800" }}
            >
              Partially Credit: NPR {partiallyCreditAmount.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handlePrint}
              sx={{
                background: "#1976D2",
                "&:hover": { background: "#115293" },
                transition: "all 0.3s ease",
              }}
            >
              Print Table
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveAsPDF}
              sx={{
                background: "#D81B60",
                "&:hover": { background: "#AD1457" },
                transition: "all 0.3s ease",
              }}
            >
              Save as PDF
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            p: 2,
            animation: "zoomIn 0.3s ease",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#1A237E" }}>
          Resolve Credit
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to mark this credit as resolved?
          </Typography>
          <Typography variant="subtitle1">
            Patient: {selectedSale?.patient.name}
          </Typography>
          <Typography variant="subtitle1">
            Total Amount: NPR {selectedSale?.totalAmount.toFixed(2)}
          </Typography>
          {selectedSale?.paymentType === "partiallyPaid" && (
            <Typography variant="subtitle1">
              Credit Amount: NPR {selectedSale?.creditAmount.toFixed(2)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} sx={{ color: "#757575" }}>
            Cancel
          </Button>
          <Button
            onClick={handleResolveCredit}
            sx={{
              background: "#4CAF50",
              "&:hover": { background: "#388E3C" },
              color: "white",
            }}
          >
            Resolve Credit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  ) : (
    <Typography sx={{ textAlign: "center", color: "#B0BEC5", mt: 4 }}>
      No data available for the selected{" "}
      {filter === "custom" && customDate
        ? customDate.toLocaleDateString()
        : filter}
      .
    </Typography>
  );
};

export default TableView;
