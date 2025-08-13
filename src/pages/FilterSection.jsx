import { useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const FilterSection = ({
  filter,
  setFilter,
  customDate,
  setCustomDate,
  paymentFilter,
  setPaymentFilter,
  searchQuery,
  setSearchQuery,
  sales,
  setSales,
  setFilteredSales,
  setLoading,
}) => {
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
        filterSales(salesList, filter, customDate, paymentFilter, searchQuery);
      } catch (error) {
        console.error("Error fetching sales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales(sales, filter, customDate, paymentFilter, searchQuery);
  }, [sales, filter, customDate, paymentFilter, searchQuery]);

  const filterSales = (
    salesData,
    filterType,
    selectedDate,
    paymentType,
    query
  ) => {
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
    } else {
      filtered = salesData;
    }

    if (paymentType === "credit") {
      filtered = filtered.filter(
        (sale) => sale.paymentType === "credit" && !sale.creditResolvedDate
      );
    } else if (paymentType === "partiallyPaid") {
      filtered = filtered.filter(
        (sale) => sale.paymentType === "partiallyPaid" && sale.creditAmount > 0
      );
    } else if (paymentType === "fullyPaid") {
      filtered = filtered.filter((sale) => sale.paymentType === "fullyPaid");
    }

    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        (sale) =>
          sale.patient.name.toLowerCase().includes(lowerCaseQuery) ||
          sale.medicines.some((med) =>
            med.medicineName.toLowerCase().includes(lowerCaseQuery)
          ) ||
          (sale.billNumber &&
            sale.billNumber.toLowerCase().includes(lowerCaseQuery))
      );
    }

    filtered.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    setFilteredSales(filtered);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper
        elevation={5}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: "linear-gradient(135deg, #ECEFF1, #CFD8DC)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontWeight: "bold" }}>Filter</InputLabel>
            <Select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                if (e.target.value !== "custom") setCustomDate(null);
              }}
              label="Filter"
              sx={{ borderRadius: 2 }}
            >
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
              renderInput={(params) => (
                <TextField {...params} sx={{ borderRadius: 2 }} />
              )}
              sx={{ transition: "all 0.3s ease" }}
            />
          )}
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontWeight: "bold" }}>Payment</InputLabel>
            <Select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              label="Payment"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="fullyPaid">Fully Paid</MenuItem>
              <MenuItem value="partiallyPaid">Partially Paid</MenuItem>
              <MenuItem value="credit">Credit</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Search Customer/Medicine/Bill No."
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, borderRadius: 2, transition: "all 0.3s ease" }}
          />
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default FilterSection;
