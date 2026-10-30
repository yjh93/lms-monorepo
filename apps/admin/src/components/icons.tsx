import type { SVGProps } from 'react'

/** 메뉴용 단색 라인 아이콘 (24px 그리드, currentColor) */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  )
}

export const DashboardIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3.5" y="3.5" width="7" height="9" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="2" />
  </Icon>
)

export const UsersIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
    <path d="M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c1.9.7 3.1 2.5 3.5 5.2" />
  </Icon>
)

export const CalendarIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="m9 15 2 2 4-4" />
  </Icon>
)

export const HistoryIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 4v4h4M12 7.5V12l3 2" />
  </Icon>
)

export const LogoutIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14" />
    <path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" />
  </Icon>
)

export const ChartIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 20h16" />
    <rect x="5.5" y="11" width="3" height="6.5" rx="1" />
    <rect x="10.5" y="6.5" width="3" height="11" rx="1" />
    <rect x="15.5" y="9" width="3" height="8.5" rx="1" />
  </Icon>
)
