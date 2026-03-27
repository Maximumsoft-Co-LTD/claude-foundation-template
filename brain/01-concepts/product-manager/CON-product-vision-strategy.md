---
type: concept
tags: [product-manager, vision, strategy, market, north-star]
related: [CON-okr-framework, CON-roadmap-types, CON-metrics-product, CON-product-discovery]
updated: 2026-03-25
source: template
---

# Product Vision and Strategy

Vision answers "What are we building?" Strategy answers "How do we win?" Together, they guide every decision from sprint planning to roadmap.

## Vision vs Strategy vs Roadmap Hierarchy

```
Vision (3-5 years)
└─ Where we want to be; what the world looks like

  Strategy (1-2 years)
  └─ How we'll get there; key moves and bets

    Roadmap (6-12 months)
    └─ What we're building this year to advance strategy

      Sprints (2 weeks)
      └─ How we'll ship one slice of the roadmap
```

**Example:**
```
Vision: "Every team communicates asynchronously, without meeting fatigue"
Strategy: "Build the #1 async-first collaboration tool by 2025"
Roadmap: "Q1: Launch comment threading; Q2: Offline mode; Q3: AI summaries"
Sprint: "Enable threading on documents"
```

## Writing a Product Vision Statement

Use **Geoffrey Moore's Vision Template:**

> For [target customers]
> who [customer need/problem],
> the [product name]
> is a [product category]
> that [unique value proposition].
> Unlike [key competitors],
> we [key differentiator].

**Example (Slack):**
> For knowledge workers
> who are drowning in emails and meetings,
> Slack
> is a messaging platform
> that replaces fragmented communication with one searchable hub.
> Unlike email,
> we make conversation synchronous, searchable, and contextual.

**Vision is:**
- ✅ Inspiring ("We're solving a real problem")
- ✅ Customer-centric ("For [them]")
- ✅ Honest ("Unlike X, we...")
- ❌ NOT a mission ("We're doing good")
- ❌ NOT a slogan ("Move fast and break things")
- ❌ NOT specific to features ("We're building AI")

## Strategic Pillars

Break vision into 3-5 strategic pillars that guide decision-making:

**Example (SaaS Product):**
1. **Category Leadership** — Be the fastest and most reliable in class
2. **Customer Outcomes** — Help customers measure ROI and hit KPIs
3. **Ecosystem** — Become the platform; let partners extend us
4. **Trust & Security** — SOC2, HIPAA compliance; zero breaches
5. **Retention** — Reduce churn to < 3% MoM; drive customer success

**Use pillars as tiebreakers:**
- Feature request A drives Category Leadership ✅
- Feature request B doesn't align with any pillar ❌
- Spend on compliance (Trust & Security) over feature launches ✅

## Market Positioning

Understand **where you play and how you win:**

### TAM / SAM / SOM

| Metric | Definition | Example |
|---|---|---|
| **TAM** (Total Addressable Market) | All potential customers globally | Global SaaS market = $200B |
| **SAM** (Serviceable Available Market) | Market you can realistically reach | Enterprise SaaS in North America = $50B |
| **SOM** (Serviceable Obtainable Market) | What you can capture in 5 years | We can reach 5% = $2.5B |

**Use:** Helps you size the opportunity and justify investment.

### Competitive Positioning

Answer:
- **Direct competitors** — Head-to-head (Slack vs Teams, Figma vs Adobe XD)
- **Indirect competitors** — Alternative solutions (Email still competes with Slack)
- **Your asymmetric advantage** — What you do 10x better
  - E.g., "Fastest at X" or "Only one with Y" or "Cheapest, by far"

**Avoid:** "We're better at everything" (flag for unclear positioning).

## Product-Market Fit Signals

Product-market fit (PMF) is when demand exceeds supply. You'll see:

| Signal | What It Means |
|---|---|
| **Organic growth** | > 30% MoM growth without paid marketing |
| **Churn plateaus** | Cohort retention curves flatten at high levels (> 80% after 1 year) |
| **NPS > 50** | Most customers recommend you; word-of-mouth kicks in |
| **Customers evangelize** | Unsolicited case studies, community participation |
| **Pricing power** | Can raise prices without losing customers |
| **Sales cycle shortens** | Sales closes deals faster; less convincing needed |
| **Support load stabilizes** | Not seeing new, systemic support issues |

**Without PMF:** Churn is high, growth requires constant acquisition spend, customers are indifferent.

**With PMF:** Customers stick around, tell friends, and invest in becoming power users.

## North Star Metric

A single metric that captures your entire strategy. It's the number that, if it grows, means you're winning.

**Examples:**
- Spotify: Monthly Active Users who listen regularly
- Airbnb: Nights booked
- Twitch: Hours watched
- Figma: Collaborative files edited

**Your North Star should:**
- ✅ Align with revenue (growth → monetization follows)
- ✅ Lead, not lag (if NS goes up, revenue eventually follows)
- ✅ Be under your control (you can influence it through product)
- ✅ Be meaningful (customers care; captures core value)
- ❌ Be financials alone (revenue lags; doesn't guide product)
- ❌ Be vanity (signups without retention = worthless)

**Anti-pattern:** Multiple North Stars. Pick one. Everything else is a guardrail metric.

## Strategic Shifts and Pivots

Over 3-5 years, vision may shift. Signals to watch:

- **Market changes** (Web3 hype cycles; regulatory shifts)
- **Customer behavior** (Adopting new workflows faster than predicted)
- **Competitive landscape** (New entrant with $1B in funding)
- **Technology breakthroughs** (AI makes your moat obsolete)
- **Your capabilities** (Built something unexpected that customers love)

**Smart move:** Run a discovery spike to validate before pivoting.

## Related References

See [[CON-okr-framework]] for how to operationalize strategy into OKRs, [[CON-roadmap-types]] for communicating plans, and [[CON-product-discovery]] for validating assumptions.
