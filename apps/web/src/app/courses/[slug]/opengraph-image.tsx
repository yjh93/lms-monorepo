import { LANGUAGE_LABEL, LEVEL_LABEL } from '@lms/api-client'
import { ImageResponse } from 'next/og'
import { findCourse } from '@/lib/course-data'
import { SITE_NAME } from '@/lib/site'

export const alt = '강좌 소개 이미지'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** 한글 글리프가 있는 폰트(Pretendard). 받지 못하면 기본 폰트로 그린다. */
async function loadFont() {
  try {
    const response = await fetch(
      'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/alternative/Pretendard-Bold.ttf',
    )
    return response.ok ? await response.arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = findCourse(slug)
  const font = await loadFont()
  // 한글 폰트를 받지 못하면 기본 폰트(라틴 전용)로 그릴 수 있는 영문 텍스트만 쓴다.
  const text = font
    ? {
        site: SITE_NAME,
        meta: course
          ? `${LANGUAGE_LABEL[course.language]} · ${LEVEL_LABEL[course.level]} · ${course.weeks}주 과정`
          : '',
        title: course?.title ?? '기업 어학교육 강좌',
        subtitle: course?.subtitle ?? '',
      }
    : { site: 'Lingua Works', meta: '', title: slug.replaceAll('-', ' '), subtitle: '' }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: '#ffffff',
        fontFamily: font ? 'Pretendard' : undefined,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 32, color: '#191f28' }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#3182f6',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          L
        </div>
        {text.site}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {text.meta && (
          <div style={{ display: 'flex', fontSize: 30, color: '#3182f6' }}>{text.meta}</div>
        )}
        <div style={{ display: 'flex', fontSize: 76, color: '#191f28', letterSpacing: -2 }}>
          {text.title}
        </div>
        {text.subtitle && (
          <div style={{ display: 'flex', fontSize: 34, color: '#4e5968' }}>{text.subtitle}</div>
        )}
      </div>
    </div>,
    { ...size, fonts: font ? [{ name: 'Pretendard', data: font, weight: 700 }] : undefined },
  )
}
