import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { FaPills } from "react-icons/fa";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase"; // Adjust the import path as needed
import StockTable from "./Stock/StockTable";
import StockAddDialog from "./Stock/StockAddDialog";

function Stock() {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [showNearExpiry, setShowNearExpiry] = useState(false);
  const [nearExpiryStocks, setNearExpiryStocks] = useState([]);

  const currentDate = new Date("2025-04-02"); // Current date as per your setup

  const toDateSafe = (value) => {
    if (value && typeof value.toDate === "function") return value.toDate();
    else if (value instanceof Date) return value;
    else if (typeof value === "string" || typeof value === "number")
      return new Date(value);
    return null;
  };

  // Fetch all stocks on component mount
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const stockSnapshot = await getDocs(collection(db, "Stock"));
        const stockList = stockSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            expiryDate: toDateSafe(data.expiryDate),
            stockAddDate: toDateSafe(data.stockAddDate),
            lastUpdated: toDateSafe(data.lastUpdated),
          };
        });
        setStocks(stockList);
        setFilteredStocks(stockList);
      } catch (error) {
        console.error("Error fetching stocks:", error);
      }
    };
    fetchStocks();
  }, []);

  const fetchNearExpiryStocks = async () => {
    try {
      const stockSnapshot = await getDocs(collection(db, "Stock"));
      const stockList = stockSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          expiryDate: toDateSafe(data.expiryDate),
        };
      });
      const threeMonthsFromNow = new Date(currentDate);
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      const nearExpiry = stockList
        .filter(
          (stock) =>
            stock.expiryDate &&
            stock.expiryDate >= currentDate &&
            stock.expiryDate <= threeMonthsFromNow
        )
        .sort((a, b) => a.expiryDate - b.expiryDate); // Sort by expiry date (nearest to farthest)
      setNearExpiryStocks(nearExpiry);
      setShowNearExpiry(true);
    } catch (error) {
      console.error("Error fetching near-expiry stocks:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 4,
        }}
      >
        <FaPills size={40} color="#1976D2" style={{ marginRight: "10px" }} />
        <Typography
          variant="h3"
          sx={{ fontWeight: "bold", color: "#1976D2", textAlign: "center" }}
        >
          Stock Management
        </Typography>
      </Box>

      <TextField
        label="Search by Medicine Name or Brand"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          maxWidth: "500px",
          mx: "auto",
          mb: 3,
          bgcolor: "white",
          borderRadius: 2,
          transition: "all 0.3s ease",
          "&:hover": { boxShadow: "0 4px 15px rgba(0,0,0,0.1)" },
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <Button
          variant="contained"
          onClick={() => setOpenAddDialog(true)}
          sx={{
            mr: 2,
            bgcolor: "#1976D2",
            "&:hover": { bgcolor: "#115293", transform: "scale(1.05)" },
            transition: "all 0.3s ease",
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: "bold",
          }}
        >
          Add New Stock
        </Button>
        <Button
          variant="outlined"
          onClick={fetchNearExpiryStocks}
          sx={{
            borderColor: "#1976D2",
            color: "#1976D2",
            "&:hover": {
              borderColor: "#115293",
              color: "#115293",
              transform: "scale(1.05)",
            },
            transition: "all 0.3s ease",
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: "bold",
          }}
        >
          Show Near-Expiry Medicines
        </Button>
      </Box>

      <StockTable
        stocks={stocks}
        setStocks={setStocks}
        filteredStocks={filteredStocks}
        setFilteredStocks={setFilteredStocks}
        searchQuery={searchQuery}
      />

      <StockAddDialog
        open={openAddDialog}
        setOpen={setOpenAddDialog}
        setStocks={setStocks}
        setFilteredStocks={setFilteredStocks}
      />

      {showNearExpiry && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#1976D2" }}>
            Medicines Expiring Within 3 Months
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Medicine Name</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nearExpiryStocks.length > 0 ? (
                nearExpiryStocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell>{stock.medicineName}</TableCell>
                    <TableCell>{stock.brand}</TableCell>
                    <TableCell>
                      {stock.expiryDate?.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{stock.quantity}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No medicines near expiry
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .MuiBox-root { animation: fadeIn 1s ease-in; }
      `}</style>
    </Container>
  );
}

export default Stock;
