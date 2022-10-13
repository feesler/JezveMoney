import { copyObject, setBlock } from 'jezve-test';
import { api } from '../../model/api.js';
import * as ApiTests from '../../run/api/index.js';
import { App } from '../../Application.js';
import { apiAccountsTests } from './accounts.js';
import { apiPersonsTests } from './persons.js';
import { apiTransactionsTests } from './transactions.js';
import { apiImportTemplateTests } from './template.js';
import { apiImportRulesTests } from './rules.js';
import { apiSecurityTests } from './security.js';
import { apiProfileTests } from './profile.js';

// Register and login main test user
const createTestUser = async () => {
    await ApiTests.registerAndLogin(App.config.testUser);
    // Set 'Tester' access level for test user
    const testUserId = App.state.profile.user_id;
    await ApiTests.loginTest(App.config.testAdminUser);
    const testUserData = copyObject(App.config.testUser);
    testUserData.id = testUserId;
    testUserData.access = 2;
    await api.user.update(testUserData);
    await ApiTests.loginTest(App.config.testUser);
    await App.setupUser();
};

export const apiTests = {
    /** Run API tests */
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

        await createTestUser();

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
    },
};
