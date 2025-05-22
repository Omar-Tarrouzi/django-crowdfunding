from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('config', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Donneur',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=100)),
                ('email', models.EmailField(max_length=254)),
                ('montant', models.DecimalField(decimal_places=2, max_digits=10)),
                ('projet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='config.projet')),
            ],
        ),
    ] 