phantom.outputEncoding="GBK";

var casper = require('casper').create({   
    verbose: true, 
    logLevel: 'debug',
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

casper.on('category.notfound', function() {
    this.echo('category not found');
	this.capture('zyb-category-notfound.png');
	this.exit();
});

casper.on('remote.alert', function(message) {
    this.echo('alert message: ' + message);
	//this.capture('zyb-remote-alert.png');
	casper.exit(1);
});

casper.on('waitFor.timeout', function() {
    this.echo('wait time out,unable to forecast');
	this.capture('zyb-wait-timeout.png');
});

casper.on('http.status.404', function(resource) {
    this.log('Hey, this one is 404: ' + resource.url, 'warning');
});

casper.on('step.timeout', function() {
    this.echo('step time out,unable to forecast');
	this.capture('zyb-step-timeout.png');
});

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});

var url = 'http://www.zhuanyunbang.com/user/login';
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

var trackingNumber = '';
if(casper.cli.has('trackingNumber')){
    trackingNumber = casper.cli.raw.get('trackingNumber');
}

var houseIndex = 0;
var houseList = ['波特兰免税仓库','日本大阪仓库'];
if(casper.cli.has('house')){
    houseIndex = houseList.indexOf(casper.cli.raw.get('house'));
	houseIndex += parseInt("1");
}

var trackingCompanyIndex = 0;
var trackingCompanyList = ['UPS','USPS','Fedex','Ontrac','DHL','OTHER/其他'];
if(casper.cli.has('trackingCompany')){
    trackingCompanyIndex = trackingCompanyList.indexOf(casper.cli.raw.get('trackingCompany'));
	if(trackingCompanyIndex == -1)
		trackingCompanyIndex = 5;
	else
		trackingCompanyIndex += parseInt("1");
}

var productList = new Array();
var productNumbers = casper.cli.raw.get('productNumbers');
for (i = 0; i < productNumbers; i++) { 
    productList[i] = {
		name:casper.cli.raw.get('product'+[i+1]+'.name'),
		className:casper.cli.raw.get('product'+[i+1]+'.category'),
		brandName:casper.cli.raw.get('product'+[i+1]+'.brandName'),
		model:casper.cli.raw.get('product'+[i+1]+'.model'),
		quantity:casper.cli.raw.get('product'+[i+1]+'.quantity'),
		price:casper.cli.raw.get('product'+[i+1]+'.price')
	}
	//console.log(productList[i].name);
}

//login
casper.start(url, function() {   
	this.sendKeys('input#loginform-username', user.userName);
	this.sendKeys('input#loginform-password', user.password);
	this.click('button.submit');
	this.echo('submit login');
});

//click add btn-add
casper.waitForSelector('div.btn-add', function() {
    this.click('div.btn-add.a');
});

casper.waitForSelector('div.hd',function(){
	for (i = 1; i <= productNumbers; i++){
		if(i != productNumbers)
			this.click("a.link-add");
	}
	var i = 0;
	var j=1;
	//fill product info
	casper.repeat(productNumbers,function(){
		this.click(x('(//input[@name="GoodsAddForm[classname][]"])['+(j)+']'));
		casper.waitForSelector(x('//div[@class="leibie-sub"]/a[contains(., "'+productList[i].className+'")]'),function(){
			this.click(x('//div[@class="leibie-sub"]/a[contains(., "'+productList[i].className+'")]'));

			casper.thenEvaluate(function(name,brandName,quantity,price,model,i){
				document.querySelector('table.tbl.tbl-newPackage tr:nth-child('+(i+2)+') input[name="GoodsAddForm[name][]"]').value = name;
				document.querySelector('table tr:nth-child('+(i+2)+') input[name="GoodsAddForm[brand_name][]"]').value = brandName;
				document.querySelector('table tr:nth-child('+(i+2)+') input[name="GoodsAddForm[model][]"]').value = model;
				document.querySelector('table tr:nth-child('+(i+2)+') input[name="GoodsAddForm[quantity][]"]').value = quantity;
				document.querySelector('table tr:nth-child('+(i+2)+') input[name="GoodsAddForm[price][]"]').value = price;
			},productList[i].name,productList[i].brandName,productList[i].quantity,productList[i].price,productList[i].model,i);
			
			//require('utils').dump(this.getElementAttribute('input[name="GoodsAddForm[classid][]"]', 'value'));
			i+=1;
		},function timeout(){
				this.echo(productList[i].className + " category not found");
				this.emit('category.notfound');
		});
		j+=1;
	});
});

//fill trackin number and other
casper.then(function(){
	this.sendKeys('#addform-express_no', trackingNumber);
	this.evaluate(function(houseIndex,trackinIndex){
	document.querySelector('#addform-house_id').selectedIndex = houseIndex;
	document.querySelector('#addform-express_id').selectedIndex = trackinIndex;
	return true;
	},houseIndex,trackingCompanyIndex);
	this.click('button.btn');
});

casper.waitForSelector(x('//div[@class="deliver-status fl"]/span[text()="已预报"]'),function(){
	this.echo("预报成功");
	this.capture("zyb-forecast.png");
});

casper.run();