// Drop Down List constructor
// params:
//  input_id - identifier of element to attach DropDown comonent to
//  editable - if set true user will be able to type text in the combo box
//  disabled - if set true any interactions with componenet will be disabled
//  useNativeSelect - if set true componenet will use native select element on small devices(less 768px width) to view list and edit selection
//  fullScreen - if set true component will show fullscreen popup
//  placeholder - placeholder text for component
//  maxHeight - maximum count of items to show in drop down list
//  onitemselect - item selected event handler
//  onchange - selection changed event handler
//  oninput - text field input event handler. If set true will filter list by value of input
//  renderItem - callback for custom selected item render
//  resultTarget - identifier or element to copy selection data to
//  extraClass - additional CSS classes
//  data - array of item objects { id, title }
function DropDown(params)
{
	this.changed = false;
	this.visible = false;
	this.filtered = false;
	this.filteredCount = 0;
	this.manFilter = false;
	this.actItem = null;
	this.actSelItem = null;
	this.blockScroll = false;

	if (!params)
		throw new Error('Inval id parameters');
	if (!params.input_id)
		throw new Error('input_id not specified');

	this.createParams = params;
	this.multi = params.multi || false;
	this.listAttach = params.listAttach || false;
	this.editable = ('editable' in params) ? !!params.editable : true;
	this.disabled = ('disabled' in params) ? !!params.disabled : false;
	if (this.disabled)
		this.editable = false;

	this.useNativeSelect = ('useNativeSelect' in params) ? !!params.useNativeSelect : false;
	this.fullScreen = ('fullScreen' in params) ? !!params.fullScreen : false;

	this.setMaxHeight(params);

	this.placeholder = params.placeholder || null;

	this.itemSelectCallback = params.onitemselect || null;
	this.changeCallback = params.onchange || null;
	
	this.setInputCallback(params.oninput);

	if ('renderItem' in params)
	{
		if (!isFunction(params.renderItem))
			throw new Error('Invalid renderItem handler specified');
		this.renderItem = params.renderItem;
	}

	this.toggleHandler = this.toggleList.bind(this);
	this.inputHandler = this.onInput.bind(this)
	this.keyHandler = this.onKey.bind(this);
	this.hoverHandler = this.onMouseOver.bind(this);
	this.scrollHandler = this.onScroll.bind(this);
	this.selectChangeHandler = this.onChange.bind(this);
	this.listItemClickHandler = this.onListItemClick.bind(this);
	this.delSelectItemHandler = this.onDeleteSelectedItem.bind(this);
	this.focusHandler = this.onFocus.bind(this);
	this.blurHandler = this.onBlur.bind(this);

	var inpObj = ge(params.input_id);
	if (!inpObj || !inpObj.parentNode)
		throw new Error('Invalid element specified');

	// Save result value to specified element
	this.resultTarget = params.resultTarget || null;
	if (this.resultTarget)
	{
		this.resultTarget = ge(this.resultTarget);
		if (!this.resultTarget)
			throw new Error('resultTarget not found');
	}

	if (this.listAttach)
		this.attachToElement(inpObj);
	else
		this.attachToInput(inpObj);

	if (params.extraClass)
		this.containerElem.classList.add(params.extraClass);

	if (this.useNativeSelect)
		this.containerElem.classList.add('dd__container_native');
	if (this.fullScreen)
	{
		this.containerElem.classList.add('dd__fullscreen');

		this.backgroundElem = ce('div', { className : 'dd__background' });
		this.containerElem.appendChild(this.backgroundElem);
	}

	this.fixIOS(this.selectElem);

	this.listElem = ce('ul');
	this.list = ce('div', { className : 'dd__list', tabIndex : -2 }, this.listElem);
	this.list.addEventListener('keydown', this.keyHandler);
	this.list.addEventListener('scroll', this.scrollHandler);

	if (this.listAttach)
	{
		this.containerElem.appendChild(this.list);
		this.list.style.top = px(this.containerElem.offsetHeight);
	}

	this.selectElem.addEventListener('change', this.selectChangeHandler);
	this.assignFocusHandlers(this.selectElem);

	if (this.disabled)
		this.selectElem.disabled = true;

	if (!this.listAttach)
	{
		this.comboElem = this.createCombo();
		if (!this.comboElem)
			throw new Error('Fail to create combo element');
		this.containerElem.appendChild(this.comboElem);
	}

	this.makeEditable(this.editable);

	this.items = [];
	if (inpObj.tagName == 'SELECT')
	{
		this.parseSelect(this.selectElem);
	}
	
	if (params.data)
		this.append(params.data);
}


DropDown.create = function(params)
{
	try
	{
		return new DropDown(params);
	}
	catch(e)
	{
		return null;
	}
}


DropDown.prototype.setMaxHeight = function(params)
{
	this.maxHeight = 5;
	if (!('maxHeight' in params))
		return;

	this.maxHeight = parseInt(params.maxHeight);
	if (isNaN(this.maxHeight) || this.maxHeight <= 0)
		throw new Error('Invalid maxHeight parameter');
};


// Attach DropDown component to specified input element
DropDown.prototype.attachToInput = function(elem)
{
	if (!this.isInputElement(elem))
		throw new Error('Invalid element specified');

	// Create container
	this.containerElem = ce('div', { className : 'dd__container' });
	if (this.disabled)
		this.containerElem.classList.add('dd__container_disabled');
	else
		this.containerElem.classList.add('dd__container_enabled');

	this.selectionElem = ce('div', { className : 'dd__selection' });

	if (elem.tagName == 'SELECT')
	{
		this.selectElem = elem;
		if (elem.multiple)
			this.multi = true;

		if (elem.disabled)
		{
			this.disabled = true;
			this.editable = false;
		}

		insertAfter(this.containerElem, elem);
		this.inputElem = ce('input', { type : 'text' });
	}
	else
	{
		insertAfter(this.containerElem, elem);
		this.inputElem = re(elem);

		this.selectElem = ce('select');
		if (this.multi)
			this.selectElem.multiple = true;
	}

	if (this.editable)
	{
		this.containerElem.classList.add('dd__editable');
		this.inputElem.className = 'dd__input';
	}
	else
	{
		show(this.inputElem, false);
	}
};


DropDown.prototype.attachToElement = function(elem)
{
	this.containerElem = ce('div', { className : 'dd__container_attached', tabIndex : 0 });
	this.containerElem.addEventListener('keydown', this.keyHandler);
	this.assignFocusHandlers(this.containerElem);

	insertAfter(this.containerElem, elem);
	this.containerElem.style.width = px(elem.offsetWidth);
	this.containerElem.style.height = px(elem.offsetHeight);

	var hostElement = re(elem);
	if (!hostElement)
		return false;
	this.containerElem.appendChild(hostElement);

	hostElement.addEventListener('click', this.toggleHandler);
	if (!this.isInputElement(elem))
		this.editable = false;

	if (!this.disabled && this.staticElem)
		this.staticElem.addEventListener('click', this.toggleHandler);

	this.selectElem = ce('select');
	if (this.multi)
		this.selectElem.multiple = true;
	
	this.containerElem.appendChild(hostElement);
	this.containerElem.appendChild(this.selectElem);
};


// Set callback for oninput event
//  - in case `cb` is true: set default filter callback 
//  - in case `cb` is function: set specified function as callback
DropDown.prototype.setInputCallback = function(cb)
{
	this.inputCallback = null;
	if (!cb)
		this.inputCallback = null;
	else if (cb === true)
		this.inputCallback = this.defaultInputHandler;
	else if (isFunction(cb))
		this.inputCallback = cb;
	else
		throw new Error('Invalid oninput handler specified');
};


// Create combo element and return if success
DropDown.prototype.createCombo = function()
{
	if (this.listAttach || !this.inputElem)
		return null;

	// Create single selection element
	this.staticElem = ce('span', { className : 'dd__single-selection' });
	show(this.staticElem, !this.editable);

	this.toggleBtn = this.createToggleButton();

	res = ce('div', { className : 'dd__combo' });
	if (this.multi)
		addChilds(res, this.selectionElem);
	addChilds(res, [
		this.staticElem,
		this.inputElem,
		this.selectElem,
		this.list,
		this.toggleBtn
	]);

	return res;
};


DropDown.prototype.createToggleButton = function()
{
	// Create toggle button
	var arrowIcon = svg('svg',
						{ width : 24, height : 32 },
						svg('path',
							{ d : 'm5.5 12 6.5 6 6.5-6z' }));
	var res = ce('button',
					{ type : 'button', className : 'dd__toggle-btn' },
					arrowIcon);
	if (this.editable)
		res.tabIndex = -1;
	res.addEventListener('click', this.toggleHandler);
	res.addEventListener('keydown', this.keyHandler);
	this.assignFocusHandlers(res);

	if (this.disabled)
		res.disabled = true;

	return res;
};


/*	Event handlers	*/

// List item 'click' event handler
DropDown.prototype.onListItemClick = function(e)
{
	var item = this.getItemByElem(e.target)
	if (item)
		this.toggleItem(item.id);

	this.sendItemSelectEvent();
	this.changed = true;

	if (!this.multi)
		this.show(false);

	return true;
};


// Handler of 'change' event of native select
DropDown.prototype.onChange = function()
{
	if (!this.selectElem || !this.selectElem.options || this.selectElem.selectedIndex == -1)
		return;

	this.items.forEach(function(item)
	{
		if (!item.optionElem)
			return;

		item.selected = item.optionElem.selected;
	}, this);

	this.renderSelection();
	this.sendItemSelectEvent();

	this.changed = true;
};


// 'focus' event handler
DropDown.prototype.onFocus = function(e)
{
	if (this.disabled)
		return false;

	this.activate(true);

	if (this.isSelectedItemElement(e.target))
	{
		e.target.classList.add('dd__selection-item_active');
	}
	else
	{
		if (e.target == this.inputElem)
		{
			this.activateSelectedItem(null);
		}
		else
		{
			if (this.editable && this.inputElem)
				this.inputElem.focus();
		}
	}

	return true;
};


// 'blur' event handler
DropDown.prototype.onBlur = function(e)
{
	if (!this.isChildTarget(e.relatedTarget))
	{
		this.activate(false);
	}

	if (e.target == this.selectElem)
	{
		this.sendChangeEvent();
	}
	else if (this.isSelectedItemElement(e.target))
	{
		e.target.classList.remove('dd__selection-item_active');
	}

	return true;
};


// Click by delete button of selected item event handler
DropDown.prototype.onDeleteSelectedItem = function(e)
{
	if (!e || !e.target || !this.multi)
		return false;

	if (e.type == 'keydown' && (
		!this.isSelectedItemElement(e.target) ||
		!e.target.classList.contains('dd__selection-item_active')
		))
	{
		return true;
	}

	if (e.type == 'click' &&
		!e.target.classList.contains('dd__del-selection-item-btn'))
	{
		return true;
	}

	var selectedItems = this.getSelectedItems();
	if (!selectedItems.length)
		return true;

	var index = this.getSelectedItemIndex(e.target);
	if (index == -1)
		return true;

	// Focus host input if deselect last(right) selected item
	// Activate next selected item otherwise
	if (index == selectedItems.length - 1)
	{
		this.activateSelectedItem(null);
		setTimeout(function()
		{
			this.inputElem.focus();
		}.bind(this));
	}
	else
		this.activateSelectedItem(selectedItems[index + 1]);

	var item = selectedItems[index];
	if (item)
		this.deselectItem(item.id);

	return true;
};


DropDown.prototype.onScroll = function()
{
	if (!this.blockScroll)
		this.setActive(null);

	this.blockScroll = false;
};


// 'keydown' event handler
DropDown.prototype.onKey = function(e)
{
	var newItem = null;
	var selectedItems = null;
	var visibleItems = null;

	if ((this.editable && e.target == this.inputElem) ||
		(!this.editable && e.target == this.toggleBtn))
	{
		if (e.code == 'Backspace' || e.code == 'ArrowLeft')
		{
			if (this.editable)
			{
				var cursorPos = getCursorPos(this.inputElem);
				if (cursorPos.start == cursorPos.end && cursorPos.start == 0)
				{
					this.activateLastSelectedItem();
				}
			}
			else
			{
				this.activateLastSelectedItem();
			}

			return true;
		}
	}

	if (e.code == 'Backspace')
	{
		if (this.isSelectedItemElement(e.target))
		{
			selectedItems = this.getSelectedItems();
			if (!selectedItems.length)
				return true;

			var index = this.getSelectedItemIndex(e.target);
			if (index == -1)
				return true;

			if (index == 0)
			{
				// Activate first selected item if available or focus host input otherwise
				if (selectedItems.length > 1)
				{
					this.activateSelectedItem(selectedItems[1])
				}
				else
				{
					this.activateSelectedItem(null);
					setTimeout(function()
					{
						this.inputElem.focus();
					}.bind(this));
				}
			}
			else
			{
				// Activate previous selected item
				this.activateSelectedItem(selectedItems[index - 1]);
			}

			var item = selectedItems[index];
			if (item)
				this.deselectItem(item.id);
		}

		return true;
	}
	else if (e.code == 'Delete')
	{
		return this.onDeleteSelectedItem(e);
	}
	else if (e.code == 'ArrowLeft')
	{
		if (this.isSelectedItemElement(e.target))
		{
			selectedItems = this.getSelectedItems();
			if (!selectedItems.length)
				return true;

			var index = this.getSelectedItemIndex(e.target);
			if (index == 0)
				return true;

			this.activateSelectedItem(selectedItems[index - 1]);
		}

		return true;
	}
	else if (e.code == 'ArrowRight')
	{
		if (this.isSelectedItemElement(e.target))
		{
			selectedItems = this.getSelectedItems();
			if (!selectedItems.length)
				return true;

			var index = this.getSelectedItemIndex(e.target);
			if (index == -1)
				return true;

			if (index == selectedItems.length - 1)
			{
				this.activateSelectedItem(null);
				setTimeout(function()
				{
					this.inputElem.focus();
				}.bind(this));
			}
			else
				this.activateSelectedItem(selectedItems[index + 1]);
		}

		return true;
	}
	else if (e.code == 'ArrowDown')
	{
		visibleItems = this.getVisibleItems();

		if (!this.visible && !this.actItem)
		{
			this.show(true);
			newItem = visibleItems[0];
		}
		else if (this.visible)
		{
			if (this.actItem)
				newItem = this.getNextVisibleItem(this.actItem.id);
			else
				newItem = visibleItems[0];
		}
	}
	else if (e.code == 'ArrowUp')
	{
		if (this.visible && this.actItem)
		{
			newItem = this.getPrevVisibleItem(this.actItem.id);
		}
	}
	else if (e.code == 'Home')
	{
		visibleItems = this.getVisibleItems();
		if (visibleItems.length > 0)
			newItem = visibleItems[0];
	}
	else if (e.code == 'End')
	{
		visibleItems = this.getVisibleItems();
		if (visibleItems.length > 0)
			newItem = visibleItems[visibleItems.length - 1];
	}
	else if (e.code == 'Enter')
	{
		if (this.actItem)
		{
			this.toggleItem(this.actItem.id);
			this.sendItemSelectEvent();
			this.changed = true;

			if (!this.multi)
				this.show(false);
		}
		e.preventDefault ? e.preventDefault() : (e.returnValue = false);
	}
	else if (e.code == 'Escape')
	{
		this.show(false);
		this.inputElem.blur();
		return true;
	}
	else
		return true;

	if (newItem)
	{
		this.setActive(newItem);
		this.scrollToItem(newItem);
		e.preventDefault ? e.preventDefault() : (e.returnValue = false);
	}

	return true;
};


// Handler for 'mouseover' event on list item
DropDown.prototype.onMouseOver = function(e)
{
	if (this.blockScroll)
		return;

	var item = this.getItemByElem(e.target);
	if (!item)
		return;

	this.setActive(item);
};


// Handler for 'input' event of text field 
DropDown.prototype.onInput = function()
{
	if (isFunction(this.inputCallback))
		return this.inputCallback.call(this);

	return true;
};



/*	List items methods */

// Return list item object by id
DropDown.prototype.getItem = function(item_id)
{
	return this.items.find(function(item)
	{
		return item.id == item_id;
	});
};


// Return index of list item by id
DropDown.prototype.getItemIndex = function(item_id)
{
	return this.items.findIndex(function(item)
	{
		return item.id == item_id;
	});
};


// Return previous list item to specified by id
// Return null in case specified list item is not found or on first position
DropDown.prototype.getPrevItem = function(item_id)
{
	var ind = this.getItemIndex(item_id);
	if (ind === -1)
		return null;

	if (ind > 0)
		return this.items[ind - 1];
	else
		return null;
};


// Return next list item to specified by id
// Return null in case specified list item is not found or on last position
DropDown.prototype.getNextItem = function(item_id)
{
	var ind = this.getItemIndex(item_id);
	if (ind === -1)
		return null;

	if (ind < this.items.length)
		return this.items[ind + 1];
	else
		return null;
};


// Return array of visible(not hidden) list items
DropDown.prototype.getVisibleItems = function()
{
	return this.items.filter(function(item)
	{
		return !item.hidden;
	});
};


// Return previous visible list item to specified by id
// Return null in case specified list item is not found or on first position
DropDown.prototype.getPrevVisibleItem = function(item_id)
{
	var item = this.getItem(item_id);

	while(item)
	{
		item = this.getPrevItem(item.id);
		if (item && !item.hidden)
			return item;
	}

	return null;
};


// Return next visible list item to specified by id
// Return null in case specified list item is not found or on last position
DropDown.prototype.getNextVisibleItem = function(item_id)
{
	var item = this.getItem(item_id);

	while(item)
	{
		item = this.getNextItem(item.id);
		if (item && !item.hidden)
			return item;
	}

	return null;
};


// Return array of selected items
DropDown.prototype.getSelectedItems = function()
{
	return this.items.filter(function(item)
	{
		return item && item.selected;
	});
};


// Return list item object which list element contains specified element
DropDown.prototype.getItemByElem = function(elem)
{
	if (!elem)
		return null;

	return this.items.find(function(item)
	{
		return item && item.elem.contains(elem);
	});
};


// Return count of items to show at drop down list
DropDown.prototype.getListHeight = function()
{
	return Math.min(this.maxHeight,
					(this.filtered) ? this.filteredCount : this.items.length);
};


// Show or hide drop down list
DropDown.prototype.show = function(val)
{
	if (isVisible(this.selectElem))
		return;

	if (!this.list)
		return;

	this.visible = val;

	if (val)
	{
		if (!this.editable && this.toggleBtn)
			this.toggleBtn.focus();
		this.activate(true);

		var screenBottom = document.documentElement.scrollTop + document.documentElement.clientHeight;

		this.containerElem.classList.add('dd__open');

		var visibleItems = this.getVisibleItems();
		if (visibleItems.length > 0)
		{
			this.itemHeight = parseInt(visibleItems[0].elem.offsetHeight);
			var itemsToShow = this.getListHeight();
			var listHeight = itemsToShow * this.itemHeight;
		}

		var containerOffset = getOffset(this.containerElem);
		var totalListHeight = this.containerElem.offsetHeight + listHeight;
		var listBottom = containerOffset.top + totalListHeight;

		if (this.fullScreen && isVisible(this.backgroundElem))
		{
			document.body.style.overflow = 'hidden';
			this.list.classList.add('dd__list_drop-down');

			this.list.style.height = px((document.documentElement.clientHeight - this.comboElem.offsetHeight) / 2);
		}
		else
		{
			this.list.style.height = px(listHeight);

			// Check vertical offset of drop down list
			if (listBottom > document.documentElement.scrollHeight)
			{
				this.list.classList.remove('dd__list_drop-down');
				this.list.classList.add('dd__list_drop-up');

				if (this.listAttach)
				{
					this.list.style.bottom = px(this.containerElem.offsetHeight);
					this.list.style.top = '';
				}
			}
			else
			{
				this.list.classList.remove('dd__list_drop-up');
				this.list.classList.add('dd__list_drop-down');

				if (listBottom > screenBottom)
				{
					document.documentElement.scrollTop += listBottom - screenBottom;
				}

				if (this.listAttach)
				{
					this.list.style.top = px(this.containerElem.offsetHeight);
					this.list.style.bottom = '';
				}
			}
		}

		// Check horizontal offset of drop down list
		var listWidth = this.list.offsetWidth;
		if (containerOffset.left - document.documentElement.scrollLeft + this.containerElem.offsetWidth + listWidth > document.documentElement.clientWidth)
		{
			this.list.classList.remove('dd__list_drop-right');
			this.list.classList.add('dd__list_drop-left');
		}
		else
		{
			this.list.classList.remove('dd__list_drop-left');
			this.list.classList.add('dd__list_drop-right');
		}

		setEmptyClick(this.show.bind(this, false), [this.inputElem, this.staticElem, this.list, this.toggleBtn]);

		if (this.editable)
			this.inputElem.focus();
		this.list.scrollTop = 0;
	}
	else
	{
		this.containerElem.classList.remove('dd__open');
		if (this.fullScreen)
			document.body.style.overflow = '';

		setEmptyClick();

		this.sendChangeEvent();

		this.setActive(null);
	}
};


DropDown.prototype.makeEditable = function(val)
{
	if (this.listAttach)
		return false;

	val = (typeof val !== 'undefined') ? val : true;
	if (val && this.disabled)
		return true;

	this.editable = val;

	if (this.placeholder)
		this.inputElem.placeholder = this.placeholder;

	show(this.staticElem, !this.editable);
	show(this.inputElem, this.editable);

	if (this.editable)
	{
		this.inputElem.addEventListener('input', this.inputHandler);
		this.inputElem.classList.add('dd__input');
		this.inputElem.value = this.staticElem.innerHTML;
		this.assignFocusHandlers(this.inputElem);
		this.inputElem.addEventListener('keydown', this.keyHandler);
		this.inputElem.autocomplete = 'off';

		this.toggleBtn.tabIndex = -1;
	}
	else
	{
		this.inputElem.removeEventListener('input', this.inputHandler);
		this.inputElem.classList.remove('dd__input');

		this.staticElem.textContent = (this.placeholder && this.inputElem.value.length == 0) ?
										this.placeholder :
										this.inputElem.value;
		if (!this.disabled)
			this.staticElem.addEventListener('click', this.toggleHandler);
		
		this.toggleBtn.tabIndex = 0;
	}
};


// Enable or disable component
DropDown.prototype.enable = function(val)
{
	val = (typeof val !== 'undefined') ? val : true;
	if (val != this.disabled)
		return;

	this.disabled = !val;

	if (this.disabled)
	{
		this.containerElem.classList.add('dd__container_disabled');
		this.containerElem.classList.remove('dd__container_enabled');
		this.makeEditable(false);
	}
	else
	{
		this.containerElem.classList.remove('dd__container_disabled');
		this.containerElem.classList.add('dd__container_enabled');
		if (this.createParams.editable !== false)
			this.makeEditable();
	}

	this.inputElem.disabled = this.disabled;
	this.selectElem.disabled = this.disabled;
	this.toggleBtn.disabled = this.disabled;
};


// Show drop down list if hidden or hide if visible
DropDown.prototype.toggleList = function()
{
	if (!this.list || !this.listElem || this.disabled)
		return;

	if (!this.visible && this.filtered && !this.manFilter)
	{
		this.items.forEach(function(item)
		{
			item.hidden = false;
			show(item.elem, true);
			this.showOption(item.optionElem, true);
		}, this);

		this.filtered = false;
	}

	this.show(!this.visible);
};


// Activate or deactivate component
DropDown.prototype.activate = function(val)
{
	if (val)
	{
		this.containerElem.classList.add('dd__container_active');
	}
	else
	{
		this.containerElem.classList.remove('dd__container_active');
		this.show(false);
	}
};


// Check specified element is child of some selected item element
DropDown.prototype.isSelectedItemElement = function(elem)
{
	return elem && Array.isArray(this.selectedElems) &&
			this.selectedElems.find(function(selem)
			{
				return selem.contains(elem);
			});
};


// Check specified element is child of component
DropDown.prototype.isChildTarget = function(elem)
{
	return elem && this.containerElem.contains(elem);
};


// Return selected item element for specified item object
DropDown.prototype.renderSelectedItem = function(item)
{
	var deselectButton = ce('span', { className : 'dd__del-selection-item-btn', innerHTML : '&times;' });
	deselectButton.addEventListener('click', this.delSelectItemHandler);

	return ce('span', { className : 'dd__selection-item', innerText : item.title }, deselectButton);
};


// Render selection elements
DropDown.prototype.renderSelection = function()
{
	var selectedItems = this.getSelectedItems();

	if (!this.multi)
	{
		if (selectedItems.length)
			this.setText(selectedItems[0].title);
		else
			this.setText('');

		return;
	}

	var renderCallback = isFunction(this.renderItem) ? this.renderItem : this.renderSelectedItem;
	this.selectedElems = selectedItems.map(function(item)
	{
		var elem = renderCallback.call(this, item);
		if (!elem)
			return null;

		elem.tabIndex = -2;
		elem.addEventListener('keydown', this.keyHandler);
		this.assignFocusHandlers(elem);

		item.selectedElem = elem;

		return elem;
	}, this);

	removeChilds(this.selectionElem);
	addChilds(this.selectionElem, this.selectedElems);

	if (this.actSelItem && !this.disabled)
		this.actSelItem.selectedElem.focus();
};


// Deselect all items
DropDown.prototype.clearSelection = function()
{
	this.items.forEach(function(item)
	{
		item.selected = false;
	});
};


// Return selected items data for 'itemselect' and 'change' events
DropDown.prototype.getSelectionData = function()
{
	var selectedItems = this.getSelectedItems()
							.map(function(item)
							{
								return { id : item.id, value : item.title };
							});

	if (this.multi)
		return selectedItems;
	else
		return (selectedItems.length > 0) ? selectedItems[0] : null;
};


DropDown.prototype.sendItemSelectEvent = function()
{
	if (isFunction(this.itemSelectCallback))
	{
		var data = this.getSelectionData();
		this.itemSelectCallback.call(this, data);
	}
};


DropDown.prototype.sendChangeEvent = function()
{
	if (!this.changed)
		return;

	if (isFunction(this.changeCallback))
	{
		var data = this.getSelectionData();
		this.changeCallback.call(this, data);
	}

	this.saveResult();

	this.changed = false;
};


DropDown.prototype.saveResult = function()
{
	if (!this.resultTarget)
		return;

	if (this.multi && this.resultTarget.multiple)
	{
		this.items.forEach(function(item)
		{
			selectByValue(this.resultTarget, item.id, item.selected);
		}, this);
	}
	else
	{
		var selectedItems = this.getSelectedItems();
		if (Array.isArray(selectedItems) && selectedItems.length > 0)
		{
			this.resultTarget.value = selectedItems[0].id;
		}
		else
		{
			this.resultTarget.value = '';
		}
	}
};


// Toggle item selected status
DropDown.prototype.toggleItem = function(item_id)
{
	var item = this.getItem(item_id);
	if (!item)
		throw new Error('Item ' + item_id + ' not found');

	if (item.selected && this.multi)
		return this.deselectItem(item_id);
	else
		return this.selectItem(item_id);
};


// Select specified item
DropDown.prototype.selectItem = function(item_id)
{
	var item = this.getItem(item_id);
	if (!item)
		throw new Error('Item ' + item_id + ' not found');

	if (item.selected)
		return;

	if (this.multi)
	{
		this.check(item.id, true);
	}
	else
	{
		this.clearSelection();
	}

	if (this.selectElem)
		selectByValue(this.selectElem, item.id);
	if (this.resultTarget)
		selectByValue(this.resultTarget, item.id);

	item.selected = true;

	this.renderSelection();
};


// Deselect specified item
DropDown.prototype.deselectItem = function(item_id)
{
	var item = this.getItem(item_id);
	if (!item)
		throw new Error('Item ' + item_id + ' not found');

	if (!item.selected)
		return;

	if (this.multi)
	{
		this.check(item_id, false);
		selectByValue(this.selectElem, item_id, false);
		if (this.resultTarget)
			selectByValue(this.resultTarget, item_id, false);
	}
	else
	{
		selectByValue(this.selectElem, 0);
		if (this.resultTarget)
			selectByValue(this.resultTarget, 0);
	}

	item.selectedElem = null;
	item.selected = false;

	this.renderSelection();
};


DropDown.prototype.getSelectedItemIndex = function(elem)
{
	var selectedItems = this.getSelectedItems();
	if (!Array.isArray(selectedItems))
		return -1;

	return selectedItems.findIndex(function(item)
	{
		return item.selectedElem.contains(elem);
	});
};


// Activate specified selected item
DropDown.prototype.activateSelectedItem = function(item)
{
	if (!item)
	{
		this.actSelItem = null;
		return;
	}

	if (this.disabled || !item.selected)
		return;

	this.actSelItem = item;
	this.actSelItem.selectedElem.focus();
};


// Activate last(right) selected item
DropDown.prototype.activateLastSelectedItem = function()
{
	var selectedItems = this.getSelectedItems();
	if (!selectedItems.length)
		return;

	this.activateSelectedItem(selectedItems[selectedItems.length - 1]);
};


DropDown.prototype.defaultInputHandler = function()
{
	if (!this.inputElem)
		return false;

	var found = this.filter(this.inputElem.value);
	this.show(found);

	return true;
};


DropDown.prototype.showOption = function(option, val)
{
	if (!option)
		return;

	var parent = option.parentNode;
	if (!parent)
		return;

	if (typeof val === 'undefined')
		val = true;

	var visible = !parent.classList.contains('dd__opt-wrapper');
	if (visible == val)
		return;

	if (val)
	{
		insertAfter(option, parent);
		re(parent);
	}
	else
	{
		var wrapper = ce('div', { className : 'dd__opt-wrapper' });
		insertAfter(wrapper, option);
		wrapper.appendChild(option);
	}
};


DropDown.prototype.filter = function(fstr)
{
	var found = false;

	var lfstr = fstr.toLowerCase();
	this.filteredCount = 0;

	if (lfstr.length == 0)
	{
		this.items.forEach(function(item)
		{
			item.hidden = false;
			show(item.elem, true);
			this.showOption(item.optionElem, true);
		}, this);

		this.filtered = false;
	}
	else
	{
		this.items.forEach(function(item)
		{
			var ival = item.title.toLowerCase();
			var match = ival.includes(lfstr, 0);
			if (match)
				this.filteredCount++;

			item.hidden = !match;
			show(item.elem, match);
			this.showOption(item.optionElem, match);
			found = (found || match);

			if (found)
				this.filtered = true;
		}, this);

	}

	return found;
};


DropDown.prototype.check = function(item_id, val)
{
	if (!this.multi)
		return false;

	var item = this.getItem(item_id);
	if (!item || !item.divElem)
		return false;
	
	if (val)
		item.divElem.classList.add('dd__list-item_selected');
	else
		item.divElem.classList.remove('dd__list-item_selected')

	return true;
};


DropDown.prototype.fixIOS = function(elem)
{
	if (!elem || elem.tagName != 'SELECT' || !this.multi)
		return;

	var firstElement = elem.firstElementChild;
	if (firstElement && firstElement.tagName == 'OPTGROUP' && firstElement.hidden && firstElement.disabled)
		return;

	var optgroup = ce('optgroup', { hidden : true, disabled : true });
	prependChild(elem, optgroup);
};


DropDown.prototype.parseSelect = function(elem)
{
	if (!elem || elem.tagName != 'SELECT' || !elem.options)
		return false;

	for(var i = 0, l = elem.options.length; i < l; i++)
	{
		var option = elem.options[i];
		var item_id = option.value;
		var title = (option.textContent) ? option.textContent : option.innerText;

		var item = this.addItem(item_id, title, false);
		if (!item)
			return false;

		item.optionElem = option;
		if (option.selected)
		{
			item.selected = true;
			if (this.multi)
			{
				this.check(item.id, true);
			}
		}
	}

	this.saveResult();

	this.renderSelection();

	return true;
};


DropDown.prototype.append = function(items)
{
	if (!items || !this.list || !this.listElem)
		return false;

	var data = Array.isArray(items) ? items : [ items ];
	data.forEach(function(item)
	{
		this.addItem(item.id, item.title, true);
	}, this);

	return true;
};


DropDown.prototype.addOption = function(target, item_id, title)
{
	if (!target || target.tagName != 'SELECT')
		return;

	var option = ce('option', { value : item_id, innerHTML : title });
	target.appendChild(option);

	return option;
};


DropDown.prototype.addItem = function(item_id, str, appendToSelect)
{
	var item = {
		id : item_id,
		title : str,
		selected : false,
		hidden : false
	};

	if (!item.id || !this.list || !this.listElem)
		return null;

	if (typeof appendToSelect === 'undefined')
		appendToSelect = true;

	if (appendToSelect && !this.multi && !this.items.length)
	{
		this.selectElem.appendChild(ce('option', { disabled : true, value : 0, selected : true }));
	}

	item.divElem = ce('div', { className : 'dd__list-item' });
	if (this.multi)
	{
		item.checkIcon = svg('svg',
						{ width : 17, height : 17, viewBox : '0 1 10 10' },
						svg('path',
							{ d : 'M1.08 4.93a.28.28 0 000 .4l2.35 2.34c.1.11.29.11.4 0l4.59-4.59a.28.28 0 000-.4l-.6-.6a.28.28 0 00-.4 0l-3.8 3.8-1.54-1.55a.28.28 0 00-.4 0z' }));
		item.divElem.appendChild(item.checkIcon);

		item.titleElem = ce('span', { title : str, innerText : str });
		item.divElem.appendChild(item.titleElem);
	}
	else
	{
		item.divElem.title = str;
		item.divElem.innerHTML = str;
	}

	item.divElem.addEventListener('mouseover', this.hoverHandler);

	item.elem = ce('li', {}, item.divElem);
	item.elem.addEventListener('click', this.listItemClickHandler);

	this.listElem.appendChild(item.elem);

	if (appendToSelect)
		item.optionElem = this.addOption(this.selectElem, item_id, str);
	item.resOptionElem = this.addOption(this.resultTarget, item_id, str);
	this.items.push(item);

	return item;
};


DropDown.prototype.setActive = function(item)
{
	// flush current active item
	if (this.actItem)
	{
		this.actItem.divElem.classList.remove('dd__list-item_active');
		this.actItem = null;
	}

	if (this.blockScroll)
		return;

	if (!item || !this.items.length)
		return;

	item.divElem.classList.add('dd__list-item_active');
	this.actItem = item;

	if (this.editable)
		this.inputElem.focus();
};


DropDown.prototype.scrollToItem = function(item)
{
	if (!this.visible ||		// drop down list must be visible
		!item || item.hidden)	// item must exist and be visible
		return;

	var visibleItems = this.getVisibleItems();
	if (!visibleItems || !visibleItems.length)
		return;

	var index = visibleItems.indexOf(item);
	if (index === -1)
		return;

	if (!this.itemHeight)
		this.itemHeight = visibleItems[0].elem.offsetHeight;

	var itemTop = index * this.itemHeight;
	var itemBottom = itemTop + this.itemHeight;
	var listTop = this.list.scrollTop;
	var listHeight = this.list.clientHeight;
	var listBottom = listTop + listHeight;

	if (itemTop < listTop)			// scroll up : decrease scroll top
	{
		this.blockScroll = true;
		this.list.scrollTop = Math.min(this.list.scrollHeight, itemTop);
	}
	else if (itemBottom > listBottom)		// scroll down : increase scroll top
	{
		this.blockScroll = true;
		this.list.scrollTop = Math.min(this.list.scrollHeight, listTop + itemBottom - listBottom);
	}

	setTimeout(function()
	{
		this.blockScroll = false;
	}.bind(this), 200);
};


DropDown.prototype.isInputElement = function(elem)
{
	var inputTags = [ 'INPUT', 'SELECT', 'TEXTAREA' ];

	return elem && inputTags.includes(elem.tagName)
}



DropDown.prototype.isFiltered = function()
{
	return this.filtered;
};


DropDown.prototype.setText = function(str)
{
	if (typeof str !== 'string')
		return;

	if (str.length > 0)
	{
		if (this.editable && this.inputElem)
		{
			this.inputElem.value = str;
		}
		else if (!this.editable && this.staticElem)
		{
			this.staticElem.innerHTML = str;
			this.staticElem.title = str;
			this.staticElem.classList.remove('dd__single-selection_placeholder');
		}
	}
	else
	{
		this.staticElem.innerHTML = this.placeholder;
		this.staticElem.title = '';
		this.staticElem.classList.add('dd__single-selection_placeholder');
		return;
	}
};


DropDown.prototype.assignFocusHandlers = function(elem)
{
	if (!elem)
		return;

	elem.addEventListener('focus', this.focusHandler);
	elem.addEventListener('blur', this.blurHandler);
};