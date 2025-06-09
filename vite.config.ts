import { ConfigEnv, defineConfig, loadEnv, UserConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import path, { resolve } from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }: ConfigEnv): UserConfig => {
  // vite打包配置可以根据情景进行配置，决定情景的默认是2个参数：command和mode
  // mode默认是2种数据：'development'和'production'。也可以通过--mode xxx的方式指定其他模式

  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  const env = loadEnv(mode, process.cwd(), '')

  const baseConfig: UserConfig = {
    base: '',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        keep_classnames: true, // 可选：保留所有类名
        keep_fnames: true, // 可选：保留所有函数名
        mangle: {
          reserved: getCommandNames(), // 动态注入不需要压缩的命令名
        },
      },
    },
  }

  return baseConfig
})

// 动态获取 commands 文件夹中的命令名
function getCommandNames() {
  const commandsDir = path.resolve(__dirname, 'src/core/command/commands') // 命令文件夹路径
  const files = fs.readdirSync(commandsDir) // 读取文件夹中的所有文件
  const commandNames: string[] = []
  files.forEach((file) => {
    if (file.endsWith('.ts')) {
      const commandName = path.basename(file, '.ts').toUpperCase()
      commandNames.push(commandName)
    }
  })
  return commandNames
}
