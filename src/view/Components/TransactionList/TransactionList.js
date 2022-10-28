import {
    createElement,
    setEvents,
    removeEvents,
    isFunction,
    removeChilds,
    Component,
} from 'jezvejs';
import { Sortable } from 'jezvejs/Sortable';
import {
    TRANS_ITEM_CLASS,
    TransactionListItem,
} from '../TransactionListItem/TransactionListItem.js';
import './style.scss';

/** Strings */
const MSG_NO_TRANSACTIONS = 'No transactions found.';

/** CSS classes */
const LIST_ITEMS_CLASS = 'trans-list-items';
const SELECT_MODE_CLASS = 'trans-list_select';
const DETAILS_CLASS = 'trans-list_details';
const NO_DATA_CLASS = 'nodata-message';
/** Strings */
const ITEM_SELECTOR = `.${TRANS_ITEM_CLASS}`;

const defaultProps = {
    items: [],
    mode: 'classic',
    listMode: 'list',
    selectable: false,
    onSelect: null,
    sortable: false,
    onSort: null,
    onContextMenu: null,
};

/**
 * Transaction list component
 */
export class TransactionList extends Component {
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

        this.selectEvents = { click: (e) => this.onItemClick(e) };

        this.init();
    }

    init() {
        if (this.state.selectable) {
            this.setHandlers();
        }

        if (this.props.sortable) {
            this.trListSortable = new Sortable({
                oninsertat: (elem, ref) => this.onSort(elem, ref),
                elem: this.elem,
                group: 'transactions',
                selector: ITEM_SELECTOR,
                placeholderClass: 'trans-item_placeholder',
                copyWidth: true,
            });
        }

        this.render(this.state);
    }

    setHandlers() {
        setEvents(this.elem, this.selectEvents);
    }

    removeHandlers() {
        removeEvents(this.elem, this.selectEvents);
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
     * Search for transaction by specified id
     * @param {number} transactionId - identifier of transaction
     */
    getTransaction(transactionId) {
        return this.state.items.find((item) => item && item.id === transactionId);
    }

    getListItemElementById(id) {
        if (!this.getTransaction(id)) {
            return null;
        }

        return this.elem.querySelector(`${ITEM_SELECTOR}[data-id="${id}"]`);
    }

    /**
     * Find closest list item element to specified
     * @param {Element} elem - element to start looking from
     */
    findListItemElement(elem) {
        if (!elem) {
            return null;
        }

        const res = elem.querySelector(ITEM_SELECTOR);
        if (!res) {
            return elem.closest(ITEM_SELECTOR);
        }

        return res;
    }

    /**
     * Return transaction id from transaction item element
     * @param {Element} elem - target list item element
     */
    transIdFromElem(elem) {
        const listItemElem = this.findListItemElement(elem);
        if (!listItemElem || !listItemElem.dataset) {
            return 0;
        }

        return parseInt(listItemElem.dataset.id, 10);
    }

    /**
     * Set position of transaction and update position and result balance of related transactions
     * @param {number} transactionId - identifier of transaction
     * @param {number} pos - new position of specified transaction
     */
    setPosition(transactionId, pos) {
        const posCompareAsc = (a, b) => a.pos - b.pos;
        const posCompareDesc = (a, b) => b.pos - a.pos;
        const initBalArr = [];
        const tBalanceArr = [];

        const trInfo = this.getTransaction(transactionId);
        if (!trInfo) {
            return false;
        }

        const oldPos = trInfo.pos;
        if (oldPos === pos) {
            return true;
        }

        this.state.items.sort(posCompareAsc);
        this.state.items.forEach((transaction) => {
            const tr = transaction;
            if (tr.id === transactionId) {
                tr.pos = pos;
            } else if (oldPos === 0) {
                /* insert with specified position */
                if (tr.pos >= pos) {
                    tr.pos += 1;
                }
            } else if (pos < oldPos) {
                /* moving up */
                if (tr.pos >= pos && tr.pos < oldPos) {
                    tr.pos += 1;
                }
            } else if (pos > oldPos) {
                /* moving down */
                if (tr.pos > oldPos && tr.pos <= pos) {
                    tr.pos -= 1;
                }
            }

            if (tr.src_id && !(tr.src_id in initBalArr)) {
                initBalArr[tr.src_id] = tr.src_result + tr.src_amount;
            }

            if (tr.dest_id && !(tr.dest_id in initBalArr)) {
                initBalArr[tr.dest_id] = tr.dest_result - tr.dest_amount;
            }
        });

        // Sort array of transaction by position again
        this.state.items.sort(posCompareAsc);

        if (this.state.mode === 'details') {
            this.state.items.forEach((transaction) => {
                const tr = transaction;
                const srcBalance = (tr.src_id !== 0 && tBalanceArr[tr.src_id] !== undefined)
                    ? tBalanceArr[tr.src_id]
                    : initBalArr[tr.src_id];
                const destBalance = (tr.dest_id !== 0 && tBalanceArr[tr.dest_id] !== undefined)
                    ? tBalanceArr[tr.dest_id]
                    : initBalArr[tr.dest_id];

                if (oldPos === 0) {
                    /* insert with specified position */
                    if (tr.pos >= pos) {
                        this.updateBalance(tr, srcBalance, destBalance);
                    }
                } else if (pos < oldPos) {
                    /* moving up */
                    if (tr.pos >= pos && tr.pos <= oldPos) {
                        this.updateBalance(tr, srcBalance, destBalance);
                    }
                } else if (pos > oldPos) {
                    /* moving down */
                    if (tr.pos >= oldPos && tr.pos <= pos) {
                        this.updateBalance(tr, srcBalance, destBalance);
                    }
                }

                tBalanceArr[tr.src_id] = tr.src_result;
                tBalanceArr[tr.dest_id] = tr.dest_result;
            });
        }

        this.state.items.sort(posCompareDesc);
        this.render(this.state);

        return true;
    }

    /**
     *
     * @param {object} transaction - transaction object
     * @param {number} srcBal - source balance
     * @param {number} destBal - destination balance
     */
    updateBalance(transaction, srcBal, destBal) {
        let sourceBalance = srcBal;
        let destBalance = destBal;
        const tr = transaction;

        if (!tr) {
            return;
        }

        if (tr.src_id !== 0) {
            if (sourceBalance === null) {
                sourceBalance = tr.src_result + tr.src_amount;
            }
            tr.src_result = sourceBalance - tr.src_amount;
        } else {
            tr.src_result = 0;
        }

        if (tr.dest_id !== 0) {
            if (destBalance === null) {
                destBalance = tr.dest_result - tr.dest_amount;
            }
            tr.dest_result = destBalance + tr.dest_amount;
        } else {
            tr.dest_result = 0;
        }
    }

    /**
     * Transaction item click event handler
     * @param {Event} e - click event object
     */
    onItemClick(e) {
        const listItemElem = this.findListItemElement(e?.target);
        const itemId = parseInt(listItemElem?.dataset?.id, 10);
        const transaction = this.getTransaction(itemId);
        if (!transaction) {
            return;
        }

        if (this.state.listMode === 'list') {
            const menuBtn = e?.target?.closest('.actions-menu-btn');
            if (menuBtn && isFunction(this.props.onContextMenu)) {
                this.props.onContextMenu(itemId);
            }
        } else if (this.state.listMode === 'select') {
            if (isFunction(this.props.onSelect)) {
                this.props.onSelect(itemId);
            }
        }
    }

    toggleSelectItem(itemId) {
        const transaction = this.getTransaction(itemId);
        if (!transaction) {
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

    /**
     * Transaction item drop callback
     * @param {number} trans_id - identifier of moving transaction
     * @param {number} retrans_id - identifier of replaced transaction
     */
    onSort(elem, refElem) {
        const transactionId = this.transIdFromElem(elem);
        const refId = this.transIdFromElem(refElem);
        if (!transactionId || !refId) {
            return;
        }

        const replacedItem = this.getTransaction(refId);
        if (!replacedItem) {
            return;
        }

        this.state.items = [...this.state.items];

        if (isFunction(this.props.onSort)) {
            this.props.onSort(transactionId, replacedItem.pos);
        }
    }

    setListMode(listMode) {
        if (this.state.listMode === listMode) {
            return;
        }

        this.setState({ ...this.state, listMode });
    }

    setMode(mode) {
        if (this.state.mode === mode) {
            return;
        }

        this.setState({
            ...this.state,
            mode,
            renderTime: Date.now(),
        });
    }

    setItems(items) {
        if (this.state.items === items) {
            return;
        }

        this.setState({
            ...this.state,
            items,
            renderTime: Date.now(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state object');
        }

        this.elem.classList.toggle(SELECT_MODE_CLASS, state.listMode === 'select');

        const elems = state.items.map((item) => {
            const tritem = TransactionListItem.create({
                mode: state.mode,
                selected: item.selected,
                showControls: state.listMode === 'list',
                item,
            });
            tritem.render(tritem.state);
            return tritem.elem;
        });

        removeChilds(this.elem);
        if (elems.length) {
            const listItems = createElement('div', {
                props: { className: LIST_ITEMS_CLASS },
                children: elems,
            });
            this.elem.append(listItems);

            if (state.mode === 'details') {
                this.elem.classList.add(DETAILS_CLASS);
            } else {
                this.elem.classList.remove(DETAILS_CLASS);
            }
        } else {
            const noDataMsg = createElement('span', {
                props: {
                    className: NO_DATA_CLASS,
                    textContent: MSG_NO_TRANSACTIONS,
                },
            });

            this.elem.append(noDataMsg);
        }
        this.elem.dataset.time = state.renderTime;
    }
}
