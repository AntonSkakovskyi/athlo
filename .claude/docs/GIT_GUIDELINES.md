# Git & Commit Standards

Commits: one logical change per commit, descriptive message, clean linear history.

## 1. Message Format
`<scope>: <short description>`

**Scope:** `api` (NestJS), `mobile` (React Native), `shared` (@athlo/shared), `monorepo` (config/CI), `docs` (markdown)

## 2. Examples
* `api: implement workout module with controller and service`
* `mobile: add authentication flow and useAuth hook`
* `shared: define exercise and muscle interfaces`
* `api: add validation to register dto`

## 3. Rules
* **Feature slices**: Group all logic for one module (service, controller, dto, entity) in ONE commit
* **No skeletons**: Don't commit empty files — commits must contain working code
* **English, imperative**: "add feature", not "added"
* **Max 60 characters** for title
* **Linear history**: Use `git pull --rebase`, avoid merge commits

## 4. AI Instructions
1. Group files by feature — one logical feature = one commit
2. Check scope: api-only → `api: ...`, mobile-only → `mobile: ...`, both → two separate commits
3. Avoid duplicates — don't propose committing files already in a prior proposal
4. Provide exact command: `git add . && git commit -m "scope: description"`