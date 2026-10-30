import { expect, test } from '@playwright/test'

test.describe('어드민: 로그인 → 목록 필터 → 수강생 등록', () => {
  test('매니저가 필터로 목록을 좁히고, 새 수강생을 등록한다', async ({ page }) => {
    // 로그인(역할 선택)
    await page.goto('/login')
    await page.getByRole('radio', { name: /운영 매니저/ }).check({ force: true })
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()

    // 목록 필터: URL 쿼리와 동기화
    await page.getByRole('link', { name: '수강생' }).click()
    const table = page.getByRole('table', { name: '수강생 목록' })
    await expect(table.getByRole('row').nth(1)).toBeVisible()
    await page.getByText('휴강', { exact: true }).click()
    await expect(page).toHaveURL(/status=PAUSED/)
    await expect(table.getByRole('row').nth(1)).toContainText('휴강')

    // 새로고침해도 필터가 유지된다
    await page.reload()
    await expect(page.getByRole('checkbox', { name: '휴강' })).toBeChecked()

    // 등록: 공유 스키마 검증 → 정상 등록
    await page.getByRole('button', { name: '수강생 등록' }).click()
    await page.getByLabel(/이름/).fill('홍')
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page.getByText('이름은 2자 이상 입력하세요.')).toBeVisible()

    await page.getByLabel(/이름/).fill('홍길동')
    await page.getByLabel(/이메일/).fill('gildong.e2e@hanbit.co.kr')
    await page.getByLabel(/휴대폰 번호/).fill('010-2222-3333')
    await page.getByLabel(/고객사/).fill('한빛전자')
    await page.getByRole('button', { name: '등록' }).click()

    await expect(page).toHaveURL(/\/students$/)
    await expect(page.getByRole('link', { name: '홍길동' })).toBeVisible()
  })

  test('강사는 대시보드에 접근할 수 없다', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('radio', { name: /강사/ }).check({ force: true })
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page).toHaveURL(/\/lessons$/)

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: '접근 권한이 없습니다' })).toBeVisible()
  })
})
