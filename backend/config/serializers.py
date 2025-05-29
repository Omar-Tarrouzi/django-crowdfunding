from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Projet, Favorite, UserProfile, Donation, Donneur, Createur, Paliers

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

    def update(self, instance, validated_data):
        # Allow partial update, ignore password if not provided
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class DonneurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donneur
        fields = ('id', 'user', 'nom', 'email', 'montant_donne')

class CreateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Createur
        fields = ('id', 'user', 'nom', 'email', 'bio')

class PaliersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paliers
        fields = ('id', 'titre', 'montant', 'description', 'couleur', 'ordre')

class ProjetSerializer(serializers.ModelSerializer):
    paliers = PaliersSerializer(many=True, read_only=True)
    createur = CreateurSerializer(read_only=True)
    avancement = serializers.SerializerMethodField()
    montant_restant = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Projet
        fields = ('id', 'titre', 'description', 'montant_objectif', 'montant_recolte',
                 'date_creation', 'image', 'createur', 'statut', 'date_fin',
                 'paliers', 'avancement', 'montant_restant', 'is_favorite')

    def get_avancement(self, obj):
        return obj.avancement()

    def get_montant_restant(self, obj):
        return obj.montant_restant()

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, project=obj).exists()
        return False

    def create(self, validated_data):
        # Extract paliers from context if provided (from perform_create)
        paliers_data = self.context.get('paliers')
        projet = Projet.objects.create(**validated_data)
        if paliers_data:
            for i, palier in enumerate(paliers_data):
                Paliers.objects.create(
                    projet=projet,
                    titre=palier.get('titre', ''),
                    montant=palier.get('montant', 0),
                    description=palier.get('description', ''),
                    couleur=palier.get('couleur', '#000000'),
                    ordre=palier.get('ordre', i)
                )
        return projet

class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

class DonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donation
        fields = '__all__'

# Special serializer for dashboard stats
class AdminDashboardSerializer(serializers.Serializer):
    total_projects = serializers.IntegerField()
    total_raised = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_creators = serializers.IntegerField()
    total_donors = serializers.IntegerField()