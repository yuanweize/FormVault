# -*- coding: utf-8 -*-
"""
Patch for Japanese (ja) and Korean (ko).
Delivers 100% native, respectful, and legally sound localizations for East Asian clients.
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
    # JAPANESE (ja)
    # -------------------------------------------------------------
    ja_patch = {
        "common": {
            "close": "閉じる",
            "selectLanguage": "言語を選択",
            "theme": {
                "light": "ライトモードに切り替え",
                "dark": "ダークモードに切り替え"
            }
        },
        "navigation": {
            "home": "ホーム"
        },
        "stepper": {
            "personalInfoShort": "個人情報"
        },
        "footer": {
            "brokerTitle": "FormVault 保険仲介・引受サービス",
            "support": "カスタマーサポート"
        },
        "cookieConsent": {
            "title": "CookieおよびGDPRプライバシー設定",
            "description": "安全な書類送信とEU一般データ保護規則（GDPR 2016/679）遵守のため、必須Cookieを使用しています。お客様のデータはAES-256 GCMで暗号化されます。",
            "acceptAll": "すべて同意する",
            "essentialOnly": "必須のみ同意",
            "privacyPolicy": "プライバシーポリシー"
        },
        "pages": {
            "home": {
                "features": {
                    "mobile": "モバイル最適化"
                },
                "authorizedBroker": "チェコ共和国・EU基準公認 保険ブローカー",
                "trackMyApplication": "申請状況を確認する",
                "metrics": {
                    "actCompliance": "チェコ内務省OAMP完全準拠",
                    "rapidApp": "3分でスピード申請",
                    "bankPrivacy": "銀行レベルの機密保護"
                },
                "securityBadges": {
                    "endToEnd": "エンドツーエンド暗号化ストレージ",
                    "autoEmail": "照会コード付き自動確認メール"
                },
                "tracker": {
                    "title": "申請状況の追跡照会",
                    "subtitle": "申請参照番号と登録メールアドレスを入力して、現在の進行状況をリアルタイムで確認できます。",
                    "refLabel": "申請参照番号",
                    "refPlaceholder": "例：APP-2026-001234",
                    "emailLabel": "登録メールアドレス",
                    "emailPlaceholder": "例：tanaka@example.jp",
                    "trackButton": "状況を確認",
                    "tracking": "照会中...",
                    "recently": "最近の履歴",
                    "applicantName": "申請者氏名",
                    "registeredEmail": "登録メールアドレス",
                    "submittedOn": "提出日時",
                    "underwritingStatus": "引受・審査状況",
                    "policyDelivery": "保険証券発行",
                    "timelineTitle": "申請処理のタイムライン",
                    "currentStage": "現在のステージ",
                    "lastUpdated": "最終更新",
                    "copyRefTooltip": "参照番号をコピー",
                    "refCopied": "参照番号をクリップボードにコピーしました！",
                    "notFoundTitle": "申請が見つかりません",
                    "notFoundDesc": "入力された参照番号またはメールアドレスに一致する記録がありません。入力内容をご確認ください。",
                    "supportNote": "チェコビザや保険に関して緊急のサポートが必要ですか？ブローカー窓口までご連絡ください：",
                    "emailUs": "メールで問い合わせ",
                    "historyTitle": "最近の照会履歴"
                },
                "plans": {
                    "badge": "厳選プラン",
                    "title": "チェコ共和国 認可外国人保険プラン",
                    "subtitle": "長期ビザおよび滞在許可の取得要件（チェコ外国人滞在法 第326/1999号）を100%満たす公式保険。",
                    "selectPlan": "このプランを選択",
                    "choosePlan": "プランを選択して申請",
                    "applyNow": "今すぐ申請する",
                    "mostPopular": "一番人気",
                    "bestValue": "最もお得",
                    "perYear": "/ 年",
                    "perMonth": "/ 月",
                    "coverageLimit": "医療費補償限度額",
                    "repatriation": "本国送還・緊急医療搬送",
                    "dentalEmergency": "緊急歯科治療",
                    "liabilityIncluded": "個人賠償責任保険を含む",
                    "unlimitedHospitalization": "チェコ国内での入院補償完備",
                    "schengenCovered": "全シェンゲン協定国で有効"
                },
                "partners": {
                    "badge": "公式提携引受会社",
                    "title": "チェコ共和国 公式保険引受会社",
                    "subtitle": "すべての保険証券はチェコ内務省（OAMP）および外国人警察の公的台帳に直接登録されます。",
                    "officialPortal": "公式ポータル"
                },
                "banner": {
                    "notice": "規制に関するお知らせ",
                    "lawCompliance": "チェコ外国人滞在法（法律番号 326/1999 Coll.）準拠保険",
                    "lawDetails": "当代理店を通じて発行されるすべての保険証書は、長期ビザおよび居住許可申請に関するチェコ内務省OAMPの最新要件を完全に満たしています。",
                    "learnMore": "オンラインで申請"
                }
            },
            "terms": {
                "subtitle": "チェコ・プラハにおいてFormVaultが提供する保険仲介サービスの利用規約。",
                "section1Title": "1. 仲介業務および契約範囲",
                "section1Content": "FormVaultはチェコ共和国において公認された保険仲介者として業務を行っています。本サービスは、チェコ法律第326/1999号に基づく正規引受保険会社への比較、申請サポート、契約取次を含みます。",
                "section2Title": "2. 申請者の責任および申告内容の真実性",
                "section2Content": "申請者は、正確かつ真正な個人情報、旅券情報、健康状態を申告するものとします。虚偽の申告は保険契約の無効およびチェコ内務省（OAMP）によるビザ却下の原因となります。",
                "section3Title": "3. 保険証書の発行および契約成立",
                "section3Content": "保険契約は、保険料の入金確認および保険会社による引受審査の完了をもって成立します。公式電子証明書（Potvrzení o pojištění）はメールにて送付されます。",
                "section4Title": "4. ビザ却下時の契約解除および返金",
                "section4Content": "在外公館またはチェコ内務省によりビザ・滞在許可が正式に却下された場合、公式却下通知書の提出により、各保険会社の解約約款に基づき返金を受ける権利を有します。",
                "section5Title": "5. 準拠法および管轄裁判所",
                "section5Content": "本規約および本サービスを通じて仲介される一切の契約は、チェコ共和国の法令に準拠します。一切の紛争はプラハの管轄裁判所を専属的管轄裁判所とします。"
            },
            "support": {
                "subtitle": "保険の申請、チェコビザの必要書類、保険金請求、または専任アドバイザーとのオンラインチャットをご利用いただけます。",
                "emailCardTitle": "メールでのお問い合わせ",
                "emailCardDesc": "保険証券の照会、大使館提出書類の確認、ビザ却下時の返金申請など。平均返答時間：2時間以内。",
                "copyBtn": "コピー",
                "copied": "サポートメールをコピーしました：insurance@hktse.eu.org",
                "composeEmail": "メールを作成する",
                "chatCardTitle": "アドバイザーチャット（Crisp）",
                "chatCardDesc": "英語・中国語・チェコ語対応の公認保険スペシャリストと直接対話できます。欧州営業時間内に即時対応。",
                "hours": "月 - 金: 09:00 - 18:00 CET（欧州時間）",
                "location": "チェコ共和国 プラハ",
                "openChat": "ライブチャットを開始",
                "chatOffline": "ライブチャットは初期化中または現在オフラインです。insurance@hktse.eu.org まで直接メールをお送りください。",
                "faqTitle": "よくあるご質問（FAQ）",
                "faqSubtitle": "チェコ共和国における外国人向け保険に関する主な回答。",
                "faqs": {
                    "q1": "申請後、公式な保険証書はどれくらいで届きますか？",
                    "a1": "お支払いと引受確認完了後、通常1〜4営業時間以内に電子保険証明書（Potvrzení o pojištění）が発行され、ビザ申請用契約番号付きPDFが登録メール宛に届きます。",
                    "q2": "保険はチェコ内務省（OAMP）に100%承認されますか？",
                    "a2": "はい。当代理店が取り扱う保険はチェコ外国人滞在法（第326/1999号）に完全準拠し、内務省の公式中央台帳に登録されます。",
                    "q3": "大使館でビザが却下された場合はどうなりますか？",
                    "a3": "万が一ビザや滞在許可が却下された場合は、大使館またはOAMPからの正式な却下通知書のコピーを insurance@hktse.eu.org に送付いただくことで、保険料の解約・返金手続きを行います。",
                    "q4": "チェコ現地での医療費直接請求やキャッシュレス診療はどう利用しますか？",
                    "a4": "保険会社の提携病院（プラハのモトール病院、FNKV、VFN、ブルノのFNなど）では、保険カードを提示するだけでキャッシュレスで受診できます。非提携機関の場合は一旦立て替えて領収書と診断書を提出すれば、14日以内に払い戻されます。",
                    "q5": "なぜパスポートと学生証の提出が必要なのですか？",
                    "a5": "チェコの保険業法により、内務省登録のために外国人の本人確認が義務付けられています。また、学生証の提出により学生割引料金（最大30%オフ）が適用されます。"
                }
            },
            "privacy": {
                "subtitle": "チェコ共和国およびEUにおける個人情報の収集・暗号化・保護に関する公式方針。",
                "section1Title": "1. 個人データ管理者",
                "section1Content": "お客様の個人データを取り扱うデータ管理者は、FormVault保険仲介サービス（チェコ共和国プラハ）です。プライバシーに関するお問い合わせまたはDPO窓口：insurance@hktse.eu.org",
                "section2Title": "2. データ処理の目的および法的根拠",
                "section2Intro": "当社は、以下の正当な目的のためにお客様の個人情報（氏名、生年月日、旅券写し、学生証、住所等）を収集・処理します：",
                "section2Item1": "認可保険会社との健康・旅行保険契約の締結および証券発行；",
                "section2Item2": "チェコ外国人滞在法（法律番号 326/1999 Coll.、OAMP規制）の遵守；",
                "section2Item3": "監査対応、不正防止、およびチェコ保険法に基づく公的アーカイブ保管。",
                "section2Legal": "法的根拠：GDPR第6条第1項(b)（契約の履行）および第6条第1項(c)（法的義務の遵守）。",
                "section3Title": "3. 暗号化およびゼロノウレッジ高水準セキュリティ",
                "section3Content": "提出されたすべての旅券画像、身分証明書、個人記録は、固有のIVを用いたAES-256 GCM認証付き暗号化により保管されます。データベースは公共インターネットから隔離され、TLS 1.3通信で保護されています。",
                "section4Title": "4. GDPRに基づくお客様の権利（第15条〜第22条）",
                "section4Intro": "お客様にはEU法令に基づき、以下の権利が保障されています：",
                "section4Item1": "アクセス権（第15条）：保管されている個人データの開示請求；",
                "section4Item2": "訂正権（第16条）：不正確または不完全なデータの修正；",
                "section4Item3": "消去権（第17条）：法令で定められた保存義務期間終了後の書類削除；",
                "section4Item4": "データポータビリティ権（第20条）：機械可読な形式でのデータ受領。",
                "form": {
                    "title": "GDPRに基づく権利の行使",
                    "subtitle": "当社のデータ保護責任者（DPO）宛に正式なデータ請求を送信できます。EU法に基づき30日以内に処理結果をご連絡します。",
                    "requestAction": "請求の種類",
                    "types": {
                        "access": "アクセス権（データのエクスポート）",
                        "rectification": "訂正権（誤りの修正）",
                        "erasure": "消去権（提出書類の削除）",
                        "portability": "データポータビリティ（構造化コピー）"
                    },
                    "fullName": "氏名（公的登録名）",
                    "fullNamePlaceholder": "例：山田 太郎",
                    "registeredEmail": "登録メールアドレス",
                    "registeredEmailPlaceholder": "例：taro@example.jp",
                    "refNumber": "申請参照番号（任意）",
                    "refNumberPlaceholder": "例：APP-2026-001234",
                    "details": "ご要望の詳細・注記",
                    "detailsPlaceholder": "対象となる書類や具体的な修正内容を記入してください...",
                    "submit": "GDPR請求を送信する",
                    "submitting": "送信中...",
                    "validationError": "氏名と登録メールアドレスを正しく入力してください。",
                    "successTitle": "請求を正常に受け付けました",
                    "successDesc": "法的請求が登録されました。データ保護責任者が本人確認を行った上で30日以内に対応いたします。"
                }
            }
        },
        "forms": {
            "personalInfo": {
                "sections": {
                    "underwriting": "保険引受および契約仕様（チェコ保険登録データ）"
                },
                "fields": {
                    "gender": "性別",
                    "nationality": "国籍 / 市民権",
                    "placeOfBirth": "出生地（都市）",
                    "passportNumber": "パスポート番号",
                    "passportExpiry": "パスポート有効期限",
                    "commencementDate": "保険開始日",
                    "duration": "保険期間",
                    "typeOfStay": "チェコ滞在種別"
                },
                "placeholders": {
                    "nationality": "例：日本、中国、アメリカ",
                    "placeOfBirth": "例：東京、大阪、プラハ",
                    "passportNumber": "例：TR1234567"
                },
                "genderOptions": {
                    "male": "男性",
                    "female": "女性"
                },
                "stayOptions": {
                    "student": "大学留学生",
                    "employment": "就労 / 労働許可",
                    "business": "自営業 / 営業許可 (Živnostenský list)",
                    "family": "家族呼び寄せ / 家族滞在"
                },
                "durationOptions": {
                    "m6": "6ヶ月",
                    "m12": "12ヶ月（1年間 - 標準）",
                    "m24": "24ヶ月（2年間）",
                    "m36": "36ヶ月（3年間）"
                }
            }
        }
    }

    # -------------------------------------------------------------
    # KOREAN (ko)
    # -------------------------------------------------------------
    ko_patch = {
        "common": {
            "close": "닫기",
            "selectLanguage": "언어 선택",
            "theme": {
                "light": "라이트 모드로 전환",
                "dark": "다크 모드로 전환"
            }
        },
        "navigation": {
            "home": "홈"
        },
        "stepper": {
            "personalInfoShort": "개인 정보"
        },
        "footer": {
            "brokerTitle": "FormVault 보험 중개 및 인수 서비스",
            "support": "고객 지원 센터"
        },
        "cookieConsent": {
            "title": "쿠키 및 GDPR 개인정보 보호 고지",
            "description": "안전한 신청서 전송 및 EU 일반 데이터 보호 규정(GDPR 2016/679) 준수를 위해 필수 쿠키를 사용합니다. 모든 서류는 AES-256 GCM으로 안전하게 암호화됩니다.",
            "acceptAll": "모두 동의",
            "essentialOnly": "필수 항목만 동의",
            "privacyPolicy": "개인정보 처리방침"
        },
        "pages": {
            "home": {
                "features": {
                    "mobile": "모바일 환경 최적화"
                },
                "authorizedBroker": "체코공화국 및 EU 표준 공인 보험 중개사",
                "trackMyApplication": "신청 진행 상황 조회",
                "metrics": {
                    "actCompliance": "체코 내무부 OAMP 요건 완전 충족",
                    "rapidApp": "3분 빠른 간편 신청",
                    "bankPrivacy": "금융권 수준 보안 및 암호화"
                },
                "securityBadges": {
                    "endToEnd": "종단간 암호화 보안 스토리지",
                    "autoEmail": "조회 코드 포함 자동 확인 이메일 발송"
                },
                "tracker": {
                    "title": "신청 진행 상태 조회",
                    "subtitle": "신청 참조 번호와 등록하신 이메일을 입력하시면 실시간 진행 단계를 즉시 확인하실 수 있습니다.",
                    "refLabel": "신청 참조 번호",
                    "refPlaceholder": "예: APP-2026-001234",
                    "emailLabel": "등록된 이메일 주소",
                    "emailPlaceholder": "예: gildong@example.kr",
                    "trackButton": "상태 조회",
                    "tracking": "조회 중...",
                    "recently": "최근 조회",
                    "applicantName": "신청자 성명",
                    "registeredEmail": "등록된 이메일",
                    "submittedOn": "접수 일시",
                    "underwritingStatus": "보험 인수 심사 상태",
                    "policyDelivery": "보험 증권 발급",
                    "timelineTitle": "신청서 처리 단계",
                    "currentStage": "현재 단계",
                    "lastUpdated": "최종 업데이트",
                    "copyRefTooltip": "참조 번호 복사",
                    "refCopied": "참조 번호가 클립보드에 복사되었습니다!",
                    "notFoundTitle": "신청 내역을 찾을 수 없습니다",
                    "notFoundDesc": "입력하신 참조 번호 또는 이메일과 일치하는 내역이 없습니다. 정보를 다시 확인해 주세요.",
                    "supportNote": "체코 비자 또는 보험과 관련하여 긴급 지원이 필요하신가요? 중개 부서로 문의하세요:",
                    "emailUs": "이메일 문의하기",
                    "historyTitle": "최근 조회 내역"
                },
                "plans": {
                    "badge": "추천 보험 플랜",
                    "title": "체코공화국 공인 외국인 건강보험 플랜",
                    "subtitle": "체코 외국인 체류법(법률 제326/1999호)을 100% 충족하여 장기 비자, 거주증 신청 및 연장에 완벽히 유효합니다.",
                    "selectPlan": "이 플랜 선택하기",
                    "choosePlan": "플랜 선택 및 신청",
                    "applyNow": "지금 바로 신청",
                    "mostPopular": "가장 인기 있는 플랜",
                    "bestValue": "최고의 가성비",
                    "perYear": "/ 년",
                    "perMonth": "/ 월",
                    "coverageLimit": "의료비 보장 한도",
                    "repatriation": "본국 송환 및 응급 이송",
                    "dentalEmergency": "응급 치과 치료 보장",
                    "liabilityIncluded": "일상 배상책임 포함",
                    "unlimitedHospitalization": "체코 전역 입원 치료 보장",
                    "schengenCovered": "전 솅겐 협약국 유효"
                },
                "partners": {
                    "badge": "공식 제휴 보험사",
                    "title": "체코공화국 공식 인증 보험사",
                    "subtitle": "발급되는 모든 증권은 체코 내무부(OAMP) 및 외국인 경찰 중앙 전산망에 즉시 등록됩니다.",
                    "officialPortal": "공식 포털"
                },
                "banner": {
                    "notice": "규정 준수 안내",
                    "lawCompliance": "체코 외국인 체류법(법률 제326/1999호) 준수 보험",
                    "lawDetails": "당사 에이전시를 통해 발급되는 모든 보험 증서는 장기 비자 및 거주 허가 신청에 대한 체코 내무부 OAMP의 최신 법적 요건을 충족합니다.",
                    "learnMore": "온라인 신청하기"
                }
            },
            "terms": {
                "subtitle": "체코 프라하에서 FormVault가 제공하는 보험 중개 서비스 이용 약관.",
                "section1Title": "1. 중개 대상 및 서비스 범위",
                "section1Content": "FormVault는 체코공화국에서 정식 인가된 보험 중개인입니다. 본 서비스는 체코 법률 제326/1999호에 의거하여 인가된 보험사에 대한 비교 견적, 작성 지원 및 신청 접수를 제공합니다.",
                "section2Title": "2. 신청인의 의무 및 기재 내용의 진실성",
                "section2Content": "신청인은 정확하고 진실된 인적 사항, 여권 번호 및 건강 상태를 기재해야 합니다. 허위 기재 시 보험 계약이 무효화될 수 있으며 체코 내무부(OAMP) 비자 심사에서 거절될 수 있습니다.",
                "section3Title": "3. 보험 증권 발급 및 계약 성립",
                "section3Content": "보험 계약은 결제 확인 및 보험사의 인수 심사 승인 완료 시 성립됩니다. 공식 전자 확인서(Potvrzení o pojištění)는 이메일로 발송됩니다.",
                "section4Title": "4. 비자 거절 시 계약 취소 및 환불 권리",
                "section4Content": "재외공관 또는 체코 내무부에 의해 비자나 거주 허가가 공식 거절된 경우, 공식 거절 통지서를 제출하시면 해당 보험사의 약관에 따라 보험료를 환불받으실 수 있습니다.",
                "section5Title": "5. 준거법 및 분쟁 관할",
                "section5Content": "본 약관 및 본 서비스를 통해 중개된 모든 계약은 체코공화국 법률의 적용을 받으며, 관련 분쟁은 체코 프라하 관할 법원을 전속 관할로 합니다."
            },
            "support": {
                "subtitle": "보험 신청, 체코 비자 서류 요건, 보험금 청구 문의 또는 전담 상담원과 실시간 상담을 이용하세요.",
                "emailCardTitle": "이메일 전담 접수",
                "emailCardDesc": "보험 증권 확인, 대사관 제출 서류 확인, 비자 거절 환불 접수 등. 평균 답변 소요 시간: 2시간 이내.",
                "copyBtn": "복사",
                "copied": "고객지원 이메일이 복사되었습니다: insurance@hktse.eu.org",
                "composeEmail": "이메일 작성하기",
                "chatCardTitle": "실시간 전문 상담 (Crisp)",
                "chatCardDesc": "영어, 한국어, 체코어, 중국어 상담이 가능한 공인 보험 전문가와 연결됩니다. 유럽 업무 시간 내 즉시 답변.",
                "hours": "월 - 금: 09:00 - 18:00 CET (유럽 표준시)",
                "location": "체코 프라하",
                "openChat": "실시간 상담 시작",
                "chatOffline": "실시간 채팅이 초기화 중이거나 현재 오프라인입니다. insurance@hktse.eu.org 로 직접 문의해 주십시오.",
                "faqTitle": "자주 묻는 질문 (FAQ)",
                "faqSubtitle": "체코공화국 외국인 건강보험에 대한 빠른 안내.",
                "faqs": {
                    "q1": "신청 완료 후 공식 보험 증서는 얼마나 빨리 발급되나요?",
                    "a1": "결제 및 서류 확인 후 영업일 기준 보통 1~4시간 이내에 전자 보험 증명서(Potvrzení o pojištění)가 발급되며, 비자 신청용 계약 번호가 포함된 공인 PDF가 이메일로 전달됩니다.",
                    "q2": "발급되는 보험이 체코 내무부(OAMP)에서 100% 인정되나요?",
                    "a2": "네, 당사에서 중개하는 모든 보험은 체코 외국인 체류법(제326/1999호)을 엄격히 준수하며 내무부 전산망에 정식 등록됩니다.",
                    "q3": "대사관에서 비자가 거절되면 어떻게 해야 하나요?",
                    "a3": "공식 비자 거절 통지서 사본을 insurance@hktse.eu.org 로 보내주시면 즉시 보험 해지 및 환불 절차를 안내해 드립니다.",
                    "q4": "체코 현지에서 병원 이용 및 보험금 청구는 어떻게 하나요?",
                    "a4": "보험사 협약 병원(프라하 모톨 병원, FNKV, VFN 등)에서는 보험 카드를 제시하시면 직접 결제(Direct Billing) 처리됩니다. 비협약 병원은 영수증과 진단서를 제출하시면 14일 이내에 환급됩니다.",
                    "q5": "여권 사본과 재학 증명 서류는 왜 제출해야 하나요?",
                    "a5": "체코 보험법상 내무부 계약 등록을 위해 신원 확인이 의무화되어 있습니다. 또한 학생 서류 확인 시 최대 30% 학생 특별 할인율이 적용됩니다."
                }
            },
            "privacy": {
                "subtitle": "체코공화국 및 유럽연합 내 개인정보 수집, 처리, 암호화 및 보호에 관한 공식 규정.",
                "section1Title": "1. 개인정보 처리자",
                "section1Content": "개인정보 처리자는 체코 프라하 소재 FormVault 보험 중개 서비스입니다. 개인정보 보호 문의 및 DPO 연락처: insurance@hktse.eu.org",
                "section2Title": "2. 개인정보 처리 목적 및 법적 근거",
                "section2Intro": "당사는 다음 목적을 위해 신청인의 개인정보(성명, 생년월일, 여권 사본, 학생 신분, 주소 등)를 수집 및 처리합니다:",
                "section2Item1": "인가된 보험사와의 건강 및 여행 보험 계약 체결 및 증권 발급;",
                "section2Item2": "체코 외국인 체류법(법률 제326/1999호, OAMP 규정) 준수;",
                "section2Item3": "체코 보험업법에 따른 감사 검증, 부정 방지 및 법적 의무 보관.",
                "section2Legal": "법적 근거: GDPR 제6조 제1항(b)(계약 이행) 및 제6조 제1항(c)(법적 의무 준수).",
                "section3Title": "3. 최고 등급 하드웨어 암호화 및 보안 저장",
                "section3Content": "제출된 모든 여권 및 개인 기록은 고유 IV를 적용한 AES-256 GCM 인증 암호화로 안전하게 보관됩니다. 데이터베이스는 공용 인터넷과 격리되어 있으며 TLS 1.3 보안 전송을 사용합니다.",
                "section4Title": "4. GDPR에 따른 정보주체의 권리 (제15조~제22조)",
                "section4Intro": "신청인은 EU 법률에 따라 다음과 같은 법적 권리를 행사할 수 있습니다:",
                "section4Item1": "열람청구권(제15조): 보관 중인 개인정보 사본 요청;",
                "section4Item2": "정정청구권(제16조): 부정확하거나 불완전한 정보의 수정;",
                "section4Item3": "삭제청구권(제17조): 법정 보존 기간 경과 후 서류 삭제 요청;",
                "section4Item4": "데이터 이동권(제20조): 구조화된 기계 판독 가능 형식으로 데이터 수령.",
                "form": {
                    "title": "GDPR 권리 행사 신청",
                    "subtitle": "개인정보 보호 책임자(DPO)에게 공식 데이터 요청을 제출하시면 EU 법률에 따라 30일 이내에 처리 결과를 안내해 드립니다.",
                    "requestAction": "요청 유형",
                    "types": {
                        "access": "열람권 (내 데이터 내보내기)",
                        "rectification": "정정권 (오류 수정)",
                        "erasure": "삭제권 (서류 영구 삭제)",
                        "portability": "데이터 이동권 (구조화된 사본)"
                    },
                    "fullName": "공식 성명 (여권 기준)",
                    "fullNamePlaceholder": "예: 홍길동",
                    "registeredEmail": "등록된 이메일 주소",
                    "registeredEmailPlaceholder": "예: gildong@example.kr",
                    "refNumber": "신청 참조 번호 (선택 사항)",
                    "refNumberPlaceholder": "예: APP-2026-001234",
                    "details": "구체적인 요청 사항",
                    "detailsPlaceholder": "요청하시고자 하는 서류나 수정 내용을 입력해 주세요...",
                    "submit": "GDPR 요청 제출하기",
                    "submitting": "제출 중...",
                    "validationError": "성명과 등록된 이메일 주소를 입력해 주십시오.",
                    "successTitle": "요청이 성공적으로 접수되었습니다",
                    "successDesc": "법적 권리 요청이 등록되었습니다. 개인정보 책임자가 신원 확인 후 30일 이내에 답변을 드립니다."
                }
            }
        },
        "forms": {
            "personalInfo": {
                "sections": {
                    "underwriting": "보험 인수 및 증권 사양 (체코 보험 등록 데이터)"
                },
                "fields": {
                    "gender": "성별",
                    "nationality": "국적 / 시민권",
                    "placeOfBirth": "출생지 (도시)",
                    "passportNumber": "여권 번호",
                    "passportExpiry": "여권 만료일",
                    "commencementDate": "보험 개시일",
                    "duration": "보험 기간",
                    "typeOfStay": "체코 체류 유형"
                },
                "placeholders": {
                    "nationality": "예: 대한민국, 미국, 중국",
                    "placeOfBirth": "예: 서울, 부산, 프라하",
                    "passportNumber": "예: M12345678"
                },
                "genderOptions": {
                    "male": "남성",
                    "female": "여성"
                },
                "stayOptions": {
                    "student": "대학생",
                    "employment": "취업 / 노동 허가",
                    "business": "사업 / 자영업 허가증 (Živnost)",
                    "family": "가족 결합"
                },
                "durationOptions": {
                    "m6": "6개월",
                    "m12": "12개월 (1년 - 표준)",
                    "m24": "24개월 (2년)",
                    "m36": "36개월 (3년)"
                }
            }
        }
    }

    for code, patch in [("ja", ja_patch), ("ko", ko_patch)]:
        path = os.path.join(LOCALES_DIR, f"{code}.json")
        with open(path, "r", encoding="utf-8") as f:
            cur = json.load(f)
        merge_deep(cur, patch)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cur, f, ensure_ascii=False, indent=2)
        print(f"[{code}] Successfully updated full East Asian localized patch.")

if __name__ == "__main__":
    main()
