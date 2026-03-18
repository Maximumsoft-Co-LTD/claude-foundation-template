# task-001 — Project Setup & Design System

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
ก่อนสร้าง section ต่างๆ ต้องมี project structure ที่ชัดเจนและ design system (สี, typography, spacing) ที่ทุก task ใช้ร่วมกัน เพื่อให้ UI มีความสม่ำเสมอตลอดทั้ง landing page

## Overview
สร้าง project structure พื้นฐาน (HTML skeleton, CSS reset, CSS variables) และ design system สีส้มสไตล์ Claude Code ที่ task-002, task-003, task-004 จะนำไปใช้ต่อ

## User Stories
- As a developer, I want a consistent design system, so that all sections look cohesive.
- As a developer, I want a clear project structure, so that each task can be built independently.

## Acceptance Criteria
- [ ] AC-1: มีไฟล์ `index.html` พร้อม HTML5 skeleton และ meta tags (charset, viewport, title, description)
- [ ] AC-2: มีไฟล์ `styles/main.css` พร้อม CSS reset
- [ ] AC-3: CSS custom properties กำหนด brand colors (orange primary, dark background, neutrals)
- [ ] AC-4: CSS custom properties กำหนด typography scale (font-size, font-weight, line-height)
- [ ] AC-5: CSS custom properties กำหนด spacing scale
- [ ] AC-6: Folder structure ถูกต้อง (`index.html`, `styles/`, `assets/`)

## Success Metrics
- [ ] เปิด `index.html` ใน browser ได้โดยไม่มี error ใน console
- [ ] task-002, task-003, task-004 สามารถใช้ CSS variables ได้โดยไม่ต้อง hardcode ค่า

## Design References
- Color primary: `#E97F45` (Claude Code orange)
- Color dark bg: `#1A1A1A`
- Color light: `#F5F5F5`
- Font: Inter (Google Fonts) หรือ system font stack

## Analytics & Tracking
- ไม่มี

## Out of Scope
- Content จริงของแต่ละ section (task-002, task-003, task-004)
- JavaScript

## Dependencies
- ไม่มี (first task)

## Definition of Done
- [ ] All acceptance criteria pass
- [ ] เปิดใน browser ได้ไม่มี console error
- [ ] Code reviewed and approved
- [ ] BACKLOG.md updated to `done`
