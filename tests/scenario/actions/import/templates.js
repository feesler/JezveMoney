import { assert, test } from 'jezve-test';
import { App } from '../../../Application.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';
import { CREATE_TPL_STATE } from '../../../view/component/Import/ImportUploadDialog.js';

/** Test selection of import template by id */
export const selectTemplateById = async (value) => {
    await test(`Select upload template [${value}]`, () => (
        App.view.selectUploadTemplateById(value)
    ));
};

/** Test selection of import template by index */
export const selectTemplateByIndex = async (value) => {
    await test(`Select upload template by index [${value}]`, () => (
        App.view.selectUploadTemplateByIndex(value)
    ));
};

/** Test input import template name on create/update state */
export const inputTemplateName = async (value) => {
    await test(`Input template name (${value})`, () => (
        App.view.inputTemplateName(value)
    ));
};

/** Select column of import template */
export const selectTemplateColumn = async ({ column, index }) => {
    await test(`Select template column [${column} => ${index}]`, () => (
        App.view.selectTemplateColumn(column, index)
    ));
};

/** Select date format of import template */
export const selectTemplateDateFormat = async (locale) => {
    await test(`Select template date format '${locale}'`, () => (
        App.view.selectTemplateDateFormat(locale)
    ));
};

/** Input import template first row */
export const inputTemplateFirstRow = async (value) => {
    await test(`Input template first row (${value})`, () => (
        App.view.inputTemplateFirstRow(value)
    ));
};

/** Click by decrease template first row button */
export const decreaseTemplateFirstRow = async () => {
    await test('Decrease template first row', () => (
        App.view.decreaseTemplateFirstRow()
    ));
};

/** Click by increase template first row button */
export const increaseTemplateFirstRow = async (value) => {
    await test('Increase template first row', () => (
        App.view.increaseTemplateFirstRow(value)
    ));
};

/** Click by template account checkbox */
export const toggleTemplateAccount = async () => {
    await test('Toggle enable template account', () => (
        App.view.toggleTemplateAccount()
    ));
};

/** Select template account */
export const selectTemplateAccountById = async (value) => {
    await test(`Select template account by id (${value})`, () => (
        App.view.selectTemplateAccountById(value)
    ));
};

/** Select template account */
export const selectTemplateAccountByIndex = async (index) => {
    await test(`Select template account by index [${index}]`, () => (
        App.view.selectTemplateAccountByIndex(index)
    ));
};

/** Go to create import template state */
export const createTemplate = async () => {
    await test('Create template', () => App.view.createTemplate());
};

/** Update currently selected template */
export const updateTemplate = async () => {
    await test('Update template', () => App.view.updateTemplate());
};

/** Delete currently selected template */
export const deleteTemplate = async () => {
    await test('Delete template', async () => {
        // Prepare expected content
        const expectedTpl = App.view.getExpectedTemplate();
        App.state.templates.deleteItems(expectedTpl.id);

        // Perform actions on view
        await App.view.deleteTemplate();
        return App.state.fetchAndTest();
    });
};

/** Submit current template */
export const submitTemplate = async () => {
    await test('Submit template', async () => {
        // Prepare expected content
        const expectedTpl = App.view.getExpectedTemplate();
        const uploadState = App.view.getUploadState();
        if (uploadState === CREATE_TPL_STATE) {
            App.state.createTemplate(expectedTpl);
        } else {
            App.state.updateTemplate(expectedTpl);
        }

        await App.view.submitTemplate();
        // Check app state
        return App.state.fetchAndTest();
    });
};

/** Cancel create/update template */
export const cancelTemplate = async () => {
    await test('Cancel template', async () => {
        await App.state.fetch();
        return App.view.cancelTemplate();
    });
};

/** Creates template from specified props and submit */
export const addTemplate = async (props) => {
    assert.isObject(props);
    ImportTemplate.columns.forEach((column) => {
        assert(column in props, `Column '${column}' not found`);
    });
    assert(typeof props.name === 'string' && props.name.length > 0, 'Invalid name');

    await createTemplate();
    await App.scenario.runner.runGroup(selectTemplateColumn, [
        { column: 'accountAmount', index: props.accountAmount },
        { column: 'transactionAmount', index: props.transactionAmount },
        { column: 'accountCurrency', index: props.accountCurrency },
        { column: 'transactionCurrency', index: props.transactionCurrency },
        { column: 'date', index: props.date },
        { column: 'comment', index: props.comment },
    ]);
    await inputTemplateName(props.name);

    if (props.first_row) {
        assert.isInt(props.first_row, 'Invalid first row');
        assert(props.first_row > 0, 'Invalid first row');

        await inputTemplateFirstRow(2);
    }

    if (props.account_id) {
        await toggleTemplateAccount();
        await selectTemplateAccountById(props.account_id);
    }

    if (props.date_locale) {
        await selectTemplateColumn({ column: 'date', index: props.date });
        await selectTemplateDateFormat(props.date_locale);
    }

    await submitTemplate();
};
