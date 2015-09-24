var casper = require('casper').create({   
    verbose: true, 
    logLevel: 'debug',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.172 Safari/537.22',
    pageSettings: {
      loadImages:  false,         // The WebPage instance used by Casper will
      loadPlugins: false         // use these settings
    }
});

// print out all the messages in the headless browser context
casper.on('remote.message', function(msg) {
    console.dir(msg);
    this.echo('remote message caught: ' + msg);
});

// print out all the messages in the headless browser context
casper.on("page.error", function(msg, trace) {
    this.echo("Page Error: " + msg, "ERROR");
});

casper.on('popup.created', function() {
    this.echo("url popup created : " + this.getCurrentUrl(),"INFO");
});

var url = 'http://www.transrush.com/Member/MyParcel.aspx';
var x = require('casper').selectXPath;

var mer_track_num = '';
if(casper.cli.has('tracknumber')){
    mer_track_num = casper.cli.raw.get('tracknumber');
}

var producttype = '';
if(casper.cli.has('producttype')){
    producttype = casper.cli.raw.get('producttype');
}

var argProduct = {name: '', price: 0.00, qty: 0};
if(casper.cli.has('name')){
    argProduct.name = casper.cli.raw.get('name');
}
if(casper.cli.has('price')){
    argProduct.price = casper.cli.raw.get('price');
    console.log(argProduct.price);
}
if(casper.cli.has('qty')){
    argProduct.qty = casper.cli.raw.get('qty');
}

var argOptions = {
    merge: false,
    check: false,
    refine: false,
    insurance: false,
    ensure: false,
    channel: '',
    comments: ''
}
if(casper.cli.has('merge') && casper.cli.get('merge') == 1){
    argOptions.merge = true;
}
if(casper.cli.has('check') && casper.cli.get('check') == 1){
    argOptions.check = true;
}
if(casper.cli.has('refine') && casper.cli.get('refine') == 1){
    argOptions.refine = true;
}
if(casper.cli.has('insurance') && casper.cli.get('insurance') == 1){
    argOptions.insurance = true;
}
if(casper.cli.has('ensure') && casper.cli.get('ensure') == 1){
    argOptions.ensure = true;
}
if(casper.cli.has('channel')){
    argOptions.channel = casper.cli.get('channel');
}
if(casper.cli.has('comments')){
    argOptions.comments = casper.cli.raw.get('comments');
}


casper.start(url);

// Step-1: check whether account was signed in. If so, then skip login navigation
casper.thenBypassIf(function(){
    if(this.exists('#loginForm')){
        return false; // need to login
    } else {
        return true; // already login
    }
}, 2);

// Step-2: login Navi
casper.then(function(){

    this.evaluate(function () {
        console.log("filling inputs");

        var usernameInput = document.getElementById("userName");
        usernameInput.value = "*****"; //please replace with real account

        var passwordInput = document.getElementById("password");
        passwordInput.value = "*****"; //please replace with real password
    });
    this.click("#loginBtn");
    this.echo("login button was submitted");

});

// Step-3: Waiting for account profile page loading complete, and click "待出库" <li>
casper.waitFor(function check() {
    return this.evaluate(function() {
        var len1 = document.querySelector('div.parcel-list');
        var len2 = document.querySelector('div.no-parcel');
        if ((len1 != null) || (len2 !=null)) {
            return true;
        };
    });
}, function then() {
    this.thenClick('#MyTRBagAdd');
}, function timeout() {
    this.capture('load登陆后主页-timeout.png');
}, 60000);

// Step-4: Choose warehouse
casper.waitFor(function check() {
    return this.evaluate(function() {
        var btnSelect = document.querySelector('.select-warehouse._disabled');
        if (btnSelect != null) {
            return true;
        };
    });
}, function then() {

    this.evaluate(function(){

        var selectWH = document.querySelector('.select-warehouse._disabled');
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        selectWH.dispatchEvent(ev);

    });

}, function timeout() {
    this.capture('click新增包裹-timeout.png');
}, 60000);

// Step-5: Select Porland warehouse
casper.waitFor(function(){
    return this.evaluate(function(){
        var lstWH = document.querySelectorAll('.cangku-list .iv');
        if(lstWH.length == 14){  //wait for page load complete. MABI
            return true;
        }
    });
}, function then(){

    this.evaluate(function(){

        var elems = document.querySelectorAll('.cangku-list .iv');
        var pickHW = null;
        for (var i = 0; i < elems.length; i++) {
            if(elems[i].innerText == '美国波特兰（免税仓）'){
                pickHW = elems[i-1];
            }
        };
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        pickHW.dispatchEvent(ev);

    });

}, function timeout(){
    this.capture('click选择你的入库仓库-timeout.png')
}, 60000);

// Step-6: Fill tracking #
casper.waitFor(function check() {
    return this.evaluate(function() {
        var selectedHW = document.querySelectorAll('#addParcelDialog .dialog-article .dialog-window #addParcelHmtl #selectWarehouse .iv');
        if (selectedHW[1].innerText == '美国波特兰（免税仓）') {
            return true;
        };
        // var producttable = document.querySelector('#productTable');
        // if(producttable != null){
        //     console.log(producttable.innerText);
        //     var tbody = producttable.getElementsByTagName('tbody');
        //     if(tbody[0] != null){
        //         var list = tbody[0].getElementsByTagName('tr');
        //         if (list.length == 5) {
        //             return true;
        //         }
        //     }
        // }
    });
}, function then() {
    this.evaluate(function(number) {
        var tracking = document.querySelector('#wuLiuHao');
        tracking.value = number;
    }, mer_track_num);
    this.capture('okay.png');
}, function timeout() {
    this.capture('click美国波特兰免税仓-timeout.png');
}, 60000);

// Step-7: Select type
casper.then(function(){

    this.evaluate(function () {

        var selecttype = document.querySelector('.input-sblb.input');
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        selecttype.dispatchEvent(ev);
    });

});

// Step-6: Fill tracking #
casper.waitFor(function check() {
    return this.evaluate(function() {
        var menudisplay = document.querySelectorAll('#menuList .item');
        if (menudisplay != null && menudisplay.length > 0) {
            return true;
        };
    });
}, function then() {
    this.evaluate(function(type) {
        var search = document.querySelector('#searchLeiBieInput');
        search.value = type;
        var clickbutton = document.querySelector('#searchLeiBieBtn');
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        clickbutton.dispatchEvent(ev);
    }, producttype);
}, function timeout() {
    this.capture('click类型选择-timeout.png');
}, 60000);

// Step-6: Fill tracking #
casper.waitFor(function check() {
    return this.evaluate(function(type) {

        var result = document.querySelector('#searchResult');
        var spans = result.getElementsByTagName('span');
        for (var i = spans.length - 1; i >= 0; i--) {
            if(spans[i].title == type){
                var ev = document.createEvent("MouseEvent");
                ev.initMouseEvent(
                    "click",
                    true /* bubble */, true /* cancelable */,
                    window, null,
                    0, 0, 0, 0, /* coordinates */
                    false, false, false, false, /* modifier keys */
                    0 /*left*/, null
                );
                spans[i].dispatchEvent(ev);
                return true;
            }
        }
    }, producttype);
}, null, function timeout() {
    this.capture('选择类型-timeout.png');
}, 60000);

// Step-6: Fill tracking #
casper.waitFor(function check() {
    return this.evaluate(function(intype) {
        var type = document.querySelector('.input-sblb.input');
        if(type.title == intype){
            var producttable = document.querySelector('#productTable');
            if(producttable != null){
                var tbody = producttable.getElementsByTagName('tbody');
                if(tbody[0] != null){
                    var inputs = tbody[0].getElementsByTagName('input');
                    var labels = tbody[0].getElementsByTagName('label');
                    if (inputs.length > 0 && labels.length > 0) {
                        console.log(inputs.length + ' ' + labels.length);
                        return true;
                    }
                }
            }
        }
    }, producttype);
}, function then() {

    this.evaluate(function(prod) {
        var nameLabel = document.querySelector('#shenBaoLeiBieItem .tab-name .placeholder-box .placeholder');
        nameLabel.innerText = '';
        var priceLabel = document.querySelector('#shenBaoLeiBieItem .tab-price .placeholder-box .placeholder');
        priceLabel.innerText = '';
        var inputName = document.querySelector('#shenBaoLeiBieItem .input-name');
        inputName.value = prod.name;
        var inputPrice = document.querySelector('#shenBaoLeiBieItem .input-price');
        inputPrice.value = prod.price;
        var inputQty = document.querySelector('#shenBaoLeiBieItem .input-num');
        inputQty.value = prod.qty;
    }, argProduct);

    this.evaluate(function(options) {
        var table = document.querySelector('#productTable');
        var tbody = table.getElementsByTagName('tbody');
        var labels = tbody[0].getElementsByTagName('label');
        var inputs = tbody[0].getElementsByTagName('input');
        for (var i = labels.length - 1; i >= 0; i--) {
            console.log(labels[i].innerText);
            console.log(options.channel);
            if(labels[i].innerText == options.channel){
                console.log('in');
                var ev = document.createEvent("MouseEvent");
                ev.initMouseEvent(
                    "click",
                    true /* bubble */, true /* cancelable */,
                    window, null,
                    0, 0, 0, 0, /* coordinates */
                    false, false, false, false, /* modifier keys */
                    0 /*left*/, null
                );
                inputs[i].dispatchEvent(ev);
            }
        };
    }, argOptions);

    // this.thenClick('.dialog-ok');
    this.capture('goodjob.png');
}, function timeout() {
    this.capture('xxxx-timeout.png');
}, 60000);

// Step-6: Fill tracking #
casper.waitFor(function check() {
    return this.evaluate(function(options) {

        var table = document.querySelector('#productTable');
        var tbody = table.getElementsByTagName('tbody');
        var labels = tbody[0].getElementsByTagName('label');
        var inputs = tbody[0].getElementsByTagName('input');
        for (var i = labels.length - 1; i >= 0; i--) {
            if(labels[i].innerText == options.channel){
                if(inputs[i].checked == true){
                    return true;
                }
            }
        };
    }, argOptions);
}, function then() {

    this.evaluate(function(options) {

        var merge = document.querySelector('#INPUT_KX');
        var check = document.querySelector('#INPUT_QD-4');
        var refine = document.querySelector('#INPUT_QD-6');
        var insurance = document.querySelector('#INPUT_BX');
        var ensure = document.querySelector('#baojia');
        var comments = document.querySelector('#bZhu');
        if(options.merge){
            merge.checked = true;
        }
        if(options.check){
            check.checked = true;
        }
        if(options.refine){
            refine.checked = true;
        }
        if(options.insurance){
            insurance.checked = true;
        }
        if(options.ensure){
            ensure.checked = true;
        }
        comments.value = options.comments;

        var btn = document.querySelector('#addParcelDialog .dialog-ok')
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        btn.dispatchEvent(ev);

    }, argOptions);

    this.capture('good123.png');
}, function timeout() {
    this.capture('选择类型-timeout.png');
}, 60000);

casper.run();