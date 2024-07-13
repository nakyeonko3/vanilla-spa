# SPA앱 배포하기

- 일단 어떻게 배포를 했는지 how to 위주로 정리함.
- 현재 리포지토리를 다른 리포지토리로 연결해서 배포하도록 설정해두었으니 이 프로젝트 코드를 참고해도됨.
- 아래의 설명에서 `개발용 리포`와 `배포용 리포` 두가지 용어를 사용할 것임. 유의해서 읽기를 바람.
- 개발용이 우리가 편집하는 코드가 저장되는 리포지토리고, 배포용이 말그대로 배포용도로만 쓰는 리포지토리임.

- 용어 설명
   - `개발 리포(개발 리포지토리)`: 개발자들이 코드를 수정하고 적는 리포지토리, 깃헙 리포지토리 owner권한이 없어도됨.
   - `배포 리포(배포 리포지토리)`: 개발 리포의 내용을 복사해서 저장만할 리포지토리임, 배포 호스팅 사이트에 등록할 리포지토리

- 개발용 리포 주소
[GitHub - nakyeonko3/vanilla-spa: 개발용 리포지토리.](https://github.com/nakyeonko3/vanilla-spa)

- 배포용 리포
[GitHub - nakyeonko3/vanila-spa-deploy-no-owner: SPA앱 베포용 리포지토리입니다](https://github.com/nakyeonko3/vanila-spa-deploy-no-owner)



## 준비물
- spa로 작성된 토이프로젝트 인트라넷 웹앱
- Gihub Repository 2개가 필요함. `베포용`과 `개발용` 리포 두개. ( owner 권한이 있는 리포지토리와 owner 권한이 없는 팀 organization 리포지토리)
- 개인적으로는 팀 organization을 하나 더 만들고 그걸 배포 리포지토리로 쓰는 걸 추천드림.
- 깃허브 인증 토큰.(인증 토큰 발급 방법도 설명함.)


**지금 보고 계시는 이 리포지토리는 배포하실 때 참고용으로 쓰시면 됩니다**
배포를 설명하기 위해서 제가 한 번 더 배포를 진행해보았습니다. 
이 리포지토리는 **예시 프로젝트**라고 생각하면되요.

- 폴더 구조도
```
vanilla-spa
├─ .prettierrc
├─ image.png
├─ index.html
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ preview.jpg
├─ public
│  └─ _redirects
├─ README.md
├─ server
│  └─ index.js
└─ src
   ├─ css
   │  └─ style.css
   └─ js
      ├─ components
      │  └─ counter.js
      ├─ main.js
      └─ views
         ├─ about.js
         ├─ contact.js
         └─ home.js

```

## 1. 배포에 정합하도록 프로젝트 코드(서버 코드, 프론트엔드코드) 설정하고 수정하기
- express설정들과 vite build 될 때의 정적 파일들이 어떻게 생성되는지 확인을 해보는 작업임.

### `connect-history-api-fallback` 종속성 설치하고, express 서버 코드 수정하기

현재 프로젝트에` connect-history-api-fallback npm `종속성을 설치해준다.
```js
npm i connect-history-api-fallback
```

그리고 서버 코드에 `server/index.js` 위쪽에 이코드를 복사해서  코드부분을 추가해준다.
파일안에 이것을 복사해서 넣어준다.
```js

// 기존에 작성된 import문들은 생략
import history from 'connect-history-api-fallback';

app.use(express.static('dist')) // 정적 파일 제공을 위한 미들웨어

app.use(
  history({
    verbose: true,
    rewrites: [
      {
        from: /^\/api\/.*$/,
        to: function (context) {
          return context.parsedUrl.pathname;
        },
      },
      {
        from: /^\/dist\/.*$/,
        to: function (context) {
          return context.parsedUrl.pathname;
        },
      },
    ],
  }),
);
// ~기존 코드 생략~ 
```


위의 서버 코드를 추가해주고 서버를 실행했는데 멀쩡하던 API 요청이 다 차단되는 경우가 생길 때가 있음. 이럴때는 api 주소  앞에 `/api`를 붙여주지 않은 경우임. cors이슈는 아니니까 당황하니 않아도됨. 

이런식으로  다 /api 경로를 붙여 줘야함. 이미 붙여져 있으면 생략
```js
// api/경로
app.get('/api/employees', (req, res) => {
  indb.getAllEmployees((employees) => {
    res.json({
      status: 'OK',
      data: employees,
    });
  });
});

app.get('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  console.log(`/api/employees/${id} 라우팅 확인`);
  indb.getEmployeeById(id, (employee) => {
    res.json({
      status: 'OK',
      data: employee,
    });
  });
});
```

서버에 오는 모든 API 요청을 전부다 정적 파일을 전달하는 주소`/index.html`로 바뀌어 버리기 때문에 위의 코드에서 `/api` 경로로 오는 서버 요청은 바뀌게 하지 않도록 설정을 해두었음.

### 배포 환경 미리 테스트 해보기

로컬에서는 잘동작하다가 배포 환경에서는 가끔씩 이미지가 안나온다거나 로직이 문제가 생기는 경우가 빈번히 생김.

이를 예방하기 위해서 먼저 배포 환경에서 작동될 명령어들을 실행해보면서 테스트 해봐야함

아래의 명령어를 입력하고 브라우저에 `http://localhost:8080/`를 쳤을 때 우리가 작성한 SPA 사이트가 잘 나오고 있으면 테스트 성공한 것임. 다음 단계로 넘어가도 됨.

```js
npm run build // vite 빌드
npm run start // express 서버 실행
```

![](https://i.imgur.com/oQoHOvX.png)

가끔씩 이미지가 dist에 안들어가게 되는 경우가 존재하니까 꼭 확인해봐야됨. 

vite가 빌드할 때 dist 폴더 안에 이미지를 안 넣을 때가 있음.
안들어간 것들은 보통 자바스크립트 innerHTML로 src를 명시해준 것들임 아래 vite 공식문서를 보고 어떻게 vite가 빌드를 하는지 확인해보고.( 이 참에 vite가 정적 파일을 어떻게 빌드하는지 확인도 해보는게 좋을 것 같다.)
이렇게 수정해불 필요가 있음.

[Vite 가 정적 파일을 처리하는 방법 vite 공식문서](https://vitejs.dev/guide/assets)


아래 코드처럼 작성하면 `avatar-default.jpg` 이미지가 잘 나올 것임.
```js
import profileImg from '../../assets/images/avatar-default.jpg';

const container = querySelector("app");
container.innerHTML = /* HTML */ `
      <form class="profile-form-">
        <div class="profile">
          <img src="${profileImg}" alt="avatar" class="profile__image" id="img1" />
        </div>
      </form>
   `;
```


`avatar-default.jpg` 이미지가 로컬에서는 잘 나와도 배포 환경에서는 not found image 에러가 뜨면서 웹화면에 다 깨져서 나올 가능성이 높음.
```js
const container = querySelector("app");
container.innerHTML = /* HTML */ `
      <form class="profile-form-">
        <div class="profile">
          <img src="src/images/avatar-default.jpg" alt="avatar" class="profile__image" id="img1" />
        </div>
      </form>
   `;
```

## 유저 깃허브 인증 토큰 발급하기

- 깃허브 홈화면 -> settings -> Developer settings 로 차례로 이동
 ![](https://i.imgur.com/7Lq0bbP.png)
 ![](https://i.imgur.com/ngX5NA9.png)

- Personal access tokens 클릭 -> tokens classic 클릭 -> generate new token classic
![](https://i.imgur.com/vAN8GdG.png)

- 아래의 권한을 체크하고 토큰을 발급받고 , 토큰값을 복사해서 어딘가에 저장하면 토큰 발급 완료!
![](https://i.imgur.com/v6gCUoR.png)


## 2. Github action 설정하기 


###  `build.sh` 파일 생성하기

`build.sh` 를 아래 스크립트 코드를 복사한 다음 프로젝트 폴더 루트 경로에 넣어준다.
```shell
#!/bin/sh
cd ../
mkdir output
cp -R ./[team-repo-name]/* ./output
cp -R ./output ./[team-repo-name]/
```
![](https://i.imgur.com/TCW6C9t.png)

`build.sh`를 이제 수정해서 다시 저장해 준다.
 현재 `[team-repo-name]`부분을 수정해서  `개발 리포지토리`의 이름을 적으면 된다.
이걸 적을 때 띄어쓰기나 대문자 소문자를 잘 구분해서 적어야됨.

만약에 현재 `개발 리포` 이름이 `vanil-spa`라면 아래와 같이 build.sh를 작성하면됨.
![](https://i.imgur.com/QksE49O.png)


### secret 시크릿 변수 등록

이제 `개발 리포`에서 시크릿 변수를 등록시킨다. 

깃허브 리포지토리에 메뉴들중에서 settings 탭으로 이동 한다음 screts and variables를 클릭한다. 그리고 repository secrets에서 시크릿 키값을 저장할 수 있다.

`AUTO_` 와 `OFFOCAL_ACCOUNT_EMAIL` 라는 변수를 만들어야한다.
`AUTO_` 라는 변수에는 아까 발급 받은 `ghp_`로 시작하는 유저 깃허브 토큰을 등록한다.
`OFFOCAL_ACCOUNT_EMAIL` 에는 깃헙에 등록된 내 email을 넣어주면된다.

![](https://i.imgur.com/42yKWau.png)
![](https://i.imgur.com/E4v3QxA.png)



### GitHub Actions 활성화 & 워크플로우 생성
일단 개발용 리포지토리에서 action 에서 setup yourself를 클릭
![](https://i.imgur.com/UR4Bo7k.png)


아래`destination-github-username`과 `destination-repository-name`를 수정하고 등록하면 된다.

`destination-github-username`: 여기에는 깃허브 유저 네임을 적으면된다. 만약에 `배포 리포`가 `organization`에 등록된 리포지토리라면 `organization` 이름을 적어준다.  
`destination-repository-name`: `배포 리포`의 이름을 적는다.
```yaml
name: git push into another repo to deploy to vercel

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    container: pandoc/latex
    steps:
      - uses: actions/checkout@v2
      - name: Install mustache (to update the date)
        run: apk add ruby && gem install mustache
      - name: creates output
        run: sh ./build.sh
      - name: Pushes to another repository
        id: push_directory
        uses: cpina/github-action-push-to-another-repository@main
        env:
          API_TOKEN_GITHUB: ${{ secrets.AUTO_ }}
        with:
          source-directory: 'output'
          destination-github-username: [your-repo-github-username]
          destination-repository-name: [your-repo-name]
          user-email: ${{ secrets.OFFICIAL_ACCOUNT_EMAIL }}
          commit-message: ${{ github.event.commits[0].message }}
          target-branch: main
      - name: Test get variable exported by push-to-another-repository
        run: echo $DESTINATION_CLONED_DIRECTORY
```

`배포 리포`의 이름이 `vanila-spa-deploy-no-owner`이고 깃허브 유저 이름이 `nakyeonko3`라면 아래처럼 적으면 된다.
![](https://i.imgur.com/AMNB9ip.png)






