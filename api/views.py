from rest_framework.decorators import api_view
from rest_framework.response import Response
from profiles.models import StudentProfile
from oppurtunities.models import Scholarship,Internship
from schemes.models import GovernmentScheme
from documents.models import DocumentBundle
from workflows.models import WorkflowSession
from django.http import FileResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.platypus import PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from pathlib import Path
from django.conf import settings

@api_view(['POST'])
def recommend_opportunities(request):
    email = request.data.get('email')
    student = StudentProfile.objects.get(email=email)

    scholarships = Scholarship.objects.filter(
        min_cgpa__lte=student.cgpa,
        max_income__gte=student.family_annual_income,
        eligible_state=student.state,
        category=student.caste_category
    )

    scored_scholarships = []

    for s in scholarships:
        score = 0

        if student.cgpa >= s.min_cgpa:
            score += 40

        if student.family_annual_income <= s.max_income:
            score += 30

        if student.caste_category == s.category:
            score += 20

        if student.state == s.eligible_state:
            score += 10

        scored_scholarships.append({
            "title": s.title,
            "match_score": score
        })

    scored_scholarships.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    schemes = GovernmentScheme.objects.filter(
        min_cgpa__lte=student.cgpa,
        max_family_income__gte=student.family_annual_income,
        eligible_state=student.state,
        category=student.caste_category
    )

    scheme_document_analysis = []

    student_docs = ["Aadhaar"]  # mock for now

    for g in schemes:
        required_docs = [
            doc.strip()
            for doc in g.required_documents.split(",")
        ]

        missing_docs = [
            doc for doc in required_docs
            if doc not in student_docs
        ]

        scheme_document_analysis.append({
            "scheme": g.title,
            "missing_documents": missing_docs
        })

    internships = Internship.objects.filter(
        domain=student.preferred_domain,
        eligible_academic_year=student.year
    )

    scored_internships = []

    for i in internships:
        score = 0

        if student.preferred_domain == i.domain:
            score += 50

        if student.year == i.eligible_academic_year:
            score += 30

        scored_internships.append({
            "title": i.title,
            "match_score": score
        })

    return Response({
        "student": student.full_name,
        "matched_scholarships": scored_scholarships,
        "eligible_schemes":[g.title for g in schemes],
        "recommended_internships": scored_internships,
        "document_analysis": scheme_document_analysis
    })

@api_view(['POST'])
def generate_bundle(request):
    email = request.data.get('email')
    student = StudentProfile.objects.get(email=email)

    sop = f"""
    I am {student.full_name}, a {student.year}rd year student from {student.college}
    with a CGPA of {student.cgpa}. I am passionate about {student.preferred_domain}
    and have skills in {student.skills}.
    """

    cover_letter = f"""
    Dear Hiring Team,
    I am excited to apply for internship opportunities in {student.preferred_domain}.
    My experience with {student.skills} makes me a strong fit.
    Regards,
    {student.full_name}
    """

    checklist = "Resume, Income Certificate, Caste Certificate, Marksheets, ID Proof"

    bundle = DocumentBundle.objects.create(
        student=student,
        sop_text=sop,
        cover_letter_text=cover_letter,
        checklist=checklist
    )

    return Response({
        "bundle_id": bundle.id,
        "sop": sop,
        "cover_letter": cover_letter,
        "checklist": checklist
    })

@api_view(['POST'])
def create_workflow_session(request):
    email = request.data.get('email')
    workflow_type = request.data.get('workflow_type')

    student = StudentProfile.objects.get(email=email)
    latest_bundle = DocumentBundle.objects.filter(student=student).last()

    session = WorkflowSession.objects.create(
        student=student,
        workflow_type=workflow_type,
        latest_bundle=latest_bundle,
        completed_steps="recommendation, bundle_generated",
        status="active",
        last_response={
            "bundle_id": latest_bundle.id if latest_bundle else None
        }
    )

    return Response({
        "session_id": session.id,
        "student": student.full_name,
        "workflow_type": workflow_type,
        "latest_bundle_id": session.last_response.get("bundle_id"),
        "status": session.status
    })

@api_view(['POST'])
def export_bundle_pdf(request):
    bundle_id = request.data.get("bundle_id")
    bundle = DocumentBundle.objects.get(id=bundle_id)
    export_dir = Path(settings.BASE_DIR) / "exports"
    export_dir.mkdir(exist_ok=True)
    file_path = export_dir/f"bundle_{bundle.id}.pdf"
    styles = getSampleStyleSheet()
    style = styles["Normal"]
    heading = styles["Heading1"]

    doc = SimpleDocTemplate(str(file_path))
    story = []

    story.append(Paragraph("JanMitra Application Bundle", heading))
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph(f"<b>Student:</b> {bundle.student.full_name}", style))
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("<b>SOP</b>", heading))
    story.append(Paragraph(bundle.sop_text, style))
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("<b>Cover Letter</b>", heading))
    story.append(Paragraph(bundle.cover_letter_text, style))
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("<b>Checklist</b>", heading))
    story.append(Paragraph(bundle.checklist, style))

    doc.build(story)

    return FileResponse(
        open(file_path, "rb"),
        as_attachment=True,
        filename=f"janmitra_bundle_{bundle.id}.pdf"
    )
