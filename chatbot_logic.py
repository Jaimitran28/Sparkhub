import json
import os

IDEAS_FILE = 'ideas.json'

# ---------------- Load ideas ----------------
def load_ideas():
    if not os.path.exists(IDEAS_FILE):
        return []
    with open(IDEAS_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

# ---------------- Predefined chatbot rules ----------------
RULES = [
    {"keywords": ["how to submit", "submit idea", "submission", "post idea"], 
     "response": "To submit an idea, fill out the form with a title, description, category, and optional image 🚀"},
    {"keywords": ["report idea", "report", "flag", "problem with idea"], 
     "response": "To report an idea, open it and click 'Report'. Provide a clear reason for the report."},
    {"keywords": ["edit idea", "update idea", "change idea"], 
     "response": "You can edit your ideas by clicking the 'Edit' button on your idea card. Update title, description, category, or image."},
    {"keywords": ["vote", "upvote", "downvote", "like", "dislike"], 
     "response": "You can upvote ⬆️ or downvote ⬇️ ideas by opening them and clicking the respective buttons."},
    {"keywords": ["categories", "category", "types", "idea type"], 
     "response": "We support categories like Technology, Health, Education, Environment, Finance, Social Impact, and Arts & Media."},
    {"keywords": ["signup", "register", "create account", "new account"], 
     "response": "Click 'Sign Up' on the homepage and fill in your details to create an account."},
    {"keywords": ["login", "sign in", "access account"], 
     "response": "Click 'Login' and enter your registered email and password to access your account."},
    {"keywords": ["logout", "sign out", "exit account"], 
     "response": "Click 'Logout' to safely exit your account."},
    {"keywords": ["forgot password", "reset password", "lost password"], 
     "response": "If you forgot your password, click 'Forgot Password?' on the login page to reset it."},
    {"keywords": ["delete account", "remove account", "close account"], 
     "response": "You can delete your account from Settings. This will permanently remove your data."},
    {"keywords": ["developer request", "become developer", "developer access", "apply developer"], 
     "response": "Send a developer request from your settings page under 'Request Developer Access'. Once approved, your account will be promoted."},
    {"keywords": ["moderation", "admin", "developer review", "manage reports"], 
     "response": "Admins and developers can review reports under the Reports page."},
    {"keywords": ["chatbot", "help", "support", "assistant", "guide"], 
     "response": "I’m here to help! You can ask about submitting ideas, voting, categories, account issues, or developer requests."},
    {"keywords": ["hello", "hi", "hey", "greetings"], 
     "response": "Hello! How can I assist you with your ideas or account today?"},
    {"keywords": ["thanks", "thank you", "thx"], 
     "response": "You're welcome! 😊 Happy to help."},
    {"keywords": ["bye", "goodbye", "see you"], 
     "response": "Goodbye! Feel free to come back anytime for help or to submit ideas."},
]

# ---------------- Chatbot main function ----------------
def get_chatbot_reply(message: str) -> str:
    msg = message.lower().strip()

    # 1️⃣ Check predefined rules first
    for rule in RULES:
        if any(keyword in msg for keyword in rule["keywords"]):
            return rule["response"]

    # 2️⃣ Check for idea name in the message
    ideas = load_ideas()
    mentioned_idea = None
    for idea in ideas:
        title = idea.get("title", "").lower()
        if title in msg:
            mentioned_idea = idea
            break

    if mentioned_idea:
        # Determine what the user is asking
        if "description" in msg or "about" in msg or "details" in msg:
            return f"💡 {mentioned_idea['title']} - Description: {mentioned_idea['description']}"
        elif "category" in msg or "type" in msg:
            return f"💡 {mentioned_idea['title']} - Category: {mentioned_idea['category']}"
        elif "upvote" in msg or "like" in msg:
            return f"💡 {mentioned_idea['title']} - Upvotes: {len(mentioned_idea.get('upvotes', []))}"
        elif "downvote" in msg or "dislike" in msg:
            return f"💡 {mentioned_idea['title']} - Downvotes: {len(mentioned_idea.get('downvotes', []))}"
        elif "report" in msg or "problem" in msg:
            return f"💡 {mentioned_idea['title']} - Reports: {len(mentioned_idea.get('reports', []))}"
        else:
            # General info
            return (f"💡 {mentioned_idea['title']} - Category: {mentioned_idea['category']}\n"
                    f"Description: {mentioned_idea['description']}\n"
                    f"Upvotes: {len(mentioned_idea.get('upvotes', []))}, "
                    f"Downvotes: {len(mentioned_idea.get('downvotes', []))}, "
                    f"Reports: {len(mentioned_idea.get('reports', []))}")

    # 3️⃣ Fallback response
    return ("I’m here to help! You can ask about any idea by name or ask general questions "
            "about submitting ideas, voting, categories, account actions, or developer requests.")
