import { useState } from "react";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupIcon from "@mui/icons-material/Group";
import PaletteIcon from "@mui/icons-material/Palette";
import RuleIcon from "@mui/icons-material/Rule";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../auth/AuthContext";

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: "Calendário", path: "/", icon: <CalendarMonthIcon /> },
  { label: "Funcionários", path: "/employees", icon: <GroupIcon /> },
  { label: "Tipos de Turno", path: "/shift-types", icon: <PaletteIcon /> },
  { label: "Serviços", path: "/services", icon: <RoomServiceIcon /> },
  { label: "Regras", path: "/rules", icon: <RuleIcon /> },
  { label: "Usuários", path: "/users", icon: <AdminPanelSettingsIcon />, permission: "users:manage" },
];

export function AppLayout() {
  const { claims, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }} color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Sistema de Escala
          </Typography>
          {claims && <Chip label={claims.role} size="small" color="primary" variant="outlined" />}
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <AccountCircleIcon />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled>{claims?.email}</MenuItem>
            <MenuItem onClick={logout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          {visibleItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: "background.default" }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
