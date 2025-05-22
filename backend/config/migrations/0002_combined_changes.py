from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('config', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='createur',
            name='user',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.CASCADE, to='auth.user'),
        ),
        migrations.AlterModelTable(
            name='projet',
            table='config_projet',
        ),
    ] 