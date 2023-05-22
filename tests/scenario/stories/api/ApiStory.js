import { setBlock, TestStory } from 'jezve-test';
import { api } from '../../../model/api.js';
import * as ApiTests from '../../../actions/api/index.js';
import { App } from '../../../Application.js';
import { apiAccountsTests } from './accounts.js';
import { apiPersonsTests } from './persons.js';
import { apiCategoriesTests } from './categories.js';
import { apiTransactionsTests } from './transactions.js';
import { apiScheduleTests } from './schedule.js';
import { apiRemindersTests } from './reminders.js';
import { apiImportTemplateTests } from './template.js';
import { apiImportRulesTests } from './rules.js';
import { apiSecurityTests } from './security.js';
import { apiProfileTests } from './profile.js';
import { apiUserCurrenciesTests } from './userCurrencies.js';

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

        await apiUserCurrenciesTests.createTests();
        await apiAccountsTests.createTests();
        await apiPersonsTests.createTests();
        await apiCategoriesTests.createTests();
        await apiTransactionsTests.createTests();
        await apiScheduleTests.createTests();

        await apiRemindersTests.run();

        await apiSecurityTests.run();

        await apiUserCurrenciesTests.listTests();
        await apiAccountsTests.listTests();
        await apiPersonsTests.listTests();
        await apiCategoriesTests.listTests();

        await apiTransactionsTests.updateTests();
        await apiScheduleTests.updateTests();
        await apiImportTemplateTests.run();
        await apiImportRulesTests.run();
        await apiTransactionsTests.filterTests();
        await apiScheduleTests.listTests();

        await apiUserCurrenciesTests.updateAndDeleteTests();
        await apiAccountsTests.updateAndDeleteTests();
        await apiPersonsTests.updateAndDeleteTests();
        await apiCategoriesTests.updateAndDeleteTests();

        await apiTransactionsTests.deleteTests();
        await apiScheduleTests.deleteTests();

        await apiProfileTests.run();

        await api.user.login(App.config.testUser);
    }
}
