// Sortable drag zone
function SortableDragZone(elem, params)
{
	SortableDragZone.parent.constructor.apply(this, arguments);

	this._sortTarget = null;
}

extend(SortableDragZone, DragZone);

SortableDragZone.prototype._makeAvatar = function()
{
	if (this._params.table)
		return new SortableTableDragAvatar(this, this._elem);
	else
		return new SortableDragAvatar(this, this._elem);
}


// Drag start handler
// Return avatar object or false
SortableDragZone.prototype.onDragStart = function(downX, downY, event)
{
	var avatar = SortableDragZone.parent.onDragStart.apply(this, arguments);

	if (!avatar)
		return false;

	if (this._params && isFunction(this._params.ondragstart))
		this._params.ondragstart(this._elem);

	return avatar;
};


// Find specific drag zone element
SortableDragZone.prototype.findDragZoneItem = function(target)
{
	if (!this._params || !this._params.selector)
		return null;

	var el = target;

	while(el && el != this._elem)
	{
		if (isFunction(el.matches) && el.matches(this._params.selector))
			return el;
		el = el.parentNode;
	}

	return null;
};


// Check specified targer element is valid
SortableDragZone.prototype.isValidDragHandle = function(target)
{
	if (!target)
		return false;

	// allow to drag using whole drag zone in case no handles is set
	if (!this._params || !this._params.onlyRootHandle)
		return SortableDragZone.parent.isValidDragHandle.apply(this, arguments);

	var item = this.findDragZoneItem(target);

	return this._params.onlyRootHandle && target == item;
}


// Return group of sortable
SortableDragZone.prototype.getGroup = function()
{
	if (this._params && this._params.group)
		return this._params.group;
	return null;
}


// Return class for placeholder element
SortableDragZone.prototype.getPlaceholder = function()
{
	if (this._params && this._params.placeholderClass)
		return this._params.placeholderClass;
	return null;
}


// Return class for item element
SortableDragZone.prototype.getItemSelector = function()
{
	if (this._params && this._params.selector)
		return this._params.selector;
	return null;
}


// Return class for drag avatar element
SortableDragZone.prototype.getDragClass = function()
{
	if (this._params && this._params.dragClass)
	{
		return (this._params.dragClass === true) ? 'drag' : this._params.dragClass;
	}

	return null;
}


// Insert event handler
SortableDragZone.prototype.onInsertAt = function(srcElem, elem)
{
	if (this._params && isFunction(this._params.oninsertat))
		this._params.oninsertat(srcElem, elem);
}


// Sortable drag avatar
function SortableDragAvatar(dragZone, dragElem)
{
	SortableDragAvatar.parent.constructor.apply(this, arguments);
}

extend(SortableDragAvatar, DragAvatar);


SortableDragAvatar.prototype.initFromEvent = function(downX, downY, e)
{
// Overwrite drag zone here to find exact item to manipulate
	this._dragZoneElem = this._dragZone.findDragZoneItem(e.target);
	if (!this._dragZoneElem)
		return false;

	this._initialPos = this.getSortPosition();
	var elem = this._elem = this._dragZoneElem.cloneNode(true);

	var offset = getOffset(this._dragZoneElem);
	this._shiftX = downX - offset.left;
	this._shiftY = downY - offset.top;

	this._dragZoneElem.classList.add(this._dragZone.getPlaceholder());

	if (this._dragZone._params.copyWidth)
	{
		var quirks = !elem.style.getPropertyValue;		// IE < 9
		if (quirks)
		{
			elem.style.cssText += ';width: ' + px(this._dragZoneElem.offsetWidth) + '!important';
		}
		else
		{
			elem.style.setProperty('width', px(this._dragZoneElem.offsetWidth), 'important');
		}
	}

	document.body.appendChild(elem);
	elem.style.zIndex = 9999;
	elem.style.position = 'absolute';

	elem.classList.add(this._dragZone.getDragClass());

	return true;
}


SortableDragAvatar.prototype._destroy = function()
{
	re(this._elem);

	this._dragZoneElem.classList.remove(this._dragZone.getPlaceholder());
};


SortableDragAvatar.prototype.onDragCancel = function()
{
	this._destroy();
};


SortableDragAvatar.prototype.onDragEnd = function()
{
	this._destroy();
};


SortableDragAvatar.prototype.saveSortTarget = function(dropTarget)
{
	this._sortTarget = dropTarget;
};


SortableDragAvatar.prototype.getSortPosition = function()
{
	return {
		prev : this._dragZoneElem.previousElementSibling,
		next : this._dragZoneElem.nextElementSibling
	};
};


// Return drag information object for DropTarget
SortableDragAvatar.prototype.getDragInfo = function(event)
{
	return {
		elem : this._elem,
		dragZoneElem : this._dragZoneElem,
		dragZone : this._dragZone,
		mouseShift : { x : this._shiftX, y : this._shiftY },
		sortTarget : this._sortTarget,
		initialPos : this._initialPos
	};
};


// Sortable table drag avatar
function SortableTableDragAvatar(dragZone, dragElem)
{
	SortableTableDragAvatar.parent.constructor.apply(this, arguments);
}

extend(SortableTableDragAvatar, SortableDragAvatar);


SortableTableDragAvatar.prototype.initFromEvent = function(downX, downY, e)
{
	var elem;

	this._dragZoneElem = this._dragZone.findDragZoneItem(e.target);
	if (!this._dragZoneElem)
		return false;

	this._initialPos = this.getSortPosition();
	var tbl = this._dragZoneElem.closest('table').cloneNode(false);
	tbl.appendChild(this._dragZoneElem.cloneNode(true));

	elem = this._elem = tbl;

	var offset = getOffset(this._dragZoneElem);
	this._shiftX = downX - offset.left;
	this._shiftY = downY - offset.top;

	if (this._dragZone._params.copyWidth)
	{
		var srcCell, destCell, tmp;

		srcCell = this._dragZoneElem.querySelector('td');
		destCell = tbl.querySelector('td');
		while(srcCell && destCell)
		{
			tmp = destCell.firstElementChild;

			tmp.style.width = px(srcCell.offsetWidth);

			srcCell = srcCell.nextElementSibling;
			destCell = destCell.nextElementSibling;
		}

		elem.style.width = px(this._dragZoneElem.offsetWidth);
	}

	this._dragZoneElem.classList.add(this._dragZone.getPlaceholder());

	document.body.appendChild(elem);
	elem.style.zIndex = 9999;
	elem.style.position = 'absolute';

	return true;
}


// Sortable drop target
function SortableDropTarget(elem)
{
	SortableDropTarget.parent.constructor.apply(this, arguments);
}

extend(SortableDropTarget, DropTarget);


SortableDropTarget.prototype._getTargetElem = function(avatar, event)
{
	var el = avatar.getTargetElem();
	var dragInfo = avatar.getDragInfo();
	var itemSelector = dragInfo.dragZone.getItemSelector();
	var phItemClass = dragInfo.dragZone.getPlaceholder();
	var root = dragInfo.dragZone.getElement();

	while(el && el != root)
	{
		if ((isFunction(el.matches) && el.matches(itemSelector)) || (el.classList && el.classList.contains(phItemClass)))
			return el;
		el = el.parentNode;
	}

	return null;
}


SortableDropTarget.prototype.onDragMove = function(avatar, event)
{
	var newTargetElem = this._getTargetElem(avatar, event);
	if (this._targetElem == newTargetElem)
		return;

	this._hideHoverIndication(avatar);
	this._targetElem = newTargetElem;
	this._showHoverIndication(avatar);

	var dragInfo = avatar.getDragInfo();

	if (!this._targetElem || !(avatar instanceof SortableDragAvatar) || (dragInfo.dragZone.getGroup() != this._params.group))
		return;

	var nodeCmp = comparePosition(this._targetElem, dragInfo.dragZoneElem);
	if (!nodeCmp)
		return;

	// check drop target is already a placeholder
	if (this._targetElem.classList.contains(dragInfo.dragZone.getPlaceholder()))
	{
		var pos = avatar.getSortPosition();

		// swap drag zone with drop target
		if (nodeCmp & 2)
			insertAfter(dragInfo.dragZoneElem, this._targetElem);
		else if (nodeCmp & 4)
			insertBefore(dragInfo.dragZoneElem, this._targetElem);
		if (this._targetElem != pos.prev && this._targetElem != pos.next)
		{
			if (pos.prev)
				insertAfter(this._targetElem, pos.prev);
			else
				insertBefore(this._targetElem, pos.next);
		}
	}
	else
	{
		// check moving between two different zones
		if (dragInfo.dragZoneElem.parentNode != this._targetElem.parentNode)
		{
			insertBefore(dragInfo.dragZoneElem, this._targetElem);
		}
		else
		{
			if (nodeCmp & 2)			// drag zone element is after current drop target
				insertAfter(dragInfo.dragZoneElem, this._targetElem);
			else if (nodeCmp & 4)		// drag zone element is before current drop target
				insertBefore(dragInfo.dragZoneElem, this._targetElem);
		}
	}

	avatar.saveSortTarget(this._targetElem);
}


SortableDropTarget.prototype.onDragEnd = function(avatar, e)
{
	if (!this._targetElem || !(avatar instanceof SortableDragAvatar))
	{
		avatar.onDragCancel();
		return;
	}

	this._hideHoverIndication();

	var avatarInfo = avatar.getDragInfo(e);

	avatar.onDragEnd();

	if (avatarInfo.sortTarget)
	{
		var newPos = avatar.getSortPosition();

		if (avatarInfo.initialPos.prev != newPos.prev &&
			avatarInfo.initialPos.next != newPos.next)
		{
			avatarInfo.dragZone.onInsertAt(avatarInfo.dragZoneElem, avatarInfo.sortTarget);
		}
	}

	this._targetElem = null;
};


// Sortable widget constructor
function Sortable(params)
{
	var containerElem = null;
	var dragZoneParam = {};
	var dragZoneDefaults = {
			group : null,
			ondragstart : null,
			oninsertat : null,
			table : false,
			copyWidth : false,
			selector : null,
			placeholderClass : false,
			dragClass : 'drag',
			onlyRootHandle : false,
			handles : null
		};

	var dropTargetParam = {};
	var dropTargetDefaults = {
			group : null
		};


	function create(params)
	{
		params = params || {};

		var prop;
		for(prop in dragZoneDefaults)
		{
			dragZoneParam[prop] = (params.hasOwnProperty(prop))
									? params[prop]
									: dragZoneDefaults[prop];
		}

		for(prop in dropTargetDefaults)
		{
			dropTargetParam[prop] = (params.hasOwnProperty(prop))
									? params[prop]
									: dropTargetDefaults[prop];
		}

		containerElem = (typeof params.container === 'string') ? ge(params.container) : params.container;
		if (!containerElem)
			return;

		new SortableDragZone(containerElem, dragZoneParam);
		new SortableDropTarget(containerElem, dropTargetParam);
	}

	create(params);
}
