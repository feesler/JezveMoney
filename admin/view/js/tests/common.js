var vdoc = null;
var viewframe = null;


function vge(a)
{
	return (typeof a == 'string') ? vdoc.getElementById(a) : a;
}


function vquery(a)
{
	return (typeof a == 'string') ? vdoc.querySelector(a) : a;
}


function vqueryall(a)
{
	return (typeof a == 'string') ? vdoc.querySelectorAll(a) : a;
}


function clickEmul(elemObj)
{
	if (elemObj.click)
	{
		elemObj.click()
	}
	else if (document.createEvent)
	{
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, viewframe.contentWindow,
		0, 0, 0, 0, 0, false, false, false, false, 0, null);
		var allowDefault = elemObj.dispatchEvent(evt);
	}
}


function inputEmul(elemObj, val)
{
	elemObj.value = val;
	if (elemObj.oninput)
		elemObj.oninput();
}


function continueWith(callback)
{
	viewframe.onload = function()
	{
		vdoc = viewframe.contentWindow.document;
		if (!vdoc)
			throw 'View document not found';

		checkPHPerrors();
		header = parseHeader();
		callback();
	};
}

function checkPHPerrors()
{
	var errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>'];

	if (!vdoc || !vdoc.body)
		return true;

	var found = errSignatures.some(function(lookupStr)
	{
		return (vdoc.body.innerHTML.indexOf(lookupStr) !== -1);
	});

	if (found)
		addResult('PHP error signature found', false);
}


function isUserLoggedIn()
{
	return (header && header.user && header.user.menuBtn);
}


function parseHeader()
{
	var el;
	var res = {};

	res.elem = vquery('.page > .page_wrapper > .header');
	if (!res.elem)
		return res;		// no header is ok for login page

	res.logo = {};
	res.logo.elem = res.elem.querySelector('.logo');
	if (!res.logo.elem)
		throw 'Logo element not found';

	res.logo.linkElem = res.logo.elem.querySelector('a');
	if (!res.logo.linkElem)
		throw 'Logo link element not found';

	res.user = {};
	res.user.elem = res.elem.querySelector('.userblock');
	if (res.user.elem)
	{
		res.user.menuBtn = res.elem.querySelector('button.user_button');
		if (!res.user.menuBtn)
			throw 'User button not found';
		el = res.user.menuBtn.querySelector('.user_title');
		if (!el)
			throw 'User title element not found';
		res.user.name = el.innerHTML;

		res.user.menuEl = res.elem.querySelector('.usermenu');
		if (!res.user.menuEl)
			throw 'Menu element not found';

		res.user.menuItems = [];
		var menuLinks = res.user.menuEl.querySelectorAll('ul > li > a');
		for(var i = 0; i < menuLinks.length; i++)
		{
			el = menuLinks[i];
			res.user.menuItems.push({ elem : el, link : el.href, text : el.innerHTML });
		}
	}

	return res;
}


function parseId(id)
{
	if (typeof id !== 'string')
		return id;

	var pos = id.indexOf('_');
	return (pos != -1) ? parseInt(id.substr(pos + 1)) : id;
}


function parseTile(tileEl)
{
	if (!tileEl || !hasClass(tileEl, 'tile'))
		throw 'Wrong tile structure';

	var tileObj = { elem : tileEl, linkElem : tileEl.firstElementChild,
					balanceEL : tileEl.querySelector('.acc_bal'),
					nameEL : tileEl.querySelector('.acc_name') };

	tileObj.id = parseId(tileEl.id);
	tileObj.balance = tileObj.balanceEL.innerText;
	tileObj.name = tileObj.nameEL.innerText;

	return tileObj;
}


function parseInfoTile(tileEl)
{
	if (!tileEl || !hasClass(tileEl, 'info_tile'))
		throw 'Wrong info tile structure';

	var tileObj = { elem : tileEl,
					titleEl : tileEl.querySelector('.info_title'),
					subtitleEl : tileEl.querySelector('.info_subtitle') };

	tileObj.id = parseId(tileEl.id);
	tileObj.title = tileObj.titleEl.innerHTML;
	tileObj.subtitle = tileObj.subtitleEl.innerHTML;

	return tileObj;
}


function parseTiles(tilesEl, parseCallback)
{
	if (!tilesEl)
		return null;

	var res = [];
	if (!tilesEl || (tilesEl.children.length == 1 && tilesEl.children[0].tagName == 'SPAN'))
		return res;

	var callback = parseCallback || parseTile;
	for(var i = 0; i < tilesEl.children.length; i++)
	{
		var tileObj = callback(tilesEl.children[i]);
		if (!tileObj)
			throw 'Fail to parse tile';

		res.push(tileObj);
	}

	res.sort(function(a, b)
	{
		return (a.id == b.id) ? 0 : ((a.id < b.id) ? -1 : 1);
	});

	return res;
}


function parseInfoTiles(tilesEl)
{
	return parseTiles(tilesEl, parseInfoTile);
}


function parseDropDown(elem)
{
	var res = { elem : elem };
	if (!res.elem || (!hasClass(res.elem, 'dd_container') && !hasClass(res.elem, 'dd_attached')))
		throw 'Wrong drop down element';

	res.isAttached = hasClass(res.elem, 'dd_attached');
	if (res.isAttached)
		res.selectBtn = res.elem.firstElementChild;
	else
		res.selectBtn = res.elem.querySelector('button.selectBtn');
	if (!res.selectBtn)
		throw 'Select button not found';

	if (!res.isAttached)
	{
		res.statSel = res.elem.querySelector('.dd_input_cont span.statsel');
		if (!res.statSel)
			throw 'Static select element not found';
		res.input = res.elem.querySelector('.dd_input_cont input');
		if (!res.input)
			throw 'Input element not found';

		res.editable = isVisible(res.input);
		res.textValue = (res.editable) ? res.input.value : res.statSel.innerHTML;
	}

	res.selectElem = res.elem.querySelector('select');

	res.listContainer = res.elem.querySelector('.ddlist');
	if (res.listContainer)
	{
		var listItems = res.elem.querySelectorAll('.ddlist li > div');
		res.items = [];
		for(var i = 0; i < listItems.length; i++)
		{
			var li = listItems[i];
			var itemObj = { id : parseId(li.id), text : li.innerHTML, elem : li };

			res.items.push(itemObj);
		}
	}

	res.selectByValue = function(val)
	{
		clickEmul(this.selectBtn);
		var li = idSearch(this.items, val);
		if (!li)
			throw 'List item not found';
		clickEmul(li.elem);
	};

	return res;
}
