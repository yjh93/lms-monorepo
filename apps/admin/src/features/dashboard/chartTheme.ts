/**
 * 차트 색/잉크 토큰.
 * 범주형 4색은 고정 순서(파랑·주황·청록·노랑)로 배정하고, 색각이상(CVD) 인접 쌍 ΔE ≥ 9 를
 * 검증 스크립트로 확인했다. 청록·노랑은 흰 배경 대비 3:1 미만이라 범례 + 표 보기를 함께 제공한다.
 */
export const CHART = {
  surface: '#ffffff',
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'] as const,
} as const
