const titbit = require('titbit');
const fs = require('fs');
const funcs = require('./functions');
const marked = require('marked');
const mdb = require('./initdb');
const crypto = require('crypto');
const wxmsg = require('./ch13/src/msghandle');
const parsexml=require ('xml2js').parseString;

var app = new titbit({
  //debug: true, //开启调式模式，会输出错误信息
  //showLoadInfo: false,
  daemon:true
});

var {router} = app; //相当于 var router = app.router;

var _dbpath = './mddata';

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

router.get('/a',async c=>{
  //返回URL查询参数
  c.res.body=c.query;
});
app.router.post('/wx/msg',async c=>{
    try{
        let data =await new Promise((rv,rj)=>{
            parsexml(c.body,{explicitArray:false},
            (err,result)=>{
                if(err){rj(err);}
                else{rv(result.xml);}
            });
        });
        let retmsg={
            touser:data.FromUserName,
            fromuser:data.ToUserName,
            msgtype:'',//为空，在处理
            msgtime:parseInt(Date.now()/1000),
            msg:data.Content
        };
        //交给信息派发函数处理
        //把解析的消息和要返回的数据对象传递下去
        c.res.body=wxmsg.msgDispatch(data,retmsg);

    }catch(err){
        console.log(err);
    }
});



app.daemon(8000, 'localhost');
