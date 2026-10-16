import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { base } from './base.js'

/** React 패키지/앱용 규칙: hooks 규칙과 React Compiler 진단 포함 */
export const react = [
  ...base,
  reactHooks.configs.flat['recommended-latest'] ?? reactHooks.configs.flat.recommended,
  {
    files: ['**/*.tsx'],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['**/*.stories.tsx', '**/*.test.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
]

export default react
