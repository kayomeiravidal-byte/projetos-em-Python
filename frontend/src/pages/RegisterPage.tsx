import { FormEvent, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Link, Paper, TextField, Typography } from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(organizationName, name, email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="background.default">
      <Paper sx={{ p: 4, width: 400 }} elevation={2}>
        <Typography variant="h5" fontWeight={600} mb={1}>
          Criar organização
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Você vira o administrador da sua organização e pode convidar o resto da equipe depois.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nome da organização"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            autoFocus
          />
          <TextField label="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="Mínimo de 8 caracteres"
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
          <Typography variant="body2" textAlign="center">
            Já tem uma conta? <Link component={RouterLink} to="/login">Entrar</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
