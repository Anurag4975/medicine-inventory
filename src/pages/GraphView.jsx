import { useEffect, useRef } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const GraphView = ({ filteredSales }) => {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const calculateTotals = (salesList) => {
    const totalAmount = salesList.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const fullyCreditAmount = salesList
      .filter(
        (sale) => sale.paymentType === "credit" && !sale.creditResolvedDate
      )
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const partiallyCreditAmount = salesList
      .filter(
        (sale) => sale.paymentType === "partiallyPaid" && sale.creditAmount > 0
      )
      .reduce((sum, sale) => sum + sale.creditAmount, 0);
    return { totalAmount, fullyCreditAmount, partiallyCreditAmount };
  };

  const getChartData = () => {
    const { totalAmount, fullyCreditAmount, partiallyCreditAmount } =
      calculateTotals(filteredSales);
    return {
      barData: {
        labels: ["Total Amount", "Fully Credit", "Partially Credit"],
        datasets: [
          {
            label: "Sales (NPR)",
            data: [totalAmount, fullyCreditAmount, partiallyCreditAmount],
            backgroundColor: ["#4CAF50", "#F44336", "#FF9800"],
            borderColor: ["#388E3C", "#D32F2F", "#F57C00"],
            borderWidth: 1,
          },
        ],
      },
      pieData: {
        labels: ["Fully Paid", "Credit", "Partially Paid"],
        datasets: [
          {
            data: [
              filteredSales.filter((sale) => sale.paymentType === "fullyPaid")
                .length,
              filteredSales.filter(
                (sale) =>
                  sale.paymentType === "credit" && !sale.creditResolvedDate
              ).length,
              filteredSales.filter(
                (sale) =>
                  sale.paymentType === "partiallyPaid" && sale.creditAmount > 0
              ).length,
            ],
            backgroundColor: ["#4CAF50", "#F44336", "#FF9800"],
            hoverOffset: 4,
          },
        ],
      },
    };
  };

  const { barData, pieData } = getChartData();

  // Cleanup chart instances on unmount
  useEffect(() => {
    return () => {
      if (barChartRef.current) {
        barChartRef.current.destroy();
      }
      if (pieChartRef.current) {
        pieChartRef.current.destroy();
      }
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
        flexWrap: "wrap",
        justifyContent: "center",
        mt: 4,
      }}
    >
      <Paper
        elevation={5}
        sx={{
          p: 3,
          width: { xs: "100%", sm: "45%" },
          borderRadius: 3,
          animation: "slideInLeft 1s ease",
          maxHeight: "400px", // Constrain height
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: "bold", color: "#1A237E" }}
        >
          Sales Overview (NPR)
        </Typography>
        <Box sx={{ height: "300px", position: "relative" }}>
          <Bar
            ref={barChartRef}
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
            }}
          />
        </Box>
      </Paper>
      <Paper
        elevation={5}
        sx={{
          p: 3,
          width: { xs: "100%", sm: "45%" },
          borderRadius: 3,
          animation: "slideInRight 1s ease",
          maxHeight: "400px", // Constrain height
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: "bold", color: "#1A237E" }}
        >
          Payment Distribution
        </Typography>
        <Box sx={{ height: "300px", position: "relative" }}>
          <Pie
            ref={pieChartRef}
            data={pieData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default GraphView;
