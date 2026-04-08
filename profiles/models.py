from django.db import models

# Create your models here.
class StudentProfile(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique = True)
    college = models.CharField(max_length=255)
    year = models.IntegerField()
    state = models.CharField(max_length=100)
    caste_category = models.CharField(max_length=50)
    family_annual_income = models.IntegerField()
    cgpa = models.FloatField()
    skills = models.TextField(help_text="Comma separated skills")
    preferred_domain = models.CharField(max_length=100)

    def __str__(self):
        return self.full_name