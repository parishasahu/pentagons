from django.db import models
from profiles.models import StudentProfile
# Create your models here.

class DocumentBundle(models.Model):
    student = models.ForeignKey(StudentProfile,on_delete = models.CASCADE)
    sop_text =models.TextField()
    cover_letter_text =models.TextField()
    checklist = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bundle for {self.student.full_name}"