from uuid import uuid4

from django.db import models

from client.models import Client
from core.models import User
from salon.models import Stylist

from .choices import APPOINTMENT_STATUS_CHOICES
from .types import AppointmentStatus


class AppointmentManager(models.Manager):

    def get_queryset(self, *args, **kwargs):
        return super(AppointmentManager, self).get_queryset(*args, **kwargs).filter(
            deleted_at__isnull=True
        )


class AppointmentAllObjectsManager(models.Manager):
    use_in_migrations = True


class Appointment(models.Model):
    uuid = models.UUIDField(unique=True, default=uuid4, editable=False)
    stylist = models.ForeignKey(
        Stylist, related_name='appointments', on_delete=models.CASCADE
    )

    # client can be null in case if stylist adds an appointment for someone not in the system
    client = models.ForeignKey(
        Client, related_name='appointments', null=True, on_delete=models.PROTECT
    )

    service_uuid = models.UUIDField(null=True)
    service_name = models.CharField(max_length=255)

    regular_price = models.DecimalField(max_digits=6, decimal_places=2)
    client_price = models.DecimalField(max_digits=6, decimal_places=2)

    client_first_name = models.CharField(max_length=255, null=True, blank=True)
    client_last_name = models.CharField(max_length=255, null=True, blank=True)

    datetime_start_at = models.DateTimeField()
    duration = models.DurationField()

    status = models.CharField(
        max_length=15, choices=APPOINTMENT_STATUS_CHOICES, default=AppointmentStatus.NEW)
    status_updated_at = models.DateTimeField(null=True, default=None)
    status_updated_by = models.ForeignKey(
        User, null=True, default=None, on_delete=models.PROTECT,
        related_name='updated_appointments'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='created_appointments'
    )

    deleted_at = models.DateTimeField(null=True, default=None)
    deleted_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='deleted_appointments', null=True,
        default=None
    )

    objects = AppointmentManager()
    all_objects = AppointmentAllObjectsManager()

    class Meta:
        db_table = 'appointment'

    def __str__(self):
        return '{0} at {1}: {2} - {3}'.format(
            self.service_name,
            self.datetime_start_at,
            self.get_client_full_name(),
            self.stylist.get_full_name()
        )

    def get_client_full_name(self):
        if self.client:
            return self.client.user.get_full_name()
        return '{0} {1}'.format(
            self.client_first_name, self.client_last_name
        )