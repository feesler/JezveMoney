import { createElement } from 'jezvejs';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/model/Transaction.js';
import { LinkMenu } from '../LinkMenu/LinkMenu.js';
import './style.scss';

const CONTAINER_CLASS = 'link-menu trtype-menu';

/** Strings */
const TITLE_SHOW_ALL = 'Show all';
const TITLE_EXPENSE = 'Expense';
const TITLE_INCOME = 'Income';
const TITLE_TRANSFER = 'Transfer';
const TITLE_DEBT = 'Debt';

const defaultProps = {
    itemParam: 'type',
};

/**
 * Transaction type menu component
 */
export class TransactionTypeMenu extends LinkMenu {
    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = { ...this.props };
    }

    init() {
        this.elem = createElement('div', { props: { className: CONTAINER_CLASS } });
        this.setHandlers();
        this.setClassNames();

        this.setState({
            ...this.state,
            items: [
                { title: TITLE_SHOW_ALL },
                { value: EXPENSE, title: TITLE_EXPENSE },
                { value: INCOME, title: TITLE_INCOME },
                { value: TRANSFER, title: TITLE_TRANSFER },
                { value: DEBT, title: TITLE_DEBT },
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
