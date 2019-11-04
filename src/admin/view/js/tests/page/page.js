if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var idSearch = common.idSearch;
	var isObject = common.isObject;
	var isFunction = common.isFunction;
	var idSearch = common.idSearch;
	var fixFloat = common.fixFloat;
	var correct = common.correct;
	var correctExch = common.correctExch;
	var normalize = common.normalize;
	var normalizeExch = common.normalizeExch;
	var isValidValue = common.isValidValue;
	var EXPENSE = common.EXPENSE;
	var INCOME = common.INCOME;
	var TRANSFER = common.TRANSFER;
	var DEBT = common.DEBT;
}


// Common test page class constructor
function TestPage(props)
{
	this.props = props || {};

	if (this.props.environment)
	{
		for(let key in this.props.environment)
		{
			this[key] = this.props.environment[key];
		}
	}

	this.tileIcons = [{ className : null, title : 'No icon' },
						{ className : 'purse_icon', title : 'Purse' },
						{ className : 'safe_icon', title : 'Safe' },
						{ className : 'card_icon', title : 'Card' },
						{ className : 'percent_icon', title : 'Percent' },
						{ className : 'bank_icon', title : 'Bank' },
						{ className : 'cash_icon', title : 'Cash' }];
}


TestPage.prototype.isUserLoggedIn = function()
{
	var loggedOutLocations = ['login', 'register'];

	return loggedOutLocations.every((item) => this.location.indexOf('/' + item) === -1);
};


TestPage.prototype.parseHeader = async function()
{
	var el;
	var res = {};

	res.elem = await this.query('.page > .page_wrapper > .header');
	if (!res.elem)
		return res;		// no header is ok for login page

	res.logo = {};
	res.logo.elem = await this.query(res.elem, '.logo');
	if (!res.logo.elem)
		throw new Error('Logo element not found');

	res.logo.linkElem = await this.query(res.logo.elem, 'a');
	if (!res.logo.linkElem)
		throw new Error('Logo link element not found');

	res.user = {};
	res.user.elem = await this.query(res.elem, '.userblock');
	if (res.user.elem)
	{
		res.user.menuBtn = await this.query(res.elem, 'button.user_button');
		if (!res.user.menuBtn)
			throw new Error('User button not found');
		el = await this.query(res.user.menuBtn, '.user_title');
		if (!el)
			throw new Error('User title element not found');
		res.user.name = await this.prop(el, 'innerText');

		res.user.menuEl = await this.query(res.elem, '.usermenu');
		if (!res.user.menuEl)
			throw new Error('Menu element not found');

		res.user.menuItems = [];
		var menuLinks = await this.queryAll(res.user.menuEl, 'ul > li > a');
		for(var i = 0; i < menuLinks.length; i++)
		{
			el = menuLinks[i];
			res.user.menuItems.push({ elem : el, link : await this.prop(el, 'href'), text : await this.prop(el, 'innerText') });
		}

		var itemShift = (res.user.menuItems.length > 2) ? 1 : 0;

		res.user.profileBtn = res.user.menuItems[itemShift].elem;
		res.user.logoutBtn = res.user.menuItems[itemShift + 1].elem;
	}

	return res;
};


TestPage.prototype.parseMessage = async function()
{
	let popupContent = await this.query('.popup_content.msg');
	if (!popupContent)
		return null;

	var res = { contentElem : popupContent };

	res.success = await this.hasClass(res.contentElem, 'msg_success');

	res.messageElem = await this.query(res.contentElem, '.popup_message');
	if (!res.messageElem)
		throw new Error('Wrong structure of message popup');

	res.message = await this.prop(res.messageElem, 'innerText');
	res.closeBtn = await this.query(res.contentElem, '.close_btn > button');
	res.close = () => this.click(res.closeBtn);

	return res;
};


TestPage.prototype.parseId = function(id)
{
	if (typeof id !== 'string')
		return id;

	var pos = id.indexOf('_');
	return (pos != -1) ? parseInt(id.substr(pos + 1)) : id;
};


TestPage.prototype.parseTile = async function(tileEl)
{
	if (!tileEl || !await this.hasClass(tileEl, 'tile'))
		throw new Error('Wrong tile structure');

	var self = this;
	var tileObj = { elem : tileEl, linkElem : await this.query(tileEl, ':scope > *'),
					balanceEL : await this.query(tileEl, '.acc_bal'),
					nameEL : await this.query(tileEl, '.acc_name') };

	tileObj.id = this.parseId(await this.prop(tileEl, 'id'));
	tileObj.balance = await this.prop(tileObj.balanceEL, 'innerText');
	tileObj.name = await this.prop(tileObj.nameEL, 'innerText');
	tileObj.icon = null;

	let isIcon = await this.hasClass(tileObj.elem, 'tile_icon');
	if (isIcon)
	{
		for(let item of this.tileIcons)
		{
			let found = await this.hasClass(tileObj.elem, item.className);
			if (found)
			{
				tileObj.icon = item;
				break;
			}
		}
	}

	tileObj.click = async function()
	{
		return self.click(this.linkElem);
	};

	return tileObj;
};


TestPage.prototype.parseInfoTile = async function(tileEl)
{
	if (!tileEl || !await this.hasClass(tileEl, 'info_tile'))
		throw new Error('Wrong info tile structure');

	var tileObj = { elem : tileEl,
					titleEl : await this.query(tileEl, '.info_title'),
					subtitleEl : await this.query(tileEl, '.info_subtitle') };

	tileObj.id = this.parseId(await this.prop(tileEl, 'id'));
	tileObj.title = await this.prop(tileObj.titleEl, 'innerText');
	tileObj.subtitle = await this.prop(tileObj.subtitleEl, 'innerText');

	return tileObj;
};


TestPage.prototype.parseTiles = async function(tilesEl, parseCallback)
{
	if (!tilesEl)
		return null;

	var res = [];
	let children = await this.queryAll(tilesEl, ':scope > *');
	if (!children || !children.length || (children.length == 1 && await this.prop(children[0], 'tagName') == 'SPAN'))
		return res;

	var callback = parseCallback || this.parseTile;
	for(var i = 0; i < children.length; i++)
	{
		var tileObj = await callback.call(this, children[i]);
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


TestPage.prototype.parseTransactionsList = async function(listEl)
{
	if (!listEl)
		return null;

	var self = this;
	var res = [];

	let children = await this.queryAll(listEl, ':scope > *');
	if (!children || !children.length || (children.length == 1 && await this.prop(children[0], 'tagName') == 'SPAN'))
		return res;

	var listItems;
	if (await this.prop(listEl, 'tagName') == 'TABLE')
	{
		listItems = await this.queryAll(listEl, 'tr');
	}
	else
	{
		listItems = await this.queryAll(listEl, '.trlist_item_wrap > div');
	}

	for(var i = 0; i < listItems.length; i++)
	{
		var li = listItems[i];
		var itemObj = { id : this.parseId(await this.prop(li, 'id')), elem : li };

		var elem = await this.query(li, '.tritem_acc_name > span');
		if (!elem)
			throw new Error('Account title not found');
		itemObj.accountTitle = await this.prop(elem, 'innerText');

		elem = await this.query(li, '.tritem_sum > span');
		if (!elem)
			throw new Error('Amount text not found');
		itemObj.amountText = await this.prop(elem, 'innerText');

		elem = await this.query(li, '.tritem_date_comm > *');
		if (!elem || await this.prop(elem, 'tagName') != 'SPAN')
			throw new Error('Date element not found');

		itemObj.dateFmt = await this.prop(elem, 'innerText');

		elem = await this.query(li, '.tritem_comm');
		itemObj.comment = elem ? await this.prop(elem, 'innerText') : '';

		itemObj.click = function()
		{
			return self.click(this.elem);
		};

		res.push(itemObj);
	}

	return res;
};


TestPage.prototype.parseDropDown = async function(elem)
{
	if (!elem)
		return null;

	var self = this;
	var res = { elem : elem };
	if (!res.elem || (!await this.hasClass(res.elem, 'dd_container') && !await this.hasClass(res.elem, 'dd_attached')))
		throw new Error('Wrong drop down element');

	res.isAttached = await this.hasClass(res.elem, 'dd_attached');
	if (res.isAttached)
		res.selectBtn = await this.query(res.elem, ':scope > *');
	else
		res.selectBtn = await this.query(res.elem, 'button.selectBtn');
	if (!res.selectBtn)
		throw new Error('Select button not found');

	if (!res.isAttached)
	{
		res.statSel = await this.query(res.elem, '.dd_input_cont span.statsel');
		if (!res.statSel)
			throw new Error('Static select element not found');
		res.input = await this.query(res.elem, '.dd_input_cont input');
		if (!res.input)
			throw new Error('Input element not found');

		res.editable = await this.isVisible(res.input);
		res.textValue = await ((res.editable) ? this.prop(res.input, 'value') : this.prop(res.statSel, 'innerText'));
	}

	res.selectElem = await this.query(res.elem, 'select');

	res.listContainer = await this.query(res.elem, '.ddlist');
	res.isMobile = await this.hasClass(res.listContainer, 'ddmobile');
	if (res.isMobile)
	{
			res.items = [];

			let options = await this.prop(res.selectElem, 'options');
			for(let option of options)
			{
				if (await this.prop(option, 'disabled'))
					continue;

				var itemObj = { id : this.parseId(await this.prop(option, 'value')), text : await this.prop(option, 'innerText'), elem : option };

				res.items.push(itemObj);
			}
	}
	else
	{

		if (res.listContainer)
		{
			var listItems = await this.queryAll(res.elem, '.ddlist li > div');
			res.items = [];
			for(var i = 0; i < listItems.length; i++)
			{
				var li = listItems[i];
				var itemObj = { id : this.parseId(await this.prop(li, 'id')), text : await this.prop(li, 'innerText'), elem : li };

				res.items.push(itemObj);
			}
		}
	}

	res.selectByValue = async function(val)
	{
		if (this.isMobile)
		{
			var option = idSearch(this.items, val);
			if (!option)
				throw new Error('Option item not found');

			await self.selectByValue(res.selectElem, option.elem.value);
			return self.onChange(res.selectElem);
		}
		else
		{
			await self.click(this.selectBtn);
			var li = idSearch(this.items, val);
			if (!li)
				throw new Error('List item not found');
			return self.click(li.elem);
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


TestPage.prototype.parseTransactionTypeMenu = async function(elem)
{
	var self = this;
	var res = { elem : elem, items : [], activeType : null };

	var menuItems = await this.queryAll(elem, 'span');
	for(var i = 0; i < menuItems.length; i++)
	{
		let menuItem = await this.query(menuItems[i], ':scope > *');
		if (!menuItem)
			throw new Error('Wrong structure of menu item');
		let tagName = await this.prop(menuItem, 'tagName');
		let itemTitle = await this.prop(menuItem, 'innerText');

		var menuItemObj = { elem : menuItem, text : itemTitle, type : this.getTransactionType(itemTitle) };

		if (tagName == 'B')
		{
			res.activeType = menuItemObj.type;
			menuItemObj.isActive = true;
		}
		else if (tagName == 'A')
		{
			menuItemObj.link = await this.prop(menuItem, 'href');
			menuItemObj.isActive = false;
		}

		menuItemObj.click = function()
		{
			if (!this.isActive)
				return self.click(this.elem);
		};

		res.items[menuItemObj.type] = menuItemObj;
	}

	return res;
};



TestPage.prototype.parseIconLink = async function(elem)
{
	if (!elem)
		return null;

	var self = this;
	var res = { elem : elem };

	if (!await this.hasClass(elem, 'iconlink'))
		throw new Error('Wrong icon link');

	res.linkElem = await this.query(elem, ':scope > *');
	if (!res.linkElem)
		throw new Error('Link element not found');

	res.titleElem = await this.query(res.linkElem, '.icontitle');
	let titleInner = await this.query(res.titleElem, ':scope > *');
	if (!titleInner)
		throw new Error('Title element not found');
	res.title = await this.prop(titleInner, 'innerText');

// Subtitle is optional
	res.subTitleElem = await this.query(res.titleElem, '.subtitle');
	if (res.subTitleElem)
	{
		res.subtitle = await this.prop(res.subTitleElem, 'innerText');
	}

	res.click = function()
	{
		return self.click(this.linkElem);
	};

	return res;
};


TestPage.prototype.parseInputRow = async function(elem)
{
	if (!elem)
		return null;

	var self = this;
	var res = { elem : elem };

	res.labelEl = await this.query(elem, 'label');
	if (!res.labelEl)
		throw new Error('Label element not found');
	res.label = await this.prop(res.labelEl, 'innerText');

	res.currElem = await this.query(elem, '.btn.rcurr_btn') || await this.query(elem, '.exchrate_comm');
	res.isCurrActive = false;
	if (res.currElem)
	{
		res.isCurrActive = !await this.hasClass(res.currElem, 'inact_rbtn') && !await this.hasClass(res.currElem, 'exchrate_comm');
		if (res.isCurrActive)
		{
			res.currDropDown = await this.parseDropDown(await this.query(res.currElem, ':scope > *'));
			if (!res.currDropDown.isAttached)
				throw new Error('Currency drop down is not attached');
			res.currSign = await this.prop(res.currDropDown.selectBtn, 'innerText');
		}
		else if (await this.hasClass(res.currElem, 'exchrate_comm'))
		{
			res.currSign = await this.prop(res.currElem, 'innerText');
		}
		else
		{
			res.currSign = await this.prop(await this.query(res.currElem, ':scope > *'), 'innerText');
		}
	}
	else
	{
		res.datePickerBtn = await this.query(elem, '.btn.cal_btn');
	}

	let t = await this.query(elem, 'input[type="hidden"]');
	if (t)
	{
		res.hiddenValue = await this.prop(t, 'value');
	}

	res.valueInput = await this.query(elem, '.stretch_input > input');
	res.value = await this.prop(res.valueInput, 'value');

	res.input = async function(val)
	{
		return self.input(this.valueInput, val);
	};

	res.selectCurr = async function(val)
	{
		if (this.isCurrActive && this.currDropDown)
			return this.currDropDown.selectByValue(val);
	};

	return res;
};


TestPage.prototype.parseDatePickerRow = async function(elem)
{
	if (!elem)
		return null;

	var self = this;
	var res = { elem : elem };

	var iconLinkElem = await this.query(elem, '.iconlink');

	res.iconLink = await this.parseIconLink(iconLinkElem);
	res.inputRow = await this.parseInputRow(await this.query(elem, '.iconlink + *'));
	if (!res.inputRow)
		throw new Error('Input row of date picker not found');
	res.date = res.inputRow.value;

	res.input = async function(val)
	{
		if (self.isVisible(this.iconLink))
		{
			await this.iconLink.click();
			await self.click(this.datePickerBtn);
		}

		return this.inputRow.input(val);
	};

	return res;
};


TestPage.prototype.parseWarningPopup = async function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	res.titleElem = await this.query(elem, '.popup_title');
	res.title = await this.prop(res.titleElem, 'innerText');
	res.messageElem = await this.query(elem, '.popup_message > div');
	res.message = await this.prop(res.messageElem, 'innerText');
	res.okBtn = await this.query(elem, '.popup_controls > .btn.ok_btn');
	res.cancelBtn = await this.query(elem, '.popup_controls > .btn.cancel_btn');

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


TestPage.prototype.parse = async function()
{
	this.location = await this.url();

	this.header = await this.parseHeader();
	this.msgPopup = await this.parseMessage();
	this.content = await this.parseContent();
	this.model = await this.buildModel(this.content);

	return this;
};


TestPage.prototype.performAction = async function(action)
{
	if (!isFunction(action))
		throw new Error('Wrong action specified');

	if (!this.content && !this.header)
		await this.parse();

	await action.call(this);

	return this.parse();
};


// Compare visibiliy of specified controls with expected mask
// In the controls object each value must be an object with 'elem' property containing pointer to DOM element
// In the expected object each value must be a boolean value
// For false expected control may be null or invisible
// Both controls and expected object may contain nested objects
// Example:
//     controls : { control_1 : { elem : Element }, control_2 : { childControl : { elem : Element } } }
//     expected : { control_1 : true, control_2 : { childControl : true, invControl : false }, control_3 : false }
TestPage.prototype.checkVisibility = async function(controls, expected)
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
			res = await this.checkVisibility(control, expVisible);
		}
		else
		{
			factVisible = !!(control && await this.isVisible(control.elem, true));
			res = (expVisible == factVisible);
		}

		if (!res)
			throw new Error('Not expected visibility(' + factVisible + ') of "' + countrolName + '" control');
	}

	return true;
};


TestPage.prototype.checkObjValue = async function(obj, expectedObj)
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
			var res = await this.checkObjValue(value, expected);
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


TestPage.prototype.checkValues = async function(controls)
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
			res = await this.checkObjValue(control, expected);
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


TestPage.prototype.checkState = async function(stateObj)
{
	return stateObj && await this.checkVisibility(this.content, stateObj.visibility) && await this.checkValues(stateObj.values);
};


// Click on profile menu item and return navigation promise
TestPage.prototype.goToProfilePage = async function()
{
	if (!this.isUserLoggedIn())
		throw new Error('User is not logged in');

	await this.click(this.header.user.menuBtn);		// open user menu

	return this.navigation(() => {
		setTimeout(() => this.click(this.header.user.profileBtn), 500);
	});
};


// Click on logout link from user menu and return navigation promise
TestPage.prototype.logoutUser = async function()
{
	await this.click(this.header.user.menuBtn);

	return this.navigation(() => {
		setTimeout(() => this.click(this.header.user.logoutBtn), 500);
	});
};


TestPage.prototype.goToMainPage = function()
{
	if (!this.isUserLoggedIn())
		throw new Error('User not logged in');

	return this.navigation(() => this.click(this.header.logo.linkElem));
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = TestPage;
