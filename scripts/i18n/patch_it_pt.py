# -*- coding: utf-8 -*-
"""
Patch for Italian (it) and Portuguese (pt).
Eliminates all 110+ English clones and injects the 26 new underwriting/common keys.
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
    # -------------------------------------------------------------
    # ITALIAN (it)
    # -------------------------------------------------------------
    it_patch = {
        "common": {
            "close": "Chiudi",
            "selectLanguage": "Seleziona lingua",
            "theme": {
                "light": "Passa alla modalità chiara",
                "dark": "Passa alla modalità scura"
            }
        },
        "navigation": {
            "home": "Inizio"
        },
        "stepper": {
            "personalInfoShort": "Dati personali"
        },
        "footer": {
            "brokerTitle": "Servizi di intermediazione assicurativa FormVault",
            "support": "Assistenza & Supporto"
        },
        "cookieConsent": {
            "title": "Informativa sulla privacy & Cookie RGPD",
            "description": "Utilizziamo cookie strettamente necessari per garantire l'invio sicuro della richiesta e la conformità al regolamento europeo (UE) 2016/679 (RGPD). I tuoi documenti sono protetti con crittografia AES-256 GCM.",
            "acceptAll": "Accetta tutti",
            "essentialOnly": "Solo essenziali",
            "privacyPolicy": "Informativa sulla privacy"
        },
        "pages": {
            "home": {
                "features": {
                    "mobile": "Ottimizzato per dispositivi mobili"
                },
                "authorizedBroker": "Broker assicurativo europeo autorizzato • Standard Repubblica Ceca e UE",
                "trackMyApplication": "Verifica stato della mia domanda",
                "metrics": {
                    "actCompliance": "Conforme ai requisiti OAMP ceco",
                    "rapidApp": "Domanda rapida < 3 min",
                    "bankPrivacy": "Privacy di livello bancario"
                },
                "securityBadges": {
                    "endToEnd": "Archiviazione crittografata end-to-end",
                    "autoEmail": "Email di conferma automatica con codice di tracciamento"
                },
                "tracker": {
                    "title": "Verifica stato della domanda",
                    "subtitle": "Inserisci il numero di riferimento e l'email registrata per verificare lo stato di avanzamento in tempo reale.",
                    "refLabel": "Numero di riferimento della domanda",
                    "refPlaceholder": "es. APP-2026-001234",
                    "emailLabel": "Email registrata",
                    "emailPlaceholder": "es. mario.rossi@example.com",
                    "trackButton": "Verifica stato",
                    "tracking": "Ricerca in corso...",
                    "recently": "Recenti",
                    "applicantName": "Nome del richiedente",
                    "submittedOn": "Data di presentazione",
                    "underwritingStatus": "Stato di sottoscrizione",
                    "policyDelivery": "Emissione polizza",
                    "copyRefTooltip": "Copia codice di riferimento negli appunti",
                    "refCopied": "Codice di riferimento copiato!",
                    "notFoundTitle": "Domanda non trovata",
                    "notFoundDesc": "Nessuna polizza corrisponde al numero di riferimento o all'indirizzo email inserito. Si prega di verificare i dati.",
                    "supportNote": "Hai bisogno di assistenza immediata per il visto o la polizza? Contatta il nostro ufficio al broker:",
                    "emailUs": "Inviaci un'email",
                    "historyTitle": "Ricerche recenti"
                },
                "plans": {
                    "badge": "Offerte selezionate",
                    "title": "Piani assicurativi certificati per la Repubblica Ceca",
                    "subtitle": "Conformità garantita al 100% con la Legge sul soggiorno degli stranieri (Legge n. 326/1999 Racc.) per il rilascio del visto di lungo termine e del permesso di soggiorno.",
                    "selectPlan": "Seleziona questo piano",
                    "mostPopular": "Scelta più richiesta",
                    "bestValue": "Miglior rapporto qualità/prezzo",
                    "perYear": "/ anno",
                    "perMonth": "/ mese",
                    "coverageLimit": "Massimale di copertura medica",
                    "repatriation": "Rimpatrio sanitario e d'emergenza",
                    "dentalEmergency": "Pronto soccorso odontoiatrico",
                    "liabilityIncluded": "Responsabilità civile inclusa",
                    "unlimitedHospitalization": "Ricovero ospedaliero completo",
                    "schengenCovered": "Validità nell'intero Spazio Schengen"
                },
                "partners": {
                    "title": "Compagnie assicurative partner ufficiali in Repubblica Ceca",
                    "subtitle": "Tutte le polizze sono registrate direttamente presso il Ministero dell'Interno ceco (OAMP) e la Polizia per gli Stranieri."
                },
                "banner": {
                    "notice": "Avviso Normativo",
                    "lawCompliance": "Assicurazione conforme alla Legge sul soggiorno degli stranieri della Repubblica Ceca (326/1999 Racc.)",
                    "lawDetails": "Tutti i certificati di assicurazione emessi tramite la nostra agenzia soddisfano i requisiti OAMP del Ministero dell'Interno della Repubblica Ceca per visti e permessi di soggiorno a lungo termine."
                }
            },
            "terms": {
                "subtitle": "Condizioni di intermediazione assicurativa fornite da FormVault a Praga, Repubblica Ceca.",
                "section1Title": "1. Oggetto dell'intermediazione e ambito contrattuale",
                "section1Content": "FormVault agisce in qualità di intermediario assicurativo autorizzato nella Repubblica Ceca. I servizi offerti includono la comparazione, la compilazione assistita e l'inoltro delle richieste di polizza sanitaria verso compagnie autorizzate ai sensi della Legge n. 326/1999 Racc.",
                "section2Title": "2. Obblighi del richiedente e veridicità delle dichiarazioni",
                "section2Content": "Il richiedente è tenuto a fornire dati anagrafici, estremi del passaporto e dichiarazioni sanitarie veritieri e conformi alla realtà. Qualsiasi dichiarazione mendace può comportare la nullità della copertura e il rigetto della domanda da parte dell'OAMP ceco.",
                "section3Title": "3. Emissione del certificato e perfezionamento della polizza",
                "section3Content": "La polizza si intende perfezionata esclusivamente a seguito della conferma di pagamento e dell'accettazione da parte della compagnia sottoscrivente. Il certificato ufficiale (Potvrzení o pojištění) verrà trasmesso via email.",
                "section4Title": "4. Diritto di recesso e rimborsi in caso di diniego del visto",
                "section4Content": "In caso di diniego ufficiale del visto o del permesso di soggiorno da parte delle autorità consolari o dell'OAMP, il richiedente ha diritto al rimborso della quota versata, previa trasmissione del provvedimento ufficiale di diniego.",
                "section5Title": "5. Legge applicabile e foro competente",
                "section5Content": "I presenti termini e ogni rapporto contrattuale intermediato sono regolati esclusivamente dalla legge della Repubblica Ceca. Per qualsiasi controversia sarà competente in via esclusiva il Foro di Praga."
            },
            "support": {
                "subtitle": "Assistenza per richieste di polizze, requisiti documentali per visti cechi, gestione rimborsi o chat diretta con un consulente.",
                "emailCardTitle": "Assistenza diretta via Email",
                "emailCardDesc": "Per verifica contrattuale, comunicazioni con le ambasciate o pratiche di rimborso. Tempo medio di risposta: < 2 ore.",
                "copyBtn": "Copia",
                "copied": "Email di supporto copiata negli appunti: insurance@hktse.eu.org",
                "composeEmail": "Invia un'email",
                "chatCardTitle": "Chat con consulente (Crisp)",
                "chatCardDesc": "Parla direttamente con un intermediario assicurativo autorizzato in inglese, cinese o ceco. Assistenza immediata negli orari di lavoro europei.",
                "hours": "Lun - Ven: 09:00 - 18:00 CET",
                "location": "Praga, Repubblica Ceca",
                "openChat": "Avvia chat dal vivo",
                "chatOffline": "La chat dal vivo si sta inizializzando o è offline. Scrivici direttamente a insurance@hktse.eu.org",
                "faqTitle": "Domande Frequenti",
                "faqSubtitle": "Risposte rapide sui requisiti assicurativi per stranieri nella Repubblica Ceca.",
                "faqs": {
                    "q1": "Quanto tempo occorre per ricevere il certificato ufficiale?",
                    "a1": "Il certificato elettronico ufficiale (Potvrzení o pojištění) viene emesso entro 1-4 ore lavorative dalla conferma del pagamento. Riceverai il PDF autenticato via email pronto per l'OAMP.",
                    "q2": "Le vostre polizze sono pienamente accettate dall'OAMP ceco?",
                    "a2": "Sì, tutte le polizze intermediate tramite la nostra agenzia sono pienamente conformi alla Legge 326/1999 Racc. e registrate nel registro centrale ceco.",
                    "q3": "Cosa succede se la mia domanda di visto viene respinta dall'Ambasciata?",
                    "a3": "In caso di rigetto ufficiale, hai diritto al rimborso in base alle condizioni generali della compagnia. È sufficiente trasmettere la copia del diniego consolare a insurance@hktse.eu.org.",
                    "q4": "Come funziona il rimborso delle spese mediche in Repubblica Ceca?",
                    "a4": "Negli ospedali e cliniche convenzionate (es. Motol, FNKV, VFN a Praga), è sufficiente esibire la tessera per la presa in carico diretta. Nelle strutture non convenzionate, si paga la fattura e si ottiene il rimborso entro 14 giorni.",
                    "q5": "Perché è necessario caricare il passaporto e il certificato di studio?",
                    "a5": "La legge ceca richiede l'identificazione certa del cittadino straniero ai fini dell'emissione del contratto. Il documento universitario consente inoltre di beneficiare dello sconto studenti (fino al 30%)."
                }
            },
            "privacy": {
                "subtitle": "Informativa sul trattamento, la crittografia e la protezione dei dati personali per le domande di assicurazione in Repubblica Ceca e UE.",
                "section1Title": "1. Titolare del trattamento dei dati",
                "section1Content": "Il titolare del trattamento dei dati personali è il servizio di intermediazione FormVault a Praga, Repubblica Ceca. Per qualsiasi richiesta relativa alla privacy o per contattare il nostro Responsabile della protezione dei dati (DPO): insurance@hktse.eu.org.",
                "section2Title": "2. Finalità del trattamento e base giuridica",
                "section2Intro": "Raccogliamo e trattiamo i tuoi dati identificativi (nome, data di nascita, passaporto, status universitario, indirizzo) esclusivamente per:",
                "section2Item1": "La stipula e l'emissione di contratti di assicurazione sanitaria e viaggio con compagnie autorizzate;",
                "section2Item2": "La conformità alla Legge sul soggiorno degli stranieri della Repubblica Ceca (Legge n. 326/1999 Racc., requisiti OAMP);",
                "section2Item3": "La conservazione a fini di vigilanza e prevenzione delle frodi secondo la normativa assicurativa ceca.",
                "section2Legal": "Base giuridica: Articolo 6, par. 1, lett. b) RGPD (esecuzione di un contratto) e lett. c) RGPD (obblighi legali).",
                "section3Title": "3. Crittografia hardware e archiviazione sicura",
                "section3Content": "Tutti i documenti e le informazioni anagrafiche sono crittografati a riposo con algoritmo AES-256 GCM e vettori di inizializzazione unici. I database sono isolati e le trasmissioni avvengono mediante protocollo TLS 1.3.",
                "section4Title": "4. I tuoi diritti ai sensi del RGPD (Artt. 15-22)",
                "section4Intro": "In qualità di interessato, godi dei seguenti diritti statutari:",
                "section4Item1": "Diritto di accesso (Art. 15): richiedere una copia dei tuoi dati conservati;",
                "section4Item2": "Diritto di rettifica (Art. 16): correggere dati inesatti o incompleti;",
                "section4Item3": "Diritto alla cancellazione (Art. 17): richiedere la cancellazione dei dati nei limiti previsti dai termini di conservazione obbligatori;",
                "section4Item4": "Diritto alla portabilità dei dati (Art. 20): ricevere i propri dati in formato strutturato di uso comune.",
                "form": {
                    "title": "Esercita i tuoi diritti RGPD",
                    "subtitle": "Invia una richiesta formale al nostro Responsabile della protezione dei dati. Risponderemo entro 30 giorni come stabilito dalla legge UE.",
                    "requestAction": "Tipo di richiesta",
                    "types": {
                        "access": "Diritto di accesso (Esporta i miei dati)",
                        "rectification": "Diritto di rettifica (Correggi errori)",
                        "erasure": "Diritto alla cancellazione (Elimina i miei documenti)",
                        "portability": "Portabilità dei dati (Copia strutturata)"
                    },
                    "fullName": "Nome e cognome legale",
                    "fullNamePlaceholder": "es. Mario Rossi",
                    "registeredEmail": "Email registrata",
                    "registeredEmailPlaceholder": "es. mario@example.it",
                    "refNumber": "Numero di riferimento pratica (opzionale)",
                    "refNumberPlaceholder": "es. APP-2026-001234",
                    "details": "Note o dettagli della richiesta",
                    "detailsPlaceholder": "Descrivi i documenti o le modifiche richieste...",
                    "submit": "Invia richiesta RGPD",
                    "submitting": "Invio in corso...",
                    "validationError": "Compila tutti i campi obbligatori.",
                    "successTitle": "Richiesta registrata con successo",
                    "successDesc": "La tua richiesta è stata inoltrata al Responsabile della protezione dei dati. Riceverai riscontro entro 30 giorni."
                }
            }
        },
        "forms": {
            "personalInfo": {
                "sections": {
                    "underwriting": "Dati per la sottoscrizione della polizza (Registro assicurativo ceco)"
                },
                "fields": {
                    "gender": "Genere",
                    "nationality": "Nazionalità / Cittadinanza",
                    "placeOfBirth": "Luogo di nascita (Città)",
                    "passportNumber": "Numero di passaporto",
                    "passportExpiry": "Data di scadenza del passaporto",
                    "commencementDate": "Data di inizio dell'assicurazione",
                    "duration": "Durata della polizza",
                    "typeOfStay": "Tipo di soggiorno nella Repubblica Ceca"
                },
                "placeholders": {
                    "nationality": "es. ITALIA, BRASILE, CINA",
                    "placeOfBirth": "es. Roma, Milano, Napoli",
                    "passportNumber": "es. YA1234567"
                },
                "genderOptions": {
                    "male": "Maschio",
                    "female": "Femmina"
                },
                "stayOptions": {
                    "student": "Studente universitario",
                    "employment": "Lavoro / Permesso di soggiorno per lavoro",
                    "business": "Attività autonoma / Partita IVA ceca",
                    "family": "Ricongiungimento familiare"
                },
                "durationOptions": {
                    "m6": "6 mesi",
                    "m12": "12 mesi (1 anno - Standard)",
                    "m24": "24 mesi (2 anni)",
                    "m36": "36 mesi (3 anni)"
                }
            }
        }
    }

    # -------------------------------------------------------------
    # PORTUGUESE (pt)
    # -------------------------------------------------------------
    pt_patch = {
        "common": {
            "close": "Fechar",
            "selectLanguage": "Selecionar idioma",
            "theme": {
                "light": "Alternar para modo claro",
                "dark": "Alternar para modo escuro"
            }
        },
        "stepper": {
            "personalInfoShort": "Dados pessoais"
        },
        "footer": {
            "brokerTitle": "Serviços de Corretagem de Seguros FormVault",
            "support": "Apoio ao Cliente & Suporte"
        },
        "cookieConsent": {
            "title": "Aviso de Cookies e Privacidade RGPD",
            "description": "Utilizamos cookies estritamente necessários para assegurar o envio encriptado e a conformidade com o Regulamento (UE) 2016/679 (RGPD). Os seus documentos são salvaguardados com encriptação AES-256 GCM.",
            "acceptAll": "Aceitar todos",
            "essentialOnly": "Apenas essenciais",
            "privacyPolicy": "Política de Privacidade"
        },
        "pages": {
            "home": {
                "authorizedBroker": "Corretor de seguros europeu autorizado • Padrões da República Checa e UE",
                "trackMyApplication": "Consultar o estado da candidatura",
                "metrics": {
                    "actCompliance": "Conforme aos critérios OAMP checo",
                    "rapidApp": "Candidatura rápida < 3 min",
                    "bankPrivacy": "Privacidade de nível bancário"
                },
                "securityBadges": {
                    "endToEnd": "Armazenamento encriptado ponto a ponto",
                    "autoEmail": "Email de confirmação automático com código de rastreio"
                },
                "tracker": {
                    "title": "Consultar estado da candidatura",
                    "subtitle": "Introduza o número de referência e o email registado para verificar o progresso em tempo real.",
                    "refLabel": "Número de referência da candidatura",
                    "refPlaceholder": "ex. APP-2026-001234",
                    "emailLabel": "Email registado",
                    "emailPlaceholder": "ex. cliente@exemplo.pt",
                    "trackButton": "Consultar estado",
                    "tracking": "A pesquisar...",
                    "recently": "Recente",
                    "applicantName": "Nome do requerente",
                    "submittedOn": "Data de submissão",
                    "underwritingStatus": "Estado de subscrição",
                    "policyDelivery": "Emissão da apólice",
                    "copyRefTooltip": "Copiar código de referência",
                    "refCopied": "Código copiado para a área de transferência!",
                    "notFoundTitle": "Candidatura não encontrada",
                    "notFoundDesc": "Nenhuma apólice encontrada com os dados facultados. Por favor, confirme as informações.",
                    "supportNote": "Necessita de apoio urgente para o seu visto checo ou apólice? Contacte o nosso escritório:",
                    "emailUs": "Envie-nos um email",
                    "historyTitle": "Pesquisas recentes"
                },
                "plans": {
                    "badge": "Planos selecionados",
                    "title": "Planos de seguro certificados para a República Checa",
                    "subtitle": "Garantia de 100% de aceitação perante a Lei de Residência de Estrangeiros (Lei n.º 326/1999) para emissão de visto de longa duração e autorização de residência.",
                    "selectPlan": "Selecionar este plano",
                    "mostPopular": "Mais procurado",
                    "bestValue": "Melhor custo-benefício",
                    "perYear": "/ ano",
                    "perMonth": "/ mês",
                    "coverageLimit": "Limite de cobertura médica",
                    "repatriation": "Repatriação e emergência médica",
                    "dentalEmergency": "Atendimento odontológico de urgência",
                    "liabilityIncluded": "Responsabilidade civil incluída",
                    "unlimitedHospitalization": "Internamento hospitalar integral",
                    "schengenCovered": "Válido em todo o Espaço Schengen"
                },
                "partners": {
                    "title": "Seguradoras parceiras oficiais na República Checa",
                    "subtitle": "Todas as apólices são emitidas e registadas diretamente junto do Ministério do Interior checo (OAMP) e da Polícia de Estrangeiros."
                },
                "banner": {
                    "notice": "Aviso Regulamentar",
                    "lawCompliance": "Seguro em conformidade com a Lei de Residência de Estrangeiros da Chéquia (326/1999)",
                    "lawDetails": "Todos os certificados de seguro emitidos através da nossa agência cumprem os requisitos mais recentes do OAMP do Ministério do Interior checo para vistos e autorizações de residência."
                }
            },
            "terms": {
                "subtitle": "Condições de intermediação de seguros prestados pela FormVault em Praga, República Checa.",
                "section1Title": "1. Objeto da mediação e âmbito do serviço",
                "section1Content": "A FormVault atua como intermediária de seguros autorizada na República Checa. Os serviços abrangem a comparação, assistência ao preenchimento e encaminhamento de pedidos de seguros de saúde para seguradoras licenciadas segundo a Lei n.º 326/1999.",
                "section2Title": "2. Responsabilidades do requerente e veracidade das declarações",
                "section2Content": "O requerente compromete-se a fornecer dados de identificação, passaporte e histórico de saúde fidedignos. Declarações falsas podem invalidar o contrato e originar recusa do visto pelo OAMP.",
                "section3Title": "3. Emissão do certificado e formalização da apólice",
                "section3Content": "A apólice considera-se contratada após confirmação do pagamento e aceitação técnica pela seguradora. O certificado eletrónico oficial (Potvrzení o pojištění) será enviado por correio eletrónico.",
                "section4Title": "4. Direito de rescisão e reembolsos por indeferimento de visto",
                "section4Content": "Em caso de recusa formal do visto ou autorização de residência pelas autoridades consulares ou OAMP, o requerente tem direito ao reembolso de acordo com as condições da seguradora, mediante envio da prova de recusa.",
                "section5Title": "5. Lei aplicável e foro competente",
                "section5Content": "Os presentes termos regem-se exclusivamente pela legislação da República Checa. Qualquer litígio será dirimido pelos tribunais competentes de Praga, República Checa."
            },
            "support": {
                "subtitle": "Obtenha apoio com candidaturas, requisitos de vistos checos, processos de reembolso ou converse em tempo real com um mediador.",
                "emailCardTitle": "Comunicação direta por Email",
                "emailCardDesc": "Para confirmação de apólice, esclarecimentos com embaixadas ou formulários de reembolso. Resposta média: < 2 horas.",
                "copyBtn": "Copiar",
                "copied": "Email de suporte copiado para a área de transferência: insurance@hktse.eu.org",
                "composeEmail": "Compor Email",
                "chatCardTitle": "Chat de Atendimento (Crisp)",
                "chatCardDesc": "Fale em direto com um especialista em inglês, chinês ou checo. Atendimento célere durante o horário comercial europeu.",
                "hours": "Seg - Sex: 09:00 - 18:00 CET",
                "location": "Praga, Chéquia",
                "openChat": "Iniciar Chat",
                "chatOffline": "O chat ao vivo está a iniciar ou encontra-se temporariamente indisponível. Contacte-nos através de insurance@hktse.eu.org",
                "faqTitle": "Perguntas Frequentes",
                "faqSubtitle": "Respostas rápidas sobre as exigências de seguro de saúde para estrangeiros na Chéquia.",
                "faqs": {
                    "q1": "Com que rapidez recebo o certificado oficial após submissão?",
                    "a1": "Os certificados eletrónicos oficiais (Potvrzení o pojištění) são emitidos entre 1 e 4 horas úteis após a liquidação e validação. Receberá o ficheiro PDF assinado digitalmente no seu email.",
                    "q2": "As vossas apólices são 100% aceites pelo OAMP checo?",
                    "a2": "Sim, todas as apólices cumprem rigorosamente a Lei 326/1999 e são aceites pelo Ministério do Interior da República Checa.",
                    "q3": "O que fazer se o meu visto for recusado pela Embaixada?",
                    "a3": "Em caso de indeferimento oficial, basta enviar o comprovativo do OAMP/Embaixada para insurance@hktse.eu.org para solicitar o cancelamento e reembolso.",
                    "q4": "Como funciona o reembolso e comparticipação médica na Chéquia?",
                    "a4": "Nos hospitais da rede convencionada da seguradora (ex. Motol, FNKV, VFN em Praga), basta apresentar o cartão de seguro. Em clínicas privadas não convencionadas, efetue o pagamento e solicite o reembolso no prazo de 14 dias.",
                    "q5": "Por que motivo são pedidos o passaporte e o comprovativo de estudante?",
                    "a5": "A legislação checa exige a verificação inequívoca da identidade de cidadãos estrangeiros para registo central. O comprovativo de estudante garante acesso a tarifas com desconto universitário de até 30%."
                }
            },
            "privacy": {
                "subtitle": "Declaração oficial sobre recolha, tratamento, encriptação e proteção de dados para seguros na Chéquia e União Europeia.",
                "section1Title": "1. Identificação do Responsável pelo Tratamento",
                "section1Content": "O responsável pelo tratamento dos seus dados pessoais é o serviço de corretagem FormVault (com sede em Praga, República Checa). Para qualquer dúvida ou para contactar o Encarregado da Proteção de Dados (DPO): insurance@hktse.eu.org.",
                "section2Title": "2. Finalidades do Tratamento e Base Jurídica",
                "section2Intro": "Recolhemos os seus dados (Nome, Data de Nascimento, Cópia de Passaporte, Situação Académica, Morada) exclusivamente para:",
                "section2Item1": "Contratação e emissão de seguros de saúde e viagem com seguradoras parceiras;",
                "section2Item2": "Cumprimento das obrigações da Lei de Residência de Estrangeiros na República Checa (Lei n.º 326/1999, regras OAMP);",
                "section2Item3": "Auditorias legais, prevenção contra fraudes e arquivo regulatório.",
                "section2Legal": "Base jurídica: Artigo 6.º, n.º 1, alínea b) do RGPD (execução contratual) e alínea c) (obrigação legal).",
                "section3Title": "3. Encriptação de Alta Segurança e Armazenamento Protegido",
                "section3Content": "Todos os documentos e registos transmitidos à FormVault são protegidos em repouso com encriptação AES-256 GCM com vetores de inicialização únicos. Acesso estritamente isolado e comunicações por TLS 1.3.",
                "section4Title": "4. Direitos do Titular dos Dados (Artigos 15.º a 22.º do RGPD)",
                "section4Intro": "Enquanto requerente, assistem-lhe os seguintes direitos legais:",
                "section4Item1": "Direito de Acesso (Art. 15.º): solicitar cópia dos seus dados registados;",
                "section4Item2": "Direito de Retificação (Art. 16.º): corrigir dados incorretos ou incompletos;",
                "section4Item3": "Direito ao Apagamento (Art. 17.º): solicitar a eliminação dos seus documentos, salvaguardados os prazos legais de conservação;",
                "section4Item4": "Direito à Portabilidade (Art. 20.º): obter os seus dados estruturados em formato legível por máquina.",
                "form": {
                    "title": "Exercer Direitos RGPD",
                    "subtitle": "Submeta um pedido formal ao nosso Encarregado da Proteção de Dados. Daremos seguimento no prazo máximo de 30 dias.",
                    "requestAction": "Ação pretendida",
                    "types": {
                        "access": "Direito de Acesso (Exportar Dados)",
                        "rectification": "Direito de Retificação (Corrigir Erros)",
                        "erasure": "Direito ao Apagamento (Eliminar Documentos)",
                        "portability": "Portabilidade de Dados (Cópia Estruturada)"
                    },
                    "fullName": "Nome Legal Completo",
                    "fullNamePlaceholder": "ex. João Silva",
                    "registeredEmail": "Email Registado",
                    "registeredEmailPlaceholder": "ex. joao@exemplo.pt",
                    "refNumber": "N.º de Referência da Candidatura (Opcional)",
                    "refNumberPlaceholder": "ex. APP-2026-001234",
                    "details": "Pormenores do Pedido",
                    "detailsPlaceholder": "Especifique que dados ou correções pretende solicitar...",
                    "submit": "Submeter Pedido RGPD",
                    "submitting": "A submeter...",
                    "validationError": "Por favor, preencha o nome completo e o email registado.",
                    "successTitle": "Pedido Registado com Sucesso",
                    "successDesc": "O seu pedido de proteção de dados foi registado. O nosso DPO irá analisar a solicitação no prazo de 30 dias."
                }
            }
        },
        "forms": {
            "personalInfo": {
                "sections": {
                    "underwriting": "Dados para a subscrição da apólice (Registo de Seguros da Chéquia)"
                },
                "fields": {
                    "gender": "Gênero",
                    "nationality": "Nacionalidade / Cidadania",
                    "placeOfBirth": "Local de nascimento (Cidade)",
                    "passportNumber": "Número do passaporte",
                    "passportExpiry": "Data de validade do passaporte",
                    "commencementDate": "Data de início do seguro",
                    "duration": "Duração do seguro",
                    "typeOfStay": "Tipo de permanência na Chéquia"
                },
                "placeholders": {
                    "nationality": "ex. BRASIL, PORTUGAL, ANGOLA",
                    "placeOfBirth": "ex. São Paulo, Lisboa, Rio de Janeiro",
                    "passportNumber": "ex. CS123456"
                },
                "genderOptions": {
                    "male": "Masculino",
                    "female": "Feminino"
                },
                "stayOptions": {
                    "student": "Estudante universitário",
                    "employment": "Trabalho / Autorização de residência para trabalho",
                    "business": "Atividade independente / Comércio",
                    "family": "Reagrupamento familiar"
                },
                "durationOptions": {
                    "m6": "6 meses",
                    "m12": "12 meses (1 ano - Padrão)",
                    "m24": "24 meses (2 anos)",
                    "m36": "36 meses (3 anos)"
                }
            }
        }
    }

    for code, patch in [("it", it_patch), ("pt", pt_patch)]:
        path = os.path.join(LOCALES_DIR, f"{code}.json")
        with open(path, "r", encoding="utf-8") as f:
            cur = json.load(f)
        merge_deep(cur, patch)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cur, f, ensure_ascii=False, indent=2)
        print(f"[{code}] Successfully updated full translation patch.")

if __name__ == "__main__":
    main()
