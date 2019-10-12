const formatMsg = require('./fmtwxmsg');

function help(){
    //字符串形式返回帮助信息
    //还可以是以读取文件的形式来返回
    return `聂丹`
}
/*
* @param {object} wxmsg 解析XML消息的对象
* @param {object} retmsg 要返回的数据对象
**/
function userMsg(wxmsg,retmsg){
    //关键字自动回复
    if(wxmsg.MsgType == 'text'){
        switch(wxmsg.Content){
            case '帮助':
            case 'help':
            case '?':
                retmsg.msg = help();
                retmsg.Msgtype = 'text';
                return formatMsg(retmsg);
            case 'about':
                retmsg.Msgtype = 'text';
                retmsg.msg = '我是聂丹';
                return formatMsg(retmsg);
            default:
                retmsg.msgtype = wxmsg.MsgType;
                retmsg.msg = wxmsg.Content;
                return formatMsg(retmsg);
        }
    }
    //处理其他类型消息
    switch(wxmsg.MsgType){
        case 'image':
        case 'voice':
            retmsg.msgtype = wxmsg.MsgType;
            retmsg.msg = wxmsg.MediaId;
            return formatMsg(retmsg);
        default:
            //retmsg.msgtype类型为空
            //格式化数据会返回default处的数据
            //提示用户该类型不被支持
            retmsg.msg = '不支持的类型';
    }
    return formatMsg(retmsg);
}
exports.help = help;
exports.userMsg = userMsg;

//后续还会加入事件消息支持
exports.msgDispatch = function msgDispatch(wxmsg,retmsg){
    return userMsg(wxmsg,retmsg);
};