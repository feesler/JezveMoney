// Return DOM element by id
function ge(a)
{
	return (typeof a == 'string') ? document.getElementById(a) : a;
}


// Check object is array
function isArray(obj)
{
	return (Object.prototype.toString.call(obj) === '[object Array]');
}


// Check object is date
function isDate(obj)
{
	return (obj instanceof Date && !isNaN(obj.valueOf()));
}


// Check object is function
function isFunction(obj)
{
	var getType = {};
	return obj && (getType.toString.call(obj) === '[object Function]' || typeof obj === 'function');
}


// Check object is {}
function isObject(o)
{
	return null != o && typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
}


// Return deep copy of object
function copyObject(item)
{
	if (Array.isArray(item))
	{
		return item.map(copyObject);
	}
	else if (isObject(item))
	{
		let res = {};
		for(let key in item)
		{
			res[key] = copyObject(item[key]);
		}

		return res;
	}
	else
	{
		return item;
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
		if (isArray(val))
		{
			obj[par] = val.map(function(item){ return item; });
		}
		else if (isObject(val))
		{
			if (obj[par] == null || obj[par] === undefined)
				obj[par] = {};

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
	if (!obj || !childs)
		return;

	if (!isArray(childs))
		childs = [childs];

	childs.forEach(function(child)
	{
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


// Check is specified string is number
function isNum(val)
{
	if (val == 0)
		return true;
	else
		return res = (val / val) ? true : false;
}


// Check parameter is integer
function isInt(x)
{
	var y = parseInt(x);

	if (isNaN(y))
		return false;

	return x == y && x.toString() == y.toString();
}


// Return object visibility
function isVisible(obj, recursive)
{
	var robj = ge(obj);

	while(robj && robj.nodeType && robj.nodeType != 9)
	{
		if (!robj.style || robj.style.display == 'none')
			return false;

		if (recursive !== true)
			break;

		robj = robj.parentNode;
	}

	return !!robj;
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
	var option;

	if (!selectObj || !selectObj.options || selectObj.selectedIndex == -1)
		return -1;
	option = selectObj.options[selectObj.selectedIndex];

	return (option.textContent) ? option.textContent : option.innerText;
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


// Insert element as first child
function prependChild(parent, elem)
{
	var fe;

	if (!elem || !parent)
		return;

	fe = parent.firstChild;
	if (fe)
		insertBefore(elem, fe);
	else
		parent.appendChild(elem);
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
	return function()
	{
		setTimeout(func, 1);
	}
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

		return ((el && !el.contains(e.target) && el != e.target) || !el);
	}))
		callback();
}


// Set or unset event handler for
function setEmptyClick(callback, elem)
{
	var onClickHandler, evName;

	callback = callback || null;
	elem = elem || null;

	if (!document.documentElement)
		return;

	onClickHandler = ((callback) ? function(event)
	{
		event = event || window.event;
		onEmptyClick(event, callback, elem);
	} : null);

	evName = ('ontouchstart' in window) ? 'touchend' : 'click';

	if (onClickHandler && document.documentElement['on' + evName])
		document.documentElement['on' + evName]();			// run previously set callback
	document.documentElement['on' + evName] = null;
	schedule(function()
	{
		document.documentElement['on' + evName] = onClickHandler;
	})();
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


// Compare position of two node in the document
function comparePosition(a, b)
{
	return a.compareDocumentPosition ?
			a.compareDocumentPosition(b) :
			(a != b && a.contains(b) && 16) +
			(a != b && b.contains(a) && 8) +
			(a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
			(a.sourceIndex < b.sourceIndex && 4) + (a.sourceIndex > b.sourceIndex && 2) :
			1);
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

	if (!isObject(obj))
		return '';

	for(par in obj)
	{
		val = obj[par];
		if (isArray(val))
		{
			val.forEach(function(arrItem)
			{
				if (!isObject(arrItem))
					arr.push(encodeURIComponent(par) + '[]=' + encodeURIComponent(arrItem.toString()));
			});
		}
		else if (!isObject(val))
			arr.push(encodeURIComponent(par) + '=' + encodeURIComponent(val.toString()));
	}

	return arr.join('&');
}


// Cross-browser find head element
function head()
{
	if (document)
	{
		if (document.head)
			return document.head;
		else if (document.documentElement && document.documentElement.firstChild)
			return document.documentElement.firstChild;
	}

	return null;
}


// Set cross-browser transform value
function transform(elem, value)
{
	if (!elem || !elem.style)
		return;

	if (elem.style.webkitTransform !== undefined)
		elem.style.webkitTransform = value;
	else if (elem.style.MozTransform !== undefined)
		elem.style.MozTransform = value;
	else if (elem.style.msTransform !== undefined)
		elem.style.msTransform = value;
	else if (elem.style.transform !== undefined)
		elem.style.transform = value;
}


// Return fixed DPI value
function getRealDPI()
{
	if (window.devicePixelRatio)
		return window.devicePixelRatio;

	if (screen.deviceXDPI && screen.logicalXDPI)
		return screen.deviceXDPI / screen.logicalXDPI

	return screen.availWidth / document.documentElement.clientWidth;
}


// List of DOM ready handlers
var readyList = [];


// Bind DOM ready event handler
function bindReady(handler)
{
	var called = false

	function ready()
	{
		if (called)
			return;
		called = true;
		handler();
	}

	if (document.addEventListener)
	{
		document.addEventListener('DOMContentLoaded', function()
		{
			ready();
		}, false);
	}
	else if (document.attachEvent)
	{
		if (document.documentElement.doScroll && window == window.top)
		{
			function tryScroll()
			{
				if (called)
					return;
				if (!document.body)
					return;
				try
				{
					document.documentElement.doScroll('left');
					ready();
				}
				catch(e)
				{
					setTimeout(tryScroll, 0);
				}
			}
			tryScroll();
		}

		document.attachEvent('onreadystatechange', function()
		{
			if (document.readyState === 'complete')
			{
				ready();
			}
		});
	}

	if (window.addEventListener)
		window.addEventListener('load', ready, false);
	else if (window.attachEvent)
		window.attachEvent('onload', ready);
/*
	else
		window.onload=ready
*/
}


// Add new DOM ready event handler to the queue
function onReady(handler)
{
	if (!readyList.length)
	{
		bindReady(function()
		{
			for(var i = 0; i < readyList.length; i++)
			{
				readyList[i]();
			}
		});
	}

	readyList.push(handler);
}


// Extend child prototype by parent
function extend(Child, Parent)
{
	function F(){};

	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
	Child.parent = Parent.prototype;
}
