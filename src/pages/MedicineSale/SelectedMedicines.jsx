import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TableFooter,
} from "@mui/material";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";

const SelectedMedicines = ({ selectedMedicines, setSelectedMedicines }) => {
  const handleDeleteMedicine = (id) => {
    setSelectedMedicines(selectedMedicines.filter((med) => med.id !== id));
  };

  const handleQuantityChange = (id, change) => {
    setSelectedMedicines(
      selectedMedicines.map((med) => {
        if (med.id === id) {
          const newQuantity = med.quantity + change;
          if (newQuantity < 1) return med; // Prevent quantity from going below 1
          return {
            ...med,
            quantity: newQuantity,
            total: newQuantity * med.pricePerTab,
          };
        }
        return med;
      })
    );
  };

  // Calculate total of all medicines
  const totalAmount = selectedMedicines.reduce(
    (sum, medicine) => sum + medicine.total,
    0
  );

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
        Selected Medicines
      </Typography>
      <Box sx={{ maxHeight: "200px", overflowY: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: "#1976D2" }}>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Name
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Brand
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Price
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Qty
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Total
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedMedicines.map((med) => (
              <TableRow
                key={med.id}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": { backgroundColor: "#E3F2FD" },
                }}
              >
                <TableCell>{med.medicineName}</TableCell>
                <TableCell>{med.brand}</TableCell>
                <TableCell>NPR {med.pricePerTab.toFixed(2)}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(med.id, -1)}
                      sx={{
                        color: "#F44336",
                        "&:hover": {
                          backgroundColor: "rgba(244, 67, 54, 0.1)",
                        },
                      }}
                    >
                      <FaMinus size={12} />
                    </IconButton>
                    {med.quantity}
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(med.id, 1)}
                      sx={{
                        color: "#4CAF50",
                        "&:hover": {
                          backgroundColor: "rgba(76, 175, 80, 0.1)",
                        },
                      }}
                    >
                      <FaPlus size={12} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>NPR {med.total.toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteMedicine(med.id)}
                    sx={{
                      color: "#F44336",
                      "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" },
                    }}
                  >
                    <FaTrash size={14} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ backgroundColor: "#E3F2FD" }}>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: "bold" }}>
                Grand Total:
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                NPR {totalAmount.toFixed(2)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Box>
    </Paper>
  );
};

export default SelectedMedicines;
