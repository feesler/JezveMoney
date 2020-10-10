var singlePersonDeleteTitle = 'Delete person';
var multiPersonsDeleteTitle = 'Delete persons';
var multiPersonsDeleteMsg = 'Are you sure want to delete selected persons?<br>Debt operations will be converted into expense or income.';
var singlePersonDeleteMsg = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';


/**
 * List of persons view
 */
function PersonListView(props)
{
	PersonListView.parent.constructor.apply(this, arguments);

	this.model = {
		selected: {
			visible : new Selection(),
			hidden : new Selection()
		}
	};

    if (this.props.persons)
    {
        this.model.persons = PersonList.create(this.props.persons);
    }
}


extend(PersonListView, View);


/**
 * View initialization
 */
PersonListView.prototype.onStart = function()
{
	this.tilesContainer = ge('tilesContainer');
	if (!this.tilesContainer)
		throw new Error('Failed to initialize Person List view');
	this.tilesContainer.addEventListener('click', this.onTileClick.bind(this));

	this.hiddenTilesContainer = ge('hiddenTilesContainer');
	if (!this.hiddenTilesContainer)
		throw new Error('Failed to initialize Person List view');
	this.hiddenTilesContainer.addEventListener('click', this.onTileClick.bind(this));

    this.updateBtn = IconLink.fromElement({ elem: 'edit_btn' });

	this.showForm = ge('showform');
	this.showPersonsInp = ge('showpersons');
    this.showBtn = IconLink.fromElement({
        elem: 'show_btn',
        onclick: function() {
            this.showForm.submit();
        }.bind(this)
    });
	if (!this.showBtn || !this.showForm || !this.showPersonsInp)
		throw new Error('Failed to initialize Person List view');

	this.hideForm = ge('hideform');
	this.hidePersonsInp = ge('hidepersons');
    this.hideBtn = IconLink.fromElement({
        elem: 'hide_btn',
        onclick: function() {
            this.hideForm.submit();
        }.bind(this)
    });
	if (!this.hideBtn || !this.hideForm || !this.hidePersonsInp)
		throw new Error('Failed to initialize Person List view');

	this.delForm = ge('delform');
	this.delPersonsInp = ge('delpersons');
    this.deleteBtn = IconLink.fromElement({
        elem: 'del_btn',
        onclick: this.showDeleteConfirmationPopup.bind(this)
    });
	if (!this.hideBtn || !this.hideForm || !this.delPersonsInp)
		throw new Error('Failed to initialize Person List view');
};


/**
 * Tile click event handler
 */
PersonListView.prototype.onTileClick = function(e)
{
	if (!e || !e.target)
		return;

	var tile = e.target.closest('.tile');
	if (!tile || !tile.dataset)
		return;

	var person_id = parseInt(tile.dataset.id);
	var person = this.model.persons.getItem(person_id);
	if (!person)
		return;
	
	var currentSelection = person.isVisible() ? this.model.selected.visible : this.model.selected.hidden;
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

	var selCount = this.model.selected.visible.count();
	var hiddenSelCount = this.model.selected.hidden.count();
	var totalSelCount = selCount + hiddenSelCount;
	show(this.updateBtn.elem, (totalSelCount == 1));
	show(this.showBtn.elem, (hiddenSelCount > 0));
	show(this.hideBtn.elem, (selCount > 0));
	show(this.deleteBtn.elem, (totalSelCount > 0));

	var selArr = this.model.selected.visible.getIdArray();
	var hiddenSelArr = this.model.selected.hidden.getIdArray();
	var totalSelArr = selArr.concat(hiddenSelArr);
	this.showPersonsInp.value = totalSelArr.join();
	this.hidePersonsInp.value = totalSelArr.join();
	this.delPersonsInp.value = totalSelArr.join();

	if (totalSelCount == 1)
	{
        this.updateBtn.setURL(baseURL + 'persons/edit/' + totalSelArr[0]);
	}

	show('toolbar', (totalSelCount > 0));
	if (totalSelCount > 0)
	{
		onScroll();
	}
};


/**
 * Delete button click event handler
 */
PersonListView.prototype.onDelete = function(e)
{
	this.showDeleteConfirmationPopup();
};


/**
 * Show person(s) delete confirmation popup
 */
PersonListView.prototype.showDeleteConfirmationPopup = function()
{
	var selCount = this.model.selected.visible.count();
	var hiddenSelCount = this.model.selected.hidden.count();
	var totalSelCount = selCount + hiddenSelCount;
	if (!totalSelCount)
		return;

	// check popup already created
	if (!this.delConfirmPopup)
	{
		this.delConfirmPopup = Popup.create({
			id : 'delete_warning',
			content : singlePersonDeleteMsg,
			btn : {
				okBtn : { onclick : this.onDeleteConfirmResult.bind(this, true) },
				cancelBtn : { onclick : this.onDeleteConfirmResult.bind(this, false) }
			}
		});
	}

	this.delConfirmPopup.setTitle((totalSelCount > 1) ? multiPersonsDeleteTitle : singlePersonDeleteTitle);
	this.delConfirmPopup.setContent((totalSelCount > 1) ? multiPersonsDeleteMsg : singlePersonDeleteMsg);

	this.delConfirmPopup.show();
};


/**
 * Delete confirmation result handler
 * @param {boolean} result - user confirmed delete
 */
PersonListView.prototype.onDeleteConfirmResult = function(result)
{
	if (this.delConfirmPopup)
		this.delConfirmPopup.close();

	if (result)
	{
		this.delForm.submit();
	}
};
