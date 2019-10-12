const titbit = require('titbit');
const wxmsg = require('./msghandle');
const parsexml= require('xml2js').parseString;

var app = new titbit();

app.router.post('/wx/msg', async c => {
    try {
        var data = await new Promise((rv, rj) => {
            parsexml(c.body, {explicitArray : false}, (err, result) => {
                if (err) {
                    rj(err);
                } else {
                    rv(result.xml);
                }
            });
        });
        var retmsg = {
            touser      : data.FromUserName,
            fromuser    : data.ToUserName,
            msg         : data.Content,
            msgtime     : parseInt(Date.now() / 1000),
            msgtype     : ''
        };
        //交给消息派发函数进行处理
        //要把解析后的消息和要返回的数据对象传递出去
        c.res.body = wxmsg.msgDispatch(data, retmsg);
    }catch(err){
        console.log(err);
    }
})
app.run(8000, 'localhost');