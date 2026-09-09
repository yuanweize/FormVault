import json
import os

LOCALES_DIR = "/Users/yuanweize/我的文档/服务器/GITHUB/FormVault/frontend/src/i18n/locales"

def flatten_dict(d, parent_key=''):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}.{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key).items())
        else:
            items.append((new_key, v))
    return dict(items)

def main():
    en_path = os.path.join(LOCALES_DIR, "en.json")
    with open(en_path, "r", encoding="utf-8") as f:
        en_dict = json.load(f)
    en_flat = flatten_dict(en_dict)
    
    locales = ["en", "cs", "zh", "de", "fr", "es", "it", "ru", "pt", "ja", "ko", "ar"]
    
    print(f"{'Locale':<8} | {'Total Keys':<10} | {'Missing':<8} | {'Exact En Match':<16} | {'Status'}")
    print("-" * 65)
    
    # Non-translatable keys (proper names, technical identifiers, formulas, email addresses)
    whitelist_exact_matches = {
        "footer.registrationNumber",
        "common.brandName",
        "common.companyName",
        "app.title",
        "app.shortTitle",
        "forms.personalInfo.countries.CN",
        "forms.personalInfo.countries.JP",
        "forms.personalInfo.countries.CA",
        "forms.personalInfo.countries.FR",
        "forms.personalInfo.countries.AU"
    }

    audit_results = {}

    for loc in locales:
        loc_path = os.path.join(LOCALES_DIR, f"{loc}.json")
        if not os.path.exists(loc_path):
            print(f"{loc:<8} | FILE NOT FOUND")
            continue
        with open(loc_path, "r", encoding="utf-8") as f:
            loc_dict = json.load(f)
        loc_flat = flatten_dict(loc_dict)
        
        missing = [k for k in en_flat if k not in loc_flat]
        
        if loc == "en":
            exact_matches = []
        else:
            exact_matches = []
            for k, val in loc_flat.items():
                if k in en_flat and val == en_flat[k]:
                    # Ignore if numeric or very short technical symbol or in whitelist
                    if isinstance(val, str) and len(val.strip()) > 3 and k not in whitelist_exact_matches:
                        exact_matches.append((k, val))
        
        audit_results[loc] = {
            "total": len(loc_flat),
            "missing": missing,
            "exact_matches": exact_matches
        }
        
        status = "PERFECT" if len(missing) == 0 and len(exact_matches) == 0 else "NEEDS_FIX"
        if loc == "en":
            status = "BASE (100%)"
            
        print(f"{loc:<8} | {len(loc_flat):<10} | {len(missing):<8} | {len(exact_matches):<16} | {status}")

    # Details on exact matches
    print("\n--- Detailed Untranslated English Clones by Locale ---")
    for loc, res in audit_results.items():
        if loc != "en" and res["exact_matches"]:
            print(f"\nLocale: {loc} ({len(res['exact_matches'])} exact clones of English text):")
            for k, v in res["exact_matches"][:10]:
                print(f"  - {k}: \"{v}\"")
            if len(res["exact_matches"]) > 10:
                print(f"  ... and {len(res['exact_matches']) - 10} more.")

    # Details on missing keys
    print("\n--- Detailed Missing Keys by Locale ---")
    for loc, res in audit_results.items():
        if res["missing"]:
            print(f"\nLocale: {loc} (Missing {len(res['missing'])} keys):")
            for k in res["missing"][:10]:
                print(f"  - {k}")
            if len(res["missing"]) > 10:
                print(f"  ... and {len(res['missing']) - 10} more.")

if __name__ == "__main__":
    main()
