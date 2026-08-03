# Domain Model

> The shared vocabulary between backend, frontend and AI tools. Changing a concept here
> means changing `backend/src/medsafe/domain/`, `backend/src/medsafe/schemas/` and
> `frontend/src/types/` as well.

---

## Entities

### Drug

| Field | Meaning | Source |
|---|---|---|
| `brandName` | Brand name, e.g. "Panadol Extra" | column `Biet duoc` |
| `ingredient` | Active ingredient + strength | column `Hoat chat - Ham luong` |
| `leafletUrl` | Link to the original PDF leaflet | column `Link HDSD 1` |

⚠️ The CSV column names are Vietnamese **without diacritics**, while the JSON content is
Vietnamese **with diacritics**. Every comparison must go through
`domain/normalization.py` — **never compare raw strings**.

### Interaction

| Field | Meaning |
|---|---|
| `kind` | `drug-drug` \| `drug-food` — decides the lookup mechanism, see §Boundary |
| `subject` / `object` | Side 1 is always a drug; side 2 is a drug or a food |
| `severity` | `contraindicated` \| `major` \| `moderate` \| `minor` \| `unknown` |
| `reviewStatus` | `pending` \| `approved` \| `rejected` |
| `mechanism` / `consequence` / `management` | From `drugtodrug.json` |
| `citations` | **Must not be empty.** See Citation |

`severity` is assigned **deterministically** by `domain/severity.py`. The frontend only
picks a colour; it never derives severity itself.

### Citation ★

The most important entity in the product. Without it there is no warning.

| Field | Constraint |
|---|---|
| `quote` | **Verbatim** from the leaflet. No summarising, no paraphrasing, no CSS truncation |
| `source` | Document or brand name |
| `sourceUrl` | Link to the original PDF |
| `page` | Page number, so a reviewer can check it |

### Review

A pharmacist's decision on one Interaction. `pending` **does not hide the warning** — see
rule 3.

### Prescription

A set of Drugs saved by the user. From N drugs, `domain/pairing.py` produces **C(N,2)**
pairs to look up.

---

## ★ The RAG boundary — the easiest thing to get wrong

The role of similarity search **differs by interaction type**. Do not apply one rule to
both.

| Question | Mechanism | Why |
|---|---|---|
| Drug–drug: is there an interaction, and how severe? | `db/repositories/` + `domain/` — **table lookup** | `drugtodrug.json` is a relation (A,B)→record. An exact-key lookup is correct by definition |
| Drug–food: is there an interaction? | **`retrieval/`** — semantic search | No lookup table exists; the information sits in free text inside the leaflet |
| The verbatim supporting quote | `retrieval/` | |
| Drug information Q&A | `retrieval/` + `prompts/DRUG_INFO_QA` | |
| User mistypes a drug name | `domain/normalization.py` (fuzzy match) | For proper nouns in Vietnamese, rapidfuzz + diacritic stripping beats embeddings |

**Only for drug–drug** is similarity search forbidden as the basis for a conclusion.

The concrete reason: a query for *"Warfarin + Tamoxifen"* can return the record for
*"Acenocoumarol + Tamoxifen"* — same coumarin class, very close in embedding space. The
result is a warning **that has a source and a real quote but names the wrong pair of
drugs**. That failure passes every "does it have a source?" check.

Drug–food is the opposite: retrieval **is** the detection mechanism, because there is no
table to look anything up in. The constraint there is that the output must be a verbatim
quote, not a sentence the model composed.

Below `retrieval.score_threshold` → return empty → the layer above reports **"no data
available"**. Never lower the threshold just to return something.

→ Full decision: [`adrs/0004-drug-drug-lookup-not-similarity.md`](../adrs/0004-drug-drug-lookup-not-similarity.md)

---

## Data

| File | Contents |
|---|---|
| `dataset/drug_list_bv_gtvt.csv` | Hospital medicine catalogue, ~1073 rows, column names **without diacritics** |
| `dataset/drugtodrug.json` | Interaction pairs: `Hoạt chất 1`, `Hoạt chất 2`, `Cơ chế`, `Hậu quả`, `Xử trí` — **with diacritics** |

⚠️ `.gitignore` ignores `data/`. **Do not rename `dataset/` to `data/`** — the data would
silently drop out of git.
