import { createElement } from 'jezvejs';
import { LinkMenu } from 'jezvejs/LinkMenu';
import { __ } from '../../js/utils.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/model/Transaction.js';

const CONTAINER_CLASS = 'link-menu trtype-menu';

const defaultProps = {
    itemParam: 'type',
};

/**
 * Transaction type menu component
 */
export class TransactionTypeMenu extends LinkMenu {
    constructor(props) {
        super(props);

        this.state = {
            ...defaultProps,
            ...this.state,
        };
    }

    init() {
        this.elem = createElement('div', { props: { className: CONTAINER_CLASS } });
        this.setHandlers();
        this.setClassNames();

        this.setState({
            ...this.state,
            items: [
                { title: __('SHOW_ALL') },
                { value: EXPENSE, title: __('TR_EXPENSE') },
                { value: INCOME, title: __('TR_INCOME') },
                { value: TRANSFER, title: __('TR_TRANSFER') },
                { value: DEBT, title: __('TR_DEBT') },
            ],
        });
    }

    getItemValue(elem) {
        return parseInt(elem.dataset.value, 10);
    }

    getItemURL(item, state) {
        if (!state.url) {
            return null;
        }
        const { itemParam } = state;
        const param = (state.multiple) ? `${itemParam}[]` : itemParam;

        const url = new URL(state.url);
        if (item.value) {
            url.searchParams.set(param, item.value);
        } else {
            url.searchParams.delete(param);
        }

        if (item.value !== DEBT && !state.multiple) {
            const accountId = url.searchParams.get('acc_id');
            if (accountId === '0') {
                url.searchParams.delete('acc_id');
            }

            url.searchParams.delete('person_id');
        }

        return url;
    }
}
