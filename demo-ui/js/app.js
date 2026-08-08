/* Demo UI — logic dùng chung giữa 3 trang.
   Toàn bộ trạng thái được lưu tạm trong localStorage, chỉ phục vụ demo. */

const STORAGE_KEY = "medsafe_demo_state_v1";

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
    </article>`;
}


/**
 * Gắn hành vi cho khối "Gửi kết quả cho bác sĩ" (banner + modal) trên các màn tra cứu
 * tương tác. Trạng thái chỉ giữ trong bộ nhớ của phiên trang hiện tại (không lưu
 * localStorage) — mỗi lần bấm "Kiểm tra" lại coi là một lượt tra cứu mới.
 * `getInteractionCount()` trả về số tương tác hiện có để quyết định ẩn/hiện banner.
 */
function initSendToDoctor({ getInteractionCount }) {
  const sendBanner = document.getElementById("sendDoctorBanner");
  const sentBanner = document.getElementById("sendDoctorSentBanner");
  const sentText = document.getElementById("sendDoctorSentText");
  const openBtn = document.getElementById("openSendModalBtn");
  const overlay = document.getElementById("sendModalOverlay");
  const doctorSelect = document.getElementById("doctorSelect");
  const sendNote = document.getElementById("sendNote");
  if (!sendBanner || !sentBanner || !openBtn || !overlay) {
    return { render() {}, reset() {} };
  }

  let sentInfo = null;
  doctorSelect.innerHTML = DOCTORS_MOCK.map(
    (d) => `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.role)}</option>`
  ).join("");

  function formatSentAt(iso) {
    return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  }

  function render() {
    const count = getInteractionCount();
    if (count === 0) {
      sendBanner.classList.add("hidden");
      sentBanner.classList.add("hidden");
    } else if (sentInfo) {
      sendBanner.classList.add("hidden");
      sentBanner.classList.remove("hidden");
      sentText.textContent = `Đã gửi cho ${sentInfo.doctorName} (${sentInfo.doctorRole}) lúc ${formatSentAt(sentInfo.sentAt)}. Đang chờ phản hồi.`;
    } else {
      sendBanner.classList.remove("hidden");
      sentBanner.classList.add("hidden");
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
    sentInfo = {
      doctorName: doctor.name,
      doctorRole: doctor.role,
      note: sendNote.value.trim(),
      sentAt: new Date().toISOString(),
    };
    closeModal();
    sendNote.value = "";
    render();
  });

  return {
    render,
    reset() {
      sentInfo = null;
      render();
    },
  };
}
