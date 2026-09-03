# auth-service

Autenticação e autorização multi-tenant, em Java, construídas do zero — sem
Spring Security. Spring Boot é usado só como framework web/JPA; hashing de
senha, geração/validação de JWT e checagem de papéis/permissões (RBAC) são
implementados à mão neste serviço.

## Responsabilidade

- Cadastro de organizações: cada `POST /api/auth/register` cria uma
  organização isolada e o usuário `ADMIN` dela.
- Hierarquia de papéis `ADMIN > SUPERVISOR > LIDER > FUNCIONARIO` — cada um
  só pode criar/editar usuários de um papel estritamente abaixo do seu,
  sempre dentro da própria organização.
- Login e emissão de JWT (HMAC-SHA256) contendo `orgId`, `role` e
  `permissions` nos claims.
- Renovação (`refresh`, com rotação) e revogação (`logout`) de tokens.

O [backend Django](../backend) valida esse JWT localmente (mesma chave
secreta compartilhada) para autorizar e isolar por organização suas próprias
rotas — sem depender do auth-service estar no ar a cada requisição.

## Endpoints

| Rota | Descrição |
|---|---|
| `POST /api/auth/register` | Cria organização + admin, retorna tokens |
| `POST /api/auth/login` | Retorna tokens |
| `POST /api/auth/refresh` | Rotaciona o par de tokens |
| `POST /api/auth/logout` | Revoga o refresh token |
| `GET /api/auth/me` | Dados do usuário autenticado |
| `GET/POST/PUT /api/org/users` | CRUD de usuários da própria organização (`users:manage`) |

## Banco de dados

Database Postgres separado (`auth`) dentro do mesmo projeto Neon do backend —
gratuito, sem precisar de um segundo provedor. Schema e seed de
papéis/permissões via Flyway (`src/main/resources/db/migration`).

## Estrutura

```
auth-service/
├── src/main/java/com/escala/auth/
│   ├── controller/    # endpoints REST
│   ├── service/       # regras de negócio
│   ├── security/      # JwtCodec, PasswordHasher, filtro e interceptor de permissão
│   ├── model/          # Organization, User, Role, Permission, RefreshToken
│   ├── repository/     # Spring Data JPA
│   └── config/
├── src/main/resources/{application.yml, db/migration/}
├── src/test/java/...   # 41 testes JUnit
├── pom.xml
└── Dockerfile
```

## Rodando localmente

```bash
mvn test                 # roda a suíte de testes
mvn spring-boot:run       # sobe em :8080 (espera Postgres em localhost:5432/auth)
```

Ou via `docker compose up` na raiz do repositório, junto dos outros serviços.
