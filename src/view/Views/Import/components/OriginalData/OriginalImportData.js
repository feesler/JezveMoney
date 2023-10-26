import { Component } from 'jezvejs';
import { createElement, getClassName } from '@jezvejs/dom';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
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
        const template = App.model.templates.getItem(this.props.template);
        const templateName = (template) ? template.name : '';
        const dateString = App.formatDate(
            new Date(this.props.date),
            { locales: template?.date_locale },
        );

        const dataTable = [
            [
                [__('import.mainAccount'), this.props.origAccount.name],
                [__('import.templates.title'), templateName],
            ],
            [
                [__('import.templates.columns.transactionAmount'), this.props.transactionAmount],
                [__('import.templates.columns.transactionCurrency'), this.props.transactionCurrency],
            ],
            [
                [__('import.templates.columns.accountAmount'), this.props.accountAmount],
                [__('import.templates.columns.accountCurrency'), this.props.accountCurrency],
            ],
            [
                [__('import.templates.columns.date'), dateString],
            ],
            [
                [__('import.templates.columns.comment'), this.props.comment, COMMENT_COLUMN_CLASS],
            ],
        ];

        const { createContainer } = App;

        this.elem = createContainer(CONTAINER_CLASS, [
            createElement('header', { props: { textContent: __('import.originalData') } }),
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
