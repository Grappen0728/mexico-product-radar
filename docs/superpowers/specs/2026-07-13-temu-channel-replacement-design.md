# Temu Mexico Channel Replacement Design

## Goal

Replace Amazon Mexico with Temu Mexico in the daily three-platform sourcing brief while preserving the existing visual layout, ranking, history, public sharing, Feishu delivery, and 10:07 daily schedule.

## Product Scope

The fixed daily platform order becomes:

1. TikTok Shop Mexico
2. Temu Mexico
3. Mercado Libre Mexico

Every recommendation remains an electric product with an identifiable chip or controller. Each product must use at least two public sources, clearly distinguish observed facts from estimates, and avoid invented sales, GMV, reviews, prices, or procurement costs.

## Temu Selection Logic

Temu recommendations prioritize products that can win through an obvious value proposition instead of an undifferentiated price war. The analysis must cover:

1. Price competitiveness and deal sensitivity.
2. Visual click potential in thumbnails and short demonstrations.
3. Impulse-purchase potential and immediately understandable use cases.
4. Competition, homogeneity, and the available differentiation gap.
5. Logistics, battery, certification, quality, and return risks.
6. Bundle, accessory, upgrade, or localized presentation opportunities.

Temu sales advice should provide a realistic price band, bundle or differentiation proposal, main-image/title direction, discount approach, and a cautious test recommendation. Competition stars remain an opportunity score: five stars means lower effective competition or stronger differentiation opportunity.

## Data and Compatibility

The daily brief channel identifier changes from `amazon-mx` to `temu-mx`, mapped to the existing platform code `TM`. The legacy recommendation platform code `AMZ` remains supported so older standalone records can still render and filter, but new three-platform briefs must reject Amazon and require Temu in the second position.

The 2026-07-13 brief will be updated in place: its Amazon recommendation, sources, media, commercial analysis, and ranking entry will be replaced by a researched Temu Mexico product. The other two recommendations remain unless refreshed evidence changes their relative ranking.

## Presentation and Delivery

Keep the current dark navy and teal visual system and existing page structure. Replace all user-visible Amazon labels in current daily-brief surfaces with Temu Mexico. History filters must expose `TM`; legacy `AMZ` remains available only when old records exist.

The website, static GitHub Pages build, Feishu card, and scheduled prompt must all use the same platform order and Temu selection logic. The republished 2026-07-13 brief will be sent again to Feishu after validation.

## Acceptance Criteria

- All daily-brief validation requires TikTok Shop Mexico, Temu Mexico, then Mercado Libre Mexico.
- The Temu recommendation is marked `TM`, contains electric and chip details, and has at least two dated public sources.
- No current three-platform page, ranking, Feishu card, or scheduled prompt describes Amazon as a required channel.
- Legacy `AMZ` reports remain readable.
- Unit tests, static-site tests, full build, and rendered-page tests pass.
- The public site opens and the 2026-07-13 brief shows Temu Mexico.
- The 10:07 automation is updated and today's corrected brief is resent to Feishu.
