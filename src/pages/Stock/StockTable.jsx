import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
} from "@mui/material";
import { FaEdit, FaTrash } from "react-icons/fa";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import StockEditDialog from "./StockEditDialog";

const StockTable = ({
  stocks,
  setStocks,
  filteredStocks,
  setFilteredStocks,
  searchQuery,
}) => {
  const [editStock, setEditStock] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const toDateSafe = (value) => {
    if (value && typeof value.toDate === "function") return value.toDate();
    else if (value instanceof Date) return value;
    else if (typeof value === "string" || typeof value === "number")
      return new Date(value);
    return null;
  };

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const stockCollection = collection(db, "Stock");
        const stockSnapshot = await getDocs(stockCollection);
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
        filterStocks(stockList, searchQuery);
      } catch (error) {
        console.error("Error fetching stocks:", error);
      }
    };
    fetchStocks();
  }, []);

  useEffect(() => {
    filterStocks(stocks, searchQuery);
  }, [stocks, searchQuery]);

  const filterStocks = (stockList, query) => {
    const filtered = stockList.filter(
      (stock) =>
        stock.medicineName?.toLowerCase().includes(query.toLowerCase()) ||
        stock.brand?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredStocks(filtered);
  };

  const handleDeleteStock = async (id) => {
    try {
      await deleteDoc(doc(db, "Stock", id));
      const updatedStocks = stocks.filter((stock) => stock.id !== id);
      setStocks(updatedStocks);
      setFilteredStocks(updatedStocks);
    } catch (error) {
      console.error("Error deleting stock:", error);
    }
  };

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: "500px",
          overflow: "auto",
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ background: "#1976D2" }}>
              {[
                "Medicine Name",
                "Brand",
                "Expiry Date",
                "Price/Tab",
                "Quantity",
                "Stock Add Date",
                "Last Updated",
                "Actions",
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{ fontWeight: "bold", color: "black", py: 2 }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => (
                <TableRow
                  key={stock.id}
                  hover
                  sx={{
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    },
                    backgroundColor:
                      new Date(stock.expiryDate) < new Date()
                        ? "#FFEBEE"
                        : "white",
                  }}
                >
                  <TableCell>{stock.medicineName}</TableCell>
                  <TableCell>{stock.brand}</TableCell>
                  <TableCell>
                    {stock.expiryDate
                      ? new Date(stock.expiryDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>Rs {stock.pricePerTab.toFixed(2)}</TableCell>
                  <TableCell>{stock.quantity}</TableCell>
                  <TableCell>
                    {stock.stockAddDate
                      ? new Date(stock.stockAddDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {stock.lastUpdated
                      ? new Date(stock.lastUpdated).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setEditStock(stock);
                        setOpenEditDialog(true);
                      }}
                      sx={{ mr: 1, borderRadius: 2 }}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteStock(stock.id)}
                      sx={{ borderRadius: 2 }}
                    >
                      <FaTrash />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography sx={{ color: "#B0BEC5" }}>
                    No stocks found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <StockEditDialog
        open={openEditDialog}
        setOpen={setOpenEditDialog}
        editStock={editStock}
        setEditStock={setEditStock}
        setStocks={setStocks}
        setFilteredStocks={setFilteredStocks}
        stocks={stocks} // Pass stocks here
      />
    </>
  );
};

export default StockTable;
