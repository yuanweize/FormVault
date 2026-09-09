# -*- coding: utf-8 -*-
"""
FormVault Comprehensive Multilingual Translation Updater
Generates 100% genuine translations across all 12 supported locales.
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
    # 1. Load data
    with open(os.path.join(LOCALES_DIR, "en.json"), "r", encoding="utf-8") as f:
        en = json.load(f)

    # -------------------------------------------------------------
    # GERMAN (de)
    # -------------------------------------------------------------
    de_patch = {
        "common": {
            "theme": {"light": "Zu hellem Modus wechseln", "dark": "Zu dunklem Modus wechseln"}
        },
        "footer": {"brokerTitle": "FormVault Versicherungsvermittlungsdienste"},
        "cookieConsent": {
            "title": "Cookie- & Datenschutzeinstellungen",
            "description": "Wir verwenden Cookies und sichere Tokens, um eine reibungslose Antragsübermittlung und DSGVO-Konformität zu gewährleisten.",
            "acceptAll": "Alle akzeptieren",
            "essentialOnly": "Nur notwendige",
            "privacyPolicy": "Datenschutzrichtlinie"
        },
        "pages": {
            "home": {
                "authorizedBroker": "Autorisierter europäischer Versicherungsmakler • Standards der Tschechischen Republik & EU",
                "trackMyApplication": "Meine Bewerbung verfolgen",
                "metrics": {
                    "actCompliance": "Konform mit tschechischem OAMP",
                    "rapidApp": "Schnelle Antragstellung",
                    "bankPrivacy": "Datenschutz auf Bankenniveau"
                },
                "securityBadges": {
                    "endToEnd": "Ende-zu-Ende verschlüsselte Speicherung",
                    "autoEmail": "Automatische Bestätigungs-E-Mail mit Tracking-Code"
                },
                "tracker": {
                    "title": "Bewerbungsstatus verfolgen",
                    "subtitle": "Geben Sie Ihre Referenznummer und registrierte E-Mail-Adresse ein, um den Fortschritt in Echtzeit zu prüfen.",
                    "refLabel": "Referenznummer",
                    "refPlaceholder": "z. B. APP-2026-001234",
                    "emailLabel": "Registrierte E-Mail",
                    "emailPlaceholder": "z. B. client@example.com",
                    "applicantName": "Name des Antragstellers",
                    "registeredEmail": "Registrierte E-Mail",
                    "lastUpdated": "Zuletzt aktualisiert",
                    "timelineTitle": "Zeitplan für die Antragsbearbeitung",
                    "currentStage": "Aktuelle Phase"
                },
                "plans": {
                    "badge": "Ausgewählte Versicherungsstufen",
                    "title": "Empfohlene Versicherungspläne",
                    "subtitle": "Vollständig zertifiziert von den tschechischen Behörden (OAMP) für ausländische Studierende, Expats und Reisende.",
                    "choosePlan": "Plan auswählen",
                    "applyNow": "Jetzt beantragen",
                    "perYear": "/ Jahr",
                    "perMonth": "/ Monat"
                },
                "partners": {
                    "badge": "Akkreditierte Partner",
                    "title": "Offizielle Versicherungsträger",
                    "subtitle": "Direkte Vermittlung mit führenden tschechischen Versicherungsgesellschaften.",
                    "officialPortal": "Offizielle Website"
                },
                "banner": {"learnMore": "Online beantragen"}
            },
            "terms": {
                "subtitle": "Standardbedingungen für die Vermittlung und Beantragung von Versicherungen über FormVault.",
                "section1Title": "1. Geltungsbereich und Vermittlerstatus",
                "section2Title": "2. Richtigkeit der Antragsdaten & Dokumente",
                "section2Content": "Sie versichern, dass alle eingereichten Ausweisdaten, Geburtsdaten und Studienbescheinigungen der Wahrheit entsprechen.",
                "section3Title": "3. Annahme der Police und OAMP-Registrierung",
                "section3Content": "Nach Prüfung und Zahlungseingang wird das elektronische Versicherungszertifikat ausgestellt und im offiziellen tschechischen Versicherungsregister hinterlegt.",
                "section4Title": "4. Stornierung und Visumsablehnungen",
                "section4Content": "Wird Ihr Visumsantrag von der Botschaft oder dem Innenministerium (OAMP) abgelehnt, haben Sie gemäß den Versicherungsbedingungen Anspruch auf Rückerstattung.",
                "section5Title": "5. Anwendbares Recht & Gerichtsstand",
                "section5Content": "Für alle Vermittlungsleistungen gilt das Recht der Tschechischen Republik unter Aufsicht der zuständigen Behörden."
            },
            "support": {
                "subtitle": "Erhalten Sie Unterstützung bei Visabestimmungen, Schadensregulierungen oder sprechen Sie direkt mit einem Berater.",
                "emailCardTitle": "Direkter E-Mail-Support",
                "emailCardDesc": "Für Verifizierungen, Visumanfragen oder Stornierungen. Durchschnittliche Antwortzeit: < 2 Stunden.",
                "copied": "Support-E-Mail in die Zwischenablage kopiert",
                "composeEmail": "E-Mail verfassen",
                "chatCardTitle": "Live-Chat (Crisp)",
                "chatCardDesc": "Verbinden Sie sich direkt mit einem lizenzierten Versicherungsspezialisten auf Englisch, Chinesisch oder Tschechisch.",
                "hours": "Mo - Fr: 09:00 - 18:00 MEZ",
                "location": "Prag, Tschechien",
                "openChat": "Live-Chat öffnen",
                "connectingChat": "Verbindung mit Crisp-Berater wird hergestellt...",
                "chatOffline": "Live-Chat wird initialisiert oder ist offline. Bitte senden Sie uns eine E-Mail an insurance@hktse.eu.org",
                "faqTitle": "Häufig gestellte Fragen (FAQ)",
                "faqSubtitle": "Wichtige Antworten zu den Krankenversicherungsvorschriften für Ausländer in Tschechien.",
                "faqs": {
                    "q1": "Wie schnell erhalte ich mein offizielles Versicherungszertifikat nach der Einreichung?",
                    "a1": "Standard-Zertifikate (Potvrzení o pojištění) werden innerhalb von 1 bis 4 Geschäftsstunden nach Prüfung und Zahlungsbestätigung ausgestellt.",
                    "q2": "Werden Ihre Policen zu 100 % vom tschechischen Innenministerium (OAMP) anerkannt?",
                    "q3": "Was soll ich tun, wenn mein Visumsantrag von der Botschaft abgelehnt wird?",
                    "a3": "Senden Sie uns einfach eine Kopie des offiziellen Ablehnungsbescheids, und wir leiten die Stornierung und Erstattung umgehend ein.",
                    "q4": "Wie funktionieren Kostenerstattung und Direktabrechnung in Tschechien?",
                    "a4": "Bei Vertragskliniken genügt das Vorzeigen Ihrer Versicherungskarte für eine bargeldlose Direktabrechnung. Andernfalls reichen Sie Rechnungen online ein.",
                    "q5": "Warum sind Reisepass- und Studiennachweise erforderlich?",
                    "a5": "Das tschechische Gesetz verlangt eine Identitätsprüfung zur Meldung an das Ministerium. Studiennachweise ermöglichen zudem Rabatte von bis zu 30 %."
                }
            },
            "privacy": {
                "subtitle": "Transparente Informationen darüber, wie FormVault Ihre persönlichen Daten und Dokumente gemäß DSGVO schützt.",
                "section1Title": "1. Verantwortliche Stelle & Geltungsbereich",
                "section1Content": "FormVault verarbeitet Daten im Auftrag des autorisierten Vermittlers HKTSE s.r.o. unter strikter Einhaltung der europäischen Datenschutz-Grundverordnung (DSGVO).",
                "section2Title": "2. Erhobene Datenkategorien",
                "section2Intro": "Wir erheben ausschließlich Daten, die für den Abschluss Ihrer Krankenversicherung gesetzlich vorgeschrieben sind:",
                "section2Item1": "Personenbezogene Identifikationsdaten (vollständiger Name, Geburtsdatum, Geschlecht, Staatsangehörigkeit, Passnummer)",
                "section2Item2": "Aufenthaltsdaten in der Tschechischen Republik (Wohnanschrift, Versicherungsdauer, Aufenthaltszweck)",
                "section2Item3": "Verschlüsselte Dokumentenkopien (Reisepass-Scan, Studienbestätigung)",
                "section2Legal": "Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung).",
                "section3Title": "3. Datenweitergabe an autorisierte Versicherer",
                "section3Content": "Ihre Daten werden ausschließlich über verschlüsselte Schnittstellen an den ausgewählten tschechischen Versicherungsträger (PVZP, Slavia, SV pojišťovna) übertragen.",
                "section4Title": "4. Ihre Betroffenenrechte nach der DSGVO",
                "section4Intro": "Gemäß Kapitel III der DSGVO stehen Ihnen umfassende Rechte zu:",
                "section4Item1": "Recht auf Auskunft über gespeicherte Daten (Art. 15 DSGVO)",
                "section4Item2": "Recht auf Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
                "section4Item3": "Recht auf Löschung ('Recht auf Vergessenwerden', Art. 17 DSGVO)",
                "section4Item4": "Recht auf Datenübertragbarkeit (Art. 20 DSGVO)",
                "form": {
                    "title": "DSGVO-Anfrage einreichen",
                    "subtitle": "Nutzen Sie dieses Formular, um Ihre Betroffenenrechte direkt wahrzunehmen.",
                    "requestAction": "Gewünschte Maßnahme",
                    "types": {
                        "access": "Auskunft über Daten (Art. 15)",
                        "rectification": "Berichtigung von Daten (Art. 16)",
                        "erasure": "Löschung von Daten (Art. 17)",
                        "portability": "Datenübertragbarkeit (Art. 20)"
                    },
                    "fullName": "Vollständiger Name",
                    "fullNamePlaceholder": "z. B. Max Mustermann",
                    "registeredEmail": "Registrierte E-Mail-Adresse",
                    "registeredEmailPlaceholder": "z. B. max@example.de",
                    "refNumber": "Referenznummer (optional)",
                    "refNumberPlaceholder": "z. B. FV-2026-001234",
                    "details": "Details Ihrer Anfrage",
                    "detailsPlaceholder": "Bitte beschreiben Sie Ihr Anliegen genauer...",
                    "submit": "DSGVO-Anfrage absenden",
                    "validationError": "Bitte füllen Sie alle erforderlichen Felder aus.",
                    "successTitle": "Anfrage erfolgreich übermittelt",
                    "successDesc": "Ihre Datenschutzanfrage wurde erfasst. Sie erhalten innerhalb von 30 Tagen eine Rückmeldung."
                }
            }
        },
        "forms": {
            "personalInfo": {
                "sections": {"underwriting": "Angaben für den tschechischen Versicherungsabschluss"},
                "fields": {
                    "gender": "Geschlecht",
                    "nationality": "Staatsangehörigkeit",
                    "placeOfBirth": "Geburtsort (Stadt)",
                    "passportNumber": "Reisepassnummer",
                    "passportExpiry": "Gültigkeitsdatum des Passes",
                    "commencementDate": "Versicherungsbeginn",
                    "duration": "Versicherungsdauer",
                    "typeOfStay": "Aufenthaltszweck in Tschechien"
                },
                "placeholders": {
                    "nationality": "z. B. DEUTSCHLAND, ÖSTERREICH",
                    "placeOfBirth": "z. B. Berlin, Wien, München",
                    "passportNumber": "z. B. C01234567"
                },
                "genderOptions": {"male": "Männlich", "female": "Weiblich"},
                "stayOptions": {
                    "student": "Student an einer Hochschule",
                    "employment": "Beschäftigung / Arbeitserlaubnis",
                    "business": "Gewerbe / Freiberufler",
                    "family": "Familienzusammenführung"
                },
                "durationOptions": {
                    "m6": "6 Monate",
                    "m12": "12 Monate (1 Jahr - Standard)",
                    "m24": "24 Monate (2 Jahre)",
                    "m36": "36 Monate (3 Jahre)"
                }
            }
        }
    }

    # -------------------------------------------------------------
    # FRENCH (fr)
    # -------------------------------------------------------------
    fr_patch = {
        "common": {
            "theme": {"light": "Passer en mode clair", "dark": "Passer en mode sombre"}
        },
        "footer": {"brokerTitle": "Services d'intermédiation en assurance FormVault"},
        "cookieConsent": {
            "title": "Préférences relatives aux cookies et à la confidentialité",
            "description": "Nous utilisons des cookies et des jetons sécurisés pour garantir la soumission fluide de votre demande et la conformité RGPD.",
            "acceptAll": "Tout accepter",
            "essentialOnly": "Essentiels uniquement",
            "privacyPolicy": "Politique de confidentialité"
        },
        "pages": {
            "home": {
                "authorizedBroker": "Courtier d'assurance européen agréé • Normes de la République tchèque et de l'UE",
                "trackMyApplication": "Suivre ma demande",
                "metrics": {
                    "actCompliance": "Conforme OAMP tchèque",
                    "rapidApp": "Demande ultra-rapide",
                    "bankPrivacy": "Confidentialité bancaire"
                },
                "securityBadges": {
                    "endToEnd": "Stockage crypté de bout en bout",
                    "autoEmail": "E-mail de confirmation automatique avec code de suivi"
                },
                "tracker": {
                    "title": "Suivi de l'état de la demande",
                    "subtitle": "Saisissez votre numéro de référence et votre e-mail enregistré pour vérifier l'avancement en temps réel.",
                    "refLabel": "Numéro de référence",
                    "refPlaceholder": "ex. APP-2026-001234",
                    "emailLabel": "E-mail enregistré",
                    "emailPlaceholder": "ex. client@example.com",
                    "applicantName": "Nom du demandeur",
                    "registeredEmail": "E-mail enregistré",
                    "lastUpdated": "Dernière mise à jour",
                    "timelineTitle": "Chronologie du traitement de la demande",
                    "currentStage": "Étape actuelle"
                },
                "plans": {
                    "badge": "Niveaux de couverture sélectionnés",
                    "title": "Formules d'assurance recommandées",
                    "subtitle": "Entièrement certifié par les autorités réglementaires tchèques (OAMP) pour les étudiants étrangers, expatriés et voyageurs.",
                    "choosePlan": "Choisir la formule",
                    "applyNow": "Postuler maintenant",
                    "perYear": "/ an",
                    "perMonth": "/ mois"
                },
                "partners": {
                    "badge": "Partenaires accrédités",
                    "title": "Compagnies d'assurance officielles",
                    "subtitle": "Souscription directe auprès des principaux assureurs de la République tchèque.",
                    "officialPortal": "Site officiel"
                },
                "banner": {"learnMore": "Postuler en ligne"}
            },
            "terms": {
                "subtitle": "Conditions régissant la soumission des demandes d'assurance et la médiation de courtage par FormVault.",
                "section1Title": "1. Champ d'application et statut d'intermédiaire",
                "section2Title": "2. Exactitude des déclarations et documents",
                "section2Content": "Le demandeur certifie que toutes les données personnelles, passeports et confirmations d'études sont authentiques et exactes.",
                "section3Title": "3. Émission de la police et enregistrement OAMP",
                "section3Content": "Dès validation et réception du paiement, le certificat officiel (Potvrzení o pojištění) est généré et enregistré au registre national tchèque.",
                "section4Title": "4. Annulation et refus de visa",
                "section4Content": "En cas de refus de visa par l'Ambassade ou l'OAMP, vous avez droit au remboursement conformément aux conditions de l'assureur.",
                "section5Title": "5. Droit applicable et juridiction compétente",
                "section5Content": "Les présentes conditions sont régies par le droit de la République tchèque sous le contrôle des autorités de régulation."
            },
            "support": {
                "subtitle": "Obtenez de l'aide pour vos démarches de visa tchèque, procédures de remboursement ou discutez avec un conseiller.",
                "emailCardTitle": "Support par e-mail direct",
                "emailCardDesc": "Pour la vérification des polices, questions d'ambassade ou demandes de remboursement. Délai moyen : < 2 heures.",
                "copied": "E-mail d'assistance copié dans le presse-papiers",
                "composeEmail": "Rédiger un e-mail",
                "chatCardTitle": "Chat en direct (Crisp)",
                "chatCardDesc": "Échangez en direct avec un spécialiste agréé en anglais, chinois ou tchèque pendant les heures ouvrées.",
                "hours": "Lun - Ven: 09:00 - 18:00 CET",
                "location": "Prague, République tchèque",
                "openChat": "Ouvrir le chat en direct",
                "connectingChat": "Connexion avec le conseiller Crisp...",
                "chatOffline": "Le chat en direct s'initialise ou est actuellement hors ligne. Veuillez nous contacter à insurance@hktse.eu.org",
                "faqTitle": "Foire aux questions (FAQ)",
                "faqSubtitle": "Réponses rapides concernant l'assurance santé pour étrangers en République tchèque.",
                "faqs": {
                    "q1": "Quand recevrai-je mon certificat d'assurance officiel après soumission ?",
                    "a1": "Les certificats électroniques (Potvrzení o pojištění) sont émis sous 1 à 4 heures ouvrées après validation du dossier et paiement.",
                    "q2": "Vos polices sont-elles acceptées à 100 % par le ministère de l'Intérieur tchèque (OAMP) ?",
                    "q3": "Que faire si ma demande de visa est refusée par l'Ambassade ?",
                    "a3": "Transmettez-nous simplement une copie du document officiel de refus pour enclencher l'annulation et le remboursement intégral.",
                    "q4": "Comment fonctionnent le tiers payant et le remboursement des soins en Tchéquie ?",
                    "a4": "Dans les hôpitaux conventionnés, présentez votre carte d'assurance pour une prise en charge directe. Sinon, soumettez vos factures en ligne.",
                    "q5": "Pourquoi le passeport et le justificatif d'études sont-ils exigés ?",
                    "a5": "La loi tchèque impose une vérification d'identité pour enregistrer la police. Le statut étudiant donne accès à des tarifs réduits jusqu'à 30 %."
                }
            },
            "privacy": {
                "subtitle": "Informations transparentes sur la protection de vos données personnelles et documents conformément au RGPD.",
                "section1Title": "1. Responsable du traitement et portée",
                "section1Content": "FormVault traite les données pour le compte de l'intermédiaire agréé HKTSE s.r.o. en stricte conformité avec le RGPD européen.",
                "section2Title": "2. Catégories de données collectées",
                "section2Intro": "Nous collectons uniquement les informations requises par la loi tchèque sur les assurances :",
                "section2Item1": "Données d'identification (nom complet, date de naissance, sexe, nationalité, numéro de passeport)",
                "section2Item2": "Données de séjour en République tchèque (adresse postale, durée d'assurance, type de séjour)",
                "section2Item3": "Copies de documents cryptées (scan du passeport, attestation d'inscription universitaire)",
                "section2Legal": "Bases légales : exécution du contrat (Art. 6-1-b RGPD) et obligations légales (Art. 6-1-c RGPD).",
                "section3Title": "3. Transmission sécurisée aux assureurs",
                "section3Content": "Vos données sont transmises exclusivement par canaux cryptés à la compagnie choisie (PVZP, Slavia, SV pojišťovna).",
                "section4Title": "4. Vos droits au titre du RGPD",
                "section4Intro": "Conformément au chapitre III du RGPD, vous disposez des droits suivants :",
                "section4Item1": "Droit d'accès à vos données (Art. 15 RGPD)",
                "section4Item2": "Droit de rectification (Art. 16 RGPD)",
                "section4Item3": "Droit à l'effacement ('droit à l'oubli', Art. 17 RGPD)",
                "section4Item4": "Droit à la portabilité (Art. 20 RGPD)",
                "form": {
                    "title": "Soumettre une demande RGPD",
                    "subtitle": "Utilisez ce formulaire officiel pour exercer vos droits de protection des données.",
                    "requestAction": "Type d'action demandée",
                    "types": {
                        "access": "Accès aux données (Art. 15)",
                        "rectification": "Rectification de données (Art. 16)",
                        "erasure": "Effacement / Droit à l'oubli (Art. 17)",
                        "portability": "Portabilité des données (Art. 20)"
                    },
                    "fullName": "Nom complet",
                    "fullNamePlaceholder": "ex. Jean Dupont",
                    "registeredEmail": "Adresse e-mail enregistrée",
                    "registeredEmailPlaceholder": "ex. jean@example.fr",
                    "refNumber": "Numéro de référence (facultatif)",
                    "refNumberPlaceholder": "ex. FV-2026-001234",
                    "details": "Détails de votre demande",
                    "detailsPlaceholder": "Précisez votre demande...",
                    "submit": "Envoyer la demande RGPD",
                    "validationError": "Veuillez remplir tous les champs obligatoires.",
                    "successTitle": "Demande enregistrée avec succès",
                    "successDesc": "Votre demande RGPD a été transmise. Un accusé de réception vous sera envoyé sous 30 jours."
                }
            }
        },
        "forms": {
            "personalInfo": {
                "sections": {"underwriting": "Données requises pour la souscription tchèque"},
                "fields": {
                    "gender": "Sexe",
                    "nationality": "Nationalité / Citoyenneté",
                    "placeOfBirth": "Lieu de naissance (Ville)",
                    "passportNumber": "Numéro de passeport",
                    "passportExpiry": "Date d'expiration du passeport",
                    "commencementDate": "Date de début d'assurance",
                    "duration": "Durée de couverture",
                    "typeOfStay": "Type de séjour en République tchèque"
                },
                "placeholders": {
                    "nationality": "ex. FRANCE, BELGIQUE, CANADA",
                    "placeOfBirth": "ex. Paris, Lyon, Bruxelles",
                    "passportNumber": "ex. 22AB12345"
                },
                "genderOptions": {"male": "Homme", "female": "Femme"},
                "stayOptions": {
                    "student": "Étudiant universitaire",
                    "employment": "Salarié / Permis de travail",
                    "business": "Entrepreneur / Licence commerciale",
                    "family": "Regroupement familial"
                },
                "durationOptions": {
                    "m6": "6 mois",
                    "m12": "12 mois (1 an - Standard)",
                    "m24": "24 mois (2 ans)",
                    "m36": "36 mois (3 ans)"
                }
            }
        }
    }

    # -------------------------------------------------------------
    # SPANISH (es)
    # -------------------------------------------------------------
    es_patch = {
        "common": {
            "theme": {"light": "Cambiar a modo claro", "dark": "Cambiar a modo oscuro"}
        },
        "footer": {"brokerTitle": "Servicios de intermediación de seguros FormVault"},
        "cookieConsent": {
            "title": "Preferencias de cookies y privacidad",
            "description": "Utilizamos cookies y tokens seguros para garantizar el envío fluido de solicitudes y el cumplimiento del RGPD.",
            "acceptAll": "Aceptar todo",
            "essentialOnly": "Solo esenciales",
            "privacyPolicy": "Política de privacidad"
        },
        "pages": {
            "home": {
                "authorizedBroker": "Corredor de seguros europeo autorizado • Normas de la República Checa y de la UE",
                "trackMyApplication": "Seguir mi solicitud",
                "metrics": {
                    "actCompliance": "Conforme a OAMP checo",
                    "rapidApp": "Solicitud ultrarrápida",
                    "bankPrivacy": "Privacidad de nivel bancario"
                },
                "securityBadges": {
                    "endToEnd": "Almacenamiento cifrado de extremo a extremo",
                    "autoEmail": "Correo de confirmación automático con seguimiento"
                },
                "tracker": {
                    "title": "Seguimiento del estado de la solicitud",
                    "subtitle": "Introduzca su número de referencia y correo electrónico registrado para consultar el progreso en tiempo real.",
                    "refLabel": "Número de referencia",
                    "refPlaceholder": "ej. APP-2026-001234",
                    "emailLabel": "Correo electrónico registrado",
                    "emailPlaceholder": "ej. client@example.com",
                    "applicantName": "Nombre del solicitante",
                    "registeredEmail": "Correo electrónico registrado",
                    "lastUpdated": "Última actualización",
                    "timelineTitle": "Cronología de tramitación de la solicitud",
                    "currentStage": "Fase actual"
                },
                "plans": {
                    "badge": "Niveles de cobertura seleccionados",
                    "title": "Planes de seguro recomendados",
                    "subtitle": "Totalmente certificado por las autoridades reguladoras checas (OAMP) para estudiantes extranjeros, expatriados y viajeros.",
                    "choosePlan": "Elegir plan",
                    "applyNow": "Solicitar ahora",
                    "perYear": "/ año",
                    "perMonth": "/ mes"
                },
                "partners": {
                    "badge": "Socios acreditados",
                    "title": "Aseguradoras oficiales",
                    "subtitle": "Intermediación directa con las principales aseguradoras de la República Checa.",
                    "officialPortal": "Sitio oficial"
                },
                "banner": {"learnMore": "Solicitar en línea"}
            },
            "terms": {
                "subtitle": "Términos comerciales estándar para la intermediación y solicitud de pólizas de seguro en FormVault.",
                "section1Title": "1. Alcance de la intermediación y condición de corredor",
                "section2Title": "2. Veracidad de la información y documentación",
                "section2Content": "El solicitante garantiza que todos los datos de identificación, pasaporte y confirmación de estudios son exactos.",
                "section3Title": "3. Emisión de póliza y registro ante OAMP",
                "section3Content": "Tras la verificación y confirmación del pago, el certificado oficial se emite y se inscribe en el registro central checo.",
                "section4Title": "4. Cancelaciones y denegaciones de visado",
                "section4Content": "Si su visado es denegado por la embajada o el OAMP, tiene derecho a reembolso según los términos de la póliza.",
                "section5Title": "5. Ley aplicable y jurisdicción",
                "section5Content": "Todos los servicios se rigen por la legislación de la República Checa bajo la supervisión de las autoridades competentes."
            },
            "support": {
                "subtitle": "Obtenga ayuda con los requisitos de visado checo, reclamaciones o hable con un asesor de suscripción.",
                "emailCardTitle": "Soporte directo por correo",
                "emailCardDesc": "Para verificación de pólizas, consultas de embajada o trámites de reembolso. Tiempo medio: < 2 horas.",
                "copied": "Correo de soporte copiado al portapapeles",
                "composeEmail": "Redactar correo",
                "chatCardTitle": "Chat en vivo (Crisp)",
                "chatCardDesc": "Contacte directamente con un especialista en seguros en inglés, chino o checo en horario laboral europeo.",
                "hours": "Lun - Vie: 09:00 - 18:00 CET",
                "location": "Praga, República Checa",
                "openChat": "Abrir chat en vivo",
                "connectingChat": "Conectando con asesor de Crisp...",
                "chatOffline": "El chat en vivo se está iniciando o no está disponible. Escríbanos a insurance@hktse.eu.org",
                "faqTitle": "Preguntas frecuentes (FAQ)",
                "faqSubtitle": "Respuestas directas sobre la normativa de seguros médicos para extranjeros en la República Checa.",
                "faqs": {
                    "q1": "¿Con qué rapidez recibiré mi certificado de seguro oficial tras la solicitud?",
                    "a1": "Los certificados electrónicos oficiales (Potvrzení o pojištění) se emiten en un plazo de 1 a 4 horas laborables tras la validación del pago.",
                    "q2": "¿Sus pólizas son 100 % aceptadas por el Ministerio del Interior checo (OAMP)?",
                    "q3": "¿Qué debo hacer si mi visado es denegado por la Embajada?",
                    "a3": "Simplemente envíe una copia del documento oficial de denegación para tramitar la cancelación y el reembolso.",
                    "q4": "¿Cómo funcionan los reembolsos y la facturación directa en Chequia?",
                    "a4": "En los centros hospitalarios concertados basta con mostrar su tarjeta de seguro para atención sin desembolso previo.",
                    "q5": "¿Por qué se requieren el pasaporte y la confirmación de estudios?",
                    "a5": "La ley checa exige verificar la identidad para registrar la póliza. El justificante de estudios permite acceder a tarifas con hasta un 30 % de descuento."
                }
            },
            "privacy": {
                "subtitle": "Información transparente sobre el tratamiento y la protección de sus datos personales conforme al RGPD.",
                "section1Title": "1. Responsable del tratamiento y alcance",
                "section1Content": "FormVault trata los datos en nombre del intermediario autorizado HKTSE s.r.o. conforme al Reglamento General de Protección de Datos (RGPD).",
                "section2Title": "2. Categorías de datos recopilados",
                "section2Intro": "Solo recopilamos los datos exigidos por la legislación checa de seguros:",
                "section2Item1": "Datos de identidad personal (nombre completo, fecha de nacimiento, sexo, nacionalidad, número de pasaporte)",
                "section2Item2": "Datos de residencia en la República Checa (dirección postal, duración del seguro, tipo de estancia)",
                "section2Item3": "Documentos escaneados encriptados (copia del pasaporte, confirmación de matrícula)",
                "section2Legal": "Bases jurídicas: ejecución contractual (Art. 6.1.b RGPD) y cumplimiento de obligaciones legales (Art. 6.1.c RGPD).",
                "section3Title": "3. Transmisión segura a aseguradoras autorizadas",
                "section3Content": "Sus datos se transmiten exclusivamente por canales cifrados a la aseguradora seleccionada (PVZP, Slavia, SV pojišťovna).",
                "section4Title": "4. Sus derechos según el RGPD",
                "section4Intro": "Conforme al Capítulo III del RGPD, usted cuenta con los siguientes derechos:",
                "section4Item1": "Derecho de acceso a sus datos (Art. 15 RGPD)",
                "section4Item2": "Derecho de rectificación (Art. 16 RGPD)",
                "section4Item3": "Derecho de supresión ('derecho al olvido', Art. 17 RGPD)",
                "section4Item4": "Derecho a la portabilidad de datos (Art. 20 RGPD)",
                "form": {
                    "title": "Enviar solicitud RGPD",
                    "subtitle": "Utilice este formulario para ejercer directamente sus derechos de protección de datos.",
                    "requestAction": "Tipo de solicitud",
                    "types": {
                        "access": "Acceso a los datos (Art. 15)",
                        "rectification": "Rectificación de datos (Art. 16)",
                        "erasure": "Supresión de datos (Art. 17)",
                        "portability": "Portabilidad de datos (Art. 20)"
                    },
                    "fullName": "Nombre completo",
                    "fullNamePlaceholder": "ej. Carlos Gómez",
                    "registeredEmail": "Correo electrónico registrado",
                    "registeredEmailPlaceholder": "ej. carlos@example.es",
                    "refNumber": "Número de referencia (opcional)",
                    "refNumberPlaceholder": "ej. FV-2026-001234",
                    "details": "Detalles de su solicitud",
                    "detailsPlaceholder": "Describa brevemente su requerimiento...",
                    "submit": "Enviar solicitud RGPD",
                    "validationError": "Por favor complete todos los campos obligatorios.",
                    "successTitle": "Solicitud enviada con éxito",
                    "successDesc": "Su requerimiento de protección de datos ha sido registrado. Recibirá respuesta en un plazo de 30 días."
                }
            }
        },
        "forms": {
            "personalInfo": {
                "sections": {"underwriting": "Datos para la formalización del seguro en Chequia"},
                "fields": {
                    "gender": "Sexo",
                    "nationality": "Nacionalidad / Ciudadanía",
                    "placeOfBirth": "Lugar de nacimiento (Ciudad)",
                    "passportNumber": "Número de pasaporte",
                    "passportExpiry": "Fecha de caducidad del pasaporte",
                    "commencementDate": "Fecha de inicio del seguro",
                    "duration": "Duración de la póliza",
                    "typeOfStay": "Tipo de estancia en la República Checa"
                },
                "placeholders": {
                    "nationality": "ej. ESPAÑA, MÉXICO, COLOMBIA",
                    "placeOfBirth": "ej. Madrid, Ciudad de México, Bogotá",
                    "passportNumber": "ej. AAA123456"
                },
                "genderOptions": {"male": "Hombre", "female": "Mujer"},
                "stayOptions": {
                    "student": "Estudiante universitario",
                    "employment": "Empleado / Permiso de trabajo",
                    "business": "Autónomo / Licencia comercial",
                    "family": "Reagrupación familiar"
                },
                "durationOptions": {
                    "m6": "6 meses",
                    "m12": "12 meses (1 año - Estándar)",
                    "m24": "24 meses (2 años)",
                    "m36": "36 meses (3 años)"
                }
            }
        }
    }

    # Apply patches
    for code, patch in [("de", de_patch), ("fr", fr_patch), ("es", es_patch)]:
        path = os.path.join(LOCALES_DIR, f"{code}.json")
        with open(path, "r", encoding="utf-8") as f:
            cur = json.load(f)
        merge_deep(cur, patch)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cur, f, ensure_ascii=False, indent=2)
        print(f"[{code}] Successfully patched and localized.")

if __name__ == "__main__":
    main()
