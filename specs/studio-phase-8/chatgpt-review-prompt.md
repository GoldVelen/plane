# 审查任务（把本文件全文贴给 ChatGPT）

你是独立审查员，不是原作者。请审查下面这份 **Studio OS Plane 封闭双人实例「公网可达」方案**。审查标准是：安全、合规、可维护、低耦合、能否被两人真实用起来。不要改代码，不要发明第二套账号/项目/任务系统，不要建议回到旧的 Next.js / Better Auth / Drizzle / BullMQ Studio OS 栈。

## 你必须给出的输出

1. **总评**：GO / GO-WITH-FIXES / NO-GO。一句话理由。
2. **发现列表**：每条带级别 `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`，以及：问题、为什么重要、最小修法。
3. **对三条路径的对比结论**：Cloudflare Tunnel + Access、VPS + Caddy、Tailscale。必须明确推荐一条，并写清为什么另外两条不作为首选。
4. **合规**：在「仅两人、有真实个人数据、以后产品要 AI、现在不对公众提供生成式 AI、但实例会挂到公网域名」的前提下，哪些中国大陆义务现在就触发，哪些仍不触发。
5. **实施顺序**：审查通过后的最小步骤，标出不可逆操作（换密钥、绑域名、对公网开口）。
6. **你不确定的问题**：最多 5 个，不问已经写明的事实。

不要写客套话。不要建议开放注册、不要建议 Mode B（平台代持付费 AI key）在商业政策未定前落地、不要建议 `git push` 或打 `studio-phase-8` 生产 tag。

---

# 提案正文

## 1. 这是什么

Studio OS Plane 是 Plane Community Edition `v1.4.2` 的 fork，在 `plane.studio` 加了一层经营层（组合健康、Feedback、Experiments、Metrics、Weekly Review、只读 GitHub、旧数据导入）。任务、账号、项目、Work Item、搜索、通知全部复用 Plane CE，不再造第二套。

当前运行时是本机隔离 Compose 项目 `studio-plane-phase1`：

- Web：`http://127.0.0.1:3200`（现在是 `react-router dev`，**不是**生产构建）
- API：`http://127.0.0.1:8200`（Docker）
- 工作区：`studio-os`
- 账号：管理员 `studio.admin@local.test`（密码在 gitignored 文件，不在本提案里）
- 开放注册：已关（`ENABLE_SIGNUP=0`）
- 遥测：关；PostHog 空；OTLP 指到 loopback 死端口
- GitHub 收集器：`PENDING_EXTERNAL_CREDENTIAL`（只读，无写/合并权限）
- 运营台尚未接 LLM（`has_llm_configured: false`）

仓库分支 `codex/studio-phase-1`。阶段 0–7 已本地 annotated tag。阶段 8 **没有**生产 tag，也没有 push。

## 2. 已确认的产品事实

| 项     | 事实                                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| 使用者 | 仅操作者和配偶，两人                                                                                                  |
| 数据   | 会进入真实个人信息、真实账号、真实项目经营数据                                                                        |
| AI     | 多个产品深度嵌 AI；**运营台本身暂时不接生成式 AI**；商业政策和 key 模式未定，先用起来                                 |
| 规模   | 封闭测试，不是公测，不是正式运营                                                                                      |
| 访问   | 操作者明确要求 **公网可达**：两人可能同时在外面，不能只绑 `127.0.0.1` 或家庭局域网                                    |
| 不做   | 不向不特定公众提供本控制台；不开放注册；不把 Studio OS 做成对公众的生成式 AI 服务；不在商业政策未定前做 Mode B / 收费 |

操作者曾在 AI 生成工具上线时遇到合规问题。因此：**公网开口是不可逆风险**，本提案审查通过、域名/TLS/主机齐备之前，实例必须继续只听 loopback。

## 3. 法律门（作者结论，请你攻击）

作者把现状判为：**中风险封闭测试 + 公网暴露面**。用户数仍是 2，但攻击面从「本机」变成「任何能打到该主机名的人」。

作者认为 **现在仍不触发**：

- 《生成式人工智能服务管理暂行办法》的「向境内公众提供生成式人工智能服务」（本控制台不对公众提供生成；产品侧 AI 另案）
- 算法备案、对公众的内容审核流水线、公开投诉入口（控制台不是公开服务）

作者认为 **现在就触发 / 必须做到**：

- 个保法、网安法、数据安全法：账号鉴别、最小必要、传输加密、访问控制、备份与泄露响应
- 开放注册必须保持关闭
- 公网必须 HTTPS，必须轮换当前本地占位密钥（`SECRET_KEY`、数据库/Redis/Rabbit/MinIO 密码都是本地默认值，**未在本文件中写出**）
- Admin / god-mode 不得随 Web 一起暴露给公网，或必须另做更强限制

请审查：这个分级是否过宽或过窄。尤其是「两人封闭但挂公网域名」会不会被解释成向公众提供信息服务。

## 4. 已完成（数据层，已在隔离实例落地）

用 Plane 原生 `POST /api/workspaces/studio-os/projects/` 建项目，再用 Studio `PATCH .../profile/` 建经营档案。没有改 Plane 核心模型。

原有：

| 代号 | 名称      | 组合位置                 |
| ---- | --------- | ------------------------ |
| SOS  | Studio OS | FOCUS / BUILD            |
| XYO  | Xyora     | FOCUS / TEST             |
| WRE  | WeatherRE | KEEP_ALIVE / MAINTENANCE |

新建（真实存在的产品，中性默认，避免把猜测写成重点）：

| 代号 | 名称             | product_type        | bucket / stage / priority | 健康节奏   |
| ---- | ---------------- | ------------------- | ------------------------- | ---------- |
| PN   | 腕记 PulseNote   | IOS_APP             | INCUBATING / IDEA / P2    | 不要求推进 |
| LC   | LoveCloud        | IOS_APP             | INCUBATING / IDEA / P2    | 不要求推进 |
| HRV  | HEREVERSE        | OTHER               | INCUBATING / IDEA / P2    | 不要求推进 |
| XYL  | 巡游历           | WECHAT_MINI_PROGRAM | INCUBATING / IDEA / P2    | 不要求推进 |
| BTHB | 拜托拜托         | WECHAT_MINI_PROGRAM | INCUBATING / IDEA / P2    | 不要求推进 |
| HPT  | 历史人物性格测试 | WEB_APP             | INCUBATING / IDEA / P2    | 不要求推进 |

Portfolio GET 现为 9 个项目。新建项目的 `focus_statement` 为空：有非空 Focus 时，INCUBATING 也会被当成「应按节奏推进」。Bucket/Stage/一句话定位仍待两人在 UI 里确认，作者没有编造。

**未做**：配偶账号（还没有邮箱）、GitHub 绑定、公网入口、生产 Web 构建、密钥轮换。

## 5. 公网方案（尚未实施，本审查的对象）

目标：两人在外网用浏览器登录这套经营台，读写真数据。不是公开 SaaS，不是开放注册。

### 5.1 明确拒绝

- 家宽路由器把 `3200` / `8200` 端口映射到公网（Vite dev + Django，无 TLS，密钥是本地占位）
- 继续用 `react-router dev` 对公网提供 Web
- `ENABLE_SIGNUP=1`
- 把 `.audit-credentials`、数据库 dump、GitHub token 提交进 git
- 给 GitHub 写/合并权限
- 现在就给运营台接生成式 AI

### 5.2 三条候选

**路径 A（作者主推）：Cloudflare named tunnel + Cloudflare Access**

- 本机或一台小 VPS 只出站，打 named tunnel 到 `https://studio.<已有域名>`
- Cloudflare Access 只允许两个邮箱（操作者、配偶）走 Google / 一次性 PIN / IdP；通过后再进 Plane 登录
- Web 用生产构建，反代到同一 origin 或 `app.` / `api.` 两个子域；`ALLOWED_HOSTS`、CORS、CSRF trusted origins 只含这些主机名
- 不开放入站端口，家宽 CGNAT 也能用
- 代价：依赖 Cloudflare；中国大陆访问 Cloudflare 不稳定时两人会打不开（操作者在中国大陆，这是真实风险）

**路径 B：小 VPS + Caddy 自动 HTTPS**

- 域名 A/AAAA 指到 VPS；Caddy 反代生产 Web 与 API
- 防火墙只开 443；fail2ban / 限流；禁用注册；god-mode 不反代或另加 IP 限制
- 密钥全部轮换；Postgres 不暴露公网
- 代价：要选机房（大陆 ICP / 境外延迟）、要自己运维 TLS 与备份；VPS 被扫是常态

**路径 C：Tailscale / Headscale**

- 不是公网主机名，但是外网可访问
- 攻击面最小
- 代价：配偶设备要装客户端；操作者已明确倾向「公网」，因为「在外面也要能打开浏览器就进」

作者建议：**先用路径 A 做两人封闭公网**；若确认必须大陆网络稳定，再改路径 B 并处理域名与备案。路径 C 只作为对照，不违背「能在外面打开」，但违背「普通浏览器打开公网 URL」的偏好。

### 5.3 公网开口前的硬门禁（任一路径都要）

1. 轮换 `SECRET_KEY`、Postgres、Redis、RabbitMQ、MinIO 密码；旧值视为已在本机出现过，不用于任何共享主机。
2. Web 改为生产构建，不再对公网跑 `react-router dev`。
3. `ENABLE_SIGNUP` 保持 0；配偶用 Plane 工作区邀请，不用第二套登录。
4. HTTPS only；HSTS；会话 Cookie Secure / SameSite。
5. Admin god-mode 不进同一公网主机名。
6. 备份加密，restore 演练仍禁止打到公网库。
7. 有域名、有配偶登录邮箱之后才开口。没有这两项就继续 loopback。
8. 日志与备份不含密码。泄露则立刻轮换。

### 5.4 运营台与产品 AI 的边界

- 本控制台：先不接生成式 AI。
- 产品（Xyora 等）若已对 **产品的终端用户** 提供生成内容，那是产品自己的标识/备案问题，不靠本控制台「挂了公网」来满足或豁免。
- 以后给控制台加 AI：默认 Mode A（自己的 key 进密钥管理，不进 git，不进浏览器包）。AI 不得自动改 Release / Decision / Risk / convert-to-issue。

## 6. 请你重点攻击的点

1. 「两人封闭 + 公网域名」是否已经被当成公开信息服务，从而必须做作者认为「还不需要」的义务。
2. Cloudflare Access 双门（Access + Plane 登录）是否足够，还是必须再加 IP 允许名单 / 硬件密钥。
3. 路径 A 在中国大陆是否不可接受，应不应该直接走路径 B。
4. 现网 `react-router dev` + Docker API 迁到生产反代时，最小正确切法是什么，有没有作者漏掉的 CSRF / cookie Domain / WebSocket 坑。
5. 新建 6 个项目的默认档案（INCUBATING/IDEA/P2、空 Focus）会不会让 Portfolio/Today 误导两人。
6. 还没有配偶邮箱就谈公网，是不是顺序错误。

## 7. 作者自认的缺口（不要当成已解决）

- 没有域名、没有 VPS、没有 Cloudflare 账号写进本仓库。
- 没有配偶邮箱，无法发 Plane 邀请。
- 本地 `SECRET_KEY` 与数据库口令仍是隔离栈占位值。
- 公网 **尚未开口**。这是故意的：审查未过、门禁未齐之前开口，就是上次 AI 工具上线踩过的坑。
