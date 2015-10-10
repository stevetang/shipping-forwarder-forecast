phantom.outputEncoding="GBK";

var casper = require('casper').create({   
    verbose: true, 
    logLevel: 'info',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.172 Safari/537.22',
	waitTimeout: 10000,
	stepTimeout: 30000,
	timeout: 60000,
	exitOnError: true,
    pageSettings: {
      loadImages:  false,         // The WebPage instance used by Casper will
      loadPlugins: false         // use these settings
    }
});

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});

casper.on('waitFor.timeout', function() {
    this.echo('wait time out,unable to forecast');
	this.capture('tj-wait-timeout.png');
});

casper.on('http.status.404', function(resource) {
    this.log('Hey, this one is 404: ' + resource.url, 'warning');
});

casper.on('step.timeout', function() {
    this.echo('step time out,unable to forecast');
	this.capture('tj-step-timeout.png');
});

var trackingNumber = '';
if(casper.cli.has('trackingNumber')){
    trackingNumber = casper.cli.raw.get('trackingNumber');
}

var Weight = '';
if(casper.cli.has('Weight')){
    Weight = casper.cli.raw.get('Weight');
}

var Remark = '';
if(casper.cli.has('remark')){
    Remark = casper.cli.raw.get('remark');
}

var selectIndex = 0;
var trackingCompanyList = ['其他','UPS','USPS','FEDEX','LASERSHIP'];
if(casper.cli.has('trackingCompany')){
    selectIndex = trackingCompanyList.indexOf(casper.cli.raw.get('trackingCompany'));
}

var user = {
	userName : '',
	password : ''
}
if(casper.cli.has('userName')){
    user.userName = casper.cli.raw.get('userName');
}
if(casper.cli.has('password')){
    user.password = casper.cli.raw.get('password');
    //console.log(argProduct.price);
}

var url = 'http://www.tj-ex.com/';
var x = require('casper').selectXPath;

//login
casper.start(url, function() {   
	this.sendKeys('input#UserName', user.userName);
	this.sendKeys('input#Password', user.password);
	this.click('button#Btn_login');
	this.echo('submit login');
});

casper.waitForSelector('a#Menu21',function(){
	this.click('a#Menu21');
});

casper.waitForSelector('div.Page_Right_Content',function(){
	this.evaluate(function(index){
        //console.log(index);
		document.querySelector('#TransportCompany').selectedIndex = index;
		return true;
	},selectIndex);
	this.sendKeys('input[name="TransportNumber"]',trackingNumber);
	this.sendKeys('input[name="Weight"]',Weight);
	this.sendKeys('input[name="Remark"]',Remark);
	this.click('img[name="Saving"]');
});

casper.waitForAlert(function(response) {
    this.echo("Alert received: " + response.data);
});

casper.run();