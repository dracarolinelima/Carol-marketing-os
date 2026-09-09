---
name: research
description: Routes research requests inside Carol Marketing OS to the correct 
specialist source of truth. Use when the user asks for research, audience 
intelligence, internal patient or lead analysis, competitor or market analysis, 
trends, or scientific/medical evidence. Distinguishes internal audience 
evidence, external market evidence, and scientific evidence instead of 
combining them into one generic research process.
---

# Research Router — Carol Marketing OS

## Purpose

This skill routes research questions to the correct specialist inside Carol 
Marketing OS.

It is intentionally lightweight.

It does not replace the specialist research agents and must not recreate their 
methodologies.

The three research domains are:

1. Internal audience and business evidence
2. External market evidence
3. Scientific and medical evidence

These domains answer different questions and must not be conflated.

---

# Strategic Authority

Before using research to support a marketing decision, respect this precedence:

1. Safety, ethics, law and professional rules
2. Applicable scientific evidence and guidelines
3. `memory/carol-marketing-os/marketing-core.md`
4. Reliable internal data
5. Approved strategy
6. Approved Brand / Voice and Design System
7. Approved learnings
8. Agent and skill instructions
9. External frameworks, templates and trends

Research informs decisions.

It does not automatically rewrite the Marketing Core.

---

# Routing Rule

Determine first:

**What kind of truth is required to answer the question?**

Then route to the minimum sufficient specialist workflow.

---

# 1. Internal Audience / Business Research

Route to:

`MOS-Audience Intelligence`

Use when the question depends primarily on Carol's own data.

Examples:

- Who are our leads?
- What are patients asking in WhatsApp?
- What objections appear before booking?
- What language do patients use?
- What patterns appear in pre-consult questionnaires?
- What do reviews reveal?
- What characteristics appear among attended patients?
- What differs between Meta and organic leads?
- What does our CRM show?
- What does our attendance history show?
- What internal evidence supports this audience hypothesis?
- What do confirmed patients appear to value?

Possible sources include:

- Cliente IO raw conversations;
- pre-consult questionnaires;
- reviews;
- attendance spreadsheet;
- agenda data;
- reliable financial/operational records;
- secretary feedback;
- other approved internal sources.

Do not use Cliente IO AI classifications as ground truth.

Do not infer attendance from booking conversation alone.

Do not infer revenue from quoted price.

Prefer anonymized or aggregated evidence.

---

# 2. External Market Research

Route to:

`MOS-Market Research`

Use when the question depends primarily on information outside Carol's own 
operation.

Examples:

- Who are relevant competitors?
- What are competitors communicating?
- What topics are gaining attention?
- What questions are women asking publicly?
- What language appears in public discussions?
- What content formats are being used?
- What gaps exist in the external conversation?
- What trends may deserve strategic attention?
- How are comparable physicians positioning a service?
- What public demand signals exist around a topic?

Possible sources include:

- search engines;
- competitor websites;
- public social content;
- public reviews;
- forums and communities;
- YouTube;
- news;
- search trends;
- other relevant public sources.

Use current and authoritative sources when freshness matters.

Do not treat popularity as medical truth.

Do not assume competitor behavior is best practice.

Do not automatically copy competitor positioning, hooks or formats.

---

# 3. Scientific / Medical Research

Route to:

`MOS-Scientific Research`

Use when the question depends on medical or scientific evidence.

Examples:

- Is this claim scientifically supported?
- What do current guidelines say?
- What is the evidence for this treatment?
- What is the evidence for this association?
- Can we responsibly say this in a post?
- Is this causal or associative?
- How strong is the evidence?
- Is this controversial?
- What limitations should be communicated?
- What references support the claim?
- Has newer evidence changed the interpretation?

Prioritize the most appropriate evidence for the question, which may include:

- guidelines;
- consensus statements;
- systematic reviews;
- meta-analyses;
- randomized trials;
- observational studies;
- mechanistic or preclinical evidence;
- expert opinion.

Do not apply a hierarchy mechanically.

Never fabricate:

- authors;
- titles;
- journals;
- DOI;
- PMID;
- guidelines;
- study results;
- effect sizes;
- sample sizes.

If evidence cannot be verified, state that explicitly.

---

# 4. Mixed Research

Some questions require more than one research domain.

Use multiple specialists only when necessary.

## Example: Market Demand + Science

User:

"What are women asking about testosterone, and what can I responsibly say about 
it?"

Route:

`MOS-Market Research`
→ external questions and demand signals

`MOS-Scientific Research`
→ evidence and claim boundaries

Then:

`MOS-Strategist`

if the objective is to transform the findings into content strategy.

---

## Example: Internal Audience + Science

User:

"My patients complain a lot about fatigue in perimenopause. What does our data 
show and what can I scientifically say about it?"

Route:

`MOS-Audience Intelligence`
→ internal prevalence and patient language

`MOS-Scientific Research`
→ scientific interpretation and evidence

---

## Example: Internal + External

User:

"Are the objections we see in WhatsApp similar to what women discuss publicly?"

Route:

`MOS-Audience Intelligence`
→ internal evidence

`MOS-Market Research`
→ external evidence

Compare the datasets without pretending they are one sample.

---

# Research Question Discipline

Before substantial research, define the question clearly.

A useful research question identifies:

- what decision the research should inform;
- what population or subject matters;
- what type of evidence is needed;
- what timeframe matters when relevant.

Do not perform broad research merely because research is possible.

Research should reduce a real uncertainty.

---

# Evidence Classification

Research findings should preserve the distinction between:

## FATO OBSERVADO

Directly supported by the available evidence.

## ASSOCIAÇÃO

A relationship is observed, but causality is not established.

## HIPÓTESE

A plausible explanation requiring additional evidence or testing.

## DECISÃO ESTRATÉGICA

A deliberate business or communication choice based on available evidence.

Never silently upgrade one category into another.

---

# Confidence and Limitations

Confidence should reflect evidence quality, relevance, consistency and 
completeness.

Do not assign confidence using arbitrary universal thresholds such as:

- 50+ datapoints = high confidence;
- 10–49 = medium;
- 3–9 = low.

Sample size matters, but it is not the only determinant of confidence.

Consider:

- source quality;
- sampling bias;
- representativeness;
- missing data;
- measurement quality;
- recency;
- consistency across sources;
- confounding;
- applicability to Carol's actual decision.

State important limitations.

---

# Voice-of-Customer Principle

Real patient or audience language can be valuable.

Use it when it helps understand:

- symptoms;
- concerns;
- expectations;
- objections;
- desired outcomes;
- confusion;
- decision criteria.

Do not require direct quotes in every research output.

When direct quotes are used:

- preserve context;
- avoid cherry-picking;
- protect privacy;
- do not expose identifiable patient information;
- distinguish internal patient language from external public language.

---

# Source Discipline

Every material factual claim should be traceable to an appropriate source.

Do not fabricate missing information.

If sources conflict:

- report the conflict;
- assess which source is more authoritative for that question;
- do not silently choose the more convenient answer.

Different sources may be authoritative for different stages.

Examples:

Meta Ads Manager
→ paid-media spend and delivery

Cliente IO raw conversation
→ lead conversation and observable booking evidence

Attendance spreadsheet
→ verified attendance

Scientific literature
→ medical evidence

Public web sources
→ external market evidence

---

# Output Principle

Do not force structured JSON for every research task.

Use the output format that best supports the next decision.

Possible outputs include:

- concise findings;
- evidence table;
- research memo;
- audience insight summary;
- competitor map;
- scientific evidence summary;
- structured handoff;
- JSON when machine-readable transfer is genuinely useful.

Machine structure should support the workflow, not create unnecessary 
bureaucracy.

---

# Handoff Principle

When research feeds another specialist, preserve:

- research question;
- source type;
- key findings;
- evidence classification;
- confidence;
- limitations;
- relevant citations or source references;
- unresolved questions;
- implications that are supported by the evidence.

Do not convert a research implication into approved strategy unless the 
Strategist or human decision-maker makes that decision.

---

# Privacy

Internal patient data are sensitive.

Use the minimum necessary information.

Prefer:

- anonymized IDs;
- aggregated findings;
- de-identified language;
- summarized patterns.

Do not persist unnecessary PII in marketing memory.

Do not send identifiable patient information to external research tools unless 
explicitly authorized and necessary.

---

# Anti-Patterns

Do not:

1. combine audience, market and scientific research into one generic analysis;
2. automatically use BOFU-first research;
3. assume decision-stage content is always commercially superior;
4. default to SaaS buyer frameworks;
5. use G2 or Capterra as default healthcare audience sources;
6. require competitor pricing analysis for every market question;
7. force competitor comparison pages or "vs" content;
8. use arbitrary sample-count thresholds as confidence scores;
9. require exactly five findings;
10. force JSON when prose or a table is more useful;
11. treat Reddit or social comments as representative population evidence;
12. treat search popularity as scientific evidence;
13. treat internal patient samples as population prevalence;
14. use Cliente IO AI labels as ground truth;
15. infer attendance or revenue from CRM booking evidence;
16. fabricate citations or missing data;
17. turn one research finding into a permanent Marketing Core rule;
18. research broadly when a narrower question would answer the decision.

---

# Quick Routing Examples

"Who are our competitors?"
→ `MOS-Market Research`

"What are patients asking us about menopause?"
→ `MOS-Audience Intelligence`

"Does testosterone improve energy in women?"
→ `MOS-Scientific Research`

"Why are our Meta leads not attending?"
→ `MOS-Performance Analyst`
→ `MOS-Audience Intelligence` when internal conversation analysis is needed

"What topics about perimenopause are gaining attention, and which claims are 
scientifically defensible?"
→ `MOS-Market Research`
→ `MOS-Scientific Research`
→ `MOS-Strategist` if content strategy is requested

"Research this before we create a campaign."
→ Determine which uncertainty must be resolved
→ invoke only the relevant specialist research domain(s)
→ hand off to `MOS-Strategist`

---

# Final Principle

There is no single generic "research truth."

Carol Marketing OS distinguishes:

**our audience**
→ Audience Intelligence

**the external market**
→ Market Research

**medical reality**
→ Scientific Research

Research should identify what is known, what is uncertain and what evidence 
supports each conclusion.

Then the appropriate decision-maker determines what to do with it.
