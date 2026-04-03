---
type: MOC
tags: [MOC, AI, LLM]
updated: 2026-03-25
---

# 🗺️ MOC — AI & LLM Integration

> **When to open this MOC:**
> - Building features that use LLMs (Claude, GPT-4, etc.)
> - Designing AI/ML systems and pipelines
> - Evaluating LLM performance and cost
> - Implementing RAG, tool use, or agentic workflows
> - Debugging LLM behavior and hallucination

---

## Concept Map

### Core LLM Concepts

- [[CON-llm-integration]] — Tokens, temperature, prompt engineering, RAG, tool use, cost optimization, error handling, evaluation

> **Planned notes** (not yet created): CON-prompt-engineering, CON-rag-patterns, CON-llm-evaluation

### Integration Patterns

- [[CON-api-design-principles]] — Designing APIs that work well with LLM tool use (idempotency, clear contracts)
- [[CON-async-patterns]] — Handling long-running LLM jobs, streaming responses, batch processing
- [[CON-caching-strategies]] — Prompt caching (ephemeral and session), response caching, token optimization
- [[CON-error-handling]] — Rate limits, context length, retry strategies, graceful degradation

### AI Infrastructure

> **Planned notes** (not yet created): CON-vector-databases, CON-embedding-models, CON-cost-analysis-llm

### Safety & Governance

> **Planned notes** (not yet created): CON-prompt-injection-defense, CON-llm-bias-mitigation, CON-data-privacy-ai

---

## Quick Navigation by Scenario

### "I need to add AI to my app (first time)"
1. Read: [[CON-llm-integration]] — Sections on API basics, prompt engineering, simple completion
2. Choose: OpenAI GPT-4o mini vs Anthropic Claude 3 Haiku (cost vs reasoning tradeoff)
3. Implement: [[CON-api-design-principles]] + [[CON-error-handling]]

### "I need to ground LLM responses in real data"
Start: [[CON-llm-integration]] — section on RAG
*(Detailed notes CON-rag-patterns, CON-vector-databases, CON-cost-analysis-llm not yet created)*

### "I want the model to call my APIs"
Start: [[CON-llm-integration]] — section on Tool Use
Read: [[CON-api-design-principles]] to ensure your APIs are tool-use friendly
Reference: [[CON-error-handling]] for tool call timeouts and retries

### "How do I know if my LLM output is good?"
Start: [[CON-llm-integration]] — Evaluation section
Simple: Manual sampling (rate 50 responses yourself)
Automated: RAGAS metrics + LLM-as-judge
*(CON-llm-evaluation not yet created)*

### "My LLM costs are too high"
Read: [[CON-llm-integration]] — Sections on caching, batching, model selection
Profile: Which features consume the most tokens?
*(CON-cost-analysis-llm not yet created)*

### "Users are tricking my LLM with weird input"
Start: [[CON-llm-integration]] — Section on input validation and safety
Protect: Use tool use + input validation
*(CON-prompt-injection-defense not yet created)*

### "I'm building a chatbot"
Start: [[CON-llm-integration]] — Multi-turn conversation section
Add: [[CON-caching-strategies]] for system prompt reuse
Monitor: Manual sampling + LLM-as-judge feedback loop

### "I want to use open-source models"
Start: [[CON-llm-integration]] — Model selection section
Trade-off: Speed + cost vs inference quality
Deploy: [[CON-async-patterns]] (local inference is slower)
*(CON-embedding-models, CON-cost-analysis-llm not yet created)*

---

## Key Principles from This MOC

1. **Tokens cost money** — Profile your usage; cheaper models often work fine
2. **RAG is not magic** — Good chunks + relevant retrieval > more context
3. **Tool use > raw generation** — For data lookups and state changes, always use tool use
4. **Prompt engineering matters, but has limits** — If a prompt hack is required, change the system
5. **Evaluate early and often** — Don't wait for production to discover the model hallucinates
6. **Streaming and caching are worth it** — Perceived speed matters, token reuse saves cost
7. **Errors will happen** — Rate limits, context overflow, hallucination. Plan for degradation

---

## Related MOCs

- [[MOC-Backend]] — System design, API contracts, database patterns for LLM integration
- [[MOC-Frontend]] — Streaming responses to UI, handling LLM state, user feedback loops
- [[MOC-QA]] — Testing LLM outputs, evaluation frameworks
- [[MOC-Decisions]] — When to use LLMs vs traditional approaches

---

## Workflow: Shipping LLM Features

1. **Discover & Design** — What problem does the LLM solve? Could a simpler approach work?
2. **Prompt Engineering** — Zero-shot baseline, then iterate with examples
3. **Evaluation** — Manual samples (50-100). Is quality good enough?
4. **Optimize Cost** — Switch to cheaper model? Use caching or batching?
5. **Implement Tool Use** — If you need to fetch data or take actions
6. **Error Handling** — Rate limits, retries, graceful fallback
7. **Monitor & Iterate** — Track quality, cost, latency in production

---

**Last updated:** 2026-03-25
**Review frequency:** Every 2 weeks (LLM landscape changes fast; new models, pricing changes)
