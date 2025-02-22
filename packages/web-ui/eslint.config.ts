import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import oxlint from 'eslint-plugin-oxlint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

import autoImportConfig from './.eslintrc-auto-import.json' assert { type: 'json' }
const autoImportFlatConfig = {
  languageOptions: {
    globals: autoImportConfig.globals || {}, // 将 globals 移动到 languageOptions 下
  },
}
// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },
  autoImportFlatConfig,

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  oxlint.configs['flat/recommended'],
  skipFormatting,
)
