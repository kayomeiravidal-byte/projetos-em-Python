# frontend

SPA em React + Vite + TypeScript + MUI, consumindo duas APIs:

- [auth-service](../auth-service) (Java) — login, registro, papéis/permissões
- [backend](../backend) (Django) — funcionários, escalas, algoritmo de
  geração, export Excel

## Telas

- Login e registro (registro cria uma organização nova + o usuário admin)
- Calendário interativo (FullCalendar) com drag-and-drop, seleção de
  funcionários, geração automática de escala e export para Excel
- Gestão de funcionários, tipos de turno (com horário de início/fim),
  serviços (catálogo de responsabilidades do dia, também com horário) e
  regras de escalonamento
- Gestão de usuários da organização, respeitando a hierarquia de papéis
  (só oferece papéis estritamente abaixo do de quem está logado)

Botões e rotas administrativas somem conforme as permissões do usuário
logado (`schedules:generate`, `schedules:write`, `employees:manage`,
`rules:manage`, `export:excel`, `users:manage`) — a autorização de verdade
continua sendo sempre aplicada no servidor.

## Rodando localmente

```bash
cp .env.example .env
npm install
npm run dev
```

Espera o `auth-service` e o `backend` no ar (`docker compose up` na raiz).

## Deploy

Site estático (`npm run build`) publicado gratuitamente na Vercel ou
Netlify, apontando para as URLs do `backend` e do `auth-service` no Render
via variáveis de ambiente (`VITE_AUTH_API_URL`, `VITE_BACKEND_API_URL`).
