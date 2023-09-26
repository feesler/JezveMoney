import { getClassName } from 'jezvejs';
import { LinkMenu } from 'jezvejs/LinkMenu';

import { __ } from '../../../utils/utils.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from '../../../Models/Transaction.js';

import './TransactionTypeMenu.scss';

const CONTAINER_CLASS = 'link-menu trtype-menu';

const defaultProps = {
    itemParam: 'type',
    showAll: true,
    showChangeLimit: false,
};

/**
 * Transaction type menu component
 */
export class TransactionTypeMenu extends LinkMenu {
    constructor(props = {}) {
        const menuProps = {
            ...defaultProps,
            ...props,
            className: getClassName(CONTAINER_CLASS, props.className),
        };

        menuProps.defaultItemType = (menuProps.multiple) ? 'checkbox-link' : 'link';
        menuProps.items = [
            {
                id: 'all',
                selectable: false,
                title: __('actions.showAll'),
                hidden: !menuProps.showAll,
            },
            { id: EXPENSE, title: __('transactions.types.expense') },
            { id: INCOME, title: __('transactions.types.income') },
            { id: TRANSFER, title: __('transactions.types.transfer') },
            { id: DEBT, title: __('transactions.types.debt') },
            {
                id: LIMIT_CHANGE,
                title: __('transactions.types.creditLimit'),
                hidden: !menuProps.showChangeLimit,
            },
        ];

        super(menuProps);
    }

    getItemValue(elem) {
        return parseInt(elem.dataset.id, 10);
    }

    onItemClick(id, e) {
        super.onItemClick(id, e);

        if (id === 'all' && this.state.showAll) {
            this.clearSelection();
        }

        this.sendChangeEvent();
    }

    getItemURL(item, state) {
        if (!state.url) {
            return null;
        }
        const { itemParam } = state;
        const param = (state.multiple) ? `${itemParam}[]` : itemParam;

        const url = new URL(state.url);
        if (item.id !== 'all') {
            url.searchParams.set(param, item.id);
        } else {
            url.searchParams.delete(param);
        }

        if (item.id !== DEBT.toString() && !state.multiple) {
            const accountId = url.searchParams.get('acc_id');
            if (accountId === '0') {
                url.searchParams.delete('acc_id');
            }

            url.searchParams.delete('person_id');
        }

        return url;
    }

    render(state, prevState = {}) {
        const strLimit = LIMIT_CHANGE.toString();

        super.render({
            ...state,
            items: state.items.map((item) => ({
                ...item,
                hidden: (
                    (item.id === strLimit && !state.showChangeLimit)
                    || (item.id === 'all' && !state.showAll)
                ),
            })),
        }, prevState);
    }
}
