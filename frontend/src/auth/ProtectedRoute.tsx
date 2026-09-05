import { Navigate, Outlet } from "react-router-dom";
import { Alert, Box } from "@mui/material";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ permission }: { permission?: string }) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (permission && !hasPermission(permission)) {
    return (
      <Box p={4}>
        <Alert severity="warning">Você não tem permissão para acessar esta página.</Alert>
      </Box>
    );
  }
  return <Outlet />;
}
