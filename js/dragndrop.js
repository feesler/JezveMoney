// Calculate offset of element
function getOffset(elem)
{
	if (elem.getBoundingClientRect)
		return getOffsetRect(elem);
	else
		return getOffsetSum(elem);
}


// Calculate offset of element using getBoundingClientRect() method
function getOffsetRect(elem)
{
	var box = elem.getBoundingClientRect();
	var body = document.body;
	var docElem = document.documentElement;

	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
	var clientTop = docElem.clientTop || body.clientTop || 0;
	var clientLeft = docElem.clientLeft || body.clientLeft || 0;
	var top  = box.top +  scrollTop - clientTop;
	var left = box.left + scrollLeft - clientLeft;

	return { top: Math.round(top), left: Math.round(left) };
}


// Calculate offset of element by sum of offsets of parents
function getOffsetSum(elem)
{
	var top = 0, left = 0;

	while(elem)
	{
		top = top + parseInt(elem.offsetTop);
		left = left + parseInt(elem.offsetLeft);
		elem = elem.offsetParent;
	}

	return { top: top, left: left };
}



// Main drag and drop class
var dragMaster = (function()
{
	var dragObject;
	var mouseDownAt;
	var currentDropTarget;


	// Mouse down on drag object element event handler
	function mouseDown(e)
	{
		e = fixEvent(e);

		if (e.which != 1)
			return;

 		mouseDownAt = { x: e.pageX, y: e.pageY, element: this };

		addDocumentEventHandlers();

		return false
	}


	// Document mouse move event handler
	function mouseMove(e)
	{
		e = fixEvent(e);

		if (mouseDownAt)
		{
			if (Math.abs(mouseDownAt.x - e.pageX) < 5 && Math.abs(mouseDownAt.y - e.pageY) < 5)
				return false;

			var elem  = mouseDownAt.element;
			dragObject = elem.dragObject;

			var mouseOffset = getMouseOffset(elem, mouseDownAt.x, mouseDownAt.y);
			mouseDownAt = null;

			dragObject.onDragStart(mouseOffset);
		}

		dragObject.onDragMove(e.pageX, e.pageY);

		var newTarget = getCurrentTarget(e);

		if (currentDropTarget != newTarget)
		{
			if (currentDropTarget)
				currentDropTarget.onLeave(dragObject);
			if (newTarget)
				newTarget.onEnter(dragObject);
			currentDropTarget = newTarget;
		}

		return false;
	}
	

	// Document mouse up event handler
	function mouseUp()
	{
		if (!dragObject)
		{
			mouseDownAt = null;
		}
		else
		{
			if (currentDropTarget)
			{
				currentDropTarget.accept(dragObject);
				dragObject.onDragSuccess(currentDropTarget);
			}
			else
			{
				dragObject.onDragFail();
			}

			dragObject = null;
		}

		removeDocumentEventHandlers();
	}


	function getMouseOffset(target, x, y)
	{
		var docPos = getOffset(target);
		return {x:x - docPos.left, y:y - docPos.top};
	}


	// Try to find drop target under mouse cursor
	function getCurrentTarget(e)
	{
		dragObject.hide();
		var elem = document.elementFromPoint(e.clientX, e.clientY);
		dragObject.show();

		// look for deepest dropTarget
		while(elem)
		{
			if (elem.dropTarget && elem.dropTarget.canAccept(dragObject))
				return elem.dropTarget;
			elem = elem.parentNode;
		}

		return null;
	}


	// Set event handlers for document
	function addDocumentEventHandlers()
	{
		document.onmousemove = mouseMove;
		document.onmouseup = mouseUp;
		document.ondragstart = document.body.onselectstart = function(){ return false };
	}


	// Remove event handler from document
	function removeDocumentEventHandlers()
	{
		document.onmousemove = document.onmouseup = document.ondragstart = document.body.onselectstart = null;
	}


	return {
		makeDraggable: function(element) {
			element.onmousedown = mouseDown;
		}
	}
}());


// Drag object class
function DragObject(element)
{
	element.dragObject = this;

	dragMaster.makeDraggable(element);

	var rememberPosition;
	var mouseOffset;


	this.onDragStart = function(offset)
	{
		var s = element.style;
		var origWidth = element.offsetWidth;
		rememberPosition = { top: s.top, left: s.left, position: s.position, width: s.width };
		s.position = 'absolute';
		s.width = (origWidth - 16) + 'px';

		mouseOffset = offset;
	}


	this.hide = function()
	{
		show(element, false);
	}


	this.show = function()
	{
		show(element, true);
	}


	this.onDragMove = function(x, y)
	{
		element.style.top =  y - mouseOffset.y + 'px';
		element.style.left = x - mouseOffset.x + 'px';
	}


	this.onDragSuccess = function(dropTarget){}


	this.onDragFail = function()
	{
		var s = element.style;
		s.top = rememberPosition.top;
		s.left = rememberPosition.left;
		s.position = rememberPosition.position;
		s.width = rememberPosition.width;
	}


	this.toString = function()
	{
		return element.id;
	}


	this.getElement = function()
	{
		return element;
	}
}


// Drop target class
function DropTarget(element)
{
	element.dropTarget = this;


	this.canAccept = function(dragObject)
	{
		return true;
	}


	this.accept = function(dragObject)
	{
		this.onLeave();

		dragObject.onDragFail();
	}


	this.onLeave = function(dragObject)
	{
	}


	//
	this.onEnter = function(dragObject)
	{
		var dragSource = dragObject.getElement().parentNode;

		if (element == dragSource)
			return;

		var isPrev = true, found = false, telem;

		// Move from drop object upward
		telem = element.previousElementSibling;
		while(telem)
		{
			if (telem == dragSource)
			{
				found = true;
				break;
			}
			telem = telem.previousElementSibling;
		}

		// Move from drop object downward
		if (!found)
		{
			isPrev = false;
			telem = element.nextElementSibling;
			while(telem)
			{
				if (telem == dragSource)
				{
					found = true;
					break;
				}
				telem = telem.nextElementSibling;
			}
		}

		if (found)
		{
			var cutSource = re(dragSource);

			if (isPrev)
				insertAfter(cutSource, element);
			else
				element.parentNode.insertBefore(cutSource, element);
		}
	}


	this.toString = function()
	{
		return element.id;
	}
}
