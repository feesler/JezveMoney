import { test } from 'jezve-test';
import { App } from '../../app.js';
import { ImportView } from '../../view/import.js';
import { CREATE_TPL_STATE } from '../../view/component/importuploaddialog.js';

/** Test selection of import template by id */
export async function selectTemplateById(value) {
    await test(`Select upload template [${value}]`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.selectUploadTemplateById(value);
        return App.view.checkState();
    });
}

/** Test selection of import template by index */
export async function selectTemplateByIndex(value) {
    await test(`Select upload template by index [${value}]`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.selectUploadTemplateByIndex(value);
        return App.view.checkState();
    });
}

/** Test input import template name on create/update state */
export async function inputTemplateName(value) {
    await test(`Input template name (${value})`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.inputTemplateName(value);
        return App.view.checkState();
    });
}

/** Select column of import template */
export async function selectTemplateColumn({ column, index }) {
    await test(`Select template column [${column} => ${index}]`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.selectTemplateColumn(column, index);
        return App.view.checkState();
    });
}

/** Go to create import template state */
export async function createTemplate() {
    await test('Create template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.createTemplate();
        return App.view.checkState();
    });
}

/** Update currently selected template */
export async function updateTemplate() {
    await test('Update template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.updateTemplate();
        return App.view.checkState();
    });
}

/** Delete currently selected template */
export async function deleteTemplate() {
    await test('Delete template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }
        // Prepare expected content
        await App.state.fetch();
        const expectedTpl = App.view.getExpectedTemplate();
        App.state.templates.deleteItems(expectedTpl.id);

        // Perform actions on view
        await App.view.deleteTemplate();
        await App.view.checkState();

        return App.state.fetchAndTest();
    });
}

/** Submit current template */
export async function submitTemplate() {
    await test('Submit template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

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
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
}

/** Cancel create/update template */
export async function cancelTemplate() {
    await test('Cancel template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.cancelTemplate();
        return App.view.checkState();
    });
}
