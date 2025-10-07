# EatWise
**Evidence-based ingredient pairings and condition-friendly foods — simple, trustworthy, and actionable.**

![Image](https://github.com/user-attachments/assets/add5e85a-5f56-4bc7-80cb-aad57a3a2ef6)

---

## Inspiration
Too many people get lost in health and nutrition advice. **About 54% of U.S. adults have limited health literacy**, and low health literacy is linked to **~2× higher hospitalization rates**. Each year, an estimated **420,000 people die from unhealthy or unsafe diets**. On top of that, **~70% of adults 65+ struggle to access digital health information**.  
Why is it so hard to trust what to eat? The web is noisy and often contradictory, and guidance rarely accounts for people managing multiple conditions. Many existing apps and AIs are inaccurate or hard for older adults to use, while credible sites read like textbooks.  
**EatWise** is our answer: a **trust-first, simple mobile app** that shows—at a glance—**what to pair and what to avoid** for each ingredient or condition, backed by authoritative sources, and turns that guidance into **easy, practical recipes**.

---

## What it does
- **Ingredient → Pair or Avoid**  
  Type any ingredient and instantly see foods that **pair well** (nutritional synergy) and foods to **avoid together** (may reduce absorption or worsen outcomes). Every result includes a **plain-English one-liner** and **one authoritative deep link**.

- **Condition → Favor or Avoid**  
  Search a **chronic condition** (e.g., diabetes, hypertension) or a **temporary illness** (e.g., cold, diarrhea). EatWise lists **ingredients to favor** and **to avoid** for that condition, with clear explanations and citations.

- **Extras**  
  Separate views for **chronic vs. temporary** conditions; **multi-condition** search (see what to eat/avoid across multiple issues); **evidence-first** data from government/medical/university sources; **recipe suggestions** that respect the guidance.

---

## How we built it
- **Data model (Prisma/Postgres):** `Ingredient`, `IngredientBenefit`, `IngredientInteraction`, `Disease`, `DiseaseIngredient`, and `Source` with composite uniques; each card maps to **one deep citation**.  
- **Ingestion:** whitelist crawl/APIs (e.g., PubMed E-utilities, FDA FoodData Central) → **deep pages only** → boilerplate removal, canonical URLs, timestamps.  
- **Extraction (food-level only):** rules + classifier to keep **explicit food–food / food–condition** statements (reject nutrient-only prose).  
- **Verification:** re-ranking, trust classifier (domain/metadata), claim–evidence check (NLI), and human review for edge cases.  
- **App UX:** fast search; **All / Benefit / Avoid** buckets; “**Why?**” reveals snippet + link; accessibility defaults (Dynamic Type, contrast, big tap targets, one-hand actions, voice search).

---

## Challenges we ran into — *Balancing rigor with effortless UX*
Our hardest problem was turning **clinical-grade evidence** into an interface that even older adults can use **in seconds**. Early builds read like mini research papers—too many cards, too much text, too many taps. We rebuilt the flow around a single question, *“What should I eat next?”*  
The fix combined **plain language** (one-line reasons), **progressive disclosure** (a small “Why?” reveals the citation and snippet), and **accessibility by default** (larger Dynamic Type, high contrast, big tap targets, bottom actions for one-hand use, voice search, and typo-tolerant inputs). The result is a calm screen with **three obvious buckets—All / Benefit / Avoid**—so choices are immediate without sacrificing trust or citations.

---

## Accomplishments that we’re proud of — *Evidence-first cards*
We shipped a working demo where every recommendation is a **one-line reason paired with exactly one deep, authoritative link**. That constraint forces clarity and keeps claims auditable. In practice: search an ingredient or condition → see **Benefit/Avoid** cards → tap **“Why?”** to view the source and evidence snippet → optionally jump to recipe suggestions. Under the hood, a Prisma/Postgres model ensures each card maps to a single `Source` record, so **nothing appears without a verifiable citation**.

---

## What we learned
- **Editing is the hardest engineering:** the biggest gains came from **removing** anything that didn’t help decide the next bite.  
- **Clarity beats volume:** short, decisive answers **with a citation** trump long explanations.  
- **Food-level guidance matters:** explicit **food–food / food–condition** statements make advice instantly actionable.  
- **Progressive disclosure & accessibility pay off:** default screens should decide; details appear **only when asked**. Bigger type, contrast, one-hand patterns, and voice input help **everyone**, not just seniors.

---

## What’s next for EatWise
1) **More trusted data, wider coverage**  
   Expand the whitelist to **WHO, NICE, Cochrane, EFSA**, specialty societies (e.g., **ADA, AHA**), and more university hospitals. Add API connectors (PubMed E-utilities, FDA FDC), enforce **deep-link only**, and use **k-of-n agreement** for sensitive claims. Build freshness monitoring (ETag/Last-Modified), link-health checks, and versioned records.

2) **Zero-friction personalization (no re-typing conditions)**  
   A private, opt-in **Health Profile** remembers chronic conditions and dietary preferences so results are **auto-tailored**. Support **multi-condition logic** (e.g., diabetes + GERD) with clear Favor/Avoid resolutions. Keep it safe with **on-device encryption**, explicit consent, and easy pause/clear controls.

3) **From hackathon to real users**  
   Launch an **MVP** to TestFlight/Play Store Early Access with a small pilot (clinics, senior centers). Add a **clinician advisory loop** for high-impact recommendations. Ship production essentials: accessibility polish, privacy-preserving analytics, support workflow, and a clear medical disclaimer. Explore **partner integrations** (recipe platforms, grocery lists) to turn guidance into action.

**North-star:** a daily, trustworthy companion that tells anyone—at a glance—**what to pair, what to avoid, and why**, backed by **a single authoritative link**.
