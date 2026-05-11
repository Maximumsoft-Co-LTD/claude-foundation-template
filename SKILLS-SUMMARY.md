# Skills Summary

สรุปทุก skill ใน `.claude/skills/` — ใช้ทำอะไร, trigger ตอนไหน, ใช้ใน command ไหน

จัดกลุ่มตาม `CLAUDE.md` → Atomic Skills section.

---

## 1. Intent atom — เข้าใจความต้องการของ user ก่อนลงมือ

| Skill | ใช้ทำอะไร | Trigger | ใช้ใน command |
|---|---|---|---|
| **prompt-understand** | Parse freeform input ของ user เป็น intent / entities / constraints / success criteria / unknowns แบบ lightweight — ไม่ block, ไม่เขียน doc | First step ของทุก command ที่รับ freeform input | `/dev`, `/discovery`, `/requirement` |
| **scope-check** | Restate scope ที่เข้าใจกลับให้ user → BLOCK จนกว่า user confirm ACs / boundary cases / time estimate | หลัง prompt-understand เมื่อพร้อม commit scope | `/dev`, `/discovery`, `/requirement`, `/implement`, `/issue`, `/debug` |
| **ask-choice** | บังคับให้ทุก ambiguity เป็น multi-choice question (2–4 options พร้อม tradeoffs) ผ่าน `AskUserQuestion` — ไม่ใช่ open-ended chat | เมื่อมี decision ที่ user ต้องเลือก และมีคำตอบมากกว่า 1 อย่าง | ทุก command ที่เจอ ambiguity |
| **solution-options** | Generate 2–3 viable approaches พร้อม tradeoff matrix + recommended default ก่อนตัดสินใจสำคัญ | ก่อน architectural / implementation / refactor decision ที่มีหลายทาง | `/discovery`, `/issue`, `/requirement` |

---

## 2. Pre-implementation gates — ตั้งหลักก่อนเขียน code

| Skill | ใช้ทำอะไร | Trigger | ใช้ใน command |
|---|---|---|---|
| **workspace-detect** | ตรวจ greenfield vs brownfield + stack inventory + paused autopilot session | First call ของ `/dev` pipeline | `/dev`, `/discovery`, `/new-sprint` step 0 |
| **reverse-engineer** | Brownfield deep-scan → generate architecture / components / dependencies / business-flow doc ผ่าน parallel Explore agents (cache 30 วัน) | Brownfield project ที่ยังไม่มี RE artifact หรือมีแต่เก่ากว่า 30 วัน | `/dev`, `/discovery` |
| **impact-map** | Enumerate ทุก callsite / dependent / downstream consumer ที่อาจพังจาก change — produce impact table พร้อม Tier-1/2/3 risk levels | ก่อน change code ที่มีอยู่ | `/issue` step 2, `/implement` step 1e, `/code-review` step 2a |
| **risk-register** | Enumerate risks (data loss, regression, security, perf, reliability) + mitigation + rollback plan — โดยเฉพาะ migration / auth / payment | ก่อน implement task ที่ touch migration / auth / payment / public API / cron | `/implement` step 1e, `/code-review` step 2b |
| **nfr-plan** | Append measurable NFR targets (perf, security, scalability, reliability) ลง requirement doc — stack-aware defaults | ใน `/requirement` เมื่อ AC มี perf/security keywords | `/requirement` step 4 (conditional) |
| **api-contract** | Lock FE↔BE contract ก่อนเขียนทั้งสองฝั่ง — ทำให้ drift impossible by construction | ก่อนเขียน REST handler / Vue composable / Socket emitter ใน slice ที่ cross FE↔BE | `/requirement`, `/implement` |
| **vertical-slice** | Break task เป็น slice ขนาด 15–45 นาที (FE+BE+test ครบในแต่ละ slice) — กัน "small task takes same time as big task" | หลัง scope-check ถ้าประเมินเกิน 60 นาที | `/implement` ก่อน slice แรก |
| **tdd-plan** | Generate TDD test plan — ทุก AC map ไป failing tests พร้อม boundary cases — ก่อนเขียน implementation code | สุดท้ายของ `/requirement` และต้นของแต่ละ `/implement` slice | `/requirement`, `/implement` |
| **plan-driven-delivery** | Keep task execution aligned กับ plan contract ใน requirement doc — detect scope drift, route ทุก phase จาก 4 control surfaces เดียวกัน | หลัง `/requirement` confirm และก่อน downstream phase ลงมือ | `/requirement`, `/implement`, `/code-review`, `/issue`, `/testing`, `/dev` |

---

## 3. Bug & quality — debug, ตรวจ, verify

| Skill | ใช้ทำอะไร | Trigger | ใช้ใน command |
|---|---|---|---|
| **bug-repro** | เขียน failing test ที่ reproduce bug — minimal input, exact expected, verified RED — ก่อนแตะ fix code | ทุก bug fix | `/issue` step 3, `/debug` phase 4 |
| **debug** | Root-cause investigation protocol (reproduce → isolate → hypothesize → verify → fix with TDD) — ไม่ใช่ workaround | Test fail แบบไม่มีสาเหตุชัด / ui-verify จับ bug / prod incident | `/issue`, `/debug` command, mid-`/implement` |
| **mongo-review** | Review MongoDB query / aggregation / index / schema changes — จับ missing index, unanchored regex, $lookup pitfalls, large $in, projection leaks | Diff ที่มี Mongo operation | `/code-review`, `/implement` |
| **ui-verify** | Manual UI verification ก่อน commit — start dev server, click ทุก AC path ใน browser จริง, capture evidence, BLOCK `/git-commit` ถ้า fail | Task ที่ touch `.vue` / `.tsx` / `.jsx` / `pages/` / `components/` / `app/` / `layouts/` | `/testing` step 6a-uiverify |

---

## 4. Delivery — commit, release, run

| Skill | ใช้ทำอะไร | Trigger | ใช้ใน command |
|---|---|---|---|
| **local-run** | Start local dev stack แบบ stack-aware (docker-compose / Go / FE / Mongo / Socket) พร้อม healthcheck + seed data | ก่อน implement slice แรก, ก่อน testing, ก่อน ui-verify | `/implement`, `/testing`, `ui-verify` dependency |
| **pr-create** | Open GitHub PR ด้วย title ≤ 70 chars + AC checklist body + design doc links + test evidence — ไม่ "wip" หรือ body ว่าง | User บอก "create PR" หลัง commit, หรือจบ `/retro-task` | `/git-commit`, `/retro-task` |
| **release-notes** | Generate CHANGELOG entry + sync README + bump semver ตอนจบ sprint | End ของทุก sprint | `/retro-sprint` |

---

## 5. Meta — orchestration, memory, handoff

| Skill | ใช้ทำอะไร | Trigger | ใช้ใน command |
|---|---|---|---|
| **agent-routing** | เลือก model (haiku/sonnet/opus) + subagent_type (Explore/general-purpose/Plan/code-simplifier) + isolation (worktree y/n) + parallel flags สำหรับทุก `Agent()` call | ก่อน spawn agent ที่เกินกว่า one-shot tool use | `/run-tasks`, `/run-tasks-p` |
| **brain-capture** | เขียน atomic notes (LES/PAT/DEC/GLO) ลง `brain/` vault พร้อม frontmatter + ID + MOC linkage — sanctioned writer ตัวเดียว | เมื่อมี novel insight / decision / pattern / term ที่ work ในอนาคตควรจำ | `/retro-task`, `/retro-sprint` |
| **session-handoff** | Serialize session state เป็น handoff doc — session ถัดไป (หรือคนอื่น) resume ได้โดยไม่ต้อง cold start | Context > 80% / end of day บน multi-day task / handover | Mid-session, มี่ใช้ใน command ตายตัว |
| **skill-evolution** | Detect repeated friction patterns จาก sprint → propose new skills หรือ update เดิม — มี overlap detector กัน skill bloat | Last step ของ `/retro-sprint` (mandatory) | `/retro-sprint` |

---

## รายละเอียดเพิ่มเติม

- ทุก skill อยู่ที่ `.claude/skills/[name]/SKILL.md` — เปิดอ่านเพื่อ step-by-step, inputs/outputs, autopilot status format
- Skill naming ต้องเป๊ะเสมอ (เช่น `vertical-slice`, ไม่ใช่ `slice` หรือ `vs`) — abbreviation fail
- Skill จะ inject ตอน `/dev` autopilot ตามรูปแบบใน `.claude/rules/autonomous-mode.md`
- ดู `.claude/commands/_WORKFLOW-REF.md` สำหรับว่า skill ตัวไหน trigger ที่ command ตัวไหน step ไหน
