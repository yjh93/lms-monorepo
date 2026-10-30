import { base } from '@lms/config/eslint/base'
import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...base,
  ...nextVitals,
  {
    // eslint-config-next는 JS 파일에 별도 파서를 쓰므로 TS 전용 규칙은 TS 파일에만 적용한다.
    files: ['**/*.{js,mjs,cjs}'],
    rules: { '@typescript-eslint/consistent-type-imports': 'off' },
  },
  { ignores: ['.next/**', 'next-env.d.ts'] },
]

export default config
