# Agent operations handbook

Tài liệu tra cứu cho agent vận hành pipeline và maintainer inspect/debug. User giao yêu cầu bằng conversation hoặc gửi tài liệu/plan; agent tự chọn ID, tạo/cập nhật contract, chạy CLI, thu evidence và chuyển trạng thái. Không đưa các bước này thành việc user phải làm.

Lệnh ví dụ dùng agent-workspace. Agent đọc portable invocation trong .agent/ADAPTER.md, chạy từ repo root với đúng version và thêm command/arguments tương ứng. CLI --help cho biết flags; global setup cài handbook này và examples vào home dùng chung, nên không cần clone source package.

| Input từ conversation | Agent xử lý |
| --- | --- |
| Câu hỏi/phân tích source hoặc plan | Trả phân tích, không tạo implementation task hoặc sửa code |
| Yêu cầu lập plan | Tự tạo/reuse draft contract khi cần, trả plan trong chat hoặc file được yêu cầu |
| Yêu cầu implement | Tự compile contract từ conversation/plan/source, ghi authorization đã có, prepare rồi thực hiện |
| Follow-up sửa requirement | Tiếp tục task liên quan; dùng update/reapprove nội bộ cho semantics mới đã được user cho phép |
| Review các thay đổi vừa làm | Xác định source/contract liên quan từ context, lấy hashes và review trong fresh context |

Markdown plan là input, không tự cấp quyền implement chỉ vì file được gửi. Giữ references và các quyết định áp dụng trong User Intent/Decisions; không sửa original plan nếu chưa được yêu cầu. Agent không hỏi user đặt ID, điền fields hoặc ký duyệt thêm một contract khi conversation đã cho phép concrete semantics.

Đọc phần cần dùng:

- [Task CRUD](#1-crud-một-task-contract)
- [Run](#2-run-chạy-qua-harness-hoặc-ide)
- [Evidence, review và finish](#3-evidence-và-hoàn-tất-một-task)
- [Rules](#4-crud-rules-maintainer-và-executor-làm-khác-nhau)
- [Wiki](#5-crud-wiki-và-raw-onboarding-sources)
- [Skills riêng](#6-crud-skill-riêng-của-project)
- [Capabilities](#7-cấu-hình-capabilities-và-custom-harness)
- [Learning](#8-learning-collect-trước-propose-sau)
- [Troubleshooting](#9-kiểm-tra-và-xử-lý-lỗi)

## 1. CRUD một Task Contract

Các lệnh dưới đây do agent thực hiện. CRUD là Create / Read / Update / Delete: tạo, đọc, cập nhật và xóa khỏi danh sách hoạt động.

### Create: tạo task

~~~powershell
agent-workspace task new DEMO-1
~~~

Agent đọc .agent/tasks/DEMO-1.md và điền contract từ conversation/source/plan. File mới là draft có TODO, nên agent hoàn thiện YAML và các section trước khi approve/execute.

| Field | Cách điền |
| --- | --- |
| id | Trùng tên file; 1–80 chữ/số/dấu - hoặc _ |
| status | draft trước khi duyệt |
| risk | low / medium / high |
| version | Số nguyên từ 1; task update tự tăng |
| discovery | Outcome, request/source references, flow, provenance và câu hỏi còn thiếu; agent ghi pending trước, ready khi đã đủ |
| paths | Các đường dẫn cụ thể liên quan, relative từ repo root |
| symbols | Các symbol cần điều tra, nếu biết |
| tags | Topic/domain giúp resolver chọn rules/wiki/skills |
| skills | Tên skill cần nạp rõ ràng; có thể để [] để auto route |
| expected_write_scope | File/glob dự kiến được sửa |
| required_capabilities | Tool capability cần có trong harness |
| required_evidence | E1–E5; luôn cần E4 |
| acceptance_criteria | Các kết quả quan sát được, có ID riêng |
| dod | ID, criterion, acceptance IDs và evidence kinds cần chứng minh |

Ví dụ YAML (thêm discovery ở mục tiếp theo; agent điền dữ kiện thực tế trước approval):

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

Xem [examples/task.md](../examples/task.md) cho contract đầy đủ của bài demo.

### Discovery: agent tự làm rõ và ghi lại

Trước approve/implementation, agent đọc request/plan và repo, chạy self-check trong CORE. Metadata execution từ 0.3.0:

~~~yaml
discovery:
  status: ready
  outcome: Thêm helper greet với hành vi trong acceptance criteria.
  sources:
    - kind: conversation
      reference: Request hiện tại yêu cầu implement demo greet.
      summary: Named/default greeting được yêu cầu rõ.
    - kind: source
      reference: Inventory src/test và package.json của target đã kiểm tra.
      summary: Project Node ESM, không có helper/caller trùng tên.
  flow: Consumer gọi greet -> helper trả greeting; test kiểm tra explicit/default input, không có state dùng chung.
  decisions:
    - decision: Dùng Node test runner, không thêm dependency.
      basis: agent
      reference: Judgment implementation trong scope demo và project conventions.
  open_questions: []
~~~

Đây là shape, không phải dữ kiện để copy vào target. sources.kind: conversation / plan / source / reference; phải có request (conversation hoặc plan) và source/project inspection thực tế. decisions.basis: user (reply thật), source (convention/contract đã đọc), agent (judgment trong scope rõ). Không ghi proposal thành user decision. flow ghi entry/input → owner/transition → output/callers và nhánh cần giữ; project mới ghi inventory thực tế và proposed flow riêng.

open_questions ghi câu hỏi còn thiếu có thể đổi outcome/scope/behavior/risk. Nếu có, giữ pending, hỏi và chờ trước dependent edits. Không đưa record cho user điền. Trước implementation không trivial, tóm tắt outcome/context/approach ngắn; không thêm sign-off khi request đã cấp quyền.

CLI chặn discovery thiếu/pending, open questions, thiếu request/source, flow/provenance rỗng. Nó không xác thực nội dung references; agent và fresh reviewer vẫn đối chiếu nguồn. Contract cũ thiếu discovery vẫn show/update/prepare --draft được; agent tự revise, bổ sung dữ kiện rồi approve/prepare trước execution. Demo ship ở pending: inspect target, bổ sung source và set ready; không copy rồi approve ngay.

Với material flow/contract, đọc technical-handoff reference trong .agent/skills/plan/references/technical-handoff.md (hoặc skills/plan/references/technical-handoff.md ở global home; dùng skills.local nếu cấu hình khác). Cập nhật applicable technical docs theo source cuối và kiểm tra chúng khớp code/test.

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

## 2. Run: chạy qua harness hoặc IDE

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

## 3. Evidence và hoàn tất một task

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

## 4. CRUD rules: maintainer và executor làm khác nhau

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

Rule mới là draft, chưa được áp dụng. Soạn candidate đã review, ví dụ .agent/change-requests/api-contract-v1.md theo [examples/api-rule.md](../examples/api-rule.md).

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

## 5. CRUD wiki và raw onboarding sources

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

## 6. CRUD skill riêng của project

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

## 7. Cấu hình capabilities và custom harness

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

## 8. Learning: collect trước, propose sau

~~~powershell
agent-workspace learn collect --task LOGIN-42 --reason "Semantic lookup was repeatedly bypassed" --evidence .agent/evidence/LOGIN-42/review.txt
agent-workspace learn propose --category tool-routing --reason "The same routing failure occurred across reviewed tasks" --evidence .agent/learning/ACTUAL-COLLECTED-ID.json --proposed-change "Clarify the provider routing guidance"
~~~

Thay ACTUAL-COLLECTED-ID bằng file output thật. Categories: skill, wiki, task-compiler, tool-routing, executor-capability. Proposal được human/strong layer review trước release; không tự tăng prompt hay rewrite wiki sau mỗi task.

## 9. Kiểm tra và xử lý lỗi

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

## 10. Demo nội bộ cho agent/maintainer

1. Tạo một repo thử trống và chạy init --with codex,claude --distribution github.
2. Copy [examples/task.md](../examples/task.md) vào .agent/tasks/DEMO-1.md.
3. Đọc và duyệt contract bằng task approve; prepare trước khi code để có baseline.
4. Tạo src/greet.mjs theo [examples/demo/greet.mjs](../examples/demo/greet.mjs), và test/greet.test.mjs theo [examples/demo/greet.test.mjs](../examples/demo/greet.test.mjs). Đổi import trong test thành ../src/greet.mjs. Test kiểm tra explicit/default name bằng node:test và node:assert/strict.
5. Chạy tests thật, tạo receipt/E4, record E5 và nối D1 vào changes/tests theo mục 3.
6. Nhờ một reviewer ở context mới kiểm tra, record review với hashes đúng.
7. evidence validate rồi task finish. Thử sửa source sau đó và validate lại để thấy source-drift gate hoạt động.

Đây là demo learning. Trong task thật, agent tự vận hành các bước nội bộ và ghi authorization từ conversation; user chỉ quyết định những vấn đề còn thiếu hoặc quyền chưa được cấp.
