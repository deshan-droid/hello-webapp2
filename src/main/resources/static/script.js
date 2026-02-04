/* =========================
   PREMIUM PORTFOLIO — JS
   ========================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ===== Elements ===== */
const header = $("#header");
const navToggle = $("#navToggle");
const navPanel = $("#navPanel");
const navLinks = $$(".nav__link");
const themeToggle = $("#themeToggle");
const toTop = $("#toTop");
const toast = $("#toast");
const yearEl = $("#year");

const typewriterEl = $("#typewriter");
const terminalEl = $("#terminalText");
const modal = $("#modal");
const modalOverlay = $("#modalOverlay");
const modalClose = $("#modalClose");
const modalOk = $("#modalOk");
const modalTitle = $("#modalTitle");
const modalStack = $("#modalStack");
const modalBody = $("#modalBody");
const modalShots = $("#modalShots");

const contactForm = $("#contactForm");
const errName = $("#errName");
const errEmail = $("#errEmail");
const errMsg = $("#errMsg");

const cvBtn = $("#cvBtn");

/* ===== Helpers ===== */
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (themeToggle) {
    themeToggle.innerHTML = theme === "dark"
      ? '<i class="fa-solid fa-moon"></i>'
      : '<i class="fa-solid fa-sun"></i>';
  }
}

function getTheme() {
  return localStorage.getItem("theme") || "dark";
}

/* ===== Ripple micro-interaction ===== */
function attachRipples() {
  $$(".ripple").forEach(el => {
    el.addEventListener("click", (e) => {
      const rect = el.getBoundingClientRect();
      const rx = (e.clientX - rect.left) + "px";
      const ry = (e.clientY - rect.top) + "px";
      el.style.setProperty("--rx", rx);
      el.style.setProperty("--ry", ry);
      el.classList.remove("is-rippling");
      // Force reflow
      void el.offsetWidth;
      el.classList.add("is-rippling");
    });
  });
}

/* ===== Sticky header background on scroll ===== */
function onScrollHeader() {
  if (!header) return;
  const solid = window.scrollY > 12;
  header.classList.toggle("is-solid", solid);
}

/* ===== Scroll-to-top button ===== */
function onScrollTopBtn() {
  if (!toTop) return;
  toTop.classList.toggle("show", window.scrollY > 700);
}

/* ===== Active nav highlight based on scroll position ===== */
function setupActiveNav() {
  const sections = navLinks
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = "#" + entry.target.id;
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === id));
    });
  }, { root: null, threshold: 0.55 });

  sections.forEach(sec => obs.observe(sec));
}

/* ===== Mobile nav ===== */
function setupMobileNav() {
  if (!navToggle || !navPanel) return;

  navToggle.addEventListener("click", () => {
    const open = navPanel.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach(a => {
    a.addEventListener("click", () => {
      navPanel.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    if (!navPanel.classList.contains("open")) return;
    if (navPanel.contains(e.target) || navToggle.contains(e.target)) return;
    navPanel.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
}

/* ===== Typewriter ===== */
function setupTypewriter() {
  if (!typewriterEl) return;

  const words = ["CI/CD", "Blue/Green", "Automation", "Cloud"];
  let w = 0, i = 0, deleting = false;

  function tick() {
    const word = words[w];
    if (!deleting) {
      i++;
      typewriterEl.textContent = word.slice(0, i);
      if (i === word.length) {
        deleting = true;
        setTimeout(tick, 1200);
        return;
      }
    } else {
      i--;
      typewriterEl.textContent = word.slice(0, i);
      if (i === 0) {
        deleting = false;
        w = (w + 1) % words.length;
      }
    }
    setTimeout(tick, deleting ? 40 : 55);
  }
  tick();
}

/* ===== Terminal "typing" ===== */
function setupTerminal() {
  if (!terminalEl) return;

  const lines = [
    "$ git push origin main",
    "✔ Jenkins pipeline started...",
    "✔ Build: mvn clean package",
    "✔ Deploy: SSH + SCP to Ubuntu",
    "✔ Start new version on inactive port",
    "✔ Health check: /actuator/health",
    "✔ Switch Nginx upstream symlink",
    "✔ Reload Nginx (passwordless sudo)",
    "✔ Done — zero downtime ✅"
  ];

  let idx = 0;
  terminalEl.textContent = "";

  function addLine() {
    if (idx >= lines.length) return;
    terminalEl.textContent += (idx === 0 ? "" : "\n") + lines[idx];
    idx++;
    setTimeout(addLine, 280);
  }
  addLine();
}

/* ===== Reveal animations ===== */
function setupReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  items.forEach(el => obs.observe(el));
}

/* ===== Modal ===== */
function openModalFrom(button) {
  const title = button.dataset.modalTitle || "Project Details";
  const stack = button.dataset.modalStack || "";
  const body = (button.dataset.modalBody || "").trim();
  const shots = (button.dataset.modalShots || "").split("|").map(s => s.trim()).filter(Boolean);

  modalTitle.textContent = title;
  modalStack.textContent = stack;

  // Render body as a simple list if it starts with dash lines
  modalBody.innerHTML = "";
  const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.some(l => l.startsWith("-"))) {
    const ul = document.createElement("ul");
    ul.style.margin = "0";
    ul.style.paddingLeft = "18px";
    lines.forEach(l => {
      const li = document.createElement("li");
      li.textContent = l.replace(/^-+\s*/, "");
      ul.appendChild(li);
    });
    modalBody.appendChild(ul);
  } else {
    const p = document.createElement("p");
    p.textContent = body;
    modalBody.appendChild(p);
  }

  modalShots.innerHTML = "";
  shots.forEach(s => {
    const div = document.createElement("div");
    div.className = "shot";
    div.textContent = s;
    modalShots.appendChild(div);
  });

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Focus close button for accessibility
  modalClose?.focus();
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setupModal() {
  if (!modal) return;

  $$("[data-modal-title]").forEach(btn => {
    btn.addEventListener("click", () => openModalFrom(btn));
  });

  modalClose?.addEventListener("click", closeModal);
  modalOk?.addEventListener("click", closeModal);
  modalOverlay?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
}

/* ===== Contact validation ===== */
function setupContactForm() {
  if (!contactForm) return;

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = $("#name")?.value.trim() || "";
    const email = $("#email")?.value.trim() || "";
    const msg = $("#message")?.value.trim() || "";

    // reset errors
    errName.textContent = "";
    errEmail.textContent = "";
    errMsg.textContent = "";

    let ok = true;
    if (name.length < 2) { errName.textContent = "Please enter your name."; ok = false; }
    if (!isEmail(email)) { errEmail.textContent = "Please enter a valid email."; ok = false; }
    if (msg.length < 10) { errMsg.textContent = "Message should be at least 10 characters."; ok = false; }

    if (!ok) {
      showToast("Fix the highlighted fields ✍️");
      return;
    }

    contactForm.reset();
    showToast("Message sent (demo). We can wire real email next ✅");
  });
}

/* ===== Theme toggle ===== */
function setupTheme() {
  const initial = getTheme();
  setTheme(initial);

  themeToggle?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    showToast(`Theme: ${next}`);
  });
}

/* ===== CV button ===== */
function setupCv() {
  if (!cvBtn) return;
  cvBtn.addEventListener("click", (e) => {
    const href = cvBtn.getAttribute("href");
    if (!href || href === "#") {
      e.preventDefault();
      showToast("Add your CV link/file first 🧾 (edit the href in index.html)");
    }
  });
}

/* ===== Init ===== */
function init() {
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  attachRipples();
  setupTheme();
  setupMobileNav();
  setupActiveNav();
  setupTypewriter();
  setupTerminal();
  setupReveal();
  setupModal();
  setupContactForm();
  setupCv();

  onScrollHeader();
  onScrollTopBtn();
  window.addEventListener("scroll", () => {
    onScrollHeader();
    onScrollTopBtn();
  }, { passive: true });

  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

document.addEventListener("DOMContentLoaded", init);

/* ===============================
   Profile Card Enhancement
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const profile = document.querySelector(".profile");
  if (!profile) return;

  // Initial state
  profile.style.opacity = "0";
  profile.style.transform = "translateY(10px)";

  // Reveal animation
  requestAnimationFrame(() => {
    profile.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    profile.style.opacity = "1";
    profile.style.transform = "translateY(0)";
  });

  // Subtle hover interaction
  profile.addEventListener("mousemove", (e) => {
    const rect = profile.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rx = ((y / rect.height) - 0.5) * 4;
    const ry = ((x / rect.width) - 0.5) * -4;

    profile.style.transform = `translateY(0) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  profile.addEventListener("mouseleave", () => {
    profile.style.transform = "translateY(0)";
  });
});
