import { setBlock } from 'jezve-test';
import * as ImportTests from '../../run/import/index.js';
import { App } from '../../Application.js';

// Create import template tests
const runCreateTests = async () => {
    setBlock('Create import template', 2);
    // Select columns for template
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 2 },
    ]);
    // Input template name and save
    await ImportTests.inputTemplateName('Template_1');
    await ImportTests.submitTemplate();

    // Create another template
    await ImportTests.createTemplate();
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 4 },
    ]);
    await ImportTests.inputTemplateName('Template_dup');
    await ImportTests.submitTemplate();
};

// Update import template tests
const runUpdateTests = async () => {
    setBlock('Update import template', 2);

    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.updateTemplate();
    await ImportTests.inputTemplateName('Template_2');
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'transactionAmount', index: 11 },
        { column: 'transactionCurrency', index: 10 },
    ]);
    await ImportTests.submitTemplate();
};

// Delete import template tests
const runDeleteTests = async () => {
    setBlock('Delete import template', 2);

    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.deleteTemplate();
};

// Automatic select valid template
const runAutoSelectTests = async (files) => {
    setBlock('Automatically select valid template on upload', 2);

    const [cardFile, accountFile] = files;

    await ImportTests.uploadFile(accountFile);

    await ImportTests.createTemplate();
    // Select columns for template
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 6 },
        { column: 'transactionAmount', index: 4 },
        { column: 'accountCurrency', index: 5 },
        { column: 'transactionCurrency', index: 3 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 2 },
    ]);
    // Input template name and save
    await ImportTests.inputTemplateName('Template_Account');
    await ImportTests.submitTemplate();

    // Upload card file and check 1st template is selected
    await ImportTests.uploadFile(cardFile);
    // Upload accounts again and check 2nd template is selected
    await ImportTests.uploadFile(accountFile);

    await ImportTests.closeUploadDialog();
};

export const importTemplateTests = {
    /** Run import template tests */
    async run({ files }) {
        setBlock('Import templates', 1);

        const [cardFile] = files;

        setBlock('Upload card CSV', 2);
        await ImportTests.uploadFile(cardFile);

        await runCreateTests();
        await runUpdateTests();
        await runDeleteTests();

        await runAutoSelectTests(files);
    },
};
