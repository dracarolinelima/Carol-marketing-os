# Carol Marketing OS — Proactive Routing

## Purpose

This file defines how Claude should route marketing work automatically inside 
Carol Marketing OS.

The objective is not to invoke the largest possible number of agents or skills.

The objective is to select the **minimum sufficient workflow** that produces a 
reliable result while preserving strategy, scientific integrity, brand 
consistency, privacy and human approval.

Claude should route by the user's intended outcome, not by generic marketing 
templates.

---

# Strategic Authority

Before material marketing work, use the following precedence:

1. Safety, ethics, law and applicable professional rules
2. Applicable scientific evidence and guidelines
3. `memory/carol-marketing-os/marketing-core.md`
4. Reliable internal data
5. Approved strategy
6. Approved Brand / Voice and Design System
7. Approved editorial and performance learnings
8. Agent and skill instructions
9. External frameworks, templates and trends

No skill, trend, template or external framework may override a higher-priority 
source.

---

# Golden Rule

If the user's intent is clear, route automatically.

Do not ask:

- which agent should be used;
- which skill should be used;
- whether Claude should invoke an obvious specialist.

The user should describe the business or communication objective.

The system should determine the appropriate workflow.

However:

**automatic routing does not mean automatic external action.**

Publication, sending, budget changes and other permanent human gates remain 
subject to `autonomy.yaml`.

---

# Minimum Sufficient Workflow

Do not invoke every specialist for every request.

Use only the agents necessary to answer the actual request reliably.

Examples:

Simple wording adjustment with no material medical claim
→ Creator / Copywriter

Existing draft requiring quality review
→ Editor

External market question
→ Market Research

Question about internal leads or patients
→ Audience Intelligence

Medical evidence question
→ Scientific Research

Visual execution of already approved content
→ Art Director

Marketing results or funnel question
→ Performance Analyst

Substantial new strategic content
→ Strategist before Creator

Substantial medical content
→ Scientific Research when required
→ Strategist
→ Creator
→ Editor

---

# Research Routing

The generic term "research" must not automatically route to one generic 
Researcher.

Determine what kind of truth is being requested.

## Internal Audience / Business Evidence

Route to:

`MOS-Audience Intelligence`

Typical intent:

- Who are our leads?
- What do patients ask before booking?
- What objections appear in WhatsApp?
- What patterns exist in questionnaires?
- What do reviews reveal?
- What distinguishes attended patients from other leads?
- What does our own CRM show?
- What does our attendance history show?
- What patient language should inform content?

Primary principle:

Internal evidence answers questions about **our audience and business**.

---

## External Market Evidence

Route to:

`MOS-Market Research`

Typical intent:

- What are competitors communicating?
- What are women searching for?
- What questions are appearing publicly?
- What content formats are gaining attention?
- What topics are emerging?
- What external opportunities deserve investigation?
- What is happening in the market?

Primary principle:

External evidence answers questions about **the market and public 
conversation**.

Popularity does not establish scientific truth.

---

## Scientific / Medical Evidence

Route to:

`MOS-Scientific Research`

Typical intent:

- Is this medical claim supported?
- What do guidelines say?
- What is the evidence for this treatment or association?
- Can we responsibly say this in content?
- How strong is the evidence?
- Is this association causal?
- Is this topic controversial?
- What references support the statement?

Primary principle:

Scientific Research determines what **medical evidence responsibly allows us to 
say**.

It does not determine whether a topic is commercially attractive.

---

## Mixed Research

If a request requires more than one type of evidence, route to the necessary 
specialists separately.

Example:

"What are women asking about testosterone, and what can I scientifically say 
about it?"

→ Market Research for external demand/questions
→ Scientific Research for medical evidence
→ Strategist if the objective is to turn the findings into content

Do not allow one specialist to impersonate another.

---

# Strategy Routing

Route to:

`MOS-Strategist`

when the user needs decisions such as:

- what content should be created;
- what angle should be used;
- what audience should be prioritized;
- what content function is appropriate;
- what journey stage should be addressed;
- how a campaign should be structured;
- what perception should change;
- what message should lead;
- what proof is necessary;
- what CTA logic is appropriate;
- how multiple content pieces should work together.

Examples:

"What should I post about perimenopause this week?"
→ Strategist

"I want a campaign to attract more hysteroscopy patients."
→ Relevant research as needed
→ Strategist

"I have this idea for a Reel. What is the best angle?"
→ Strategist

Strategy should be proportional to the request.

A small content decision does not require a large campaign architecture.

---

# Creation Routing

Route to:

`MOS-Creator / Copywriter`

when strategic direction is already sufficiently clear and the user wants 
execution.

Typical requests:

- write the Reel;
- write the caption;
- create carousel copy;
- rewrite this paragraph;
- improve this hook;
- create Stories;
- shorten this copy;
- make this sound more like Carol;
- turn an approved brief into content.

For substantial original content, confirm that sufficient strategic direction 
exists.

If not:

→ Strategist first.

Do not automatically force a full strategic workflow for small edits to 
user-provided copy.

---

# Medical Content Routing

If content contains a **material medical claim**, determine whether the claim 
is already sufficiently verified.

If verification is missing or uncertain:

→ Scientific Research

Then, when substantial content is being created:

→ Strategist
→ Creator
→ Editor

Examples of claims requiring scientific attention may include:

- treatment benefits;
- risks;
- diagnostic claims;
- prevalence;
- causal claims;
- hormone effects;
- medication effects;
- fertility outcomes;
- metabolic effects;
- clinical comparisons;
- claims presented as medical fact.

Do not route ordinary stylistic edits through Scientific Research when no 
material medical meaning changes.

---

# Editorial Review Routing

Route to:

`MOS-Editor`

when the user wants:

- final review;
- medical communication review;
- brand review;
- ethical review;
- claim review;
- tone review;
- conversion-quality review;
- assessment of whether content is ready for publication.

The Editor is the quality gate.

It should return content upstream when necessary rather than repairing 
unsupported strategy or science silently.

Possible routes include:

Editor
→ Scientific Research

Editor
→ Strategist

Editor
→ Creator

Human approval remains required where defined by `autonomy.yaml`.

---

# Visual Routing

Route to:

`MOS-Art Director`

when the communication and copy are sufficiently approved and the user needs:

- visual direction;
- carousel layout;
- static-post composition;
- hierarchy;
- typography guidance;
- template selection;
- Design System application;
- migration from legacy 4:5 to current 3:4 format.

Current standard for new Instagram feed static posts and carousel slides:

`1080 × 1440 px — 3:4`

Legacy:

`1080 × 1350 px — 4:5`

Do not mechanically stretch legacy templates.

The first migration of each template family requires human visual validation.

The Art Director must not rewrite strategy merely to fit a layout.

---

# Performance Routing

Route to:

`MOS-Performance Analyst`

when the user asks:

- what worked;
- what did not work;
- whether ads are bringing qualified patients;
- which content attracts better leads;
- where the funnel is leaking;
- how Meta campaigns performed;
- whether leads became appointments;
- whether appointments became attendance;
- whether marketing generated verified revenue;
- what should be tested next;
- whether a result is meaningful;
- how organic and paid acquisition compare.

Performance analysis should connect:

content / creative / campaign
→ lead
→ qualified lead
→ confirmed appointment
→ attendance
→ verified revenue
→ downstream value when measurable.

Do not optimize only for:

- followers;
- views;
- likes;
- engagement;
- raw leads.

---

# Performance Source Routing

For current operational analysis:

## Meta Ads Manager

Use for:

- spend;
- campaign structure;
- ad sets;
- ads;
- creatives;
- delivery metrics;
- platform advertising metrics.

Meta does not independently verify real attendance or revenue.

## Cliente IO

Use the raw conversation for:

- lead existence;
- questions;
- objections;
- chronology;
- source evidence when reliable;
- booking evidence;
- deposit/payment evidence when observable.

### Never use Cliente IO AI classification as ground truth.

Do not trust automated labels such as:

- qualified;
- unqualified;
- converted;
- scheduled;
- won;
- lost.

Apply Carol Marketing OS operational definitions to the raw evidence.

## Attendance Spreadsheet

Use as the primary current operational source for:

- verified attendance;
- consultation amount paid when reliably recorded.

Do not infer attendance from a scheduled CRM conversation.

Do not infer revenue from a quoted price.

---

# Content Workflow Routing

For substantial strategic content, the default workflow is:

Relevant Intelligence
→ Strategist
→ Creator
→ Editor
→ Art Director when visual production is required
→ Human Approval
→ Publish
→ Performance Analyst
→ Feedback

This is a default model, not mandatory bureaucracy.

Skip stages that are genuinely unnecessary.

---

# Trend-to-Content Routing

When an external trend or popular topic is identified:

Market Research
→ Scientific Research if medical claims are involved
→ Strategist
→ downstream content workflow.

Never use:

"this is trending"

as sufficient justification for:

"this is medically true."

---

# Existing Draft Routing

If the user already provides substantial copy:

## Simple edit

Examples:

- fix accents;
- shorten;
- improve clarity;
- make more concise;
- adjust CTA without changing strategy.

→ Creator / Copywriter

## Strategic problem

Examples:

- wrong audience;
- weak positioning;
- unclear objective;
- poor journey fit.

→ Strategist
→ Creator if rewriting is needed

## Medical evidence problem

→ Scientific Research
→ Editor / Creator as appropriate

## Final readiness review

→ Editor

Do not rebuild an entire workflow unnecessarily when the user only wants a 
small correction.

---

# Campaign Routing

When the user requests a campaign, first identify the business objective.

Examples:

- attract qualified hysteroscopy demand;
- increase perimenopause consultations;
- improve paid lead quality;
- strengthen trust before price contact;
- increase attendance;
- reactivate an appropriate audience.

Then determine which intelligence is actually needed.

Possible workflow:

Audience Intelligence and/or Market Research
→ Scientific Research when medical claims require it
→ Strategist
→ Creator
→ Editor
→ Art Director
→ Human Approval
→ distribution
→ Performance Analyst

Do not assume every campaign requires every research function.

---

# Paid Media Routing

Until a dedicated `MOS-Meta Ads` specialist is approved:

Paid-media analysis
→ Performance Analyst

Creative strategy
→ Strategist

Creative production
→ Creator + Editor + Art Director as needed

Budget allocation or material campaign change
→ Human approval

Do not autonomously:

- change budget;
- launch campaigns;
- stop campaigns;
- alter major targeting;
- make irreversible paid-media changes.

---

# Email Routing

Email marketing is not part of the current primary Carol Marketing OS workflow.

Do not automatically invoke `/email-sequence`.

If the user explicitly decides to develop email marketing later, evaluate the 
need and architecture at that time.

Legacy email skills must not create automatic routing in the current system.

---

# Ambiguity Handling

Do not ask the user to choose an agent or skill.

If the desired outcome can be inferred reliably, route automatically.

If a genuinely material ambiguity remains, ask the **smallest possible 
outcome-oriented question**.

Example:

Instead of:

"Which skill should I use?"

ask:

"Você quer descobrir por que esses leads não agendaram ou quer transformar o 
achado em uma nova estratégia de conteúdo?"

Ask only when the answer materially changes the workflow.

---

# Direct User Instructions Override Default Routing

If the user explicitly asks for a narrow action, respect it when safe.

Examples:

"Only correct the grammar."
→ Do not trigger a full strategy workflow.

"Just analyze these Meta numbers."
→ Performance Analyst; do not automatically create a campaign.

"Check the scientific evidence before we write anything."
→ Scientific Research first.

"Don't change the strategy, just improve the wording."
→ Creator within the approved strategy.

Do not turn a narrow request into unnecessary system activity.

---

# Memory and Context Check

Before substantial marketing work, consult the relevant current sources.

Primary strategic source:

`memory/carol-marketing-os/marketing-core.md`

Operational source:

`CLAUDE.md`

Architecture:

`.claude/agents/marketing-os/definition.md`

Autonomy:

`.claude/agents/marketing-os/autonomy.yaml`

Specialist methodology:

the relevant active agent file.

Additional approved memory may be consulted when relevant.

Do not assume that legacy files under `memory/marketing-os/` override the 
Carol-specific Marketing Core.

---

# Learning Routing

Performance findings and user corrections may generate:

OBSERVATION
→ CANDIDATE LEARNING
→ APPROVED RULE

Do not automatically convert:

- one successful post;
- one failed post;
- one user correction;
- one campaign result;
- one performance association

into a permanent strategy rule.

Permanent strategic changes require the appropriate human approval.

---

# Evidence Discipline

Throughout routing, preserve the distinction between:

**FATO OBSERVADO**
Directly supported by evidence.

**ASSOCIAÇÃO**
A relationship is observed without established causality.

**HIPÓTESE**
A plausible explanation requiring testing or more evidence.

**DECISÃO ESTRATÉGICA**
A deliberate business or communication choice.

Routing should never silently upgrade one category into another.

---

# Privacy Routing

Patient data are sensitive.

When internal patient data are involved:

→ use minimum necessary data;
→ prefer anonymized identifiers;
→ prefer aggregated findings;
→ avoid unnecessary PII in persistent marketing memory.

Do not route identifiable patient information to external tools unless 
explicitly authorized and necessary.

---

# Anti-Patterns

Do not:

1. route all research to one generic Researcher;
2. send Instagram requests directly to generic `/social-content` when strategy 
is materially unresolved;
3. invoke `/email-sequence` automatically;
4. use generic SaaS concepts such as churn, signups, activation or product 
launch as default patient-acquisition logic;
5. force a full multi-agent chain for a trivial edit;
6. skip Scientific Research when an important medical claim requires 
verification;
7. use trends as scientific evidence;
8. let Creator invent strategy that should be resolved upstream;
9. let Editor silently invent evidence;
10. let Art Director change strategy to fit a template;
11. let Performance Analyst infer attendance or revenue without authoritative 
evidence;
12. use Cliente IO AI classification as ground truth;
13. optimize for vanity metrics alone;
14. publish or send material without required human approval;
15. change advertising budget autonomously;
16. allow performance findings to rewrite the Marketing Core automatically;
17. ask the user which agent or skill to use;
18. create workflow bureaucracy that does not improve the decision.

---

# Final Routing Principle

Route by the truth needed and the decision being made.

Internal audience truth
→ Audience Intelligence

External market truth
→ Market Research

Medical truth
→ Scientific Research

Strategic decision
→ Strategist

Communication execution
→ Creator

Quality control
→ Editor

Visual execution
→ Art Director

Business outcome analysis
→ Performance Analyst

Coordination
→ Orchestrator

Human judgment remains the final authority where required.

The goal is not maximum automation.

The goal is the smallest reliable workflow that produces a better decision.
