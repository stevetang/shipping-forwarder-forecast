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

var mouse = require("mouse").create(casper);

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});

/*casper.on('waitFor.timeout', function() {
    this.echo('wait time out,unable to forecast');
	this.capture('tj-wait-timeout.png');
});*/

casper.on('http.status.404', function(resource) {
    this.log('Hey, this one is 404: ' + resource.url, 'warning');
});

casper.on('step.timeout', function() {
    this.echo('step time out,unable to forecast');
	this.capture('tj-step-timeout.png');
});

casper.on('category.notfound', function() {
    this.echo('category not found');
	this.capture('tj-category-notfound.png');
	this.exit();
});

var url = 'http://www.tj-ex.com/';
var x = require('casper').selectXPath;

var trackingNumberList = '';
if(casper.cli.has('trackingNumber')){
    trackingNumberList = casper.cli.raw.get('trackingNumber').split(',');
}

var insured = '';
if(casper.cli.has('insured')){
    insured = casper.cli.raw.get('insured');
}

var productList = new Array();
var productNumbers = casper.cli.raw.get('productNumbers');
var describe =  "";
for (i = 0; i < productNumbers; i++) { 
    productList[i] = {
		name:casper.cli.raw.get('product'+[i+1]+'.name'),
		category:casper.cli.raw.get('product'+[i+1]+'.category'),
		subCategory:casper.cli.raw.get('product'+[i+1]+'.subCategory'),
		brandName:casper.cli.raw.get('product'+[i+1]+'.brandName'),
		quantity:casper.cli.raw.get('product'+[i+1]+'.quantity'),
		price:casper.cli.raw.get('product'+[i+1]+'.price')
	}
	if(i != productNumbers-1)
		describe +=productList[i].name+",";
	else
		describe += productList[i].name;
}


var address = {
	consigneeName : '',
	phone : '',
	province:'',
	city:'',
	address:'',
	zipCode:''
}
if(casper.cli.has('consigneeName')){
    address.userName = casper.cli.raw.get('consigneeName');
	address.phone = casper.cli.raw.get('phone');
	address.province = casper.cli.raw.get('province');
	address.city = casper.cli.raw.get('city');
	address.address = casper.cli.raw.get('address');
	address.zipCode = casper.cli.raw.get('zipCode');
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

//login
casper.start(url, function() {   
	this.echo(describe);
	this.sendKeys('input#UserName', user.userName);
	this.sendKeys('input#Password', user.password);
	this.click('button#Btn_login');
	this.echo('submit login');
});

//enter 我的包裹
casper.waitForSelector('a#Menu21',function(){
	this.click('a#Menu001');
});

//search then shipment
casper.waitForSelector('#ctl00_ctl00_ContentPlaceHolder1_myTJ_txtTransportNumber',function(){
	var i=0
	casper.repeat(trackingNumberList.length,function(){
		this.evaluate(function(selector) {
            __utils__.setField(__utils__.findOne(selector), '');
        }, '#ctl00_ctl00_ContentPlaceHolder1_myTJ_txtTransportNumber');
		this.sendKeys('#ctl00_ctl00_ContentPlaceHolder1_myTJ_txtTransportNumber',trackingNumberList[i]);
		this.click('#imageSearch');
		casper.waitForSelector(x('//td[contains(., "'+trackingNumberList[i]+'")]'),function(){
			casper.waitForSelector('tr.AlterColor input[type="checkbox"]',function(){
				this.click('tr.AlterColor input[type="checkbox"]');
			},function timeout() { // step to execute if check has failed
				var state = this.getElementInfo('td[myname=State]');
				this.echo("can't shipment,tracking order state:"+state.text);
				this.exit();
			})
		},function timeout(){
			this.echo("can't shipment,trackingNumber: "+trackingNumberList[i]+" not found");
			this.exit();
		});
		
		casper.then(function(){
			i+=1;
		});
	});
	this.thenClick('img[onclick="AddConsignAll(event)"]');
});

//fill product
casper.waitForSelector('#iframe',function(){
	casper.withFrame('conter', function () {
		for (i = 1; i <= productNumbers; i++){
			if(i != productNumbers)
				this.click('a[onclick="addProductDetail(this)"]');
		}
		var i = 0;
		//var j=1;
		casper.repeat(productNumbers,function(){
			casper.waitForSelector(x('//option[contains(., "'+productList[i].category+'")]'),function(){
					var text = this.getElementsAttribute(x('//option[contains(., "'+productList[i].category+'")]'), 'value');
			//fill category
				casper.evaluate(function choose(text,i){
					var selector = '#tableProduct tr:nth-child('+(i+2)+') #ProductType';
					var $select = $(selector);
					//var $select = document.querySelector('#ProductType');
					var _option = text;
					$select.val(_option);
					$select.change();
				},text[0],i);
			},function timeout(){
				this.echo(productList[i].category + " category not found");
				this.emit('category.notfound');
			})

			//fill sub category
			casper.waitFor(function check(){
				    return this.evaluate(function(category) {
						//console.log(category)
						//var selector = ;
						//console.log(selector);
						var element = document.evaluate('//option[contains(., "'+category+'")]' ,document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
						return element != null;
					},productList[i].subCategory);
			},function then(){
					var subCategoryText = this.getElementsAttribute(x('//option[contains(., "'+productList[i].subCategory+'")]'), 'value');
					casper.thenEvaluate(function choose(text,i){
						//console.log(text);
						var selector = '#tableProduct tr:nth-child('+(i+2)+') #ProductTypeSmall';
						var $select = $(selector);
						//console.log(selector);
						var _option = text;
						$select.val(_option);
						$select.change();
					},subCategoryText[0],i);
			},function timeout(){
				this.echo(productList[i].subCategory + " category not found");
				this.emit('category.notfound');
			});

			//fill other
			casper.thenEvaluate(function(name,brandName,quantity,price,i){
				document.querySelector('#tableProduct tr:nth-child('+(i+2)+') input[name="productName"]').value = name;
				document.querySelector('#tableProduct tr:nth-child('+(i+2)+') input[name="productBrand"]').value = brandName;
				document.querySelector('#tableProduct tr:nth-child('+(i+2)+') input[name="productNum"]').value = quantity;
				document.querySelector('#tableProduct tr:nth-child('+(i+2)+') input[name="productPrice"]').value = price;
			},productList[i].name,productList[i].brandName,productList[i].quantity,productList[i].price,i);
			
			casper.then(function(){
				this.click('#tableProduct tr:nth-child('+(i+2)+') input[name="productNum"]');
				this.click('#tableProduct tr:nth-child('+(i+2)+') input[name="productPrice"]');
			});
			
			casper.then(function(){
				i+=1;
			});
		});
		
		//fill shipping address
		casper.then(function(){
			this.fill('form#form1', {
				'ConsigneeName': address.userName,
				'ConsigneePhone':address.phone,
				'ConsigneeCountry':    '中国',
				'ConsigneeProvince':address.province,	
				'ConsigneeCity':    address.city,
				'ConsigneeAdress':address.address,
				'ConsigneeZC':    address.zipCode,
				'GoodsDescribe':describe,					
				//'InsureAmount':insured,
				'Remark':'Ebates&Extrabux运单，赠品取出，统一寄回'
			}, false);
		});
		
		casper.then(function(){
			this.click('input[name=isfp][value=false]');
			this.click('input[name=isxh][value=true]');
			this.click('input[name=isjg][value=true]');
			this.click('img[name=Saving]');
		});
	});
});

casper.waitForAlert(function(response) {
    this.echo("Alert received: " + response.data);
});

casper.then(function(){
	this.capture('tj-shipment-success.png');
});

casper.run();