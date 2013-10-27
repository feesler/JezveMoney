var dwPopup;		// delete warning popup


var persons =
{
	selectedArr : [],

	// Return position of person in selectedArr
	getPos : function(p_id)
	{
		return this.selectedArr.indexOf(p_id);
	},


	isSelected : function(p_id)
	{
		return this.selectedArr.some(function(person_id){ return person_id == p_id; });
	},


	selectPerson : function(p_id)
	{
		if (!p_id || this.isSelected(p_id))
			return false;

		this.selectedArr.push(p_id);
		return true;
	},


	deselectPerson : function(p_id)
	{
		var p_pos = this.getPos(p_id);

		if (p_pos == -1)
			return false;

		this.selectedArr.splice(p_pos, 1);
		return true;
	},


	selectedCount : function()
	{
		return this.selectedArr.length;
	}
};


// Tile click event handler
function onTileClick(p_id)
{
	var tile, edit_btn, del_btn, delpersons;
	var actDiv;

	tile = ge('p_' + p_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	delpersons = ge('delpersons');
	if (!tile || !edit_btn || !delpersons)
		return;

	if (persons.isSelected(p_id))
	{
		persons.deselectPerson(p_id);

		actDiv = ge('act_' + p_id);
		if (actDiv)
			tile.removeChild(actDiv);
	}
	else
	{
		persons.selectPerson(p_id);

		actDiv = ce('div', { id : 'act_' + p_id, className : 'act', onclick : bind(onTileClick, null, p_id) });

		tile.appendChild(actDiv);
	}

	show(edit_btn, (persons.selectedCount() == 1));
	show(del_btn, (persons.selectedCount() > 0));

	delpersons.value = persons.selectedArr.join();

	if (persons.selectedCount() == 1)
	{
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = './editperson.php?id=' + persons.selectedArr[0];
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
	persons.selectPerson(person_id);

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

	if (persons.selectedCount() == 0)
		return;

	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	multi = (persons.selectedCount() > 1);
	if (!dwPopup.create({ id : 'delete_warning',
						title : (multi) ? multiPersonsDeleteTitle : singlePersonDeleteTitle,
						msg : (multi) ? multiPersonsDeleteMsg : singlePersonDeleteMsg,
						btn : { okBtn : { onclick : bind(onDeletePopup, null, true) },
						cancelBtn : { onclick : bind(onDeletePopup, null, false) } }
						}))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();
}
