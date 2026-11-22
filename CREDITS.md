# 동현스™: 출처·이용 안내

동현스는 1997년 Psikyo의 오락실 게임 「스트라이커즈 1945 II」에서 세로 슈팅의 **큰 틀**을 참고한 비상업적 취미 작품이다. Psikyo 게임의 권리는 지금 KM-BOX가 가진 것으로 알려져 있다. 동현스는 이들과 관계가 없고 승인도 받지 않았다. 부제 ‘연필로 그린 1945-2’는 어떤 게임을 본떴는지 밝히려고 붙인 것이다.

## 원작에서 참고한 것

- 큰 틀만 참고했다: 세로로 긴 화면, 샷·모아 쏘기·폭탄, 기체마다 다른 모아 쏘기와 폭탄, 중간 보스와 보스가 나오는 스테이지, 아주 쉬운 단계부터 고르는 난이도, 땅 위의 적이 떨어뜨리는 메달.
- 다르게 만들었다: 1인용, 스테이지 다섯, 기체 셋, 난이도 셋(초급·중급·상급), 동현랭으로 정하는 생명 수·폭탄 수·시작 스테이지·배경 색, 저장·불러오기, 전체 화면, 손가락 조작, 게임패드. 음악은 없다.
- 원작 게임의 그림·음악·효과음·글·스테이지 배치·탄막 자료·코드는 하나도 쓰지 않았다. 원작 파일과 그 일부는 이 저장소에 없고, 원작 파일에서 그림이나 자료를 꺼내 쓰지도 않았다.
- 구체적인 수치(탄의 수와 속도, 쏘는 간격, 체력, 점수, 모으는 시간)는 모두 동현스가 정한 것이다.

## 동현스가 새로 만든 것

- 게임 엔진(`src/game.js`), 기체·적·보스·스테이지 자료(`src/data.js`), 연필 선과 종이(`src/sketch.js`), 그림(`src/art.js`·`art2.js`·`art3.js`·`terrain.js`), 화면(`src/render.js`), 입력(`src/input.js`), 출전·메뉴·저장(`src/app.js`), 동현랭 출전 규약과 예제(`src/examples.js`), 문서, 시험.
- 그림 파일은 시작 화면의 제목 한 장(`src/title.png`)이다. 그 밖의 비행기, 적, 보스, 땅, 구름, 폭발, 종이의 결은 쪽이 열릴 때 코드가 연필 선을 그어 만든다.
- 시작 화면의 제목 ‘동현스’는 제작자의 아내가 직접 쓴 글씨다. 이 글씨에 대한 권리는 MIT 코드 라이선스와 별개로 쓴 사람에게 있다. 코드를 가져다 쓸 때 이 글씨는 바꿔 쓰기를 권한다.
- 동현랭 실행기(`src/donghyun.js`)는 [동현랭 저장소](https://github.com/Raspberry-Kim/donghyun-lang)의 v1.55를 고치지 않고 썼다. 합성 효과음과 게임패드, 편집기·전체 화면·저장 메뉴는 동현큐·동현램의 방식을 따랐다.

## 기체 이름

XF5U 플라잉 팬케이크(Vought), Ki-84 하야테(Nakajima), P-38 라이트닝(Lockheed)은 실제 있었던 항공기의 이름이다. 동현스의 그림은 이 항공기들의 생김새를 보고 연필 선으로 새로 그린 것이고, 성능과 무기는 게임에 맞게 지어낸 것이다. 제조사와 관계가 없다.

## 포동이

머리글의 포동이는 동현 시리즈의 말티즈다. 포동이의 이름과 모습에 대한 권리는 MIT 코드 라이선스와 별개로 만든 사람에게 있다. 코드를 가져다 쓸 때 이 그림과 이름은 바꿔 쓰기를 권한다.

## 참고한 자료

- Strikers 1945 II — Wikipedia: https://en.wikipedia.org/wiki/Strikers_1945_II
- Strikers 1945 II Review (Switch eShop) — Nintendo Life: https://www.nintendolife.com/reviews/switch-eshop/strikers_1945_ii
- Delisted Psikyo shoot 'em ups for PC to return via rights holder KM-BOX — Gematsu, 2025-12-11: https://www.gematsu.com/2025/12/delisted-psikyo-shoot-em-ups-for-pc-to-return-via-rights-holder-km-box

## 글꼴

검은고딕 Black Han Sans · Pretendard · 나눔고딕코딩 · 개구 Gaegu — SIL Open Font License 1.1 (`licenses/`). 게임 화면의 글은 손글씨 글꼴 Gaegu에서 쓰는 글자만 추려 담았다. 시작 화면의 제목은 글꼴이 아니라 제작자의 아내가 직접 쓴 글씨다.

## 라이선스

동현스 코드·문서: MIT (`LICENSE`). 시작 화면의 제목 글씨(`src/title.png`)는 여기에 들지 않는다. 동현랭 실행기: MIT (`licenses/DONGHYUN-MIT.txt`).
