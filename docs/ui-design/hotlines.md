# Emergency hotlines

Source: "Emergency Hotlines & Social Media Accounts" infographic provided by the team on Oct 19, 2026 (Philippine national hotlines). Official numbers (confirmed by the team, Oct 19, 2026).

Used in: mobile Home shortcut ("Emergency? Call 911 first"), mobile Settings → Emergency hotlines, mobile sign-in safety line, web landing page emergency card, web report form tips (Figma). See `docs/DECISIONS.md` #31.

| Office | Numbers | Notes |
|---|---|---|
| Philippine National Emergency Hotline | 911 | Shown first everywhere |
| PNP (Philippine National Police) | 117 / (02) 8722-0650 / (02) 8723-0401 to 0420 | Facebook: Philippine National Police · X: @pnppio |
| BFP (Bureau of Fire Protection) | (02) 8426-0219 / (02) 8426-0246 | Facebook: Bureau of Fire Protection |

## Notes for implementation

- Static data in each client; no database change.
- Every number is a `tel:` link: `tel:911`, `tel:117`, `tel:+63287220650`, `tel:+63287230401`, `tel:+63284260219`, `tel:+63284260246`.
- Each number needs an accessible name, for example "Call PNP, 117".
- PNP and BFP cards show the official seals (alt text "Philippine National Police seal", "Bureau of Fire Protection seal").
