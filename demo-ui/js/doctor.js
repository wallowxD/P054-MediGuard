/* Demo giao diện bác sĩ / dược sĩ.
   Hàng đợi yêu cầu dùng chung localStorage với màn bệnh nhân (xem `js/app.js`), nên yêu
   cầu bệnh nhân vừa gửi sẽ xuất hiện ở đây và kết quả duyệt sẽ quay ngược về bệnh nhân. */

const DOCTOR_THEME_STORAGE_KEY = "medsafe_doctor_theme_v1";

const DOCTOR_ICONS = {
  pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><line x1="9.5" y1="9.5" x2="14.5" y2="14.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.5 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.3 4.5 6v6c0 4.6 3.2 7.9 7.5 9 4.3-1.1 7.5-4.4 7.5-9V6L12 3.3Z"/><path d="m8.8 12.2 2.2 2.2 4.2-4.4"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.4 5a3.6 3.6 0 0 1 5.1 5.1l-1.5 1.4"/><path d="M13 17.5 11.6 19a3.6 3.6 0 0 1-5.1-5.1l1.5-1.4"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><path d="m14 6 6 6-6 6"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><line x1="14.5" y1="6.5" x2="17.5" y2="9.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.3"/><circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/></svg>',
};

const requestListEl = document.getElementById("requestList");
const doctorDetail = document.getElementById("doctorDetail");
const searchInput = document.getElementById("requestSearch");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const navFilterButtons = Array.from(document.querySelectorAll("[data-nav-filter]"));
const toast = document.getElementById("doctorToast");

let requests = readRequests();
let activeFilter = "all";
let selectedRequestId = null;
let toastTimer = null;
// Trả lời "Kết quả phù hợp?" trong sơ đồ luồng: null = chưa chọn, "ok" = phù hợp,
// "edit" = chưa phù hợp và đang chỉnh sửa nội dung trước khi duyệt.
let gateChoice = null;
// Bản nháp nội dung cảnh báo khi bác sĩ chỉnh sửa; chỉ ghi vào hàng đợi khi bấm duyệt.
let draftInteractions = null;

function reloadRequests() {
  requests = readRequests();
}

function isReviewed(request) {
  return Boolean(request.review);
}

function formatRequestTime(iso) {
  const value = new Date(iso);
  const today = new Date();
  const sameDay = value.toDateString() === today.toDateString();
  return sameDay
    ? value.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatFullDate(iso) {
  return new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function requestMatches(request) {
  const query = searchInput.value.trim().toLocaleLowerCase("vi");
  const matchesText = !query || [request.patient, ...request.drugs].join(" ").toLocaleLowerCase("vi").includes(query);
  const reviewed = isReviewed(request);
  const matchesFilter = activeFilter === "all" || (activeFilter === "reviewed" ? reviewed : !reviewed);
  return matchesText && matchesFilter;
}

function kindLabel(request) {
  return request.kind === "kiem-tra" ? "Gửi kiểm tra" : "Gửi đối chiếu";
}

function updateSummary() {
  const reviewedCount = requests.filter(isReviewed).length;
  const pendingCount = requests.length - reviewedCount;
  document.getElementById("summaryPending").textContent = pendingCount;
  document.getElementById("summaryReviewed").textContent = reviewedCount;
  document.getElementById("pendingNavCount").textContent = pendingCount;
}

function renderRequestList() {
  const visibleRequests = requests.filter(requestMatches);
  document.getElementById("queueCountText").textContent = `${visibleRequests.length} yêu cầu phù hợp`;

  if (visibleRequests.length === 0) {
    requestListEl.innerHTML = '<div class="request-list-empty">Không có yêu cầu phù hợp với bộ lọc hiện tại.</div>';
    return;
  }

  requestListEl.innerHTML = visibleRequests.map((request) => {
    const reviewed = isReviewed(request);
    const itemCount = request.interactions.length > 0
      ? `${request.interactions.length} tương tác cần xem`
      : `${request.noDataPairs.length} trường hợp chưa có dữ liệu`;
    return `
      <button type="button" class="request-item${selectedRequestId === request.id ? " is-active" : ""}" data-request-id="${request.id}" aria-pressed="${selectedRequestId === request.id}">
        <span class="request-item-top">
          <span class="request-patient">${escapeHtml(request.patient)}</span>
          <time class="request-time" datetime="${request.sentAt}">${formatRequestTime(request.sentAt)}</time>
        </span>
        <span class="request-drugs">${escapeHtml(request.drugs.join(", "))}</span>
        <span class="request-item-bottom">
          <span class="request-kind ${request.kind === "kiem-tra" ? "is-check" : "is-compare"}">${kindLabel(request)}</span>
          <span class="request-interaction-count">${itemCount}</span>
          <span class="request-status ${reviewed ? "is-reviewed" : "is-pending"}">${reviewed ? "Đã duyệt" : "Chờ đánh giá"}</span>
        </span>
      </button>`;
  }).join("");

  requestListEl.querySelectorAll("[data-request-id]").forEach((button) => {
    button.addEventListener("click", () => selectRequest(button.dataset.requestId));
  });
}

function reviewStatusHtml(request) {
  const reviewed = isReviewed(request);
  return `
    <span class="case-status ${reviewed ? "is-reviewed" : "is-pending"}">
      ${reviewed ? DOCTOR_ICONS.check : DOCTOR_ICONS.clock}
      ${reviewed ? "Đã duyệt" : "Chờ đánh giá"}
    </span>`;
}

function severityLabelOf(value) {
  const found = SEVERITY_OPTIONS.find((item) => item.value === value);
  return found ? found.label : value;
}

/**
 * Thẻ tương tác ở màn bác sĩ. Ở chế độ chỉnh sửa, bác sĩ sửa được mức độ và nội dung
 * hiển thị cho bệnh nhân; riêng đoạn trích và nguồn là nguyên văn từ tờ HDSD nên luôn
 * ở chế độ chỉ đọc — sửa trích dẫn đồng nghĩa với việc mất khả năng truy vết nguồn.
 */
function interactionHtml(interaction, index, editable) {
  const severeClass = interaction.severity === "nghiem-trong" ? " is-severe" : "";
  const editFields = `
    <div class="doctor-edit-grid">
      <div class="doctor-edit-field">
        <label for="sev${index}">Mức độ nghiêm trọng</label>
        <select class="text-input" id="sev${index}" data-edit="severity" data-index="${index}">
          ${SEVERITY_OPTIONS.map(
            (option) => `<option value="${option.value}"${option.value === interaction.severity ? " selected" : ""}>${option.label}</option>`
          ).join("")}
        </select>
      </div>
      <div class="doctor-edit-field">
        <label for="display${index}">Nội dung hiển thị cho bệnh nhân</label>
        <textarea class="text-input" id="display${index}" rows="3" data-edit="display" data-index="${index}">${escapeHtml(interaction.display || "")}</textarea>
      </div>
    </div>`;

  return `
    <article class="doctor-interaction${severeClass}${editable ? " is-editing" : ""}">
      <div class="doctor-interaction-head">
        <div class="doctor-interaction-pair">${escapeHtml(interaction.pair)}</div>
        <span class="doctor-severity">${escapeHtml(severityLabelOf(interaction.severity))}</span>
      </div>
      <blockquote class="doctor-citation">${escapeHtml(interaction.citation)}</blockquote>
      <div class="doctor-source">${DOCTOR_ICONS.link}<span>${escapeHtml(interaction.source)}</span></div>
      <p class="doctor-citation-lock">${DOCTOR_ICONS.lock}Trích dẫn và nguồn giữ nguyên văn từ tờ hướng dẫn sử dụng, không chỉnh sửa được.</p>
      ${editable ? editFields : `<p class="doctor-display-preview"><strong>Nội dung hiển thị cho bệnh nhân:</strong> ${escapeHtml(interaction.display || "")}</p>`}
    </article>`;
}

/** Hồ sơ bệnh nhân gửi kèm: tuổi, cân nặng, tình trạng. */
function profileHtml(request) {
  if (!request.profile) return "";
  const summary = profileSummary(request.profile);
  if (!summary) return "";
  return `
    <section class="case-section">
      <h3>Thông tin bệnh nhân gửi kèm</h3>
      <p class="patient-profile">${DOCTOR_ICONS.user}${escapeHtml(summary)}</p>
    </section>`;
}

/** Liều bệnh nhân đang dùng, và các thuốc vượt ngưỡng ghi trong tờ HDSD. */
function doseHtml(request) {
  const regimens = request.regimens || {};
  const entries = request.drugs.filter((name) => regimens[name] && regimens[name].perDose && regimens[name].perDay);
  const findings = request.doseFindings || [];
  if (entries.length === 0 && findings.length === 0) return "";

  const rows = entries
    .map((name) => {
      const over = findings.some((finding) => finding.drug === name);
      return `
        <li class="dose-row${over ? " is-over" : ""}">
          <span>${escapeHtml(name)}</span>
          <span>${escapeHtml(regimens[name].perDose)} viên/lần · ${escapeHtml(regimens[name].perDay)} lần/ngày</span>
        </li>`;
    })
    .join("");

  const overCards = findings
    .map(
      (finding) => `
      <div class="doctor-dose-alert">
        <strong>${escapeHtml(finding.drug)} — vượt ngưỡng trong tờ HDSD</strong>
        <p>${escapeHtml(doseExplain(finding))}</p>
        ${finding.limit ? `<blockquote class="doctor-citation">${escapeHtml(finding.limit.citation)}</blockquote>
        <div class="doctor-source">${DOCTOR_ICONS.link}<span>${escapeHtml(finding.limit.source)}</span></div>` : ""}
      </div>`
    )
    .join("");

  return `
    <section class="case-section">
      <h3>Liều bệnh nhân đang dùng</h3>
      ${rows ? `<ul class="dose-rows">${rows}</ul>` : ""}
      ${overCards}
    </section>`;
}

function noDataHtml(request) {
  if (!request.noDataPairs.length) return "";
  return `
    <section class="case-section">
      <h3>Trường hợp hệ thống chưa có dữ liệu</h3>
      <div class="doctor-nodata">
        ${DOCTOR_ICONS.help}
        <div>
          <p>Bệnh nhân gửi kiểm tra vì chưa tìm được nguồn cho các trường hợp sau. Cần đối chiếu tờ hướng dẫn sử dụng và bổ sung dữ liệu nếu có.</p>
          <ul>${request.noDataPairs.map((pair) => `<li>${escapeHtml(pair)}</li>`).join("")}</ul>
        </div>
      </div>
    </section>`;
}

/** Bước "Kết quả phù hợp?" trong sơ đồ luồng. */
function verdictGateHtml() {
  return `
    <div class="verdict-gate">
      <div class="verdict-gate-question">
        <strong>Kết quả và nguồn tham khảo đã phù hợp chưa?</strong>
        <p>Chọn "Chưa phù hợp" nếu cần chỉnh mức độ hoặc nội dung hiển thị trước khi duyệt.</p>
      </div>
      <div class="verdict-gate-actions">
        <button type="button" class="btn btn-primary" data-gate="ok">${DOCTOR_ICONS.check}Phù hợp</button>
        <button type="button" class="btn btn-secondary" data-gate="edit">${DOCTOR_ICONS.edit}Chưa phù hợp, chỉnh sửa nội dung</button>
      </div>
    </div>`;
}

function approvalFormHtml() {
  return `
    <form class="assessment-form" id="assessmentForm" novalidate>
      <fieldset>
        <legend>Kết luận chuyên môn</legend>
        <p class="assessment-helper">Chọn một trạng thái sau khi đã đối chiếu trích dẫn với nguồn gốc.</p>
        <div class="assessment-options">
          ${REVIEW_CONCLUSIONS.map(
            (item) => `
            <label class="assessment-option">
              <input type="radio" name="conclusion" value="${item.value}" />
              <span><strong>${item.label}</strong><span>${item.hint}</span></span>
            </label>`
          ).join("")}
        </div>
      </fieldset>

      <div class="assessment-note-field">
        <label for="doctorNote">Ghi chú gửi bệnh nhân</label>
        <textarea id="doctorNote" name="doctorNote" maxlength="1000" placeholder="Nêu rõ đánh giá và hướng dẫn bước tiếp theo cho bệnh nhân." required></textarea>
      </div>

      <div class="assessment-form-foot">
        <p class="assessment-validation" id="assessmentValidation">Cần chọn kết luận và nhập ghi chú trước khi duyệt.</p>
        <div class="assessment-foot-actions">
          <button type="button" class="btn btn-ghost" data-gate="reset">Quay lại</button>
          <button type="submit" class="btn btn-primary assessment-submit" id="assessmentSubmit" disabled>
            Duyệt kết quả
            ${DOCTOR_ICONS.send}
          </button>
        </div>
      </div>
    </form>`;
}

function reviewedHtml(request) {
  const review = request.review;
  return `
    <div class="reviewed-response">
      <div class="reviewed-response-head">
        <span class="reviewed-response-title">${DOCTOR_ICONS.check}Đã duyệt và gửi phản hồi</span>
        <time datetime="${review.reviewedAt}">${formatFullDate(review.reviewedAt)}</time>
      </div>
      <strong>Kết luận: ${escapeHtml(conclusionLabel(review.conclusion))}</strong>
      <p>${escapeHtml(review.note)}</p>
      ${review.edited ? `<p class="reviewed-edit-note">${DOCTOR_ICONS.edit}Nội dung hiển thị đã được chỉnh sửa trước khi duyệt.</p>` : ""}
    </div>`;
}

function renderDetail(request) {
  const reviewed = isReviewed(request);
  const editable = !reviewed && gateChoice === "edit";
  const interactions = editable && draftInteractions ? draftInteractions : request.interactions;

  let assessmentBlock;
  if (reviewed) assessmentBlock = reviewedHtml(request);
  else if (gateChoice === null) assessmentBlock = verdictGateHtml();
  else assessmentBlock = approvalFormHtml();

  doctorDetail.innerHTML = `
    <article class="case-detail">
      <header class="case-header">
        <div class="case-header-main">
          <div>
            <h2>${escapeHtml(request.patient)}</h2>
            <p class="case-meta">
              <span class="case-id">${escapeHtml(request.id)}</span> ·
              <span class="request-kind ${request.kind === "kiem-tra" ? "is-check" : "is-compare"}">${kindLabel(request)}</span> ·
              ${escapeHtml(request.scope)} · Gửi lúc ${formatFullDate(request.sentAt)}
            </p>
          </div>
          ${reviewStatusHtml(request)}
        </div>
      </header>

      <div class="case-content">
        <section class="case-section">
          <h3>Ghi chú của bệnh nhân</h3>
          <p class="patient-note">${escapeHtml(request.note)}</p>
        </section>

        ${profileHtml(request)}

        <section class="case-section">
          <h3>Thuốc bệnh nhân đã gửi</h3>
          <div class="case-drug-list">
            ${request.drugs.map((drug) => `<span class="case-drug">${DOCTOR_ICONS.pill}${escapeHtml(drug)}</span>`).join("")}
          </div>
        </section>

        ${doseHtml(request)}

        ${
          interactions.length > 0
            ? `<section class="case-section">
                 <h3>Tương tác và trích dẫn nguồn${editable ? " — đang chỉnh sửa" : ""}</h3>
                 <div class="doctor-interactions">${interactions.map((it, i) => interactionHtml(it, i, editable)).join("")}</div>
               </section>`
            : ""
        }

        ${noDataHtml(request)}

        <section class="case-section" id="assessmentSection">
          ${assessmentBlock}
        </section>
      </div>
    </article>`;

  if (!reviewed) initDetailInteractions(request);
}

function initDetailInteractions(request) {
  doctorDetail.querySelectorAll("[data-gate]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.gate;
      if (choice === "reset") {
        gateChoice = null;
        draftInteractions = null;
      } else {
        gateChoice = choice;
        draftInteractions = choice === "edit" ? JSON.parse(JSON.stringify(request.interactions)) : null;
      }
      renderDetail(request);
    });
  });

  doctorDetail.querySelectorAll("[data-edit]").forEach((field) => {
    field.addEventListener("input", () => {
      const index = Number(field.dataset.index);
      draftInteractions[index][field.dataset.edit] = field.value;
      if (field.dataset.edit === "severity") {
        draftInteractions[index].severityLabel = severityLabelOf(field.value);
      }
    });
  });

  const form = document.getElementById("assessmentForm");
  if (!form) return;

  const note = document.getElementById("doctorNote");
  const submit = document.getElementById("assessmentSubmit");
  const validation = document.getElementById("assessmentValidation");

  function syncFormState() {
    const selected = form.querySelector('input[name="conclusion"]:checked');
    const valid = Boolean(selected && note.value.trim().length > 0);
    submit.disabled = !valid;
    validation.classList.remove("is-error");
    validation.textContent = valid
      ? "Phản hồi sẽ được gửi về tài khoản của bệnh nhân."
      : "Cần chọn kết luận và nhập ghi chú trước khi duyệt.";
  }

  form.querySelectorAll('input[name="conclusion"]').forEach((input) => input.addEventListener("change", syncFormState));
  note.addEventListener("input", syncFormState);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="conclusion"]:checked');
    const cleanNote = note.value.trim();
    if (!selected || !cleanNote) {
      validation.textContent = "Vui lòng chọn kết luận và nhập ghi chú trước khi duyệt.";
      validation.classList.add("is-error");
      return;
    }

    const edited = gateChoice === "edit";
    const finalInteractions = (edited ? draftInteractions : request.interactions).map((it) => ({
      ...it,
      severityLabel: severityLabelOf(it.severity),
      status: "confirmed",
    }));

    updateRequest(request.id, {
      interactions: finalInteractions,
      review: {
        conclusion: selected.value,
        note: cleanNote,
        reviewedAt: new Date().toISOString(),
        edited,
        reviewer: (readSession() && readSession().name) || "BS. Lê Minh Châu",
      },
    });

    gateChoice = null;
    draftInteractions = null;
    reloadRequests();
    updateSummary();
    renderRequestList();
    renderDetail(requests.find((item) => item.id === request.id));
    showToast();
  });
}

function selectRequest(requestId) {
  const request = requests.find((item) => item.id === requestId);
  if (!request) return;
  selectedRequestId = requestId;
  gateChoice = null;
  draftInteractions = null;
  renderRequestList();
  renderDetail(request);
  if (window.matchMedia("(max-width: 760px)").matches) {
    doctorDetail.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setFilter(nextFilter) {
  activeFilter = nextFilter;
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === nextFilter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  navFilterButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.navFilter === nextFilter));
  renderRequestList();
}

function showToast() {
  clearTimeout(toastTimer);
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function initTheme() {
  const stored = localStorage.getItem(DOCTOR_THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") document.documentElement.dataset.theme = stored;

  document.getElementById("themeToggle").addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = current ? (current === "dark" ? "light" : "dark") : (systemDark ? "light" : "dark");
    document.documentElement.dataset.theme = next;
    localStorage.setItem(DOCTOR_THEME_STORAGE_KEY, next);
  });
}

/** Đồng bộ lại khi bệnh nhân gửi yêu cầu mới ở tab khác. */
function refreshQueue() {
  reloadRequests();
  updateSummary();
  renderRequestList();
  const current = requests.find((item) => item.id === selectedRequestId);
  if (current) renderDetail(current);
}

filterButtons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
navFilterButtons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.navFilter)));
searchInput.addEventListener("input", renderRequestList);

document.getElementById("resetQueueBtn").addEventListener("click", () => {
  resetRequests();
  selectedRequestId = null;
  refreshQueue();
  selectRequest(requests[0].id);
});

window.addEventListener("storage", (event) => {
  if (event.key === REQUESTS_KEY) refreshQueue();
});

document.getElementById("doctorToday").textContent = new Date().toLocaleDateString("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

initSidebarToggle();
applySessionToSidebar();
initTheme();
updateSummary();
renderRequestList();
if (requests.length > 0) selectRequest(requests[0].id);
