---
type: concept
tags: [product-manager, metrics, analytics, HEART, AARRR, north-star]
related: [CON-okr-framework, CON-product-vision-strategy, CON-product-discovery]
updated: 2026-03-25
---

# Product Metrics: Measuring What Matters

Metrics are how you measure if your product is winning. But not all metrics matter equally—you need to know what to measure, when it's working, and when to worry.

## The HEART Framework

Google's HEART framework measures product health across five dimensions:

### Happiness (User Satisfaction)

How satisfied are users? Use surveys and NPS.

| Metric | Target | Why |
|---|---|---|
| **NPS (Net Promoter Score)** | > 50 | Gold standard; "would you recommend?" |
| **CSAT (Customer Satisfaction)** | > 85% | Feature-specific; "satisfied with X?" |
| **Task Completion Rate** | > 90% | Can users do what they came to do? |

**Red flag:** NPS < 30 or dropping; signals dissatisfaction.

### Engagement (How Users Interact)

Is the product sticky? Users who engage stick around.

| Metric | Definition | Target |
|---|---|---|
| **DAU/MAU** | Daily / Monthly Active Users | Growing month-over-month |
| **Session Length** | Avg time per session | Industry dependent (30s to 30m) |
| **Feature Adoption** | % using new feature after 1 month | > 30% |
| **Feature Stickiness** | 1-month retention of feature users | > 60% |

**Example:** "80% of users who see the new export feature use it within 1 month" = high engagement signal.

### Adoption (New Users Getting Value)

Are new users finding value quickly?

| Metric | Definition | Target |
|---|---|---|
| **Activation Rate** | % who complete key action (first post, first report, etc.) | > 40% |
| **Time to First Value** | Days until user does core action | < 3 days |
| **Activation Cohorts** | Activated week 1 vs week 2 users | Trends improve |

**Red flag:** Activation rate < 20%; something in onboarding is broken.

### Retention (Users Coming Back)

Do users stick around?

| Metric | Definition | Target |
|---|---|---|
| **D1 Retention** | % returning 1 day later | > 50% |
| **D7 Retention** | % returning 7 days later | > 25% |
| **D30 Retention** | % returning 30 days later | > 10-15% |
| **Churn Rate** | % not returning monthly | < 5-10% |

**Cohort analysis:** Compare when each cohort (signup week) was activated. Improving activation → improving D7 retention in future cohorts.

### Task Success (How Well Features Work)

Can users accomplish their goals?

| Metric | Definition | Target |
|---|---|---|
| **Task Completion Rate** | % of users who complete intended action | > 90% |
| **Error Rate** | % of actions resulting in error | < 5% |
| **Time on Task** | Avg time to complete action | Baseline vs new design |

**Use for:** Testing new UX designs; can A/B test task success.

## The AARRR Pirate Metrics

For SaaS/B2C products, track the funnel:

```
Acquisition → Activation → Retention → Revenue → Referral
```

### Acquisition

How do users find you?

```
Monthly Acquisition = CAC × Channels
├─ Organic (search, reviews)
├─ Paid ads (Google, Facebook)
├─ Sales (outbound)
├─ Partnerships
└─ Word of mouth
```

**Key metric:** CAC (Customer Acquisition Cost) = Marketing $ / New Customers

**Rule of thumb:** CAC < LTV / 3 is healthy.

### Activation

How many become active users?

```
Activation Rate = Active Users / Signups
├─ Email confirmation
├─ First action (post, create, etc.)
└─ 1-week engaged
```

**Target:** > 30-50% depending on category.

**Improve by:** Better onboarding, clearer first action, removing friction.

### Retention

How many come back?

```
Day 1 Retention
Day 7 Retention
Month 1 Retention (most important)
```

**Cohort trend:** Each new cohort should have better Month 1 retention.

**Improve by:** Better product-market fit, engagement loops, habit formation.

### Revenue

How much do users pay?

```
ARPU (Avg Revenue Per User) = Total Revenue / Active Users
ARPPU (Avg Revenue Per Paying User) = Total Revenue / Paying Users
LTV (Lifetime Value) = ARPPU × (1 / Churn Rate)
```

**Example:**
```
ARPPU = $100/user/year
Churn rate = 10% per year
LTV = $100 × (1 / 0.1) = $1000 per customer
```

### Referral

How many new users come from existing users?

```
Referral Rate = New Users from Referral / Total New Users
Viral Coefficient = Invites Sent × Signup Rate
```

**Viral coefficient:**
- < 1.0 = Dying exponentially (need other acquisition)
- = 1.0 = Self-sustaining
- > 1.0 = Exponential growth

## Leading vs Lagging Indicators

**Lagging indicators** = Outcome (hard to change short-term)
- Revenue, churn, NPS

**Leading indicators** = Input (you can influence week-to-week)
- Feature adoption, engagement, support tickets

**Use both:**
- Measure success with lagging indicators (revenue)
- Predict with leading indicators (if adoption is up, revenue will follow)

**Smart monitoring:**
```
This week:
- Feature adoption: 45% ✅ (up from 40%)
- Support tickets: 8 (down from 12)
- Avg response time: 2h (down from 4h)

Next month:
- NPS: Expect improvement from 42 → 48
- Churn: Expect to stay flat
```

If leading indicators improve but lagging metrics don't, you've either measured the wrong thing or the lag is longer than expected.

## North Star Metric Guardrails

Your North Star should grow, but track these guardrails to avoid optimizing for the wrong thing:

| North Star | Guardrail | Why |
|---|---|---|
| **DAU** | Churn rate (don't add users you lose) | High DAU but 50% monthly churn = empty growth |
| **Feature Adoption** | NPS (adoption of unloved feature = bad) | High adoption but NPS declining = churn will follow |
| **Revenue** | Customer satisfaction | Revenue up but NPS down = at risk from competitors |
| **Engagement** | Retention (engagement without stickiness = vanity) | High daily usage but 90% drop after 30 days = nothing |

**Smart rule:** No metric moves alone. If NS goes up but guardrails down, you're optimizing wrong.

## Data-Informed vs Data-Driven

**Data-Informed:** Use data to guide decisions, but override with judgment
- "Metrics say feature A, but I know customer Y will churn without feature B"
- Best for: Early stage, customer relationships matter

**Data-Driven:** Metrics decide everything, no exceptions
- "We only build what A/B tests prove works"
- Best for: Large scale, thousands of users, statistical power

**Most healthy:** Data-informed. Data tells you what's working; human judgment tells you why and what to try next.

## A/B Testing Basics

Before shipping a big change, test it:

```
Control (existing)        Treatment (new)
├─ 50% users see old UX  ├─ 50% users see new UX
├─ Baseline: 40% CTR     ├─ Measure: X% CTR
└─ N=10,000              └─ N=10,000

Result: 45% CTR → 12% lift
Confidence: 95% → Statistically significant → Ship it
```

**Common mistakes:**
- **Stopping early** — Don't check results until sample size is hit
- **Multiple metrics failing** — If 1 metric wins but others lose, it's not actually a win
- **Forgetting novelty** — New always wins briefly; measure for 4 weeks

## Related References

See [[CON-okr-framework]] for setting metric targets, [[CON-product-vision-strategy]] for understanding what matters, and [[CON-product-discovery]] for validating before measuring at scale.
