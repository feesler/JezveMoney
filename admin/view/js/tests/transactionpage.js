// Create or update transaction page tests
var TransactionPage = new (function()
{
	var self = this;
	var page = null;
	var availableControls = ['source',
					'destination',
					'src_amount_left',
					'dest_amount_left',
					'src_res_balance_left',
					'dest_res_balance_left',
					'exch_left',
					'src_amount_row',
					'dest_amount_row',
					'exchange_row',
					'result_balance_row',
					'result_balance_dest_row'];


	function parseTileRightItem(elem)
	{
		if (!elem || !elem.firstElementChild || !elem.firstElementChild.nextElementSibling || !elem.firstElementChild.nextElementSibling.firstElementChild)
			return null;

		var res = { elem : elem };
		res.titleElem = elem.firstElementChild;
		res.title = res.titleElem.innerHTML;
		res.buttonElem = res.titleElem.nextElementSibling.firstElementChild;
		res.value = res.buttonElem.firstElementChild.innerHTML;

		return res;
	}


	function parseTileBlock(elem)
	{
		if (!elem || !elem.firstElementChild || !elem.firstElementChild.firstElementChild || !elem.firstElementChild.nextElementSibling)
			return null;

		var res = { elem : elem };

		res.label = elem.firstElementChild.firstElementChild.innerHTML;
		res.tile = parseTile(elem.querySelector('.tile'));

		return res;
	}


	function parsePage()
	{
		var res = {};

		var menuItems = vqueryall('#trtype_menu > span');
		res.typeMenu = [];
		for(var i = 0; i < menuItems.length; i++)
		{
			var menuItem = menuItems[i].firstElementChild;

			res.type = getTransactionType(menuItem.innerHTML);

			var menuItemObj = { text : menuItem.innerHTML, type : getTransactionType(menuItem.innerHTML) };

			if (menuItem.tagName == 'B')
			{
				res.activeType = menuItemObj.type;
				menuItemObj.isActive = true;
			}
			else if (menuItem.tagName == 'A')
			{
				menuItemObj.link = menuItem.href;
				menuItemObj.isActive = false;
			}
			res.typeMenu.push(menuItemObj);
		}

		res.source = parseTileBlock(vge('source'));
		res.destination = parseTileBlock(vge('destination'));

		res.src_amount_left = parseTileRightItem(vge('src_amount_left'));
		res.dest_amount_left = parseTileRightItem(vge('dest_amount_left'));
		res.src_res_balance_left = parseTileRightItem(vge('src_res_balance_left'));
		res.dest_res_balance_left = parseTileRightItem(vge('dest_res_balance_left'));
		res.exch_left = parseTileRightItem(vge('exch_left'));

		res.src_amount_row = parseInputRow(vge('src_amount_row'));
		res.dest_amount_row = parseInputRow(vge('dest_amount_row'));
		res.exchange_row = parseInputRow(vge('exchange'));
		res.result_balance_row = parseInputRow(vge('result_balance'));
		res.result_balance_dest_row = parseInputRow(vge('result_balance_dest'));

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


	this.checkVisibility = function(controls)
	{
		var control, expected, fact;

		for(var countrolName in controls)
		{
			if (availableControls.indexOf[countrolName] === -1)
				throw 'Unknown control ' + countrolName;

			expected = controls[countrolName];

			control = page[countrolName];
			fact = !(!control || !control.elem || !isVisible(control.elem));
			if (expected != fact)
			{
				console.error('Not expected visibility of ' + countrolName + ' control');
				return false;
			}
		}

		return true;
	}


	function checkObjValue(obj, expectedObj)
	{
		if (obj === expectedObj)
			return true;

		var value, expected;
		for(var vKey in expectedObj)
		{
			if (!(vKey in obj))
			{
				console.error('Key ' + vKey + ' not found');
				return false;
			}

			expected = expectedObj[vKey];
			value = obj[vKey];
			if (isObject(expected))
				return checkObjValue(value, expected);
			else if (value !== expected)
			{
				console.error('Not expected value ' + value + ' for ' + vKey + '. ' + expected  + ' is expected');
				return false;
			}
		}

		return true;
	}


	this.checkValues = function(controls)
	{
		var control, expected, fact;

		for(var countrolName in controls)
		{
			if (availableControls.indexOf[countrolName] === -1)
				throw 'Unknown control ' + countrolName;

			expected = controls[countrolName];
			control = page[countrolName];
			if (!control || (isObject(expected) && !checkObjValue(control, expected)) || (!isObject(expected) && control.value !== expected))
			{
				console.error('Not expected values of ' + countrolName + ' control');
				return false;
			}
		}

		return true;
	}


	this.checkState = function(stateObj)
	{
		return stateObj && this.checkVisibility(stateObj.visibility) && this.checkValues(stateObj.values);
	}


	this.inputDestAmount = function(val)
	{
		return performAction(function()
		{
			inputEmul(page.dest_amount_row.valueInput, val);
		});
	}


	this.clickSrcResultBalance = function()
	{
		return performAction(function()
		{
			clickEmul(page.src_res_balance_left.buttonElem);
		});
	}


	this.clickDestAmount = function()
	{
		return performAction(function()
		{
			clickEmul(page.dest_amount_left.buttonElem);
		});
	}


	this.inputResBalance = function(val)
	{
		return performAction(function()
		{
			inputEmul(page.result_balance_row.valueInput, val);
		});
	}


	this.changeDestCurrency = function(val)
	{
		return performAction(function()
		{
			page.dest_amount_row.currDropDown.selectByValue(val);
		});
	}
})();
