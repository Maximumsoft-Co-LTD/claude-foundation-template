---
type: glossary
term: Discovery
tags: [agile, product-owner, user-research, planning, workflow]
updated: 2026-03-25
---

# Discovery

**Definition:** The phase before implementation where the team explores the problem space, validates assumptions, and defines what to build and why. Discovery transforms vague ideas into clear, actionable user stories with acceptance criteria.

## Goals of Discovery

1. **Validate the problem:** Is this a real user problem? How painful is it?
2. **Explore the solution space:** What are potential solutions? Trade-offs?
3. **Define scope:** What's in scope? What's out of scope?
4. **Estimate uncertainty:** What unknowns exist? Which need a spike?
5. **Build shared understanding:** All team members (PO, devs, designers, QA) agree on what to build
6. **Create artifacts:** User stories, acceptance criteria, wireframes, prototypes ready for development

## Discovery Activities

### **User Research / Interviews**
Talk to actual users to understand their pain points and workflows.

```
Question: "When was the last time you needed to reset your password?"
User: "Last week. Couldn't log in and had to click Forgot Password."
Question: "How long did that take?"
User: "About 5 minutes. The email took forever to arrive."

Insight: Users expect password reset to be instant; delays cause frustration.
```

### **Opportunity Tree / Impact Mapping**
Visualize user needs and potential features.

```
Goal: Improve user onboarding

├── New users need guidance
│   ├── Tutorial walkthrough
│   ├── Contextual help tooltips
│   └── Video tutorials
├── Users need to feel safe
│   ├── Privacy policy clarity
│   ├── Data security messaging
│   └── Trust badges
└── Users need quick wins
    ├── Pre-populated templates
    ├── 1-click setup
    └── Progress indicators
```

### **Assumption Mapping**
List assumptions and prioritize which to validate first.

```
High Risk (test first):
- Users will pay for this feature (revenue assumption)
- Users can complete onboarding in < 5 minutes (usability assumption)

Medium Risk:
- Mobile users make up 40% of traffic (analytics assumption)
- Users prefer email over SMS notifications (preference assumption)

Low Risk:
- We'll host on AWS (technical; easier to change later)
```

### **Story Mapping**
Break down a user journey into sequential stories.

```
User Journey: "Buy a product"

1. Browse
   ├── Search for product (story 1)
   ├── Filter by category (story 2)
   └── View product details (story 3)

2. Add to Cart
   ├── Quantity selector (story 4)
   ├── Variant selection (story 5)
   └── Add to cart button (story 6)

3. Checkout
   ├── Review cart (story 7)
   ├── Enter shipping address (story 8)
   ├── Choose payment method (story 9)
   └── Place order (story 10)
```

### **Prototyping / Mockups**
Create low-fidelity or high-fidelity prototypes to test ideas.

```
Low-fidelity: Pencil sketches or Figma wireframes
→ Quick to create, easy to change

High-fidelity: Interactive Figma prototype
→ More realistic; can test with users for feedback

Clickable prototype: Invision / Figma prototype
→ Simulates real interaction; catches UX issues early
```

### **Risk / Spike Identification**
Identify technical or design unknowns that need exploration.

```
Unknown: "Can we process 10,000 transactions per second?"
→ Spike task: "Research and POC database scaling strategies" (3 points, 1 week)

Unknown: "Will users adopt the new dashboard?"
→ Spike task: "User testing with 5 beta users" (2 points, 1 week)

Action: Resolve spikes before committing to large features.
```

## Discovery Artifacts

### **User Stories + AC**
```
As a busy professional,
I want to reset my password in < 2 minutes,
so that I can regain access without frustration.

AC:
- Reset link sent within 30 seconds
- Link valid for 24 hours
- Clear, error-free reset form
```

### **User Journey Map**
Timeline showing user touchpoints, emotions, pain points.

### **Persona / User Profile**
```
Name: Sarah, Product Manager
Age: 32
Goals: Manage team productivity, make data-driven decisions
Pain: Current analytics tool is slow; lacks mobile support
Tech comfort: High (uses multiple SaaS tools daily)
```

### **Competitive Analysis**
How do competitors handle this problem?

### **Success Criteria**
How will we measure if this feature succeeds?
```
- User adoption: > 50% of users within 3 months
- Time to value: Average setup time < 10 minutes
- NPS impact: +10 point improvement in product NPS
```

## Discovery Workflow (Example)

**Week 1:**
- Interview 10 target users (2-3 hours each)
- Document pain points and user quotes
- Create opportunity tree

**Week 2:**
- Ideate potential solutions (brainstorm with team)
- Create user journey map
- Prioritize features by impact + effort

**Week 3:**
- Create mockups/prototypes
- Identify technical spikes (e.g., "Can we support real-time collaboration?")
- Create user stories + acceptance criteria

**Week 4:**
- Story refinement meeting (team reviews and clarifies)
- Sprint planning (commit to stories; assign spikes to upcoming sprints)
- Ready for development!

## Common Discovery Pitfalls

❌ **Skipping discovery:** "Let's just build it" → misaligned expectations, rework
❌ **Over-discovering:** Endless research, analysis paralysis
❌ **Ignoring users:** Assumptions instead of validation
❌ **Vague outcomes:** "Make it better" instead of measurable success criteria
❌ **Solo discovery:** Only PO knows the context; team is disconnected

## See Also

- [[MOC-Workflow]] — Full sprint workflow including discovery phase
- [[CON-sprint-lifecycle]] — How discovery fits into the sprint
- [[CON-user-story-format]] — Writing clear stories post-discovery
- [[GLO-acceptance-criteria]] — Defining AC during discovery
