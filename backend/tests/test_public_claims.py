"""
Automated CI Scanner for Public Claims & Regulatory Compliance.

Scans frontend components, translation files, markdown documentation,
and backend API endpoints to ensure strict compliance:
1. No exaggerated claims ("hardware-grade", "zero-knowledge", "military-grade").
2. No fictitious regulatory claims ("national insurance database", "co-compliance").
3. Accurate legal separation between HKTSE (tipař) and licensed brokers (makléř).
"""

import os
import re
import pytest

FORBIDDEN_PATTERNS = [
    (
        r"hardware[- ]grade",
        "Exaggerated claim: 'hardware-grade' is non-verifiable marketing fluff",
    ),
    (
        r"zero[- ]knowledge",
        "Exaggerated claim: 'zero-knowledge' conflicts with server-side processing & DPA handoff",
    ),
    (
        r"military[- ]grade",
        "Exaggerated claim: 'military-grade' is forbidden marketing hyperbole",
    ),
    (
        r"军工级",
        "Exaggerated claim: '军工级' is forbidden marketing hyperbole in Chinese",
    ),
    (
        r"离开即焚",
        "Exaggerated claim: '离开即焚' is forbidden marketing hyperbole in Chinese",
    ),
    (
        r"national insurance database",
        "Fictitious claim: Czech health insurance is registered in underwriter systems, not a national database",
    ),
    (
        r"co[- ]compliance",
        "Legally invalid: Act No. 170/2018 Coll. defines broker supervision over tipař, not co-compliance",
    ),
    (
        r"authorized\s+partner\s+for\s+PVZP",
        "Unauthorized claim: HKTSE is a lead generator, not an authorized partner of PVZP",
    ),
    (
        r"authorized\s+partner\s+for\s+Slavia",
        "Unauthorized claim: HKTSE is not a direct authorized partner of Slavia",
    ),
    (
        r"authorized\s+partner\s+for\s+SV",
        "Unauthorized claim: HKTSE is not a direct authorized partner of SV",
    ),
    (
        r"FormVault\s+Insurance\s+Brokerage\s+Services",
        "Unauthorized claim: FormVault is a technology platform, not an insurance brokerage",
    ),
    (
        r"FormVault\s+registered\s+insurance\s+intermediary",
        "Unauthorized claim: FormVault is not a registered insurance intermediary",
    ),
    (
        r"brokerage\s+mediation\s+by\s+(FormVault|HKTSE)",
        "Unauthorized claim: HKTSE acts as tipař (lead generator), not insurance brokerage",
    ),
    (
        r"Authorized\s+European\s+Insurance\s+Broker",
        "Unauthorized claim: HKTSE is not an insurance broker",
    ),
    (
        r"DEFAULT_CZECH_COMPANIES",
        "Prohibited fallback: Real carrier quotes cannot exist in client-side fallbacks",
    ),
    (
        r"零知识",
        "Exaggerated claim: '零知识' conflicts with server-side processing & DPA handoff in Chinese",
    ),
    (
        r"不可篡改",
        "Imprecise claim: cryptographic hashes provide tamper-evidence, not immutability in Chinese",
    ),
]

# Paths to scan
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
FRONTEND_SRC = os.path.join(ROOT_DIR, "frontend/src")
BACKEND_APP = os.path.join(ROOT_DIR, "backend/app")
DOCS_FILES = [
    os.path.join(ROOT_DIR, "README.md"),
    os.path.join(ROOT_DIR, "README_zh.md"),
    os.path.join(ROOT_DIR, "NOTICE"),
    os.path.join(ROOT_DIR, "COMMERCIAL-LICENSE.md"),
]


def get_files_to_scan():
    files = list(DOCS_FILES)
    for base in [FRONTEND_SRC, BACKEND_APP]:
        if os.path.exists(base):
            for root, _, filenames in os.walk(base):
                for f in filenames:
                    if f.endswith(
                        (".tsx", ".ts", ".jsx", ".js", ".json", ".py", ".html", ".md")
                    ):
                        files.append(os.path.join(root, f))
    return files


def test_public_claims_scanner():
    """Verify that no forbidden or exaggerated claims exist in public-facing files."""
    files_to_scan = get_files_to_scan()
    violations = []

    for file_path in files_to_scan:
        if not os.path.exists(file_path):
            continue
        # Skip migration scripts or tests that mention patterns for scanning
        if "test_public_claims.py" in file_path:
            continue

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            continue

        for pattern, explanation in FORBIDDEN_PATTERNS:
            matches = list(re.finditer(pattern, content, re.IGNORECASE))
            for match in matches:
                # Calculate line number
                line_num = content[: match.start()].count("\n") + 1
                violations.append(
                    f"{file_path}:{line_num} -> Found '{match.group(0)}': {explanation}"
                )

    if violations:
        msg = "\n".join(violations)
        pytest.fail(
            f"Regulatory & Public Claims Scanner detected {len(violations)} violation(s):\n{msg}"
        )
