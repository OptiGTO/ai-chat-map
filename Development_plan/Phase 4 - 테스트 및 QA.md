- **기간:** 추후 확정
- **핵심 목표:** 기능/성능/UX 검증 및 버그 정리.
- **현황:** Day 10 QA 체크리스트 완료 (데스크탑 기준)
- **Tasks (Draft):**
    - 기능 테스트 시나리오 작성
    - 크로스 브라우저/디바이스 체크
    - 성능/렌더링 점검 및 리그레션 체크

## Day 10 QA checklist
- [x] Frontend loads at http://localhost:3000 (Docker and local)
- [x] Backend responds at http://localhost:8000/api/chat
- [x] Neo4j browser reachable at http://localhost:7474
- [x] Chat flow: user -> assistant -> keywords rendered
- [x] Graph updates: new nodes + links appear without layout reset
- [x] Node click: focus panel syncs + camera fly-to feels smooth
- [x] Bloom and glow visible (desktop)
- [x] Mobile layout: panel, input, and scroll areas usable
- [x] Error state: backend down -> friendly error message
- [x] Performance: stable FPS, no obvious jitter on 20+ nodes

---
## 관련 문서
- [[MVP_타이트_개발_계획]]
- [[Phase 3 - 개발 (MVP)]]
- [[AI Chat 웹사이트 제작 그랜드 플랜]]
- [[현재_진행상황_정리]]
