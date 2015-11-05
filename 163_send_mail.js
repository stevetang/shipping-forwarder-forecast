phantom.outputEncoding="UTF-8";

var casper = require('casper').create({   
    verbose: false, 
    logLevel: 'info',
    userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
	waitTimeout: 30000,
	stepTimeout: 30000,
	timeout: 120000,
	exitOnError: true,
    pageSettings: {
      loadImages:  false,         // The WebPage instance used by Casper will
      loadPlugins: false         // use these settings
    }
});

var url = 'http://mail.163.com/';
var x = require('casper').selectXPath;

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

casper.on('waitFor.timeout', function() {
    this.echo('data:result:false');
	this.echo('data:failed_reason:wait time out');
	this.capture('zyb-filling-wait-timeout.png');
});

var mail = {
	recipients : '',
	title : '',
	content : ''
}
if(casper.cli.has('recipients')){
    mail.recipients = casper.cli.raw.get('recipients');
	mail.title = casper.cli.raw.get('title');
	mail.content = casper.cli.raw.get('content');
}

//login
casper.start(url, function() {   
	this.sendKeys('#idInput', user.userName);
	this.sendKeys('#pwdInput', user.password);
	this.click('#loginBtn');
	this.echo('submit login');
});

//go to send mail page
casper.waitForSelector('#spnUid', function() {
    this.click('li.js-component-component.ra0.mD0');
});

//send mail
casper.waitForSelector('div.js-component-button.nui-mainBtn.nui-btn', function() {
    this.sendKeys('input.nui-editableAddr-ipt',mail.recipients)
	this.echo('type '+mail.recipients+' into recipient input')
	this.sendKeys('div.kZ0 div[id^=_mail_input] input',mail.title)
	this.echo('type '+mail.title+' into title input')
	//switch to source edit
	if(this.exists('b.ico.ico-editor.ico-editor-full')){
		this.click('b.ico.ico-editor.ico-editor-full')
	}
	this.echo('switch to source edit mode')
	this.click('span.APP-editor-btn-rc b.ico.ico-editor.ico-editor-source')
	
	casper.waitUntilVisible('a.APP-editor-btn.APP-editor-commond-btn.APP-editor-commond-undo.APP-editor-btn-dis',function then(){
		this.evaluate(function(selector) {
            __utils__.setField(__utils__.findOne(selector), '');
        }, '.APP-editor-textarea');
		
		this.sendKeys('.APP-editor-textarea',mail.content)
		this.echo('type mail content')
		this.click('div.js-component-button.nui-mainBtn.nui-btn')
		this.echo('submit......')
		this.wait(5000)
	})
});

casper.waitForSelector('b.nui-ico.se0.pv1',function() {
	this.echo('email send success')
	this.capture('email_send_success.png');
})

casper.run();