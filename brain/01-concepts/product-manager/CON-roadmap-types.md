---
type: concept
tags: [product-manager, roadmap, planning, strategy]
related: [CON-product-vision-strategy, CON-okr-framework, CON-stakeholder-management]
updated: 2026-03-25
---

# Roadmap Types: Choosing the Right Format

A roadmap is a communication tool that shows "what's coming and when." But format matters: the wrong roadmap confuses stakeholders and creates false expectations.

## Now / Next / Later

**Best for:** Early-stage products, fast-moving teams, stakeholders who demand dates

**Format:**
```
Now (Current Sprint/Month)
├─ User authentication refinement
├─ Bug fixes from top customer accounts
└─ Performance optimization

Next (1-2 Months)
├─ Payment integration
├─ Bulk export feature
└─ Mobile app v1.1

Later (Beyond 2 Months)
├─ AI-powered recommendations
├─ International expansion support
└─ Custom reporting
```

**Pros:**
- Simple, easy to understand
- No false precision ("Q3 2026" is a lie)
- Clear: "Now" items are locked, "Later" items are still exploring
- Works for agile teams shipping every 2 weeks

**Cons:**
- Vague ("Later" could mean 3 months or 2 years)
- Hard to communicate to customers expecting dates
- Doesn't align work to business outcomes

**Use when:** Iterating fast, stakeholders are internal, you want flexibility.

## Quarterly Roadmap

**Best for:** Mid-size companies with OKRs, stable product-market fit

**Format:**
```
Q1 2026
├─ Goal: Increase enterprise customer retention to 95%
│  ├─ Enhanced admin dashboard
│  ├─ SSO integration
│  └─ Security audit & certifications
├─ Goal: Reduce onboarding time by 50%
│  ├─ Interactive setup wizard
│  └─ Pre-built templates
└─ Operations
   ├─ Technical debt paydown
   └─ Infra cost optimization

Q2 2026
├─ Goal: Launch international markets
│  ├─ Localization for 5 languages
│  └─ Regional compliance features
```

**Pros:**
- Ties work to business outcomes (OKRs)
- Quarterly cycle aligns with planning cadence
- Precise enough for customer communication
- Teams have time to plan but stay focused

**Cons:**
- Still somewhat vague (Q2 = 13-week window)
- Difficult to show dependencies across quarters
- Doesn't work well for markets with longer sales cycles

**Use when:** You have clear OKRs, mature product, mix of internal and customer communications.

## Outcome-Based Roadmap

**Best for:** Large organizations, complex dependencies, strategic planning

**Format:**
```
Strategic Outcome: Reduce customer acquisition cost from $500 to $300

Initiative 1: Improve product virality
├─ Referral program (Q1)
├─ Viral loop in core workflow (Q1-Q2)
└─ Measure: 20% virality rate by Q2

Initiative 2: Improve self-serve onboarding
├─ Interactive tutorials (Q1)
├─ Milestone-based activation (Q1-Q2)
└─ Measure: 40% self-service conversion by Q2

Initiative 3: Improve pricing optionality
├─ Freemium tier design (Q2)
├─ Usage-based pricing (Q2-Q3)
└─ Measure: 30% adopt tier 2+ by Q3
```

**Pros:**
- Clear why we're building (the outcome)
- Shows how initiatives interconnect
- Easy to track progress toward goal
- Works across business units (product, marketing, sales)

**Cons:**
- Takes effort to design and maintain
- Requires discipline to measure outcomes
- Harder to communicate outside the organization

**Use when:** You have clear strategic goals, multiple teams involved, want to measure impact.

## Roadmap Audience

Tailor what you share:

### Customers (External Roadmap)

**What to share:**
- Features coming soon (next 2-3 months)
- Major initiatives (new category, platform expansion)
- Announced dates (if you're 95% confident)

**What NOT to share:**
- Dates for "Later" items (overpromise)
- Technical work (they don't care about refactoring)
- Experimental/unvalidated ideas
- Specific quarters (say "2026" not "Q2 2026")

**Format:** Simple, 6-month view, outcomes-focused

```
Coming Soon
├─ Mobile app (Spring 2026)
├─ Integrations marketplace (Spring 2026)
└─ Advanced reporting (Summer 2026)
```

### Sales/Customer Success (Business Context)

**What to share:**
- Features that unlock new use cases (land-and-expand)
- Competitive positioning (how we're different)
- Customer requests and if/when they'll ship
- Strategic priorities (what we're investing in)

**What NOT to share:**
- Vague timelines that customer success has to explain
- Technical debt initiatives (not their concern)

**Format:** Quarterly + customer request tracking

```
Q2 2026 Priorities
├─ Multi-workspace support (enables enterprise deals)
├─ Custom branding (needed for 3 enterprise prospects)
└─ API rate limit increase (enterprise segment blocker)
```

### Engineering (Internal Roadmap)

**What to share:**
- Technical work and refactoring
- Infrastructure investments
- Dependency mapping
- Capacity planning
- Unblocking concerns

**Format:** Detailed, with estimates and risk flags

```
Q1 2026
├─ Monolith → Microservices (High Risk, 8 weeks)
│  ├─ Blocks: Payment feature work (Q2)
│  ├─ Unblocks: Scalability (60% cost savings)
│  └─ Owner: Backend Lead
├─ Database optimization (Medium Risk, 3 weeks)
│  └─ Impacts: Report generation (-40% latency)
```

## Keeping Roadmaps Honest

### The Date Problem

Dates create false precision. A committed date in Q3 2026 implies:
- You know everything about the problem (you don't)
- Tech will cooperate (it won't)
- No new emergencies will happen (they will)

**Solution: Use ranges**

Instead of: "Payment integration shipping June 2026"
Say: "Payment integration shipping Q2-Q3 2026 (6-8 week effort)"

This is honest and still useful for customer planning.

### Communicating Uncertainty

Use clear language:

| Signal | Meaning |
|---|---|
| **Committed** 🟢 | Shipping this quarter; 95% confident |
| **Planned** 🟡 | Next 1-2 quarters; 70% confident; likely but not guaranteed |
| **Exploring** 🔵 | Under research; 40% confident; testing with users |
| **On the Radar** ⚪ | Interesting; <20% confident; no commitment |

**Example:**
```
Q1: SSO integration (Committed 🟢)
Q2: Mobile app (Planned 🟡)
Q3: AI summarization (Exploring 🔵)
Future: HIPAA compliance (On the Radar ⚪)
```

### Roadmap Anti-Patterns

| Red Flag | Problem | Fix |
|---|---|---|
| **Everything is P0** | No prioritization; roadmap is a request dump | Use MoSCoW; show what's NOT coming |
| **Dates never change** | Ignoring market feedback; waterfall planning | Review quarterly; show evolution |
| **No outcomes, just features** | Doesn't connect to business; hard to measure | Tie to OKRs or metrics |
| **100 items in roadmap** | No focus; everything is "next" | Ruthlessly cut; show top 10 |
| **Published but not updated** | Stakeholders read old dates and distrust you | Update every sprint; show what changed and why |
| **Different roadmaps for different people** | Teams operating on different version of truth | Single source of truth; customize view, not content |

## From Roadmap to Sprints

**The flow:**
```
Roadmap Item (Initiative)
  ↓
User Stories (Epics in backlog)
  ↓
Sprint Planning (Pull from top of backlog)
  ↓
Sprint Tasks (Story-sized work, 2-8 points)
```

Each sprint pulls from the roadmap, not the other way around. If sprint items drift from roadmap, that's ok—it means learning happened.

## Related References

See [[CON-product-vision-strategy]] for setting direction, [[CON-okr-framework]] for outcome definition, and [[CON-stakeholder-management]] for communicating priorities.
