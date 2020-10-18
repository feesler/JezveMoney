'use strict';

/* global ge, extend, View, PersonList, baseURL, Toolbar, ConfirmDialog */

var singlePersonDeleteTitle = 'Delete person';
var multiPersonsDeleteTitle = 'Delete persons';
var multiPersonsDeleteMsg = 'Are you sure want to delete selected persons?<br>Debt operations will be converted into expense or income.';
var singlePersonDeleteMsg = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';

/**
 * List of persons view
 */
function PersonListView() {
    PersonListView.parent.constructor.apply(this, arguments);

    this.model = {
        selected: {
            visible: new Selection(),
            hidden: new Selection()
        }
    };

    if (this.props.persons) {
        this.model.persons = PersonList.create(this.props.persons);
    }
}

extend(PersonListView, View);

/**
 * View initialization
 */
PersonListView.prototype.onStart = function () {
    this.tilesContainer = ge('tilesContainer');
    if (!this.tilesContainer) {
        throw new Error('Failed to initialize Person List view');
    }
    this.tilesContainer.addEventListener('click', this.onTileClick.bind(this));

    this.hiddenTilesContainer = ge('hiddenTilesContainer');
    if (!this.hiddenTilesContainer) {
        throw new Error('Failed to initialize Person List view');
    }
    this.hiddenTilesContainer.addEventListener('click', this.onTileClick.bind(this));

    this.showForm = ge('showform');
    this.showPersonsInp = ge('showpersons');
    if (!this.showForm || !this.showPersonsInp) {
        throw new Error('Failed to initialize Person List view');
    }

    this.hideForm = ge('hideform');
    this.hidePersonsInp = ge('hidepersons');
    this.delForm = ge('delform');
    this.delPersonsInp = ge('delpersons');
    if (
        !this.showForm
        || !this.showPersonsInp
        || !this.hideForm
        || !this.hidePersonsInp
        || !this.delForm
        || !this.delPersonsInp
    ) {
        throw new Error('Failed to initialize Person List view');
    }

    this.toolbar = Toolbar.create({
        elem: 'toolbar',
        onshow: this.showForm.submit.bind(this.showForm),
        onhide: this.hideForm.submit.bind(this.hideForm),
        ondelete: this.confirmDelete.bind(this)
    });
};

/**
 * Tile click event handler
 */
PersonListView.prototype.onTileClick = function (e) {
    var tile;
    var personId;
    var person;
    var currentSelection;
    var selCount;
    var hiddenSelCount;
    var totalSelCount;
    var selArr;
    var hiddenSelArr;
    var totalSelArr;

    if (!e || !e.target) {
        return;
    }

    tile = e.target.closest('.tile');
    if (!tile || !tile.dataset) {
        return;
    }

    personId = parseInt(tile.dataset.id, 10);
    person = this.model.persons.getItem(personId);
    if (!person) {
        return;
    }

    currentSelection = person.isVisible()
        ? this.model.selected.visible
        : this.model.selected.hidden;
    if (currentSelection.isSelected(personId)) {
        currentSelection.deselect(personId);
        tile.classList.remove('tile_selected');
    } else {
        currentSelection.select(personId);
        tile.classList.add('tile_selected');
    }

    selCount = this.model.selected.visible.count();
    hiddenSelCount = this.model.selected.hidden.count();
    totalSelCount = selCount + hiddenSelCount;
    this.toolbar.updateBtn.show(totalSelCount === 1);
    this.toolbar.showBtn.show(hiddenSelCount > 0);
    this.toolbar.hideBtn.show(selCount > 0);
    this.toolbar.deleteBtn.show(totalSelCount > 0);

    selArr = this.model.selected.visible.getIdArray();
    hiddenSelArr = this.model.selected.hidden.getIdArray();
    totalSelArr = selArr.concat(hiddenSelArr);
    this.showPersonsInp.value = totalSelArr.join();
    this.hidePersonsInp.value = totalSelArr.join();
    this.delPersonsInp.value = totalSelArr.join();

    if (totalSelCount === 1) {
        this.toolbar.updateBtn.setURL(baseURL + 'persons/edit/' + totalSelArr[0]);
    }

    this.toolbar.show(totalSelCount > 0);
};

/**
 * Show person(s) delete confirmation popup
 */
PersonListView.prototype.confirmDelete = function () {
    var totalSelCount = this.model.selected.visible.count() + this.model.selected.hidden.count();
    if (!totalSelCount) {
        return;
    }

    ConfirmDialog.create({
        id: 'delete_warning',
        title: (totalSelCount > 1) ? multiPersonsDeleteTitle : singlePersonDeleteTitle,
        content: (totalSelCount > 1) ? multiPersonsDeleteMsg : singlePersonDeleteMsg,
        onconfirm: this.delForm.submit.bind(this.delForm)
    });
};
