var persons = null;
var hiddenPersons = null;
var dwPopup = null;		// delete warning popup


// Tile click event handler
function onTileClick(p_id, isHidden)
{
	var tile = ge('p_' + p_id);
	var edit_btn = ge('edit_btn');
	var show_btn = ge('show_btn');
	var hide_btn = ge('hide_btn');
	var del_btn = ge('del_btn');
	var showpersons = ge('showpersons');
	var hidepersons = ge('hidepersons');
	var delpersons = ge('delpersons');
	if (!tile || !edit_btn || !show_btn || !hide_btn || !showpersons || !hidepersons || !delpersons)
		return;

	var currentSelection = isHidden ? hiddenPersons : persons;
	var actDiv;
	if (currentSelection.isSelected(p_id))
	{
		currentSelection.deselect(p_id);

		actDiv = ge('act_' + p_id);
		if (actDiv)
			tile.removeChild(actDiv);
	}
	else
	{
		currentSelection.select(p_id);

		actDiv = ce('div', { id : 'act_' + p_id, className : 'act', onclick : onTileClick.bind(null, p_id, isHidden) });

		tile.appendChild(actDiv);
	}

	var selCount = persons.count();
	var hiddenSelCount = hiddenPersons.count();
	var totalSelCount = selCount + hiddenSelCount;
	show(edit_btn, (totalSelCount == 1));
	show(show_btn, (hiddenSelCount > 0));
	show(hide_btn, (selCount > 0));
	show(del_btn, (totalSelCount > 0));

	var selArr = persons.getIdArray();
	var hiddenSelArr = hiddenPersons.getIdArray();
	var totalSelArr = selArr.concat(hiddenSelArr);
	showpersons.value = totalSelArr.join();
	hidepersons.value = totalSelArr.join();
	delpersons.value = totalSelArr.join();

	if (totalSelCount == 1)
	{
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = baseURL + 'persons/edit/' + totalSelArr[0];
	}

	show('toolbar', (totalSelCount > 0));
	if (totalSelCount > 0)
	{
		onScroll();
	}
}


// Person form submit event handler
function onPersonSubmit(frm)
{
	var p_name = ge('pname');
	if (!p_name)
		return false;

	var valid = true;
	if (!p_name.value || p_name.value == '')
	{
		invalidateBlock('name-inp-block');
		p_name.focus();
		valid = false;
	}

	return valid;
}


var singlePersonDeleteTitle = 'Delete person';
var multiPersonsDeleteTitle = 'Delete persons';
var multiPersonsDeleteMsg = 'Are you sure want to delete selected persons?<br>Debt operations will be converted into expense or income.';
var singlePersonDeleteMsg = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';


// Delete person iconlink click event handler
function onDelete()
{
	persons.select(person_id);

	showDeletePopup();
}


// Delete popup callback
function onDeletePopup(res)
{
	var delform;

	if (dwPopup)
		dwPopup.close();

	if (res)
	{
		delform = ge('delform');
		if (delform)
			delform.submit();
	}
}


// Create and show person delete warning popup
function showDeletePopup()
{
	var totalSelCount = persons.count() + hiddenPersons.count();
	if (totalSelCount == 0)
		return;

	var multi = (totalSelCount > 1);

	// check popup already created
	if (!dwPopup)
	{
		dwPopup = Popup.create({ id : 'delete_warning',
						content : (multi) ? multiPersonsDeleteMsg : singlePersonDeleteMsg,
						btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
						cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
					});
	}

	dwPopup.setTitle((multi) ? multiPersonsDeleteTitle : singlePersonDeleteTitle);
	dwPopup.setContent((multi) ? multiPersonsDeleteMsg : singlePersonDeleteMsg);

	dwPopup.show();
}


function initControls()
{
	var personForm = ge('personForm');
	if (!personForm)
		return;

	personForm.onsubmit = onPersonSubmit;

	var nameInp = ge('pname');
	if (nameInp)
	{
		nameInp.addEventListener('input', function()
		{
			clearBlockValidation('name-inp-block');
		});
	}

	var del_btn = ge('del_btn');
	if (del_btn)
		del_btn.onclick = onDelete;

	persons = new Selection();
	hiddenPersons = new Selection();
}


function initPersonsList()
{
	var tilesContainer, tileEl, btnEl, del_btn;
	var pos, tile_id;

	tilesContainer = ge('tilesContainer');
	del_btn = ge('del_btn');
	if (!tilesContainer || !del_btn)
		return;

	initToolbar();
	persons = new Selection();
	hiddenPersons = new Selection();

	tileEl = tilesContainer.firstElementChild;
	while(tileEl)
	{
		pos = tileEl.id.indexOf('_');
		if (pos !== -1)
		{
			tile_id = parseInt(tileEl.id.substr(pos + 1));
			if (!isNaN(tile_id))
			{
				btnEl = tileEl.firstElementChild;
				if (btnEl)
					btnEl.onclick = onTileClick.bind(null, tile_id, false);
			}
		}

		tileEl = tileEl.nextElementSibling;
	}

	tileEl = hiddenTilesContainer.firstElementChild;
	while(tileEl)
	{
		pos = tileEl.id.indexOf('_');
		if (pos !== -1)
		{
			tile_id = parseInt(tileEl.id.substr(pos + 1));
			if (!isNaN(tile_id))
			{
				btnEl = tileEl.firstElementChild;
				if (btnEl)
					btnEl.onclick = onTileClick.bind(null, tile_id, true);
			}
		}

		tileEl = tileEl.nextElementSibling;
	}

	show_btn.addEventListener('click', function()
	{
		var showform = ge('showform');
			showform.submit();
	});

	hide_btn.addEventListener('click', function()
	{
		var hideform = ge('hideform');
			hideform.submit();
	});

	btnEl = del_btn.firstElementChild;
	if (btnEl)
		btnEl.onclick = showDeletePopup;
}
