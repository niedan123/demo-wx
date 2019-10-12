const titbit = require('titbit'),
      crypto = require('crypto'),
      xmlparse = require('xml2js').parseString;

var app = new titbit();

var {router} = app;

router.get('/wx/msg',async c =>{
    let token = 'shwxtoken';

    let urlargs =[
        c.query.nonce,//随机数
        c.query.timestamp,//时间戳
        token//token值
    ];

    urlargs.sort();//字典排序

    let onestr = urlargs.join('');//拼接成一个字符串

    //创建sha1加密的Hash对象
    let hash = crypto.createHash('sha1');

    let sign = hash.update(onestr);//进行hash散列计算

    //转换成16进制字符串编码格式和signature对比
    //如果相同则返回随机字符串
    if(sign.digest('hex') === c.query.signature){
        c.res.body = c.query.echostr;
    }
});
router.post('/wx/msg',async c =>{
    //输出获取的消息数据
    console.log(c.body);
    try{
        let data = await new Promise((rv,rj) => {
            xmlparse(c.body,{explicitArray:false},
                (err,result) => {
                    if(err){
                        rj(err);
                    }else{
                        rv(result.xml);
                    }
                });
        });

        if(data.MsgType == 'text'){
            c.res.body = `<xml>
                <FromUserName>${data.ToUserName}</FromUserName>
                <ToUserName>${data.FromUserName}</ToUserName>
                <CreateTime>${parseInt(Date.now())}</CreateTime>
                <MsgType><![CDATA[text]]></MsgType>
                <Content><![CDATA[${data.Content}]]></Content>
            </xml>`;
        }
    }catch(err){
        console.log(err);
    }
});
app.run(8000,'localhost');
