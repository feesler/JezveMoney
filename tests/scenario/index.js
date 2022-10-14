import {
    Runner,
    setBlock,
    isFullScenario,
    copyObject,
} from 'jezve-test';
import { api } from '../model/api.js';

import { securityTests } from './security.js';
import { apiTests } from './api/index.js';
import { profileTests } from './profile.js';
import { accountTests } from './account.js';
import { personTests } from './person.js';
import { transactionTests } from './transaction/index.js';
import { importTests } from './import/index.js';

import * as ApiTests from '../run/api/index.js';
import * as ProfileTests from '../run/profile.js';
import * as StatisticsTests from '../run/statistics.js';

import { App } from '../Application.js';
import { transactionsListTests } from './transactionList.js';
import { unitTests } from './unit.js';
import { ACCOUNT_HIDDEN } from '../model/AccountsList.js';
import { PERSON_HIDDEN } from '../model/PersonsList.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
} from '../model/Transaction.js';

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

        await StatisticsTests.run();
    }

    async runFullScenario() {
        setBlock('Running full test scenario', 1);

        await unitTests.run();

        await securityTests.run();

        await apiTests.run();
        await App.goToMainView();

        await profileTests.run();
        await accountTests.run();
        await personTests.run();
        await transactionTests.run();
        await transactionsListTests.run();
        await importTests.run();
        await StatisticsTests.run();

        await transactionTests.runAvailabilityTests();
        await importTests.runNoPersonsTest();
        await importTests.runNoAccountsTest();

        await this.finishTests();
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

    async removeUsers() {
        await ApiTests.loginTest(App.config.testAdminUser);
        // Remove possible users
        await ApiTests.deleteUserIfExist(App.config.testUser);
        await ApiTests.deleteUserIfExist(App.config.apiTestUser);
        await ApiTests.deleteUserIfExist(App.config.newUser);
    }

    async createAccounts() {
        const { RUB, USD, EUR } = this;

        const accList = [{
            name: 'ACC_3',
            curr_id: RUB,
            initbalance: '500.99',
            icon_id: 2,
            flags: 0,
        }, {
            name: 'ACC_RUB',
            curr_id: RUB,
            initbalance: '500.99',
            icon_id: 5,
            flags: 0,
        }, {
            name: 'ACC_USD',
            curr_id: USD,
            initbalance: '500.99',
            icon_id: 4,
            flags: 0,
        }, {
            name: 'ACC_EUR',
            curr_id: EUR,
            initbalance: '10000.99',
            icon_id: 3,
            flags: 0,
        }, {
            name: 'CARD_RUB',
            curr_id: RUB,
            initbalance: '35000.40',
            icon_id: 3,
            flags: 0,
        }, {
            name: 'HIDDEN_ACC',
            curr_id: RUB,
            initbalance: '100',
            icon_id: 0,
            flags: ACCOUNT_HIDDEN,
        }];

        const createRes = await api.account.createMultiple(accList);
        [
            this.ACC_3,
            this.ACC_RUB,
            this.ACC_USD,
            this.ACC_EUR,
            this.CARD_RUB,
            this.HIDDEN_ACC,
        ] = createRes.ids;

        await App.state.fetch();
    }

    async createPersons() {
        const personsList = [{
            name: 'Maria',
            flags: 0,
        }, {
            name: 'Ivan<',
            flags: 0,
        }, {
            name: 'Hidden person',
            flags: PERSON_HIDDEN,
        }];

        const createRes = await api.person.createMultiple(personsList);
        [
            this.MARIA,
            this.IVAN,
            this.HIDDEN_PERSON,
        ] = createRes.ids;

        await App.state.fetch();
    }

    async createTransactions() {
        const {
            ACC_3,
            ACC_RUB,
            ACC_USD,
            ACC_EUR,
        } = this;
        const { MARIA, IVAN } = this;
        const {
            RUB,
            USD,
            EUR,
            PLN,
        } = this;

        const data = [{
            type: EXPENSE,
            src_id: ACC_3,
            src_amount: '500',
            comment: 'lalala',
        }, {
            type: EXPENSE,
            src_id: ACC_3,
            src_amount: '500',
            dest_curr: USD,
            comment: 'lalala',
        }, {
            type: EXPENSE,
            src_id: ACC_RUB,
            src_amount: '100',
            comment: 'hohoho',
        }, {
            type: EXPENSE,
            src_id: ACC_RUB,
            src_amount: '780',
            dest_amount: '10',
            dest_curr: EUR,
            comment: 'кккк',
        }, {
            type: EXPENSE,
            src_id: ACC_USD,
            src_amount: '50',
            comment: '1111',
        }, {
            type: INCOME,
            dest_id: ACC_EUR,
            src_amount: '7500',
            dest_amount: '100',
            src_curr: RUB,
            comment: '232323',
        }, {
            type: INCOME,
            dest_id: ACC_3,
            src_amount: '1000000',
            dest_amount: '64000',
            src_curr: PLN,
            comment: '111 кккк',
        }, {
            type: INCOME,
            dest_id: ACC_3,
            dest_amount: '100',
            comment: '22222',
        }, {
            type: INCOME,
            dest_id: ACC_RUB,
            src_amount: '7013.21',
            dest_amount: '5000',
            comment: '33333',
        }, {
            type: INCOME,
            dest_id: ACC_EUR,
            src_amount: '287',
            dest_amount: '4',
            src_curr: RUB,
            comment: 'dddd',
        }, {
            type: INCOME,
            dest_id: ACC_EUR,
            dest_amount: '33',
            comment: '11 ho',
        }, {
            type: TRANSFER,
            src_id: ACC_3,
            dest_id: ACC_RUB,
            src_amount: '300',
            comment: 'd4',
        }, {
            type: TRANSFER,
            src_id: ACC_3,
            dest_id: ACC_USD,
            src_amount: '6500',
            dest_amount: '100',
            comment: 'g6',
        }, {
            type: TRANSFER,
            src_id: ACC_RUB,
            dest_id: ACC_3,
            src_amount: '800.01',
            comment: 'x0',
        }, {
            type: TRANSFER,
            src_id: ACC_RUB,
            dest_id: ACC_USD,
            src_amount: '7',
            dest_amount: '0.08',
            comment: 'l2',
        }, {
            type: TRANSFER,
            src_id: ACC_EUR,
            dest_id: ACC_USD,
            src_amount: '5.0301',
            dest_amount: '4.7614',
            comment: 'i1',
        }, {
            type: DEBT,
            op: 1,
            person_id: MARIA,
            src_amount: '1050',
            src_curr: RUB,
            comment: '111 кккк',
        }, {
            type: DEBT,
            op: 1,
            person_id: IVAN,
            acc_id: ACC_RUB,
            src_amount: '780',
            comment: '--**',
        }, {
            type: DEBT,
            op: 2,
            person_id: MARIA,
            src_amount: '990.99',
            src_curr: RUB,
            comment: 'ппп ppp',
        }, {
            type: DEBT,
            op: 2,
            person_id: IVAN,
            acc_id: ACC_USD,
            src_amount: '105',
            comment: '6050 кккк',
        }, {
            type: DEBT,
            op: 1,
            person_id: MARIA,
            acc_id: ACC_EUR,
            src_amount: '4',
            comment: '111 кккк',
        }];

        const multi = [];
        for (const transaction of data) {
            const extracted = Transaction.extract(transaction, App.state);
            for (const date of App.dateList) {
                extracted.date = date;
                multi.push(copyObject(extracted));
            }
        }

        await api.transaction.createMultiple(multi);

        await App.state.fetch();
    }

    async createTestData() {
        await App.scenario.createAccounts();
        await App.scenario.createPersons();
        await App.scenario.createTransactions();
    }

    async finishTests() {
        await ApiTests.loginTest(App.config.testAdminUser);
        await App.setupUser();
    }
}
