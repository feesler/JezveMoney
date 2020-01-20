// Common test view class
class TestView
{
	constructor(props)
	{
		this.props = props || {};

		this.app = this.props.app;

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


	isUserLoggedIn()
	{
		const loggedOutLocations = ['login', 'register'];

		return loggedOutLocations.every((item) => this.location.indexOf('/' + item) === -1);
	}


	async parseHeader()
	{
		let el;
		let res = {};

		res.elem = await this.query('.page > .page_wrapper > .header');
		if (!res.elem)
			return res;		// no header is ok for login view

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
			let menuLinks = await this.queryAll(res.user.menuEl, 'ul > li > a');
			for(let i = 0; i < menuLinks.length; i++)
			{
				el = menuLinks[i];
				res.user.menuItems.push({ elem : el, link : await this.prop(el, 'href'), text : await this.prop(el, 'innerText') });
			}

			let itemShift = (res.user.menuItems.length > 2) ? 1 : 0;

			res.user.profileBtn = res.user.menuItems[itemShift].elem;
			res.user.logoutBtn = res.user.menuItems[itemShift + 1].elem;
		}

		return res;
	}


	async parseMessage()
	{
		let popupContent = await this.query('.popup_content.msg');
		if (!popupContent)
			return null;

		let res = { contentElem : popupContent };

		res.success = await this.hasClass(res.contentElem, 'msg_success') &&
						!(await this.hasClass(res.contentElem, 'msg_error'));

		res.messageElem = await this.query(res.contentElem, '.popup_message');
		if (!res.messageElem)
			throw new Error('Wrong structure of message popup');

		res.message = await this.prop(res.messageElem, 'innerText');
		res.closeBtn = await this.query(res.contentElem, '.close_btn > button');
		res.close = () => this.click(res.closeBtn);

		if (!res.success)
			console.log('Error popup appear: ' + res.message);

		return res;
	}


	parseId(id)
	{
		if (typeof id !== 'string')
			return id;

		let pos = id.indexOf('_');
		return (pos != -1) ? parseInt(id.substr(pos + 1)) : id;
	}


	async parseTile(tileEl)
	{
		if (!tileEl || !await this.hasClass(tileEl, 'tile'))
			throw new Error('Wrong tile structure');

		let self = this;
		let tileObj = { elem : tileEl, linkElem : await this.query(tileEl, ':scope > *'),
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
	}


	async parseInfoTile(tileEl)
	{
		if (!tileEl || !await this.hasClass(tileEl, 'info_tile'))
			throw new Error('Wrong info tile structure');

		let tileObj = { elem : tileEl,
						titleEl : await this.query(tileEl, '.info_title'),
						subtitleEl : await this.query(tileEl, '.info_subtitle') };

		tileObj.id = this.parseId(await this.prop(tileEl, 'id'));
		tileObj.title = await this.prop(tileObj.titleEl, 'innerText');
		tileObj.subtitle = await this.prop(tileObj.subtitleEl, 'innerText');

		return tileObj;
	}


	async parseTiles(tilesEl, parseCallback)
	{
		if (!tilesEl)
			return null;

		let res = { elem : tilesEl, items : [] };
		let children = await this.queryAll(tilesEl, ':scope > *');
		if (!children || !children.length || (children.length == 1 && await this.prop(children[0], 'tagName') == 'SPAN'))
			return res;

		let callback = parseCallback || this.parseTile;
		for(let i = 0; i < children.length; i++)
		{
			let tileObj = await callback.call(this, children[i]);
			if (!tileObj)
				throw new Error('Fail to parse tile');

			res.items.push(tileObj);
		}

		res.items.sort(function(a, b)
		{
			return (a.id == b.id) ? 0 : ((a.id < b.id) ? -1 : 1);
		});

		return res;
	}


	async parseInfoTiles(tilesEl)
	{
		return this.parseTiles(tilesEl, this.parseInfoTile);
	}


	async parseTransactionsList(listEl)
	{
		if (!listEl)
			return null;

		let self = this;
		let res = { elem : listEl, items : [] };

		let children = await this.queryAll(listEl, ':scope > *');
		if (!children || !children.length || (children.length == 1 && await this.prop(children[0], 'tagName') == 'SPAN'))
			return res;

		res.details = (await this.prop(listEl, 'tagName') == 'TABLE');
		let listItems = await this.queryAll(listEl, (res.details) ? 'tr' : '.trlist_item_wrap > div');

		for(let i = 0; i < listItems.length; i++)
		{
			let li = listItems[i];
			let itemObj = { id : this.parseId(await this.prop(li, 'id')), elem : li };

			let elem = await this.query(li, '.tritem_acc_name > span');
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

			itemObj.click = async function()
			{
				return self.click(this.elem);
			};

			res.items.push(itemObj);
		}

		return res;
	}


	async parseDropDown(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem };
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

					let itemObj = { id : this.parseId(await this.prop(option, 'value')), text : await this.prop(option, 'innerText'), elem : option };

					res.items.push(itemObj);
				}
		}
		else
		{

			if (res.listContainer)
			{
				let listItems = await this.queryAll(res.elem, '.ddlist li > div');
				res.items = [];
				for(let i = 0; i < listItems.length; i++)
				{
					let li = listItems[i];
					let itemObj = { id : this.parseId(await this.prop(li, 'id')), text : await this.prop(li, 'innerText'), elem : li };

					res.items.push(itemObj);
				}
			}
		}

		res.selectByValue = async function(val)
		{
			if (this.isMobile)
			{
				let option = this.items.find(item => item.id == val);
				if (!option)
					throw new Error('Option item not found');

				await self.selectByValue(res.selectElem, option.elem.value);
				return self.onChange(res.selectElem);
			}
			else
			{
				await self.click(this.selectBtn);
				let li = this.items.find(item => item.id == val);
				if (!li)
					throw new Error('List item not found');
				return self.click(li.elem);
			}
		};

		return res;
	}


	getTransactionType(str)
	{
		let strToType = { 'ALL' : 0, 'EXPENSE' : this.app.EXPENSE, 'INCOME' : this.app.INCOME, 'TRANSFER' : this.app.TRANSFER, 'DEBT' : this.app.DEBT };

		if (!str)
			return null;

		let key = str.toUpperCase();
		return (strToType[key] !== undefined) ? strToType[key] : null;
	}


	getTransactionTypeStr(type)
	{
		let typeToStr = { 1 : 'EXPENSE', 2 : 'INCOME', 3 : 'TRANSFER', 4 : 'DEBT' };

		if (!type)
			return null;

		return (typeToStr[type] !== undefined) ? typeToStr[type] : null;
	}


	async parseTransactionTypeMenu(elem)
	{
		let self = this;
		let res = { elem : elem, items : [], activeType : null };

		let menuItems = await this.queryAll(elem, 'span');
		for(let i = 0; i < menuItems.length; i++)
		{
			let menuItem = await this.query(menuItems[i], ':scope > *');
			if (!menuItem)
				throw new Error('Wrong structure of menu item');
			let tagName = await this.prop(menuItem, 'tagName');
			let itemTitle = await this.prop(menuItem, 'innerText');

			let menuItemObj = { elem : menuItem, text : itemTitle, type : this.getTransactionType(itemTitle) };

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
	}



	async parseIconLink(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem };

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
	}


	async parseInputRow(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem };

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
			return self.input(this.valueInput, val.toString());
		};

		res.selectCurr = async function(val)
		{
			if (this.isCurrActive && this.currDropDown)
				return this.currDropDown.selectByValue(val);
		};

		return res;
	}


	async parseDatePickerFilter(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem };

		res.iconLink = await this.parseIconLink(await this.query(elem, '.iconlink'));
		if (!res.iconLink)
			throw new Error('Iconlink of date picker not found');

		res.inputElem = await this.query(elem, '.stretch_input > input');
		if (!res.inputElem)
			throw new Error('Input element not found');

		res.datePickerBtn = await this.query(elem, '#cal_rbtn');
		if (!res.datePickerBtn)
			throw new Error('Date picker button not found');

		res.dayCells = [];
		let cells = await this.queryAll(elem, '.calTbl td');
		for(let cell of cells)
		{
			if (await this.hasClass(cell, 'omonth'))
				continue;

			let dayCell = { elem : cell, day : await this.prop(cell, 'innerHTML') };

			res.dayCells.push(dayCell);
		}


		res.select = async function(val)
		{
			if (await self.isVisible(this.iconLink.elem))
			{
				await this.iconLink.click();
				await performAction(() => self.click(this.datePickerBtn));
			}

			let cell = self.dateFilter.dayCells.find(item => item.day == val);
			if (cell)
				await performAction(() => self.click(cell));
		};


		res.selectRange = async function(val1, val2)
		{
			await self.performAction(async () =>
			{
				if (await self.isVisible(this.iconLink.elem))
					return this.iconLink.click();
				else
					return self.click(this.datePickerBtn);
			});

			let cell1 = self.content.dateFilter.dayCells.find(item => item.day == val1);
			if (!cell1)
				throw new Error('Cell ' + val1 + ' not found');

			let cell2 = self.content.dateFilter.dayCells.find(item => item.day == val2);
			if (!cell2)
				throw new Error('Cell ' + val2 + ' not found');

			await self.click(cell1.elem);
			return self.click(cell2.elem);
		};


		res.input = async function(val)
		{
			if (self.isVisible(this.iconLink.elem))
			{
				await this.iconLink.click();
				await performAction(() => self.click(this.datePickerBtn));
			}

			return self.input(this.inputElem, val);
		};

		return res;
	}


	async parseDatePickerRow(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem };

		res.iconLink = await this.parseIconLink(await this.query(elem, '.iconlink'));
		if (!res.iconLink)
			throw new Error('Iconlink of date picker not found');

		res.inputRow = await this.parseInputRow(await this.query(elem, '.iconlink + *'));
		if (!res.inputRow || !res.inputRow.datePickerBtn)
			throw new Error('Unexpected structure of date picker input row');
		res.date = res.inputRow.value;

		res.input = async function(val)
		{
			if (self.isVisible(this.iconLink.elem))
			{
				await this.iconLink.click();
				await self.click(this.inputRow.datePickerBtn);
			}

			return this.inputRow.input(val);
		};

		return res;
	}


	async parseWarningPopup(elem)
	{
		if (!elem)
			return null;

		let res = { elem : elem };

		res.titleElem = await this.query(elem, '.popup_title');
		res.title = await this.prop(res.titleElem, 'innerText');
		res.messageElem = await this.query(elem, '.popup_message > div');
		res.message = await this.prop(res.messageElem, 'innerText');
		res.okBtn = await this.query(elem, '.popup_controls > .btn.ok_btn');
		res.cancelBtn = await this.query(elem, '.popup_controls > .btn.cancel_btn');

		return res;
	}


	async parseContent()
	{
		return {};
	}


	async buildModel()
	{
		return {};
	}


	async parse()
	{
		this.location = await this.url();

		this.header = await this.parseHeader();
		this.msgPopup = await this.parseMessage();
		this.content = await this.parseContent();
		this.model = await this.buildModel(this.content);
	}


	async performAction(action)
	{
		if (!this.app.isFunction(action))
			throw new Error('Wrong action specified');

		if (!this.content && !this.header)
			await this.parse();

		await action.call(this);

		await this.parse();
	}


	// Compare visibiliy of specified controls with expected mask
	// In the controls object each value must be an object with 'elem' property containing pointer to DOM element
	// In the expected object each value must be a boolean value
	// For false expected control may be null or invisible
	// Both controls and expected object may contain nested objects
	// Example:
	//     controls : { control_1 : { elem : Element }, control_2 : { childControl : { elem : Element } } }
	//     expected : { control_1 : true, control_2 : { childControl : true, invControl : false }, control_3 : false }
	async checkVisibility(controls, expected)
	{
		let control, expVisible, factVisible, res;

		if (!controls)
			throw new Error('Wrong parameters');

		// Undefined expected value is equivalent to empty object
		if (typeof expected === 'undefined')
			return true;

		for(let countrolName in expected)
		{
			expVisible = expected[countrolName];
			control = controls[countrolName];

			if (this.app.isObject(expVisible))
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
	}


	checkValues(controls)
	{
		let res = true;
		let control, expected, fact;

		for(let countrolName in controls)
		{
			expected = controls[countrolName];
			control = this.content[countrolName];
			if (!control)
				throw new Error('Control (' + countrolName + ') not found');

			if (this.app.isObject(expected) || Array.isArray(expected))
			{
				res = this.app.checkObjValue(control, expected, true);
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
	}


	async checkState(stateObj)
	{
		return stateObj && await this.checkVisibility(this.content, stateObj.visibility) && this.checkValues(stateObj.values);
	}


	// Click on profile menu item and return navigation promise
	async goToProfile()
	{
		if (!this.isUserLoggedIn())
			throw new Error('User is not logged in');

		await this.click(this.header.user.menuBtn);		// open user menu

		await this.navigation(() => this.click(this.header.user.profileBtn));
	}


	// Click on logout link from user menu and return navigation promise
	async logoutUser()
	{
		await this.click(this.header.user.menuBtn);

		await this.navigation(() => this.click(this.header.user.logoutBtn));
	}


	async goToMainView()
	{
		if (!this.isUserLoggedIn())
			throw new Error('User not logged in');

		await this.navigation(() => this.click(this.header.logo.linkElem));
	}

}


export { TestView };
