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


// Selection class constructor
function Selection()
{
	this.selected = {},


	this.isSelected = function(id)
	{
		return (id in this.selected);
	}


	this.select = function(id, obj)
	{
		if (!id || this.isSelected(id))
			return false;

		this.selected[id] = obj;

		return true;
	}


	this.deselect = function(id)
	{
		if (!id || !this.isSelected(id))
			return false;

		delete this.selected[id];

		return true;
	}


	this.clear = function()
	{
		this.selected = {};
	}
}



// Drop Down List constructor
function DDList()
{
	this.hostObj = null;
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
	this.itemCount = 0;
	this.editable = true;
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


	this.showSelMsg = function(val)
	{
		if (!this.selMsg || this.selMsg == '' || this.smShown == val)
			return;

		if (this.editable)
		{
			this.hostObj.style.color = ((val) ? '#808080' : '#000000');
			this.hostObj.value = ((val) ? this.selMsg : '');
		}
		else
		{
			this.statObj.style.color = ((val) ? '#808080' : '#000000');
			this.statObj.innerHTML = ((val) ? this.selMsg : '');
		}

		this.smShown = val;
	}


	this.create = function(params)
	{
		var inpObj, statObj, divObj, ulObj, btnObj, btnDivObj, contObj, inpCont;
		var selObj, selectMode = false;

		if (!params)
			return false;

		if (!params.input_id || !params.selCB)
			return false;

		this.multi = params.multi || false;
		this.forceSelect = params.forceSelect || false;
		this.listAttach = params.listAttach || false;
		this.itemPrefix = params.itemPrefix || null;

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
			}

			// Create container
			inpCont = ce('div');
			contObj = ce('div', { className : 'dd_container' },
						[ ce('div', { className : 'dd_input_cont' },
							[ inpCont ]) ]);
			if (!contObj)
				return false;
			if (params.extClass)
				addClass(contObj, params.extClass);

			if (selectMode)
			{
				insertAfter(contObj, selObj);
				selObj = re(selObj);
				inpObj = ce('input');
				if (!inpObj)
					return false;
				inpCont.appendChild(inpObj);
			}
			else
			{
				insertAfter(contObj, inpObj);
				inpObj = re(inpObj);
				if (!inpObj)
					return false;
				inpCont.appendChild(inpObj);
			}

			// create static element
			statObj = ce('span', { className : 'statsel',
								style : {
									width : px(inpObj.offsetWidth),
									display : (params.editable == false) ? '' : 'none' } });

			insertBefore(statObj, inpObj);

			if (params.editable == false)
			{
				this.editable = false;
				inpObj.style.display = 'none';
			}
			else
			{
				inpObj.className = 'ddinp';
			}
		}
		else
		{
			contObj = ce('div', { className : 'dd_attached' });
			if (!contObj)
				return false;
			if (params.extClass)
				addClass(contObj, params.extClass);

			insertAfter(contObj, inpObj);
			contObj.style.width = px(inpObj.offsetWidth);
			contObj.style.height = px(inpObj.offsetHeight);

			inpObj = re(inpObj);
			if (!inpObj)
				return false;
			contObj.appendChild(inpObj);

			inpObj.onclick = this.dropDown.bind(this);
		}

		if (params.mobile)
		{
			this.isMobile = params.mobile;
		}

		// create elements of list
		if (this.isMobile)
		{
			if (selectMode)
				ulObj = selObj;
			else
				ulObj = ce('select');
			if (this.multi)
			{
				ulObj.multiple = true;
				if (this.forceSelect)
				{
					ulObj.size = 10;
					show(ulObj, false);
				}
			}

			ulObj.onchange = this.onChange.bind(this);
		}
		else
		{
			if (selectMode)
			{
				show(selObj, false);
				contObj.appendChild(selObj);
			}
			ulObj = ce('ul');
		}
		if (!ulObj)
			return false;

		divObj = ce('div', { className : 'ddlist',
						onkeydown : this.onKey.bind(this),
						onscroll : this.onScroll.bind(this) },
					[ulObj]);
		if (!divObj)
			return false;
		if (this.isMobile)
			addClass(divObj, 'ddmobile');
		else
			setParam(divObj, { style : { display : 'none', height :  '10px' } });
		if (this.multi && this.forceSelect)
		{
			addClass(divObj, 'forced');
			show(divObj, false);
		}
		contObj.appendChild(divObj);

		// create elements of drop down button
		if (!this.listAttach)
		{
			btnObj = ce('button', { type : 'button', className : 'selectBtn' }, [ ce('div', { className : 'dditem_idle' } ) ]);
			if (!btnObj)
				return false;
			if (!this.isMobile || (this.isMobile && this.multi && this.forceSelect))
				btnObj.onclick = this.dropDown.bind(this);

			if (!insertBefore(btnObj, firstElementChild(contObj)))
				return false;
		}
		else
		{
			if (this.isMobile)
			{
				divObj.style.top = 0;

				divObj.style.height = px(contObj.offsetHeight);
				divObj.style.width = px(contObj.offsetWidth);
			}
			else
			{
				divObj.style.top = px(contObj.offsetHeight);
			}
		}

		this.hostObj = inpObj;
		this.statObj = statObj;
		this.list = divObj;
		this.ulobj = ulObj;
		this.selobj = selObj;
		this.selbtn = btnObj;

		if (params.selCB)
		{
			this.selcb = params.selCB;
		}

		this.changecb = params.changecb || null;

		if (params.maxHeight)
		{
			if (params.maxHeight > 0)
				this.maxHeight = params.maxHeight;
		}

		if (params.inpCB)
		{
			this.inpcb = params.inpCB;
			inpObj.oninput = this.onInput.bind(this);
		}

		if (params.selmsg)
		{
			this.selMsg = params.selmsg;
			if (this.editable)
			{
				inpObj.onfocus = this.onFocus.bind(this);
				inpObj.onblur = this.onBlur.bind(this);

				if (this.hostObj.value == '')
				{
					this.hostObj.style.color = '#808080';
					this.hostObj.value = this.selMsg;
				}
			}
			else
			{
				this.statObj.style.color = '#808080';
				this.statObj.innerHTML = this.selMsg;
			}

			this.smShown = true;
		}

		if (!this.editable)
		{
			statObj.onclick = this.dropDown.bind(this);
		}
		else
		{
			inpObj.onkeydown = this.onKey.bind(this);
			inpObj.onkeypress = this.onKey.bind(this);
			inpObj.autocomplete = "off";
		}

		if (this.multi)
			this.selection = new Selection();

		if (selectMode)
			this.parseSelect(selObj);

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
					setEmptyClick(this.show.bind(this, false), [this.hostObj, this.statObj, this.list, this.selbtn]);
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

			setEmptyClick(this.show.bind(this, false), [this.hostObj, this.statObj, this.list, this.selbtn]);
		}
		else
		{
			setEmptyClick();

			if (this.changecb && this.changed)
			{
				if (this.multi && this.selobj.multiple)
				{
					this.changecb.call(this, this.selection.selected);
				}
				else
				{
					selectedOption = this.selobj.options[this.selobj.selectedIndex];
					if (!selectedOption)
						return;

					resObj.id = this.prepareId(selectedOption.value);
					resObj.str = selectedOption.innerHTML;

					this.changecb.call(this, resObj);
				}
			}
			this.changed = false;
		}

		if (this.selbtn && firstElementChild(this.selbtn))
			firstElementChild(this.selbtn).className = ((val) ? 'dditem_act' : 'dditem_idle');

		this.list.style.display = ((val) ? 'block' : 'none');

		if (!val)
			this.setActive(null);
		else
			this.list.scrollTop = 0;
	}


	this.dropDown = function()
	{
		var liobj, i;

		if (!this.list || !this.ulobj)
			return;

		if (!this.visible && this.filtered)
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


	this.onChange = function()
	{
		var selectedOption, resObj = {};

		if (!this.ulobj || !this.ulobj.options || this.ulobj.selectedIndex == -1)
			return;
		if (!this.selcb)
			return;

		if (this.multi && this.ulobj.multiple)
		{
			var option;

			this.selection.clear();
			for(var i = 0; i < this.ulobj.options.length; i++)
			{
				option = this.ulobj.options[i];
				if (option.selected)
				{
					this.selection.select(this.prepareId(option.value), option.innerHTML);
				}
			}

			this.selcb.call(this, this.selection.selected);
		}
		else
		{
			selectedOption = this.ulobj.options[this.ulobj.selectedIndex];
			if (!selectedOption)
				return;

			resObj.id = this.prepareId(selectedOption.value);
			resObj.str = selectedOption.innerHTML;

			this.selcb.call(this, resObj);
		}

		this.changed = true;

		if (this.isMobile)
		{
			if (this.multi && this.ulobj.multiple)
				this.changecb.call(this, this.selection.selected);
			else
				this.changecb.call(this, resObj);
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
		var resObj = {};

		if (!this.selcb || !obj)
			return;

		if (firstElementChild(obj))
		{
			var item_id = firstElementChild(obj).id
			resObj.id = this.prepareId(item_id);
			if (this.multi)
				resObj.str = nextElementSibling(firstElementChild(firstElementChild(firstElementChild(obj)))).innerHTML;
			else
				resObj.str = firstElementChild(obj).innerHTML;

			if (this.multi)
			{
				if (this.selection.isSelected(resObj.id))
					this.selection.deselect(resObj.id);
				else
					this.selection.select(resObj.id, resObj.str);

				selectByValue(this.selobj, resObj.id, this.selection.isSelected(resObj.id));

				this.check(resObj.id, this.selection.isSelected(resObj.id));

				this.selcb.call(this, this.selection.selected);
			}
			else
			{
				selectByValue(this.selobj, resObj.id);

				this.selcb.call(this, resObj);
			}
		}

		this.changed = true;

		if (!this.multi)
			this.show(false);
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


	this.parseSelect = function(obj)
	{
		var i, option, resText = [];
		var val, text;

		if (!obj || obj.tagName === undefined || obj.tagName != 'SELECT' || obj.options === undefined)
			return false;

		for(i = 0, l = obj.options.length; i < l; i++)
		{
			option = obj.options[i];
			val = option.value;
			text = (option.textContent) ? option.textContent : option.innerText;

			if (!this.isMobile)
				this.addItem(val, text);

			if (option.selected)
			{
				if (this.multi)
				{
					this.check(val, true);
					this.selection.select(val, option.innerHTML);
				}
				resText.push(text);
			}
		}

		this.setText(resText.join(', '));

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
			liobj = ce('option', { value : idval, innerHTML : str });
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

		if (str != '')
		{
			if (this.editable && this.hostObj)
				this.hostObj.value = str;
			else if (!this.editable && this.statObj)
				this.statObj.innerHTML = str;
		}
	}
}
