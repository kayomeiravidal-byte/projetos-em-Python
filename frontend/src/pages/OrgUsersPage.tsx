import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";

const ROLE_HIERARCHY = ["ADMIN", "SUPERVISOR", "LIDER", "FUNCIONARIO"];

function rolesBelow(role: string): string[] {
  const rank = ROLE_HIERARCHY.indexOf(role);
  return rank === -1 ? [] : ROLE_HIERARCHY.slice(rank + 1);
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "" };

export function OrgUsersPage() {
  const { claims } = useAuth();
  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useQuery({ queryKey: ["orgUsers"], queryFn: authApi.listOrgUsers });

  const assignableRoles = claims ? rolesBelow(claims.role) : [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => authApi.createOrgUser(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgUsers"] });
      setOpen(false);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error ?? "Erro ao criar usuário.");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => authApi.updateOrgUser(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orgUsers"] }),
  });

  function openCreate() {
    setForm({ ...EMPTY_FORM, role: assignableRoles[0] ?? "" });
    setFormError(null);
    setOpen(true);
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Usuários da Organização
        </Typography>
        {assignableRoles.length > 0 && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
            Novo usuário
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">Erro ao carregar usuários.</Alert>}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Papel</TableCell>
              <TableCell>Ativo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}>Carregando...</TableCell>
              </TableRow>
            )}
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.active}
                    disabled={!assignableRoles.includes(user.role)}
                    onChange={(e) => toggleActiveMutation.mutate({ id: user.id, active: e.target.checked })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Novo usuário</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <TextField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Senha"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            helperText="Mínimo de 8 caracteres"
          />
          <TextField
            select
            label="Papel"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {assignableRoles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
