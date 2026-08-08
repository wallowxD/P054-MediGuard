/* Demo giao diện bác sĩ. Dữ liệu và phản hồi chỉ được lưu cục bộ trong trình duyệt. */

const DOCTOR_THEME_STORAGE_KEY = "medsafe_doctor_theme_v1";

const DOCTOR_ICONS = {
  pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><line x1="9.5" y1="9.5" x2="14.5" y2="14.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.5 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.3 4.5 6v6c0 4.6 3.2 7.9 7.5 9 4.3-1.1 7.5-4.4 7.5-9V6L12 3.3Z"/><path d="m8.8 12.2 2.2 2.2 4.2-4.4"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.4 5a3.6 3.6 0 0 1 5.1 5.1l-1.5 1.4"/><path d="M13 17.5 11.6 19a3.6 3.6 0 0 1-5.1-5.1l1.5-1.4"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><path d="m14 6 6 6-6 6"/></svg>',
};

const DOCTOR_REQUESTS = [
  {
    id: "YC-260807-014",
    patient: "Nguyễn An",
    sentAt: "2026-08-07T14:32:00+07:00",
    note: "Tôi đang dùng thuốc sau đợt khám tim mạch. Gần đây hay xuất hiện vết bầm, nhờ bác sĩ xem giúp kết quả tương tác.",
    drugs: ["Warfarin 5mg", "Aspirin 81mg"],
    interactions: [
      {
        pair: "Warfarin 5mg × Aspirin 81mg",
        severity: "Nghiêm trọng",
        severe: true,
        citation: "\"Phối hợp Warfarin với Aspirin làm tăng nguy cơ chảy máu do tác dụng cộng gộp trên quá trình đông máu và chức năng tiểu cầu.\"",
        source: "Tờ hướng dẫn sử dụng Warfarin, mục Tương tác thuốc, trang 3",
        reviewStatus: "Đang chờ xác nhận chuyên môn",
      },
    ],
  },
  {
    id: "YC-260807-011",
    patient: "Trần Minh Hoàng",
    sentAt: "2026-08-07T10:18:00+07:00",
    note: "Tôi dùng thuốc dạ dày mỗi sáng và thuốc tim theo đơn sau đặt stent. Xin bác sĩ đánh giá giúp.",
    drugs: ["Clopidogrel 75mg", "Omeprazole 20mg"],
    interactions: [
      {
        pair: "Clopidogrel 75mg × Omeprazole 20mg",
        severity: "Trung bình",
        severe: false,
        citation: "\"Omeprazole có thể làm giảm tác dụng chống kết tập tiểu cầu của Clopidogrel do ức chế chuyển hoá qua CYP2C19.\"",
        source: "Tờ hướng dẫn sử dụng Clopidogrel, mục Tương tác thuốc, trang 4",
        reviewStatus: "Đang chờ xác nhận chuyên môn",
      },
    ],
  },
  {
    id: "YC-260806-028",
    patient: "Phạm Thị Lan",
    sentAt: "2026-08-06T16:45:00+07:00",
    note: "Đơn mới có thêm kháng sinh. Tôi chưa uống liều đầu tiên và muốn hỏi trước khi dùng cùng thuốc mỡ máu.",
    drugs: ["Simvastatin 20mg", "Clarithromycin 500mg"],
    interactions: [
      {
        pair: "Simvastatin 20mg × Clarithromycin 500mg",
        severity: "Nghiêm trọng",
        severe: true,
        citation: "\"Sử dụng đồng thời Simvastatin với thuốc ức chế CYP3A4 mạnh như Clarithromycin làm tăng nồng độ Simvastatin trong huyết tương, tăng nguy cơ bệnh cơ và tiêu cơ vân.\"",
        source: "Tờ hướng dẫn sử dụng Simvastatin, mục Chống chỉ định phối hợp, trang 2",
        reviewStatus: "Đã xác nhận bởi dược sĩ",
      },
    ],
  },
  {
    id: "YC-260805-019",
    patient: "Đỗ Quang Huy",
    sentAt: "2026-08-05T09:10:00+07:00",
    note: "Tôi thấy chóng mặt khi đứng lên và đang dùng cả hai thuốc này. Nhờ bác sĩ kiểm tra giúp.",
    drugs: ["Losartan 50mg", "Furosemide 40mg", "Digoxin 0.25mg"],
    interactions: [
      {
        pair: "Losartan 50mg × Furosemide 40mg",
        severity: "Nhẹ",
        severe: false,
        citation: "\"Phối hợp với thuốc lợi tiểu có thể làm tăng tác dụng hạ huyết áp của Losartan, cần theo dõi huyết áp khi bắt đầu điều trị.\"",
        source: "Tờ hướng dẫn sử dụng Losartan, mục Tương tác thuốc, trang 3",
        reviewStatus: "Đã xác nhận bởi dược sĩ",
      },
      {
        pair: "Digoxin 0.25mg × Furosemide 40mg",
        severity: "Trung bình",
        severe: false,
        citation: "\"Furosemide có thể gây hạ kali máu, làm tăng nguy cơ ngộ độc Digoxin.\"",
        source: "Tờ hướng dẫn sử dụng Digoxin, mục Thận trọng khi phối hợp, trang 2",
        reviewStatus: "Đang chờ xác nhận chuyên môn",
      },
    ],
  },
];

const requestList = document.getElementById("requestList");
const doctorDetail = document.getElementById("doctorDetail");
const searchInput = document.getElementById("requestSearch");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const navFilterButtons = Array.from(document.querySelectorAll("[data-nav-filter]"));
const toast = document.getElementById("doctorToast");

let activeFilter = "all";
let selectedRequestId = null;
let toastTimer = null;
// Phản hồi chỉ tồn tại trong vòng đời của trang. Reload hoặc mở lại trang sẽ
// đưa toàn bộ yêu cầu về trạng thái chưa phản hồi để có thể demo nhiều lần.
let reviewState = {};

function isReviewed(request) {
  return Boolean(reviewState[request.id]);
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

function updateSummary() {
  const reviewedCount = DOCTOR_REQUESTS.filter(isReviewed).length;
  const pendingCount = DOCTOR_REQUESTS.length - reviewedCount;
  document.getElementById("summaryPending").textContent = pendingCount;
  document.getElementById("summaryReviewed").textContent = reviewedCount;
  document.getElementById("pendingNavCount").textContent = pendingCount;
}

function renderRequestList() {
  const visibleRequests = DOCTOR_REQUESTS.filter(requestMatches);
  document.getElementById("queueCountText").textContent = `${visibleRequests.length} yêu cầu phù hợp`;

  if (visibleRequests.length === 0) {
    requestList.innerHTML = '<div class="request-list-empty">Không có yêu cầu phù hợp với bộ lọc hiện tại.</div>';
    return;
  }

  requestList.innerHTML = visibleRequests.map((request) => {
    const reviewed = isReviewed(request);
    return `
      <button type="button" class="request-item${selectedRequestId === request.id ? " is-active" : ""}" data-request-id="${request.id}" aria-pressed="${selectedRequestId === request.id}">
        <span class="request-item-top">
          <span class="request-patient">${escapeHtml(request.patient)}</span>
          <time class="request-time" datetime="${request.sentAt}">${formatRequestTime(request.sentAt)}</time>
        </span>
        <span class="request-drugs">${escapeHtml(request.drugs.join(", "))}</span>
        <span class="request-item-bottom">
          <span class="request-interaction-count">${request.interactions.length} tương tác cần xem</span>
          <span class="request-status ${reviewed ? "is-reviewed" : "is-pending"}">${reviewed ? "Đã phản hồi" : "Chờ đánh giá"}</span>
        </span>
      </button>`;
  }).join("");

  requestList.querySelectorAll("[data-request-id]").forEach((button) => {
    button.addEventListener("click", () => selectRequest(button.dataset.requestId));
  });
}

function reviewStatusHtml(request) {
  const reviewed = isReviewed(request);
  return `
    <span class="case-status ${reviewed ? "is-reviewed" : "is-pending"}">
      ${reviewed ? DOCTOR_ICONS.check : DOCTOR_ICONS.clock}
      ${reviewed ? "Đã phản hồi" : "Chờ đánh giá"}
    </span>`;
}

function interactionsHtml(interactions) {
  return interactions.map((interaction) => `
    <article class="doctor-interaction${interaction.severe ? " is-severe" : ""}">
      <div class="doctor-interaction-head">
        <div class="doctor-interaction-pair">${escapeHtml(interaction.pair)}</div>
        <span class="doctor-severity">${escapeHtml(interaction.severity)}</span>
      </div>
      <blockquote class="doctor-citation">${escapeHtml(interaction.citation)}</blockquote>
      <div class="doctor-source">${DOCTOR_ICONS.link}<span>${escapeHtml(interaction.source)}. ${escapeHtml(interaction.reviewStatus)}.</span></div>
    </article>`).join("");
}

function responseHtml(response) {
  const label = response.assessment === "attention" ? "Cần chú ý" : "Chống chỉ định";
  return `
    <div class="reviewed-response">
      <div class="reviewed-response-head">
        <span class="reviewed-response-title">${DOCTOR_ICONS.check}Phản hồi đã gửi</span>
        <time datetime="${response.reviewedAt}">${formatFullDate(response.reviewedAt)}</time>
      </div>
      <strong>Đánh giá: ${label}</strong>
      <p>${escapeHtml(response.note)}</p>
    </div>`;
}

function assessmentFormHtml(request) {
  return `
    <div class="assessment-panel">
      <form class="assessment-form" id="assessmentForm" novalidate>
        <fieldset>
          <legend>Đánh giá của bác sĩ</legend>
          <p class="assessment-helper">Chọn một kết luận cho yêu cầu này sau khi đã đối chiếu thông tin.</p>
          <div class="assessment-options">
            <label class="assessment-option">
              <input type="radio" name="assessment" value="attention" />
              <span><strong>Cần chú ý</strong><span>Cần theo dõi và tuân thủ hướng dẫn chuyên môn đi kèm.</span></span>
            </label>
            <label class="assessment-option is-contraindicated">
              <input type="radio" name="assessment" value="contraindicated" />
              <span><strong>Chống chỉ định</strong><span>Không sử dụng phối hợp này khi chưa được xử trí chuyên môn.</span></span>
            </label>
          </div>
        </fieldset>

        <div class="assessment-note-field">
          <label for="doctorNote">Ghi chú gửi bệnh nhân</label>
          <textarea id="doctorNote" name="doctorNote" maxlength="1000" placeholder="Nêu rõ đánh giá và hướng dẫn bước tiếp theo cho bệnh nhân." required></textarea>
        </div>

        <div class="assessment-form-foot">
          <p class="assessment-validation" id="assessmentValidation">Cần chọn đánh giá và nhập ghi chú trước khi gửi.</p>
          <button type="submit" class="btn btn-primary assessment-submit" id="assessmentSubmit" disabled>
            Gửi phản hồi
            ${DOCTOR_ICONS.send}
          </button>
        </div>
      </form>
    </div>`;
}

function renderDetail(request) {
  const response = reviewState[request.id];
  doctorDetail.innerHTML = `
    <article class="case-detail">
      <header class="case-header">
        <div class="case-header-main">
          <div>
            <h2>${escapeHtml(request.patient)}</h2>
            <p class="case-meta"><span class="case-id">${escapeHtml(request.id)}</span> · Gửi lúc ${formatFullDate(request.sentAt)}</p>
          </div>
          ${reviewStatusHtml(request)}
        </div>
      </header>

      <div class="case-content">
        <section class="case-section">
          <h3>Ghi chú của bệnh nhân</h3>
          <p class="patient-note">${escapeHtml(request.note)}</p>
        </section>

        <section class="case-section">
          <h3>Thuốc bệnh nhân đã gửi</h3>
          <div class="case-drug-list">
            ${request.drugs.map((drug) => `<span class="case-drug">${DOCTOR_ICONS.pill}${escapeHtml(drug)}</span>`).join("")}
          </div>
        </section>

        <section class="case-section">
          <h3>Tương tác và trích dẫn nguồn</h3>
          <div class="doctor-interactions">${interactionsHtml(request.interactions)}</div>
        </section>

        <section class="case-section" id="assessmentSection">
          ${response ? responseHtml(response) : assessmentFormHtml(request)}
        </section>
      </div>
    </article>`;

  if (!response) initAssessmentForm(request);
}

function initAssessmentForm(request) {
  const form = document.getElementById("assessmentForm");
  const note = document.getElementById("doctorNote");
  const submit = document.getElementById("assessmentSubmit");
  const validation = document.getElementById("assessmentValidation");

  function syncFormState() {
    const selected = form.querySelector('input[name="assessment"]:checked');
    const valid = Boolean(selected && note.value.trim().length > 0);
    submit.disabled = !valid;
    validation.classList.remove("is-error");
    validation.textContent = valid
      ? "Phản hồi sẽ được gửi về tài khoản của bệnh nhân."
      : "Cần chọn đánh giá và nhập ghi chú trước khi gửi.";
  }

  form.querySelectorAll('input[name="assessment"]').forEach((input) => input.addEventListener("change", syncFormState));
  note.addEventListener("input", syncFormState);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="assessment"]:checked');
    const cleanNote = note.value.trim();
    if (!selected || !cleanNote) {
      validation.textContent = "Vui lòng chọn đánh giá và nhập ghi chú trước khi gửi.";
      validation.classList.add("is-error");
      return;
    }

    reviewState[request.id] = {
      assessment: selected.value,
      note: cleanNote,
      reviewedAt: new Date().toISOString(),
    };
    updateSummary();
    renderRequestList();
    renderDetail(request);
    showToast();
  });
}

function selectRequest(requestId) {
  const request = DOCTOR_REQUESTS.find((item) => item.id === requestId);
  if (!request) return;
  selectedRequestId = requestId;
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

filterButtons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
navFilterButtons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.navFilter)));
searchInput.addEventListener("input", renderRequestList);

document.getElementById("doctorToday").textContent = new Date().toLocaleDateString("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

initSidebarToggle();
initTheme();
updateSummary();
renderRequestList();
selectRequest(DOCTOR_REQUESTS[0].id);
