from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('createurs', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='createur',
            name='bio',
            field=models.TextField(default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='createur',
            name='user',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='createur_profile', to='auth.user'),
        ),
    ] 