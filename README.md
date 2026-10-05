# Agent Workspace Pipeline

Cài một lần cho project để Codex, Claude Code, Gemini hoặc Antigravity cùng làm việc theo một quy trình: **hiểu yêu cầu → lập task/plan → sửa code → kiểm tra → review → hoàn tất**.

**Thiết kế để agent vận hành.** Bạn cài package rồi giao việc bằng lời trong IDE; agent tự phân tích, viết contract/plan, chọn context, chạy CLI, implement, thu evidence và kiểm tra completion. Các quyết định thiếu ảnh hưởng correctness hoặc quyền chưa được cấp mới quay lại người dùng. Bạn có thể dùng 2–3 nền tảng trên cùng project; chúng đọc chung task và kiến thức trong .agent.

**Bản hiện tại: 0.2.0.** Package được phân phối qua GitHub Release và cài bằng npm/npx. **Chưa publish lên npm registry**, nên hãy dùng URL dưới đây để cài ngay.

## Đọc phần nào trước?

- **Chưa cài:** làm theo [cài vào project](#1-cài-vào-project).
- **Đã cài nhưng chưa biết được gì:** xem [các file được tạo](#2-chạy-xong-project-có-gì) và [7 skills](#3-bảy-skills-làm-gì).
- **Muốn giao việc ngay:** dùng [ví dụ trong IDE](#4-giao-task-đầu-tiên-trong-ide).
- **Muốn tự vận hành CLI:** xem [quy ước lệnh](#5-dùng-cli-nâng-cấp-và-thêm-nền-tảng), rồi [CRUD task](#6-crud-một-task-contract), [CRUD rule](#9-crud-rules-maintainer-và-executor-làm-khác-nhau), [wiki](#10-crud-wiki-và-raw-onboarding-sources), [skill riêng](#11-crud-skill-riêng-của-project).

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

**Dùng Codex + Claude:**

~~~sh
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.2.0/agent-workspace-pipeline-0.2.0.tgz init --distribution github --with codex,claude
~~~

**Dùng Codex + Claude + Gemini:** thay phần cuối thành --with codex,claude,gemini.

**Muốn đủ cả bốn:** bỏ --with, như lệnh này:

~~~sh
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.2.0/agent-workspace-pipeline-0.2.0.tgz init --distribution github
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

**Đã init trước đây:** chạy lại lệnh tương ứng. File còn thiếu sẽ được bổ sung; các nền tảng đã có vẫn được giữ. Nếu nâng từ 0.1.0, thêm --refresh để cập nhật block instructions của package, giữ phần nội dung riêng của bạn.

### Bước 3 — Kiểm tra cài thành công

Vẫn ở terminal của project, chạy:

~~~sh
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.2.0/agent-workspace-pipeline-0.2.0.tgz doctor
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.2.0/agent-workspace-pipeline-0.2.0.tgz skills list
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

**File đã có sẵn:** giữ nguyên CORE/config/skills bạn đã chỉnh. AGENTS.md, CLAUDE.md, GEMINI.md nhận một block Agent Workspace nếu chưa có; không thay toàn bộ file. --refresh cập nhật block do package quản lý, giữ instructions của bạn. Chọn ít nền tảng hơn ở lần sau không gỡ những nền tảng đã cài.

## 3. Bảy skills làm gì?

**Rule** nói agent phải tuân thủ điều gì, ví dụ “không thay public API nếu chưa duyệt”. **Skill** hướng dẫn agent thực hiện một loại công việc, ví dụ phân tích impact, lập plan hoặc review.

| Tên skill dùng chung | Khi dùng và kết quả | Ví dụ bạn nhắn agent |
| --- | --- | --- |
| pipeline | Điều phối cả task: yêu cầu → contract → thực hiện → evidence → review → finish | “Dùng pipeline sửa lỗi đăng nhập này đến khi kiểm tra xong.” |
| analyze | Đọc source, tìm nguyên nhân/impact và rút ra tiêu chí nghiệm thu | “Phân tích lỗi này, xác định callers bị ảnh hưởng và cách chứng minh đã sửa.” |
| interview | Làm rõ các quyết định còn thiếu về hành vi/phạm vi trước khi làm | “Yêu cầu phân quyền còn mơ hồ, giúp tôi chốt hành vi cần có.” |
| plan | Lập các bước thực hiện trong một Task Contract; yêu cầu chỉ plan thì dừng ở plan | “Lập plan thêm reset password, chưa implement.” |
| tdd | Dùng test có ý nghĩa để tái hiện lỗi/kiểm chứng hành vi, sửa và kiểm tra regression | “Tái hiện bug bằng test rồi sửa, kiểm tra các case liên quan.” |
| review | Review độc lập dựa trên contract, source hiện tại và evidence; trả findings hoặc review pass có phạm vi rõ | “Review LOGIN-42 trong phiên mới, kiểm tra cả evidence và callers.” |
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

## 4. Giao task đầu tiên trong IDE

Mở đúng project đã init. Chọn model mạnh và effort cao trong nền tảng bạn đang dùng. Các mục tiêu năng lực của chủ workspace là Gemini 3.8+, Claude Sonnet/Opus 5.0+, GPT 5.6 Sol/Terra high+; chọn **model ID thực tế được nền tảng cung cấp**. Package không tự cài model, đăng nhập AI account hoặc chọn model hộ bạn.

### Chỉ cần plan

Gửi:

> Dùng skill plan của Agent Workspace. Đọc source để lập plan thêm chức năng reset password, lưu Task Contract RESET-1 ở dạng draft. Chưa implement. Nếu cần chốt hành vi ảnh hưởng người dùng thì hỏi tôi.

Kết quả mong đợi: .agent/tasks/RESET-1.md có yêu cầu, các bước, scope và acceptance criteria. Agent không sửa logic production theo một yêu cầu chỉ lập plan.

### Muốn thực hiện một task

Gửi:

> Dùng pipeline của Agent Workspace cho task LOGIN-42: sửa lỗi đăng nhập khi email có khoảng trắng ở đầu/cuối. Giữ nguyên các hành vi khác. Hãy kiểm tra source và impact, lưu Task Contract, dùng test để chứng minh kết quả, rồi cung cấp evidence và independent review. Quyết định về business chưa rõ thì hỏi tôi.

Một task đi qua các bước sau:

| Bước | Agent làm | Bạn kiểm tra gì? |
| --- | --- | --- |
| Hiểu yêu cầu | Analyze source/impact, interview nếu cần | Hành vi mong muốn có được hiểu đúng? |
| Chốt contract/plan | Tạo .agent/tasks/LOGIN-42.md | Goal, scope, các case pass/fail và DoD có đúng? |
| Thực hiện | Prepare rồi implement và chạy checks | Có giữ semantics/phạm vi đã được duyệt? |
| Kiểm chứng | Ghi artifacts thật và liên kết DoD | Có logs/tests/runtime evidence cho kết quả? |
| Review | Reviewer/phiên mới kiểm tra contract, source và evidence | Findings đã giải quyết, review có đúng source hiện tại? |
| Hoàn tất | evidence validate rồi task finish | Task chuyển done khi gate pass |

**Contract** là yêu cầu và plan được ghi trong một file. **Acceptance criteria** là kết quả phải quan sát được. **DoD (Definition of Done)** là điều kiện hoàn tất gắn với bằng chứng. **Evidence/receipt** lưu kết quả kiểm tra; **brief** là nội dung giao việc do prepare tạo.

Agent ghi approval khi cuộc hội thoại đã thực sự cho phép semantics đó; không yêu cầu bạn duyệt lại cùng quyết định. Lệnh task approve --by ghi nhận người đã duyệt, không tự tạo sự đồng ý.

### Dùng hai nền tảng cho cùng task

Ví dụ Codex implement LOGIN-42, sau đó mở **phiên Claude mới** trong cùng project và gửi:

> Dùng skill review của Agent Workspace để review LOGIN-42. Đọc contract, current source/diff và receipt. Chạy review prepare để lấy hashes, kiểm tra tiêu chí và evidence, lưu findings. Chỉ record passed nếu các kiểm tra thực sự đạt.

Hai nền tảng đọc chung .agent; không cần copy task. Nếu source thay đổi sau review, checks/review phải được cập nhật. Với cùng một repo, làm implementation lần lượt theo execution lock; package không tự giải quyết các phiên IDE cùng sửa code bên ngoài CLI.

## 5. Dùng CLI, nâng cấp và thêm nền tảng

### Muốn gõ lệnh ngắn ở mọi project

npx ở mục 1 tải và chạy package cho lệnh đó; **không đăng ký lệnh global agent-workspace**. Nếu muốn tự chạy CRUD bằng các lệnh ngắn dưới đây, cài một lần:

~~~sh
npm install --global https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.2.0/agent-workspace-pipeline-0.2.0.tgz
agent-workspace --version
~~~

Kết quả version là 0.2.0. Sau đó trong project:

~~~sh
agent-workspace init --with codex,claude --distribution github
agent-workspace doctor
agent-workspace skills list
~~~

**Các mục CRUD/checks phía dưới giả sử đã cài global như trên.** Nếu chỉ dùng npx, giữ nguyên command/arguments sau tên binary và thay agent-workspace bằng npx --yes cùng URL tarball ở mục 1. Trong IDE, agent cũng có portable invocation đầy đủ trong .agent/ADAPTER.md để vận hành CLI.

### Thêm nền tảng hoặc nâng router trong project đã có

~~~sh
agent-workspace init --with codex,claude,gemini --distribution github
agent-workspace adapter install --with gemini,antigravity
~~~

Cả hai cách bổ sung instructions và bộ skills chung còn thiếu, giữ phần đã có. Có thể lặp --with codex --with claude thay cho CSV. init/setup giữ nguyên workflows đã tùy chỉnh; upgrade nội dung canonical skill do maintainer review riêng.

Khi đã cài CLI bản mới, cập nhật các block của package:

~~~sh
agent-workspace init --with all --refresh
~~~

Nếu chỉ muốn refresh các nền tảng đang dùng thì thay all bằng danh sách đó. Chạy maintenance trước task mới; adapter/skills thay đổi làm baseline governance của task đã prepare cũ không còn hợp lệ, cần review/update/reapprove task revision.

init không đổi cli.distribution của config đã có. Đổi kênh: sửa trường này trong .agent/workspace.yaml thành npm hoặc github, rồi refresh. Trước khi npm package được publish, dùng github.

### Clone project sang máy mới

Cài Node/harness, mở project và dùng cùng bản CLI của router. Chạy setup để tạo bộ global skills cho user mới, rồi doctor:

~~~sh
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.2.0/agent-workspace-pipeline-0.2.0.tgz setup
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.2.0/agent-workspace-pipeline-0.2.0.tgz doctor
~~~

Đường dẫn mặc định dùng ~ của user hiện tại. --repo chọn project khác; --home hoặc AGENT_WORKSPACE_HOME chọn bộ global riêng. Đặt global home ở ngoài project hoặc một thư mục con riêng; không đặt project bên trong global home.

### Khi maintainer đã publish lên npm registry

Khi npm view agent-workspace-pipeline version trả về bản thực tế, có thể dùng tên package thay URL:

~~~sh
npx --yes agent-workspace-pipeline@latest init --with codex,claude
npm install --global agent-workspace-pipeline
~~~

Hoặc pin dependency của team bằng npm install --save-dev agent-workspace-pipeline@0.2.0 rồi dùng npx agent-workspace. **Tên package là agent-workspace-pipeline; binary là agent-workspace.** Không chạy npx agent-workspace trong project chưa cài dependency này: tên đó trên npm thuộc một dự án khác.

Cơ chế instructions/skills của từng nền tảng được đối chiếu với [Codex](https://learn.chatgpt.com/docs/build-skills), [Claude Code](https://code.claude.com/docs/en/skills), [Gemini](https://geminicli.com/docs/cli/using-agent-skills/) và [Antigravity](https://antigravity.google/docs/skills). Theo lựa chọn folder chung của package, agent truy cập workflows qua instructions và CLI. Các executable, MCP/providers, account và model settings do harness/team cấu hình.

## 6. CRUD một Task Contract

Phần từ đây là **tài liệu thao tác cho agent và người cần inspect/debug**. Luồng chính vẫn là giao yêu cầu bằng chat; agent tự viết contract và chạy các lệnh. CRUD là Create / Read / Update / Delete: tạo, đọc, cập nhật và xóa khỏi danh sách hoạt động.

### Create: tạo task

~~~powershell
agent-workspace task new DEMO-1
~~~

Mở .agent/tasks/DEMO-1.md trong IDE. File mới là draft và có TODO: **chưa chạy được**. Điền phần YAML đầu file và các section Markdown.

| Field | Cách điền |
| --- | --- |
| id | Trùng tên file; 1–80 chữ/số/dấu - hoặc _ |
| status | draft trước khi duyệt |
| risk | low / medium / high |
| version | Số nguyên từ 1; task update tự tăng |
| paths | Các đường dẫn cụ thể liên quan, relative từ repo root |
| symbols | Các symbol cần điều tra, nếu biết |
| tags | Topic/domain giúp resolver chọn rules/wiki/skills |
| skills | Tên skill cần nạp rõ ràng; có thể để [] để auto route |
| expected_write_scope | File/glob dự kiến được sửa |
| required_capabilities | Tool capability cần có trong harness |
| required_evidence | E1–E5; luôn cần E4 |
| acceptance_criteria | Các kết quả quan sát được, có ID riêng |
| dod | ID, criterion, acceptance IDs và evidence kinds cần chứng minh |

Ví dụ YAML:

~~~yaml
id: DEMO-1
status: draft
risk: low
version: 1
paths: [src/greet.mjs, test/greet.test.mjs]
symbols: []
tags: [feature, regression]
skills: [tdd]
expected_write_scope: [src/greet.mjs, test/greet.test.mjs]
required_capabilities: []
required_evidence: [E4, E5]
acceptance_criteria:
  - id: AC1
    description: greet("Thanh") returns "Hello, Thanh!".
dod:
  - id: D1
    criterion: The greeting behavior passes its executable test.
    acceptance: [AC1]
    evidence: [E4, E5]
~~~

Mọi acceptance criterion phải được ít nhất một DoD bao phủ. Task sửa typed symbol phải yêu cầu E1; UI/runtime verification cần E3 khi áp dụng. Không thay E1 bằng grep.

Giữ các section có sẵn: Goal, User Intent, Decisions, Constraints, Non-goals, Acceptance Criteria, Known Impact Surface, Relevant Project Context, Expected Write Scope, Required Evidence, Definition of Done, Escalation Conditions. Có thể để “None” nếu một section thật sự không có nội dung; không bỏ section hoặc để TODO khi duyệt. Các bước implementation nằm trong Decisions, không bắt buộc tạo thêm plan/spec/analysis files.

Xem [examples/task.md](examples/task.md) cho contract đầy đủ của bài demo.

### Read: xem/list/check task

~~~powershell
agent-workspace task list
agent-workspace task show DEMO-1
agent-workspace task validate DEMO-1 --draft
agent-workspace prepare DEMO-1 --draft --brief
~~~

validate --draft kiểm tra cấu trúc và liên kết IDs, nhưng cho phép TODO khi đang soạn. validate không có --draft đòi contract hoàn chỉnh và approval hợp lệ.

### Duyệt rồi chuẩn bị thực thi

Sau khi user/strong layer đã thực sự duyệt semantics:

~~~powershell
agent-workspace task approve DEMO-1 --by "Thanh"
agent-workspace task validate DEMO-1
agent-workspace prepare DEMO-1 --format codex --brief
~~~

--by **ghi lại** người/lớp đã duyệt; lệnh không tự xin hoặc tự cấp consent. Approval giữ hash contract. Sửa nội dung sau duyệt làm approval stale.

prepare luôn nạp global/repo CORE, mọi mandatory/matched rule, skill liên quan và tối đa 3 wiki pages active. Thứ tự wiki: exact path → path glob → symbol → tag/description → related context.

Output đầy đủ lưu ở .agent/prepared/DEMO-1/prompt.md và manifest.json. --brief chỉ in các file được chọn, capability và lượng context ước tính. Lần prepare đầu cho contract approved là baseline; chạy lại không xóa baseline hoặc tha thứ mutation của protected knowledge.

### Update: sửa requirement/plan

Trước khi approve, có thể sửa trực tiếp draft trong IDE. Sau khi đã approved/done, dùng candidate rồi update:

~~~powershell
Copy-Item .agent/tasks/DEMO-1.md .agent/change-requests/DEMO-1-next.md
# Sửa candidate trong IDE.
agent-workspace task update DEMO-1 --from .agent/change-requests/DEMO-1-next.md
agent-workspace task validate DEMO-1 --draft
~~~

Update giữ ID, tăng version và reset về draft, xóa approval cũ. Review semantics mới, approve và prepare lại trước execution. Không dùng update giữa run đang hoạt động.

Thay đổi mechanical/local ngoài expected_write_scope có thể tiếp tục sau khi giải thích trong receipt. Thay đổi business/architecture/public contract cần escalation và contract mới được duyệt.

### Delete: xóa task khỏi danh sách

~~~powershell
agent-workspace task delete DEMO-1
agent-workspace task list
~~~

Delete chuyển nội dung contract sang .agent/archive/tasks/ rồi xóa file active. Receipt/prepared artifacts được giữ. Đây là archive có thể phục hồi, không phải xóa vĩnh viễn.

Muốn phục hồi: copy file archive được output về .agent/tasks/DEMO-1.md khi không có run, rồi kiểm tra version/status/approval/evidence trước khi dùng. Task đã done cần update thành revision mới nếu muốn làm tiếp.

## 7. Run: chạy qua harness hoặc IDE

Kiểm tra command và blockers trước:

~~~powershell
agent-workspace run DEMO-1 --with codex --dry-run
~~~

Dry-run không gọi model; nó vẫn kiểm tra contract và chuẩn bị brief. Chỉ chạy thật khi contract approved và capability bắt buộc đã cấu hình:

~~~powershell
agent-workspace run DEMO-1 --with codex
~~~

CLI truyền brief qua stdin, dùng process/lifecycle của harness. Codex adapter dùng workspace-write sandbox để cho phép implementation; các approval/network settings khác do harness quản lý. Không có tùy chọn bỏ qua toàn bộ permission.

Run exit zero trả awaiting-evidence, chưa đánh dấu done. Evidence/review/finish là bước tiếp theo. Mỗi repo có một execution lock; tool kiểm tra protected mutations cả khi harness thất bại.

Trong IDE, có thể cho agent dùng brief và thực thi ngay trong phiên hiện tại, không cần spawn CLI harness mới. Sau đó vẫn phải qua evidence/review/finish.

## 8. Evidence và hoàn tất một task

| Kind | Chứng minh gì? | Artifact ví dụ |
| --- | --- | --- |
| E1 | Definitions, references, callers, type relations | Output semantic MCP/LSP đúng repo |
| E2 | Literal/config/CSS/docs inspection | Output text search và nguồn đã kiểm tra |
| E3 | Runtime/browser/network behavior thật | Runtime log, screenshot, trace |
| E4 | File nào đổi so với prepare baseline | JSON do evidence changes tạo |
| E5 | Contract/test/type/schema checks | Test output, diagnostics, schema validation |

“I checked impact” không phải artifact. Diff là E4, không thay thế caller/semantic inspection.

### Bước 1: implementation xong, tạo receipt

~~~powershell
agent-workspace evidence init DEMO-1
agent-workspace evidence snapshot DEMO-1
~~~

Receipt tại .agent/evidence/DEMO-1.json cố tình chưa pass: implementation_complete=false, decisions/evidence/DoD links còn trống.

### Bước 2: tạo E4 từ baseline thật

~~~powershell
$changes = agent-workspace evidence changes DEMO-1 --json | ConvertFrom-Json
agent-workspace evidence record DEMO-1 --kind E4 --entry changes --artifact $changes.artifact --description "Reviewed changed files against the approved scope" --result passed
~~~

E4 phải là output evidence changes với đúng task/contract/source/baseline. Không tự tạo file “đã xem diff” rồi coi là E4.

### Bước 3: chạy checks thật và lưu logs

Ví dụ bài demo dùng Node test runner:

~~~powershell
node --test ./test/greet.test.mjs 2>&1 | Out-File -Encoding utf8 .agent/evidence/DEMO-1/tests.txt
if ($LASTEXITCODE -ne 0) { throw "Tests failed; do not record passed evidence." }
agent-workspace evidence record DEMO-1 --kind E5 --entry tests --artifact .agent/evidence/DEMO-1/tests.txt --description "Greeting success and default-value tests passed" --result passed
~~~

Dùng command test/typecheck/lint của project thật, không mặc định mọi repo đều dùng node --test. Failed/skipped/unavailable/user-owned verification chưa phải pass.

Ví dụ ghi E1 sau khi đã thu semantic output:

~~~powershell
agent-workspace evidence record LOGIN-42 --kind E1 --entry callers --artifact .agent/evidence/LOGIN-42/references.json --description "Inspected all relevant references and caller flows" --result passed --provider project-typescript-lsp --symbol resolvePermission --references 7 --inspected 7
~~~

Counts phải là số thật. Nếu không có count đáng tin, bỏ hai flags đó và lưu caller-path map đúng thực tế. Có counts thì references và inspected phải khớp.

### Bước 4: nối DoD với evidence

Mở receipt trong IDE:

~~~json
{
  "implementation_complete": true,
  "unresolved_semantics": [],
  "scope_expansions": [],
  "decisions": [
    {
      "change": "Added the greeting helper",
      "reason": "The approved acceptance criteria require explicit and default greetings"
    }
  ],
  "dod": [
    { "id": "D1", "evidence": ["changes", "tests"] }
  ]
}
~~~

Đoạn trên là **các field cần điền trong receipt có sẵn**, không phải toàn bộ file để overwrite. Giữ task_id/task_version/contract_sha256/source_digest và evidence entries do CLI tạo.

Nếu sửa thêm file ngoài scope vì mechanical wiring:

~~~json
"scope_expansions": [
  {
    "kind": "mechanical",
    "reason": "The approved helper needs this existing local export",
    "paths": ["src/index.mjs"]
  }
]
~~~

Không ghi kind=semantic để tự cấp phép. Dừng, escalation và cập nhật approved contract khi semantics thay đổi.

### Bước 5: independent review trong fresh context

~~~powershell
$review = agent-workspace review prepare DEMO-1 --json | ConvertFrom-Json
$review.file
~~~

Mở file đó ở một phiên reviewer mới với model mạnh/high. Reviewer đọc contract, rules/wiki/source, diff/change artifact và receipt; kiểm tra substance của evidence. Không dùng cả executor transcript làm kết luận thay cho fresh review.

Reviewer lưu kết quả thật vào .agent/evidence/DEMO-1/review.txt, nêu source_digest và contract_sha256 đã review. Khi reviewer pass:

~~~powershell
agent-workspace review record DEMO-1 --by "Independent reviewer" --artifact .agent/evidence/DEMO-1/review.txt --result passed --source-digest $review.source_digest --contract-sha256 $review.contract_sha256
~~~

Chỉ truyền hashes của revision reviewer đã xem. Sau khi source đổi, review cũ không được đóng dấu lại bằng hash mới.

### Bước 6: validate và finish

~~~powershell
agent-workspace evidence validate DEMO-1
agent-workspace task finish DEMO-1
agent-workspace task list
~~~

Finish chỉ thành công khi contract/current source/artifacts/DoD/review/governance đều pass và không còn semantic uncertainty. Nó đổi status thành done; không commit/push/merge.

**Source đổi sau evidence init?** Tạo receipt mới bằng --file, chạy lại checks/review và dùng cùng --file ở record/validate/review/finish:

~~~powershell
agent-workspace evidence init DEMO-1 --file .agent/evidence/DEMO-1-v2.json
agent-workspace evidence validate DEMO-1 --file .agent/evidence/DEMO-1-v2.json
~~~

Không sửa source_digest bằng tay để làm receipt cũ pass.

## 9. CRUD rules: maintainer và executor làm khác nhau

Rule bắt buộc phải nói rõ **instruction + required evidence + failure condition**.

| Level | Khi nào được nạp? |
| --- | --- |
| core | Mọi task |
| specialist | Bắt buộc khi path/symbol/tag/description match |
| reference | Guidance khi match/on demand |

Rule Markdown không có metadata được coi là mandatory để tránh silently bỏ sót.

### Maintainer tạo rule

Chỉ dùng --maintenance sau khi được phép bảo trì knowledge:

~~~powershell
agent-workspace rules new api-contract --maintenance --by "API maintainer"
~~~

Rule mới là draft, chưa được áp dụng. Soạn candidate đã review, ví dụ .agent/change-requests/api-contract-v1.md theo [examples/api-rule.md](examples/api-rule.md).

### Đọc/list/resolve rule

~~~powershell
agent-workspace rules list
agent-workspace rules show api-contract
agent-workspace rules resolve "public API contract" --path src/api/orders.mjs --tag api
~~~

resolve luôn có CORE và matched rules. Khi API rule cần semantic/browser tools, thêm capability tương ứng và yêu cầu evidence rõ ràng.

### Update/release rule

~~~powershell
agent-workspace rules update api-contract --from .agent/change-requests/api-contract-v1.md --maintenance --by "API maintainer"
agent-workspace doctor
~~~

Candidate phải giữ ID, có version/level/status/body. Thay đổi content cần đổi SemVer. Active specialist cần applicability paths/scope/symbols/tags. CORE không được sửa/xóa bằng CRUD specialist; CORE được release trong maintenance riêng đã được cho phép.

Rule có thể thêm required_evidence: [E1, E4, E5]. prepare và completion gate vẫn đòi các kinds này dù task sơ suất không khai báo.

### Delete/retire rule

~~~powershell
agent-workspace rules delete api-contract --maintenance --by "API maintainer"
~~~

Rule được archive dưới .agent/archive/rules/. Không xóa CORE. Sau maintenance, các task đã prepare trên knowledge cũ phải được review/update/reapprove để lấy baseline mới.

### Executor phát hiện rule sai: tạo proposal

~~~powershell
agent-workspace rules request-fix api-contract --type outdated --reason "Current schema contradicts the documented response" --evidence .agent/evidence/LOGIN-42/schema-check.txt --proposed-change "Clarify the supported response shape"
~~~

Lệnh tạo YAML trong .agent/change-requests/, giữ nguyên rule. Maintainer đọc proposal, kiểm tra evidence, soạn bản mới và release qua maintenance. --type nhận outdated/conflict/insufficient; --evidence có thể lặp lại.

## 10. CRUD wiki và raw onboarding sources

Raw sources giữ tại .agent/raw/. Một page wiki đại diện bounded context/concept, có summary, source links, critical contracts và verification entry points.

~~~powershell
agent-workspace wiki new authentication --description "Login, sessions and token boundaries" --maintenance --by "Auth maintainer"
agent-workspace wiki list
agent-workspace wiki show authentication
~~~

Wiki new tạo page draft và entry trong MAP.yaml. Mở candidate, giữ metadata id/version/released_at/status/owner/scope/verified_against. Active release cần ngày và source revision thực sự đã kiểm tra; không bịa commit hash.

~~~yaml
id: authentication
version: 1.0.0
released_at: "2026-10-05"
status: active
owner: auth-maintainer
scope: [src/auth/**]
verified_against: actual-git-commit-reviewed
~~~

Release candidate đã được review:

~~~powershell
agent-workspace wiki update authentication --from .agent/change-requests/auth-v1.md --tag authentication --tag session --symbol resolveSession --maintenance --by "Auth maintainer"
agent-workspace wiki resolve src/auth/session.ts
agent-workspace wiki check-stale
~~~

Update đồng bộ scope thành paths trong MAP.yaml; --tag/--symbol cập nhật routing khi được truyền. Related contexts có thể thêm vào MAP.yaml trong maintenance; doctor kiểm tra context IDs hợp lệ.

check-stale so sánh revision đã verify với tracked/staged/working/untracked files thuộc scope. potentially-stale là tín hiệu cần kiểm tra, không phải bằng chứng page chắc chắn sai. Git chưa có commit hoặc scope rỗng sẽ báo unknown/unverified/scope-not-defined.

~~~powershell
agent-workspace wiki delete authentication --maintenance --by "Auth maintainer"
~~~

Delete archive page, xóa map entry và related links tới context đó. Executor chỉ request-fix:

~~~powershell
agent-workspace wiki request-fix authentication --type conflict --reason "Current session flow differs" --evidence .agent/evidence/LOGIN-42/session-trace.json --proposed-change "Update the documented session boundary"
~~~

Các page scaffold architecture/conventions/glossary ban đầu là draft và chưa route. Khi onboarding, tạo/review context qua wiki new/update hoặc đăng ký page hiện có trong MAP.yaml bằng maintenance được phép. Runtime chỉ load page active.

## 11. CRUD skill riêng của project

~~~powershell
agent-workspace skills list
agent-workspace skills show tdd
agent-workspace skills resolve "regression test"
~~~

Tạo skill bằng một thư mục .agent/skills/<name>/SKILL.md trong maintenance đã được cho phép:

~~~markdown
---
name: api-verification
description: Verify this project's API schemas and supported integration test commands.
metadata:
  agent_workspace:
    paths: [src/api/**]
    tags: [api, schema]
    capabilities: []
---

# API verification

Use the repository's supported schema and integration test commands.
Record actual output and inspect affected public consumers.
~~~

name dùng chữ thường/số/dấu -, tối đa 64 ký tự. description nói capability và khi áp dụng. Đặt scripts/references/assets cạnh SKILL.md nếu thật sự cần; resolver chỉ nạp entrypoint, supporting resources được đọc khi cần.

Read bằng skills show. Update bằng sửa nội dung trong maintenance. Delete bằng chuyển thư mục skill sang chỗ archive của maintainer. Không sửa skill trong execution đã prepare.

Skill local cùng tên override skill global. Task có thể khai báo skills: [api-verification] để nạp rõ ràng. Skill không tồn tại khiến prepare fail. Auto selection giới hạn theo skills.max_auto; explicit skills không bị cắt.

Các bộ skills bên ngoài có thể được maintainer chọn/cài bổ sung cùng references và giấy phép gốc. Không auto-load toàn bộ thư viện React vào project không dùng React. Runtime mặc định dùng 7 skill đã được điều chỉnh theo pipeline này.

## 12. Cấu hình capabilities và custom harness

Mở .agent/workspace.yaml trong maintenance được phép:

~~~yaml
tools:
  typescript_semantic:
    required: true
    provider: project-typescript-lsp
  semantic:
    required: false
    provider: null
  browser:
    required: false
    provider: chrome-devtools
  github:
    required: false
    provider: gh
review:
  independent: true
  provider: null
~~~

Provider là tên tool đang có **thực tế** trong harness, đúng repo. Điền string trong config không tự cài hoặc kết nối MCP. Sau cấu hình, thử tool trong harness và lưu output thật. Project có tsconfig được init với typescript_semantic.required=true; targets .ts/.tsx tự yêu cầu capability TypeScript.

E1 không có target TypeScript sẽ dùng capability semantic. E3 với tag ui/browser/frontend yêu cầu browser; runtime khác khai báo capability phù hợp trong task. Các capability bổ sung do task/rule/skill yêu cầu phải tồn tại trong tools.

Custom executable adapter, luôn nhận Employee Brief trên stdin:

~~~yaml
adapters:
  my-harness:
    command: actual-harness-executable
    args: [actual-supported-noninteractive-flag]
~~~

~~~powershell
agent-workspace run DEMO-1 --with my-harness --dry-run
agent-workspace run DEMO-1 --with my-harness
~~~

Thay executable/flags bằng cú pháp đã xác minh của harness thật. command/args là argv, không phải shell script. Đặt actual model ID/high effort trong harness hoặc adapter args được hỗ trợ; không copy các target labels làm model ID.

execution mặc định single, recursive_delegation=false, max_subagents=2. Fan-out cần independent uncertainty, ownership rõ và authorization của phiên/harness; package không tự spawn swarm.

## 13. Learning: collect trước, propose sau

~~~powershell
agent-workspace learn collect --task LOGIN-42 --reason "Semantic lookup was repeatedly bypassed" --evidence .agent/evidence/LOGIN-42/review.txt
agent-workspace learn propose --category tool-routing --reason "The same routing failure occurred across reviewed tasks" --evidence .agent/learning/ACTUAL-COLLECTED-ID.json --proposed-change "Clarify the provider routing guidance"
~~~

Thay ACTUAL-COLLECTED-ID bằng file output thật. Categories: skill, wiki, task-compiler, tool-routing, executor-capability. Proposal được human/strong layer review trước release; không tự tăng prompt hay rewrite wiki sau mỗi task.

## 14. Kiểm tra và xử lý lỗi

~~~powershell
agent-workspace --help
agent-workspace doctor
agent-workspace repo inspect --json
agent-workspace task validate LOGIN-42
agent-workspace prepare LOGIN-42 --brief
agent-workspace evidence validate LOGIN-42 --json
~~~

| Lỗi / finding | Nghĩa và cách xử lý |
| --- | --- |
| REPO_NOT_INITIALIZED | Vào đúng repo hoặc dùng --repo; init trước |
| MISSING_CONTEXT | CORE/index/map bị thiếu; khôi phục từ release đúng, không tự thay bằng file rỗng |
| INVALID_CONTRACT / SCHEMA_INVALID | Đọc details; điền sections, thay TODO, sửa IDs/DoD/field types |
| TASK_NOT_APPROVED | Review semantics rồi ghi approval có thật |
| APPROVAL_STALE / BASELINE_STALE | Contract đổi; update/review/reapprove và prepare revision mới |
| SKILL_NOT_FOUND | Kiểm tra skills list và tên trong contract |
| MISSING_CAPABILITY | Kết nối provider đúng repo, khai báo và kiểm tra live tool trong harness |
| GOVERNANCE_CHANGED | Khôi phục mutation trong execution và gửi proposal; nếu maintenance hợp lệ, tạo task revision được duyệt mới |
| ARTIFACT_CHANGED / EMPTY_ARTIFACT | Artifact bị đổi/rỗng; chạy lại verification và capture output thật |
| EVIDENCE_GATE_FAILED | Details chỉ ra missing kinds/DoD links/review/source drift/write scope |
| REVIEW_STALE / EVIDENCE_STALE | Source/contract đổi; chạy lại checks và fresh review, dùng receipt mới nếu cần |
| UNSAFE_PATH | Không dùng absolute/../symlink cho managed files; đặt artifact ở trong repo |
| VERSION_NOT_BUMPED | Bump SemVer của rule/wiki trước release |
| EXECUTION_ACTIVE | Run còn hoạt động; kết thúc/dừng harness trước maintenance |
| WIKI_NOT_RELEASED | Thông tin cho repo mới; onboarding/release knowledge khi cần |
| PowerShell chặn script launcher của npm | Chạy cùng lệnh bằng terminal/shell hỗ trợ npm, hoặc kiểm tra ExecutionPolicy của môi trường |

doctor kiểm tra config/files, không thay thế semantic lookup, browser tests hoặc xác minh model thật. JSON stdout dành cho scripts; lỗi ra stderr. Exit code: 0 thành công, 1 lỗi command/gate, 2 doctor có finding mức error.

Nếu máy crash để lại .agent/execution.lock: đọc PID/task trong lock, xác nhận process thật đã dừng trước khi xóa lock. Không xóa lock của execution còn chạy. Giữ nguyên baseline/evidence để kiểm tra lại.

Hash source bao phủ tracked/staged/untracked files Git nhìn thấy, ngoài runtime artifacts .agent và global home. Git-ignored inputs như environment/secrets không nằm trong digest; hãy khai báo/capture version của external runtime/config khi task phụ thuộc chúng. Repo không Git, hoặc nguyên workspace bị Git cha ignore, được fingerprint như thư mục độc lập và bỏ qua các thư mục runtime/build phổ biến. Symlink trong managed/source files được từ chối để tránh đọc/ghi ra ngoài root.

Validator kiểm tra schema, links, hashes, source freshness và governance. Nó không thể tự chứng minh văn bản trong artifact là đúng, xác thực danh tính --by, hoặc khóa model của một IDE bên ngoài. Independent review và sự trung thực của tool output vẫn là phần bắt buộc của pipeline.

## 15. Hướng dẫn demo cho người mới

1. Tạo một repo thử trống và chạy init --with codex,claude --distribution github.
2. Copy [examples/task.md](examples/task.md) vào .agent/tasks/DEMO-1.md.
3. Đọc và duyệt contract bằng task approve; prepare trước khi code để có baseline.
4. Tạo src/greet.mjs theo [examples/demo/greet.mjs](examples/demo/greet.mjs), và test/greet.test.mjs theo [examples/demo/greet.test.mjs](examples/demo/greet.test.mjs). Đổi import trong test thành ../src/greet.mjs. Test kiểm tra explicit/default name bằng node:test và node:assert/strict.
5. Chạy tests thật, tạo receipt/E4, record E5 và nối D1 vào changes/tests theo mục 8.
6. Nhờ một reviewer ở context mới kiểm tra, record review với hashes đúng.
7. evidence validate rồi task finish. Thử sửa source sau đó và validate lại để thấy source-drift gate hoạt động.

Đây là demo learning, không phải task để sửa project production. Trong task thật, agent tự vận hành các bước cơ học; user chỉ giữ các semantic/human gates.

## 16. Phát triển và phát hành package

Từ thư mục source chứa package.json:

~~~powershell
npm ci
npm run check
npm test
npm pack
~~~

Đoạn trên dành cho người phát triển source, không phải người cài package. pack chạy syntax/skill checks và integration tests trước khi tạo agent-workspace-pipeline-0.2.0.tgz. Package chạy trực tiếp bằng Node.js, không cần build TypeScript. resource, test artifacts, npm credentials và node_modules không nằm trong bản phát hành.

Maintainer xem [docs/publishing.md](docs/publishing.md) để kiểm tra registry, login, chạy release dry run và publish; [CHANGELOG.md](CHANGELOG.md) ghi thay đổi từng version. User cài package theo mục 1.

Xem [docs/reference-decisions.md](docs/reference-decisions.md) để biết phần được kết hợp từ plan, tóm tắt, common-skills, Harnix và ảnh wiki. Thư mục resource dùng để tham khảo đã được bỏ sau khi kết hợp nội dung; không cần nó để cài hoặc phát triển package.

V1 có resolver, templates, adapters, Task Contract/evidence gates, governed CRUD và proposal learning. RAG, custom runtime/daemon, quota routing, autonomous knowledge promotion, multi-repo orchestration và UI thuộc phạm vi sau.
