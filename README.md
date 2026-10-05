# Agent Workspace Pipeline

Cài một lần cho project để Codex, Claude Code, Gemini hoặc Antigravity cùng làm việc theo một quy trình: **đọc yêu cầu và source/flow → làm rõ phần còn thiếu → plan → implement → kiểm chứng → technical docs → review → hoàn tất**.

**Bạn chỉ trò chuyện hoặc gửi tài liệu/plan.** Sau khi init, agent tự phân tích yêu cầu, chọn skills/context và vận hành pipeline. Tạo task, đặt ID, viết/cập nhật contract, chuẩn bị brief, chạy checks, ghi evidence và chuyển trạng thái đều là việc nội bộ của agent. Bạn có thể dùng 2–3 nền tảng trên cùng project; chúng đọc chung .agent và wiki.

Agent tự đọc stack, source và flow đã có để chọn cách làm. **“Don't guess, please ask”** áp dụng khi còn thiếu quyết định có thể đổi kết quả: agent hỏi đúng phần đó và chờ trước khi code phụ thuộc vào câu trả lời. Không hỏi bạn thông tin có thể đọc từ repo; không tự biến “implement UI theo ảnh” thành prototype hay dựng nghiệp vụ chưa được yêu cầu.

Các patterns đã đối chiếu từ archive, ecosystem Kun và case study được ghi ở [source audit](docs/source-audit.md). Bộ này dùng harness/model của bạn để làm việc; CLI quản lý records và các gate, không gọi model hay tự chạy một fleet chỉ vì init.

**Bản hiện tại: 0.3.0.** Package được phân phối qua GitHub Release và cài bằng npm/npx. **Chưa publish lên npm registry**, nên hãy dùng URL dưới đây để cài ngay.

## Đọc phần nào trước?

- **Chưa cài:** làm theo [cài vào project](#1-cài-vào-project).
- **Đã cài nhưng chưa biết được gì:** xem [các file được tạo](#2-chạy-xong-project-có-gì) và [7 skills](#3-bảy-skills-làm-gì).
- **Muốn bắt đầu:** dùng [ví dụ trò chuyện](#4-trò-chuyện-hoặc-gửi-plan-cho-agent).
- **Agent/maintainer cần tra cứu:** [handbook vận hành nội bộ](docs/agent-operations.md) có CRUD, evidence, review và troubleshooting.

## 1. Cài vào project

### Bước 1 — Mở terminal ngay trong project cần dùng

Trong VS Code, bấm phải vào folder project → **Open in Integrated Terminal**. Nếu đang ở folder cha, chuyển vào project trước; tên có dấu cách phải đặt trong dấu nháy:

~~~sh
cd "Test new workspace"
~~~

Chạy lệnh kiểm tra:

~~~sh
node --version
npm --version
~~~

Cần **Node.js 22+**. Bạn đã cài/đăng nhập nền tảng AI muốn dùng. Project có sẵn code, rules hoặc skills vẫn init được; không cần tạo project trống.

### Bước 2 — Copy một lệnh phù hợp

#### Lệnh npm/npx ngắn — dùng sau khi package được publish lên npm

**Hiện package chưa có trên npm registry.** Các lệnh theo tên dưới đây dùng được sau khi maintainer publish; để cài ngay, dùng [GitHub Release](#dùng-ngay-qua-github-release) ở phần tiếp theo.

**Một lệnh init đủ cả bốn nền tảng và 7 skills dùng chung:**

~~~sh
npx --yes agent-workspace-pipeline@latest init
~~~

**Chỉ Codex + Claude:**

~~~sh
npx --yes agent-workspace-pipeline@latest init --with codex,claude
~~~

**Dùng npm thay cho npx**, vẫn init bằng một lệnh:

~~~sh
npm exec --yes --package=agent-workspace-pipeline@latest -- agent-workspace init
~~~

Thêm --with codex,claude hoặc danh sách nền tảng cần dùng ở cuối lệnh npm. npx/npm exec tải và chạy CLI; không cần cài global trước. Muốn có binary ngắn dùng ở mọi project, xem [cài CLI global](#cài-cli-global-nếu-cần).

Người cài package public không cần npm login. Login chỉ cần cho maintainer phát hành; xem [publish lần đầu](docs/publishing.md#publish-lần-đầu). Kiểm tra package đã có trên registry bằng npm view agent-workspace-pipeline version; kết quả phải trả version thực tế trước khi dùng các lệnh ngắn này.

#### Dùng ngay qua GitHub Release

**Dùng Codex + Claude:**

~~~sh
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.3.0/agent-workspace-pipeline-0.3.0.tgz init --distribution github --with codex,claude
~~~

**Dùng Codex + Claude + Gemini:** thay phần cuối thành --with codex,claude,gemini.

**Muốn đủ cả bốn:** bỏ --with, như lệnh này:

~~~sh
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.3.0/agent-workspace-pipeline-0.3.0.tgz init --distribution github
~~~

| Bạn dùng | Giá trị --with |
| --- | --- |
| Codex + Claude Code | codex,claude |
| Claude Code + Gemini | claude,gemini |
| Codex + Gemini + Antigravity | codex,gemini,antigravity |
| Cả bốn | Bỏ --with hoặc dùng all |
| Một nền tảng | Tên nền tảng, ví dụ claude |

Các tên viết thường, ngăn bằng dấu phẩy, **không có dấu cách** trong lệnh. Lệnh dùng chung trên Windows, macOS và Linux. Nó tải package, tạo pipeline và cài cả 7 skills vào các nền tảng đã chọn; không cần setup từng nền tảng.

Không cần clone source, tải file về bằng tay hoặc dùng GitHub token. --distribution github giúp các instructions của project tiếp tục gọi đúng bản CLI từ release này trên máy khác.

**Đã init trước đây:** chạy lại lệnh tương ứng. File còn thiếu sẽ được bổ sung; các nền tảng đã có vẫn được giữ. Khi nâng bản, thêm --refresh để cập nhật block instructions và CORE/skills/handbook còn nguyên bản mặc định cũ. File tùy biến được giữ và liệt kê trong customized để agent/maintainer rà.

### Bước 3 — Kiểm tra cài thành công

Vẫn ở terminal của project, chạy:

~~~sh
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.3.0/agent-workspace-pipeline-0.3.0.tgz doctor
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.3.0/agent-workspace-pipeline-0.3.0.tgz skills list
~~~

Nếu đã cài từ npm registry sau khi package được publish, dùng lệnh ngắn tương ứng:

~~~sh
npx --yes agent-workspace-pipeline@latest doctor
npx --yes agent-workspace-pipeline@latest skills list
~~~

doctor trả JSON có **"ok": true**; skills list có 7 tên: analyze, interview, pipeline, plan, review, tdd, wiki-maintenance. Finding WIKI_NOT_RELEASED là thông tin bình thường ở project mới: các trang wiki mẫu đang là draft, chưa được xác minh để dùng làm kiến thức chính thức.

Sau đó mở lại/reload phiên agent trong project để nó nạp instructions. Nhắn agent: “Đọc instructions, liệt kê workflows bằng skills list và cho biết thư mục đang dùng.” Agent sẽ đọc bộ chung tại .agent/skills. doctor kiểm tra cấu hình/file; live tools và model phải kiểm tra trong harness.

**Đến đây có thể giao task bằng chat**, theo mục 4. Không cần tự chạy toàn bộ lệnh quản lý task trước khi bắt đầu.

## 2. Chạy xong project có gì?

Ví dụ cài cả bốn nền tảng:

~~~text
your-project/
├── AGENTS.md                         Codex đọc và trỏ vào pipeline chung
├── CLAUDE.md                         Claude đọc và trỏ vào pipeline chung
├── GEMINI.md                         Gemini đọc và trỏ vào pipeline chung
├── .agent/
│   ├── workspace.yaml                cấu hình project/tools/wiki/review
│   ├── CORE.md                       nguyên tắc riêng của project
│   ├── ADAPTER.md                    cách gọi CLI đúng version
│   ├── skills/                       một bộ 7 workflows cho mọi nền tảng
│   │   ├── pipeline/SKILL.md
│   │   ├── analyze/SKILL.md
│   │   ├── interview/SKILL.md
│   │   ├── plan/SKILL.md
│   │   ├── tdd/SKILL.md
│   │   ├── review/SKILL.md
│   │   └── wiki-maintenance/SKILL.md
│   ├── rules/                        rules project; router Antigravity ở đây
│   ├── tasks/                        task/plan do agent quản lý
│   ├── raw/                          tài liệu onboarding gốc
│   └── change-requests/              đề xuất sửa rules/kiến thức
└── wiki/                             kiến thức project, tách khỏi pipeline
    ├── INDEX.md                      trang vào và điều hướng cho agent/người
    ├── MAP.yaml                      routing theo path/symbol/tag
    ├── architecture.md               mẫu draft
    ├── conventions.md                mẫu draft
    └── glossary.md                   mẫu draft
~~~

**Mọi nền tảng cùng dùng .agent/skills.** Các file instructions chỉ hướng agent vào bộ workflow này; không tạo các bản skills ở .agents/.claude/.gemini/.codex. Không cần đồng bộ nhiều bản hoặc symlink. Antigravity đọc thêm .agent/rules/agent-workspace.md với trigger: always_on.

Đây là cơ chế **agent đọc instructions rồi chọn workflow**, không đăng ký slash commands riêng cho từng nền tảng. Sau khi init, có thể nhắn: “Đọc instructions của project, dùng CLI liệt kê skills rồi xử lý task này theo pipeline.”

Nếu chọn codex,claude, chỉ tạo AGENTS.md và CLAUDE.md cho hai nền tảng đó. .agent/skills và wiki vẫn dùng chung. Chạy lại để thêm gemini chỉ bổ sung GEMINI.md và phần còn thiếu, giữ các workflows bạn đã tùy chỉnh.

Bộ mặc định dùng chung của user tại **~/.agent-workspace/** gồm CORE, handbook, profiles và skills fallback. Project có bộ workflows tại .agent/skills để agent dùng và maintainer chỉnh một lần; local cùng tên được ưu tiên hơn global. Config dùng đường dẫn ~ nên không gắn với máy tác giả.

### Vì sao wiki nằm ở wiki/?

[GitHub Wiki](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages) và [GitLab Wiki](https://docs.gitlab.com/user/project/wiki/) quản lý các trang tài liệu bằng Git, hỗ trợ Markdown và điều hướng. Wiki của hai dịch vụ này có repository riêng; không có quy định chung bắt buộc folder local tên wiki hay .wiki.

Từ cách quản lý đó, package chọn **wiki/** ở repo root: các trang Markdown và links dễ đọc, đi cùng source revision và review trong Git. INDEX.md làm entrypoint; MAP.yaml bổ sung routing để agent chỉ nạp tối đa 3 trang active phù hợp task. Đây là lựa chọn của package; init không tự publish lên tab Wiki của GitHub/GitLab.

Muốn dùng thư mục ẩn thì chọn lúc init project mới:

~~~sh
agent-workspace init --with codex,claude --distribution github --wiki-dir .wiki
~~~

Với npx, thêm --wiki-dir .wiki vào lệnh ở mục 1. Agent đọc wiki.index/wiki.map trong .agent/workspace.yaml, nên không hardcode wiki/. **Repo cũ dùng .agent/wiki vẫn được giữ nguyên**, không tự di chuyển hoặc ghi đè kiến thức. Đổi vị trí wiki hiện có là một công việc maintenance riêng.

| Khi làm việc, phần nào xuất hiện thêm? | Dùng để làm gì? |
| --- | --- |
| .agent/tasks/LOGIN-42.md | Yêu cầu, plan, tiêu chí nghiệm thu và trạng thái một task |
| .agent/prepared/LOGIN-42/ | Brief và baseline kiểm tra |
| .agent/evidence/LOGIN-42.json | Receipt liên kết tiêu chí với bằng chứng |
| .agent/evidence/LOGIN-42/ | Logs, test output, review và artifacts thật |
| .agent/archive/ | Bản lưu task/rule/wiki đã xóa khỏi danh sách hoạt động |

prepared/evidence/learning mặc định được ignore trong Git; được tạo khi workflow sử dụng chúng. Với workspace nhiều repo, init từng repo cần pipeline, có thể dùng chung global home.

**File đã có sẵn:** giữ CORE/config/skills bạn đã chỉnh. AGENTS.md, CLAUDE.md, GEMINI.md nhận một block Agent Workspace nếu chưa có; không thay toàn bộ file. --refresh cập nhật block quản lý và các shipped defaults đã nhận diện, giữ phần riêng của bạn. Chọn ít nền tảng hơn ở lần sau không gỡ những nền tảng đã cài.

## 3. Bảy skills làm gì?

**Rule** nói agent phải tuân thủ điều gì, ví dụ “không thay public API nếu chưa duyệt”. **Skill** hướng dẫn agent thực hiện một loại công việc, ví dụ phân tích impact, lập plan hoặc review.

| Tên skill dùng chung | Khi dùng và kết quả | Ví dụ bạn nhắn agent |
| --- | --- | --- |
| pipeline | Điều phối cả task: yêu cầu → contract → thực hiện → evidence → review → finish | “Dùng pipeline sửa lỗi đăng nhập này đến khi kiểm tra xong.” |
| analyze | Đọc source, tìm nguyên nhân/impact và rút ra tiêu chí nghiệm thu | “Phân tích lỗi này, xác định callers bị ảnh hưởng và cách chứng minh đã sửa.” |
| interview | Làm rõ các quyết định còn thiếu về hành vi/phạm vi trước khi làm | “Yêu cầu phân quyền còn mơ hồ, giúp tôi chốt hành vi cần có.” |
| plan | Plan gắn với source/flow, acceptance và checks; có reference hướng dẫn technical handoff; chỉ plan thì dừng ở plan | “Lập plan thêm reset password, chưa implement.” |
| tdd | Dùng test có ý nghĩa để tái hiện lỗi/kiểm chứng hành vi, sửa và kiểm tra regression | “Tái hiện bug bằng test rồi sửa, kiểm tra các case liên quan.” |
| review | Review cả intent, source, evidence và docs; kiểm chứng feedback PR/MR trước khi sửa, giữ baseline của caller khác | “Review các thay đổi vừa làm; kiểm tra feedback này có đúng với source không.” |
| wiki-maintenance | Onboard/cập nhật kiến thức từ source đã kiểm tra, đề xuất/release wiki trong maintenance được phép | “Tôi cho phép onboarding wiki: đọc source và tài liệu để mô tả auth flow.” |

Bạn không cần thuộc các tên để dùng hằng ngày: instructions hướng agent vào pipeline. Có thể nhắc “skill plan của Agent Workspace” để agent đọc .agent/skills/plan/SKILL.md. Agent dùng tên trong bảng khi gọi CLI, không cần platform-specific slash commands.

CLI và folder skills dùng cùng tên ngắn trong bảng:

~~~sh
agent-workspace skills list
agent-workspace skills show plan
agent-workspace skills show tdd
agent-workspace skills resolve "regression test"
~~~

Các lệnh ngắn này dùng sau khi cài CLI global như mục 5. Nếu dùng npx, gọi bằng URL như ví dụ skills list ở mục 1.

**7 skills không có nghĩa là nạp cả 7 vào mọi task.** pipeline điều phối, resolver chọn các workflows/rules/wiki phù hợp với task. interview chỉ cần khi còn quyết định quan trọng chưa rõ; wiki-maintenance chỉ dùng cho công việc kiến thức được cho phép. review cần một reviewer hoặc phiên mới, không tự coi lời của executor là review độc lập.

## 4. Trò chuyện hoặc gửi plan cho agent

Mở đúng project đã init, chọn model mạnh và effort cao trong harness, rồi nhắn như một cuộc trò chuyện coding bình thường. Các mục tiêu năng lực của chủ workspace là Gemini 3.8+, Claude Sonnet/Opus 5.0+, GPT 5.6 Sol/Terra high+; chọn model ID thực tế mà harness cung cấp.

### Ví dụ yêu cầu còn chung chung

> Trong project này có ảnh thiết kế, implement UI theo ảnh giúp tôi.

Agent đọc ảnh, instructions, project configuration và source liên quan. Nếu project đã có React/TS và flow hiện hữu, nó tự phát hiện và tái sử dụng. Nếu target trống hoặc chưa rõ deliverable/flow, nó hỏi, ví dụ: “Ông muốn bản visual prototype hay màn hình tích hợp vào app? Các action trong ảnh cần chạy thật theo flow nào?” Câu hỏi thực tế phụ thuộc phần còn thiếu, không phải checklist cố định.

Sau câu trả lời, agent tóm tắt outcome và context đã rõ, tự lập plan với các state/case cần kiểm tra, implement trong scope và cập nhật technical docs liên quan theo source cuối. Bạn không tạo task hay điền YAML. Discovery còn pending/open questions sẽ bị CLI chặn approve/run; review vẫn phải đối chiếu nguồn thật vì một record ready có thể ghi sai.

Plan tốt nêu current → proposed flow, state/data owner, phần phải giữ, các bước implementation và test/runtime matrix. Technical docs ghi behavior thực tế và checks đã chạy, phân biệt phần planned hoặc chưa kiểm chứng. Đây là tiêu chuẩn từ case study; [behavioral evaluation](docs/behavioral-evaluation.md) có các ca retest với model thật. Test CLI pass không chứng minh model luôn hỏi đúng hoặc vượt chất lượng case study.

### Hỏi hoặc phân tích

> Phân tích luồng đăng nhập hiện tại và tìm nguyên nhân lỗi này. Chưa sửa code.

Agent đọc source/context, dùng tools phù hợp rồi trả phân tích. Một câu hỏi không bắt bạn tạo task và không tự chuyển thành implementation.

### Lập plan

> Lập plan thêm reset password, chỉ ra các case cần kiểm tra. Chưa implement.

Agent tự quản lý draft/contract nội bộ nếu cần và trả plan trong chat. Nếu muốn output thành file, chỉ cần nhắn thêm “lưu plan vào docs/reset-password-plan.md”.

### Gửi một file Markdown plan để triển khai

> Đọc docs/reset-password-plan.md và implement theo plan đó. Giữ nguyên các hành vi ngoài phạm vi.

Có thể gửi nội dung/file plan trực tiếp trong chat thay cho path. Agent đọc plan và source, tự tạo/reuse task nội bộ, ghi lại các yêu cầu/quyết định áp dụng, rồi implement và kiểm chứng. Original plan được giữ nguyên nếu bạn chưa yêu cầu chỉnh.

Nếu bạn chỉ gửi file hoặc yêu cầu phân tích file, agent dùng nó làm context; quyền implement được xác định từ yêu cầu trong hội thoại.

### Yêu cầu sửa code trực tiếp

> Sửa lỗi đăng nhập khi email có khoảng trắng ở đầu/cuối và kiểm tra các trường hợp liên quan.

Agent tự chọn task ID, viết contract, ghi nhận quyền đã có trong yêu cầu này, prepare, implement, chạy checks, thu evidence và hoàn tất khi gate pass. Bạn không phải tạo task, điền YAML, chỉnh receipt hoặc ký duyệt thêm một contract cho yêu cầu đã cho phép.

### Tiếp tục hoặc thay đổi yêu cầu

> Thêm xử lý email rỗng vào phần vừa làm giúp tôi.

Agent tiếp tục task liên quan và cập nhật nội bộ khi semantics thay đổi. Agent chỉ hỏi khi còn thiếu một quyết định ảnh hưởng hành vi/correctness hoặc cần quyền chưa được cấp; không hỏi về cách đặt ID, fields hay các bước quản lý pipeline.

### Dùng nền tảng khác để review

Sau khi Codex thực hiện, có thể mở phiên Claude mới trong cùng project và nhắn:

> Review các thay đổi vừa làm theo yêu cầu và plan hiện có. Kiểm tra source, evidence và các case liên quan.

Agent tự tìm contract/source phù hợp từ context, chuẩn bị review với hashes hiện tại và ghi kết quả. Hai nền tảng dùng chung dữ liệu .agent; bạn không cần chuyển hay nhập task ID. Source đổi sau review thì agent cập nhật checks/review.

### Agent xử lý nội bộ như thế nào?

| Loại yêu cầu | Agent làm nội bộ | Bạn nhận được |
| --- | --- | --- |
| Hỏi/phân tích | Resolve context, đọc source/tools | Phân tích và kết luận có căn cứ |
| Lập plan | Analyze/interview khi cần, tự quản lý draft | Plan theo hình thức bạn yêu cầu |
| Implement | Tự quản lý contract, authorization, brief, code và verification | Kết quả thay đổi, checks và blockers nếu có |
| Review | Đọc contract/source/evidence, review trong fresh context | Findings hoặc kết quả review với phạm vi rõ |

Task Contract là bản ghi nội bộ giữ semantics và plan. Evidence/receipt là bằng chứng kiểm tra; DoD là điều kiện hoàn tất. Chúng phục vụ agent và việc truy vết. Trong chat thông thường, agent báo kết quả, verification và vấn đề cần quyết định; không giao checklist vận hành pipeline cho bạn.

## 5. Cài global, nâng cấp và thêm nền tảng

### Cài CLI global nếu cần

Lệnh npx ở mục 1 đủ để init. Agent đọc portable invocation trong .agent/ADAPTER.md để tự chạy các lệnh tiếp theo. Nếu muốn có binary ngắn cho setup/diagnostics hoặc công cụ của team, cài một lần:

~~~sh
npm install --global https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.3.0/agent-workspace-pipeline-0.3.0.tgz
agent-workspace --version
~~~

### Thêm nền tảng

~~~sh
agent-workspace init --with codex,claude,gemini --distribution github
~~~

Nếu vẫn dùng npx, thêm/sửa --with trong lệnh ở mục 1 rồi chạy lại. Các workflows dùng chung và file đã chỉnh được giữ.

### Nâng bản đã init

Cài/chạy version mới rồi thêm --refresh vào init để cập nhật routers và templates mặc định còn nguyên bản:

~~~sh
agent-workspace init --with all --refresh
~~~

Có thể thay all bằng danh sách nền tảng đang dùng. --refresh nhận diện nội dung shipped trong các bản 0.1.0/0.2.0/0.2.1, kể cả khác BOM/line endings, rồi nâng CORE/skills/handbook mặc định. Nội dung tùy biến được giữ, báo trong customized; version label giống nhau không đủ để ghi đè. Config, wiki, task và examples đang có được giữ. Repo có execution.lock sẽ chặn refresh. Nâng global home dùng chung khi các execution đang dùng home đó đã dừng; đổi knowledge khiến baseline cũ cần được agent xử lý bằng revision trước execution tiếp theo.

**Contract trước 0.3.0:** agent vẫn đọc/revise được nhưng phải bổ sung discovery gồm outcome, request/source references, flow, decision provenance và giải quyết open questions trước approval/execution. Agent tự làm việc này từ conversation/source; user không migrate YAML bằng tay. Reload phiên agent sau nâng cấp để nạp instructions mới.

### Clone project sang máy mới

Cài Node/harness, mở project và tạo bộ global cho user hiện tại:

~~~sh
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.3.0/agent-workspace-pipeline-0.3.0.tgz setup
~~~

Agent có thể tự chạy setup khi cần rồi kiểm tra doctor. Đường dẫn mặc định dùng ~ của user hiện tại; --repo chọn project, --home hoặc AGENT_WORKSPACE_HOME chọn bộ global riêng.

### Khi package đã publish lên npm registry

Lệnh init một bước bằng npx/npm exec nằm ngay ở [bước 2](#bước-2--copy-một-lệnh-phù-hợp). Sau khi npm view agent-workspace-pipeline version trả về bản thực tế, cũng có thể cài CLI global bằng tên package:

~~~sh
npm install --global agent-workspace-pipeline@latest
agent-workspace init
~~~

init mặc định cài đủ bốn nền tảng; thêm --with để chọn nền tảng cần dùng. Chỉ cần init một lần cho project, sau đó giao việc bằng chat như mục 4.

Tên package là agent-workspace-pipeline; binary là agent-workspace. Không chạy npx agent-workspace trong project chưa cài dependency này: tên đó trên npm thuộc một dự án khác.

## 6. Tài liệu dành cho agent và maintainer

User dùng conversation/plan như mục 4. Các tài liệu sau phục vụ agent vận hành nội bộ hoặc maintainer phát triển/inspect:

- [Agent operations handbook](docs/agent-operations.md): CRUD task/rule/wiki/skill, capability, evidence, review, completion, learning và xử lý lỗi.
- [Publishing](docs/publishing.md): phát triển, kiểm tra, đóng gói và phát hành package.
- [Reference decisions](docs/reference-decisions.md): các quyết định kết hợp từ plan/tóm tắt và nguồn tham khảo.
- [Changelog](CHANGELOG.md): thay đổi từng version.

setup/init cài handbook vào global home tại handbook/agent-operations.md cùng examples. Agent chỉ đọc phần cần dùng khi tra cứu; không nạp toàn bộ handbook vào mọi task.
