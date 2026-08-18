#!/usr/bin/env bash
# assay/gate.sh — the one gate. Exits 0 unmasked or fails loudly.
# W1: seal/code binding is the EPOCH CHAIN's job (step 8) — computed from git, never declared.
# grep exit semantics explicit everywhere: 0=found, 1=clean, >=2=grep itself failed (also a FAIL).
set -euo pipefail
cd "$(dirname "$0")"

echo "== [1/12] typecheck (project config, tests included) =="
bunx tsc --noEmit

echo "== [2/12] guard-shown-failing: stripped type harness MUST fail under the PROJECT config (A2) =="
sed 's|// @ts-expect-error|// stripped-expectation|' tests/typeharness.ts > tests/tmp_typeharness_stripped.ts
EXPECTED_GUARDS=$(grep -c 'stripped-expectation' tests/tmp_typeharness_stripped.ts)
set +e
STRIP_OUT=$(bunx tsc --noEmit -p tsconfig.json 2>&1)
STRIP_RC=$?
set -e
rm -f tests/tmp_typeharness_stripped.ts
if [ "$STRIP_RC" -eq 0 ]; then
  echo "FAIL: type misuse compiled cleanly — the compile-time guards are not guarding"
  exit 1
fi
set +e
FIRED=$(printf '%s\n' "$STRIP_OUT" | grep -c "tmp_typeharness_stripped")
set -e
if [ "$FIRED" -ne "$EXPECTED_GUARDS" ]; then
  echo "FAIL: $EXPECTED_GUARDS guards stripped but only $FIRED compile errors fired"
  printf '%s\n' "$STRIP_OUT" | head -8
  exit 1
fi
echo "ok: all $EXPECTED_GUARDS stripped guards fail to compile"

echo "== [3/12] tests =="
bun test

echo "== [4/12] kernel purity greps (I1/I2 hygiene; recursive per W0/F2) =="
set +e
grep -rnE --include='*.ts' "Date\.now|new Date\(|Math\.random|performance\.now|process\.hrtime|process\.env|Intl\.|node:fs|node:http|node:net|node:os|node:child_process|fetch\(" kernel
PURITY_RC=$?
set -e
if [ "$PURITY_RC" -eq 0 ]; then echo "FAIL: kernel touches ambient state"; exit 1; fi
if [ "$PURITY_RC" -ne 1 ]; then echo "FAIL: purity grep errored (rc=$PURITY_RC)"; exit 1; fi
set +e
grep -rnE --include='*.ts' "\b(252|365)\b" kernel
ANNUAL_RC=$?
set -e
if [ "$ANNUAL_RC" -eq 0 ]; then echo "FAIL: hardcoded annualization constant in kernel"; exit 1; fi
if [ "$ANNUAL_RC" -ne 1 ]; then echo "FAIL: annualization grep errored (rc=$ANNUAL_RC)"; exit 1; fi
echo "ok: kernel pure — greps recursive, matching the code layout (F2)"

echo "== [5/12] compute-root completeness: hashed set == git-tracked set (W0/C7/F1) =="
HASHED=$(bun -e 'import { hashedFileList } from "./substrate/codehash.ts"; console.log(hashedFileList().join("\n"))')
TRACKED=$(git -c core.quotePath=false ls-files kernel substrate adversary receipt)
if [ "$HASHED" != "$TRACKED" ]; then
  echo "FAIL: code_hash file coverage diverges from git — a tracked file escapes the seal (or an untracked file pollutes it)"
  diff <(printf '%s\n' "$HASHED") <(printf '%s\n' "$TRACKED") | head -12
  exit 1
fi
COUNT=$(printf '%s\n' "$HASHED" | wc -l | tr -d ' ')
echo "ok: $COUNT files sealed, exactly the tracked set (byte-level cleanliness enforced by step 6)"

echo "== [6/12] compute roots clean: no unstaged edits, no untracked files (Cato X4) =="
set +e
git diff --quiet -- kernel substrate adversary receipt
DIRTY=$?
set -e
if [ "$DIRTY" -ne 0 ]; then
  echo "FAIL: unstaged changes under compute roots — the gate would seal a tree nobody committed; stage first"
  git diff --stat -- kernel substrate adversary receipt | head -6
  exit 1
fi
UNTRACKED=$(git ls-files --others --exclude-standard kernel substrate adversary receipt)
if [ -n "$UNTRACKED" ]; then
  echo "FAIL: untracked files under compute roots:"
  printf "%s\n" "$UNTRACKED" | head -5
  exit 1
fi
echo "ok: compute roots byte-identical to the index"

echo "== [7/12] no masked exits anywhere (recursive; gate.sh included) =="
set +e
grep -rn --include='*.ts' "|| *true" kernel substrate adversary receipt phase2 phase3 tests cli.ts
MASK_RC=$?
set -e
if [ "$MASK_RC" -eq 0 ]; then echo "FAIL: masked exit code found"; exit 1; fi
if [ "$MASK_RC" -ne 1 ]; then echo "FAIL: mask grep errored (rc=$MASK_RC)"; exit 1; fi
set +e
grep -n "|| *true" gate.sh
GMASK_RC=$?
set -e
if [ "$GMASK_RC" -eq 0 ]; then echo "FAIL: masked exit in gate.sh"; exit 1; fi
echo "ok: nothing masked"

echo "== [8/12] determinism replay of stored traces (A5; epoch-partitioned per F7) =="
REPLAY_JSON=$(bun run cli.ts replay)
printf '%s\n' "$REPLAY_JSON"
CHECKED=$(printf '%s' "$REPLAY_JSON" | grep -o '"checked":[[:space:]]*[0-9]*' | grep -o '[0-9]*$')
if [ "${CHECKED:-0}" -lt 1 ]; then
  echo "FAIL: replay checked ${CHECKED:-0} current-epoch traces — every epoch must carry a live corpus (F7)"
  exit 1
fi

echo "== [9/12] epoch chain: topology, git re-derivation, head==present, reviews, quarantine (W1) =="
bun run cli.ts verify-epochs

echo "== [10/12] store verification: object integrity + index completeness =="
bun run cli.ts verify-store

echo "== [11/12] secret scan over stored material (A6) =="
for d in store-data evidence; do
  if [ ! -d "$d" ]; then echo "FAIL: $d missing — secret scan cannot run"; exit 1; fi
done
KEY="${MASSIVE_API_KEY:-}"
if [ -n "$KEY" ]; then
  set +e
  grep -rF "$KEY" store-data/ evidence/
  SCAN_RC=$?
  set -e
  if [ "$SCAN_RC" -eq 0 ]; then echo "FAIL: live key found in stored material"; exit 1; fi
  if [ "$SCAN_RC" -ne 1 ]; then echo "FAIL: secret scan errored (rc=$SCAN_RC)"; exit 1; fi
  echo "ok: live key appears nowhere in store-data/ or evidence/"
else
  echo "DISCLOSED: no live key in env — this step's predicate is NOT RUN, not passed."
fi

echo "== [12/12] coverage (captured as evidence) =="
bun test --coverage > /dev/null 2> .tmp_coverage.txt
tail -28 .tmp_coverage.txt
mv .tmp_coverage.txt evidence/coverage.txt

echo "GATE PASS"
