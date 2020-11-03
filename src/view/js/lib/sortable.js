'use strict';

/* global isFunction, ge, re, extend, insertBefore, insertAfter, comparePosition, getOffset, px */
/* global DragZone, DropTarget, DragAvatar */
/* exported Sortable, SortableDragZone, SortableTableDragAvatar, SortableDragAvatar */
/* eslint-disable no-bitwise, no-unused-vars */

// Sortable drag avatar
function SortableDragAvatar(dragZone, dragElem) {
    SortableDragAvatar.parent.constructor.apply(this, arguments);
}

extend(SortableDragAvatar, DragAvatar);

SortableDragAvatar.prototype.initFromEvent = function (downX, downY, e) {
    var elem;
    var offset;
    var quirks;

    // Overwrite drag zone here to find exact item to manipulate
    this.dragZoneElem = this.dragZone.findDragZoneItem(e.target);
    if (!this.dragZoneElem) {
        return false;
    }

    this.initialPos = this.getSortPosition();
    elem = this.dragZoneElem.cloneNode(true);
    this.elem = elem;

    offset = getOffset(this.dragZoneElem);
    this.shiftX = downX - offset.left;
    this.shiftY = downY - offset.top;

    this.dragZoneElem.classList.add(this.dragZone.getPlaceholder());

    if (this.dragZone.params.copyWidth) {
        quirks = !elem.style.getPropertyValue; // IE < 9
        if (quirks) {
            elem.style.cssText += ';width: ' + px(this.dragZoneElem.offsetWidth) + '!important';
        } else {
            elem.style.setProperty('width', px(this.dragZoneElem.offsetWidth), 'important');
        }
    }

    document.body.appendChild(elem);
    elem.style.zIndex = 9999;
    elem.style.position = 'absolute';

    elem.classList.add(this.dragZone.getDragClass());

    return true;
};

SortableDragAvatar.prototype.destroy = function () {
    re(this.elem);

    this.dragZoneElem.classList.remove(this.dragZone.getPlaceholder());
};

SortableDragAvatar.prototype.onDragCancel = function () {
    this.destroy();
};

SortableDragAvatar.prototype.onDragEnd = function () {
    this.destroy();
};

SortableDragAvatar.prototype.saveSortTarget = function (dropTarget) {
    this.sortTarget = dropTarget;
};

SortableDragAvatar.prototype.getSortPosition = function () {
    return {
        prev: this.dragZoneElem.previousElementSibling,
        next: this.dragZoneElem.nextElementSibling
    };
};

// Return drag information object for DropTarget
SortableDragAvatar.prototype.getDragInfo = function (event) {
    return {
        elem: this.elem,
        dragZoneElem: this.dragZoneElem,
        dragZone: this.dragZone,
        mouseShift: { x: this.shiftX, y: this.shiftY },
        sortTarget: this.sortTarget,
        initialPos: this.initialPos
    };
};

// Sortable table drag avatar
function SortableTableDragAvatar(dragZone, dragElem) {
    SortableTableDragAvatar.parent.constructor.apply(this, arguments);
}

extend(SortableTableDragAvatar, SortableDragAvatar);

SortableTableDragAvatar.prototype.initFromEvent = function (downX, downY, e) {
    var elem;
    var offset;
    var tbl;
    var srcCell;
    var destCell;
    var tmp;

    this.dragZoneElem = this.dragZone.findDragZoneItem(e.target);
    if (!this.dragZoneElem) {
        return false;
    }

    this.initialPos = this.getSortPosition();
    tbl = this.dragZoneElem.closest('table').cloneNode(false);
    tbl.appendChild(this.dragZoneElem.cloneNode(true));

    elem = tbl;
    this.elem = elem;

    offset = getOffset(this.dragZoneElem);
    this.shiftX = downX - offset.left;
    this.shiftY = downY - offset.top;

    if (this.dragZone.params.copyWidth) {
        srcCell = this.dragZoneElem.querySelector('td');
        destCell = tbl.querySelector('td');
        while (srcCell && destCell) {
            tmp = destCell.firstElementChild;

            tmp.style.width = px(srcCell.offsetWidth);

            srcCell = srcCell.nextElementSibling;
            destCell = destCell.nextElementSibling;
        }

        elem.style.width = px(this.dragZoneElem.offsetWidth);
    }

    this.dragZoneElem.classList.add(this.dragZone.getPlaceholder());

    document.body.appendChild(elem);
    elem.style.zIndex = 9999;
    elem.style.position = 'absolute';

    return true;
};

// Sortable drag zone
function SortableDragZone(elem, params) {
    SortableDragZone.parent.constructor.apply(this, arguments);

    this.sortTarget = null;
}

extend(SortableDragZone, DragZone);

SortableDragZone.prototype.makeAvatar = function () {
    if (this.params.table) {
        return new SortableTableDragAvatar(this, this.elem);
    }

    return new SortableDragAvatar(this, this.elem);
};

// Drag start handler
// Return avatar object or false
SortableDragZone.prototype.onDragStart = function (downX, downY, event) {
    var avatar = SortableDragZone.parent.onDragStart.apply(this, arguments);

    if (!avatar) {
        return false;
    }

    if (this.params && isFunction(this.params.ondragstart)) {
        this.params.ondragstart(this.elem);
    }

    return avatar;
};

// Find specific drag zone element
SortableDragZone.prototype.findDragZoneItem = function (target) {
    var el;

    if (!this.params || !this.params.selector) {
        return null;
    }

    el = target;
    while (el && el !== this.elem) {
        if (isFunction(el.matches) && el.matches(this.params.selector)) {
            return el;
        }
        el = el.parentNode;
    }

    return null;
};

// Check specified targer element is valid
SortableDragZone.prototype.isValidDragHandle = function (target) {
    var item;

    if (!target) {
        return false;
    }

    // allow to drag using whole drag zone in case no handles is set
    if (!this.params || !this.params.onlyRootHandle) {
        return SortableDragZone.parent.isValidDragHandle.apply(this, arguments);
    }

    item = this.findDragZoneItem(target);

    return this.params.onlyRootHandle && target === item;
};

// Return group of sortable
SortableDragZone.prototype.getGroup = function () {
    if (this.params && this.params.group) {
        return this.params.group;
    }

    return null;
};

// Return class for placeholder element
SortableDragZone.prototype.getPlaceholder = function () {
    if (this.params && this.params.placeholderClass) {
        return this.params.placeholderClass;
    }

    return null;
};

// Return class for item element
SortableDragZone.prototype.getItemSelector = function () {
    if (this.params && this.params.selector) {
        return this.params.selector;
    }

    return null;
};

// Return class for drag avatar element
SortableDragZone.prototype.getDragClass = function () {
    if (this.params && this.params.dragClass) {
        return (this.params.dragClass === true) ? 'drag' : this.params.dragClass;
    }

    return null;
};

// Insert event handler
SortableDragZone.prototype.onInsertAt = function (srcElem, elem) {
    if (this.params && isFunction(this.params.oninsertat)) {
        this.params.oninsertat(srcElem, elem);
    }
};

// Sortable drop target
function SortableDropTarget(elem) {
    SortableDropTarget.parent.constructor.apply(this, arguments);
}

extend(SortableDropTarget, DropTarget);

SortableDropTarget.prototype.getTargetElem = function (avatar, event) {
    var el = avatar.getTargetElem();
    var dragInfo = avatar.getDragInfo();
    var itemSelector = dragInfo.dragZone.getItemSelector();
    var phItemClass = dragInfo.dragZone.getPlaceholder();
    var root = dragInfo.dragZone.getElement();

    while (el && el !== root) {
        if ((isFunction(el.matches) && el.matches(itemSelector))
            || (el.classList && el.classList.contains(phItemClass))) {
            return el;
        }

        el = el.parentNode;
    }

    return null;
};

SortableDropTarget.prototype.onDragMove = function (avatar, event) {
    var newTargetElem;
    var dragInfo;
    var nodeCmp;
    var pos;

    newTargetElem = this.getTargetElem(avatar, event);
    if (this.targetElem === newTargetElem) {
        return;
    }

    this.hideHoverIndication(avatar);
    this.targetElem = newTargetElem;
    this.showHoverIndication(avatar);

    dragInfo = avatar.getDragInfo();
    if (
        !this.targetElem
        || !(avatar instanceof SortableDragAvatar)
        || (dragInfo.dragZone.getGroup() !== this.params.group)
    ) {
        return;
    }

    nodeCmp = comparePosition(this.targetElem, dragInfo.dragZoneElem);
    if (!nodeCmp) {
        return;
    }

    // check drop target is already a placeholder
    if (this.targetElem.classList.contains(dragInfo.dragZone.getPlaceholder())) {
        pos = avatar.getSortPosition();
        // swap drag zone with drop target
        if (nodeCmp & 2) {
            insertAfter(dragInfo.dragZoneElem, this.targetElem);
        } else if (nodeCmp & 4) {
            insertBefore(dragInfo.dragZoneElem, this.targetElem);
        }

        if (this.targetElem !== pos.prev && this.targetElem !== pos.next) {
            if (pos.prev) {
                insertAfter(this.targetElem, pos.prev);
            } else {
                insertBefore(this.targetElem, pos.next);
            }
        }
    } else if (dragInfo.dragZoneElem.parentNode !== this.targetElem.parentNode) {
        insertBefore(dragInfo.dragZoneElem, this.targetElem);
    } else if (nodeCmp & 2) {
        /* drag zone element is after current drop target */
        insertAfter(dragInfo.dragZoneElem, this.targetElem);
    } else if (nodeCmp & 4) {
        /* drag zone element is before current drop target */
        insertBefore(dragInfo.dragZoneElem, this.targetElem);
    }

    avatar.saveSortTarget(this.targetElem);
};

SortableDropTarget.prototype.onDragEnd = function (avatar, e) {
    var avatarInfo;
    var newPos;

    if (!this.targetElem || !(avatar instanceof SortableDragAvatar)) {
        avatar.onDragCancel();
        return;
    }

    this.hideHoverIndication();

    avatarInfo = avatar.getDragInfo(e);

    avatar.onDragEnd();

    if (avatarInfo.sortTarget) {
        newPos = avatar.getSortPosition();
        if (avatarInfo.initialPos.prev !== newPos.prev
            && avatarInfo.initialPos.next !== newPos.next) {
            avatarInfo.dragZone.onInsertAt(avatarInfo.dragZoneElem, avatarInfo.sortTarget);
        }
    }

    this.targetElem = null;
};

/**
 * Sortable widget constructor
 * @param {Object} params
 * @param {String} params.container - identifier or Element of sortable container
 * @param {String} params.group - sortable group udentifier
 * @param {Function} params.ondragstart - drag start event handler
 * @param {Function} params.oninsertat - drop item on new place event handler
 * @param {boolean} params.table - enable table sort behavior
 * @param {boolean} params.copyWidth - enable copying width of original item to drag avatar
 * @param {String} params.selector - CSS selector for sortable items
 * @param {String} params.placeholderClass - CSS class for placeholder item
 * @param {String} params.dragClass - CSS class for drag avatar
 * @param {boolean} params.onlyRootHandle - enable drag start only on root of item
 * @param {String|String[]} params.handles - CSS selectors for available drag start handles
 */
function Sortable(params) {
    var props = (typeof params !== 'undefined') ? params : {};
    var containerElem = null;
    var dragZoneParam = {};
    var dragZoneDefaults = {
        group: null,
        ondragstart: null,
        oninsertat: null,
        table: false,
        copyWidth: false,
        selector: null,
        placeholderClass: false,
        dragClass: 'drag',
        onlyRootHandle: false,
        handles: null
    };

    var dropTargetParam = {};
    var dropTargetDefaults = {
        group: null
    };

    Object.keys(dragZoneDefaults).forEach(function (key) {
        dragZoneParam[key] = (key in props)
            ? props[key]
            : dragZoneDefaults[key];
    });

    Object.keys(dropTargetDefaults).forEach(function (key) {
        dropTargetParam[key] = (key in props)
            ? props[key]
            : dropTargetDefaults[key];
    });

    containerElem = (typeof props.container === 'string') ? ge(props.container) : props.container;
    if (!containerElem) {
        return;
    }

    this.dragZone = new SortableDragZone(containerElem, dragZoneParam);
    this.dropTarget = new SortableDropTarget(containerElem, dropTargetParam);
}
