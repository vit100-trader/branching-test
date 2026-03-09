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

## Simulation steps completed

### Step 1: Set up long-lived branches + seed app
Created `app.js` and `config.json` on main, then branched `dev` and `qa` from it.
```
git checkout main
# add app.js, config.json, commit, push
git checkout -b dev main && git push origin dev
git checkout -b qa main && git push origin qa
```

### Step 2: Feature A -- branch from main, merge to dev
Created `feature/login-page` from main, added `login.js`, updated `app.js`. PR #1 to dev -- merged clean.
```
git checkout -b feature/login-page main
# add login.js, update app.js, commit, push
# PR: feature/login-page -> dev (merged clean)
```

### Step 3: Feature B -- second feature in parallel (CONFLICT)
Created `feature/dashboard` from main (not dev), added `dashboard.js`, updated `app.js`. PR #2 to dev -- **conflict on `app.js`** because both features modified it from the same main base.

To resolve, had to merge dev into the feature branch first:
```
git checkout feature/dashboard
git merge origin/dev
# CONFLICT in app.js -- both features changed the same lines
# manually resolve: combine both imports and module registrations
git add app.js
git commit -m "Resolve merge conflict: combine login + dashboard in app.js"
git push origin feature/dashboard
# PR now mergeable -- merged
```

### Step 4: Promote features to QA
Per the new process, individual feature branches merge into QA (not the whole dev branch):
```
# PR: feature/login-page -> qa (merged clean)
# PR: feature/dashboard -> qa (merged clean -- but only because the conflict
#   resolution commit already pulled in login code, so dashboard branch is
#   no longer a pure "dashboard-only" branch)
```

### Step 5: Create release branch
```
git checkout -b release/26.03.1 qa
git push origin release/26.03.1
git tag rc-26.03.1 release/26.03.1
git push origin rc-26.03.1
```

### Step 6: UAT deployment
```
git tag uat-26.03.1 release/26.03.1
git push origin uat-26.03.1
```

### Step 7: Production deployment
Tagged for prod, then merged release back into main:
```
git tag prod-26.03.1 release/26.03.1
git push origin prod-26.03.1
# PR: release/26.03.1 -> main (merged clean)
```

### Step 8: Hotfix
Found a bug in `login.js`. Created hotfix from main, merged into a new release branch, back-merged everywhere:
```
git checkout -b hotfix/login-fix main
# fix login.js, commit, push
git checkout -b release/26.03.1-hotfix main
git push origin release/26.03.1-hotfix
# PR: hotfix/login-fix -> release/26.03.1-hotfix (merged)
git tag prod-26.03.1-hotfix release/26.03.1-hotfix
git push origin prod-26.03.1-hotfix

# back-merge to all long-lived branches:
# PR: release/26.03.1-hotfix -> main (merged clean)
# PR: release/26.03.1-hotfix -> dev  (merged clean)
# PR: release/26.03.1-hotfix -> qa   (merged clean)
```

### Step 9: Selective QA promotion (stress test)
Feature C (`user-profile`) and Feature D (`notifications`) both merged to dev, but only C promoted to QA.

Feature D hit the same `app.js` conflict pattern as Step 3:
```
git checkout feature/notifications
git merge origin/dev
# CONFLICT in app.js -- same pattern, had to combine all modules
git add app.js
git commit -m "Resolve merge conflict: combine profile + notifications in app.js"
git push origin feature/notifications
# PR now mergeable -- merged to dev
```

Selective promotion:
```
# PR: feature/user-profile -> qa (merged clean)
# feature/notifications stays in dev only
git checkout -b release/26.03.2 qa
git push origin release/26.03.2
git tag rc-26.03.2 release/26.03.2 && git push origin rc-26.03.2
```
Result: `release/26.03.2` has features A+B+C but not D. Selective promotion worked.

### Step 10: Branch reconciliation
Attempted to merge main -> dev and main -> qa. GitHub reported "no commits between dev and main" -- the back-merges from Step 8 had already synced everything. Not needed as a separate step when back-merges are done consistently.

## Merge conflicts encountered

| Step | PR | Branches | File | Cause |
|------|----|----------|------|-------|
| 3 | #2 | `feature/dashboard` -> `dev` | `app.js` | Both features modified same file from same main base |
| 9 | #11 | `feature/notifications` -> `dev` | `app.js` | Same pattern: parallel features editing shared file |

Both conflicts required checking out the feature branch locally, merging the target into it, resolving, and pushing before the PR became mergeable.

## Findings: weak points

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

## PR log

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

---

## Experiment summary

I ran the full proposed branching strategy against a small Node.js app -- 4 features, 1 hotfix, 2 release cycles. The idea was to stress-test the flow in a controlled environment before we try it on the real codebase.

### What worked

**Selective QA promotion works when features don't overlap.** Feature C (user-profile) went to QA on its own, Feature D (notifications) stayed in dev, and the release branch had exactly what we intended. This is the whole point of the new flow, and it delivered.

**The hotfix path works.** Branch from main, fix, merge into a release branch, tag for prod, back-merge everywhere. No surprises.

**The tagging convention is useful.** `rc-`, `uat-`, `prod-` prefixed tags make it easy to trace any commit to its deployment stage.

### What breaks down at scale

This simulation used 4 tiny files. The real Dealertrack codebase has thousands of files, shared configuration, DI containers, routing tables -- files that many features touch at the same time. Here's where things get ugly:

**Merge conflicts become routine.** We hit conflicts on 2 out of 4 feature merges to dev, with just one shared file (`app.js`). In reality, files like `Startup.cs`, `appsettings.json`, route registrations, and DI configuration get touched by almost every feature. With 6-8 features in parallel, expect conflicts on roughly every second merge to dev.

**Selective promotion breaks when features share files.** When `feature/dashboard` had to merge dev into itself to resolve a conflict, it absorbed `feature/login-page`'s code. After that, the dashboard branch was no longer independently promotable -- it carried login code with it. In a real sprint with 6 features all touching shared files, most feature branches will be contaminated by mid-sprint. The "promote individual features to QA" model only works for features that touch completely separate areas of the codebase.

**Feature branches can't be deleted after the dev merge.** This is a process trap. GitHub offers "Delete branch" after merging a PR. Every developer has muscle memory for clicking it. But in this flow, the feature branch has to survive until it's also merged to QA. One accidental deletion and the QA promotion path is gone. Recreating the branch from a merge commit is doable but error-prone.

**The commit graph gets messy fast.** After 4 features and 1 hotfix, the graph was already 60+ lines of merge commits. In a real release cycle with 10+ features, multiple hotfixes, and back-merges, the history becomes very hard to follow. Figuring out "when did this change get introduced" turns into real work.

**The hotfix procedure contradicts release immutability.** The doc says release branches are immutable, but hotfixes need to go somewhere. We worked around this by creating a separate `release/26.03.1-hotfix` branch, but that's not documented. If someone applies the hotfix directly to the existing release branch (which the doc also implies is fine), the "immutable" guarantee is gone.

### What this looks like in a real sprint

This simulation used a single `app.js` file and 4 features. The real Dealertrack codebase is a large solution with multiple sub-projects, shared configuration files, DI registrations, routing, and dozens of developers working in parallel. The conflicts and contamination we saw here with 4 tiny features will be significantly worse at that scale.

Assume a 2-week sprint with 8 features across 4 developers, releasing every 2 weeks:

- **Day 1-3:** Features branch from main, start clean. First merges to dev go smoothly.
- **Day 4-6:** Second and third features merge to dev. Conflicts start appearing on shared files -- solution-level configs, DI registrations, shared projects. Feature branches start absorbing each other's code through conflict resolution.
- **Day 7-8:** QA promotion begins. Features that touched shared files can't be promoted independently. Team has to choose: promote them as a batch (losing selective promotion) or accept the contamination.
- **Day 9:** Release branch cut from QA. QA finds a bug in Feature B. No documented procedure for pulling it out. Team either reverts on the release branch (violating immutability) or abandons it and cuts a new one from a patched QA branch.
- **Day 10-11:** UAT runs. A production bug surfaces. Hotfix goes out. The back-merge to dev conflicts with in-flight features for the next sprint.
- **Day 12-14:** Release goes to prod. Main is updated. New feature branches from main are now out of sync with dev, which has accumulated unreleased work plus leftover conflict-resolution code from the previous cycle.

The overhead will scale with the size of the codebase. In a large monorepo with multiple sub-projects, the number of merge conflicts and the time spent resolving them will be much higher than what we saw in this toy example. Add to that the process confusion around selective promotion for entangled features and the ongoing risk of someone deleting a feature branch too early.

### Recommendations

1. Set a reconciliation cadence. Merge main back into dev and qa after every production release. Don't leave it to chance.
2. Turn off auto-delete for feature branches. Configure the repo setting, or at minimum make it very clear in the team docs that feature branches have to survive until QA promotion.
3. Sort out hotfix vs. immutability. Either hotfixes always create new release branches (what we did here) or "immutable" just means "no new features but hotfixes are fine." Pick one, write it down.
4. Document the QA-rejection procedure. What happens when QA rejects a feature after the release branch is already cut? Revert on the release branch? Abandon and re-cut? The team needs to know before it happens.
5. Be honest that selective promotion has limits. When features share files, batch promotion to QA may be the only practical option. The process should say so instead of implying full independence is always possible.
6. Consider feature flags as the actual solution for selective release. If the business needs Feature A in prod without Feature B, feature flags at the application level are more reliable than trying to keep branches surgically isolated -- especially in a monolithic codebase where features inevitably touch the same files.
