import {
    ce,
    addChilds,
    removeChilds,
    Component,
} from 'jezvejs';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/app.js';

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
        this.titleElem = ce('div', { className: 'trans-list__item-title' });
        this.amountElem = ce('div', { className: 'trans-list__item-content' });
        this.dateCommentElem = ce('div', { className: 'trans-list__item-details' });
        this.contentElem = ce('div', { className: 'trans-list__item' }, [
            this.titleElem,
            this.amountElem,
            this.dateCommentElem,
        ]);

        this.elem = ce('div', { className: 'trans-list__item-wrapper' }, this.contentElem);
    }

    initDetails() {
        this.titleElem = ce('div', { className: 'trans-list__item-title' });
        this.amountElem = ce('div', { className: 'trans-list__item-content' });
        this.balanceElem = ce('div', { className: 'tritem_balance' });
        this.dateElem = ce('div', { className: 'trans-list__item-details' });
        this.commentElem = ce('div');

        this.contentElem = ce('tr', {}, [
            ce('td', {}, ce('div', { className: 'ellipsis-cell' }, this.titleElem)),
            ce('td', {}, this.amountElem),
            ce('td', {}, this.balanceElem),
            ce('td', {}, this.dateElem),
            ce('td', {}, ce('div', { className: 'ellipsis-cell' }, this.commentElem)),
        ]);

        this.elem = ce('tbody', { className: 'trans-list__item-wrapper' }, this.contentElem);
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

        this.contentElem.setAttribute('data-id', item.id);

        const accountTitle = this.formatAccounts(item);
        removeChilds(this.titleElem);
        this.titleElem.appendChild(ce('span', { textContent: accountTitle }));
        this.titleElem.setAttribute('title', accountTitle);

        const amountText = this.formatAmount(item);
        removeChilds(this.amountElem);
        this.amountElem.appendChild(ce('span', { textContent: amountText }));

        if (state.mode === 'details') {
            const results = this.formatResults(item);
            const elems = results.map((res) => ce('span', { textContent: res }));
            removeChilds(this.balanceElem);
            addChilds(this.balanceElem, elems);

            removeChilds(this.dateElem);
            this.dateElem.appendChild(ce('span', { textContent: item.date }));

            removeChilds(this.commentElem);
            this.commentElem.appendChild(ce('span', { textContent: item.comment }));
            this.commentElem.setAttribute('title', item.comment);
        } else {
            removeChilds(this.dateCommentElem);
            this.dateCommentElem.appendChild(ce('span', { textContent: item.date }));
            if (item.comment !== '') {
                this.dateCommentElem.appendChild(ce('span', {
                    className: 'trans-list__item-comment',
                    textContent: item.comment,
                }));
            }
        }

        if (state.selected) {
            this.contentElem.classList.add('trans-list__item_selected');
        } else {
            this.contentElem.classList.remove('trans-list__item_selected');
        }
    }
}
