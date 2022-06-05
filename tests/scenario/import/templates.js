import * as ImportTests from '../../run/import/index.js';
import { setBlock } from '../../env.js';

let scenario = null;

// Create import template tests
async function runCreateTests() {
    setBlock('Create import template', 2);
    // Select columns for template
    await scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
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
    await scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 4 },
    ]);
    await ImportTests.inputTemplateName('Template_dup');
    await ImportTests.submitTemplate();
}

// Update import template tests
async function runUpdateTests() {
    setBlock('Update import template', 2);

    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.updateTemplate();
    await ImportTests.inputTemplateName('Template_2');
    await scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'transactionAmount', index: 11 },
        { column: 'transactionCurrency', index: 10 },
    ]);
    await ImportTests.submitTemplate();
}

// Delete import template tests
async function runDeleteTests() {
    setBlock('Delete import template', 2);

    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.deleteTemplate();
}

export const importTemplateTests = {
    /** Initialize tests */
    init(scenarioInstance) {
        scenario = scenarioInstance;
    },

    /** Run import template tests */
    async run() {
        await runCreateTests();
        await runUpdateTests();
        await runDeleteTests();
    },

    /** Initialize and run tests */
    async initAndRun(scenarioInstance) {
        this.init(scenarioInstance);
        await this.run();
    },
};
