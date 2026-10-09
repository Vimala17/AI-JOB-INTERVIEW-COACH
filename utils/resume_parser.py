import json
from pypdf import PdfReader


def extract_text_from_pdf(file_stream):
    reader = PdfReader(file_stream)                  # PDF ni open chestundi
    pages = []
    for page in reader.pages[:5]:                    # first 5 pages matrame (resume ki saripothundi)
        pages.append(page.extract_text() or "")      # text lekapothe empty string
    return "\n".join(pages).strip()                  # anni pages ni okate text ga join


def parse_json_safely(raw):
    # Konni models JSON ni ```json ... ``` fence lo istayi. Adi unna kuda { ... } matrame teesukuntundi.
    try:
        return json.loads(raw)
    except Exception:
        start, end = raw.find("{"), raw.rfind("}")
        return json.loads(raw[start:end + 1])


def build_resume_profile(client, text, model):
    text = text[:6000]                               # LLM ki ekkuva text pampakunda limit

    instruction = (
        'Extract data from this resume. Output strictly JSON in this shape: '
        '{"skills": ["max 10 items"], '
        '"projects": [{"name": "project name", "tech": ["tech1"]}], '
        '"education": "short text", "experience": "short text"}. '
        'Maximum 4 projects. Keep every value short. Resume text: '
    )

    completion = client.chat.completions.create(
        model=model,                                 # app.py nunchi vastundi (GROQ_MODEL)
        messages=[
            {"role": "system", "content": "You extract structured data from resumes. Reply only with JSON."},
            {"role": "user", "content": instruction + text},
        ],
        temperature=0.2,                             # takkuva temperature = accurate extraction
        response_format={"type": "json_object"},
    )
    data = parse_json_safely(completion.choices[0].message.content)

    # Clean + size limit (session cookie 4KB limit untundi, anduke trim chestunnam)
    projects = []
    for p in data.get("projects", [])[:4]:
        if isinstance(p, dict):
            projects.append({
                "name": str(p.get("name", ""))[:60],
                "tech": [str(t)[:20] for t in p.get("tech", [])][:5],
            })

    return {
        "skills": [str(s)[:30] for s in data.get("skills", [])][:10],
        "projects": projects,
        "education": str(data.get("education", ""))[:100],
        "experience": str(data.get("experience", ""))[:150],
    }