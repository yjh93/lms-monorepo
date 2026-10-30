import { base } from '@lms/config/eslint/base'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default [
  ...base,
  // 서식은 Prettier가 맡으므로 오류 성격의 규칙(essential)만 쓴다.
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  { ignores: ['public/mockServiceWorker.js'] },
]
