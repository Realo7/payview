
var byte1d = [0x1D];
var byte1f = [0x1F];
var byte02 = [0x02];
var byte03 = [0x03];

var d1 = String.fromCharCode(byte1d);
var f1 = String.fromCharCode(byte1f);
var b02 = String.fromCharCode(byte02);
var b03 = String.fromCharCode(byte03);


window.onload = function () {

    //console.log(encodeURIComponent("苏B003A2"));

    SerialNum = "";//清空缓存

    setInterval(function () {
        var date = new Date();
        var year = date.getFullYear(); //获取当前年份
        var mon = date.getMonth() + 1; //获取当前月份
        var da = date.getDate(); //获取当前日
        var h = date.getHours(); //获取小时
        var m = date.getMinutes(); //获取分钟
        if (m < 10) {
            m = "0" + m;
        }
        var s = date.getSeconds(); //获取秒
        if (s < 10) {
            s = "0" + s;
        }
        var d = document.getElementById('Date');
        d.innerHTML = year + '-' + mon + '-' + da + ' ' + h + ':' + m + ':' + s;
    }, 1000)

    var data = getQueryVariable("data");
    console.log("收到参数" + data);

    if (data == "false" || data == false) {

    }
    else {

        i = setInterval(function () {
            if (countdown >= 1) {
                countdown--;

                //最后5秒停止支付
                if (countdown == 5) {
                    sendProPay("StopPay");//停止支付
                }

            } else {

                clearInterval(i);

                sendOther("Cancel");//离开页面

                var otherparam = {};
                otherparam.ws_url = ws_url;
                //otherparam.scanUrl = scanUrl;
                //otherparam.wx_change_QR = wx_change_QR;

                mui.toast("支付超时");

                console.log("支付超时" + JSON.stringify(otherparam));

                window.location.href = "main.html?callback=" + JSON.stringify(otherparam);
            }
            document.getElementById("CountDown").innerHTML = countdown + "s";
        }, 1000)

        processMsg_Main(data);//处理收到的参数
    }
}

var i;
var ws;
var ws_url = "0";
//var scanUrl = "0";
//var wx_change_QR = "0";
var SerialNum = "";

var countdown_val = 120;

var countdown = countdown_val;

function connectws(ws_url) {

    document.getElementById("ShowStatus").style.color = "red";

    if ("WebSocket" in window) {

        // 打开一个 web socket
        ws = new WebSocket(ws_url);

        document.getElementById("ShowStatus").innerHTML = "开始连接服务器";

        ws.onopen = function () {
            // Web Socket 已连接上，使用 send() 方法发送数据

            //开启支付
            sendProPay("StartPay");

            document.getElementById("ShowStatus").innerHTML = "连接服务器成功";
            document.getElementById("ShowStatus").style.color = "#ffffff";

            //定时执行，60秒
            window.setInterval(
                function () {
                    return keep_connect();
                }, 60000);
        };

        ws.onmessage = function (evt) {

            var tempdata = evt.data;

            console.log("收到数据" + tempdata);

            processMsg(tempdata);
        };

        ws.onclose = function () {
            // 关闭 websocket
            document.getElementById("ShowStatus").innerHTML = "连接服务器失败";
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
}

//处理首页传过来的参数
function processMsg_Main(tempdata) {

    var jsonData = JSON.parse(tempdata);

    searchData = jsonData.searchData;
    ws_url = jsonData.ws_url;
    //scanUrl = jsonData.scanUrl;
    //wx_change_QR = jsonData.wx_change_QR;

    //处理收费信息
    processMsg_Fst(searchData);
}

//处理传值的数据
function processMsg_Fst(dealInfo) {

    console.log("dealInfo数据" + dealInfo);

    GiveText(dealInfo, 0);
}


//处理数据 isFst 是否是第一次传值 不需要回复
function processMsg(tempdata) {

    //去掉头尾 防止影响下面的解析
    tempdata = tempdata.replace(b02, "");
    tempdata = tempdata.replace(b03, "");

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

    if (type != null && type != "") {

        //不是传值过来 需要回复
        if (msg == "Req") //请求的命令需要回复
        {
            confirmMsg(type);//统一回复信息
        }

        switch (type) {
            case "PushDealInfo":
                processSearch(array);//处理显示缴费信息
                break;
            case "CompletePay":
                processAuditPay(array);//支付结果
                break;
            case "ShowInfo":
                processShowInfo(array);//显示提示信息
                break;
            case "RecMoney":
                processRecMoney(array);//投纸币信息
                break;
            case "ScanQR":
                processScanQR(array);//用户已经扫码
                break;
            case "Print":
                BackMain();//回到首页
                break;
            case "MaintainInfo":
                processMaintainInfo(array);//显示维护信息
                break;
        }
    }
}

//显示维护信息
function processMaintainInfo(array) {
    var ErrorMsg;

    for (var i = 0; i < array.length; i++) {

        var content = array[i].split(f1);

        switch (content[0]) {
            case "ErrorMsg":
                ErrorMsg = content[1];
                break;
        }
    }

    if (ErrorMsg != "") {

        document.getElementById("ShowStatus").style.color = "red";
        document.getElementById("ShowStatus").innerHTML = ErrorMsg;
    }
}

function BackMain() {
    var otherparam = {};

    otherparam.ws_url = ws_url;
    //otherparam.scanUrl = scanUrl;
    //otherparam.wx_change_QR = wx_change_QR;

    window.location.href = "main.html?callback=" + JSON.stringify(otherparam);
}

//处理显示缴费信息
function processSearch(array) {

    var dealInfo;

    for (var i = 0; i < array.length; i++) {

        var content = array[i].split(f1);

        switch (content[0]) {
            case "DealInfo":
                dealInfo = content[1];
                break;
        }
    }

    GiveText(dealInfo, 1);
}

function GiveText(dealInfo, isFst) {

    if (dealInfo != null && dealInfo != "") {

        var JSONdeal = JSON.parse(dealInfo);

        document.getElementById("lblplate").innerHTML = JSONdeal.PlateNum;//车牌号
        if (JSONdeal.Barcode.length == 20) {
            document.getElementById("lblticket").innerHTML = JSONdeal.Barcode.substring(13, 20);//票号
        }

        document.getElementById("shouldpay").innerHTML = "￥" + JSONdeal.DiscountPay;
        document.getElementById("totalMon").innerHTML = "￥" + JSONdeal.Shouldpay;

        var time = JSONdeal.EntryTm.split(' ');
        document.getElementById("entryTm").innerHTML = time[0];//入场日期
        document.getElementById("entryTm2").innerHTML = time[1];//入场时间

        document.getElementById("lblCouponMon").innerHTML = "￥" + JSONdeal.DisAmount;//优惠金额
        document.getElementById("lblStayTm").innerHTML = JSONdeal.StayTm;//停留时间

        SerialNum = JSONdeal.SerialNum;//缓存交易流水号

        //第一次连接服务器 第二次直接发送开启支付
        if (isFst == 0) {
            connectws(ws_url);
        }
        else {
            countdown = countdown_val;
            //开启支付
            sendProPay("StartPay");
        }

        var tempPlate = encodeURIComponent(JSONdeal.PlateNum);

        if (tempPlate == null) {
            tempPlate = "";
        }
        //车牌里面可能返回的是票号
        else if (tempPlate != null && tempPlate.length >= 20) {
            tempPlate = "";
        }

        var tempCode = JSONdeal.Barcode;

        if (JSONdeal.Barcode.length < 20) {
            tempCode = "";
        }

        if (tempCode.length >= 20) {
            tempPlate = "";
        }

        if (tempCode == "") {

            //生成支付二维码
            ShowQR(JSONdeal.QRSign + "?inputplate=" + tempPlate + "&pid=" + JSONdeal.pid);
        }
        else {

            //生成支付二维码
            ShowQR(JSONdeal.QRSign + "?code=" + tempCode + "&plate=" + tempPlate + "&pid=" + JSONdeal.pid);
        }
    }
}

//处理支付成功
function processAuditPay(array) {

    sendOther("Print");//发送打印命令

    mui.toast("支付成功");

    //setTimeout("javascript:location.href='main.html?callback='" + JSON.stringify(otherparam), 3000);
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

//处理收纸币信息
function processRecMoney(array) {

    var RecType;
    var RecAmount;

    for (var i = 0; i < array.length; i++) {

        var content = array[i].split(f1);

        switch (content[0]) {
            case "RecType"://收款类型  0：收款箱有钱正在塞入  1：收款箱已收入钱箱  2：收款已足额
                RecType = content[1]
                break;
            case "RecAmount"://收款总额
                RecAmount = content[1]
                break;
        }
    }

    //有钱塞入 刷新倒计时
    if (RecType == "0") {
        countdown = countdown_val;
    }

    //有钱投入 只显示现金
    if (RecType == "1") {

        //刷新已付金额
        document.getElementById("paymon").innerHTML = "￥" + RecAmount;

        //只显示现金信息 二维码隐藏掉
        showCashPay(true);
    }

    if (RecType == "2") {
        //刷新已付金额
        document.getElementById("paymon").innerHTML = "￥" + RecAmount;
    }
}

//用户已经扫码 把现金隐藏掉
function processScanQR(array) {

    //只显示二维码 现金信息隐藏掉
    showCashPay(false);
}

//回复信息
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

//只显示现金支付页面
function showCashPay(isShow) {

    if (isShow) {
        document.getElementById("cash").style.display = "block";//隐藏
        document.getElementById("qrcode").style.display = "none";//隐藏
        document.getElementById('cash').style.marginLeft = '25%'
    }
    else {
        document.getElementById("qrcode").style.display = "block";//显示
        document.getElementById('qrcode').style.marginLeft = '25%'
        document.getElementById("cash").style.display = "none";//隐藏
    }
}

//生成二维码
function ShowQR(url) {

    //先清空div
    $("#qrcode").empty();

    var options = {};
    options.url = url; //二维码的链接
    options.dom = "#qrcode"; //二维码生成的位置
    options.image = document.getElementById('qrcode-logo'); //图片id
    options.render = "image"; //设置生成的二维码是canvas格式，也有image、div格式
    xyqrcode(options);
}

function xyqrcode(options) {
    var settings = {
        dom: '',
        render: 'canvas', //生成二维码的格式还有image、div
        ecLevel: "H",
        text: "",
        background: "#ffffff",
        fill: "#333333", //二维码纹路的颜色
        fontcolor: "#ff9818",
        fontname: "Ubuntu",
        image: {},
        label: "",
        mPosX: 0.5, //图片在X轴的位置
        mPosY: 0.5, //图片在X轴的位置
        mSize: 0.22, //图片大小
        minVersion: 10,
        mode: 4,
        quiet: 1,
        radius: 1,
        size: 360
    };

    if (options) {
        $.extend(settings, options); //options对象跟settings比较，相同的就替换，没有的就添加
    }

    if (settings.dom.length == 0) {
        window.console.log("Error: dom empty!");
        return;
    }
    if (settings.url.length == 0) {
        window.console.log("Error: url empty!");
        return;
    }
    settings.text = settings.url; //在qrcode生成二维码的地址是text。这里就把url赋值给text
    $(settings.dom).qrcode(settings);
}

//发送操作支付命令
function sendProPay(type) {

    if (ws.readyState == WebSocket.OPEN) {

        var sendInit = b02 + "Msg" + f1 + "Req" + d1 + "Type" + f1 + type + d1 + "PayMode" + f1 + "1100" + d1 + "SerialNum" + f1 + SerialNum + d1 + "crc" + f1 + d1 + b03;
        ws.send(sendInit);

        console.log("发送" + sendInit + "成功");
    }
    else {
        console.log("服务器已关闭");
    }
}

//发送取消命令 当页面离开的时候发送 或者打印命令
function sendOther(type) {
    if (ws.readyState == WebSocket.OPEN) {

        var sendInit = b02 + "Msg" + f1 + "Req" + d1 + "Type" + f1 + type + d1 + "SerialNum" + f1 + SerialNum + d1 + "crc" + f1 + d1 + b03;
        ws.send(sendInit);

        console.log("发送" + sendInit + "成功");
    }
    else {
        console.log("服务器已关闭");
    }
}