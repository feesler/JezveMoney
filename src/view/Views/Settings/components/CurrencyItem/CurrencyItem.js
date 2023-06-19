import {
    createElement,
    show,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { MenuButton } from 'jezvejs/MenuButton';
import { App } from '../../../../Application/App.js';
import './CurrencyItem.scss';

/** CSS classes */
const CONTAINER_CLASS = 'currency-item';
const CONTENT_CLASS = 'currency-item__content';
const TITLE_CLASS = 'currency-item__title';
const SELECT_CONTROLS_CLASS = 'currency-item__select';
const CONTROLS_CLASS = 'currency-item__controls';
const SELECTED_CLASS = 'currency-item_selected';
const SORT_CLASS = 'currency-item_sort';

const defaultProps = {
    selected: false,
    listMode: 'list',
    showControls: false,
};

/**
 * User currencies list item component
 */
export class CurrencyItem extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

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
            props: { className: CONTAINER_CLASS },
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

        this.menuButton = MenuButton.create();
        this.controlsElem = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: this.menuButton.elem,
        });

        this.elem.append(this.controlsElem);
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

        const currencyModel = App.model.currency;
        const currency = currencyModel.getItem(item.curr_id);
        if (!currency) {
            return;
        }

        const name = currency.formatName();

        this.titleElem.textContent = name;
        this.titleElem.setAttribute('title', name);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state object');
        }

        const { item } = state;
        if (!item) {
            throw new Error('Invalid currency object');
        }

        this.elem.setAttribute('data-id', item.id);

        this.renderSelectControls(state, prevState);
        this.renderControls(state, prevState);
        this.renderContent(state, prevState);

        const sortMode = state.listMode === 'sort';
        this.elem.classList.toggle(SORT_CLASS, sortMode);
    }
}
