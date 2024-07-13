# SPA앱 배포하기

- 일단 어떻게 배포를 했는지 how to 위주로 정리함.
- 나만의 CI/CD를 구축하는 것이 목적임.
- main에 커밋 할 때마다 바로 바로 변경사항이 배포 사이트에도 반영되도록함.
- 현재 리포지토리를 다른 리포지토리로 연결해서 배포하도록 설정해두었으니 이 프로젝트 코드를 참고해도됨.
- 일반적인 방법으로 owner권한이 없는 리포지토리를 배포할 수 있는 방법은 없기 때문에 복사한 리포를 배포하는 특이한 방법을 씀.
- 백엔드 코드와 프론트엔드 코드를 분리 할 필요가 없음. 같은 리포지토리 안에 넣어서 배포하면됨.


## 준비물

- spa로 작성된 토이프로젝트 인트라넷 웹앱
- Gihub Repository 2개가 필요함. `베포 리포`와 `개발 리포`  두개. ( owner 권한이 있는 리포지토리와 owner 권한이 없는 팀 organization 리포지토리)
- `배포 리포지토리`는 팀 organization을 하나 더 만들고 그걸 쓰는 걸 추천드림.
- 깃허브 인증 토큰.(인증 토큰 발급 방법은 아래서 설명함.)


## 유의 사항

- 아래서 설명할 때 `개발 리포지토리`와 `배포 리포지토리`라는 용어를 쓸 것임.
- `개발 리포지토리(개발 리포)`는 우리가 편집하는 코드가 저장되는 리포지토리임. owner 권한이 없어도 됨.
- `배포 리포지토리(배포 리포)`는 말그대로 배포용도로만 쓰는 리포지토리임. owner권한이 있어야함.
- 이런식으로 두개의 리포가 필요함. 이번 토이프로젝트 때 팀2도 이런식으로 리포지토리를 2개 만들었습니다.
![](https://i.imgur.com/LxaEnXC.png)

- **작성할 스크립트를 작성 할 때는 오타나 띄어 쓰기를 유의해서 작성해야함.**
- 스크립트를 그대로 복사해서 쓰는 것이 아니라 배포하려는 리포지토리와 깃허브 유저네임 등에 맞게 **수정한 다음 사용해야함.**


## 지금 리포지토리는 참고용으로 쓰시면 됩니다.

이 리포지토리는 배포를 설명하기 위한 프로젝트입니다.
마찬가지로 이 프로젝트 도 개발 리포, 배포 리포 두개를 만들었음.

- [GitHub - nakyeonko3/vanilla-spa: 개발 리포지토리](https://github.com/nakyeonko3/vanilla-spa)
- [GitHub - nakyeonko3/vanila-spa-deploy-no-owner: 배포 리포지토리](https://github.com/nakyeonko3/vanila-spa-deploy-no-owner)


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

## 목차
이 4단계로 차례로 설명하겠음.
 1. `connect-history-api-fallback` 종속성 설치하고, express 서버 코드 수정하기
 2. 배포 환경 미리 테스트 해보기
 3. Github action 설정해서 `개발용 리포`와 `배포용 리포`를 동기화 시키기
 4.  `배포용 리포지토리`를 웹 배포 서비스 사이트에 등록하기


## 1. `connect-history-api-fallback` 종속성 설치하고, express 서버 코드 수정하기

### `express.static('dist')`를 사용하는 이유
- 정적 파일들(Javascript, HTML, CSS, 등)을 서버가 제공하기 위해서임.
- 사용자가 정적 파일을 요청하는 URL을 입력했을 때, 서버는 해당 파일을 `dist` 디렉토리에서 찾아서 사용자의 브라우저로 전송한다.
- `/index.html` URL주소를 요청해도 서버에서는 `dist/index.html` 로 매핑해서 처리하는 것임. 
- 예를 들어 , `/index.html`, `/styles.css`, `/main.js` 주소를 요청하면 `dist` 디렉토리에 있는 해당 파일을 사용자의 브라우저로 전송한다.
- 우리의 SPA가 들어 있는 index.html를 사용자의 브라우저 화면으로 보내기 위해서는 꼭 필요하다.
- [참고 Serving static files in Express](https://expressjs.com/en/starter/static-files.html)

- 만약 사용자가 `/`위치 URL을 요청한다면 이 `dist`디렉토리에 있는 `index.html` 사용자의 브라우저로 전송하고,index.html에 포함된 JavaScript, CSS, 등을 통해 우리가 제작한 웹사이트를 브라우저가 화면을 그려주게 될 것이다.
![](https://i.imgur.com/kRtKcD9.png)

- 문제는 이것만 사용해서는 SPA앱이 제대로 동작하지 않는다. `connect-history-api-fallback`도 사용해줘야 한다.

### `connect-history-api-fallback` 을 사용하는 이유
- SPA의 클라이언트측 라우팅이 동작하기 위해서 설치함.
- 로컬에서는 SPA웹앱을 접속할 때 SPA의 클라이언트측 라우터가 잘 라우팅을 해주지만, 배포 환경에서는 잘 동작하지 않을 가능성이 높다. 그 이유는 다음과 같다.
- 루트 주소(`/`)로 사용자가 접속하고 다른 주소로 이동하는 것은 문제가 없지만 처음 사용자가 루트 주소가 아닌 `/employee-list` ,`/show-inofo`같은 주소를 처음에 들어 오게 되면 해당 루트 주소로 서버에 요청을 보내게 되는데 해당 주소는 서버에는 등록이 되어 있지 않다. 
- 해당 주소들에 대한 처리는 클라이언트측 라우터가 처리를 해야하는데 다른 루트 주소로 접속하면 해당 클라이언트측 라우터가 먼저 동작하지 않고, 서버에 먼저 요청이 가게 된다.
- 제대로 동작하기 위해서는 서버가 클라이언트 라우터가 처리해야 하는 주소를 클라이언트측 라우터로 전달시키고, 클라이언트측 라우터가 해당 주소를 처리하도록 해야한다. 
- `connect-history-api-fallback`은 서버에 정의 되지 않은 주소들(클라이언트측 라우터가 처리하는 주소들)들을 전부다 서버가  `index.html` 을 응답으로 제공하게 된다.
- 이렇게 하면 `/employee-list`라는 주소로 처음 접속해도, 서버는  `index.html`를 응답으로 제공하고, 해당 `index.html` 안에는 클라이언트측 라우터가 `/employee-list` 주소를 대신 처리하게 된다. 
- 결론적으로는  `connect-history-api-fallback`를 사용해서 클라이언트측 라우터가 처리하는 주소들은 클라이언트측 라우터가 처리하도록 하기 위함이다.
- [참고 connect-history-api-fallback - npm](https://www.npmjs.com/package/connect-history-api-fallback)

- 아래 사진은 express 서버를 nodemon으로 실행된 후 터미널에 뜬 메시지들이다. `/gallery` 로 요청된 주소를 `/index.html`로 바꿔서 처리하는 것을 알 수 있다.
![](https://i.imgur.com/BMafXE2.png)


- 이렇게 하면 `/gallery` 주소로 요청을 보내도 서버는 `index.html`을 사용자의 브라우저로 전송하고 `index.html`안에 있는 JavaScript로 작성된 클라이언트측 라우터가 동작해서 `/gallery`주소로 라우팅을 해주고 갤러리 화면을 사용자의 웹화면에 보여준다.

```bash
Rewriting GET /gallery to /index.html
GET /gallery 200 10.625 ms - 1626
```

- 근데 보통은 사용자가 로그인을 하지 않았다면 `/gallery`를 사용자가 입력해도 클라이언트 라우터가 갤러리 화면을 보여주지 않고 클라이언트측 라우터가 해당 라우팅 주소를 `/`또는 `/login`으로 바꾸고 로그인 화면이 뜨게 하는 것이 일반적이긴하다.

### `connect-history-api-fallback` 종속성을 추가하고, 서버 코드 수정하기

현재 프로젝트에`connect-history-api-fallback npm`종속성을 설치해준다.

```js
npm i connect-history-api-fallback
```

그리고 서버 코드에 `server/index.js` 위쪽에 이코드를 복사해서 코드부분을 추가해준다.
파일안에 이것을 복사해서 넣어준다.

```js
// 기존에 작성된 import문들은 생략
import history from 'connect-history-api-fallback';

app.use(express.static('dist')); // 정적 파일 제공을 위한 미들웨어

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
    ],
  }),
);
// ~기존 코드 생략~
```

위의 서버 코드를 추가해주고 서버를 실행했는데 멀쩡하던 API 요청이 다 차단되는 경우가 생길 때가 있음. 이럴때는 api 주소 앞에 `/api`를 붙여주지 않은 경우임. cors이슈는 아니니까 당황하니 않아도됨.

이런식으로 다 /api 경로를 붙여 줘야함. 이미 붙여져 있으면 생략

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

## 2. 배포 환경 미리 테스트 해보기


### 빌드 명령어와 서버 실행 명령어 테스트 해보기
로컬에서는 잘동작하다가 배포 환경에서는 가끔씩 이미지가 안나온다거나 로직이 문제가 생기는 경우가 빈번히 생김.

이를 예방하기 위해서 먼저 배포 환경에서 작동될 명령어들을 실행해보면서 테스트 해봐야함

아래의 명령어를 입력하고 브라우저에 `http://localhost:8080/`를 쳤을 때 우리가 작성한 SPA 사이트가 잘 나오고 있으면 테스트 성공한 것임. 다음 단계로 넘어가도 됨.

```js
npm run build // vite 빌드
npm run start // express 서버 실행
```
![](https://i.imgur.com/oQoHOvX.png)

### vite 빌드 결과물에 이미지가 누락되는지 확인하기 

- vite 빌드 후에 가끔씩 이미지가 dist에 안들어가게 되는 경우가 존재하니까 꼭 확인해봐야됨.
- vite는 빌드과정에서 JavaScript 코드를 이용해서 넣은 이미지들 중에서는 import 문을 통해 명시적으로 참조된 이미지들만 최종 빌드 결과물에 포함시킴.
-  JavaScript에서 또는 `new URL`를 이용해서 명시한 이미지도 빌드 결과물에 포함을 시킴. 근데 이 부분은 동적으로 이미지 new URL를 만들면 안되는 경우가 있어서 유의해야함, 자세한건 [Vite 가 정적 파일을 처리하는 방법 vite 공식문서](https://vitejs.dev/guide/assets) 를 보는게 좋음) 
- vite가 html, css에서 Link태그나 url() 속성을 이용해서 넣은 이미지들은빌드 최종결과물에 포함시키니 문제가 없음.
- 그래서 이렇게 수정해불 필요가 있음.



아래 코드처럼 작성하면 `avatar-default.jpg` 이미지가 잘 나올 것임.

```js
import profileImg from '../../assets/images/avatar-default.jpg';

const container = querySelector('app');
container.innerHTML = /* HTML */ `
  <form class="profile-form-">
    <div class="profile">
      <img src="${profileImg}" alt="avatar" class="profile__image" id="img1" />
    </div>
  </form>
`;
```

`avatar-default.jpg` 이미지가 로컬에서는 잘 나와도 배포 환경에서는 다깨져서 나올 가능성이 높음.

```js
const container = querySelector('app');
container.innerHTML = /* HTML */ `
  <form class="profile-form-">
    <div class="profile">
      <img src="src/images/avatar-default.jpg" alt="avatar" class="profile__image" id="img1" />
    </div>
  </form>
`;
```



## 3. Github action 설정해서 `개발용 리포`와 `배포용 리포`를 동기화 시키기



### 유저 깃허브 인증 토큰 발급하기
---
- 깃허브 홈화면 -> settings -> Developer settings 로 차례로 이동
  ![](https://i.imgur.com/7Lq0bbP.png)
  ![](https://i.imgur.com/ngX5NA9.png)

- Personal access tokens 클릭 -> tokens classic 클릭 -> generate new token classic
  ![](https://i.imgur.com/vAN8GdG.png)

- 아래의 권한을 체크하고 토큰을 발급받고 , 토큰값을 복사해서 어딘가에 저장하면 토큰 발급 완료!
  ![](https://i.imgur.com/BC2296D.png)

아래의 설정 파일을 일단 복사하기

### `build.sh` 파일 생성하기


이걸 그대로 그대로 쓰면 안되고 현재 `[team-repo-name]`에 개발 리포지토리명을 적으면됨.

```shell
#!/bin/sh
cd ../
mkdir output
cp -R ./[team-repo-name]/* ./output
cp -R ./output ./[team-repo-name]/
```

요런식으로 적으면됨.
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

아래`destination-github-username`과 `destination-repository-name`를 편집하고 등록하면 된다.
현재 리포가 배포 레포지토리 소유자의 username과 repo 이름을 적어준다.
소유자가 자기 자신이면 username을 넣으면 된다. repo에는 말그대로 배포용 리포지토리 이름을 넣어 주면 된다.
이렇게 작성하고 commit 버튼을 누르거나 `.github/workfows/main.yml`여기에 저장하면 된다.

```yaml
name: git push into another repo to deploy repo

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

![](https://i.imgur.com/6yqju4L.png)


### 커밋 누르고 동기화 확인하기

한 번 커밋을 누르고 배포용 리포와 개발용 리포가 방금 작성한 yml파일을 제외하고 동기화가 되고 있는 것을 확인하면 됨.

이렇게 동기화가 되고 있으면 성공
![](https://i.imgur.com/ZSOFigD.png)


## 4. `배포용 리포지토리`를 웹 배포 서비스 사이트에 등록하기

일단은 render가 무료고 추가 비용청구가 될 일이 없어서 render를 쓸 것임.
다만, 콜드 스타트 이슈 때문에 가능하면 다른 배포 사이트를 사용하는 것도 좋음.
render 대신에 koyeb나 railway를 배포해도 괜찮음. 배포 방법은 동일함.
vercel은 안됨.

이 링크를 참고해서 이 중에 하나를 고르면 됨.
https://github.com/DmitryScaletta/free-heroku-alternatives?tab=readme-ov-file

### render 에 배포 리포지토리를 등록하기
render 가입하는 방법은 생략함.
데시보드 화면 또는 위의 메뉴에 new를 클릭.
거기서 web service를 클릭

![](https://i.imgur.com/S72R8GI.png)


그러면 이런 화면에 나오는데 `배포 리포지토리`가 있는 organization을 클릭하거나,
Public Git Repository를 선택해서 `배포 리포지토리`를 등록하면됨.

![](https://i.imgur.com/2Z6yfYZ.png)
![](https://i.imgur.com/WjNCDs7.png)

그리고 아래처럼 등록 region을 싱가포르로 바꾸고.
instance Type을 free를 선택하고,
deploy web service를 누르면 끝

![](https://i.imgur.com/wTtS9Xb.png)



### 배포 완료

이제 해당 사이트에서 빌드가 다 되었다는 메시지가 로그창에 뜨고 배포 링크에 들어가면 우리의 웹사이트가 잘 배포가 되고 있음.

이제는 `개발 리포`에서 main에 커밋을 할 때 변경한 사항이 배포 사이트에서 해당 변경 내역에 대한 것을 반영하고 재빌드하게 될 것임.
![](https://i.imgur.com/b5a6vuU.png)

### 선택) 환경 변수 등록
외부 API를 요청하는 경우 API KEY를 여기 환경 변수에 등록하고 사용하는 것이 좋음.
예를 들자면, 이미지 호스팅 서비스를 이용하거나 날씨 API등을 사용할 때 API KEY는 환경변수에 등록하면 됨. 
![](https://i.imgur.com/K25P7RY.png)
