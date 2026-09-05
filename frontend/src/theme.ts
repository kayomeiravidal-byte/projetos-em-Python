import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    secondary: { main: "#7c3aed" },
    background: { default: "#f4f6f8" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: ["Inter", "Segoe UI", "system-ui", "sans-serif"].join(","),
  },
});
