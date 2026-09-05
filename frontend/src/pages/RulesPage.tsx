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
import { backendApi, SchedulingRule } from "../api/backendApi";
import { useAuth } from "../auth/AuthContext";

const EMPTY_FORM = {
  name: "",
  max_consecutive_days: 5,
  mandatory_rest_days: 1,
  avoid_consecutive_nights: true,
  min_employees_per_day: 1,
  max_schedule_days: 90,
  solver_time_limit_seconds: 30,
};

export function RulesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("rules:manage");
  const queryClient = useQueryClient();
  const { data: rules, isLoading, error } = useQuery({ queryKey: ["rules"], queryFn: backendApi.listRules });

  const [editing, setEditing] = useState<SchedulingRule | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => (editing ? backendApi.updateRule(editing.id, form) : backendApi.createRule(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
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

  function openEdit(rule: SchedulingRule) {
    setEditing(rule);
    setForm({
      name: rule.name,
      max_consecutive_days: rule.max_consecutive_days,
      mandatory_rest_days: rule.mandatory_rest_days,
      avoid_consecutive_nights: rule.avoid_consecutive_nights,
      min_employees_per_day: rule.min_employees_per_day,
      max_schedule_days: rule.max_schedule_days,
      solver_time_limit_seconds: rule.solver_time_limit_seconds,
    });
    setFormError(null);
    setOpen(true);
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Regras de Escalonamento
        </Typography>
        {canManage && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
            Nova regra
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">Erro ao carregar regras.</Alert>}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Máx. dias seguidos</TableCell>
              <TableCell>Descanso obrigatório</TableCell>
              <TableCell>Mín. por dia</TableCell>
              {canManage && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Carregando...</TableCell>
              </TableRow>
            )}
            {rules?.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.name}</TableCell>
                <TableCell>{rule.max_consecutive_days}</TableCell>
                <TableCell>{rule.mandatory_rest_days}</TableCell>
                <TableCell>{rule.min_employees_per_day}</TableCell>
                {canManage && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(rule)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {rules?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">Nenhuma regra cadastrada.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Editar regra" : "Nova regra"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <TextField
            label="Máximo de dias consecutivos"
            type="number"
            value={form.max_consecutive_days}
            onChange={(e) => setForm({ ...form, max_consecutive_days: Number(e.target.value) })}
          />
          <TextField
            label="Dias de descanso obrigatório"
            type="number"
            value={form.mandatory_rest_days}
            onChange={(e) => setForm({ ...form, mandatory_rest_days: Number(e.target.value) })}
          />
          <TextField
            label="Mínimo de funcionários por dia"
            type="number"
            value={form.min_employees_per_day}
            onChange={(e) => setForm({ ...form, min_employees_per_day: Number(e.target.value) })}
          />
          <TextField
            label="Limite máximo de dias por geração"
            type="number"
            value={form.max_schedule_days}
            onChange={(e) => setForm({ ...form, max_schedule_days: Number(e.target.value) })}
          />
          <TextField
            label="Timeout do solver (segundos)"
            type="number"
            value={form.solver_time_limit_seconds}
            onChange={(e) => setForm({ ...form, solver_time_limit_seconds: Number(e.target.value) })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.avoid_consecutive_nights}
                onChange={(e) => setForm({ ...form, avoid_consecutive_nights: e.target.checked })}
              />
            }
            label="Evitar noites seguidas"
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
