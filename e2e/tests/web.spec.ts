import { expect, test } from '@playwright/test'

test.describe('학습자 사이트: 강좌 상세 → 수강 신청', () => {
  test('목록에서 강좌를 열고, 검증 오류를 거쳐 신청을 완료한다', async ({ page }) => {
    await page.goto('/courses')
    await page.getByRole('link', { name: '중국어', exact: true }).click()
    await expect(page).toHaveURL(/language=ZH/)
    await page.getByRole('link', { name: /비즈니스 중국어 회화/ }).click()

    await expect(page).toHaveTitle(/비즈니스 중국어 회화/)
    const form = page.getByRole('form', { name: '수강 신청' })
    await expect(form).toBeVisible()

    // 서버(Server Action)가 공유 스키마로 검증하고 입력값을 유지한다
    await form.getByLabel(/담당자 이름/).fill('홍')
    await form.getByRole('button', { name: '수강 신청하기' }).click()
    await expect(page.getByText('이름은 2자 이상 입력하세요.')).toBeVisible()
    await expect(page.getByText('개인정보 수집·이용에 동의해 주세요.')).toBeVisible()
    await expect(form.getByLabel(/담당자 이름/)).toHaveValue('홍')

    await form.getByLabel(/담당자 이름/).fill('홍길동')
    await form.getByLabel(/회사 이메일/).fill('gildong@hanbit.co.kr')
    await form.getByLabel(/휴대폰 번호/).fill('010-1234-5678')
    await form.getByLabel(/회사명/).fill('한빛전자')
    await form.getByLabel(/인원/).fill('1')
    await form.getByLabel(/개인정보 수집/).check()
    await form.getByRole('button', { name: '수강 신청하기' }).click()

    await expect(page.getByRole('status')).toContainText('신청이 접수되었어요')
  })

  test('SEO: 메타데이터, 구조화 데이터, OG 이미지', async ({ page, request }) => {
    await page.goto('/courses/business-english-conversation')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/courses\/business-english-conversation$/,
    )
    const jsonLd = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    )
    expect(jsonLd).toMatchObject({ '@type': 'Course', name: '비즈니스 영어 회화' })

    const og = await request.get('/courses/business-english-conversation/opengraph-image')
    expect(og.status()).toBe(200)
    expect(og.headers()['content-type']).toContain('image/png')

    const sitemap = await request.get('/sitemap.xml')
    expect(await sitemap.text()).toContain('/courses/hsk-5')
  })

  test('없는 강좌는 404 상태와 안내 화면을 보여준다', async ({ page }) => {
    const response = await page.goto('/courses/no-such-course')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: '찾는 페이지가 없어요' })).toBeVisible()
  })
})
