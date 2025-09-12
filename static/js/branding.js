// -----------------------------
// Hover Effect for Screenshot Card
// -----------------------------
const screenshotCard = document.querySelector('#about div[style*="backdrop-filter"]');

screenshotCard.addEventListener('mouseenter', () => {
  screenshotCard.style.transform = 'scale(1.05)';
  screenshotCard.style.boxShadow =
    '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(106,92,255,0.7)';
});

screenshotCard.addEventListener('mouseleave', () => {
  screenshotCard.style.transform = 'scale(1)';
  screenshotCard.style.boxShadow =
    '0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(106,92,255,0.5)';
});

// -----------------------------
// Animate Radial Progress When In View
// -----------------------------
function animateOffers() {
  document.querySelectorAll('.circle').forEach(circle => {
    const percent = circle.getAttribute('data-percent');
    const progress = circle.querySelector('.progress');
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    progress.style.strokeDashoffset = offset;
  });
}

window.addEventListener('scroll', () => {
  const section = document.getElementById('offer');
  const sectionTop = section.getBoundingClientRect().top;

  if (sectionTop < window.innerHeight - 100) {
    animateOffers();
  }
});

// -----------------------------
// Reveal Timeline Items on Scroll
// -----------------------------
const timelineItems = document.querySelectorAll('.timeline-item');

function revealTimeline() {
  const windowHeight = window.innerHeight;

  timelineItems.forEach(item => {
    const itemTop = item.getBoundingClientRect().top;
    if (itemTop < windowHeight - 100) {
      item.classList.add('show');
    }
  });
}

window.addEventListener('scroll', revealTimeline);
window.addEventListener('load', revealTimeline);

// -----------------------------
// Reveal Features with Staggered Delay
// -----------------------------
const featureCards = document.querySelectorAll('.feature-card');

function revealFeatures() {
  const windowHeight = window.innerHeight;

  featureCards.forEach((card, index) => {
    const cardTop = card.getBoundingClientRect().top;

    if (cardTop < windowHeight - 100) {
      setTimeout(() => {
        card.classList.add('visible');
      }, index * 200); // staggered delay
    }
  });
}

window.addEventListener('scroll', revealFeatures);
window.addEventListener('load', revealFeatures);

// -----------------------------
// Create Fireflies
// -----------------------------
const firefliesContainer = document.querySelector('.fireflies');

for (let i = 0; i < 25; i++) {
  const f = document.createElement('div');
  f.className = 'firefly';
  f.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
  f.style.setProperty('--y', (Math.random() * 200 - 100) + 'px');
  f.style.top = Math.random() * 100 + '%';
  f.style.left = Math.random() * 100 + '%';
  f.style.animationDuration = (2 + Math.random() * 3) + 's';
  f.style.animationDelay = Math.random() + 's';
  firefliesContainer.appendChild(f);
}

// -----------------------------
// Sequential Loader Animation
// -----------------------------
window.addEventListener('load', () => {
  const bulb = document.getElementById('bulb');
  const fireflies = document.querySelector('.fireflies');
  const glow = document.getElementById('bulb-glow');
  const name = document.getElementById('app-name');
  const loader = document.getElementById('loader');

  // 1️⃣ Bulb appears
  bulb.style.transition = 'opacity 0.8s, transform 0.8s';
  bulb.style.transform = 'scale(1)';
  bulb.style.opacity = '1';

  // 2️⃣ Fireflies after bulb
  setTimeout(() => {
    fireflies.style.transition = 'opacity 1s';
    fireflies.style.opacity = '1';
  }, 800);

  // 3️⃣ Glow after fireflies
  setTimeout(() => {
    glow.style.transition = 'opacity 1s, transform 1s';
    glow.style.opacity = '1';
    glow.style.transform = 'translate(-50%,-50%) scale(1.5)';
  }, 1800);

  // 4️⃣ App name after glow
  setTimeout(() => {
    name.style.transition = 'opacity 1s, transform 1s';
    name.style.opacity = '1';
    name.style.transform = 'translateY(0)';
  }, 2800);

  // 5️⃣ Fade out all
  setTimeout(() => {
    loader.classList.add('hide');
  }, 4200);
});

// -----------------------------
// Back to Top Button
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  const backToTopBtn = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.style.display = 'flex';
      backToTopBtn.style.opacity = '1';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
});
