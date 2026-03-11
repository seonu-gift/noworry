let DATA = [];

const resultArea = document.getElementById("resultArea");
const universityInput = document.getElementById("universityInput");
const majorInput = document.getElementById("majorInput");
const universityList = document.getElementById("universityList");
const majorList = document.getElementById("majorList");
const searchBtn = document.getElementById("searchBtn");
const majorSuggestList = document.getElementById("majorSuggestList");

const SIMILAR_MAJOR_MAP = {
  "화학공학과": ["화공생명공학과", "화공생물공학과", "고분자공학과", "신소재공학과", "응용화학과", "융합응용화학과", "배터리소재화학공학과"],
  "화공생명공학과": ["화학공학과", "화공생물공학과", "생명공학과", "고분자공학과", "응용화학과"],
  "화공생물공학과": ["화학공학과", "화공생명공학과", "생명공학과", "고분자공학과"],
  "컴퓨터공학과": ["소프트웨어학과", "인공지능학과", "데이터사이언스학과", "정보통신공학과", "컴퓨터학과", "컴퓨터과학부", "컴퓨터·AI학부"],
  "소프트웨어학과": ["컴퓨터공학과", "인공지능학과", "데이터사이언스학과"],
  "인공지능학과": ["컴퓨터공학과", "소프트웨어학과", "데이터사이언스학과", "컴퓨터·AI학부", "의료인공지능공학과"],
  "기계공학과": ["기계공학부", "기계정보공학과", "기계로봇에너지공학과", "로봇공학과"],
  "전자공학과": ["전기전자공학부", "전자전기공학부", "반도체공학과", "정보통신공학과"],
  "신소재공학과": ["화학공학과", "고분자공학과", "재료공학과", "에너지신소재공학과"],
  "생명공학과": ["화공생명공학과", "화공생물공학과", "생명과학과", "의생명공학과", "바이오시스템공학과"],
  "환경공학과": ["환경공학부", "건설환경공학과", "환경안전공학과", "융합환경과학과"]
};

init();

async function init() {
  try {
    const response = await fetch("./data/majors.json");
    if (!response.ok) {
      throw new Error("JSON 파일을 불러오지 못했습니다.");
    }

    DATA = await response.json();

    if (!Array.isArray(DATA)) {
      throw new Error("majors.json 형식이 올바르지 않습니다. 최상위는 배열이어야 합니다.");
    }

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

    renderUniversityMajorSuggestions();
  } catch (error) {
    resultArea.innerHTML = `
      <div class="title-row">
        <h2 class="result-title">데이터 로드 오류</h2>
        <span class="chip">확인 필요</span>
      </div>
      <p class="empty">JSON 데이터를 불러오지 못했습니다.</p>
      <div class="footer">${escapeHtml(error.message)}</div>
    `;
    console.error(error);
  }
}

function fillDatalists() {
  if (!universityList || !majorList) return;

  universityList.innerHTML = "";
  majorList.innerHTML = "";

  const universities = [...new Set(DATA.map(item => item.university).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  const majors = [...new Set(DATA.flatMap(item => (item.majors || []).map(major => major.name).filter(Boolean)))].sort((a, b) => a.localeCompare(b, "ko"));

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

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSubjects(subjects) {
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return "제공된 데이터 기준으로 해당 정보가 없습니다.";
  }
  return subjects.join(", ");
}

function getCoreSubjects(major) {
  return major.coreSubjects || major.core || [];
}

function getRecommendedSubjects(major) {
  return major.recommendedSubjects || major.recommended || [];
}

function getOtherSubjects(major) {
  return major.otherSubjects || major.other || [];
}

function getReasons(major) {
  return major.reasons || [];
}

function findSchoolByName(inputValue) {
  const normalizedUniversity = normalizeText(inputValue);

  return DATA.find(item => {
    const uni = normalizeText(item.university);
    return (
      uni === normalizedUniversity ||
      uni.includes(normalizedUniversity) ||
      normalizedUniversity.includes(uni)
    );
  });
}

function renderUniversityMajorSuggestions() {
  if (!majorSuggestList || !universityInput) return;

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
    .map(major => `<button type="button" class="major-chip-btn" data-major="${escapeHtml(major.name)}">${escapeHtml(major.name)}</button>`)
    .join("");

  document.querySelectorAll(".major-chip-btn").forEach(button => {
    button.addEventListener("click", () => {
      if (majorInput) {
        majorInput.value = button.dataset.major;
      }
      searchMajor();
    });
  });
}

function getAllMajorNames() {
  return [...new Set(DATA.flatMap(school => (school.majors || []).map(major => major.name)).filter(Boolean))];
}

function tokenizeMajorName(name) {
  return normalizeText(name)
    .replace(/공학과|학과|학부|전공/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function getSimilarMajors(targetMajorName) {
  const allMajors = getAllMajorNames();
  const targetNormalized = normalizeText(targetMajorName);
  const targetTokens = tokenizeMajorName(targetMajorName);

  const manualMatches = (SIMILAR_MAJOR_MAP[targetMajorName] || []).filter(name => allMajors.includes(name));

  const scored = allMajors
    .filter(name => normalizeText(name) !== targetNormalized)
    .map(name => {
      const tokens = tokenizeMajorName(name);
      let score = 0;

      targetTokens.forEach(token => {
        if (tokens.includes(token)) score += 3;
        if (normalizeText(name).includes(token) || targetNormalized.includes(token)) score += 1;
      });

      if (normalizeText(name).includes(targetNormalized) || targetNormalized.includes(normalizeText(name))) {
        score += 4;
      }

      return { name, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ko"))
    .map(item => item.name);

  const merged = [...new Set([...manualMatches, ...scored])];
  return merged.slice(0, 8);
}

function findMajorMatchesAcrossUniversities(inputMajorName) {
  const targetNormalized = normalizeText(inputMajorName);
  const similarMajors = getSimilarMajors(inputMajorName);
  const similarSet = new Set(similarMajors.map(name => normalizeText(name)));

  const exactMatches = [];
  const similarMatches = [];

  DATA.forEach(school => {
    (school.majors || []).forEach(major => {
      const majorNormalized = normalizeText(major.name);

      const exactMatch =
        majorNormalized === targetNormalized ||
        majorNormalized.includes(targetNormalized) ||
        targetNormalized.includes(majorNormalized);

      const similarMatch = similarSet.has(majorNormalized);

      const item = {
        university: school.university,
        major
      };

      if (exactMatch) {
        exactMatches.push(item);
      } else if (similarMatch) {
        similarMatches.push(item);
      }
    });
  });

  const uniqueBy = (items) => {
    const seen = new Set();
    return items.filter(item => {
      const key = `${item.university}__${item.major.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    exactMatches: uniqueBy(exactMatches).sort((a, b) => a.university.localeCompare(b.university, "ko")),
    similarMatches: uniqueBy(similarMatches).sort((a, b) => a.university.localeCompare(b.university, "ko"))
  };
}

function renderMajorCard(item, relationLabel) {
  return `
    <div class="compare-card">
      <div class="title-row">
        <h3 style="margin:0;">${escapeHtml(item.university)} ${escapeHtml(item.major.name)}</h3>
        <span class="chip">${escapeHtml(relationLabel)}</span>
      </div>
      <p><strong>핵심 과목:</strong> ${escapeHtml(formatSubjects(getCoreSubjects(item.major)))}</p>
      <p><strong>권장 과목:</strong> ${escapeHtml(formatSubjects(getRecommendedSubjects(item.major)))}</p>
      <p><strong>기타 추천 과목:</strong> ${escapeHtml(formatSubjects(getOtherSubjects(item.major)))}</p>
    </div>
  `;
}

function renderSingleResult(university, major) {
  return `
    <div class="title-row">
      <h2 class="result-title">${escapeHtml(university)} ${escapeHtml(major.name)}</h2>
      <span class="chip">2022 개정 교육과정</span>
      <span class="chip">전공 연계 추천</span>
    </div>

    <table>
      <tbody>
        <tr>
          <th>핵심 과목</th>
          <td>${escapeHtml(formatSubjects(getCoreSubjects(major)))}</td>
        </tr>
        <tr>
          <th>권장 과목</th>
          <td>${escapeHtml(formatSubjects(getRecommendedSubjects(major)))}</td>
        </tr>
        <tr>
          <th>기타 추천 과목</th>
          <td>${escapeHtml(formatSubjects(getOtherSubjects(major)))}</td>
        </tr>
      </tbody>
    </table>

    <div class="section">
      <h3>과목 권장 이유 및 학과 연계 설명</h3>
      <ul class="reasons">
        ${
          getReasons(major).length
            ? getReasons(major).map(reason => `<li>${escapeHtml(reason)}</li>`).join("")
            : "<li>제공된 데이터 기준으로 해당 정보가 없습니다.</li>"
        }
      </ul>
    </div>
  `;
}

function renderSeparatedMajorResults(inputMajorName, exactMatches, similarMatches) {
  return `
    <div class="title-row">
      <h2 class="result-title">${escapeHtml(inputMajorName)} 대학별 검색 결과</h2>
      <span class="chip">정확히 일치 ${exactMatches.length}개</span>
      <span class="chip">비슷한 학과 ${similarMatches.length}개</span>
    </div>

    <p class="summary">
      입력한 학과명과 정확히 일치하는 학과를 먼저 보여드리고, 그 아래에 비슷한 학과를 따로 정리했습니다.
    </p>

    <div class="section">
      <h3>정확히 일치하는 학과</h3>
      ${
        exactMatches.length
          ? exactMatches.map(item => renderMajorCard(item, "정확히 일치")).join("")
          : `<div class="compare-card"><p>정확히 일치하는 학과는 없습니다.</p></div>`
      }
    </div>

    <div class="section">
      <h3>비슷한 학과 추천</h3>
      ${
        similarMatches.length
          ? similarMatches.map(item => renderMajorCard(item, "비슷한 학과")).join("")
          : `<div class="compare-card"><p>비슷한 학과 추천 결과가 없습니다.</p></div>`
      }
    </div>
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
      <p class="empty">학과명을 입력해주세요.</p>
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

    const major = (school.majors || []).find(item => {
      const name = normalizeText(item.name);
      return (
        name === normalizedMajor ||
        name.includes(normalizedMajor) ||
        normalizedMajor.includes(name)
      );
    });

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

  const { exactMatches, similarMatches } = findMajorMatchesAcrossUniversities(majorValue);

  if (exactMatches.length === 0 && similarMatches.length === 0) {
    resultArea.innerHTML = `
      <div class="title-row">
        <h2 class="result-title">검색 결과</h2>
        <span class="chip">데이터 없음</span>
      </div>
      <p class="empty">입력한 학과명과 관련된 학과를 찾지 못했습니다.</p>
    `;
    return;
  }

  resultArea.innerHTML = renderSeparatedMajorResults(majorValue, exactMatches, similarMatches);
}

if (searchBtn) {
  searchBtn.addEventListener("click", searchMajor);
}

if (majorInput) {
  majorInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchMajor();
    }
  });
}

if (universityInput) {
  universityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchMajor();
    }
  });

  universityInput.addEventListener("input", renderUniversityMajorSuggestions);
  universityInput.addEventListener("change", renderUniversityMajorSuggestions);
}
