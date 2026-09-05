import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CalendarPage } from "./pages/CalendarPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { ShiftTypesPage } from "./pages/ShiftTypesPage";
import { ServicesPage } from "./pages/ServicesPage";
import { RulesPage } from "./pages/RulesPage";
import { OrgUsersPage } from "./pages/OrgUsersPage";

const queryClient = new QueryClient();

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<CalendarPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/shift-types" element={<ShiftTypesPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/rules" element={<RulesPage />} />
                  <Route element={<ProtectedRoute permission="users:manage" />}>
                    <Route path="/users" element={<OrgUsersPage />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
