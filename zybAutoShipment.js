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

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});

casper.on('waitFor.timeout', function() {
    this.echo('wait time out');
	this.capture('zyb-wait-timeout.png');
	//this.exit();
});

casper.on('order.notfound', function(orderNumber) {
    this.echo(orderNumber+' order not found');
	this.capture('zyb-order-notfound.png');
	this.exit();
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
}

var trackingNumberList = '';
var shipmentUrl = 'http://www.zhuanyunbang.com/order/shipment?no=';
if(casper.cli.has('trackingNumberList')){
    trackingNumberList = casper.cli.raw.get('trackingNumberList').split(',');
	for (i = 0; i < trackingNumberList.length; i++) { 
		if(i == trackingNumberList.length-1)
			shipmentUrl += trackingNumberList[i];
		else
			shipmentUrl += trackingNumberList[i] + ",";
	}
}


var address = {
	consigneeName : '',
	phone : '',
	province:'',
	city:'',
	address:'',
	zipCode:''
}
if(casper.cli.has('province')){
    address.userName = casper.cli.raw.get('consigneeName');
	address.phone = casper.cli.raw.get('phone');
	address.province = casper.cli.raw.get('province');
	address.district = casper.cli.raw.get('district');
	if(address.province == '上海' || address.province == '北京' || address.province == '天津'){
		if(address.district.indexOf("县") > -1)
			address.city = "县";
		else
			address.city = "市辖区";
	}else if(address.province == '重庆'){
		if(address.district.indexOf("川") > -1 || address.district.indexOf("江津") > -1)
		{
			address.city = "市";
			address.district= address.district.replace("区","市");
		}
		else if(address.district.indexOf("县") > -1)
			address.city = "县";
		else if(address.district.indexOf("区") > -1)
			address.city = "市辖区";		
		else
			address.city = "县";
	}else
		address.city = casper.cli.raw.get('city');
	
	address.address = casper.cli.raw.get('address');
	address.zipCode = casper.cli.raw.get('zipCode');
}

//login
casper.start(url, function() {   
	this.sendKeys('input#loginform-username', user.userName);
	this.sendKeys('input#loginform-password', user.password);
	this.click('button.submit');
	this.echo('submit login');
});

var addressId="";
//go to address page
casper.waitForSelector('div.btn-add', function() {
    this.click('div.user-nav a[href="/user-address/add"]');
	//click edit
	casper.waitForSelector(x('//tr[td="自动发货"]/td/a[@class="link-modify"]'),function(){
		this.click(x('//tr[td="自动发货"]/td/a[@class="link-modify"]'));
		addressId = this.getElementsAttribute(x('//tr[td="自动发货"]/td/a[@class="link-modify"]'),'href');
		//get address id
		addressId = this.evaluate(function getId(addressId) {
			var id = addressId.replace("/user-address/edit?id=", "");
			//console.log(id);
			return id;
		},addressId);
	})
}); 

//fill shipping address
casper.waitForSelector(x('//option[contains(., "'+address.province+'")]'),function(){

	var text = this.getElementsAttribute(x('//option[contains(., "'+address.province+'")]'), 'value');
	//省
	casper.evaluate(function choose(text){
		var selector = '#addform-province_id';
		var $select = $(selector);
		var _option = text;
		$select.val(_option);
		$select.change();
	},text[0]);
	
	//市
	casper.waitForSelector(x('//select[@id="addform-city_id"]/option[contains(., "'+address.city+'")]'),function(){
		var text = this.getElementsAttribute(x('//select[@id="addform-city_id"]/option[contains(., "'+address.city+'")]'), 'value');
		if(address.city == "市")
			text[0] = "275";
		casper.evaluate(function choose(text){
			console.log(text);
			var selector = '#addform-city_id';
			var $select = $(selector);
			var _option = text;
			$select.val(_option);
			$select.change();
		},text[0]);
	})
	
	//区
	casper.waitForSelector(x('//select[@id="addform-district_id"]/option[contains(., "'+address.district+'")]'),function(){
	var text = this.getElementsAttribute(x('//select[@id="addform-district_id"]/option[contains(., "'+address.district+'")]'), 'value');
	casper.evaluate(function choose(text){
		var selector = '#addform-district_id';
		var $select = $(selector);
		var _option = text;
		$select.val(_option);
		$select.change();
	},text[0]);
	})
	
	//fill other and submit
	casper.then(function() {
		this.fill('form#w1', {
			'IdcardForm[name]': address.userName,
			'AddForm[mobile]':address.phone,
			'AddForm[address]':address.address,
			'AddForm[zipcode]': address.zipCode,
		}, false);
		this.click('button.btn');
		this.wait(5000);
	})
}); 


for (i = 0; i < trackingNumberList.length; i++) { 
    var searchUrl='http://www.zhuanyunbang.com/package/search?no='+trackingNumberList[i];
	casper.thenOpen(searchUrl,function(){
		casper.waitForSelector('td.state a.btn',function(){
			this.echo("找到订单");
		},function timeout(){
			this.echo("订单没有找到或尚未完成入库");
			this.emit("order.notfound",searchUrl.replace("http://www.zhuanyunbang.com/package/search?no=",""));
		});
	});
}

casper.thenOpen(shipmentUrl).waitForAlert(function(response) {
    this.echo("无法完成发货，原因: " + response.data);
	this.exit();
},function timeout(){
	casper.waitForSelector('div.sublimt button.btn.btn-topUp',function(){
		this.capture("zyb-forecast.png");
		this.click('input[value="3"]');
		this.click('input[value="4"]');
		this.click('input[type="radio"][value="1"]');
		casper.waitForSelector('input[value="'+addressId+'"]',function(){
			this.click('input[type="radio"][value="'+addressId+'"]');
			this.click('div.sublimt button.btn.btn-topUp');
			//this.wait(3000);
		});
	});
},1000); 

casper.waitForText("order paid", function() {
    this.echo("发货成功");
	this.capture("zyb-shipment-success.png");
},function timeout(){
	this.echo("发货失败");
});

casper.run();
