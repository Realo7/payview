
var byte1d = [0x1D];
var byte1f = [0x1F];
var byte02 = [0x02];
var byte03 = [0x03];

var d1 = String.fromCharCode(byte1d);
var f1 = String.fromCharCode(byte1f);
var b02 = String.fromCharCode(byte02);
var b03 = String.fromCharCode(byte03);

var ws;
var ws_url;//缓存通讯url 
var wx_change_QR;//微信找零url
var sendInit;

var tempInterval;
var licensePlates1;
var licensePlates;

//根据车牌查询缴费信息
function search() {

    var plate = '';
    for (var i = 0; i < 8; i++) {
        var ndNow = $('.car-plate').eq(i);
        if (ndNow.val() == '') { break; }
        plate = plate + ndNow.val();
    }
    if (plate.length >= 7) {
        var tempsendInit = b02 + "Msg" + f1 + "Req" + d1 + "Type" + f1 + "Search" + d1 + "Code" + f1 + plate + d1 + "CodeType" + f1 + "1" + d1 + "crc" + f1 + d1 + b03;
        ws.send(tempsendInit);
        console.log("发送" + tempsendInit + "成功");

    } else { mui.toast("请输入完整车牌"); }
}

window.onload = function () {

    /* 注册键盘1 */
    licensePlates1 = new licensePlate({
        title: '示例1键盘',
        className: 'demo_one',
        value: [''],
        step: 1,
        onPress: (value, e) => {
            console.log(value);
            $('.input_one').val(value.join(''));
        },
    });

    $('.input_one').click(function () {
        licensePlates1.show();
    });

    $('#btn-remove').click(function () {
        licensePlates1.remove();
    });

    /* 注册键盘2 */
    licensePlates = new licensePlate({
        title: '车牌号键盘',
        className: 'demo_two',
        onPress: (value, e) => {
            console.log(value);
            var ndNow = $('.car-plate').removeClass('active').eq(licensePlates.step);
            ndNow.val(value[licensePlates.step]);
            if (e.target.className === 'license-delete' || licensePlates.step === licensePlates.level.length - 1) {
                ndNow.addClass('active');
            } else {
                ndNow.next().addClass('active');
            }
        },
    });

    $('.car-plate').click(function (e) {
        $('.car-plate').removeClass('active');

        licensePlates.go($(this).addClass('active').index()).show();
    });

    $(document).click(function (e) {
        console.log(e.target.className);
        // 收起键盘2
        if (e.target.className !== 'car-plate active') {
            $('.car-plate').removeClass('active');
            // licensePlates.hide();
        }
        // 收起键盘1
        if (e.target.className !== 'input_one') {
            licensePlates1.hide();
        }
    });
    licensePlates.show();
}


setTimeout(function () {

    var data = getQueryVariable("callback");//处理收到的参数

    //第一次打开网页 需要检测配置信息
    if (data == "false" || data == false) {

        data = getQueryVariable("ps");//处理收到的参数

        //没有指定设备出厂编号
        if (data == "false" || data == false) {

            mui.toast("打开设备终端不合法");
            return;
        }

        var num = randomNum(1, 100);

        //开始读取配置信息 发送初始化命令给中间件
        var xmlurl = "Config//config.xml?v=" + num;
        var xmlurl_ps = "Config//" + data + "//PSconfig.xml?v=" + num;

        //是否存在配置文件
        if (IsExistsFile(xmlurl) && IsExistsFile(xmlurl_ps)) {

            //加载XML文件 注意XML字段不可以有空值
            var root = getxmlDoc(xmlurl);
            var root_ps = getxmlDoc(xmlurl_ps);
            getparams_ps(root, root_ps, data);
        }
        else {
            mui.toast("配置文件不存在");
            return;
        }
    }
    else {//跳转回的主页

        console.log("收到参数:" + data);

        var jsondata = JSON.parse(data);

        ws_url = jsondata.ws_url;//缓存通讯url
        //scanUrl = jsondata.scanUrl;//扫码付url
        //wx_change_QR = jsondata.wx_change_QR;//微信找零url

        connectws(ws_url, "");//重新连接服务器
    }
}, 2000);

setInterval(function () {
    var date = new Date();
    var year = date.getFullYear(); //获取当前年份
    var mon = date.getMonth() + 1; //获取当前月份
    var da = date.getDate(); //获取当前日
    var h = date.getHours(); //获取小时
    var m = date.getMinutes(); //获取分钟
    var s = date.getSeconds(); //获取秒
    if (s < 10) {
        s = "0" + s;
    }
    var d = document.getElementById('Date');
    d.innerHTML = year + '-' + mon + '-' + da + ' ' + h + ':' + m + ':' + s;
}, 1000);

//初始化中间件参数
function getparams_ps(root, root_ps, data) {
    console.log("chus")

    //scanUrl = root.getElementsByTagName("scanUrl")[0].firstChild.nodeValue;
    wx_change_QR = root.getElementsByTagName("wx_change_QR")[0].firstChild.nodeValue;

    var serverIP = root.getElementsByTagName("serverIP")[0].firstChild.nodeValue;
    var serverPort = root.getElementsByTagName("serverPort")[0].firstChild.nodeValue;
    var wsPort = root.getElementsByTagName("wsPort")[0].firstChild.nodeValue;
    var ThirdPayUrl = root.getElementsByTagName("ThirdPayUrl")[0].firstChild.nodeValue;

    //var telPhone = root.getElementsByTagName("telPhone")[0].firstChild.nodeValue;
    //document.getElementById("telphone").innerHTML = telPhone;

    var damPort = root_ps.getElementsByTagName("damPort")[0].firstChild.nodeValue;
    var cashCodePort = root_ps.getElementsByTagName("cashCodePort")[0].firstChild.nodeValue;
    var scanPort = root_ps.getElementsByTagName("scanPort")[0].firstChild.nodeValue;
    var printPort = root_ps.getElementsByTagName("printPort")[0].firstChild.nodeValue;
    var pcAdr = data;
    var inputMode = root_ps.getElementsByTagName("inputMode")[0].firstChild.nodeValue;

    var inputPlate = inputMode.substring(0, 1);
    var scanTicket = inputMode.substring(1, 2);

    if (inputPlate == 0) {
        document.getElementById("inpt").style.display = "none";
        document.getElementById("platetext").style.display = "none";
        licensePlates.hide();
        document.getElementById("helpimg").style.marginTop = "-70%";
    } else {
        console.log("输入车牌模式");
    }

    if (scanTicket == 0) {
        document.getElementById("ticketext").style.display = "none";
        var img = document.getElementById("imgmechine");
        img.src = "";
        licensePlates.show();
        document.getElementById("helpimg").style.marginTop = "10%";
    } else {
        console.log("扫票模式")
    }

    var ParaInfo = {};
    ParaInfo.wx_change_QR = wx_change_QR;
    ParaInfo.serverIP = serverIP;
    ParaInfo.serverPort = serverPort;
    ParaInfo.damPort = damPort;
    ParaInfo.cashCodePort = cashCodePort;
    ParaInfo.scanPort = scanPort;
    ParaInfo.printPort = printPort;
    // ParaInfo.telPhone = telPhone;
    ParaInfo.pcAdr = pcAdr;
    ParaInfo.ThirdPayUrl = ThirdPayUrl;

    var params = JSON.stringify(ParaInfo);

    sendInit = b02 + "Msg" + f1 + "Req" + d1 + "Type" + f1 + "Init" + d1 + "ParaInfo" + f1 + params + d1 + "crc" + f1 + d1 + b03;

    var url = "ws://127.0.0.1:" + wsPort;
    connectws(url, sendInit);//链接服务器
}

function connectws(url, sendInit) {

    ws_url = url;

    document.getElementById("ShowStatus").style.color = "red";

    if ("WebSocket" in window) {

        // 打开一个 web socket
        ws = new WebSocket(url);

        console.log("开始连接服务器");

        document.getElementById("ShowStatus").innerHTML = "开始连接服务器";

        ws.onopen = function () {

            console.log("连接服务器成功");

            document.getElementById("ShowStatus").innerHTML = "连接服务器成功";
            document.getElementById("ShowStatus").style.color = "#ffffff";

            if (sendInit != "") {

                ws.send(sendInit);

                console.log("发送" + sendInit + "成功");
            }
            else {
                keep_connect();
            }

            clearInterval(tempInterval);//连接成功 关闭重连机制

            console.log("连接成功关闭重连机制");

            //定时执行，60秒
            window.setInterval(
                function () {
                    return keep_connect();
                }, 60000);

        };

        ws.onmessage = function (evt) {

            console.log("收到" + evt.data);

            var tempdata = evt.data;
            processMsg(tempdata);
        };

        ws.onclose = function () {

            console.log("连接服务器失败");

            // 关闭 websocket
            document.getElementById("ShowStatus").innerHTML = "连接服务器失败";

            //连接失败 重新连接服务器
            tempInterval = setInterval(function () {
                connectws(ws_url, sendInit);
            }, 20000)
        };
    } else {
        // 浏览器不支持 WebSocket
        document.getElementById("ShowStatus").innerHTML = "不支持实时通信";
    }
}

//保持与服务器的连接
function keep_connect() {
    if (ws.readyState == WebSocket.OPEN) {
        ws.send("KC=Connect");
    }
    else {
        connectws(ws_url, sendInit);
    }
}

function processMsg(tempdata) {

    //去掉头尾 防止影响下面的解析
    tempdata = tempdata.replace(b02, "");
    tempdata = tempdata.replace(b03, "");

    var byte1d = [0x1D];
    var byte1f = [0x1F];

    var d1 = String.fromCharCode(byte1d);
    var f1 = String.fromCharCode(byte1f);

    var array = tempdata.split(d1);

    var type;
    var msg;

    for (var i = 0; i < array.length; i++) {

        var content = array[i].split(f1);

        switch (content[0]) {
            case "Type":
                type = content[1]
                break;
            case "Msg":
                msg = content[1]
                break;
        }

        //查找到类型 直接跳出
        if (type != null && msg != null) {
            break;
        }
    }

    //统一回复信息
    if (type != null && type != "") {

        //请求的命令需要回复
        if (msg == "Req") {

            confirmMsg(type);
        }

        //中间件主动推送的缴费信息
        switch (type) {
            case "PushDealInfo":
                processSearch(tempdata);//处理显示缴费信息
                break;
            case "Search":
                processSearch(tempdata);//处理显示缴费信息
                break;
            case "ShowInfo":
                processShowInfo(array);//提示信息
                break;
            case "Init":
                processInit(array);//初始化成功
                break;
        }
    }
}

//处理显示缴费信息
function processSearch(tempdata) {

    var byte1d = [0x1D];
    var byte1f = [0x1F];

    var d1 = String.fromCharCode(byte1d);
    var f1 = String.fromCharCode(byte1f);

    var array = tempdata.split(d1);

    var dealInfo;

    for (var i = 0; i < array.length; i++) {

        var content = array[i].split(f1);

        console.log(content[0]);

        switch (content[0]) {
            case "DealInfo":
                dealInfo = content[1];
                break;
        }
    }

    var otherparam = {};

    otherparam.searchData = dealInfo;
    otherparam.ws_url = ws_url;
    //otherparam.scanUrl = scanUrl;
    //otherparam.wx_change_QR = wx_change_QR;

    var datas = encodeURIComponent(JSON.stringify(otherparam));

    console.log("跳转" + "payment.html?data=" + datas);

    //跳转支付界面
    window.location.href = "payment.html?data=" + datas;
}

//提示错误信息
function processShowInfo(array) {
    var err;

    for (var i = 0; i < array.length; i++) {

        var content = array[i].split(f1);

        switch (content[0]) {
            case "ErrorMsg":
                err = content[1]
                break;
        }

        //查找到错误信息 直接跳出
        if (err != null) {
            break;
        }
    }

    mui.toast(err);
}

//初始化成功
function processInit(array) {

    var verdict;
    var err;

    for (var i = 0; i < array.length; i++) {

        var content = array[i].split(f1);

        switch (content[0]) {
            case "Verdict":
                verdict = content[1]
                break;
            case "ErrorMsg":
                err = content[1]
                break;
        }
    }

    //查找到错误信息 直接跳出

    if (verdict == "ACK") {

        document.getElementById("ShowStatus").style.color = "white";
        document.getElementById("ShowStatus").innerHTML = "正常服务";
    }
    else {
        document.getElementById("ShowStatus").style.color = "red";
        document.getElementById("ShowStatus").innerHTML = "服务异常";

        mui.toast(err);
    }
}

function confirmMsg(type) {

    if (ws.readyState == WebSocket.OPEN) {
        //回复信息
        var sendInit = b02 + "Msg" + f1 + "Cfm" + d1 + "Type" + f1 + type + d1 + "Verdict" + f1 + "ACK" + d1 + "crc" + f1 + d1 + b03;
        ws.send(sendInit);

        console.log("回复" + sendInit + "成功");
    }
    else {
        console.log("服务器已关闭");
    }
}

//生成从minNum到maxNum的随机数
function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
            break;
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
            break;
        default:
            return 0;
            break;
    }
}