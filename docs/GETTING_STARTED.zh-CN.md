# Q.E.D. 快速上手指南
> Quod Erat Demonstrandum: 先有证据，再下结论。

本指南专为一线开发者打造：杜绝晦涩理论，无需繁琐步骤。只需一行命令一键安装，秒级接入你的项目，与 AI 智能体高效结对编程。

---

## ⚡ 1. 一行命令一键安装（每台设备仅需一次）

选择适合你操作系统的命令，**无需克隆仓库，无需手动编译**：

### Windows (PowerShell):
```powershell
irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1 | iex
```
*(或直接安装到用户全局环境：`& ([scriptblock]::Create((irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1))) -Target global`)*

### macOS / Linux / WSL (Bash):
```bash
curl -fsSL https://raw.githubusercontent.com/keelbismark/qed/main/install.sh | bash -s -- --target global
```

### 或通过 npm（需 Node.js 18+）：
```bash
npm install -g qed-standard
```

---

## 🚀 2. 在你的项目中接入（仅需 1 条命令）

进入任何项目（新建项目或既有老项目均可）：

```bash
cd C:\Portfolio\OpenAntigravity   # 或你的任意项目路径
qed init
```
*(若未全局安装，可直接执行：`npx qed-standard init`)*

### Q.E.D. 在 50 毫秒内自动完成的事项：
1. **自动探测技术栈**：语言 (Rust, Go, TypeScript, Python)、包管理器、框架与测试运行器。
2. **扫描既有架构负债**：精准定位过大的巨石文件（如 2000+ 行文件）以及缺少测试的盲区。
3. **构建防重复图谱 (Anti-Duplication Atlas)**：扫描已有工具库，防止智能体重复造轮子。
4. **生成项目画像 (`.qed/BRIEF.md`)**：智能体在第 0 轮交互时秒级阅读的上下文简报。
5. **为你的编辑器配置适配器**：自动写入 Antigravity、Cursor、Claude Code、Codex 等规则。
6. **配置 Git 守卫**：开启 `pre-commit` (`qed check`) 与 `pre-push` (`qed test`) 钩子。

> 💡 **想直接在终端中查看整洁的项目画像与负债报告？**  
> 运行：
> ```bash
> qed init --explore
> ```

---

## 💬 3. 日常如何与 AI 智能体配合

有了 `.qed/BRIEF.md` 与内置钩子，**你再也不需要粘贴冗长复杂的 System Prompt**。

在日常提问中，只需带上触发词：**“按照 qed 规范”** 或 **“按照 qed”**：

### 场景 1：排查与修复 Bug
```text
👤 你:   “用户结账点击优惠券时偶发 500 错误，按照 qed 找出根因并修复”

🤖 智能体:
  1. 查阅 .qed/BRIEF.md 并激活 systematic-debugging 技能。
  2. 采集物理日志与异常堆栈（拒绝凭空猜测）。
  3. 编写失败的复现测试 coupon_overflow_test (Red)。
  4. 修复计费服务中的深层根因 (Green)。
  5. 终端运行 `qed check` 并出示真实输出作为证据。
```

### 场景 2：开发新业务功能
```text
👤 你:   “按照 qed 为用户列表添加 CSV 导出功能”

🤖 智能体:
  1. 查阅 Anti-Duplication Atlas：确认已有 CSV 格式化工具，拒绝重复造轮子。
  2. 实现 4 个必备状态：空状态、骨架屏加载态、带重试的错误态、离线降级态。
  3. 遵循“凌晨三点可读性测试”编写易读代码（卫语句、扁平逻辑）。
  4. 跑通单元测试并给出验证结果。
```

---

## 🛡️ 4. 提交前验证 (`qed check`)

当智能体声称任务完成时，只需一条命令验证：

```bash
qed check
```

如果全部合规，将显示绿色通关徽章：
```text
==========================================================
 Q.E.D. High-Assurance Mechanical Verification Engine
 Evidence Before Assertions
==========================================================
Target: C:\Portfolio\OpenAntigravity

✓ Q.E.D. Verification Gate: 100% CLEAN. Zero violations found.
  All 16 pillars and mechanical invariants satisfied.
```

---

## 📋 常用命令速查表

| 目标 | 命令 |
| :--- | :--- |
| **为项目接入 Q.E.D.** | `qed init` |
| **查看项目画像与负债发现** | `qed init --explore` |
| **运行机械验证门禁** | `qed check` |
| **严格模式（警告视为错误）** | `qed check --strict` |
| **全面检查 Git、钩子与适配器健康度** | `qed doctor` |
| **将适配器同步至最新标准** | `qed update` |
| **重新安装 Git 钩子** | `qed hook` |
