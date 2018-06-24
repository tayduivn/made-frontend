# Generated by Django 2.0.3 on 2018-06-22 16:26

from django.db import migrations, models
import django.db.models.deletion

def set_null_for_clients(apps, schema_editor):
    Appointment = apps.get_model('appointment', 'Appointment')
    Appointment.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('appointment', '0015_auto_20180619_0743'),
        ('client', '0003_auto_20180622_1226'),
    ]

    operations = [
        migrations.RunPython(set_null_for_clients, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='appointment',
            name='client',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='appointments', to='client.ClientOfStylist'),
        ),
    ]
