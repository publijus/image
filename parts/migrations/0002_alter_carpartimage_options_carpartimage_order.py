# Generated by Django 4.2.15 on 2024-09-06 08:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='carpartimage',
            options={'ordering': ['order']},
        ),
        migrations.AddField(
            model_name='carpartimage',
            name='order',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
