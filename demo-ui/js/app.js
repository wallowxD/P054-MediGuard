/* Demo UI — logic dùng chung giữa 3 trang.
   Toàn bộ trạng thái được lưu tạm trong localStorage, chỉ phục vụ demo. */

const STORAGE_KEY = "medsafe_demo_state_v1";
const SESSION_KEY = "medsafe_demo_session_v1";
const REQUESTS_KEY = "medsafe_demo_requests_v1";
const PROFILE_KEY = "medsafe_demo_profile_v1";

const ICONS = {
  pill:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5 19.5 4.5a4.5 4.5 0 1 0-6.36-6.36" style="display:none"/><rect x="3" y="9.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><line x1="9.5" y1="9.5" x2="14.5" y2="14.5"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/><line x1="10" y1="11" x2="10" y2="16.5"/><line x1="14" y1="11" x2="14" y2="16.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
  plus:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  upload:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m7 8 5-5 5 5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/></svg>',
  file:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  keyboard:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="9.5" y1="10" x2="9.5" y2="10"/><line x1="13" y1="10" x2="13" y2="10"/><line x1="16.5" y1="10" x2="16.5" y2="10"/><line x1="7" y1="14.5" x2="17" y2="14.5"/></svg>',
  arrowRight:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><path d="m14 6 6 6-6 6"/></svg>',
  arrowLeft:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="12" x2="4" y2="12"/><path d="m10 6-6 6 6 6"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.2" y2="16.2"/></svg>',
  scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M20 8V6a2 2 0 0 0-2-2h-2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M20 16v2a2 2 0 0 0-2 2h-2"/><line x1="4" y1="12" x2="20" y2="12"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.7" r="0.9" fill="currentColor" stroke="none"/></svg>',
  alert:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 3.9 2.4 18a1.8 1.8 0 0 0 1.55 2.7h16.1A1.8 1.8 0 0 0 21.6 18L13.4 3.9a1.8 1.8 0 0 0-2.8 0Z"/><line x1="12" y1="9.5" x2="12" y2="13.8"/><circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
  droplet:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2s6.5 7 6.5 11.3a6.5 6.5 0 1 1-13 0C5.5 10.2 12 3.2 12 3.2Z"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.5 2"/></svg>',
  shieldCheck:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.3 4.5 6v6c0 4.6 3.2 7.9 7.5 9 4.3-1.1 7.5-4.4 7.5-9V6L12 3.3Z"/><path d="m8.8 12.2 2.2 2.2 4.2-4.4"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.4 5a3.6 3.6 0 0 1 5.1 5.1l-1.5 1.4"/><path d="M13 17.5 11.6 19a3.6 3.6 0 0 1-5.1-5.1l1.5-1.4"/></svg>',
  clipboard:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4.5" width="12" height="17" rx="2"/><path d="M9 4.5V3.8A1.8 1.8 0 0 1 10.8 2h2.4A1.8 1.8 0 0 1 15 3.8v.7"/><line x1="9" y1="10.5" x2="15" y2="10.5"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="17.5" x2="13" y2="17.5"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 11 8-6.5 8 6.5"/><path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5"/><path d="M10 20v-6h4v6"/></svg>',
  logout:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M4 12h11.5"/><path d="m11.5 7.5 4.5 4.5-4.5 4.5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>',
  history:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3.2 1.8"/><path d="M4 12a8 8 0 0 1 3-6.2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6.5 8 6 8-6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5c-1.8-1.3-4-2-6.5-2v12c2.5 0 4.7.7 6.5 2 1.8-1.3 4-2 6.5-2v-12c-2.5 0-4.7.7-6.5 2Z"/><line x1="12" y1="6.5" x2="12" y2="18.5"/></svg>',
  pulse:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h3.5l1.8-5 3 10 2-8 1.5 3H21"/></svg>',
  chevronDown:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  camera:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h3l1.4-2.2h7.2L17 8.5h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><line x1="14.5" y1="6.5" x2="17.5" y2="9.5"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.3"/><circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
  scanLine:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M20 8V6a2 2 0 0 0-2-2h-2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><line x1="4" y1="12" x2="20" y2="12"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/></svg>',
  scale:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16"/><path d="M7 20h10"/><path d="M4.5 9h15"/><path d="M4.5 9 2 15h5l-2.5-6Z"/><path d="M19.5 9 17 15h5l-2.5-6Z"/></svg>',
};

/** Gắn hành vi mở/đóng sidebar trên màn hình hẹp. */
function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggle");
  const scrim = document.getElementById("sidebarScrim");
  if (!sidebar || !toggle || !scrim) return;

  function open() {
    sidebar.classList.add("is-open");
    scrim.classList.add("is-visible");
  }
  function close() {
    sidebar.classList.remove("is-open");
    scrim.classList.remove("is-visible");
  }
  toggle.addEventListener("click", open);
  scrim.addEventListener("click", close);
}

/** Render danh sách lịch sử tra cứu vào sidebar. Click một mục sẽ mở lại kết quả tương ứng. */
function renderHistoryList(listEl) {
  if (!listEl) return;
  if (!HISTORY_MOCK.length) {
    listEl.innerHTML = '<li class="history-empty">Chưa có lịch sử tra cứu.</li>';
    return;
  }
  listEl.innerHTML = "";
  HISTORY_MOCK.forEach((entry) => {
    const summary = computeInteractionSummary(entry.drugs);
    const hasAlert = summary.total > 0;
    const li = el(`
      <li>
        <button type="button" class="history-item" data-id="${entry.id}">
          <span class="history-date">${escapeHtml(entry.date)}</span>
          <span class="history-summary${hasAlert ? " has-alert" : ""}">
            <span class="dot"></span>${entry.drugs.length} thuốc${hasAlert ? ` · ${summary.total} tương tác` : " · không tương tác"}
          </span>
        </button>
      </li>
    `);
    li.querySelector(".history-item").addEventListener("click", () => {
      writeState({ finalDrugs: entry.drugs, sentToDoctorDrug: null });
      window.location.href = "interactions-drug.html";
    });
    listEl.appendChild(li);
  });
}

function readState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function writeState(patch) {
  const next = { ...readState(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ============================================================
   Phiên đăng nhập demo (vai trò bệnh nhân / bác sĩ - dược sĩ)
   ============================================================ */

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Viết tắt tên để hiển thị trong avatar tròn, ví dụ "BS. Lê Minh Châu" -> "LC". */
function initialsOf(name) {
  const words = name.replace(/^(BS\.|DS\.)\s*/i, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}

/** Đổ tên và vai trò của phiên hiện tại vào khối user ở chân sidebar, và gắn nút đăng xuất. */
function applySessionToSidebar() {
  const footer = document.querySelector(".sidebar-footer");
  if (!footer) return;

  const logout = footer.querySelector(".sidebar-logout");
  if (logout) logout.addEventListener("click", clearSession);

  const session = readSession();
  if (!session) return;
  const avatar = footer.querySelector(".user-avatar");
  const name = footer.querySelector(".user-name");
  const role = footer.querySelector(".user-role");
  if (avatar) avatar.textContent = initialsOf(session.name);
  if (name) name.textContent = session.name;
  if (role) role.textContent = session.title;
}

/** Tên bệnh nhân dùng khi gửi yêu cầu cho bác sĩ. */
function currentPatientName() {
  const session = readSession();
  return session && session.role === "patient" ? session.name : "Nguyễn An";
}

/* ============================================================
   Hàng đợi yêu cầu dùng chung giữa bệnh nhân và bác sĩ
   ============================================================ */

/** Đọc hàng đợi, tự nạp dữ liệu khởi tạo trong lần mở đầu tiên. */
function readRequests() {
  const raw = localStorage.getItem(REQUESTS_KEY);
  if (raw === null) {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(SEED_REQUESTS));
    return JSON.parse(JSON.stringify(SEED_REQUESTS));
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeRequests(list) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
  return list;
}

/** Đưa hàng đợi về đúng dữ liệu khởi tạo — dùng cho nút "Nạp lại dữ liệu demo". */
function resetRequests() {
  return writeRequests(JSON.parse(JSON.stringify(SEED_REQUESTS)));
}

function nextRequestId() {
  const now = new Date();
  const stamp = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("");
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `YC-${stamp}-${seq}`;
}

function addRequest(request) {
  const list = readRequests();
  const full = { id: nextRequestId(), sentAt: new Date().toISOString(), origin: "patient", review: null, ...request };
  writeRequests([full, ...list]);
  return full;
}

function findRequest(id) {
  return readRequests().find((item) => item.id === id) || null;
}

function updateRequest(id, patch) {
  const list = readRequests();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...patch };
  writeRequests(list);
  return list[index];
}

function conclusionLabel(value) {
  const found = REVIEW_CONCLUSIONS.find((item) => item.value === value);
  return found ? found.label : value;
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Gắn ô nhập có gợi ý (thuốc hoặc bệnh nền) + nút "Thêm" vào một danh sách dạng string[].
 * onChange(list) được gọi mỗi khi danh sách thay đổi. `catalog` mặc định là DRUG_CATALOG,
 * truyền DISEASE_CATALOG để dùng cho ô chọn bệnh nền.
 */
function initDrugAdder({ inputEl, addBtnEl, suggestBoxEl, getList, onChange, catalog = DRUG_CATALOG, noMatchLabel = "thuốc" }) {
  let activeIndex = -1;

  function renderSuggestions(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      suggestBoxEl.classList.add("hidden");
      suggestBoxEl.innerHTML = "";
      return;
    }
    const matches = catalog.filter((d) => d.toLowerCase().includes(q)).slice(0, 8);
    activeIndex = -1;
    if (matches.length === 0) {
      suggestBoxEl.innerHTML = `<div class="no-match">Không tìm thấy ${escapeHtml(noMatchLabel)} phù hợp, có thể nhập tự do rồi bấm Thêm.</div>`;
      suggestBoxEl.classList.remove("hidden");
      return;
    }
    suggestBoxEl.innerHTML = matches
      .map((name, i) => `<button type="button" data-index="${i}">${name}</button>`)
      .join("");
    suggestBoxEl.classList.remove("hidden");
    suggestBoxEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        inputEl.value = btn.textContent;
        suggestBoxEl.classList.add("hidden");
        inputEl.focus();
      });
    });
  }

  function addCurrentValue() {
    const value = inputEl.value.trim();
    if (!value) return;
    const list = getList();
    const exists = list.some((d) => d.toLowerCase() === value.toLowerCase());
    if (!exists) {
      onChange([...list, value]);
    }
    inputEl.value = "";
    suggestBoxEl.classList.add("hidden");
    inputEl.focus();
  }

  inputEl.addEventListener("input", () => renderSuggestions(inputEl.value));
  inputEl.addEventListener("focus", () => {
    if (inputEl.value.trim()) renderSuggestions(inputEl.value);
  });
  inputEl.addEventListener("keydown", (e) => {
    const items = suggestBoxEl.querySelectorAll("button");
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle("is-active", i === activeIndex));
      items[activeIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      items.forEach((it, i) => it.classList.toggle("is-active", i === activeIndex));
      items[activeIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        inputEl.value = items[activeIndex].textContent;
        suggestBoxEl.classList.add("hidden");
      }
      addCurrentValue();
    } else if (e.key === "Escape") {
      suggestBoxEl.classList.add("hidden");
    }
  });
  addBtnEl.addEventListener("click", addCurrentValue);

  document.addEventListener("click", (e) => {
    if (!suggestBoxEl.contains(e.target) && e.target !== inputEl) {
      suggestBoxEl.classList.add("hidden");
    }
  });
}

function renderManualList(listEl, items, onRemove, icon = ICONS.pill) {
  listEl.innerHTML = "";
  items.forEach((name, index) => {
    const row = el(`
      <li class="pill-item">
        <span class="pill-icon">${icon}</span>
        <span class="pill-name">${escapeHtml(name)}</span>
        <button type="button" class="pill-remove" aria-label="Xoá ${escapeHtml(name)}">${ICONS.x}</button>
      </li>
    `);
    row.querySelector(".pill-remove").addEventListener("click", () => onRemove(index));
    listEl.appendChild(row);
  });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function reviewBadgeHTML(status) {
  if (status === "confirmed") {
    return `<span class="review-badge is-confirmed">${ICONS.shieldCheck}Đã xác nhận bởi dược sĩ</span>`;
  }
  return `<span class="review-badge is-pending">${ICONS.clock}Đang chờ xác nhận chuyên môn</span>`;
}

/** Link "xem thông tin thuốc" cho những nhãn thực sự là thuốc trong danh mục. */
function drugInfoLinks(labels) {
  const links = labels
    .map((label) => baseDrugName(label))
    .filter((name, index, all) => DRUG_DETAILS[name] && all.indexOf(name) === index)
    .map(
      (name) =>
        `<a class="drug-info-link" href="drug-detail.html?d=${encodeURIComponent(slugifyDrugName(name))}">${ICONS.book}Thông tin ${escapeHtml(name)}</a>`
    );
  return links.length ? `<div class="interaction-links">${links.join("")}</div>` : "";
}

/** Card tương tác có trích dẫn nguồn — dùng cho thuốc-thuốc và thuốc-thực phẩm. */
function renderSourcedInteractionCard(labelA, labelB, it) {
  return `
    <article class="interaction-card sev-${it.severity}">
      <div class="interaction-head">
        <div class="interaction-pair">${escapeHtml(labelA)} <span class="sep-x">×</span> ${escapeHtml(labelB)}</div>
        <span class="sev-badge sev-${it.severity}">${escapeHtml(it.severityLabel)}</span>
      </div>
      <blockquote class="citation">${escapeHtml(it.citation)}</blockquote>
      <div class="interaction-foot">
        <span class="source-link">${ICONS.link}${escapeHtml(it.source)}</span>
        ${reviewBadgeHTML(it.status)}
      </div>
      ${drugInfoLinks([labelA, labelB])}
    </article>`;
}


/* ============================================================
   Hồ sơ người dùng — tuổi, cân nặng, giới tính, tình trạng
   ============================================================ */

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || { conditions: [] };
  } catch (e) {
    return { conditions: [] };
  }
}

function writeProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

/** Tóm tắt hồ sơ thành một dòng, ví dụ "62 tuổi · 58 kg · Nữ · Suy thận". */
function profileSummary(profile) {
  const parts = [];
  if (profile.age) parts.push(`${profile.age} tuổi`);
  if (profile.weight) parts.push(`${profile.weight} kg`);
  if (profile.height) parts.push(`${profile.height} cm`);
  const gender = GENDER_OPTIONS.find((item) => item.value === profile.gender);
  if (gender && profile.gender !== "khac") parts.push(gender.label);
  (profile.conditions || []).forEach((value) => {
    const found = CONDITION_OPTIONS.find((item) => item.value === value);
    if (found) parts.push(found.label);
  });
  return parts.join(" · ");
}

/**
 * Card "Thông tin của bạn". Dùng chung cho các màn tra cứu và trang hồ sơ: hiển thị tóm
 * tắt, bấm "Sửa" để mở form ngay tại chỗ. Tuổi và cân nặng dùng cho bước đối chiếu liều
 * (một số thuốc ghi liều theo cân nặng hoặc chỉ áp dụng cho người lớn); các thông tin còn
 * lại chỉ được hiển thị lại và gửi kèm cho bác sĩ, không dùng để tự suy ra cảnh báo.
 */
function initPatientProfile({ mountEl, onChange, startOpen = false }) {
  if (!mountEl) return { get: readProfile };

  let profile = readProfile();
  let open = startOpen || !profile.age;

  function render() {
    const summary = profileSummary(profile);
    mountEl.innerHTML = `
      <section class="card profile-card">
        <div class="profile-head">
          <div>
            <h2 class="card-title">
              ${ICONS.user}
              Thông tin của bạn
            </h2>
            <p class="card-desc">Tuổi và cân nặng được dùng để đối chiếu liều dùng theo tờ hướng dẫn sử dụng, và gửi kèm khi bạn nhờ bác sĩ xem lại.</p>
          </div>
          <button type="button" class="btn btn-ghost" data-role="toggle">${open ? "Thu gọn" : "Sửa"}</button>
        </div>

        <p class="profile-summary${summary ? "" : " is-empty"}">
          ${summary ? escapeHtml(summary) : "Chưa nhập thông tin. Thiếu tuổi hoặc cân nặng, một số thuốc sẽ không đối chiếu được liều."}
        </p>

        <div class="profile-form${open ? "" : " hidden"}">
          <div class="profile-grid">
            <div class="field-group">
              <label for="profileAge">Tuổi</label>
              <input class="text-input" type="number" id="profileAge" min="0" max="120" inputmode="numeric" placeholder="Ví dụ: 62" value="${profile.age || ""}" />
            </div>
            <div class="field-group">
              <label for="profileWeight">Cân nặng (kg)</label>
              <input class="text-input" type="number" id="profileWeight" min="0" max="300" step="0.1" inputmode="decimal" placeholder="Ví dụ: 58" value="${profile.weight || ""}" />
            </div>
            <div class="field-group">
              <label for="profileHeight">Chiều cao (cm)</label>
              <input class="text-input" type="number" id="profileHeight" min="0" max="250" inputmode="numeric" placeholder="Ví dụ: 165" value="${profile.height || ""}" />
            </div>
            <div class="field-group">
              <label for="profileGender">Giới tính</label>
              <select class="text-input" id="profileGender">
                <option value="">Không nêu</option>
                ${GENDER_OPTIONS.map(
                  (item) => `<option value="${item.value}"${profile.gender === item.value ? " selected" : ""}>${item.label}</option>`
                ).join("")}
              </select>
            </div>
          </div>

          <div class="field-group">
            <span class="field-label">Tình trạng đặc biệt</span>
            <div class="condition-list">
              ${CONDITION_OPTIONS.map(
                (item) => `
                <label class="condition-chip${(profile.conditions || []).includes(item.value) ? " is-active" : ""}">
                  <input type="checkbox" value="${item.value}"${(profile.conditions || []).includes(item.value) ? " checked" : ""} />
                  ${item.label}
                </label>`
              ).join("")}
            </div>
          </div>

          <p class="profile-privacy">${ICONS.lock}Bản demo lưu thông tin này ngay trên trình duyệt của bạn, không gửi đi đâu.</p>
        </div>
      </section>`;

    mountEl.querySelector('[data-role="toggle"]').addEventListener("click", () => {
      open = !open;
      render();
    });

    const fields = {
      age: mountEl.querySelector("#profileAge"),
      weight: mountEl.querySelector("#profileWeight"),
      height: mountEl.querySelector("#profileHeight"),
      gender: mountEl.querySelector("#profileGender"),
    };

    function commit() {
      profile = {
        age: fields.age.value.trim(),
        weight: fields.weight.value.trim(),
        height: fields.height.value.trim(),
        gender: fields.gender.value,
        conditions: Array.from(mountEl.querySelectorAll(".condition-chip input:checked")).map((el) => el.value),
      };
      writeProfile(profile);
      const summaryEl = mountEl.querySelector(".profile-summary");
      const text = profileSummary(profile);
      summaryEl.textContent = text || "Chưa nhập thông tin. Thiếu tuổi hoặc cân nặng, một số thuốc sẽ không đối chiếu được liều.";
      summaryEl.classList.toggle("is-empty", !text);
      if (onChange) onChange(profile);
    }

    Object.values(fields).forEach((field) => field.addEventListener("input", commit));
    fields.gender.addEventListener("change", commit);
    mountEl.querySelectorAll(".condition-chip input").forEach((box) => {
      box.addEventListener("change", () => {
        box.closest(".condition-chip").classList.toggle("is-active", box.checked);
        commit();
      });
    });
  }

  render();
  return { get: () => profile };
}

/* ============================================================
   Danh sách thuốc kèm liều dùng (viên/lần · lần/ngày)
   ============================================================ */

/**
 * Danh sách thuốc sẽ kiểm tra, mỗi dòng có thêm hai ô nhập liều. `regimens` là object
 * keyed theo tên thuốc, được cập nhật tại chỗ; `onChange` gọi lại mỗi khi có thay đổi.
 */
function renderDrugRegimenList(listEl, drugs, regimens, { onRemove, onChange }) {
  listEl.innerHTML = "";
  drugs.forEach((name, index) => {
    const regimen = regimens[name] || {};
    const hasLimit = Boolean(DOSE_LIMITS[baseDrugName(name)]);
    const row = el(`
      <li class="pill-item pill-item-regimen">
        <div class="pill-main">
          <span class="pill-icon">${ICONS.pill}</span>
          <span class="pill-name">${escapeHtml(name)}</span>
          <button type="button" class="pill-remove" aria-label="Xoá ${escapeHtml(name)}">${ICONS.x}</button>
        </div>
        <div class="regimen-row">
          <label class="regimen-field">
            <span>Viên mỗi lần</span>
            <input class="text-input" type="number" min="0" step="0.5" inputmode="decimal" data-field="perDose" placeholder="—" value="${regimen.perDose || ""}" />
          </label>
          <label class="regimen-field">
            <span>Số lần mỗi ngày</span>
            <input class="text-input" type="number" min="0" step="1" inputmode="numeric" data-field="perDay" placeholder="—" value="${regimen.perDay || ""}" />
          </label>
          <span class="regimen-hint">${hasLimit ? "Có ngưỡng liều trong tờ HDSD" : "Chưa có dữ liệu ngưỡng liều"}</span>
        </div>
      </li>
    `);

    row.querySelector(".pill-remove").addEventListener("click", () => onRemove(index));
    row.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("input", () => {
        regimens[name] = { ...(regimens[name] || {}), [input.dataset.field]: input.value };
        if (onChange) onChange();
      });
    });
    listEl.appendChild(row);
  });
}

const DOSE_STATUS_META = {
  over: { klass: "is-over", label: "Vượt ngưỡng trong tờ HDSD" },
  ok: { klass: "is-ok", label: "Trong ngưỡng ghi trong tờ HDSD" },
  "no-data": { klass: "is-nodata", label: "Chưa có dữ liệu ngưỡng liều" },
  "no-strength": { klass: "is-nodata", label: "Chưa xác định được hàm lượng" },
  "need-weight": { klass: "is-nodata", label: "Cần cân nặng để đối chiếu" },
  "age-out-of-scope": { klass: "is-nodata", label: "Ngoài nhóm tuổi của ngưỡng" },
  incomplete: { klass: "is-idle", label: "Chưa nhập liều" },
};

function doseExplain(finding) {
  const unit = finding.unit || "mg";
  switch (finding.status) {
    case "over": {
      const lines = finding.exceeded.map((item) =>
        item.kind === "moi-lan"
          ? `Liều mỗi lần bạn nhập là ${formatDoseNumber(item.value)}${unit}, cao hơn mức ${formatDoseNumber(item.max)}${unit} ghi trong tờ HDSD.`
          : `Tổng liều mỗi ngày bạn nhập là ${formatDoseNumber(item.value)}${unit}, cao hơn mức ${formatDoseNumber(item.max)}${unit} ghi trong tờ HDSD.`
      );
      if (finding.weightBased) {
        lines.push(
          `Ngưỡng theo cân nặng: ${finding.weightBased.perKgPerDay}${unit}/kg/ngày × ${finding.weightBased.weight}kg = ${formatDoseNumber(finding.weightBased.computed)}${unit}/ngày.`
        );
      }
      return lines.join(" ");
    }
    case "ok":
      return `Liều bạn nhập là ${formatDoseNumber(finding.dosePerIntake)}${unit} mỗi lần, ${formatDoseNumber(finding.dosePerDay)}${unit} mỗi ngày — nằm trong mức ghi trong tờ HDSD.`;
    case "no-data":
      return "Tờ hướng dẫn sử dụng của thuốc này chưa có ngưỡng liều được trích xuất. Hệ thống không tự đặt ra ngưỡng nên chưa thể đối chiếu.";
    case "no-strength":
      return "Tên thuốc chưa kèm hàm lượng nên chưa quy đổi được liều. Bổ sung hàm lượng, ví dụ \"Paracetamol 500mg\".";
    case "need-weight":
      return "Tờ hướng dẫn sử dụng ghi liều theo cân nặng. Nhập cân nặng ở phần Thông tin của bạn để đối chiếu.";
    case "age-out-of-scope":
      return `Ngưỡng trong tờ hướng dẫn sử dụng áp dụng cho người từ ${finding.minAge} tuổi. Với độ tuổi bạn đã nhập, chưa có dữ liệu để đối chiếu — hãy hỏi bác sĩ hoặc dược sĩ.`;
    default:
      return "Nhập số viên mỗi lần và số lần mỗi ngày để đối chiếu với tờ hướng dẫn sử dụng.";
  }
}

/** Khối "Đối chiếu liều dùng" trên màn kết quả. */
function renderDoseSection(findings) {
  const shown = findings.filter((finding) => finding.status !== "incomplete");
  const pending = findings.length - shown.length;
  if (shown.length === 0) {
    return `
      <section class="dose-section">
        <div class="dose-section-head">
          ${ICONS.scale}
          <div>
            <h3>Đối chiếu liều dùng</h3>
            <p>Nhập số viên mỗi lần và số lần mỗi ngày ở danh sách phía trên để hệ thống đối chiếu với tờ hướng dẫn sử dụng.</p>
          </div>
        </div>
      </section>`;
  }

  const cards = shown
    .map((finding) => {
      const meta = DOSE_STATUS_META[finding.status];
      const limit = finding.limit;
      return `
        <article class="dose-card ${meta.klass}">
          <div class="dose-card-head">
            <span class="dose-drug">${escapeHtml(finding.drug)}</span>
            <span class="dose-badge ${meta.klass}">${meta.label}</span>
          </div>
          <p class="dose-explain">${escapeHtml(doseExplain(finding))}</p>
          ${
            limit
              ? `<blockquote class="citation">${escapeHtml(limit.citation)}</blockquote>
                 <div class="interaction-foot">
                   <span class="source-link">${ICONS.link}${escapeHtml(limit.source)}</span>
                 </div>
                 ${limit.scopeNote ? `<p class="dose-scope-note">${escapeHtml(limit.scopeNote)}</p>` : ""}`
              : ""
          }
        </article>`;
    })
    .join("");

  return `
    <section class="dose-section">
      <div class="dose-section-head">
        ${ICONS.scale}
        <div>
          <h3>Đối chiếu liều dùng</h3>
          <p>So sánh liều bạn nhập với con số ghi trong tờ hướng dẫn sử dụng. Đây là đối chiếu tham khảo, không phải chỉ định liều — không tự thay đổi liều mà chưa hỏi bác sĩ hoặc dược sĩ.</p>
        </div>
      </div>
      <div class="dose-list">${cards}</div>
      ${pending > 0 ? `<p class="dose-pending">${pending} thuốc chưa nhập liều nên chưa đối chiếu.</p>` : ""}
    </section>`;
}

/* ============================================================
   Tải/chụp ảnh đơn thuốc → nhận diện → xác nhận danh sách thuốc
   ============================================================ */

const CONFIDENCE_LEVELS = [
  { min: 0.9, key: "high", label: "Độ tin cậy cao" },
  { min: 0.75, key: "medium", label: "Độ tin cậy trung bình" },
  { min: 0, key: "low", label: "Độ tin cậy thấp" },
];

function confidenceLevel(value) {
  return CONFIDENCE_LEVELS.find((level) => value >= level.min);
}

/**
 * Dựng toàn bộ bước "Tải hoặc chụp ảnh đơn thuốc → Hệ thống nhận diện thuốc → Xác nhận
 * danh sách thuốc" bên trong `mountEl`. Việc nhận diện chỉ là mô phỏng (dữ liệu lấy từ
 * OCR_MOCK_RESULTS), nhưng luồng bấm đúng như sơ đồ: người dùng phải sửa/xác nhận danh
 * sách trước khi thuốc được đưa vào ô tra cứu. `onConfirm(names)` nhận danh sách tên thuốc
 * đã chuẩn hoá sau khi người dùng bấm "Xác nhận danh sách thuốc".
 */
function initPrescriptionUpload({ mountEl, onConfirm }) {
  if (!mountEl) return;

  let rows = [];
  let fileNames = [];

  mountEl.innerHTML = `
    <div class="upload-stage" data-stage="idle">
      <label class="dropzone" data-role="dropzone">
        ${ICONS.upload}
        <div class="dropzone-title">Kéo thả ảnh vào đây hoặc bấm để chọn</div>
        <div class="dropzone-hint">Hỗ trợ JPG, PNG, PDF — có thể chọn nhiều đơn thuốc cùng lúc, tối đa 10MB mỗi tệp</div>
        <input type="file" accept="image/*,.pdf" multiple data-role="fileInput" />
      </label>
      <div class="upload-alt">
        <button type="button" class="btn btn-secondary btn-block" data-role="cameraBtn">
          ${ICONS.camera}
          Chụp ảnh đơn thuốc
        </button>
        <input type="file" accept="image/*" capture="environment" data-role="cameraInput" hidden />
      </div>
    </div>

    <div class="upload-stage hidden" data-stage="scanning">
      <div class="ocr-scanning">
        <span class="ocr-spinner" aria-hidden="true"></span>
        <div>
          <strong>Hệ thống đang nhận diện thuốc…</strong>
          <p data-role="scanningFiles"></p>
        </div>
      </div>
    </div>

    <div class="upload-stage hidden" data-stage="review">
      <div class="ocr-head">
        <span class="ocr-head-title">${ICONS.scanLine}Kết quả nhận diện</span>
        <span class="ocr-file-count" data-role="reviewFiles"></span>
      </div>
      <p class="ocr-help">Đối chiếu với đơn thuốc gốc, sửa lại tên nếu hệ thống đọc sai rồi bấm xác nhận.</p>
      <div class="ocr-warning hidden" data-role="lowWarning">
        ${ICONS.alert}
        <span data-role="lowWarningText"></span>
      </div>
      <ul class="ocr-list" data-role="ocrList"></ul>
      <div class="actions-bar">
        <button type="button" class="btn btn-ghost" data-role="cancelBtn">Chọn tệp khác</button>
        <button type="button" class="btn btn-primary" data-role="confirmBtn">
          Xác nhận danh sách thuốc
          ${ICONS.arrowRight}
        </button>
      </div>
    </div>

    <div class="upload-stage hidden" data-stage="confirmed">
      <div class="ocr-confirmed">
        ${ICONS.shieldCheck}
        <div>
          <strong data-role="confirmedText"></strong>
          <p>Thuốc đã được thêm vào danh sách kiểm tra bên dưới.</p>
        </div>
      </div>
      <button type="button" class="btn btn-secondary btn-block" data-role="againBtn">
        ${ICONS.upload}
        Tải đơn thuốc khác
      </button>
    </div>
  `;

  const pick = (role) => mountEl.querySelector(`[data-role="${role}"]`);
  const stages = Array.from(mountEl.querySelectorAll(".upload-stage"));
  const dropzone = pick("dropzone");
  const fileInput = pick("fileInput");
  const cameraInput = pick("cameraInput");
  const ocrList = pick("ocrList");

  function setStage(name) {
    stages.forEach((stage) => stage.classList.toggle("hidden", stage.dataset.stage !== name));
  }

  function renderRows() {
    const lowCount = rows.filter((row) => confidenceLevel(row.confidence).key === "low").length;
    const warning = pick("lowWarning");
    warning.classList.toggle("hidden", lowCount === 0);
    if (lowCount > 0) {
      pick("lowWarningText").textContent =
        `${lowCount} dòng có độ tin cậy thấp. Vui lòng kiểm tra lại tên thuốc trước khi xác nhận.`;
    }

    ocrList.innerHTML = rows
      .map((row, index) => {
        const level = confidenceLevel(row.confidence);
        return `
          <li class="ocr-row conf-${level.key}">
            <div class="ocr-raw" title="Chuỗi đọc được từ ảnh">${ICONS.file}${escapeHtml(row.raw)}</div>
            <div class="ocr-mapped">
              <label class="visually-hidden" for="ocrName${index}">Tên thuốc sau chuẩn hoá</label>
              <input class="text-input" id="ocrName${index}" data-index="${index}" value="${escapeHtml(row.mapped)}" />
              <span class="conf-badge conf-${level.key}">${level.label} · ${Math.round(row.confidence * 100)}%</span>
            </div>
            <button type="button" class="ocr-remove" data-index="${index}" aria-label="Bỏ ${escapeHtml(row.mapped)}">${ICONS.x}</button>
          </li>`;
      })
      .join("");

    ocrList.querySelectorAll("input[data-index]").forEach((input) => {
      input.addEventListener("input", () => {
        rows[Number(input.dataset.index)].mapped = input.value;
      });
    });
    ocrList.querySelectorAll(".ocr-remove").forEach((button) => {
      button.addEventListener("click", () => {
        rows.splice(Number(button.dataset.index), 1);
        if (rows.length === 0) setStage("idle");
        else renderRows();
      });
    });

    pick("confirmBtn").disabled = rows.length === 0;
  }

  function startRecognition(files) {
    fileNames = files.map((file) => file.name);
    pick("scanningFiles").textContent =
      fileNames.length === 1 ? fileNames[0] : `${fileNames.length} tệp: ${fileNames.join(", ")}`;
    setStage("scanning");

    // Độ trễ giả lập để thấy rõ bước "Hệ thống nhận diện thuốc" trong sơ đồ luồng.
    setTimeout(() => {
      const merged = [];
      fileNames.forEach((_, fileIndex) => {
        OCR_MOCK_RESULTS[fileIndex % OCR_MOCK_RESULTS.length].forEach((row) => {
          if (!merged.some((item) => item.mapped.toLowerCase() === row.mapped.toLowerCase())) {
            merged.push({ ...row });
          }
        });
      });
      rows = merged;
      pick("reviewFiles").textContent =
        fileNames.length === 1 ? "1 đơn thuốc" : `${fileNames.length} đơn thuốc`;
      renderRows();
      setStage("review");
    }, 900);
  }

  function filesFrom(input) {
    return input.files ? Array.from(input.files) : [];
  }

  fileInput.addEventListener("change", () => {
    const files = filesFrom(fileInput);
    if (files.length) startRecognition(files);
  });
  cameraInput.addEventListener("change", () => {
    const files = filesFrom(cameraInput);
    if (files.length) startRecognition(files);
  });
  pick("cameraBtn").addEventListener("click", () => cameraInput.click());

  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-dragover");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length) startRecognition(files);
  });

  pick("cancelBtn").addEventListener("click", () => {
    fileInput.value = "";
    cameraInput.value = "";
    rows = [];
    setStage("idle");
  });

  pick("confirmBtn").addEventListener("click", () => {
    const names = rows.map((row) => row.mapped.trim()).filter(Boolean);
    pick("confirmedText").textContent =
      `Đã xác nhận ${names.length} thuốc từ ${fileNames.length} đơn thuốc.`;
    setStage("confirmed");
    onConfirm(names);
  });

  pick("againBtn").addEventListener("click", () => {
    fileInput.value = "";
    cameraInput.value = "";
    rows = [];
    setStage("idle");
  });
}

/* ============================================================
   Nhánh "chưa có dữ liệu" và gửi yêu cầu cho bác sĩ
   ============================================================ */

/** Khối thông báo các cặp thuốc hệ thống chưa có dữ liệu để kết luận. */
function renderNoDataPanel(items, { unit = "cặp thuốc", explain } = {}) {
  if (!items.length) return "";
  return `
    <section class="no-data-panel">
      <div class="no-data-head">
        ${ICONS.help}
        <div>
          <h3>Chưa có dữ liệu cho ${items.length} ${unit}</h3>
          <p>${escapeHtml(explain || "Tờ hướng dẫn sử dụng hiện có chưa đề cập tới các trường hợp này. Hệ thống không suy luận thay nguồn, nên chưa thể kết luận là có hay không có tương tác.")}</p>
        </div>
      </div>
      <ul class="no-data-list">
        ${items.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
      </ul>
    </section>`;
}

/** Khối liệt kê các cặp đã đối chiếu nguồn và xác nhận không có tương tác. */
function renderVerifiedNonePanel(items) {
  if (!items.length) return "";
  return `
    <section class="verified-none-panel">
      <div class="verified-none-head">
        ${ICONS.shieldCheck}
        <h3>${items.length} cặp đã đối chiếu nguồn, không ghi nhận tương tác</h3>
      </div>
      <ul class="no-data-list">
        ${items.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
      </ul>
    </section>`;
}

/**
 * Gắn hành vi cho khối "Gửi kết quả cho bác sĩ" (banner + modal) trên các màn tra cứu.
 * Có hai nhánh đúng theo sơ đồ luồng: gửi ĐỐI CHIẾU khi đã có kết quả tương tác, và gửi
 * KIỂM TRA khi hệ thống báo chưa có dữ liệu. Cả hai đều tạo một yêu cầu trong hàng đợi
 * dùng chung, nên màn bác sĩ nhận được ngay.
 * `getPayload()` trả về { drugs, interactions, noDataPairs, scope } của lượt tra cứu hiện tại.
 */
function initSendToDoctor({ getPayload }) {
  const sendBanner = document.getElementById("sendDoctorBanner");
  const sentBanner = document.getElementById("sendDoctorSentBanner");
  const sentText = document.getElementById("sendDoctorSentText");
  const openBtn = document.getElementById("openSendModalBtn");
  const overlay = document.getElementById("sendModalOverlay");
  const doctorSelect = document.getElementById("doctorSelect");
  const sendNote = document.getElementById("sendNote");
  const bannerTitle = document.getElementById("sendDoctorBannerTitle");
  const bannerDesc = document.getElementById("sendDoctorBannerDesc");
  const openBtnLabel = document.getElementById("sendDoctorBtnLabel");
  if (!sendBanner || !sentBanner || !openBtn || !overlay) {
    return { render() {}, reset() {} };
  }

  let sentId = null;
  doctorSelect.innerHTML = DOCTORS_MOCK.map(
    (d) => `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.role)}</option>`
  ).join("");

  function renderSent() {
    const request = findRequest(sentId);
    if (!request) return;
    if (!request.review) {
      sentBanner.classList.remove("is-reviewed");
      sentText.textContent =
        `Đã gửi cho ${request.doctorName} lúc ${formatDateTime(request.sentAt)} (mã ${request.id}). Đang chờ phản hồi chuyên môn.`;
      return;
    }
    sentBanner.classList.add("is-reviewed");
    sentText.textContent =
      `${request.doctorName} đã duyệt lúc ${formatDateTime(request.review.reviewedAt)} — kết luận: ${conclusionLabel(request.review.conclusion)}. ${request.review.note}`;
  }

  function render() {
    const { interactions, noDataPairs, doseFindings = [] } = getPayload();
    const hasInteraction = interactions.length > 0;
    const hasNoData = noDataPairs.length > 0;
    const hasDose = doseFindings.length > 0;

    if (sentId) {
      sendBanner.classList.add("hidden");
      sentBanner.classList.remove("hidden");
      renderSent();
      return;
    }
    sentBanner.classList.add("hidden");

    if (!hasInteraction && !hasNoData && !hasDose) {
      sendBanner.classList.add("hidden");
      return;
    }

    sendBanner.classList.remove("hidden");
    sendBanner.classList.toggle("is-nodata", !hasInteraction && !hasDose);
    if (hasInteraction || hasDose) {
      const facts = [];
      if (hasInteraction) facts.push(`${interactions.length} tương tác`);
      if (hasDose) facts.push(`${doseFindings.length} thuốc có liều vượt ngưỡng trong tờ HDSD`);
      if (hasNoData) facts.push(`${noDataPairs.length} trường hợp chưa có dữ liệu`);
      bannerTitle.textContent = hasInteraction
        ? "Phát hiện tương tác cần lưu ý"
        : "Liều dùng vượt ngưỡng trong tờ hướng dẫn sử dụng";
      bannerDesc.textContent = `Kết quả gồm ${facts.join(", ")}. Gửi cho bác sĩ hoặc dược sĩ để được đối chiếu và hướng dẫn xử trí.`;
      openBtnLabel.textContent = "Gửi đối chiếu";
    } else {
      bannerTitle.textContent = "Chưa có dữ liệu để kết luận";
      bannerDesc.textContent = `Gửi ${noDataPairs.length} trường hợp chưa có dữ liệu cho bác sĩ hoặc dược sĩ kiểm tra và bổ sung nguồn.`;
      openBtnLabel.textContent = "Gửi kiểm tra";
    }
  }

  function openModal() {
    overlay.classList.add("is-open");
  }
  function closeModal() {
    overlay.classList.remove("is-open");
  }

  openBtn.addEventListener("click", openModal);
  document.getElementById("sendModalClose").addEventListener("click", closeModal);
  document.getElementById("sendModalCancel").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.getElementById("sendModalConfirm").addEventListener("click", () => {
    const doctor = DOCTORS_MOCK.find((d) => d.id === doctorSelect.value);
    const payload = getPayload();
    const doseFindings = payload.doseFindings || [];
    const created = addRequest({
      patient: currentPatientName(),
      kind: payload.interactions.length > 0 || doseFindings.length > 0 ? "doi-chieu" : "kiem-tra",
      scope: payload.scope,
      doctorName: doctor.name,
      note: sendNote.value.trim() || "Bệnh nhân không để lại ghi chú.",
      drugs: payload.drugs,
      interactions: payload.interactions,
      noDataPairs: payload.noDataPairs,
      profile: payload.profile || null,
      regimens: payload.regimens || {},
      doseFindings,
    });
    sentId = created.id;
    closeModal();
    sendNote.value = "";
    render();
  });

  // Bác sĩ duyệt ở tab khác → cập nhật lại banner khi quay về tab này.
  window.addEventListener("focus", () => {
    if (sentId) renderSent();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === REQUESTS_KEY && sentId) renderSent();
  });

  return {
    render,
    reset() {
      sentId = null;
      render();
    },
  };
}
