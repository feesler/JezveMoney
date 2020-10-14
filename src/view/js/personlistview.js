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

	this.showForm = ge('showform');
	this.showPersonsInp = ge('showpersons');
	if (!this.showForm || !this.showPersonsInp)
		throw new Error('Failed to initialize Person List view');

	this.hideForm = ge('hideform');
	this.hidePersonsInp = ge('hidepersons');
	this.delForm = ge('delform');
	this.delPersonsInp = ge('delpersons');
	if (!this.showForm || !this.showPersonsInp || !this.hideForm || !this.hidePersonsInp || !this.delForm || !this.delPersonsInp)
		throw new Error('Failed to initialize Person List view');

    this.toolbar = Toolbar.create({
        elem: 'toolbar',
        onshow: function() {
            this.showForm.submit();
        }.bind(this),
        onhide: function() {
            this.hideForm.submit()
        }.bind(this),
        ondelete: this.confirmDelete.bind(this)
    });
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
	this.toolbar.updateBtn.show(totalSelCount == 1);
	this.toolbar.showBtn.show(hiddenSelCount > 0);
	this.toolbar.hideBtn.show(selCount > 0);
	this.toolbar.deleteBtn.show(totalSelCount > 0);

	var selArr = this.model.selected.visible.getIdArray();
	var hiddenSelArr = this.model.selected.hidden.getIdArray();
	var totalSelArr = selArr.concat(hiddenSelArr);
	this.showPersonsInp.value = totalSelArr.join();
	this.hidePersonsInp.value = totalSelArr.join();
	this.delPersonsInp.value = totalSelArr.join();

	if (totalSelCount == 1)
	{
        this.toolbar.updateBtn.setURL(baseURL + 'persons/edit/' + totalSelArr[0]);
	}

	this.toolbar.show(totalSelCount > 0);
};


/**
 * Show person(s) delete confirmation popup
 */
PersonListView.prototype.confirmDelete = function()
{
	var totalSelCount = this.model.selected.visible.count() + this.model.selected.hidden.count();
	if (!totalSelCount)
		return;

    ConfirmDialog.create({
        id: 'delete_warning',
        title: (totalSelCount > 1) ? multiPersonsDeleteTitle : singlePersonDeleteTitle,
        content: (totalSelCount > 1) ? multiPersonsDeleteMsg : singlePersonDeleteMsg,
        onconfirm: function() {
            this.delForm.submit();
        }.bind(this)
    });
};
