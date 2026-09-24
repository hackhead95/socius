---
id: "src/features/output/OutputViewer.tsx#ExplainButton"
type: component
file: src/features/output/OutputViewer.tsx
line: 553
area: features/output
---

# <ExplainButton>

*React component* · defined in [[OutputViewer.tsx]] (line 553) · area [[features - output|features/output]]

> "Explain with AI": opens the panel under the item (or AI set-up first, then continues).

## Calls
- [[platform/ai.ts#getAiStatus|getAiStatus()]]
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[useExplain]]

## Uses
- [[useExplain]]

## Reads
- [[panels|useExplain.panels]] · selector

## Calls store actions
- [[close()|useExplain.close()]] · alias
- [[open()|useExplain.open()]] · alias
- [[setPending()|useExplain.setPending()]] · alias

## Rendered by
- [[OutputItemView|<OutputItemView>]]
