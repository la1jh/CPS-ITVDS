# CPS-ITVDS

 [English](./README.md) | 中文

 基于 Vue 3 + Vite + TypeScript 的前端管理平台。

 ## 简介

 - 项目名称：CPS-ITVDS
 - 项目定位：前端管理平台与原型展示

 ## 技术栈

 - Vue 3、TypeScript
 - Vite 5、UnoCSS
 - Pinia、Vue Router 4
 - Ant Design Vue 4
 - Axios、ECharts、VXE-Table、xlsx 等

 > 运行时与依赖以 `cps-itvds-admin/package.json` 为准：Node >= 18.12.0，pnpm >= 9.0.2。

 ## 目录结构

 ```
 CPS-ITVDS/
 ├─ cps-itvds-admin/   # 前端应用
 ├─ LICENSE            # 许可证（MIT）
 ├─ README.md          # 英文 README（默认）
 └─ README.zh-CN.md    # 中文 README
 ```

 ## 快速开始

 1) 安装环境

 - Node.js >= 18.12.0
 - pnpm >= 9（推荐使用 corepack 或 `npm i -g pnpm` 安装）

 2) 安装依赖与启动（在子项目目录内执行）

 ```bash
 # 进入前端子项目
 cd cps-itvds-admin

 # 安装依赖
 pnpm install

 # 本地启动（开发）
 pnpm serve  # 等价于 pnpm dev

 # 构建产物
 pnpm build

 # 本地预览（需先构建）
 pnpm preview
 ```

 > 启动后按终端提示访问本地地址（Vite 默认端口一般为 5173，实际以终端输出为准）。

 ## 常用脚本（在 `cps-itvds-admin/` 内）

 - `pnpm serve`：启动开发服务器
 - `pnpm build`：生产构建
 - `pnpm preview`：本地预览打包结果
 - `pnpm lint`：代码风格与语法检查
 - `pnpm type:check`：类型检查（vue-tsc）

 ## 构建与部署

 - 产物位于 `cps-itvds-admin/dist/`，可由任意静态服务器（如 Nginx）托管。
 - 若采用 Docker，可参考 `cps-itvds-admin/README.md` 中的 Docker 指南（支持通过 `VG_BASE_URL` 注入后端服务地址）。

 ## 贡献

 - 分支规范与提交信息可参考 vben admin 的约定（如 feat/fix/docs/chore 等）。
 - 欢迎补充模块文档与设计说明。

 ## 许可证

 - 本项目使用 MIT 许可证。详见根目录 `LICENSE`。

 ## 致谢

 - 本项目基于开源模板 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 进行二次开发。
