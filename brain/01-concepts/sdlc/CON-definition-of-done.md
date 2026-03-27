---
type: concept
tags: [sdlc, agile, done, quality-gate]
related: [CON-definition-of-ready, CON-sdlc-phases]
updated: 2026-03-25
source: template
---

# Definition of Done (DoD)

## What Is It?

**Definition of Done** คือ checklist ที่ทีมตกลงกันว่า story/task ต้อง pass ทุกข้อ ถึงจะนับว่า "เสร็จจริง"

DoD ไม่ใช่ Acceptance Criteria — ACs บอก "ทำอะไร", DoD บอก "ทำให้ complete ยังไง"

## Example DoD (Development Team Level)

```
Story Level:
  [ ] Code ผ่าน review จากอีกคนอย่างน้อย 1 คน
  [ ] Unit tests เขียนแล้วและ pass ทั้งหมด
  [ ] Integration tests pass
  [ ] ไม่มี known bugs ระดับ Critical/Major
  [ ] ACs ทุกข้อมี test cover
  [ ] Lint/type check pass

Sprint Level:
  [ ] Stories ทุกตัว pass story-level DoD
  [ ] Feature ถูก demo ใน Sprint Review
  [ ] Documentation อัปเดต
  [ ] Deploy to staging สำเร็จ

Release Level:
  [ ] Regression tests pass
  [ ] Performance tests pass
  [ ] Security scan clean
  [ ] Deploy to production สำเร็จ
  [ ] Monitoring/alerts ตั้งแล้ว
```

## DoD vs Acceptance Criteria

| | DoD | Acceptance Criteria |
|-|-----|---------------------|
| Scope | ทุก story | เฉพาะ story นั้น |
| Who defines | Scrum Team | Product Owner |
| Focus | How complete | What is delivered |
| Example | "Code reviewed" | "User can log in with Google" |

## Anti-patterns

- ❌ DoD ที่ยาวเกินจนไม่มีใคร follow
- ❌ DoD ที่แตกต่างกันในแต่ละ team
- ❌ "Done" = "code pushed" (ไม่มี tests, ไม่มี review)
- ❌ Skip DoD เพื่อ "meet velocity"

## Related

- [[CON-definition-of-ready]] — คู่กัน: ready ก่อน sprint, done หลัง sprint
- [[../agile/CON-scrum-ceremonies]] — Review ceremony ตรวจ DoD
- [[../../../00-MOC/MOC-SDLC]]
