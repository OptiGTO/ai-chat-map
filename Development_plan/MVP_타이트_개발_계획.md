# MVP 타이트 개발 계획 (Start: 2026-01-23)

이 문서는 현재 리포지토리 상태 기준으로 **MVP를 빠르게 완성하기 위한 타이트한 일정**입니다.

## 현재 진행
- Day 10 QA 완료 (2026-01-28 기준) (상세: [[현재_진행상황_정리]])

## 전제 조건
- 시작일: 2026-01-23
- 하루 6~8시간 집중 개발 가정
- Docker 통합 워크플로우 기준 (필요 시 로컬 실행 가능)

## Day-by-Day 계획 (10일)

### Day 1 — 2026-01-23 (완료)
- 환경 검증: Next.js + Tailwind 실행 확인
- 프론트 폴더 구조 정리 (3D, UI, state 분리)
- 기본 레이아웃/페이지 구조 확정

### Day 2 — 2026-01-24 (완료)
- 3D 씬 스켈레톤 구축 (Canvas, 카메라, 라이트)
- 샘플 그래프 데이터 정의
- force-graph 초기 배치 확인

### Day 3 — 2026-01-25 (완료)
- 노드/엣지 렌더링 구현
- 라벨/빌보드 텍스트 표시
- 기본 머티리얼 적용 (glow placeholder)

### Day 4 — 2026-01-26 (완료)
- 핵심 UX: 노드 클릭 시 선택 상태
- 카메라 fly-to 애니메이션
- Zustand로 3D ↔ 2D 상태 동기화

### Day 5 — 2026-01-27 (완료)
- 2D 채팅 패널 UI 구현
- 입력/응답 플로우(프론트) 연결
- Framer Motion으로 패널/리스트 트랜지션

### Day 6 — 2026-01-28 (Backend & Intelligence) (완료)
- Gemini API 연동 및 `google-genai` 패키지 설치
- **프롬프트 엔지니어링**: 답변과 함께 '키워드(Keywords)' 구조적 추출 (JSON Mode 활용)
- Neo4j 데이터 모델링: `UserQuery` -> `Answer` -> `Keyword` 관계 저장 로직 구현
- API 응답 스키마 확정 (프론트 그래프 병합 용이한 구조)

### Day 7 — 2026-01-29 (Integration & State) (완료)
- 프론트 ↔ 백엔드 API 연동 (fetch/axios)
- **Incremental Graph Update**: 기존 그래프 레이아웃 유지하며 새 노드/엣지 추가하는 Zustand 로직(merge logic) 구현
- 채팅 UI 로딩/Typing Indicator 처리
- 예외 처리 (API 에러 핸들링)

### Day 8 — 2026-01-30 (Visual Polish)
- **Post-processing**: Bloom(발광) 효과 적용으로 몽환적 분위기 연출 (AGENTS.md 목표)
- 노드 유형별(Question, Answer, Keyword) Material/Color 차별화
- 엣지 파티클/Line 애니메이션 (데이터 흐름 시각화)
- 배경 및 전체 톤앤매너 디테일 조정

### Day 9 — 2026-01-31
- UX 튜닝: 카메라/오빗 컨트롤 조정
- 모바일 레이아웃 대응
- 성능 점검 (프레임/렌더링 최적화)

### Day 10 — 2026-02-01
- 데모 마무리 및 QA 체크리스트
- README 업데이트 및 실행 방법 정리
- 버그 픽스 + 최종 정리

## 일정 지연 시 우선순위 컷
1) postprocessing/bloom 고도화 → 기본 glow만 유지  
2) 고급 라벨 스타일링 → 기본 Billboard 텍스트 유지  
3) 키워드 확장 로직 → 고정 키워드 사용  
4) Neo4j 저장 → 프론트 메모리 상태 유지  

---
필요 시 목표 날짜를 알려주면 즉시 일정 재조정합니다.

---
## 관련 문서
- [[Phase 3 - 개발 (MVP)]]
- [[AI Chat 웹사이트 제작 그랜드 플랜]]
- [[현재_진행상황_정리]]

---
## 이월 이슈
- 카메라 fly-to 체감 안됨 → 추후 해결 필요
