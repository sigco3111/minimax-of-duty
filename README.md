# Minimax of Duty

> **mshumer의 [Claude of Duty](https://github.com/mshumer/Claude-of-Duty) 한국어 fork.**
> 브라우저에서 돌아가는 1인칭 슈팅(FPS). Three.js r180 + WebGL2.
> 원본은 Opus 5가 멀티에이전트 오케스트레이션으로 약 1.5일 만에 만든 **55,000줄 / 11 서브시스템** 작품이고,
> 본 fork는 그 결과물을 **한국어 환경에 맞게 재현·확장**하는 것이 목표다.

**🎮 [라이브 데모 (Vercel)](https://sigco3111.github.io/minimax-of-duty)**

**[원본 저장소](https://github.com/mshumer/Claude-of-Duty)** · **[라이선스: MIT](./LICENSE)** (Copyright 2026 mshumer)

---

## 원본 프롬프트

> *"This is the entire prompt that produced this repository."* (저장소 내 [`prompt.md`](https://github.com/mshumer/Claude-of-Duty/blob/main/prompt.md) 전문, 142단어)

### 영문 원문

> I want you to build a first-person shooter at the level of the most recent Call of Duty games. It should be utterly perfect, visually beautiful, with every single thing done at AAA quality—from textures to physics to anything you could think of.
>
> Fan out sub-agents and have sub-agents tackle each one individually so that the game is utterly perfect. You should /loop on each item and have a separate sub-agent check it visually to ensure it looks triple A. That separate sub-agent should be a really harsh critic, and if it doesn't look triple A, it should keep going.
>
> Don't stop until each sub-agent is utterly wowed with the quality when compared with the actual Call of Duty game. It should literally compare them side by side blind and say which one looks better. Do this in ThreeJS. /loop until it's utterly perfect. Fan out sub-agents and ultracode.

### 한글 번역

> 최신 Call of Duty 게임 수준에 필적하는 1인칭 슈팅 게임을 만들어 줘. 완벽하고, 시각적으로 아름다우며, 텍스처부터 물리까지 AAA 품질로 모든 게 다뤄져야 해 — 떠올릴 수 있는 모든 것들이.
>
> 서브에이전트를 fan out 해서 각자 한 항목씩 맡아 게임이 완벽해지도록 해. 각 항목마다 `/loop` 돌리고, 별도의 서브에이전트가 시각적으로 검수해서 트리플 A급인지 확인해. 그 검수 에이전트는 진짜 깐깐한 비평가여야 하고, 트리플 A가 아니면 계속 가야 해.
>
> 진짜 Call of Duty 게임과 비교했을 때 모든 서브에이전트가 품질에 완전히 감동할 때까지 멈추지 마. 블라인드로 나란히 놓고 어느 쪽이 더 좋아 보이는지 비교하게 해. ThreeJS로 해. `/loop` 돌려서 완벽해질 때까지. 서브에이전트 fan out 하고 ultracode로 가.

### 메타 — 5개 키워드

| 키워드 | 의미 |
|---|---|
| `Fan out sub-agents` | 멀티에이전트 병렬 분할 |
| `/loop` | Opus 5 슬래시 명령 — 항목별 무한 루프 |
| `harsh critic` | 블라인드 A/B 비교 강도 높은 적대적 비평가 |
| `ultracode` | Opus 5 고강도 코딩 모드 |
| `utterly wowed` | 비평자가 만족할 때까지 무한 |

### 메타 — 짧은 프롬프트의 무게

이 142단어에는 다음이 **전부 부재**:

- 아키텍처 가이드 (서브시스템 인터페이스, 디렉터리 소유권) — `ARCHITECTURE.md`는 agent 측 자체 산출물
- 인터페이스 명세 (이벤트 어휘, 공유 surface 타입)
- 평가 척도 (오직 "side-by-side blind" 한 줄)
- 자산 규칙 (에셋 0개 제약은 코드에 박혀있을 뿐 프롬프트엔 없음)

**결과** (원본 README 자기평가): 11명 독립 비평가 점수 3.59 → 4.14 → 4.05 → **5.05 / 10**. 두 샷이 "CLOSE"에 닿고 나머지는 "AMATEUR". 블라인드 A/B에서 **모든 비평자가 모든 라운드에서 진짜 CoD 프레임을 골랐다**.

원본 README의 결론 (그대로 옮김):

> 순차 단일-소유 패스가 병렬 fan-out을 결정적으로 이겼다. 결합된 관심사를 단일 소유자가 갖는 순차 패스 한 번이 점수를 +1.00 움직이고 결함을 66 → 26으로 줄였다.

즉 **이 짧은 프롬프트에서 가장 값진 교훈은 "fan-out이 본 작전에서 가장 큰 실수였다"는 자기 인정**. 본 한국어 fork는 같은 실패를 반복하지 않기 위해 직렬 단일-소유 패스로 진행한다.

---

## 한국어 안내

- **아트 에셋이 전혀 없다.** 텍스처·메시·애니메이션·사운드 전부 코드로 **프로시저럴 생성**. 모델·HDRI·이미지·오디오 파일 일절 없음. 런타임 의존성은 `three` 단 하나.
- **실행:**
  ```bash
  npm install
  npm run dev          # http://127.0.0.1:5173
  ```
  캔버스 클릭 → 커서 고정. WASD 이동, 마우스 조준, 좌클릭 발사, 우클릭 ADS, R 재장전, Shift 스프린트, Ctrl 앉기, Space 점프, Q/E 기울이기, Esc 마우스 해제.

- **폴더 구조:**
  | 폴더 | 역할 |
  |---|---|
  | `render` | HDR 파이프라인, 캐스케이드 섀도우 맵(`sampler2DArray` + 텍셀 스냅 + PCSS), MRT 깊이/법선/속도 프리패스, GTAO, YCoCg variance clipping TAA, 타일-확장 모션 블러, Karis 블룸 피라미드, GPU EV100 미터링, 프로시저럴 33³ grade LUT, AgX 컴포지트 |
  | `materials` | GPU 텍스처 포지. 19종 표면(콘크리트·벽돌·석고·아스팔트·모래·녹슨/페인트/브러시드 금속·나무·천·마대·유리…), 주기적 노이즈로 완벽 타일링, Sobel 높이→법선, 시차 매핑, 삼면 투영, 곡률 기반 가장자리 마모 |
  | `sky` | 대기 산란, 시간대, PMREM 환경 생성, 볼류메트릭 포그/광선 |
  | `world` | ~120×120 m 거리: 실제 벽 두께 + 진입 가능한 인테리어를 가진 모듈러 빌딩 키트, 수백 개 인스턴싱 소품 |
  | `physics` | 외부 라이브러리 없음. Binned-SAH BVH(29k tris → 14k nodes, 22 ms, 0.25 µs/레이캐스트), 5-plane crease stack 스웹트 캡슐 캐릭터 컨트롤러, CCD 강체, PBD 래그돌, 다층 총알 관통 |
  | `player` | 이동 상태머신, 슬라이드/맨틀/리닝, 카메라 필 |
  | `weapons` | 프로시저럴 무기 지오메트리, 뷰모델 릭, ADS, 스프링 리코일, 프로시저럴 재장전, 비행시간·탄도 적용 |
  | `fx` | GPU 파티클, 데칼, 트레이서, 머즐 플래시, 폭발 |
  | `ai` | 스킨드 솔저, 내비메시 패싱, 인식, 엄폐 행동, 래그돌 사망 |
  | `ui` | DOM/CSS HUD: 크로스헤어, 히트마커, 미니맵, 컴퍼스, 킬피드 |
  | `audio` | Web Audio 신디. 무음 파일 사용 안 함. 레이어드 사격음, 컨볼루션 리버브, HRTF 입체 음향, 차폐 |

`ARCHITECTURE.md`는 멀티에이전트가 작업할 때 따라간 **계약서**다. 서브시스템 인터페이스, 디렉터리 소유권, 서브시스템 간 이벤트 어휘, 공유 surface 타입이 명시돼 있다.

## 툴 / 하네스

| 도구 | 용도 |
|---|---|
| `tools/capture.mjs` | GPU 가속 헤드리스 Chromium으로 단일 샷 캡처 |
| `tools/shotset.mjs` | 11장 샷을 한 세션에서 빠르게 리뷰 |
| `tools/baseline.mjs` | **재현 가능한** 캡처. 각 샷을 격리된 페이지에서, 고정 프레임 예산. 실행 간 비트 동일 |
| `tools/imagediff.mjs` | 픽셀 단위 게이트. 한 픽셀이라도 움직으면 0이 아닌 종료 코드 |
| `tools/profile.mjs` | 실제 디바이스 DPR에서 게임플레이 프로파일러. 프레임 시간 **분포**(p50/p95/p99) + hitch 원인을 WebGL 프로그램 카운트로 어트리뷰트 |
| `tools/playtest.mjs` | 스크립트 기반 이동/발사 스모크 테스트 |

### 두 가지 가치가 있는 발견(이전 측정값을 모두 무효화함)

**중간값 프레임 타임이 실제 문제를 가린다.** 정적 카메라 벤치마크는 94 fps를 보고했지만 게임은 플레이 불가 수준이었다. 실제 게임플레이(Retina DPR, 내부 3.34 MP, 광고상의 2.07 아님)는 12–17 fps에 **728–1236 ms 스톨**이 끼어 있었고, 원인은 게임 도중 34개 이상의 WebGL 프로그램이 지연 컴파일됐기 때문이다. `profile.mjs`가 p50/p95/p99을 리포팅하고 hitch 어트리뷰션을 제공하기 때문에 이 문제가 드러났다.

**캡처가 재현 불가능했다.** `shotset.mjs`는 11장 샷에 한 페이지를 재사용해서 파티클 수명·데칼 버퍼·노출 상태가 다음 샷으로 새어 들어갔다. 동일한 두 번의 실행이 11장 중 10장에서 달랐다. `baseline.mjs`는 각 샷을 새 페이지에서 격리해서 비트 동일하게 만들고, `imagediff.mjs`가 진짜로 쓸 수 있는 게이트가 됐다.

## 성능

Apple Silicon 노트북, 1512×982, DPR 2(3.34 MP 내부), `ultra` 프리셋, 3회 측정, AI·발사 활성화된 실제 게임플레이 기준:

| | 최적화 전 | 후 |
|---|---|---|
| fps p50 | 12–17 | **28–30** |
| fps p99 | 4–9 | **14–17** |
| 최악 프레임 | 728–1236 ms | **66–82 ms** |
| 플레이 중 셰이더 컴파일 | 34–35 | **0** |
| 부팅 | ~9–12 s | **3.7–4.6 s** |

최적화 패스는 **시각적으로 0 변화**를 보장하도록 제약됐고, 이는 `imagediff.mjs`(주장 X)로 강제됐다. 출시 빌드는 모든 11 샷에서 최적화 전 참조와 비트 동일하다.

셰이더 프리웜(`src/core/prewarm.js`)이 스톨을 제거했다. 이것이 **픽셀 중립임을 증명**하려면 먼저 `performance.now()` 대신 엔진 클럭을 사용하도록 만든 서브시스템 수정이 선행돼야 했다. 부팅 시간 변화가 그대로 출력으로 새어 들어왔기 때문이다.

## 정직한 자가평가 (원본 그대로)

목표는 모던 Call of Duty에 필적하는 것이었다. **실패했다.**

11명의 독립된 적대적 비평가(critic)가 CoD 프레임을 기준으로 점수를 매겼다. 점수 흐름은 3.59 → 4.14 → 4.05 → **5.05** / 10. 두 샷이 "CLOSE"에 닿았고 나머지는 "AMATEUR"를 유지한다. 블라인드 A/B에서 **모든 비평자가 모든 라운드에서 진짜 CoD 프레임을 골랐다**.

부족한 곳을 구체적으로:

- **손.** 무기를 설득력 있게 잡지 못하는 각진 손가락 슬랩.
- **머티리얼 풍부도.** 표면이 근접 거리에서도 사진이 아닌 프로시저럴 노이즈처럼 읽힌다 — 코드에서 텍스처를 생성하는 것의 천장.
- **캐릭터.** 적이 원거리에서 마네킹처럼 읽힌다.
- **간접광.** 근사이며 진짜 GI가 아니다.
- **프레임 레이트.** Retina에서 28–30 fps. 아트 패스로 지오메트리 비용이 3배(5.9M → 11.3M tri)가 됐고, 최적화가 그중 절반을 회복한 정도.

### 한국어 fork 정정 (2026-07-27)

원본 README의 이 섹션 맨 마지막 문단 ("A known root cause remains unfixed: the viewmodel light rig in `render/index.js` delivers roughly 20× the irradiance per unit albedo that the world does...")은 **이 fork에서는 정확하지 않다**.

`src/weapons/materials.js` 안에 남겨진 자세한 코멘트가 그 이유를 설명한다. 다섯 라운드 동안 모든 비평자가 "무기에 텍스처가 없다"고 보고했지만 사실은 specular 지배적이어서 디퓨즈 항이 출시 빌드 L=67에 비해 L=26이었다. 이전 라운드들은 밝은 부분 불만에 대응해 알베도를 깎았고, 그게 디퓨즈를 죽여서 더 나빠졌다.

원본의 최종 패치는 **"two coupled moves"**(코멘트 line 126~138):
1. `specularIntensity 0.5 → 0.11`
2. `albedo × 3` (0.098 → 0.285)

이 두 보정은 **이미 코드에 적용된 상태** (`WEAPON_MATERIALS` 블록 안에 박혀있다). 따라서 한국어 fork에서 추가로 라이트 다운/알베도 × 추가 작업을 할 필요가 없었다 — **원본의 보정이 균형을 회복한 시점이 fork의 출발점**이다.

> 정확하게 말하면, 이 fork 작업 초기에 `viewKeyScale 0.55 → 0.42` 패치를 한 번 시도했었다 (`19f62a3` 커밋). 그러나 위 분석 결과 **이미 두 보정이 적용된 상태에서 라이트를 더 내리면 이중 보정**이 돼서 의도와 어긋난다는 것을 깨닫고 0.55로 되돌렸다. 다음 커밋에서 `render/index.js`는 다시 원본 상태가 된다.

## 프로세스 기록 (원본)

순차 단일-소유 패스가 병렬 fan-out을 결정적으로 이겼다. 디렉터리 하나를 소유한 6명 에이전트 × 3 라운드는 점수를 +0.46 움직였지만 프레임을 망가지는 결함을 **더 많이** 만들었다(60 → 47 → 66). 토노매핑·하늘·간접광이 한 결합 시스템인데 고립된 에이전트가 서로 가정을 깨뜨렸기 때문이다. 결합된 관심사를 단일 소유자가 갖는 순차 패스 한 번이 +1.00을 움직이고 결함을 66 → 26으로 줄였다.

가장 가치 있는 단일 결과는 자기 브리프를 스스로 모순한 에이전트에게서 나왔다. 세 라운드 동안 모든 비평자가 "무기에 텍스처가 없다"고 보고했지만 사실은 specular 지배적이어서 디퓨즈 항이 출시 빌드 L=67에 비해 L=26이었다. 이전 라운드들은 밝은 부분 불만에 대응해 알베도를 깎았고, 그게 디퓨즈를 죽여서 더 나빠졌다. 수정은 요청의 정반대였다.

---

## 원본 출처 / Attribution

이 프로젝트는 다음 프로젝트의 포크·한국어화·확장 시도다:

- **원본 저장소:** [mshumer/Claude-of-Duty](https://github.com/mshumer/Claude-of-Duty)
- **원본 작성자:** Matthew Shumer ([@mshumer](https://github.com/mshumer))
- **원본 라이선스:** [MIT](./LICENSE) — Copyright (c) 2026 mshumer
- **원본 사이트:** [shumer.dev/newsletter](https://shumer.dev/newsletter)

MIT 라이선스에 따라 원본의 저작권/허가 표시를 보존한다. 이 fork에서 추가되는 코드도 동일한 MIT 라이선스를 따른다.
