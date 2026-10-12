# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: All paths in Firestore default to `allow read, write: if false;`.
2. **PII Isolation & Strict Ownership**: A user profile document at `/users/{userId}` contains PII (`email`, `phone`, `name`) and can ONLY be read (`get`) or written (`create`, `update`, `delete`) by the authenticated owner whose `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
3. **No Unbounded List Queries**: Collection-wide `list` operations on `/users` are strictly denied (`allow list: if false;`) to prevent PII scraping.
4. **No Self-Assigned Admin Privileges**: The `accountType` field is strictly restricted to non-privileged values `['candidate', 'employer']` and cannot be mutated to `'admin'` or modified after creation.
5. **Strict Key & Schema Blueprint**: `isValidUserProfile(data)` enforces `hasAll` and `hasOnly` on allowed keys, string `.size()` bounds matching `firebase-blueprint.json`, bounded `skills` array size (`<= 10`), and server timestamp integrity (`request.time`).
6. **Immutable Identity Fields**: `uid`, `email`, `accountType`, and `createdAt` are immutable during updates (`incoming().field == existing().field`).

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (Identity Spoofing on Create)**: Authenticated user `uid_attacker` attempts to create `/users/uid_victim` or sets `uid: "uid_victim"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Write)**: User with `email_verified: false` attempts to create `/users/uid_1`. -> `PERMISSION_DENIED`
3. **Payload 3 (Privilege Escalation / Role Spoofing)**: User attempts to create `/users/uid_1` with `accountType: "admin"` or `isAdmin: true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow Field Injection on Create)**: User sends valid fields plus `"ghostField": "injected"`. -> `PERMISSION_DENIED`
5. **Payload 5 (Denial-of-Wallet Oversized String)**: User sends `name` with 5,000 characters (`> 120` maxLength). -> `PERMISSION_DENIED`
6. **Payload 6 (ID Poisoning)**: Path variable `{userId}` contains invalid characters or exceeds 128 chars. -> `PERMISSION_DENIED`
7. **Payload 7 (Unbounded Skills Array)**: User sends `skills` array with 25 items (`> 10` limit) or non-string first element. -> `PERMISSION_DENIED`
8. **Payload 8 (Forged Client Timestamp on Create)**: User sets `createdAt` to a past/future timestamp instead of `request.time`. -> `PERMISSION_DENIED`
9. **Payload 9 (Update-Gap / Value Poisoning)**: Owner updates `name` to an integer `12345` or oversized string. -> `PERMISSION_DENIED`
10. **Payload 10 (Immutable Field Mutation on Update)**: Owner attempts to change `uid`, `accountType`, or `createdAt` during update. -> `PERMISSION_DENIED`
11. **Payload 11 (Cross-User PII Read)**: Authenticated user `uid_attacker` attempts `get` on `/users/uid_victim`. -> `PERMISSION_DENIED`
12. **Payload 12 (Collection Scraping via List)**: Authenticated user attempts `list` query on `/users`. -> `PERMISSION_DENIED`
