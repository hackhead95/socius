---
id: "src/features/ai/AiSettingsDialog.tsx#AiSettingsDialog"
type: component
file: src/features/ai/AiSettingsDialog.tsx
line: 67
area: features/ai
---

# <AiSettingsDialog>

*React component* · defined in [[AiSettingsDialog.tsx]] (line 67) · area [[features - ai|features/ai]]

- **Exported:** yes

## Calls
- [[features.ts#aiFeature|aiFeature()]]
- [[platform/ai.ts#effectiveProvider|effectiveProvider()]]
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[ai-local.ts#isLocalServiceUrl|isLocalServiceUrl()]]
- [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]]
- [[ai-diagnose.ts#runConnectionCheck|runConnectionCheck()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- [[useAiStatus|useAiStatus()]]

## Renders
- [[AiActivityLine|<AiActivityLine>]]
- [[AiPrivacyNotice|<AiPrivacyNotice>]]
- [[ConnectionChecklist|<ConnectionChecklist>]]
- [[GeminiSection|<GeminiSection>]]
- [[Modal|<Modal>]]
- [[OpenAiSection|<OpenAiSection>]]
- [[ReadyPanel|<ReadyPanel>]]
- [[WebLlmSetup|<WebLlmSetup>]]

## Uses
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[platform/ai.ts#subscribeAiSettings|subscribeAiSettings()]]

## Reads
- [[aiSettings/openai|aiSettings.openai]] · getter

## Writes
- [[aiSettings/openai|aiSettings.openai]] · setter
- [[provider|aiSettings.provider]] · setter

## Checks error code
- [[cancelled]]

## Rendered by
- [[AiSettingsHost|<AiSettingsHost>]]
