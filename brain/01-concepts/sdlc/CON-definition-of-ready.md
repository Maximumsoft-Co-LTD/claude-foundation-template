---
type: concept
tags: [sdlc, agile, ready, backlog-refinement]
related: [CON-definition-of-done, CON-sdlc-phases]
updated: 2026-03-25
source: template
---

# Definition of Ready (DoR)

## What Is It?

**Definition of Ready** คือเงื่อนไขที่ backlog item ต้องผ่านก่อนจะ pull เข้า Sprint — ถ้ายัง "not ready" ไม่ควร sprint plan ตัวนั้น

## Example DoR

```
Story ต้องมี:
  [ ] User story เขียนใน "As a... / I want... / So that..." format
  [ ] Acceptance Criteria ครบและ testable
  [ ] UI/UX reference (wireframe หรือ design link) ถ้ามี FE
  [ ] Dependencies ระบุแล้ว (รู้ว่าต้องรอใคร)
  [ ] Story size ประมาณแล้ว (story points)
  [ ] ไม่มี 13-point stories (ต้อง split ก่อน)
  [ ] Business rules ชัดเจน ไม่มี ambiguity
```

## DoR ทำให้ Sprint Planning ดีขึ้น

| ไม่มี DoR | มี DoR |
|-----------|---------|
| Sprint planning ใช้เวลาหลายชั่วโมงคุย requirement | Planning เร็ว เพราะทุกอย่างชัดแล้ว |
| Dev ต้องหยุดถาม PO กลางทาง | Dev implement ได้เลย |
| Scope change บ่อย | Scope stable ใน sprint |
| Velocity ผันผวน | Velocity predictable |

## INVEST = DoR ใน Story Level

- **I**ndependent — ไม่พึ่ง story อื่นในการ implement
- **N**egotiable — รายละเอียดยืดหยุ่นได้
- **V**aluable — deliver value จริง
- **E**stimable — ประมาณ effort ได้
- **S**mall — จบได้ใน 1 sprint
- **T**estable — มี ACs ที่ test ได้

## Related

- [[CON-definition-of-done]] — คู่กัน: ready ก่อน sprint, done หลัง sprint
- [[../agile/CON-scrum-ceremonies]] — Backlog Refinement ทำให้ stories ready
- [[../../../00-MOC/MOC-SDLC]]
