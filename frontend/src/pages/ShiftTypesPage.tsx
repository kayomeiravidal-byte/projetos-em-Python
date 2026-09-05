import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
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
import { backendApi, ShiftType } from "../api/backendApi";
import { useAuth } from "../auth/AuthContext";

const EMPTY_FORM = { name: "", color: "#2563eb", is_work_shift: true, start_time: "", end_time: "" };

export function ShiftTypesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("employees:manage");
  const queryClient = useQueryClient();
  const { data: shiftTypes, isLoading, error } = useQuery({
    queryKey: ["shiftTypes"],
    queryFn: backendApi.listShiftTypes,
  });

  const [editing, setEditing] = useState<ShiftType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
      };
      return editing ? backendApi.updateShiftType(editing.id, payload) : backendApi.createShiftType(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftTypes"] });
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

  function openEdit(shiftType: ShiftType) {
    setEditing(shiftType);
    setForm({
      name: shiftType.name,
      color: shiftType.color,
      is_work_shift: shiftType.is_work_shift,
      start_time: shiftType.start_time ?? "",
      end_time: shiftType.end_time ?? "",
    });
    setFormError(null);
    setOpen(true);
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Tipos de Turno
        </Typography>
        {canManage && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
            Novo tipo de turno
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">Erro ao carregar tipos de turno.</Alert>}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Cor</TableCell>
              <TableCell>Horário</TableCell>
              <TableCell>Conta como trabalho</TableCell>
              {canManage && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Carregando...</TableCell>
              </TableRow>
            )}
            {shiftTypes?.map((shiftType) => (
              <TableRow key={shiftType.id}>
                <TableCell>
                  <Chip label={shiftType.name} sx={{ bgcolor: shiftType.color, color: "#fff" }} size="small" />
                </TableCell>
                <TableCell>{shiftType.color}</TableCell>
                <TableCell>
                  {shiftType.start_time && shiftType.end_time
                    ? `${shiftType.start_time.slice(0, 5)} – ${shiftType.end_time.slice(0, 5)}`
                    : "—"}
                </TableCell>
                <TableCell>{shiftType.is_work_shift ? "Sim" : "Não"}</TableCell>
                {canManage && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(shiftType)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {shiftTypes?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">Nenhum tipo de turno cadastrado.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Editar tipo de turno" : "Novo tipo de turno"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <TextField
            label="Cor"
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
          <Box display="flex" gap={2}>
            <TextField
              label="Início"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <TextField
              label="Fim"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_work_shift}
                onChange={(e) => setForm({ ...form, is_work_shift: e.target.checked })}
              />
            }
            label="Conta como turno de trabalho"
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
