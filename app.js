let DATA = [];

const resultArea = document.getElementById("resultArea");
const universityInput = document.getElementById("universityInput");
const majorInput = document.getElementById("majorInput");
const universityList = document.getElementById("universityList");
const majorList = document.getElementById("majorList");
const searchBtn = document.getElementById("searchBtn");
const majorSuggestList = document.getElementById("majorSuggestList");

init();

async function init() {
  try {
    const response = await fetch("./data/majors.json");
    if (!response.ok) {
      throw new Error("JSON 파일을 불러오지 못했습니다.");
    }

    DATA = await response.json();
    fillDatalists();

    resultArea.innerHTML = `
      <div class="title-row">
        <h2 class="result-title">희망 학과는 무엇인가요?</h2>
        <span class="chip">데이터 로드 완료</span>
      </div>
      <p class="empty">
        대학명과 학과명을 입력하면 결과가 여기에 표시됩니다.
      </p>
    `;
  } catch (error) {
    resultArea.innerHTML = `
      <div class="title-row">
        <h2 class="result-title">데이터 로드 오류</h2>
        <span class="chip">확인 필요</span>
      </div>
      <p class="empty">
        JSON 데이터를 불러오지 못했습니다.<br>
        GitHub Pages에서는 정상 동작하지만, 로컬 파일로 직접 열면 막힐 수 있습니다.
      </p>
      <div class="footer">${escapeHtml(error.message)}</div>
    `;
    console.error(error);
  }
}

function fillDatalists() {
  const universities = [...new Set(DATA.map(item => item.university))].sort();
  const majors = [...new Set(DATA.flatMap(item => item.majors.map(major => major.name)))].sort();

  universities.forEach(university => {
    const option = document.createElement("option");
    option.value = university;
    universityList.appendChild(option);
  });

  majors.forEach(major => {
    const option = document.createElement("option");
    option.value = major;
    majorList.appendChild(option);
  });
}

function normalizeText(text) {
  return (text || "")
    .replace(/\s+/g, "")
    .replace(/대학교/g, "대")
    .replace(/학부/g, "")
    .replace(/전공/g, "")
    .trim()
    .toLowerCase();
}

function formatSubjects(subjects) {
  if (!subjects || subjects.length === 0) {
    return "제공된 데이터 기준으로 해당 정보가 없습니다.";
  }
  return subjects.join(", ");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function findSchoolByName(inputValue) {
  const normalizedUniversity = normalizeText(inputValue);

  return DATA.find(item =>
    normalizeText(item.university) === normalizedUniversity ||
    normalizeText(item.university).includes(normalizedUniversity) ||
    normalizedUniversity.includes(normalizeText(item.university))
  );
}

function renderUniversityMajorSuggestions() {
  const universityValue = universityInput.value.trim();

  if (!universityValue) {
    majorSuggestList.innerHTML = `<span class="suggest-empty">대학명을 입력하면 해당 대학 학과가 여기에 표시됩니다.</span>`;
    return;
  }

  const school = findSchoolByName(universityValue);

  if (!school) {
    majorSuggestList.innerHTML = `<span class="suggest-empty">해당 대학을 찾지 못했습니다.</span>`;
    return;
  }

  if (!school.majors || school.majors.length === 0) {
    majorSuggestList.innerHTML = `<span class="suggest-empty">표시할 학과 데이터가 없습니다.</span>`;
    return;
  }

  majorSuggestList.innerHTML = school.majors
    .map(major => `<button class="major-chip-btn" data-major="${escapeHtml(major.name)}">${escapeHtml(major.name)}</button>`)
    .join("");

  document.querySelectorAll(".major-chip-btn").forEach(button => {
    button.addEventListener("click", () => {
      majorInput.value = button.dataset.major;
      searchMajor();
    });
  });
}

function renderSingleResult(university, major) {
  return `
    <div class="title-row">
      <h2 class="result-title">${escapeHtml(university)} ${escapeHtml(major.name)}</h2>
      <span class="chip">2022 개정 교육과정</span>
      <span class="chip">전공 연계 추천</span>
    </div>

    <p class="summary">
      입력한 학과를 기준으로 핵심 과목, 권장 과목, 기타 추천 과목을 정리했습니다.
    </p>

    <table>
      <tbody>
        <tr>
          <th>핵심 과목</th>
          <td>${escapeHtml(formatSubjects(major.coreSubjects))}</td>
        </tr>
        <tr>
          <th>권장 과목</th>
          <td>${escapeHtml(formatSubjects(major.recommendedSubjects))}</td>
        </tr>
        <tr>
          <th>기타 추천 과목</th>
          <td>${escapeHtml(formatSubjects(major.otherSubjects))}</td>
        </tr>
      </tbody>
    </table>

    <div class="section">
      <h3>과목 권장 이유 및 학과 연계 설명</h3>
      <ul class="reasons">
        ${
          major.reasons && major.reasons.length
            ? major.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join("")
            : "<li>제공된 데이터 기준으로 해당 정보가 없습니다.</li>"
        }
      </ul>
    </div>

    <div class="footer">
      이상 ${escapeHtml(university)} ${escapeHtml(major.name)}의 권장 과목에 대해 안내해드렸습니다.
      혹시 어떤 과목 사이에서 고민 중인가요?
    </div>
  `;
}

function renderCompareResults(majorName, matches) {
  return `
    <div class="title-row">
      <h2 class="result-title">${escapeHtml(majorName)} 검색 결과</h2>
      <span class="chip">${matches.length}개 대학</span>
    </div>

    <p class="summary">
      대학명을 비워두고 학과명만 입력해서 검색한 결과입니다. 같은 학과라도 대학별 권장 과목이 다를 수 있습니다.
    </p>

    ${matches.map(item => `
      <div class="compare-card">
        <h3>${escapeHtml(item.university)} ${escapeHtml(item.major.name)}</h3>
        <p><strong>핵심 과목:</strong> ${escapeHtml(formatSubjects(item.major.coreSubjects))}</p>
        <p><strong>권장 과목:</strong> ${escapeHtml(formatSubjects(item.major.recommendedSubjects))}</p>
        <p><strong>기타 추천 과목:</strong> ${escapeHtml(formatSubjects(item.major.otherSubjects))}</p>
      </div>
    `).join("")}
  `;
}

function searchMajor() {
  const universityValue = universityInput.value.trim();
  const majorValue = majorInput.value.trim();

  if (!majorValue) {
    resultArea.innerHTML = `
      <div class="title-row">
        <h2 class="result-title">입력 확인</h2>
        <span class="chip">확인 필요</span>
      </div>
      <p class="empty">학과명은 꼭 입력해주세요.</p>
    `;
    return;
  }

  const normalizedMajor = normalizeText(majorValue);

  if (universityValue) {
    const school = findSchoolByName(universityValue);

    if (!school) {
      resultArea.innerHTML = `
        <div class="title-row">
          <h2 class="result-title">검색 결과</h2>
          <span class="chip">대학 없음</span>
        </div>
        <p class="empty">입력한 대학명을 데이터에서 찾지 못했습니다.</p>
      `;
      return;
    }

    const major = school.majors.find(item =>
      normalizeText(item.name) === normalizedMajor ||
      normalizeText(item.name).includes(normalizedMajor) ||
      normalizedMajor.includes(normalizeText(item.name))
    );

    if (!major) {
      resultArea.innerHTML = `
        <div class="title-row">
          <h2 class="result-title">검색 결과</h2>
          <span class="chip">학과 없음</span>
        </div>
        <p class="empty">해당 대학에서 입력한 학과명을 찾지 못했습니다.</p>
      `;
      return;
    }

    resultArea.innerHTML = renderSingleResult(school.university, major);
    return;
  }

  const matches = [];

  DATA.forEach(school => {
    school.majors.forEach(major => {
      if (
        normalizeText(major.name) === normalizedMajor ||
        normalizeText(major.name).includes(normalizedMajor) ||
        normalizedMajor.includes(normalizeText(major.name))
      ) {
        matches.push({
          university: school.university,
          major
        });
      }
    });
  });

  if (matches.length === 0) {
    resultArea.innerHTML = `
      <div class="title-row">
        <h2 class="result-title">검색 결과</h2>
        <span class="chip">데이터 없음</span>
      </div>
      <p class="empty">제공된 데이터 기준으로 해당 정보가 없습니다.</p>
    `;
    return;
  }

  if (matches.length === 1) {
    resultArea.innerHTML = renderSingleResult(matches[0].university, matches[0].major);
    return;
  }

  resultArea.innerHTML = renderCompareResults(majorValue, matches);
}

searchBtn.addEventListener("click", searchMajor);

majorInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchMajor();
  }
});

universityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchMajor();
  }
});

universityInput.addEventListener("input", renderUniversityMajorSuggestions);
universityInput.addEventListener("change", renderUniversityMajorSuggestions);
