import { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Fade,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  TrendingUp,
  Analytics,
  Visibility,
  VisibilityOff,
  ShoppingCart,
  CreditCard,
  Wifi,
  WifiOff,
  Person,
  AttachMoney,
  BarChart,
  PieChart,
  Timeline,
  Warning,
  Star,
  InfoOutlined,
  MedicalServices,
  Inventory,
} from "@mui/icons-material";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

const GraphView = ({ filteredSales }) => {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const paymentPieRef = useRef(null);
  const medicineBarRef = useRef(null);
  const [showAmounts, setShowAmounts] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [medicineLimit, setMedicineLimit] = useState(10); // how many top medicines to show

  // ─── Quantity helpers ────────────────────────────────────────────────────────

  /** Total units sold across all sales */
  const getTotalQuantitySold = (salesList) =>
    salesList.reduce(
      (sum, sale) =>
        sum +
        (sale.medicines || []).reduce(
          (s, med) => s + (Number(med.quantity) || 0),
          0,
        ),
      0,
    );

  /** Aggregate per-medicine totals: { medicineName -> { quantity, revenue, brand, count } } */
  const getMedicineStats = (salesList) => {
    const stats = {};
    salesList.forEach((sale) => {
      (sale.medicines || []).forEach((med) => {
        const name = med.medicineName || "Unknown";
        if (!stats[name]) {
          stats[name] = {
            quantity: 0,
            revenue: 0,
            brand: med.brand || "",
            salesCount: 0,
          };
        }
        stats[name].quantity += Number(med.quantity) || 0;
        stats[name].revenue += Number(med.total) || 0;
        stats[name].salesCount += 1;
      });
    });
    return stats;
  };

  /** Sorted array of top medicines by quantity */
  const getTopMedicinesByQty = (salesList, limit = 10) => {
    const stats = getMedicineStats(salesList);
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  };

  // ─── Existing calculation helpers ────────────────────────────────────────────

  const calculateTotals = (salesList) => {
    const totalAmount = salesList.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0,
    );
    const fullyCreditAmount = salesList
      .filter(
        (sale) => sale.paymentType === "credit" && !sale.creditResolvedDate,
      )
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const partiallyCreditAmount = salesList
      .filter(
        (sale) => sale.paymentType === "partiallyPaid" && sale.creditAmount > 0,
      )
      .reduce((sum, sale) => sum + sale.creditAmount, 0);
    const paidAmount = totalAmount - fullyCreditAmount - partiallyCreditAmount;

    const onlineAmount = salesList
      .filter((sale) => sale.paymentMethod && sale.paymentMethod !== "Offline")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const offlineAmount = totalAmount - onlineAmount;
    const onlineCount = salesList.filter(
      (sale) => sale.paymentMethod && sale.paymentMethod !== "Offline",
    ).length;
    const offlineCount = salesList.length - onlineCount;

    const sellerStats = {};
    salesList.forEach((sale) => {
      const seller = sale.seller?.role || "Admin";
      if (!sellerStats[seller]) {
        sellerStats[seller] = { count: 0, amount: 0 };
      }
      sellerStats[seller].count += 1;
      sellerStats[seller].amount += sale.totalAmount;
    });

    const dailyData = {};
    salesList.forEach((sale) => {
      const date = new Date(sale.saleDate).toLocaleDateString("en-GB");
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, count: 0 };
      }
      dailyData[date].total += sale.totalAmount;
      dailyData[date].count += 1;
    });
    const topSellingDays = Object.entries(dailyData)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)
      .map(([date, data]) => ({ date, ...data }));

    const creditRisk =
      totalAmount > 0
        ? ((fullyCreditAmount + partiallyCreditAmount) / totalAmount) * 100
        : 0;

    return {
      totalAmount,
      fullyCreditAmount,
      partiallyCreditAmount,
      paidAmount,
      onlineAmount,
      offlineAmount,
      onlineCount,
      offlineCount,
      sellerStats,
      topSellingDays,
      creditRisk,
    };
  };

  const getDailyTrends = () => {
    const dailyData = {};
    filteredSales.forEach((sale) => {
      const date = new Date(sale.saleDate).toLocaleDateString("en-GB");
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, count: 0, paid: 0, credit: 0 };
      }
      dailyData[date].total += sale.totalAmount;
      dailyData[date].count += 1;
      if (sale.paymentType === "fullyPaid") {
        dailyData[date].paid += sale.totalAmount;
      } else {
        dailyData[date].credit += sale.totalAmount;
      }
    });
    const sortedDates = Object.keys(dailyData).sort(
      (a, b) =>
        new Date(a.split("/").reverse().join("-")) -
        new Date(b.split("/").reverse().join("-")),
    );
    return {
      labels: sortedDates,
      amounts: sortedDates.map((date) => dailyData[date].total),
      counts: sortedDates.map((date) => dailyData[date].count),
      paidAmounts: sortedDates.map((date) => dailyData[date].paid),
      creditAmounts: sortedDates.map((date) => dailyData[date].credit),
    };
  };

  // ─── Chart data ───────────────────────────────────────────────────────────────

  const getChartData = () => {
    const {
      totalAmount,
      fullyCreditAmount,
      partiallyCreditAmount,
      paidAmount,
      onlineAmount,
      offlineAmount,
      sellerStats,
      topSellingDays,
      creditRisk,
    } = calculateTotals(filteredSales);

    const {
      labels: trendLabels,
      amounts: trendAmounts,
      paidAmounts,
      creditAmounts,
    } = getDailyTrends();

    const topMeds = getTopMedicinesByQty(filteredSales, medicineLimit);

    // Palette for top-medicine bar chart
    const palette = [
      "rgba(102,126,234,0.85)",
      "rgba(118,75,162,0.85)",
      "rgba(240,147,251,0.85)",
      "rgba(245,87,108,0.85)",
      "rgba(255,152,0,0.85)",
      "rgba(76,175,80,0.85)",
      "rgba(33,150,243,0.85)",
      "rgba(0,188,212,0.85)",
      "rgba(255,87,34,0.85)",
      "rgba(233,30,99,0.85)",
    ];

    const medicineBarData = {
      labels: topMeds.map((m) =>
        m.name.length > 16 ? m.name.slice(0, 14) + "…" : m.name,
      ),
      datasets: [
        {
          label: "Quantity Sold",
          data: topMeds.map((m) => m.quantity),
          backgroundColor: topMeds.map((_, i) => palette[i % palette.length]),
          borderColor: topMeds.map((_, i) =>
            palette[i % palette.length].replace("0.85", "1"),
          ),
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };

    return {
      barData: {
        labels: ["Paid", "Full Credit", "Partial Credit"],
        datasets: [
          {
            label: showAmounts ? "Amount (NPR)" : "Hidden",
            data: showAmounts
              ? [paidAmount, fullyCreditAmount, partiallyCreditAmount]
              : [100, 80, 60],
            backgroundColor: [
              "rgba(76, 175, 80, 0.8)",
              "rgba(244, 67, 54, 0.8)",
              "rgba(255, 152, 0, 0.8)",
            ],
            borderColor: ["#4CAF50", "#F44336", "#FF9800"],
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      },
      pieData: {
        labels: ["Fully Paid", "Credit", "Partially Paid"],
        datasets: [
          {
            data: [
              filteredSales.filter((s) => s.paymentType === "fullyPaid").length,
              filteredSales.filter(
                (s) => s.paymentType === "credit" && !s.creditResolvedDate,
              ).length,
              filteredSales.filter(
                (s) => s.paymentType === "partiallyPaid" && s.creditAmount > 0,
              ).length,
            ],
            backgroundColor: [
              "rgba(76, 175, 80, 0.9)",
              "rgba(244, 67, 54, 0.9)",
              "rgba(255, 152, 0, 0.9)",
            ],
            borderColor: ["#4CAF50", "#F44336", "#FF9800"],
            borderWidth: 2,
          },
        ],
      },
      lineData: {
        labels: trendLabels,
        datasets: [
          {
            label: "Total Sales",
            data: showAmounts ? trendAmounts : trendAmounts.map(() => 0),
            borderColor: "#1976D2",
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
          {
            label: "Paid",
            data: showAmounts ? paidAmounts : paidAmounts.map(() => 0),
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
          },
          {
            label: "Credit",
            data: showAmounts ? creditAmounts : creditAmounts.map(() => 0),
            borderColor: "#F44336",
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
          },
        ],
      },
      paymentMethodPie: {
        labels: ["Online", "Offline"],
        datasets: [
          {
            data: [onlineAmount, offlineAmount],
            backgroundColor: [
              "rgba(33, 150, 243, 0.9)",
              "rgba(158, 158, 158, 0.9)",
            ],
            borderColor: ["#2196F3", "#9E9E9E"],
            borderWidth: 2,
          },
        ],
      },
      medicineBarData,
      topMeds,
      topSellingDays,
      creditRisk,
      sellerStats,
      totalAmount,
      paidAmount,
      fullyCreditAmount,
      partiallyCreditAmount,
    };
  };

  // ─── Chart options ────────────────────────────────────────────────────────────

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 10, weight: "600" },
          color: "#424242",
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        cornerRadius: 6,
        padding: 8,
        callbacks: {
          label: (context) =>
            showAmounts
              ? `${context.dataset.label}: NPR ${
                  context.parsed.y?.toLocaleString("en-NP") || context.parsed
                }`
              : "Hidden",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          color: "#666666",
          font: { size: 9, weight: "500" },
          callback: (value) =>
            showAmounts ? `NPR ${value.toLocaleString("en-NP")}` : "•••",
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#666666", font: { size: 9, weight: "500" } },
      },
    },
    animation: { duration: 1500, easing: "easeInOutQuart" },
  };

  // Separate options for medicine qty chart (no currency formatting)
  const medicineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (context) =>
            `Qty Sold: ${context.parsed.y?.toLocaleString("en-NP") ?? context.parsed}`,
        },
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: {
          color: "#666666",
          font: { size: 9, weight: "500" },
          callback: (value) => value.toLocaleString("en-NP"),
        },
      },
    },
  };

  // Cleanup chart instances on unmount
  useEffect(
    () => () => {
      [
        barChartRef,
        pieChartRef,
        lineChartRef,
        paymentPieRef,
        medicineBarRef,
      ].forEach((ref) => {
        if (ref.current) ref.current.destroy();
      });
    },
    [],
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (filteredSales.length === 0) {
    return (
      <Fade in timeout={600}>
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
            border: "1px solid #e3f2fd",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}
        >
          <Analytics sx={{ fontSize: 48, color: "#B0BEC5", mb: 2 }} />
          <Typography
            variant="h6"
            sx={{ color: "#B0BEC5", fontSize: "0.9rem", fontWeight: 500 }}
          >
            No data available for visualization
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#90A4AE", mt: 1, fontSize: "0.8rem" }}
          >
            Sales data will appear here once transactions are recorded.
          </Typography>
        </Paper>
      </Fade>
    );
  }

  const {
    barData,
    pieData,
    lineData,
    paymentMethodPie,
    medicineBarData,
    topMeds,
    topSellingDays,
    creditRisk,
    sellerStats,
    totalAmount,
    paidAmount,
    fullyCreditAmount,
    partiallyCreditAmount,
  } = getChartData();

  const { onlineCount, offlineCount } = calculateTotals(filteredSales);
  const totalQtySold = getTotalQuantitySold(filteredSales);
  const uniqueMedicineCount = Object.keys(
    getMedicineStats(filteredSales),
  ).length;

  return (
    <Fade in timeout={800}>
      <Box sx={{ p: 2 }}>
        {/* ── Stats Overview ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              icon: <ShoppingCart fontSize="small" />,
              label: "Total Transactions",
              value: filteredSales.length,
              gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            },
            {
              icon: <AttachMoney fontSize="small" />,
              label: "Total Sale Amount",
              value: showAmounts
                ? `NPR ${totalAmount.toLocaleString("en-NP")}`
                : "•••••",
              gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            },
            {
              icon: <AttachMoney fontSize="small" />,
              label: "Avg. Sale Value",
              value: showAmounts
                ? `NPR ${(totalAmount / filteredSales.length).toFixed(0)}`
                : "•••••",
              gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            },
            {
              icon: <TrendingUp fontSize="small" />,
              label: "Collection Rate",
              value: `${totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : 0}%`,
              gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            },
            {
              icon: <Warning fontSize="small" />,
              label: "Credit Risk",
              value: `${creditRisk.toFixed(1)}%`,
              gradient: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
            },
            // ── NEW: Quantity stat cards ──
            {
              icon: <Inventory fontSize="small" />,
              label: "Total Units Sold",
              value: totalQtySold.toLocaleString("en-NP"),
              gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
            },
            {
              icon: <MedicalServices fontSize="small" />,
              label: "Unique Medicines",
              value: uniqueMedicineCount,
              gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
            },
          ].map((stat, i) => (
            <Grid item xs={6} sm={4} md={12 / 7} key={i}>
              <Card
                sx={{
                  p: 1.5,
                  background: stat.gradient,
                  color: "white",
                  borderRadius: 2,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  height: "100%",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <CardContent sx={{ textAlign: "center", p: 1 }}>
                  <Box sx={{ fontSize: 20, mb: 0.5 }}>{stat.icon}</Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.9rem", fontWeight: 700, mt: 0.5 }}
                  >
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── Chart Type Toggle & Amount Toggle ── */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            p: 1.5,
            backgroundColor: "#f8f9fa",
            borderRadius: 2,
            border: "1px solid #e9ecef",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[
              {
                type: "bar",
                icon: <BarChart fontSize="small" />,
                label: "Bar",
              },
              {
                type: "pie",
                icon: <PieChart fontSize="small" />,
                label: "Pie",
              },
              {
                type: "line",
                icon: <Timeline fontSize="small" />,
                label: "Line",
              },
              {
                type: "medicine",
                icon: <MedicalServices fontSize="small" />,
                label: "Medicines",
              },
            ].map((item) => (
              <Chip
                key={item.type}
                label={item.label}
                onClick={() => setChartType(item.type)}
                icon={item.icon}
                variant={chartType === item.type ? "filled" : "outlined"}
                sx={{
                  backgroundColor:
                    chartType === item.type ? "#1976D2" : "transparent",
                  color: chartType === item.type ? "white" : "#1976D2",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 28,
                  "&:hover": {
                    backgroundColor:
                      chartType === item.type ? "#1565C0" : "#e3f2fd",
                  },
                }}
              />
            ))}
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={showAmounts}
                onChange={(e) => setShowAmounts(e.target.checked)}
                size="small"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#4CAF50" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#4CAF50",
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {showAmounts ? (
                  <Visibility fontSize="small" />
                ) : (
                  <VisibilityOff fontSize="small" />
                )}
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                  Show Amounts
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* ── Main Charts ── */}
        <Grid container spacing={2}>
          {/* Bar Chart */}
          {chartType === "bar" && (
            <>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    height: 320,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <BarChart sx={{ fontSize: 18, color: "#1976D2" }} />
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#1A237E",
                      }}
                    >
                      Sales Overview
                    </Typography>
                    <Tooltip title="Paid, Full Credit, and Partial Credit amounts">
                      <InfoOutlined
                        sx={{
                          fontSize: 16,
                          color: "#757575",
                          cursor: "pointer",
                        }}
                      />
                    </Tooltip>
                  </Box>
                  <Box sx={{ height: 240 }}>
                    <Bar
                      ref={barChartRef}
                      data={barData}
                      options={chartOptions}
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    height: 320,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <PieChart sx={{ fontSize: 18, color: "#7B1FA2" }} />
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#1A237E",
                      }}
                    >
                      Payment Distribution
                    </Typography>
                  </Box>
                  <Box sx={{ height: 240 }}>
                    <Pie
                      ref={pieChartRef}
                      data={pieData}
                      options={chartOptions}
                    />
                  </Box>
                </Paper>
              </Grid>
            </>
          )}

          {/* Pie Chart */}
          {chartType === "pie" && (
            <>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    height: 320,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <PieChart sx={{ fontSize: 18, color: "#7B1FA2" }} />
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#1A237E",
                      }}
                    >
                      Payment Status
                    </Typography>
                  </Box>
                  <Box sx={{ height: 240 }}>
                    <Pie
                      ref={pieChartRef}
                      data={pieData}
                      options={chartOptions}
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    height: 320,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Wifi sx={{ fontSize: 18, color: "#2196F3" }} />
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#1A237E",
                      }}
                    >
                      Payment Methods
                    </Typography>
                  </Box>
                  <Box sx={{ height: 180, mb: 2 }}>
                    <Pie
                      ref={paymentPieRef}
                      data={paymentMethodPie}
                      options={chartOptions}
                    />
                  </Box>
                  <Divider />
                  <Box sx={{ mt: 1.5 }}>
                    {[
                      {
                        icon: <Wifi fontSize="small" color="primary" />,
                        label: "Online",
                        value: `${onlineCount} sales`,
                      },
                      {
                        icon: <WifiOff fontSize="small" color="action" />,
                        label: "Offline",
                        value: `${offlineCount} sales`,
                      },
                    ].map((item, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          {item.icon}
                          <Typography
                            sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </>
          )}

          {/* Line Chart */}
          {chartType === "line" && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  height: 360,
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Timeline sx={{ fontSize: 18, color: "#FF6B35" }} />
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#1A237E",
                    }}
                  >
                    Daily Sales Trends
                  </Typography>
                </Box>
                <Box sx={{ height: 280 }}>
                  <Line
                    ref={lineChartRef}
                    data={lineData}
                    options={chartOptions}
                  />
                </Box>
              </Paper>
            </Grid>
          )}

          {/* ── NEW: Medicine Quantity View ── */}
          {chartType === "medicine" && (
            <>
              {/* Bar chart – top N medicines by qty */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MedicalServices
                        sx={{ fontSize: 18, color: "#11998e" }}
                      />
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#1A237E",
                        }}
                      >
                        Top Medicines by Quantity Sold
                      </Typography>
                      <Tooltip title="Total units sold per medicine across all filtered sales">
                        <InfoOutlined
                          sx={{
                            fontSize: 16,
                            color: "#757575",
                            cursor: "pointer",
                          }}
                        />
                      </Tooltip>
                    </Box>
                    {/* Show-top-N selector */}
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {[5, 10, 20].map((n) => (
                        <Chip
                          key={n}
                          label={`Top ${n}`}
                          size="small"
                          onClick={() => setMedicineLimit(n)}
                          variant={medicineLimit === n ? "filled" : "outlined"}
                          sx={{
                            backgroundColor:
                              medicineLimit === n ? "#11998e" : "transparent",
                            color: medicineLimit === n ? "white" : "#11998e",
                            borderColor: "#11998e",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 24,
                            "&:hover": {
                              backgroundColor:
                                medicineLimit === n ? "#0d7a6e" : "#e0f7f4",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ height: Math.max(260, topMeds.length * 28) }}>
                    <Bar
                      ref={medicineBarRef}
                      data={medicineBarData}
                      options={medicineChartOptions}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Table: detailed medicine breakdown */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Inventory sx={{ fontSize: 18, color: "#6a11cb" }} />
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#1A237E",
                      }}
                    >
                      Medicine Quantity Breakdown
                    </Typography>
                  </Box>

                  {/* Header row */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 80px 80px 80px",
                      gap: 1,
                      px: 1,
                      py: 0.5,
                      backgroundColor: "#1A237E",
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    {[
                      "Medicine",
                      "Brand",
                      "Qty Sold",
                      "Revenue",
                      "# Sales",
                    ].map((h) => (
                      <Typography
                        key={h}
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "white",
                        }}
                      >
                        {h}
                      </Typography>
                    ))}
                  </Box>

                  {/* Data rows */}
                  {getTopMedicinesByQty(filteredSales, medicineLimit).map(
                    (med, i) => (
                      <Box
                        key={med.name}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 80px 80px 80px",
                          gap: 1,
                          px: 1,
                          py: 0.75,
                          backgroundColor:
                            i % 2 === 0
                              ? "rgba(26,35,126,0.04)"
                              : "transparent",
                          borderRadius: 1,
                          alignItems: "center",
                          "&:hover": {
                            backgroundColor: "rgba(26,35,126,0.08)",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#1A237E",
                          }}
                        >
                          {med.name}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.7rem", color: "#546E7A" }}
                        >
                          {med.brand || "—"}
                        </Typography>
                        <Chip
                          label={med.quantity.toLocaleString("en-NP")}
                          size="small"
                          sx={{
                            backgroundColor: "rgba(17,153,142,0.12)",
                            color: "#11998e",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#2E7D32",
                          }}
                        >
                          {showAmounts
                            ? `NPR ${med.revenue.toLocaleString("en-NP")}`
                            : "•••••"}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            color: "#546E7A",
                            textAlign: "center",
                          }}
                        >
                          {med.salesCount}
                        </Typography>
                      </Box>
                    ),
                  )}

                  {/* Totals footer */}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 80px 80px 80px",
                      gap: 1,
                      px: 1,
                      py: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#1A237E",
                      }}
                    >
                      All Medicines
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#546E7A" }}>
                      {uniqueMedicineCount} types
                    </Typography>
                    <Chip
                      label={totalQtySold.toLocaleString("en-NP")}
                      size="small"
                      sx={{
                        backgroundColor: "#11998e",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        height: 20,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#2E7D32",
                      }}
                    >
                      {showAmounts
                        ? `NPR ${getTopMedicinesByQty(filteredSales, 9999)
                            .reduce((s, m) => s + m.revenue, 0)
                            .toLocaleString("en-NP")}`
                        : "•••••"}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        color: "#546E7A",
                        textAlign: "center",
                      }}
                    >
                      —
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>

        {/* ── Additional Insights ── */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <Star sx={{ fontSize: 18, color: "#FFD700" }} />
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#1A237E",
                  }}
                >
                  Top Selling Days
                </Typography>
              </Box>
              {topSellingDays.map((day, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    mb: 0.5,
                    backgroundColor:
                      i % 2 === 0 ? "action.hover" : "transparent",
                    borderRadius: 1,
                  }}
                >
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    {day.date}
                  </Typography>
                  <Box textAlign="right">
                    <Typography
                      sx={{ fontSize: "0.7rem", color: "text.secondary" }}
                    >
                      {day.count} sales
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                      {showAmounts
                        ? `NPR ${day.total.toLocaleString("en-NP")}`
                        : "•••••"}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <Person sx={{ fontSize: 18, color: "#9C27B0" }} />
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#1A237E",
                  }}
                >
                  Seller Performance
                </Typography>
              </Box>
              {Object.entries(sellerStats).map(([seller, stats], i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    mb: 0.5,
                    backgroundColor:
                      i % 2 === 0 ? "action.hover" : "transparent",
                    borderRadius: 1,
                  }}
                >
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    {seller}
                  </Typography>
                  <Box textAlign="right">
                    <Typography
                      sx={{ fontSize: "0.7rem", color: "text.secondary" }}
                    >
                      {stats.count} sales
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                      {showAmounts
                        ? `NPR ${stats.amount.toLocaleString("en-NP")}`
                        : "•••••"}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* ── NEW: Quick top-5 medicines summary (always visible) ── */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <MedicalServices sx={{ fontSize: 18, color: "#11998e" }} />
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#1A237E",
                  }}
                >
                  Top 5 Medicines
                </Typography>
                <Tooltip title="Ranked by units sold">
                  <InfoOutlined
                    sx={{ fontSize: 16, color: "#757575", cursor: "pointer" }}
                  />
                </Tooltip>
              </Box>
              {getTopMedicinesByQty(filteredSales, 5).map((med, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    mb: 0.5,
                    backgroundColor:
                      i % 2 === 0 ? "rgba(17,153,142,0.06)" : "transparent",
                    borderRadius: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        color: "#11998e",
                        minWidth: 14,
                      }}
                    >
                      #{i + 1}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#1A237E",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {med.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${med.quantity} units`}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(17,153,142,0.12)",
                      color: "#11998e",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      height: 18,
                      flexShrink: 0,
                    }}
                  />
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", px: 1 }}
              >
                <Typography sx={{ fontSize: "0.72rem", color: "#546E7A" }}>
                  Total units
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#11998e",
                  }}
                >
                  {totalQtySold.toLocaleString("en-NP")}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* ── Financial Summary (visible when amounts are shown) ── */}
        {showAmounts && (
          <Paper
            sx={{
              p: 2,
              mt: 2,
              borderRadius: 2,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              backgroundColor: "success.lighter",
              transition: "transform 0.2s",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                mb: 1.5,
                color: "#2E7D32",
              }}
            >
              Financial Summary
            </Typography>
            <Grid container spacing={1}>
              {[
                {
                  label: "Total Sale Amount",
                  value: totalAmount,
                  color: "#1976D2",
                },
                { label: "Collected", value: paidAmount, color: "#2E7D32" },
                {
                  label: "Outstanding Credit",
                  value: fullyCreditAmount + partiallyCreditAmount,
                  color: "#C62828",
                },
                { label: "Online Sales", value: onlineCount, color: "#2196F3" },
                {
                  label: "Offline Sales",
                  value: totalAmount - onlineCount,
                  color: "#757575",
                },
              ].map((item, i) => (
                <Grid item xs={6} sm={4} md={2.4} key={i}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: item.color,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    NPR {item.value.toLocaleString("en-NP")}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>
    </Fade>
  );
};

export default GraphView;
