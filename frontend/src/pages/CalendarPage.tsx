import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DownloadIcon from "@mui/icons-material/Download";
import { backendApi } from "../api/backendApi";
import { useAuth } from "../auth/AuthContext";

interface ShiftDialogState {
  open: boolean;
  employeeId: string;
  shiftTypeId: string;
  date: string;
}

const EMPTY_DIALOG: ShiftDialogState = { open: false, employeeId: "", shiftTypeId: "", date: "" };

export function CalendarPage() {
  const { hasPermission } = useAuth();
  const calendarRef = useRef<FullCalendar | null>(null);

  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: backendApi.listEmployees });
  const { data: shiftTypes = [] } = useQuery({ queryKey: ["shiftTypes"], queryFn: backendApi.listShiftTypes });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [dialog, setDialog] = useState<ShiftDialogState>(EMPTY_DIALOG);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const [generating, setGenerating] = useState(false);

  function toggleEmployee(id: number) {
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    calendarRef.current?.getApi().refetchEvents();
  }

  function notify(message: string, severity: "success" | "error" = "success") {
    setSnackbar({ message, severity });
  }

  function fetchEvents(
    info: { startStr: string; endStr: string },
    success: (events: EventInput[]) => void,
    failure: (err: Error) => void
  ) {
    backendApi
      .calendarData(info.startStr.substring(0, 10), info.endStr.substring(0, 10), selectedEmployeeIds)
      .then((events) => success(events.map((event) => ({ ...event, id: String(event.id) }))))
      .catch(failure);
  }

  function handleSelect(info: DateSelectArg) {
    setDialog({
      open: true,
      date: info.startStr.substring(0, 10),
      employeeId: String(selectedEmployeeIds[0] ?? employees[0]?.id ?? ""),
      shiftTypeId: String(shiftTypes[0]?.id ?? ""),
    });
  }

  function handleEventClick(info: EventClickArg) {
    setDialog({
      open: true,
      date: info.event.startStr.substring(0, 10),
      employeeId: String(info.event.extendedProps.employee_id),
      shiftTypeId: String(info.event.extendedProps.shift_type_id),
    });
  }

  async function handleEventDrop(info: EventDropArg) {
    try {
      await backendApi.updateShift(
        info.event.extendedProps.employee_id,
        info.event.startStr.substring(0, 10),
        info.event.extendedProps.shift_type_id
      );
      notify("Turno atualizado.");
    } catch (err: any) {
      notify(err?.response?.data?.error ?? "Erro ao mover turno.", "error");
      info.revert();
    }
  }

  async function saveShift() {
    if (!dialog.employeeId || !dialog.shiftTypeId || !dialog.date) {
      notify("Preencha todos os campos.", "error");
      return;
    }
    try {
      await backendApi.updateShift(Number(dialog.employeeId), dialog.date, Number(dialog.shiftTypeId));
      setDialog(EMPTY_DIALOG);
      calendarRef.current?.getApi().refetchEvents();
      notify("Turno salvo.");
    } catch (err: any) {
      notify(err?.response?.data?.error ?? "Erro ao salvar turno.", "error");
    }
  }

  function currentViewRange(): { start: string; end: string } | null {
    const api = calendarRef.current?.getApi();
    if (!api) return null;
    const start = api.view.activeStart.toISOString().substring(0, 10);
    const end = new Date(api.view.activeEnd.getTime() - 1).toISOString().substring(0, 10);
    return { start, end };
  }

  async function handleGenerate() {
    const range = currentViewRange();
    if (!range) return;
    setGenerating(true);
    try {
      const result = await backendApi.generateSchedule({
        start_date: range.start,
        end_date: range.end,
        employee_ids: selectedEmployeeIds,
      });
      notify(`Escala gerada: ${result.schedules_created} registros criados.`);
      calendarRef.current?.getApi().refetchEvents();
    } catch (err: any) {
      notify(err?.response?.data?.error ?? "Erro ao gerar escala.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport() {
    const range = currentViewRange();
    if (!range) return;
    try {
      const blob = await backendApi.exportSchedule(range.start, range.end);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `escala_${range.start}_${range.end}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify("Erro ao exportar escala.", "error");
    }
  }

  return (
    <Box display="flex" gap={2}>
      <Paper sx={{ p: 2, width: 260, flexShrink: 0, position: "sticky", top: 80, alignSelf: "flex-start" }}>
        <Typography variant="overline" color="text.secondary">
          Funcionários
        </Typography>
        <List dense>
          {employees.map((employee) => (
            <ListItemButton
              key={employee.id}
              selected={selectedEmployeeIds.includes(employee.id)}
              onClick={() => toggleEmployee(employee.id)}
            >
              <ListItemText primary={employee.name} />
            </ListItemButton>
          ))}
          {employees.length === 0 && (
            <Typography variant="body2" color="text.secondary" px={2}>
              Nenhum funcionário ativo.
            </Typography>
          )}
        </List>

        <Typography variant="overline" color="text.secondary">
          Tipos de Turno
        </Typography>
        <Box display="flex" flexDirection="column" gap={0.5} mb={2} mt={1}>
          {shiftTypes.map((shiftType) => (
            <Box key={shiftType.id} display="flex" alignItems="center" gap={1}>
              <Box width={12} height={12} borderRadius="50%" bgcolor={shiftType.color} />
              <Typography variant="body2">{shiftType.name}</Typography>
            </Box>
          ))}
        </Box>

        <Box display="flex" flexDirection="column" gap={1}>
          {hasPermission("schedules:generate") && (
            <Button
              startIcon={<PlayArrowIcon />}
              variant="contained"
              size="small"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Gerando..." : "Gerar Escala"}
            </Button>
          )}
          {hasPermission("export:excel") && (
            <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={handleExport}>
              Exportar Excel
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2, flexGrow: 1, minWidth: 0 }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="pt-br"
          height="auto"
          editable={hasPermission("schedules:write")}
          selectable={hasPermission("schedules:write")}
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listMonth" }}
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          events={fetchEvents}
        />
      </Paper>

      <Dialog open={dialog.open} onClose={() => setDialog(EMPTY_DIALOG)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar Turno</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            select
            label="Funcionário"
            value={dialog.employeeId}
            onChange={(e) => setDialog({ ...dialog, employeeId: e.target.value })}
          >
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Tipo de Turno"
            value={dialog.shiftTypeId}
            onChange={(e) => setDialog({ ...dialog, shiftTypeId: e.target.value })}
          >
            {shiftTypes.map((shiftType) => (
              <MenuItem key={shiftType.id} value={shiftType.id}>
                {shiftType.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Data"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dialog.date}
            onChange={(e) => setDialog({ ...dialog, date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(EMPTY_DIALOG)}>Cancelar</Button>
          <Button variant="contained" onClick={saveShift}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {snackbar ? <Alert severity={snackbar.severity}>{snackbar.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
