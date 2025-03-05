import { useEffect, useState, useRef } from "react";
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import { useReactToPrint } from "react-to-print"; // For printing
import jsPDF from "jspdf"; // For PDF generation
import html2canvas from "html2canvas"; // For converting table to canvas

function Insights() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("day");
  const [customDate, setCustomDate] = useState(null);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(); // Ref for the table

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesCollection = collection(db, "Sales");
        const salesSnapshot = await getDocs(salesCollection);
        const salesList = salesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSales(salesList);
        filterSales(salesList, filter, customDate);
      } catch (error) {
        console.error("Error fetching sales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales(sales, filter, customDate);
  }, [sales, filter, customDate]);

  const filterSales = (salesData, filterType, selectedDate) => {
    const now = new Date();
    let filtered = [];

    if (filterType === "day") {
      filtered = salesData.filter((sale) => {
        const saleDate = new Date(sale.saleDate);
        return (
          saleDate.getDate() === now.getDate() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === "month") {
      filtered = salesData.filter((sale) => {
        const saleDate = new Date(sale.saleDate);
        return (
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === "year") {
      filtered = salesData.filter((sale) => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.getFullYear() === now.getFullYear();
      });
    } else if (filterType === "custom" && selectedDate) {
      filtered = salesData.filter((sale) => {
        const saleDate = new Date(sale.saleDate);
        return (
          saleDate.getDate() === selectedDate.getDate() &&
          saleDate.getMonth() === selectedDate.getMonth() &&
          saleDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }

    setFilteredSales(filtered);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    if (e.target.value !== "custom") {
      setCustomDate(null);
    }
  };

  const calculateTotal = (salesList) =>
    salesList.reduce((sum, sale) => sum + sale.totalAmount, 0);

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => tableRef.current,
    documentTitle: `Sales_Insights_${filter}_${
      new Date().toISOString().split("T")[0]
    }`,
  });

  // PDF generation handler
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

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sales Insights
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select value={filter} onChange={handleFilterChange} label="Filter">
              <MenuItem value="day">Day (Today)</MenuItem>
              <MenuItem value="month">Month (Current)</MenuItem>
              <MenuItem value="year">Year (Current)</MenuItem>
              <MenuItem value="custom">Custom Date</MenuItem>
            </Select>
          </FormControl>
          {filter === "custom" && (
            <DatePicker
              label="Select Date"
              value={customDate}
              onChange={(newValue) => setCustomDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
          )}
        </Box>
        {filteredSales.length > 0 ? (
          <>
            <div ref={tableRef}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Medicines Sold</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Seller</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
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
                      <TableCell>{sale.seller?.role || "Unknown"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Total Sales: NPR {calculateTotal(filteredSales).toFixed(2)}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handlePrint}
                sx={{ mr: 2 }}
              >
                Print Table
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleSaveAsPDF}
              >
                Save as PDF
              </Button>
            </Box>
          </>
        ) : (
          <Typography>
            No data available for the selected{" "}
            {filter === "custom" && customDate
              ? customDate.toLocaleDateString()
              : filter}
            .
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default Insights;
