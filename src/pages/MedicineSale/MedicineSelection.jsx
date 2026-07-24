import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Autocomplete,
  Chip,
  InputAdornment,
} from "@mui/material";
import { FaPlus, FaPrescriptionBottleAlt } from "react-icons/fa";
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
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStocks = async () => {
      const stockSnapshot = await getDocs(collection(db, "Stock"));
      setStocks(
        stockSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchStocks();
  }, [setStocks]);

  const handleAddMedicine = () => {
    const stock = stocks.find((s) => s.id === medicineId);
    const qty = parseInt(quantity, 10);

    if (stock && qty > 0 && qty <= stock.quantity) {
      setSelectedMedicines([
        ...selectedMedicines,
        {
          ...stock,
          quantity: qty,
          total: stock.pricePerTab * qty,
        },
      ]);
      setMedicineId("");
      setQuantity("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 3,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          gap: 1.5,
        }}
      >
        {/* Compact Icon & Label (Hidden on tiny screens to save more space) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minWidth: "fit-content",
            gap: 1,
          }}
        >
          <FaPrescriptionBottleAlt color="#0369a1" size={14} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: "#475569",
              textTransform: "uppercase",
            }}
          >
            Add
          </Typography>
        </Box>

        {/* Medicine Search - Flex 3 */}
        <Autocomplete
          fullWidth
          sx={{ flex: 3 }}
          options={stocks}
          getOptionLabel={(opt) => `${opt.medicineName} (${opt.brand})`}
          value={stocks.find((s) => s.id === medicineId) || null}
          onChange={(_, val) => {
            setMedicineId(val?.id || "");
            setError(false);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Medicine"
              size="small"
              variant="outlined"
            />
          )}
          renderOption={(props, opt) => (
            <Box
              component="li"
              {...props}
              sx={{ fontSize: "0.8rem", py: "4px !important" }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {opt.medicineName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {opt.brand} • Stock: {opt.quantity}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "#16a34a" }}
              >
                NPR {opt.pricePerTab}
              </Typography>
            </Box>
          )}
        />

        {/* Quantity - Flex 1 */}
        <TextField
          label="Qty"
          type="number"
          size="small"
          error={error}
          sx={{ flex: { xs: 1, sm: 0.8 }, minWidth: "80px" }}
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setError(false);
          }}
        />

        {/* Action Button - Flex 1 */}
        <Button
          variant="contained"
          disableElevation
          onClick={handleAddMedicine}
          disabled={!medicineId || !quantity}
          sx={{
            height: 40,
            px: 3,
            borderRadius: 2,
            bgcolor: "#0369a1",
            textTransform: "none",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <FaPlus style={{ marginRight: 8 }} /> Add
        </Button>
      </Box>

      {/* Mini Error Message */}
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ ml: { sm: 7 }, mt: 0.5, display: "block" }}
        >
          Check stock/quantity
        </Typography>
      )}
    </Paper>
  );
};

export default MedicineSelection;
