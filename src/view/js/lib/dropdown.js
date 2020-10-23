'use strict';

/* global isFunction, ge, ce, svg, addChilds, removeChilds, re, px, insertAfter, selectByValue */
/* global prependChild, show, setEmptyClick, getOffset, isVisible, getCursorPos */

var CHECK_ICON = 'M1.08 4.93a.28.28 0 000 .4l2.35 2.34c.1.11.29.11.4 0l4.59-4.59a.28.28 0 000-.4l-.6-.6a.28.28 0 00-.4 0l-3.8 3.8-1.54-1.55a.28.28 0 00-.4 0z';

/**
 * Drop Down List constructor
 * @param {Object} params
 * @param {string|Element} params.input_id - identifier or element to attach DropDown comonent to
 * @param {boolean} params.editable - if set true user will be able to type text in the combo box
 * @param {boolean} params.disabled - if set true any interactions with component will be disabled
 * @param {boolean} params.useNativeSelect - if set true component will use native select element on
 *     small devices(less 768px width) to view list and edit selection
 * @param {boolean} params.fullScreen - if set true component will show fullscreen popup
 * @param {string} params.placeholder - placeholder text for component
 * @param {number} params.maxHeight - maximum count of items to show in drop down list
 * @param {Function} params.onitemselect - item selected event handler
 * @param {Function} params.onchange - selection changed event handler
 * @param {boolean|Function} params.oninput - text input event handler
 *    If set to true list items will be filtered by input value
 * @param {Function} params.renderItem - callback for custom selected item render
 * @param {string|Element} params.resultTarget - identifier or element to copy selection data to
 * @param {string} params.extraClass - additional CSS classes
 * @param {Object} params.data - array of item objects { id, title }
 */
function DropDown(params) {
    var inpObj;

    this.changed = false;
    this.visible = false;
    this.filtered = false;
    this.filteredCount = 0;
    this.manFilter = false;
    this.actItem = null;
    this.actSelItem = null;
    this.blockScroll = false;
    this.focusedElem = null;

    if (!params) {
        throw new Error('Inval id parameters');
    }
    if (!params.input_id) {
        throw new Error('input_id not specified');
    }

    this.createParams = params;
    this.multi = params.multi || false;
    this.listAttach = params.listAttach || false;
    this.editable = ('editable' in params) ? !!params.editable : true;
    this.disabled = ('disabled' in params) ? !!params.disabled : false;
    if (this.disabled) {
        this.editable = false;
    }

    this.useNativeSelect = ('useNativeSelect' in params) ? !!params.useNativeSelect : false;
    this.fullScreen = ('fullScreen' in params) ? !!params.fullScreen : false;

    this.setMaxHeight(params);

    this.placeholder = params.placeholder || null;

    this.itemSelectCallback = params.onitemselect || null;
    this.changeCallback = params.onchange || null;

    this.setInputCallback(params.oninput);

    if ('renderItem' in params) {
        if (!isFunction(params.renderItem)) {
            throw new Error('Invalid renderItem handler specified');
        }
        this.renderItem = params.renderItem;
    }

    this.toggleHandler = this.toggleList.bind(this);
    this.inputHandler = this.onInput.bind(this);
    this.keyHandler = this.onKey.bind(this);
    this.hoverHandler = this.onMouseOver.bind(this);
    this.scrollHandler = this.onScroll.bind(this);
    this.selectChangeHandler = this.onChange.bind(this);
    this.listItemClickHandler = this.onListItemClick.bind(this);
    this.delSelectItemHandler = this.onDeleteSelectedItem.bind(this);
    this.focusHandler = this.onFocus.bind(this);
    this.blurHandler = this.onBlur.bind(this);

    inpObj = (typeof params.input_id === 'string') ? ge(params.input_id) : params.input_id;
    if (!inpObj || !inpObj.parentNode) {
        throw new Error('Invalid element specified');
    }

    // Save result value to specified element
    this.resultTarget = params.resultTarget || null;
    if (typeof this.resultTarget === 'string') {
        this.resultTarget = ge(this.resultTarget);
        if (!this.resultTarget) {
            throw new Error('resultTarget not found');
        }
    }

    if (this.listAttach) {
        this.attachToElement(inpObj);
    } else {
        this.attachToInput(inpObj);
    }

    if (params.extraClass) {
        this.containerElem.classList.add(params.extraClass);
    }

    if (this.useNativeSelect) {
        this.containerElem.classList.add('dd__container_native');
    }
    if (this.fullScreen) {
        this.containerElem.classList.add('dd__fullscreen');

        this.backgroundElem = ce('div', { className: 'dd__background' });
        this.containerElem.appendChild(this.backgroundElem);
    }

    this.fixIOS(this.selectElem);

    this.listElem = ce('ul');
    this.list = ce('div', { className: 'dd__list', tabIndex: -2 }, this.listElem);
    this.list.addEventListener('keydown', this.keyHandler);
    this.list.addEventListener('scroll', this.scrollHandler);

    if (this.listAttach) {
        this.containerElem.appendChild(this.list);
        this.list.style.top = px(this.containerElem.offsetHeight);
    }

    this.selectElem.addEventListener('change', this.selectChangeHandler);
    this.assignFocusHandlers(this.selectElem);

    if (this.disabled) {
        this.selectElem.disabled = true;
    }

    if (!this.listAttach) {
        this.comboElem = this.createCombo();
        if (!this.comboElem) {
            throw new Error('Fail to create combo element');
        }
        this.containerElem.appendChild(this.comboElem);
    }

    this.makeEditable(this.editable);

    this.groups = [];
    this.items = [];
    if (inpObj.tagName === 'SELECT') {
        this.parseSelect(this.selectElem);
    }

    if (params.data) {
        this.append(params.data);
    }
}

/** Static alias for DropDown constructor */
DropDown.create = function (params) {
    try {
        return new DropDown(params);
    } catch (e) {
        return null;
    }
};

/** Set maximum height of list element as count of items to be visible */
DropDown.prototype.setMaxHeight = function (params) {
    this.maxHeight = 5;
    if (!('maxHeight' in params)) {
        return;
    }

    this.maxHeight = parseInt(params.maxHeight, 10);
    if (Number.isNaN(this.maxHeight) || this.maxHeight <= 0) {
        throw new Error('Invalid maxHeight parameter');
    }
};

/** Attach DropDown component to specified input element */
DropDown.prototype.attachToInput = function (elem) {
    if (!this.isInputElement(elem)) {
        throw new Error('Invalid element specified');
    }

    // Create container
    this.containerElem = ce('div', { className: 'dd__container' });
    if (this.disabled) {
        this.containerElem.classList.add('dd__container_disabled');
    } else {
        this.containerElem.classList.add('dd__container_enabled');
    }

    this.selectionElem = ce('div', { className: 'dd__selection' });

    if (elem.tagName === 'SELECT') {
        this.selectElem = elem;
        if (elem.multiple) {
            this.multi = true;
        }

        if (elem.disabled) {
            this.disabled = true;
            this.editable = false;
        }

        insertAfter(this.containerElem, elem);
        this.inputElem = ce('input', { type: 'text' });
    } else {
        insertAfter(this.containerElem, elem);
        this.inputElem = re(elem);

        this.selectElem = ce('select');
        if (this.multi) {
            this.selectElem.multiple = true;
        }
    }

    if (this.editable) {
        this.containerElem.classList.add('dd__editable');
        this.inputElem.className = 'dd__input';
    } else {
        show(this.inputElem, false);
    }
};

/** Attach DropDown to specified element */
DropDown.prototype.attachToElement = function (elem) {
    var hostElement;

    this.containerElem = ce('div', { className: 'dd__container_attached', tabIndex: 0 });
    this.containerElem.addEventListener('keydown', this.keyHandler);
    this.assignFocusHandlers(this.containerElem);

    insertAfter(this.containerElem, elem);
    this.containerElem.style.width = px(elem.offsetWidth);
    this.containerElem.style.height = px(elem.offsetHeight);

    hostElement = re(elem);
    if (!hostElement) {
        return false;
    }
    this.containerElem.appendChild(hostElement);

    hostElement.addEventListener('click', this.toggleHandler);
    if (!this.isInputElement(elem)) {
        this.editable = false;
    }

    if (!this.disabled && this.staticElem) {
        this.staticElem.addEventListener('click', this.toggleHandler);
    }

    this.selectElem = ce('select');
    if (this.multi) {
        this.selectElem.multiple = true;
    }

    this.containerElem.appendChild(hostElement);
    this.containerElem.appendChild(this.selectElem);

    return true;
};

/**
 * Set callback for oninput event
 * @param {boolean|Function} cb
 *   if set as true: set default filter callback
 *   if set as function: set specified function as callback
 */
DropDown.prototype.setInputCallback = function (cb) {
    this.inputCallback = null;
    if (!cb) {
        this.inputCallback = null;
    } else if (cb === true) {
        this.inputCallback = this.defaultInputHandler;
    } else if (isFunction(cb)) {
        this.inputCallback = cb;
    } else {
        throw new Error('Invalid oninput handler specified');
    }
};

/** Create combo element and return if success */
DropDown.prototype.createCombo = function () {
    var res;

    if (this.listAttach || !this.inputElem) {
        return null;
    }

    // Create single selection element
    this.staticElem = ce('span', { className: 'dd__single-selection' });
    show(this.staticElem, !this.editable);

    this.toggleBtn = this.createToggleButton();

    res = ce('div', { className: 'dd__combo' });
    if (this.multi) {
        addChilds(res, this.selectionElem);
    }
    addChilds(res, [
        this.staticElem,
        this.inputElem,
        this.selectElem,
        this.list,
        this.toggleBtn
    ]);

    return res;
};

/** Create toggle drop down button */
DropDown.prototype.createToggleButton = function () {
    var arrowIcon = svg(
        'svg',
        { width: 24, height: 32 },
        svg('path', { d: 'm5.5 12 6.5 6 6.5-6z' })
    );
    var res = ce(
        'button',
        { type: 'button', className: 'dd__toggle-btn' },
        arrowIcon
    );
    if (this.editable) {
        res.tabIndex = -1;
    }
    res.addEventListener('click', this.toggleHandler);
    res.addEventListener('keydown', this.keyHandler);
    this.assignFocusHandlers(res);

    if (this.disabled) {
        res.disabled = true;
    }

    return res;
};

/* Event handlers */

/** List item 'click' event handler */
DropDown.prototype.onListItemClick = function (e) {
    var item = this.getItemByElem(e.target);
    if (item) {
        this.toggleItem(item.id);
    }

    this.sendItemSelectEvent();
    this.changed = true;

    if (!this.multi) {
        this.show(false);
    }

    return true;
};

/** Handler of 'change' event of native select */
DropDown.prototype.onChange = function () {
    if (
        !this.selectElem
        || !this.selectElem.options
        || this.selectElem.selectedIndex === -1
    ) {
        return;
    }

    this.items.forEach(function (item) {
        var listItem = item;

        if (!listItem.optionElem) {
            return;
        }

        listItem.selected = listItem.optionElem.selected;
    }, this);

    this.renderSelection();
    this.sendItemSelectEvent();

    this.changed = true;
};

/** 'focus' event handler */
DropDown.prototype.onFocus = function (e) {
    if (this.disabled) {
        return false;
    }

    this.activate(true);

    if (this.isSelectedItemElement(e.target)) {
        e.target.classList.add('dd__selection-item_active');
    } else if (e.target === this.inputElem) {
        this.activateSelectedItem(null);
    } else if (this.editable && this.inputElem) {
        this.inputElem.focus();
    }

    this.focusedElem = e.target;

    return true;
};

/** 'blur' event handler */
DropDown.prototype.onBlur = function (e) {
    if (!this.isChildTarget(e.relatedTarget)) {
        this.activate(false);
    }

    if (e.target === this.selectElem) {
        this.sendChangeEvent();
    } else if (this.isSelectedItemElement(e.target)) {
        e.target.classList.remove('dd__selection-item_active');
    }

    this.focusedElem = null;

    return true;
};

/** Click by delete button of selected item event handler */
DropDown.prototype.onDeleteSelectedItem = function (e) {
    var selectedItems;
    var index;
    var item;

    if (!e || !e.target || !this.multi) {
        return false;
    }

    if (e.type === 'keydown' && (
        !this.isSelectedItemElement(e.target)
        || !e.target.classList.contains('dd__selection-item_active')
    )) {
        return true;
    }

    if (e.type === 'click'
        && !e.target.classList.contains('dd__del-selection-item-btn')
    ) {
        return true;
    }

    selectedItems = this.getSelectedItems();
    if (!selectedItems.length) {
        return true;
    }

    index = this.getSelectedItemIndex(e.target);
    if (index === -1) {
        return true;
    }

    // Focus host input if deselect last(right) selected item
    // Activate next selected item otherwise
    if (index === selectedItems.length - 1) {
        this.activateSelectedItem(null);
        setTimeout(this.inputElem.focus.bind(this.inputElem));
    } else {
        this.activateSelectedItem(selectedItems[index + 1]);
    }

    item = selectedItems[index];
    if (item) {
        this.deselectItem(item.id);
    }

    this.sendItemSelectEvent();
    this.changed = true;
    this.sendChangeEvent();

    return true;
};

/** 'scroll' event of list element handler */
DropDown.prototype.onScroll = function () {
    if (!this.blockScroll) {
        this.setActive(null);
    }

    this.blockScroll = false;
};

/** 'keydown' event handler */
DropDown.prototype.onKey = function (e) {
    var cursorPos;
    var index;
    var item;
    var newItem = null;
    var selectedItems = null;
    var availItems = null;

    if (
        (this.editable && e.target === this.inputElem)
        || (!this.editable && e.target === this.toggleBtn)
    ) {
        if (e.code === 'Backspace' || e.code === 'ArrowLeft') {
            if (this.editable) {
                cursorPos = getCursorPos(this.inputElem);
                if (cursorPos.start === cursorPos.end && cursorPos.start === 0) {
                    this.activateLastSelectedItem();
                }
            } else {
                this.activateLastSelectedItem();
            }

            return true;
        }
    }

    if (e.code === 'Backspace') {
        if (this.isSelectedItemElement(e.target)) {
            selectedItems = this.getSelectedItems();
            if (!selectedItems.length) {
                return true;
            }

            index = this.getSelectedItemIndex(e.target);
            if (index === -1) {
                return true;
            }

            if (index === 0) {
                // Activate first selected item if available or focus host input otherwise
                if (selectedItems.length > 1) {
                    this.activateSelectedItem(selectedItems[1]);
                } else {
                    this.activateSelectedItem(null);
                    setTimeout(this.inputElem.focus.bind(this.inputElem));
                }
            } else {
                // Activate previous selected item
                this.activateSelectedItem(selectedItems[index - 1]);
            }

            item = selectedItems[index];
            if (item) {
                this.deselectItem(item.id);
            }
        }

        return true;
    }

    if (e.code === 'Delete') {
        return this.onDeleteSelectedItem(e);
    }

    if (e.code === 'ArrowLeft') {
        if (this.isSelectedItemElement(e.target)) {
            selectedItems = this.getSelectedItems();
            if (!selectedItems.length) {
                return true;
            }

            index = this.getSelectedItemIndex(e.target);
            if (index === 0) {
                return true;
            }

            this.activateSelectedItem(selectedItems[index - 1]);
        }

        return true;
    }

    if (e.code === 'ArrowRight') {
        if (this.isSelectedItemElement(e.target)) {
            selectedItems = this.getSelectedItems();
            if (!selectedItems.length) {
                return true;
            }

            index = this.getSelectedItemIndex(e.target);
            if (index === -1) {
                return true;
            }

            if (index === selectedItems.length - 1) {
                this.activateSelectedItem(null);
                setTimeout(this.inputElem.focus.bind(this.inputElem));
            } else {
                this.activateSelectedItem(selectedItems[index + 1]);
            }
        }

        return true;
    }

    if (e.code === 'ArrowDown') {
        availItems = this.getAvailableItems();

        if (!this.visible && !this.actItem) {
            this.show(true);
            newItem = availItems[0];
        } else if (this.visible) {
            if (this.actItem) {
                newItem = this.getNextAvailableItem(this.actItem.id);
            } else {
                newItem = availItems[0];
            }
        }
    } else if (e.code === 'ArrowUp') {
        if (this.visible && this.actItem) {
            newItem = this.getPrevAvailableItem(this.actItem.id);
        }
    } else if (e.code === 'Home') {
        availItems = this.getAvailableItems();
        if (availItems.length > 0) {
            newItem = availItems[0];
        }
    } else if (e.code === 'End') {
        availItems = this.getAvailableItems();
        if (availItems.length > 0) {
            newItem = availItems[availItems.length - 1];
        }
    } else if (e.code === 'Enter') {
        if (this.actItem) {
            this.toggleItem(this.actItem.id);
            this.sendItemSelectEvent();
            this.changed = true;

            if (!this.multi) {
                this.show(false);
            }
        }
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    } else if (e.code === 'Escape') {
        this.show(false);
        if (this.focusedElem) {
            this.focusedElem.blur();
        }
        return true;
    } else {
        return true;
    }

    if (newItem) {
        this.setActive(newItem);
        this.scrollToItem(newItem);
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    }

    return true;
};

/** Handler for 'mouseover' event on list item */
DropDown.prototype.onMouseOver = function (e) {
    var item;

    if (this.blockScroll) {
        return;
    }

    item = this.getItemByElem(e.target);
    if (!item) {
        return;
    }

    this.setActive(item);
};

/** Handler for 'input' event of text field  */
DropDown.prototype.onInput = function () {
    if (isFunction(this.inputCallback)) {
        return this.inputCallback.call(this);
    }

    return true;
};

/* List items methods */

/** Return list item object by id */
DropDown.prototype.getItem = function (itemId) {
    return this.items.find(function (item) {
        return item.id === itemId;
    });
};

/** Return index of list item by id */
DropDown.prototype.getItemIndex = function (itemId) {
    return this.items.findIndex(function (item) {
        return item.id === itemId;
    });
};

/**
 * Return previous list item to specified by id
 * @returns null in case specified list item is not found or on first position
 * @param {number} itemId - identifier of item to start looking from
 */
DropDown.prototype.getPrevItem = function (itemId) {
    var ind = this.getItemIndex(itemId);
    if (ind === -1) {
        return null;
    }

    if (ind > 0) {
        return this.items[ind - 1];
    }

    return null;
};

/**
 * Return next list item to specified by id
 * @returns null in case specified list item is not found or on last position
 * @param {number} itemId - identifier of item to start looking from
 */
DropDown.prototype.getNextItem = function (itemId) {
    var ind = this.getItemIndex(itemId);
    if (ind === -1) {
        return null;
    }

    if (ind < this.items.length) {
        return this.items[ind + 1];
    }

    return null;
};

/** Return array of visible(not hidden) list items */
DropDown.prototype.getVisibleItems = function () {
    return this.items.filter(function (item) {
        return !item.hidden;
    });
};

/** Return array of visible and enabled list items */
DropDown.prototype.getAvailableItems = function () {
    return this.items.filter(function (item) {
        return !item.hidden && !item.hidden;
    });
};

/**
 * Return list item available to select prior to specified item
 * @returns null in case specified list item is not found or on first position
 * @param {number} itemId - identifier of item to start looking from
 */
DropDown.prototype.getPrevAvailableItem = function (itemId) {
    var item = this.getItem(itemId);

    while (item) {
        item = this.getPrevItem(item.id);
        if (item && !item.hidden && !item.disabled) {
            return item;
        }
    }

    return null;
};

/**
 * Return list item available to select next to specified item
 * @returns null in case specified list item is not found or on last position
 * @param {number} itemId - identifier of item to start looking from
 */
DropDown.prototype.getNextAvailableItem = function (itemId) {
    var item = this.getItem(itemId);

    while (item) {
        item = this.getNextItem(item.id);
        if (item && !item.hidden && !item.disabled) {
            return item;
        }
    }

    return null;
};

/** Return array of selected items */
DropDown.prototype.getSelectedItems = function () {
    return this.items.filter(function (item) {
        return item && item.selected;
    });
};

/** Return list item object which list element contains specified element */
DropDown.prototype.getItemByElem = function (elem) {
    if (!elem) {
        return null;
    }

    return this.items.find(function (item) {
        return item && item.elem.contains(elem);
    });
};

/** Return count of items to show at drop down list */
DropDown.prototype.getListHeight = function () {
    return Math.min(
        this.maxHeight,
        (this.filtered) ? this.filteredCount : this.items.length
    );
};

/** Show or hide drop down list */
DropDown.prototype.show = function (val) {
    var screenBottom;
    var visibleItems;
    var itemHeight;
    var itemsToShow;
    var listHeight;
    var fullScreenListHeight;
    var containerOffset;
    var totalListHeight;
    var listWidth;
    var leftOffset;
    var listBottom;

    if (isVisible(this.selectElem)) {
        return;
    }

    if (!this.list) {
        return;
    }

    this.visible = val;

    if (val) {
        if (!this.editable && this.toggleBtn) {
            this.toggleBtn.focus();
        }
        this.activate(true);

        screenBottom = document.documentElement.scrollTop
            + document.documentElement.clientHeight;

        this.containerElem.classList.add('dd__open');

        visibleItems = this.getVisibleItems();
        if (visibleItems.length > 0) {
            itemHeight = parseInt(visibleItems[0].elem.offsetHeight, 10);
            itemsToShow = this.getListHeight();
            listHeight = itemsToShow * itemHeight;
        }

        containerOffset = getOffset(this.containerElem);
        totalListHeight = this.containerElem.offsetHeight + listHeight;
        listBottom = containerOffset.top + totalListHeight;

        if (this.fullScreen && isVisible(this.backgroundElem)) {
            document.body.style.overflow = 'hidden';
            this.list.classList.add('dd__list_drop-down');

            fullScreenListHeight = document.documentElement.clientHeight
                - this.comboElem.offsetHeight;
            this.list.style.height = px(fullScreenListHeight / 2);
        } else {
            this.list.style.height = px(listHeight);

            // Check vertical offset of drop down list
            if (listBottom > document.documentElement.scrollHeight) {
                this.list.classList.remove('dd__list_drop-down');
                this.list.classList.add('dd__list_drop-up');

                if (this.listAttach) {
                    this.list.style.bottom = px(this.containerElem.offsetHeight);
                    this.list.style.top = '';
                }
            } else {
                this.list.classList.remove('dd__list_drop-up');
                this.list.classList.add('dd__list_drop-down');

                if (listBottom > screenBottom) {
                    document.documentElement.scrollTop += listBottom - screenBottom;
                }

                if (this.listAttach) {
                    this.list.style.top = px(this.containerElem.offsetHeight);
                    this.list.style.bottom = '';
                }
            }
        }

        // Check horizontal offset of drop down list
        listWidth = this.list.offsetWidth;
        leftOffset = containerOffset.left - document.documentElement.scrollLeft
            + this.containerElem.offsetWidth;
        if (leftOffset + listWidth > document.documentElement.clientWidth) {
            this.list.classList.remove('dd__list_drop-right');
            this.list.classList.add('dd__list_drop-left');
        } else {
            this.list.classList.remove('dd__list_drop-left');
            this.list.classList.add('dd__list_drop-right');
        }

        setEmptyClick(
            this.show.bind(this, false),
            [this.inputElem, this.staticElem, this.list, this.toggleBtn]
        );

        if (this.editable) {
            this.inputElem.focus();
        }
        this.list.scrollTop = 0;
    } else {
        this.containerElem.classList.remove('dd__open');
        if (this.fullScreen) {
            document.body.style.overflow = '';
        }

        setEmptyClick();
        this.sendChangeEvent();
        this.setActive(null);
    }
};

/** Enable/disable text input at combo element  */
DropDown.prototype.makeEditable = function (val) {
    var editable;

    if (this.listAttach) {
        return false;
    }

    editable = (typeof val !== 'undefined') ? val : true;
    if (editable && this.disabled) {
        return true;
    }

    this.editable = val;

    if (this.placeholder) {
        this.inputElem.placeholder = this.placeholder;
    }

    show(this.staticElem, !this.editable);
    show(this.inputElem, this.editable);

    if (this.editable) {
        this.inputElem.addEventListener('input', this.inputHandler);
        this.inputElem.classList.add('dd__input');
        this.inputElem.value = this.staticElem.textContent;
        this.assignFocusHandlers(this.inputElem);
        this.inputElem.addEventListener('keydown', this.keyHandler);
        this.inputElem.autocomplete = 'off';

        this.toggleBtn.tabIndex = -1;
    } else {
        this.inputElem.removeEventListener('input', this.inputHandler);
        this.inputElem.classList.remove('dd__input');

        this.staticElem.textContent = (this.placeholder && this.inputElem.value.length === 0)
            ? this.placeholder
            : this.inputElem.value;
        if (!this.disabled) {
            this.staticElem.addEventListener('click', this.toggleHandler);
        }

        this.toggleBtn.tabIndex = 0;
    }

    return true;
};

/** Enable or disable component */
DropDown.prototype.enable = function (val) {
    var toEnable = (typeof val !== 'undefined') ? val : true;
    if (toEnable !== this.disabled) {
        return;
    }

    this.disabled = !toEnable;

    if (this.disabled) {
        this.containerElem.classList.add('dd__container_disabled');
        this.containerElem.classList.remove('dd__container_enabled');
        this.makeEditable(false);
    } else {
        this.containerElem.classList.remove('dd__container_disabled');
        this.containerElem.classList.add('dd__container_enabled');
        if (this.createParams.editable !== false) {
            this.makeEditable();
        }
    }

    this.inputElem.disabled = this.disabled;
    this.selectElem.disabled = this.disabled;
    this.toggleBtn.disabled = this.disabled;
};

/** Show drop down list if hidden or hide if visible */
DropDown.prototype.toggleList = function () {
    if (!this.list || !this.listElem || this.disabled) {
        return;
    }

    if (!this.visible && this.filtered && !this.manFilter) {
        this.items.forEach(function (item) {
            var listItem = item;

            listItem.hidden = false;
            show(listItem.elem, true);
            this.showOption(listItem.optionElem, true);
        }, this);

        this.filtered = false;
    }

    this.show(!this.visible);
};

/** Activate or deactivate component */
DropDown.prototype.activate = function (val) {
    if (val) {
        this.containerElem.classList.add('dd__container_active');
    } else {
        this.containerElem.classList.remove('dd__container_active');
        this.show(false);
    }
};

/** Check specified element is child of some selected item element */
DropDown.prototype.isSelectedItemElement = function (elem) {
    return elem
        && Array.isArray(this.selectedElems)
        && this.selectedElems.find(function (selem) {
            return selem.contains(elem);
        });
};

/** Check specified element is child of component */
DropDown.prototype.isChildTarget = function (elem) {
    return elem && this.containerElem.contains(elem);
};

/** Return selected item element for specified item object */
DropDown.prototype.renderSelectedItem = function (item) {
    var deselectButton = ce(
        'span',
        { className: 'dd__del-selection-item-btn', innerHTML: '&times;' }
    );
    deselectButton.addEventListener('click', this.delSelectItemHandler);

    return ce(
        'span',
        { className: 'dd__selection-item', textContent: item.title },
        deselectButton
    );
};

/** Render selection elements */
DropDown.prototype.renderSelection = function () {
    var renderCallback;
    var selectedItems = this.getSelectedItems();

    if (!this.multi) {
        if (selectedItems.length) {
            this.setText(selectedItems[0].title);
        } else {
            this.setText('');
        }

        return;
    }

    renderCallback = isFunction(this.renderItem) ? this.renderItem : this.renderSelectedItem;
    this.selectedElems = selectedItems.map(function (item) {
        var listItem = item;
        var elem = renderCallback.call(this, listItem);
        if (!elem) {
            return null;
        }

        elem.tabIndex = -2;
        elem.dataset.id = listItem.id;
        elem.addEventListener('keydown', this.keyHandler);
        this.assignFocusHandlers(elem);

        listItem.selectedElem = elem;

        return elem;
    }, this);

    removeChilds(this.selectionElem);
    addChilds(this.selectionElem, this.selectedElems);

    if (this.actSelItem && !this.disabled) {
        this.actSelItem.selectedElem.focus();
    }
};

/** Deselect all items */
DropDown.prototype.clearSelection = function () {
    this.items.forEach(function (item) {
        var listItem = item;

        listItem.selected = false;
    });
};

/** Return selected items data for 'itemselect' and 'change' events */
DropDown.prototype.getSelectionData = function () {
    var selectedItems = this.getSelectedItems()
        .map(function (item) {
            return { id: item.id, value: item.title };
        });

    if (this.multi) {
        return selectedItems;
    }

    return (selectedItems.length > 0) ? selectedItems[0] : null;
};

/** Send current selection data to 'itemselect' event handler */
DropDown.prototype.sendItemSelectEvent = function () {
    var data;

    if (isFunction(this.itemSelectCallback)) {
        data = this.getSelectionData();
        this.itemSelectCallback.call(this, data);
    }
};

/**
 * Send current selection data to 'change' event handler
 * 'change' event occurs after user finnished selection of item(s) and list was hidden
 */
DropDown.prototype.sendChangeEvent = function () {
    var data;

    if (!this.changed) {
        return;
    }

    if (isFunction(this.changeCallback)) {
        data = this.getSelectionData();
        this.changeCallback.call(this, data);
    }

    this.saveResult();

    this.changed = false;
};

/** Save current selection data to result target element if exist */
DropDown.prototype.saveResult = function () {
    var selectedItems;

    if (!this.resultTarget) {
        return;
    }

    if (this.multi && this.resultTarget.multiple) {
        this.items.forEach(function (item) {
            selectByValue(this.resultTarget, item.id, item.selected);
        }, this);
    } else {
        selectedItems = this.getSelectedItems();
        if (Array.isArray(selectedItems) && selectedItems.length > 0) {
            this.resultTarget.value = selectedItems[0].id;
        } else {
            this.resultTarget.value = '';
        }
    }
};

/** Toggle item selected status */
DropDown.prototype.toggleItem = function (itemId) {
    var item = this.getItem(itemId);
    if (!item) {
        throw new Error('Item ' + itemId + ' not found');
    }

    if (item.selected && this.multi) {
        return this.deselectItem(itemId);
    }

    return this.selectItem(itemId);
};

/** Select specified item */
DropDown.prototype.selectItem = function (itemId) {
    var item = this.getItem(itemId);
    if (!item) {
        throw new Error('Item ' + itemId + ' not found');
    }

    if (item.selected) {
        return;
    }

    if (this.multi) {
        this.check(item.id, true);
    } else {
        this.clearSelection();
    }

    if (this.selectElem) {
        selectByValue(this.selectElem, item.id);
    }
    if (this.resultTarget) {
        selectByValue(this.resultTarget, item.id);
    }

    item.selected = true;

    this.renderSelection();
};

/** Deselect specified item */
DropDown.prototype.deselectItem = function (itemId) {
    var item = this.getItem(itemId);
    if (!item) {
        throw new Error('Item ' + itemId + ' not found');
    }

    if (!item.selected) {
        return;
    }

    if (this.multi) {
        this.check(itemId, false);
        selectByValue(this.selectElem, itemId, false);
        if (this.resultTarget) {
            selectByValue(this.resultTarget, itemId, false);
        }
    } else {
        selectByValue(this.selectElem, 0);
        if (this.resultTarget) {
            selectByValue(this.resultTarget, 0);
        }
    }

    item.selectedElem = null;
    item.selected = false;

    this.renderSelection();
};

/** Return index of selected item contains specified element */
DropDown.prototype.getSelectedItemIndex = function (elem) {
    var selectedItems = this.getSelectedItems();
    if (!Array.isArray(selectedItems)) {
        return -1;
    }

    return selectedItems.findIndex(function (item) {
        return item.selectedElem.contains(elem);
    });
};

/** Activate specified selected item */
DropDown.prototype.activateSelectedItem = function (item) {
    if (!item) {
        this.actSelItem = null;
        return;
    }

    if (this.disabled || !item.selected) {
        return;
    }

    this.actSelItem = item;
    this.actSelItem.selectedElem.focus();
};

/** Activate last(right) selected item */
DropDown.prototype.activateLastSelectedItem = function () {
    var selectedItems = this.getSelectedItems();
    if (!selectedItems.length) {
        return;
    }

    this.activateSelectedItem(selectedItems[selectedItems.length - 1]);
};

/** Filter input handler */
DropDown.prototype.defaultInputHandler = function () {
    var found;

    if (!this.inputElem) {
        return false;
    }

    found = this.filter(this.inputElem.value);
    this.show(found);

    return true;
};

/** Show/hide specified option element */
DropDown.prototype.showOption = function (option, val) {
    var parent;
    var toShow;
    var visible;
    var wrapper;

    if (!option || !option.parentNode) {
        return;
    }

    parent = option.parentNode;
    toShow = (typeof val !== 'undefined') ? val : true;

    visible = !parent.classList.contains('dd__opt-wrapper');
    if (visible === toShow) {
        return;
    }

    if (toShow) {
        insertAfter(option, parent);
        re(parent);
    } else {
        wrapper = ce('div', { className: 'dd__opt-wrapper' });
        insertAfter(wrapper, option);
        wrapper.appendChild(option);
    }
};

/** Show only items containing specified string */
DropDown.prototype.filter = function (fstr) {
    var found = false;
    var lfstr = fstr.toLowerCase();

    this.filteredCount = 0;

    if (lfstr.length === 0) {
        this.items.forEach(function (item) {
            var listItem = item;

            listItem.hidden = false;
            show(listItem.elem, true);
            this.showOption(listItem.optionElem, true);
        }, this);

        this.filtered = false;
    } else {
        this.items.forEach(function (item) {
            var listItem = item;
            var ival = item.title.toLowerCase();
            var match = ival.includes(lfstr, 0);
            if (match) {
                this.filteredCount += 1;
            }

            listItem.hidden = !match;
            show(listItem.elem, match);
            this.showOption(listItem.optionElem, match);
            found = (found || match);

            if (found) {
                this.filtered = true;
            }
        }, this);
    }

    return found;
};

/**
 * Add or remove check mark for specified item
 * @param {number} itemId - identifier of item
 * @param {boolean} val - if set to true check mark will be added, and removed otherwise
 */
DropDown.prototype.check = function (itemId, val) {
    var item;

    if (!this.multi) {
        return false;
    }

    item = this.getItem(itemId);
    if (!item || !item.divElem) {
        return false;
    }

    if (val) {
        item.divElem.classList.add('dd__list-item_selected');
    } else {
        item.divElem.classList.remove('dd__list-item_selected');
    }

    return true;
};

/**
 * Fix multiple select issues on iOS safari
 * @param {Element} elem - select element
 */
DropDown.prototype.fixIOS = function (elem) {
    var firstElement;
    var optgroup;

    if (!elem || elem.tagName !== 'SELECT' || !this.multi) {
        return;
    }

    firstElement = elem.firstElementChild;
    if (
        firstElement
        && firstElement.tagName === 'OPTGROUP'
        && firstElement.hidden
        && firstElement.disabled
    ) {
        return;
    }

    optgroup = ce('optgroup', { hidden: true, disabled: true });
    prependChild(elem, optgroup);
};

/**
 * Parse specified option element and create new list item
 * @returns {Object|null} result list item object
 * @param {Element} option - option element to parse
 * @param {Object|null} group - option group object
 */
DropDown.prototype.parseOption = function (option, group) {
    var item;
    var itemId;
    var title;
    var groupObj;

    if (!option) {
        return false;
    }
    groupObj = (typeof group !== 'undefined') ? group : null;

    itemId = option.value;
    title = option.textContent;

    item = this.addItem({
        id: itemId,
        title: title,
        group: groupObj,
        appendToSelect: false
    });
    if (!item) {
        return false;
    }

    item.optionElem = option;
    if (option.selected) {
        item.selected = true;
        if (this.multi) {
            this.check(item.id, true);
        }
    }

    if (option.disabled) {
        this.enableItem(item, false);
    }

    return item;
};

/** Parse select element and create list items from child options */
DropDown.prototype.parseSelect = function (elem) {
    var childElem;
    var group;
    var groupChild;
    var i;
    var l;
    var ci;
    var cl;

    if (!elem || elem.tagName !== 'SELECT' || !elem.options) {
        return false;
    }

    for (i = 0, l = elem.children.length; i < l; i += 1) {
        childElem = elem.children[i];
        if (childElem.tagName === 'OPTGROUP') {
            group = this.addGroup(childElem.label);
            if (!group) {
                return false;
            }

            for (ci = 0, cl = childElem.children.length; ci < cl; ci += 1) {
                groupChild = childElem.children[ci];
                if (!this.parseOption(groupChild, group)) {
                    return false;
                }
            }

            if (group.listElem.children.length > 0) {
                this.listElem.appendChild(group.elem);
            }
        } else if (childElem.tagName === 'OPTION') {
            if (!this.parseOption(childElem, null)) {
                return false;
            }
        }
    }

    this.saveResult();
    this.renderSelection();

    return true;
};

/**
 * Append new item(s) to the end of list
 * @param {Object|Object[]} items
 */
DropDown.prototype.append = function (items) {
    var data;

    if (!items || !this.list || !this.listElem) {
        return false;
    }

    data = Array.isArray(items) ? items : [items];
    data.forEach(function (item) {
        this.addItem({
            id: item.id,
            title: item.title,
            appendToSelect: true
        });
    }, this);

    return true;
};

/** Append option to specified target element */
DropDown.prototype.addOption = function (target, itemId, title) {
    var option;
    var availTargets = ['SELECT', 'OPTGROUP'];

    if (!target || !availTargets.includes(target.tagName)) {
        return null;
    }

    option = ce('option', { value: itemId, textContent: title });
    target.appendChild(option);

    return option;
};

/** Append option group to specified target element */
DropDown.prototype.addOptGroup = function (target, groupTitle, groupDisabled) {
    var optGroup;
    var disabled;

    if (!target || target.tagName !== 'SELECT') {
        return null;
    }

    disabled = (typeof groupDisabled !== 'undefined') ? groupDisabled : false;

    optGroup = ce('optgroup', { label: groupTitle, disabled: disabled });
    target.appendChild(optGroup);

    return optGroup;
};

/**
 * Create new list item
 * @param {Object} props
 * @param {string} props.id - identifier of new list item
 * @param {string} props.group - optional target group identifier
 * @param {string} props.title - title of list item
 * @param {bool} props.appendToSelect - append new item to select element or not
 */
DropDown.prototype.addItem = function (props) {
    var item;
    var appendToSelect = true;

    if (!props || !props.id || !this.list || !this.listElem) {
        return null;
    }

    item = {
        id: props.id,
        title: props.title,
        selected: false,
        hidden: false,
        disabled: false
    };

    if ('appendToSelect' in props) {
        appendToSelect = !!props.appendToSelect;
    }

    if (appendToSelect && !this.multi && !this.items.length) {
        this.selectElem.appendChild(ce('option', { disabled: true, value: 0, selected: true }));
    }

    item.divElem = ce('div', { className: 'dd__list-item' });
    if (this.multi) {
        item.checkIcon = svg(
            'svg',
            { width: 17, height: 17, viewBox: '0 1 10 10' },
            svg('path', { d: CHECK_ICON })
        );
        item.divElem.appendChild(item.checkIcon);

        item.titleElem = ce('span', { title: item.title, textContent: item.title });
        item.divElem.appendChild(item.titleElem);
    } else {
        item.divElem.title = item.title;
        item.divElem.textContent = item.title;
    }

    item.divElem.addEventListener('mouseover', this.hoverHandler);

    item.elem = ce('li', {}, item.divElem);
    item.elem.addEventListener('click', this.listItemClickHandler);

    if (props.group) {
        props.group.listElem.appendChild(item.elem);
        item.group = props.group;
    } else {
        this.listElem.appendChild(item.elem);
        item.group = null;
    }

    if (appendToSelect) {
        item.optionElem = this.addOption(this.selectElem, item.id, item.title);
    }
    item.resOptionElem = this.addOption(this.resultTarget, item.id, item.title);
    this.items.push(item);

    return item;
};

/**
 * Create new group
 * @param {string} label
 * @param {boolean} appendToSelect - if true optgroup element will be appended to select element
 */
DropDown.prototype.addGroup = function (label, appendToSelect) {
    var group;
    var toAppend;

    if (!this.list || !this.listElem) {
        return null;
    }

    group = {
        title: label,
        disabled: false
    };

    toAppend = (typeof appendToSelect !== 'undefined') ? appendToSelect : true;

    group.labelElem = ce('label', { textContent: group.title });
    group.listElem = ce('ul');
    group.elem = ce(
        'div',
        { className: 'dd__list-group' },
        [
            group.labelElem,
            group.listElem
        ]
    );

    if (toAppend) {
        group.optGroupElem = this.addOptGroup(this.selectElem, group.title);
    }

    this.groups.push(group);

    return group;
};

/** Set active state for specified list item */
DropDown.prototype.setActive = function (item) {
    var listItem = item;

    if (this.actItem) {
        this.actItem.divElem.classList.remove('dd__list-item_active');
        this.actItem = null;
    }

    if (this.blockScroll) {
        return;
    }

    if (!listItem || !this.items.length) {
        return;
    }

    listItem.divElem.classList.add('dd__list-item_active');
    this.actItem = listItem;

    if (this.editable) {
        this.inputElem.focus();
    }
};

/** Enable/disable specified list item */
DropDown.prototype.enableItem = function (item, val) {
    var listItem = item;

    if (!item || item.disabled === !val) {
        return;
    }

    if (this.actItem === listItem) {
        this.actItem.divElem.classList.remove('dd__list-item_active');
        this.actItem = null;
    }

    listItem.disabled = !val;
    if (listItem.disabled) {
        this.deselectItem(listItem.id);

        listItem.elem.setAttribute('disabled', true);
        listItem.optionElem.setAttribute('disabled', true);
        if (listItem.resOptionElem) {
            listItem.resOptionElem.setAttribute('disabled', true);
        }
    } else {
        listItem.elem.removeAttribute('disabled');
        listItem.optionElem.removeAttribute('disabled');
        if (listItem.resOptionElem) {
            listItem.resOptionElem.removeAttribute('disabled');
        }
    }
};

/** Scrol list element until specified list item be fully visible */
DropDown.prototype.scrollToItem = function (item) {
    var itemTop;
    var itemBottom;
    var listTop;
    var listHeight;
    var listBottom;

    if (
        !this.visible
        || !item /* drop down list must be visible */
        || item.hidden /* item must exist and be visible */
    ) {
        return;
    }

    itemTop = item.elem.offsetTop;
    itemBottom = itemTop + item.elem.offsetHeight;
    listTop = this.list.scrollTop;
    listHeight = this.list.clientHeight;
    listBottom = listTop + listHeight;

    if (itemTop < listTop) {
        /* scroll up : decrease scroll top */
        this.blockScroll = true;
        this.list.scrollTop = Math.min(this.list.scrollHeight, itemTop);
    } else if (itemBottom > listBottom) {
        /* scroll down : increase scroll top */
        this.blockScroll = true;
        this.list.scrollTop = Math.min(this.list.scrollHeight, listTop + itemBottom - listBottom);
    }

    setTimeout(function () {
        this.blockScroll = false;
    }.bind(this), 200);
};

/** Check specified element is in input elements group */
DropDown.prototype.isInputElement = function (elem) {
    var inputTags = ['INPUT', 'SELECT', 'TEXTAREA'];

    return elem && inputTags.includes(elem.tagName);
};

/** Return current filtered flag */
DropDown.prototype.isFiltered = function () {
    return this.filtered;
};

/** Set text for single selection */
DropDown.prototype.setText = function (str) {
    if (typeof str !== 'string') {
        return;
    }

    if (str.length > 0) {
        if (this.editable && this.inputElem) {
            this.inputElem.value = str;
        } else if (!this.editable && this.staticElem) {
            this.staticElem.textContent = str;
            this.staticElem.title = str;
            this.staticElem.classList.remove('dd__single-selection_placeholder');
        }
    } else {
        this.staticElem.textContent = this.placeholder;
        this.staticElem.title = '';
        this.staticElem.classList.add('dd__single-selection_placeholder');
    }
};

/** Add focus/blur event handlers to specified element */
DropDown.prototype.assignFocusHandlers = function (elem) {
    if (!elem) {
        return;
    }

    elem.addEventListener('focus', this.focusHandler);
    elem.addEventListener('blur', this.blurHandler);
};
