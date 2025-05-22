from rest_framework import serializers
from .models import Project, Pledge
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class PledgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pledge
        fields = ['id', 'amount', 'user', 'project', 'created_at']
        read_only_fields = ['user', 'project']

class ProjectSerializer(serializers.ModelSerializer):
    creator = serializers.ReadOnlyField(source='creator.username')
    likes_count = serializers.SerializerMethodField()
    pledges_count = serializers.SerializerMethodField()
    total_pledged = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    pledges = PledgeSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'goal_amount', 'current_amount',
            'creator', 'created_at', 'end_date', 'likes_count',
            'pledges_count', 'total_pledged', 'is_liked', 'pledges'
        ]
        read_only_fields = ['creator', 'current_amount']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_pledges_count(self, obj):
        return obj.pledges.count()

    def get_total_pledged(self, obj):
        return obj.pledges.aggregate(total=models.Sum('amount'))['total'] or 0

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False 