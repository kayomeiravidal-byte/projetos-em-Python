# Sistema de Escala

Plataforma de escalonamento inteligente de equipes: geração automática de
escalas com um solver de otimização, calendário interativo e exportação para
Excel.

Monorepo com 3 serviços independentes, hospedados 100% em camadas gratuitas:

```
React SPA (frontend)
      │  JWT (Bearer)
      ├──────────────► auth-service (Java) — login, usuários, papéis/permissões
      │
      └──────────────► backend (Django) — funcionários, escalas, algoritmo
                        OR-Tools, export Excel
```

O `backend` valida o JWT emitido pelo `auth-service` localmente (chave
compartilhada), sem depender dele estar no ar a cada requisição.

## Status

| Serviço | Situação |
|---|---|
| [backend/](backend) | Funcional — API REST completa, **ainda sem autenticação** |
| [auth-service/](auth-service) | Em construção |
| [frontend/](frontend) | Em construção |

## Stack

- **backend**: Django 6 + Django REST Framework, OR-Tools (geração de escala
  via CP-SAT), pandas/openpyxl (export Excel), Postgres (Neon)
- **auth-service**: Java + Spring Boot, JWT/hashing/RBAC implementados do
  zero (sem Spring Security)
- **frontend**: React + Vite + TypeScript + MUI

## Rodando o backend localmente

### Via Docker (recomendado)

```bash
cp backend/.env.example backend/.env
docker compose up
```

API disponível em `http://localhost:8000`, admin em `http://localhost:8000/admin/`.

### Sem Docker

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
cp .env.example .env

python manage.py migrate
python manage.py createsuperuser   # opcional
python manage.py runserver
```

Por padrão usa SQLite; defina `DATABASE_URL` no `.env` para apontar para
Postgres (Neon) em vez disso.

## Deploy (gratuito)

| Peça | Onde |
|---|---|
| Banco de dados | Neon (Postgres free — 2 databases no mesmo projeto: um para o backend, outro para o auth-service) |
| backend | Render (Web Service via Docker) |
| auth-service | Render (Web Service via Docker) |
| frontend | Vercel ou Netlify (site estático) |

Serviços gratuitos do Render "dormem" após ~15 min sem tráfego e demoram
alguns segundos para acordar na próxima requisição — trade-off aceito para
manter o projeto 100% sem custo.

## Roadmap

- [x] Reorganizar o repositório em 3 serviços
- [ ] `auth-service`: modelo de usuários/papéis/permissões, JWT e RBAC do zero
- [ ] Proteger as rotas do `backend` validando o JWT do `auth-service`
- [ ] `frontend`: login, calendário interativo, gestão de funcionários
- [ ] Deploy dos 3 serviços

## Licença

MIT
