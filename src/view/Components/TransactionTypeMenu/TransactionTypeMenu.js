import { createElement } from 'jezvejs';
import { LinkMenu } from 'jezvejs/LinkMenu';
import { __ } from '../../js/utils.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from '../../js/model/Transaction.js';

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
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.elem = createElement('div', { props: { className: CONTAINER_CLASS } });
        this.setHandlers();
        this.setUserProps();
        this.setClassNames();

        const items = [
            { title: __('SHOW_ALL'), hidden: !this.props.showAll },
            { value: EXPENSE, title: __('TR_EXPENSE') },
            { value: INCOME, title: __('TR_INCOME') },
            { value: TRANSFER, title: __('TR_TRANSFER') },
            { value: DEBT, title: __('TR_DEBT') },
            {
                value: LIMIT_CHANGE,
                title: __('TR_LIMIT_CHANGE'),
                hidden: !this.props.showChangeLimit,
            },
        ];

        this.setState({
            ...this.state,
            items,
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

    render(state, prevState = {}) {
        super.render({
            ...state,
            items: state.items.map((item) => ({
                ...item,
                hidden: (
                    (item.value === LIMIT_CHANGE && !state.showChangeLimit)
                    || (!item.value && !state.showAll)
                ),
            })),
        }, prevState);
    }
}
