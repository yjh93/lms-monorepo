export const SITE_NAME = '링구아웍스'
export const SITE_DESCRIPTION =
  '임직원 어학교육을 기업 맞춤으로. 비즈니스 영어·일본어·중국어 과정을 온라인과 방문 수업으로 운영합니다.'

/** 절대 URL(OG, sitemap, canonical)에 쓰는 사이트 주소 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)
