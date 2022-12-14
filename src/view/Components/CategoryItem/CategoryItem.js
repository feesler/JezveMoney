import {
    createElement,
    show,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { PopupMenuButton } from 'jezvejs/PopupMenu';
import './style.scss';

/** CSS classes */
const ITEM_CLASS = 'category-item';
const CONTENT_CLASS = 'category-item__content';
const TITLE_CLASS = 'category-item__title';
const SELECT_CONTROLS_CLASS = 'category-item__select';
const CONTROLS_CLASS = 'category-item__controls';
const CHILD_CLASS = 'category-item_child';
const SELECTED_CLASS = 'category-item_selected';

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

        this.elem = createElement('div', {
            props: { className: ITEM_CLASS },
            children: this.contentElem,
        });

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

        this.elem.prepend(this.selectControls);
    }

    createControls() {
        if (this.controlsElem) {
            return;
        }

        this.menuContainer = PopupMenuButton.create();
        this.controlsElem = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: this.menuContainer.elem,
        });

        this.elem.append(this.controlsElem);
    }

    renderSelectControls(state, prevState) {
        if (state.listMode === prevState.listMode) {
            return;
        }

        this.createSelectControls();
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

        const selectMode = state.listMode === 'select';
        const selected = selectMode && !!state.selected;
        this.elem.classList.toggle(SELECTED_CLASS, selected);
        this.checkbox?.check(selected);
        if (this.checkbox) {
            this.checkbox.input.tabIndex = (selectMode) ? 0 : -1;
        }

        this.elem.classList.toggle(CHILD_CLASS, (item.parent_id !== 0));
    }
}
