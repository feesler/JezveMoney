// Types of transactions
var EXPENSE = 1;
var INCOME = 2;
var TRANSFER = 3;
var DEBT = 4;

// Account flags
var ACCOUNT_HIDDEN = 1;

// Person flags
var PERSON_HIDDEN = 1;

// Theme constants
var WHITE_THEME = 0;
var DARK_THEME = 1;


// Clear validation state of block
function clearBlockValidation(block)
{
	var blockElem = ge(block);
	if (blockElem)
		blockElem.classList.remove('invalid-block');
}


// Set invalid state for block
function invalidateBlock(block)
{
	var blockElem = ge(block);
	if (blockElem)
		blockElem.classList.add('invalid-block');
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


function onToggleTheme(e)
{
	var newTheme = e.target.checked ? DARK_THEME : WHITE_THEME;

	var linkElem = ge('theme-style');
	if (linkElem)
		linkElem.href = baseURL + 'view/css/' + themes[newTheme];

	ajax.get({
		url : baseURL + 'main/setTheme/?theme=' + newTheme
	});
}


var messageBox = null;


// Create message
function createMessage(message, msgClass)
{
	if (messageBox)
	{
		messageBox.destroy();
		messageBox = null;
	}

	messageBox = Popup.create({ id : 'notificationPopup',
						content : message,
						btn : { closeBtn : true },
						additional : 'msg ' + msgClass,
						nodim : true,
						closeOnEmptyClick : true
					});

	messageBox.show();
}


// Fix string to correct float number format
function fixFloat(str)
{
	if (typeof(str) == "string")
	{
		str = str.replace(/,/g, '.');
		if (str.indexOf('.') === 0 || !str.length)
			str = '0' + str;
		return str;
	}
	else if (typeof(str) == "number")
		return str;
	else
		return null;
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
	return (typeof val !== 'undefined' && val != null && !isNaN(parseFloat(fixFloat(val))));
}


// Search for array of objects by id key
function idSearch(arr, id)
{
	var res = null;

	if (!Array.isArray(arr))
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


function initHeader()
{
	var userbtn = ge('userbtn');
	if (userbtn)
		userbtn.onclick = onUserClick;

	var themeCheck = ge('theme-check');
	if (themeCheck)
		themeCheck.addEventListener('change', onToggleTheme);
}


onReady(initHeader);
