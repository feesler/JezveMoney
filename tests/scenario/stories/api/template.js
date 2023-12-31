import { assert } from '@jezvejs/assert';
import { setBlock } from 'jezve-test';

import { App } from '../../../Application.js';
import { IMPORT_DATE_LOCALE } from '../../../model/ImportTemplate.js';
import * as Actions from '../../actions/api/importtemplate.js';

const create = async () => {
    setBlock('Create import template', 2);

    const data = {
        TEMPLATE_1: {
            name: 'Template 1',
            type_id: 0,
            first_row: 2,
            date_locale: IMPORT_DATE_LOCALE,
            account_id: App.scenario.CASH_RUB,
            account_amount_col: 1,
            account_curr_col: 2,
            trans_amount_col: 3,
            trans_curr_col: 4,
            date_col: 5,
            comment_col: 6,
        },
        TEMPLATE_2: {
            name: 'Template 2',
            type_id: 1,
            first_row: 2,
            date_locale: IMPORT_DATE_LOCALE,
            account_id: App.scenario.ACC_RUB,
            account_amount_col: 1,
            account_curr_col: 2,
            trans_amount_col: 1,
            trans_curr_col: 2,
            date_col: 5,
            comment_col: 5,
        },
        TEMPLATE_3: {
            name: 'Template 3',
            type_id: 0,
            first_row: 3,
            account_id: 0,
            date_locale: IMPORT_DATE_LOCALE,
            account_amount_col: 10,
            account_curr_col: 20,
            trans_amount_col: 30,
            trans_curr_col: 40,
            date_col: 50,
            comment_col: 60,
        },
    };

    await App.scenario.createOneByOne(Actions.create, data);
};

const createWithChainedRequest = async () => {
    setBlock('Create import template with chained request', 2);

    const data = {
        TEMPLATE_CHAINED: {
            name: 'Template chained',
            type_id: 0,
            first_row: 2,
            date_locale: 'en',
            account_id: App.scenario.CASH_RUB,
            account_amount_col: 10,
            account_curr_col: 20,
            trans_amount_col: 30,
            trans_curr_col: 40,
            date_col: 50,
            comment_col: 60,
            returnState: {
                importtemplates: {},
            },
        },
    };

    await App.scenario.createOneByOne(Actions.create, data);
};

const createInvalid = async () => {
    setBlock('Create import template with invalid data', 2);

    const data = [{
        // Invalid templates
        name: 'Invalid template',
    }, {
        name: null,
    }, {
        name: 'Invalid template',
        account_id: 'null',
    }, {
        name: 'Invalid template',
        account_id: App.scenario.API_USER_ACC_RUB,
    }, {
        account_amount_col: 1,
        account_curr_col: 2,
        trans_amount_col: 3,
        trans_curr_col: 4,
        date_col: 5,
        comment_col: 6,
    }, {
        name: 'Invalid template',
        account_amount_col: 0,
        account_curr_col: 2,
        trans_amount_col: 3,
        trans_curr_col: 4,
        date_col: 5,
        comment_col: 6,
    }];

    await App.scenario.runner.runGroup(async (item) => {
        const res = await Actions.create(item);
        assert(!res, 'Created import template using invalid data');
    }, data);
};

const createMultiple = async () => {
    setBlock('Create multiple import templates', 2);

    const data = {
        TEMPLATE_10: {
            name: 'Template 10',
            type_id: 0,
            first_row: 2,
            date_locale: IMPORT_DATE_LOCALE,
            account_id: App.scenario.CASH_RUB,
            account_amount_col: 1,
            account_curr_col: 2,
            trans_amount_col: 3,
            trans_curr_col: 4,
            date_col: 5,
            comment_col: 6,
        },
        TEMPLATE_11: {
            name: 'Template 11',
            type_id: 1,
            first_row: 2,
            date_locale: IMPORT_DATE_LOCALE,
            account_id: 0,
            account_amount_col: 7,
            account_curr_col: 6,
            trans_amount_col: 5,
            trans_curr_col: 4,
            date_col: 3,
            comment_col: 2,
        },
        TEMPLATE_12: {
            name: 'Template 12',
            type_id: 1,
            first_row: 2,
            date_locale: 'en',
            account_id: App.scenario.ACCOUNT_1,
            account_amount_col: 1,
            account_curr_col: 2,
            trans_amount_col: 1,
            trans_curr_col: 2,
            date_col: 5,
            comment_col: 6,
        },
    };

    await App.scenario.createMultiple(Actions, data);
};

const createMultipleWithChainedRequest = async () => {
    setBlock('Create multiple import templates with chained request', 2);

    const data = {
        data: {
            TEMPLATE_MULTI_CHAINED_1: {
                name: 'Template multi chained 1',
                type_id: 0,
                first_row: 2,
                date_locale: IMPORT_DATE_LOCALE,
                account_id: App.scenario.CASH_RUB,
                account_amount_col: 2,
                account_curr_col: 3,
                trans_amount_col: 4,
                trans_curr_col: 5,
                date_col: 6,
                comment_col: 7,
            },
            TEMPLATE_MULTI_CHAINED_2: {
                name: 'Template multi chained 2',
                type_id: 1,
                first_row: 3,
                date_locale: IMPORT_DATE_LOCALE,
                account_id: 0,
                account_amount_col: 7,
                account_curr_col: 6,
                trans_amount_col: 5,
                trans_curr_col: 4,
                date_col: 3,
                comment_col: 2,
            },
        },
        returnState: {
            importtemplates: {},
        },
    };

    await App.scenario.createMultiple(Actions, data);
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple import templates with invalid data', 2);

    const data = [
        null,
        {},
        { data: null },
        { data: [null] },
        { data: [null, null] },
        {
            data: [{
                // Invalid templates
                name: 'Invalid template',
            }, {
                name: null,
            }, {
                name: 'Invalid template',
                account_id: 'null',
            }, {
                name: 'Invalid template',
                account_id: App.scenario.API_USER_ACC_RUB,
            }],
        },
        {
            data: [{
                name: 'Template 12',
                type_id: 1,
                account_amount_col: 7,
                account_curr_col: 6,
                trans_amount_col: 5,
                trans_curr_col: 4,
                date_col: 3,
                comment_col: 2,
            }, null],
        },
    ];

    await App.scenario.runner.runGroup(async (item) => {
        const res = await Actions.create(item);
        assert(!res, 'Created multiple import templates using invalid data');
    }, data);
};

const update = async () => {
    setBlock('Update import template', 2);

    const data = [{
        id: App.scenario.TEMPLATE_1,
        name: 'TPL',
        type_id: 1,
        account_id: App.scenario.ACC_RUB,
        comment_col: 8,
    }];

    await App.scenario.runner.runGroup(async (item) => {
        const res = await Actions.update(item);
        assert(res, 'Failed to update import template');
    }, data);
};

const updateWithChainedRequest = async () => {
    setBlock('Update import template with chained request', 2);

    const data = [{
        id: App.scenario.TEMPLATE_CHAINED,
        name: 'Chained',
        account_amount_col: 5,
        returnState: {
            importtemplates: {},
            accounts: { visibility: 'all' },
        },
    }];

    await App.scenario.runner.runGroup(async (item) => {
        const res = await Actions.update(item);
        assert(res, 'Failed to update import template');
    }, data);
};

const updateInvalid = async () => {
    setBlock('Update import template with invalid data', 2);

    const data = [{
        // Invalid templates
        id: App.scenario.TEMPLATE_2,
        name: null,
    }, {
        id: App.scenario.TEMPLATE_2,
        account_amount_col: 0,
    }, {
        id: App.scenario.TEMPLATE_2,
        account_id: 'null',
    }, {
        name: 'Invalid template',
        account_id: App.scenario.API_USER_ACC_RUB,
    }];

    await App.scenario.runner.runGroup(async (item) => {
        const res = await Actions.update(item);
        assert(!res, 'Updated import template using invalid data');
    }, data);
};

const del = async () => {
    setBlock('Delete import template', 2);

    const data = [
        { id: App.scenario.TEMPLATE_3 },
        { id: [App.scenario.TEMPLATE_1, App.scenario.TEMPLATE_2] },
    ];

    await App.scenario.runner.runGroup(Actions.del, data);
};

const delWithChainedRequest = async () => {
    setBlock('Delete import template with chained request', 2);

    const data = [
        {
            id: App.scenario.TEMPLATE_3,
            returnState: {
                importtemplates: {},
                importrules: {},
            },
        },
    ];

    await App.scenario.runner.runGroup(Actions.del, data);
};

export const apiImportTemplateTests = {
    async run() {
        setBlock('Import template', 1);

        await create();
        await createWithChainedRequest();
        await createInvalid();
        await createMultiple();
        await createMultipleWithChainedRequest();
        await createMultipleInvalid();
        await update();
        await updateWithChainedRequest();
        await updateInvalid();
        await del();
        await delWithChainedRequest();
    },
};
