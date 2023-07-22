import { isFunction } from 'jezvejs';
import { Sortable } from 'jezvejs/Sortable';
import { ListContainer } from 'jezvejs/ListContainer';
import { __ } from '../../../../utils/utils.js';
import { ImportTransactionItem } from '../TransactionItem/ImportTransactionItem.js';
import { NoDataMessage } from '../../../../Components/NoDataMessage/NoDataMessage.js';
import './ImportTransactionList.scss';

/* CSS classes */
const LIST_CLASS = 'import-list';
const SELECT_MODE_CLASS = 'list_select';
const SORT_MODE_CLASS = 'list_sort';

const defaultProps = {
    ItemComponent: ImportTransactionItem,
    itemSelector: '.import-item',
    itemSortSelector: '.import-item.list-item_sort',
    className: LIST_CLASS,
    PlaceholderComponent: NoDataMessage,
    getPlaceholderProps: () => ({ title: __('import.noData') }),
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

        this.listSortable = Sortable.create({
            onSort: (info) => this.onSort(info),
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
    onSort(info) {
        if (this.state.items.length < 2 || !isFunction(this.props.onSort)) {
            return;
        }

        const fromIndex = this.getItemIndexByElem(info.elem);
        const toIndex = this.getItemIndexByElem(info.targetElem);
        this.props.onSort(fromIndex, toIndex);
    }

    getItemProps(item, { listMode }) {
        return {
            item,
            collapsed: item.collapsed,
            selected: item.selected,
            toggleButton: !!item.originalData,
            listMode,
            showMenuButton: (listMode === 'list'),
            showControls: true,
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
