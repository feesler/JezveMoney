import { setBlock } from 'jezve-test';
import { App } from '../../Application.js';
import * as ImportTemplateApiTests from '../../run/api/importtemplate.js';

const create = async () => {
    setBlock('Create import template', 2);

    const data = [{
        name: 'Template 1',
        type: 0,
        account_amount_col: 1,
        account_curr_col: 2,
        trans_amount_col: 3,
        trans_curr_col: 4,
        date_col: 5,
        comment_col: 6,
    }, {
        name: 'Template 2',
        type: 1,
        account_amount_col: 1,
        account_curr_col: 2,
        trans_amount_col: 1,
        trans_curr_col: 2,
        date_col: 5,
        comment_col: 5,
    }, {
        name: 'Template 3',
        type: 0,
        account_amount_col: 10,
        account_curr_col: 20,
        trans_amount_col: 30,
        trans_curr_col: 40,
        date_col: 50,
        comment_col: 60,
    }, {
        // Invalid templates
        name: 'Invalid template',
    }, {
        name: null,
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

    [
        App.scenario.TEMPLATE_1,
        App.scenario.TEMPLATE_2,
        App.scenario.TEMPLATE_3,
    ] = await App.scenario.runner.runGroup(ImportTemplateApiTests.create, data);
};

const createMultiple = async () => {
    setBlock('Create multiple', 3);

    const data = [{
        name: 'Template 10',
        type: 0,
        account_amount_col: 1,
        account_curr_col: 2,
        trans_amount_col: 3,
        trans_curr_col: 4,
        date_col: 5,
        comment_col: 6,
    }, {
        name: 'Template 11',
        type: 1,
        account_amount_col: 7,
        account_curr_col: 6,
        trans_amount_col: 5,
        trans_curr_col: 4,
        date_col: 3,
        comment_col: 2,
    }];

    await ImportTemplateApiTests.createMultiple(data);

    const invData = [
        null,
        [null],
        [null, null],
        [{
            // Invalid templates
            name: 'Invalid template',
        }, {
            name: null,
        }],
        [{
            name: 'Template 12',
            type: 1,
            account_amount_col: 7,
            account_curr_col: 6,
            trans_amount_col: 5,
            trans_curr_col: 4,
            date_col: 3,
            comment_col: 2,
        }, null],
    ];
    await App.scenario.runner.runGroup(ImportTemplateApiTests.createMultiple, invData);
};

const update = async () => {
    setBlock('Update import template', 2);

    const data = [{
        id: App.scenario.TEMPLATE_1,
        name: 'TPL',
        type: 1,
        comment_col: 8,
    }, {
        id: App.scenario.TEMPLATE_2,
        name: null,
    }, {
        id: App.scenario.TEMPLATE_2,
        account_amount_col: 0,
    }];

    await App.scenario.runner.runGroup(ImportTemplateApiTests.update, data);
};

const del = async () => {
    setBlock('Delete import template', 2);

    const data = [
        [App.scenario.TEMPLATE_3],
        [App.scenario.TEMPLATE_1, App.scenario.TEMPLATE_2],
    ];

    await App.scenario.runner.runGroup(ImportTemplateApiTests.del, data);
};

export const apiImportTemplateTests = {
    async run() {
        setBlock('Import template', 2);

        await create();
        await createMultiple();
        await update();
        await del();
    },
};
