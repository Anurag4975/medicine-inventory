import React from "react";
import {
  Grid,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";

const FilterControls = ({
  searchTerm,
  setSearchTerm,
  calendarDate,
  setShowCalendar,
  showCalendar,
  clearFilters,
}) => {
  return (
    <Grid container spacing={1} alignItems="center" mb={2}>
      <Grid item xs={12} md={6} lg={4}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearFilters} sx={{ p: 0.5 }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      {/* Calendar button and other controls */}
    </Grid>
  );
};

export default FilterControls;
