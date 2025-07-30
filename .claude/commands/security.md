# /security – Scan new code for potential vulnerabilities

**Purpose:** Detect and report security vulnerabilities—code smells, misconfigurations, dependency CVEs, and leaked secrets—before they reach production.

**Scope:** Only consider the changes introduced in this session; the refactor should be limited to that diff.

### Step-by-Step Instructions

1. **Collect targets**
   * Enumerate all source files (`*.py`, `*.ts`, `*.js`, `*.tsx`, `*.go`, etc.).
   * Include infrastructure files (`Dockerfile`, `docker-compose.*`, `*.yaml`, `*.yml`, `helm/`, `terraform/`).
   * Read dependency manifests (`requirements*.txt`, `pyproject.toml`, `package.json`, `go.mod`, etc.).

2. **Run static analysis**
   * Flag insecure patterns mapped to OWASP Top 10 & CWE (e.g., unsanitized input, hard-coded SQL, insecure deserialization, SSRF, XSS).
