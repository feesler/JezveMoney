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
		throw 'Logo element not found';

	res.logo.linkElem = res.logo.elem.querySelector('a');
	if (!res.logo.linkElem)
		throw 'Logo link element not found';

	res.user = {};
	res.user.elem = res.elem.querySelector('.userblock');
	if (res.user.elem)
	{
		res.user.menuBtn = res.elem.querySelector('button.user_button');
		if (!res.user.menuBtn)
			throw 'User button not found';
		el = res.user.menuBtn.querySelector('.user_title');
		if (!el)
			throw 'User title element not found';
		res.user.name = el.innerHTML;

		res.user.menuEl = res.elem.querySelector('.usermenu');
		if (!res.user.menuEl)
			throw 'Menu element not found';

		res.user.menuItems = [];
		var menuLinks = res.user.menuEl.querySelectorAll('ul > li > a');
		for(var i = 0; i < menuLinks.length; i++)
		{
			el = menuLinks[i];
			res.user.menuItems.push({ elem : el, link : el.href, text : el.innerHTML });
		}
	}

	return res;
};


TestPage.prototype.parseId = function(id)
{
	if (typeof id !== 'string')
		return id;

	var pos = id.indexOf('_');
	return (pos != -1) ? parseInt(id.substr(pos + 1)) : id;
}


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
		throw 'Wrong tile structure';

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
		clickEmul(tileObj.linkElem);
	};

	return tileObj;
}


TestPage.prototype.parseInfoTile = function(tileEl)
{
	if (!tileEl || !hasClass(tileEl, 'info_tile'))
		throw 'Wrong info tile structure';

	var tileObj = { elem : tileEl,
					titleEl : tileEl.querySelector('.info_title'),
					subtitleEl : tileEl.querySelector('.info_subtitle') };

	tileObj.id = this.parseId(tileEl.id);
	tileObj.title = tileObj.titleEl.innerHTML;
	tileObj.subtitle = tileObj.subtitleEl.innerHTML;

	return tileObj;
}


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
			throw 'Fail to parse tile';

		res.push(tileObj);
	}

	res.sort(function(a, b)
	{
		return (a.id == b.id) ? 0 : ((a.id < b.id) ? -1 : 1);
	});

	return res;
}


TestPage.prototype.parseInfoTiles = function(tilesEl)
{
	return this.parseTiles(tilesEl, this.parseInfoTile);
}


TestPage.prototype.parseDropDown = function(elem)
{
	var res = { elem : elem };
	if (!res.elem || (!hasClass(res.elem, 'dd_container') && !hasClass(res.elem, 'dd_attached')))
		throw 'Wrong drop down element';

	res.isAttached = hasClass(res.elem, 'dd_attached');
	if (res.isAttached)
		res.selectBtn = res.elem.firstElementChild;
	else
		res.selectBtn = res.elem.querySelector('button.selectBtn');
	if (!res.selectBtn)
		throw 'Select button not found';

	if (!res.isAttached)
	{
		res.statSel = res.elem.querySelector('.dd_input_cont span.statsel');
		if (!res.statSel)
			throw 'Static select element not found';
		res.input = res.elem.querySelector('.dd_input_cont input');
		if (!res.input)
			throw 'Input element not found';

		res.editable = isVisible(res.input);
		res.textValue = (res.editable) ? res.input.value : res.statSel.innerHTML;
	}

	res.selectElem = res.elem.querySelector('select');

	res.listContainer = res.elem.querySelector('.ddlist');
	if (res.listContainer)
	{
		var listItems = res.elem.querySelectorAll('.ddlist li > div');
		res.items = [];
		for(var i = 0; i < listItems.length; i++)
		{
			var li = listItems[i];
			var itemObj = { id : this.parseId(li.id), text : li.innerHTML, elem : li };

			res.items.push(itemObj);
		}
	}

	res.selectByValue = function(val)
	{
		clickEmul(this.selectBtn);
		var li = idSearch(this.items, val);
		if (!li)
			throw 'List item not found';
		clickEmul(li.elem);
	};

	return res;
};


TestPage.prototype.getTransactionType = function(str)
{
	var strToType = { 'EXPENSE' : EXPENSE, 'INCOME' : INCOME, 'TRANSFER' : TRANSFER, 'DEBT' : DEBT };

	if (!str)
		return null;

	var key = str.toUpperCase();
	return (strToType[key] !== undefined) ? strToType[key] : null;
};


TestPage.prototype.parseIconLink = function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	if (!hasClass(elem, 'iconlink'))
		throw 'Wrong icon link';

	res.linkElem = elem.firstElementChild;
	if (!res.linkElem)
		throw 'Link element not found';

	res.titleElem = res.linkElem.querySelector('.icontitle');
	if (!res.titleElem || !res.titleElem.firstElementChild)
		throw 'Title element not found';
	res.title = res.titleElem.firstElementChild.innerHTML;

// Subtitle is optional
	res.subTitleElem = res.titleElem.querySelector('.subtitle');
	if (res.subTitleElem)
	{
		res.subtitle = res.subTitleElem.innerHTML;
	}

	res.click = function()
	{
		clickEmul(res.linkElem);
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
		throw 'Label element not found';

	res.label = res.labelEl.innerHTML;
	res.currElem = elem.querySelector('.btn.rcurr_btn') || elem.querySelector('.exchrate_comm');
	if (res.currElem)
	{
		res.isCurrActive = !hasClass(res.currElem, 'inact_rbtn') && !hasClass(res.currElem, 'exchrate_comm');
		if (res.isCurrActive)
		{
			res.currDropDown = this.parseDropDown(res.currElem.firstElementChild);
			if (!res.currDropDown.isAttached)
				throw 'Currency drop down is not attached';
			res.currSign = res.currDropDown.selectBtn.innerHTML;
		}
		else if (hasClass(res.currElem, 'exchrate_comm'))
		{
			res.currSign = res.currElem.innerHTML;
		}
		else
		{
			res.currSign = res.currElem.firstElementChild.innerHTML;
		}
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

	return res;
};



TestPage.prototype.parseWarningPopup = function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	res.titleElem = elem.querySelector('.popup_title');
	res.title = res.titleElem.innerHTML;
	res.messageElem = elem.querySelector('.popup_message > div');
	res.message = res.messageElem.innerHTML;
	res.okBtn = elem.querySelector('.popup_controls > .btn.ok_btn');
	res.cancelBtn = elem.querySelector('.popup_controls > .btn.cancel_btn');

	return res;
};


TestPage.prototype.parseContent = function()
{
};


TestPage.prototype.parse = function()
{
	this.location = viewframe.contentWindow.location.href;
	this.header = this.parseHeader();
	this.content = this.parseContent();
};


TestPage.prototype.performAction = function(action)
{
	if (!isFunction(action))
		throw 'Wrong action specified';

	if (!this.content && !this.header)
		this.content = this.parse();

	action.call(this);

	this.parse();
};


TestPage.prototype.checkVisibility = function(controls)
{
	var control, expected, fact;

	for(var countrolName in controls)
	{
		expected = controls[countrolName];

		control = this.content[countrolName];
		fact = !!(control && isVisible(control.elem));
		if (expected != fact)
		{
			console.error('Not expected visibility of ' + countrolName + ' control');
			return false;
		}
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
		{
			console.error('Key ' + vKey + ' not found');
			return false;
		}

		expected = expectedObj[vKey];
		value = obj[vKey];
		if (isObject(expected))
			return this.checkObjValue(value, expected);
		else if (value !== expected)
		{
			console.error('Not expected value ' + value + ' for ' + vKey + '. ' + expected  + ' is expected');
			return false;
		}
	}

	return true;
};


TestPage.prototype.checkValues = function(controls)
{
	var control, expected, fact;

	for(var countrolName in controls)
	{
		expected = controls[countrolName];
		control = this.content[countrolName];
		if (!control ||
			(control && isObject(expected) && !this.checkObjValue(control, expected)) ||
		 	(control && !isObject(expected) && control.value !== expected))
		{
			console.error('Not expected values of ' + countrolName + ' control');
			return false;
		}
	}

	return true;
};


TestPage.prototype.checkState = function(stateObj)
{
	return stateObj && this.checkVisibility(stateObj.visibility) && this.checkValues(stateObj.values);
};


// Click on profile menu item and return navigation promise
TestPage.prototype.goToProfilePage = function()
{
	if (!this.isUserLoggedIn())
		throw 'User is not logged in';

	clickEmul(this.header.user.menuBtn);		// open user menu

	return navigation(() => {
		setTimeout(() => clickEmul(this.header.user.menuItems[0].elem), 500);
	}, ProfilePage);
};


// Click on logout link from user menu and return navigation promise
TestPage.prototype.logoutUser = function()
{
	clickEmul(this.header.user.menuBtn);

	return navigation(() => {
		setTimeout(() => clickEmul(this.header.user.menuItems[1].elem), 500);
	}, LoginPage);
};


TestPage.prototype.goToMainPage = function()
{
	if (!this.isUserLoggedIn())
		throw 'User not logged in';

	return navigation(() => clickEmul(this.header.logo.linkElem), MainPage);
};
