import {
    Runner,
    assert,
    setBlock,
    getSelectedStory,
} from 'jezve-test';
import { api } from '../model/api.js';
import { App } from '../Application.js';
import * as ApiTests from '../run/api/index.js';
import * as ProfileTests from '../run/profile.js';
import { UnitTestsStory } from './stories/UnitTestsStory.js';
import { SecurityStory } from './stories/SecurityStory.js';
import { ApiStory } from './stories/api/ApiStory.js';
import { ProfileStory } from './stories/ProfileStory.js';
import { AccountsStory } from './stories/AccountsStory.js';
import { PersonsStory } from './stories/PersonsStory.js';
import { TransactionsStory } from './stories/transaction/TransactionsStory.js';
import { ImportStory } from './stories/import/ImportStory.js';
import { TransactionListStory } from './stories/TransactionListStory.js';
import { StatisticsStory } from './stories/StatisticsStory.js';
import { createAccounts } from './data/accounts.js';
import { createPersons } from './data/persons.js';
import { createTransactions } from './data/transactions.js';
import { getAccountCSV, getCardCSV } from './data/importfiles.js';
import { putFile, removeFile } from '../run/import/index.js';

const storiesMap = {
    unitTests: UnitTestsStory,
    security: SecurityStory,
    api: ApiStory,
    profile: ProfileStory,
    accounts: AccountsStory,
    persons: PersonsStory,
    transactions: TransactionsStory,
    transactionList: TransactionListStory,
    import: ImportStory,
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

    setupCurrencies() {
        [
            this.RUB,
            this.USD,
            this.EUR,
            this.PLN,
            this.KRW,
        ] = App.currency.getItemsByNames(['RUB', 'USD', 'EUR', 'PLN', 'KRW']);
    }

    async run() {
        const story = getSelectedStory();
        if (story) {
            setBlock(`Running '${story}' test story`, 1);
            await this.runStory(story);
        } else {
            await this.runFullScenario();
        }

        await this.finishTests();
    }

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
            await this.runStory(story);
        }
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

    /** Creates common test accounts */
    async createAccounts() {
        await createAccounts();
    }

    /** Creates common test persons */
    async createPersons() {
        await createPersons();
    }

    /** Creates common test transactions */
    async createTransactions() {
        await createTransactions();
    }

    /** Creates all common test data */
    async createTestData() {
        await createAccounts();
        await createPersons();
        await createTransactions();
    }

    /** Upload CSV files to server */
    async createCsvFiles() {
        await ApiTests.loginTest(App.config.testAdminUser);

        this.cardFile = await putFile(getCardCSV());
        this.accountFile = await putFile(getAccountCSV());

        await ApiTests.loginTest(App.config.testUser);
    }

    /** Remove previously uploaded CSV files */
    async removeCsvFiles() {
        await ApiTests.loginTest(App.config.testAdminUser);

        await removeFile(this.cardFile?.filename);
        this.cardFile = null;
        await removeFile(this.accountFile?.filename);
        this.accountFile = null;

        await ApiTests.loginTest(App.config.testUser);
    }

    async finishTests() {
        await ApiTests.loginTest(App.config.testAdminUser);
        await App.setupUser();
    }
}
