import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; // Adjust the import path as needed
import { Timestamp } from "firebase/firestore";
import { FaPlus } from "react-icons/fa";

const StockAddDialog = ({ open, setOpen, setStocks, setFilteredStocks }) => {
  const [newStock, setNewStock] = useState({
    medicineName: "",
    brand: "",
    expiryDate: null,
    pricePerTab: "",
    quantity: "",
    stockAddDate: new Date().toISOString(),
  });
  const [errors, setErrors] = useState({});

  const toDateSafe = (value) => {
    if (value && typeof value.toDate === "function") return value.toDate();
    else if (value instanceof Date) return value;
    else if (typeof value === "string" || typeof value === "number")
      return new Date(value);
    return null;
  };

  const validateFields = () => {
    const newErrors = {};
    if (!newStock.medicineName)
      newErrors.medicineName = "Medicine Name is required";
    if (!newStock.pricePerTab || parseFloat(newStock.pricePerTab) <= 0)
      newErrors.pricePerTab = "Price per Tablet must be a positive number";
    if (!newStock.quantity || parseInt(newStock.quantity, 10) <= 0)
      newErrors.quantity = "Total Quantity must be a positive number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddStock = async () => {
    if (!validateFields()) return;

    try {
      const stockWithTimestamp = {
        ...newStock,
        pricePerTab: parseFloat(newStock.pricePerTab) || 0,
        quantity: parseInt(newStock.quantity, 10) || 0,
        lastUpdated: Timestamp.fromDate(new Date()),
        stockAddDate: Timestamp.fromDate(new Date()),
        expiryDate: newStock.expiryDate
          ? Timestamp.fromDate(newStock.expiryDate)
          : null,
      };
      await addDoc(collection(db, "Stock"), stockWithTimestamp);
      const stockSnapshot = await getDocs(collection(db, "Stock"));
      const updatedStockList = stockSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          expiryDate: toDateSafe(data.expiryDate),
          stockAddDate: toDateSafe(data.stockAddDate),
          lastUpdated: toDateSafe(data.lastUpdated),
        };
      });
      setStocks(updatedStockList);
      setFilteredStocks(updatedStockList);
      setNewStock({
        medicineName: "",
        brand: "",
        expiryDate: null,
        pricePerTab: "",
        quantity: "",
        stockAddDate: new Date().toISOString(),
      });
      setErrors({});
      setOpen(false);
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock. Check the console for details.");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            p: 2,
            minWidth: { xs: "300px", md: "500px" },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#1976D2" }}>
          Add New Stock
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Medicine Name"
            fullWidth
            margin="normal"
            value={newStock.medicineName}
            onChange={(e) =>
              setNewStock({ ...newStock, medicineName: e.target.value })
            }
            required
            error={!!errors.medicineName}
            helperText={errors.medicineName}
            sx={{ borderRadius: 2 }}
          />
          <TextField
            label="Brand"
            fullWidth
            margin="normal"
            value={newStock.brand}
            onChange={(e) =>
              setNewStock({ ...newStock, brand: e.target.value })
            }
            sx={{ borderRadius: 2 }}
          />
          <DatePicker
            label="Expiry Date"
            value={newStock.expiryDate}
            onChange={(newValue) =>
              setNewStock({ ...newStock, expiryDate: newValue })
            }
            slotProps={{
              textField: {
                fullWidth: true,
                margin: "normal",
                sx: { borderRadius: 2 },
              },
            }}
          />
          <TextField
            label="Total Quantity (Tablets)"
            type="number"
            fullWidth
            margin="normal"
            value={newStock.quantity}
            onChange={(e) =>
              setNewStock({ ...newStock, quantity: e.target.value })
            }
            required
            error={!!errors.quantity}
            helperText={errors.quantity}
            sx={{ borderRadius: 2 }}
          />
          <TextField
            label="Price per Tablet"
            type="number"
            fullWidth
            margin="normal"
            value={newStock.pricePerTab}
            onChange={(e) =>
              setNewStock({ ...newStock, pricePerTab: e.target.value })
            }
            required
            error={!!errors.pricePerTab}
            helperText={errors.pricePerTab}
            sx={{ borderRadius: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: "#757575" }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddStock}
            variant="contained"
            sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#115293" } }}
          >
            <FaPlus style={{ marginRight: "5px" }} /> Add
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default StockAddDialog;
