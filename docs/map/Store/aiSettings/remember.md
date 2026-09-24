---
id: "store-key:aiSettings.remember"
type: store-key
file: src/platform/ai.ts
line: 36
area: platform
---

# aiSettings.remember

*Store state key* · defined in [[platform/ai.ts]] (line 36) · area [[platform]]

> Keep the key in localStorage ("Remember this key on this computer"). Off: this tab only.

- **Store:** aiSettings

## Read by
- [[RememberKey|<RememberKey>]] · alias
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]] · alias, module state
- [[platform/ai.ts#setRememberKey|setRememberKey()]] · alias, module state
- [[ai-keys.test.ts]] · alias, getter

## Written by
- [[platform/ai.ts#setRememberKey|setRememberKey()]] · setter
- [[ai-keys.test.ts]] · setter
- [[ai.test.ts]] · setter

## Store
- [[aiSettings|AI settings (localStorage socius.ai)]]
