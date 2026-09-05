import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { backendApi, Employee } from "../api/backendApi";
import { useAuth } from "../auth/AuthContext";

const EMPTY_FORM = { name: "", email: "", hire_date: "", is_active: true };

export function EmployeesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("employees:manage");
  const queryClient = useQueryClient();
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: backendApi.listEmployees,
  });

  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? backendApi.updateEmployee(editing.id, form)
        : backendApi.createEmployee(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setOpen(false);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      setFormError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Erro ao salvar.");
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      hire_date: employee.hire_date,
      is_active: employee.is_active,
    });
    setFormError(null);
    setOpen(true);
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Funcionários
        </Typography>
        {canManage && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
            Novo funcionário
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">Erro ao carregar funcionários.</Alert>}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Admissão</TableCell>
              <TableCell>Status</TableCell>
              {canManage && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Carregando...</TableCell>
              </TableRow>
            )}
            {employees?.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.hire_date}</TableCell>
                <TableCell>{employee.is_active ? "Ativo" : "Inativo"}</TableCell>
                {canManage && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(employee)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {employees?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">Nenhum funcionário cadastrado.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
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
            label="Data de admissão"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={form.hire_date}
            onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
            }
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
