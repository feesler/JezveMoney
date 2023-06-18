import { SortableListContainer } from 'jezvejs/SortableListContainer';
import { __ } from '../../utils/utils.js';
import { TransactionListItem } from '../TransactionListItem/TransactionListItem.js';
import './TransactionList.scss';

/** CSS classes */
const LIST_CLASS = 'trans-list';
const SELECT_MODE_CLASS = 'trans-list_select';
const SORT_MODE_CLASS = 'trans-list_sort';
const DETAILS_CLASS = 'trans-list_details';
const ITEM_PLACEHOLDER_CLASS = 'trans-item_placeholder';

const defaultProps = {
    ItemComponent: TransactionListItem,
    itemSelector: '.trans-item',
    itemSortSelector: '.trans-item.trans-item_sort',
    className: LIST_CLASS,
    placeholderClass: ITEM_PLACEHOLDER_CLASS,
    sortModeClass: SORT_MODE_CLASS,
    sortGroup: 'transactions',
    noItemsMessage: __('transactions.noData'),
    mode: 'classic',
    showControls: true,
    showDate: true,
    ascending: false,
    onSort: null,
    onItemClick: null,
};

/**
 * Transaction list component
 */
export class TransactionList extends SortableListContainer {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            sortGroup: (elem) => elem?.dataset.group,
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

    getItemProps(item, state) {
        return {
            mode: state.mode,
            selected: item.selected,
            listMode: state.listMode,
            showControls: state.showControls,
            showDate: state.showDate,
            renderTime: state.renderTime,
            onItemClick: state.onItemClick,
            onSort: state.onSort,
            item,
        };
    }

    isChanged(state, prevState) {
        return (
            state.items !== prevState.items
            || state.mode !== prevState.mode
            || state.listMode !== prevState.listMode
            || state.showControls !== prevState.showControls
            || state.showDate !== prevState.showDate
        );
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.elem.classList.toggle(DETAILS_CLASS, state.mode === 'details');
        this.elem.classList.toggle(SELECT_MODE_CLASS, state.listMode === 'select');
    }
}
