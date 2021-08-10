import {
    isFunction,
    ce,
    addChilds,
    removeChilds,
    setEvents,
} from 'jezvejs';
import { Component } from 'jezvejs/Component';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    createIcon,
} from '../../js/app.js';

const CONTAINER_CLASS = 'trtype-menu';
const MULTI_CLASS = 'trtype-menu-multi';
const ITEM_CLASS = 'trtype-menu__item';
const ITEM_SELECTED_CLASS = 'trtype-menu__item_selected';
const ITEM_CHECK_CLASS = 'trtype-menu__item-check';
const ITEM_TITLE_CLASS = 'trtype-menu_item_title';

const defaultProps = {
    typeParam: 'type',
    url: window.location,
    multiple: false,
};

/**
 * Transaction list item component
 */
export class TransactionTypeMenu extends Component {
    static create(props) {
        const instance = new TransactionTypeMenu(props);
        instance.init();
        return instance;
    }

    static fromElement(elem, props = {}) {
        const instance = new TransactionTypeMenu(props);
        instance.parse(elem);
        return instance;
    }

    constructor(...args) {
        super(...args);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = { ...this.props };
    }

    init() {
        this.elem = ce('div', { className: CONTAINER_CLASS });
        if (this.props.multiple) {
            this.elem.classList.add(MULTI_CLASS);
        }

        this.state.items = [
            { type: 0, title: 'Show all' },
            { type: EXPENSE, title: 'Expense' },
            { type: INCOME, title: 'Income' },
            { type: TRANSFER, title: 'Transfer' },
            { type: DEBT, title: 'Debt' },
        ];

        this.setHandlers();

        this.render(this.state);
    }

    parse(elem) {
        if (!elem || !elem.classList || !elem.classList.contains(CONTAINER_CLASS)) {
            throw new Error('Invalid element');
        }

        this.elem = elem;
        this.state.multiple = this.elem.classList.contains(MULTI_CLASS);

        const items = Array.from(elem.querySelectorAll(`.${ITEM_CLASS}`));
        this.state.items = items.map((item) => {
            const linkElem = item.querySelector(`.${ITEM_TITLE_CLASS} a`);
            return {
                type: parseInt(item.dataset.type, 10),
                selected: item.classList.contains(ITEM_SELECTED_CLASS),
                title: linkElem.textContent,
            };
        });

        this.setHandlers();

        this.render(this.state);
    }

    setHandlers() {
        setEvents(this.elem, { click: (e) => this.onSelectItem(e) });
    }

    onSelectItem(e) {
        const itemElem = e.target.closest(`.${ITEM_CLASS}`);
        if (!itemElem || !itemElem.dataset) {
            return;
        }

        e.preventDefault();

        const selectedType = parseInt(itemElem.dataset.type, 10);

        let toggled = false;
        if (this.state.multiple) {
            const checkElem = e.target.closest(`.${ITEM_CHECK_CLASS}`);
            toggled = (checkElem && this.elem.contains(checkElem));
        }

        this.state.items = this.state.items.map((item) => {
            let selected;
            if (toggled) {
                selected = (item.type === selectedType) ? !item.selected : item.selected;
            } else {
                selected = item.type && item.type === selectedType;
            }

            return {
                ...item,
                selected,
            };
        });

        const selectedItems = this.state.items
            .filter((item) => item.type && item.selected)
            .map((item) => item.type);

        if (isFunction(this.props.onChange)) {
            this.props.onChange(selectedItems);
        }

        this.render(this.state);
    }

    renderItem(item, state) {
        const elem = ce('span', { className: ITEM_CLASS });
        if (item.selected) {
            elem.classList.add(ITEM_SELECTED_CLASS);
        }
        elem.setAttribute('data-type', item.type);

        if (state.multiple && item.type !== 0) {
            elem.appendChild(ce('span', { className: ITEM_CHECK_CLASS }, createIcon('check')));
        }
        const linkElem = ce('a', { textContent: item.title });

        if (state.url) {
            const paramName = (state.multiple) ? `${state.typeParam}[]` : state.typeParam;

            const url = new URL(state.url);
            if (item.type) {
                url.searchParams.set(paramName, item.type);
            } else {
                url.searchParams.delete(paramName);
            }
            linkElem.href = url.toString();
        }

        elem.appendChild(ce('span', { className: ITEM_TITLE_CLASS }, linkElem));

        return elem;
    }

    render(state) {
        const elems = state.items.map((item) => this.renderItem(item, state));
        removeChilds(this.elem);
        addChilds(this.elem, elems);

        if (state.multiple) {
            this.elem.classList.add(MULTI_CLASS);
        } else {
            this.elem.classList.remove(MULTI_CLASS);
        }
    }
}
