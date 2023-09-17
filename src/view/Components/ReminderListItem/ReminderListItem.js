import { getClassName } from 'jezvejs';

import { Reminder } from '../../Models/Reminder.js';

import { ListItem } from '../ListItem/ListItem.js';
import { TransactionListItemBase } from '../TransactionListItemBase/TransactionListItemBase.js';

import './ReminderListItem.scss';

/** CSS classes */
const ITEM_CLASS = 'reminder-item';

const defaultProps = {
    mode: 'classic', // 'classic' or 'details'
};

/**
 * Scheduled transaction reminder list item component
 */
export class ReminderListItem extends ListItem {
    static get selector() {
        return `.${ITEM_CLASS}`;
    }

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(ITEM_CLASS, props.className),
            item: Reminder.createExtended(props.item),
        });
    }

    renderContent(state, prevState) {
        if (
            state.item === prevState?.item
            && state.mode === prevState?.mode
        ) {
            return;
        }

        const transactionState = {
            item: state.item,
            mode: state.mode,
            showDate: true,
            showResults: false,
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
    }
}
