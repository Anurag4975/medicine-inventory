import { useState, useEffect } from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import { FaShoppingCart } from "react-icons/fa";
import MedicineSelection from "./MedicineSale/MedicineSelection";
import PatientDetails from "./MedicineSale/PatientDetails";
import SelectedMedicines from "./MedicineSale/SelectedMedicines";
import Receipt from "./MedicineSale/Receipt";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDoc, doc, writeBatch } from "firebase/firestore";

function Sales() {
  const [stocks, setStocks] = useState([]);
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
  const [paymentMethod, setPaymentMethod] = useState("Offline");
  const [receipt, setReceipt] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : null);
      }
    });
    return () => unsubscribe();
  }, []);

  const validateNumericInput = (value, setter) => {
    if (value === "" || (!isNaN(value) && Number(value) >= 0)) {
      setter(value);
    }
  };

  const handleSubmitSale = async (
    selectedMedicines,
    patient,
    discount,
    paymentType,
    paidAmount,
    paymentMethod,
    setReceipt,
    setSelectedMedicines,
    setPatient,
    setDiscount,
    setPaidAmount,
    setPaymentMethod,
    userRole
  ) => {
    const total = calculateTotal(selectedMedicines, discount);
    const paid = parseFloat(paidAmount) || 0;
    const creditAmount = paymentType === "partiallyPaid" ? total - paid : 0;

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(now.getDate()).padStart(2, "0")}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const billNumber = `${datePart}-${randomPart}`;

    const saleData = {
      billNumber,
      patient,
      medicines: selectedMedicines,
      discount: discount ? parseFloat(discount) : 0,
      totalAmount: total,
      paymentType,
      paidAmount: paid,
      paymentMethod, // Include paymentMethod in Firebase data
      creditAmount: creditAmount,
      saleDate: now.toISOString(),
      seller: { uid: auth.currentUser.uid, role: userRole },
    };

    try {
      const batch = writeBatch(db);
      const saleRef = doc(collection(db, "Sales"));
      batch.set(saleRef, saleData);

      const stockChecks = await Promise.all(
        selectedMedicines.map(async (med) => {
          const stockRef = doc(db, "Stock", med.id);
          const stockDoc = await getDoc(stockRef);
          if (!stockDoc.exists())
            throw new Error(`Stock item ${med.id} not found`);
          const currentQuantity = stockDoc.data().quantity;
          if (currentQuantity < med.quantity)
            throw new Error(`Insufficient stock for ${med.medicineName}`);
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
      setPatient({ name: "", age: "", gender: "", address: "", phone: "" });
      setDiscount("");
      setPaidAmount("");
      setPaymentMethod("Offline");
      alert("Sale recorded successfully!");
    } catch (error) {
      console.error("Error recording sale:", error);
      alert("Failed to record sale: " + error.message);
    }
  };

  const calculateTotal = (selectedMedicines, discount) => {
    const subtotal = selectedMedicines.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const discountAmount = discount ? parseFloat(discount) : 0;
    return subtotal - discountAmount;
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
        <FaShoppingCart
          size={32}
          color="#1976D2"
          style={{ marginRight: "8px" }}
        />
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "#1976D2", textAlign: "center" }}
        >
          Sales
        </Typography>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          overflow: "hidden",
        }}
      >
        {/* Left Column: Medicine Selection and Patient Details */}
        <Box
          sx={{
            flex: { xs: "none", md: 1 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: { xs: "auto", md: "calc(100vh - 120px)" },
            overflowY: "auto",
          }}
        >
          <MedicineSelection
            stocks={stocks}
            setStocks={setStocks}
            selectedMedicines={selectedMedicines}
            setSelectedMedicines={setSelectedMedicines}
          />
          <PatientDetails
            patient={patient}
            setPatient={setPatient}
            discount={discount}
            setDiscount={(value) => validateNumericInput(value, setDiscount)}
            paymentType={paymentType}
            setPaymentType={setPaymentType}
            paidAmount={paidAmount}
            setPaidAmount={(value) =>
              validateNumericInput(value, setPaidAmount)
            }
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
        </Box>

        {/* Right Column: Selected Medicines and Receipt */}
        <Box
          sx={{
            flex: { xs: "none", md: 1 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: { xs: "auto", md: "calc(100vh - 120px)" },
            overflowY: "auto",
          }}
        >
          {selectedMedicines.length > 0 && (
            <SelectedMedicines
              selectedMedicines={selectedMedicines}
              setSelectedMedicines={setSelectedMedicines}
            />
          )}
          {receipt && <Receipt receipt={receipt} />}
        </Box>
      </Box>

      <Button
        variant="contained"
        onClick={() =>
          handleSubmitSale(
            selectedMedicines,
            patient,
            discount,
            paymentType,
            paidAmount,
            paymentMethod,
            setReceipt,
            setSelectedMedicines,
            setPatient,
            setDiscount,
            setPaidAmount,
            setPaymentMethod,
            userRole
          )
        }
        disabled={selectedMedicines.length === 0 || !patient.name || !userRole}
        sx={{
          mt: 2,
          mx: "auto",
          bgcolor: "#1976D2",
          "&:hover": { bgcolor: "#115293", transform: "scale(1.05)" },
          transition: "transform 0.3s ease, background-color 0.3s ease",
          borderRadius: 2,
          px: 3,
          py: 1,
          fontWeight: "bold",
        }}
      >
        Record Sale
      </Button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .MuiBox-root { animation: fadeIn 1s ease-in; }
      `}</style>
    </Container>
  );
}

export default Sales;
