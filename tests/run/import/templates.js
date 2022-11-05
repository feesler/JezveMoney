import { test } from 'jezve-test';
import { App } from '../../Application.js';
import { CREATE_TPL_STATE } from '../../view/component/Import/ImportUploadDialog.js';

/** Test selection of import template by id */
export const selectTemplateById = async (value) => {
    await test(`Select upload template [${value}]`, async () => {
        await App.view.selectUploadTemplateById(value);
        return App.view.checkState();
    });
};

/** Test selection of import template by index */
export const selectTemplateByIndex = async (value) => {
    await test(`Select upload template by index [${value}]`, async () => {
        await App.view.selectUploadTemplateByIndex(value);
        return App.view.checkState();
    });
};

/** Test input import template name on create/update state */
export const inputTemplateName = async (value) => {
    await test(`Input template name (${value})`, async () => {
        await App.view.inputTemplateName(value);
        return App.view.checkState();
    });
};

/** Select column of import template */
export const selectTemplateColumn = async ({ column, index }) => {
    await test(`Select template column [${column} => ${index}]`, async () => {
        await App.view.selectTemplateColumn(column, index);
        return App.view.checkState();
    });
};

/** Input import template first row */
export const inputTemplateFirstRow = async (value) => {
    await test(`Input template first row (${value})`, async () => {
        await App.view.inputTemplateFirstRow(value);
        return App.view.checkState();
    });
};

/** Click by decrease template first row button */
export const decreaseTemplateFirstRow = async () => {
    await test('Decrease template first row', async () => {
        await App.view.decreaseTemplateFirstRow();
        return App.view.checkState();
    });
};

/** Click by increase template first row button */
export const increaseTemplateFirstRow = async (value) => {
    await test('Increase template first row', async () => {
        await App.view.increaseTemplateFirstRow(value);
        return App.view.checkState();
    });
};

/** Click by template account checkbox */
export const toggleTemplateAccount = async () => {
    await test('Toggle enable template account', async () => {
        await App.view.toggleTemplateAccount();
        return App.view.checkState();
    });
};

/** Select template account */
export const selectTemplateAccountById = async (value) => {
    await test(`Select template account by id (${value})`, async () => {
        await App.view.selectTemplateAccountById(value);
        return App.view.checkState();
    });
};

/** Select template account */
export const selectTemplateAccountByIndex = async (index) => {
    await test(`Select upload template by index [${index}]`, async () => {
        await App.view.selectTemplateAccountByIndex(index);
        return App.view.checkState();
    });
};

/** Go to create import template state */
export const createTemplate = async () => {
    await test('Create template', async () => {
        await App.state.fetch();
        await App.view.createTemplate();
        return App.view.checkState();
    });
};

/** Update currently selected template */
export const updateTemplate = async () => {
    await test('Update template', async () => {
        await App.state.fetch();
        await App.view.updateTemplate();
        return App.view.checkState();
    });
};

/** Delete currently selected template */
export const deleteTemplate = async () => {
    await test('Delete template', async () => {
        // Prepare expected content
        await App.state.fetch();
        const expectedTpl = App.view.getExpectedTemplate();
        App.state.templates.deleteItems(expectedTpl.id);

        // Perform actions on view
        await App.view.deleteTemplate();
        await App.view.checkState();

        return App.state.fetchAndTest();
    });
};

/** Submit current template */
export const submitTemplate = async () => {
    await test('Submit template', async () => {
        // Prepare expected content
        await App.state.fetch();

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
        await App.view.cancelTemplate();
        return App.view.checkState();
    });
};
