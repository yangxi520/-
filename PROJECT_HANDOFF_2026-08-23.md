# 古书派紫微项目交接总结

> 交接时间：2026-08-23 20:43（UTC+7）  
> 交接对象：下一位接手开发与验收的 AI  
> 当前原则：先本地审查，未经用户明确同意不得提交到远端或部署上线。

## 1. 一句话状态

线上站点当前运行 Git 提交 `be1f709`，Vercel 部署成功；今天后续完成的闰月排盘、三种紫微专业盘、六层四化、箭头解释、常用菜单和严格格局分析仍在本地 dirty worktree 中，已经通过 62 项测试，但尚未 commit、push、build 或部署。

## 2. 项目入口与仓库

| 项目 | 当前值 |
| --- | --- |
| 本地路径 | `/Users/yangxiangdong/Documents/Codex/2026-07-26/ni/work/ziwei-domain-check` |
| GitHub | `https://github.com/yangxi520/-.git` |
| 仓库可见性 | Public |
| 分支 | `main` |
| 本地/远端 HEAD | `be1f709f80bfad44aca3a5a2ece8dc1b5c801d19` |
| HEAD 提交 | `fix: disambiguate overlapping fly arrows` |
| 自定义域名 | `https://www.gushupaiapp.online/` |
| 本地验收 | `http://127.0.0.1:5177/` |

当前 GitHub `main`、`origin/main`、本地 HEAD 三者一致。当前工作区的新增功能没有进入远端。

## 3. 用户明确要求，必须遵守

1. 所有改动先在本地内部审查，不要频繁上线；用户最终验收时再集中发布。
2. 用户电脑只有 16GB 内存：测试、lint、typecheck、开发预览都要限制 Node 内存，避免并行执行大任务。
3. 生产构建只在最终验收前运行；本轮没有运行 `npm run build`。
4. 紫微斗数、四化箭头和格局必须来自真实命盘与明确规则，不能为了让页面有内容而自创判定。
5. 不得丢失当前未提交改动；禁止 `git reset --hard`、`git checkout -- .` 或其他覆盖 dirty worktree 的操作。
6. 未取得用户明确上线许可前，不得 `git push`、不得运行 Vercel 生产部署、不得修改 DNS。

## 4. 产品定位

这是一个面向手机端的中文传统术数单页应用，当前主要模块包括：

- 紫微斗数生辰录入与十二宫专业排盘；
- 三合、飞星、四化三种紫微盘式；
- 本命、大限、流年、流月、流日、流时选择；
- 八字四柱、大运和流年专业盘；
- 首页今时、今日、今月、今年运势摘要；
- 命盘档案、JSON 导入导出；
- 金钱卦、课程入口等辅助模块；
- AI 分析话术预览与复制。

注意：目前所谓“AI 分析”主要是根据命盘事实生成提示词/话术并复制，不是站内已经接入模型 API 的自动推理服务。

## 5. 技术架构

- React 19 + Vite 7 单页应用；没有 React Router，`src/App.jsx` 使用 `view` 状态切换页面。
- 紫微核心：`iztro@2.5.3`。
- 历法/八字辅助：`lunar-javascript@1.7.7`。
- UI：普通 CSS、Tailwind 工具类和 lucide 图标混合使用。
- 数据：浏览器 `localStorage`，没有后端、账号系统、数据库或云同步。
- 部署：GitHub 连接 Vercel 自动部署。
- 缓存：`src/main.jsx` 主动注销旧 Service Worker 并清理 Cache Storage，解决自定义域名显示旧包的问题；当前并非真正离线 PWA。

### 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/App.jsx` | 全局页面状态、首页、紫微录入、档案保存/读取、首页运势 |
| `src/components/ProfessionalChart.jsx` | 紫微专业盘、三种盘式、箭头、中宫、时间轴、常用菜单、格局分析、话术 |
| `src/index.css` | 全局、手机端、打印、三种盘式和所有专业盘弹窗样式 |
| `src/utils/ziweiMutations.js` | 十干四化、48 条宫干飞化、离心/向心、六层来源、飞星流年落宫 |
| `src/utils/ziweiBirth.js` | 统一阳历/农历/闰月排盘，阴阳男女计算 |
| `src/utils/ziweiPatterns.js` | 严格格局白名单、星系观察、证据和来源报告 |
| `src/utils/fortuneContext.js` | 当前大限至时层的运限上下文 |
| `src/utils/homeFortune.js` | 首页四个“今”运势摘要与隐私安全分享文字 |
| `src/utils/archiveManager.js` | localStorage 档案与 JSON 导入导出 |
| `src/components/BaziDivination.jsx` | 八字专业盘 UI |
| `src/utils/baziChart.js` | 四柱、大运、流年与问真式字段 |

## 6. 线上已发布内容

线上当前停在 `be1f709`。2026-08-22 至 2026-08-23 已发布的主要提交：

| 提交 | 内容 |
| --- | --- |
| `9e44219` | 手机优先的中文 UI 刷新 |
| `c15249d` | 首页每日运势与命盘导出 |
| `7db99f2` | 八字专业盘重设计 |
| `b27f3ea` | 档案管理体验重设计 |
| `4ef6b07` | 沉浸式启动封面 |
| `404cc4b` | 八字学习入口 |
| `60835eb` | 出生日期改成年、月、日顺序 |
| `b48a9aa` | 紫微专业盘重设计 |
| `fc5d0d6` | 紫微关系箭头 |
| `dc3bbb9` | 文墨式高密度紫微盘框架 |
| `3cbcbf0` | 真实四化箭头与飞化线 |
| `42fce48` | 点击箭头解释 |
| `ca644c6`～`be1f709` | 手机点击热区、箭头锚点与重叠修复 |

GitHub 对 `be1f709` 的 Vercel 状态为成功。

## 7. 本地已完成但未上线的工作

### 7.1 紫微出生录入

- 出生日期使用年、月、日三个选择框。
- 阳历、农历统一通过 `createZiweiHoroscope()` 创建命盘。
- 支持真实闰月选择；普通月和闰月严格区分。
- 农历月份按真实 29/30 天限制，非法日期不会静默排盘。
- 闰月标记会随档案保存和读取。
- 按年干阴阳与性别计算“阳男、阴男、阳女、阴女”。

### 7.2 紫微专业盘

- 三合、飞星、四化为三套独立盘式，不再只是切换一个标签。
- 保留完整大限、流年、流月、流日、流时五层时间轴。
- 中宫展示出生公历/农历、钟表时、阴阳男女、五行局、命主身主、命身宫、节气四柱、紫微首限、八字起运和当前查看层级。
- 真太阳时没有出生地点、经度和准确分钟时明确显示“未校正”，不会猜算。
- 子斗算法尚未接入，界面明确标注。

### 7.3 飞星与四化

- 宫干四化直接使用 iztro 当前十干四化配置。
- 十二宫 × 禄权科忌 = 48 条真实宫干飞化。
- A=禄、B=权、C=科、D=忌。
- 方章来源颜色：本命红、大限绿、流年蓝、流月橙、流日紫、流时青。
- 同一星曜来自不同时间层的四化不会被静默覆盖。
- 离心、向心箭头都锚在发起宫；真实落宫只用于解释与核验。
- 飞星模式按真实流年命宫，把一个大限的十年分布到十个宫位。

### 7.4 箭头说明与手机交互

- 首次进入提供“箭头怎么产生”的分步说明。
- 盘面常驻颜色、字母和方向图例。
- 点击箭头、A/B/C/D 或四化方章，显示起宫、宫干、四化表、目标星、落宫、向心/离心和完整推导。
- 扩大手机点击区域并提供选中高亮。
- 1998-01-02 辰时女参考盘的八条自化箭头已有自动化定位测试。

### 7.5 常用功能

左下按钮向上展开八项菜单：

1. AI 分析
2. 格局分析
3. 精简星曜
4. 命盘调整
5. 显示模式
6. 隐藏生辰
7. 截图保存
8. 打印分享

### 7.6 严格格局分析

- “经典格局（完整命中）”和“星系观察”分栏。
- 只有必要条件全部命中、并带规则来源的结果才进入经典格局。
- 取消“武曲七杀同宫结构”“命位无正曜结构”等伪格局结果。
- 不使用“吉、平、凶”填充卡片；格名不直接等同吉凶和事件。
- 每项结果显示逐宫证据、判定条件、限制和来源链接。
- 当前包含 16 条严格规则及 1 条杀破狼星系观察。
- 本版只核验本命；大限格局不能直接复用本命规则，尚未正式启用。

#### 1998-01-02 辰时女参考盘

- 命宫酉：武曲、七杀；
- 财帛巳：廉贞、贪狼；
- 官禄丑：紫微、破军；
- 迁移卯：天府。

当前严格经典格局没有命中；星系观察显示“杀破狼星系”，证据是命宫七杀、财帛贪狼、官禄破军，并明确“不等于古典吉格”。

规则资料：

- https://docs.iztro.com/learn/pattern
- https://docs.iztro.com/learn/ancientBook-1
- https://docs.iztro.com/posts/horoscope

## 8. 当前 Git 工作区

### 已修改但未暂存

- `src/App.jsx`
- `src/components/ProfessionalChart.jsx`
- `src/index.css`
- `src/utils/homeFortune.js`
- `src/utils/ziweiMutations.js`
- `test/professional-chart-ui.test.js`
- `test/ziwei-mutations.test.js`

### 新增且未跟踪

- `src/utils/ziweiBirth.js`
- `src/utils/ziweiPatterns.js`
- `test/ziwei-birth.test.js`
- `test/ziwei-patterns.test.js`
- `PROJECT_HANDOFF_2026-08-23.md`
- `WORKLOG_2026-08-23.md`

当前没有 staged 文件。已跟踪 diff 约为 3042 行新增、196 行删除；四个新代码/测试文件共约 652 行，另有这两份交接文档。

下一位 AI 第一条命令必须是：

```bash
git status --short
```

确认上述 11 个代码路径和两份交接文档都存在后再继续。不要清理工作区。

## 9. 当前验证结果

2026-08-23 本地低内存验证：

- `npm test`：62/62 通过；
- ESLint：通过，仅提示 `baseline-browser-mapping` 数据较旧；
- TypeScript `tsc --noEmit`：通过；
- `git diff --check`：通过；
- 本地格局分析弹窗已用真实 1998 参考盘打开检查，无运行时错误；
- 没有运行生产 build；
- 没有 commit、push 或部署。

可重复命令：

```bash
cd /Users/yangxiangdong/Documents/Codex/2026-07-26/ni/work/ziwei-domain-check

NODE_OPTIONS=--max-old-space-size=512 npm test
NODE_OPTIONS=--max-old-space-size=512 npm run lint
NODE_OPTIONS=--max-old-space-size=512 npm run typecheck
git diff --check
```

低内存本地预览：

```bash
NODE_OPTIONS=--max-old-space-size=768 npm run dev -- --host 127.0.0.1 --port 5177
```

不要同时运行 test、lint、typecheck 和 build。

## 10. 部署与域名风险

1. 自定义域名当前由 Vercel 提供：根域会 308 跳转到 `www.gushupaiapp.online`，www 当前可访问。
2. 同一个 GitHub 提交会被 `ziwei-app` 和 `ziwei` 两个 Vercel 项目重复自动部署。这很可能是部署次数消耗快的主要原因。
3. 最终发布前应先在 Vercel 保留一个正确项目，并断开另一个项目的 Git 自动部署，或配置 Ignored Build Step。
4. 当前仓库没有 `.vercel/project.json`，不要凭猜测操作 Vercel 项目。
5. `src/utils/videoData.js` 仍引用旧资源域 `https://videos.gspzw.store`，发布前需要确认该域仍可用或移除依赖。
6. `vercel.json` 主要配置禁缓存响应头，没有自定义 build/output。

## 11. 已知缺口与风险

### P0：发布前必须处理

- 先人工审查当前 dirty worktree，再决定是否 commit。
- 严格格局规则必须继续由懂紫微的专业人员逐条复核。
- 16 条严格规则中，只有三奇加会、机月同梁、七杀朝斗有专门正例测试；1998 参考盘有反例/分类测试。其余 13 条还缺权威命例 golden tests 和“差一个条件不成立”的反例。
- 解决两个 Vercel 项目重复部署后，才能安排一次集中发布。

### P1：建议下一阶段处理

- `ProfessionalChart.jsx`、`App.jsx` 和 `index.css` 已过大，应拆为盘式、箭头、时间轴、中宫、格局和弹窗组件/hooks。
- `professional-chart-ui.test.js` 主要是源码正则断言，不是真实渲染 E2E；应补 Playwright/浏览器测试。
- 需要 320/333/375/390/430px、横屏、桌面宽屏、iPhone Safari、微信内置浏览器人工验收。
- localStorage 清缓存或换设备会丢档案，应突出 JSON 导出备份；未来若做云同步必须加账号、加密与隐私说明。
- 截图采用 DOM clone + SVG foreignObject + canvas，部分手机浏览器可能失败，需保留打印/PDF退路并真机测试。
- README 仍是 Vite 模板；GitHub 仓库描述仍是旧“AI鉴渣神器”文案；没有 `.github/workflows` CI。
- 格局外部来源链接在国内网络或离线环境可能打不开，未来应在版权许可范围内保存版本化规则摘要。

### 尚未完成或不在当前仓库的请求

- 2019 第 21 题和 2021 第 22 题的题干/答案 UI 没有在当前仓库中搜索到；现在只有两个比赛命例四柱正确性的测试。2019 Q21 用户给出的答案是 D，这部分若仍需要，下一位 AI 要先确认题库数据应放在哪个模块。
- iOS 原生 App 转换没有在当前仓库实施；当前项目是 Web/Vite 应用。
- 真太阳时校正、子斗算法、站内模型 API、云端档案均未完成。

## 12. 下一位 AI 的接手顺序

1. 阅读本文件和 `WORKLOG_2026-08-23.md`。
2. 运行 `git status --short`，保护现有 11 个未提交代码路径和两份交接文档。
3. 使用低内存命令运行 test、lint、typecheck；不要先 build。
4. 打开 `http://127.0.0.1:5177/`，用 1998-01-02 辰时女命依次验收三合、飞星、四化、箭头说明、中宫详情、常用菜单和格局分析。
5. 给 16 条格局建立“规则 ID—来源—必要条件—破格条件—正例—反例”验收表。
6. 补真实浏览器 E2E 与手机宽度验收。
7. 向用户提交本地审查结果；获得明确发布许可后再处理重复 Vercel 项目。
8. 最终阶段低内存 build、建立本地 commit、确认回滚点，再只发布一次。

## 13. 最终发布清单

- [ ] 用户明确批准上线
- [ ] dirty worktree 已人工审查
- [ ] 62 项现有测试继续通过
- [ ] 关键格局规则有专业复核和正反命例
- [ ] 手机真机/微信内置浏览器验收
- [ ] 截图、分享、打印、档案导入导出验收
- [ ] 旧视频域名依赖核对
- [ ] 两个 Vercel 项目重复部署问题解决
- [ ] 低内存生产构建成功
- [ ] 建立可回滚 commit/tag
- [ ] 用户再次确认后 push/部署
- [ ] 自定义域名、HTTPS、缓存与国内访问抽样复核
