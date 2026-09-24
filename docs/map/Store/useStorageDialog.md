---
id: "src/features/ai/StorageManager.tsx#useStorageDialog"
type: store
file: src/features/ai/StorageManager.tsx
line: 179
area: features/ai
---

# useStorageDialog

*Store* · defined in [[StorageManager.tsx]] (line 179) · area [[features - ai|features/ai]]

> ---------- the "Browser storage" dialog ----------

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[useStorageDialog/open\|open]] | 2 ([[useStorageDialog/set()\|useStorageDialog.set()]], [[StorageManager.tsx#openStorageManager\|openStorageManager()]]) | 1 |

## Actions
| action | writes | callers |
|---|---|---|
| [[useStorageDialog/set()\|set()]] | [[useStorageDialog/open\|open]] | 1 |

## State keys
- [[useStorageDialog/open|useStorageDialog.open]]

## Actions
- [[useStorageDialog/set()|useStorageDialog.set()]]

## Called by
- [[StorageDialogHost|<StorageDialogHost>]]

## Used by
- [[StorageManager.tsx#openStorageManager|openStorageManager()]]
