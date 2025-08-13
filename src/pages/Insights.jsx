import { useState } from "react";
import {
  Container,
  Typography,
  FormControlLabel,
  Switch,
  Box,
  GlobalStyles,
} from "@mui/material";
import FilterSection from "./FilterSection";
import TableView from "./TableView";
import GraphView from "./GraphView";

function Insights() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("day");
  const [customDate, setCustomDate] = useState(null);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("table");

  return (
    <>
      {/* Define global keyframes */}
      <GlobalStyles
        styles={{
          "@keyframes fadeIn": {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
          "@keyframes fadeInUp": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
          "@keyframes slideInLeft": {
            from: { opacity: 0, transform: "translateX(-20px)" },
            to: { opacity: 1, transform: "translateX(0)" },
          },
          "@keyframes slideInRight": {
            from: { opacity: 0, transform: "translateX(20px)" },
            to: { opacity: 1, transform: "translateX(0)" },
          },
        }}
      />

      <Container maxWidth="xl" sx={{ mt: 5, mb: 5 }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "#1A237E",
            textAlign: "center",
            animation: "fadeIn 1s ease-in",
          }}
        >
          Sales Insights
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={view === "graph"}
                onChange={() => setView(view === "table" ? "graph" : "table")}
              />
            }
            label={view === "table" ? "Switch to Graphs" : "Switch to Table"}
            sx={{ fontWeight: "bold", color: "#1A237E" }}
          />
        </Box>

        <FilterSection
          filter={filter}
          setFilter={setFilter}
          customDate={customDate}
          setCustomDate={setCustomDate}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sales={sales}
          setSales={setSales}
          setFilteredSales={setFilteredSales}
          setLoading={setLoading}
        />

        {loading ? (
          <Typography sx={{ textAlign: "center", mt: 5 }}>
            Loading...
          </Typography>
        ) : (
          <Box sx={{ minHeight: "400px" }}>
            {view === "table" ? (
              <TableView
                filteredSales={filteredSales}
                setSales={setSales}
                setFilteredSales={setFilteredSales}
                filter={filter}
                customDate={customDate}
                paymentFilter={paymentFilter}
                searchQuery={searchQuery}
              />
            ) : (
              <GraphView filteredSales={filteredSales} />
            )}
          </Box>
        )}
      </Container>
    </>
  );
}

export default Insights;
