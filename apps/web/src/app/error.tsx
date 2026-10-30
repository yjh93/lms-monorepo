'use client'

import { useEffect } from 'react'

/** 라우트 단위 에러 경계. retry()는 세그먼트를 다시 불러와 렌더링한다. */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div role="alert" className="mx-auto max-w-xl px-5 py-32 text-center">
      <p className="text-brand-500 text-[15px] font-bold">일시적인 오류</p>
      <h1 className="mt-2 text-[28px] font-bold tracking-[-0.02em]">페이지를 불러오지 못했어요</h1>
      <p className="mt-3 text-[16px] text-gray-600">잠시 후 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="bg-brand-500 hover:bg-brand-600 mt-8 h-12 rounded-xl px-6 text-[15px] font-semibold text-white"
      >
        다시 시도
      </button>
    </div>
  )
}
