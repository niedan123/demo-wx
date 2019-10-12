const titbit = require('titbit');
const fs = require('fs');
const funcs = require('./functions');
const marked = require('marked');
const mdb = require('./initdb');

var app = new titbit({
  debug: true, //开启调式模式，会输出错误信息
  showLoadInfo: false,
});

var {router} = app; //相当于 var router = app.router;

var _dbpath = './information';

//填写自己的域名
mdb.domain = 'https://nie.niedan.top';
mdb.loadData(_dbpath);


router.get('/search', async c => {
  let kwd = '';
  if (c.query.q !== undefined) {
    kwd = c.query.q.trim();
  }

  try {
    c.res.body = {
      status: 0,
      list : mdb.search(kwd)
    };
  } catch (err) {
    console.log(err);
    c.res.status(404);
  }

});

router.get('/images/:name', async c => {
  let imgfile = `${_dbpath}/images/${decodeURIComponent(c.param.name)}`;
  try {
    let content_type = '';
    let extname = c.helper.extName(imgfile);

    switch (extname.toLowerCase()) {
      case '.png':
        content_type = 'image/png'; break;
      case '.jpg':
      case '.jpeg':
        content_type = 'image/jpeg'; break;
      case '.gif':
        content_type = 'image/gif'; break;
      default:;
    }
    c.res.setHeader('content-type', content_type);

    let data = await funcs.readFile(imgfile, 'binary');

    c.res.setHeader('content-length', data.length);

    c.res.encoding = 'binary';
    c.res.body = data;
  } catch (err) {
    c.res.status(404);
  }
});

router.get('/a',async c =>{
  //返回URL查询参数

  c.res.body = c.query;
});

app.run(8000, 'localhost');
