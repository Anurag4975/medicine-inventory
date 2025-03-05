import { useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

function Stock() {
  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState({
    medicineName: "",
    brand: "",
    expiryDate: "",
    pricePerTab: "",
    quantity: "",
  });
  const [editStock, setEditStock] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // Fetch stock data from Firestore
  useEffect(() => {
    const fetchStocks = async () => {
      const stockCollection = collection(db, "Stock");
      const stockSnapshot = await getDocs(stockCollection);
      const stockList = stockSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStocks(stockList);
    };
    fetchStocks();
  }, []);

  // Handle adding new stock
  const handleAddStock = async () => {
    try {
      const stockWithTimestamp = {
        ...newStock,
        pricePerTab: parseFloat(newStock.pricePerTab),
        quantity: parseInt(newStock.quantity, 10),
        lastUpdated: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "Stock"), stockWithTimestamp);
      setStocks([...stocks, { id: docRef.id, ...stockWithTimestamp }]);
      setNewStock({
        medicineName: "",
        brand: "",
        expiryDate: "",
        pricePerTab: "",
        quantity: "",
      });
      setOpenAddDialog(false);
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  };

  // Handle updating stock
  const handleUpdateStock = async () => {
    try {
      const stockRef = doc(db, "Stock", editStock.id);
      const updatedStock = {
        ...editStock,
        pricePerTab: parseFloat(editStock.pricePerTab),
        quantity: parseInt(editStock.quantity, 10),
        lastUpdated: new Date().toISOString(),
      };
      await updateDoc(stockRef, updatedStock);
      setStocks(
        stocks.map((stock) =>
          stock.id === editStock.id ? { id: stock.id, ...updatedStock } : stock
        )
      );
      setEditStock(null);
      setOpenEditDialog(false);
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  // Handle deleting stock
  const handleDeleteStock = async (id) => {
    try {
      await deleteDoc(doc(db, "Stock", id));
      setStocks(stocks.filter((stock) => stock.id !== id));
    } catch (error) {
      console.error("Error deleting stock:", error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Stock Management
      </Typography>

      {/* Add Stock Button */}
      <Button
        variant="contained"
        onClick={() => setOpenAddDialog(true)}
        sx={{ mb: 2 }}
      >
        Add New Stock
      </Button>

      {/* Stock Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Medicine Name</TableCell>
            <TableCell>Brand</TableCell>
            <TableCell>Expiry Date</TableCell>
            <TableCell>Price/Tab</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow key={stock.id}>
              <TableCell>{stock.medicineName}</TableCell>
              <TableCell>{stock.brand}</TableCell>
              <TableCell>{stock.expiryDate}</TableCell>
              <TableCell>Rs{stock.pricePerTab.toFixed(2)}</TableCell>
              <TableCell>{stock.quantity}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setEditStock(stock);
                    setOpenEditDialog(true);
                  }}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeleteStock(stock.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Stock Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Stock</DialogTitle>
        <DialogContent>
          <TextField
            label="Medicine Name"
            fullWidth
            margin="normal"
            value={newStock.medicineName}
            onChange={(e) =>
              setNewStock({ ...newStock, medicineName: e.target.value })
            }
          />
          <TextField
            label="Brand"
            fullWidth
            margin="normal"
            value={newStock.brand}
            onChange={(e) =>
              setNewStock({ ...newStock, brand: e.target.value })
            }
          />
          <TextField
            label="Expiry Date (YYYY-MM-DD)"
            fullWidth
            margin="normal"
            value={newStock.expiryDate}
            onChange={(e) =>
              setNewStock({ ...newStock, expiryDate: e.target.value })
            }
          />
          <TextField
            label="Price per Tab"
            type="number"
            fullWidth
            margin="normal"
            value={newStock.pricePerTab}
            onChange={(e) =>
              setNewStock({ ...newStock, pricePerTab: e.target.value })
            }
          />
          <TextField
            label="Quantity"
            type="number"
            fullWidth
            margin="normal"
            value={newStock.quantity}
            onChange={(e) =>
              setNewStock({ ...newStock, quantity: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddStock} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Stock</DialogTitle>
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
              />
              <TextField
                label="Brand"
                fullWidth
                margin="normal"
                value={editStock.brand}
                onChange={(e) =>
                  setEditStock({ ...editStock, brand: e.target.value })
                }
              />
              <TextField
                label="Expiry Date (YYYY-MM-DD)"
                type="calender"
                fullWidth
                margin="normal"
                value={editStock.expiryDate}
                onChange={(e) =>
                  setEditStock({ ...editStock, expiryDate: e.target.value })
                }
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
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateStock} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Stock;
