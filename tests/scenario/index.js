import { Runner, setBlock, isFullScenario } from 'jezve-test';

import { securityTests } from './security.js';
import { apiTests } from './api.js';
import { profileTests } from './profile.js';
import { accountTests } from './account.js';
import { personTests } from './person.js';
import { transactionTests } from './transaction.js';
import { importTests } from './import.js';

import * as ApiTests from '../run/api/index.js';
import * as ProfileTests from '../run/profile.js';
import * as StatisticsTests from '../run/statistics.js';

import { api } from '../model/api.js';
import { App } from '../Application.js';

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

        const ruleIds = App.state.rules.getIds();
        if (ruleIds.length) {
            await api.importrule.del(ruleIds);
        }

        const templateIds = App.state.templates.getIds();
        if (templateIds.length) {
            await api.importtemplate.del(templateIds);
        }

        await transactionTests.prepare();

        await importTests.run();
    }

    async runFullScenario() {
        setBlock('Running full test scenario', 1);

        await securityTests.run();
        await this.prepareTests();

        await apiTests.run();
        await App.goToMainView();
        await profileTests.run();
        await accountTests.run();
        await personTests.run();
        await transactionTests.run();

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
