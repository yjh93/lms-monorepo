import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 'use cache' + cacheLife/cacheTag 기반 캐싱과 정적 셸 + 스트리밍
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    // 워크스페이스 패키지를 dist 대신 소스로 직접 참조한다(패키지 빌드 없이 dev/build, 패키지 수정 즉시 반영).
    resolveAlias: {
      '@lms/ui': '../../packages/ui/src/index.ts',
      '@lms/utils': '../../packages/utils/src/index.ts',
      '@lms/api-client/fixtures': '../../packages/api-client/src/fixtures/index.ts',
      '@lms/api-client': '../../packages/api-client/src/index.ts',
    },
  },
}

export default nextConfig
