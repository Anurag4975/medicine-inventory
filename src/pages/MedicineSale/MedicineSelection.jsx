import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Autocomplete,
} from "@mui/material";
import { FaPlus } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const MedicineSelection = ({
  stocks,
  setStocks,
  selectedMedicines,
  setSelectedMedicines,
}) => {
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");

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

  const handleAddMedicine = () => {
    const selectedStock = stocks.find((stock) => stock.id === medicineId);
    if (selectedStock && quantity > 0 && quantity <= selectedStock.quantity) {
      setSelectedMedicines([
        ...selectedMedicines,
        {
          id: selectedStock.id,
          medicineName: selectedStock.medicineName,
          brand: selectedStock.brand,
          pricePerTab: selectedStock.pricePerTab,
          quantity: parseInt(quantity, 10),
          total: selectedStock.pricePerTab * parseInt(quantity, 10),
        },
      ]);
      setMedicineId("");
      setQuantity("");
    } else {
      alert("Invalid quantity or medicine not found.");
    }
  };

  return (
    <Paper
      elevation={5}
      sx={{
        p: 1.5,
        flexGrow: 1,
        borderRadius: 2,
        background: "linear-gradient(135deg, #F5F7FA, #E3F2FD)",
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 1, fontWeight: "bold", color: "#1976D2" }}
      >
        Add Medicine
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Autocomplete
          options={stocks}
          getOptionLabel={(option) =>
            `${option.medicineName} (${
              option.brand
            }) - NPR ${option.pricePerTab.toFixed(2)}`
          }
          value={stocks.find((stock) => stock.id === medicineId) || null}
          onChange={(e, newValue) => setMedicineId(newValue?.id || "")}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Medicine"
              size="small"
              sx={{ borderRadius: 2 }}
            />
          )}
        />
        <TextField
          label="Quantity"
          type="number"
          size="small"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          sx={{ borderRadius: 2 }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAddMedicine}
          sx={{
            bgcolor: "#1976D2",
            "&:hover": { bgcolor: "#115293", transform: "scale(1.05)" },
            transition: "all 0.3s ease",
            borderRadius: 2,
          }}
        >
          <FaPlus style={{ marginRight: "5px" }} /> Add
        </Button>
      </Box>
    </Paper>
  );
};

export default MedicineSelection;
