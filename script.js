// === 애플리케이션 상태(Application State) ===
// `extensions`는 data.json을 메모리에 올린 작업용 복사본이며, 제거/토글 동작 시
// 직접 변경(mutate)됨. `currentFilter`는 render()가 보여줄 목록의 범위를 결정함.
let extensions = [];
let currentFilter = "all";

// === DOM 참조(DOM References) ===
// 최초 로드 시 한 번만 조회함. render()는 listEl의 innerHTML만 덮어쓰므로
// 이 참조들은 재렌더링 후에도 다시 조회할 필요 없이 그대로 유효함.
const listEl = document.getElementById("extensionList");
const filterBtns = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// --- 테마(Theme) ---
// localStorage에 저장된 이전 선택값이 항상 우선하며, 없을 경우에만
// OS 수준의 `prefers-color-scheme` 설정을 기본값으로 사용함.
function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
}

// 테마 변경의 단일 진입점(single source of truth): style.css가 읽는 `data-theme`
// 속성을 설정하고, 토글 아이콘을 교체하며, 다음 방문을 위해 선택값을 저장함.
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.src = theme === "dark" ? "./assets/images/icon-sun.svg" : "./assets/images/icon-moon.svg";
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// --- 데이터(Data) ---
// 시작 시 확장 프로그램 목록을 한 번 불러오고 첫 렌더링을 실행함.
async function loadExtensions() {
  const res = await fetch("./data.json");
  extensions = await res.json();
  render();
}

// --- 렌더링(Render) ---
// `extensions`와 `currentFilter`를 기준으로 목록 전체를 다시 그림. 필터 전환,
// 토글, 제거 등 상태가 바뀔 때마다 호출되며, 목록 규모가 작아 카드 단위로
// 비교(diff)하는 것보다 전체 재렌더링이 더 단순함.
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

// --- 이벤트: 목록 클릭 위임(Event Delegation) ---
// 카드마다 리스너를 두지 않고 컨테이너 하나에만 리스너를 둠. render()가 매번
// 카드의 innerHTML을 교체하기 때문에 카드별 리스너는 그때마다 떠돌게(orphan) 됨.
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

// --- 이벤트: 필터 버튼(Filter Buttons) ---
// 활성 필터를 갱신하고, 모든 필터 버튼의 `.is-active` 클래스를 동기화하여
// 클릭된 버튼만 강조 표시한 뒤 목록을 다시 렌더링함.
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });
});

// === 초기화(Init) ===
// 네트워크 요청을 기다리지 않고 올바른 테마가 즉시 보이도록, 데이터를
// 불러오기 전에 테마를 먼저 결정함.
initTheme();
loadExtensions();
