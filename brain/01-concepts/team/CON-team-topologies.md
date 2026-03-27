---
type: concept
tags: [team, organization, team-topologies, conways-law, platform-team, stream-aligned]
related: [CON-microservices-patterns, CON-domain-driven-design, CON-scrum-roles, CON-agile-manifesto]
updated: 2026-03-25
source: template
---

# Team Topologies

Foundation: *Team Topologies: Organizing Business and Technology Teams for Fast Flow* by Matthew Skelton & Manuel Pais (O'Reilly, 2019).

---

## Conway's Law

> "Organizations design systems that mirror their communication structure." — Melvin Conway, 1968

**Implication:** If you have 3 teams, you'll get 3 modules. If you have distributed org, you'll get distributed architecture.

**Inverse Conway Maneuver:** Design your team structure to match the architecture you want.

**Example:**
- Want microservices? Create small, autonomous teams
- Want monolith? Create large, tightly-coupled teams
- Want modular monolith? Create teams owning feature domains within shared codebase

---

## 4 Team Types

### 1. Stream-Aligned Team
**Purpose:** Deliver value continuously to end users along a product stream.

**Characteristics:**
- Own end-to-end feature/capability stream
- Cross-functional (frontend, backend, QA, product)
- Autonomous decision-making within their domain
- Minimized inter-team dependencies
- Typical size: 6-9 people (one pizza team)

**Example:** "E-commerce Checkout Team" — responsible for the entire checkout experience from UI to payment processing to order fulfillment.

**When to use:** Most teams should be stream-aligned. This is the default.

---

### 2. Platform Team
**Purpose:** Reduce cognitive load for stream-aligned teams by providing self-service capabilities.

**Characteristics:**
- Provides shared services (CI/CD, observability, auth, databases, deployment infrastructure)
- Enables other teams to operate faster and safer
- Internal customers are stream-aligned teams
- Should provide "paved paths" — opinionated, curated choices
- Typical size: 3-6 people

**Example:** "Developer Platform Team" — provides Kubernetes clusters, logging, alerting, secret management, and documentation.

**When to use:** Once you have 3+ stream-aligned teams, platform team ROI becomes clear.

**Anti-pattern:** Platform team that is too large or makes teams dependent on it for every deployment.

---

### 3. Enabling Team
**Purpose:** Help other teams adopt new practices, technologies, or patterns.

**Characteristics:**
- Temporary or transitional (not a permanent sink for specialists)
- Examples: migration enablement, testing practices, security adoption
- Works closely with stream-aligned teams to transfer knowledge
- Dissolves once capability is adopted
- Typical size: 2-4 people

**Example:** "Cloud Migration Enabler" — helps teams move from monolith to microservices, then dissolves.

**When to use:** Large org shifts (adopting new language, framework, architecture pattern).

**Anti-pattern:** Enabling team that never dissolves (becomes a bottleneck).

---

### 4. Complicated Subsystem Team
**Purpose:** Handle subsystems with high cognitive load that require deep specialization.

**Characteristics:**
- Owns a technically complex domain (ML model training, video encoding, cryptography)
- Reduces cognitive load for other teams by hiding complexity
- Rare — most systems don't have true "complicated subsystems"
- Typical size: 2-5 people

**Example:** "ML Model Training Team" — owns model pipeline, feature engineering, evaluation; stream-aligned teams consume models as a service.

**When to use:** Only when a subsystem requires expertise that stream-aligned teams shouldn't need.

**Anti-pattern:** Using this as a dumping ground for "hard" problems.

---

## 3 Interaction Modes

How teams should relate to each other:

### 1. Collaboration
**Use when:** Exploring new territory, high uncertainty, knowledge transfer needed.
- Both teams work together synchronously
- Frequent communication, pair sessions
- Limited time (weeks, not months)
- Example: Stream-aligned team + Enabling team migrating to new framework

**Cost:** High communication overhead, slows both teams.

### 2. X-as-a-Service (XaaS)
**Use when:** One team provides a mature service to another.
- Well-defined interface (API, CLI, docs)
- Asynchronous interaction
- Clear SLOs and support model
- Example: Stream-aligned team consuming Platform team's Kubernetes service

**Benefit:** Autonomous, scalable, reduces cognitive load.

### 3. Facilitating
**Use when:** Unblocking another team without taking over work.
- Quick answer, pointer, or consultation
- Enabler provides guidance, stream-aligned team implements
- Example: Platform team showing security team how to audit logs

**Cost:** Minimal, opportunistic.

---

## Cognitive Load

**Definition:** How much mental effort a team needs to do their job effectively.

**Three types (Papert & Harel, 1991):**
1. **Intrinsic load:** Fundamental complexity of the domain (hard to change)
2. **Extraneous load:** Unnecessary complexity from tooling, processes, unclear ownership (reduce this)
3. **Germane load:** Effort spent on deep learning and mastery (maximize this)

**How team topologies reduce cognitive load:**
- **Platform team** removes extraneous load (no need to set up CI/CD)
- **Enabling team** distributes intrinsic load (helps others learn)
- **Complicated subsystem team** hides intrinsic load (other teams don't need to understand it)

**Symptoms of high cognitive load:**
- Teams frequently blocked waiting for other teams
- High defect rates, slow delivery
- Staff burnout, frequent turnover
- Context switching (on-call, meetings, interruptions)

---

## Team Size

### Two-Pizza Rule (Amazon)
**Rule:** Team should be small enough to feed with 2 pizzas (typically 6-10 people).

**Rationale:** Smaller teams communicate more effectively, move faster, take ownership.

### Dunbar's Number
**Theory:** Humans can maintain stable relationships with ~150 people.

**Implication:** Orgs > 150 people need explicit structure (teams, roles, processes).

### Sizing principles:
- **Too small (<3):** Not enough skills, too dependent on individuals
- **Too large (>9):** Coordination overhead, diffused ownership, communication chaos
- **Sweet spot: 6-9** people (cross-functional with some specialization)

---

## Signals Your Team Topology Is Wrong

🚩 **Org misalignment with architecture:**
- Org has one team per layer (frontend, backend, data) but system is horizontal
- Org is geographical but teams need tight synchronous coupling
- Decision: Reorganize or accept high communication cost

🚩 **Dependencies between stream-aligned teams:**
- Team A can't deploy without Team B's work
- Causes delays, hand-offs, blame culture
- Fix: Reorganize around product domains, not technical layers

🚩 **Platform team is a bottleneck:**
- Every deployment requires platform team approval
- Teams waiting for platform to provision infrastructure
- Fix: Decentralize via self-service, hire more, or split platform team

🚩 **Too many Enabling teams:**
- Org has 5 enabling teams, 2 platform teams, 1 stream-aligned team
- Suggests org is not executing, just changing practices
- Fix: Move enablers' knowledge into stream-aligned teams and platform, dissolve enablers

🚩 **Complicated Subsystem team is a knowledge silo:**
- No one else can touch the code, team is irreplaceable
- Single point of failure
- Fix: Document, pair, refactor to reduce complexity, or grow the team

🚩 **Communication patterns don't match org chart:**
- Org chart says Team A and Team B are independent
- Reality: Team A waits for Team B every sprint
- Fix: Re-org to match real communication needs

---

## Quick Reference: Choosing Your Team Type

| Team Type | Size | Autonomy | Skills | Duration | Use Case |
|-----------|------|----------|--------|----------|----------|
| Stream-Aligned | 6-9 | High | Cross-functional | Permanent | Default: product features |
| Platform | 3-6 | Medium | DevOps, infrastructure, tools | Permanent | Enable other teams |
| Enabling | 2-4 | Medium | Specialist | 3-6 months | Knowledge transfer, adoption |
| Complicated Subsystem | 2-5 | Medium | Deep specialization | Permanent | Complex technical domains |

---

## Implementation Pattern

**Phase 1: Define your product streams** (not layers)
- What are the user-facing capabilities or domains?
- Each becomes a potential stream-aligned team

**Phase 2: Map teams to streams**
- One stream-aligned team per stream
- Cross-functional: FE, BE, QA, product sense

**Phase 3: Identify shared needs**
- What's slowing down multiple teams?
- Create platform team to own shared infrastructure

**Phase 4: Plan transitions**
- If migrating from layer-based org, use Enabling teams
- Gradual, not big-bang (too disruptive)

**Phase 5: Monitor and adjust**
- Quarterly: Are teams autonomous? Are dependencies minimized?
- Yearly: Do we still need all these teams? Can we combine?

---

See also: [[CON-scrum-roles]], [[CON-agile-manifesto]], [[CON-domain-driven-design]]
