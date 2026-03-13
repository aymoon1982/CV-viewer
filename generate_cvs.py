import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

cvs = [
    {
        "name": "Alice Expert",
        "title": "Senior React Developer",
        "email": "alice@example.com",
        "phone": "+1234567890",
        "content": [
            "Experience: 6 years at TechCorp building enterprise apps.", 
            "Skills: React, TypeScript, Next.js, Redux, Node.js", 
            "Education: BS Computer Science", 
            "Summary: Highly skilled frontend engineer building scalable web apps."
        ]
    },
    {
        "name": "Bob Midlevel",
        "title": "Frontend Web Developer",
        "email": "bob@example.com",
        "phone": "+1987654321",
        "content": [
            "Experience: 3 years building consumer-facing websites.", 
            "Skills: React, JavaScript, HTML, CSS, Tailwind", 
            "Education: BA Design", 
            "Summary: Passionate web developer with a keen eye for design."
        ]
    },
    {
        "name": "Charlie Backend",
        "title": "Java Backend Engineer",
        "email": "charlie@example.com",
        "phone": "+1122334455",
        "content": [
            "Experience: 5 years creating APIs.", 
            "Skills: Java, Spring Boot, MySQL, Docker, Kubernetes", 
            "Education: MS Computer Science", 
            "Summary: Systems thinker building robust microservices."
        ]
    },
    {
        "name": "David Junior",
        "title": "Junior Developer",
        "email": "david@example.com",
        "phone": "+1555666777",
        "content": [
            "Experience: 1 year as an intern.", 
            "Skills: React (Basic), HTML, CSS, Python", 
            "Education: Bootcamp Graduate", 
            "Summary: Eager to learn and contribute to a frontend team."
        ]
    },
    {
        "name": "Eve Accountant",
        "title": "Senior Accountant",
        "email": "eve@example.com",
        "phone": "+1999888777",
        "content": [
            "Experience: 8 years managing corporate finances.", 
            "Skills: Excel, QuickBooks, Payroll, Tax Prep", 
            "Education: BS Accounting", 
            "Summary: Detail-oriented financial professional."
        ]
    }
]

out_dir = r"d:\Project\HR-system\test_cvs"
os.makedirs(out_dir, exist_ok=True)

for i, cv in enumerate(cvs):
    path = os.path.join(out_dir, f"cv_{i+1}_{cv['name'].replace(' ', '_')}.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 750, cv['name'])
    c.setFont("Helvetica", 12)
    c.drawString(72, 730, cv['title'])
    c.drawString(72, 710, f"{cv['email']} | {cv['phone']}")
    
    y = 670
    for line in cv['content']:
        c.drawString(72, y, line)
        y -= 25
        
    c.save()
    print(f"Generated {path}")
