import {
    createElement,
    setEvents,
    isFunction,
    re,
    removeChilds,
    insertAfter,
    Component,
} from 'jezvejs';
import { Tile } from '../Tile/Tile.js';

/** CSS classes */
const CONTAINER_CLASS = 'tiles';
const NO_DATA_CLASS = 'nodata-message';
const ITEM_SELECTOR = '.tile';

const defaultProps = {
    items: [],
    noItemsMessage: 'No items',
    listMode: 'list',
    selectable: false,
    onSelect: null,
    onContextMenu: null,
    ItemComponent: Tile,
    getItemProps: null,
};

/**
 * Tiles list component
 */
export class TilesList extends Component {
    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            ...this.props,
            renderTime: Date.now(),
        };

        this.listItems = [];
        this.noDataMsg = null;

        this.selectEvents = { click: (e) => this.onItemClick(e) };

        this.init();
    }

    init() {
        this.elem = createElement('div', { props: { className: CONTAINER_CLASS } });

        this.setHandlers();

        this.render(this.state);
    }

    setHandlers() {
        setEvents(this.elem, this.selectEvents);
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
     * Return item id from specified item element
     * @param {Element} elem - target list item element
     */
    itemIdFromElem(elem) {
        const listItemElem = elem?.closest(ITEM_SELECTOR);
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

        if (this.state.listMode === 'list') {
            if (isFunction(this.props.onContextMenu)) {
                this.props.onContextMenu(itemId);
            }
        } else if (this.state.listMode === 'select') {
            if (isFunction(this.props.onSelect)) {
                this.props.onSelect(itemId);
            }
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

    renderNoDataMessage() {
        if (this.noDataMsg) {
            return;
        }

        this.noDataMsg = createElement('span', {
            props: {
                className: NO_DATA_CLASS,
                textContent: this.state.noItemsMessage,
            },
        });
        this.elem.append(this.noDataMsg);
    }

    getListItemById(id) {
        return this.listItems.find((item) => item.id === id);
    }

    getItemProps(item, state) {
        return isFunction(state.getItemProps)
            ? state.getItemProps(item, state)
            : item;
    }

    renderList(state, prevState) {
        if (
            state.items === prevState.items
            && state.listMode === prevState.listMode
        ) {
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
            this.renderNoDataMessage();
            return;
        }

        const { ItemComponent } = state;
        const listItems = [];
        let lastItem = null;
        state.items.forEach((item) => {
            const itemProps = this.getItemProps(item, state);

            let listItem = this.getListItemById(item.id);
            if (listItem) {
                listItem.setState(itemProps);
            } else {
                listItem = ItemComponent.create(itemProps);
                if (lastItem) {
                    insertAfter(listItem.elem, lastItem.elem);
                } else {
                    this.elem.prepend(listItem.elem);
                }
            }

            lastItem = listItem;
            listItems.push(listItem);
        });

        // Remove items not included in new state
        this.listItems.forEach((item) => {
            if (!listItems.includes(item)) {
                re(item.elem);
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
