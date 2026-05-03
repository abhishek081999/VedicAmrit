# Subscription Entitlements Matrix

This file is the current source-of-truth summary for feature access by plan.

| Feature | Free | Gold | Platinum | Enforced In |
| --- | --- | --- | --- | --- |
| Core chart calculation | Yes | Yes | Yes | `src/app/api/chart/calculate/route.ts` |
| Save charts (library limit) | 20 | 200 | Unlimited | `src/lib/subscription/entitlements.ts`, `src/app/api/chart/save/route.ts`, `src/app/api/chart/bulk-import/route.ts` |
| Public chart share links | Yes | Yes | Yes | `src/app/api/chart/public/route.ts`, `src/app/api/chart/toggle-public/route.ts` |
| Export chart (PDF/HTML) | No | Yes | Yes | `src/app/api/chart/export/route.ts` |
| Email chart reports | No | No | Yes | `src/app/api/chart/send-email/route.ts` |
| Bulk ZIP export | No | No | Yes | `src/app/api/chart/bulk-export/route.ts` |
| Client CRM list/create | No | No | Yes | `src/app/api/clients/route.ts` |
| Client CRM item ops (GET/PATCH/POST/DELETE) | No | No | Yes | `src/app/api/clients/[id]/route.ts` |
| White-label brand fields | No | No | Yes | `src/app/api/user/me/route.ts`, `src/app/api/chart/public/route.ts`, export/email branding code |
| Muhurta pages/APIs | No | Yes | Yes | `middleware.ts` (`/muhurta`, `/api/muhurta`) |
| Research pages/APIs | No | No | Yes | `middleware.ts` (`/research`, `/api/research`) |

## Notes

- Paid plans automatically downgrade to Free behavior after `planExpiresAt`.
- Plan names are canonicalized to: `free`, `gold`, `platinum`.
