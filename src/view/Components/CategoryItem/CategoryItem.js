import {
    createElement,
    show,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Collapsible } from 'jezvejs/Collapsible';
import { MenuButton } from 'jezvejs/MenuButton';
import { ListContainer } from 'jezvejs/ListContainer';
import { listData } from '../../js/utils.js';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'category-item';
const MAIN_CONTAINER_CLASS = 'category-item__main';
const CONTENT_CLASS = 'category-item__content';
const TITLE_CLASS = 'category-item__title';
const SELECT_CONTROLS_CLASS = 'category-item__select';
const CONTROLS_CLASS = 'category-item__controls';
const CHILD_CONTAINER_CLASS = 'category-item__children categories-list';
const SELECTED_CLASS = 'category-item_selected';
const SORT_CLASS = 'category-item_sort';

const defaultProps = {
    selected: false,
    listMode: 'list',
    showControls: false,
};

/**
 * Categories list item component
 */
export class CategoryItem extends Component {
    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = { ...this.props };

        this.selectControls = null;
        this.controlsElem = null;

        this.init();
    }

    get id() {
        return this.state.item.id;
    }

    init() {
        this.titleElem = createElement('div', { props: { className: TITLE_CLASS } });

        this.contentElem = createElement('div', {
            props: { className: CONTENT_CLASS },
            children: this.titleElem,
        });

        this.mainContainer = createElement('div', {
            props: { className: MAIN_CONTAINER_CLASS },
            children: this.contentElem,
        });

        this.collapse = Collapsible.create({
            toggleOnClick: false,
            className: CONTAINER_CLASS,
            header: this.mainContainer,
        });
        this.elem = this.collapse.elem;

        this.render(this.state);
    }

    createSelectControls() {
        if (this.selectControls) {
            return;
        }

        this.checkbox = Checkbox.create();
        this.selectControls = createElement('div', {
            props: { className: SELECT_CONTROLS_CLASS },
            children: this.checkbox.elem,
        });

        this.mainContainer.prepend(this.selectControls);
    }

    createControls() {
        if (this.controlsElem) {
            return;
        }

        this.menuButton = MenuButton.create();
        this.controlsElem = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: this.menuButton.elem,
        });

        this.mainContainer.append(this.controlsElem);
    }

    renderSelectControls(state, prevState) {
        if (
            state.listMode === prevState.listMode
            && state.selected === prevState.selected
        ) {
            return;
        }

        this.createSelectControls();

        const selectMode = state.listMode === 'select';
        const selected = selectMode && !!state.selected;
        this.elem.classList.toggle(SELECTED_CLASS, selected);

        if (this.checkbox) {
            this.checkbox.check(selected);
            this.checkbox.input.tabIndex = (selectMode) ? 0 : -1;
        }
    }

    renderControls(state, prevState) {
        if (state.showControls === prevState.showControls) {
            return;
        }

        if (state.showControls) {
            this.createControls();
        }

        show(this.controlsElem, state.showControls);
    }

    renderContent(state) {
        const { item } = state;

        this.titleElem.textContent = item.name;
        this.titleElem.setAttribute('title', item.name);
    }

    createChildContainer() {
        if (this.childContainer) {
            return;
        }

        this.childContainer = ListContainer.create({
            ItemComponent: CategoryItem,
            getItemProps: (item, { listMode }) => ({
                item,
                selected: item.selected,
                listMode,
                showControls: (listMode === 'list'),
            }),
            className: CHILD_CONTAINER_CLASS,
            itemSelector: '.category-item',
            sortModeClass: 'categories-list_sort',
            listMode: 'list',
            noItemsMessage: null,
        });

        this.collapse.setContent(this.childContainer.elem);
        this.collapse.expand();
    }

    renderChildren(state, prevState) {
        const { item, listMode } = state;
        const prevItem = prevState?.item;
        if (
            item.parent_id === prevItem?.parent_id
            && item.children === prevItem?.children
            && listMode === prevState?.listMode
        ) {
            return;
        }

        if (item.parent_id !== 0 || !item.children) {
            this.collapse.setContent(null);
            this.childContainer = null;
            return;
        }

        this.createChildContainer();

        this.childContainer.setState((listState) => ({
            ...listState,
            items: listData(item.children),
            listMode,
            renderTime: Date.now(),
        }));
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state object');
        }

        const { item } = state;
        if (!item) {
            throw new Error('Invalid transaction object');
        }

        this.elem.setAttribute('data-id', item.id);

        this.renderSelectControls(state, prevState);
        this.renderControls(state, prevState);
        this.renderContent(state, prevState);
        this.renderChildren(state, prevState);

        const sortMode = state.listMode === 'sort';
        this.elem.classList.toggle(SORT_CLASS, sortMode);
    }
}
