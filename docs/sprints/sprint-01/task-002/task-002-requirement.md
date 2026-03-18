# task-002 — Hero Section + Navigation

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
ลูกค้าที่เข้าเยี่ยมชมเว็บต้องการเห็นภาพรวมของ product ทันทีที่เปิดหน้าเว็บ — Hero section คือ first impression ที่สำคัญที่สุด

## Overview
สร้าง navigation bar และ hero section ที่แสดงชื่อ product, tagline, และ CTA button อย่างชัดเจน ด้วยสีส้ม Claude Code style

## User Stories
- As a visitor, I want to understand what this product is immediately, so that I can decide to explore further.
- As a visitor, I want a clear CTA, so that I know what to do next.

## Acceptance Criteria
- [ ] AC-1: Navigation bar แสดง logo/brand name และ navigation links
- [ ] AC-2: Hero section มี headline (H1), subheadline, และ CTA button
- [ ] AC-3: CTA button ใช้สีส้ม primary และ hover state ที่ชัดเจน
- [ ] AC-4: Navigation sticky ที่ด้านบนเมื่อ scroll
- [ ] AC-5: Layout ถูกต้องบน mobile, tablet, desktop

## Success Metrics
- [ ] Hero section render ได้ภายใน 1s
- [ ] CTA button เห็นชัดโดยไม่ต้อง scroll

## Design References
- Primary color: `#E97F45`
- Dark background: `#1A1A1A`
- Inherits from task-001 design system

## Analytics & Tracking
- [ ] Event: `cta_hero_click` — fired when CTA button is clicked

## Out of Scope
- Animation / scroll effects (task-004)
- Content sections อื่น

## Dependencies
- task-001: Project setup & design system

## Definition of Done
- [ ] All acceptance criteria pass
- [ ] Visual check บน mobile/tablet/desktop
- [ ] Code reviewed and approved
- [ ] BACKLOG.md updated to `done`
