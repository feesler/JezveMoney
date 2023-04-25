import { createElement, getClassName, Component } from 'jezvejs';
import { __ } from '../../../../js/utils.js';
import { IMPORT_DATE_LOCALE } from '../../../../js/model/ImportTemplate.js';
import './OriginalImportData.scss';

/** CSS classes */
const CONTAINER_CLASS = 'orig-data';
const TABLE_CLASS = 'orig-data-table';
const GROUP_CLASS = 'column-group';
const COLUMN_CLASS = 'column';
const COLUMN_HEADER_CLASS = 'column__header';
const COLUMN_DATA_CLASS = 'column__data';
const COMMENT_COLUMN_CLASS = 'comment-column';

/**
 * Original import transaction data
 * @param {Object} props
 * @param {Object} props.origAccount
 * @param {Number} props.transactionAmount
 * @param {Number} props.transactionCurrency
 * @param {Number} props.accountAmount
 * @param {Number} props.accountCurrency
 * @param {Number} props.date
 * @param {Number} props.comment
 */
export class OriginalImportData extends Component {
    constructor(...args) {
        super(...args);

        if (!this.props.origAccount) {
            throw new Error('origAccount expected');
        }
        if (!this.props.template) {
            throw new Error('template expected');
        }

        this.render();
    }

    renderColumn(title, value, className = null) {
        return createElement('div', {
            props: { className: getClassName(COLUMN_CLASS, className) },
            children: [
                createElement('label', {
                    props: { className: COLUMN_HEADER_CLASS, textContent: title },
                }),
                createElement('div', {
                    props: { className: COLUMN_DATA_CLASS, textContent: value },
                }),
            ],
        });
    }

    render() {
        const template = window.app.model.templates.getItem(this.props.template);
        const templateName = (template) ? template.name : '';

        const dataTable = [
            [
                [__('IMPORT_MAIN_ACCOUNT'), this.props.origAccount.name],
                [__('TEMPLATE'), templateName],
            ],
            [
                [__('COLUMN_TR_AMOUNT'), this.props.transactionAmount],
                [__('COLUMN_TR_CURRENCY'), this.props.transactionCurrency],
            ],
            [
                [__('COLUMN_ACCOUNT_AMOUNT'), this.props.accountAmount],
                [__('COLUMN_ACCOUNT_CURRENCY'), this.props.accountCurrency],
            ],
            [
                [
                    __('COLUMN_DATE'),
                    window.app.formatDate(
                        new Date(this.props.date),
                        { locales: IMPORT_DATE_LOCALE },
                    ),
                ],
            ],
            [
                [__('COLUMN_COMMENT'), this.props.comment, COMMENT_COLUMN_CLASS],
            ],
        ];

        const { createContainer } = window.app;

        this.elem = createContainer(CONTAINER_CLASS, [
            createElement('header', { props: { textContent: __('IMPORT_ORIG_DATA') } }),
            createContainer(
                TABLE_CLASS,
                dataTable.map((group) => createContainer(
                    GROUP_CLASS,
                    group.map((col) => this.renderColumn(...col)),
                )),
            ),
        ]);
    }
}
