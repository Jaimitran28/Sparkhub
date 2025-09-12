document.addEventListener("DOMContentLoaded", () => {
  const backToTopBtn = document.getElementById("backToTop");

  // Show or hide Back to Top button on scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.style.display = "flex";
      backToTopBtn.style.opacity = "1";
    } else {
      backToTopBtn.style.display = "none";
    }
  });

  // Smooth scroll to top on button click
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});

// ---- Popup Controls ----
function openDevPopup() {
  document.getElementById("devPopup").style.display = "flex";
}

function closeDevPopup() {
  document.getElementById("devPopup").style.display = "none";
}
