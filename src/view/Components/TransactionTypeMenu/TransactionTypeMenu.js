import {
    isFunction,
    ce,
    addChilds,
    removeChilds,
    setEvents,
    Component,
    Checkbox,
} from 'jezvejs';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/app.js';
import './style.scss';

const CONTAINER_CLASS = 'trtype-menu';
const MULTI_CLASS = 'trtype-menu-multi';
const ITEM_CLASS = 'trtype-menu__item';
const ITEM_SELECTED_CLASS = 'trtype-menu__item_selected';
const ITEM_TITLE_CLASS = 'trtype-menu_item_title';
const CHECKBOX_CLASS = 'checkbox';

/** Strings */
const TITLE_SHOW_ALL = 'Show all';
const TITLE_EXPENSE = 'Expense';
const TITLE_INCOME = 'Income';
const TITLE_TRANSFER = 'Transfer';
const TITLE_DEBT = 'Debt';

const defaultProps = {
    typeParam: 'type',
    url: window.location,
    multiple: false,
    allowActiveLink: false,
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
            { type: 0, title: TITLE_SHOW_ALL },
            { type: EXPENSE, title: TITLE_EXPENSE },
            { type: INCOME, title: TITLE_INCOME },
            { type: TRANSFER, title: TITLE_TRANSFER },
            { type: DEBT, title: TITLE_DEBT },
        ];

        this.render(this.state);
    }

    getItemType(item) {
        return parseInt(item.dataset.type, 10);
    }

    parseCheckbox(elem) {
        const type = this.getItemType(elem);

        const checkbox = Checkbox.fromElement(
            elem,
            { onChange: () => this.onToggleItem(type) },
        );

        return {
            type,
            selected: checkbox.checked,
            title: checkbox.label?.textContent,
        };
    }

    parseItem(elem) {
        const linkElem = elem.querySelector(`.${ITEM_TITLE_CLASS} a`);
        const titleElem = elem.querySelector(`.${ITEM_TITLE_CLASS}`);
        if (!linkElem && !titleElem) {
            throw new Error('Invalid element');
        }

        const title = (linkElem) ? linkElem.textContent : titleElem.textContent;

        if (linkElem) {
            setEvents(linkElem, { click: (e) => this.onSelectItem(e) });
        }

        return {
            type: this.getItemType(elem),
            selected: elem.classList.contains(ITEM_SELECTED_CLASS),
            title,
        };
    }

    parse(elem) {
        if (!elem || !elem.classList || !elem.classList.contains(CONTAINER_CLASS)) {
            throw new Error('Invalid element');
        }

        this.elem = elem;
        this.state.multiple = this.elem.classList.contains(MULTI_CLASS);

        const items = Array.from(elem.querySelectorAll(`.${ITEM_CLASS}`));
        this.state.items = items.map((item) => {
            const isCheckbox = item.classList.contains(CHECKBOX_CLASS);
            if (isCheckbox && !this.state.multiple) {
                throw new Error('Invalid element');
            }

            if (isCheckbox) {
                return this.parseCheckbox(item);
            }

            return this.parseItem(item);
        });

        this.render(this.state);
    }

    setSelection(selectedItems) {
        const showAll = (
            !Array.isArray(selectedItems)
            || selectedItems.length === 0
            || selectedItems.includes(0)
        );
        const items = Array.isArray(selectedItems) ? selectedItems : [selectedItems];

        this.state.items = this.state.items.map((item) => ({
            ...item,
            selected: (
                (showAll && item.type === 0)
                || items.includes(item.type)
            ),
        }));

        this.render(this.state);
    }

    sendChangeEvent() {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        const selectedItems = this.state.items
            .filter((item) => item.type && item.selected)
            .map((item) => item.type);

        const data = (this.state.multiple) ? selectedItems : selectedItems[0];
        this.props.onChange(data);
    }

    onToggleItem(type) {
        this.state.items = this.state.items.map((item) => {
            let selected = false;
            if (item.type) {
                selected = (item.type === type) ? !item.selected : item.selected;
            }

            return {
                ...item,
                selected,
            };
        });

        this.sendChangeEvent();
        this.render(this.state);
    }

    onSelectItem(e) {
        const itemElem = e.target.closest(`.${ITEM_CLASS}`);
        if (!itemElem || !itemElem.dataset) {
            return;
        }

        e.preventDefault();

        const selectedType = this.getItemType(itemElem);
        this.state.items = this.state.items.map((item) => ({
            ...item,
            selected: (item.type === selectedType),
        }));

        this.sendChangeEvent();
        this.render(this.state);
    }

    setURL(url) {
        this.state.url = url.toString();
        this.render(this.state);
    }

    getItemURL(item, state) {
        if (!state.url) {
            return null;
        }
        const paramName = (state.multiple) ? `${state.typeParam}[]` : state.typeParam;

        const url = new URL(state.url);
        if (item.type) {
            url.searchParams.set(paramName, item.type);
        } else {
            url.searchParams.delete(paramName);
        }

        return url;
    }

    renderLinkElement(item, state) {
        const res = ce('a', { textContent: item.title });
        const url = this.getItemURL(item, state);
        if (url) {
            res.href = url.toString();
        }
        return res;
    }

    renderCheckboxItem(item, state) {
        const isLink = (!item.selected || state.allowActiveLink);

        let label = item.title;
        if (isLink) {
            const linkElem = this.renderLinkElement(item, state);
            setEvents(linkElem, { click: (e) => this.onSelectItem(e) });
            label = linkElem;
        }

        const checkbox = Checkbox.create({
            className: ITEM_CLASS,
            checked: item.selected,
            label,
            onChange: () => this.onToggleItem(item.type),
        });

        checkbox.elem.setAttribute('data-type', item.type);

        return checkbox.elem;
    }

    renderItem(item, state) {
        if (state.multiple && item.type !== 0) {
            return this.renderCheckboxItem(item, state);
        }

        const elem = ce('span', { className: ITEM_CLASS });
        if (item.selected) {
            elem.classList.add(ITEM_SELECTED_CLASS);
        }
        elem.setAttribute('data-type', item.type);

        const titleElem = ce('span', { className: ITEM_TITLE_CLASS });
        if (!item.selected || state.allowActiveLink) {
            const linkElem = this.renderLinkElement(item, state);
            setEvents(linkElem, { click: (e) => this.onSelectItem(e) });
            titleElem.appendChild(linkElem);
        } else {
            titleElem.textContent = item.title;
        }

        elem.appendChild(titleElem);

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
