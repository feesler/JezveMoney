// Types of transactions
var EXPENSE = 1;
var INCOME = 2;
var TRANSFER = 3;
var DEBT = 4;


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


// Close message box
function onCloseMessage()
{
	re('action_msg');
	setEmptyClick();
}


// Initialization of message hiding
function initMessage()
{
	setEmptyClick(onCloseMessage, ['action_msg']);
}


// Create message
function createMessage(message, msgClass)
{
	var messageBox, page, pageWrapper, header;

	messageBox = ce('div', { id : 'action_msg', className : 'msg ' + msgClass },
					ce('div', {},
						ce('div', {},
							[ ce('div', { className : 'close_btn' },
								ce('div', { className : 'iconlink small_icon' },
									ce('button', { type : 'button', onclick : onCloseMessage.bind(null) },
										ce('span', { className : 'icon close' })))),
							ce('span', { innerHTML : message })
							])));

	page = firstElementChild(document.body);
	pageWrapper = firstElementChild(page);
	header = firstElementChild(pageWrapper);
	if (header)
		insertAfter(messageBox, header);

	initMessage();
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


// Correct calculated value
function correct(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(val).toFixed(prec));
}


// Correct calculated exchange rate value
function correctExch(val)
{
	return correct(val, 5);
}


// Normalize monetary value from string
function normalize(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(fixFloat(val)).toFixed(prec));
}


// Normalize exchange rate value from string
function normalizeExch(val)
{
	return normalize(val, 5);
}


// Check value is valid
function isValidValue(val)
{
	return (val != undefined && val != null && val !== '');
}


// Search for array of objects by id key
function idSearch(arr, id)
{
	var res = null;

	if (!isArray(arr))
		return res;

	arr.some(function(obj)
	{
		var cond = (obj && obj.id == id);

		if (cond)
			res = obj;

		return cond;
	});

	return res;
}


// Check real DPI value and load required stylesheet
function fixDPI()
{
	var headEl, img_css;

	if (getRealDPI() > 1)
		return;

	img_css = baseURL + 'view/css/ie8.css';
	headEl = head();

	if (headEl)
		headEl.appendChild(ce('link', { rel : 'stylesheet', href : img_css }));
}
