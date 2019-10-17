// Common test page class constructor
function TestPage()
{
	this.availableControls = [];
	this.parse();
}


TestPage.prototype.isUserLoggedIn = function()
{
	var loggedOutLocations = ['login', 'register'];

	return loggedOutLocations.every((item) => this.location.indexOf('/' + item) === -1);
};


TestPage.prototype.parseHeader = function()
{
	var el;
	var res = {};

	res.elem = vquery('.page > .page_wrapper > .header');
	if (!res.elem)
		return res;		// no header is ok for login page

	res.logo = {};
	res.logo.elem = res.elem.querySelector('.logo');
	if (!res.logo.elem)
		throw new Error('Logo element not found');

	res.logo.linkElem = res.logo.elem.querySelector('a');
	if (!res.logo.linkElem)
		throw new Error('Logo link element not found');

	res.user = {};
	res.user.elem = res.elem.querySelector('.userblock');
	if (res.user.elem)
	{
		res.user.menuBtn = res.elem.querySelector('button.user_button');
		if (!res.user.menuBtn)
			throw new Error('User button not found');
		el = res.user.menuBtn.querySelector('.user_title');
		if (!el)
			throw new Error('User title element not found');
		res.user.name = el.innerText;

		res.user.menuEl = res.elem.querySelector('.usermenu');
		if (!res.user.menuEl)
			throw new Error('Menu element not found');

		res.user.menuItems = [];
		var menuLinks = res.user.menuEl.querySelectorAll('ul > li > a');
		for(var i = 0; i < menuLinks.length; i++)
		{
			el = menuLinks[i];
			res.user.menuItems.push({ elem : el, link : el.href, text : el.innerText });
		}

		var itemShift = (res.user.menuItems.length > 2) ? 1 : 0;

		res.user.profileBtn = res.user.menuItems[itemShift].elem;
		res.user.logoutBtn = res.user.menuItems[itemShift + 1].elem;
	}

	return res;
};


TestPage.prototype.parseId = function(id)
{
	if (typeof id !== 'string')
		return id;

	var pos = id.indexOf('_');
	return (pos != -1) ? parseInt(id.substr(pos + 1)) : id;
};


var tileIcons = [{ className : null, title : 'No icon' },
					{ className : 'purse_icon', title : 'Purse' },
					{ className : 'safe_icon', title : 'Safe' },
					{ className : 'card_icon', title : 'Card' },
					{ className : 'percent_icon', title : 'Percent' },
					{ className : 'bank_icon', title : 'Bank' },
					{ className : 'cash_icon', title : 'Cash' }];

TestPage.prototype.parseTile = function(tileEl)
{
	if (!tileEl || !hasClass(tileEl, 'tile'))
		throw new Error('Wrong tile structure');

	var tileObj = { elem : tileEl, linkElem : tileEl.firstElementChild,
					balanceEL : tileEl.querySelector('.acc_bal'),
					nameEL : tileEl.querySelector('.acc_name') };

	tileObj.id = this.parseId(tileEl.id);
	tileObj.balance = tileObj.balanceEL.innerText;
	tileObj.name = tileObj.nameEL.innerText;
	tileObj.icon = null;

	if (hasClass(tileObj.elem, 'tile_icon'))
	{
		tileIcons.some(function(item)
		{
			if (hasClass(tileObj.elem, item.className))
				tileObj.icon = item;

			return (tileObj.icon != null);
		});
	}

	tileObj.click = function()
	{
		clickEmul(this.linkElem);
	};

	return tileObj;
};


TestPage.prototype.parseInfoTile = function(tileEl)
{
	if (!tileEl || !hasClass(tileEl, 'info_tile'))
		throw new Error('Wrong info tile structure');

	var tileObj = { elem : tileEl,
					titleEl : tileEl.querySelector('.info_title'),
					subtitleEl : tileEl.querySelector('.info_subtitle') };

	tileObj.id = this.parseId(tileEl.id);
	tileObj.title = tileObj.titleEl.innerText;
	tileObj.subtitle = tileObj.subtitleEl.innerText;

	return tileObj;
};


TestPage.prototype.parseTiles = function(tilesEl, parseCallback)
{
	if (!tilesEl)
		return null;

	var res = [];
	if (!tilesEl || (tilesEl.children.length == 1 && tilesEl.children[0].tagName == 'SPAN'))
		return res;

	var callback = parseCallback || this.parseTile;
	for(var i = 0; i < tilesEl.children.length; i++)
	{
		var tileObj = callback.call(this, tilesEl.children[i]);
		if (!tileObj)
			throw new Error('Fail to parse tile');

		res.push(tileObj);
	}

	res.sort(function(a, b)
	{
		return (a.id == b.id) ? 0 : ((a.id < b.id) ? -1 : 1);
	});

	return res;
};


TestPage.prototype.parseInfoTiles = function(tilesEl)
{
	return this.parseTiles(tilesEl, this.parseInfoTile);
};


TestPage.prototype.parseTransactionsList = function(listEl)
{
	if (!listEl)
		return null;

	var res = [];

	if (!listEl || (listEl.children.length == 1 && listEl.children[0].tagName == 'SPAN'))
		return res;

	var listItems;
	if (listEl.tagName == 'TABLE')
	{
		listItems = listEl.querySelectorAll('tr');
	}
	else
	{
		listItems = listEl.querySelectorAll('.trlist_item_wrap > div');
	}

	for(var i = 0; i < listItems.length; i++)
	{
		var li = listItems[i];
		var itemObj = { id : this.parseId(li.id), elem : li };

		var elem = li.querySelector('.tritem_acc_name > span');
		if (!elem)
			throw new Error('Account title not found');
		itemObj.accountTitle = elem.innerText;

		elem = li.querySelector('.tritem_sum > span');
		if (!elem)
			throw new Error('Amount text not found');
		itemObj.amountText = elem.innerText;

		elem = li.querySelector('.tritem_date_comm');
		if (!elem || !elem.firstElementChild || elem.firstElementChild.tagName != 'SPAN')
			throw new Error('Date element not found');

		itemObj.dateFmt = elem.firstElementChild.innerText;

		elem = li.querySelector('.tritem_comm');
		itemObj.comment = elem ? elem.innerText : '';

		itemObj.click = function()
		{
			clickEmul(this.elem);
		};

		res.push(itemObj);
	}

	return res;
};


TestPage.prototype.parseDropDown = function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };
	if (!res.elem || (!hasClass(res.elem, 'dd_container') && !hasClass(res.elem, 'dd_attached')))
		throw new Error('Wrong drop down element');

	res.isAttached = hasClass(res.elem, 'dd_attached');
	if (res.isAttached)
		res.selectBtn = res.elem.firstElementChild;
	else
		res.selectBtn = res.elem.querySelector('button.selectBtn');
	if (!res.selectBtn)
		throw new Error('Select button not found');

	if (!res.isAttached)
	{
		res.statSel = res.elem.querySelector('.dd_input_cont span.statsel');
		if (!res.statSel)
			throw new Error('Static select element not found');
		res.input = res.elem.querySelector('.dd_input_cont input');
		if (!res.input)
			throw new Error('Input element not found');

		res.editable = isVisible(res.input);
		res.textValue = (res.editable) ? res.input.value : res.statSel.innerText;
	}

	res.selectElem = res.elem.querySelector('select');

	res.listContainer = res.elem.querySelector('.ddlist');
	res.isMobile = hasClass(res.listContainer, 'ddmobile');
	if (res.isMobile)
	{
			res.items = [];

			for(var i = 0; i < res.selectElem.options.length; i++)
			{
				var option = res.selectElem.options[i];
				if (option.disabled)
					continue;

				var itemObj = { id : this.parseId(option.value), text : option.innerText, elem : option };

				res.items.push(itemObj);
			}
	}
	else
	{

		if (res.listContainer)
		{
			var listItems = res.elem.querySelectorAll('.ddlist li > div');
			res.items = [];
			for(var i = 0; i < listItems.length; i++)
			{
				var li = listItems[i];
				var itemObj = { id : this.parseId(li.id), text : li.innerText, elem : li };

				res.items.push(itemObj);
			}
		}
	}

	res.selectByValue = function(val)
	{
		if (this.isMobile)
		{
			var option = idSearch(this.items, val);
			if (!option)
				throw new Error('Option item not found');

			selectByValue(res.selectElem, option.elem.value);
			res.selectElem.onchange();
		}
		else
		{
			clickEmul(this.selectBtn);
			var li = idSearch(this.items, val);
			if (!li)
				throw new Error('List item not found');
			clickEmul(li.elem);
		}
	};

	return res;
};


TestPage.prototype.getTransactionType = function(str)
{
	var strToType = { 'ALL' : 0, 'EXPENSE' : EXPENSE, 'INCOME' : INCOME, 'TRANSFER' : TRANSFER, 'DEBT' : DEBT };

	if (!str)
		return null;

	var key = str.toUpperCase();
	return (strToType[key] !== undefined) ? strToType[key] : null;
};


TestPage.prototype.getTransactionTypeStr = function(type)
{
	var typeToStr = { 1 : 'EXPENSE', 2 : 'INCOME', 3 : 'TRANSFER', 4 : 'DEBT' };

	if (!type)
		return null;

	return (typeToStr[type] !== undefined) ? typeToStr[type] : null;
};


TestPage.prototype.getTransactionPageClass = function(str)
{
	var strToClass = { 'EXPENSE' : ExpenseTransactionPage,
						'INCOME' : IncomeTransactionPage,
					 	'TRANSFER' : TransferTransactionPage,
					 	'DEBT' : DebtTransactionPage };

	if (!str)
		return null;

	var key = str.toUpperCase();
	return (strToClass[key] !== undefined) ? strToClass[key] : TransactionPage;
};


TestPage.prototype.parseTransactionTypeMenu = function(elem)
{
	var res = { elem : elem, items : [], activeType : null };

	var menuItems = elem.querySelectorAll('span');
	for(var i = 0; i < menuItems.length; i++)
	{
		var menuItem = menuItems[i].firstElementChild;

		var menuItemObj = { elem : menuItem, text : menuItem.innerText, type : this.getTransactionType(menuItem.innerText) };

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

		menuItemObj.click = function()
		{
			if (!this.isActive)
				clickEmul(this.elem);
		};

		res.items[menuItemObj.type] = menuItemObj;
	}

	return res;
};



TestPage.prototype.parseIconLink = function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	if (!hasClass(elem, 'iconlink'))
		throw new Error('Wrong icon link');

	res.linkElem = elem.firstElementChild;
	if (!res.linkElem)
		throw new Error('Link element not found');

	res.titleElem = res.linkElem.querySelector('.icontitle');
	if (!res.titleElem || !res.titleElem.firstElementChild)
		throw new Error('Title element not found');
	res.title = res.titleElem.firstElementChild.innerText;

// Subtitle is optional
	res.subTitleElem = res.titleElem.querySelector('.subtitle');
	if (res.subTitleElem)
	{
		res.subtitle = res.subTitleElem.innerText;
	}

	res.click = function()
	{
		clickEmul(this.linkElem);
	};

	return res;
};


TestPage.prototype.parseInputRow = function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	res.labelEl = elem.querySelector('label');
	if (!res.labelEl)
		throw new Error('Label element not found');

	res.label = res.labelEl.innerText;
	res.currElem = elem.querySelector('.btn.rcurr_btn') || elem.querySelector('.exchrate_comm');
	res.isCurrActive = false;
	if (res.currElem)
	{
		res.isCurrActive = !hasClass(res.currElem, 'inact_rbtn') && !hasClass(res.currElem, 'exchrate_comm');
		if (res.isCurrActive)
		{
			res.currDropDown = this.parseDropDown(res.currElem.firstElementChild);
			if (!res.currDropDown.isAttached)
				throw new Error('Currency drop down is not attached');
			res.currSign = res.currDropDown.selectBtn.innerText;
		}
		else if (hasClass(res.currElem, 'exchrate_comm'))
		{
			res.currSign = res.currElem.innerText;
		}
		else
		{
			res.currSign = res.currElem.firstElementChild.innerText;
		}
	}
	else
	{
		res.datePickerBtn = elem.querySelector('.btn.cal_btn');
	}

	var t = elem.querySelector('input[type="hidden"]');
	if (t)
	{
		res.hiddenValue = t.value;
	}

	res.valueInput = elem.querySelector('.stretch_input > input');
	res.value = res.valueInput.value;

	res.input = function(val)
	{
		inputEmul(res.valueInput, val);
	};

	res.selectCurr = function(val)
	{
		if (res.isCurrActive && res.currDropDown)
			res.currDropDown.selectByValue(val);
	};

	return res;
};


TestPage.prototype.parseDatePickerRow = function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	var iconLinkElem = elem.querySelector('.iconlink');

	res.iconLink = this.parseIconLink(iconLinkElem);
	res.inputRow = this.parseInputRow(iconLinkElem.nextElementSibling);
	if (!res.inputRow)
		throw new Error('Input row of date picker not found');
	res.date = res.inputRow.value;

	res.input = function(val)
	{
		if (isVisible(this.iconLink))
		{
			this.iconLink.click()
			clickEmul(this.datePickerBtn);
		}

		this.inputRow.input(val);
	};

	return res;
};


TestPage.prototype.parseWarningPopup = function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	res.titleElem = elem.querySelector('.popup_title');
	res.title = res.titleElem.innerText;
	res.messageElem = elem.querySelector('.popup_message > div');
	res.message = res.messageElem.innerText;
	res.okBtn = elem.querySelector('.popup_controls > .btn.ok_btn');
	res.cancelBtn = elem.querySelector('.popup_controls > .btn.cancel_btn');

	return res;
};


TestPage.prototype.parseContent = function()
{
	return {};
};


TestPage.prototype.buildModel = function()
{
	return {};
};


TestPage.prototype.parse = function()
{
	this.location = viewframe.contentWindow.location.href;
	this.header = this.parseHeader();
	this.content = this.parseContent();
	this.model = this.buildModel(this.content);
};


TestPage.prototype.performAction = function(action)
{
	if (!isFunction(action))
		throw new Error('Wrong action specified');

	if (!this.content && !this.header)
		this.parse();

	action.call(this);

	this.parse();
};


// Compare visibiliy of specified controls with expected mask
// In the controls object each value must be an object with 'elem' property containing pointer to DOM element
// In the expected object each value must be a boolean value
// For false expected control may be null or invisible
// Both controls and expected object may contain nested objects
// Example:
//     controls : { control_1 : { elem : Element }, control_2 : { childControl : { elem : Element } } }
//     expected : { control_1 : true, control_2 : { childControl : true, invControl : false }, control_3 : false }
TestPage.prototype.checkVisibility = function(controls, expected)
{
	var control, expVisible, factVisible, res;

	if (!controls)
		throw new Error('Wrong parameters');

	// Undefined expected value is equivalent to empty object
	if (typeof expected === 'undefined')
		return true;

	for(var countrolName in expected)
	{
		expVisible = expected[countrolName];
		control = controls[countrolName];

		if (isObject(expVisible))
		{
			res = this.checkVisibility(control, expVisible);
		}
		else
		{
			factVisible = !!(control && isVisible(control.elem, true));
			res = (expVisible == factVisible);
		}

		if (!res)
			throw new Error('Not expected visibility(' + factVisible + ') of "' + countrolName + '" control');
	}

	return true;
};


TestPage.prototype.checkObjValue = function(obj, expectedObj)
{
	if (obj === expectedObj)
		return true;

	var value, expected;
	for(var vKey in expectedObj)
	{
		if (!(vKey in obj))
			return { key : vKey };

		expected = expectedObj[vKey];
		value = obj[vKey];
		if (isObject(expected))
		{
			var res = this.checkObjValue(value, expected);
			if (res !== true)
			{
				res.key = vKey + '.' + res.key;
				return res;
			}
		}
		else if (value !== expected)
		{
			return { key : vKey,
						value : value,
						expected : expected };
		}
	}

	return true;
};


TestPage.prototype.checkValues = function(controls)
{
	var res = true;
	var control, expected, fact;

	for(var countrolName in controls)
	{
		expected = controls[countrolName];
		control = this.content[countrolName];
		if (!control)
			throw new Error('Control (' + countrolName + ') not found');

		if (isObject(expected))
		{
			res = this.checkObjValue(control, expected);
			if (res !== true)
			{
				res.key = countrolName + '.' + res.key;
				break;
			}
		}
		else if (control.value !== expected)
		{
			res = { key : countrolName,
							value : control.value,
							expected : expected };
			break;
		}
	}

	if (res !== true)
	{
		if ('expected' in res)
			throw new Error('Not expected value "' + res.value + '" for (' + res.key + ') "' + res.expected  + '" is expected');
		else
			throw new Error('Path (' + res.key + ') not found');
	}

	return res;
};


TestPage.prototype.checkState = function(stateObj)
{
	return stateObj && this.checkVisibility(this.content, stateObj.visibility) && this.checkValues(stateObj.values);
};


// Click on profile menu item and return navigation promise
TestPage.prototype.goToProfilePage = function()
{
	if (!this.isUserLoggedIn())
		throw new Error('User is not logged in');

	clickEmul(this.header.user.menuBtn);		// open user menu

	return navigation(() => {
		setTimeout(() => clickEmul(this.header.user.profileBtn), 500);
	}, ProfilePage);
};


// Click on logout link from user menu and return navigation promise
TestPage.prototype.logoutUser = function()
{
	clickEmul(this.header.user.menuBtn);

	return navigation(() => {
		setTimeout(() => clickEmul(this.header.user.logoutBtn), 500);
	}, LoginPage);
};


TestPage.prototype.goToMainPage = function()
{
	if (!this.isUserLoggedIn())
		throw new Error('User not logged in');

	return navigation(() => clickEmul(this.header.logo.linkElem), MainPage);
};
