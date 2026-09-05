from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"employees", views.EmployeeViewSet, basename="employee")
router.register(r"shift-types", views.ShiftTypeViewSet, basename="shifttype")
router.register(r"services", views.ServiceViewSet, basename="service")
router.register(r"schedules", views.ScheduleViewSet, basename="schedule")
router.register(r"scheduling-rules", views.SchedulingRuleViewSet, basename="schedulingrule")

urlpatterns = [
    path("api/schedules/generate/", views.generate_schedule, name="generate_schedule"),
    path("api/schedules/calendar_data/", views.get_calendar_data, name="calendar_data"),
    path("api/update-shift/", views.update_shift, name="update_shift"),
    path("api/export/", views.export_schedule, name="export_schedule"),
    path("api/", include(router.urls)),
    path("calendar/", views.calendar_view, name="calendar"),
    path("", views.calendar_view, name="home"),
]
