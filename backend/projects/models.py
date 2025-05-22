from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    likes = models.ManyToManyField(User, related_name='liked_projects', blank=True)

    def __str__(self):
        return self.title

    @property
    def is_active(self):
        return timezone.now() < self.end_date

    @property
    def progress_percentage(self):
        if self.goal_amount == 0:
            return 0
        return (self.current_amount / self.goal_amount) * 100

class Pledge(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='pledges')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pledges')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} pledged {self.amount} to {self.project.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update project's current amount
        self.project.current_amount = self.project.pledges.aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        self.project.save() 