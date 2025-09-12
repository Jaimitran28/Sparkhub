# ⚡ SparkHub

SparkHub is a collaborative web platform built with **Flask** where users can **share, vote, report, and moderate ideas**.  
It includes **authentication, developer requests, chatbot assistance, and an admin dashboard**.

---

## 📂 Project Structure

```
SparkHub/
│── static/                # Static assets
│   ├── css/               # Stylesheets
│   │   ├── branding.css
│   │   ├── login.css
│   │   ├── navbar.css
│   │   ├── reports.css
│   │   ├── requests.css
│   │   ├── settings.css
│   │   ├── signup.css
│   │   ├── styles.css
│   │   └── ui.css
│   │
│   ├── img/               # Images & icons
│   │   ├── css.png
│   │   ├── flask.png
│   │   ├── html.png
│   │   ├── js.png
│   │   ├── logo.png
│   │   ├── python.png
│   │   ├── sqlite.png
│   │   └── ss.png
│   │
│   ├── js/                # Client-side JavaScript
│   │   ├── app.js
│   │   ├── branding.js
│   │   ├── navbar.js
│   │   ├── reports.js
│   │   ├── requests.js
│   │   └── settings.js
│   │
│   └── uploads/           # User-uploaded files (if any)
│
│── templates/             # Flask Jinja2 templates
│   ├── branding.html
│   ├── index.html
│   ├── login.html
│   ├── navbar.html
│   ├── reports.html
│   ├── requests.html
│   ├── settings.html
│   └── signup.html
│
│── app.py                 # Main Flask application
│── chatbot_logic.py       # Chatbot rules & logic
│── developer_requests.db  # SQLite DB for developer requests
│── ideas.json             # Stores submitted ideas
│── README.md              # Documentation
│── reports.json           # Stores reported ideas
│── requirements.txt       # Python dependencies
│── users.db               # SQLite DB for users
```

---

## 🚀 Features

- 📝 **Idea Submission** – Users can submit ideas with title, description, and optional images.  
- 👍 **Voting System** – Upvote and downvote ideas.  
- 🚩 **Reporting System** – Report inappropriate ideas.  
- ✏️ **Editing & Deleting** – Manage your own ideas easily.  
- 🔒 **Authentication** – Signup, login, password hashing, and account management.  
- 👨‍💻 **Developer Requests** – Apply for developer privileges.  
- 🛡 **Admin/Developer Dashboard** – Manage reports, review developer requests.  
- 🤖 **Chatbot Assistant** – Helps users with submissions, reports, and FAQs.  

---

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sparkhub.git
   cd sparkhub
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate   # Linux/Mac
   venv\Scripts\activate      # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask app**
   ```bash
   python app.py
   ```

5. Open the app in your browser:
   ```
   http://127.0.0.1:5000/
   ```

---

## ⚙️ Requirements

Dependencies are listed in **requirements.txt**:

```
Flask==3.0.3
Werkzeug==3.0.3
gunicorn==23.0.0   # optional, for deployment
```

---

## 🔐 User Roles

- **User** – Submit, vote, report, edit, and delete ideas.  
- **Developer** – Access reports, moderate ideas.  
- **Admin** – Approve/reject developer requests, manage users.  

---

## 🤖 Chatbot Commands

The chatbot supports:
- `submit idea` – guide for submitting ideas  
- `report idea` – help with reporting  
- `edit idea` – instructions to edit  
- `vote` – explain upvote/downvote  
- `categories` – list available categories  
- `signup` / `login` / `delete account` – account help  
- `become developer` – developer request info  

## Test Accounts

There are three main accounts stored to test every aspect of the project:
- `Admin` – admintest@gmail.com  
- `Developer` – devtest@gmail.com  
- `User` – usertest@gmail.com

password- 1234 (for all testing accounts)


## 📜 License

This project is licensed under the **MIT License** – free to use and modify.

---

## 💡 About

SparkHub was built to empower communities by **sharing and curating innovative ideas**.  
It is simple, extensible, and developer-friendly.
