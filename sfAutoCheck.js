var casper = require('casper').create({   
    verbose: true, 
    logLevel: 'debug',
    // userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.172 Safari/537.22',
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

var url = 'http://www.transrush.com/Member/MyParcel.aspx';

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
        usernameInput.value = "*****"; //please replace with real username

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
    this.thenClick('#MyTRBagBeforeDelivery');
}, function timeout() {
    this.capture('nima1.png');
}, 60000);

// Step-4: Snap 待出库 list
casper.waitFor(function check() {
    return this.evaluate(function() {
        var len1 = document.querySelector('div.parcel-list');
        var len2 = document.querySelector('div.no-parcel');
        if (len1 != null){
            var len3 = document.querySelector('span.icons.icon-show.icon-bottom');
            if(len3 != null){
                console.log('good');
                return true;
            }
        }
        if(len2 != null){
            return true;
        }
    });
}, function then() {
    
    this.evaluate(function(){

        var elems = document.querySelectorAll('#dqsParcelList .parcel-list .icon-show');
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        for(var i = 0; i<elems.length; i++) {
            elems[i].dispatchEvent(ev);
        }
    });

    return true;

}, function timeout() {
    this.capture('nima2.png');
}, 60000);

casper.waitFor(function check() {
    return this.evaluate(function(){
        var len1 = document.querySelectorAll('.table-parcel');
        var elems = document.querySelectorAll('#dqsParcelList .parcel-list .icon-show');
        if (len1.length == elems.length) {
            return true;
        };
    })
}, function then(){
    this.capture('hehe.png');
}, function timeout() {
    this.capture('nima3.png');
}, 60000);

casper.run();
