import { isFunction } from 'jezvejs';
import { Sortable } from 'jezvejs/Sortable';
import { ListContainer } from '../ListContainer/ListContainer.js';

const defaultProps = {
    itemSortSelector: null,
    placeholderClass: null,
    sortModeClass: null,
    sortGroup: null,
    onSort: null,
    onTreeSort: null,
};

/**
 * Transaction list component
 */
export class SortableListContainer extends ListContainer {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        if (!this.props.itemSortSelector) {
            throw new Error('Item sort selector not specified');
        }
    }

    createSortable(state = this.state) {
        if (state.listMode !== 'sort' || this.listSortable) {
            return;
        }

        this.listSortable = Sortable.create({
            onInsertAt: (...args) => this.onSort(...args),
            elem: this.elem,
            group: state.sortGroup,
            selector: state.itemSortSelector,
            tree: state.treeSort,
            containerSelector: state.childContainerSelector,
            placeholderClass: state.placeholderClass,
            copyWidth: true,
        });
    }

    /**
     * Item reorder handler
     * @param {Element} elem - element of moving item
     * @param {Element} refElem - element of replaced item
     * @param {Object} newPos - new position of element
     */
    onSort(elem, refElem, newPos) {
        if (this.state.treeSort) {
            this.onTreeSort(elem, newPos);
            return;
        }

        if (!isFunction(this.props.onSort)) {
            return;
        }

        const itemId = this.itemIdFromElem(elem);
        const refId = this.itemIdFromElem(refElem);
        if (!itemId || !refId) {
            return;
        }

        const replacedItem = this.getItemById(refId);
        if (!replacedItem) {
            return;
        }

        this.props.onSort(itemId, replacedItem.pos);
    }

    /**
     * Tree item reorder handler
     * @param {Element} elem - element of moving item
     * @param {Object} newPos - new position of element
     */
    onTreeSort(elem, newPos) {
        if (!isFunction(this.props.onTreeSort)) {
            return;
        }

        const itemId = this.itemIdFromElem(elem);
        const parentId = this.itemIdFromElem(elem?.parentNode);
        if (!itemId) {
            return;
        }

        const prevId = this.itemIdFromElem(newPos.prev);
        const nextId = this.itemIdFromElem(newPos.next);

        this.props.onTreeSort(itemId, parentId, prevId, nextId);
    }

    /**
     * Set position of item and update position of related items
     * @param {number} itemId - identifier of item
     * @param {number} pos - new position
     */
    setPosition(itemId, pos) {
        const posCompareAsc = (a, b) => a.pos - b.pos;
        const posCompareDesc = (a, b) => b.pos - a.pos;

        const movingItem = this.getItemById(itemId);
        if (!movingItem) {
            return false;
        }

        const oldPos = movingItem.pos;
        if (oldPos === pos) {
            return true;
        }

        this.state.items.sort(posCompareAsc);
        this.state.items.forEach((item) => {
            const res = item;
            if (res.id === itemId) {
                res.pos = pos;
            } else if (oldPos === 0) {
                /* insert with specified position */
                if (res.pos >= pos) {
                    res.pos += 1;
                }
            } else if (pos < oldPos) {
                /* moving up */
                if (res.pos >= pos && res.pos < oldPos) {
                    res.pos += 1;
                }
            } else if (pos > oldPos) {
                /* moving down */
                if (res.pos > oldPos && res.pos <= pos) {
                    res.pos -= 1;
                }
            }
        });

        this.state.items.sort(posCompareDesc);
        this.render(this.state);

        return true;
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.createSortable(state);

        if (typeof state.sortModeClass === 'string') {
            this.elem.classList.toggle(state.sortModeClass, state.listMode === 'sort');
        }
    }
}
