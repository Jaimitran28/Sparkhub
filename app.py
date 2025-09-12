import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
from chatbot_logic import get_chatbot_reply

# ---------------- Flask Setup ----------------
app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = 'your-secret-key'  # Replace with a strong key

# ---------------- Config ----------------
app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

IDEAS_FILE = 'ideas.json'
REPORTS_FILE = 'reports.json'
DB_FILE = 'users.db'
REQUESTS_DB = 'developer_requests.db'

# ---------------- SQLite Setup ----------------
def init_db():
    # Users DB
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                account_type TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL
            )
        ''')
        conn.commit()

    # Developer Requests DB
    with sqlite3.connect(REQUESTS_DB) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS developer_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                email TEXT NOT NULL,
                reason TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

init_db()

# ---------------- Helper Functions ----------------
def load_json(file):
    if not os.path.exists(file):
        return []
    with open(file, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_json(file, data):
    with open(file, 'w') as f:
        json.dump(data, f, indent=2)

def get_next_id(items):
    return max((i.get('id', 0) for i in items), default=0) + 1

# ---------------- Context Processor ----------------
@app.context_processor
def inject_user():
    return {'USER_ID': session.get('user_id'), 'USERNAME': session.get('username')}

# ---------------- Routes ----------------
@app.route('/')
def branding():
    return render_template('branding.html')

@app.route('/index')
def index():
    if 'user_id' not in session:
        return redirect(url_for('branding'))
    return render_template('index.html')


@app.route('/delete_idea/<int:idea_id>', methods=['DELETE'])
def delete_idea(idea_id):
    if 'user_id' not in session:
        return jsonify({"error": "Login required"}), 401

    ideas = load_json(IDEAS_FILE)
    idea_exists = any(i for i in ideas if i.get('id') == idea_id)
    if not idea_exists:
        return jsonify({"error": "Idea not found"}), 404

    # Remove the idea
    ideas = [i for i in ideas if i.get('id') != idea_id]
    save_json(IDEAS_FILE, ideas)

    # Optional: remove all reports related to this idea
    reports = load_json(REPORTS_FILE)
    reports = [r for r in reports if r.get('idea_id') != idea_id]
    save_json(REPORTS_FILE, reports)

    return jsonify({"success": True, "message": "Idea removed"})



# ---------------- Signup ----------------
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if password != confirm_password:
            return render_template('signup.html', error="Passwords do not match")

        hashed_pw = generate_password_hash(password)
        try:
            with sqlite3.connect(DB_FILE) as conn:
                c = conn.cursor()
                c.execute('''
                    INSERT INTO users (name, email, password, account_type, created_at)
                    VALUES (?, ?, ?, 'user', ?)
                ''', (name, email, hashed_pw, datetime.utcnow().isoformat()))
                conn.commit()
        except sqlite3.IntegrityError:
            return render_template('signup.html', error="Email already registered")

        flash("Signup successful! Please login.", "success")
        return redirect(url_for('login'))

    return render_template('signup.html')

# ---------------- Login ----------------
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip()  # match form input
        password = request.form.get("password", "").strip()

        with sqlite3.connect(DB_FILE) as conn:
            c = conn.cursor()
            c.execute("SELECT id, name, email, password, account_type, created_at FROM users WHERE email=?", (email,))
            user = c.fetchone()

        if user and check_password_hash(user[3], password):
            session["user_id"] = user[0]
            session["name"] = user[1]
            session["email"] = user[2]
            session["account_type"] = user[4]
            # Format date_joined to only show date (YYYY-MM-DD)
            session["date_joined"] = user[5].split("T")[0] if "T" in user[5] else user[5]
            flash("Login successful!", "success")
            return redirect(url_for('index'))

        return render_template("login.html", error="Invalid email or password")

    return render_template("login.html")

# ---------------- Logout ----------------
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('branding'))

# ---------------- Ideas API ----------------
@app.route('/api/ideas', methods=['GET', 'POST'])
def ideas_api():
    ideas = load_json(IDEAS_FILE)
    
    if request.method == 'POST':
        if 'user_id' not in session:
            return jsonify({"error": "Login required"}), 401

        data = request.form
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        category = data.get('category', '').strip()
        image_file = request.files.get('image')
        image_url = data.get('image_url', '').strip()

        filename = ''
        if image_file and image_file.filename:
            ext = os.path.splitext(image_file.filename)[1]
            filename = f"idea-{get_next_id(ideas)}{ext}"
            image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        elif image_url:
            filename = image_url

        new_idea = {
            "id": get_next_id(ideas),
            "user_id": int(session['user_id']),
            "title": title,
            "description": description,
            "category": category,
            "image_url": f"/images/{filename}" if filename and not filename.startswith("http") else filename,
            "upvotes": [],
            "downvotes": []
        }
        ideas.append(new_idea)
        save_json(IDEAS_FILE, ideas)
        return jsonify(new_idea), 201

    # GET ideas with filtering
    search = request.args.get('search', '').lower()
    category = request.args.get('category', 'all').lower()
    sort = request.args.get('sort', 'newest').lower()

    filtered = [
        idea for idea in ideas
        if (search in idea.get('title', '').lower() or search in idea.get('description', '').lower())
        and (category == 'all' or idea.get('category', '').lower() == category)
    ]

    if sort == 'newest':
        filtered.sort(key=lambda x: x.get('id', 0), reverse=True)
    elif sort == 'popular':
        filtered.sort(key=lambda x: len(x.get('upvotes', [])) - len(x.get('downvotes', [])), reverse=True)
    elif sort == 'trending':
        filtered.sort(key=lambda x: len(x.get('upvotes', [])), reverse=True)

    return jsonify(filtered)

# ---------------- Voting ----------------


@app.route("/api/ideas/<int:idea_id>/vote", methods=["POST"])
def vote_idea(idea_id):
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json() or {}
    vote_type = data.get("voteType")
    user_id = int(session["user_id"])  # force integer

    ideas = load_json(IDEAS_FILE)

    updated_idea = None
    for idea in ideas:
        if int(idea.get("id")) == idea_id:  # ensure ID comparison works
            up = set(idea.get("upvotes", []))
            down = set(idea.get("downvotes", []))

            if vote_type == "upvote":
                if user_id in up:
                    up.remove(user_id)
                else:
                    down.discard(user_id)
                    up.add(user_id)

            elif vote_type == "downvote":
                if user_id in down:
                    down.remove(user_id)
                else:
                    up.discard(user_id)
                    down.add(user_id)

            idea["upvotes"] = list(up)
            idea["downvotes"] = list(down)
            updated_idea = idea
            break

    if not updated_idea:
        return jsonify({"error": f"Idea {idea_id} not found"}), 404

    save_json(IDEAS_FILE, ideas)
    return jsonify(updated_idea)


# ---------------- Reporting ----------------
@app.route('/api/ideas/<int:idea_id>/report', methods=['POST'])
def report_idea(idea_id):
    if 'user_id' not in session:
        return jsonify({"error": "Login required"}), 401

    ideas = load_json(IDEAS_FILE)
    idea = next((i for i in ideas if i.get('id') == idea_id), None)
    if not idea:
        return jsonify({"error": "Idea not found"}), 404

    reports = load_json(REPORTS_FILE)
    data = request.get_json() or {}
    report_desc = data.get('description', '').strip()

    new_report = {
        "id": get_next_id(reports),
        "idea_id": idea_id,
        "idea_title": idea.get('title', ''),
        "user_id": int(session['user_id']),
        "description": report_desc,
        "createdAt": datetime.utcnow().isoformat()
    }
    reports.append(new_report)
    save_json(REPORTS_FILE, reports)
    return jsonify(new_report), 201

# ---------------- Get Reports for Idea ----------------
@app.route('/api/ideas/<int:idea_id>/reports', methods=['GET'])
def get_reports(idea_id):
    reports = load_json(REPORTS_FILE)
    idea_reports = [
        {
            "id": r.get("id"),
            "description": r.get("description", ""),
            "createdAt": r.get("createdAt", "")
        }
        for r in reports if r.get("idea_id") == idea_id
    ]
    return jsonify(idea_reports)

# ---------------- Reports Page ----------------
@app.route('/reports')
def reports_page():
    # Must be logged in
    if 'user_id' not in session:
        flash("Please login to access reports.", "error")
        return redirect(url_for('login'))

    # Must be developer or admin
    if session.get('account_type') not in ['developer', 'admin']:
        flash("Unauthorized access.", "error")
        return redirect(url_for('index'))

    # Otherwise: load ideas + reports
    ideas = load_json(IDEAS_FILE)
    reports = load_json(REPORTS_FILE)
    for idea in ideas:
        idea_reports = [r for r in reports if r.get('idea_id') == idea.get('id')]
        idea['report_count'] = len(idea_reports)
        idea['reports'] = sorted(idea_reports, key=lambda x: x.get('createdAt', ''), reverse=True)

    return render_template('reports.html', ideas=ideas, reports=reports)

# ---------------- Delete Report ----------------
@app.route('/delete_report/<int:report_id>', methods=['DELETE'])
def delete_report(report_id):
    if 'user_id' not in session:
        return jsonify({"error": "Login required"}), 401

    # Only allow developers or admins to delete reports
    if session.get("account_type") not in ["developer", "admin"]:
        return jsonify({"error": "Unauthorized"}), 403

    reports = load_json(REPORTS_FILE)
    report_exists = any(r for r in reports if r.get('id') == report_id)
    if not report_exists:
        return jsonify({"error": "Report not found"}), 404

    # Remove the report
    reports = [r for r in reports if r.get('id') != report_id]
    save_json(REPORTS_FILE, reports)

    return jsonify({"success": True, "message": "Report deleted"}), 200

# ---------------- Settings Page ----------------
@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    user_id = session['user_id']

    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()

        if request.method == 'POST':
            name = request.form.get('name', '').strip()
            email = request.form.get('email', '').strip()
            password = request.form.get('password', '').strip()

            if password:
                hashed_pw = generate_password_hash(password)
                c.execute("""UPDATE users SET name=?, email=?, password=? WHERE id=?""",
                          (name, email, hashed_pw, user_id))
            else:
                c.execute("""UPDATE users SET name=?, email=? WHERE id=?""",
                          (name, email, user_id))

            conn.commit()

            session['username'] = name
            session['email'] = email
            flash("Settings updated!", "success")
            return redirect(url_for('settings'))

        c.execute("SELECT id, name, email FROM users WHERE id=?", (user_id,))
        row = c.fetchone()

    if not row:
        return redirect(url_for('logout'))

    user = {"id": row[0], "name": row[1], "email": row[2]}
    return render_template("settings.html", user=user)

# ---------------- Developer Request ----------------
@app.route("/developer_request", methods=["POST"])
def developer_request():
    if "user_id" not in session:
        flash("You must be logged in to send a request.", "error")
        return redirect(url_for("login"))

    reason = request.form["reason"]
    user_id = session["user_id"]
    email = session.get("email", "")

    with sqlite3.connect(REQUESTS_DB) as conn:
        c = conn.cursor()
        c.execute("INSERT INTO developer_requests (user_id, email, reason) VALUES (?, ?, ?)",
                  (user_id, email, reason))
        conn.commit()

    flash("Your request has been sent successfully!", "success")
    return redirect(url_for("settings"))

# ---------------- Admin Routes ----------------
# ---------------- Admin Routes ----------------
@app.route("/requests", methods=["GET"])
def requests_page():
    # Must be logged in
    if "user_id" not in session:
        flash("Please login to access requests.", "error")
        return redirect(url_for("login"))

    # Must be admin
    if session.get("account_type") != "admin":
        flash("Unauthorized access.", "error")
        return redirect(url_for("index"))

    # Load all developer requests
    with sqlite3.connect(REQUESTS_DB) as conn:
        c = conn.cursor()
        c.execute("SELECT id, user_id, email, reason, created_at FROM developer_requests")
        requests_data = c.fetchall()

    return render_template("requests.html", requests=requests_data)


@app.route("/approve/<int:request_id>", methods=["POST"])
def approve_request(request_id):
    # Must be admin
    if session.get("account_type") != "admin":
        flash("Unauthorized action.", "error")
        return redirect(url_for("index"))

    with sqlite3.connect(REQUESTS_DB) as conn:
        c = conn.cursor()
        c.execute("SELECT user_id FROM developer_requests WHERE id=?", (request_id,))
        row = c.fetchone()

    if row:
        user_id = row[0]
        # Promote user to developer
        with sqlite3.connect(DB_FILE) as conn:
            c = conn.cursor()
            c.execute("UPDATE users SET account_type='developer' WHERE id=?", (user_id,))
            conn.commit()

        # Remove request from DB
        with sqlite3.connect(REQUESTS_DB) as conn:
            c = conn.cursor()
            c.execute("DELETE FROM developer_requests WHERE id=?", (request_id,))
            conn.commit()

        flash("Request approved!", "success")
    else:
        flash("Request not found.", "error")

    return redirect(url_for("requests_page"))

@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.get_json()
    msg = data.get("message", "")
    
    reply = get_chatbot_reply(msg)

    return jsonify({"reply": reply})


@app.route("/reject/<int:request_id>", methods=["POST"])
def reject_request(request_id):
    # Must be admin
    if session.get("account_type") != "admin":
        flash("Unauthorized action.", "error")
        return redirect(url_for("index"))

    with sqlite3.connect(REQUESTS_DB) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM developer_requests WHERE id=?", (request_id,))
        conn.commit()

    flash("Request rejected.", "error")
    return redirect(url_for("requests_page"))

# ---------------- Delete Account ----------------
@app.route("/delete_account", methods=["POST"])
def delete_account():
    if "user_id" not in session:
        return redirect(url_for("login"))

    user_id = session["user_id"]

    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM users WHERE id=?", (user_id,))
        conn.commit()

    with sqlite3.connect(REQUESTS_DB) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM developer_requests WHERE user_id=?", (user_id,))
        conn.commit()

    session.clear()
    flash("Your account has been deleted permanently.", "success")
    return redirect(url_for("branding"))

# ---------------- Edit Idea ----------------
@app.route('/edit_idea/<int:idea_id>', methods=['GET', 'POST'])
def edit_idea(idea_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    ideas = load_json(IDEAS_FILE)
    idea = next((i for i in ideas if i['id'] == idea_id and i['user_id'] == session['user_id']), None)

    if not idea:
        flash("Idea not found or you cannot edit it.", "error")
        return redirect(url_for('index'))

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category = request.form.get('category', '').strip()

        # Handle image upload
        image_file = request.files.get('image')
        image_url = request.form.get('image_url', '').strip()
        filename = ''
        if image_file and image_file.filename:
            ext = os.path.splitext(image_file.filename)[1]
            filename = f"idea-{idea_id}{ext}"
            image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            idea['image_url'] = f"/images/{filename}"
        elif image_url:
            idea['image_url'] = image_url

        idea['title'] = title
        idea['description'] = description
        idea['category'] = category
        save_json(IDEAS_FILE, ideas)

        flash("Idea updated!", "success")
        return redirect(url_for('index'))

    return render_template('edit_idea.html', idea=idea)


# ---------------- Inline Edit Idea (JSON) ----------------
@app.route('/edit_idea/<int:idea_id>/inline', methods=['POST'])
def edit_idea_inline(idea_id):
    if 'user_id' not in session:
        return jsonify({"error": "Login required"}), 401

    data = request.get_json()
    if not data or 'description' not in data:
        return jsonify({"error": "No description provided"}), 400

    ideas = load_json(IDEAS_FILE)
    for idea in ideas:
        if idea['id'] == idea_id and idea['user_id'] == session['user_id']:
            idea['description'] = data['description']
            save_json(IDEAS_FILE, ideas)
            return jsonify({"success": True})

    return jsonify({"error": "Idea not found or permission denied"}), 404


# ---------------- Run App ----------------
if __name__ == '__main__':
    app.run(debug=True)
