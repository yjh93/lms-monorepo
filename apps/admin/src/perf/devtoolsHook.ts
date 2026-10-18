/**
 * React DevTools 전역 훅을 흉내 내 "실제로 다시 실행된 컴포넌트"를 센다.
 * react-dom이 로드되기 전에 설치돼야 하므로 perf 설정의 첫 번째 setupFile로 둔다.
 *
 * 판정 기준(DevTools의 하이라이트 업데이트와 같은 원리):
 * - 이번 커밋의 Fiber 객체가 직전 커밋 트리에 없던 객체이고(= 새로 작업된 Fiber)
 * - PerformedWork 플래그가 켜져 있으면(= 함수 컴포넌트 본문이 실행됨) 렌더링된 것으로 본다.
 * memo/컴파일러로 bailout된 컴포넌트는 Fiber가 복제돼도 PerformedWork가 꺼져 있다.
 */

const PERFORMED_WORK = 0b1
const FUNCTION_COMPONENT = 0
const FORWARD_REF = 11
const SIMPLE_MEMO_COMPONENT = 15

interface Fiber {
  tag: number
  type: { displayName?: string; name?: string; render?: { name?: string } } | null
  flags: number
  child: Fiber | null
  sibling: Fiber | null
}

const counts = new Map<string, number>()
let previousFibers = new WeakSet<Fiber>()
let enabled = false

function nameOf(fiber: Fiber) {
  const type = fiber.type
  return type?.displayName || type?.name || type?.render?.name || '(anonymous)'
}

function walk(fiber: Fiber | null, current: WeakSet<Fiber>) {
  while (fiber) {
    current.add(fiber)
    const isComponent =
      fiber.tag === FUNCTION_COMPONENT ||
      fiber.tag === FORWARD_REF ||
      fiber.tag === SIMPLE_MEMO_COMPONENT
    if (
      enabled &&
      isComponent &&
      !previousFibers.has(fiber) &&
      (fiber.flags & PERFORMED_WORK) === PERFORMED_WORK
    ) {
      const name = nameOf(fiber)
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    walk(fiber.child, current)
    fiber = fiber.sibling
  }
}

;(globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  supportsFiber: true,
  isDisabled: false,
  renderers: new Map(),
  inject: () => 1,
  checkDCE: () => {},
  onScheduleFiberRoot: () => {},
  onCommitFiberUnmount: () => {},
  onPostCommitFiberRoot: () => {},
  onCommitFiberRoot: (_id: number, root: { current: Fiber }) => {
    const current = new WeakSet<Fiber>()
    walk(root.current, current)
    previousFibers = current
  },
}

export const renderCounter = {
  start() {
    counts.clear()
    enabled = true
  },
  stop() {
    enabled = false
    return new Map(counts)
  },
}
