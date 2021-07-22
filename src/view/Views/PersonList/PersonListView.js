import { ge } from 'jezvejs';
import { Selection } from 'jezvejs/Selection';
import { View } from '../../js/View.js';
import { PersonList } from '../../js/model/PersonList.js';
import { Toolbar } from '../../Components/Toolbar/Toolbar.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import '../../css/common.css';
import '../../css/app.css';
import '../../Components/Tile/style.css';
import '../../Components/IconLink/style.css';

const singlePersonDeleteTitle = 'Delete person';
const multiPersonsDeleteTitle = 'Delete persons';
const multiPersonsDeleteMsg = 'Are you sure want to delete selected persons?<br>Debt operations will be converted into expense or income.';
const singlePersonDeleteMsg = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';

/* global baseURL */

/**
 * List of persons view
 */
class PersonListView extends View {
    constructor(...args) {
        super(...args);

        this.model = {
            selected: {
                visible: new Selection(),
                hidden: new Selection(),
            },
        };

        if (this.props.persons) {
            this.model.persons = PersonList.create(this.props.persons);
        }
    }

    /**
     * View initialization
     */
    onStart() {
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
        if (!this.showForm
            || !this.showPersonsInp
            || !this.hideForm
            || !this.hidePersonsInp
            || !this.delForm
            || !this.delPersonsInp) {
            throw new Error('Failed to initialize Person List view');
        }

        this.toolbar = Toolbar.create({
            elem: 'toolbar',
            onshow: () => this.showForm.submit(),
            onhide: () => this.hideForm.submit(),
            ondelete: () => this.confirmDelete(),
        });
    }

    /**
     * Tile click event handler
     */
    onTileClick(e) {
        if (!e || !e.target) {
            return;
        }

        const tile = e.target.closest('.tile');
        if (!tile || !tile.dataset) {
            return;
        }

        const personId = parseInt(tile.dataset.id, 10);
        const person = this.model.persons.getItem(personId);
        if (!person) {
            return;
        }

        const currentSelection = person.isVisible()
            ? this.model.selected.visible
            : this.model.selected.hidden;
        if (currentSelection.isSelected(personId)) {
            currentSelection.deselect(personId);
            tile.classList.remove('tile_selected');
        } else {
            currentSelection.select(personId);
            tile.classList.add('tile_selected');
        }

        const selCount = this.model.selected.visible.count();
        const hiddenSelCount = this.model.selected.hidden.count();
        const totalSelCount = selCount + hiddenSelCount;
        this.toolbar.updateBtn.show(totalSelCount === 1);
        this.toolbar.showBtn.show(hiddenSelCount > 0);
        this.toolbar.hideBtn.show(selCount > 0);
        this.toolbar.deleteBtn.show(totalSelCount > 0);

        const selArr = this.model.selected.visible.getIdArray();
        const hiddenSelArr = this.model.selected.hidden.getIdArray();
        const totalSelArr = selArr.concat(hiddenSelArr);
        this.showPersonsInp.value = totalSelArr.join();
        this.hidePersonsInp.value = totalSelArr.join();
        this.delPersonsInp.value = totalSelArr.join();

        if (totalSelCount === 1) {
            this.toolbar.updateBtn.setURL(`${baseURL}persons/edit/${totalSelArr[0]}`);
        }

        this.toolbar.show(totalSelCount > 0);
    }

    /**
     * Show person(s) delete confirmation popup
     */
    confirmDelete() {
        const totalSelCount = this.model.selected.visible.count()
            + this.model.selected.hidden.count();
        if (!totalSelCount) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: (totalSelCount > 1) ? multiPersonsDeleteTitle : singlePersonDeleteTitle,
            content: (totalSelCount > 1) ? multiPersonsDeleteMsg : singlePersonDeleteMsg,
            onconfirm: () => this.delForm.submit(),
        });
    }
}

window.view = new PersonListView(window.app);
