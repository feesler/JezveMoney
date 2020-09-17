var selected = {
	visible : new Selection(),
	hidden : new Selection()
};
var dwPopup = null;		// delete warning popup


// Tile click event handler
function onTileClick(e)
{
	if (!e || !e.target)
		return;

	var tile = e.target.closest('.tile');
	if (!tile || !tile.dataset)
		return;

	var person_id = parseInt(tile.dataset.id);
	var person = getPerson(person_id);
	if (!person)
		return;

	var edit_btn = ge('edit_btn');
	var show_btn = ge('show_btn');
	var hide_btn = ge('hide_btn');
	var del_btn = ge('del_btn');
	var showpersons = ge('showpersons');
	var hidepersons = ge('hidepersons');
	var delpersons = ge('delpersons');
	if (!edit_btn || !show_btn || !hide_btn || !del_btn || !showpersons || !hidepersons || !delpersons)
		return;

	var currentSelection = isHiddenPerson(person) ? selected.hidden : selected.visible;
	if (currentSelection.isSelected(person_id))
	{
		currentSelection.deselect(person_id);

		tile.classList.remove('tile_selected');
	}
	else
	{
		currentSelection.select(person_id);

		tile.classList.add('tile_selected');
	}

	var selCount = selected.visible.count();
	var hiddenSelCount = selected.hidden.count();
	var totalSelCount = selCount + hiddenSelCount;
	show(edit_btn, (totalSelCount == 1));
	show(show_btn, (hiddenSelCount > 0));
	show(hide_btn, (selCount > 0));
	show(del_btn, (totalSelCount > 0));

	var selArr = selected.visible.getIdArray();
	var hiddenSelArr = selected.hidden.getIdArray();
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
	selected.visible.select(person_id);

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
	var totalSelCount = selected.visible.count() + selected.hidden.count();
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
}


function initPersonsList()
{
	var tilesContainer = ge('tilesContainer');
	var hiddenTilesContainer = ge('hiddenTilesContainer');
	var del_btn = ge('del_btn');
	if (!tilesContainer || !hiddenTilesContainer || !del_btn)
		return;

	initToolbar();

	tilesContainer.addEventListener('click', onTileClick);
	hiddenTilesContainer.addEventListener('click', onTileClick);

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

	var btnEl = del_btn.firstElementChild;
	if (btnEl)
		btnEl.onclick = showDeletePopup;
}
