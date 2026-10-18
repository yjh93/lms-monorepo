/**
 * 차트 색/잉크 토큰 (theme.css의 쿨그레이·브랜드 블루와 맞춤).
 * 범주형 4색은 고정 순서(브랜드 블루·주황·청록·노랑)로 배정하고, 색각이상(CVD) 인접 쌍 ΔE ≥ 9 를
 * 검증 스크립트로 확인했다. 청록·노랑은 흰 배경 대비 3:1 미만이라 범례 + 표 보기를 함께 제공한다.
 */
export const CHART = {
  surface: '#ffffff',
  textPrimary: '#191f28',
  textSecondary: '#4e5968',
  muted: '#8b95a1',
  grid: '#f2f4f6',
  axis: '#e5e8eb',
  series: ['#3182f6', '#eb6834', '#1baf7a', '#eda100'] as const,
} as const
