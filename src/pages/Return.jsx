import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { FaUndo, FaTrash } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  writeBatch,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import SelectedMedicines from "./MedicineSale/SelectedMedicines";

function Returns() {
  const [billNumber, setBillNumber] = useState("");
  const [saleData, setSaleData] = useState(null);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    gender: "",
    address: "",
    phone: "",
  });
  const [discount, setDiscount] = useState("");
  const [paymentType, setPaymentType] = useState("fullyPaid");
  const [paidAmount, setPaidAmount] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : null);
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearchBill = async () => {
    if (!billNumber) {
      setError("Please enter a bill number");
      return;
    }
    try {
      const salesRef = collection(db, "Sales");
      const saleQuery = query(salesRef, where("billNumber", "==", billNumber));
      const saleDocs = await getDocs(saleQuery);
      if (saleDocs.empty) {
        setError("No sale found with this bill number");
        setSaleData(null);
        return;
      }
      const sale = saleDocs.docs[0].data();
      setSaleData({ id: saleDocs.docs[0].id, ...sale });
      setSelectedMedicines(sale.medicines);
      setPatient(sale.patient);
      setDiscount(sale.discount.toString());
      setPaymentType(sale.paymentType);
      setPaidAmount(sale.paidAmount.toString());
      setError("");
    } catch (err) {
      setError("Error fetching sale: " + err.message);
    }
  };

  const validateNumericInput = (value, setter) => {
    if (value === "" || (!isNaN(value) && Number(value) >= 0)) {
      setter(value);
    }
  };

  const calculateTotal = (medicines, discount) => {
    const subtotal = medicines.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = discount ? parseFloat(discount) : 0;
    return subtotal - discountAmount;
  };

  const handleSubmitReturn = async () => {
    if (userRole !== "admin") {
      setError("Only admins can process returns");
      return;
    }
    if (!saleData) {
      setError("No sale selected for return");
      return;
    }

    try {
      const batch = writeBatch(db);
      const saleRef = doc(db, "Sales", saleData.id);

      const updatedSaleData = {
        billNumber: saleData.billNumber,
        patient,
        medicines: selectedMedicines,
        discount: discount ? parseFloat(discount) : 0,
        totalAmount: calculateTotal(selectedMedicines, discount),
        paymentType,
        paidAmount: parseFloat(paidAmount) || 0,
        creditAmount:
          paymentType === "partiallyPaid"
            ? calculateTotal(selectedMedicines, discount) -
              (parseFloat(paidAmount) || 0)
            : 0,
        saleDate: saleData.saleDate,
        seller: saleData.seller,
        lastUpdated: new Date().toISOString(),
      };

      batch.set(saleRef, updatedSaleData);

      const stockUpdates = await Promise.all(
        saleData.medicines.map(async (originalMed) => {
          const stockRef = doc(db, "Stock", originalMed.id);
          const stockDoc = await getDoc(stockRef);
          if (!stockDoc.exists())
            throw new Error(`Stock item ${originalMed.id} not found`);

          const currentMed = selectedMedicines.find(
            (m) => m.id === originalMed.id
          );
          const returnedQuantity = currentMed
            ? originalMed.quantity - currentMed.quantity
            : originalMed.quantity;

          return {
            ref: stockRef,
            quantity: stockDoc.data().quantity + returnedQuantity,
          };
        })
      );

      stockUpdates.forEach(({ ref, quantity }) => {
        batch.update(ref, {
          quantity,
          lastUpdated: new Date().toISOString(),
        });
      });

      await batch.commit();
      setSuccess("Return processed successfully!");
      setError("");
      setSaleData(null);
      setSelectedMedicines([]);
      setPatient({ name: "", age: "", gender: "", address: "", phone: "" });
      setDiscount("");
      setPaidAmount("");
      setBillNumber("");
    } catch (err) {
      setError("Error processing return: " + err.message);
      setSuccess("");
    }
  };

  const handleDeleteBill = async () => {
    if (userRole !== "admin") {
      setError("Only admins can delete bills");
      return;
    }
    if (!saleData) {
      setError("No sale selected for deletion");
      return;
    }

    try {
      const batch = writeBatch(db);
      const saleRef = doc(db, "Sales", saleData.id);

      // Restore stock for all medicines in the bill
      const stockUpdates = await Promise.all(
        saleData.medicines.map(async (med) => {
          const stockRef = doc(db, "Stock", med.id);
          const stockDoc = await getDoc(stockRef);
          if (!stockDoc.exists())
            throw new Error(`Stock item ${med.id} not found`);
          return {
            ref: stockRef,
            quantity: stockDoc.data().quantity + med.quantity,
          };
        })
      );

      stockUpdates.forEach(({ ref, quantity }) => {
        batch.update(ref, {
          quantity,
          lastUpdated: new Date().toISOString(),
        });
      });

      // Delete the sale document
      batch.delete(saleRef);

      await batch.commit();
      setSuccess("Bill deleted successfully!");
      setError("");
      setSaleData(null);
      setSelectedMedicines([]);
      setPatient({ name: "", age: "", gender: "", address: "", phone: "" });
      setDiscount("");
      setPaidAmount("");
      setBillNumber("");
      setOpenDeleteDialog(false);
    } catch (err) {
      setError("Error deleting bill: " + err.message);
      setSuccess("");
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 2,
        mb: 2,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        <FaUndo size={32} color="#1976D2" style={{ marginRight: "8px" }} />
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "#1976D2", textAlign: "center" }}
        >
          Returns
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Bill Number"
          value={billNumber}
          onChange={(e) => setBillNumber(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSearchBill}
          sx={{
            bgcolor: "#1976D2",
            "&:hover": { bgcolor: "#115293" },
          }}
        >
          Search Bill
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {saleData && (
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              flex: { xs: "none", md: 1 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxHeight: { xs: "auto", md: "calc(100vh - 200px)" },
              overflowY: "auto",
            }}
          >
            <Box
              sx={{
                p: 2,
                border: "1px solid #ddd",
                borderRadius: 2,
                bgcolor: "#f9f9f9",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Patient Details
              </Typography>
              <TextField
                label="Name"
                value={patient.name}
                onChange={(e) =>
                  setPatient({ ...patient, name: e.target.value })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Age"
                value={patient.age}
                onChange={(e) =>
                  validateNumericInput(e.target.value, (val) =>
                    setPatient({ ...patient, age: val })
                  )
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Gender"
                value={patient.gender}
                onChange={(e) =>
                  setPatient({ ...patient, gender: e.target.value })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Address"
                value={patient.address}
                onChange={(e) =>
                  setPatient({ ...patient, address: e.target.value })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Phone"
                value={patient.phone}
                onChange={(e) =>
                  setPatient({ ...patient, phone: e.target.value })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Discount"
                value={discount}
                onChange={(e) =>
                  validateNumericInput(e.target.value, setDiscount)
                }
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Payment Type"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                select
                SelectProps={{ native: true }}
                fullWidth
                sx={{ mb: 2 }}
              >
                <option value="fullyPaid">Fully Paid</option>
                <option value="partiallyPaid">Partially Paid</option>
              </TextField>
              <TextField
                label="Paid Amount"
                value={paidAmount}
                onChange={(e) =>
                  validateNumericInput(e.target.value, setPaidAmount)
                }
                fullWidth
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              flex: { xs: "none", md: 1 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxHeight: { xs: "auto", md: "calc(100vh - 200px)" },
              overflowY: "auto",
            }}
          >
            <SelectedMedicines
              selectedMedicines={selectedMedicines}
              setSelectedMedicines={setSelectedMedicines}
            />
          </Box>
        </Box>
      )}

      {saleData && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleSubmitReturn}
            disabled={userRole !== "admin"}
            sx={{
              bgcolor: "#1976D2",
              "&:hover": { bgcolor: "#115293", transform: "scale(1.05)" },
              transition: "transform 0.3s ease, background-color 0.3s ease",
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: "bold",
            }}
          >
            Process Return
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenDeleteDialog(true)}
            disabled={userRole !== "admin"}
            sx={{
              bgcolor: "#d32f2f",
              "&:hover": { bgcolor: "#b71c1c", transform: "scale(1.05)" },
              transition: "transform 0.3s ease, background-color 0.3s ease",
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: "bold",
            }}
          >
            <FaTrash style={{ marginRight: "8px" }} />
            Delete Bill
          </Button>
        </Box>
      )}

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete Bill</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this bill? This action will remove
            the sale record and restore all associated stock quantities. This
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteBill}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .MuiBox-root { animation: fadeIn 1s ease-in; }
      `}</style>
    </Container>
  );
}

export default Returns;
