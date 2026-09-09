# FormVault i18n & Localization Utilities

This directory contains automated synchronization, verification, and patch scripts for FormVault's 12 supported internationalization (i18n) locales:

- **Languages Supported**: `en`, `zh`, `cs`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `ja`, `ko`, `ar`
- **Location**: `frontend/src/i18n/locales/*.json`

## Scripts Overview

| Script | Purpose |
|---|---|
| `audit_locales.py` | Audits all locale JSON files against `en.json` to detect missing, orphaned, or un-translated keys. |
| `align_and_perfect_all_12_locales.py` | Full-pass alignment script guaranteeing 100% key parity across all 12 languages. |
| `translate_locales.py` | Automated translation utility for synchronizing newly introduced UI keys. |
| `patch_core_triad.py` | Synchronizes the core triad languages (`en`, `zh`, `cs`). |
| `patch_western_europe.py` | Refines and updates Western European locales (`de`, `es`, `fr`). |
| `patch_it_pt.py` | Refines and updates Mediterranean locales (`it`, `pt`). |
| `patch_ru.py` | Refines and updates Slavic Russian locale (`ru`). |
| `patch_ja_ko.py` | Refines and updates East Asian locales (`ja`, `ko`). |
| `patch_ar.py` | Refines and updates Arabic locale (`ar`) with RTL context. |
| `patch_western_refine.py` | Fine-tunes localized terminology across secondary European locales. |
