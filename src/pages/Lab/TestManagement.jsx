import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

const TestManagement = () => {
  const [tests, setTests] = useState([]);
  const [testName, setTestName] = useState("");
  const [testPrice, setTestPrice] = useState("");
  const [editingTest, setEditingTest] = useState(null);
  const [editTestName, setEditTestName] = useState("");
  const [editTestPrice, setEditTestPrice] = useState("");

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const snapshot = await getDocs(collection(db, "labTests"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTests(data);
      } catch (error) {
        console.error("Error fetching tests:", error);
      }
    };
    fetchTests();
  }, []);

  const handleAddTest = async () => {
    if (!testName || !testPrice) return;
    try {
      const docRef = await addDoc(collection(db, "labTests"), {
        name: testName,
        price: parseFloat(testPrice),
        createdAt: serverTimestamp(),
      });
      setTests([
        ...tests,
        { id: docRef.id, name: testName, price: parseFloat(testPrice) },
      ]);
      setTestName("");
      setTestPrice("");
    } catch (error) {
      console.error("Error adding test:", error);
    }
  };

  const handleUpdateTest = async () => {
    if (!editingTest || !editTestName || !editTestPrice) return;
    try {
      await updateDoc(doc(db, "labTests", editingTest.id), {
        name: editTestName,
        price: parseFloat(editTestPrice),
        updatedAt: serverTimestamp(),
      });
      setTests(
        tests.map((test) =>
          test.id === editingTest.id
            ? { ...test, name: editTestName, price: parseFloat(editTestPrice) }
            : test
        )
      );
      setEditingTest(null);
      setEditTestName("");
      setEditTestPrice("");
    } catch (error) {
      console.error("Error updating test:", error);
    }
  };

  const handleDeleteTest = async (id) => {
    try {
      await deleteDoc(doc(db, "labTests", id));
      setTests(tests.filter((test) => test.id !== id));
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  };

  return (
    <Box>
      {/* Add/Edit Test Form */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Test Name"
          value={editingTest ? editTestName : testName}
          onChange={(e) =>
            editingTest
              ? setEditTestName(e.target.value)
              : setTestName(e.target.value)
          }
          fullWidth
          margin="normal"
        />
        <TextField
          label="Price"
          value={editingTest ? editTestPrice : testPrice}
          onChange={(e) =>
            editingTest
              ? setEditTestPrice(e.target.value)
              : setTestPrice(e.target.value)
          }
          fullWidth
          margin="normal"
          type="number"
        />
        <Button
          onClick={editingTest ? handleUpdateTest : handleAddTest}
          startIcon={<Add />}
          variant="contained"
          sx={{ mt: 1 }}
        >
          {editingTest ? "Update Test" : "Add Test"}
        </Button>
        {editingTest && (
          <Button
            onClick={() => setEditingTest(null)}
            variant="outlined"
            sx={{ mt: 1, ml: 1 }}
          >
            Cancel
          </Button>
        )}
      </Box>

      {/* Tests Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Test Name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.length > 0 ? (
            tests.map((test) => (
              <TableRow key={test.id}>
                <TableCell>{test.name}</TableCell>
                <TableCell>{test.price.toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => {
                      setEditingTest(test);
                      setEditTestName(test.name);
                      setEditTestPrice(test.price);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteTest(test.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3}>No tests available</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

export default TestManagement;
