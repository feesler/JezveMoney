import { Runner, setBlock, isFullScenario } from 'jezve-test';

import { securityTests } from './security.js';
import { apiTests } from './api.js';
import { profileTests } from './profile.js';
import { accountTests } from './account.js';
import { personTests } from './person.js';
import { transactionTests } from './transaction.js';
import { importTests } from './import/index.js';

import * as ApiTests from '../run/api/index.js';
import * as ProfileTests from '../run/profile.js';
import * as StatisticsTests from '../run/statistics.js';

import { App } from '../Application.js';
import { transactionsListTests } from './transactionList.js';
import { commonTests } from './common.js';

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
        const fullTest = isFullScenario();
        if (fullTest) {
            await this.runFullScenario();
        } else {
            await this.runTestScenario();
        }
    }

    async runTestScenario() {
        setBlock('Running partial test scenario', 1);

        await ApiTests.loginTest(App.config.testUser);
        await App.setupUser();
        this.setupCurrencies();
        await App.goToMainView();
        await ProfileTests.relogin(App.config.testUser);

        await App.state.fetch();

        await importTests.run();
    }

    async runFullScenario() {
        setBlock('Running full test scenario', 1);

        await commonTests.run();

        await securityTests.run();
        await this.prepareTests();

        await apiTests.run();
        await App.goToMainView();
        await profileTests.run();
        await accountTests.run();
        await personTests.run();
        await transactionTests.run();
        await transactionsListTests.run();
        await importTests.run();

        await accountTests.runPostTransaction();
        await personTests.runPostTransaction();
        await StatisticsTests.run();
        await profileTests.runPostTransaction();

        await transactionTests.runAvailabilityTests();
        await importTests.runNoPersonsTest();
        await importTests.runNoAccountsTest();

        await this.finishTests();
    }

    async prepareTests() {
        await ApiTests.loginTest(App.config.testAdminUser);
        // Remove possible users
        await ApiTests.deleteUserIfExist(App.config.testUser);
        await ApiTests.deleteUserIfExist(App.config.apiTestUser);
        await ApiTests.deleteUserIfExist(App.config.newUser);
    }

    async finishTests() {
        await ApiTests.loginTest(App.config.testAdminUser);
        await App.setupUser();
    }
}
