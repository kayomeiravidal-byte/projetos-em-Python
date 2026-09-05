import { FormEvent, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Link, Paper, TextField, Typography } from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="background.default">
      <Paper sx={{ p: 4, width: 360 }} elevation={2}>
        <Typography variant="h5" fontWeight={600} mb={3}>
          Entrar
        </Typography>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <Typography variant="body2" textAlign="center">
            Não tem uma organização? <Link component={RouterLink} to="/register">Criar conta</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
