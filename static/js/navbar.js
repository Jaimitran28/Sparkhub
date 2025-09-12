/* ---------------- PROFILE MODAL ---------------- */
const profileDialog = document.getElementById('profileDialog');
const openProfileBtn = document.getElementById('openProfile');
const closeProfileBtn = document.getElementById('closeProfile');
const profileSettingsBtn = document.getElementById('profileSettings');

openProfileBtn.addEventListener('click', () => profileDialog.showModal());
closeProfileBtn.addEventListener('click', () => profileDialog.close());
profileSettingsBtn.addEventListener('click', () => window.location.href = 'settings');

// Close when clicking outside
profileDialog.addEventListener('click', (e) => {
  const rect = profileDialog.getBoundingClientRect();
  if (!(rect.top <= e.clientY && e.clientY <= rect.bottom &&
        rect.left <= e.clientX && e.clientX <= rect.right)) {
    profileDialog.close();
  }
});

/* ---------------- UPLOADS MODAL ---------------- */
const openUploadsBtn = document.getElementById('openUploads');
const closeUploadsBtn = document.getElementById('closeUploads');
const uploadsDialog = document.getElementById('uploadsDialog');
const userIdeasList = document.getElementById('userIdeasList');
const ideaDetails = document.getElementById('ideaDetails');

const ideaTitleText = document.getElementById('ideaTitleText');
const ideaTitleInput = document.getElementById('ideaTitleInput');
const ideaDescText = document.getElementById('ideaDescText');
const ideaDescriptionTextarea = document.getElementById('ideaDescriptionTextarea');
const ideaImagePreview = document.getElementById('ideaImagePreview');
const ideaImageInput = document.getElementById('ideaImageInput');
const ideaDate = document.getElementById('ideaDate');

const editIdeaBtn = document.getElementById('editIdeaBtn');
const saveIdeaBtn = document.getElementById('saveIdea');
const deleteIdeaBtn = document.getElementById('deleteIdea');

let selectedIdea = null;

// Open uploads modal and load ideas
openUploadsBtn.addEventListener('click', async () => {
  uploadsDialog.showModal();
  ideaDetails.style.display = 'none';
  userIdeasList.innerHTML = '<li>Loading...</li>';
  try {
    const res = await fetch('/api/ideas');
    const allIdeas = await res.json();
    const userId = "{{ session.get('user_id') }}";
    const userIdeas = allIdeas.filter(i => i.user_id == userId);

    if (userIdeas.length === 0) {
      userIdeasList.innerHTML = '<li>No ideas uploaded yet.</li>';
      return;
    }

    userIdeasList.innerHTML = '';
    userIdeas.forEach(idea => {
      const li = document.createElement('li');
      li.classList.add('idea-item');
      li.innerHTML = `
        <span>${idea.title}</span>
        <span style="font-size:0.85em;opacity:0.7">
          ${new Date(idea.created_at || Date.now()).toLocaleDateString()}
        </span>
      `;
      li.addEventListener('click', () => showIdeaDetails(idea));
      userIdeasList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    userIdeasList.innerHTML = '<li>Error loading ideas.</li>';
  }
});

// Close uploads modal
closeUploadsBtn.addEventListener('click', () => uploadsDialog.close());

/* ---------------- IDEA DETAILS ---------------- */
function showIdeaDetails(idea) {
  selectedIdea = idea;

  // Title
  ideaTitleText.textContent = idea.title;
  ideaTitleInput.value = idea.title;

  // Description
  ideaDescText.textContent = idea.description;
  ideaDescriptionTextarea.value = idea.description;

  // Image preview
  if (idea.image_url) {
    ideaImagePreview.src = idea.image_url;
    ideaImagePreview.style.display = 'block';
  } else {
    ideaImagePreview.style.display = 'none';
  }

  ideaDate.textContent = new Date(idea.created_at || Date.now()).toLocaleString();
  ideaDetails.style.display = 'block';

  // Reset to view mode
  ideaTitleText.style.display = 'block';
  ideaTitleInput.style.display = 'none';
  ideaDescText.style.display = 'block';
  ideaDescriptionTextarea.style.display = 'none';
  ideaImageInput.style.display = 'none';

  editIdeaBtn.style.display = 'inline-block';
  saveIdeaBtn.style.display = 'none';
}

/* ---------------- EDIT & SAVE ---------------- */
editIdeaBtn.addEventListener('click', () => {
  if (!selectedIdea) return;

  // Switch to edit mode
  ideaTitleText.style.display = 'none';
  ideaTitleInput.style.display = 'block';
  ideaDescText.style.display = 'none';
  ideaDescriptionTextarea.style.display = 'block';
  ideaImageInput.style.display = 'block';

  editIdeaBtn.style.display = 'none';
  saveIdeaBtn.style.display = 'inline-block';
});

saveIdeaBtn.addEventListener('click', async () => {
  if (!selectedIdea) return;

  const updatedTitle = ideaTitleInput.value.trim();
  const updatedDesc = ideaDescriptionTextarea.value.trim();
  const imageFile = ideaImageInput.files[0];

  if (updatedTitle.length === 0 || updatedDesc.length === 0) {
    alert('Title and description cannot be empty!');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('title', updatedTitle);
    formData.append('description', updatedDesc);
    if (imageFile) formData.append('image', imageFile);

    const res = await fetch(`/edit_idea/${selectedIdea.id}`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      // Update UI
      ideaTitleText.textContent = updatedTitle;
      ideaDescText.textContent = updatedDesc;

      if (data.image_url) {
        ideaImagePreview.src = data.image_url;
        ideaImagePreview.style.display = 'block';
      }

      // Back to view mode
      ideaTitleText.style.display = 'block';
      ideaTitleInput.style.display = 'none';
      ideaDescText.style.display = 'block';
      ideaDescriptionTextarea.style.display = 'none';
      ideaImageInput.style.display = 'none';

      editIdeaBtn.style.display = 'inline-block';
      saveIdeaBtn.style.display = 'none';

      // Update state
      selectedIdea.title = updatedTitle;
      selectedIdea.description = updatedDesc;
      if (data.image_url) selectedIdea.image_url = data.image_url;

      alert('Idea updated!');
    } else {
      alert(data.error || 'Failed to update idea.');
    }
  } catch (err) {
    console.error(err);
    alert('Error updating idea.');
  }
});

/* ---------------- DELETE ---------------- */
deleteIdeaBtn.addEventListener('click', async () => {
  if (!selectedIdea) return;
  if (!confirm('Are you sure you want to delete this idea?')) return;

  try {
    const res = await fetch(`/delete_idea/${selectedIdea.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('Idea deleted!');
      selectedIdea = null;
      ideaDetails.style.display = 'none';
      openUploadsBtn.click();
    } else {
      alert(data.error || 'Failed to delete.');
    }
  } catch (err) {
    console.error(err);
    alert('Error deleting idea.');
  }
});