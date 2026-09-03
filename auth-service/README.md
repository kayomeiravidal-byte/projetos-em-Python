# auth-service (em construção)

Serviço de autenticação e autorização em Java, escrito do zero — sem
Spring Security. Spring Boot é usado só como framework web/JPA; hashing de
senha, geração/validação de JWT e checagem de papéis/permissões (RBAC) são
implementados à mão neste serviço.

## Responsabilidade

- Cadastro e gestão de usuários, papéis (`ADMIN`, `GESTOR`, `FUNCIONARIO`) e
  permissões granulares (ex.: `schedules:write`, `employees:manage`,
  `export:excel`)
- Login e emissão de JWT (HMAC-SHA256) contendo `sub`, `roles` e
  `permissions` nos claims
- Renovação (`refresh`) e revogação de tokens

O [backend Django](../backend) valida esse JWT localmente (mesma chave
secreta compartilhada) para autorizar suas próprias rotas — sem depender do
auth-service estar no ar a cada requisição.

## Banco de dados

Usa um database Postgres separado (`auth`) dentro do mesmo projeto Neon do
backend — gratuito, sem precisar de um segundo provedor.

## Estrutura planejada

```
auth-service/
├── src/main/java/.../auth/
│   ├── controller/   # endpoints REST
│   ├── service/      # regras de negócio (hashing, emissão de token)
│   ├── security/      # filtro JWT, geração/validação manual
│   ├── model/          # User, Role, Permission, RefreshToken
│   ├── repository/     # Spring Data JPA
│   └── config/
├── src/main/resources/application.yml
├── pom.xml
└── Dockerfile
```

Implementação prevista para a próxima fase do projeto.
