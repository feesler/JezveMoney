// Main drag and drop class
var dragMaster = (function()
{
    var dragZone, avatar, dropTarget;
    var downX, downY;

    var self = this;


    // Mouse down on drag object element event handler
    function mouseDown(e)
    {
        e = fixEvent(e);

        if (e.which != 1)
            return;

        dragZone = findDragZone(e);
        if (!dragZone)
            return;

        if (!dragZone.isValidDragHandle(e.target))
            return;

        downX = e.pageX;
        downY = e.pageY;

        addDocumentEventHandlers();

        return false;
    }


    // Document mouse move event handler
    function mouseMove(e)
    {
        if (!dragZone)
            return false;

        e = fixEvent(e);

        if (!avatar)
        {
            if (Math.abs(downX - e.pageX) < 5 && Math.abs(downY - e.pageY) < 5)
                return false;

            avatar = dragZone.onDragStart(downX, downY, e);
            if (!avatar)
            {
                cleanUp();
                return false;
            }
        }

        avatar.onDragMove(e);

        var newDropTarget = findDropTarget(e);
        if (dropTarget != newDropTarget)
        {
            if (dropTarget)
                dropTarget.onDragLeave(newDropTarget, avatar, e);
            if (newDropTarget)
                newDropTarget.onDragEnter(dropTarget, avatar, e);
        }

        dropTarget = newDropTarget;
        if (dropTarget)
            dropTarget.onDragMove(avatar, e);

        return false;
    }


    // Document mouse up event handler
    function mouseUp(e)
    {
        e = fixEvent(e);

        if (e.which != 1)
            return false;

        if (avatar)
        {
            if (dropTarget)
            {
                dropTarget.onDragEnd(avatar, e);
            }
            else
            {
                avatar.onDragCancel();
            }
        }

        cleanUp();
        removeDocumentEventHandlers();
    }


    // Keydown event handler
    function onKey(e)
    {
        if (e.code == 'Escape')
        {
            if (avatar)
                avatar.onDragCancel();

            cleanUp();
            removeDocumentEventHandlers();
        }
    }


    // Clean up drag objects
    function cleanUp()
    {
        dragZone = avatar = dropTarget = null;
    }


    // Search for drag zone object
    function findDragZone(e)
    {
        var elem = e.target;

        while(elem != document && !elem.dragZone)
        {
            elem = elem.parentNode;
        }

        return elem.dragZone;
    }


    // Try to find drop target under mouse cursor
    function findDropTarget(e)
    {
        var elem = avatar.getTargetElem();

        while(elem != document && !elem.dropTarget)
        {
            elem = elem.parentNode;
        }

        if (!elem.dropTarget)
            return null;

        return elem.dropTarget;
    }


    // Empty function return false
    function emptyFalse(e)
    {
        e.preventDefault();
    }


    // Set event handlers for document
    function addDocumentEventHandlers()
    {
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('dragstart', emptyFalse);
        document.body.addEventListener('selectstart', emptyFalse);
    }


    // Remove event handler from document
    function removeDocumentEventHandlers()
    {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('dragstart', emptyFalse);
        document.body.removeEventListener('selectstart', emptyFalse);
    }


    // Check pointer is mouse
    function isMousePointer(e)
    {
        var pointerType;

        e = fixEvent(e);

        if (e.pointerType === undefined)
            return true;

        if (typeof e.pointerType == 'string')
        {
            pointerType = e.pointerType;
        }
        else		// IE 10
        {
            if (e.pointerType == 2)			/*	MSPOINTER_TYPE_TOUCH	*/
                pointerType = 'touch';
            else if (e.pointerType == 3)		/*	MSPOINTER_TYPE_PEN	*/
                pointerType = 'pen';
            else if (e.pointerType == 4)		/*	MSPOINTER_TYPE_MOUSE	*/
                pointerType = 'mouse';
        }

        return (pointerType == 'mouse');
    }


    return {
        makeDraggable : function(element)
        {
            element.addEventListener('mousedown', mouseDown);

            if (element.onpointerdown !== undefined)
                element.onpointerdown = isMousePointer;
            else
                element.onmspointerdown = isMousePointer;
        },

        getElementUnderClientXY : function(elem, clientX, clientY)
        {
            var display, priority;
            var quirks = !elem.style.getPropertyValue;		// IE < 9
            if (quirks)
            {
                display = elem.style.cssText;
                elem.style.cssText += 'display: none!important';
            }
            else
            {
                display = elem.style.getPropertyValue('display');
                priority = elem.style.getPropertyPriority('display');
                elem.style.setProperty('display', 'none', 'important');
            }

            var target = document.elementFromPoint(clientX, clientY);

            if (quirks)
                elem.style.cssText = display;
            else
                elem.style.setProperty('display', display, priority);

            if (!target || target == document)
                target = document.body;

            return target;
        }
    }
}());


// Drag start zone class
// Handle drag start event and make avatar
function DragZone(elem, params)
{
    elem.dragZone = this;
    this._elem = elem;
    this._params = params;

    dragMaster.makeDraggable(elem);
}


// Return element of drag zone
DragZone.prototype.getElement = function()
{
    return this._elem;
}


// Return avatar specific for zone
DragZone.prototype._makeAvatar = function()
{
};


// Drag start handler
// Return avatar object or false
DragZone.prototype.onDragStart = function(downX, downY, event)
{
    var avatar = this._makeAvatar();

    if (!avatar.initFromEvent(downX, downY, event))
        return false;

    return avatar;
};


// Check specified targer element is valid
DragZone.prototype.isValidDragHandle = function(target)
{
    var handles;

    if (!target)
        return false;

    // allow to drag using whole drag zone in case no handles is set
    if (!this._params || !this._params.handles)
        return true;

    handles = this._params.handles;
    if (!Array.isArray(handles))
        handles = [handles];

    return handles.some(function(hnd)
    {
        var elem;

        if (isObject(hnd) && (hnd.elem || hnd.query))
        {
            if (hnd.query)
            {
                var qres = this._elem.querySelectorAll(hnd.query);
                elem = [];
                for(var i = 0, l = qres.length; i < l; i++)
                {
                    elem.push(qres[i]);
                }
            }
            else
                elem = ge(hnd.elem);
        }
        else
            elem = ge(hnd);

        if (!Array.isArray(elem))
            elem = [elem];

        return elem.some(function(el)
        {
            return el && (el == target || (isObject(hnd) && hnd.includeChilds && el.contains(target)));
        });
    }, this);
}


// Drag object class
function DragAvatar(dragZone, dragElem)
{
    this._dragZone = dragZone;			// parent DragZone of avatar
    this._dragZoneElem = dragElem;		// original element related to avatar
    this._elem = dragElem;				// element of avatar
}


// Initialize drag element and set up position
DragAvatar.prototype.initFromEvent = function(downX, downY, event)
{
};


// Return drag information object for DropTarget
DragAvatar.prototype.getDragInfo = function(event)
{
    return {
        elem : this._elem,
        dragZoneElem : this._dragZoneElem,
        dragZone : this._dragZone,
        mouseShift : { x : this._shiftX, y : this._shiftY }
    };
};


// Return current deepest element under avatar
DragAvatar.prototype.getTargetElem = function()
{
    return this._currentTargetElem;
};


// Move avatag element on mouse move
// Also save current element under avatar
DragAvatar.prototype.onDragMove = function(event)
{
    this._elem.style.left = px(event.pageX - this._shiftX);
    this._elem.style.top = px(event.pageY - this._shiftY);

    this._currentTargetElem = dragMaster.getElementUnderClientXY(this._elem, event.clientX, event.clientY);
};


// Drop fail handler
DragAvatar.prototype.onDragCancel = function()
{
};


// Success drop handler
DragAvatar.prototype.onDragEnd = function()
{
};


// Drop target class
function DropTarget(elem, params)
{
    elem.dropTarget = this;
    this._elem = elem;
    this._targetElem = null;		// target element under avatar
    this._params = params;
}


// Return target element under avatar
DropTarget.prototype._getTargetElem = function(avatar, event)
{
    return this._elem;
};



// Hide hover indication of current drop target
DropTarget.prototype._hideHoverIndication = function(avatar)
{
};


// Show hover indication of current drop target
DropTarget.prototype._showHoverIndication = function(avatar)
{
};


// Avatar move event handler
DropTarget.prototype.onDragMove = function(avatar, event)
{
    var newTargetElem = this._getTargetElem(avatar, event);

    if (this._targetElem != newTargetElem)
    {
        this._hideHoverIndication(avatar);
        this._targetElem = newTargetElem;
        this._showHoverIndication(avatar);
    }
};


// Drag end event handler
// Should get avatar.getDragInfo() and check possibility of drop
// Call avatar.onDragEnd() or avatar.onDragCancel()
// After all process this._targetElem must be nulled
DropTarget.prototype.onDragEnd = function(avatar, event)
{
    this._hideHoverIndication(avatar);
    this._targetElem = null;
};


// Avatar enter to target event handler
DropTarget.prototype.onDragEnter = function(fromDropTarget, avatar, event)
{
};


// Avatar leave form target event handler
DropTarget.prototype.onDragLeave = function(toDropTarget, avatar, event)
{
    this._hideHoverIndication();
    this._targetElem = null;
};
