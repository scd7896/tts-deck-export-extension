# CRB Extension 가이드

## 개요

이 프로젝트는 CookieRun Braverse 덱 페이지를 대상으로 동작하는 Chrome
Extension입니다. 현재 페이지에서 카드 이미지를 수집한 뒤, 이를 Tabletop
Simulator에서 사용할 수 있는 덱 시트 이미지로 합성하고, 팝업에서 미리보기,
다운로드, 드로우 시뮬레이터를 제공하는 것이 주된 목적입니다.

현재 대상 사이트:

- `https://cookierunbraverse.com/*`

기술 스택:

- TypeScript
- Vite
- Chrome Extension Manifest V3

## 이 확장 프로그램이 하는 일

전체 동작은 아래 흐름으로 이해하면 됩니다.

1. 사용자가 지원되는 덱 페이지에서 확장 프로그램 팝업을 엽니다.
2. 팝업이 덱 이미지 생성을 요청하는 런타임 메시지를 보냅니다.
3. 백그라운드 서비스 워커가 이 메시지를 현재 활성 탭으로 전달합니다.
4. 콘텐츠 스크립트가 페이지 DOM을 읽고 현재 게임 종류를 판별합니다.
5. 게임별 deck exporter가 페이지에서 카드 이미지 URL을 수집합니다.
6. 수집한 카드 이미지를 canvas에 합쳐 하나의 덱 시트 이미지로 만듭니다.
7. 콘텐츠 스크립트가 결과 이미지를 base64로 변환해 팝업으로 돌려줍니다.
8. 팝업이 이미지를 미리 보여주고 다운로드 버튼을 활성화합니다.
9. 팝업이 덱 시트를 개별 카드로 다시 잘라 드로우 시뮬레이터를 초기화합니다.
10. 사용자는 popup에서 1장 드로우 / 리셋을 수행하며 드로우 결과를 누적해서 볼 수 있습니다.

## 아키텍처

### 진입점

- `src/manifest.json`
  - Chrome 확장 프로그램 설정 파일
  - popup, background service worker, 권한, content script를 선언합니다.

- `src/background.ts`
  - 런타임 메시지 중계 역할
  - popup에서 온 메시지를 현재 활성 탭의 content script로 전달합니다.

- `src/content.ts`
  - 지원 사이트 페이지에서 실행되는 content script
  - 현재 게임을 판별하고, 적절한 deck exporter를 호출합니다.

- `src/popup/popup.ts`
  - popup 진입점
  - 각 popup 패널을 초기화하고 연결하는 오케스트레이션 역할

- `src/popup/deckImagePanel.ts`
  - 덱 이미지 로딩 패널
  - content script에서 이미지를 받아오고, 다운로드와 덱 시트 접기/펼치기를 관리합니다.

- `src/popup/drawSimulatorPanel.ts`
  - 드로우 시뮬레이터 패널
  - 덱 시트로부터 `Deck`을 생성하고, 드로우 / 리셋 / 카드 렌더링 상태를 관리합니다.

### 도메인 레이어

- `src/deck/deck.ts`
  - 게임 판별 로직
  - exporter 구현체를 선택하는 factory 역할

- `src/deck/interface.ts`
  - exporter 공통 인터페이스

- `src/deck/DeckExporterCRB.ts`
  - CookieRun Braverse 전용 DOM 추출 로직
  - 페이지의 `.main-deck`, `.extra-deck` 안 카드 이미지를 읽습니다.

### 유틸리티 레이어

- `src/utils/card.ts`
  - 개별 카드 이미지를 하나의 덱 시트 이미지로 합성합니다.
  - 고정 카드 크기와 10x7 배치를 사용합니다.

- `src/utils/file.ts`
  - blob -> base64 변환
  - 이미지 다운로드 헬퍼

- `src/utils/event.ts`
  - 공통 메시지 이벤트 이름 정의

- `src/utils/drawSimulator.ts`
  - 생성된 덱 시트를 다시 개별 카드로 잘라서 다루는 로직
  - 간단한 draw / shuffle / reset 시뮬레이터를 제공합니다.
  - 현재 popup의 드로우 시뮬레이터 UI에서 실제로 사용됩니다.

## 런타임 동작 흐름

### 1. Popup

현재 popup은 세 부분으로 나뉘어 있습니다.

- `src/popup/popup.ts`
  - DOM 요소를 모아 패널을 초기화합니다.
- `src/popup/deckImagePanel.ts`
  - `LOAD_IMAGE` 메시지를 보내 덱 시트를 불러옵니다.
- `src/popup/drawSimulatorPanel.ts`
  - 받아온 덱 시트로 draw simulator를 초기화합니다.

응답이 오면:

- 덱 시트 이미지를 표시하고
- 다운로드 버튼을 활성화하고
- 드로우 시뮬레이터에서 사용할 `Deck` 객체를 생성하고
- 드로우 / 리셋 버튼을 활성화합니다.

현재 popup UI는 아래 요소를 포함합니다.

- 덱 이미지 다운로드 버튼
- 덱 시트 접기/펼치기 버튼
- 드로우 결과 개수 표시
- 드로우 결과 카드 그리드
- 드로우 영역 상단의 sticky `1장 드로우` / `리셋` 버튼

### 2. Background

`src/background.ts`는 직접 데이터를 만들지 않습니다.
역할은 메시지 브리지입니다.

- 현재 활성 탭 조회
- 탭 URL이 HTTP/HTTPS인지 확인
- popup 메시지를 content script에 전달
- 받은 응답을 다시 popup으로 반환

### 3. Content Script

`src/content.ts`는 아래 순서로 동작합니다.

- 현재 페이지가 지원 대상 게임인지 확인
- `getDeckExporter`로 적절한 exporter 생성
- exporter에게 덱 이미지 Blob 생성 요청
- Blob을 base64로 변환
- `sendResponse`로 popup에 응답

현재 지원 이벤트:

- `LOAD_IMAGE`

### 4. Deck Exporter

`src/deck/DeckExporterCRB.ts`는 아래 작업을 수행합니다.

- `.main-deck`, `.extra-deck` 선택
- 내부 `img` 태그 수집
- `src.includes("storage")` 조건으로 이미지 URL 필터링
- 수집된 URL 목록을 `buildDeckImage`에 전달

즉, 이 프로젝트는 현재 CookieRun Braverse 사이트의 DOM 구조에 강하게
의존하고 있습니다.

## 카드 시트 생성 방식

`src/utils/card.ts`에는 고정된 시트 상수가 정의되어 있습니다.

- 카드 너비: `409`
- 카드 높이: `585`
- 열 수: `10`
- 행 수: `7`

즉, 한 장의 시트에는 최대 아래 개수까지 들어갑니다.

- `70`장

`buildDeckImage(...)`는 아래 방식으로 동작합니다.

- 이미지 로드
- 전체 시트 크기의 canvas 생성
- 왼쪽에서 오른쪽, 위에서 아래 순서로 카드 배치
- 최종 결과를 `Blob`으로 반환

구현상 참고할 점:

- 현재 출력 타입으로 `image/jpg`를 사용하고 있음
- 브라우저 표준 MIME 타입은 보통 `image/jpeg`를 사용함

## 드로우 시뮬레이터 동작 방식

`src/utils/drawSimulator.ts`의 `createDeckFromSheet(...)`는 덱 시트 이미지를 받아
개별 카드 Blob 배열로 다시 잘라낸 뒤, 간단한 덱 상태 객체를 반환합니다.

반환되는 `Deck` 객체는 아래 메서드를 가집니다.

- `shuffle()`
- `reset(shuffle?)`
- `draw(count)`

현재 popup에서는 이 로직을 실제 UI에 연결해 사용합니다.

- popup이 받은 덱 시트를 `createDeckFromSheet(...)`에 전달
- 내부적으로 카드 시트를 카드 단위 Blob으로 crop
- `reset()`으로 초기 셔플 상태 생성
- `draw(1)` 호출 시 카드 1장을 뽑아 popup에 누적 렌더링
- `reset()` 호출 시 뽑은 카드 목록을 비우고 덱 상태 초기화

현재 UI 특징:

- 드로우 결과는 한 장만 보여주는 것이 아니라 누적 카드 목록으로 표시됨
- 드로우 결과 영역은 스크롤 가능
- `1장 드로우` / `리셋` 버튼은 드로우 영역 내부 상단에 sticky로 고정됨
- 드로우 카드 그리드는 한 줄 6장 기준으로 배치됨

## 빌드 시스템

이 프로젝트는 Vite 빌드를 두 번 수행합니다.

1. `vite.config.ts`
   - `background.ts` 빌드
   - popup HTML 엔트리 빌드
   - manifest와 아이콘 복사
   - popup 출력 경로 정리

2. `vite-content.config.ts`
   - content script를 별도 빌드
   - `dist/content.js`를 IIFE 번들로 생성
   - `emptyOutDir: false`로 앞선 빌드 결과 유지

NPM 스크립트:

- `npm run start`
- `npm run build`
- `npm run zip`

## 현재 제약과 리스크

### 1. DOM 의존성

추출 로직은 아래 요소에 직접 의존합니다.

- `.main-deck`
- `.extra-deck`
- `storage` 문자열이 포함된 이미지 URL

사이트 마크업이 바뀌면 덱 추출이 바로 깨질 가능성이 큽니다.

### 2. 약한 에러 처리

비동기 흐름 전반에서 명시적인 에러 복구가 부족합니다.

- 이미지 로드 실패
- canvas export 실패
- 지원하지 않는 페이지 상태
- 덱 노드 누락

현재는 대부분 console 경고 수준에서 끝나거나, 응답이 비어 있는 상태로
끝날 수 있습니다.

### 3. 빌드 환경 불일치

분석 시점의 로컬 환경은 아래 버전이었습니다.

- Node.js `18.16.0`

하지만 현재 설치된 Vite는 아래 버전을 요구합니다.

- Node.js `20.19+` 또는 `22.12+`

그래서 현재 환경에서는 `npm run build`가 실패합니다. Node 버전을 올리거나,
toolchain 버전을 맞추는 작업이 먼저 필요합니다.

### 4. 테스트 부재

현재 실질적인 테스트 코드가 없습니다.

- `npm test`는 placeholder 상태

이 때문에 DOM selector나 이미지 처리 로직을 수정할 때 회귀가 발생하기 쉽습니다.

### 5. drawSimulator의 비용

`drawSimulator.ts`는 이제 실제 UI 기능이지만, popup에서 덱 시트를 다시 모든 카드로
crop하는 작업은 비용이 있습니다.

- popup 초기 진입 시 처리 시간이 늘어날 수 있음
- 카드 수가 많아질수록 메모리 사용량이 커질 수 있음
- 많은 드로우 카드 URL을 만들기 때문에 object URL 정리가 중요함

현재는 리셋 시 및 내부 정리 로직에서 URL revoke를 수행하고 있습니다.

## 추천 개선 우선순위

### 우선순위 1

런타임 안정화:

- 이미지 생성 및 메시징 로직에 에러 처리 추가
- popup UI에 실패 상태 노출
- DOM 노드가 없거나 카드 목록이 비었을 때 명확하게 처리

### 우선순위 2

환경 정리:

- 설치된 Vite와 맞는 Node 버전으로 통일
- 프로젝트에서 기대하는 Node 버전을 문서화

### 우선순위 3

사이트 의존성 완화:

- selector를 설정값처럼 분리
- exporter 검증 로직 명확화
- 페이지 구조가 바뀌었을 때 진단 가능한 실패 메시지 제공

### 우선순위 4

popup 성능 최적화:

- `createDeckFromSheet(...)` 초기화 비용 측정
- 필요 시 lazy initialization 도입
- 드로우 카드 수가 많아졌을 때 렌더링 비용 검토

### 우선순위 5

테스트 추가:

- 덱 레이아웃 계산 단위 테스트
- exporter URL 수집 로직 테스트
- 가능한 범위에서 메시지 흐름 smoke test 추가

## 빠른 파일 맵

- `src/manifest.json`: 확장 프로그램 설정
- `src/background.ts`: popup -> content 메시지 브리지
- `src/content.ts`: 페이지 쪽 메시지 처리 및 덱 생성 시작점
- `src/deck/deck.ts`: 게임 판별 및 exporter factory
- `src/deck/DeckExporterCRB.ts`: CRB DOM 파싱 및 카드 URL 수집
- `src/utils/card.ts`: 덱 시트 생성기
- `src/utils/file.ts`: 파일/base64 유틸
- `src/utils/event.ts`: 메시지 타입 정의
- `src/utils/drawSimulator.ts`: 카드 분리 및 드로우 시뮬레이션
- `src/popup/index.html`: popup 마크업
- `src/popup/popup.ts`: popup 진입점 및 패널 조립
- `src/popup/deckImagePanel.ts`: 덱 이미지 패널 로직
- `src/popup/drawSimulatorPanel.ts`: 드로우 시뮬레이터 패널 로직
- `src/popup/popup.css`: popup 스타일
- `vite.config.ts`: 메인 빌드 설정
- `vite-content.config.ts`: content script 빌드 설정

## 앞으로 작업할 때 참고할 포인트

새로운 게임을 지원하려면 보통 아래 순서로 확장하면 됩니다.

1. `src/deck/deck.ts`에 새 게임 이름 추가
2. `IDeckExporter`를 구현하는 새 exporter 작성
3. `getGameName()` 판별 로직 확장
4. `getDeckExporter()`에 새 exporter 연결

UX 개선 작업의 주요 진입점은 아래입니다.

- `src/popup/index.html`
- `src/popup/popup.ts`
- `src/popup/deckImagePanel.ts`
- `src/popup/drawSimulatorPanel.ts`
- `src/popup/popup.css`

덱 추출 안정성 개선의 핵심 작업 지점은 아래입니다.

- `src/deck/DeckExporterCRB.ts`

## 현재 상태 요약

이 프로젝트는 목적이 분명하고, 구조도 비교적 단순해서 따라가기 어렵지
않습니다. 다만 현재의 주요 약점은 구조 복잡성보다는 운영 안정성에 가깝습니다.

- 외부 사이트 DOM에 대한 높은 의존성
- 사용자에게 보이는 에러 처리 부족
- popup 초기화 시 이미지 crop 비용 존재
- 자동화 테스트 부재
- 로컬 빌드 환경 불일치

즉, "기능은 이해하기 쉽고 확장도 가능하지만, 안정적으로 오래 유지하려면
방어 코드와 환경 정리가 먼저 필요하다" 정도로 이해하면 됩니다.
