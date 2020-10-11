// Types of transactions
var EXPENSE = 1;
var INCOME = 2;
var TRANSFER = 3;
var DEBT = 4;

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

