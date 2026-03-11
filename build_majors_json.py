import json
import re
from collections import OrderedDict
from pathlib import Path

import pandas as pd

BASE = Path(".")
XLSX_PATH = BASE / "2028학년도 권역별 대학별 권장과목-대교협.xlsx"
OUTPUT_PATH = BASE / "majors.json"


UNIV_ALIAS = {
    "서울대학교": "서울대",
    "고려대학교": "고려대",
    "중앙대학교": "중앙대",
    "경희대학교": "경희대",
    "동국대학교": "동국대",
    "건국대학교": "건국대",
    "경북대학교": "경북대",
    "부산대학교": "부산대",
    "서울시립대학교": "서울시립대",
    "서울과학기술대학교": "서울과기대",
    "한국항공대학교": "한국항공대",
    "국립한밭대학교": "국립한밭대",
    "가톨릭대학교": "가톨릭대",
    "덕성여자대학교": "덕성여대",
    "단국대학교": "단국대",
    "아주대학교": "아주대",
    "영남대학교": "영남대",
    "전남대학교": "전남대",
    "전북대학교": "전북대",
    "충남대학교": "충남대",
    "충북대학교": "충북대",
    "인하대학교": "인하대",
    "광운대학교": "광운대",
    "숭실대학교": "숭실대",
    "한양대학교": "한양대",
}

TARGET_UNIVS = {
    "서울대", "고려대", "중앙대", "경희대", "동국대", "건국대", "경북대", "부산대"
}

CATEGORY_KEYWORDS = OrderedDict([
    ("국어국문", "인문"),
    ("문예창작", "인문"),
    ("영어", "인문"),
    ("일본", "인문"),
    ("중어", "인문"),
    ("철학", "인문"),
    ("사학", "인문"),
    ("역사", "인문"),
    ("교육", "교육"),
    ("수학교육", "교육"),
    ("국어교육", "교육"),
    ("지리교육", "교육"),
    ("사회학", "사회"),
    ("행정", "사회"),
    ("정치", "사회"),
    ("경제", "사회"),
    ("국제통상", "사회"),
    ("미디어", "사회"),
    ("사회복지", "사회"),
    ("경영", "사회"),
    ("회계", "사회"),
    ("법학", "사회"),
    ("컴퓨터", "컴퓨터"),
    ("소프트웨어", "컴퓨터"),
    ("AI", "컴퓨터"),
    ("인공지능", "컴퓨터"),
    ("데이터", "컴퓨터"),
    ("정보통신", "컴퓨터"),
    ("반도체", "공학"),
    ("전자", "공학"),
    ("전기", "공학"),
    ("기계", "공학"),
    ("로봇", "공학"),
    ("건설", "공학"),
    ("건축", "공학"),
    ("환경공학", "공학"),
    ("산업시스템", "공학"),
    ("에너지", "공학"),
    ("신소재", "공학"),
    ("화공", "공학"),
    ("화학공학", "공학"),
    ("화공생명", "공학"),
    ("화공생물", "공학"),
    ("고분자", "공학"),
    ("수학과", "자연"),
    ("화학과", "자연"),
    ("통계", "자연"),
    ("물리", "자연"),
    ("생명과학", "자연"),
    ("생명공학", "자연"),
    ("의생명", "자연"),
    ("약학", "의약"),
    ("의예", "의약"),
])

REGION_MAP = {
    "서울": "수도권",
    "인천": "수도권",
    "경기": "수도권",
    "부산": "영남권",
    "대구": "영남권",
    "경북": "영남권",
    "경남": "영남권",
    "대전": "중부권",
    "강원": "중부권",
    "충북": "중부권",
    "충남": "중부권",
    "광주": "호남·제주권",
    "전북": "호남·제주권",
    "전남": "호남·제주권",
    "제주": "호남·제주권",
}


def clean_text(value):
    if pd.isna(value):
        return ""
    text = str(value)
    text = text.replace("\n", " ").replace("\r", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_university(name):
    name = clean_text(name)
    if name in UNIV_ALIAS:
        return UNIV_ALIAS[name]
    return name.replace("대학교", "대").replace("여자대학교", "여대").strip()


def split_subjects(text):
    text = clean_text(text)
    if not text or text == "-" or text == "　-":
        return []

    text = text.replace("·", ",")
    text = text.replace(" / ", ",")
    text = text.replace("/", ",")
    text = text.replace("，", ",")
    text = text.replace(";", ",")
    text = text.replace(" 또는 ", ", ")
    text = text.replace(" 중 ", ", ")
    text = text.replace(" 中 ", ", ")
    text = text.replace("  ", " ")

    parts = re.split(r",|\s{2,}", text)
    cleaned = []
    for p in parts:
        p = clean_text(p)
        if not p:
            continue
        if p in {"-", "　-", "없음"}:
            continue
        cleaned.append(p)

    deduped = []
    seen = set()
    for item in cleaned:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped


def infer_category(name):
    for keyword, category in CATEGORY_KEYWORDS.items():
        if keyword in name:
            return category
    return "기타"


def extract_area(sheet_name):
    for area in REGION_MAP:
        if area in sheet_name:
            return area
    return ""


def build():
    xls = pd.ExcelFile(XLSX_PATH)

    universities = OrderedDict()

    for sheet_name in xls.sheet_names:
        df = pd.read_excel(XLSX_PATH, sheet_name=sheet_name)
        df.columns = [clean_text(c) for c in df.columns]

        if not {"대학명", "모집단위"}.issubset(df.columns):
            continue

        area = extract_area(sheet_name)
        region = REGION_MAP.get(area, "")

        for _, row in df.iterrows():
            university_raw = clean_text(row.get("대학명", ""))
            major_name = clean_text(row.get("모집단위", ""))

            if not university_raw or not major_name:
                continue

            university = normalize_university(university_raw)

            if university not in TARGET_UNIVS:
                continue

            core = split_subjects(row.get("핵심과목", ""))
            recommended = split_subjects(row.get("권장과목", ""))
            note = split_subjects(row.get("비고", ""))

            major_obj = {
                "name": major_name,
                "category": infer_category(major_name),
                "coreSubjects": core,
                "recommendedSubjects": recommended,
                "otherSubjects": note
            }

            if university not in universities:
                universities[university] = {
                    "university": university,
                    "region": region,
                    "area": area,
                    "majors": []
                }

            universities[university]["majors"].append(major_obj)

    # 중복 학과 병합
    result = []
    for university, payload in universities.items():
        merged = OrderedDict()

        for major in payload["majors"]:
            name = major["name"]
            if name not in merged:
                merged[name] = {
                    "name": name,
                    "category": major["category"],
                    "coreSubjects": [],
                    "recommendedSubjects": [],
                    "otherSubjects": []
                }

            for key in ["coreSubjects", "recommendedSubjects", "otherSubjects"]:
                for item in major[key]:
                    if item not in merged[name][key]:
                        merged[name][key].append(item)

        payload["majors"] = list(merged.values())
        result.append(payload)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"생성 완료: {OUTPUT_PATH}")


if __name__ == "__main__":
    build()
