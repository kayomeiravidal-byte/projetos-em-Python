INSERT INTO roles (name) VALUES ('ADMIN'), ('SUPERVISOR'), ('LIDER'), ('FUNCIONARIO');

INSERT INTO permissions (code, description) VALUES
    ('org:manage', 'Gerenciar dados da organização'),
    ('users:manage', 'Criar, editar e desativar usuários da organização'),
    ('employees:manage', 'Gerenciar cadastro de funcionários'),
    ('rules:manage', 'Gerenciar regras de escalonamento'),
    ('schedules:generate', 'Gerar escala automaticamente'),
    ('schedules:write', 'Editar turnos manualmente'),
    ('schedules:read', 'Visualizar escalas'),
    ('export:excel', 'Exportar escala para Excel');

-- ADMIN: todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN';

-- SUPERVISOR: tudo, exceto org:manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPERVISOR'
  AND p.code IN ('users:manage', 'employees:manage', 'rules:manage',
                 'schedules:generate', 'schedules:write', 'schedules:read', 'export:excel');

-- LIDER: ajusta turnos e exporta, mas não gera escala nem mexe em regras/funcionários
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LIDER'
  AND p.code IN ('schedules:write', 'schedules:read', 'export:excel');

-- FUNCIONARIO: só visualiza a própria escala
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'FUNCIONARIO'
  AND p.code IN ('schedules:read');
