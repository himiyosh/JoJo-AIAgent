---
applyTo: "**"
---

# Session context circuit breaker

この規則は長期作業、統括、子セッション、通常の単独作業すべてに適用する。完遂・継続・事前承認の指示より、request-size failure を未然に防ぐことを優先する。

## Mandatory preflight

各 coordinator turn の開始時と、新しい task、tool batch、review、test、build、commit、child 起動の直前に context preflight を行う。wave 終了時だけ確認してはならない。

次のいずれかで mandatory rollover とする。

- API request-size limit の 50% 以上が判明した。
- 同じ physical session が 24 turn に達した。
- 同じ physical coordinator が 2 task wave を完了した。
- 単一の添付または tool result が 256 KiB 以上、tool output が truncation された、または request-size warning が出た。
- 正確な量が不明でも、画像・大きな添付、長い tool output、12 turn 以上、複数 session の統合のうち 2 つが重なった。

## Hard stop and rollover

mandatory rollover を検知した generation では、新しい実装、調査、review、test、build、commit、child 起動・催促を開始しない。「あと 1 件」「検証後」「wave 終了後」まで続けることも禁止する。

許可する操作は、進行中の atomic write を破損しない境界まで settle すること、`/safe-session-suspend` で compact handoff と pointer を永続化・再読込すること、履歴を継承しない fresh session を作ることだけである。replacement では `/safe-session-resume` を使う。

oversized session から `fork_session` しない。transcript、全 turn、画像、添付、full diff、生ログ、巨大な tool output を replacement へコピー、export、attach、replay しない。移管するのは branch、SHA、dirty-file inventory、plan、todo、PR/Issue、decision、validation state、next action と参照 path だけにする。

## Payload discipline

- coordinator は compact manifest と統合判断だけを保持し、実装ログ、full diff、画像、長い review 結果を集めない。
- 検索・session store・Git・ログは対象、列、期間、件数、行範囲を先に絞る。全 transcript、全 event、無制限の session 一覧、巨大な build/test output を会話へ返さない。
- 大きな結果はローカル artifact に残し、会話には path、size、hash、必要な抜粋だけを返す。
- handoff は 64 KiB 以下、child kickoff は 16 KiB 以下、child report は 4 KiB 以下にする。
- 1 wave は最大 3 task、同時 active child は最大 3 件とする。2 wave 完了時は未完了 backlog があっても physical coordinator を世代交代する。

request-size failure が既に表示された会話は復旧不能な generation とみなす。同じ会話へ短い指示を再送せず、空の fresh session から `/safe-session-resume` だけで durable state を復元する。
