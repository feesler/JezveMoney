import { setBlock } from 'jezve-test';
import { TestStory } from '../../TestStory.js';
import { api } from '../../../model/api.js';
import * as ApiTests from '../../../run/api/index.js';
import { App } from '../../../Application.js';
import { apiAccountsTests } from './accounts.js';
import { apiPersonsTests } from './persons.js';
import { apiTransactionsTests } from './transactions.js';
import { apiImportTemplateTests } from './template.js';
import { apiImportRulesTests } from './rules.js';
import { apiSecurityTests } from './security.js';
import { apiProfileTests } from './profile.js';

export class ApiStory extends TestStory {
    async beforeRun() {
        await App.scenario.removeUsers();
    }

    async run() {
        setBlock('API tests', 1);
        setBlock('User', 2);

        // Register API test user and prepare data for security tests
        await ApiTests.registerAndLogin(App.config.apiTestUser);
        await App.setupUser();
        App.scenario.setupCurrencies();

        await apiSecurityTests.prepare();

        await ApiTests.loginTest({ login: '', password: App.config.testUser.password });
        await ApiTests.loginTest({ login: App.config.testUser.login, password: '' });

        await App.scenario.createTestUser();
        await App.scenario.loginTestUser();

        await ApiTests.resetData({});

        await apiAccountsTests.createTests();
        await apiPersonsTests.createTests();
        await apiTransactionsTests.createTests();

        await apiSecurityTests.run();

        await apiTransactionsTests.updateTests();
        await apiImportTemplateTests.run();
        await apiImportRulesTests.run();
        await apiTransactionsTests.filterTests();

        await apiAccountsTests.updateAndDeleteTests();
        await apiPersonsTests.updateAndDeleteTests();

        await apiTransactionsTests.deleteTests();

        await apiProfileTests.run();

        await api.user.login(App.config.testUser);
    }
}
