import { LEVELS, STUDENT_STATUSES, type Student, type StudentFormValues } from '../schemas/student'
import { createRandom } from './random'

const FAMILY_NAMES = [
  '김',
  '이',
  '박',
  '최',
  '정',
  '강',
  '조',
  '윤',
  '장',
  '임',
  '한',
  '오',
  '서',
  '신',
]
const GIVEN_NAMES = [
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
]
const ROMAN: Record<string, string> = {
  김: 'kim',
  이: 'lee',
  박: 'park',
  최: 'choi',
  정: 'jung',
  강: 'kang',
  조: 'cho',
  윤: 'yoon',
  장: 'jang',
  임: 'lim',
  한: 'han',
  오: 'oh',
  서: 'seo',
  신: 'shin',
}
export const COMPANIES = [
  '한빛전자',
  '누리물산',
  '푸른제약',
  '세움건설',
  '다온금융',
  '미래모빌리티',
]
const DEPARTMENTS = ['인사팀', '해외영업팀', '연구개발팀', '전략기획팀', '마케팅팀', '구매팀']
const DOMAINS: Record<string, string> = {
  한빛전자: 'hanbit.co.kr',
  누리물산: 'nuri.com',
  푸른제약: 'pureunpharm.com',
  세움건설: 'seum.co.kr',
  다온금융: 'daonfin.com',
  미래모빌리티: 'miraemobility.com',
}

const BASE_DATE = Date.UTC(2026, 0, 5)
const DAY = 86_400_000

function seedStudents(count: number): Student[] {
  const random = createRandom(20261016)
  return Array.from({ length: count }, (_, index) => {
    const family = random.pick(FAMILY_NAMES)
    const given = random.pick(GIVEN_NAMES)
    const company = random.pick(COMPANIES)
    const createdAt = new Date(BASE_DATE + index * DAY * 2 + random.int(0, DAY - 1)).toISOString()
    const enrolledAt = new Date(BASE_DATE + index * DAY * 2 + random.int(0, 14) * DAY)
      .toISOString()
      .slice(0, 10)
    const id = `stu_${String(index + 1).padStart(4, '0')}`
    return {
      id,
      name: `${family}${given}`,
      email: `${ROMAN[family]}.${index + 1}@${DOMAINS[company]}`,
      phone: `010${String(random.int(10000000, 99999999))}`,
      company,
      department: random.pick(DEPARTMENTS),
      level: random.pick(LEVELS),
      status: random.next() < 0.6 ? 'ACTIVE' : random.pick(STUDENT_STATUSES),
      enrolledAt,
      memo: '',
      createdAt,
      updatedAt: createdAt,
    }
  })
}

/** 브라우저/테스트 세션 동안 유지되는 인메모리 DB */
export interface MockDb {
  students: Student[]
  sequence: number
}

export const db: MockDb = { students: [], sequence: 0 }

export function resetMockDb() {
  db.students = seedStudents(137)
  db.sequence = db.students.length
}

resetMockDb()

export function insertStudent(values: StudentFormValues, now = new Date()): Student {
  db.sequence += 1
  const timestamp = now.toISOString()
  const student: Student = {
    id: `stu_${String(db.sequence).padStart(4, '0')}`,
    ...values,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  db.students.unshift(student)
  return student
}
