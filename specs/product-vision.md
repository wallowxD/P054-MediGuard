# Product Vision — Medication Safety Copilot

> Source: the Project Brief and PRD submitted for GATE 1
> ([gate/gate_1/](../gate/gate_1/README.md)). This file is the plain-text version so
> people and AI tools can read it directly — the `.docx` files remain the official
> submission and **must not be edited**.

---

## In one sentence

Patients have to look up each medicine and cross-check every pair themselves → an
**AI agent that looks up drug–drug and drug–food interactions with cited sources**, set
inside the *"Health System X"* web app.

## Problem statement

The hospital's medicine catalogue **has no interaction data attached**. Users have to:

1. Look up each medicine one at a time
2. Read the PDF patient information leaflet themselves
3. Cross-check every pair of medicines manually

This is slow, easy to get wrong by omission, and someone without clinical training
cannot judge how serious a finding is. Existing tools are either in English, or do not
match the brand names sold in Vietnam, or state conclusions without showing a source.

Interaction data **must be extracted from the PDF leaflets** and then **reviewed by a
human** before it can be used.

## Target audience

| Group | Need |
|---|---|
| **Patients and carers** (primary) | Fast lookup from a medicine list, a photo of a prescription, or a PDF |
| **Doctors and pharmacists** (secondary) | Review the quoted passage, check the source, confirm the result |

## Positioning

An agent that lives **inside the hospital's own system**, not a standalone lookup tool.
Two things define it: **"every claim has a source"** and **"a human stays in the loop"**.

The agent acts as a **reference safety warning** — it shows the verbatim quote, the
source, and the review status. It **does not draw clinical conclusions and does not
replace a doctor's judgement.**

---

## ★ Three rules that never bend

These are product constraints, not engineering guidelines. Breaking one of them means
the product is wrong, not that the code is wrong.

### 1. Never invent a warning

Every warning **must** be backed by a verbatim quote from the original PDF leaflet plus
a link to the source. No citation means no warning — return *"no data available"*.
Never let the model infer an interaction on its own.

→ Enforced by [`adrs/0006-citation-required-for-every-warning.md`](../adrs/0006-citation-required-for-every-warning.md)

### 2. Never draw clinical conclusions

No diagnosis, no suggestion to switch medicines, no dosing. Everything the system
produces is reference information.

### 3. Human-in-the-loop must not block the flow

Every warning — including severe and major ones — is shown to the patient **immediately**,
labelled *"awaiting professional confirmation"*. Pharmacists review in parallel. **Do not**
implement a full-gate model that withholds warnings until they are approved.

→ Enforced by [`adrs/0005-human-in-the-loop-non-blocking.md`](../adrs/0005-human-in-the-loop-non-blocking.md)

---

## Success metrics

From the PRD:

- Drug-name normalisation accuracy
- Share of warnings approved by a pharmacist
- Extraction coverage during the pilot
- Response time
- **100% of warnings shown immediately, with no approval wait**

Measured results live in [`eval/results/report.md`](../eval/results/report.md).

## Assumptions

- Primary data source: the Giao Thong Van Tai Hospital medicine catalogue
  (`dataset/drug_list_bv_gtvt.csv`, ~1073 rows, Vietnamese)
- Interaction data and severity are **extracted from PDF leaflets by a vision model** and
  then **must be reviewed by a human**
- The original text is stored verbatim

## Out of scope — do not add these on your own initiative

Diagnosis or prescribing · the AI changing medicines by itself · drug–condition
interactions · long-term memory · a full-gate model that withholds warnings · cloning the
UI or real data of the reference hospital.

---

## External references

- Drug interactions: https://tuongtacthuoc.vn/
- DrugBank: https://go.drugbank.com/
