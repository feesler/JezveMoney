﻿// Return DOM element by id
function ge(a)
{
	return (typeof a == 'string') ? document.getElementById(a) : a;
}


// Check object is array
function isArray(obj)
{
	return (typeof obj === 'object' && obj.constructor.toString().indexOf("Array") != -1);
}


// Check object is date
function isDate(obj)
{
	return (typeof obj === 'object' && obj.constructor.toString().indexOf("Date") != -1);
}


// Set parameters of object
function setParam(obj, params)
{
	var par, val;

	if (!obj || !params || typeof params !== 'object')
		return;

	for(par in params)
	{
		val = params[par];
		if (typeof val === 'object')
			setParam(obj[par], val);
		else
			obj[par] = val;
	}
}


// Append elements from array to object
function addChilds(obj, childs)
{
	if (!obj || !childs || !isArray(childs))
		return;

	childs.forEach(function(child){
		if (child)
			obj.appendChild(child);
	});
}


// Create specified DOM element and set parameters if specified
function ce(tagName, params, childs)
{
	var obj, par;

	if (typeof tagName !== 'string')
		return null;

	obj = document.createElement(tagName);
	if (!obj)
		return null;

	setParam(obj, params);
	addChilds(obj, childs);

	return obj;
}


// Remove element from DOM and return
function re(obj)
{
	var robj = ge(obj);

	return robj ? robj.parentNode.removeChild(robj) : null;
}


// document.write wrapper
function dw(a)
{
	document.write(a);
}


// Fix string to correct float number format
function fixFloat(str)
{
	if (typeof(str) == "string")
		return str.replace(/,/g, '.');
	else if (typeof(str) == "number")
		return str;
	else
		return null;
}


// Check is specified string is number
function isNum(val)
{
	if (val == 0)
		return true;
	else
		return res = (val / val) ? true : false;
}


// Return object visibility
function isVisible(obj)
{
	var robj = ge(obj);

	return (robj && robj.style && robj.style.display != 'none');
}


// Show specified object
function show(obj, val)
{
	var robj = ge(obj);

	if (robj)
		robj.style.display = (val) ? '' : 'none';
}


// Enable or disable specified object
function enable(obj, val)
{
	var robj = ge(obj);

	if (robj)
		robj.disabled = (!val);
}


// Get key code from event
function getCode(e)
{
	var KeyIdentifierMap =
	{
		End		: 35,
		Home		: 36,
		Left		: 37,
		Right		: 39,
		'U+00007F'	: 46		// Delete
	};

	var iCode;

	if (!e)
		e = event;

	iCode = (e.keyCode || e.charCode);
	if (!iCode && e.keyIdentifier && (e.keyIdentifier in KeyIdentifierMap))
			iCode = KeyIdentifierMap[e.keyIdentifier];

	return iCode;
}


// Check specified key code is digit or allowed keys
function isDigit(iCode)
{
	return ((iCode >= 48 && iCode <= 57)		// Numbers
		|| (iCode >= 35 && iCode <= 40)		// Arrows, Home, End
		|| iCode == 44				// Delete
		|| iCode == 8				// Backspace
		|| iCode == 46				// Delete
		|| iCode == 9				// Tab
		);
}


// Return caret position in specified input control
function getCaretPos(obj)
{
	if (!obj)
		return 0;

	obj.focus();

	if (obj.selectionStart)			// Gecko
	{
		return obj.selectionStart;
	}
	else if (document.selection)		// IE
	{
		var sel = document.selection.createRange();
		var clone = sel.duplicate();
		sel.collapse(true);
		clone.moveToElementText(obj);
		clone.setEndPoint('EndToEnd', sel);
		return clone.text.length;
	}

	return 0;
}


// Check specified key code is float dot ('.' or ',')
function isDot(code)
{
	return (code == 44 || code == 46);
}


// Check specified string have float dot ('.' or ',')
function haveDot(str)
{
	return (typeof(str) == "string" && (str.indexOf('.') != -1 || str.indexOf(',') != -1));
}


function onFieldKey(event, obj)
{
	var code, isDig, isDel;

	if (!obj)
		return false;

	code = getCode(event);
	isDig = isDigit(code);
	isDel = (isDig && event.which == 0);

	if (!isDig)
		return false;

	if (!isDel)
	{
	// exclude ',' or '.' at start
		if ((obj.value == '' || (obj.value != '' && getCaretPos(obj) == 0)) && isDot(code))
			return false;

	// exclude ',' or '.' in one string
		if (obj.value != '' && isDot(code) && haveDot(obj.value))
			return false;
	}

	return true;
}


// Check string is correct date in dd.mm.yyyy format
function checkDate(str)
{
	var sparr;

	if (!str || !str.length)
		return false;

	sparr = str.split('.');
	if (sparr.length != 3)
		return false;

	if (!isNum(sparr[0]) || !isNum(sparr[1]) || !isNum(sparr[2]))
		return false;

	if (sparr[0] < 1 || sparr[0] > 31 || sparr[1] < 1 || sparr[1] > 12)
		return false;

	return true;
}


// Return text of selected option of select object
function selectedText(selectObj)
{
	if (!selectObj || !selectObj.options || selectObj.selectedIndex == -1)
		return -1;

	return selectObj.options[selectObj.selectedIndex].textContent;
}


// Return value of selected option of select object
function selectedValue(selectObj)
{
	if (!selectObj || !selectObj.options || selectObj.selectedIndex == -1)
		return -1;

	return selectObj.options[selectObj.selectedIndex].value;
}


// Select item with specified value if exist
function selectByValue(selectObj, selValue)
{
	var i;

	if (!selectObj || !selectObj.options)
		return -1;

	for(i = 0, l = selectObj.options.length; i < l; i++)
	{
		if (selectObj.options[i] && selectObj.options[i].value == selValue)
		{
			selectObj.selectedIndex = i;
			return true;
		}
	}

	return false;
}


// Return closure for function within specified context and arguments
function bind(func, context)
{
	var bindArgs = [].slice.call(arguments, 2);

	function wrapper()
	{
		var args = [].slice.call(arguments); 
		var unshiftArgs = bindArgs.concat(args);
		return func.apply(context, unshiftArgs);
	}

	return wrapper;
}


// Insert one DOM element after specified
function insertAfter(elem, refElem)
{
	var parent = refElem.parentNode;
	var next = refElem.nextSibling;
	if (next)
		return parent.insertBefore(elem, next);
	else
		return parent.appendChild(elem);
}


// Check specified element is child of specified
function isChild(elem, refElem)
{
	var curParent = null;

	if (!elem || !refElem)
		return false;

	curParent = elem.parentNode;
	while(curParent)
	{
		if (curParent == refElem)
			break;
		curParent = curParent.parentNode;
	}

	return (curParent == refElem);
}


// Remove all child nodes of specified element
function removeChilds(obj)
{
	if (!obj)
		return;

	while(obj.childNodes.length > 0) 
		 obj.removeChild(obj.childNodes[0]);
}


// Fix IE event object
function fixEvent(e, _this)
{
	e = e || window.event;

	if (!e.currentTarget)
		e.currentTarget = _this;
	if (!e.target)
		e.target = e.srcElement;

	if (!e.relatedTarget)
	{
		if (e.type == 'mouseover')
			e.relatedTarget = e.fromElement;
		if (e.type == 'mouseout')
			e.relatedTarget = e.toElement;
	}

	if (e.pageX == null && e.clientX != null )
	{
		var html = document.documentElement;
		var body = document.body;

		e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
		e.pageX -= html.clientLeft || 0;

		e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
		e.pageY -= html.clientTop || 0;
	}

	if (!e.which && e.button)
	{
		e.which = (e.button & 1) ? 1 : ((e.button & 2) ? 3 : ((e.button & 4) ? 2 : 0));
	}

	return e;
}


// Return wrapper to schedule specified function for execution after current script
function schedule(func)
{
	return bind(setTimeout, null, func, 0);
}


// Handler for click on empty space event
function onEmptyClick(callback, elem)
{
	var e, elem;

	callback = callback || null;
	if (!callback)
		return;
	e = fixEvent(event);

	if (!isArray(elem))
		elem = [elem];

	if (elem.every(function(el){
		el = ge(el) || null;

		return ((el && !isChild(e.target, el) && el != e.target) || !el);
	}))
		callback();
}


// Set or unset event handler for 
function setEmptyClick(callback, elem)
{
	callback = callback || null;
	elem = elem || null;

	if (document.documentElement)
	{
		document.documentElement.onclick = ((callback) ? bind(onEmptyClick, null, callback, elem) : null);
	}
}


// Hide usem menu popup
function hidePopup()
{
	show('menupopup', false);
	setEmptyClick();
}


// Show/hide user menu by click
function onUserClick()
{
	if (isVisible('menupopup'))
	{
		hidePopup();
	}
	else
	{
		show('menupopup', true);
		setEmptyClick(hidePopup, ['menupopup', 'userbtn']);
	}
}


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
