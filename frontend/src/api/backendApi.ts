import { createHttpClient } from "./httpClient";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL;

export const backendHttp = createHttpClient(BACKEND_BASE_URL, AUTH_BASE_URL);

export interface Employee {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  hire_date: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftType {
  id: number;
  name: string;
  color: string;
  is_work_shift: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface Service {
  id: number;
  name: string;
  start_time: string | null;
  end_time: string | null;
}

export interface Schedule {
  id: number;
  employee: number;
  employee_name: string;
  date: string;
  shift_type: number;
  shift_type_name: string;
  shift_color: string;
}

export interface SchedulingRule {
  id: number;
  name: string;
  max_consecutive_days: number;
  mandatory_rest_days: number;
  avoid_consecutive_nights: boolean;
  min_employees_per_day: number;
  max_schedule_days: number;
  solver_time_limit_seconds: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  backgroundColor: string;
  extendedProps: { employee_id: number; shift_type_id: number };
}

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const backendApi = {
  listEmployees: () => backendHttp.get<Paginated<Employee>>("/api/employees/").then((r) => r.data.results),
  createEmployee: (data: Partial<Employee>) =>
    backendHttp.post<Employee>("/api/employees/", data).then((r) => r.data),
  updateEmployee: (id: number, data: Partial<Employee>) =>
    backendHttp.patch<Employee>(`/api/employees/${id}/`, data).then((r) => r.data),
  deleteEmployee: (id: number) => backendHttp.delete(`/api/employees/${id}/`),

  listShiftTypes: () => backendHttp.get<Paginated<ShiftType>>("/api/shift-types/").then((r) => r.data.results),
  createShiftType: (data: Partial<ShiftType>) =>
    backendHttp.post<ShiftType>("/api/shift-types/", data).then((r) => r.data),
  updateShiftType: (id: number, data: Partial<ShiftType>) =>
    backendHttp.patch<ShiftType>(`/api/shift-types/${id}/`, data).then((r) => r.data),
  deleteShiftType: (id: number) => backendHttp.delete(`/api/shift-types/${id}/`),

  listServices: () => backendHttp.get<Paginated<Service>>("/api/services/").then((r) => r.data.results),
  createService: (data: Partial<Service>) =>
    backendHttp.post<Service>("/api/services/", data).then((r) => r.data),
  updateService: (id: number, data: Partial<Service>) =>
    backendHttp.patch<Service>(`/api/services/${id}/`, data).then((r) => r.data),
  deleteService: (id: number) => backendHttp.delete(`/api/services/${id}/`),

  listRules: () => backendHttp.get<Paginated<SchedulingRule>>("/api/scheduling-rules/").then((r) => r.data.results),
  createRule: (data: Partial<SchedulingRule>) =>
    backendHttp.post<SchedulingRule>("/api/scheduling-rules/", data).then((r) => r.data),
  updateRule: (id: number, data: Partial<SchedulingRule>) =>
    backendHttp.patch<SchedulingRule>(`/api/scheduling-rules/${id}/`, data).then((r) => r.data),

  calendarData: (start: string, end: string, employeeIds: number[] = []) => {
    const params = new URLSearchParams({ start, end });
    employeeIds.forEach((id) => params.append("employee_ids", String(id)));
    return backendHttp.get<CalendarEvent[]>(`/api/schedules/calendar_data/?${params.toString()}`).then((r) => r.data);
  },

  updateShift: (employeeId: number, date: string, shiftTypeId: number) =>
    backendHttp
      .post<Schedule>("/api/update-shift/", { employee_id: employeeId, date, shift_type_id: shiftTypeId })
      .then((r) => r.data),

  generateSchedule: (data: { start_date: string; end_date: string; employee_ids?: number[]; rule_id?: number }) =>
    backendHttp
      .post<{ message: string; schedules_created: number }>("/api/schedules/generate/", data)
      .then((r) => r.data),

  exportSchedule: (start: string, end: string) =>
    backendHttp
      .get("/api/export/", { params: { start, end }, responseType: "blob" })
      .then((r) => r.data as Blob),
};
