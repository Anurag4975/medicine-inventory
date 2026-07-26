import {
  Paper,
  Typography,
  Box,
  TextField,
  Chip,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import { FaCapsules, FaTrash } from "react-icons/fa";

const SelectedMedicines = ({ selectedMedicines, setSelectedMedicines }) => {
  const handleQuantityInput = (id, value) => {
    setSelectedMedicines(
      selectedMedicines.map((med) =>
        med.id === id
          ? {
              ...med,
              quantity: value === "" ? "" : Number(value),
              total:
                value === ""
                  ? 0
                  : Number(value) * (med.price || med.pricePerTab || 0),
            }
          : med,
      ),
    );
  };

  const handleQuantityBlur = (id) => {
    setSelectedMedicines(
      selectedMedicines.map((med) =>
        med.id === id
          ? {
              ...med,
              quantity:
                med.quantity === "" || med.quantity < 1 ? 1 : med.quantity,
              total:
                (med.quantity === "" || med.quantity < 1 ? 1 : med.quantity) *
                (med.price || med.pricePerTab || 0),
            }
          : med,
      ),
    );
  };

  const handleDelete = (id) => {
    setSelectedMedicines(selectedMedicines.filter((med) => med.id !== id));
  };

  const totalAmount = selectedMedicines.reduce(
    (sum, medicine) => sum + (medicine.total || 0),
    0,
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #dbeafe",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
        <FaCapsules size={18} color="#0369a1" />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            color: "#0c4a6e",
            letterSpacing: "0.3px",
          }}
        >
          Selected Medicines
        </Typography>
        <Chip
          label={selectedMedicines.length}
          size="small"
          sx={{
            bgcolor: "#0369a1",
            color: "white",
            fontWeight: 700,
            height: "20px",
          }}
        />
      </Box>

      {/* Medicine List */}
      <Stack
        spacing={1.5}
        divider={<Divider sx={{ borderColor: "#e2e8f0" }} />}
        sx={{ mb: 2 }}
      >
        {selectedMedicines.map((med) => (
          <Box
            key={med.id}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              p: 1,
              borderRadius: 2,
              transition: "background-color 0.2s",
              "&:hover": { backgroundColor: "#f1f5f9" },
            }}
          >
            {/* Medicine Name */}
            <Box sx={{ flex: "1 1 150px", minWidth: "150px" }}>
              <Typography
                sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}
              >
                {med.medicineName}
              </Typography>
              {med.brand && (
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {med.brand}
                </Typography>
              )}
            </Box>

            {/* Price, Qty, Total */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 2, sm: 3 },
                flexWrap: "wrap",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#475569",
                  minWidth: "60px",
                }}
              >
                NPR {(med.price || med.pricePerTab || 0).toFixed(2)}
              </Typography>

              <TextField
                type="number"
                value={med.quantity}
                onChange={(e) => handleQuantityInput(med.id, e.target.value)}
                onBlur={() => handleQuantityBlur(med.id)}
                size="small"
                sx={{
                  width: "70px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    height: "32px",
                    backgroundColor: "white",
                  },
                  "& input": {
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button":
                      {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                  },
                }}
              />

              <Box sx={{ minWidth: "70px", textAlign: "right" }}>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: -0.5,
                  }}
                >
                  Total
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "#0369a1",
                  }}
                >
                  NPR {(med.total || 0).toFixed(2)}
                </Typography>
              </Box>

              <IconButton
                onClick={() => handleDelete(med.id)}
                color="error"
                size="small"
                sx={{
                  backgroundColor: "#fee2e2",
                  "&:hover": { backgroundColor: "#fecaca" },
                }}
              >
                <FaTrash size={14} />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Stack>

      {/* Grand Total */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 2,
          p: 2,
          bgcolor: "#f0f9ff",
          borderRadius: 2,
          border: "1px solid #dbeafe",
        }}
      >
        <Typography
          sx={{ fontWeight: 800, color: "#0c4a6e", fontSize: "0.9rem" }}
        >
          Grand Total:
        </Typography>
        <Typography
          sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#0369a1" }}
        >
          NPR {totalAmount.toFixed(2)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SelectedMedicines;
