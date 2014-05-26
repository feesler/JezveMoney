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



// Drop Down List constructor
function DDList()
{
	this.hostObj = null;
	this.statObj = null;
	this.list = null;
	this.ulobj = null;
	this.selbtn = null;
	this.selcb = null;
	this.inpcb = null;
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
	this.listAttach = false;
	this.isMobile = false;
	this.itemPrefix = null;



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

			inpObj.onclick = bind(this.dropDown, this);
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
			ulObj.onchange = bind(this.onChange, this);
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
						onkeydown : bind(this.onKey, this),
						onscroll : bind(this.onScroll, this) },
					[ulObj]);
		if (!divObj)
			return false;
		if (this.isMobile)
			addClass(divObj, 'ddmobile');
		else
			setParam(divObj, { style : { display : 'none', height :  '10px' } });
		contObj.appendChild(divObj);

		// create elements of drop down button
		if (!this.listAttach)
		{
				btnObj = ce('button', { type : 'button', className : 'selectBtn' }, [ ce('div', { className : 'idle' } ) ]);
				if (!btnObj)
					return false;
				if (!this.isMobile)
					btnObj.onclick = bind(this.dropDown, this);

				if (!insertBefore(btnObj, contObj.firstElementChild))
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
		this.selbtn = btnObj;

		if (params.selCB)
		{
			this.selcb = params.selCB;
		}

		if (params.maxHeight)
		{
			if (params.maxHeight > 0)
				this.maxHeight = params.maxHeight;
		}

		if (params.inpCB)
		{
			this.inpcb = params.inpCB;
			inpObj.oninput = bind(this.onInput, this);
		}

		if (params.selmsg)
		{
			this.selMsg = params.selmsg;
			if (this.editable)
			{
				inpObj.onfocus = bind(this.onFocus, this);
				inpObj.onblur = bind(this.onBlur, this);

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
			statObj.onclick = bind(this.dropDown, this);
		}
		else
		{
			inpObj.onkeydown = bind(this.onKey, this);
			inpObj.onkeypress = bind(this.onKey, this);
			inpObj.autocomplete = "off";
		}

		if (selectMode && !this.isMobile)
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
				chnodes[i].onclick = bind(this.onSelItem, this, chnodes[i]);
			}
		}

		return true;
	}


	this.show = function(val)
	{
		if (!this.list)
			return;

		if (this.isMobile)
			return;

		this.visible = val;
		if (val)
		{
			this.list.style.height = px(Math.min(this.maxHeight, (this.filtered ? this.filteredCount : this.itemCount)) * this.itemHeight);

			setEmptyClick(bind(this.show, this, false), [this.hostObj, this.statObj, this.list, this.selbtn]);
		}
		else
		{
			setEmptyClick();
		}

		if (this.selbtn && this.selbtn.firstElementChild)
			this.selbtn.firstElementChild.className = ((val) ? 'dditem_act' : 'dditem_idle');

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


	this.onChange = function()
	{
		var selectedOption, resObj = {};

		if (!this.ulobj || !this.ulobj.options || this.ulobj.selectedIndex == -1)
			return;
		if (!this.selcb)
			return;

		selectedOption = this.ulobj.options[this.ulobj.selectedIndex];
		if (!selectedOption)
			return;

		resObj.id = this.prepareId(selectedOption.id);
		resObj.str = selectedOption.innerHTML;

		this.selcb.call(this, resObj);
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
				if (chnodes[i].firstElementChild.id == idval)
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

		if (obj.firstElementChild)
		{
			resObj.id = this.prepareId(obj.firstElementChild.id);
			resObj.str = obj.firstElementChild.innerHTML;

			this.selcb.call(this, resObj);
		}

		this.show(false);
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

		return (next !== false) ? obj.nextSibling : obj.previousSibling;
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
				newItem = this.ulobj.firstElementChild;
			}
			else if (this.visible)
			{
				if (this.actItem != null)
					newItem = this.getSibling(ge(this.actItem).parentNode);
				else
					newItem = this.ulobj.firstElementChild;
			}
		}
		else if (keyCode == 38)				// up arrow
		{
			if (this.visible && this.actItem != null)
			{
				newItem = this.getSibling(ge(this.actItem).parentNode, false);
			}
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
			this.setActive(newItem.firstElementChild);
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
		var i, ival, match, found = false;

		if (!fstr)
			return false;

		chnodes = this.ulobj.childNodes;
		this.filteredCount = 0;
		for(i = 0; i < chnodes.length; i++)
		{
			if (chnodes[i].nodeType == 1)		// ELEMENT_NODE
			{
				ival = chnodes[i].firstElementChild.innerHTML.toLowerCase();
				match = (ival.indexOf(fstr.toLowerCase(), 0) != -1);
				if (match)
					this.filteredCount++;

				chnodes[i].style.display = (match ? '' : 'none');
				found = (found || match);

				if (found)
					this.filtered = true;
			}
		}

		return found;
	}


	this.parseSelect = function(obj)
	{
		var i;

		if (!obj || obj.tagName === undefined || obj.tagName != 'SELECT' || obj.options === undefined)
			return false;

		for(i = 0, l = obj.options.length; i < l; i++)
		{
			this.addItem(obj.options[i].value, obj.options[i].textContent);
			if (obj.selectedIndex == i)
			{
				this.select(obj.options[i].value);
			}
		}

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

		if (!item_id || !this.list || !this.ulobj)
			return false;

		idval = ((this.itemPrefix) ? this.itemPrefix : '') + item_id;
		divobj = ce('div', { id : idval, innerHTML : str, className : 'idle' } );
		if (!divobj)
			return false;
		divobj.onmouseover = bind(this.setActive, this, divobj);

		if (this.isMobile)
		{
			liobj = ce('option', { id : item_id, innerHTML : str });
		}
		else
		{
			liobj = ce('li', {}, [divobj]);
		}
		if (!liobj)
			return false;
		liobj.onclick = bind(this.onSelItem, this, liobj);

		this.ulobj.appendChild(liobj);

		this.itemCount++;

		return true;
	}


	this.setActive = function(obj)
	{
		var oldAct;
		var scrollTo, itemTop = 0;
		var curListTop, curListHeight, curListBottom;

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
		curLi = this.ulobj.firstElementChild;
		while(curLi != obj.parentNode)
		{
			if (curLi != obj.parentNode && curLi.style.display != 'none')
				itemTop += this.itemHeight;
			curLi = curLi.nextSibling;
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
