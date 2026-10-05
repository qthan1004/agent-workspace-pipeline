# Phát hành agent-workspace-pipeline

Tài liệu này dành cho maintainer. User cài từ npm theo README.

## Danh tính package

- npm package: agent-workspace-pipeline.
- CLI binary: agent-workspace.
- Registry: https://registry.npmjs.org/.
- Access: public, đã cấu hình trong package.json.
- Runtime: Node.js 22+, JavaScript ESM; không cần build trước khi chạy.

Tên agent-workspace trên registry đã thuộc dự án khác. Không publish hoặc chạy npx bằng tên package đó. Tên agent-workspace-pipeline chưa có trên registry tại thời điểm kiểm tra ban đầu; registry sẽ quyết định quyền sử dụng tên ở lần publish đầu tiên.

Source public: [qthan1004/agent-workspace-pipeline](https://github.com/qthan1004/agent-workspace-pipeline). repository/homepage/bugs trong package.json trỏ đến repo này.

## Chuẩn bị bản release

Từ thư mục source chứa package.json:

~~~powershell
npm ci
npm run release:check
npm pack
npm install --prefix .test-artifacts/packed-install --ignore-scripts --no-audit --no-fund ./agent-workspace-pipeline-0.1.0.tgz
npm run smoke:packed
npm run smoke:registry
~~~

release:check thực hiện npm publish --dry-run. Lifecycle prepack kiểm tra syntax/skill manifests và integration tests; dry run liệt kê chính xác các file sẽ publish. Chỉ bin/src/templates/schemas/docs/examples/README/CHANGELOG/LICENSE và metadata npm được đóng gói; resource, tests, scripts phát triển, caches và cấu hình tài khoản được loại khỏi runtime package.

smoke:packed chạy CLI từ package đã cài, tạo task demo, chạy test thực tế, kiểm tra receipt/review IO và completion gate. Review trong smoke test là fixture được đánh dấu rõ, không phải bằng chứng một model reviewer thật đã review.

smoke:registry phục vụ **registry thử trên loopback** và tarball hiện tại, rồi chạy đúng lệnh npm/npx theo package name. Nó kiểm tra init/doctor, router theo version và khả năng tải lại sau khi chuyển workspace sang thư mục/cache khác. Dependencies vẫn được lấy từ npm public. Kiểm thử này không publish package lên npmjs.com.

## GitHub Release: phân phối khi chưa có npm account

GitHub Release lưu đúng tarball npm; user cài bằng URL HTTPS public, không cần clone source. Sau khi kiểm thử, commit/push source và tạo release kèm tarball:

~~~powershell
gh release create v0.1.0 ./agent-workspace-pipeline-0.1.0.tgz --repo qthan1004/agent-workspace-pipeline --target main --title "Agent Workspace Pipeline 0.1.0" --notes-file CHANGELOG.md
~~~

Lệnh user:

~~~powershell
npx --yes https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v0.1.0/agent-workspace-pipeline-0.1.0.tgz init --with codex --distribution github
~~~

Kênh github được lưu trong workspace config. Router dùng URL release của cùng version, nên không phụ thuộc npm account hay local path. Kênh npm mặc định dùng package name/version trên registry; khi chuyển kênh, maintainer đổi cli.distribution và refresh adapter.

GitHub Actions trong .github/workflows/ci.yml kiểm tra Node 22/24 trên Windows/Linux, pack/install và smoke tests. CI chỉ kiểm tra; release/publish là thao tác của maintainer.

## Publish lần đầu

Registry thật yêu cầu một npm account có quyền publish. Login là thao tác của chủ tài khoản trong terminal:

~~~powershell
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
npm publish --access public
~~~

Hoàn tất xác thực/2FA khi npm yêu cầu. Chỉ coi release đã public sau khi npm publish thành công và lệnh sau trả đúng version:

~~~powershell
npm view agent-workspace-pipeline version --registry https://registry.npmjs.org/
~~~

Kiểm tra từ một project mới bằng lệnh user sẽ dùng:

~~~powershell
npx --yes --package agent-workspace-pipeline@0.1.0 agent-workspace init --with codex
npx --yes --package agent-workspace-pipeline@0.1.0 agent-workspace doctor
~~~

User sau đó cài global bằng npm install --global agent-workspace-pipeline hoặc dùng npx như README. Không cần tarball hay path trên máy maintainer.

## Phát hành version tiếp theo

1. Hoàn tất code và cập nhật CHANGELOG.
2. Chạy npm version patch --no-git-tag-version, hoặc chọn minor/major phù hợp. package.json và package-lock.json phải cùng version.
3. Chạy lại release:check; pack/install/smoke với tên tarball của version mới. smoke:registry tự đọc name/version hiện tại.
4. Publish và kiểm tra npm view như trên.
5. Hướng dẫn team nâng CLI và chạy adapter install --with <harness> --refresh trước khi chuẩn bị task mới.

Router pin version tại thời điểm init/refresh. Update CLI không tự ghi đè rules/skills đã tùy chỉnh hoặc router có sẵn. Điều này giữ workspace ổn định khi maintainer phát hành bản mới.

Để tự động hóa publish sau khi đã tạo npm package, dùng [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/). Cấu hình quyền publisher bằng repo/workflow thật. Workflow hiện có chỉ kiểm tra và không cần npm publish credentials.

Tham khảo chính thức: [publishing public packages](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages/), [npm exec/npx](https://docs.npmjs.com/cli/npm-exec/), [package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/).
