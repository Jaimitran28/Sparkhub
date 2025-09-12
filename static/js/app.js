// Helper: truncate text
const truncate = (str, n=160) => (str.length > n ? str.slice(0, n-1) + "…" : str);
const currentUserId = "{{ session.get('user_id', '') }}";
// Elements
const ideasGrid = document.getElementById('ideasGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const openFormBtn = document.getElementById('openForm');
const scrollToFormBtn = document.getElementById("scrollToForm");

const ideaDialog = document.getElementById("ideaDialog");
const ideaForm = document.getElementById("ideaForm");
const closeDialog = document.getElementById("closeDialog");

const viewDialog = document.getElementById("viewDialog");
const closeView = document.getElementById("closeView");
const viewImg = document.getElementById("viewImg");
const viewTitle = document.getElementById("viewTitle");
const viewDesc = document.getElementById("viewDesc");
const viewCategory = document.getElementById("viewCategory");
const viewVote = document.getElementById("viewVote");
const viewVotes = document.getElementById("viewVotes");
const viewShare = document.getElementById("viewShare");

const statIdeas = document.getElementById("statIdeas");
const statVotes = document.getElementById("statVotes");
const statCategories = document.getElementById("statCategories");

let currentIdeas = [];
 

openFormBtn.addEventListener("click", () => ideaDialog.showModal());
closeDialog.addEventListener("click", () => ideaDialog.close());

// Modal vote buttons
// Assuming you have elements
const viewUpvote = document.getElementById('viewUpvote');
const viewDownvote = document.getElementById('viewDownvote');
const viewUpvotes = document.getElementById('viewUpvotes');
const viewDownvotes = document.getElementById('viewDownvotes');

let currentIdeaId = null;

// Load initial ideas
async function loadIdeas() {
  const params = new URLSearchParams({
    search: searchInput.value.trim(),
    category: categoryFilter.value,
    sort: sortSelect.value
  });
  const res = await fetch(`/api/ideas?${params.toString()}`);
  const data = await res.json();
  currentIdeas = data.map(i => {
    i.upvotes = i.upvotes || [];
    i.downvotes = i.downvotes || [];
    return i;
  });

  renderIdeas();
  updateStats();
}

function updateStats() {
  statIdeas.textContent = currentIdeas.length;

  const totalVotes = currentIdeas.reduce((sum, idea) => {
    return sum + (idea.upvotes?.length || 0) + (idea.downvotes?.length || 0);
  }, 0);

  statVotes.textContent = totalVotes;

  const cats = new Set(currentIdeas.map(i => i.category));
  statCategories.textContent = cats.size;
}

function updateModalVotes(idea) {
  if (viewUpvote && viewDownvote) {
    viewUpvote.textContent = `⬆️ ${idea.upvotes?.length || 0}`;
    viewDownvote.textContent = `⬇️ ${idea.downvotes?.length || 0}`;

    if (idea.upvotes?.includes(currentUserId)) {
      viewUpvote.classList.add('active');
    } else {
      viewUpvote.classList.remove('active');
    }

    if (idea.downvotes?.includes(currentUserId)) {
      viewDownvote.classList.add('active');
    } else {
      viewDownvote.classList.remove('active');
    }
  }
}

// Handle voting
async function voteIdea(id, type) {
  try {
    const res = await fetch(`/api/ideas/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType: type })
    });

    const data = await res.json();

    if (res.ok) {
      // Update local copy
      const idx = currentIdeas.findIndex(i => i.id === id);
      if (idx !== -1) {
        currentIdeas[idx] = data;
      }

      // Update modal if it’s the one open
      if (currentIdeaId === id) {
        updateModalVotes(data);
      }

      // Re-render cards (so votes & highlights update)
      renderIdeas(currentIdeas);

      // Update hero stats
      updateStats();

    } else {
      alert(data.error || 'Vote failed');
    }
  } catch (err) {
    console.error('Error voting:', err);
  }
}

function renderIdeas(ideas = currentIdeas) {
  ideasGrid.innerHTML = '';

  ideas.forEach(idea => {
    const upCount = idea.upvotes?.length || 0;
    const downCount = idea.downvotes?.length || 0;
    const userUp = idea.upvotes?.includes(currentUserId);
    const userDown = idea.downvotes?.includes(currentUserId);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = idea.id;

    card.innerHTML = `
      <img src="${idea.image_url || '/uploads/default.png'}" class="thumb" alt="${idea.title}" />
      <div class="card-content">
        <h3>${idea.title}</h3>
        <p class="desc">${truncate(idea.description, 180)}</p>
        <div class="meta">
          <span class="chip">${idea.category}</span>
          <span class="votes">
            <span class="upvote ${userUp ? 'active' : ''}">⬆ ${upCount}</span>
            <span class="downvote ${userDown ? 'active' : ''}">⬇ ${downCount}</span>
          </span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => openView(idea));
    const upBtn = card.querySelector('.upvote');
    const downBtn = card.querySelector('.downvote');

    upBtn.addEventListener('click', e => {
      e.stopPropagation(); // prevent card click opening modal
      voteIdea(idea.id, 'upvote');
    });

    downBtn.addEventListener('click', e => {
      e.stopPropagation();
      voteIdea(idea.id, 'downvote');
    });

    ideasGrid.appendChild(card);
  });

  updateStats();
}


// Open submit form
openFormBtn.addEventListener('click', () => ideaDialog.showModal());
scrollToFormBtn.addEventListener('click', () => ideaDialog.showModal());
closeDialog.addEventListener('click', () => ideaDialog.close());

// Submit idea
ideaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(ideaForm);
  // Prefer file if provided; otherwise image_url may be used
  const res = await fetch('/api/ideas', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    alert('Failed to submit idea. Please check your inputs.');
    return;
  }
  const newIdea = await res.json();
  ideaDialog.close();
  ideaForm.reset();
  // Prepend and re-render
  currentIdeas = [newIdea, ...currentIdeas];
  renderIdeas();
  updateStats();
  celebrate();
  // Highlight first card
  const first = ideasGrid.querySelector('.card');
  if (first) {
    first.classList.add('highlight');
    setTimeout(()=>first.classList.remove('highlight'), 900);
  }
});

// Filters
[searchInput, categoryFilter, sortSelect].forEach(el => {
  el.addEventListener('input', debounce(loadIdeas, 250));
});

function debounce(fn, wait=250){
  let t; 
  return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,args), wait); }
}

// Event listeners
viewUpvote.addEventListener('click', () => voteIdea(currentIdeaId, 'upvote'));
viewDownvote.addEventListener('click', () => voteIdea(currentIdeaId, 'downvote'));

// View modal
function openView(idea) {
  currentIdeaId = idea.id;

  // Set modal content
  viewImg.src = idea.image_url || `https://picsum.photos/seed/${idea.id}/800/450`;
  viewTitle.textContent = idea.title;
  viewDesc.textContent = idea.description;
  viewCategory.textContent = idea.category;

  // Update votes
  updateModalVotes(idea);

  // Modal vote listeners
  viewUpvote.onclick = e => { e.stopPropagation(); voteIdea(idea.id, 'upvote'); };
  viewDownvote.onclick = e => { e.stopPropagation(); voteIdea(idea.id, 'downvote'); };

  viewShare.onclick = async e => {
    e.stopPropagation();
    const url = location.origin + '/#idea-' + idea.id;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    } else prompt('Copy link:', url);
  };

  // Add report button listener
  const viewReport = document.getElementById("viewReport");
  viewReport.onclick = async e => {
    e.stopPropagation();
    await reportIdea(idea.id);
  };
  viewDialog.showModal();
}

closeView.addEventListener('click', () => viewDialog.close());

// Confetti celebration (lightweight)
function celebrate() {
  const burst = document.createElement('div');
  burst.style.position = 'fixed';
  burst.style.inset = '0';
  burst.style.pointerEvents = 'none';
  burst.style.overflow = 'hidden';
  document.body.appendChild(burst);
  const count = 120;
  for (let i=0;i<count;i++) {
    const s = document.createElement('span');
    s.style.position='absolute';
    s.style.left = Math.random()*100 + '%';
    s.style.top = '-10px';
    s.style.width = s.style.height = (4 + Math.random()*6) + 'px';
    s.style.background = `hsl(${Math.random()*360}, 80%, 60%)`;
    s.style.transform = `rotate(${Math.random()*360}deg)`;
    s.style.opacity = '0.9';
    s.style.borderRadius = '2px';
    s.style.animation = `fall ${2 + Math.random()*1.4}s linear forwards`;
    burst.appendChild(s);
  }
  setTimeout(()=>burst.remove(), 3500);
}
// basic falling keyframes
const style = document.createElement('style');
style.textContent = `@keyframes fall{
  to { transform: translateY(110vh) rotate(360deg); opacity: 0.6;}
}`;
document.head.appendChild(style);

// Initial load
loadIdeas();

async function reportIdea(id) {
  const reason = prompt("Please provide a reason for reporting this idea:");
  if (!reason || !reason.trim()) return; // Cancel if no reason provided

  try {
    const res = await fetch(`/api/ideas/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: reason.trim() }) // send reason
    });
    const data = await res.json();

    if (res.ok) {
      alert("Idea reported successfully.");
    } else {
      alert(data.error || "Failed to report idea.");
    }
  } catch (err) {
    console.error("Report error:", err);
    alert("An error occurred while reporting.");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const backToTopBtn = document.getElementById("backToTop");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {  
      backToTopBtn.style.display = "flex";
      backToTopBtn.style.opacity = "1";
    } else {
      backToTopBtn.style.display = "none";
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});

const chatbotButton = document.getElementById("chatbotButton");
const chatbotWindow = document.getElementById("chatbotWindow");
const closeChatbot = document.getElementById("closeChatbot");
const sendBtn = document.getElementById("sendChatbot");
const inputField = document.getElementById("chatbotInput");
const chatBox = document.getElementById("chatbotMessages");

// Toggle chatbot
chatbotButton.addEventListener("click", () => {
  chatbotWindow.classList.add("active");
});

closeChatbot.addEventListener("click", () => {
  chatbotWindow.classList.remove("active");
});

// Send message
async function sendMessage() {
  const userText = inputField.value.trim();
  if (!userText) return;

  // Add user message
  chatBox.innerHTML += `<div class="chatbot-msg user-msg">${userText}</div>`;
  inputField.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Show "thinking..."
  const loading = document.createElement("div");
  loading.className = "chatbot-msg bot-msg";
  loading.innerText = "🤖 Thinking...";
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    // Call Flask backend
    const res = await fetch("http://127.0.0.1:5000/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText })
    });

    const data = await res.json();

    // Replace loading with real reply
    loading.remove();
    chatBox.innerHTML += `<div class="chatbot-msg bot-msg">🤖 ${data.reply}</div>`;
  } catch (err) {
    loading.remove();
    chatBox.innerHTML += `<div class="chatbot-msg bot-msg">⚠️ Error: ${err.message}</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
inputField.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
