import {
    ce,
    removeChilds,
    Component,
} from 'jezvejs';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/model/Transaction.js';
import './style.scss';

/** CSS classes */
export const TRANS_ITEM_CLASS = 'trans-item';
const TITLE_CLASS = 'trans-item__title';
const AMOUNT_CLASS = 'trans-item__amount';
const DATE_CLASS = 'trans-item__date';
const BALANCE_CLASS = 'trans-item__balance';
const BALANCE_VALUE_CLASS = 'trans-item__balance-value';
const COMMENT_CLASS = 'trans-item__comment';
const AMOUNT_RESULT_CLASS = 'trans-item__amount-result';
const DATE_COMMENT_CLASS = 'trans-item__date-comment';
const DETAILS_CLASS = 'trans-item_details';
const SELECTED_CLASS = 'trans-item_selected';

/**
 * Transaction list item component
 */
export class TransactionListItem extends Component {
    static create(props) {
        const instance = new TransactionListItem(props);
        instance.init();

        return instance;
    }

    constructor(...args) {
        super(...args);

        this.state = { ...this.props };
    }

    init() {
        if (this.props.mode && this.props.mode === 'details') {
            this.initDetails();
        } else {
            this.initClassic();
        }
    }

    initClassic() {
        this.titleElem = ce('div', { className: TITLE_CLASS });
        this.amountElem = ce('div', { className: AMOUNT_CLASS });
        this.dateElem = ce('div', { className: DATE_CLASS });
        this.commentElem = ce('div', { className: COMMENT_CLASS });
        this.dateCommentElem = ce(
            'div',
            { className: DATE_COMMENT_CLASS },
            [this.dateElem, this.commentElem],
        );

        this.elem = ce('div', { className: TRANS_ITEM_CLASS }, [
            this.titleElem,
            this.amountElem,
            this.dateCommentElem,
        ]);
    }

    initDetails() {
        this.titleElem = ce('div', { className: TITLE_CLASS });

        this.amountElem = ce('div', { className: AMOUNT_CLASS });
        this.balanceElem = ce('div', { className: BALANCE_CLASS });
        this.amountResultElem = ce(
            'div',
            { className: AMOUNT_RESULT_CLASS },
            [this.amountElem, this.balanceElem],
        );

        this.dateElem = ce('div', { className: DATE_CLASS });
        this.commentElem = ce('div', { className: COMMENT_CLASS });
        this.dateCommentElem = ce(
            'div',
            { className: DATE_COMMENT_CLASS },
            [this.dateElem, this.commentElem],
        );

        this.elem = ce('div', { className: `${TRANS_ITEM_CLASS} ${DETAILS_CLASS}` }, [
            this.titleElem,
            this.amountResultElem,
            this.dateCommentElem,
        ]);
    }

    formatAccounts(item) {
        if (!item) {
            throw new Error('Invalid transaction');
        }

        const accountModel = window.app.model.accounts;
        const srcAcc = accountModel.getItem(item.src_id);
        const destAcc = accountModel.getItem(item.dest_id);

        if (item.type === EXPENSE) {
            return srcAcc.name;
        }

        if (item.type === INCOME) {
            return destAcc.name;
        }

        if (item.type === TRANSFER) {
            return `${srcAcc.name} → ${destAcc.name}`;
        }

        if (item.type !== DEBT) {
            throw new Error('Invalid type of transaction');
        }

        const { profile } = window.app.model;
        const personModel = window.app.model.persons;
        const debtType = (srcAcc && srcAcc.owner_id !== profile.owner_id);
        const personAcc = (debtType) ? srcAcc : destAcc;
        const person = personModel.getItem(personAcc.owner_id);
        if (!person) {
            throw new Error(`Person ${personAcc.owner_id} not found`);
        }

        const acc = (debtType) ? destAcc : srcAcc;
        if (acc) {
            return (debtType)
                ? `${person.name} → ${acc.name}`
                : `${acc.name} → ${person.name}`;
        }

        return person.name;
    }

    formatAmount(item) {
        if (!item) {
            throw new Error('Invalid transaction');
        }

        const currencyModel = window.app.model.currency;
        const srcAmountFmt = currencyModel.formatCurrency(item.src_amount, item.src_curr);
        const destAmountFmt = currencyModel.formatCurrency(item.dest_amount, item.dest_curr);
        const diffCurrency = item.src_curr !== item.dest_curr;

        let sign;
        if (item.type === EXPENSE) {
            sign = '- ';
        }
        if (item.type === INCOME) {
            sign = '+ ';
        }
        if (item.type === TRANSFER) {
            sign = '';
        }

        if (item.type === DEBT) {
            const { profile } = window.app.model;
            const accountModel = window.app.model.accounts;
            const srcAcc = accountModel.getItem(item.src_id);
            const debtType = (!!srcAcc && srcAcc.owner_id !== profile.owner_id);
            const acc = (debtType) ? item.dest_id : item.src_id;

            sign = (!!acc === debtType) ? '+ ' : '- ';
        }

        return (diffCurrency)
            ? `${sign}${srcAmountFmt} (${sign}${destAmountFmt})`
            : `${sign}${srcAmountFmt}`;
    }

    formatResults(item) {
        if (!item) {
            throw new Error('Invalid transaction');
        }

        const currencyModel = window.app.model.currency;
        const res = [];

        if (item.src_id) {
            res.push(currencyModel.formatCurrency(item.src_result, item.src_curr));
        }
        if (item.dest_id) {
            res.push(currencyModel.formatCurrency(item.dest_result, item.dest_curr));
        }

        return res;
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state object');
        }

        const { item } = state;
        if (!item) {
            throw new Error('Invalid transaction object');
        }

        this.elem.setAttribute('data-id', item.id);

        const accountTitle = this.formatAccounts(item);
        this.titleElem.textContent = accountTitle;
        this.titleElem.setAttribute('title', accountTitle);

        this.amountElem.textContent = this.formatAmount(item);

        if (state.mode === 'details') {
            const results = this.formatResults(item);
            const elems = results.map((res) => (
                ce('span', { className: BALANCE_VALUE_CLASS, textContent: res })
            ));
            removeChilds(this.balanceElem);
            this.balanceElem.append(...elems);
        }

        this.dateElem.textContent = item.date;

        this.commentElem.textContent = item.comment;
        this.commentElem.setAttribute('title', item.comment);

        if (state.selected) {
            this.elem.classList.add(SELECTED_CLASS);
        } else {
            this.elem.classList.remove(SELECTED_CLASS);
        }
    }
}
