# Agent Workspace Pipeline

Package npm biến workspace/repo thành một pipeline task/plan cho coding agent: hiểu yêu cầu → chốt một Task Contract → nạp đúng rules/wiki/skills → implement → thu evidence → independent review → hoàn tất.

Tên package trên npm là **agent-workspace-pipeline**; lệnh CLI là **agent-workspace**. Bạn có thể gửi yêu cầu bằng ngôn ngữ tự nhiên trong IDE sau khi init. Agent vận hành CLI theo adapter. Human giữ quyền duyệt semantics, giải quyết semantic escalation và merge.

Mặc định mọi vai trò dùng model mạnh và effort cao, theo mục tiêu của chủ workspace: **Gemini 3.8+, Claude Sonnet/Opus 5.0+, GPT 5.6 Sol/Terra high+**. Những tên này là yêu cầu về năng lực; chọn **model ID thực tế** và effort trong harness đang dùng. Package không gọi LLM API hoặc tự xác minh phiên bản model.

## 1. Cài đặt lần đầu

Cần Node.js 22+, quyền ghi repo và một harness đã cài/đăng nhập. Git được khuyến nghị để kiểm tra source và wiki; thư mục chưa có Git vẫn dùng được.

Package có thể phân phối qua **npm registry** hoặc **GitHub Release**. Cả hai đều cài bằng npm/npx, không cần source repo hoặc file trên máy tác giả. Bản đầu tiên phân phối qua GitHub Release; npm registry dùng sau khi maintainer hoàn tất login/publish. Lệnh npm/npx/agent-workspace dùng chung trên Windows, macOS và Linux; các ví dụ PowerShell riêng được ghi rõ.

### Cài ngay từ GitHub Release

~~~powershell
npm install --global https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.1.0/agent-workspace-pipeline-0.1.0.tgz
~~~

Vào project và khởi tạo:

~~~powershell
Set-Location "D:/my-project"
agent-workspace init --with codex --distribution github
agent-workspace doctor
~~~

Hoặc khởi tạo bằng đúng một lệnh ngay trong project:

~~~powershell
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.1.0/agent-workspace-pipeline-0.1.0.tgz init --with codex --distribution github
~~~

**Lệnh init cài đủ bộ pipeline ngay:** 7 skills pipeline/analyze/interview/plan/tdd/review/wiki-maintenance, global/repo CORE rules, cấu trúc tasks/wiki/rules/evidence và adapter cho harness. Không cần một lệnh setup skill riêng.

--distribution github lưu kênh phân phối vào .agent/workspace.yaml; router sẽ tải cùng version từ GitHub Release trên mọi máy. Thay codex bằng claude/gemini/antigravity/generic nếu dùng harness khác. URL release là URL public cố định, không cần Git, token GitHub hoặc clone source.

### npm registry — cách A: cài một lần, dùng ở mọi project

Áp dụng sau khi package đã publish npm. Nếu npm báo E404, dùng GitHub Release phía trên; maintainer xem [hướng dẫn phát hành](docs/publishing.md).

~~~powershell
npm install --global agent-workspace-pipeline
agent-workspace --version
~~~

Vào project cần dùng và khởi tạo:

~~~powershell
Set-Location "D:/my-project"
agent-workspace init --with codex
agent-workspace doctor
~~~

init đồng thời tạo rules/skills dùng chung, cấu trúc .agent của project và adapter cho harness. Mở project trong IDE, chọn model mạnh/high rồi giao task bằng ngôn ngữ tự nhiên. Chạy init lại giữ nguyên file đã có; chỉ tạo phần còn thiếu và thêm router vào file hướng dẫn chưa có router. bootstrap là alias của init.

Nếu dùng Claude/Gemini/Antigravity, thay codex bằng claude/gemini/antigravity. Để cài thêm adapter vào cùng repo:

~~~powershell
agent-workspace adapter install --with claude
agent-workspace adapter install --with gemini
~~~

### npm registry — cách B: khởi tạo bằng một lệnh, không cần cài global

Chạy ngay trong project:

~~~powershell
npx --yes agent-workspace-pipeline@latest init --with codex
~~~

Có thể thêm --repo "D:/my-project" nếu chạy từ thư mục khác. Chọn claude/gemini/antigravity/generic thay codex theo harness.

Adapter ghi lệnh npm theo **tên package + version chính xác**, hoặc URL release nếu chọn distribution github. Nó không ghi đường dẫn cài đặt, npm cache hay user của máy tác giả. Khi clone workspace sang máy khác, lệnh npx tải đúng version nếu chưa có. Package cần registry/release hoặc cache khả dụng khi tải; sau khi cài, task và evidence được lưu trong workspace.

Tự gọi CLI mà chưa cài global:

~~~powershell
npx --yes --package agent-workspace-pipeline@0.1.0 agent-workspace doctor
~~~

**Team muốn pin dependency trong project:** chạy npm install --save-dev agent-workspace-pipeline@0.1.0, commit package.json/package-lock.json và dùng npm ci trên máy khác. Khi dependency đã có, npx agent-workspace init --with codex chạy binary trong node_modules. Tên package khác tên binary: tránh chạy npx agent-workspace khi chưa cài dependency, vì tên agent-workspace trên npm thuộc một dự án khác.

### macOS/Linux

~~~bash
npm install -g agent-workspace-pipeline
cd /path/to/project
agent-workspace init --with codex
~~~

Các ví dụ còn lại dùng agent-workspace sau khi cài global. Nếu chỉ dùng npx, thêm tiền tố invocation trong adapter trước mỗi lệnh, như ví dụ doctor ở trên.

### Máy mới, nâng cấp và adapter cũ

Khi clone một repo đã init, chạy agent-workspace setup để tạo global rules/skills cho user hiện tại, rồi doctor. setup chỉ tạo global home; init khởi tạo cả project. Các đường dẫn mặc định dùng ~ nên không phụ thuộc tên user. Nếu team chọn --home riêng, cấu hình AGENT_WORKSPACE_HOME phù hợp trên từng máy.

Nâng cấp CLI và thay router cũ có đường dẫn local:

~~~powershell
npm install --global agent-workspace-pipeline@latest
agent-workspace adapter install --with codex --refresh
~~~

Nếu dùng GitHub, thay lệnh install bằng URL tarball của release mới. Muốn đổi kênh sau khi npm đã publish, maintainer sửa cli.distribution trong .agent/workspace.yaml thành npm rồi refresh router. init không đổi kênh trong config đã có.

--refresh chỉ thay block giữa hai marker agent-workspace trong adapter; giữ nguyên instructions khác trong file. Lặp lại cho những harness team đang dùng. Thực hiện maintenance trước khi approve/prepare task mới; thay adapter của task đang prepared sẽ làm governance hash thay đổi. Refresh bị chặn khi execution đang chạy. init/setup giữ nguyên rules/skills đã tùy chỉnh; việc nâng version nội dung đó do maintainer kiểm tra riêng.

## 2. Sau khi cài, những gì nằm ở đâu?

| Vị trí | Vai trò |
| --- | --- |
| ~/.agent-workspace/core/CORE.md | Cách làm việc bắt buộc, dùng chung mọi project |
| ~/.agent-workspace/skills/ | Pipeline, analyze, interview, plan, tdd, review, wiki-maintenance |
| ~/.agent-workspace/handbook/ | Giải thích evidence và wiki khi cần |
| ~/.agent-workspace/profiles/strong.yaml | Các vai trò và mục tiêu model mạnh/high |
| .agent/workspace.yaml | Cấu hình nối project với global workspace và tool providers |
| .agent/CORE.md | Invariant bắt buộc riêng của repo |
| .agent/rules/ | Specialist/reference rules của project |
| .agent/skills/ | Skill riêng của project |
| .agent/raw/ | Tài liệu onboarding gốc |
| .agent/wiki/INDEX.md, MAP.yaml | Knowledge index và routing |
| .agent/tasks/ID.md | Một living Task Contract cho mỗi task |
| .agent/prepared/ID/ | Employee Brief và baseline kiểm tra |
| .agent/evidence/ | Receipt, logs và review artifacts |
| .agent/change-requests/ | Proposal sửa rules/wiki hoặc learning |
| .agent/archive/ | Bản lưu task/rule/wiki đã xóa |

Global workspace dạy agent **cách làm việc**. Repo dạy agent **project hoạt động thế nào**. Wiki cung cấp orientation; current source, semantic tools, tests và runtime mới là bằng chứng hiện tại.

Prepared/evidence/learning mặc định được ignore trong Git. Muốn chia sẻ evidence với reviewer/CI ở máy khác, chuyển các artifact thật cùng baseline/receipt qua kênh lưu trữ của team; đừng chỉ gửi dòng “đã kiểm tra”.

**Workspace có nhiều repo:** dùng chung global home, nhưng chạy init trong từng repo cần pipeline. Package không tự scan hoặc sửa các repo bên cạnh.

Tùy chọn dùng ở mọi lệnh:

~~~powershell
agent-workspace doctor --repo "D:/my-project" --home "D:/agent-company" --json
~~~

--repo chọn project; nếu bỏ, CLI tìm .agent/workspace.yaml từ thư mục hiện tại đi lên. --home hoặc biến AGENT_WORKSPACE_HOME đổi global home. Lưu global home ở ngoài project hoặc tại một thư mục con riêng như .agent-workspace; không đặt project bên trong global home.

## 3. Cách sử dụng hằng ngày trong IDE

Mở đúng repo đã init và chọn model mạnh/high trong harness. Gửi yêu cầu, ví dụ:

> Đọc yêu cầu này, kiểm tra impact bằng semantic tools, lập Task Contract LOGIN-42. Nếu chưa rõ semantics thì hỏi tôi; khi đã được duyệt, implement và cung cấp evidence cùng independent review.

Nếu chỉ muốn plan:

> Phân tích feature này và lập Task Contract draft, chưa implement.

Agent đọc CORE, dùng pipeline skill, chọn context và vận hành CLI. Chỉ có yêu cầu lập plan thì dừng ở plan. Phê duyệt có sẵn trong cuộc hội thoại được ghi nhận; không yêu cầu duyệt lặp lại.

| Harness | File init tạo/append | Chạy từ CLI |
| --- | --- | --- |
| Codex | AGENTS.md | run ID --with codex |
| Claude Code | CLAUDE.md | run ID --with claude |
| Gemini CLI | GEMINI.md | run ID --with gemini |
| Antigravity | .agent/rules/agent-workspace.md | prepare ID --format antigravity; dùng trong IDE |
| Harness khác | .agent/ADAPTER.md | prepare ID --format generic hoặc custom adapter |

Kiểm tra rule activation trong Antigravity IDE. Với generic adapter, đưa nội dung .agent/ADAPTER.md vào cơ chế instructions của harness.

Các executable Codex/Claude/Gemini và credentials phải được cài sẵn. Package dựng pipeline và cấu hình; không tự cài MCP, đăng nhập account hay lấy API key. Cú pháp adapter dựa trên [Codex noninteractive](https://learn.chatgpt.com/docs/non-interactive-mode), [Claude headless](https://code.claude.com/docs/en/headless) và [Gemini headless](https://geminicli.com/docs/cli/headless/).

## 4. CRUD một Task Contract

CRUD là Create / Read / Update / Delete: tạo, đọc, cập nhật và xóa khỏi danh sách hoạt động.

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

## 5. Run: chạy qua harness hoặc IDE

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

## 6. Evidence và hoàn tất một task

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

## 7. CRUD rules: maintainer và executor làm khác nhau

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

## 8. CRUD wiki và raw onboarding sources

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

## 9. CRUD skill riêng của project

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

Các bộ Vercel/React hoặc common-skills cung cấp trong resource có thể được maintainer chọn/cài bổ sung cùng references và giấy phép gốc. Không auto-load toàn bộ thư viện React vào project không dùng React. Runtime mặc định dùng 7 skill đã được điều chỉnh theo pipeline này.

## 10. Cấu hình capabilities và custom harness

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

## 11. Learning: collect trước, propose sau

~~~powershell
agent-workspace learn collect --task LOGIN-42 --reason "Semantic lookup was repeatedly bypassed" --evidence .agent/evidence/LOGIN-42/review.txt
agent-workspace learn propose --category tool-routing --reason "The same routing failure occurred across reviewed tasks" --evidence .agent/learning/ACTUAL-COLLECTED-ID.json --proposed-change "Clarify the provider routing guidance"
~~~

Thay ACTUAL-COLLECTED-ID bằng file output thật. Categories: skill, wiki, task-compiler, tool-routing, executor-capability. Proposal được human/strong layer review trước release; không tự tăng prompt hay rewrite wiki sau mỗi task.

## 12. Kiểm tra và xử lý lỗi

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

## 13. Hướng dẫn demo cho người mới

1. Tạo một repo thử trống và chạy init --with codex.
2. Copy [examples/task.md](examples/task.md) vào .agent/tasks/DEMO-1.md.
3. Đọc và duyệt contract bằng task approve; prepare trước khi code để có baseline.
4. Tạo src/greet.mjs theo [examples/demo/greet.mjs](examples/demo/greet.mjs), và test/greet.test.mjs theo [examples/demo/greet.test.mjs](examples/demo/greet.test.mjs). Đổi import trong test thành ../src/greet.mjs. Test kiểm tra explicit/default name bằng node:test và node:assert/strict.
5. Chạy tests thật, tạo receipt/E4, record E5 và nối D1 vào changes/tests theo mục 6.
6. Nhờ một reviewer ở context mới kiểm tra, record review với hashes đúng.
7. evidence validate rồi task finish. Thử sửa source sau đó và validate lại để thấy source-drift gate hoạt động.

Đây là demo learning, không phải task để sửa project production. Trong task thật, agent tự vận hành các bước cơ học; user chỉ giữ các semantic/human gates.

## 14. Phát triển và phát hành package

Từ thư mục source chứa package.json:

~~~powershell
npm ci
npm run check
npm test
npm pack
~~~

Đoạn trên dành cho người phát triển source, không phải người cài package. pack chạy syntax/skill checks và integration tests trước khi tạo agent-workspace-pipeline-0.1.0.tgz. Package chạy trực tiếp bằng Node.js, không cần build TypeScript. resource, test artifacts, npm credentials và node_modules không nằm trong bản phát hành.

Maintainer xem [docs/publishing.md](docs/publishing.md) để kiểm tra registry, login, chạy release dry run và publish; [CHANGELOG.md](CHANGELOG.md) ghi thay đổi từng version. User cài package theo mục 1.

Xem [docs/reference-decisions.md](docs/reference-decisions.md) để biết phần được kết hợp từ plan, tóm tắt, common-skills, Harnix và ảnh wiki. Thư mục resource dùng để tham khảo đã được bỏ sau khi kết hợp nội dung; không cần nó để cài hoặc phát triển package.

V1 có resolver, templates, adapters, Task Contract/evidence gates, governed CRUD và proposal learning. RAG, custom runtime/daemon, quota routing, autonomous knowledge promotion, multi-repo orchestration và UI thuộc phạm vi sau.
