import json
import os
from flask import Flask, render_template, request, jsonify, session
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "vimala_ai_key_2026")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- 1. Global Database ---
def load_db_once():
    combined_db = {}
    data_dir = os.path.join(app.root_path, 'data')
    target_files = ['hr_interview_questions_dataset.json']
    for filename in target_files:
        path = os.path.join(data_dir, filename)
        if os.path.exists(path) and os.path.getsize(path) > 0:
            with open(path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    if isinstance(data, dict): combined_db.update(data)
                except: pass
    return combined_db

GLOBAL_DB = load_db_once()

# --- 2. Routes ---
@app.route('/')
def index():
    job_fields = {
        "Software": ["Software Engineer", "Frontend Developer", "Python Developer", "AI Engineer"],
        "Education": ["Primary Teacher", "High School Lecturer", "Yoga Instructor"],
        "Medical": ["Staff Nurse", "Pharmacist", "Lab Technician"],
        "Finance": ["Accountant", "Financial Analyst", "Tax Consultant"],
        "Management": ["HR Manager", "Project Manager", "Sales Executive"],
        "Agriculture": ["Farm Manager", "Soil Scientist", "Agri Officer"],
        "Aviation": ["Pilot", "Cabin Crew", "ATC Officer"],
        "Defense": ["Army", "Navy", "Airforce"]
    }
    return render_template('index.html', job_fields=job_fields)

@app.route('/start_interview', methods=['POST'])
def start_interview():
    # Frontend nunchi FormData ni clean ga fetch chesukodaniki standard form reader
    session['role'] = request.form.get('role')
    session['language'] = request.form.get('language', 'English')
    session['question_count'] = 0
    session['scores'] = [] 
    session['asked_questions'] = []
    session.modified = True
    return jsonify({"status": "success"})

@app.route('/generate_question', methods=['POST'])
def generate_question():
    count = session.get('question_count', 0)
    if count >= 10: 
        return jsonify({"complete": True})
    
    role = session.get('role', 'General')
    lang = session.get('language', 'English')
    asked = session.get('asked_questions', [])
    
    # Absolute strict formatting parameters to force LLM to write in target script
    lang_prompts = {
        "Telugu": {
            "system": "You are an AI Interviewer. You must generate the interview question strictly in Telugu language using native Telugu script characters (తెలుగు లిపి) only.",
            "user": f"Generate a unique professional interview question for a {role} position. The 'question' string MUST be written completely in native Telugu script (తెలుగు అక్షరాలు). Do not translate into English letters. Previous questions asked in this session: {asked}. Output format must strictly be JSON: {{\"question\": \"తెలుగులో ప్రశ్న ఇక్కడ రాయండి\", \"keywords\": [\"english_keyword1\", \"english_keyword2\"]}}"
        },
        "Hindi": {
            "system": "You are an AI Interviewer. You must generate the interview question strictly in Hindi language using native Devanagari script (हिंदी देवनागरी लिपि) only.",
            "user": f"Generate a unique professional interview question for a {role} position. The 'question' string MUST be written completely in Hindi Devanagari script characters. Do not translate into English letters. Previous questions asked in this session: {asked}. Output format must strictly be JSON: {{\"question\": \"हिंदी में प्रश्न यहां लिखें\", \"keywords\": [\"english_keyword1\", \"english_keyword2\"]}}"
        },
        "English": {
            "system": "You are an AI Interviewer. You must generate the interview question strictly in English.",
            "user": f"Generate a unique professional interview question for a {role} position. Previous questions asked in this session: {asked}. Output format must strictly be JSON: {{\"question\": \"Your English question here\", \"keywords\": [\"keyword1\", \"keyword2\"]}}"
        }
    }
    
    selected_prompt = lang_prompts.get(lang, lang_prompts["English"])
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": selected_prompt["system"]},
                {"role": "user", "content": selected_prompt["user"]}
            ],
            temperature=0.6,  # Avoid formatting leaks
            response_format={"type": "json_object"}
        )
        
        res = json.loads(completion.choices[0].message.content)
        question_text = res.get('question')
        keywords = res.get('keywords', [])
        
        asked.append(question_text)
        session['asked_questions'] = asked
        session['question_count'] = count + 1 
        session.modified = True
        
        return jsonify({
            "question": question_text, 
            "keywords": keywords, 
            "count": session['question_count'], 
            "complete": False
        })

    except Exception as e:
        print(f"!!! GROQ API ERROR: {e}") 
        fallbacks = {
            "Telugu": f"మీరు ఎంచుకున్న {role} పాత్రకు సంబంధించి మీ గత ప్రాజెక్ట్‌ల అనుభవం గురించి వివరించండి.",
            "Hindi": f"आपके द्वारा चुने गए {role} पद से संबंधित अपने पिछले प्रोजेक्ट्स के अनुभव के बारे में बताएं।",
            "English": f"Tell me about your previous project experiences related to the {role} position."
        }
        q_text = fallbacks.get(lang, "Tell me about yourself.")
        return jsonify({
            "question": q_text, 
            "keywords": ["experience", "project", "work"], 
            "count": count+1,
            "complete": False
        })
    
@app.route('/evaluate_answer', methods=['POST'])
def evaluate_answer():
    data = request.json
    user_ans = data.get('answer', '').lower()
    keywords = data.get('keywords', [])
    
    score = 0
    if keywords:
        matches = [w for w in keywords if w.lower() in user_ans]
        score = min(len(matches) * 2, 10)
        if score == 0 and len(user_ans) > 20: score = 3
    else:
        score = 5

    session['scores'] = session.get('scores', [])
    session['scores'].append(score)
    avg = round(sum(session['scores']) / len(session['scores']), 1)
    is_final = (session['question_count'] >= 10)
    session.modified = True
    
    return jsonify({"score": float(score), "is_final": bool(is_final), "avg_score": float(avg)})

if __name__ == '__main__':
    app.run(debug=True)