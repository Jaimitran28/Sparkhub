// ---------------- Toggle Card Details ----------------
function toggleDetails(id) {
  const details = document.getElementById(id);
  details.style.display = details.style.display === "block" ? "none" : "block";
}

// ---------------- Handle Approve/Reject Actions ----------------
async function handleAction(requestId, action) {
  try {
    const response = await fetch(`/${action}/${requestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      // Remove the card from the DOM
      const card = document.querySelector(`.card[data-id='${requestId}']`);
      if (card) card.remove();
    } else {
      const text = await response.text();
      alert("Action failed: " + text);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong!");
  }
}

// ---------------- Bind Buttons ----------------
document.querySelectorAll(".approve").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    const requestId = btn.closest(".card").dataset.id;
    handleAction(requestId, "approve");
  });
});

document.querySelectorAll(".reject").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    const requestId = btn.closest(".card").dataset.id;
    handleAction(requestId, "reject");
  });
});
