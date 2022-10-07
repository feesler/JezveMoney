import 'jezvejs/style';
import { ge, Selection } from 'jezvejs';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { PersonList } from '../../js/model/PersonList.js';
import { Toolbar } from '../../Components/Toolbar/Toolbar.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import '../../css/app.scss';
import '../../Components/Tile/style.scss';
import '../../Components/IconLink/style.scss';

const TITLE_SINGLE_PERSON_DELETE = 'Delete person';
const TITLE_MULTI_PERSON_DELETE = 'Delete persons';
const MSG_MULTI_PERSON_DELETE = 'Are you sure want to delete selected persons?<br>Debt operations will be converted into expense or income.';
const MSG_SINGLE_PERSON_DELETE = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';

/**
 * List of persons view
 */
class PersonListView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            selected: {
                visible: new Selection(),
                hidden: new Selection(),
            },
        };

        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
    }

    /**
     * View initialization
     */
    onStart() {
        this.tilesContainer = ge('tilesContainer');
        if (!this.tilesContainer) {
            throw new Error('Failed to initialize Person List view');
        }
        this.tilesContainer.addEventListener('click', (e) => this.onTileClick(e));
        this.visibleTiles = Array.from(this.tilesContainer.querySelectorAll('.tile'));

        this.hiddenTilesContainer = ge('hiddenTilesContainer');
        if (!this.hiddenTilesContainer) {
            throw new Error('Failed to initialize Person List view');
        }
        this.hiddenTilesContainer.addEventListener('click', (e) => this.onTileClick(e));
        this.hiddenTiles = Array.from(this.hiddenTilesContainer.querySelectorAll('.tile'));

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
        const person = window.app.model.persons.getItem(personId);
        if (!person) {
            return;
        }

        const currentSelection = person.isVisible()
            ? this.state.selected.visible
            : this.state.selected.hidden;
        if (currentSelection.isSelected(personId)) {
            currentSelection.deselect(personId);
        } else {
            currentSelection.select(personId);
        }

        this.render(this.state);
    }

    /**
     * Show person(s) delete confirmation popup
     */
    confirmDelete() {
        const totalSelCount = this.state.selected.visible.count()
            + this.state.selected.hidden.count();
        if (!totalSelCount) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: (totalSelCount > 1) ? TITLE_MULTI_PERSON_DELETE : TITLE_SINGLE_PERSON_DELETE,
            content: (totalSelCount > 1) ? MSG_MULTI_PERSON_DELETE : MSG_SINGLE_PERSON_DELETE,
            onconfirm: () => this.delForm.submit(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Render visible persons
        this.visibleTiles.forEach((tile) => {
            const accountId = parseInt(tile.dataset.id, 10);

            if (state.selected.visible.isSelected(accountId)) {
                tile.classList.add('tile_selected');
            } else {
                tile.classList.remove('tile_selected');
            }
        });

        // Render hidden persons
        this.hiddenTiles.forEach((tile) => {
            const accountId = parseInt(tile.dataset.id, 10);

            if (state.selected.hidden.isSelected(accountId)) {
                tile.classList.add('tile_selected');
            } else {
                tile.classList.remove('tile_selected');
            }
        });

        const selCount = state.selected.visible.count();
        const hiddenSelCount = state.selected.hidden.count();
        const totalSelCount = selCount + hiddenSelCount;
        this.toolbar.updateBtn.show(totalSelCount === 1);
        this.toolbar.showBtn.show(hiddenSelCount > 0);
        this.toolbar.hideBtn.show(selCount > 0);
        this.toolbar.deleteBtn.show(totalSelCount > 0);

        const selArr = state.selected.visible.getIdArray();
        const hiddenSelArr = state.selected.hidden.getIdArray();
        const totalSelArr = selArr.concat(hiddenSelArr);
        this.showPersonsInp.value = totalSelArr.join();
        this.hidePersonsInp.value = totalSelArr.join();
        this.delPersonsInp.value = totalSelArr.join();

        if (totalSelCount === 1) {
            const { baseURL } = window.app;
            this.toolbar.updateBtn.setURL(`${baseURL}persons/update/${totalSelArr[0]}`);
        }

        this.toolbar.show(totalSelCount > 0);
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonListView);
