/* 동현스 출전 예제. 동현랭이 출력한 정수를 차례로 읽는다: 첫 정수 = 생명 수(1~9, 필수)
   · 둘째 정수 = 폭탄 수(0~5, 선택) · 셋째 정수 = 시작 스테이지(1~7, 선택) · 넷째 정수 = 배경 색(1 미색 · 2 스케치북 흰색, 선택). */
function expression(n){
  if(n===0)return '도옹ㅠ';
  if(n<0)return 'ㅠ '+expression(-n);
  if(n<=10)return '도'+'오'.repeat(n-1)+'옹';
  for(let a=10;a>=2;a--)if(n%a===0)return expression(a)+' '+expression(n/a);
  return '도'+'오'.repeat(n-1)+'옹';
}
const output=(...ns)=>ns.map(n=>'뿡뿡 '+expression(n)+'~뿡뿡뿡').join('~');
const block=(label,...ns)=>'ㅋㅋ '+label+'\n'+output(...ns);
const wrap=a=>['나는 동현이냐?',...a,'동현이구나'].join('\n');
const examples=[
 {id:'basic',title:'01 · 기본 · 생명 3',note:'첫 정수 3이 생명 수다. 기체 셋으로 나선다. 나머지는 기본값이라 폭탄 2, 스테이지 1부터, 종이는 미색이다. 처음이라면 이 예제로 조작을 익히자.',
  code:wrap([block('생명 3',3)])},
 {id:'easy',title:'02 · 넉넉하게 · 생명 5 · 폭탄 4',note:'둘째 정수가 폭탄 수다. 시작할 때와 새 기체가 나올 때 이만큼 채워진다. 위험하면 아끼지 말고 폭탄을 쓰자.',
  code:wrap([block('생명 5',5),block('폭탄 4',4)])},
 {id:'white',title:'03 · 스케치북 흰색 종이',note:'넷째 정수 2는 스케치북 수준의 흰색 종이다. 넷째를 쓰려면 앞의 셋도 차례로 써야 한다. 종이 색이 바뀌면 그림을 모두 새로 그리느라 잠깐 기다린다.',
  code:wrap([block('생명 3',3),block('폭탄 2',2),block('스테이지 1',1),block('배경 2 · 스케치북 흰색',2)])},
 {id:'stage3',title:'04 · 스테이지 3부터',note:'셋째 정수가 시작 스테이지다. 3이면 셋째 장 「먹구름 항구」부터 날아간다. 힘은 1단계에서 시작한다.',
  code:wrap([block('생명 3',3),block('폭탄 2',2),block('스테이지 3',3)])},
 {id:'last',title:'05 · 마지막 스테이지 연습 · 생명 9 · 폭탄 5',note:'가장 넉넉한 설정으로 스테이지 7 「백지 하늘」만 연습한다. 생명 9, 폭탄 5. 끝에서 끝판왕 흑심 대요새가 나온다.',
  code:wrap([block('생명 9',9),block('폭탄 5',5),block('스테이지 7',7)])},
 {id:'one',title:'06 · 기체 하나 · 폭탄 없음',note:'생명 1, 폭탄 0. 한 번 맞으면 끝난다. 아이템으로 폭탄을 얻을 수는 있다.',
  code:wrap([block('생명 1',1),block('폭탄 0',0)])},
 {id:'whitehard',title:'07 · 흰 종이 · 스테이지 4 · 생명 2',note:'네 정수를 다 쓰는 예다. 생명 2, 폭탄 1, 스테이지 4 「연필심 산맥」부터, 스케치북 흰색 종이.',
  code:wrap([block('생명 2',2),block('폭탄 1',1),block('스테이지 4',4),block('배경 2 · 스케치북 흰색',2)])}
];
