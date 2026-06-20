// === State ===
let extensions = [];
let currentFilter = "all";

// === DOM References ===
const listEl = document.getElementById("extensionList");
const filterBtns = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// --- Theme ---
function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.src = theme === "dark" ? "./assets/images/icon-sun.svg" : "./assets/images/icon-moon.svg";
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// --- Data ---
async function loadExtensions() {
  const res = await fetch("./data.json");
  extensions = await res.json();
  render();
}

// --- Render ---
function render() {
  const filtered = extensions.filter((ext) => {
    if (currentFilter === "active") return ext.isActive;
    if (currentFilter === "inactive") return !ext.isActive;
    return true;
  });

  listEl.innerHTML = filtered
    .map(
      (ext) => `
    <li class="extension-card">
      <div class="extension-card__top">
        <img class="extension-card__logo" src="${ext.logo}" alt="" width="45" height="45">
        <div>
          <h2 class="extension-card__name">${ext.name}</h2>
          <p class="extension-card__desc">${ext.description}</p>
        </div>
      </div>
      <div class="extension-card__bottom">
        <button type="button" class="remove-btn" data-name="${ext.name}">Remove</button>
        <button type="button" class="toggle-switch ${ext.isActive ? "is-active" : ""}" data-name="${ext.name}" role="switch" aria-checked="${ext.isActive}" aria-label="${ext.name} 활성화 토글"></button>
      </div>
    </li>
  `
    )
    .join("");
}

// --- Events: delegate clicks on list ---
listEl.addEventListener("click", (e) => {
  const removeBtn = e.target.closest(".remove-btn");
  const toggleBtn = e.target.closest(".toggle-switch");

  if (removeBtn) {
    extensions = extensions.filter((ext) => ext.name !== removeBtn.dataset.name);
    render();
  }

  if (toggleBtn) {
    const ext = extensions.find((ext) => ext.name === toggleBtn.dataset.name);
    ext.isActive = !ext.isActive;
    render();
  }
});

// --- Events: filter buttons ---
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });
});

// === Init ===
initTheme();
loadExtensions();
