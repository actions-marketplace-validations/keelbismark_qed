# Q.E.D. 快速上手指南 (Getting Started Guide)
> Quod Erat Demonstrandum: 先有证据，再下结论。

这是一份面向软件工程师与自主 AI 智能体的实战指南：如何安装 Q.E.D.、初始化项目，并在高保证运行时 (High-Assurance Runtime) 下遵循严格的工程标准与 AI 进行结对编程。

---

## 1. 30 秒了解 Q.E.D.

Q.E.D. 不是一段简单的提示词 (Markdown Prompt)，而是一套**确定性的工程运行时与机械验证门禁 (Mechanical Gatekeeper)**。它原生支持主流 AI 编程助手与智能体（包括 Google Antigravity、Cursor、Claude Code、DeepSeek / Continue、Qwen Code 通义千问、Kimi Code 月之暗面、Windsurf 等）。

它机械化地根治生成式 AI 编程的三大通病：
1. **凭空臆测与幻觉 (Zero Speculation)**：禁止猜测接口契约或数据结构，必须基于真实运行时事实与类型定义。
2. **重复造轮子 (Anti-Duplication Radar)**：在编写任何工具函数前，必须先检索既有代码与防重复图谱。
3. **“包过的，相信我” (Verification Gate)**：没有终端真实测试输出的“已修复”声明一律视为无效。

---

## 2. 第一步：全局安装（每台机器一次）

让 `qed` CLI 在终端中全局可用，并为当前用户的各种 IDE 和 AI 环境注册原生插件与技能 (Skills)：

### 方式 A：通过 npm 安装
```bash
npm install -g qed-standard
```

### 方式 B：通过仓库安装脚本
```powershell
# Windows PowerShell
.\install.ps1 -Target global
```
```bash
# Linux / macOS / Git Bash
./install.sh --target global
```

**全局安装生效内容：**
- 写入全局智能体规范文件（`~/.gemini/GEMINI.md`、`~/.cursorrules`、`~/.claude/CLAUDE.md` 等）。
- 在 `~/.gemini/config/plugins/qed` 中部署原生 Q.E.D. 插件，包含启动钩子 (`SessionStart`) 与技能集 (`using-qed`, `systematic-debugging`, `qed-reconnaissance` 等）。
- 将 `qed` 注入系统全局 `PATH`。

---

## 3. 第二步：在项目中初始化 (`qed init`)

在任何代码仓库（无论是新建项目还是既有陈旧项目）的根目录下运行：

```bash
qed init
```
*(若未全局安装，可直接运行：`npx qed-standard init`)*

该命令在 **15–30 毫秒** 内完成执行，并经历 6 个初始化阶段：

1. **技术栈遥测 (Stack Telemetry)**：自动识别编程语言 (TypeScript/JS, Go, Rust, Python 等)、包管理器、框架以及测试运行器。
2. **复杂度评级 (Earned Complexity Profile)**：精确统计有效代码行数 (SLOC) 与文件分布，赋予当前项目对应复杂度层级：
   - `Tier 1 (工具 / 脚本 / CLI)`：1,500 行以下（扁平结构，无多余抽象层）。
   - `Tier 2 (业务服务 / 单体应用)`：1,500 – 20,000 行（模块化，受限 LRU 缓存）。
   - `Tier 3 (平台 / 多租户系统)`：20,000 行以上（自治领域模型）。
3. **架构负债诊断 (Debt Detector)**：机械扫描历史遗留坏味道：
   - 单体巨石文件 (> 600–1000 行或单一文件超过总代码量 35%)。
   - 没必要的企业级过度设计（在微型脚本中强行搭建 `domain/`, `repositories/`）。
   - 测试盲区（总代码 > 300 行却 0 测试覆盖）。
4. **防重复造车图谱 (Anti-Duplication Atlas)**：扫描 `utils/`, `helpers/`, `lib/`, `pkg/` 提取已导出方法，防止智能体重复造轮子。
5. **生成项目画像与配置**：
   - 生成 `.qed/BRIEF.md`（供智能体在第 0 轮交互时秒级建立项目认知）。
   - 生成 `.qedrc.json`（针对当前技术栈量身定制忽略项与规则）。
   - 安装当前环境匹配的适配器 (Cursor, Claude, Antigravity, DeepSeek, Qwen 等)。
   - 在 `README.md` 中嵌入 Q.E.D. 官方徽标。
6. **Git 机械门禁**：安装 `.git/hooks/pre-commit` (`qed check`) 与 `.git/hooks/pre-push` (`qed test`)。

> **提示：** 想要直接在终端中查看生成的项目全景画像与函数图谱，可运行：
> ```bash
> qed init --explore
> ```

---

## 4. 第三步：日常开发中如何配合 AI 智能体

通过 `SessionStart` 钩子与 Turn-0 认知注入，**你再也不用在每次提问时粘贴又臭又长的 Prompt 规则**。

### 触发关键词 (Trigger)
在对话中提及 **“qed”** 或 **“按照 qed 规范”** 即可强制锁定最高严谨度：
> *“按照 qed 规范，为用户钱包增加扣款接口”*  
> *“按 qed 调查登录接口偶发 500 的根因”*

智能体将立即锁定进入 **Mode A（质量优于速度）**：
1. 查阅 `.qed/BRIEF.md` 确认现有工具函数，坚决不写重复代码。
2. 计算变更影响面 (Blast Radius)。
3. 先写一个能复现缺陷或满足需求的失败测试 (Red)。
4. 修复根因并实现功能 (Green)。
5. 执行变异测试 (Mutation Check)。
6. 在终端执行 `qed check`，并给出真实的命令 stdout 作为证明。

### 常见场景 1：排查 Bug 或系统崩溃
你的输入：
> *“系统刚才无故重启了，帮我找原因”* 或 *“结账按钮点击后报 500”*

**智能体在 Q.E.D. 下的行为：**
- 自动激活 `systematic-debugging` 技能。
- 收集真实物理遥测（系统事件日志、Minidump 转储、退出码、网络载荷）。
- 逆向追踪数据流至污染源头。
- 编写最小可复现用例。
- 根治深层缺陷，杜绝 `try {} catch {}` 吞掉异常或伪造假数据。

### 常见场景 2：开发新业务功能
你的输入：
> *“为商品列表增加按日期范围筛选的功能”*

**智能体在 Q.E.D. 下的行为：**
- 查阅 Anti-Duplication Atlas，复用既有时间格式化或请求封装。
- 落实 4 个必选状态：空数据、加载中骨架屏、带重试的错误状态、离线/降级状态。
- 遵循“凌晨三点可读性 (3 AM Test)”：卫语句、扁平结构、语义化命名。

### 支持国内大模型与开发工具
Q.E.D. 原生支持国内主流 AI 编程生态：
- **DeepSeek (V3 / R1)**：配合 Continue 或 `dsh` 自动加载 `.deepseekrules`。
- **通义千问 (Qwen 2.5 Coder)**：自动同步 `.qwenrules` 与 `.qwen/config.json`。
- **月之暗面 (Kimi Code)**：自动注入 `.kimi-plugin/plugin.json` 与 `KIMI.md`。
- **OpenCode**：自动加载插件与规则包。

---

## 5. 第四步：常用 CLI 命令速查

所有 CLI 命令均无外部依赖，绝大多数在 5–15 毫秒内完成：

| 命令 | 用途 |
| :--- | :--- |
| `qed init [path]` | 初始化项目：全栈探测、复杂度评级、防重复图谱、生成 BRIEF.md 与钩子 |
| `qed init --explore` | 在终端中完整打印项目全景画像与已有函数图谱 |
| `qed check [path]` | 机械检查当前仓库，验证 16 项 Q.E.D. 核心反模式 |
| `qed check --strict` | 严格模式（所有警告均升级为阻断错误） |
| `qed check --compact` | 超紧凑单行输出（专门针对 AI 智能体上下文优化） |
| `qed doctor` | 检查仓库健康度：Git 状态、钩子、适配器漂移、REA/CUA 工具、CI 配置 |
| `qed hook` | 重新安装或修复 Git `pre-commit` 与 `pre-push` 钩子 |
| `qed update` | 将当前项目内安装的适配器同步至 Q.E.D. 最新规范 |
| `qed update --global` | 同步更新用户全局目录中的各智能体规范 |
| `qed test` | 运行 Q.E.D. 全量跨平台测试套件 |

---

## 6. 任务验收交付清单 (Verification Gate)

在确认 AI 智能体完成任务或合并代码至主分支前，执行以下四项确认：

- [ ] 终端运行 `qed check` $\rightarrow$ 结果为 **100% CLEAN (0 violations)**。
- [ ] 运行项目自身的测试套件 (`npm test` / `pytest` / `go test ./...`) $\rightarrow$ 全绿通过。
- [ ] 检查 `git diff`：确认没有残留的 `console.log`、空 `catch` 块、`as any` 或临时垃圾文件。
- [ ] Git `pre-commit` 钩子正常拦截并通过验证。
