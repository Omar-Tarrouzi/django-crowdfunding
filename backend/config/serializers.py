from rest_framework import serializers
from .models import Projet, Favorite, UserProfile, Donation, Donneur, Createur

# Separate serializer for each model
class ProjetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projet
        fields = '__all__'

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

class DonneurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donneur
        fields = '__all__'

class CreateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Createur
        fields = '__all__'

# Special serializer for dashboard stats
class AdminDashboardSerializer(serializers.Serializer):
    total_projects = serializers.IntegerField()
    total_raised = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_creators = serializers.IntegerField()
    total_donors = serializers.IntegerField()