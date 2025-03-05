import { useEffect, useState, useRef } from "react";
import {
  Typography,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useReactToPrint } from "react-to-print"; // Import react-to-print

function Sales() {
  const [stocks, setStocks] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    gender: "",
    address: "",
  });
  const [discount, setDiscount] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const receiptRef = useRef(); // Ref for the receipt content

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : null);
      }
    });
    return () => unsubscribe();
  }, []);

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

  const calculateTotal = () => {
    const subtotal = selectedMedicines.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const discountAmount = discount ? parseFloat(discount) : 0;
    return subtotal - discountAmount;
  };

  const handleSubmitSale = async () => {
    const total = calculateTotal();
    const saleData = {
      patient,
      medicines: selectedMedicines,
      discount: discount ? parseFloat(discount) : 0,
      totalAmount: total,
      saleDate: new Date().toISOString(),
      seller: {
        uid: auth.currentUser.uid,
        role: userRole,
      },
    };

    try {
      const batch = writeBatch(db);
      const saleRef = doc(collection(db, "Sales"));
      batch.set(saleRef, saleData);

      const stockChecks = await Promise.all(
        selectedMedicines.map(async (med) => {
          const stockRef = doc(db, "Stock", med.id);
          const stockDoc = await getDoc(stockRef);
          if (!stockDoc.exists()) {
            throw new Error(`Stock item NPR {med.id} not found`);
          }
          const currentQuantity = stockDoc.data().quantity;
          if (currentQuantity < med.quantity) {
            throw new Error(`Insufficient stock for NPR {med.medicineName}`);
          }
          return { ref: stockRef, newQuantity: currentQuantity - med.quantity };
        })
      );

      stockChecks.forEach(({ ref, newQuantity }) => {
        batch.update(ref, {
          quantity: newQuantity,
          lastUpdated: new Date().toISOString(),
        });
      });

      await batch.commit();

      setReceipt({ ...saleData, id: saleRef.id });
      setSelectedMedicines([]);
      setPatient({ name: "", age: "", gender: "", address: "" });
      setDiscount("");
      alert("Sale recorded successfully!");
    } catch (error) {
      console.error("Error recording sale:", error);
      alert("Failed to record sale: " + error.message);
    }
  };

  // Print handler using react-to-print
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt_NPR {receipt?.id || "unknown"}`,
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sales
      </Typography>
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Medicine</InputLabel>
          <Select
            value={medicineId}
            onChange={(e) => setMedicineId(e.target.value)}
            label="Medicine"
          >
            {stocks.map((stock) => (
              <MenuItem key={stock.id} value={stock.id}>
                {stock.medicineName} ({stock.brand}) - NPR{" "}
                {stock.pricePerTab.toFixed(2)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Quantity"
          type="number"
          fullWidth
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleAddMedicine}>
          Add Medicine
        </Button>
      </Box>
      {selectedMedicines.length > 0 && (
        <Table sx={{ mb: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Medicine Name</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Price/Tab</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedMedicines.map((med, index) => (
              <TableRow key={index}>
                <TableCell>{med.medicineName}</TableCell>
                <TableCell>{med.brand}</TableCell>
                <TableCell>NPR {med.pricePerTab.toFixed(2)}</TableCell>
                <TableCell>{med.quantity}</TableCell>
                <TableCell>NPR {med.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Patient Name"
          fullWidth
          value={patient.name}
          onChange={(e) => setPatient({ ...patient, name: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Age"
          type="number"
          fullWidth
          value={patient.age}
          onChange={(e) => setPatient({ ...patient, age: e.target.value })}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={patient.gender}
            onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
            label="Gender"
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Address (Optional)"
          fullWidth
          value={patient.address}
          onChange={(e) => setPatient({ ...patient, address: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Discount Amount (Optional)"
          type="number"
          fullWidth
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          sx={{ mb: 2 }}
        />
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmitSale}
        disabled={selectedMedicines.length === 0 || !patient.name || !userRole}
      >
        Record Sale
      </Button>
      {receipt && (
        <Box sx={{ mt: 3 }}>
          <div ref={receiptRef}>
            <Box sx={{ p: 2, border: "1px solid #ccc" }}>
              <Typography variant="h6">Receipt</Typography>
              <Typography>Patient: {receipt.patient.name}</Typography>
              <Typography>Age: {receipt.patient.age}</Typography>
              <Typography>Gender: {receipt.patient.gender}</Typography>
              {receipt.patient.address && (
                <Typography>Address: {receipt.patient.address}</Typography>
              )}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Medicine</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell>Price/Tab</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipt.medicines.map((med, index) => (
                    <TableRow key={index}>
                      <TableCell>{med.medicineName}</TableCell>
                      <TableCell>{med.brand}</TableCell>
                      <TableCell>NPR {med.pricePerTab.toFixed(2)}</TableCell>
                      <TableCell>{med.quantity}</TableCell>
                      <TableCell>NPR {med.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography>
                Discount: NPR {receipt.discount.toFixed(2)}
              </Typography>
              <Typography variant="h6">
                Total Amount: NPR {receipt.totalAmount.toFixed(2)}
              </Typography>
              <Typography>
                Sale Date: {new Date(receipt.saleDate).toLocaleString()}
              </Typography>
            </Box>
          </div>
          <Button
            variant="outlined"
            color="primary"
            onClick={handlePrint}
            sx={{ mt: 2 }}
          >
            Print Receipt
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default Sales;
