'use strict';

/* global ge, px, isObject */
/* exported dragMaster */
/* eslint no-unused-vars: "warn" */

/** Main drag and drop class */
var dragMaster = (function () {
    var dragZone;
    var avatar;
    var dropTarget;
    var downX;
    var downY;
    var touchTimeout = 0;
    var touchMoveReady = false;
    var handlers = null;

    function disableTextSelect() {
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    }

    function enableTextSelect() {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    }

    /** Set event handlers for document */
    function addTouchEventHandlers() {
        if (!handlers) {
            return;
        }

        document.addEventListener('keydown', handlers.keydown);
        document.addEventListener('touchmove', handlers.touchmove, { passive: false });
        document.addEventListener('touchend', handlers.touchend);
        document.addEventListener('touchcancel', handlers.touchcancel);
        document.addEventListener('dragstart', handlers.dragstart);
        document.body.addEventListener('selectstart', handlers.selectstart);
        disableTextSelect();
    }

    /** Set event handlers for document */
    function addDocumentEventHandlers() {
        if (!handlers) {
            return;
        }

        document.addEventListener('keydown', handlers.keydown);
        document.addEventListener('mousemove', handlers.mousemove);
        document.addEventListener('mouseup', handlers.mouseup);
        document.addEventListener('dragstart', handlers.dragstart);
        document.body.addEventListener('selectstart', handlers.selectstart);
    }

    /** Remove event handler from document */
    function removeTouchEventHandlers() {
        if (!handlers) {
            return;
        }

        document.removeEventListener('keydown', handlers.keydown);
        document.removeEventListener('touchmove', handlers.touchmove);
        document.removeEventListener('touchend', handlers.touchend);
        document.removeEventListener('touchcancel', handlers.touchcancel);
        document.removeEventListener('dragstart', handlers.dragstart);
        document.body.removeEventListener('selectstart', handlers.selectstart);
        enableTextSelect();
    }

    /** Remove event handler from document */
    function removeDocumentEventHandlers() {
        if (!handlers) {
            return;
        }

        document.removeEventListener('keydown', handlers.keydown);
        document.removeEventListener('mousemove', handlers.mousemove);
        document.removeEventListener('mouseup', handlers.mouseup);
        document.removeEventListener('dragstart', handlers.dragstart);
        document.body.removeEventListener('selectstart', handlers.selectstart);
    }

    /** Clean up drag objects */
    function cleanUp() {
        dragZone = null;
        avatar = null;
        dropTarget = null;
    }

    /** Search for drag zone object */
    function findDragZone(e) {
        var elem = e.target;

        while (elem !== document && !elem.dragZone) {
            elem = elem.parentNode;
        }

        return elem.dragZone;
    }

    /** Try to find drop target under mouse cursor */
    function findDropTarget(e) {
        var elem = avatar.getTargetElem();

        while (elem !== document && !elem.dropTarget) {
            elem = elem.parentNode;
        }

        if (!elem.dropTarget) {
            return null;
        }

        return elem.dropTarget;
    }

    function getEventCoordinatesObject(e) {
        if (e.touches) {
            if (e.type === 'touchend' || e.type === 'touchcancel') {
                return e.changedTouches[0];
            }

            return e.touches[0];
        }

        return e;
    }

    function getEventPageCoordinates(e) {
        var coords = getEventCoordinatesObject(e);

        return {
            x: coords.pageX,
            y: coords.pageY
        };
    }

    function getEventClientCoordinates(e) {
        var coords = getEventCoordinatesObject(e);

        return {
            x: coords.clientX,
            y: coords.clientY
        };
    }

    function initAvatar(e) {
        var coords;

        if (avatar) {
            return;
        }

        coords = getEventPageCoordinates(e);
        if (!e.touches) {
            if (Math.abs(downX - coords.x) < 5 && Math.abs(downY - coords.y) < 5) {
                return;
            }
        }

        avatar = dragZone.onDragStart(downX, downY, e);
        if (!avatar) {
            cleanUp();
        }
    }

    function handleMove(e) {
        var newDropTarget;

        if (!dragZone) {
            return;
        }

        if (!avatar) {
            initAvatar(e);
        }
        if (!avatar) {
            return;
        }

        avatar.onDragMove(e);

        newDropTarget = findDropTarget(e);
        if (dropTarget !== newDropTarget) {
            if (dropTarget) {
                dropTarget.onDragLeave(newDropTarget, avatar, e);
            }
            if (newDropTarget) {
                newDropTarget.onDragEnter(dropTarget, avatar, e);
            }
        }

        dropTarget = newDropTarget;
        if (dropTarget) {
            dropTarget.onDragMove(avatar, e);
        }
    }

    /** Document mouse move event handler */
    function mouseMove(e) {
        if (e.touches) {
            if (!touchMoveReady) {
                clearTimeout(touchTimeout);
                touchTimeout = 0;
                return;
            }
            e.preventDefault();
        }

        handleMove(e);
    }

    /** Document mouse up event handler */
    function mouseUp(e) {
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            touchTimeout = 0;
        }

        if (!e.touches) {
            if (e.which !== 1) {
                return false;
            }
        }

        if (avatar) {
            if (dropTarget) {
                dropTarget.onDragEnd(avatar, e);
            } else {
                avatar.onDragCancel();
            }
        }

        cleanUp();
        if (e.touches) {
            removeTouchEventHandlers();
        } else {
            removeDocumentEventHandlers();
        }

        return false;
    }

    /** Keydown event handler */
    function onKey(e) {
        if (e.code === 'Escape') {
            if (avatar) {
                avatar.onDragCancel();
            }

            cleanUp();
            removeDocumentEventHandlers();
        }
    }

    /** Empty function return false */
    function emptyFalse(e) {
        e.preventDefault();
    }

    /** Mouse down on drag object element event handler */
    function mouseDown(e) {
        var touchStartEvent;
        var coord;

        if (e.touches) {
            if (e.touches.length > 1) {
                return;
            }
        } else if (e.type === 'mousedown') {
            if (e.which !== 1) {
                return;
            }
        } else {
            return;
        }

        dragZone = findDragZone(e);
        if (!dragZone || !dragZone.isValidDragHandle(e.target)) {
            return;
        }

        coord = getEventPageCoordinates(e);
        downX = coord.x;
        downY = coord.y;

        if (e.touches) {
            touchMoveReady = false;
            handlers = {
                keydown: onKey,
                touchmove: mouseMove,
                touchend: mouseUp,
                touchcancel: mouseUp,
                dragstart: emptyFalse,
                selectstart: emptyFalse
            };
            addTouchEventHandlers();

            if (touchTimeout) {
                clearTimeout(touchTimeout);
                touchTimeout = 0;
            }

            touchStartEvent = e;
            touchTimeout = setTimeout(function () {
                touchMoveReady = true;
                handleMove(touchStartEvent);
            }, 200);
        } else {
            handlers = {
                keydown: onKey,
                mousemove: mouseMove,
                mouseup: mouseUp,
                dragstart: emptyFalse,
                selectstart: emptyFalse
            };
            addDocumentEventHandlers();
        }
    }

    // Check pointer is mouse
    function isMousePointer(e) {
        var pointerType;

        if (typeof e.pointerType === 'undefined') {
            return true;
        }

        if (typeof e.pointerType === 'string') {
            pointerType = e.pointerType;
        } else if (e.pointerType === 2) { /* IE 10 MSPOINTER_TYPE_TOUCH */
            pointerType = 'touch';
        } else if (e.pointerType === 3) { /* IE 10 MSPOINTER_TYPE_PEN */
            pointerType = 'pen';
        } else if (e.pointerType === 4) { /* IE 10 MSPOINTER_TYPE_MOUSE */
            pointerType = 'mouse';
        }

        return (pointerType === 'mouse');
    }

    return {
        makeDraggable: function (elem) {
            var el = elem;
            el.addEventListener('mousedown', mouseDown);
            el.addEventListener('touchstart', mouseDown);

            if (typeof el.onpointerdown !== 'undefined') {
                el.onpointerdown = isMousePointer;
            } else {
                el.onmspointerdown = isMousePointer;
            }
        },

        getElementUnderClientXY: function (elem, clientX, clientY) {
            var display;
            var priority;
            var target;
            var el = elem;
            var quirks = !elem.style.getPropertyValue; // IE < 9

            if (quirks) {
                display = el.style.cssText;
                el.style.cssText += 'display: none!important';
            } else {
                display = el.style.getPropertyValue('display');
                priority = el.style.getPropertyPriority('display');
                el.style.setProperty('display', 'none', 'important');
            }

            target = document.elementFromPoint(clientX, clientY);

            if (quirks) {
                el.style.cssText = display;
            } else {
                el.style.setProperty('display', display, priority);
            }

            if (!target || target === document) {
                target = document.body;
            }

            return target;
        },

        getEventPageCoordinates: function (e) {
            return getEventPageCoordinates(e);
        },

        getEventClientCoordinates: function (e) {
            return getEventClientCoordinates(e);
        }
    };
}());

/**
 * Drag start zone class
 * Handle drag start event and make avatar
 * @param {Element} elem - element to create drag zone
 * @param {Object} params - properties object
 */
function DragZone(elem, params) {
    this.elem = elem;
    this.params = params;

    this.elem.dragZone = this;

    dragMaster.makeDraggable(elem);
}

/** Return element of drag zone */
DragZone.prototype.getElement = function () {
    return this.elem;
};

// Return avatar specific for zone
DragZone.prototype.makeAvatar = function () { };

/**
 * Drag start handler
 * Return avatar object or false
 * @param {Number} downX - x coordinate of mouse down point
 * @param {Number} downY - y coordinate of mouse down point
 * @param {Event} event - event object
 */
DragZone.prototype.onDragStart = function (downX, downY, event) {
    var avatar = this.makeAvatar();

    if (!avatar.initFromEvent(downX, downY, event)) {
        return false;
    }

    return avatar;
};

/**
 * Check specified targer element is valid
 * @param {Element} target - element to check
 */
DragZone.prototype.isValidDragHandle = function (target) {
    var handles;

    if (!target) {
        return false;
    }

    // allow to drag using whole drag zone in case no handles is set
    if (!this.params || !this.params.handles) {
        return true;
    }

    handles = this.params.handles;
    if (!Array.isArray(handles)) {
        handles = [handles];
    }

    return handles.some(function (hnd) {
        var elem;
        var qres;
        var i;
        var l;

        if (isObject(hnd) && (hnd.elem || hnd.query)) {
            if (hnd.query) {
                qres = this.elem.querySelectorAll(hnd.query);
                elem = [];
                for (i = 0, l = qres.length; i < l; i += 1) {
                    elem.push(qres[i]);
                }
            } else {
                elem = ge(hnd.elem);
            }
        } else {
            elem = ge(hnd);
        }

        if (!Array.isArray(elem)) {
            elem = [elem];
        }

        return elem.some(function (el) {
            return el
                && (
                    el === target
                    || (
                        isObject(hnd)
                        && hnd.includeChilds
                        && el.contains(target)
                    )
                );
        });
    }, this);
};

/**
 * Drag object class constructor
 * @param {DragZone} dragZone - parent DragZone of avatar
 * @param {Element} dragElem - original element related to avatar
 */
function DragAvatar(dragZone, dragElem) {
    this.dragZone = dragZone;
    this.dragZoneElem = dragElem;
    this.elem = dragElem; // element of avatar
}

/**
 * Initialize drag element and set up position
 * @param {Number} downX - x coordinate of mouse down point
 * @param {Number} downY - y coordinate of mouse down point
 * @param {Event} e - event object
 */
DragAvatar.prototype.initFromEvent = function (downX, downY, e) { };

/** Return drag information object for DropTarget */
DragAvatar.prototype.getDragInfo = function () {
    return {
        elem: this.elem,
        dragZoneElem: this.dragZoneElem,
        dragZone: this.dragZone,
        mouseShift: {
            x: this.shiftX,
            y: this.shiftY
        }
    };
};

/** Return current deepest element under avatar */
DragAvatar.prototype.getTargetElem = function () {
    return this.currentTargetElem;
};

/** Scroll document if needed on drag avatar to top or bottom of screen */
DragAvatar.prototype.scrollDocument = function (coords) {
    var scrollMargin = 30;
    var docElem = document.documentElement;

    if (coords.y > docElem.clientHeight - scrollMargin) {
        if (docElem.scrollTop + docElem.clientHeight === docElem.scrollHeight) {
            return;
        }

        docElem.scrollTop += scrollMargin;
    } else if (coords.y < scrollMargin) {
        if (docElem.scrollTop === 0) {
            return;
        }

        docElem.scrollTop -= scrollMargin;
    }
};

/**
 * Move avatag element on mouse move
 * Also save current element under avatar
 * @param {Event} e - event object
 */
DragAvatar.prototype.onDragMove = function (e) {
    var page = dragMaster.getEventPageCoordinates(e);
    var client = dragMaster.getEventClientCoordinates(e);

    this.elem.style.left = px(page.x - this.shiftX);
    this.elem.style.top = px(page.y - this.shiftY);

    this.currentTargetElem = dragMaster.getElementUnderClientXY(
        this.elem,
        client.x,
        client.y
    );

    this.scrollDocument(client);
};

/** Drop fail handler */
DragAvatar.prototype.onDragCancel = function () { };

/** Success drop handler */
DragAvatar.prototype.onDragEnd = function () { };

/**
 * Drop target class constructor
 * @param {Element} elem - element to create drop target at
 * @param {Object} params - properties object
 */
function DropTarget(elem, params) {
    this.elem = elem;
    this.elem.dropTarget = this;
    this.targetElem = null; // target element under avatar
    this.params = params;
}

/**
 * Return target element under avatar
 * @param {DragAvatar} avatar - avatar object
 * @param {Event} e - event object
 */
DropTarget.prototype.getTargetElem = function (avatar, e) {
    return this.elem;
};

/** Hide hover indication of current drop target */
DropTarget.prototype.hideHoverIndication = function (avatar) { };

/** Show hover indication of current drop target */
DropTarget.prototype.showHoverIndication = function (avatar) { };

/**
 * Avatar move event handler
 * @param {DragAvatar} avatar - drag avatar object
 * @param {Event} e - event object
 */
DropTarget.prototype.onDragMove = function (avatar, e) {
    var newTargetElem = this.getTargetElem(avatar, e);

    if (this.targetElem !== newTargetElem) {
        this.hideHoverIndication(avatar);
        this.targetElem = newTargetElem;
        this.showHoverIndication(avatar);
    }
};

/**
 * Drag end event handler
 * Should get avatar.getDragInfo() and check possibility of drop
 * Call avatar.onDragEnd() or avatar.onDragCancel()
 * After all process this._targetElem must be nulled
 * @param {DragAvatar} avatar - drag avatar object
 * @param {Event} e - event object
 */
DropTarget.prototype.onDragEnd = function (avatar, e) {
    this.hideHoverIndication(avatar);
    this.targetElem = null;
};

/** Avatar enter to target event handler */
DropTarget.prototype.onDragEnter = function (fromDropTarget, avatar, event) { };

/** Avatar leave form target event handler */
DropTarget.prototype.onDragLeave = function (toDropTarget, avatar, event) {
    this.hideHoverIndication();
    this.targetElem = null;
};
