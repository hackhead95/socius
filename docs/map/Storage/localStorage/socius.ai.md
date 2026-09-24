---
id: "storage:localStorage:socius.ai"
type: storage-key
area: storage
---

# socius.ai

*Browser storage key* · area `storage`

- **Backend:** localStorage

## Tested by
- [[ai-check.spec.ts]] · storage key
- [[ai-features.spec.ts]] · storage key
- [[ai-local.spec.ts]] · storage key
- [[ai.spec.ts]] · storage key
- [[assistant.spec.ts]] · storage key
- [[errorlog.spec.ts]] · storage key

## Read by
- [[platform/ai.ts#loadAiSettings|loadAiSettings()]]

## Written by
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]

## Change listeners
- [[platform/ai.ts#startAiStatus|startAiStatus()]]
