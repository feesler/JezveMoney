//
function getOffset(elem)
{
	if (elem.getBoundingClientRect)
		return getOffsetRect(elem);
	else
		return getOffsetSum(elem);
}


//
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


//
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



//
var dragMaster = (function()
{
	var dragObject;
	var mouseDownAt;
	var currentDropTarget;

	
	function mouseDown(e)
	{
		e = fixEvent(e);

		if (e.which != 1)
			return;

 		mouseDownAt = { x: e.pageX, y: e.pageY, element: this };

		addDocumentEventHandlers();

		return false
	}


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

	
	function getCurrentTarget(e)
	{
		var x = e.clientX, y = e.clientY;

		dragObject.hide();
		var elem = document.elementFromPoint(x, y);
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


	function addDocumentEventHandlers()
	{
		document.onmousemove = mouseMove;
		document.onmouseup = mouseUp;
		document.ondragstart = document.body.onselectstart = function(){ return false };
	}


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


//
function DragObject(element)
{
	element.dragObject = this;

	dragMaster.makeDraggable(element);

	var rememberPosition;
	var mouseOffset;


	this.onDragStart = function(offset)
	{
		var s = element.style;
		rememberPosition = { top: s.top, left: s.left, position: s.position };
		s.position = 'absolute';
		element.parentNode.className = 'drop_item';

		mouseOffset = offset;
	}


	this.hide = function()
	{
		element.style.display = 'none';
	}


	this.show = function()
	{
		element.style.display = '';
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
		element.parentNode.className = 'trlist_item_wrap';
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


//
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
		
		//dragObject.hide();
		dragObject.onDragFail();
	}


	this.onLeave = function(dragObject)
	{
		element.style.backgroundColor =  '';
	}


	//
	this.onEnter = function(dragObject)
	{
		var dragSource = dragObject.getElement().parentNode;

		//element.style.backgroundColor =  '#808080';

		if (element != dragSource)
		{
			var whatToMove = re(element.firstElementChild);
			if (whatToMove)
			{
				var whereToMove = null;
				if (element.previousElementSibling && element.previousElementSibling == dragSource)
					whereToMove = element.previousElementSibling;
				else if (element.nextElementSibling && element.nextElementSibling == dragSource)
					whereToMove = element.nextElementSibling;

				if (whereToMove)
				{
					whereToMove.appendChild(whatToMove);
					element.className = 'drop_item';
					whereToMove.className = 'trlist_item_wrap';
				}

				element.appendChild(re(dragObject.getElement()));
			}
		}
	}


	this.toString = function()
	{
		return element.id;
	}
}
