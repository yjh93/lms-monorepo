'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: ReactNode
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' } as const

/**
 * 네이티브 <dialog> 기반 모달.
 * showModal()이 포커스 트랩, ESC 닫기, 배경 inert, top-layer 렌더링을 브라우저 차원에서 처리한다.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  className,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // ESC: 브라우저 기본 close 대신 상위 상태를 갱신해 open prop과 동기화한다.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // backdrop 클릭 시 닫기
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={cn(
        'shadow-floating m-auto w-[calc(100%-2rem)] rounded-3xl bg-white p-0 backdrop:bg-gray-900/50',
        sizes[size],
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-5 p-7">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-xl font-bold text-gray-900">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1.5 text-[15px] text-gray-600">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="-m-1 flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <span aria-hidden>✕</span>
            </button>
          </header>
          {children && <div className="text-[15px] text-gray-700">{children}</div>}
          {footer && <footer className="mt-2 flex gap-2 [&>*]:flex-1">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
