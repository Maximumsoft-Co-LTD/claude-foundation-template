# task-003 — Workflow Features Section

## Metadata
| Field | Value |
|-------|-------|
| **Sprint** | sprint-01 |
| **Priority** | high |
| **Estimate** | 1 day |
| **Assignee** | - |
| **Requester** | - |
| **Status** | todo |

## Problem Statement
ลูกค้าที่เข้าชมต้องการเข้าใจว่า Claude Code workflow ทำงานอย่างไร — section นี้อธิบาย workflow steps อย่างชัดเจนและน่าสนใจ

## Overview
สร้าง features section ที่แสดง Claude Code workflow steps (discovery → sprint → implement → review → done) พร้อม icon/visual ประกอบ

## User Stories
- As a visitor, I want to understand how Claude Code workflow works, so that I can decide if it fits my team.
- As a visitor, I want to see workflow steps clearly, so that I can visualize the process.

## Acceptance Criteria
- [ ] AC-1: Section แสดง workflow steps อย่างน้อย 5 steps (discovery, sprint planning, implement, review, retrospective)
- [ ] AC-2: แต่ละ step มี title, short description, และ visual indicator (icon หรือ number)
- [ ] AC-3: Layout เป็น grid หรือ timeline ที่อ่านง่าย
- [ ] AC-4: ใช้ brand colors จาก design system (task-001)
- [ ] AC-5: Responsive บน mobile/tablet/desktop

## Success Metrics
- [ ] Visitor เข้าใจ workflow overview ภายใน 30 วินาที (self-reported)
- [ ] Section แสดงครบทุก step โดยไม่มี layout break

## Design References
- Inherits CSS variables from task-001
- Step indicator: Orange circle with number หรือ icon

## Analytics & Tracking
- [ ] Event: `workflow_section_viewed` — fired when section enters viewport

## Out of Scope
- Interactive demo หรือ animation
- Detailed documentation ของแต่ละ step

## Dependencies
- task-001: Project setup & design system

## Definition of Done
- [ ] All acceptance criteria pass
- [ ] Visual check บน mobile/tablet/desktop
- [ ] Code reviewed and approved
- [ ] BACKLOG.md updated to `done`
