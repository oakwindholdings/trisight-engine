#!/usr/bin/env bash
# assay/gate.sh — the one gate. Exits 0 unmasked or fails loudly.
# No piped exit codes, no masked greps, no allowlists. A gate that passes without looking is a failure.
# grep exit semantics handled explicitly everywhere: 0=found, 1=clean, >=2=grep itself failed (also a FAIL).
set -euo pipefail
cd "$(dirname "$0")"

echo "== [1/8] typecheck (project config, tests included) =="
bunx tsc --noEmit

echo "== [2/8] guard-shown-failing: stripped type harness MUST fail under the PROJECT config (A2) =="
sed 's|// @ts-expect-error|// stripped-expectation|' tests/typeharness.ts > tests/tmp_typeharness_stripped.ts
set +e
STRIP_OUT=$(bunx tsc --noEmit -p tsconfig.json 2>&1)
STRIP_RC=$?
set -e
rm -f tests/tmp_typeharness_stripped.ts
if [ "$STRIP_RC" -eq 0 ]; then
  echo "FAIL: type misuse compiled cleanly under the project config — the compile-time guards are not guarding"
  exit 1
fi
if ! printf '%s\n' "$STRIP_OUT" | grep -q "tmp_typeharness_stripped"; then
  echo "FAIL: tsc failed for a reason unrelated to the stripped harness:"
  printf '%s\n' "$STRIP_OUT" | head -5
  exit 1
fi
echo "ok: misuse fails to compile under the project's own strictness (guard demonstrated failing)"

echo "== [3/8] tests =="
bun test

echo "== [4/8] kernel purity greps (I1/I2 hygiene) =="
set +e
grep -rnE "Date\.now|Math\.random|process\.env|node:fs|node:http|node:net|node:os|node:child_process|fetch\(" kernel/
PURITY_RC=$?
set -e
if [ "$PURITY_RC" -eq 0 ]; then echo "FAIL: kernel touches ambient state"; exit 1; fi
if [ "$PURITY_RC" -ne 1 ]; then echo "FAIL: purity grep errored (rc=$PURITY_RC)"; exit 1; fi
set +e
grep -rnE "\b(252|365)\b" kernel/*.ts
ANNUAL_RC=$?
set -e
if [ "$ANNUAL_RC" -eq 0 ]; then echo "FAIL: hardcoded annualization constant in kernel"; exit 1; fi
if [ "$ANNUAL_RC" -ne 1 ]; then echo "FAIL: annualization grep errored (rc=$ANNUAL_RC)"; exit 1; fi
echo "ok: kernel pure — no clock, no env, no fs/network, no annualization constants"

echo "== [5/8] no masked exits anywhere (gate.sh included) =="
set +e
grep -n "|| *true" cli.ts kernel/*.ts substrate/*.ts adversary/*.ts receipt/*.ts tests/*.ts gate.sh
MASK_RC=$?
set -e
if [ "$MASK_RC" -eq 0 ]; then echo "FAIL: masked exit code found"; exit 1; fi
if [ "$MASK_RC" -ne 1 ]; then echo "FAIL: mask grep errored (rc=$MASK_RC)"; exit 1; fi
echo "ok: nothing masked"

echo "== [6/8] determinism replay of stored traces (A5) =="
REPLAY_JSON=$(bun run cli.ts replay)
printf '%s\n' "$REPLAY_JSON"
CHECKED=$(printf '%s' "$REPLAY_JSON" | grep -o '"checked":[[:space:]]*[0-9]*' | grep -o '[0-9]*$')
if [ "${CHECKED:-0}" -lt 1 ]; then
  echo "FAIL: replay checked ${CHECKED:-0} traces — the determinism gate did not actually run"
  exit 1
fi
set +e
grep -q '"refusal_reason":null' store-data/traces/traces.jsonl
CORPUS_RC=$?
set -e
if [ "$CORPUS_RC" -ne 0 ]; then
  echo "DISCLOSED: replay corpus contains only refusal invocations — kernel-arithmetic determinism is"
  echo "           proven by tests (tests/substrate.test.ts A5) but NOT yet by a live successful run."
  echo "           A real MASSIVE_API_KEY run upgrades this. (Recorded honestly, per I6.)"
fi

echo "== [7/8] secret scan over stored material (A6) =="
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
  if [ "$SCAN_RC" -ne 1 ]; then echo "FAIL: secret scan errored (rc=$SCAN_RC) — scan did not complete"; exit 1; fi
  echo "ok: live key appears nowhere in store-data/ or evidence/"
else
  echo "ok: no live key in env (set-but-empty counts as missing); structural redaction proven by tests"
fi

echo "== [8/8] coverage (captured as evidence; per-file numbers in ISA) =="
bun test --coverage > /dev/null 2> .tmp_coverage.txt
tail -25 .tmp_coverage.txt
mv .tmp_coverage.txt evidence/coverage.txt

echo "GATE PASS"
