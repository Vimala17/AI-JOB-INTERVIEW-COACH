
        let isSignup = false;
        let userData = JSON.parse(localStorage.getItem('user_session')) || null;
        let selectedRole = "";
        let selectedLang = "English";
        let currQ = {};

        const domainVisualIcons = {
            "Software": "fas fa-code", "Hardware": "fas fa-microchip", "Education": "fas fa-graduation-cap",
            "Agriculture": "fas fa-seedling", "Medical": "fas fa-stethoscope", "Finance": "fas fa-wallet",
            "Management": "fas fa-briefcase", "Creative": "fas fa-palette", "Engineering": "fas fa-cogs",
            "Marketing": "fas fa-chart-line", "Hospitality": "fas fa-hotel", "Legal": "fas fa-gavel",
            "Aviation": "fas fa-plane", "Defense": "fas fa-shield-halved", "Media & Journalism": "fas fa-newspaper",
            "Public Services": "fas fa-building-columns", "Real Estate": "fas fa-house-chimney", 
            "Data & Analytics": "fas fa-chart-pie", "Customer Support": "fas fa-headset", "Fitness & Sports": "fas fa-dumbbell"
        };

        const dataMap = {
            "Software": ["Python Developer", "Frontend Dev", "Cyber Security", "AI Engineer", "Full Stack Dev", "DevOps Engineer", "Data Scientist", "Cloud Architect"],
            "Hardware": ["Embedded C", "VLSI Designer", "Robotics", "Network Admin", "Hardware Design Engineer", "IoT Specialist"],
            "Education": ["Primary Teacher", "Lecturer", "Yoga Coach", "Academic Dean", "Online Tutor", "Curriculum Designer"],
            "Agriculture": ["Farm Manager", "Soil Scientist", "Agri Officer", "Botanist", "Horticulturist", "Precision Agri Expert"],
            "Medical": ["Doctor", "Nurse", "Pharmacist", "Dentist", "Physiotherapist", "Medical Lab Tech", "Radiologist"],
            "Finance": ["Accountant", "Banker", "Stock Analyst", "Tax Specialist", "Financial Planner", "Investment Banker"],
            "Management": ["HR Manager", "Project Manager", "Operations", "Product Lead", "Supply Chain Manager", "Business Analyst"],
            "Creative": ["Graphic Designer", "Video Editor", "Animator", "UX Designer", "Fashion Designer", "Interior Designer"],
            "Engineering": ["Civil", "Mechanical", "Electrical", "Chemical", "Automobile Engineer", "Aerospace Engineer"],
            "Marketing": ["Digital Marketer", "SEO Expert", "Sales Head", "Social Media", "Content Strategist", "Brand Manager"],
            "Hospitality": ["Hotel Manager", "Chef", "Event Planner", "Travel Agent", "Receptionist", "Food & Beverage Manager"],
            "Legal": ["Lawyer", "Judge", "Legal Advisor", "Paralegal", "Corporate Lawyer", "Criminal Lawyer"],
            "Aviation": ["Pilot", "Cabin Crew", "ATC Officer", "Ground Staff", "Aircraft Maintenance", "Flight Instructor"],
            "Defense": ["Army", "Navy", "Airforce", "Coast Guard", "Intelligence Officer", "Defense Analyst"],
            "Media & Journalism": ["News Reporter", "Journalist", "Radio Jockey", "Content Writer", "Photojournalist", "News Anchor"],
            "Public Services": ["Police Officer", "IAS/IPS Officer", "Firefighter", "Social Worker", "Postmaster", "Railway Officer"],
            "Real Estate": ["Property Manager", "Real Estate Agent", "Valuer", "Leasing Consultant", "Site Supervisor"],
            "Data & Analytics": ["Data Analyst", "Database Admin", "BI Developer", "Statistician", "Market Researcher"],
            "Customer Support": ["BPO Executive", "Call Center Lead", "Technical Support", "Customer Success Manager"],
            "Fitness & Sports": ["Fitness Trainer", "Professional Athlete", "Sports Coach", "Nutritionist", "Referee"]
        };

        window.onload = () => {
            if (userData) {
                updateProfileUI();
                show('sec-dash');
            } else {
                show('sec-welcome');
            }
        };

        function checkLoginState() {
            if (userData) show('sec-dash');
            else show('sec-login');
        }

        function show(id) { 
            document.querySelectorAll('.container').forEach(c => c.classList.add('hidden')); 
            const target = document.getElementById(id);
            if(target) target.classList.remove('hidden'); 
            
            if(id === 'sec-dash') renderFields();
        }

        function toggleAuth(mode) {
            isSignup = (mode === 'signup');
            document.getElementById('tab-login').classList.toggle('active', !isSignup);
            document.getElementById('tab-signup').classList.toggle('active', isSignup);
            document.getElementById('signup-fields').classList.toggle('hidden', !isSignup);
            document.getElementById('auth-title').innerText = isSignup ? "Create Account" : "AI Interview";
            document.getElementById('auth-btn').innerText = isSignup ? "Register & Enter" : "Login Now";
        }

        function handleAuth() {
            const email = document.getElementById('auth-email').value.trim();
            const password = document.getElementById('auth-pass').value.trim();
            if (!email || !password) return alert("Enter credentials!");

            userData = {
                name: isSignup ? document.getElementById('reg-name').value : "User",
                study: isSignup ? document.getElementById('reg-study').value : "Professional",
                email: email,
                interest: isSignup ? document.getElementById('reg-interest').value : "General"
            };

            localStorage.setItem('user_session', JSON.stringify(userData));
            updateProfileUI();
            show('sec-dash');
        }

        function updateProfileUI() {
            document.getElementById('p-name').innerText = userData.name;
            document.getElementById('p-study').innerText = userData.study;
            document.getElementById('p-email').innerText = userData.email;
            document.getElementById('p-interest').innerText = userData.interest;
        }

        function signOut() {
            localStorage.removeItem('user_session');
            location.reload();
        }

        function exitInterview() {
            if(confirm("Exit interview? Progress will be lost.")) show('sec-dash');
        }

        function renderFields() {
            const fGrid = document.getElementById('field-grid');
            fGrid.innerHTML = "";
            Object.keys(dataMap).forEach(f => {
                const icon = domainVisualIcons[f] || "fas fa-star";
                fGrid.innerHTML += `
                    <div class="select-card" onclick="selectField('${f}')">
                        <i class="${icon}"></i>
                        <span>${f}</span>
                    </div>`;
            });
        }

        function selectField(f) {
            const rGrid = document.getElementById('role-grid');
            rGrid.innerHTML = "";
            dataMap[f].forEach(r => {
                rGrid.innerHTML += `<div class="select-card" onclick="selectRole('${r}', this)"><span>${r}</span></div>`;
            });
            show('sec-role');
        }

        function selectRole(r, el) {
            document.querySelectorAll('#role-grid .select-card').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            selectedRole = r;
        }

        function setLang(l) {
            selectedLang = l;
            document.querySelectorAll('#sec-role .lang-pill').forEach(b => b.classList.remove('active'));
            document.getElementById(`btn-${l.substring(0,2).toLowerCase()}`).classList.add('active');
        }

        async function start() {
            if(!selectedRole) return alert("Select specialization!");
            const fd = new FormData();
            fd.append('role', selectedRole);
            fd.append('language', selectedLang);
            
            try {
                await fetch('/start_interview', {method: 'POST', body: fd});
            } catch(e) { console.log("Backend offline, simulating environment locally."); }
            
            show('sec-int');
            loadQ();
        }

        async function loadQ() {
            document.getElementById('q-text').innerText = "Generating question ...";
            try {
                const res = await fetch('/generate_question', {method: 'POST'});
                const data = await res.json();
                if(data.complete) { show('sec-res'); return; }
                document.getElementById('q-num').innerText = data.count;
                document.getElementById('q-text').innerText = data.question;
                currQ = data;
            } catch(e) {
                // Fallback rendering standard string substitution locally if endpoint missing
                document.getElementById('q-num').innerText = "1";
                document.getElementById('q-text').innerText = `Tell me about your experience and technical expertise regarding ${selectedRole}.`;
                currQ = { question: document.getElementById('q-text').innerText, keywords: [], count: 1 };
            }
            document.getElementById('ans').value = "";
        }

        async function submit(event) {
            const btn = event.target; 
            const ans = document.getElementById('ans').value.trim();
            if(!ans) return alert("Type answer!");
            btn.innerText = "Processing..."; btn.disabled = true; 
            
            try {
                const res = await fetch('/evaluate_answer', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ answer: ans, keywords: currQ.keywords, question: currQ.question })
                });
                const data = await res.json();
                if(data.is_final) { 
                    document.getElementById('final-avg').innerText = data.avg_score;
                    saveToHistory(data.avg_score);
                    show('sec-res'); 
                } else { await loadQ(); }
            } catch(e) {
                let mockScore = Math.floor(Math.random() * 4) + 6;
                document.getElementById('final-avg').innerText = mockScore;
                saveToHistory(mockScore);
                show('sec-res');
            } finally { 
                btn.innerHTML = `<i class="fas fa-paper-plane"></i> Submit`; 
                btn.disabled = false; 
            }
        }

        function saveToHistory(score) {
            let history = JSON.parse(localStorage.getItem('interviewHistory') || "[]");
            history.unshift({role: selectedRole, score: score, date: new Date().toLocaleString(), lang: selectedLang});
            localStorage.setItem('interviewHistory', JSON.stringify(history));
        }

        function loadHistory() {
            const container = document.getElementById('history-container');
            let history = JSON.parse(localStorage.getItem('interviewHistory') || "[]");
            
            container.innerHTML = history.length ? history.map((item, index) => `
                <div class="history-item">
                    <div>
                        <div class="role">${item.role}</div>
                        <small style="opacity:0.5; font-size:0.8rem;">${item.date} • ${item.lang}</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1.2rem;">
                        <span class="score">${item.score}/10</span>
                        <button class="btn-inline-delete" onclick="deleteHistoryItem(${index})">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                </div>`).join('') : "<h3 style='text-align:center; opacity:0.5; padding: 2rem 0;'>No history records found!</h3>";
            show('sec-history');
        }

        function deleteHistoryItem(index) {
            let history = JSON.parse(localStorage.getItem('interviewHistory') || "[]");
            history.splice(index, 1);
            localStorage.setItem('interviewHistory', JSON.stringify(history));
            loadHistory();
        }

        function clearAllHistory() {
            if(confirm("Clear all history?")) {
                localStorage.removeItem('interviewHistory');
                loadHistory();
            }
        }

        function voice() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return alert("Voice recognition not supported in this browser.");
            const rec = new SpeechRecognition();
            rec.lang = selectedLang === 'Telugu' ? 'te-IN' : (selectedLang === 'Hindi' ? 'hi-IN' : 'en-US');
            rec.onresult = (e) => { document.getElementById('ans').value += e.results[0][0].transcript + " "; };
            rec.start();
        }