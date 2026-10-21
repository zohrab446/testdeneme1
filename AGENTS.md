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
- Pages use `PageScaffold` for loading/empty/error states; `?durum=hata|bos` forces mock error/empty — consistent state handling.
- Layout is chosen in `__root.tsx` by pathname: `/karsilama/*` uses PublicShell, everything else AppShell — public route stays chrome-free.
- Number/date/currency formatting goes through `src/lib/format.ts` (tr-TR) — consistent Turkish locale.
