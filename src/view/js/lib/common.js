'use strict';

/* exported ge, isDate, isFunction, isObject, copyObject, setParam, addChilds, setEvents */
/* exported ce, svg, re, isNum, isInt, isVisible, show, enable, computedStyle */
/* exported getCaretPos, getCursorPos, checkDate, selectedText, selectedValue */
/* exported selectByValue, insertBefore, insertAfter, prependChild, removeChilds */
/* exported fixEvent, onEmptyClick, setEmptyClick, getOffset, getOffsetRect, getOffsetSum */
/* exported comparePosition, getPageScroll, isEmpty, childCount, px, urlJoin, head */
/* exported transform, getRealDPI, onReady, extend */
/* eslint no-restricted-globals: "off" */
/* eslint no-bitwise: "off" */

/** Return DOM element by id */
var ge = document.getElementById.bind(document);

/** Check object is date */
function isDate(obj) {
    return obj instanceof Date && !isNaN(obj.valueOf());
}

/** Check object is function */
function isFunction(obj) {
    var getType = {};
    return obj
        && (getType.toString.call(obj) === '[object Function]'
            || typeof obj === 'function');
}

/** Check parameter is object */
function isObject(o) {
    return 0 !== null
        && typeof o === 'object'
        && Object.prototype.toString.call(o) === '[object Object]';
}

/** Return deep copy of object */
function copyObject(item) {
    var res;

    if (Array.isArray(item)) {
        return item.map(copyObject);
    }

    if (isObject(item)) {
        res = {};

        Object.keys(item).forEach(function (key) {
            res[key] = copyObject(item[key]);
        });

        return res;
    }

    return item;
}

/* eslint-disable no-param-reassign */
/**
 * Assign properties from second object to first
 * @param {*} obj - object to assign properties to
 * @param {*} params - object to obtain properties from
 */
function setParam(obj, params) {
    if (!obj || !params || typeof params !== 'object') {
        return;
    }

    Object.keys(params).forEach(function (key) {
        var val = params[key];
        if (Array.isArray(val)) {
            obj[key] = val.map(function (item) { return item; });
        } else if (isObject(val)) {
            if (obj[key] === null || typeof obj[key] === 'undefined') {
                obj[key] = {};
            }

            setParam(obj[key], val);
        } else {
            try {
                obj[key] = val;
            } catch (e) {
                if (obj.setAttribute) {
                    obj.setAttribute(key, val);
                }
            }
        }
    });
}
/* eslint-enable no-param-reassign */

/** Set attributes to specified element */
function setAttributes(element, attrs) {
    if (!element || !isObject(attrs)) {
        return;
    }

    Object.keys(attrs).forEach(function (key) {
        element.setAttribute(key, attrs[key]);
    });
}

/**
 * Append child to specified element
 * @param {Element} elem - element to append child to
 * @param {Element[]} childs - element or array of elements to append
 */
function addChilds(elem, childs) {
    var ch;

    if (!elem || !childs) {
        return;
    }

    ch = Array.isArray(childs) ? childs : [childs];
    ch.forEach(function (child) {
        if (child) {
            elem.appendChild(child);
        }
    });
}

/**
 * Set up event handlers for specified element
 * @param {Element} elem - element to set event handlers
 * @param {Object} events - event handlers object
 */
function setEvents(elem, events) {
    if (!elem || !events) {
        return;
    }

    Object.keys(events).forEach(function (eventName) {
        elem.addEventListener(eventName, events[eventName]);
    });
}

/**
 * Create specified DOM element and set parameters if specified
 * @param {string} tagName - tag name of element to create
 * @param {Object} params - properties to set for created element
 * @param {Element[]} children - element or array of elements to append to created element
 * @param {Object} events - event handlers object
 */
function ce(tagName, params, children, events) {
    var elem;

    if (typeof tagName !== 'string') {
        return null;
    }

    elem = document.createElement(tagName);
    if (!elem) {
        return null;
    }

    if (params) {
        setParam(elem, params);
    }
    if (children) {
        addChilds(elem, children);
    }
    if (events) {
        setEvents(elem, events);
    }

    return elem;
}

/**
 * Create new SVG namespace element, set attributes
 * @param {string} tagName
 * @param {Object} attributes
 * @param {Element[]} children
 */
function svg(tagName, attributes, children) {
    var elem;

    if (typeof tagName !== 'string') {
        return null;
    }

    elem = document.createElementNS('http://www.w3.org/2000/svg', tagName);

    if (attributes) {
        setAttributes(elem, attributes);
    }

    if (children) {
        addChilds(elem, children);
    }

    return elem;
}

/** Remove specified element from DOM and return it */
function re(elem) {
    var removedElem = (typeof elem === 'string') ? ge(elem) : elem;

    if (removedElem && removedElem.parentNode) {
        return removedElem.parentNode.removeChild(removedElem);
    }

    return null;
}

/** Check is specified string is number */
function isNum(val) {
    var fval = parseFloat(val);
    if (fval === 0) {
        return true;
    }

    return !!(val / val);
}

/** Check parameter is integer */
function isInt(x) {
    var y = parseInt(x, 10);

    if (isNaN(y)) {
        return false;
    }

    return x === y && x.toString() === y.toString();
}

/** Return current computed style of element */
function computedStyle(elem) {
    if (!elem) {
        return null;
    }

    if (window.getComputedStyle) {
        return getComputedStyle(elem, '');
    }

    return elem.currentStyle;
}

/**
 * Return visibility of specified element
 * @param {Element|string} elem - element to check visibility of
 * @param {boolean} recursive - if set to true will check visibility of all parent nodes
 */
function isVisible(elem, recursive) {
    var cstyle;
    var robj = (typeof elem === 'string') ? ge(elem) : elem;

    while (robj && robj.nodeType && robj.nodeType !== 9) {
        cstyle = computedStyle(robj);
        if (!cstyle || cstyle.display === 'none' || cstyle.visibility === 'hidden') {
            return false;
        }

        if (recursive !== true) {
            break;
        }

        robj = robj.parentNode;
    }

    return !!robj;
}

/**
 * Show/hide specified element
 * @param {Element|string} elem - element or id to show/hide
 * @param {*} val - if set to true then element will be shown, hidden otherwise
 */
function show(elem, val) {
    var domElem = (typeof elem === 'string') ? ge(elem) : elem;
    if (!domElem || !domElem.classList) {
        return;
    }

    if (val) {
        domElem.classList.remove('hidden');
    } else {
        domElem.classList.add('hidden');
    }
}

/**
 * Enable or disable specified element
 * @param {Element|string} elem - element or id to show/hide
 * @param {boolean} val - if set to true then element will be enabled, disable otherwise
 */
function enable(elem, val) {
    var robj = (typeof elem === 'string') ? ge(elem) : elem;

    if (robj) {
        robj.disabled = (!val);
    }
}

/** Return caret position in specified input control */
function getCaretPos(elem) {
    var sel;
    var clone;

    if (!elem) {
        return 0;
    }

    elem.focus();

    if (elem.selectionStart) {
        return elem.selectionStart;
    }
    /* IE */
    if (document.selection) {
        sel = document.selection.createRange();
        clone = sel.duplicate();
        sel.collapse(true);
        clone.moveToElementText(elem);
        clone.setEndPoint('EndToEnd', sel);
        return clone.text.length;
    }

    return 0;
}

/**
 * Return curson/selection position for specified input element
 * @param {Element} input
 */
function getCursorPos(input) {
    var sel;
    var rng;
    var len;
    var pos;

    if (!input) {
        return null;
    }

    if ('selectionStart' in input && document.activeElement === input) {
        return {
            start: input.selectionStart,
            end: input.selectionEnd
        };
    }

    if (input.createTextRange) {
        sel = document.selection.createRange();
        if (sel.parentElement() === input) {
            rng = input.createTextRange();
            rng.moveToBookmark(sel.getBookmark());
            for (
                len = 0;
                rng.compareEndPoints('EndToStart', rng) > 0;
                rng.moveEnd('character', -1)
            ) {
                len += 1;
            }
            rng.setEndPoint('StartToStart', input.createTextRange());
            for (
                pos = { start: 0, end: len };
                rng.compareEndPoints('EndToStart', rng) > 0;
                rng.moveEnd('character', -1)
            ) {
                pos.start += 1;
                pos.end += 1;
            }
            return pos;
        }
    }

    return null;
}

/**
 * Set curson position for specified input element
 * @param {Element} input
 * @param {number} pos
 */
function setCursorPos(input, pos) {
    var range;

    if (!input) {
        return;
    }

    if (input.createTextRange) {
        range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    } else if (input.setSelectionRange) {
        input.setSelectionRange(pos, pos);
    }
}

/** Check string is correct date in dd.mm.yyyy format */
function checkDate(str) {
    var sparr;

    if (typeof str !== 'string' || !str.length) {
        return false;
    }

    sparr = str.split('.');
    if (sparr.length !== 3) {
        return false;
    }

    if (!isNum(sparr[0]) || !isNum(sparr[1]) || !isNum(sparr[2])) {
        return false;
    }

    if (sparr[0] < 1 || sparr[0] > 31 || sparr[1] < 1 || sparr[1] > 12 || sparr[2] < 1970) {
        return false;
    }

    return true;
}

/** Return text of selected option of select object */
function selectedText(selectObj) {
    var option;

    if (!selectObj || !selectObj.options || selectObj.selectedIndex === -1) {
        return -1;
    }

    option = selectObj.options[selectObj.selectedIndex];

    return (option.textContent) ? option.textContent : option.innerText;
}

/** Return value of selected option of select object */
function selectedValue(selectObj) {
    if (!selectObj || !selectObj.options || selectObj.selectedIndex === -1) {
        return -1;
    }

    return selectObj.options[selectObj.selectedIndex].value;
}

/**
 * Select item with specified value if exist
 * @param {Element} selectObj - select element
 * @param {*} selValue - option value to select
 * @param {boolean} selBool - if set to false then deselect option, select otherwise
 */
/* eslint-disable no-param-reassign */
function selectByValue(selectObj, selValue, selBool) {
    var option;
    var i;
    var l;
    var toSel;

    if (!selectObj || !selectObj.options || typeof selValue === 'undefined') {
        return false;
    }

    toSel = selValue.toString();
    for (i = 0, l = selectObj.options.length; i < l; i += 1) {
        option = selectObj.options[i];
        if (option && option.value === toSel) {
            if (selectObj.multiple) {
                option.selected = (typeof selBool !== 'undefined') ? selBool : true;
            } else {
                selectObj.selectedIndex = i;
            }
            return true;
        }
    }

    return false;
}
/* eslint-enable no-param-reassign */

/** Insert element before specified */
function insertBefore(elem, refElem) {
    if (!refElem || !refElem.parentNode) {
        return null;
    }

    return refElem.parentNode.insertBefore(elem, refElem);
}

/** Insert one DOM element after specified */
function insertAfter(elem, refElem) {
    var parent = refElem.parentNode;
    var next = refElem.nextSibling;

    if (next) {
        return parent.insertBefore(elem, next);
    }

    return parent.appendChild(elem);
}

/** Insert element as first child */
function prependChild(parent, elem) {
    var fe;

    if (!elem || !parent) {
        return;
    }

    fe = parent.firstChild;
    if (fe) {
        insertBefore(elem, fe);
    } else {
        parent.appendChild(elem);
    }
}

/** Remove all child nodes of specified element */
function removeChilds(elem) {
    if (!elem) {
        return;
    }

    while (elem.childNodes.length > 0) {
        elem.removeChild(elem.childNodes[0]);
    }
}

/* eslint-disable no-param-reassign */
/** Fix IE event object */
function fixEvent(e, _this) {
    var html;
    var body;

    e = e || window.event;

    if (!e.currentTarget) {
        e.currentTarget = _this;
    }
    if (!e.target) {
        e.target = e.srcElement;
    }

    if (!e.relatedTarget) {
        if (e.type === 'mouseover') {
            e.relatedTarget = e.fromElement;
        }
        if (e.type === 'mouseout') {
            e.relatedTarget = e.toElement;
        }
    }

    if (e.pageX === null && e.clientX !== null) {
        html = document.documentElement;
        body = document.body;

        e.pageX = e.clientX + (html.scrollLeft || (body && body.scrollLeft) || 0);
        e.pageX -= html.clientLeft || 0;

        e.pageY = e.clientY + (html.scrollTop || (body && body.scrollTop) || 0);
        e.pageY -= html.clientTop || 0;
    }

    if (!e.which && e.button) {
        if (e.button & 1) {
            e.which = 1;
        } else if (e.button & 2) {
            e.which = 3;
        } else {
            e.which = (e.button & 4) ? 2 : 0;
        }
    }

    return e;
}
/* eslint-enable no-param-reassign */

/**
 * Handler for click on empty space event
 * @param {Event} e - click event object
 * @param {Function} callback - event handler
 * @param {Element[]} elem - elements to skip handler if click occurs on it
 */
function onEmptyClick(e, callback, elem) {
    var notExcluded = true;
    var elems = Array.isArray(elem) ? elem : [elem];

    if (!isFunction(callback)) {
        return;
    }

    if (e) {
        notExcluded = elems.every(function (el) {
            var currentElem = ((typeof el === 'string') ? ge(el) : el) || null;

            return ((
                currentElem
                && !currentElem.contains(e.target)
                && currentElem !== e.target
            ) || !currentElem);
        });
    }

    if (notExcluded) {
        callback();
    }
}

/** Set or unset event handler for */
function setEmptyClick(callback, elem) {
    var onClickHandler = null;
    var handler = callback || null;

    if (!document.documentElement) {
        return;
    }

    if (isFunction(handler)) {
        onClickHandler = function (e) {
            onEmptyClick(e, handler, elem);
        };
    }

    document.documentElement.onclick = null;
    setTimeout(function () {
        document.documentElement.onclick = onClickHandler;
    });
}

/** Calculate offset of element by sum of offsets of parents */
function getOffsetSum(elem) {
    var el = elem;
    var top = 0;
    var left = 0;

    while (el) {
        top += parseInt(el.offsetTop, 10);
        left += parseInt(el.offsetLeft, 10);
        el = el.offsetParent;
    }

    return {
        top: top,
        left: left
    };
}

/** Calculate offset of element using getBoundingClientRect() method */
function getOffsetRect(elem) {
    var box = elem.getBoundingClientRect();
    var body = document.body;
    var docElem = document.documentElement;

    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;
    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return {
        top: Math.round(top),
        left: Math.round(left)
    };
}

/** Calculate offset of element */
function getOffset(elem) {
    if (elem.getBoundingClientRect) {
        return getOffsetRect(elem);
    }

    return getOffsetSum(elem);
}

/** Compare position of two node in the document */
function comparePosition(a, b) {
    if (a.compareDocumentPosition) {
        return a.compareDocumentPosition(b);
    }

    return (a !== b && a.contains(b) && 16) + (a !== b && b.contains(a) && 8)
        + ((a.sourceIndex >= 0 && b.sourceIndex >= 0)
            ? (a.sourceIndex < b.sourceIndex && 4) + (a.sourceIndex > b.sourceIndex && 2)
            : 1);
}

/** Return page scroll */
function getPageScroll() {
    var html;
    var body;
    var top;
    var left;

    if (typeof window.pageXOffset !== 'undefined') {
        return {
            left: pageXOffset,
            top: pageYOffset
        };
    }

    html = document.documentElement;
    body = document.body;

    top = html.scrollTop || (body && body.scrollTop) || 0;
    top -= html.clientTop;

    left = html.scrollLeft || (body && body.scrollLeft) || 0;
    left -= html.clientLeft;

    return { top: top, left: left };
}

/** Check object is empty */
function isEmpty(obj) {
    if (typeof obj === 'object') {
        return Object.keys(obj).length === 0;
    }

    return true;
}

/** Return count of children of object */
function childCount(obj) {
    if (typeof obj === 'object') {
        return Object.keys(obj).length;
    }

    return 0;
}

/** Return string for value in pixels */
function px(val) {
    return parseInt(val, 10) + 'px';
}

/** Join parameters and values of object to URL */
function urlJoin(obj) {
    var arr = [];

    if (!isObject(obj)) {
        return '';
    }

    Object.keys(obj).forEach(function (key) {
        var val = obj[key];
        if (Array.isArray(val)) {
            val.forEach(function (arrItem) {
                if (!isObject(arrItem)) {
                    arr.push(encodeURIComponent(key) + '[]=' + encodeURIComponent(arrItem.toString()));
                }
            });
        } else if (!isObject(val)) {
            arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(val.toString()));
        }
    });

    return arr.join('&');
}

/** Cross-browser find head element */
function head() {
    if (document) {
        if (document.head) {
            return document.head;
        }
        if (document.documentElement && document.documentElement.firstChild) {
            return document.documentElement.firstChild;
        }
    }

    return null;
}

/* eslint-disable no-param-reassign */
/** Set cross-browser transform value */
function transform(elem, value) {
    if (!elem || !elem.style) {
        return;
    }

    if (typeof elem.style.webkitTransform !== 'undefined') {
        elem.style.webkitTransform = value;
    } else if (typeof elem.style.MozTransform !== 'undefined') {
        elem.style.MozTransform = value;
    } else if (typeof elem.style.msTransform !== 'undefined') {
        elem.style.msTransform = value;
    } else if (typeof elem.style.transform !== 'undefined') {
        elem.style.transform = value;
    }
}
/* eslint-enable no-param-reassign */

/** Return fixed DPI value */
function getRealDPI() {
    if (window.devicePixelRatio) {
        return window.devicePixelRatio;
    }

    if (screen.deviceXDPI && screen.logicalXDPI) {
        return screen.deviceXDPI / screen.logicalXDPI;
    }

    return screen.availWidth / document.documentElement.clientWidth;
}

/** Bind DOM ready event handler */
function bindReady(handler) {
    var called = false;

    function ready() {
        if (called) {
            return;
        }
        called = true;
        handler();
    }

    function tryScroll() {
        if (called) {
            return;
        }
        if (!document.body) {
            return;
        }
        try {
            document.documentElement.doScroll('left');
            ready();
        } catch (e) {
            setTimeout(tryScroll, 0);
        }
    }

    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', function () {
            ready();
        }, false);
    } else if (document.attachEvent) {
        if (document.documentElement.doScroll && window === window.top) {
            tryScroll();
        }

        document.attachEvent('onreadystatechange', function () {
            if (document.readyState === 'complete') {
                ready();
            }
        });
    }

    if (window.addEventListener) {
        window.addEventListener('load', ready, false);
    } else if (window.attachEvent) {
        window.attachEvent('onload', ready);
    }
}

/** Add new DOM ready event handler to the queue */
function onReady(handler) {
    if (!onReady.readyList.length) {
        bindReady(function () {
            var i;

            for (i = 0; i < onReady.readyList.length; i += 1) {
                onReady.readyList[i]();
            }
        });
    }

    onReady.readyList.push(handler);
}

/** List of DOM ready handlers */
onReady.readyList = [];

/* eslint-disable no-param-reassign */
/** Extend child prototype by parent */
function extend(Child, Parent) {
    function F() { }

    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.parent = Parent.prototype;
}
/* eslint-enable no-param-reassign */
