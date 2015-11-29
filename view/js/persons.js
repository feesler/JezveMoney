var persons = new Selection();
var dwPopup;		// delete warning popup


// Tile click event handler
function onTileClick(p_id)
{
	var tile, edit_btn, del_btn, delpersons;
	var actDiv;
	var selArr;

	tile = ge('p_' + p_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	delpersons = ge('delpersons');
	if (!tile || !edit_btn || !delpersons)
		return;

	if (persons.isSelected(p_id))
	{
		persons.deselect(p_id);

		actDiv = ge('act_' + p_id);
		if (actDiv)
			tile.removeChild(actDiv);
	}
	else
	{
		persons.select(p_id);

		actDiv = ce('div', { id : 'act_' + p_id, className : 'act', onclick : onTileClick.bind(null, p_id) });

		tile.appendChild(actDiv);
	}

	show(edit_btn, (persons.count() == 1));
	show(del_btn, (persons.count() > 0));

	selArr = persons.getIdArray();
	delpersons.value = selArr.join();

	if (persons.count() == 1)
	{
		if (firstElementChild(edit_btn) && firstElementChild(edit_btn).tagName.toLowerCase() == 'a')
			firstElementChild(edit_btn).href = baseURL + 'persons/edit/' + selArr[0];
	}

	show('toolbar', (persons.count() > 0));
	if (persons.count() > 0)
	{
		onScroll();
	}
}


// New person form submit event handler
function onNewPersonSubmit(frm)
{
	var p_name;

	if (!frm)
		return false;

	p_name = ge('pname');
	if (!p_name)
		return false;

	if (!p_name.value || p_name.value == '')
	{
		alert('Please input person name.');
		p_name.focus();
		return false;
	}

	return true;
}


// Edit person form submit event handler
function onEditPersonSubmit(frm)
{
	var pid, p_name;

	if (!frm)
		return false;

	pid = ge('pid');
	p_name = ge('pname');
	if (!pid || !p_name)
		return false;

	if (!p_name.value || p_name.value == '')
	{
		alert('Please input person name.');
		p_name.focus();
		return false;
	}

	return true;
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

	if (!dwPopup)
		return;

	dwPopup.close();
	dwPopup = null;

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
	var multi;

	if (persons.count() == 0)
		return;

	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	multi = (persons.count() > 1);
	if (!dwPopup.create({ id : 'delete_warning',
						title : (multi) ? multiPersonsDeleteTitle : singlePersonDeleteTitle,
						msg : (multi) ? multiPersonsDeleteMsg : singlePersonDeleteMsg,
						btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
						cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
						}))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();
}
