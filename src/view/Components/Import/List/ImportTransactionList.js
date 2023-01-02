import { isFunction } from 'jezvejs';
import { Sortable } from 'jezvejs/Sortable';
import { __ } from '../../../js/utils.js';
import { ListContainer } from '../../ListContainer/ListContainer.js';
import { ImportTransactionItem } from '../TransactionItem/ImportTransactionItem.js';

/* CSS classes */
const LIST_CLASS = 'data-container';
const SELECT_MODE_CLASS = 'import-list_select';
const SORT_MODE_CLASS = 'import-list_sort';

const defaultProps = {
    ItemComponent: ImportTransactionItem,
    itemSelector: '.import-item',
    itemSortSelector: '.import-item.import-item_sort',
    className: LIST_CLASS,
    noItemsMessage: __('IMPORT_NO_DATA'),
    onSort: null,
};

export class ImportTransactionList extends ListContainer {
    constructor(props) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    createSortable(state = this.state) {
        if (state.listMode !== 'sort' || this.listSortable) {
            return;
        }

        this.listSortable = new Sortable({
            oninsertat: (orig, replaced) => this.onSort(orig, replaced),
            elem: this.elem,
            group: 'importTransactions',
            selector: state.itemSortSelector,
            placeholderClass: 'import-item__placeholder',
            copyWidth: true,
            handles: [{ query: 'div' }, { query: 'label' }],
        });
    }

    /**
     * Search list item by specified element
     * @param {Element} elem - item root element
     */
    getItemIndexByElem(elem) {
        const itemElem = elem?.closest(this.props.itemSelector);
        if (!itemElem) {
            return -1;
        }

        return this.listItems.findIndex((item) => (itemElem === item.elem));
    }

    /**
     * Transaction reorder handler
     * @param {Object} original - original item object
     * @param {Object} replaced - new item object
     */
    onSort(original, replaced) {
        if (this.state.items.length < 2 || !isFunction(this.props.onSort)) {
            return;
        }

        const fromIndex = this.getItemIndexByElem(original);
        const toIndex = this.getItemIndexByElem(replaced);
        this.props.onSort(fromIndex, toIndex);
    }

    getItemProps(item) {
        return {
            transaction: item,
        };
    }

    isChanged(state, prevState) {
        return (
            state.items !== prevState.items
            || state.listMode !== prevState.listMode
        );
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.createSortable(state);

        this.elem.classList.toggle(SELECT_MODE_CLASS, state.listMode === 'select');
        this.elem.classList.toggle(SORT_MODE_CLASS, state.listMode === 'sort');
    }
}
