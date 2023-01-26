import {
    createElement,
    setEvents,
    isFunction,
    re,
    removeChilds,
    insertAfter,
    Component,
} from 'jezvejs';
import { __ } from '../../js/utils.js';

/** CSS classes */
const NO_DATA_CLASS = 'nodata-message';

const defaultProps = {
    ItemComponent: null,
    itemSelector: null, // mandatory item CSS selector
    getItemProps: null, // optional callback to map items to props
    isListChanged: null, // optional callback to verify list content was changed
    items: [],
    noItemsMessage: __('LIST_NO_DATA'),
    listMode: 'list',
    onItemClick: null,
};

/**
 * List container component
 */
export class ListContainer extends Component {
    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        if (!this.props.ItemComponent) {
            throw new Error('Item component not specified');
        }
        if (!this.props.itemSelector) {
            throw new Error('Item selector not specified');
        }

        this.state = {
            ...this.props,
            renderTime: Date.now(),
        };

        this.listItems = [];
        this.noDataMsg = null;

        this.init();
    }

    init() {
        this.elem = createElement('div');

        this.setClassNames();
        this.setHandlers();

        this.render(this.state);
    }

    setHandlers() {
        if (isFunction(this.props.onItemClick)) {
            setEvents(this.elem, { click: (e) => this.onItemClick(e) });
        }
    }

    /** Returns array of list items */
    getItems() {
        return this.state.items;
    }

    /** Returns array of selected items */
    getSelectedItems() {
        return this.state.items.filter((item) => item.selected);
    }

    /**
     * Search for item by specified id
     * @param {number} id - identifier of item
     */
    getItemById(id) {
        return this.state.items.find((item) => item && item.id === id);
    }

    /**
     * Returns index of item with specified id
     * @param {number} id - identifier of item
     */
    getItemIndexById(id) {
        return this.state.items.findIndex((item) => item && item.id === id);
    }

    /**
     * Return item id from specified item element
     * @param {Element} elem - target list item element
     */
    itemIdFromElem(elem) {
        const listItemElem = elem?.closest(this.props.itemSelector);
        if (!listItemElem?.dataset) {
            return 0;
        }

        return parseInt(listItemElem.dataset.id, 10);
    }

    /**
     * Item click event handler
     * @param {Event} e - click event object
     */
    onItemClick(e) {
        const itemId = this.itemIdFromElem(e?.target);
        if (!itemId) {
            return;
        }

        if (isFunction(this.props.onItemClick)) {
            this.props.onItemClick(itemId, e);
        }
    }

    toggleSelectItem(itemId) {
        if (!this.getItemById(itemId)) {
            return;
        }

        const toggleItem = (item) => (
            (item.id === itemId)
                ? { ...item, selected: !item.selected }
                : item
        );

        this.setState({
            ...this.state,
            items: this.state.items.map(toggleItem),
        });
    }

    defaultNoDataMessage(message) {
        return createElement('span', {
            props: {
                className: NO_DATA_CLASS,
                textContent: message,
            },
        });
    }

    renderNoDataMessage(state, prevState) {
        if (state.noItemsMessage === prevState.noItemsMessage) {
            return;
        }

        if (state.noItemsMessage) {
            this.noDataMsg = (isFunction(state.noItemsMessage))
                ? this.state.noItemsMessage()
                : this.defaultNoDataMessage(state.noItemsMessage);
            this.elem.append(this.noDataMsg);
        } else if (this.noDataMsg) {
            re(this.noDataMsg);
            this.noDataMsg = null;
        }
    }

    getListItemById(id) {
        return this.listItems.find((item) => item.id === id);
    }

    getItemProps(item, state) {
        return isFunction(state.getItemProps)
            ? state.getItemProps(item, state)
            : item;
    }

    isChanged(state, prevState) {
        if (isFunction(state.isListChanged)) {
            return state.isListChanged(state, prevState);
        }

        return (
            state.items !== prevState.items
            || state.listMode !== prevState.listMode
        );
    }

    renderList(state, prevState) {
        if (!this.isChanged(state, prevState)) {
            return;
        }

        if (!state.items) {
            throw new Error('Invalid state');
        }

        const emptyList = state.items.length === 0;
        const emptyBefore = !prevState.items || prevState.items.length === 0;
        if ((emptyList || emptyBefore) && emptyList !== emptyBefore) {
            removeChilds(this.elem);
            this.noDataMsg = null;
            this.listItems = [];
        }

        if (emptyList) {
            this.renderNoDataMessage(state, prevState);
            return;
        }

        const { ItemComponent } = state;
        const listItems = [];
        const listElems = [];

        const prevItems = prevState?.items ?? [];
        let lastItem = null;
        state.items.forEach((item, index) => {
            const itemProps = this.getItemProps(item, state);
            const indexBefore = prevItems.findIndex((prev) => prev.id === item.id);

            let listItem = this.getListItemById(item.id);
            const insertNode = (index !== indexBefore) || !listItem;

            if (listItem) {
                listItem.setState(itemProps);
            } else {
                listItem = ItemComponent.create(itemProps);
            }

            if (insertNode) {
                if (lastItem) {
                    insertAfter(listItem.elem, lastItem.elem);
                } else {
                    this.elem.prepend(listItem.elem);
                }
            }

            lastItem = listItem;
            listItems.push(listItem);
            listElems.push(listItem.elem);
        });

        // Remove items not included in new state
        const childElems = Array.from(this.elem.children);
        childElems.forEach((elem) => {
            if (!listElems.includes(elem)) {
                re(elem);
            }
        });

        this.listItems = listItems;
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state object');
        }

        this.renderList(state, prevState);
        this.elem.dataset.time = state.renderTime;
    }
}
