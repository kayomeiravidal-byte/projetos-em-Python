import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { backendApi, Service } from "../api/backendApi";
import { useAuth } from "../auth/AuthContext";

const EMPTY_FORM = { name: "", start_time: "", end_time: "" };

export function ServicesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("employees:manage");
  const queryClient = useQueryClient();
  const { data: services, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: backendApi.listServices,
  });

  const [editing, setEditing] = useState<Service | null>(null);
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
      return editing ? backendApi.updateService(editing.id, payload) : backendApi.createService(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
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

  function openEdit(service: Service) {
    setEditing(service);
    setForm({
      name: service.name,
      start_time: service.start_time ?? "",
      end_time: service.end_time ?? "",
    });
    setFormError(null);
    setOpen(true);
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Serviços
        </Typography>
        {canManage && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
            Novo serviço
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">Erro ao carregar serviços.</Alert>}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Horário</TableCell>
              {canManage && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3}>Carregando...</TableCell>
              </TableRow>
            )}
            {services?.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>
                  {service.start_time && service.end_time
                    ? `${service.start_time.slice(0, 5)} – ${service.end_time.slice(0, 5)}`
                    : "—"}
                </TableCell>
                {canManage && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(service)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {services?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary">Nenhum serviço cadastrado.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
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
