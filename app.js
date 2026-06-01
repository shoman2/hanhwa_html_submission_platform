const submissions = [];

const form = document.querySelector("#submission-form");
const studentNameInput = document.querySelector("#student-name");
const folderNameInput = document.querySelector("#folder-name");
const htmlFileInput = document.querySelector("#html-file");
const formMessage = document.querySelector("#form-message");
const folderTabs = document.querySelector("#folder-tabs");
const submissionList = document.querySelector("#submission-list");
const submissionCount = document.querySelector("#submission-count");
const previewFrame = document.querySelector("#html-preview");
const previewPlaceholder = document.querySelector("#preview-placeholder");
const previewMeta = document.querySelector("#preview-meta");

let activeFolder = "all";
let activeSubmissionId = null;

function createSubmission({ studentName, folderName, fileName, htmlContent }) {
  return {
    id: crypto.randomUUID(),
    studentName,
    folderName,
    fileName,
    htmlContent,
    createdAt: new Date().toISOString(),
  };
}

function readHtmlFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(new Error("HTML 파일을 읽는 중 문제가 발생했습니다.")));
    reader.readAsText(file);
  });
}

function isHtmlFile(file) {
  return file && (file.type === "text/html" || file.name.toLowerCase().endsWith(".html"));
}

function setMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.classList.toggle("success", type === "success");
}

function getVisibleSubmissions() {
  if (activeFolder === "all") {
    return submissions;
  }

  return submissions.filter((submission) => submission.folderName === activeFolder);
}

function renderFolderTabs() {
  const folderNames = [...new Set(submissions.map((submission) => submission.folderName))];

  if (activeFolder !== "all" && !folderNames.includes(activeFolder)) {
    activeFolder = "all";
  }

  folderTabs.innerHTML = "";
  folderTabs.append(createFolderTab("전체", "all", submissions.length));

  folderNames.forEach((folderName) => {
    const count = submissions.filter((submission) => submission.folderName === folderName).length;
    folderTabs.append(createFolderTab(folderName, folderName, count));
  });
}

function createFolderTab(label, folderName, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `folder-tab${activeFolder === folderName ? " active" : ""}`;
  button.dataset.folder = folderName;
  button.setAttribute("role", "tab");
  button.setAttribute("aria-selected", String(activeFolder === folderName));
  button.textContent = `${label} ${count}`;

  button.addEventListener("click", () => {
    activeFolder = folderName;
    render();
  });

  return button;
}

function renderSubmissionList() {
  const visibleSubmissions = getVisibleSubmissions();
  submissionCount.textContent = `${visibleSubmissions.length}개`;
  submissionList.innerHTML = "";

  if (visibleSubmissions.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <strong>표시할 제출물이 없습니다.</strong>
      <span>선택한 폴더에 맞는 제출물이 이곳에 표시됩니다.</span>
    `;
    submissionList.append(emptyState);
    return;
  }

  visibleSubmissions.forEach((submission) => {
    submissionList.append(createSubmissionCard(submission));
  });
}

function createSubmissionCard(submission) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `submission-card${activeSubmissionId === submission.id ? " active" : ""}`;

  const createdAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(submission.createdAt));

  button.innerHTML = `
    <span class="submission-title">
      <strong>${escapeHtml(submission.studentName)}</strong>
      <span class="submission-folder">${escapeHtml(submission.folderName)}</span>
    </span>
    <span class="submission-detail">
      <span>${escapeHtml(submission.fileName)}</span>
      <span>${createdAt}</span>
    </span>
  `;

  button.addEventListener("click", () => showPreview(submission.id));
  return button;
}

function showPreview(submissionId) {
  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    return;
  }

  activeSubmissionId = submission.id;
  previewFrame.srcdoc = submission.htmlContent;
  previewPlaceholder.classList.add("hidden");
  previewMeta.textContent = `${submission.studentName} · ${submission.folderName}`;
  renderSubmissionList();
}

function render() {
  renderFolderTabs();
  renderSubmissionList();
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character];
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const studentName = studentNameInput.value.trim();
  const folderName = folderNameInput.value.trim();
  const file = htmlFileInput.files[0];

  if (!studentName || !folderName || !file) {
    setMessage("이름, 폴더명, HTML 파일을 모두 입력해 주세요.");
    return;
  }

  if (!isHtmlFile(file)) {
    setMessage(".html 파일만 업로드할 수 있습니다.");
    return;
  }

  try {
    const htmlContent = await readHtmlFile(file);
    const submission = createSubmission({
      studentName,
      folderName,
      fileName: file.name,
      htmlContent,
    });

    submissions.unshift(submission);
    activeFolder = folderName;
    setMessage("제출되었습니다. 카드를 클릭하면 미리보기가 열립니다.", "success");
    form.reset();
    render();
  } catch (error) {
    setMessage(error.message);
  }
});

render();
