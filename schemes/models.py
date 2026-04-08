from django.db import models

class GovernmentScheme(models.Model):
    title = models.CharField(max_length=255)
    max_family_income = models.IntegerField()
    eligible_state = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    min_cgpa = models.FloatField(default=0)
    required_documents = models.TextField(
        help_text="Comma separated documents"
    )

    def __str__(self):
        return self.title