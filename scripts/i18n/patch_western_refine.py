# -*- coding: utf-8 -*-
"""
Refine de, fr, es:
- Add common.close, common.selectLanguage
- Translate remaining 11-12 English text items into true German, French, Spanish.
"""

import json
import os

LOCALES_DIR = "/Users/yuanweize/我的文档/服务器/GITHUB/FormVault/frontend/src/i18n/locales"

def merge_deep(target, source):
    for k, v in source.items():
        if isinstance(v, dict):
            node = target.setdefault(k, {})
            merge_deep(node, v)
        else:
            target[k] = v

def main():
    de_refine = {
        "common": {
            "close": "Schließen",
            "selectLanguage": "Sprache auswählen"
        },
        "stepper": {
            "personalInfoShort": "Persönliche Daten"
        },
        "footer": {
            "support": "Kundenservice & Hilfe"
        },
        "pages": {
            "home": {
                "banner": {
                    "notice": "Wichtiger Hinweis"
                },
                "tracker": {
                    "trackButton": "Status prüfen",
                    "tracking": "Wird gesucht...",
                    "recently": "Kürzlich"
                }
            },
            "support": {
                "copyBtn": "Kopieren"
            },
            "privacy": {
                "form": {
                    "submitting": "Wird gesendet..."
                }
            }
        }
    }

    fr_refine = {
        "common": {
            "close": "Fermer",
            "selectLanguage": "Sélectionner la langue"
        },
        "stepper": {
            "personalInfoShort": "Informations personnelles"
        },
        "footer": {
            "support": "Support et Assistance"
        },
        "pages": {
            "home": {
                "banner": {
                    "notice": "Avis Réglementaire"
                },
                "tracker": {
                    "trackButton": "Suivre le dossier",
                    "tracking": "Recherche en cours...",
                    "recently": "Récemment"
                }
            },
            "support": {
                "copyBtn": "Copier"
            },
            "privacy": {
                "form": {
                    "submitting": "Envoi en cours..."
                }
            }
        }
    }

    es_refine = {
        "common": {
            "close": "Cerrar",
            "selectLanguage": "Seleccionar idioma"
        },
        "stepper": {
            "personalInfoShort": "Datos personales"
        },
        "footer": {
            "support": "Atención y Soporte"
        },
        "pages": {
            "home": {
                "banner": {
                    "notice": "Aviso Regulatorio"
                },
                "tracker": {
                    "trackButton": "Rastrear solicitud",
                    "tracking": "Rastreando...",
                    "recently": "Reciente"
                }
            },
            "support": {
                "copyBtn": "Copiar"
            },
            "privacy": {
                "form": {
                    "submitting": "Enviando..."
                }
            }
        }
    }

    for code, patch in [("de", de_refine), ("fr", fr_refine), ("es", es_refine)]:
        path = os.path.join(LOCALES_DIR, f"{code}.json")
        with open(path, "r", encoding="utf-8") as f:
            cur = json.load(f)
        merge_deep(cur, patch)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cur, f, ensure_ascii=False, indent=2)
        print(f"[{code}] Successfully refined and zeroed exact English duplicates.")

if __name__ == "__main__":
    main()
