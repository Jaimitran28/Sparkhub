const reports = JSON.parse(document.getElementById("reportsData").textContent);

// ---------------- Toggle Reports View ----------------
document.querySelectorAll(".view-reports-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const parent = btn.closest(".report-item");
    const reportsList = parent.querySelector(".idea-reports");

    if (reportsList.style.display === "block") {
      reportsList.style.display = "none";
      btn.textContent = "View Reports";
    } else {
      reportsList.style.display = "block";
      btn.textContent = "Hide Reports";
    }
  });
});

// ---------------- Delete Report Functionality ----------------
document.querySelectorAll(".delete-report-btn").forEach((delBtn) => {
  delBtn.addEventListener("click", async () => {
    const reportLi = delBtn.closest("li");
    const reportId = reportLi.getAttribute("data-report-id");

    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const res = await fetch(`/delete_report/${reportId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        reportLi.remove(); // Remove from DOM
      } else {
        alert("Failed to delete report.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting report.");
    }
  });
});

// ---------------- Delete Ideas Modal ----------------
const deleteModal = document.getElementById("deleteModal");
const openBtn = document.getElementById("openDeleteModal");
const closeBtn = document.getElementById("closeDeleteModal");
const deleteList = document.getElementById("reportedIdeasList");

// Get ideas from server-rendered template
const ideas = JSON.parse(document.getElementById("reportsData").textContent);

// Open modal & populate ideas
openBtn.addEventListener("click", () => {
  deleteModal.style.display = "block";
  deleteList.innerHTML = "";

  if (!ideas || ideas.length === 0) {
    deleteList.innerHTML = "<p>No reported ideas available.</p>";
    return;
  }

  ideas.forEach((idea) => {
    const li = document.createElement("li");
    li.classList.add("reported-idea-item");
    li.innerHTML = `
      <span>${idea.title}</span>
      <button class="delete-btn" data-id="${idea.id}">Remove</button>
    `;
    deleteList.appendChild(li);
  });
});

// Handle delete clicks dynamically
deleteList.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;

  const id = e.target.getAttribute("data-id");
  if (!confirm("Are you sure you want to delete this idea?")) return;

  try {
    const res = await fetch(`/delete_idea/${id}`, { method: "DELETE" });

    if (res.ok) {
      // Remove from modal
      e.target.closest("li").remove();

      // Remove from main page
      const mainLi = document.querySelector(
        `.report-item[data-idea-id="${id}"]`
      );
      if (mainLi) mainLi.remove();

      // Update local cache
      const index = ideas.findIndex((i) => i.id == id);
      if (index !== -1) ideas.splice(index, 1);

      // Show fallback if no ideas left
      if (!deleteList.querySelector("li")) {
        deleteList.innerHTML = "<p>No reported ideas available.</p>";
      }
    } else {
      alert("Failed to delete idea.");
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting idea.");
  }
});

// ---------------- Close Modal ----------------
closeBtn.addEventListener("click", () => {
  deleteModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === deleteModal) {
    deleteModal.style.display = "none";
  }
});
