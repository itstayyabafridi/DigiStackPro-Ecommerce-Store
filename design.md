# My Store · Home · Shopify — UI design guidance

## Context and goals

**Design intent:** Create a structured, content-first storefront that uses a compact, consistent token system to help shoppers browse, understand prices, and complete purchases with accessible interactions.

| Context | Definition |
| --- | --- |
| Reference brand | My Store · Home · Shopify |
| Supplied reference | https://admin.shopify.com/store/1aphh0-gy |
| Audience | Online shoppers and consumers |
| Product surface | E-commerce storefront |
| Visual direction | Structured, tokenized, content-first; restrained monochrome surfaces and subtle elevation |
| Accessibility target | WCAG 2.2 AA, with stronger project-specific focus and target-size requirements below |
| Existing implementation | Next.js, Tailwind v4, and shadcn/ui; this document specifies guidance, not a runtime theme change |

The reference URL identifies an authenticated Shopify admin surface. This document uses the supplied measurements and design brief; it does not claim to have inspected that private page. The patterns are adapted to shopping tasks. Implementations must retain the actual store name and must not imply Shopify affiliation or rename DigistackPro without a separate brand decision.

Teams should prefer system consistency over local visual exceptions. Components must use semantic tokens. New values must enter the shared token system before use.

### Reference component density

| Component | Supplied count | Delivery implication |
| --- | ---: | --- |
| Buttons | 29 | Shared action variants and consistent priority must replace bespoke treatments. |
| Links | 20 | Navigation and actions must have distinct semantics and consistent focus behavior. |
| Lists | 12 | Related content must use list semantics and reusable item spacing. |
| Inputs | 1 | The base field pattern must scale to validation, search, and checkout contexts. |
| Cards | 1 | A card must group related content; repeated decorative card shells should be avoided. |
| Navigation | 1 | One primary navigation landmark must provide a stable orientation point. |

These counts are a reference inventory, not a requirement to put 29 actions on every storefront page. Counts must be checked against the intended page inventory, and differences must be documented by task or content need.

## Design tokens and foundations

### Primitive typography

| Token | Value |
| --- | --- |
| `font.family.primary` | `Inter` |
| `font.family.stack` | `Inter, Noto Sans Arabic, Noto Sans Hebrew, -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif` |
| `font.size.base` | `13px` |
| `font.weight.base` | `450` |
| `font.lineHeight.base` | `20px` |
| `font.size.xs` | `12px` |
| `font.size.sm` | `13px` |
| `font.size.md` | `13.33px` |
| `font.size.lg` | `14px` |
| `font.size.xl` | `16px` |
| `font.size.2xl` | `26px` |

Inter should be self-hosted as a variable font with `font-display: swap`. Implementations must support weight 450 without relying on synthetic bolding. Arabic and Hebrew content must use the supplied fallback families when their fonts are available; font assets must cover the languages actually offered.

The following semantic aliases and supporting tokens complete the implementation contract; they are explicit additions to the supplied primitives.

| Semantic token | Size / weight / line height | Use |
| --- | --- | --- |
| `type.caption` | `font.size.xs` / `font.weight.base` / `font.lineHeight.base` | Supplementary metadata |
| `type.body` | `font.size.base` / `font.weight.base` / `font.lineHeight.base` | Body copy and list rows |
| `type.label` | `font.size.sm` / `font.weight.emphasis` / `font.lineHeight.base` | Buttons and field labels |
| `type.compact` | `font.size.md` / `font.weight.base` / `font.lineHeight.base` | Existing measured compact patterns only |
| `type.navigation` | `font.size.lg` / `font.weight.emphasis` / `font.lineHeight.base` | Primary navigation |
| `type.section` | `font.size.xl` / `font.weight.emphasis` / `lineHeight.section` | Card and section headings |
| `type.page` | `font.size.2xl` / `font.weight.emphasis` / `lineHeight.page` | Page title |
| `type.fieldValue` | `font.size.xl` / `font.weight.base` / `lineHeight.section` | Editable values, including mobile fields |
| `font.weight.emphasis` | `600` | Shared emphasis weight |
| `lineHeight.section` | `24px` | Section and input line height |
| `lineHeight.page` | `32px` | Page-heading line height |

The 16px field-value alias must be used across breakpoints to keep entry readable and avoid mobile browser focus zoom. Prices must use tabular numerals. Body text must wrap and must not use fixed-height clipping. Headings must follow document structure rather than visual size alone.

### Primitive colors

| Token | Value |
| --- | --- |
| `color.text.primary` | `#303030` |
| `color.text.secondary` | `#616161` |
| `color.text.tertiary` | `#8a8a8a` |
| `color.text.inverse` | `#dcdcdc` |
| `color.surface.base` | `#000000` |
| `color.surface.muted` | `#ffffff` |
| `color.surface.raised` | `#f1f1f1` |
| `color.surface.strong` | `#ebebeb` |

The supplied `surface.base` is black despite its name. It must be reserved for inverse sections and primary actions. The main shopping canvas must use `surface.raised`, with `surface.muted` for content surfaces. Dark primary text must never be placed on `surface.base`.

### Semantic color mappings

| Semantic token | Alias |
| --- | --- |
| `surface.canvas` | `color.surface.raised` |
| `surface.content` | `color.surface.muted` |
| `surface.hover` | `color.surface.raised` |
| `surface.pressed` | `color.surface.strong` |
| `surface.inverse` | `color.surface.base` |
| `text.default` | `color.text.primary` |
| `text.supporting` | `color.text.secondary` |
| `text.onInverse` | `color.text.inverse` |
| `text.decorative` | `color.text.tertiary` |
| `action.primary.background.default` | `color.surface.base` |
| `action.primary.background.hover` | `color.text.primary` |
| `action.primary.background.active` | `color.surface.base` |
| `action.primary.foreground` | `color.text.inverse` |
| `action.secondary.background.default` | `surface.content` |
| `action.secondary.background.hover` | `surface.hover` |
| `action.secondary.background.active` | `surface.pressed` |
| `action.secondary.foreground` | `text.default` |
| `action.disabled.background` | `surface.pressed` |
| `action.disabled.foreground` | `text.supporting` |
| `border.control` | `color.text.secondary` |
| `border.decorative` | `color.surface.strong` |
| `focus.onLight` | `color.text.primary` |
| `focus.onDark` | `color.text.inverse` |
| `feedback.error.text` | `text.default` |
| `feedback.error.border` | `text.default` |
| `feedback.error.surface` | `surface.content` |
| `feedback.success.text` | `text.default` |

This palette uses monochrome feedback. Errors must include explicit text and an error icon; success must include confirmation text. Color alone must not communicate status. On inverse surfaces, feedback text and indicators must use `text.onInverse` instead.

### Contrast constraints

Ratios below were calculated from the supplied opaque sRGB values and rounded to two decimal places. Actual rendered combinations, including opacity, backgrounds, overlays, and images, must be measured again.

| Pair | Ratio | Rule |
| --- | ---: | --- |
| `text.default` / `surface.content` | 13.20:1 | Normal text is permitted. |
| `text.supporting` / `surface.content` | 6.19:1 | Normal text is permitted. |
| `text.supporting` / `surface.pressed` | 5.20:1 | Normal text is permitted. |
| `text.onInverse` / `surface.inverse` | 15.31:1 | Normal text is permitted. |
| `text.decorative` / `surface.content` | 3.45:1 | Normal text must not use this pair. |
| `text.decorative` / `surface.pressed` | 2.90:1 | Meaningful text and required indicators must not use this pair. |
| `text.default` / `surface.inverse` | 1.59:1 | Text must not use this pair. |

At the supplied compact text sizes, readable metadata, placeholders, helper text, prices, and captions must use `text.supporting` or `text.default`. `text.decorative` must not be used for necessary content on light surfaces. Decorative dividers may use `border.decorative`; identifiable input boundaries must use `border.control`.

### Spacing and layout

| Primitive token | Value |
| --- | --- |
| `space.1` | `1px` |
| `space.2` | `2px` |
| `space.3` | `3px` |
| `space.4` | `4px` |
| `space.5` | `6px` |
| `space.6` | `8px` |
| `space.7` | `10px` |
| `space.8` | `12px` |

Larger layout distances must use these shared derived aliases rather than local additions:

| Semantic token | Formula / value |
| --- | --- |
| `gap.inline` | `space.5` |
| `gap.control` | `space.6` |
| `gap.stack` | `space.8` |
| `inset.control.block` | `space.6` |
| `inset.control.inline` | `space.8` |
| `inset.card` | `space.6 × 2` = `16px` |
| `gap.section` | `space.8 × 2` = `24px` |
| `inset.page.mobile` | `space.6 × 2` = `16px` |
| `inset.page.desktop` | `space.8 × 2` = `24px` |
| `size.target.minimum` | `space.8 × 2` = `24px` |
| `size.control.default` | `space.8 × 3 + space.6` = `44px` |
| `size.icon` | `space.6 × 2` = `16px` |
| `layout.content.max` | `75rem` |
| `layout.reading.max` | `65ch` |
| `breakpoint.medium` | `48rem` |
| `breakpoint.wide` | `64rem` |

Layout defaults are implementation decisions, not measured reference values. Layouts must be fluid below `layout.content.max`. Pages must use mobile insets below `breakpoint.medium` and desktop insets above it. Shopping grids should use one, two, and three columns across the three defined ranges when content density permits. Components must wrap before content clips. Logical properties such as `padding-inline` and `margin-block` must replace direction-specific spacing.

### Radius, elevation, and motion

| Token | Value |
| --- | --- |
| `radius.xs` | `4px` |
| `radius.sm` | `8px` |
| `radius.md` | `12px` |
| `radius.lg` | `16px` |
| `radius.xl` | `20px` |
| `radius.2xl` | `24px` |
| `radius.step7` | `9999px` |
| `shadow.1` | `rgba(0, 0, 0, 0.07) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 2px 1px -1px, rgba(255, 255, 255, 0) 0px 0px 4px 0px, rgba(0, 0, 0, 0.13) 0px 9px 10px -8px` |
| `shadow.2` | `rgba(0, 0, 0, 0.13) 0px 9px 10px -8px, rgba(255, 255, 255, 0.5) 0px -2px 4px 0px, rgba(0, 0, 0, 0.05) 0px 2px 1px -1px, rgba(0, 0, 0, 0.07) 0px 0px 0px 1px` |
| `shadow.3` | `rgba(0, 0, 0, 0.08) 0px 8px 10px -5px, rgba(0, 0, 0, 0.03) 0px 5px 5px -2.5px, rgba(0, 0, 0, 0.02) 0px 3px 3px -1.5px, rgba(0, 0, 0, 0.02) 0px 2px 2px -1px, rgba(0, 0, 0, 0.03) 0px 1px 1px -0.5px, rgba(0, 0, 0, 0.04) 0px 0.5px 0.5px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px` |
| `motion.duration.instant` | `100ms` |
| `motion.duration.fast` | `150ms` |
| `motion.duration.normal` | `200ms` |
| `motion.duration.slow` | `300ms` |
| `motion.duration.slower` | `350ms` |
| `motion.duration.step6` | `500ms` |
| `motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` — shared implementation addition |
| `motion.duration.reduced` | `0ms` — accessibility override |

Controls must use `radius.sm`, cards must use `radius.md`, and popovers must use `radius.md`. Pills must use `radius.step7`. Containers should use `shadow.1`; floating surfaces should use `shadow.3`. Raised controls should use `shadow.2` only when elevation communicates their role.

Hover and focus transitions must use `motion.duration.fast`; panel changes must use `motion.duration.normal`. Motion must not delay input or hide essential state. With `prefers-reduced-motion: reduce`, translation, scaling, shimmer, and rotation must stop, and transitions must use `motion.duration.reduced`. Loading text must remain when a spinner stops.

### Implementation mapping

CSS variables must use kebab-case equivalents of the documented names. Primitive definitions may contain literal values; component styles must reference semantic aliases. Tailwind theme entries must point to these variables.

| shadcn token | Semantic source |
| --- | --- |
| `--background`, `--foreground` | `surface.canvas`, `text.default` |
| `--card`, `--card-foreground` | `surface.content`, `text.default` |
| `--popover`, `--popover-foreground` | `surface.content`, `text.default` |
| `--primary`, `--primary-foreground` | `action.primary.background.default`, `action.primary.foreground` |
| `--secondary`, `--secondary-foreground` | `surface.hover`, `text.default` |
| `--muted`, `--muted-foreground` | `surface.hover`, `text.supporting` |
| `--accent`, `--accent-foreground` | `surface.pressed`, `text.default` |
| `--border`, `--input` | `border.decorative`, `border.control` |
| `--ring` | `focus.onLight`; inverse scope must override with `focus.onDark` |
| `--radius` | `radius.md` |

Existing shadcn radius calculations must be mapped explicitly to this scale; generated values must not accidentally introduce an unapproved radius. Destructive actions must use a named destructive variant with explicit action text and confirmation when irreversible; they must not rely on a red tint that is absent from this palette.

## Component-level rules

### Shared interaction contract

Every component must implement the state rules below. For non-interactive containers, a state is explicitly delegated to its interactive descendants; containers must not gain fake click, disabled, or focus semantics.

- Actions must use native `button` elements; navigation must use anchors with a destination.
- Buttons must activate with Enter or Space. Links must activate with Enter and retain native modified-click behavior.
- Pointer and touch actions must activate on click/release; pressing down alone must not commit an action. Moving away before release must allow cancellation.
- Visible controls must have hit areas of `size.control.default` where layout permits. The minimum policy is defined in the accessibility section.
- Focus must use a `space.2` outline with a `space.2` offset and the surface-appropriate focus token. Focus must not be clipped by overflow. `:focus-visible` must not change layout.
- Loading actions must prevent duplicate execution, preserve the accessible name and focus, and expose busy status. A focused loading button must remain focusable with `aria-disabled="true"`; its handler must guard activation.
- Disabled controls must use the disabled semantic tokens without reducing whole-component opacity. Persistent unavailable actions must have a visible reason nearby. Native disabled controls must not receive focus; focusable unavailable controls must use `aria-disabled` and block pointer and keyboard activation.

### Buttons — reference count: 29

**Anatomy and variants:** Buttons must contain an action label and may contain a decorative icon or loading indicator. Variants are primary, secondary, ghost, and destructive. Each task group should have one primary action. Buttons must use `type.label`, `inset.control.block`, `inset.control.inline`, `gap.inline`, `radius.sm`, and minimum block size `size.control.default`.

| State | Required behavior |
| --- | --- |
| Default | Primary buttons must use primary action tokens; secondary buttons must use secondary action tokens and `border.control`. Ghost buttons must use `text.default` on their current surface. |
| Hover | Primary and secondary buttons must use their hover aliases. Ghost buttons must use `surface.hover`. Hover must not be the only indication of interactivity. |
| Focus-visible | Buttons must apply the shared focus outline while retaining the current variant. |
| Active | Buttons must use the active action aliases; pressed feedback must not move surrounding content. Toggle buttons must expose `aria-pressed`. |
| Disabled | Buttons must follow the shared disabled contract and must not trigger an action. |
| Loading | Buttons must show a specific progressive label, such as “Placing order…”, retain width where possible, and follow the busy contract. |
| Error | The triggering button must remain identifiable, retain entered data, and present nearby error text using feedback tokens with a descriptive retry action. |

Keyboard, pointer, and touch behavior must follow the shared contract. Labels must wrap when necessary; fixed-width clipping and ellipsized action labels are prohibited. Button groups must wrap using `gap.control` and should stack on narrow screens. Icon-only buttons must have an accessible action name and a non-hover way to reveal any essential explanation.

### Links — reference count: 20

**Anatomy and variants:** Links must contain descriptive destination text, with optional decorative icons. Variants are inline, navigation, and standalone. Inline links must use surrounding typography and visible underlining; navigation links must use `type.navigation`. Standalone links must use `type.label`, `gap.inline`, and control-sized hit areas.

| State | Required behavior |
| --- | --- |
| Default | Links must use `text.default`, or `text.onInverse` in inverse regions. Inline links must remain distinguishable without color perception. |
| Hover | Inline links must increase underline emphasis; standalone links may use `surface.hover`. |
| Focus-visible | Links must use the shared outline, including for multiline text. |
| Active | Pressed links must retain their underline or navigation indicator. Current-page links must use `aria-current="page"`. |
| Disabled | Unavailable destinations must render as non-link text with an explanation; an anchor must not simulate disabling with opacity or CSS alone. |
| Loading | Existing destinations must remain usable during route loading; the destination region must announce loading without moving focus prematurely. |
| Error | Failed navigation must expose a clear error and a valid retry/back destination; labels must not imply successful navigation. |

Links must retain browser open-in-new-tab and copy-link behavior. Touch users must not need hover to find a destination. Long link text must wrap; unbroken addresses must use `overflow-wrap: anywhere`. New-window behavior, if used, must be disclosed in the accessible name or adjacent text.

### Lists — reference count: 12

**Anatomy and variants:** Lists must use `ul` for collections, `ol` for sequences, and `dl` for term/value relationships. Product lists, summaries, and action lists must share `gap.stack`, `type.body`, and `text.default`. Supporting metadata must use `type.caption` and `text.supporting`. Interactive rows must use `inset.control.block` and `inset.control.inline`.

| State | Required behavior |
| --- | --- |
| Default | Lists must expose semantic items in visual reading order. |
| Hover | Static items must remain unchanged; interactive row controls must use `surface.hover`. |
| Focus-visible | Static list containers must not receive tab focus; descendant controls must show the shared outline. |
| Active | An activated row control must show its own active state. Selection, if supported, must use a checkbox or an appropriate selectable-widget pattern. |
| Disabled | Unavailable item actions must explain why; readable item content must remain legible. |
| Loading | Lists must preserve their layout region and announce loading once with `aria-busy`; decorative placeholders must be hidden from assistive technology. |
| Error | A failed collection must show an error and retry action; a failed item must not erase unrelated successful items. |

Ordinary lists must use Tab through their links/buttons, not custom arrow-key navigation. Listbox-style arrow keys must be used only for actual selection widgets. Pointer/touch activation must target the explicit item action. Lists must wrap long names and preserve price/currency relationships. Empty lists must show a task-specific explanation and a valid next action, such as “Your cart is empty” and “Browse products.” Large collections should use pagination; newly loaded results must not unexpectedly replace the focused item.

### Inputs — reference count: 1

**Anatomy and variants:** A field must include a persistent visible label, control, optional helper text, and error region. Text, email, search, and numeric-entry variants must share the same field anatomy. Labels must use `type.label`; values must use `type.fieldValue`; help and errors must use `type.caption`. Fields must use `gap.control`, `inset.control.inline`, `size.control.default`, and `radius.sm`.

| State | Required behavior |
| --- | --- |
| Default | Fields must use `surface.content`, `text.default`, and `border.control`; placeholders must use `text.supporting`. |
| Hover | The field boundary must remain visible; hover must not replace its persistent label. |
| Focus-visible | Fields must show the shared focus outline and must retain it while invalid. |
| Active | Editing must show the native caret and selection. Required input processing must not move the caret unexpectedly. |
| Disabled | A disabled field must use the shared disabled tokens and a visible explanation. Read-only values must use `readonly` instead when copying or inspection remains useful. |
| Loading | Verification/search must announce progress; controls must lock only when editing would invalidate the pending operation. Entered values must remain available. |
| Error | Invalid fields must use `aria-invalid="true"`, an associated message via `aria-describedby`, an error icon or explicit “Error:” prefix, and `feedback.error.border`. |

Native text editing, Tab, Shift+Tab, selection, and paste must work. Enter must submit only the appropriate enclosing form or explicit search action. Escape should dismiss suggestions without erasing input. Pointer/touch users must be able to activate the field by its label. Input type, input mode, and autocomplete must match the data. Long values must remain editable with native horizontal scrolling; multiline content must use a textarea. Required empty values must produce specific validation on submission or after a meaningful interaction, not immediately on page load. Passwords and verification codes must permit paste and autofill.

### Cards — reference count: 1

**Anatomy and variants:** Cards must group one related subject with a heading, optional media, body, and action region. Product and summary cards must use `surface.content`, `text.default`, `inset.card`, `gap.stack`, `radius.md`, and `shadow.1`. Card headings must use `type.section`; body text must use `type.body`.

| State | Required behavior |
| --- | --- |
| Default | The card must present a logical heading and coherent content grouping. |
| Hover | Static cards must remain unchanged. A linked card may emphasize its heading link; it must not imply that unrelated nested actions share the same target. |
| Focus-visible | The card container must not become focusable solely for styling; the actual link/button must expose the focus outline. |
| Active | Card actions must use their own active-state rules; a card must not receive `aria-pressed` unless it is genuinely a toggle control. |
| Disabled | Unavailable products must retain readable details and display an availability message; only unavailable actions must be disabled. |
| Loading | Media space and content structure must be reserved; the card region must expose busy state and keep placeholders out of the accessibility tree. |
| Error | Media failure must retain the product name and useful fallback; data failure must show a scoped message and retry action. |

Keyboard users must reach the actual title link and separate actions in a logical sequence. Pointer/touch activation must follow those same targets. Nested buttons inside anchors are prohibited. Card titles and prices must wrap without being hidden by fixed heights. Images must preserve their declared aspect ratio and have useful alt text when informative. Cards must become full-width in single-column layouts. An empty card shell must be replaced with meaningful empty-state content or omitted.

### Navigation — reference count: 1

**Anatomy and variants:** Primary navigation must contain a named `nav` landmark, a list of destinations, and a current-location indicator. Desktop and mobile variants must use the same destinations and labels. Navigation must use `type.navigation`, `gap.control`, page inset tokens, and `size.control.default` hit areas.

| State | Required behavior |
| --- | --- |
| Default | Navigation must expose its landmark name and preserve link semantics. |
| Hover | A destination must use `surface.hover` on light surfaces; inverse navigation must retain readable inverse text. |
| Focus-visible | Each destination and disclosure trigger must show the shared outline. A keyboard-visible skip link must precede repeated navigation. |
| Active | The current destination must expose `aria-current="page"` and a non-color indicator. An open disclosure must expose `aria-expanded="true"`. |
| Disabled | Unavailable destinations must follow the disabled-link rule; essential navigation must not be globally disabled during an unrelated task. |
| Loading | Route progress must be announced while existing navigation remains operable. |
| Error | Failed destinations must leave navigation usable and provide a descriptive recovery path. |

Ordinary website navigation must use Tab/Shift+Tab and Enter; it must not adopt `menubar` arrow-key behavior. Mobile navigation must use a labeled disclosure button. Escape must close the disclosure and return focus to its trigger. A modal drawer must contain focus while open, make background content inert, and restore focus on close. Pointer/touch users must have explicit open/close controls; swiping or outside-tapping must not be the only close method. Long labels must wrap. Destinations must collapse into the disclosure before overflow occurs, and focus must remain valid when the layout crosses a breakpoint. Sticky navigation must not obscure a focused control.

## Accessibility requirements and testable acceptance criteria

The checks below are release requirements. A failed check must block release of the affected component. These checks support the WCAG 2.2 AA target but do not replace a complete conformance review of the delivered pages.

| Area | Pass condition | Fail condition |
| --- | --- | --- |
| Text contrast | Normal text must measure at least 4.5:1; qualifying large text must measure at least 3:1. | Any necessary text fails its threshold in a supported state. |
| Non-text contrast | Required control boundaries, icons, and state indicators must measure at least 3:1 against adjacent colors. | An essential indicator disappears into its background. |
| Visible focus | Every keyboard-operable control must show the specified outline at 3:1 or better against adjacent surfaces. | Focus is invisible, clipped, or represented only by a subtle shadow. |
| Unobscured focus | The focused control and indicator must remain fully visible when sticky headers, drawers, and alerts are present. This is a stronger project rule than AA's minimum. | An overlay hides any actionable focused region or its indicator. |
| Target size | Standalone controls must have a 44 × 44 CSS-pixel hit area. Compact controls must be at least 24 × 24 CSS pixels. Inline text links may use the WCAG inline-text exception. | A smaller non-inline target is shipped without meeting this project policy. |
| Keyboard | All supported actions must be completable using keyboard alone, with a logical order and no unintended trap. | A pointer-only action, positive `tabindex`, or unreachable control exists. |
| Reflow and zoom | Content must remain usable at 320 CSS pixels wide and at 400% zoom on a 1280px viewport, without page-level horizontal scrolling. Text must remain readable at 200% resizing. | Controls overlap, content clips, or essential actions disappear. |
| Text spacing | Content must survive line height 1.5, paragraph spacing 2em, letter spacing .12em, and word spacing .16em without loss. | Text or controls clip after spacing overrides. |
| Names and structure | Controls must expose accurate accessible names, visible labels must be included in those names, and headings/lists/landmarks must match their purpose. | An unnamed icon button, placeholder-only label, or misleading role exists. |
| Error recovery | Errors must identify the problem and correction, preserve entered data, and associate messages with fields. Submission must focus the first invalid field or an actionable error summary. | Users must guess the failed field or re-enter valid data. |
| Status messages | Async progress and completion must be announced once through an appropriate live region without unnecessary focus movement. | Loading or failure is visual-only, or announcements repeat continuously. |
| Reduced motion | OS reduced-motion preference must stop nonessential motion while preserving loading/status text. | Essential information depends on animation. |
| Pointer cancellation | Actions must complete on release/click, with cancellation possible before release. | Pointer-down triggers an irreversible action. |
| Checkout review | The customer must be able to review and correct items, contact details, and total before the final purchase/payment submission. | A financial commitment occurs without review or correction. |
| Accessible authentication | Password managers, paste, and OTP autofill must work; any authentication challenge must have an accessible alternative. | Authentication depends solely on memory transcription or a cognitive puzzle without an allowed alternative. |
| Language and direction | The page must set its language; RTL layouts must preserve logical order and correctly isolate mixed-direction prices, emails, and identifiers. | Visual reversal changes reading order or makes values ambiguous. |

Contrast requirements follow [WCAG contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum). Focus visibility must be assessed alongside [Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum); the project's fully-visible focus rule is intentionally stronger. Target-size policy uses [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) as its baseline. Remaining checks should be reviewed against the [WCAG 2.2 standard](https://www.w3.org/TR/WCAG22/).

Automated accessibility scans must be supplemented by keyboard, screen-reader, zoom, touch, and visual-contrast checks. Passing an automated scan alone must not be described as WCAG conformance.

## Content and tone standards with examples

Copy must be concise, confident, specific, and action-oriented. Sentence case must be used for labels and headings. Labels must describe the actual action or destination, and the same operation must keep the same label throughout the flow.

| Avoid | Use |
| --- | --- |
| “Submit” | “Place order” or “Send verification code,” depending on the action |
| “Click here” | “View your orders” |
| “Something went wrong” | “Payment proof could not be uploaded. Choose a JPEG, PNG, or WebP image and try again.” |
| “Invalid” | “Enter a valid email address, such as name@example.com.” |
| “Success!” | “Payment proof uploaded. Your order is awaiting review.” |
| “No data” | “Your cart is empty. Browse products to get started.” |
| “Buy now” when payment is not final | “Review order and pay” |

Examples must be adapted to actual product limits and behavior. A payment-awaiting-review state must not claim payment approval or immediate download access. Prices must show currency consistently, and totals must distinguish discounts and any additional charges before commitment. Errors must explain a recoverable next step without exposing implementation details or credentials. Empty states should contain one useful action rather than promotional filler.

## Anti-patterns and prohibited implementations

- Components must not contain raw palette literals or one-off spacing, radius, typography, or motion values.
- Implementations must not use tertiary text for readable small content on light surfaces, put primary dark text on the black surface, or reduce entire controls to low opacity.
- Implementations must not remove outlines without an equivalent visible focus indicator.
- Clickable `div` elements, nested interactive controls, fake disabled anchors, and hover-only essential content must not be shipped.
- Actions must not use vague labels, hide prices through truncation, or replace a completed payment state with an optimistic assumption.
- Decorative containers must not be focusable, and static cards/lists must not receive misleading interactive hover states.
- Loading screens must not erase valid input, trap keyboard users, or allow duplicate purchase submissions.
- Motion must not use `transition: all` where it could animate layout, and shimmer or movement must not continue under reduced-motion preferences.
- Teams must not reproduce reference component counts by adding irrelevant actions or content.

### Migration and edge-case handling

1. Teams must map existing colors and metrics to semantic tokens before changing component variants. The supplied black base must not be applied globally beneath existing dark text.
2. Shared shadcn primitives must be migrated before page-specific overrides. Existing authentication, routing, checkout, and authorization behavior must be preserved during a visual migration.
3. Existing admin-login styling must remain scoped unless its redesign is explicitly requested; this storefront guidance must not silently restyle separate product surfaces.
4. Brand-primary overrides must pass the same text and focus contrast checks. A failing override must be rejected or mapped to a compliant shared foreground/background pair rather than silently accepted.
5. Content fixtures must include long product titles, long email addresses, RTL text, zero results, one item, large collections, missing images, large prices, network errors, and slow responses.
6. Loading and retry flows must retain stable identifiers and prevent duplicate submissions. A retry must not be represented as a new purchase unless the user explicitly starts a new order.
7. Teams should migrate one component family at a time and compare default, interactive, error, and narrow-screen states before broad rollout.

## QA checklist

- [ ] Brand and audience context must match the actual storefront; reference-derived assumptions must be identified.
- [ ] All supplied primitives must be present, and additional aliases must use the documented shared definitions.
- [ ] Component styles must reference semantic tokens; local metric and palette exceptions must be absent.
- [ ] Buttons, links, lists, inputs, cards, and navigation must each satisfy all seven state rules.
- [ ] The reference inventory of 29 buttons, 20 links, 12 lists, 1 input, 1 card, and 1 navigation must be reconciled with actual page needs.
- [ ] Text and required non-text contrast must pass on every supported surface and state.
- [ ] Keyboard-only completion, visible focus, focus restoration, and overlay behavior must pass manual checks.
- [ ] Touch targets and pointer cancellation must pass at compact and mobile sizes.
- [ ] Screen-reader names, roles, relationships, errors, and status announcements must be verified.
- [ ] Reflow, 200% text resizing, 400% zoom, and text-spacing overrides must pass without content loss.
- [ ] Reduced motion, long content, RTL, missing media, and empty states must be verified.
- [ ] Loading, failure, retry, and checkout review must preserve data and prevent unintended duplicate actions.
- [ ] Existing auth and checkout behavior must remain functional after token migration.
- [ ] Automated checks and desktop/mobile visual review must pass; remaining accessibility defects must block release of the affected UI.
