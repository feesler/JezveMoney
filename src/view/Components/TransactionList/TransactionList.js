import { isFunction } from 'jezvejs';
import { Sortable } from 'jezvejs/Sortable';
import { __ } from '../../js/utils.js';
import { ListContainer } from '../ListContainer/ListContainer.js';
import { TransactionListItem } from '../TransactionListItem/TransactionListItem.js';
import './style.scss';

/** CSS classes */
const LIST_CLASS = 'trans-list';
const SELECT_MODE_CLASS = 'trans-list_select';
const SORT_MODE_CLASS = 'trans-list_sort';
const DETAILS_CLASS = 'trans-list_details';

const defaultProps = {
    ItemComponent: TransactionListItem,
    itemSelector: '.trans-item',
    itemSortSelector: '.trans-item.trans-item_sort',
    className: LIST_CLASS,
    noItemsMessage: __('TRANSACTIONS_NO_DATA'),
    mode: 'classic',
    showControls: true,
    onSort: null,
};

/**
 * Transaction list component
 */
export class TransactionList extends ListContainer {
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
            onInsertAt: (elem, ref) => this.onSort(elem, ref),
            elem: this.elem,
            group: 'transactions',
            selector: state.itemSortSelector,
            placeholderClass: 'trans-item_placeholder',
            copyWidth: true,
        });
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

        const trInfo = this.getItemById(transactionId);
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
     * Transaction item drop callback
     * @param {number} trans_id - identifier of moving transaction
     * @param {number} retrans_id - identifier of replaced transaction
     */
    onSort(elem, refElem) {
        const transactionId = this.itemIdFromElem(elem);
        const refId = this.itemIdFromElem(refElem);
        if (!transactionId || !refId) {
            return;
        }

        const replacedItem = this.getItemById(refId);
        if (!replacedItem) {
            return;
        }

        this.state.items = [...this.state.items];

        if (isFunction(this.props.onSort)) {
            this.props.onSort(transactionId, replacedItem.pos);
        }
    }

    getItemProps(item, state) {
        return {
            mode: state.mode,
            selected: item.selected,
            listMode: state.listMode,
            showControls: state.showControls,
            item,
        };
    }

    isChanged(state, prevState) {
        return (
            state.items !== prevState.items
            || state.mode !== prevState.mode
            || state.listMode !== prevState.listMode
            || state.showControls !== prevState.showControls
        );
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.createSortable(state);

        this.elem.classList.toggle(DETAILS_CLASS, state.mode === 'details');
        this.elem.classList.toggle(SELECT_MODE_CLASS, state.listMode === 'select');
        this.elem.classList.toggle(SORT_MODE_CLASS, state.listMode === 'sort');
    }
}
