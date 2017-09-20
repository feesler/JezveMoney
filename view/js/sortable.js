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


// Return group of sortable
SortableDragZone.prototype.getGroup = function()
{
	if (this._params && this._params.group)
		return this._params.group;
	return null;
}


// Return class for placeholder element
SortableDragZone.prototype.getPlaceholderClass = function()
{
	if (this._params && this._params.placeholderClass)
		return this._params.placeholderClass;
	return null;
}


// Return class for item element
SortableDragZone.prototype.getItemClass = function()
{
	if (this._params && this._params.itemClass)
		return this._params.itemClass;
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


// Find specific drag zone element
SortableDragAvatar.prototype.findDragZoneItem = function(target)
{
	var itemClass = this._dragZone.getItemClass();
	var root = this._dragZone.getElement();
	var el = target;

	while(el && el != root)
	{
		if (hasClass(el, itemClass))
			return el;
		el = el.parentNode;
	}

	return null;
}


SortableDragAvatar.prototype.initFromEvent = function(downX, downY, e)
{
	this._dragZoneElem = this.findDragZoneItem(e.target);
	if (!this._dragZoneElem)
		return false;

	this._initialPos = this.getSortPosition();
	var elem = this._elem = this._dragZoneElem.cloneNode(true);

	var offset = getOffset(this._dragZoneElem);
	this._shiftX = downX - offset.left;
	this._shiftY = downY - offset.top;

	removeClass(this._dragZoneElem, this._dragZone.getItemClass());
	addClass(this._dragZoneElem, this._dragZone.getPlaceholderClass());

	if (this._dragZone._params.copyWidth)
		elem.style.width = px(this._dragZoneElem.offsetWidth);

	document.body.appendChild(elem);
	elem.style.zIndex = 9999;
	elem.style.position = 'absolute';

	return true;
}


SortableDragAvatar.prototype._destroy = function()
{
	re(this._elem);

	removeClass(this._dragZoneElem, this._dragZone.getPlaceholderClass());
	addClass(this._dragZoneElem, this._dragZone.getItemClass());
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
	var prevElem = previousElementSibling(this._dragZoneElem);
	var nextElem = nextElementSibling(this._dragZoneElem);

	return {
		prev : prevElem,
		next : nextElem
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

	this._dragZoneElem = this.findDragZoneItem(e.target);
	if (!this._dragZoneElem)
		return false;

	this._initialPos = this.getSortPosition();
	var tbl = this._dragZoneElem.parentNode.cloneNode(false);
	tbl.appendChild(this._dragZoneElem.cloneNode(true));

	elem = this._elem = tbl;

	var offset = getOffset(this._dragZoneElem);
	this._shiftX = downX - offset.left;
	this._shiftY = downY - offset.top;

	if (this._dragZone._params.copyWidth)
	{
		var srcCell, destCell, tmp;

		srcCell = firstElementChild(firstElementChild(this._dragZoneElem));
		destCell = firstElementChild(firstElementChild(firstElementChild(tbl)));
		while(srcCell && destCell)
		{
			tmp = firstElementChild(destCell);

			tmp.style.width = px(srcCell.offsetWidth);

			srcCell = nextElementSibling(srcCell);
			destCell = nextElementSibling(destCell);
		}

		elem.style.width = px(this._dragZoneElem.offsetWidth);
	}

	removeClass(this._dragZoneElem, this._dragZone.getItemClass());
	addClass(this._dragZoneElem, this._dragZone.getPlaceholderClass());

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
	var itemClass = dragInfo.dragZone.getItemClass();
	var phItemClass = dragInfo.dragZone.getPlaceholderClass();
	var root = dragInfo.dragZone.getElement();

	while(el && el != root)
	{
		if (hasClass(el, itemClass) || hasClass(el, phItemClass))
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
	if (hasClass(this._targetElem, dragInfo.dragZone.getPlaceholderClass()))
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
	var groupName = null;
	var dragZoneParam = {};
	var dropTargetParam = {};


	function create(params)
	{
		params = params || {};

		groupName = params.group;

		dragZoneParam.group = dropTargetParam.group = groupName;
		if (params.ondragstart)
			dragZoneParam.ondragstart = params.ondragstart;
		if (params.oninsertat)
			dragZoneParam.oninsertat = params.oninsertat;
		if (params.table)
			dragZoneParam.table = params.table;
		if (params.copyWidth)
			dragZoneParam.copyWidth = params.copyWidth;
		if (params.itemClass)
			dragZoneParam.itemClass = params.itemClass;
		if (params.placeholderClass)
			dragZoneParam.placeholderClass = params.placeholderClass;
		if (params.onlyRootHandle === true)
			dragZoneParam.onlyRootHandle = true;

		containerElem = ge(params.container);
		if (!containerElem)
			return;

		new SortableDragZone(containerElem, dragZoneParam);
		new SortableDropTarget(containerElem, dropTargetParam);
	}

	create(params);
}
