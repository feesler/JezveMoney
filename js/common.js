// Return DOM element by id
function ge(a)
{
	return (typeof a == 'string') ? document.getElementById(a) : a;
}


// Check object is array
function isArray(obj)
{
	return (typeof obj === 'object' && obj.constructor.toString().indexOf('Array') != -1);
}


// Check object is date
function isDate(obj)
{
	return (typeof obj === 'object' && obj.constructor.toString().indexOf('Date') != -1);
}


// Check object is function
function isFunction(obj)
{
	var getType = {};
	return obj && getType.toString.call(obj) === '[object Function]';
}


// Check item is in array
function inArray(arr, val)
{
	if (!isArray(arr))
		return false;

	if (Array.prototype.indexOf)
	{
		return (arr.indexOf(val) != -1);
	}
	else
	{
		var i = arr.length;

		while(i--)
		{
			if (arr[i] === val)
				return true;
		}

		return false;
	}
}


// Wrapper for Array.prototype.every
function every(arr, func)
{
	if (!isArray(arr))
		throw new TypeError();

	if (!isFunction(func))
		throw new TypeError();

	if (Array.prototype.every)
	{
		return arr.every(func);
	}
	else
	{
		for(var i = 0; i < arr.length; i++)
		{
			if (!func(arr[i], i, arr))
				return false;
		}

		return true;
	}
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
		{
			setParam(obj[par], val);
		}
		else
		{
			try
			{
				obj[par] = val;
			}
			catch(e)
			{
				if (obj.setAttribute)
					obj.setAttribute(par, val);
			}
		}
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

	return (robj && robj.parentNode) ? robj.parentNode.removeChild(robj) : null;
}


// document.write wrapper
function dw(a)
{
	document.write(a);
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


// Return current computed style of element
function computedStyle(obj)
{
	if (!obj)
		return null;

	if (window.getComputedStyle)
		return getComputedStyle(obj, '');
	else
		return obj.currentStyle;
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
function selectByValue(selectObj, selValue, selBool)
{
	var i;

	if (!selectObj || !selectObj.options)
		return -1;

	for(i = 0, l = selectObj.options.length; i < l; i++)
	{
		if (selectObj.options[i] && selectObj.options[i].value == selValue)
		{
			selectObj.options[i].selected = (selBool !== undefined) ? selBool : true;
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


// Insert one DOM element before specified
function insertBefore(elem, refElem)
{
	if (!refElem || !refElem.parentNode)
		return null;

	return refElem.parentNode.insertBefore(elem, refElem);
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


// Wrapper for childElementCount Node property for IE8 and less
function childElementCount(el)
{
	var res = 0;

	if (!el || el === undefined)
		return 0;

	el = el.firstChild;
	while(el)
	{
		if (el.nodeType == 1)
			res++;
		el = el.nextSibling;
	}

	return res;
}


// Wrapper for firstElementChild Node property for IE8 and less
function firstElementChild(el)
{
	if (!el || el === undefined)
		return null;

	if (el.firstElementChild)
		return el.firstElementChild;

	el = el.firstChild;
	while(el && el.nodeType !== 1)
	{
		el = el.nextSibling;
	}

	return el;
}


// Wrapper for lastElementChild Node property for IE8 and less
function lastElementChild(el)
{
	if (!el || el === undefined)
		return null;

	if (el.lastElementChild)
		return el.lastElementChild;

	el = el.firstChild;
	while(el && el.nodeType !== 1)
	{
		el = el.nextSibling;
	}

	return el;
}


// Wrapper for nextElementSibling Node property for IE8 and less
function nextElementSibling(el)
{
	if (!el || el === undefined)
		return null;

	if (el.nextElementSibling)
		return el.nextElementSibling;
	do
	{
		el = el.nextSibling;
	}
	while(el && el.nodeType !== 1);

	return el;
}


// Wrapper for previousElementSibling Node property for IE8 and less
function previousElementSibling(el)
{
	if (!el || el === undefined)
		return null;

	if (el.previousElementSibling)
		return el.previousElementSibling;
	do
	{
		el = el.previousSibling;
	}
	while(el && el.nodeType !== 1);

	return el;
}


// Check element is child of specified
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
function onEmptyClick(e, callback, elem)
{
	var e, elem;

	callback = callback || null;
	if (!callback)
		return;
	e = fixEvent(e);

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
	var onClickHandler;

	callback = callback || null;
	elem = elem || null;

	if (document.documentElement)
	{
		onClickHandler = ((callback) ? function(event)
		{
			event = event || window.event;
			onEmptyClick(event, callback, elem);
		} : null);

		if (onClickHandler && document.documentElement.onclick)
			document.documentElement.onclick();			// run previously set callback
		document.documentElement.onclick = onClickHandler;
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


// Add CSS class to element
function addClass(elem, clName)
{ 
	var clArr, i;

	if (!elem || elem.className === undefined || !clName)
		return;

	clArr = (elem.className != '') ? elem.className.split(' ') : [];
	arr = isArray(clName);
	for(i = 0; i < clArr.length; i++)
	{
		if ((arr && inArray(clName, clArr[i])) || (!arr && clArr[i] == clName))
		{
			clArr.splice(i--, 1);
		}
	}
	clArr = clArr.concat(clName);
	elem.className = clArr.join(' ');
}


// Remove specified CSS class from emelent
function removeClass(elem, clName)
{
	var clArr, i, arr;

	if (!elem || !elem.className || !clName)
		return;

	clArr = (elem.className != '') ? elem.className.split(' ') : [];
	arr = isArray(clName);
	for (i = 0; i < clArr.length; i++)
	{
		if ((arr && inArray(clName, clArr[i])) || (!arr && clArr[i] == clName))
		{
			clArr.splice(i--, 1);
		}
	}

	elem.className = clArr.join(' ');
}


// Check emelent has specified CSS class
function hasClass(elem, clName)
{
	var clArr, i;

	if (!elem || !elem.className || !clName)
		return false;

	clArr = (elem.className != '') ? elem.className.split(' ') : [];
	clName = isArray(clName) ? clName : [clName];
	return every(clName, function(cls)
	{
		return inArray(clArr, cls);
	});
}


// Return page scroll
function getPageScroll()
{
	if (window.pageXOffset != undefined)
	{
		return {
			left: pageXOffset,
			top: pageYOffset
		};
	}
	else
	{
		var html = document.documentElement;
		var body = document.body;

		var top = html.scrollTop || body && body.scrollTop || 0;
		top -= html.clientTop;

		var left = html.scrollLeft || body && body.scrollLeft || 0;
		left -= html.clientLeft;

		return { top: top, left: left };
	}
}


// Check object is empty
function isEmpty(obj)
{
	if (typeof obj === 'object')
	{
		for(var par in obj)
			return false;
	}

	return true;
}


// Return count of children of object
function childCount(obj)
{
	var res = 0;

	if (typeof obj === 'object')
	{
		for(var par in obj)
			res++;
	}

	return res;
}


// Return string for value in pixels
function px(val)
{
	return parseInt(val) + 'px';
}


// Join parameters and values of object to URL
function urlJoin(obj)
{
	var arr = [], par;

	if (typeof obj !== 'object')
		return '';

	for(par in obj)
	{
		val = obj[par];
		if (typeof val !== 'object')
			arr.push(par + '=' + val.toString());
	}

	return arr.join('&');
}
