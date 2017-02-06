/*
Drop Down List object

Members:
	hostObj					- input element hosting drop down list
	statObj					- static DDList text element
	list						- outer block DOM element
	ulobj						- unordered list DOM element
	visible					- list visibility status
	selcb					- item select callback
	inpcb					- input field oninput event callback value
	filtered					- filtered flag
	filteredCount				- count of currently filtered items
	itemCount				- count of items in list
	editable					- input field editable flag, true by default
	selMsg					- select message text
	smShown				- select message shown flag
	actItem					- current active item in list
	blockScroll				- block duplicate onscroll event flag
	skipKeyPress				- skip first keypress event after keydown flag
	maxHeight				- maximum height (count of items) of drop down list
	itemHeight				- heigth in pixels of signel list element


Methods:
	create(input_id, selCB)		- create elements for drop down list
	init()						- slider initialization
	show(val)					- show/hide list
	dropDown()				- drop down list with all items
	select(sel_id)				- select specified item by id
	onSelItem(obj)				- select item callback
	onInput()					- oninput event handler for simple search
	filter(fstr)					- filter list items by specified string
	addList(items)				- add list of items
	addItem(id, str)			- add one item to list
	isFiltered()				- check list is filtered

*/

var DDList_instances = 0;

// Drop Down List constructor
function DDList()
{
	DDList_instances++;

	this.container = null;
	this.hostObj = null;
	this.inpCont = null;
	this.statObj = null;
	this.list = null;
	this.ulobj = null;
	this.selobj = null;
	this.selbtn = null;
	this.selcb = null;
	this.inpcb = null;
	this.changecb = null;
	this.changed = false;
	this.visible = false;
	this.filtered = false;
	this.filteredCount = 0;
	this.manFilter = false;
	this.itemCount = 0;
	this.editable = true;
	this.disabled = false;
	this.selMsg = null;
	this.smShown = false;
	this.actItem = null;
	this.blockScroll = false;
	this.skipKeyPress = false;
	this.maxHeight = 4;
	this.itemHeight = 37;
	this.multi = false;
	this.listAttach = false;
	this.isMobile = false;
	this.itemPrefix = null;
	this.selection = null;
	this.forceSelect = false;
	this.defSeparator = null;

	this.createParams = null;


	this.showSelMsg = function(val)
	{
		if (!this.selMsg || this.selMsg == '' || this.smShown == val)
			return;

		if (this.editable)
		{
			if (val)
				addClass(this.hostObj, 'inactive');
			else
				removeClass(this.hostObj, 'inactive');

			this.hostObj.value = ((val) ? this.selMsg : '');
		}
		else
		{
			if (!this.disabled)
			{
				if (val)
					addClass(this.statObj, 'inactive');
				else
					removeClass(this.statObj, 'inactive');
			}

			this.statObj.innerHTML = ((val) ? this.selMsg : '');
		}

		this.smShown = val;
	}


	this.create = function(params)
	{
		var inpObj = null, selObj = null, selectMode = false;

		if (!params)
			return false;

		this.createParams = params;

		if (!params.input_id || !params.selCB)
			return false;

		this.multi = params.multi || false;
		this.forceSelect = params.forceSelect || false;
		this.listAttach = params.listAttach || false;
		this.itemPrefix = 'ddlist' + DDList_instances + '_';
		this.editable = (params.editable !== undefined) ? params.editable : true;
		this.disabled = (params.disabled !== undefined) ? params.disabled : false;
		this.isMobile = (params.mobile !== undefined) ? params.mobile : false;
		this.defSeparator = params.defSeparator || ',';
		this.selcb = params.selCB || null;
		this.changecb = params.changecb || null;
		if (params.maxHeight !== undefined && params.maxHeight > 0)
			this.maxHeight = params.maxHeight;
		this.inpcb = params.inpCB || null;
		this.selMsg = params.selmsg || null;

		if (this.disabled)
			this.editable = false;

		inpObj = ge(params.input_id);
		if (!inpObj || !inpObj.parentNode)
			return false;

		if (!this.listAttach)
		{
			if (inpObj.tagName == 'SELECT')
			{
				selectMode = true;
				selObj = inpObj;
				inpObj = null;
				if (selObj.multiple)
					this.multi = true;

				if (selObj.disabled)
				{
					this.disabled = true;
					this.editable = false;
				}
			}

			// Create container
			this.inpCont = ce('div');
			this.container = ce('div', { className : 'dd_container' },
						[ ce('div', { className : 'dd_input_cont' },
							[ this.inpCont ]) ]);
			if (!this.container)
				return false;
			if (params.extClass)
				addClass(this.container, params.extClass);

			if (this.disabled)
				addClass(this.container, 'dd_disabled');

			if (selectMode)
			{
				insertAfter(this.container, selObj);
				selObj = re(selObj);
				inpObj = ce('input', { type : 'text' });
				if (!inpObj)
					return false;
				this.inpCont.appendChild(inpObj);
			}
			else
			{
				insertAfter(this.container, inpObj);
				inpObj = re(inpObj);
				if (!inpObj)
					return false;
				this.inpCont.appendChild(inpObj);
			}

			// create static element
			this.statObj = ce('span', { className : 'statsel',
								style : { minWidth : px(inpObj.offsetWidth) } });
			show(this.statObj, !this.editable);

			insertBefore(this.statObj, inpObj);

			if (this.editable)
				inpObj.className = 'ddinp';
			else
				show(inpObj, false);
		}
		else
		{
			this.container = ce('div', { className : 'dd_attached' });
			if (!this.container)
				return false;
			if (params.extClass)
				addClass(this.container, params.extClass);

			insertAfter(this.container, inpObj);
			this.container.style.width = px(inpObj.offsetWidth);
			this.container.style.height = px(inpObj.offsetHeight);

			inpObj = re(inpObj);
			if (!inpObj)
				return false;
			this.container.appendChild(inpObj);

			inpObj.onclick = this.dropDown.bind(this);
		}

		// create elements of list
		if (this.isMobile)
		{
			if (selectMode)
				this.ulobj = selObj;
			else
				this.ulobj = ce('select');
			if (this.multi)
			{
				this.ulobj.multiple = true;
				if (this.forceSelect)
				{
					this.ulobj.size = 10;
					show(this.ulobj, false);
				}
			}

			this.ulobj.onchange = this.onChange.bind(this);
		}
		else
		{
			if (selectMode)
			{
				show(selObj, false);
				this.container.appendChild(selObj);
			}
			this.ulobj = ce('ul');
		}
		if (!this.ulobj)
			return false;

		this.list = ce('div', { className : 'ddlist',
						onkeydown : this.onKey.bind(this),
						onscroll : this.onScroll.bind(this) },
					[this.ulobj]);
		if (!this.list)
			return false;
		if (this.isMobile)
			addClass(this.list, 'ddmobile');
		else
			setParam(this.list, { style : { display : 'none', height :  '10px' } });
		if (this.multi && this.forceSelect)
		{
			addClass(this.list, 'forced');
			show(this.list, false);
		}
		this.container.appendChild(this.list);

		// create elements of drop down button
		if (!this.listAttach)
		{
			this.selbtn = ce('button', { type : 'button', className : 'selectBtn' }, [ ce('div', { className : 'dditem_idle' } ) ]);
			if (!this.selbtn)
				return false;

			if (this.disabled)
				this.selbtn.disabled = true;

			if (!this.isMobile || (this.isMobile && this.multi && this.forceSelect))
				this.selbtn.onclick = this.dropDown.bind(this);

			if (!insertBefore(this.selbtn, firstElementChild(this.container)))
				return false;
		}
		else
		{
			if (this.isMobile)
			{
				this.list.style.top = 0;

				this.list.style.height = px(this.container.offsetHeight);
				this.list.style.width = px(this.container.offsetWidth);
			}
			else
			{
				this.list.style.top = px(this.container.offsetHeight);
			}
		}

		this.hostObj = inpObj;
		this.selobj = selObj;

		if (this.disabled)
			this.selobj.disabled = true;

		if (this.inpcb)
			this.hostObj.oninput = this.onInput.bind(this);

		if (this.selMsg)
		{
			if (this.editable)
			{
				this.hostObj.onfocus = this.onFocus.bind(this);
				this.hostObj.onblur = this.onBlur.bind(this);

				if (this.hostObj.value == '')
				{
					addClass(this.hostObj, 'inactive');
					this.hostObj.value = this.selMsg;
				}
			}
			else
			{
				if (!this.disabled)
					addClass(this.statObj, 'inactive');
				this.statObj.innerHTML = this.selMsg;
			}

			this.smShown = true;
		}

		if (!this.editable)
		{
			if (!this.disabled)
				this.inpCont.onclick = this.dropDown.bind(this);
		}
		else
		{
			this.hostObj.onkeydown = this.onKey.bind(this);
			this.hostObj.onkeypress = this.onKey.bind(this);
			this.hostObj.autocomplete = "off";
		}

		this.selection = new Selection();

		if (selectMode)
			this.parseSelect(this.selobj);

		return true;
	}


	this.init = function()
	{
		var ulobj, chnodes, i, st;

		if (!this.list || !this.ulobj)
			return false;

		chnodes = this.ulobj.childNodes;
		for(i = 0; i < chnodes.length; i++)
		{
			if (chnodes[i].nodeType == 1) 	// ELEMENT_NODE
			{
				chnodes[i].onclick = this.onSelItem.bind(this, chnodes[i]);
			}
		}

		return true;
	}


	this.show = function(val)
	{
		var resObj = {};

		if (!this.list)
			return;

		if (this.isMobile)
		{
			if (this.multi && this.forceSelect)
			{
				show(this.list, val);
				show(this.ulobj, val);

				if (val)
				{
					this.ulobj.focus();
					setEmptyClick(this.show.bind(this, false), [this.hostObj, this.inpCont, this.statObj, this.list, this.selbtn]);
				}
				else
					setEmptyClick();
			}
			return;
		}

		this.visible = val;
		if (val)
		{
			this.list.style.height = px(Math.min(this.maxHeight, (this.filtered ? this.filteredCount : this.itemCount)) * this.itemHeight);

			setEmptyClick(this.show.bind(this, false), [this.hostObj, this.inpCont, this.statObj, this.list, this.selbtn]);
		}
		else
		{
			setEmptyClick();

			if (this.changecb && this.changed)
			{
				this.changecb.call(this, this.selection.selected);
			}
			this.changed = false;
		}

		if (this.selbtn && firstElementChild(this.selbtn))
			firstElementChild(this.selbtn).className = ((val) ? 'dditem_act' : 'dditem_idle');

		show(this.list, val);

		if (!val)
			this.setActive(null);
		else
			this.list.scrollTop = 0;
	}


	this.makeEditable = function(val)
	{
		val = (val !== undefined) ? val : true;
		if ((val && this.disabled) || val == this.editable)
			return;

		this.editable = val;

		show(this.statObj, !this.editable);
		show(this.hostObj, this.editable);

		if (this.editable)
		{
			addClass(this.hostObj, 'ddinp');
			this.hostObj.value = this.statObj.innerHTML;
			this.hostObj.onkeydown = this.onKey.bind(this);
			this.hostObj.onkeypress = this.onKey.bind(this);
			this.hostObj.autocomplete = 'off';
		}
		else
		{
			removeClass(this.hostObj, 'ddinp');
			this.statObj.innerHTML = this.hostObj.value;
			if (!this.disabled)
				this.inpCont.onclick = this.dropDown.bind(this);
		}
	}


	this.enable = function(val)
	{
		val = (val !== undefined) ? val : true;
		if (val != this.disabled)
			return;

		this.disabled = !val;

		if (this.disabled)
		{
			addClass(this.container, 'dd_disabled');
			this.makeEditable(false);
		}
		else
		{
			removeClass(this.container, 'dd_disabled');
			if (this.createParams.editable !== false)
				this.makeEditable();
		}


		this.selobj.disabled = this.disabled;
		this.selbtn.disabled = this.disabled;
	}


	this.dropDown = function()
	{
		var liobj, i;

		if (!this.list || !this.ulobj)
			return;

		if (!this.visible && this.filtered && !this.manFilter)
		{
			chnodes = this.ulobj.childNodes;
			for(i = 0; i < chnodes.length; i++)
			{
				if (chnodes[i].nodeType == 1) 	// ELEMENT_NODE
				{
					chnodes[i].style.display = '';
				}
			}

			this.filtered = false;
		}

		this.show(!this.visible);
	}


	// Cut item prefix if enabled and return original value
	this.prepareId = function(id)
	{
		var idval;

		idval = id.toString();
		if (this.itemPrefix)
			idval = idval.substr(this.itemPrefix.length);

		return idval;
	}


	this.updateItemPrefix = function(newPrefix)
	{
		var listItem, elem, newidval;

		newPrefix = newPrefix || null;
		newidval = (newPrefix) ? newPrefix : '';

		listItem = firstElementChild(this.ulobj);
		while(listItem)
		{
			if (this.isMobile)
			{
				elem = listItem;
				elem.value = newidval + this.prepareId(elem.value);
			}
			else
			{
				elem = firstElementChild(listItem);
				if (elem)
					elem.id = newidval + this.prepareId(elem.id);
			}

			listItem = nextElementSibling(listItem);
		}

		this.itemPrefix = newPrefix;
	}


	this.getOptionData = function(option)
	{
		var resObj = {};

		if (!option || !option.selected)
			return null;

		resObj.id = this.prepareId(option.value);
		resObj.str = option.innerHTML;

		return resObj;
	}


	// Mobile onchange event handler
	this.onChange = function()
	{
		var option, resObj;

		if (!this.ulobj || !this.ulobj.options || this.ulobj.selectedIndex == -1)
			return;
		if (!this.selcb)
			return;

		this.selection.clear();
		if (this.multi && this.ulobj.multiple)
		{
			for(var i = 0; i < this.ulobj.options.length; i++)
			{
				resObj = this.getOptionData(this.ulobj.options[i]);
				if (resObj)
				{
					this.selection.select(resObj.id, resObj.str);
				}
			}
			this.selcb.call(this, this.selection.selected);
		}
		else
		{
			resObj = this.getOptionData(this.ulobj.options[this.ulobj.selectedIndex]);
			if (resObj)
			{
				this.selection.select(resObj.id, resObj.str);
				this.selcb.call(this, resObj);
			}
		}

		this.changed = true;

		if (this.changecb)
		{
			this.changecb.call(this, this.selection.selected);
		}
	}


	this.select = function(sel_id)
	{
		var chnodes, idval;

		if (!this.ulobj)
			return;

		idval = ((this.itemPrefix) ? this.itemPrefix : '') + sel_id;
		chnodes = this.ulobj.childNodes;
		for(i = 0; i < chnodes.length; i++)
		{
			if (chnodes[i].nodeType == 1)		// ELEMENT_NODE
			{
				if (firstElementChild(chnodes[i]).id == idval)
				{
					this.onSelItem(chnodes[i]);
					break;
				}
			}
		}
	}


	this.onSelItem = function(obj)
	{
		var fe
		var resObj = {};

		if (!this.selcb || !obj)
			return;

		fe = firstElementChild(obj);
		if (fe)
		{
			resObj.id = this.prepareId(fe.id);
			if (this.multi)
				resObj.str = nextElementSibling(firstElementChild(firstElementChild(fe))).innerHTML;
			else
				resObj.str = fe.innerHTML;

			if (this.multi)
			{
				if (this.selection.isSelected(resObj.id))
					this.selection.deselect(resObj.id);
				else
					this.selection.select(resObj.id, resObj.str);

				if (this.selobj)
					selectByValue(this.selobj, resObj.id, this.selection.isSelected(resObj.id));

				this.check(resObj.id, this.selection.isSelected(resObj.id));

				this.selcb.call(this, this.selection.selected);
			}
			else
			{
				this.selection.clear();
				this.selection.select(resObj.id, resObj.str);

				if (this.selobj)
					selectByValue(this.selobj, resObj.id);

				this.selcb.call(this, resObj);
			}
		}

		this.changed = true;

		if (!this.multi)
			this.show(false);
	}


	this.deselect = function()
	{
		if (this.multi)
		{
			var selArr = this.selection.getIdArray();

			selArr.forEach(function(id)
			{
				this.selection.deselect(id);
				selectByValue(this.selobj, id, false);
				this.check(id, false);
			}, this);
		}
		else
		{
			selectByValue(this.selobj, 0);
		}

		this.setText('');
	}


	this.onCheck = function(obj)
	{
		var resObj = {};

		if (!this.multi || !this.selcb || !obj || !obj.parentNode)
			return;

		resObj.id = this.prepareId(obj.parentNode.parentNode.id);
		resObj.str = nextElementSibling(obj).innerHTML;

		if (this.selection.isSelected(resObj.id))
			this.selection.deselect(resObj.id);
		else
			this.selection.select(resObj.id, resObj.str);

		selectByValue(this.selobj, resObj.id, this.selection.isSelected(resObj.id));

		this.changed = true;

		this.selcb.call(this, this.selection.selected);
	}


	this.onScroll = function()
	{
		if (!this.blockScroll)
			this.setActive(null);

		this.blockScroll = false;
	}


	this.getSibling = function(obj, next)
	{
		if (!obj)
			return null;

		return (next !== false) ? nextElementSibling(obj) : previousElementSibling(obj);
	}


	this.onKey = function(e)
	{
		var keyCode, newItem = null, curItem = null;

		e = e || event;

		// fix double keydown-keypress event
		if (e.type == 'keydown')
		{
			this.skipKeyPress = true;
		}
		else if (e.type == 'keypress' && this.skipKeyPress)
		{
			this.skipKeyPress = false;
			return true;
		}

		if (e.keyCode)		// IE
			keyCode = e.keyCode;
		else if (e.which)	// Netscape/Firefox/Opera
			keyCode = e.which;
		else
			return false;

		if (keyCode == 40)		// down arrow
		{
			if (!this.visible && this.actItem == null)
			{
				this.show(true);
				newItem = firstElementChild(this.ulobj);
			}
			else if (this.visible)
			{
				if (this.actItem != null)
					newItem = this.getSibling(ge(this.actItem).parentNode);
				else
					newItem = firstElementChild(this.ulobj);
			}
		}
		else if (keyCode == 38)				// up arrow
		{
			if (this.visible && this.actItem != null)
			{
				newItem = this.getSibling(ge(this.actItem).parentNode, false);
			}
		}
		else if (keyCode == 13)				// enter
		{
			var item = ge(this.actItem);

			if (item && item.parentNode)
				this.onSelItem(item.parentNode);
			e.preventDefault ? e.preventDefault() : (e.returnValue = false);
		}
		else
			return true;

		// search for first visible element after selected
		if (newItem != null && this.filtered)
		{
			while(newItem != null && newItem.style.display == 'none')
			{
				newItem = this.getSibling(newItem, (keyCode == 40));
			}
		}

		if (newItem != null)
		{
			this.setActive(firstElementChild(newItem));
			e.preventDefault ? e.preventDefault() : (e.returnValue = false);
		}

		return true;
	}


	this.onInput = function()
	{
		var found;

		if (!this.hostObj)
			return false;

		if (this.inpcb === true)
		{
			found = this.filter(this.hostObj.value);
			this.show(found);

			return true;
		}
		else if (this.inpcb)
		{
			this.inpcb.call(this);
		}
	}


	this.onFocus = function()
	{
		this.showSelMsg(false);
	}


	this.onBlur = function()
	{
 		if (!this.hostObj || !this.editable)
 			return;
 		if (!this.selMsg || this.selMsg == '')
			return;

		if (this.hostObj.value == '' && this.editable)
			this.showSelMsg(true);
	}


	this.filter = function(fstr)
	{
		var ival, match, found = false;
		var list_item;

		if (!fstr)
			return false;

		this.filteredCount = 0;

		list_item = firstElementChild(this.ulobj);
		while(list_item)
		{
			ival = firstElementChild(list_item).innerHTML.toLowerCase();
			match = (ival.indexOf(fstr.toLowerCase(), 0) != -1);
			if (match)
				this.filteredCount++;

			show(list_item, match);
			found = (found || match);

			if (found)
				this.filtered = true;

			list_item = nextElementSibling(list_item);
		}

		return found;
	}


	this.check = function(item_id, checkval)
	{
		var idval, item, checkbox;

		if (!item_id || !this.multi)
			return false;

		idval = ((this.itemPrefix) ? this.itemPrefix : '') + item_id;

		item = ge(idval);
		if (!item || !firstElementChild(item))
			return false;

		checkbox = firstElementChild(firstElementChild(item));
		if (!checkbox)
			return false;

		checkbox.checked = checkval;

		return true;
	}


	this.fixIOS = function(selectObj)
	{
		var fe;

		if (!this.isMobile || !this.multi)
			return;

		fe = firstElementChild(selectObj);

		if (!fe || !(fe.tagName == 'OPTGROUP' && fe.hidden && fe.disabled))
		{
			var og = ce('optgroup', { hidden : true, disabled : true });
			prependChild(selectObj, og);
		}
	}


	this.parseSelect = function(obj)
	{
		var i, option, resText = [];
		var val, text;

		if (!obj || obj.tagName === undefined || obj.tagName != 'SELECT' || obj.options === undefined)
			return false;

		if (this.isMobile)
		{
			this.fixIOS(obj);
		}

		for(i = 0, l = obj.options.length; i < l; i++)
		{
			option = obj.options[i];
			val = option.value;
			text = (option.textContent) ? option.textContent : option.innerText;

			if (!this.isMobile)
				this.addItem(val, text);

			if (this.isMobile)
			{
				option.value = ((this.itemPrefix) ? this.itemPrefix : '') + val;
			}

			if (option.selected)
			{
				if (this.multi)
				{
					this.check(val, true);
				}

				this.selection.select(val, option.innerHTML);
				resText.push(text);
			}
		}

		this.setText(resText.join(this.defSeparator + ' '));

		return true;
	}


	this.addList = function(items)
	{
		if (!items || typeof(items) != 'object' || !this.list || !this.ulobj)
			return false;

		for(var key in items)
		{
			this.addItem(key, items[key]);
		}

		return true;
	}


	this.addItem = function(item_id, str)
	{
		var liobj, divobj, idval;
		var _this = this;

		if (!item_id || !this.list || !this.ulobj)
			return false;

		idval = ((this.itemPrefix) ? this.itemPrefix : '') + item_id;

		if (this.isMobile)
		{
			this.fixIOS(this.ulobj);

			liobj = ce('option', { value : idval, innerHTML : str });

			if (!this.selobj && !this.multi && isEmpty(this.selection.selected) && !this.itemCount)
			{
				this.ulobj.appendChild(ce('option', { disabled : true, value : this.itemPrefix + 0, selected : true }));
			}
		}
		else
		{
			if (this.multi)
			{
				var lblel, chkel;

				divobj = ce('div', { id : idval, className : 'dditem_idle' });
				if (!divobj)
					return false;

				lblel = ce('label');

				chkel = ce('input', { type : 'checkbox' });
				if ('onpropertychange' in chkel)
				{
					chkel.onpropertychange = function()
					{
						if (event.propertyName == 'checked')
							_this.onCheck(this);
					}
				}
				else
				{
					chkel.onchange = this.onCheck.bind(this, chkel);
				}

				lblel.appendChild(chkel);
				lblel.appendChild(ce('span', { innerHTML : str, title : str }));

				divobj.appendChild(lblel);
			}
			else
			{
				divobj = ce('div', { id : idval, className : 'dditem_idle', innerHTML : str, title : str });
				if (!divobj)
					return false;
			}

			divobj.onmouseover = this.setActive.bind(this, divobj);

			liobj = ce('li', {}, [divobj]);
			liobj.onclick = function(e)
			{
				e = fixEvent(e);
				if (e.target.tagName == 'DIV')
					_this.onSelItem(this);
			};
		}
		if (!liobj)
			return false;

		this.ulobj.appendChild(liobj);

		this.itemCount++;

		return true;
	}


	this.setActive = function(obj)
	{
		var oldAct;
		var scrollTo, itemTop = 0;
		var curListTop, curListHeight, curListBottom;
		var curLi;

		// flush current active item
		if (this.actItem != null)
		{
			oldAct = ge(this.actItem);
			if (oldAct)
				oldAct.className = 'dditem_idle';
		}

		this.actItem = null;

		if (this.blockScroll)
			return;

		if (!obj)
			return;

		obj.className = 'dditem_act';
		this.actItem = obj.id;

		// scroll list to show new active item if needed
		curLi = firstElementChild(this.ulobj);
		while(curLi && curLi != obj.parentNode)
		{
			if (curLi != obj.parentNode && curLi.style.display != 'none')
				itemTop += this.itemHeight;
			curLi = nextElementSibling(curLi);
		}

		curListTop = this.list.scrollTop;
		curListHeight = Math.min(this.maxHeight, (this.filtered ? this.filteredCount : this.itemCount)) * this.itemHeight;
		curListBottom = curListTop + curListHeight;

		if (itemTop < curListTop)			// scroll up : decrease scroll top
		{
			scrollTo = itemTop;
			this.blockScroll = true;
			this.list.scrollTop = Math.min(this.list.scrollHeight, scrollTo);
		}
		else if (itemTop >= curListBottom)		// scroll down : increase scroll top
		{
			scrollTo = itemTop - ((this.maxHeight - 1) * this.itemHeight);
			this.blockScroll = true;
			this.list.scrollTop = Math.min(this.list.scrollHeight, scrollTo);
		}

		if (this.editable)
			this.hostObj.focus();
	}


	this.isFiltered = function()
	{
		return this.filtered;
	}


	this.setText = function(str)
	{
		if (str == null)
			return;

		this.showSelMsg((str == ''));

		if (str == '')
			return;

		if (this.editable && this.hostObj)
		{
			this.hostObj.value = str;
		}
		else if (!this.editable && this.statObj)
		{
			this.statObj.innerHTML = str;
			this.statObj.title = str;
		}
	}
}
