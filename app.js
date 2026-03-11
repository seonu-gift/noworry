let DATA = [];

const resultArea = document.getElementById("resultArea");
const majorInput = document.getElementById("majorInput");
const majorList = document.getElementById("majorList");
const searchBtn = document.getElementById("searchBtn");

const SIMILAR_MAJOR_MAP = {
  "화학공학과": ["화공생명공학과", "화공생물공학과", "고분자공학과", "신소재공학과", "응용화학과", "융합응용화학과", "배터리소재화학공학과"],
  "화학공학": ["화학공학과", "화공생명공학과", "화공생물공학과", "고분자공학과", "신소재공학과"],
  "화공": ["화학공학과", "화공생명공학과", "화공생물공학과"],
  "화공생명공학과": ["화학공학과", "화공생물공학과", "생명공학과", "고분자공학과", "응용화학과"],
  "화공생물공학과": ["화학공학과", "화공생명공학과", "생명공학과", "고분자공학과"],

  "컴퓨터공학과": ["소프트웨어학과", "인공지능학과", "데이터사이언스학과", "정보통신공학과", "컴퓨터학과", "컴퓨터과학부", "컴퓨터·AI학부"],
  "컴퓨터공학": ["컴퓨터공학과", "컴퓨터학과", "컴퓨터과학부", "컴퓨터·AI학부", "소프트웨어학과"],
  "컴퓨터": ["컴퓨터공학과", "컴퓨터학과", "컴퓨터과학부", "컴퓨터·AI학부", "소프트웨어학과"],
  "소프트웨어학과": ["컴퓨터공학과", "인공지능학과", "데이터사이언스학과"],
  "소프트웨어": ["소프트웨어학과", "컴퓨터공학과", "컴퓨터과학부"],
  "인공지능학과": ["컴퓨터공학과", "소프트웨어학과", "데이터사이언스학과", "컴퓨터·AI학부", "의료인공지능공학과"],
  "인공지능": ["인공지능학과", "의료인공지능공학과", "컴퓨터·AI학부"],

  "기계공학과": ["기계공학부", "기계정보공학과", "기계로봇에너지공학과", "로봇공학과"],
  "기계공학": ["기계공학과", "기계공학부", "기계정보공학과", "기계로봇에너지공학과"],
  "기계": ["기계공학과", "기계공학부", "기계정보공학과", "기계로봇에너지공학과"],

  "전자공학과": ["전기전자공학부", "전자전기공학부", "반도체공학과", "정보통신공학과"],
  "전자공학": ["전자공학과", "전기전자공학부", "전자전기공학부", "정보통신공학과"],
  "전자": ["전자공학과", "전기전자공학부", "전자전기공학부"],

  "신소재공학과": ["화학공학과", "고분자공학과", "재료공학과", "에너지신소재공학과"],
  "신소재": ["신소재공학과", "에너지신소재공학과", "재료공학과"],
  "생명공학과": ["화공생명공학과", "화공생물공학과", "생명과학과", "의생명공학과", "바이오시스템공학과"],
  "생명공학": ["생명공학과", "화공생명공학과", "화공생물공학과", "생명과학과", "의생명공학과"],
  "생명": ["생명공학과", "생명과학과", "의생명과학과", "의생명공학과"],
  "환경공학과": ["환경공학부", "건설환경공학과", "환경안전공학과", "융합환경과학과"],
  "환경공학": ["환경공학과", "환경공학부", "건설환경공학과", "환경안전공학과"],

  "국어": ["국어국문학과", "국어국문·문예창작학부", "국어교육과"],
  "국문": ["국어국문학과", "국어국문·문예창작학부", "국어교육과"],
  "국어국문": ["국어국문학과", "국어국문·문예창작학부", "국어교육과"],
  "문예창작": ["국어국문·문예창작학부"],
  "영문": ["영어영문학부", "영어영문학과"],
  "영어": ["영어영문학부", "영어영문학과"],

  "사회학": ["사회학과", "사회학전공", "사회복지학과", "사회복지학부"],
  "사회": ["사회학과", "사회학전공", "사회복지학과", "사회복지학부"],
  "사회복지": ["사회복지학과", "사회복지학부"],
  "정치": ["정치외교학과", "정치외교학전공"],
  "행정": ["행정학과", "행정학전공"],
  "경제": ["경제학과", "경제학부"],
  "경영": ["경영학과", "경영학부"]
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

    fillMajorDatalist();

    resultArea.innerHTML = `
      <div class="title-row">
        <h2 class="result-title">희망 학과는 무엇인가요?</h2>
        <span class="chip">학과 검색 전용</span>
      </div>
      <p class="empty">
        학과명을 입력하면 주요 대학의 동일 학과와 유사학과 권장과목을 비교해서 보여드립니다.
      </p>
    `;
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

function fillMajorDatalist() {
  if (!majorList) return;

  majorList.innerHTML = "";

  const majors = [...new Set(
    DATA.flatMap(item => (item.majors || []).map(major => major.name).filter(Boolean))
  )]
    .filter(name => !isBroadCategoryName(name))
    .sort((a, b) => a.localeCompare(b, "ko"));

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

function isBroadCategoryName(name) {
  const broadKeywords = [
    "대학",
    "계열",
    "학부대학",
    "자유전공",
    "열린전공"
  ];

  return broadKeywords.some(keyword => name.includes(keyword));
}

function getAllMajorNames() {
  return [...new Set(
    DATA.flatMap(school => (school.majors || []).map(major => major.name)).filter(Boolean)
  )];
}

function tokenizeMajorName(name) {
  return normalizeText(name)
    .replace(/국어국문/g, "국어국문 ")
    .replace(/문예창작/g, "문예창작 ")
    .replace(/국어교육/g, "국어교육 ")
    .replace(/사회학/g, "사회학 ")
    .replace(/사회복지/g, "사회복지 ")
    .replace(/정치외교/g, "정치외교 ")
    .replace(/행정학/g, "행정학 ")
    .replace(/경제학/g, "경제학 ")
    .replace(/경영학/g, "경영학 ")
    .replace(/영어영문/g, "영어영문 ")

    .replace(/화학공학/g, "화학공학 ")
    .replace(/화공생명/g, "화공생명 ")
    .replace(/화공생물/g, "화공생물 ")
    .replace(/고분자/g, "고분자 ")
    .replace(/신소재/g, "신소재 ")
    .replace(/환경공학/g, "환경공학 ")
    .replace(/생명공학/g, "생명공학 ")
    .replace(/의생명/g, "의생명 ")
    .replace(/생명과학/g, "생명과학 ")

    .replace(/컴퓨터공학/g, "컴퓨터공학 ")
    .replace(/컴퓨터과학/g, "컴퓨터과학 ")
    .replace(/컴퓨터ai/g, "컴퓨터ai ")
    .replace(/소프트웨어/g, "소프트웨어 ")
    .replace(/인공지능/g, "인공지능 ")
    .replace(/의료인공지능/g, "의료인공지능 ")
    .replace(/데이터사이언스/g, "데이터사이언스 ")

    .replace(/기계공학/g, "기계공학 ")
    .replace(/기계정보/g, "기계정보 ")
    .replace(/기계로봇에너지/g, "기계로봇에너지 ")
    .replace(/전자공학/g, "전자공학 ")
    .replace(/전자전기/g, "전자전기 ")
    .replace(/전기전자/g, "전기전자 ")
    .replace(/정보통신/g, "정보통신 ")
    .replace(/반도체/g, "반도체 ")

    .replace(/공학과|학과|학부|전공/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function getSimilarMajors(targetMajorName) {
  const allMajors = getAllMajorNames().filter(name => !isBroadCategoryName(name));
  const targetNormalized = normalizeText(targetMajorName);
  const targetTokens = tokenizeMajorName(targetMajorName);

  const manualMatches = (SIMILAR_MAJOR_MAP[targetMajorName] || [])
    .filter(name => allMajors.includes(name));

  const flexibleMatches = allMajors.filter(name => {
    const normalizedName = normalizeText(name);
    const tokens = tokenizeMajorName(name);

    if (normalizedName === targetNormalized) {
      return false;
    }

    // 입력어가 학과명 안에 자연스럽게 포함
    if (
      normalizedName.includes(targetNormalized) ||
      targetNormalized.includes(normalizedName)
    ) {
      return true;
    }

    // 핵심 토큰 공유 (2글자 이상)
    const commonTokens = targetTokens.filter(token =>
      token.length >= 2 && tokens.includes(token)
    );

    if (commonTokens.length >= 1) {
      return true;
    }

    // 짧은 검색어 예외: 시작 부분이 같으면 허용
    if (targetNormalized.length <= 3 && normalizedName.startsWith(targetNormalized)) {
      return true;
    }

    return false;
  });

  return [...new Set([...manualMatches, ...flexibleMatches])].slice(0, 8);
}

function findMajorMatchesAcrossUniversities(inputMajorName) {
  const targetNormalized = normalizeText(inputMajorName);
  const similarMajors = getSimilarMajors(inputMajorName);
  const similarSet = new Set(similarMajors.map(name => normalizeText(name)));

  const exactMatches = [];
  const similarMatches = [];

  DATA.forEach(school => {
    (school.majors || []).forEach(major => {
      if (isBroadCategoryName(major.name)) {
        return;
      }

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

function renderCompareTable(rows, relationLabel) {
  if (!rows.length) {
    return `<div class="footer">${escapeHtml(relationLabel)} 결과가 없습니다.</div>`;
  }

  return `
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>대학명</th>
            <th>학과명</th>
            <th>구분</th>
            <th>핵심 과목</th>
            <th>권장 과목</th>
            <th>기타 추천 과목</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(item => `
            <tr>
              <td>${escapeHtml(item.university)}</td>
              <td>${escapeHtml(item.major.name)}</td>
              <td><span class="relation-badge">${escapeHtml(relationLabel)}</span></td>
              <td>${escapeHtml(formatSubjects(getCoreSubjects(item.major)))}</td>
              <td>${escapeHtml(formatSubjects(getRecommendedSubjects(item.major)))}</td>
              <td>${escapeHtml(formatSubjects(getOtherSubjects(item.major)))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSeparatedMajorResults(inputMajorName, exactMatches, similarMatches) {
  return `
    <div class="title-row">
      <h2 class="result-title">${escapeHtml(inputMajorName)} 검색 결과</h2>
      <span class="chip">정확히 일치 ${exactMatches.length}개</span>
      <span class="chip">유사학과 ${similarMatches.length}개</span>
    </div>

    <p class="summary">
      입력한 학과명과 정확히 일치하는 학과를 먼저 보여드리고,
      주요 대학의 유사학과도 함께 비교할 수 있도록 표로 정리했습니다.
    </p>

    <div class="section">
      <h3>정확히 일치하는 학과</h3>
      ${renderCompareTable(exactMatches, "정확히 일치")}
    </div>

    <div class="section">
      <h3>주요 대학 유사학과</h3>
      ${renderCompareTable(similarMatches, "유사학과")}
    </div>

    <div class="footer">
      유사학과는 학과명 포함 관계, 핵심 토큰 일치, 수동 유사학과 사전을 기준으로 보여줍니다.
    </div>
  `;
}

function searchMajor() {
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
