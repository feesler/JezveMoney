import { createElement } from 'jezvejs';
import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    title: 'List transactions',
    onSubmit: null,
};

export class TransactionsListForm extends ApiRequestForm {
    static userProps = {
        elem: ['id'],
    };

    constructor(props) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        const fields = [
            { title: 'Order (asc, desc)', name: 'order' },
            { title: 'Types', name: 'type' },
            { title: 'Items on page', name: 'onPage' },
            { title: 'Page number', name: 'page' },
            { title: 'Pages range', name: 'range' },
            { title: 'Account ids', name: 'accounts' },
            { title: 'Person ids', name: 'persons' },
            { title: 'Category ids', name: 'categories' },
            { title: 'Min. amount', name: 'minAmount' },
            { title: 'Max. amount', name: 'maxAmount' },
            { title: 'Start date', name: 'startDate' },
            { title: 'End date', name: 'endDate' },
            { title: 'Search request', name: 'search' },
        ];

        this.form = createElement('form', {
            props: {
                action: `${App.baseURL}api/transaction/list`,
                method: 'get',
            },
            events: { submit: (e) => this.props?.onSubmit?.(e) },
            children: [
                ...this.mapOptionalFields(fields),
                this.createFormControls(),
            ],
        });

        this.elem = this.createFormContainer([
            this.createFormTitle(),
            this.form,
        ]);
    }
}
