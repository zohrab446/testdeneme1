<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Components never import `src/mocks`; they call async functions in `src/services` — so switching to a real backend only touches services.
- Shared domain types live in `src/types` — single source of truth for services and UI.
- Pages use `PageScaffold` for loading/empty/error states; Dashboard uses independently queried, error-bounded widgets so one failed section cannot hide the others. `?durum=hata|bos` forces mock states; Dashboard supports `widget=<widgetId>` for an isolated error.
- Layout is chosen in `__root.tsx` by pathname: `/karsilama/*` uses PublicShell, everything else AppShell — public route stays chrome-free.
- Number/date/currency formatting goes through `src/lib/format.ts` (tr-TR) — consistent Turkish locale.
- Employee welcome form step `hrLabel`s must match the HR correction section labels, and document slot ids match `OnboardingDocument.id` — correction mode unlocks only flagged steps/docs by these keys.
- Dashboard period aggregation and privacy filtering live in its service/helper layer; all widgets share one snapshot timestamp so period comparisons stay coherent.
- Dashboard reuses `NewEmployeeSheet` unchanged and converts actions through a mock service; task creation is idempotent per action and remains in memory like other mock mutations.
- The integrations catalog uses its own typed mock service, leaving existing pulse and customer-source flows unchanged; consent and channel allowlists are validated by services before mutations.
