import { ce, Component } from 'jezvejs';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'orig-data';
const TABLE_CLASS = 'orig-data-table';
const COLUMN_CLASS = 'column';
const COLUMN_HEADER_CLASS = 'column__header';
const COLUMN_DATA_CLASS = 'column__data';
const COMMENT_COLUMN_CLASS = 'comment-column';

/** Strings */
const TITLE_ORIGINAL_DATA = 'Original imported data';
const COL_MAIN = 'Main account';
const COL_TEMPLATE = 'Template';
const COL_DATE = 'Date';
const COL_COMMENT = 'Comment';
const COL_TR_AMOUNT = 'Tr. amount';
const COL_TR_CURRENCY = 'Tr. currency';
const COL_ACC_AMOUNT = 'Acc. amount';
const COL_ACC_CURRENCY = 'Acc. currency';

/**
 * Original import transaction data
 * @param {Object} props
 * @param {Object} props.mainAccount
 * @param {Number} props.transactionAmount
 * @param {Number} props.transactionCurrency
 * @param {Number} props.accountAmount
 * @param {Number} props.accountCurrency
 * @param {Number} props.date
 * @param {Number} props.comment
 */
export class OriginalImportData extends Component {
    static create(props) {
        return new OriginalImportData(props);
    }

    constructor(...args) {
        super(...args);

        if (!this.props.mainAccount) {
            throw new Error('mainAccount expected');
        }
        if (!this.props.template) {
            throw new Error('template expected');
        }

        this.render();
    }

    renderColumn(title, value, className = null) {
        const elemClasses = [COLUMN_CLASS];

        if (typeof className === 'string' && className.length > 0) {
            elemClasses.push(className);
        }

        return ce('div', { className: elemClasses.join(' ') }, [
            ce('label', { className: COLUMN_HEADER_CLASS, textContent: title }),
            ce('div', { className: COLUMN_DATA_CLASS, textContent: value }),
        ]);
    }

    render() {
        const template = window.app.model.templates.getItem(this.props.template);
        const templateName = (template) ? template.name : '';

        const dataTable = [
            [COL_MAIN, this.props.mainAccount.name],
            [COL_TEMPLATE, templateName],
            [COL_DATE, window.app.formatDate(new Date(this.props.date))],
            [COL_TR_AMOUNT, this.props.transactionAmount],
            [COL_TR_CURRENCY, this.props.transactionCurrency],
            [COL_ACC_AMOUNT, this.props.accountAmount],
            [COL_ACC_CURRENCY, this.props.accountCurrency],
            [COL_COMMENT, this.props.comment, COMMENT_COLUMN_CLASS],
        ];

        this.elem = window.app.createContainer(CONTAINER_CLASS, [
            ce('h3', { textContent: TITLE_ORIGINAL_DATA }),
            window.app.createContainer(
                TABLE_CLASS,
                dataTable.map((col) => this.renderColumn(...col)),
            ),
        ]);
    }
}
