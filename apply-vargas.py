#!/usr/bin/env python3
# Run from project root: python apply-vargas.py

def read(p):
    with open(p, encoding='utf-8') as f: return f.read()
def write(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

print("\n=== 16 Vargas Unlock ===\n")

# 1. VargaSwitcher.tsx - full rewrite with plan gating
NEW_VARGA = """ + repr(new_content) + """
write('src/components/chakra/VargaSwitcher.tsx', NEW_VARGA)
print("  [ok] VargaSwitcher.tsx — plan gating + Vela unlock")

# 2. page.tsx - add userPlan derivation + pass to VargaSwitcher
c = read('src/app/page.tsx')
changed = False

if 'const userPlan' not in c:
    c = c.replace(
        "  const { data: session, status } = useSession()\n  const { activeTab } = useAppLayout()",
        "  const { data: session, status } = useSession()\n  const userPlan = ((session?.user as any)?.plan ?? 'kala') as 'kala' | 'vela' | 'hora'\n  const { activeTab } = useAppLayout()"
    )
    changed = True

if 'userPlan={userPlan}' not in c and '<VargaSwitcher' in c:
    c = c.replace(
        '                     arudhas={chart.arudhas}',
        '                     arudhas={chart.arudhas}\n                     userPlan={userPlan}'
    )
    changed = True

write('src/app/page.tsx', c)
print(f"  {'[ok]' if changed else '[--]'} page.tsx — userPlan passed to VargaSwitcher")

# 3. compare/page.tsx - dynamic userPlan
c = read('src/app/compare/page.tsx')
changed = False

if 'useSession' not in c:
    c = c.replace(
        "import { VargaSwitcher }",
        "import { useSession } from 'next-auth/react'\nimport { VargaSwitcher }"
    )
    changed = True

if 'const userPlan' not in c:
    c = c.replace(
        "export default function ComparePage() {\n",
        "export default function ComparePage() {\n  const { data: session } = useSession()\n  const userPlan = ((session?.user as any)?.plan ?? 'kala') as 'kala' | 'vela' | 'hora'\n"
    )
    changed = True

if 'userPlan=\"kala\"' in c:
    c = c.replace('userPlan=\"kala\"', 'userPlan={userPlan}')
    changed = True

write('src/app/compare/page.tsx', c)
print(f"  {'[ok]' if changed else '[--]'} compare/page.tsx — dynamic userPlan")

print("\n=== Done! Run: npm run typecheck ===\n")
