import { ce, Component } from 'jezvejs';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/model/Transaction.js';
import { Field } from '../Field/Field.js';
import './style.scss';

/** CSS classes */
export const TRANS_ITEM_CLASS = 'trans-item';
const TITLE_CLASS = 'trans-item__title';
const AMOUNT_CLASS = 'trans-item__amount';
const DATE_CLASS = 'trans-item__date';
const COMMENT_CLASS = 'trans-item__comment';
const DATE_COMMENT_CLASS = 'trans-item__date-comment';
/* Details mode */
const DETAILS_CLASS = 'trans-item_details';
/* Field groups */
const ACCOUNTS_GROUP_CLASS = 'trans-item__accounts-group';
const AMOUNT_GROUP_CLASS = 'trans-item__amount-group';
const RESULTS_GROUP_CLASS = 'trans-item__results-group';
const AMOUNT_RESULT_GROUP_CLASS = 'trans-item__amount-result-group';
/* Fields */
const TITLE_FIELD_CLASS = 'trans-item__account-field';
const AMOUNT_FIELD_CLASS = 'trans-item__amount-field';
const RESULT_FIELD_CLASS = 'trans-item__result-field';
const DATE_FIELD_CLASS = 'trans-item__date-field';
const COMMENT_FIELD_CLASS = 'trans-item__comment-field';
/* Other */
const SELECTED_CLASS = 'trans-item_selected';

/** Strings */
const LABEL_SOURCE = 'Source';
const LABEL_DESTINATION = 'Destination';
const LABEL_AMOUNT = 'Amount';
const LABEL_SRC_AMOUNT = 'Source amount';
const LABEL_DEST_AMOUNT = 'Destination amount';
const LABEL_RESULT = 'Result';
const LABEL_SRC_RESULT = 'Source result';
const LABEL_DEST_RESULT = 'Destination result';
const LABEL_DATE = 'Date';
const LABEL_COMMENT = 'Comment';

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
        // Accounts
        this.sourceField = Field.create({
            title: LABEL_SOURCE,
            className: TITLE_FIELD_CLASS,
        });
        this.destField = Field.create({
            title: LABEL_DESTINATION,
            className: TITLE_FIELD_CLASS,
        });
        this.sourceDestGroup = ce(
            'div',
            { className: ACCOUNTS_GROUP_CLASS },
            [this.sourceField.elem, this.destField.elem],
        );
        // Amount
        this.srcAmountField = Field.create({
            title: LABEL_SRC_AMOUNT,
            className: AMOUNT_FIELD_CLASS,
        });
        this.destAmountField = Field.create({
            title: LABEL_DEST_AMOUNT,
            className: AMOUNT_FIELD_CLASS,
        });
        this.amountGroup = ce(
            'div',
            { className: AMOUNT_GROUP_CLASS },
            [this.srcAmountField.elem, this.destAmountField.elem],
        );
        // Result balance
        this.srcResultField = Field.create({
            title: LABEL_SRC_RESULT,
            className: RESULT_FIELD_CLASS,
        });
        this.destResultField = Field.create({
            title: LABEL_DEST_RESULT,
            className: RESULT_FIELD_CLASS,
        });
        this.resultsGroup = ce(
            'div',
            { className: RESULTS_GROUP_CLASS },
            [this.srcResultField.elem, this.destResultField.elem],
        );

        this.amountResultGroup = ce(
            'div',
            { className: AMOUNT_RESULT_GROUP_CLASS },
            [this.amountGroup, this.resultsGroup],
        );
        // Date
        this.dateElem = ce('div', { className: DATE_CLASS });
        this.dateField = Field.create({
            title: LABEL_DATE,
            content: this.dateElem,
            className: DATE_FIELD_CLASS,
        });
        // Comment
        this.commentElem = ce('div', { className: COMMENT_CLASS });
        this.commentField = Field.create({
            content: this.commentElem,
            className: COMMENT_FIELD_CLASS,
        });

        this.dateCommentGroup = ce(
            'div',
            { className: DATE_COMMENT_CLASS },
            [this.dateField.elem, this.commentField.elem],
        );

        this.elem = ce('div', { className: `${TRANS_ITEM_CLASS} ${DETAILS_CLASS}` }, [
            this.sourceDestGroup,
            this.amountResultGroup,
            this.dateCommentGroup,
        ]);
    }

    getDebtType(item) {
        if (item.type !== DEBT) {
            throw new Error('Invalid item type');
        }

        const { profile, accounts } = window.app.model;
        const srcAcc = accounts.getItem(item.src_id);
        return (!!srcAcc && srcAcc.owner_id !== profile.owner_id);
    }

    getAccountOrPerson(accountId) {
        const { profile, accounts, persons } = window.app.model;
        const account = accounts.getItem(accountId);
        if (!account) {
            return null;
        }
        if (account.owner_id === profile.owner_id) {
            return account.name;
        }

        const person = persons.getItem(account.owner_id);
        return person.name;
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

        const personModel = window.app.model.persons;
        const debtType = this.getDebtType(item);
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
            const debtType = this.getDebtType(item);
            const acc = (debtType) ? item.dest_id : item.src_id;

            sign = (!!acc === debtType) ? '+ ' : '- ';
        }

        return (diffCurrency)
            ? `${sign}${srcAmountFmt} (${sign}${destAmountFmt})`
            : `${sign}${srcAmountFmt}`;
    }

    renderClassic(state) {
        const { item } = state;

        const accountTitle = this.formatAccounts(item);
        this.titleElem.textContent = accountTitle;
        this.titleElem.setAttribute('title', accountTitle);

        this.amountElem.textContent = this.formatAmount(item);

        this.dateElem.textContent = item.date;

        this.commentElem.textContent = item.comment;
        this.commentElem.setAttribute('title', item.comment);
    }

    renderDetails(state) {
        const { item } = state;
        const { currency } = window.app.model;

        // Source
        const showSource = (item.src_id !== 0);
        if (showSource) {
            const sourceContent = this.getAccountOrPerson(item.src_id);
            this.sourceField.setContent(sourceContent);
        }
        this.sourceField.show(showSource);

        // Destination
        const showDest = (item.dest_id !== 0);
        if (showDest) {
            const destContent = this.getAccountOrPerson(item.dest_id);
            this.destField.setContent(destContent);
        }
        this.destField.show(showDest);

        // Amount
        const isDiff = (item.src_curr !== item.dest_curr);
        const srcAmountLabel = (isDiff) ? LABEL_SRC_AMOUNT : LABEL_AMOUNT;
        this.srcAmountField.setTitle(srcAmountLabel);
        if (isDiff) {
            const srcAmountFmt = currency.formatCurrency(item.src_amount, item.src_curr);
            this.srcAmountField.setContent(srcAmountFmt);
            const destAmountFmt = currency.formatCurrency(item.dest_amount, item.dest_curr);
            this.destAmountField.setContent(destAmountFmt);
        } else {
            const amountFmt = this.formatAmount(item);
            this.srcAmountField.setContent(amountFmt);
        }
        this.destAmountField.show(isDiff);

        // Source result
        if (showSource) {
            const srcResultLabel = (showDest) ? LABEL_SRC_RESULT : LABEL_RESULT;
            this.srcResultField.setTitle(srcResultLabel);
            const srcResult = currency.formatCurrency(item.src_result, item.src_curr);
            this.srcResultField.setContent(srcResult);
        }
        this.srcResultField.show(showSource);

        // Destination result
        if (showDest) {
            const destResultLabel = (showSource) ? LABEL_DEST_RESULT : LABEL_RESULT;
            this.destResultField.setTitle(destResultLabel);
            const destResult = currency.formatCurrency(item.dest_result, item.dest_curr);
            this.destResultField.setContent(destResult);
        }
        this.destResultField.show(showDest);

        // Date
        this.dateField.setContent(item.date);

        // Comment
        const commentLabel = (item.comment.length > 0) ? LABEL_COMMENT : null;
        this.commentField.setTitle(commentLabel);
        this.commentElem.textContent = item.comment;
        this.commentElem.setAttribute('title', item.comment);
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
        this.elem.setAttribute('data-type', item.type);

        if (state.mode === 'details') {
            this.renderDetails(state);
        } else {
            this.renderClassic(state);
        }

        if (state.selected) {
            this.elem.classList.add(SELECTED_CLASS);
        } else {
            this.elem.classList.remove(SELECTED_CLASS);
        }
    }
}
