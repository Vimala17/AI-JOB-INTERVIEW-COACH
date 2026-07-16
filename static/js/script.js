/**
 * AI Interview Coach - Core Logic
 * Includes: Multi-language Voice Recognition, Local Dataset Fetching, and Score History
 */

let currentKeywords = [];
let currentRole = "";
let currentLang = "";

// 1. Navigation Control
function showSection(id) {
    const sections = document.querySelectorAll('.container');
    sections.forEach(section => section.classList.add('hidden'));
    
    const activeSection = document.getElementById(id);
    activeSection.classList.remove('hidden');
    activeSection.classList.add('animate-pop');

    if (id === 'dashboard') {
        renderHistory();
    }
}

// 2. Fetch Question from Backend
async function getQuestion() {
    currentRole = document.getElementById('role').value;
    currentLang = document.getElementById('lang').value;
    const qTextElement = document.getElementById('q-text');

    qTextElement.innerText = "Fetching your question...";
    
    try {
        const res = await fetch('/generate_question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: currentRole, language: currentLang })
        });
        
        const data = await res.json();
        qTextElement.innerText = data.question;
        currentKeywords = data.keywords;
        
        showSection('interview');
    } catch (err) {
        qTextElement.innerText = "Error loading question. Check your server.";
    }
}

// 3. Multilingual Voice Recognition (English, Hindi, Telugu)
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
const ansText = document.getElementById('ans-text');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    micBtn.onclick = () => {
        // Set recognition language based on user selection
        if (currentLang === "Hindi") {
            recognition.lang = "hi-IN";
            micStatus.innerText = "Listening... बोलिए";
        } else if (currentLang === "Telugu") {
            recognition.lang = "te-IN";
            micStatus.innerText = "Listening... మాట్లాడండి";
        } else {
            recognition.lang = "en-US";
            micStatus.innerText = "Listening... Speak now";
        }
        
        recognition.start();
        micBtn.classList.add('mic-active');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        ansText.value = transcript;
        micBtn.classList.remove('mic-active');
        micStatus.innerText = "Captured successfully!";
    };

    recognition.onerror = () => {
        micBtn.classList.remove('mic-active');
        micStatus.innerText = "Error capturing audio. Try again.";
    };
} else {
    micBtn.style.display = "none";
    micStatus.innerText = "Voice input not supported in this browser.";
}

// 4. Submit Answer & Evaluation
async function submitAns() {
    const answer = ansText.value;
    if (!answer.trim()) return alert("Please provide an answer.");

    const res = await fetch('/evaluate_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer, keywords: currentKeywords })
    });

    const data = await res.json();
    
    document.getElementById('score-val').innerText = `${data.score}/10`;
    document.getElementById('feedback-text').innerText = data.suggestion;
    
    saveToHistory(currentRole, currentLang, data.score);
    showSection('result');
    ansText.value = ""; // Clear text for next session
    micStatus.innerText = ""; // Clear mic status
}

// 5. History Dashboard Management
function saveToHistory(role, lang, score) {
    const history = JSON.parse(localStorage.getItem('interview_history') || "[]");
    const session = {
        role: role,
        lang: lang,
        score: score,
        date: new Date().toLocaleDateString()
    };
    history.unshift(session);
    localStorage.setItem('interview_history', JSON.stringify(history.slice(0, 15)));
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('interview_history') || "[]");
    const list = document.getElementById('history-list');
    
    if (history.length === 0) {
        list.innerHTML = "<p style='color: #94a3b8'>No sessions yet. Time to practice!</p>";
        return;
    }

    list.innerHTML = history.map(item => `
        <div class="history-item">
            <div style="text-align: left;">
                <div style="font-weight: bold; color: white;">${item.role}</div>
                <small style="color: #94a3b8;">${item.lang} • ${item.date}</small>
            </div>
            <div class="gradient-text" style="font-size: 1.4rem; font-weight: 800;">
                ${item.score}/10
            </div>
        </div>
    `).join('');
}