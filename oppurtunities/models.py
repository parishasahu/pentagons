from django.db import models

# Create your models here.
class Scholarship(models.Model):
    title = models.CharField(max_length=255)
    min_cgpa = models.FloatField(default=0)
    max_income = models.IntegerField()
    eligible_state = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    deadline = models.DateField()

    def __str__(self):
        return self.title

class Internship(models.Model):
    title = models.CharField(max_length=255)
    required_skills = models.TextField(help_text="Comma separated skills")
    domain = models.CharField(max_length=100)
    eligible_academic_year = models.IntegerField()

    def __str__(self):
        return self.title