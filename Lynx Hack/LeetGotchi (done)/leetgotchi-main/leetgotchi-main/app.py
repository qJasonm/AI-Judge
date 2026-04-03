from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import sqlite3, os, json
from datetime import datetime, date
import google.generativeai as genai

app = Flask(__name__)
app.secret_key = "leetgotchi-secret-change-in-prod"
CORS(app)

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

DB = "leetgotchi.db"

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT 'Bitey',
            health INTEGER DEFAULT 100,
            happiness INTEGER DEFAULT 100,
            hunger INTEGER DEFAULT 100,
            streak INTEGER DEFAULT 0,
            stage TEXT DEFAULT 'egg',
            last_fed_date TEXT,
            is_alive INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER DEFAULT 1,
            date TEXT NOT NULL,
            leetcode_title TEXT,
            leetcode_link TEXT,
            difficulty TEXT,
            start_time TEXT,
            end_time TEXT,
            duration_minutes REAL DEFAULT 0,
            problem_explanation TEXT,
            approach_explanation TEXT,
            solution_text TEXT,
            complexity_explanation TEXT,
            reflection TEXT,
            suspicious_score INTEGER DEFAULT 0,
            honesty_score INTEGER DEFAULT 0,
            ai_reasoning TEXT,
            ai_followup TEXT,
            followup_answer TEXT,
            accepted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """)
        # Seed a pet if none exists
        pet = conn.execute("SELECT * FROM pets LIMIT 1").fetchone()
        if not pet:
            conn.execute("INSERT INTO pets (name) VALUES ('Bitey')")
            conn.commit()

init_db()

# ── helpers ──────────────────────────────────────────────────────────────────

def get_pet():
    with get_db() as conn:
        return dict(conn.execute("SELECT * FROM pets WHERE id=1").fetchone())

def update_pet(health=None, happiness=None, hunger=None, streak=None, stage=None,
               last_fed_date=None, is_alive=None):
    fields, vals = [], []
    for col, val in [("health", health), ("happiness", happiness), ("hunger", hunger),
                     ("streak", streak), ("stage", stage), ("last_fed_date", last_fed_date),
                     ("is_alive", is_alive)]:
        if val is not None:
            fields.append(f"{col}=?")
            vals.append(val)
    if fields:
        with get_db() as conn:
            conn.execute(f"UPDATE pets SET {','.join(fields)} WHERE id=1", vals)
            conn.commit()

def get_today_session():
    today = date.today().isoformat()
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE date=? ORDER BY id DESC LIMIT 1", (today,)
        ).fetchone()
        return dict(row) if row else None

def compute_score(duration_minutes, problem_explanation, approach_explanation,
                  complexity_explanation, reflection, solution_text):
    score = 0
    if duration_minutes >= 30: score += 40
    elif duration_minutes >= 15: score += 20
    if len(problem_explanation or "") > 100: score += 15
    if len(approach_explanation or "") > 100: score += 15
    if len(complexity_explanation or "") > 50: score += 10
    if len(reflection or "") > 50: score += 10
    if len(solution_text or "") > 50: score += 10
    return score

def evolve_stage(streak):
    if streak >= 30: return "legend"
    if streak >= 14: return "dragon"
    if streak >= 7:  return "adult"
    if streak >= 3:  return "teen"
    if streak >= 1:  return "baby"
    return "egg"

def pet_message(pet):
    if not pet["is_alive"]:
        return "Your consistency broke the chain.", "dead"
    h = pet["health"]
    if h >= 80: return "You thought through the problem. I'm proud of you.", "happy"
    if h >= 50: return "I need one honest problem today...", "hungry"
    if h >= 20: return "That felt rushed. Did you really solve it?", "suspicious"
    return "You can still save me. Solve one problem properly.", "dying"

# ── routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    pet = get_pet()
    today_session = get_today_session()
    msg, state = pet_message(pet)
    return render_template("index.html", pet=pet, today_session=today_session,
                           pet_message=msg, pet_state=state)

@app.route("/challenge")
def challenge():
    pet = get_pet()
    if not pet["is_alive"]:
        return redirect(url_for("index"))
    today_session = get_today_session()
    return render_template("challenge.html", pet=pet, today_session=today_session)

@app.route("/api/start_session", methods=["POST"])
def start_session():
    data = request.json
    today = date.today().isoformat()
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM sessions WHERE date=?", (today,)
        ).fetchone()
        if existing:
            return jsonify({"session_id": existing["id"], "already_started": True})
        cur = conn.execute("""
            INSERT INTO sessions (pet_id, date, leetcode_title, leetcode_link, difficulty, start_time)
            VALUES (1, ?, ?, ?, ?, ?)
        """, (today, data.get("title",""), data.get("link",""),
              data.get("difficulty","medium"), datetime.now().isoformat()))
        conn.commit()
        return jsonify({"session_id": cur.lastrowid, "already_started": False})

@app.route("/api/submit_session", methods=["POST"])
def submit_session():
    data = request.json
    session_id = data.get("session_id")
    end_time = datetime.now().isoformat()

    with get_db() as conn:
        sess = conn.execute("SELECT * FROM sessions WHERE id=?", (session_id,)).fetchone()
        if not sess:
            return jsonify({"error": "Session not found"}), 404

        start = datetime.fromisoformat(sess["start_time"])
        duration = (datetime.now() - start).total_seconds() / 60

        score = compute_score(
            duration,
            data.get("problem_explanation",""),
            data.get("approach_explanation",""),
            data.get("complexity_explanation",""),
            data.get("reflection",""),
            data.get("solution_text","")
        )

        # Call AI agent
        ai_result = evaluate_with_ai(
            duration, data.get("problem_explanation",""),
            data.get("approach_explanation",""), data.get("solution_text",""),
            data.get("complexity_explanation",""), data.get("reflection",""),
            sess["leetcode_title"]
        )

        final_score = (score + ai_result.get("honesty_score", 50)) // 2
        accepted = final_score >= 60

        conn.execute("""
            UPDATE sessions SET
                end_time=?, duration_minutes=?,
                problem_explanation=?, approach_explanation=?,
                solution_text=?, complexity_explanation=?, reflection=?,
                suspicious_score=?, honesty_score=?, ai_reasoning=?,
                ai_followup=?, accepted=?
            WHERE id=?
        """, (end_time, duration,
              data.get("problem_explanation",""), data.get("approach_explanation",""),
              data.get("solution_text",""), data.get("complexity_explanation",""),
              data.get("reflection",""), 100-final_score, final_score,
              ai_result.get("reasoning",""), ai_result.get("follow_up_question",""),
              int(accepted), session_id))
        conn.commit()

    pet = get_pet()
    today = date.today().isoformat()

    if accepted:
        new_streak = pet["streak"] + 1
        new_health = min(100, pet["health"] + 20)
        new_happiness = min(100, pet["happiness"] + 20)
        stage = evolve_stage(new_streak)
        update_pet(health=new_health, happiness=new_happiness, streak=new_streak,
                   stage=stage, last_fed_date=today)
        outcome = "accepted"
    else:
        new_health = max(0, pet["health"] - 25)
        is_alive = 1 if new_health > 0 else 0
        update_pet(health=new_health, is_alive=is_alive)
        outcome = "rejected"

    return jsonify({
        "outcome": outcome,
        "final_score": final_score,
        "duration_minutes": round(duration, 1),
        "reasoning": ai_result.get("reasoning",""),
        "follow_up_question": ai_result.get("follow_up_question",""),
        "pet": get_pet()
    })

@app.route("/api/submit_followup", methods=["POST"])
def submit_followup():
    data = request.json
    session_id = data.get("session_id")
    answer = data.get("answer","")
    with get_db() as conn:
        conn.execute("UPDATE sessions SET followup_answer=? WHERE id=?",
                     (answer, session_id))
        conn.commit()
    # Reward a little extra health for answering follow-up
    pet = get_pet()
    if len(answer) > 30:
        update_pet(health=min(100, pet["health"] + 10))
        return jsonify({"bonus": True, "message": "Good answer! Your pet gained a little health."})
    return jsonify({"bonus": False, "message": "Your pet isn't convinced. Keep studying."})

@app.route("/api/pet_status")
def pet_status():
    pet = get_pet()
    msg, state = pet_message(pet)
    return jsonify({**pet, "message": msg, "state": state,
                    "today_done": get_today_session() is not None})

# ── AI agent ─────────────────────────────────────────────────────────────────

def evaluate_with_ai(duration, problem_explanation, approach, solution,
                     complexity, reflection, problem_title):
    if not os.environ.get("GEMINI_API_KEY"):
        # Fallback scoring if no API key
        score = 50
        if duration >= 30: score += 20
        if len(problem_explanation) > 150: score += 15
        if len(approach) > 100: score += 15
        return {
            "honesty_score": min(100, score),
            "reasoning": "AI evaluation unavailable — scored by rules only.",
            "follow_up_question": "Can you explain the time complexity of your solution?"
        }

    prompt = f"""You are an AI accountability agent inside a Tamagotchi coding pet called LeetGotchi.
Your goal: determine if the user genuinely solved a LeetCode problem or cheated.

Problem: {problem_title}
Time spent: {round(duration, 1)} minutes
Problem explanation: {problem_explanation}
Approach: {approach}
Solution: {solution}
Complexity explanation: {complexity}
Reflection: {reflection}

Evaluate:
1. Does the explanation show real understanding of the problem?
2. Is the approach consistent with the solution?
3. Does the effort feel genuine given the time spent?
4. Are there signs of copy-paste or AI-generated answers (too perfect, no struggle, no reasoning)?

Return ONLY valid JSON with these exact keys:
{{
  "honesty_score": <integer 0-100>,
  "reasoning": "<1-2 sentence explanation for the user>",
  "follow_up_question": "<one specific question to probe understanding>"
}}"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except Exception as e:
        return {
            "honesty_score": 50,
            "reasoning": "AI evaluation encountered an error.",
            "follow_up_question": "Can you explain why your solution works?"
        }


@app.route("/api/run_code", methods=["POST"])
def run_code():
    import subprocess, tempfile, json as json2
    data = request.json
    code = data.get("code", "")
    tests = [t.strip() for t in data.get("tests", "").strip().split("\n") if t.strip()]

    results = []
    for test in tests:
        runner = code + "\n\ntry:\n    result = " + test.split("==")[0].strip() + "\n    expected = " + "==".join(test.split("==")[1:]).strip() + "\n    print('PASS' if result == expected else 'FAIL', result)\nexcept Exception as e:\n    print('ERROR', str(e))\n"
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(runner)
                fname = f.name
            proc = subprocess.run(
                ["python3", fname],
                capture_output=True, text=True, timeout=5
            )
            out = (proc.stdout + proc.stderr).strip()
            if out.startswith("PASS"):
                results.append({"test": test, "passed": True, "output": out[5:].strip()})
            elif out.startswith("FAIL"):
                results.append({"test": test, "passed": False, "output": out[5:].strip()})
            elif out.startswith("ERROR"):
                results.append({"test": test, "passed": False, "error": out[6:].strip()})
            else:
                results.append({"test": test, "passed": False, "error": out})
        except subprocess.TimeoutExpired:
            results.append({"test": test, "passed": False, "error": "Timeout — infinite loop?"})
        except Exception as e:
            results.append({"test": test, "passed": False, "error": str(e)})

    return jsonify({"results": results})

@app.route("/history")
def history():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM sessions ORDER BY date DESC LIMIT 50"
        ).fetchall()
    return render_template("history.html", sessions=[dict(r) for r in rows])

@app.route("/reset")
def reset():
    with get_db() as conn:
        conn.execute("""UPDATE pets SET health=100,happiness=100,hunger=100,
                        streak=0,stage='egg',last_fed_date=NULL,is_alive=1 WHERE id=1""")
        conn.commit()
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(debug=True, port=5000)