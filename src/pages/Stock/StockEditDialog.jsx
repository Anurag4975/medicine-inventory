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
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { Timestamp } from "firebase/firestore";
import { FaSave } from "react-icons/fa";

const StockEditDialog = ({
  open,
  setOpen,
  editStock,
  setEditStock,
  setStocks,
  setFilteredStocks,
  stocks,
}) => {
  const toDateSafe = (value) => {
    if (value && typeof value.toDate === "function") return value.toDate();
    else if (value instanceof Date) return value;
    else if (typeof value === "string" || typeof value === "number")
      return new Date(value);
    return null;
  };

  const handleUpdateStock = async () => {
    try {
      const stockRef = doc(db, "Stock", editStock.id);
      const updatedStock = {
        ...editStock,
        expiryDate: editStock.expiryDate
          ? Timestamp.fromDate(editStock.expiryDate)
          : null,
        pricePerTab: parseFloat(editStock.pricePerTab) || 0,
        quantity: parseInt(editStock.quantity, 10) || 0,
        lastUpdated: Timestamp.fromDate(new Date()),
      };
      await updateDoc(stockRef, updatedStock);
      const updatedStocks = stocks.map((stock) =>
        stock.id === editStock.id
          ? {
              id: stock.id,
              ...updatedStock,
              expiryDate: toDateSafe(updatedStock.expiryDate),
              stockAddDate: toDateSafe(updatedStock.stockAddDate),
              lastUpdated: toDateSafe(updatedStock.lastUpdated),
            }
          : stock
      );
      setStocks(updatedStocks);
      setFilteredStocks(updatedStocks);
      setEditStock(null);
      setOpen(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock. Check the console for details.");
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
          Edit Stock
        </DialogTitle>
        <DialogContent>
          {editStock && (
            <>
              <TextField
                label="Medicine Name"
                fullWidth
                margin="normal"
                value={editStock.medicineName}
                onChange={(e) =>
                  setEditStock({ ...editStock, medicineName: e.target.value })
                }
                sx={{ borderRadius: 2 }}
              />
              <TextField
                label="Brand"
                fullWidth
                margin="normal"
                value={editStock.brand}
                onChange={(e) =>
                  setEditStock({ ...editStock, brand: e.target.value })
                }
                sx={{ borderRadius: 2 }}
              />
              <DatePicker
                label="Expiry Date"
                value={editStock.expiryDate}
                onChange={(newValue) =>
                  setEditStock({ ...editStock, expiryDate: newValue })
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
                label="Price per Tab"
                type="number"
                fullWidth
                margin="normal"
                value={editStock.pricePerTab}
                onChange={(e) =>
                  setEditStock({ ...editStock, pricePerTab: e.target.value })
                }
                sx={{ borderRadius: 2 }}
              />
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                margin="normal"
                value={editStock.quantity}
                onChange={(e) =>
                  setEditStock({ ...editStock, quantity: e.target.value })
                }
                sx={{ borderRadius: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: "#757575" }}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStock}
            variant="contained"
            sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#115293" } }}
          >
            <FaSave style={{ marginRight: "5px" }} /> Update
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default StockEditDialog;
