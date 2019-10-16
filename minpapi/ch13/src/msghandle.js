const formatMsg = require('./fmtwxmsg');

function help (){
	return '你好，这是一个测试号，目前会原样返回用户输入的信息'
}

function userMsg (wxmsg,retmsg){

	if(wxmsg.MsgType == 'text'){
              switch (wxmsg.Content){
	      	case '帮助':
	        case 'help':
                case '?':
	             retmsg.msg = help();

		     retmsg.msgtype = 'text';

	             return formatMsg(retmsg);
	       case 'about':
	             retmsg.msgtype = 'text';
	             retmsg.msg = '我是这个测试号开发者，如果有疑问可咨询123@qq.com';
	             return formatMsg(retmsg);
		case 'who':
		     retmsg.msgtype = 'text';
	             retmsg.msg = '2017级5班 聂丹 学号:2017011923';
	             return formatMsg(retmsg);
                default:
		     retmsg.msgtype = wxmsg.MsgType;
	             retmsg.msg = wxmsg.Content;
	             return formatMsg(retmsg);
	      }

	}
	//处理其他类型的信息
	switch (wxmsg.MsgType){
		case 'image':
		case 'voice' :
			retmsg.msgtype = wxmsg.MsgType;
			retmsg.msg = wxmsg.MediaId;
			return formatMsg(retmsg);
		dafault:
			return formatMsg(retmsg);
	}
}

exports.help = help ;
exports.userMsg = userMsg;

function eventMsg (wxmsg,retmsg){
    retmsg.msgtype = 'text';


switch (wxmsg.Event){

	case 'subscribe':
		retmsg.msg = '你好，这是一个测试号,谢谢关注';
		return formatMsg(retmsg);
	case 'unsubscribe':
		console.log(wxmsg.FromUserName,'取消关注');
		break;
	case 'CLICK':
		retmsg.msg = wxmsg.EventKey;
		return formatMsg(retmsg);
	case 'VIEW':
		console.log('用户浏览',wxmsg.EventKey);
		break;
	dafault:
		return '';


}

	return '';
}
//后续还会加入时间消息支持
exports.msgDispatch = function(wxmsg,retmsg){
	if(wxmsg.MsgType == 'event'){
		return eventMsg(wxmsg,retmsg);
	}
	return userMsg(wxmsg,retmsg);
}


