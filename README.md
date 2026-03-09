# branching-test

Simulation of the Dealertrack Software Release Enhancement branching strategy.
Run on 2026-03-09 against this repo to validate the proposed flow end-to-end.

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code (source of truth) |
| `dev` | Integration branch for in-progress features |
| `qa` | QA testing branch (selective feature promotion) |
| `release/*` | Immutable release branches cut from QA |
| `feature/*` | Individual feature branches (created from main) |
| `hotfix/*` | Emergency fixes (created from main) |

## Simulation Steps Completed

1. Seed app (`app.js`, `config.json`) on main; created `dev` and `qa` branches
2. Feature A (`feature/login-page`): main -> dev via PR #1 (clean merge)
3. Feature B (`feature/dashboard`): main -> dev via PR #2 (CONFLICT on `app.js`)
4. Selective QA promotion: login -> qa (PR #3, clean), dashboard -> qa (PR #4, clean due to prior resolution)
5. Release branch `release/26.03.1` cut from qa, tagged `rc-26.03.1`
6. UAT deployment simulated, tagged `uat-26.03.1`
7. Production deployment: tagged `prod-26.03.1`, merged release back to main (PR #5)
8. Hotfix: `hotfix/login-fix` -> `release/26.03.1-hotfix` (PR #6), back-merged to main/dev/qa (PRs #7-9)
9. Feature C (`feature/user-profile`) + Feature D (`feature/notifications`) both merged to dev; only C promoted to qa. Release `release/26.03.2` cut. (CONFLICT on notifications -> dev, PR #11)
10. Branch reconciliation: not needed because back-merges already synced main into dev/qa

## Merge Conflicts Encountered

| Step | PR | Branches | File | Cause |
|------|----|----------|------|-------|
| 3 | #2 | `feature/dashboard` -> `dev` | `app.js` | Both features modified same file from same main base |
| 9 | #11 | `feature/notifications` -> `dev` | `app.js` | Same pattern: parallel features editing shared file |

Both conflicts required checking out the feature branch locally, merging the target into it, resolving, and pushing before the PR became mergeable.

## Findings: Weak Points

### 1. Merge conflicts on shared files are inevitable
Every time two features branch from `main` and touch the same file (like `app.js`), the second merge to `dev` will conflict. In a real codebase with dozens of features touching shared configuration, routing, or DI files, this will be constant. The branching strategy doesn't address this at all.

### 2. Feature branch contamination during conflict resolution
When `feature/dashboard` merged `origin/dev` to resolve conflicts, it absorbed `feature/login-page` code. This means the dashboard feature branch was no longer a pure "dashboard-only" branch. If QA had wanted dashboard without login, that would have been impossible. Selective promotion only works cleanly when features don't touch the same files.

### 3. Feature branches must stay alive until QA merge
The flow requires feature branches to merge into both `dev` (for integration testing) and `qa` (for promotion). If a developer deletes their feature branch after the dev merge (standard GitHub behavior with "Delete branch" checkbox), the QA promotion path is blocked. This needs enforcement via branch protection rules or team convention.

### 4. Release branch "immutability" contradicts hotfix needs
The doc says release branches are immutable, but hotfixes need to reach production. We had to create a separate `release/26.03.1-hotfix` branch. The doc should define whether hotfixes go on the original release branch or a new one, and what "immutable" actually means in practice.

### 5. No QA rejection procedure after release branch cut
If QA rejects Feature B after `release/26.03.1` is already created, there's no defined path. Options: revert the feature from the release branch (messy, and violates immutability), or abandon the release branch and cut a new one from QA after reverting there. Neither is documented.

### 6. Branch drift requires consistent back-merge discipline
Reconciliation from main -> dev/qa wasn't needed as a separate step because we back-merged the hotfix release consistently. But without a defined cadence, branches will drift. The longer the gap between back-merges, the worse the conflicts get.

### 7. Hotfix back-merge to dev/qa can conflict with in-flight work
Our hotfix back-merges were clean because no one was actively modifying `login.js` on dev/qa. In reality, a developer might be mid-feature touching the same file. The back-merge would conflict with their work.

### 8. The graph gets complex fast
After just 4 features and 1 hotfix, the commit graph is already hard to follow (60+ lines). With a full team running parallel features across multiple release cycles, the history will be very difficult to reason about.

## PR Log

| # | Title | Flow | Result |
|---|-------|------|--------|
| 1 | Feature: Login Page | feature/login-page -> dev | Merged clean |
| 2 | Feature: Dashboard | feature/dashboard -> dev | Conflict (resolved) |
| 3 | Promote login-page to QA | feature/login-page -> qa | Merged clean |
| 4 | Promote dashboard to QA | feature/dashboard -> qa | Merged clean (contaminated) |
| 5 | Release 26.03.1 -> main | release/26.03.1 -> main | Merged clean |
| 6 | Hotfix: login credential validation | hotfix/login-fix -> release/26.03.1-hotfix | Merged clean |
| 7 | Back-merge hotfix into main | release/26.03.1-hotfix -> main | Merged clean |
| 8 | Back-merge hotfix into dev | release/26.03.1-hotfix -> dev | Merged clean |
| 9 | Back-merge hotfix into qa | release/26.03.1-hotfix -> qa | Merged clean |
| 10 | Feature: User Profile | feature/user-profile -> dev | Merged clean |
| 11 | Feature: Notifications | feature/notifications -> dev | Conflict (resolved) |
| 12 | Promote user-profile to QA | feature/user-profile -> qa | Merged clean |

## Tags

| Tag | Points to | Purpose |
|-----|-----------|---------|
| `rc-26.03.1` | release/26.03.1 | Release candidate |
| `uat-26.03.1` | release/26.03.1 | UAT deployment |
| `prod-26.03.1` | release/26.03.1 | Production deployment |
| `prod-26.03.1-hotfix` | release/26.03.1-hotfix | Hotfix production deployment |
| `rc-26.03.2` | release/26.03.2 | Second release candidate |
