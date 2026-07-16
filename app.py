import json
import os
import random
from flask import Flask, render_template, request, jsonify, session
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "vimala_ai_key_2026")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- 1. Global Database (Backup kosam) ---
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
    session['role'] = request.form.get('role')
    session['language'] = request.form.get('language', 'English')
    session['question_count'] = 0
    session['scores'] = [] 
    session['asked_questions'] = [] # Ikkada reset chesthunnam
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
    
    # SYSTEM PROMPT
    system_msg = f"You are a professional interviewer. You must ask questions ONLY in {lang} script."
    
    # USER PROMPT
    user_msg = f"""
    Generate a unique interview question for a {role} position.
    The question must be in {lang} language.
    Previous questions: {asked}
    DO NOT REPEAT.
    Return ONLY a JSON object with 'question' and 'keywords' (5 English keywords).
    """
    
    try:
        # CHANGED MODEL NAME HERE: llama-3.3-70b-versatile
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        
        res = json.loads(completion.choices[0].message.content)
        question_text = res.get('question')
        keywords = res.get('keywords')
        
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
        # Fallback based on language
        fallbacks = {
            "Telugu": "మీ గత ప్రాజెక్ట్‌ల గురించి వివరించండి.",
            "Hindi": "अपने पिछले प्रोजेक्ट्स के बारे में बताएं।",
            "English": "Tell me about your previous projects."
        }
        q_text = fallbacks.get(lang, "Tell me about yourself.")
        return jsonify({
            "question": q_text, 
            "keywords": ["experience", "work"], 
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