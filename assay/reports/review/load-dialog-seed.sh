#!/usr/bin/env bash
# Load the round-2 dialog seed into the live review DB via the admin API.
# Idempotency: the dialog table is append-only, so running twice DOUBLE-POSTS.
# This script refuses to run if any dialog rows already exist unless --force is passed.
set -euo pipefail

BASE="${BASE:-https://trisight-engine-production.up.railway.app}"
CODE="${REVIEW_ACCESS_CODE:?set REVIEW_ACCESS_CODE}"
ADMIN="${REVIEW_ADMIN_CODE:?set REVIEW_ADMIN_CODE}"
SEED="$(dirname "$0")/dialog-seed.json"
FORCE="${1:-}"

existing=$(curl -s "$BASE/api/review/dialog" -H "x-review-code: $CODE" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('data',[])))")
if [ "$existing" != "0" ]; then
  if [ "$FORCE" != "--force" ]; then
    echo "Refusing: $existing dialog rows already exist. Pass --force to retract unanswered study rows and reload." >&2
    exit 1
  fi
  echo "Retracting unanswered study rows before reload (owner answers are preserved)..."
  curl -s -X POST "$BASE/api/review/dialog/retract-unanswered" -H "x-review-code: $CODE" -H "x-review-admin: $ADMIN" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; print('  removed', d['removed'], 'study rows; kept', d['kept_owner_rows'], 'owner rows')"
fi

python3 - "$SEED" "$BASE" "$CODE" "$ADMIN" <<'PY'
import json, sys, urllib.request
seed, base, code, admin = sys.argv[1:5]
msgs = json.load(open(seed))["messages"]
ok = 0
for m in msgs:
    payload = {"strategy": m["strategy"], "element_id": m["element_id"], "kind": m["kind"], "body": m["body"]}
    if m.get("evidence"): payload["evidence_json"] = m["evidence"]
    if m.get("options"):  payload["options_json"]  = m["options"]
    req = urllib.request.Request(base + "/api/review/dialog", method="POST",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "x-review-code": code, "x-review-admin": admin})
    r = json.load(urllib.request.urlopen(req))
    assert "data" in r, r
    ok += 1
    print(f"  posted {m['strategy']}/{m['element_id']} ({m['kind']})")
print(f"loaded {ok}/{len(msgs)} dialog messages")
PY
