from datetime import date

from rest_framework import status
from rest_framework.test import APITestCase

from .models import Employee
from .test_support import auth_header

ORG_A = 1
ORG_B = 2


class AuthenticationRequiredTest(APITestCase):
    def test_list_employees_without_token_is_401(self):
        r = self.client.get("/api/employees/")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_is_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer isso-nao-e-um-jwt-valido")
        r = self.client.get("/api/employees/")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_token_is_401(self):
        from django.conf import settings

        from .jwt_codec import encode as jwt_encode

        claims = {
            "sub": 1, "orgId": ORG_A, "email": "a@t.com", "role": "ADMIN",
            "permissions": ["schedules:read"], "iat": 0, "exp": 1,
        }
        token = jwt_encode(claims, settings.JWT_SECRET)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        r = self.client.get("/api/employees/")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_signed_with_wrong_secret_is_401(self):
        from .jwt_codec import encode as jwt_encode

        claims = {
            "sub": 1, "orgId": ORG_A, "email": "a@t.com", "role": "ADMIN",
            "permissions": ["schedules:read"], "iat": 0, "exp": 9999999999,
        }
        token = jwt_encode(claims, "uma-chave-completamente-diferente-32-bytes!!")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        r = self.client.get("/api/employees/")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthorizationTest(APITestCase):
    def test_funcionario_can_read_but_not_write_employees(self):
        self.client.credentials(HTTP_AUTHORIZATION=auth_header(organization_id=ORG_A, role="FUNCIONARIO"))

        read = self.client.get("/api/employees/")
        self.assertEqual(read.status_code, status.HTTP_200_OK)

        write = self.client.post(
            "/api/employees/",
            {"name": "Novo", "email": "novo@t.com", "hire_date": str(date.today()), "is_active": True},
            format="json",
        )
        self.assertEqual(write.status_code, status.HTTP_403_FORBIDDEN)

    def test_lider_can_write_schedules_but_not_manage_employees(self):
        self.client.credentials(HTTP_AUTHORIZATION=auth_header(organization_id=ORG_A, role="LIDER"))

        r = self.client.post(
            "/api/employees/",
            {"name": "Novo", "email": "novo@t.com", "hire_date": str(date.today()), "is_active": True},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_generate_schedule_requires_generate_permission(self):
        # LIDER tem schedules:write mas não schedules:generate
        self.client.credentials(HTTP_AUTHORIZATION=auth_header(organization_id=ORG_A, role="LIDER"))
        r = self.client.post(
            "/api/schedules/generate/",
            {"start_date": str(date.today()), "end_date": str(date.today())},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class MultiTenantIsolationTest(APITestCase):
    def setUp(self):
        self.employee_a = Employee.objects.create(
            organization_id=ORG_A, name="Alice (org A)", email="alice@a.com", hire_date=date.today()
        )
        self.employee_b = Employee.objects.create(
            organization_id=ORG_B, name="Bruno (org B)", email="bruno@b.com", hire_date=date.today()
        )

    def test_org_a_only_sees_its_own_employees(self):
        self.client.credentials(HTTP_AUTHORIZATION=auth_header(organization_id=ORG_A, role="ADMIN"))
        r = self.client.get("/api/employees/")
        names = [e["name"] for e in r.data["results"]]
        self.assertIn("Alice (org A)", names)
        self.assertNotIn("Bruno (org B)", names)

    def test_org_a_cannot_retrieve_org_b_employee_by_id(self):
        self.client.credentials(HTTP_AUTHORIZATION=auth_header(organization_id=ORG_A, role="ADMIN"))
        r = self.client.get(f"/api/employees/{self.employee_b.id}/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_org_a_cannot_edit_org_b_employee(self):
        self.client.credentials(HTTP_AUTHORIZATION=auth_header(organization_id=ORG_A, role="ADMIN"))
        r = self.client.patch(
            f"/api/employees/{self.employee_b.id}/", {"name": "Sequestrado"}, format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)
        self.employee_b.refresh_from_db()
        self.assertEqual(self.employee_b.name, "Bruno (org B)")

    def test_created_employee_belongs_to_callers_organization_even_if_client_sends_another(self):
        self.client.credentials(HTTP_AUTHORIZATION=auth_header(organization_id=ORG_A, role="ADMIN"))
        r = self.client.post(
            "/api/employees/",
            {
                "name": "Tentativa", "email": "tentativa@t.com",
                "hire_date": str(date.today()), "is_active": True,
                "organization_id": ORG_B,  # ignorado — nem é um campo do serializer
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        created = Employee.objects.get(email="tentativa@t.com")
        self.assertEqual(created.organization_id, ORG_A)
