import { ce, removeChilds } from 'jezvejs';
import { Component } from 'jezvejs/Component';
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
        /*
                <tbody class="trans-list__item-wrapper">
                <tr data-id="<?=e($trItem["id"])?>">
                    <td>
                        <div class="ellipsis-cell">
                            <div class="trans-list__item-title" title="<?=e($trItem["acc"])?>">
                                <span><?=e($trItem["acc"])?></span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="trans-list__item-content">
                            <span><?=e($trItem["amount"])?></span>
                        </div>
                    </td>
                    <td>
                        <div class="tritem_balance">
                            <span><?=implode("</span><span>", array_map("e", $trItem["balance"]))?></span>
                        </div>
                    </td>
                    <td>
                        <div class="trans-list__item-details">
                            <span><?=e($trItem["date"])?></span>
                        </div>
                    </td>
                    <td>
                        <div class="ellipsis-cell">
        <?php           if ($trItem["comment"] != "") {		?>
                            <div title="<?=e($trItem["comment"])?>">
                                <span class="trans-list__item-comment"><?=e($trItem["comment"])?></span>
                            </div>
        <?php           } else {		?>
                            <div></div>
        <?php           }	?>
                        </div>
                    </td>
                </tr>
                </tbody>
        */
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state object');
        }

        const { item } = state;
        if (!item) {
            throw new Error('Invalid transaction object');
        }

        const accountModel = window.app.model.account;
        const personModel = window.app.model.person;
        const currencyModel = window.app.model.currency;

        const srcAcc = accountModel.getItem(item.src_id);
        const destAcc = accountModel.getItem(item.dest_id);
        const srcAmountFmt = currencyModel.formatCurrency(item.src_amount, item.src_curr);
        const destAmountFmt = currencyModel.formatCurrency(item.dest_amount, item.dest_curr);

        let amountText;
        let accountTitle;

        if (item.type === EXPENSE) {
            amountText = `- ${srcAmountFmt}`;
            if (item.src_curr !== item.dest_curr) {
                amountText += ` (- ${destAmountFmt})`;
            }

            accountTitle = srcAcc.name;
        } else if (item.type === INCOME) {
            amountText = `+ ${srcAmountFmt}`;
            if (item.src_curr !== item.dest_curr) {
                amountText += ` (+ ${destAmountFmt})`;
            }

            accountTitle = destAcc.name;
        } else if (item.type === TRANSFER) {
            amountText = currencyModel.formatCurrency(item.src_amount, item.src_curr);
            if (item.src_curr !== item.dest_curr) {
                amountText += ` (${destAmountFmt})`;
            }

            accountTitle = `${srcAcc.name} → ${destAcc.name}`;
        } else if (item.type === DEBT) {
            accountTitle = '';
            const { profile } = window.app.model;

            const debtType = (!!srcAcc && srcAcc.owner_id !== profile.owner_id);
            const personAcc = debtType ? srcAcc : destAcc;
            const person = personModel.getItem(personAcc.owner_id);
            if (!person) {
                throw new Error(`Person ${personAcc.owner_id} not found`);
            }

            const acc = (debtType) ? destAcc : srcAcc;

            if (debtType) {
                accountTitle = person.name;
                if (acc) {
                    accountTitle += ` → ${acc.name}`;
                }
                amountText = (acc) ? '+ ' : '- ';
            } else {
                if (acc) {
                    accountTitle = `${acc.name} → `;
                }
                accountTitle += person.name;
                amountText = (srcAcc) ? '- ' : '+ ';
            }

            amountText += currencyModel.formatCurrency(item.src_amount, personAcc.curr_id);
        }

        this.contentElem.setAttribute('data-id', item.id);

        removeChilds(this.titleElem);
        this.titleElem.appendChild(ce('span', { textContent: accountTitle }));
        this.titleElem.setAttribute('title', accountTitle);

        removeChilds(this.amountElem);
        this.amountElem.appendChild(ce('span', { textContent: amountText }));

        if (state.mode === 'details') {
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
    }
}
