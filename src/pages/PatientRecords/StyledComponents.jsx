import { styled, alpha } from "@mui/material/styles";
import { Paper, ListItem } from "@mui/material";

export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#f7f9fc",
  borderRadius: theme.shape.borderRadius * 2,
}));

export const HighlightedListItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.success.main, 0.1),
  borderRadius: theme.shape.borderRadius,
  borderLeft: `4px solid ${theme.palette.success.main}`,
  marginBottom: theme.spacing(1),
  transition: "background-color 0.3s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.success.main, 0.15),
  },
}));
