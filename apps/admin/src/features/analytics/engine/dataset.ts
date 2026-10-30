import { FIRST_HOUR, SLOT_COUNT } from './types'

/**
 * 대용량 출석 로그를 열(column) 단위 TypedArray로 보관한다.
 * 30만 건을 객체 배열로 들고 있으면 수십 MB가 되지만, 열마다 고정 크기 배열을 쓰면
 * 레코드당 약 12바이트(전체 4MB 안팎)로 줄고 필터·집계 루프도 캐시 친화적으로 돈다.
 */
export interface Dataset {
  size: number
  /** 1970-01-01부터의 일 수(UTC) */
  day: Int32Array
  weekday: Uint8Array
  slot: Uint8Array
  minute: Uint8Array
  status: Uint8Array
  company: Uint8Array
  teacher: Uint8Array
  course: Uint8Array
  student: Uint16Array
  companies: string[]
  teachers: string[]
  courses: { title: string; language: 'EN' | 'JA' | 'ZH' }[]
  students: string[]
  /** 데이터셋 기준 "오늘"(일 수) */
  today: number
}

const COMPANIES = [
  '한빛전자',
  '누리물산',
  '푸른제약',
  '세움건설',
  '다온금융',
  '미래모빌리티',
  '가람식품',
  '새솔통신',
  '하늘항공',
  '바른로지스',
  '온빛에너지',
  '이음소프트',
]
const TEACHERS = [
  'Emily Carter',
  'James Wilson',
  'Sarah Lee',
  'Daniel Park',
  'Olivia Brown',
  'Michael Kim',
  '다나카 유키',
  '사토 하루카',
  '왕리',
  '천샤오밍',
]
const COURSES: Dataset['courses'] = [
  { title: '비즈니스 영어 회화', language: 'EN' },
  { title: '영어 프레젠테이션', language: 'EN' },
  { title: '영문 이메일 라이팅', language: 'EN' },
  { title: 'OPIc 대비', language: 'EN' },
  { title: '비즈니스 일본어 회화', language: 'JA' },
  { title: 'JLPT N2 대비', language: 'JA' },
  { title: '비즈니스 중국어 회화', language: 'ZH' },
  { title: 'HSK 5급 대비', language: 'ZH' },
]
const FAMILY = '김이박최정강조윤장임한오서신권황안송류홍'
const GIVEN = [
  '민준',
  '서연',
  '도윤',
  '하윤',
  '시우',
  '지우',
  '주원',
  '서윤',
  '예준',
  '지민',
  '하준',
  '수아',
  '지호',
  '채원',
  '준서',
  '지유',
  '현우',
  '다은',
  '건우',
  '소율',
  '우진',
  '예린',
  '선우',
  '나은',
]

/** 시드 고정 난수(mulberry32) */
function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 시간대별 출석 경향: 이른 아침·늦은 저녁은 낮고, 점심·저녁 초반은 높다. */
const SLOT_FACTOR = [
  -0.09, -0.05, -0.02, 0, 0.03, 0.04, 0.01, -0.01, -0.02, -0.03, 0.02, 0.01, -0.04, -0.08,
]
/** 요일별 경향: 월요일·금요일이 낮다. */
const WEEKDAY_FACTOR = [-0.04, 0.01, 0.02, 0.01, -0.06, -0.03, -0.05]

export function toDayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
}

export function dayToISO(day: number) {
  return new Date(day * 86_400_000).toISOString().slice(0, 10)
}

export function generateDataset(size: number, today: Date, seed = 20261030): Dataset {
  const random = createRandom(seed)
  const pick = (n: number) => Math.floor(random() * n)

  const students = Array.from(
    { length: 2400 },
    () => `${FAMILY[pick(FAMILY.length)]}${GIVEN[pick(GIVEN.length)]}`,
  )
  // 고객사마다 기본 출석 성향이 다르다.
  const companyBias = COMPANIES.map(() => (random() - 0.5) * 0.12)
  const studentCompany = Uint8Array.from(students, () => pick(COMPANIES.length))

  const ds: Dataset = {
    size,
    day: new Int32Array(size),
    weekday: new Uint8Array(size),
    slot: new Uint8Array(size),
    minute: new Uint8Array(size),
    status: new Uint8Array(size),
    company: new Uint8Array(size),
    teacher: new Uint8Array(size),
    course: new Uint8Array(size),
    student: new Uint16Array(size),
    companies: COMPANIES,
    teachers: TEACHERS,
    courses: COURSES,
    students,
    today: toDayNumber(today),
  }

  for (let i = 0; i < size; i++) {
    // 최근 365일에 고르게 분포, 주말은 드물게
    let ago = pick(365)
    let day = ds.today - 1 - ago
    let weekday = (((day + 3) % 7) + 7) % 7 // 1970-01-01은 목요일(3)
    if (weekday >= 5 && random() < 0.85) {
      ago = (ago + (7 - weekday)) % 365
      day = ds.today - 1 - ago
      weekday = (((day + 3) % 7) + 7) % 7
    }
    const slot = pick(SLOT_COUNT)
    const student = pick(students.length)
    const company = studentCompany[student]!
    const course = pick(COURSES.length)

    // 최근으로 올수록 출석률이 조금씩 오르는 추세
    const trend = ((365 - ago) / 365) * 0.04
    const present =
      0.78 + companyBias[company]! + SLOT_FACTOR[slot]! + WEEKDAY_FACTOR[weekday]! + trend
    const roll = random()
    const status = roll < present ? 0 : roll < present + 0.08 ? 1 : roll < 0.965 ? 2 : 3

    ds.day[i] = day
    ds.weekday[i] = weekday
    ds.slot[i] = slot
    ds.minute[i] = random() < 0.5 ? 0 : 30
    ds.status[i] = status
    ds.company[i] = company
    ds.teacher[i] = (course * 3 + pick(3)) % TEACHERS.length
    ds.course[i] = course
    ds.student[i] = student
  }
  return ds
}

export function datasetBytes(ds: Dataset) {
  return [
    ds.day,
    ds.weekday,
    ds.slot,
    ds.minute,
    ds.status,
    ds.company,
    ds.teacher,
    ds.course,
    ds.student,
  ].reduce((sum, column) => sum + column.byteLength, 0)
}

export function slotLabel(slot: number) {
  return `${String(FIRST_HOUR + slot).padStart(2, '0')}시`
}
