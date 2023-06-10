import {
    Runner,
    assert,
    setBlock,
    getSelectedStory,
} from 'jezve-test';
import { api } from '../model/api.js';
import { App } from '../Application.js';

import { createUserCurrencies } from './data/userCurrencies.js';
import { createAccounts } from './data/accounts.js';
import { createPersons } from './data/persons.js';
import { createCategories } from './data/categories.js';
import { createTransactions } from './data/transactions.js';
import { createScheduledTransactions } from './data/schedule.js';
import {
    getAccountCSV,
    getCardCSV,
    getEnLocaleCSV,
    getLargeCSV,
} from './data/importfiles.js';
import { createImportRules } from './data/rules.js';
import { createImportTemplates } from './data/templates.js';

import * as ApiTests from './actions/api/index.js';
import * as ProfileTests from './actions/profile.js';
import { putFile, removeFile } from './actions/import/index.js';

import { UnitTestsStory } from './stories/UnitTestsStory.js';
import { SecurityStory } from './stories/SecurityStory.js';
import { ApiStory } from './stories/api/ApiStory.js';
import { ProfileStory } from './stories/ProfileStory.js';
import { SettingsStory } from './stories/SettingsStory.js';
import { MainStory } from './stories/MainStory.js';
import { AccountsStory } from './stories/AccountsStory.js';
import { PersonsStory } from './stories/PersonsStory.js';
import { CategoriesStory } from './stories/CategoriesStory.js';
import { TransactionsStory } from './stories/transaction/TransactionsStory.js';
import { ImportStory } from './stories/import/ImportStory.js';
import { TransactionListStory } from './stories/TransactionListStory.js';
import { ScheduleStory } from './stories/ScheduleStory.js';
import { RemindersStory } from './stories/RemindersStory.js';
import { StatisticsStory } from './stories/StatisticsStory.js';
import { ImportListStory } from './stories/import/ImportListStory.js';
import { ImportTemplateStory } from './stories/import/ImportTemplateStory.js';
import { ImportRulesStory } from './stories/import/ImportRulesStory.js';
import { LocalesStory } from './stories/LocalesStory.js';

const storiesMap = {
    unitTests: UnitTestsStory,
    security: SecurityStory,
    api: ApiStory,
    locales: LocalesStory,
    profile: ProfileStory,
    settings: SettingsStory,
    main: MainStory,
    accounts: AccountsStory,
    persons: PersonsStory,
    categories: CategoriesStory,
    transactions: TransactionsStory,
    transactionList: TransactionListStory,
    schedule: ScheduleStory,
    reminders: RemindersStory,
    import: ImportStory,
    importTemplates: ImportTemplateStory,
    importRules: ImportRulesStory,
    importList: ImportListStory,
    statistics: StatisticsStory,
};

export class Scenario {
    constructor(environment) {
        this.environment = environment;
    }

    static async create(environment) {
        const instance = new this(environment);
        await instance.init();

        return instance;
    }

    async init() {
        // Setup test runner
        this.runner = new Runner();
    }

    assignKeys(keys, values) {
        assert.isArray(keys, 'Invalid keys');
        assert.isArray(values, 'Invalid values');
        assert(keys.length === values.length, 'Invalid count of values');

        keys.forEach((key, index) => {
            assert(values[index], `Invalid value for '${key}'`);
            this[key] = values[index];
        });
    }

    setupCurrencies() {
        const data = ['RUB', 'USD', 'EUR', 'PLN', 'KRW', 'CNY', 'JPY', 'SEK', 'BTC'];
        const values = App.currency.getItemsByCodes(data);
        this.assignKeys(data, values);
    }

    async run() {
        const story = getSelectedStory();
        if (story) {
            if (!this.checkSelectedStory(story)) {
                return;
            }

            setBlock(`Running '${story}' test story`, 1);
            await this.runStory(story);
        } else {
            await this.runFullScenario();
        }

        await this.finishTests();
    }

    /* eslint-disable no-console */
    checkSelectedStory(story) {
        if (typeof story !== 'string') {
            return false;
        }
        if (story in storiesMap) {
            return true;
        }

        console.log(`Invalid story name: ${story}`);
        console.log('Available test stories:');
        const storyNames = this.getStorieNames();
        storyNames.forEach((name) => console.log(`  ${name}`));

        return false;
    }
    /* eslint-enable no-console */

    getStory(name) {
        assert(name in storiesMap, `Invalid story name: ${name}`);

        return storiesMap[name];
    }

    getStorieNames() {
        return Object.keys(storiesMap);
    }

    async runStory(name) {
        const story = this.getStory(name);
        await story.run();
    }

    async runFullScenario() {
        setBlock('Running full test scenario', 1);

        const stories = this.getStorieNames();
        for (const story of stories) {
            if (story === 'import') {
                continue;
            }

            await this.runStory(story);
        }
    }

    /** Creates multiple items using API request and save result ids as fields of instance */
    async createMultiple(controller, data) {
        const isAPI = (typeof controller === 'string');
        const action = (isAPI) ? api[controller] : controller;
        assert.isFunction(action?.createMultiple, 'Invalid action');

        const request = Object.values(data);
        const keys = Object.keys(data);

        const createRes = await action.createMultiple(request);
        const values = (isAPI) ? createRes?.ids : createRes;
        this.assignKeys(keys, values);
    }

    /** Creates multiple items using action and save result ids as fields of instance */
    async createOneByOne(action, data) {
        const request = Object.values(data);
        const keys = Object.keys(data);

        const createRes = await this.runner.runGroup(action, request);
        this.assignKeys(keys, createRes);
    }

    /** Register test user and set 'Tester' access */
    async createTestUser() {
        await ApiTests.registerAndLogin(App.config.testUser);

        const testUserId = App.state.profile.user_id;
        await ApiTests.loginTest(App.config.testAdminUser);

        const testUserData = {
            ...App.config.testUser,
            id: testUserId,
            access: 2,
        };
        await api.user.update(testUserData);
    }

    /** Login test user */
    async loginTestUser() {
        await ApiTests.loginTest(App.config.testUser);
        await App.setupUser();
        this.setupCurrencies();
        await App.goToMainView();
        await ProfileTests.relogin(App.config.testUser);
    }

    /** Creates test user if not exist and login */
    async prepareTestUser() {
        await ApiTests.loginTest(App.config.testAdminUser);

        const users = await api.user.list();
        const user = users.find((item) => item.login === App.config.testUser.login);
        if (!user) {
            await this.createTestUser();
        }

        await this.loginTestUser();
    }

    /** Remove all possible test users */
    async removeUsers() {
        await ApiTests.loginTest(App.config.testAdminUser);

        await ApiTests.deleteUserIfExist(App.config.testUser);
        await ApiTests.deleteUserIfExist(App.config.apiTestUser);
        await ApiTests.deleteUserIfExist(App.config.newUser);
    }

    /** Reset specified data of user */
    async resetData(options) {
        await api.profile.resetData(options);
        await App.state.fetch();
    }

    /** Creates common test user currencies */
    async createUserCurrencies() {
        await createUserCurrencies();
    }

    /** Creates common test accounts */
    async createAccounts() {
        await createAccounts();
    }

    /** Creates common test persons */
    async createPersons() {
        await createPersons();
    }

    /** Creates common test persons */
    async createCategories() {
        await createCategories();
    }

    /** Creates common test transactions */
    async createTransactions() {
        await createTransactions();
    }

    /** Creates common test scheduled transactions */
    async createScheduledTransactions() {
        await createScheduledTransactions();
    }

    /** Creates import templates */
    async createImportTemplates() {
        await createImportTemplates();
    }

    /** Creates import rules */
    async createImportRules() {
        await createImportRules();
    }

    /** Creates all common test data */
    async createTestData() {
        await createUserCurrencies();
        await createAccounts();
        await createPersons();
        await createCategories();
        await createTransactions();
        await createScheduledTransactions();
    }

    /** Upload CSV files to server */
    async createCsvFiles() {
        await ApiTests.loginTest(App.config.testAdminUser);

        this.cardFile = await putFile(getCardCSV());
        this.accountFile = await putFile(getAccountCSV());
        this.largeFile = await putFile(getLargeCSV());
        this.enLocaleFile = await putFile(getEnLocaleCSV());

        await ApiTests.loginTest(App.config.testUser);
    }

    /** Remove previously uploaded CSV files */
    async removeCsvFiles() {
        await ApiTests.loginTest(App.config.testAdminUser);

        await removeFile(this.cardFile?.filename);
        this.cardFile = null;
        await removeFile(this.accountFile?.filename);
        this.accountFile = null;
        await removeFile(this.largeFile?.filename);
        this.largeFile = null;
        await removeFile(this.enLocaleFile?.filename);
        this.enLocaleFile = null;

        await ApiTests.loginTest(App.config.testUser);
    }

    async finishTests() {
        await ApiTests.loginTest(App.config.testAdminUser);
        await App.setupUser();
    }
}
