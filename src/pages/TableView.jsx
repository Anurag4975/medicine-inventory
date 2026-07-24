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
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Fade,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  Print,
  PictureAsPdf,
  TrendingUp,
  AccountBalance,
  CreditCard,
} from "@mui/icons-material";
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showTotalSales, setShowTotalSales] = useState(false);
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

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });

    const sortedSales = [...filteredSales].sort((a, b) => {
      let aValue, bValue;

      switch (key) {
        case "date":
          aValue = new Date(a.saleDate);
          bValue = new Date(b.saleDate);
          break;
        case "discount":
          aValue = a.discount;
          bValue = b.discount;
          break;
        case "totalAmount":
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case "creditAmount":
          aValue = a.paymentType === "partiallyPaid" ? a.creditAmount : 0;
          bValue = b.paymentType === "partiallyPaid" ? b.creditAmount : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    setFilteredSales(sortedSales);
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpward sx={{ opacity: 0.3, fontSize: 16 }} />;
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUpward sx={{ fontSize: 16, color: "#1976D2" }} />
    ) : (
      <ArrowDownward sx={{ fontSize: 16, color: "#1976D2" }} />
    );
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
          : sale,
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
      0,
    );
    const fullyCreditAmount = salesList
      .filter(
        (sale) => sale.paymentType === "credit" && !sale.creditResolvedDate,
      )
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const partiallyCreditAmount = salesList
      .filter(
        (sale) => sale.paymentType === "partiallyPaid" && sale.creditAmount > 0,
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
      `Sales_Insights_${filter}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const getPaymentChip = (sale) => {
    const config = {
      fullyPaid: {
        label: "Fully Paid",
        color: "#4CAF50",
        bgColor: "#E8F5E8",
        icon: <AccountBalance sx={{ fontSize: 14 }} />,
      },
      partiallyPaid: {
        label: "Partially Paid",
        color: "#FF9800",
        bgColor: "#FFF3E0",
        icon: <CreditCard sx={{ fontSize: 14 }} />,
      },
      credit: {
        label: "Credit",
        color: "#F44336",
        bgColor: "#FFEBEE",
        icon: <TrendingUp sx={{ fontSize: 14 }} />,
      },
    };

    const { label, color, bgColor, icon } =
      config[sale.paymentType] || config.credit;

    return (
      <Chip
        label={label}
        icon={icon}
        size="small"
        sx={{
          backgroundColor: bgColor,
          color: color,
          fontWeight: 600,
          border: `1px solid ${color}20`,
          "& .MuiChip-icon": { color: color },
        }}
      />
    );
  };

  const { totalAmount, fullyCreditAmount, partiallyCreditAmount } =
    calculateTotals(filteredSales);

  return filteredSales.length > 0 ? (
    <Fade in timeout={800}>
      <Box>
        {/* Summary Cards */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Card
            sx={{
              flex: 1,
              minWidth: 200,
              background: "linear-gradient(135deg, #4CAF50 0%, #45A049 100%)",
              color: "white",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(76, 175, 80, 0.3)",
              transition: "transform 0.3s ease",
              cursor: "pointer",
              "&:hover": { transform: "translateY(-4px)" },
            }}
            onClick={() => setShowTotalSales(!showTotalSales)}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total Sales
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                {showTotalSales
                  ? `NPR ${totalAmount.toLocaleString("en-NP", {
                      minimumFractionDigits: 2,
                    })}`
                  : "Click to view"}
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              minWidth: 200,
              background: "linear-gradient(135deg, #F44336 0%, #D32F2F 100%)",
              color: "white",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(244, 67, 54, 0.3)",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "translateY(-4px)" },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccountBalance />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Full Credit
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                NPR{" "}
                {fullyCreditAmount.toLocaleString("en-NP", {
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              minWidth: 200,
              background: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
              color: "white",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(255, 152, 0, 0.3)",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "translateY(-4px)" },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CreditCard />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Partial Credit
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                NPR{" "}
                {partiallyCreditAmount.toLocaleString("en-NP", {
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Main Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
            border: "1px solid #e3f2fd",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div ref={tableRef}>
            <Table sx={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
                  }}
                >
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      fontSize: "0.95rem",
                    }}
                  >
                    Bill No.
                  </TableCell>

                  {/* Sortable Date Column */}
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      cursor: "pointer",
                      userSelect: "none",
                      fontSize: "0.95rem",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                      transition: "background-color 0.2s ease",
                    }}
                    onClick={() => handleSort("date")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      Date
                      {getSortIcon("date")}
                    </Box>
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      fontSize: "0.95rem",
                    }}
                  >
                    Patient
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      fontSize: "0.95rem",
                    }}
                  >
                    Medicines Sold
                  </TableCell>

                  {/* Sortable Discount Column */}
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      cursor: "pointer",
                      userSelect: "none",
                      fontSize: "0.95rem",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                      transition: "background-color 0.2s ease",
                    }}
                    onClick={() => handleSort("discount")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      Discount
                      {getSortIcon("discount")}
                    </Box>
                  </TableCell>

                  {/* Discount By Column (Non-sortable) */}
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      fontSize: "0.95rem",
                    }}
                  >
                    Discount By
                  </TableCell>

                  {/* Sortable Total Amount Column */}
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      cursor: "pointer",
                      userSelect: "none",
                      fontSize: "0.95rem",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                      transition: "background-color 0.2s ease",
                    }}
                    onClick={() => handleSort("totalAmount")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      Total Amount
                      {getSortIcon("totalAmount")}
                    </Box>
                  </TableCell>

                  {/* Sortable Credit Amount Column */}
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      cursor: "pointer",
                      userSelect: "none",
                      fontSize: "0.95rem",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                      transition: "background-color 0.2s ease",
                    }}
                    onClick={() => handleSort("creditAmount")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      Credit Amount
                      {getSortIcon("creditAmount")}
                    </Box>
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      fontSize: "0.95rem",
                    }}
                  >
                    Payment Status
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      fontSize: "0.95rem",
                    }}
                  >
                    Payment Method
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      fontSize: "0.95rem",
                    }}
                  >
                    Credit Resolved
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      py: 3,
                      fontSize: "0.95rem",
                    }}
                  >
                    Seller
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales.map((sale, index) => (
                  <TableRow
                    key={sale.id}
                    onClick={() => handleRowClick(sale)}
                    sx={{
                      cursor:
                        (sale.paymentType === "credit" &&
                          !sale.creditResolvedDate) ||
                        (sale.paymentType === "partiallyPaid" &&
                          sale.creditAmount > 0)
                          ? "pointer"
                          : "default",
                      backgroundColor: "white",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                        backgroundColor: "#f8f9fa",
                        "& .MuiTableCell-root": {
                          borderBottom: "1px solid #e3f2fd",
                        },
                      },
                      "&:nth-of-type(even)": {
                        backgroundColor: "#fafafa",
                      },
                      "&:nth-of-type(even):hover": {
                        backgroundColor: "#f0f0f0",
                      },
                      borderLeft:
                        sale.paymentType === "credit" &&
                        !sale.creditResolvedDate
                          ? "4px solid #F44336"
                          : sale.paymentType === "partiallyPaid" &&
                              sale.creditAmount > 0
                            ? "4px solid #FF9800"
                            : "4px solid #4CAF50",
                    }}
                  >
                    <TableCell
                      sx={{
                        py: 2.5,
                        fontWeight: 600,
                        color: "#1A237E",
                        fontSize: "0.9rem",
                      }}
                    >
                      #{sale.billNumber}
                    </TableCell>
                    <TableCell sx={{ py: 2.5, fontSize: "0.9rem" }}>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#424242" }}
                        >
                          {new Date(sale.saleDate).toLocaleDateString("en-GB")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#757575" }}>
                          {new Date(sale.saleDate).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#1A237E",
                          fontSize: "0.9rem",
                        }}
                      >
                        {sale.patient.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5, maxWidth: 200 }}>
                      <Box sx={{ maxHeight: 80, overflowY: "auto" }}>
                        {sale.medicines.map((med, idx) => (
                          <Chip
                            key={med.id}
                            label={`${med.medicineName} (${med.quantity})`}
                            size="small"
                            sx={{
                              mr: 0.5,
                              mb: 0.5,
                              backgroundColor: "#e3f2fd",
                              color: "#1565C0",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: sale.discount > 0 ? "#4CAF50" : "#757575",
                          fontSize: "0.9rem",
                        }}
                      >
                        NPR {sale.discount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      {sale.discount > 0 && sale.discountBy ? (
                        <Chip
                          label={sale.discountBy}
                          size="small"
                          sx={{
                            backgroundColor: "#fff3e0",
                            color: "#e65100",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ color: "#bdbdbd", fontSize: "0.85rem" }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "#1A237E",
                          fontSize: "1rem",
                        }}
                      >
                        NPR{" "}
                        {sale.totalAmount.toLocaleString("en-NP", {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            sale.paymentType === "partiallyPaid" &&
                            sale.creditAmount > 0
                              ? "#FF9800"
                              : "#757575",
                          fontSize: "0.9rem",
                        }}
                      >
                        {sale.paymentType === "partiallyPaid"
                          ? `NPR ${sale.creditAmount.toFixed(2)}`
                          : "NPR 0.00"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      {getPaymentChip(sale)}
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip
                        label={sale.paymentMethod || "Offline"}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: "#e0e0e0",
                          color: "#616161",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            sale.paymentType === "fullyPaid" ||
                            sale.creditResolvedDate
                              ? "#4CAF50"
                              : "#F44336",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                        }}
                      >
                        {sale.paymentType === "fullyPaid"
                          ? new Date(sale.saleDate).toLocaleDateString("en-GB")
                          : sale.creditResolvedDate
                            ? new Date(
                                sale.creditResolvedDate,
                              ).toLocaleDateString("en-GB")
                            : "Pending"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip
                        label={sale.seller?.role || "Admin"}
                        size="small"
                        sx={{
                          backgroundColor: "#f3e5f5",
                          color: "#7B1FA2",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Action Buttons */}
          <Box
            sx={{
              p: 3,
              background: "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Tooltip title="Print Table" arrow>
                <Button
                  variant="contained"
                  startIcon={<Print />}
                  onClick={handlePrint}
                  sx={{
                    background:
                      "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    boxShadow: "0 4px 15px rgba(25, 118, 210, 0.3)",
                    "&:hover": {
                      boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Print
                </Button>
              </Tooltip>

              <Tooltip title="Save as PDF" arrow>
                <Button
                  variant="contained"
                  startIcon={<PictureAsPdf />}
                  onClick={handleSaveAsPDF}
                  sx={{
                    background:
                      "linear-gradient(135deg, #D81B60 0%, #C2185B 100%)",
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    boxShadow: "0 4px 15px rgba(216, 27, 96, 0.3)",
                    "&:hover": {
                      boxShadow: "0 6px 20px rgba(216, 27, 96, 0.4)",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Save PDF
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Enhanced Modal */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 4,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              color: "#1A237E",
              fontSize: "1.3rem",
              pb: 1,
              background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalance />
              Resolve Credit Payment
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            <Typography sx={{ mb: 3, color: "#424242", fontSize: "1rem" }}>
              Confirm to mark this credit as fully resolved and paid.
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f5f5f5",
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, color: "#1A237E" }}
              >
                Patient: {selectedSale?.patient.name}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, color: "#1A237E" }}
              >
                Total Amount: NPR{" "}
                {selectedSale?.totalAmount.toLocaleString("en-NP", {
                  minimumFractionDigits: 2,
                })}
              </Typography>
              {selectedSale?.paymentType === "partiallyPaid" && (
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#FF9800" }}
                >
                  Outstanding Credit: NPR{" "}
                  {selectedSale?.creditAmount.toLocaleString("en-NP", {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={() => setOpenModal(false)}
              sx={{
                color: "#757575",
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveCredit}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #4CAF50 0%, #45A049 100%)",
                borderRadius: 2,
                px: 3,
                py: 1,
                boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(76, 175, 80, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.3s ease",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Resolve Credit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  ) : (
    <Fade in timeout={600}>
      <Paper
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: 4,
          background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
          border: "1px solid #e3f2fd",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#B0BEC5",
            fontWeight: 500,
            fontSize: "1.1rem",
          }}
        >
          No sales data available for the selected{" "}
          {filter === "custom" && customDate
            ? customDate.toLocaleDateString("en-GB")
            : filter}{" "}
          period.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#90A4AE",
            mt: 1,
            fontSize: "0.9rem",
          }}
        >
          Try adjusting your filters or date range to view sales data.
        </Typography>
      </Paper>
    </Fade>
  );
};

export default TableView;
