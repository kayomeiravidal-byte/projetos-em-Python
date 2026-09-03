# frontend (em construção)

SPA em React + Vite + TypeScript + MUI, consumindo duas APIs:

- [auth-service](../auth-service) (Java) — login, sessão, papéis/permissões
- [backend](../backend) (Django) — funcionários, escalas, algoritmo de
  geração, export Excel

## Telas planejadas

- Login (`AuthContext` guardando o JWT, `ProtectedRoute` por permissão)
- Dashboard
- Calendário interativo com drag-and-drop (substitui o FullCalendar do
  template Django atual)
- Gestão de funcionários e tipos de turno
- Geração de escala e exportação para Excel

## Deploy

Site estático (build do Vite) publicado gratuitamente na Vercel ou Netlify,
apontando para as URLs do `backend` e do `auth-service` no Render via
variáveis de ambiente.

Implementação prevista para uma próxima fase do projeto.
