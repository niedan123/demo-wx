
![](images/gohttp.png)

# gohttp

针对HTTP/1.1封装的客户端请求库。

基于Promise实现，可以通过then接收返回结果，或者配合async/await使用。

## 安装

```
npm i gohttp
```

## GET请求

``` JavaScript

const gohttp = require('gohttp');

var hcli = new gohttp();

hcli.get('http://localhost:2019/')
.then(data => {
    console.log(data);
}, err => {
    console.log(err);
});

```

## POST请求

``` JavaScript

const gohttp = require('gohttp');

var hcli = new gohttp();

hcli.post('http://localhost:2019/p', {
    body : {
        user: 'wang'
    }
})
.then(data => {
    console.log(data);
}, err => {
    console.log(err);
});

```

## 上传文件

``` JavaScript

const gohttp = require('gohttp');

var hcli = new gohttp();

hcli.upload('http://localhost:2019/upload', {
    files: {
        image: [
            'pictures/a.jpg',
            'pictures/b.png'
        ],
        video: [
            'videos/a.mp4',
            'videos/b.mp4'
        ]
    }
})
.then(data => {
    console.log(data);
}, err => {
    console.log(err);
});

```
