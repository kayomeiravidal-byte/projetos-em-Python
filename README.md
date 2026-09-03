# Sistema de Escala

Plataforma de escalonamento inteligente de equipes: geração automática de
escalas com um solver de otimização, autenticação multi-tenant construída do
zero e exportação para Excel.

Monorepo com 3 serviços independentes, hospedados 100% em camadas gratuitas.

```
React SPA (frontend)
      │  JWT (Bearer)
      ├──────────────► auth-service (Java) — organizações, usuários,
      │                 papéis e permissões
      │
      └──────────────► backend (Django) — funcionários, escalas, algoritmo
                        OR-Tools, export Excel
```

O `backend` valida o JWT emitido pelo `auth-service` localmente (chave HMAC
compartilhada), sem depender dele estar no ar a cada requisição.

## Funcionalidades

- **Multi-tenant**: cada organização cadastrada tem seus dados (funcionários,
  escalas, regras) completamente isolados das demais.
- **Hierarquia de papéis**: `ADMIN > SUPERVISOR > LIDER > FUNCIONARIO`, cada
  um só pode criar/editar usuários de um papel estritamente abaixo do seu.
- **Autenticação e autorização feitas do zero**: hashing de senha
  (PBKDF2-HMAC-SHA256) e JWT (HS256) implementados com as primitivas de
  criptografia puras do JDK/stdlib — sem Spring Security, sem PyJWT, sem
  nenhuma biblioteca pronta de auth nos dois lados.
- **Geração automática de escala** via solver de otimização (CP-SAT/OR-Tools),
  respeitando limite de dias consecutivos, descanso obrigatório e mínimo de
  funcionários por dia.
- **Exportação para Excel** com validações automáticas.

## Status

| Serviço | Situação |
|---|---|
| [auth-service/](auth-service) | Funcional — registro, login, refresh, logout, RBAC hierárquico |
| [backend/](backend) | Funcional — API REST autenticada e isolada por organização |
| [frontend/](frontend) | Em construção |

## Stack

- **auth-service**: Java 21 + Spring Boot 4, Flyway, Postgres (Neon)
- **backend**: Django 6 + Django REST Framework, OR-Tools, pandas/openpyxl, Postgres (Neon)
- **frontend**: React + Vite + TypeScript + MUI

## Rodando localmente (os 3 serviços)

```bash
cp backend/.env.example backend/.env
docker compose up --build
docker compose exec backend python manage.py migrate
```

- `auth-service`: `http://localhost:8081`
- `backend`: `http://localhost:8000` (admin em `/admin/`)

Fluxo básico:

```bash
# 1. Cria uma organização e um admin, recebe o JWT
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"organizationName":"Minha Empresa","name":"Admin","email":"admin@empresa.com","password":"senha12345"}'

# 2. Usa o accessToken retornado para acessar o backend
curl http://localhost:8000/api/employees/ -H "Authorization: Bearer <accessToken>"
```

### Só o backend, sem Docker

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
cp .env.example .env

python manage.py migrate
python manage.py createsuperuser   # opcional, só pro /admin/
python manage.py runserver
```

Por padrão usa SQLite; defina `DATABASE_URL` no `.env` para apontar para
Postgres em vez disso.

## Segurança

Revisão dedicada no `auth-service`, com testes de regressão para cada item:

- PBKDF2-HMAC-SHA256 com 600.000 iterações (recomendação atual do OWASP).
- Login resistente a ataque de timing: o hashing roda sempre, mesmo pra
  e-mail inexistente, pra não dar pra enumerar contas cadastradas medindo o
  tempo de resposta.
- JWT sem vetor de "algorithm confusion": a verificação nunca lê o
  algoritmo do header do token, sempre assina/confere com HMAC-SHA256 fixo.
- Comparação de assinatura em tempo constante (`MessageDigest.isEqual` /
  `hmac.compare_digest`).
- Autorização checada antes de revelar existência de dados (ex.: e-mail
  duplicado só é informado depois de confirmar que quem pediu tem permissão).
- Isolamento multi-tenant testado de ponta a ponta: uma organização não
  lista, lê nem edita dados de outra, mesmo tentando forçar o `id` na URL.

## Testes

- `auth-service`: 41 testes JUnit (`mvn test`) — hashing, JWT, hierarquia de
  papéis, fluxo completo de login/refresh/logout.
- `backend`: 53 testes Django (`python manage.py test shifts`) — modelos,
  serviços, autenticação, autorização e isolamento entre organizações.

## Deploy (gratuito)

| Peça | Onde |
|---|---|
| Banco de dados | Neon (Postgres free — 2 databases no mesmo projeto: um para o backend, outro para o auth-service) |
| auth-service | Render (Web Service via Docker) |
| backend | Render (Web Service via Docker) |
| frontend | Vercel ou Netlify (site estático) |

Serviços gratuitos do Render "dormem" após ~15 min sem tráfego e demoram
alguns segundos para acordar na próxima requisição — trade-off aceito para
manter o projeto 100% sem custo.

## Roadmap

- [x] Reorganizar o repositório em 3 serviços
- [x] `auth-service`: modelo de usuários/papéis/permissões, JWT e RBAC do zero
- [x] Proteger as rotas do `backend` validando o JWT do `auth-service`
- [ ] `frontend`: login, calendário interativo, gestão de funcionários
- [ ] Deploy dos 3 serviços

## Licença

MIT
