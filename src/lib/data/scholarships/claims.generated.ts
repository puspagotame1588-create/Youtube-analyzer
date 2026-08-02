/**
 * GENERATED FILE — do not edit.
 * Source: docs/SCHOLARSHIP_VERIFICATION_2026-08-01.md
 * Rebuild: node scripts/build-scholarship-claims.mjs
 *
 * Every claim below is lifted verbatim from one audited row of the verification
 * report, with its verdict, its exact supporting excerpt and its controlling
 * official URL. Nothing is summarised or inferred.
 */

import type { ScholarshipClaim, ScholarshipGate } from './types';

export const VERIFICATION_DATE = "2026-08-01";
export const PRODUCTION_STATUS = "NOT READY FOR PRODUCTION";

export const SCHOLARSHIP_GATES: Record<string, ScholarshipGate> = {
  "jasso": {
    "pass": 13,
    "mismatch": 0,
    "unconfirmed": 1,
    "gate": "Hold"
  },
  "mext": {
    "pass": 20,
    "mismatch": 0,
    "unconfirmed": 0,
    "gate": "Pass for the two audited 2027 embassy-recommendation categories only"
  },
  "yoneyama": {
    "pass": 17,
    "mismatch": 0,
    "unconfirmed": 0,
    "gate": "Pass for the closed 2026 domestic designated-school route"
  },
  "satoyo": {
    "pass": 15,
    "mismatch": 0,
    "unconfirmed": 0,
    "gate": "Pass for the 2026 autumn round"
  },
  "kyoritsu": {
    "pass": 7,
    "mismatch": 0,
    "unconfirmed": 7,
    "gate": "Hold"
  }
};

export const SCOPE_WARNINGS: Record<string, string | null> = {
  "jasso": null,
  "mext": "these PASS results apply only to the two saved and fully audited 2027 大使館推薦 guidelines: 学部留学生 and 研究留学生. They do not verify other MEXT categories or university-recommendation routes.",
  "yoneyama": "these results cover the closed 2026 domestic designated-school undergraduate/master's/doctoral route, not the separate overseas-applicant, district-encouragement, or club-support programs.",
  "satoyo": null,
  "kyoritsu": "the official recruitment page still shows detailed 2026 terms. The 2027 schedule is public, but a detailed 2027 guideline is not. This section isolates the Foundation's own named award from the two separate awards displayed in the same table."
};

export const SCHOLARSHIP_CLAIMS: ScholarshipClaim[] = [
  {
    "id": "J-01",
    "program": "jasso",
    "statement": "Eligible enrollment categories include graduate schools, universities, junior colleges, KOSEN year 3+, professional-training courses, advanced/special courses, preparatory courses, and Japanese-language institutions, subject to the stated enrollment status.",
    "verdict": "PASS",
    "excerpt": "“我が国の大学院に正規生として在籍…高等専門学校第3学年以上…準備教育課程を設置する教育機関に正規生として在籍…日本語教育機関に在籍”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-02",
    "program": "jasso",
    "statement": "Privately financed means neither a MEXT-funded student nor a foreign-government-dispatched student; residence status must be 「留学」.",
    "verdict": "PASS",
    "excerpt": "“国費外国人留学生及び外国政府の派遣する留学生以外の者。在留資格「留学」を有する者。”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-03",
    "program": "jasso",
    "statement": "Previous-year grade coefficient must be at least 2.30 and expected to be maintained.",
    "verdict": "PASS",
    "excerpt": "“前年度の成績評価係数が…2.30以上であり、給付期間中においてもそれを維持する見込み”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-04",
    "program": "jasso",
    "statement": "Except for 留学生別科, preparatory courses, and Japanese-language institutions, applicants must meet Japanese (JLPT N2+, EJU 200+, or JASSO-recognized equivalent) or English CEFR B2+.",
    "verdict": "PASS",
    "excerpt": "“日本語能力試験N2レベル以上…EJU…200点以上…機構が別に認める語学水準以上” / “CEFRにおいてB2レベル以上” / “留学生別科、準備教育課程、日本語教育機関は除く。”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-05",
    "program": "jasso",
    "statement": "Recipient must be willing to cooperate with JASSO's post-award career-status survey.",
    "verdict": "PASS",
    "excerpt": "“学習奨励費受給後に、機構が在籍大学等を通じて行う進路状況調査に協力する意思を有する者”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-06",
    "program": "jasso",
    "statement": "Average remittances, excluding admission and tuition, must be JPY 90,000 or less per month.",
    "verdict": "PASS",
    "excerpt": "“仕送り（入学金、授業料等を除く。）が平均月額90,000円以下”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-07",
    "program": "jasso",
    "statement": "A supporter living in Japan must have annual income under JPY 5,000,000.",
    "verdict": "PASS",
    "excerpt": "“在日している扶養者がいる場合、その年収が500万円未満”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-08",
    "program": "jasso",
    "statement": "A scholarship that restricts combination with this award cannot be received concurrently.",
    "verdict": "PASS",
    "excerpt": "“学習奨励費との併給を制限されている奨学金等の給付を受けている者ではない”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-09",
    "program": "jasso",
    "statement": "A recipient of JASSO's Student Exchange Support Program is ineligible.",
    "verdict": "PASS",
    "excerpt": "“機構の海外留学支援制度による支援を受けている者ではない”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-10",
    "program": "jasso",
    "statement": "Amount is JPY 48,000 monthly at graduate/undergraduate level and JPY 30,000 at Japanese-language institutions.",
    "verdict": "PASS",
    "excerpt": "“大学院レベル・学部レベル：月額48,000円” / “日本語教育機関：月額30,000円”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-11",
    "program": "jasso",
    "statement": "Payment is in principle April–March for one year or October–March for six months.",
    "verdict": "PASS",
    "excerpt": "“原則として、4月から翌年3月までの1年間、または10月から翌年3月までの6か月間。”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-12",
    "program": "jasso",
    "statement": "Apply through the enrolled institution; school quotas may make application unavailable.",
    "verdict": "PASS",
    "excerpt": "“在籍する大学等の担当者にご確認ください。” / “学校によっては申し込みができないことがあります。”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "J-13",
    "program": "jasso",
    "statement": "Selection is through university/school recommendation.",
    "verdict": "PASS",
    "excerpt": "“大学又は学校からの推薦により採用者を決定します。”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/index.html"
    ]
  },
  {
    "id": "J-14",
    "program": "jasso",
    "statement": "A single student-facing application opening date and deadline are not published; timing is institution-specific.",
    "verdict": "UNCONFIRMED",
    "excerpt": "No student-facing date appears on the reopened page. The only controlling instruction is: “在籍する大学等の担当者にご確認ください。”",
    "sourceUrls": [
      "https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html"
    ]
  },
  {
    "id": "M-01",
    "program": "mext",
    "statement": "Applicants must have nationality of a country with diplomatic relations with Japan; Japanese nationals are generally excluded, subject to the stated dual-national exception.",
    "verdict": "PASS",
    "excerpt": "“日本政府と国交のある国の国籍を有すること。申請時に日本国籍を有する者は原則として募集の対象とならない。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049232_01.pdf"
    ]
  },
  {
    "id": "M-02",
    "program": "mext",
    "statement": "Undergraduate age: born on or after 2002-04-02 in principle; personal circumstances are not accepted as exceptions.",
    "verdict": "PASS",
    "excerpt": "“原則として2002年４月２日以降に出生した者” / “個人的事情…は一切認めない。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049232_01.pdf"
    ]
  },
  {
    "id": "M-03",
    "program": "mext",
    "statement": "Undergraduate education: one of the stated university-entry equivalents, including 12 years of schooling, corresponding upper-secondary course, qualifying exam, or another Japanese university-entry qualification.",
    "verdict": "PASS",
    "excerpt": "“外国において、学校教育における12年の課程を修了した者” / “上記以外で、申請時点で日本の大学入学資格を有する者。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049232_01.pdf"
    ]
  },
  {
    "id": "M-04",
    "program": "mext",
    "statement": "Research age is born on or after 1992-04-02 in principle, and the applicant must meet the relevant graduate-entry qualification.",
    "verdict": "PASS",
    "excerpt": "“原則として1992年４月２日以降に出生した者” / “日本の大学院…の入学資格を有する者”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-05",
    "program": "mext",
    "statement": "Undergraduate must be willing to learn Japanese and in principle receive university education in Japanese; research applicants must be willing to learn Japanese and be able to conduct research and adapt to life in Japan.",
    "verdict": "PASS",
    "excerpt": "“積極的に日本語を学習しようとする意欲…原則として日本語で大学教育を受けようとする者” / “日本で研究に従事し、生活に適応する能力”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049232_01.pdf",
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-06",
    "program": "mext",
    "statement": "A newly obtained 「留学」 visa/residence status is required; an awardee exceptionally already in Japan must change/renew by the end of the prior month.",
    "verdict": "PASS",
    "excerpt": "“「留学」の査証を新規取得し、新規取得した「留学」の在留資格で入国” / “奨学金支給開始予定月の前月末日までに…「留学」に変更又は更新”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-07",
    "program": "mext",
    "statement": "Undergraduate amount is JPY 117,000 monthly.",
    "verdict": "PASS",
    "excerpt": "“月額117,000円を支給する。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049232_01.pdf"
    ]
  },
  {
    "id": "M-08",
    "program": "mext",
    "statement": "Research amounts are JPY 143,000 for preparatory/non-regular, JPY 144,000 for master's/professional, and JPY 145,000 for doctoral.",
    "verdict": "PASS",
    "excerpt": "“予備教育期間及び非正規生 月額143,000円” / “修士課程及び専門職学位課程 月額144,000円” / “博士課程 月額145,000円”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-09",
    "program": "mext",
    "statement": "Regional supplement is JPY 2,000 or JPY 3,000 monthly; amounts can change with the budget.",
    "verdict": "PASS",
    "excerpt": "“月額2,000円又は3,000円を月額単価に加算…各年度で金額は変更される場合がある。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-10",
    "program": "mext",
    "statement": "Undergraduate with preparation: 2027-04–2032-03, or through 2034-03 for medicine, dentistry, veterinary medicine, or six-year pharmacy; direct placement is four or six years.",
    "verdict": "PASS",
    "excerpt": "“2027年４月から2032年３月までの５年間（ただし…2034年３月までの７年間）” / “奨学金支給期間は４年間…６年間”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049232_01.pdf"
    ]
  },
  {
    "id": "M-11",
    "program": "mext",
    "statement": "Research non-regular periods are 2027-04–2029-03 or 2027-09/10–2029-03; regular-course payment follows the standard course period, and no payment is made for a month when status starts after day one.",
    "verdict": "PASS",
    "excerpt": "“2027年４月から2029年３月まで” / “2027年９月…又は2027年10月から2029年３月まで” / “月の途中で学期が開始…当該月の奨学金は支給しない。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-12",
    "program": "mext",
    "statement": "No global deadline: applicants use the deadline set by the Japanese diplomatic mission.",
    "verdict": "PASS",
    "excerpt": "“申請書類の提出期限は在外公館により異なるため、必ず在外公館ホームページ等で確認”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-13",
    "program": "mext",
    "statement": "Embassy-route applications go to the diplomatic mission in the applicant's country of nationality; application is free.",
    "verdict": "PASS",
    "excerpt": "“国籍国内の在外公館にその指定する期限までに提出” / “申請は無料です。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf",
      "https://www.mext.go.jp/a_menu/koutou/ryugaku/06032818.htm"
    ]
  },
  {
    "id": "M-14",
    "program": "mext",
    "statement": "Required document sets and Japanese/English or translated-language rule match the saved undergraduate and research lists.",
    "verdict": "PASS",
    "excerpt": "“○の書類は提出必須…全ての書類は、日本語又は英語…他の言語の場合は…訳文を必ず添付”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-15",
    "program": "mext",
    "statement": "Overlapping applications to other MEXT scholarship programs are prohibited.",
    "verdict": "PASS",
    "excerpt": "“日本政府（文部科学省）奨学金制度による他のプログラムとの重複申請をしている者”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-16",
    "program": "mext",
    "statement": "Planned receipt of scholarships/fellowships funded by the Japanese government or related agencies after MEXT payment begins is disqualifying; receipt of a non-combinable award can stop payment.",
    "verdict": "PASS",
    "excerpt": "“本奨学金支給期間開始後に日本政府及び日本政府関係機関拠出の奨学金・フェローシップ等の受給を予定している者” / “併給が認められていない奨学金…の支給を受けたとき”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf",
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049232_01.pdf"
    ]
  },
  {
    "id": "M-17",
    "program": "mext",
    "statement": "Prior MEXT and current/planned private enrollment exclusions have stated exceptions; JASSO Honors is not counted as prior MEXT.",
    "verdict": "PASS",
    "excerpt": "“過去に日本政府（文部科学省）奨学金留学生であった者…ただし…” / “学習奨励費…は日本政府（文部科学省）奨学金に含まれない。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-18",
    "program": "mext",
    "statement": "Undergraduate selection: diplomatic-mission document, written, and interview screening; MEXT second screening; final notice approximately from February 2027.",
    "verdict": "PASS",
    "excerpt": "“書類審査、筆記試験及び面接試験” / “文部科学省…第２次選考” / “概ね2027年２月以降に通知”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049232_01.pdf"
    ]
  },
  {
    "id": "M-19",
    "program": "mext",
    "statement": "Research selection dates: mission screening May–late July; provisional-acceptance request by 2026-09-01; MEXT selection/placement from November; results January–March 2027.",
    "verdict": "PASS",
    "excerpt": "“５月上旬～７月下旬頃 第１次選考” / “～９月１日 大学への受入内諾依頼” / “11月～ 第２次選考・大学配置” / “2027年１月～３月…通知”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "M-20",
    "program": "mext",
    "statement": "Extension is review-based; research students must pass the intended regular-course exam, and non-regular status itself cannot be extended.",
    "verdict": "PASS",
    "excerpt": "“延長申請に採用され、かつ…正規課程の試験に合格” / “非正規生としての…延長することはできない。”",
    "sourceUrls": [
      "https://www.mext.go.jp/content/20260420-mxt-kotokoku01-000049243_01.pdf"
    ]
  },
  {
    "id": "R-01",
    "program": "yoneyama",
    "statement": "Applicant must pursue a Japanese degree at a MEXT-supervised university/graduate school; evening/weekend-only and distance courses are excluded.",
    "verdict": "PASS",
    "excerpt": "“日本の大学・大学院の学位取得を目的” / “平日夜間および土日のみの授業又は通信教育課程…対象外”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-02",
    "program": "yoneyama",
    "statement": "Regular-student requirement and eligible April 2026 years match the saved undergraduate 3–4, master's 1–2, and doctoral 2–3 rules and listed professional-course equivalents.",
    "verdict": "PASS",
    "excerpt": "“非正規学生でない” / “学部課程3・4年…修士課程1・2年…博士課程2・3年”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-03",
    "program": "yoneyama",
    "statement": "Repeating a year that changes the eligible April course/year removes eligibility.",
    "verdict": "PASS",
    "excerpt": "“留年により…変更となる場合は申込資格を失う。”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-04",
    "program": "yoneyama",
    "statement": "Applicant must be born on or after 1981-04-02.",
    "verdict": "PASS",
    "excerpt": "“1981年4月2日以降に生まれた者”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-05",
    "program": "yoneyama",
    "statement": "Applicant must have non-Japanese nationality in April of the adoption year.",
    "verdict": "PASS",
    "excerpt": "“採用年の4月に日本以外の国籍を有する者。”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-06",
    "program": "yoneyama",
    "statement": "Required status is 「留学」, with the published refugee/evacuee exception; a planned status change required updated evidence by 2026-03-25.",
    "verdict": "PASS",
    "excerpt": "“在留資格「留学」で日本に在留” / “「難民」…「避難民」の認定” / “提出の最終期限は2026年3月25日”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-07",
    "program": "yoneyama",
    "statement": "Applicant must be academically excellent, interested in intercultural understanding/communication, and physically and mentally able to sustain study abroad.",
    "verdict": "PASS",
    "excerpt": "“学業に優れ、異文化理解、コミュニケーション能力に対する関心や意欲” / “心身ともに留学生活に耐えうる健全な者”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-08",
    "program": "yoneyama",
    "statement": "No numeric language score; interview is principally Japanese, prescribed Japanese texts are within 800 characters, and generative AI is prohibited.",
    "verdict": "PASS",
    "excerpt": "“面接は原則として日本語” / “800字以内。日本語で…本人が記入” / “生成AIの使用は不可”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-09",
    "program": "yoneyama",
    "statement": "Amount is JPY 100,000 monthly for undergraduate and JPY 140,000 for master's/doctoral.",
    "verdict": "PASS",
    "excerpt": "“学部課程…月額10万円” / “修士課程…博士課程…月額14万円”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-10",
    "program": "yoneyama",
    "statement": "Award periods and shorter September/October-entry periods match the saved table; course completion can end payment earlier.",
    "verdict": "PASS",
    "excerpt": "“4月以外の入学の場合、奨学期間が短くなる。” / table “奨学期間開始 / 奨学期間終了”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-11",
    "program": "yoneyama",
    "statement": "Foundation deadline was 2025-10-15 23:59 and is closed; schools set earlier internal periods.",
    "verdict": "PASS",
    "excerpt": "“申込締切：2025年10月15日 23:59” / “受付を終了しました” / “各指定校の定める学内募集期間内”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/blog/news/2025/detail_19985.html",
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-12",
    "program": "yoneyama",
    "statement": "No direct individual application: documents go to the designated school, which registers through the dedicated web screen.",
    "verdict": "PASS",
    "excerpt": "“申込書類は指定校担当者に提出…指定校以外からは申し込めません。” / “学校担当者…専用WEB画面で申込申請”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/download",
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-13",
    "program": "yoneyama",
    "statement": "Required documents are the saved items 1–9; residence/admission evidence had a final 2026-03-25 deadline subject to the stated exception.",
    "verdict": "PASS",
    "excerpt": "“①米山記念奨学生申込書” through “⑨合格通知・編入学許可書” / “提出の最終期限は2026年3月25日”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-14",
    "program": "yoneyama",
    "statement": "Other personal scholarships are generally prohibited, including JASSO Honors.",
    "verdict": "PASS",
    "excerpt": "“他の奨学金…原則として併給を認めない” / “留学生受入れ促進プログラム…併給を認めない”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-15",
    "program": "yoneyama",
    "statement": "Published exceptions include loans, TA/RA/internship remuneration and certain benefits; other school awards/research aid must total under JPY 576,000 annually.",
    "verdict": "PASS",
    "excerpt": "“貸与奨学金…TA、RA、インターンシップ等の報酬” / “○金額＜57万6千円 / ×金額≧57万6千円”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-16",
    "program": "yoneyama",
    "statement": "A past Yoneyama recipient cannot reapply; improper concurrent receipt cancels status and requires repayment for the overlap.",
    "verdict": "PASS",
    "excerpt": "“過去に米山奨学金を受給した者には、応募資格はない。” / “資格を取り消し…併給期間分を全額返還”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "R-17",
    "program": "yoneyama",
    "statement": "Selection and continuation obligations match: school screening, district document/interview review, possible written test, orientation/pledge, monthly meeting attendance and two reports yearly.",
    "verdict": "PASS",
    "excerpt": "“学内選考” / “書類審査・面接選考” / “地区によって筆記試験” / “例会へ毎月1回以上出席” / “年2回、奨学生レポート”",
    "sourceUrls": [
      "https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf"
    ]
  },
  {
    "id": "S-01",
    "program": "satoyo",
    "statement": "Undergraduate applicants are at least year two or confirmed transfers; graduate applicants are enrolled or confirmed entrants; shortest-program repeaters are excluded.",
    "verdict": "PASS",
    "excerpt": "“応募時に2年生以上…編入が決定” / “大学院に在籍…入学が決定” / “留年による最短修業年限超過者は対象外”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-02",
    "program": "satoyo",
    "statement": "Nationality is limited to the listed 18 countries; applicant must live in Japan and have no parent employed in Japan.",
    "verdict": "PASS",
    "excerpt": "“日本国及び下記対象国以外の国籍を有していないこと” / “応募時に日本に居住” / “日本で就業している親がいない”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-03",
    "program": "satoyo",
    "statement": "Applicant must hold 「留学：college student」, be privately financed at a MEXT-supervised university, and not be a junior-college or research student.",
    "verdict": "PASS",
    "excerpt": "“在留資格「留学：college student」を有し、文部科学省所轄大学に在籍する私費留学生（短期大学生及び研究生を除く）”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-04",
    "program": "satoyo",
    "statement": "Applicant must not already hold a doctorate and must have at least one year remaining after payments begin.",
    "verdict": "PASS",
    "excerpt": "“「博士」の学位を取得していないこと” / “奨学金受給開始後の課程修学期間が1年以上”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-05",
    "program": "satoyo",
    "statement": "Japanese ability must not hinder study/research; no numeric cutoff is published; scholars must attend six exchange meetings yearly and remain active alumni.",
    "verdict": "PASS",
    "excerpt": "“学業・研究に支障のない日本語能力” / “交流会に出席すること（年6回、主に東京で開催）” / “支援期間終了後も…交流する意思”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-06",
    "program": "satoyo",
    "statement": "Amount is JPY 180,000 monthly undergraduate and JPY 200,000 graduate; two months are deposited every two months to the scholar's own account.",
    "verdict": "PASS",
    "excerpt": "“学部生 月額18万円 / 院生 月額20万円” / “2ヶ月に一度、2ヶ月分を本人名義の口座に振込”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-07",
    "program": "satoyo",
    "statement": "Additional subsidy limits are JPY 500,000 per semester for tuition/fees and JPY 200,000 yearly for graduate conference attendance, with the published carryover/short-enrollment rules.",
    "verdict": "PASS",
    "excerpt": "“授業料等補助金：半期50万円まで（繰越し不可）” / “学会出席補助金…年間20万円を上限（繰越し可）”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-08",
    "program": "satoyo",
    "statement": "Base period is two years: 2026-10–2028-09 or 2027-04–2029-03; undergraduate/doctoral extensions follow the saved conditions, including doctoral review around month 18.",
    "verdict": "PASS",
    "excerpt": "“支給期間2年間” / “2026年10月から2028年9月” / “2027年4月から2029年3月” / “延長審査…約18ヶ月後”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-09",
    "program": "satoyo",
    "statement": "Deadlines are applicant form 2026-08-20 noon, upload A 2026-08-28, and upload B 2026-09-15 noon; university internal deadline is local.",
    "verdict": "PASS",
    "excerpt": "“応募フォームの締切日 2026年8月20日（木）正午” / “A:2026年8月28日（金） B:2026年9月15日（火）正午” / “留学生課への書類の締切日は留学生課に確認”",
    "sourceUrls": [
      "https://sisf.or.jp/ja/about_application_autumn/"
    ]
  },
  {
    "id": "S-10",
    "program": "satoyo",
    "statement": "Route: obtain university approval/management number, submit the Foundation web form, then the university consolidates and uploads documents; July 2026 institution exception is preserved.",
    "verdict": "PASS",
    "excerpt": "“進学先大学の留学生課から応募の承諾を得て管理番号を取得” / “留学生課にて提出書類を取りまとめアップロード” / “2026年7月時点の在籍校…窓口としての応募も可”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-11",
    "program": "satoyo",
    "statement": "Required documents, handwritten Forms 1–3, receipt numbers, and later originals match the saved record.",
    "verdict": "PASS",
    "excerpt": "Table “履歴書1” through “在学証明書（合格証明書）” / “様式1～3は黒のボールペンで自筆” / “すべての提出書類の右上に「受付番号」”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-12",
    "program": "satoyo",
    "statement": "At SISF payment start, no other scholarship/similar money, salary, or unrestricted special-program money may be received; government/public/company-funded students are excluded.",
    "verdict": "PASS",
    "excerpt": "“他の機関から奨学金又はこれに類する金品、給与等を受給していない” / “使途自由な金銭を受給していない” / “国費や公費、社費等…対象としない”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-13",
    "program": "satoyo",
    "statement": "TA/RA pay and repayable scholarships are allowed; a current award is compatible with applying only if it ends before SISF payment begins.",
    "verdict": "PASS",
    "excerpt": "“TA/RAの報酬及び貸与奨学金の受給は可” / “当財団の奨学金支給開始時に、受給が終了している場合は応募できます。”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-14",
    "program": "satoyo",
    "statement": "Selection dates: first-stage result by 2026-11-05; online Japanese interview 2026-11-14 or 15 while in Japan; final result by 2026-11-20; Tokyo ceremony 2026-12-12.",
    "verdict": "PASS",
    "excerpt": "“11月5日まで” / “2026年11月14日又は11月15日…日本語…必ず日本にいること” / “11月20日まで” / “認証式（12月12日 東京）への出席が必須”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "S-15",
    "program": "satoyo",
    "statement": "Rule violations can stop payment or terminate scholar status; adoption of another scholarship must be reported through the university.",
    "verdict": "PASS",
    "excerpt": "“規則に違反した場合、奨学金の停止や奨学生資格を失うことがあります。” / “他の奨学金の採用が決定した場合、大学を通じて…連絡”",
    "sourceUrls": [
      "https://sisf.or.jp/download/%E7%A7%8B%EF%BC%BF%E5%8B%9F%E9%9B%86%E8%A6%81%E9%A0%85/?refresh=6a437fab58fa21782808491&wpdmdl=7069"
    ]
  },
  {
    "id": "K-01",
    "program": "kyoritsu",
    "statement": "Eligible school types for the named award are graduate schools, universities/junior colleges, and professional training colleges; the school must be registered.",
    "verdict": "PASS",
    "excerpt": "“大学院、大学（短期大学）、専門学校” / “当財団の奨学金に応募するには、対象校として登録される必要があります。”",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html",
      "https://kif-org.com/scholarship/list.html"
    ]
  },
  {
    "id": "K-02",
    "program": "kyoritsu",
    "statement": "The saved 24-country/region list matches the 2026 target-country row.",
    "verdict": "PASS",
    "excerpt": "“韓国、中国、台湾、香港、マカオ、モンゴル、ベトナム、ラオス、カンボジア、タイ、ミャンマー、マレーシア、シンガポール、インドネシア、フィリピン、インド、スリランカ、パキスタン、バングラデシュ、ネパール、ブータン、東ティモール、ブルネイ、モルディブ”",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html"
    ]
  },
  {
    "id": "K-03",
    "program": "kyoritsu",
    "statement": "Named 2026 award amount is JPY 110,000 monthly and headcount is 25; JPY 70,000 belongs to separate awards.",
    "verdict": "PASS",
    "excerpt": "“一般財団法人共立国際交流奨学財団奨学金…月額110,000円…25名”",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html"
    ]
  },
  {
    "id": "K-04",
    "program": "kyoritsu",
    "statement": "Published 2026 payment period is 2026-04–2027-03, one year.",
    "verdict": "PASS",
    "excerpt": "“2026年4月～2027年3月（1年間）”",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html"
    ]
  },
  {
    "id": "K-05",
    "program": "kyoritsu",
    "statement": "Route is registered-school recommendation; individual applications are not accepted; recommendation must come from the school of enrollment from April 2026.",
    "verdict": "PASS",
    "excerpt": "“当財団奨学金対象校である学校を通して応募する（学校推薦）” / “留学生の個人応募は受付できません。” / “2026年4月以降在籍校の推薦に限ります。”",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html"
    ]
  },
  {
    "id": "K-06",
    "program": "kyoritsu",
    "statement": "2026 deadline was 2026-01-30 Friday, required to arrive at the Foundation; adoption was early March.",
    "verdict": "PASS",
    "excerpt": "“2026年1月30日（金）※財団必着” / “2026年3月上旬”",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html"
    ]
  },
  {
    "id": "K-07",
    "program": "kyoritsu",
    "statement": "2027 schedule says recruitment begins November 2026, closes 2027-01-29, selection is February, and result notice is March.",
    "verdict": "PASS",
    "excerpt": "“11月 2027年度奨学生 募集開始” / “1/29 2027年度奨学生 募集終了” / “2月 2027年度奨学生選考委員会” / “3月…採用結果 通知”",
    "sourceUrls": [
      "https://kif-org.com/about/schedule.html"
    ]
  },
  {
    "id": "K-08",
    "program": "kyoritsu",
    "statement": "Required visa/residence status for the named award.",
    "verdict": "UNCONFIRMED",
    "excerpt": "No visa or residence-status requirement appears on the reopened 2026 recruitment or overview page.",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html",
      "https://kif-org.com/scholarship/outline.html"
    ]
  },
  {
    "id": "K-09",
    "program": "kyoritsu",
    "statement": "Applicant-level GPA, course year, remaining enrollment, regular-student status, or other academic threshold.",
    "verdict": "UNCONFIRMED",
    "excerpt": "The only related public text is general: “勉学に励むための資金援助”. No applicant-level threshold is published.",
    "sourceUrls": [
      "https://kif-org.com/scholarship/outline.html"
    ]
  },
  {
    "id": "K-10",
    "program": "kyoritsu",
    "statement": "Japanese/English score or interview-language requirement.",
    "verdict": "UNCONFIRMED",
    "excerpt": "No language requirement appears on the reopened 2026 recruitment or overview page.",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html",
      "https://kif-org.com/scholarship/outline.html"
    ]
  },
  {
    "id": "K-11",
    "program": "kyoritsu",
    "statement": "Student application document list.",
    "verdict": "UNCONFIRMED",
    "excerpt": "No student document list appears on the reopened recruitment page; the site directs students to the school office: “学生による個人応募は受け付けていません。学校の担当部署へお問い合わせください。”",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html"
    ]
  },
  {
    "id": "K-12",
    "program": "kyoritsu",
    "statement": "Combination with other scholarships, grants, fee reductions, loans, or employment income.",
    "verdict": "UNCONFIRMED",
    "excerpt": "No combination rule appears on the reopened recruitment or overview page.",
    "sourceUrls": [
      "https://kif-org.com/scholarship/application.html",
      "https://kif-org.com/scholarship/outline.html"
    ]
  },
  {
    "id": "K-13",
    "program": "kyoritsu",
    "statement": "Renewal or continuation after the one-year award.",
    "verdict": "UNCONFIRMED",
    "excerpt": "The only published duration is “支給期間 1年間”; no renewal procedure is stated.",
    "sourceUrls": [
      "https://kif-org.com/scholarship/outline.html"
    ]
  },
  {
    "id": "K-14",
    "program": "kyoritsu",
    "statement": "2027 amount, headcount, country list, detailed eligibility, exact November opening date, and detailed 2027 application route/documents.",
    "verdict": "UNCONFIRMED",
    "excerpt": "The schedule states only “2027年度奨学生 募集開始” and “1/29 2027年度奨学生 募集終了”; no detailed 2027 guideline is linked on the reopened recruitment page.",
    "sourceUrls": [
      "https://kif-org.com/about/schedule.html",
      "https://kif-org.com/scholarship/application.html"
    ]
  }
];
