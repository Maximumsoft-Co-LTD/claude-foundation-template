# task-004 — CTA, Footer & Responsive Polish

## Metadata
| Field | Value |
|-------|-------|
| **Sprint** | sprint-01 |
| **Priority** | medium |
| **Estimate** | 1 day |
| **Assignee** | - |
| **Requester** | - |
| **Status** | todo |

## Problem Statement
หลังจาก visitor อ่าน hero และ workflow แล้ว ต้องการ clear call-to-action และ footer ที่ครบถ้วน รวมถึง polish ให้ responsive layout สมบูรณ์ทุก breakpoint

## Overview
สร้าง CTA section, footer, และ polish responsive layout ของทั้งหน้า (mobile, tablet, desktop) ให้พร้อม deploy

## User Stories
- As a visitor, I want a final CTA after reading the features, so that I know how to get started.
- As a visitor, I want a footer with basic info, so that I can find contact or other links.
- As a visitor on mobile, I want the layout to look great, so that I have a good experience on any device.

## Acceptance Criteria
- [ ] AC-1: CTA section มี headline, subtext, และ primary CTA button
- [ ] AC-2: Footer มี copyright, และ links ที่จำเป็น
- [ ] AC-3: หน้าทั้งหมดแสดงผลถูกต้องบน mobile (375px), tablet (768px), desktop (1280px)
- [ ] AC-4: ไม่มี horizontal scroll บน mobile
- [ ] AC-5: ทุก section มี adequate spacing และ visual separation

## Success Metrics
- [ ] ไม่มี layout break บน 375px, 768px, 1280px viewport
- [ ] ไม่มี horizontal overflow
- [ ] Lighthouse mobile score > 80

## Design References
- Inherits all CSS variables from task-001
- CTA section: dark background + orange button
- Footer: dark background, small text

## Analytics & Tracking
- [ ] Event: `cta_bottom_click` — fired when bottom CTA button is clicked

## Out of Scope
- Animation / transition effects
- Multi-language
- Cookie banner

## Dependencies
- task-002: Hero section + navigation (ต้องมีก่อนจึง polish)
- task-003: Workflow features section (ต้องมีก่อนจึง polish)

## Definition of Done
- [ ] All acceptance criteria pass
- [ ] Tested บน 3 breakpoints
- [ ] Lighthouse score check
- [ ] Code reviewed and approved
- [ ] BACKLOG.md updated to `done`
