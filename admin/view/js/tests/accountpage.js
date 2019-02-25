// Create or update account page tests
var AccountPage = new (function()
{
	var self = this;
	var page = null;


	function parsePage()
	{
		var res = {};

		res.headingElem = vquery('.heading > h1');
		if (!res.headingElem)
			throw 'Heading element not found';
		res.heading = res.headingElem.innerHTML;

		res.tile = parseTile(vge('acc_tile'));

		res.formElem = vquery('form');
		if (!res.formElem)
			throw 'Form element not found';

		res.isEdit = (res.formElem.firstElementChild.id == 'accid');

		var elem = res.formElem.firstElementChild.nextElementSibling;
		if (res.isEdit)
			elem = elem.nextElementSibling;
		res.iconDropDown = parseDropDown(elem.querySelector('.dd_container'));

		res.nameInp = vge('accname');
		if (!res.nameInp)
			throw 'Account name input not found';
		res.name = res.nameInp.value;

		elem = elem.nextElementSibling.nextElementSibling;
		res.currDropDown = parseDropDown(elem.querySelector('.dd_container'));

		elem = elem.nextElementSibling;

		res.balance = parseInputRow(elem);

		res.submitBtn = vquery('.acc_controls .ok_btn');
		if (!res.submitBtn)
			throw 'Submit button not found';

		return res;
	}


	function performAction(action)
	{
		if (!isFunction(action))
			throw 'Wrong action specified';

		if (!page)
			self.parse();

		action.call(self);

		return self.parse();
	}


	this.parse = function()
	{
		page = parsePage();

		return page;
	}


	this.inputName = function(val)
	{
		return performAction(function()
		{
			inputEmul(page.nameInp, val);
		});
	}


	this.inputBalance = function(val)
	{
		return performAction(function()
		{
			inputEmul(page.balance.valueInput, val);
		});
	}


	this.changeCurrency = function(val)
	{
		return performAction(function()
		{
			page.currDropDown.selectByValue(val);
		});
	}


	this.changeIcon = function(val)
	{
		return performAction(function()
		{
			page.iconDropDown.selectByValue(val);
		});
	}

})();
