import 'jezvejs/style';
import {
    ge,
    createElement,
    setEvents,
    removeChilds,
    insertAfter,
    show,
    Selection,
} from 'jezvejs';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { PersonList } from '../../js/model/PersonList.js';
import { Toolbar } from '../../Components/Toolbar/Toolbar.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import '../../css/app.scss';
import '../../Components/Tile/style.scss';
import '../../Components/IconLink/style.scss';
import { Tile } from '../../Components/Tile/Tile.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';

/** CSS classes */
const NO_DATA_CLASS = 'nodata-message';
/** Strings */
const TITLE_SINGLE_PERSON_DELETE = 'Delete person';
const TITLE_MULTI_PERSON_DELETE = 'Delete persons';
const MSG_MULTI_PERSON_DELETE = 'Are you sure want to delete selected persons?<br>Debt operations will be converted into expense or income.';
const MSG_SINGLE_PERSON_DELETE = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';
const MSG_NO_PERSONS = 'You have no one person. Please create one.';

/**
 * List of persons view
 */
class PersonListView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.checkPersonModels();

        this.state = {
            selected: {
                visible: new Selection(),
                hidden: new Selection(),
            },
            loading: false,
            renderTime: Date.now(),
        };
    }

    /**
     * View initialization
     */
    onStart() {
        this.tilesContainer = ge('tilesContainer');
        this.hiddenTilesHeading = ge('hiddenTilesHeading');
        this.hiddenTilesContainer = ge('hiddenTilesContainer');
        if (
            !this.tilesContainer
            || !this.hiddenTilesHeading
            || !this.hiddenTilesContainer
        ) {
            throw new Error('Failed to initialize Person List view');
        }
        const tileEvents = { click: (e) => this.onTileClick(e) };
        setEvents(this.tilesContainer, tileEvents);
        setEvents(this.hiddenTilesContainer, tileEvents);

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, this.hiddenTilesContainer);

        this.toolbar = Toolbar.create({
            elem: 'toolbar',
            onshow: () => this.showSelected(),
            onhide: () => this.showSelected(false),
            ondelete: () => this.confirmDelete(),
        });

        this.render(this.state);
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
        this.setRenderTime();
    }

    startLoading() {
        if (this.state.loading) {
            return;
        }

        this.setState({ ...this.state, loading: true });
    }

    stopLoading() {
        if (!this.state.loading) {
            return;
        }

        this.setState({ ...this.state, loading: false });
    }

    setRenderTime() {
        this.setState({ ...this.state, renderTime: Date.now() });
    }

    getSelectedIds(state = this.state) {
        const selArr = state.selected.visible.getIdArray();
        const hiddenSelArr = state.selected.hidden.getIdArray();
        return selArr.concat(hiddenSelArr);
    }

    async showSelected(value = true) {
        if (this.state.loading) {
            return;
        }
        const selectedIds = this.getSelectedIds();
        if (selectedIds.length === 0) {
            return;
        }

        this.startLoading();

        try {
            if (value) {
                await API.person.show({ id: selectedIds });
            } else {
                await API.person.hide({ id: selectedIds });
            }
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    async deleteSelected() {
        if (this.state.loading) {
            return;
        }
        const selectedIds = this.getSelectedIds();
        if (selectedIds.length === 0) {
            return;
        }

        this.startLoading();

        try {
            await API.person.del({ id: selectedIds });
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    async requestList() {
        try {
            const { data } = await API.person.list({ type: 'all' });
            window.app.model.persons.setData(data);
            window.app.model.visiblePersons = null;
            window.app.checkPersonModels();

            this.setState({
                ...this.state,
                selected: {
                    visible: new Selection(),
                    hidden: new Selection(),
                },
            });
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /** Show person(s) delete confirmation popup */
    confirmDelete() {
        const selectedIds = this.getSelectedIds();
        if (selectedIds.length === 0) {
            return;
        }

        const multiple = (selectedIds.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? TITLE_MULTI_PERSON_DELETE : TITLE_SINGLE_PERSON_DELETE,
            content: (multiple) ? MSG_MULTI_PERSON_DELETE : MSG_SINGLE_PERSON_DELETE,
            onconfirm: () => this.deleteSelected(),
        });
    }

    renderTilesList(persons, selection) {
        return persons.map((person) => Tile.create({
            attrs: { 'data-id': person.id },
            title: person.name,
            selected: selection.isSelected(person.id),
        }));
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading) {
            this.loadingIndicator.show();
        }

        // Render visible persons
        const visibleTiles = this.renderTilesList(
            window.app.model.visiblePersons,
            state.selected.visible,
        );
        removeChilds(this.tilesContainer);
        if (visibleTiles.length > 0) {
            visibleTiles.forEach((item) => this.tilesContainer.appendChild(item.elem));
        } else {
            const noDataMsg = createElement('span', {
                props: { className: NO_DATA_CLASS, textContent: MSG_NO_PERSONS },
            });
            this.tilesContainer.append(noDataMsg);
        }

        // Render hidden persons
        const hiddenTiles = this.renderTilesList(
            window.app.model.hiddenPersons,
            state.selected.hidden,
        );
        removeChilds(this.hiddenTilesContainer);
        const hiddenItemsAvailable = (hiddenTiles.length > 0);
        if (hiddenItemsAvailable) {
            hiddenTiles.forEach((item) => this.hiddenTilesContainer.appendChild(item.elem));
        }
        show(this.hiddenTilesHeading, hiddenItemsAvailable);

        const selCount = state.selected.visible.count();
        const hiddenSelCount = state.selected.hidden.count();
        const totalSelCount = selCount + hiddenSelCount;
        this.toolbar.updateBtn.show(totalSelCount === 1);
        this.toolbar.showBtn.show(hiddenSelCount > 0);
        this.toolbar.hideBtn.show(selCount > 0);
        this.toolbar.deleteBtn.show(totalSelCount > 0);

        const selectedIds = this.getSelectedIds();
        if (selectedIds.length === 1) {
            const { baseURL } = window.app;
            this.toolbar.updateBtn.setURL(`${baseURL}persons/update/${selectedIds[0]}`);
        }

        this.toolbar.show(totalSelCount > 0);

        this.tilesContainer.dataset.time = state.renderTime;
        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonListView);
