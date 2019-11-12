//获取xmlDoc对象，兼容浏览器，参考网上代码
function getxmlDoc(xmlFile) {
    var xmlDoc;
    if (window.ActiveXObject) {
        xmlDoc = new ActiveXObject('Microsoft.XMLDOM');//IE
        xmlDoc.async = false;
        xmlDoc.load(xmlFile);
    }
    else if (isFirefox = navigator.userAgent.indexOf("Firefox") > 0) { //火狐

        xmlDoc = document.implementation.createDocument('', '', null);
        xmlDoc.load(xmlFile);
    }
    else { //谷歌
        var xmlhttp = new window.XMLHttpRequest();
        xmlhttp.open("GET", xmlFile, false);
        xmlhttp.send(null);
        if (xmlhttp.readyState == 4) {
            xmlDoc = xmlhttp.responseXML.documentElement;
        }
    }

    return xmlDoc;
}

function IsExistsFile(filepath) {
    var xmlhttp;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();//其他浏览器    
    }
    else if (window.ActiveXObject) {
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");//旧版IE    
        }
        catch (e) { }
        try {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");//新版IE    
        }
        catch (e) { }
        if (!xmlhttp) {
            window.alert("不能创建XMLHttpRequest对象");
        }
    }
    xmlhttp.open("GET", filepath, false);
    xmlhttp.send();
    if (xmlhttp.readyState == 4) {
        if (xmlhttp.status == 200) return true; //url存在   
        else if (xmlhttp.status == 404) return false; //url不存在   
        else return false;//其他状态   
    }
}

