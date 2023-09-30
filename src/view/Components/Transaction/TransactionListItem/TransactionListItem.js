import { getClassName } from 'jezvejs';

import { TransactionListItemBase } from '../TransactionListItemBase/TransactionListItemBase.js';
import { ListItem } from '../../List/ListItem/ListItem.js';

import './TransactionListItem.scss';

/** CSS classes */
const TRANS_ITEM_CLASS = 'trans-item';

const defaultProps = {
    mode: 'classic', // 'classic' or 'details'
    showDate: true,
};

/**
 * Transaction list item component
 */
export class TransactionListItem extends ListItem {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(TRANS_ITEM_CLASS, props.className),
        });
    }

    renderContent(state, prevState) {
        if (
            state.item === prevState?.item
            && state.mode === prevState?.mode
            && state.showDate === prevState?.showDate
        ) {
            return;
        }

        const transactionState = {
            item: state.item,
            mode: state.mode,
            showDate: state.showDate,
        };

        if (this.transactionBase) {
            this.transactionBase.setState(transactionState);
        } else {
            this.transactionBase = TransactionListItemBase.create(transactionState);
            this.contentElem.append(this.transactionBase.elem);
        }
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        const { item } = state;
        if (!item) {
            throw new Error('Invalid transaction object');
        }

        this.elem.setAttribute('data-type', item.type);
        this.elem.setAttribute('data-group', item.date);
    }
}
