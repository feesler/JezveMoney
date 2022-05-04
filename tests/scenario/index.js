import { Runner } from 'jezve-test';
import { Currency } from '../model/Currency.js';
import { DEBT } from '../model/Transaction.js';
import { generateCSV } from '../model/import.js';

import { apiTests } from './api.js';
import { accountTests, postTransactionAccountTests } from './account.js';
import { personTests } from './person.js';
import {
    transactionTests,
    prepareTransactionTests,
    initTransactionTests,
} from './transaction.js';
import { importTests, initImportTests } from './import.js';

import * as ApiTests from '../run/api.js';
import * as SecurityTests from '../run/security.js';
import * as ProfileTests from '../run/profile.js';
import * as AccountTests from '../run/account.js';
import * as PersonTests from '../run/person.js';

import * as TransactionTests from '../run/transaction/common.js';
import * as ImportTests from '../run/import.js';
import * as StatisticsTests from '../run/statistics.js';

import { api } from '../model/api.js';
import { App } from '../Application.js';
import { setBlock, isFullScenario } from '../env.js';

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
        ] = Currency.getItemsByNames(['RUB', 'USD', 'EUR', 'PLN', 'KRW']);
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

        await ApiTests.loginTest(App.config.testAdminUser);
        await this.prepareImportTests();

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

        initTransactionTests(this);
        await prepareTransactionTests();

        initImportTests(this);
        await importTests();
    }

    async runFullScenario() {
        setBlock('Running full test scenario', 1);

        await this.securityTests();
        await this.prepareTests();

        await apiTests.call(this);
        await App.goToMainView();
        await this.profileTests();
        await accountTests.call(this);
        await personTests.call(this);

        initTransactionTests(this);
        await transactionTests();

        await this.runDeleteFromUpdateTests();
        await postTransactionAccountTests();
        await StatisticsTests.run();

        await this.finishTests();
    }

    async securityTests() {
        setBlock('Security tests', 1);

        await this.runner.runGroup(SecurityTests.checkAccess, [
            'system',
            'system/logs/log.txt',
            'Model/',
            'Controller/',
            'view/',
            'api/',
            'admin/',
        ]);
    }

    async prepareTests() {
        await ApiTests.loginTest(App.config.testAdminUser);
        // Remove possible users
        await ApiTests.deleteUserIfExist(App.config.testUser);
        await ApiTests.deleteUserIfExist(App.config.apiTestUser);
        await ApiTests.deleteUserIfExist(App.config.newUser);

        await this.prepareImportTests();
    }

    // Upload CSV file for import tests
    async prepareImportTests() {
        const now = new Date();
        this.csvStatement = generateCSV([
            [now, 'MOBILE', 'MOSKVA', 'RU', 'RUB', '-500.00'],
            [now, 'SALON', 'SANKT-PETERBU', 'RU', 'RUB', '-80.00'],
            [now, 'OOO SIGMA', 'MOSKVA', 'RU', 'RUB', '-128.00'],
            [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-188.00'],
            [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-306.00'],
            [now, 'MAGAZIN', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
            [now, 'BAR', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
            [now, 'DOSTAVKA', 'SANKT-PETERBU', 'RU', 'RUB', '-688.00'],
            [now, 'PRODUCTY', 'SANKT-PETERBU', 'RU', 'RUB', '-550.5'],
            [now, 'BOOKING', 'AMSTERDAM', 'NL', 'EUR', '-500.00', 'RUB', '-50750.35'],
            [now, 'SALARY', 'MOSKVA', 'RU', 'RUB', '100000.00'],
            [now, 'INTEREST', 'SANKT-PETERBU', 'RU', 'RUB', '23.16'],
            [now, 'RBA R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-5000.00'],
            [now, 'C2C R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-10000.00'],
        ]);

        this.uploadFilename = await ImportTests.putFile(this.csvStatement);
        if (!this.uploadFilename) {
            throw new Error('Fail to put file');
        }
    }

    async finishTests() {
        await ApiTests.loginTest(App.config.testAdminUser);
        await App.setupUser();
        await ImportTests.removeFile(this.uploadFilename);
    }

    async profileTests() {
        setBlock('Profile tests', 1);

        await App.state.fetch();

        const origUserName = App.state.profile.name;
        const tmpPassword = 'test123';

        // Registration tests
        await ProfileTests.register(App.config.newUser);
        await ProfileTests.deleteProfile();

        await this.runner.runGroup(ProfileTests.register, [{
            login: '',
            name: '',
            password: '',
        }, {
            login: '',
            name: App.config.newUser.name,
            password: App.config.newUser.password,
        }, {
            login: App.config.newUser.login,
            name: '',
            password: App.config.newUser.password,
        }, {
            login: App.config.newUser.login,
            name: App.config.newUser.name,
            password: '',
        }]);

        // Login tests
        await this.runner.runGroup(ProfileTests.relogin, [{
            login: App.config.testUser.login,
            password: '',
        }, {
            login: '',
            password: App.config.testUser.password,
        }, {
            login: '',
            password: '',
        }, {
            ...App.config.testUser,
        }]);

        await ProfileTests.resetAll();

        // Change name tests
        await this.runner.runGroup(ProfileTests.changeName, [
            '',
            origUserName,
            '^^&&>>',
            origUserName,
        ]);

        // Change password tests
        await this.runner.runGroup(ProfileTests.changePass, [{
            oldPassword: '',
            newPassword: '',
        }, {
            oldPassword: '123',
            newPassword: '',
        }, {
            oldPassword: '',
            newPassword: '123',
        }, {
            oldPassword: App.config.testUser.password,
            newPassword: tmpPassword,
        }, {
            oldPassword: tmpPassword,
            newPassword: App.config.testUser.password,
        }]);
    }

    async runDeleteFromUpdateTests() {
        setBlock('Delete from update view tests', 2);

        const tasks = [{
            action: (pos) => TransactionTests.delFromUpdate(DEBT, pos),
            data: 0,
        }, {
            action: AccountTests.delFromUpdate,
            data: 0,
        }, {
            action: PersonTests.delFromUpdate,
            data: 0,
        }];

        await this.runner.runTasks(tasks);
    }
}
