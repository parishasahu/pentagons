from django.urls import path
from .views import recommend_opportunities,generate_bundle,create_workflow_session, export_bundle_pdf

urlpatterns = [
    path('recommend/', recommend_opportunities),
    path('generate-bundle/', generate_bundle),
    path('workflow/start/', create_workflow_session),
    path('bundle/export-pdf/', export_bundle_pdf),
]