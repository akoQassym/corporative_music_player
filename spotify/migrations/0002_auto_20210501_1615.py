# Generated by Django 3.1.5 on 2021-05-01 10:15

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spotify', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='spotifytokenmodel',
            old_name='expires_at',
            new_name='expires_in',
        ),
    ]
