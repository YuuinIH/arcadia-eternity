import nodeExternals from 'rollup-plugin-node-externals'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

console.log('Rollup 配置加载成功！')
console.log('当前插件列表:', [
  nodeResolve(), 
  nodeExternals(), 
  typescript()
].map(p => p.name))

export default {
  input: 'bin/cli.ts',
  output: {
    dir: './dist',
    format: 'esm',
    preserveModules: false,
  },
  plugins: [
    nodeResolve(),
    nodeExternals(),
    typescript({
      module: 'ESNext',
      tsconfig: './tsconfig.json',
    }),
  ],
}
