from django.db import models
from profiles.models import StudentProfile
from documents.models import DocumentBundle
# Create your models here.

class WorkflowSession(models.Model):
    student = models.ForeignKey(StudentProfile,on_delete=models.CASCADE)
    workflow_type = models.CharField(max_length=100)

    latest_bundle = models.ForeignKey(
        DocumentBundle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    completed_steps = models.TextField(default="")
    status = models.CharField(max_length=50, default="active")
    last_response = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.full_name} - {self.workflow_type}"