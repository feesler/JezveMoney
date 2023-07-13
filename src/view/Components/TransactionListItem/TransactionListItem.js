import {
    createElement,
    show,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { MenuButton } from 'jezvejs/MenuButton';

import { App } from '../../Application/App.js';

import { TransactionListItemBase } from '../TransactionListItemBase/TransactionListItemBase.js';

import './TransactionListItem.scss';

/** CSS classes */
const TRANS_ITEM_CLASS = 'trans-item';
const CONTENT_CLASS = 'trans-item__content';
/* Select controls */
const SELECT_CONTROLS_CLASS = 'trans-item__select';
/* Controls */
const CONTROLS_CLASS = 'trans-item__controls';
/* Other */
const SELECTED_CLASS = 'trans-item_selected';
const SORT_CLASS = 'trans-item_sort';

const defaultProps = {
    selected: false,
    mode: 'classic', // 'classic' or 'details'
    listMode: 'list',
    showControls: false,
    showDate: true,
};

/**
 * Transaction list item component
 */
export class TransactionListItem extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = { ...this.props };

        this.selectControls = null;
        this.controlsElem = null;
        this.transactionBase = null;

        this.init();
    }

    get id() {
        return this.state.item.id;
    }

    init() {
        this.contentElem = createElement('div', { props: { className: CONTENT_CLASS } });
        this.elem = createElement('div', {
            props: { className: TRANS_ITEM_CLASS },
            children: this.contentElem,
        });

        this.render(this.state);
    }

    createSelectControls() {
        const { createContainer } = App;

        if (this.selectControls) {
            return;
        }

        this.checkbox = Checkbox.create();
        this.selectControls = createContainer(SELECT_CONTROLS_CLASS, [
            this.checkbox.elem,
        ]);

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

    renderContent(state, prevState) {
        if (
            state.item === prevState?.item
            && state.mode === prevState?.mode
            && state.showDate === prevState?.showDate
        ) {
            return;
        }

        const transactionState = {
            item: state.item,
            mode: state.mode,
            showDate: state.showDate,
        };

        if (this.transactionBase) {
            this.transactionBase.setState(transactionState);
        } else {
            this.transactionBase = TransactionListItemBase.create(transactionState);
            this.contentElem.append(this.transactionBase.elem);
        }
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
        this.elem.setAttribute('data-type', item.type);
        this.elem.setAttribute('data-group', item.date);

        this.renderSelectControls(state, prevState);
        this.renderControls(state, prevState);

        this.elem.classList.toggle(SORT_CLASS, state.listMode === 'sort');

        this.renderContent(state, prevState);

        const selectMode = state.listMode === 'select';
        const selected = selectMode && !!state.selected;
        this.elem.classList.toggle(SELECTED_CLASS, selected);
        this.checkbox?.check(selected);
        if (this.checkbox) {
            this.checkbox.input.tabIndex = (selectMode) ? 0 : -1;
        }
    }
}
