import { copyObject } from './common.js';
import { Currency } from './model/currency.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
    availTransTypes,
} from './model/transaction.js';
import { generateCSV } from './model/import.js';
import {
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_ACC_AMOUNT,
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_DATE,
    IMPORT_COND_FIELD_COMMENT,
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_STRING_INCLUDES,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER,
} from './model/importcondition.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_SRC_AMOUNT,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
} from './model/importaction.js';

import * as SecurityTests from './run/security.js';
import * as ProfileTests from './run/profile.js';
import * as AccountTests from './run/account.js';
import * as PersonTests from './run/person.js';

import * as TransactionTests from './run/transaction/common.js';
import * as ExpenseTransactionTests from './run/transaction/expense.js';
import * as IncomeTransactionTests from './run/transaction/income.js';
import * as TransferTransactionTests from './run/transaction/transfer.js';
import * as DebtTransactionTests from './run/transaction/debt.js';

import * as TransactionListTests from './run/transactions.js';
import * as ImportTests from './run/import.js';
import * as StatisticsTests from './run/statistics.js';

import * as ApiTests from './run/api.js';
import * as AccountApiTests from './run/api/account.js';
import * as PersonApiTests from './run/api/person.js';
import * as TransactionApiTests from './run/api/transaction.js';

import { api } from './model/api.js';
import { Runner } from './runner.js';
import { App } from './app.js';

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
        this.fullTest = true;

        if (this.fullTest) {
            await this.runFullScenario();
        } else {
            await this.runTestScenario();
        }
    }

    async runTestScenario() {
        await ApiTests.loginTest(App.config.testUser);
        await App.setupUser();
        this.setupCurrencies();
        await App.goToMainView();
        await ProfileTests.relogin(App.config.testUser);
    }

    async runFullScenario() {
        await this.securityTests();
        await this.prepareTests();

        await this.apiTests();
        await App.goToMainView();
        await this.profileTests();
        await this.accountTests();
        await this.personTests();
        await this.transactionTests();
        await this.postTransactionAccountTests();
        await StatisticsTests.run();

        await this.finishTests();
    }

    async securityTests() {
        this.environment.setBlock('Security tests', 1);

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
    }

    async finishTests() {
        await ApiTests.loginTest(App.config.testAdminUser);
        await App.setupUser();
        await ImportTests.removeFile(this.uploadFilename);
    }

    async apiTests() {
        this.environment.setBlock('API tests', 1);
        this.environment.setBlock('User', 2);

        // Register API test user and prepare data for security tests
        await ApiTests.registerAndLogin(App.config.apiTestUser);
        await App.setupUser();
        this.setupCurrencies();
        await this.prepareApiSecurityTests();

        await ApiTests.loginTest({ login: '', password: App.config.testUser.password });
        await ApiTests.loginTest({ login: App.config.testUser.login, password: '' });

        // Register and login main test user
        await ApiTests.registerAndLogin(App.config.testUser);
        // Set 'Tester' access level for test user
        const testUserId = App.state.profile.user_id;
        await ApiTests.loginTest(App.config.testAdminUser);
        const testUserData = copyObject(App.config.testUser);
        testUserData.access = 2;
        await api.user.update(testUserId, testUserData);
        await ApiTests.loginTest(App.config.testUser);
        await App.setupUser();

        this.environment.setBlock('Accounts', 2);

        await ApiTests.resetAccounts();

        await this.apiCreateAccounts();
        await this.apiCreatePersons();
        await this.apiCreateTransactions();

        await this.apiSecurityTests();

        await this.apiUpdateTransactions();
        await this.apiSetTransactionPos();

        await this.apiFilterTransactions();

        await this.apiUpdateAccounts();
        await this.apiDeleteAccounts();

        await this.apiUpdatePersons();
        await this.apiDeletePersons();

        await this.apiDeleteTransactions();

        await this.apiProfile();

        await api.user.login(App.config.testUser);
    }

    async prepareApiSecurityTests() {
        this.environment.setBlock('Prepare data for security tests', 2);

        const { RUB, USD } = this;

        [
            this.API_USER_ACC_RUB,
            this.API_USER_ACC_USD,
        ] = await this.runner.runGroup(AccountApiTests.create, [{
            name: 'RUB',
            curr_id: RUB,
            initbalance: 100.1,
            icon_id: 5,
            flags: 0,
        }, {
            name: 'USD',
            curr_id: USD,
            initbalance: 50,
            icon_id: 2,
            flags: 0,
        }]);

        [
            this.API_USER_PERSON,
        ] = await this.runner.runGroup(PersonApiTests.create, [{
            name: 'API user Person',
            flags: 0,
        }]);

        [
            this.API_USER_TRANSACTION,
        ] = await this.runner.runGroup(TransactionApiTests.extractAndCreate, [{
            type: EXPENSE,
            src_id: this.API_USER_ACC_RUB,
            src_amount: 100,
        }]);
    }

    async apiSecurityTests() {
        await this.apiAccountsSecurity();
        await this.apiPersonsSecurity();
        await this.apiTransactionsSecurity();
    }

    async apiAccountsSecurity() {
        this.environment.setBlock('Accounts security', 2);

        const { EUR } = this;

        await AccountApiTests.update({
            id: this.API_USER_ACC_RUB,
            name: 'EUR',
            curr_id: EUR,
            initbalance: 10,
            icon_id: 2,
            flags: 0,
        });
        await AccountApiTests.del(this.API_USER_ACC_RUB);
    }

    async apiPersonsSecurity() {
        this.environment.setBlock('Persons security', 2);

        await PersonApiTests.update({
            id: this.API_USER_PERSON,
            name: 'API Person',
            flags: 0,
        });
        await PersonApiTests.del(this.API_USER_PERSON);
    }

    async apiTransactionsSecurity() {
        this.environment.setBlock('Transaction security', 2);

        await this.apiCreateTransactionSecurity();
        await this.apiUpdateTransactionSecurity();
        await this.apiDeleteTransactionSecurity();
    }

    async apiCreateTransactionSecurity() {
        this.environment.setBlock('Create', 3);

        const { RUB } = this;
        const data = [{
            type: EXPENSE,
            src_id: this.API_USER_ACC_RUB,
            dest_id: 0,
            src_curr: RUB,
            dest_curr: RUB,
            src_amount: 100,
            dest_amount: 100,
        }, {
            type: INCOME,
            src_id: 0,
            dest_id: this.API_USER_ACC_RUB,
            src_curr: RUB,
            dest_curr: RUB,
            src_amount: 100,
            dest_amount: 100,
        }, {
            type: TRANSFER,
            src_id: this.CASH_RUB,
            dest_id: this.API_USER_ACC_RUB,
            src_curr: RUB,
            dest_curr: RUB,
            src_amount: 100,
            dest_amount: 100,
        }, {
            type: DEBT,
            op: 1,
            person_id: this.API_USER_PERSON,
            acc_id: 0,
            src_curr: RUB,
            dest_curr: RUB,
            src_amount: 100,
            dest_amount: 100,
        }];

        await this.runner.runGroup(TransactionApiTests.create, data);
    }

    async apiUpdateTransactionSecurity() {
        this.environment.setBlock('Update', 3);

        const { RUB } = this;

        const data = [{
            id: this.TR_EXPENSE_1,
            src_id: this.API_USER_ACC_RUB,
        }, {
            id: this.TR_INCOME_1,
            dest_id: this.API_USER_ACC_RUB,
        }, {
            id: this.TR_TRANSFER_1,
            src_id: this.API_USER_ACC_RUB,
            dest_id: this.API_USER_ACC_USD,
        }, {
            // Trying to update transaction of another user
            id: this.API_USER_TRANSACTION,
            type: EXPENSE,
            src_id: this.CASH_RUB,
            dest_id: 0,
            src_curr: RUB,
            dest_curr: RUB,
            src_amount: 100,
            dest_amount: 100,
        }, {
            // Trying to set person of another user
            id: this.TR_DEBT_1,
            person_id: this.API_USER_PERSON,
        }, {
            // Trying to set account of another user
            id: this.TR_DEBT_2,
            acc_id: this.API_USER_ACC_RUB,
        }, {
            // Trying to set both person and account of another user
            id: this.TR_DEBT_3,
            person_id: this.API_USER_PERSON,
            acc_id: this.API_USER_ACC_RUB,
        }];

        await this.runner.runGroup(TransactionApiTests.update, data);
    }

    async apiDeleteTransactionSecurity() {
        this.environment.setBlock('Delete', 3);

        const data = [
            [this.API_USER_TRANSACTION],
        ];

        await this.runner.runGroup(TransactionApiTests.del, data);
    }

    async apiCreateAccounts() {
        const { RUB, USD } = this;

        const data = [{
            name: 'acc ru',
            curr_id: RUB,
            initbalance: 100,
            icon_id: 1,
            flags: 0,
        }, {
            name: 'cash ru',
            curr_id: RUB,
            initbalance: 5000,
            icon_id: 3,
            flags: 0,
        }, {
            name: 'acc usd',
            curr_id: USD,
            initbalance: 10.5,
            icon_id: 5,
            flags: 0,
        }, {
            // Try to create account with existing name
            name: 'acc ru',
            curr_id: USD,
            initbalance: 10.5,
            icon_id: 0,
            flags: 0,
        }, {
            // Try to create account without some of fields
            curr_id: USD,
            initbalance: 10.5,
            icon_id: 0,
            flags: 0,
        }, {
            name: 'acc tst',
            initbalance: 10.5,
        }, {
            // Try to create account with excess properties
            name: 'acc tst',
            curr_id: USD,
            initbalance: 10.5,
            icon_id: 5,
            flags: 0,
            xxx: 1,
            yyy: 2,
        }, {
            // Try to create account with invalid data
            name: '',
            curr_id: USD,
            initbalance: 10.5,
            icon_id: 5,
            flags: 0,
        }, {
            name: 'acc tst',
            curr_id: 9999,
            initbalance: 10.5,
            icon_id: 5,
            flags: 0,
        }, {
            name: 'acc tst',
            curr_id: USD,
            initbalance: 'fff',
            icon_id: 5,
            flags: 0,
        }];

        [
            this.ACC_RUB,
            this.CASH_RUB,
            this.ACC_USD,
        ] = await this.runner.runGroup(AccountApiTests.create, data);
    }

    async apiUpdateAccounts() {
        const { USD } = this;

        const data = [{
            id: this.ACC_RUB,
            name: 'acc rub',
            curr_id: USD,
            initbalance: 101,
            icon_id: 2,
        }, {
            // Try to update name of account to an existing one
            id: this.CASH_RUB,
            name: 'acc rub',
        }];

        return this.runner.runGroup(AccountApiTests.update, data);
    }

    async apiDeleteAccounts() {
        const data = [
            [this.ACC_USD, this.CASH_RUB],
        ];

        return this.runner.runGroup(AccountApiTests.del, data);
    }

    async apiCreatePersons() {
        const data = [{
            name: 'Person X',
            flags: 0,
        }, {
            name: 'Y',
            flags: 0,
        }, {
            // Try to create person with existing name
            name: 'Y',
            flags: 0,
        }, {
            // Invalid data tests
            flags: 0,
        }, {
            name: 'ZZZ',
        }, {
            name: '',
            flags: 1,
            xxx: 1,
        }, {
            name: '',
            flags: 1,
        }];

        [this.PERSON_X, this.PERSON_Y] = await this.runner.runGroup(PersonApiTests.create, data);
    }

    async apiUpdatePersons() {
        const data = [
            { id: this.PERSON_X, name: 'XX!' },
            // Try to update name of person to an existing one
            { id: this.PERSON_X, name: 'XX!' },
            { id: this.PERSON_X, name: '' },
        ];

        return this.runner.runGroup(PersonApiTests.update, data);
    }

    async apiDeletePersons() {
        const data = [
            [this.PERSON_Y],
            [],
        ];

        return this.runner.runGroup(PersonApiTests.del, data);
    }

    async apiCreateTransactions() {
        this.environment.setBlock('Create', 3);

        const { RUB, USD, EUR } = this;

        const data = [{
            type: EXPENSE,
            src_id: this.ACC_RUB,
            src_amount: 100,
            comment: '11',
        }, {
            type: EXPENSE,
            src_id: this.ACC_RUB,
            src_amount: 7608,
            dest_amount: 100,
            dest_curr: EUR,
            comment: '22',
        }, {
            type: EXPENSE,
            src_id: this.ACC_USD,
            src_amount: 1,
            date: App.dates.yesterday,
        }, {
            type: INCOME,
            dest_id: this.ACC_RUB,
            dest_amount: 1000.50,
            comment: 'lalala',
        }, {
            type: INCOME,
            dest_id: this.ACC_USD,
            src_amount: 6500,
            dest_amount: 100,
            src_curr: RUB,
            comment: 'la',
        }, {
            type: TRANSFER,
            src_id: this.ACC_RUB,
            dest_id: this.CASH_RUB,
            src_amount: 500,
            dest_amount: 500,
        }, {
            type: TRANSFER,
            src_id: this.ACC_RUB,
            dest_id: this.ACC_USD,
            src_amount: 6500,
            dest_amount: 100,
        }, {
            type: DEBT,
            op: 1,
            person_id: this.PERSON_X,
            acc_id: 0,
            src_amount: 500,
            src_curr: RUB,
            comment: 'к кк',
        }, {
            type: DEBT,
            op: 2,
            person_id: this.PERSON_Y,
            acc_id: 0,
            src_amount: 1000,
            src_curr: USD,
            comment: 'к',
        }, {
            type: DEBT,
            op: 1,
            person_id: this.PERSON_X,
            acc_id: 0,
            src_amount: 500,
            src_curr: RUB,
            comment: 'ппп',
        }, {
            type: DEBT,
            op: 2,
            person_id: this.PERSON_Y,
            acc_id: 0,
            src_amount: 1000,
            src_curr: USD,
        }];

        [
            this.TR_EXPENSE_1,
            this.TR_EXPENSE_2,
            this.TR_EXPENSE_3,
            this.TR_INCOME_1,
            this.TR_INCOME_2,
            this.TR_TRANSFER_1,
            this.TR_TRANSFER_2,
            this.TR_DEBT_1,
            this.TR_DEBT_2,
            this.TR_DEBT_3,
        ] = await this.runner.runGroup(TransactionApiTests.extractAndCreate, data);

        const invData = [{
            type: EXPENSE,
            src_id: 0,
            src_amount: 100,
        }, {
            type: EXPENSE,
            src_id: this.ACC_RUB,
            src_amount: 0,
        }, {
            type: EXPENSE,
            src_id: 0,
            dest_id: this.ACC_RUB,
            src_amount: 100,
        }, {
            type: INCOME,
            dest_id: 0,
            dest_amount: 100,
        }, {
            type: INCOME,
            src_id: this.ACC_RUB,
            dest_id: 0,
            dest_amount: 100,
        }, {
            type: INCOME,
            dest_id: this.ACC_RUB,
            dest_amount: '',
        }, {
            type: INCOME,
            dest_id: this.ACC_RUB,
            dest_amount: 99.1,
            date: '1f1f',
        }, {
            type: TRANSFER,
            src_id: 0,
            dest_id: 0,
            src_amount: 100,
        }, {
            type: TRANSFER,
            src_id: this.ACC_RUB,
            dest_id: 0,
            src_amount: 100,
        }, {
            type: TRANSFER,
            src_id: 0,
            dest_id: this.ACC_RUB,
            src_amount: 100,
        }, {
            type: DEBT,
            op: 0,
            person_id: this.PERSON_X,
            acc_id: 0,
            src_amount: 500,
            src_curr: RUB,
        }, {
            type: DEBT,
            op: 1,
            person_id: 0,
            acc_id: 0,
            src_amount: 500,
            src_curr: RUB,
        }, {
            type: DEBT,
            op: 1,
            person_id: this.PERSON_X,
            acc_id: 0,
            src_amount: '',
            src_curr: RUB,
        }, {
            type: DEBT,
            op: 1,
            person_id: this.PERSON_X,
            acc_id: 0,
            src_amount: 10,
            src_curr: 9999,
        }];
        await this.runner.runGroup(TransactionApiTests.create, invData);
    }

    async apiUpdateTransactions() {
        this.environment.setBlock('Update', 3);

        const {
            RUB,
            USD,
            EUR,
            PLN,
        } = this;

        const data = [{
            id: this.TR_EXPENSE_1,
            src_id: this.CASH_RUB,
        }, {
            id: this.TR_EXPENSE_2,
            dest_amount: 7608,
            dest_curr: RUB,
        }, {
            id: this.TR_EXPENSE_3,
            dest_amount: 0.89,
            dest_curr: EUR,
            date: App.dates.weekAgo,
        }, {
            id: this.TR_INCOME_1,
            dest_id: this.CASH_RUB,
        }, {
            id: this.TR_INCOME_2,
            src_amount: 100,
            src_curr: USD,
        }, {
            id: this.TR_TRANSFER_1,
            dest_id: this.ACC_USD,
            dest_curr: USD,
            dest_amount: 8,
        }, {
            id: this.TR_TRANSFER_2,
            dest_id: this.CASH_RUB,
            dest_curr: RUB,
            dest_amount: 6500,
            date: App.dates.yesterday,
        }, {
            id: this.TR_DEBT_1,
            op: 2,
        }, {
            id: this.TR_DEBT_2,
            person_id: this.PERSON_Y,
            acc_id: 0,
        }, {
            id: this.TR_DEBT_3,
            op: 1,
            acc_id: this.ACC_RUB,
        }];

        await this.runner.runGroup(TransactionApiTests.update, data);

        const invData = [{
            id: this.TR_EXPENSE_1,
            src_id: 0,
        }, {
            id: this.TR_EXPENSE_2,
            dest_amount: 0,
            dest_curr: PLN,
        }, {
            id: this.TR_EXPENSE_3,
            date: '',
        }, {
            id: this.TR_INCOME_1,
            dest_id: 0,
        }, {
            id: this.TR_INCOME_2,
            src_amount: 0,
            src_curr: EUR,
        }, {
            id: this.TR_TRANSFER_1,
            src_id: 0,
        }, {
            id: this.TR_TRANSFER_1,
            dest_id: 0,
        }, {
            id: this.TR_TRANSFER_1,
            src_curr: 0,
        }, {
            id: this.TR_TRANSFER_1,
            dest_curr: 9999,
        }, {
            id: this.TR_TRANSFER_1,
            dest_id: this.ACC_USD,
            dest_curr: PLN,
        }, {
            id: this.TR_TRANSFER_2,
            dest_id: this.CASH_RUB,
            dest_curr: RUB,
            dest_amount: 0,
            date: 'x',
        }, {
            id: this.TR_DEBT_1,
            op: 0,
        }, {
            id: this.TR_DEBT_2,
            person_id: 0,
        }, {
            id: this.TR_DEBT_3,
            op: 1,
            acc_id: 9999,
        }];

        await this.runner.runGroup(TransactionApiTests.update, invData);
    }

    async apiDeleteTransactions() {
        return this.runner.runGroup(TransactionApiTests.del, [
            [this.TR_EXPENSE_2, this.TR_TRANSFER_1, this.TR_DEBT_3],
            [],
            [9999],
        ]);
    }

    async apiSetTransactionPos() {
        return this.runner.runGroup(TransactionApiTests.setPos, [
            { id: this.TR_EXPENSE_2, pos: 5 },
            { id: this.TR_INCOME_2, pos: 10 },
            { id: this.TR_TRANSFER_1, pos: 100 },
        ]);
    }

    async apiFilterTransactions() {
        this.environment.setBlock('Filter transactions', 2);

        const data = [{
            order: 'desc',
        }, {
            order: 'asc',
        }, {
            type: DEBT,
        }, {
            type: [EXPENSE, INCOME, TRANSFER],
        }, {
            accounts: this.ACC_RUB,
        }, {
            accounts: [this.ACC_RUB, this.ACC_USD],
        }, {
            accounts: this.ACC_RUB,
            order: 'desc',
        }, {
            type: DEBT,
            accounts: this.ACC_RUB,
        }, {
            onPage: 10,
        }, {
            onPage: 10,
            page: 2,
        }, {
            startDate: App.dates.now,
            endDate: App.dates.weekAfter,
        }, {
            startDate: App.dates.now,
            endDate: App.dates.weekAfter,
            search: '1',
        }, {
            search: 'la',
        }, {
            search: 'кк',
        }];

        return this.runner.runGroup(TransactionApiTests.filter, data);
    }

    async apiProfile() {
        this.environment.setBlock('Profile', 2);

        const tasks = [{
            action: ApiTests.loginTest,
            data: App.config.apiTestUser,
        }, {
            action: ApiTests.resetAll,
        }, {
            action: ApiTests.changeName,
            data: '',
        }, {
            action: ApiTests.changeName,
            data: 'App tester',
        }, {
            action: ApiTests.changePassword,
            data: { user: App.config.apiTestUser, newPassword: '54321' },
        }, {
            action: ApiTests.deleteProfile,
        }];

        return this.runner.runTasks(tasks);
    }

    async profileTests() {
        this.environment.setBlock('Profile tests', 1);

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

    async accountTests() {
        this.environment.setBlock('Accounts', 1);

        await AccountTests.stateLoop();

        await this.createAccountTests();
        await this.deleteAccountTests();
    }

    async postTransactionAccountTests() {
        await this.hideAccountsTest();
        await this.toggleAccountsTest();
        await this.showAccountsTest();
        await this.exportAccountsTest();
        await this.updateAccountTests();
        await this.deleteAccountTests();
    }

    async createAccountTests() {
        this.environment.setBlock('Create accounts', 2);

        const { RUB, EUR } = this;

        const data = [{
            name: 'acc_1',
            initbalance: 1000.01,
            curr_id: RUB,
        }, {
            name: 'acc_2',
            initbalance: '1000.01',
            curr_id: EUR,
        }, {
            // Try to submit account with empty name
            name: '',
            initbalance: '100',
        }, {
            // Try to submit account with empty initial balance
            name: 'acc',
            initbalance: '',
        }];

        await this.runner.runGroup(AccountTests.create, data);
    }

    async updateAccountTests() {
        this.environment.setBlock('Update accounts', 2);

        const { RUB, USD } = this;
        const data = [{
            pos: 0,
            icon_id: 1,
            curr_id: USD,
        }, {
            pos: 0,
            curr_id: RUB,
        }];

        await this.runner.runGroup(AccountTests.update, data);
    }

    async deleteAccountTests() {
        this.environment.setBlock('Delete accounts', 2);

        const data = [
            [0, 1],
        ];

        await this.runner.runGroup(AccountTests.del, data);
    }

    async hideAccountsTest() {
        this.environment.setBlock('Hide accounts', 2);

        const data = [
            [0],
            [0, 4],
        ];

        await this.runner.runGroup(AccountTests.hide, data);
    }

    async showAccountsTest() {
        this.environment.setBlock('Show accounts', 2);

        const data = [
            [5],
            [0, 6],
        ];

        await this.runner.runGroup(AccountTests.show, data);
    }

    async exportAccountsTest() {
        this.environment.setBlock('Export accounts', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await this.runner.runGroup(AccountTests.exportTest, data);
    }

    async toggleAccountsTest() {
        this.environment.setBlock('Toggle select accounts', 2);

        const data = [
            [0],
            [1, 2],
        ];

        await this.runner.runGroup(AccountTests.toggleSelect, data);
    }

    async personTests() {
        this.environment.setBlock('Persons', 1);

        await this.createPersonTests();
        await this.hidePersonsTest();
        await this.togglePersonsTest();
        await this.showPersonsTest();
        await this.updatePersonTests();
        await this.deletePersonTests();
    }

    async createPersonTests() {
        this.environment.setBlock('Create persons', 2);

        const data = [
            { name: '&&<div>' },
            { name: 'Alex' },
            { name: 'Maria' },
            { name: 'Johnny' },
            { name: 'Иван' },
            // Try to submit person with empty name
            { name: '' },
        ];

        await this.runner.runGroup(PersonTests.create, data);
    }

    async updatePersonTests() {
        this.environment.setBlock('Update persons', 2);

        const data = [{
            pos: 4,
            name: 'Ivan<',
        }, {
            // Try to submit person with empty name
            pos: 0,
            name: '',
        }];

        await this.runner.runGroup(PersonTests.update, data);
    }

    async deletePersonTests() {
        this.environment.setBlock('Delete persons', 2);

        const data = [
            [0],
            [0, 2],
        ];

        await this.runner.runGroup(PersonTests.del, data);
    }

    async hidePersonsTest() {
        this.environment.setBlock('Hide persons', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await this.runner.runGroup(PersonTests.hide, data);
    }

    async showPersonsTest() {
        this.environment.setBlock('Show persons', 2);

        const data = [
            [2],
            [0, 4],
        ];

        await this.runner.runGroup(PersonTests.show, data);
    }

    async togglePersonsTest() {
        this.environment.setBlock('Toggle select persons', 2);

        const data = [
            [0],
            [1, 2],
        ];

        await this.runner.runGroup(PersonTests.toggleSelect, data);
    }

    async prepareTransactionTests() {
        const { RUB, USD, EUR } = this;

        const accList = [{
            name: 'acc_3',
            curr_id: RUB,
            initbalance: '500.99',
            icon_id: 2,
            flags: 0,
        }, {
            name: 'acc RUB',
            curr_id: RUB,
            initbalance: '500.99',
            icon_id: 5,
            flags: 0,
        }, {
            name: 'acc USD',
            curr_id: USD,
            initbalance: '500.99',
            icon_id: 4,
            flags: 0,
        }, {
            name: 'acc EUR',
            curr_id: EUR,
            initbalance: '10000.99',
            icon_id: 3,
            flags: 0,
        }, {
            name: 'card RUB',
            curr_id: RUB,
            initbalance: '35000.40',
            icon_id: 3,
            flags: 0,
        }];

        for (const account of accList) {
            if (App.state.accounts.findByName(account.name)) {
                continue;
            }

            await api.account.create(account);
        }

        const personsList = [{
            name: 'Maria',
            flags: 0,
        }, {
            name: 'Ivan<',
            flags: 0,
        }];

        for (const person of personsList) {
            if (App.state.persons.findByName(person.name)) {
                continue;
            }

            await api.person.create(person);
        }

        await App.state.fetch();
    }

    async transactionTests() {
        this.environment.setBlock('Transactions', 1);

        await this.prepareTransactionTests();

        await this.transactionStateLoopTests();
        await this.createTransactionTests();
        await this.updateTransactionTests();
        await this.transactionsListTests();
        await this.importTests();
        await this.deleteTransactionTests();
    }

    async transactionStateLoopTests() {
        this.environment.setBlock('Transaction view state loops', 1);

        await ExpenseTransactionTests.stateLoop();
        await IncomeTransactionTests.stateLoop();
        await TransferTransactionTests.stateLoop();
        await DebtTransactionTests.stateLoop();
    }

    async createTransactionTests() {
        this.environment.setBlock('Create transaction', 1);

        await this.runCreateExpenseTests();
        await this.runCreateIncomeTests();
        await this.runCreateTransferTests();
        await this.runCreateDebtTests();
    }

    async updateTransactionTests() {
        this.environment.setBlock('Update transaction', 1);

        await this.runUpdateExpenseTests();
        await this.runUpdateIncomeTests();
        await this.runUpdateTransferTests();
        await this.runUpdateDebtTests();
    }

    async setupAccounts() {
        const { RUB, USD, EUR } = this;
        const data = [{
            name: 'acc_4',
            curr_id: RUB,
            initbalance: '60500.12',
            icon_id: 1,
            flags: 0,
        }, {
            name: 'acc_5',
            curr_id: RUB,
            initbalance: '78000',
            icon_id: 2,
            flags: 0,
        }, {
            name: 'cash USD',
            curr_id: USD,
            initbalance: '10000',
            icon_id: 4,
            flags: 0,
        }, {
            name: 'cash EUR',
            curr_id: EUR,
            initbalance: '1000',
            icon_id: 5,
            flags: 0,
        }];

        const res = [];
        for (const params of data) {
            let account = App.state.accounts.findByName(params.name);
            if (!account) {
                account = await api.account.create(params);
                App.state.createAccount(params);
            }

            if (account) {
                res.push(account.id);
            }
        }

        return res;
    }

    async setupPersons() {
        const data = [{
            name: 'Alex',
            flags: 0,
        }, {
            name: 'noname &',
            flags: 0,
        }];

        const res = [];
        for (const params of data) {
            let person = App.state.persons.findByName(params.name);
            if (!person) {
                person = await api.person.create(params);
                App.state.createPerson(params);
            }

            if (person) {
                res.push(person.id);
            }
        }

        return res;
    }

    async setupTransactions(accountIds, personIds) {
        const [ACC_4, ACC_5, CASH_USD, CASH_EUR] = accountIds;
        const [ALEX, NONAME] = personIds;
        const {
            RUB,
            USD,
            EUR,
            PLN,
        } = this;

        const data = [{
            type: EXPENSE,
            src_id: ACC_4,
            src_amount: '500',
            comment: 'lalala',
        }, {
            type: EXPENSE,
            src_id: ACC_4,
            src_amount: '500',
            dest_curr: USD,
            comment: 'lalala',
        }, {
            type: EXPENSE,
            src_id: ACC_5,
            src_amount: '100',
            comment: 'hohoho',
        }, {
            type: EXPENSE,
            src_id: ACC_5,
            src_amount: '780',
            dest_amount: '10',
            dest_curr: EUR,
            comment: 'кккк',
        }, {
            type: EXPENSE,
            src_id: CASH_USD,
            src_amount: '50',
            comment: '1111',
        }, {
            type: INCOME,
            dest_id: CASH_EUR,
            src_amount: '7500',
            dest_amount: '100',
            src_curr: RUB,
            comment: '232323',
        }, {
            type: INCOME,
            dest_id: ACC_4,
            src_amount: '1000000',
            dest_amount: '64000',
            src_curr: PLN,
            comment: '111 кккк',
        }, {
            type: INCOME,
            dest_id: ACC_4,
            dest_amount: '100',
            comment: '22222',
        }, {
            type: INCOME,
            dest_id: ACC_5,
            src_amount: '7013.21',
            dest_amount: '5000',
            comment: '33333',
        }, {
            type: INCOME,
            dest_id: CASH_EUR,
            src_amount: '287',
            dest_amount: '4',
            src_curr: RUB,
            comment: 'dddd',
        }, {
            type: INCOME,
            dest_id: CASH_EUR,
            dest_amount: '33',
            comment: '11 ho',
        }, {
            type: TRANSFER,
            src_id: ACC_4,
            dest_id: ACC_5,
            src_amount: '300',
            comment: 'd4',
        }, {
            type: TRANSFER,
            src_id: ACC_4,
            dest_id: CASH_USD,
            src_amount: '6500',
            dest_amount: '100',
            comment: 'g6',
        }, {
            type: TRANSFER,
            src_id: ACC_5,
            dest_id: ACC_4,
            src_amount: '800.01',
            comment: 'x0',
        }, {
            type: TRANSFER,
            src_id: ACC_5,
            dest_id: CASH_USD,
            src_amount: '7',
            dest_amount: '0.08',
            comment: 'l2',
        }, {
            type: TRANSFER,
            src_id: CASH_EUR,
            dest_id: CASH_USD,
            src_amount: '5.0301',
            dest_amount: '4.7614',
            comment: 'i1',
        }, {
            type: DEBT,
            op: 1,
            person_id: ALEX,
            src_amount: '1050',
            src_curr: RUB,
            comment: '111 кккк',
        }, {
            type: DEBT,
            op: 1,
            person_id: NONAME,
            acc_id: ACC_5,
            src_amount: '780',
            comment: '--**',
        }, {
            type: DEBT,
            op: 2,
            person_id: ALEX,
            src_amount: '990.99',
            src_curr: RUB,
            comment: 'ппп ppp',
        }, {
            type: DEBT,
            op: 2,
            person_id: NONAME,
            acc_id: CASH_USD,
            src_amount: '105',
            comment: '6050 кккк',
        }, {
            type: DEBT,
            op: 1,
            person_id: ALEX,
            acc_id: CASH_EUR,
            src_amount: '4',
            comment: '111 кккк',
        }];

        // Check transactions already exists
        const personsAccounts = personIds.flatMap((personId) => {
            const person = App.state.persons.getItem(personId);
            if (person && Array.isArray(person.accounts)) {
                return person.accounts.map((item) => item.id);
            }

            return [];
        });

        const trList = App.state.transactions.applyFilter({
            accounts: accountIds.concat(personsAccounts),
        });
        if (trList.length === data.length * App.dateList.length) {
            return trList.getIds();
        }

        const multi = [];
        for (const transaction of data) {
            const extracted = Transaction.extract(transaction, App.state);
            for (const date of App.dateList) {
                extracted.date = date;
                multi.push(copyObject(extracted));
            }
        }

        return api.transaction.createMultiple(multi);
    }

    async prepareTrListData() {
        await api.user.login(App.config.testUser);
        await App.state.fetch();

        const accIds = await this.setupAccounts();
        const personIds = await this.setupPersons();
        const transIds = await this.setupTransactions(accIds, personIds);

        await App.state.fetch();

        const res = {
            accounts: accIds,
            persons: personIds,
            transactions: transIds,
        };

        return res;
    }

    async transactionsListTests() {
        this.environment.setBlock('Transaction List view', 1);

        const data = await this.prepareTrListData();

        await this.runner.runTasks([
            { action: TransactionListTests.checkInitialState },
            { action: TransactionListTests.goToNextPage },
            { action: TransactionListTests.setDetailsMode },
            { action: TransactionListTests.goToNextPage },
        ]);

        const toggleSelectData = [
            0,
            [1, 2],
        ];

        await this.runner.runGroup(TransactionListTests.toggleSelect, toggleSelectData);

        await this.runner.runGroup(TransactionListTests.filterByType, availTransTypes);

        await this.runner.runTasks([{
            action: TransactionListTests.filterByAccounts,
            data: data.accounts[2],
        }, {
            action: TransactionListTests.filterByAccounts,
            data: [data.accounts[2], data.accounts[3]],
        }, {
            action: TransactionListTests.filterByType,
            data: 0,
        }, {
            action: TransactionListTests.filterByType,
            data: EXPENSE,
        }, {
            action: TransactionListTests.filterByType,
            data: [INCOME, DEBT],
        }, {
            action: TransactionListTests.filterByDate,
            data: { start: App.dates.weekAgo, end: App.dates.now },
        },
        {
            action: TransactionListTests.filterByDate,
            data: { start: App.dates.yearAgo, end: App.dates.monthAgo },
        }]);

        const searchData = [
            '1',
            'la',
            'кк',
        ];

        await this.runner.runGroup(TransactionListTests.search, searchData);
    }

    async deleteTransactionTests() {
        this.environment.setBlock('Delete transaction', 1);

        await this.runDeleteExpenseTests();
        await this.runDeleteIncomeTests();
        await this.runDeleteTransferTests();
        await this.runDeleteDebtTests();

        await this.runDeleteFromUpdateTests();
    }

    async runCreateExpenseTests() {
        this.environment.setBlock('Create expense transactions', 1);

        const { RUB, KRW } = this;
        const data = [{
            fromAccount: 0,
            destAmount: '123.7801',
            comment: 'buy',
        }, {
            fromAccount: 3,
            srcAmount: '100',
            destAmount: '7013.21',
            destCurr: RUB,
        }, {
            fromAccount: 1,
            destAmount: '0.01',
            date: App.dates.yesterday,
        }, {
            fromAccount: 1,
            srcAcc: 4,
            destAmount: '99.99',
            date: App.dates.monthAgo,
        }, {
            // Try to submit expense with invalid amount
            fromAccount: 0,
            destAmount: '',
        }, {
            fromAccount: 1,
            destAmount: '1',
            destCurr: KRW,
            srcAmount: '',
        }, {
            // Try to submit expense with invalid date
            fromAccount: 0,
            destAmount: '100',
            date: '01.01.69',
        }];

        await this.runner.runGroup(ExpenseTransactionTests.create, data);
    }

    async runCreateIncomeTests() {
        this.environment.setBlock('Create income transactions', 1);

        const { USD, KRW } = this;
        const data = [{
            fromAccount: 0,
            srcAmount: '10023.7801',
            date: App.dates.yesterday,
            comment: 'some income',
        }, {
            fromAccount: 3,
            srcAmount: '7013.21',
            destAmount: '100',
            srcCurr: USD,
        }, {
            fromAccount: 1,
            srcAmount: '0.01',
            date: App.dates.weekAgo,
        }, {
            fromAccount: 1,
            destAcc: 4,
            srcAmount: '99.99',
            date: App.dates.monthAgo,
        }, {
            // Try to submit income with invalid amount
            fromAccount: 0,
            srcAmount: '',
        }, {
            fromAccount: 1,
            srcAmount: '1',
            srcCurr: KRW,
            destAmount: '',
        },
        // Try to submit income with invalid date
        {
            fromAccount: 0,
            srcAmount: '100',
            date: '0921-dd.0',
        }];

        await this.runner.runGroup(IncomeTransactionTests.create, data);
    }

    async runCreateTransferTests() {
        this.environment.setBlock('Create transfer transactions', 1);

        const data = [{
            srcAmount: '1000',
            comment: 'xxxx 1234 ц',
        }, {
            destAcc: 2,
            srcAmount: '11.4',
            destAmount: '10',
        }, {
            srcAcc: 1,
            destAcc: 3,
            srcAmount: '5.0301',
            destAmount: '4.7614',
        }, {
            srcAcc: 2,
            srcAmount: '10',
            destAmount: '9.75',
        }, {
            destAcc: 3,
            srcAmount: '10',
            destAmount: '9.50',
        }, {
            // Try to submit transfer with invalid amount
            srcAmount: '',
        }, {
            destAcc: 2,
            srcAmount: '11.4',
            destAmount: '',
        }, {
            // Try to submit transfer with invalid date
            srcAmount: '100',
            date: '',
        }];

        await this.runner.runGroup(TransferTransactionTests.create, data);
    }

    async runCreateDebtTests() {
        this.environment.setBlock('Create debt transactions', 1);

        const data = [{
            srcAmount: '1000',
        }, {
            debtType: false,
            acc: 2,
            srcAmount: '200',
            date: App.dates.weekAgo,
        }, {
            debtType: true,
            acc: 3,
            srcAmount: '100.0101',
        }, {
            debtType: false,
            person: 1,
            acc: 3,
            srcAmount: '10',
            date: App.dates.yesterday,
        }, {
            acc: null,
            srcAmount: '105',
            date: App.dates.yesterday,
        }, {
            debtType: false,
            person: 1,
            acc: null,
            srcAmount: '105',
        }, {
            // Try to submit debt with invalid amount
            srcAmount: '',
        }, {
            // Try to submit debt with invalid date
            srcAmount: '100',
            date: '0921-dd.0',
        }];

        await this.runner.runGroup(DebtTransactionTests.create, data);
    }

    async runUpdateExpenseTests() {
        this.environment.setBlock('Update expense transactions', 2);

        const { RUB } = this;
        const data = [{
            pos: 3,
            destAmount: '124.7701',
        }, {
            pos: 0,
            srcAmount: '101',
            destAmount: '7065.30',
            destCurr: RUB,
        }, {
            pos: 2,
            destAmount: '0.02',
            date: App.dates.weekAgo,
        }, {
            pos: 3,
            srcAcc: 3,
            destAmount: '99.9',
            date: App.dates.yesterday,
        }];

        await this.runner.runGroup(ExpenseTransactionTests.update, data);
    }

    async runUpdateIncomeTests() {
        this.environment.setBlock('Update income transactions', 2);

        const { RUB } = this;
        const data = [{
            pos: 1,
            srcAmount: '100.001',
            date: App.dates.weekAgo,
        }, {
            pos: 2,
            srcAmount: '0.02',
        }, {
            pos: 0,
            srcAmount: '7065.30',
            destAmount: '101',
            srcCurr: RUB,
        }, {
            pos: 3,
            destAcc: 3,
            srcAmount: '99.9',
        }];

        await this.runner.runGroup(IncomeTransactionTests.update, data);
    }

    async runUpdateTransferTests() {
        this.environment.setBlock('Update transfer transactions', 2);

        const data = [{
            pos: 0,
            destAcc: 0,
            srcAmount: '11',
        }, {
            pos: 1,
            srcAcc: 2,
            srcAmount: '100',
            destAmount: '97.55',
        }, {
            pos: 2,
            srcAcc: 3,
            srcAmount: '5.0301',
        }, {
            pos: 3,
            srcAcc: 0,
            srcAmount: '50',
            destAmount: '0.82',
        }, {
            pos: 4,
            srcAmount: '1050.01',
        }];

        await this.runner.runGroup(TransferTransactionTests.update, data);
    }

    async runUpdateDebtTests() {
        this.environment.setBlock('Update debt transactions', 2);

        const data = [{
            pos: 0,
            person: 0,
            srcAmount: '105',
        }, {
            pos: 3,
            acc: 1,
            srcAmount: '105',
            date: App.dates.now,
        }, {
            pos: 4,
            debtType: true,
            srcAmount: '10',
        }, {
            pos: 1,
            debtType: false,
            acc: 2,
            srcAmount: '200.0202',
            date: App.dates.monthAgo,
        }, {
            pos: 5,
            acc: null,
            srcAmount: '200',
        }, {
            pos: 2,
            srcAmount: '1001',
            date: App.dates.weekAgo,
        }];

        await this.runner.runGroup(DebtTransactionTests.update, data);
    }

    async runDeleteExpenseTests() {
        this.environment.setBlock('Delete expense transactions', 2);

        const data = [
            [0],
            [0, 1, 11, 13],
        ];

        await this.runner.runGroup(TransactionTests.del.bind(null, EXPENSE), data);
    }

    async runDeleteIncomeTests() {
        this.environment.setBlock('Delete income transactions', 2);

        const data = [
            [0],
            [0, 1, 2, 15],
        ];

        await this.runner.runGroup(TransactionTests.del.bind(null, INCOME), data);
    }

    async runDeleteTransferTests() {
        this.environment.setBlock('Delete transfer transactions', 2);

        const data = [
            [1],
            [0, 2],
        ];

        await this.runner.runGroup(TransactionTests.del.bind(null, TRANSFER), data);
    }

    async runDeleteDebtTests() {
        this.environment.setBlock('Delete debt transactions', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await this.runner.runGroup(TransactionTests.del.bind(null, DEBT), data);
    }

    async runDeleteFromUpdateTests() {
        this.environment.setBlock('Delete from update view tests', 2);

        const tasks = [{
            action: TransactionTests.delFromUpdate.bind(null, DEBT),
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

    async importTests() {
        this.environment.setBlock('Import', 1);

        const accIndexes = App.state.getAccountIndexesByNames([
            'acc_3', 'acc RUB', 'acc USD', 'acc EUR',
        ]);
        [
            this.ACC_3,
            this.ACC_RUB,
            this.ACC_USD,
            this.ACC_EUR,
        ] = App.state.getAccountsByIndexes(accIndexes);
        const personIndexes = App.state.getPersonIndexesByNames([
            'Maria', 'Alex',
        ]);
        [this.MARIA, this.ALEX] = App.state.getPersonsByIndexes(personIndexes);

        await ImportTests.checkInitialState();
        await this.runImportRuleTests();
        await this.runCreateImportItemTests();

        // Upload CSV file
        this.environment.setBlock('Upload CSV', 2);
        await ImportTests.uploadFile({
            filename: this.uploadFilename,
            data: this.csvStatement,
        });

        await this.runImportTemplateTests();

        // Submit converted transactions
        await ImportTests.submitUploaded({ data: this.csvStatement, account: this.ACC_RUB });

        // Disable all items except 0 and 1
        await ImportTests.enableItems({
            index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            value: false,
        });
        await this.runDeleteImportItemTests();
        await this.runSubmitImportTests();
        await this.runImportItemStateLoop();
    }

    async runSubmitImportTests() {
        await ImportTests.submit();
        // Verify submit is disabled for empty list
        this.environment.setBlock('Verify submit is disabled for empty list', 2);
        await ImportTests.submit();
        // Verify submit is disabled for list with no enabled items
        this.environment.setBlock('Verify submit is disabled for list with no enabled items', 2);
        await ImportTests.uploadFile({
            filename: this.uploadFilename,
            data: this.csvStatement,
        });
        await ImportTests.submitUploaded({
            data: this.csvStatement,
            template: 0,
        });
        await ImportTests.enableItems({
            index: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            value: false,
        });
        await ImportTests.submit();
    }

    async runCreateImportItemTests() {
        this.environment.setBlock('Add item', 2);

        await ImportTests.addItem();
        await ImportTests.updateItem({
            pos: 0,
            action: [
                { action: 'inputAmount', data: '1' },
                { action: 'inputDate', data: App.dates.now },
            ],
        });
    }

    async runDeleteImportItemTests() {
        await ImportTests.deleteItems([3, 5]);
    }

    async runImportItemStateLoop() {
        const { RUB, USD } = this;

        this.environment.setBlock('Import item state loop', 2);

        await ImportTests.changeMainAccount(this.ACC_3);
        // Enable all items
        await ImportTests.enableItems({
            index: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            value: true,
        });
        await ImportTests.updateItem({
            pos: 0,
            action: [
                { action: 'changeCurrency', data: USD }, // 1-2
                { action: 'changeCurrency', data: RUB }, // 2-1
                { action: 'changeType', data: 'income' }, // 1-3
                { action: 'changeType', data: 'expense' }, // 3-1
                { action: 'changeType', data: 'transferfrom' }, // 1-5
                { action: 'changeType', data: 'expense' }, // 5-1
                { action: 'changeType', data: 'transferto' }, // 1-7
                { action: 'changeType', data: 'expense' }, // 7-1
                { action: 'changeType', data: 'debtfrom' }, // 1-9
                { action: 'changeType', data: 'expense' }, // 9-1
                { action: 'changeType', data: 'debtto' }, // 1-10
                { action: 'changeType', data: 'expense' }, // 10-1
                { action: 'changeType', data: 'income' }, // 1-3
                { action: 'changeCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'expense' }, // 4-2
                { action: 'changeType', data: 'income' }, // 2-4
                { action: 'changeCurrency', data: RUB }, // 4-3
                { action: 'changeType', data: 'transferfrom' }, // 3-5
                { action: 'changeType', data: 'income' }, // 5-3
                { action: 'changeType', data: 'transferto' }, // 3-7
                { action: 'changeType', data: 'income' }, // 7-3
                { action: 'changeType', data: 'debtfrom' }, // 3-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeType', data: 'debtto' }, // 3-10
                { action: 'changeType', data: 'income' }, // 10-3
                { action: 'changeCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'expense' }, // 4-2
                { action: 'changeType', data: 'transferfrom' }, // 2-5
                { action: 'changeType', data: 'transferto' }, // 5-7
                { action: 'changeType', data: 'transferfrom' }, // 7-5
                { action: 'changeType', data: 'debtfrom' }, // 5-9
                { action: 'changeType', data: 'transferfrom' }, // 9-5
                { action: 'changeType', data: 'debtto' }, // 5-10
                { action: 'changeType', data: 'transferfrom' }, // 10-5
                { action: 'changeType', data: 'expense' }, // 5-1
                { action: 'changeCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'transferto' }, // 2-7
                { action: 'changeType', data: 'debtfrom' }, // 7-9
                { action: 'changeType', data: 'transferto' }, // 9-7
                { action: 'changeType', data: 'debtto' }, // 7-10
                { action: 'changeType', data: 'income' }, // 10-3
                { action: 'changeCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'transferfrom' }, // 4-5
                { action: 'changeDestAccount', data: this.ACC_USD }, // 5-6
                { action: 'changeType', data: 'expense' }, // 6-1
                { action: 'changeType', data: 'transferfrom' }, // 1-5
                { action: 'changeDestAccount', data: this.ACC_USD }, // 5-6
                { action: 'changeType', data: 'income' }, // 6-3
                { action: 'changeType', data: 'transferfrom' }, // 3-5
                { action: 'changeDestAccount', data: this.ACC_USD }, // 5-6
                { action: 'changeDestAccount', data: this.ACC_RUB }, // 6-5
                { action: 'changeDestAccount', data: this.ACC_USD }, // 5-6
                { action: 'changeType', data: 'transferto' }, // 6-8
                { action: 'changeType', data: 'expense' }, // 8-1
                { action: 'changeType', data: 'transferto' }, // 1-7
                { action: 'changeDestAccount', data: this.ACC_USD }, // 7-8
                { action: 'changeType', data: 'income' }, // 8-3
                { action: 'changeCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'transferto' }, // 4-7
                { action: 'changeDestAccount', data: this.ACC_USD }, // 7-8
            ],
        });

        /** Prepare items of all states */
        await ImportTests.updateItem({
            pos: 1,
            action: [
                { action: 'changeCurrency', data: USD }, // 1-2
                { action: 'inputDestAmount', data: '50.03' },
            ],
        });
        await ImportTests.updateItem({
            pos: 2,
            action: { action: 'changeType', data: 'income' }, // 1-3
        });
        await ImportTests.updateItem({
            pos: 3,
            action: [
                { action: 'changeCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'income' }, // 2-4
                { action: 'inputDestAmount', data: '500' },
            ],
        });
        await ImportTests.updateItem({
            pos: 4,
            action: { action: 'changeType', data: 'transferfrom' }, // 1-5
        });
        await ImportTests.updateItem({
            pos: 5,
            action: [
                { action: 'changeType', data: 'transferfrom' }, // 1-5
                { action: 'changeDestAccount', data: this.ACC_USD }, // 5-6
                { action: 'inputDestAmount', data: '50.03' },
            ],
        });
        await ImportTests.updateItem({
            pos: 6,
            action: { action: 'changeType', data: 'transferto' }, // 1-7
        });
        await ImportTests.updateItem({
            pos: 7,
            action: [
                { action: 'changeType', data: 'debtfrom' }, // 1-9
                { action: 'changePerson', data: this.ALEX },
            ],
        });
        await ImportTests.updateItem({
            pos: 8,
            action: { action: 'changeType', data: 'debtto' }, // 1-10
        });
        await ImportTests.changeMainAccount(this.ACC_EUR);
        await ImportTests.updateItem({
            pos: 0,
            action: { action: 'changeDestAccount', data: this.ACC_3 }, // 8-8
        });
        await ImportTests.changeMainAccount(this.ACC_3); // for item 0: 8-7
        await ImportTests.updateItem({
            pos: 0,
            action: [
                { action: 'changeDestAccount', data: this.ACC_USD }, // 7-8
                { action: 'changeType', data: 'transferfrom' }, // 8-6
                { action: 'changeType', data: 'debtfrom' }, // 6-9
                { action: 'changeType', data: 'debtto' }, // 9-10
                { action: 'changeType', data: 'transferto' }, // 10-7
                { action: 'changeDestAccount', data: this.ACC_USD }, // 7-8
                { action: 'changeType', data: 'debtfrom' }, // 8-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'debtfrom' }, // 4-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'debtto' }, // 4-10
                { action: 'changeType', data: 'debtfrom' }, // 10-9
                { action: 'changeType', data: 'transferfrom' }, // 9-5
                { action: 'changeDestAccount', data: this.ACC_USD }, // 5-6
                { action: 'changeType', data: 'debtto' }, // 6-10
                { action: 'changeType', data: 'transferto' }, // 10-7
                { action: 'changeDestAccount', data: this.ACC_USD }, // 7-8
                { action: 'changeType', data: 'debtto' }, // 8-10
                { action: 'changeType', data: 'expense' }, // 10-1
                { action: 'changeCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'debtfrom' }, // 2-9
                { action: 'changeType', data: 'expense' }, // 9-1
                { action: 'changeCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'debtto' }, // 2-10
            ],
        });

        await ImportTests.updateItem({
            pos: 7,
            action: { action: 'changePerson', data: this.MARIA },
        });

        await ImportTests.submit();
    }

    // Import templates
    async runImportTemplateTests() {
        await this.runCreateImportTemplateTests();
        await this.runUpdateImportTemplateTests();
        await this.runDeleteImportTemplateTests();
    }

    // Create import template tests
    async runCreateImportTemplateTests() {
        this.environment.setBlock('Create import template', 2);
        // Select columns for template
        await this.runner.runGroup(ImportTests.selectTemplateColumn, [
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
        await this.runner.runGroup(ImportTests.selectTemplateColumn, [
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
    async runUpdateImportTemplateTests() {
        this.environment.setBlock('Update import template', 2);

        await ImportTests.selectTemplateByIndex(0);
        await ImportTests.updateTemplate();
        await ImportTests.inputTemplateName('Template_2');
        await this.runner.runGroup(ImportTests.selectTemplateColumn, [
            { column: 'transactionAmount', index: 11 },
            { column: 'transactionCurrency', index: 10 },
        ]);
        await ImportTests.submitTemplate();
    }

    // Delete import template tests
    async runDeleteImportTemplateTests() {
        this.environment.setBlock('Delete import template', 2);

        await ImportTests.selectTemplateByIndex(0);
        await ImportTests.deleteTemplate();
    }

    // Import rules
    async runImportRuleTests() {
        this.environment.setBlock('Import rules', 1);
        await ImportTests.openRulesDialog();

        await this.runImportRuleValidationTests();
        await this.runCreateImportRuleTests();
        await this.runUpdateImportRuleTests();
        await this.runDeleteImportRuleTests();

        await ImportTests.closeRulesDialog();
    }

    // Import rule validation tests
    async runImportRuleValidationTests() {
        this.environment.setBlock('Import rule validation', 1);

        this.environment.setBlock('Submit empty rule', 2);
        await ImportTests.createRule();
        await ImportTests.submitRule();

        this.environment.setBlock('Submit rule without actions', 2);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'Bank Name' },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Submit condition with empty amount', 2);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: 'Ba' },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
        ]);
        await ImportTests.submitRule();
        await ImportTests.updateRuleCondition({
            pos: 1,
            action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
        });
        await ImportTests.submitRule();

        this.environment.setBlock('Submit condition with zero amount', 2);
        await ImportTests.updateRuleCondition({
            pos: 1,
            action: { action: 'inputAmount', data: '00.0' },
        });
        await ImportTests.submitRule();
        await ImportTests.updateRuleCondition({
            pos: 1,
            action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
        });
        await ImportTests.submitRule();

        this.environment.setBlock('Submit condition with negative amount', 2);
        await ImportTests.updateRuleCondition({
            pos: 1,
            action: { action: 'inputAmount', data: '-100.0' },
        });
        await ImportTests.submitRule();
        await ImportTests.updateRuleCondition({
            pos: 1,
            action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
        });
        await ImportTests.submitRule();

        this.environment.setBlock('Submit duplicate conditions', 2);
        await ImportTests.updateRuleCondition({
            pos: 1,
            action: [
                { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
                { action: 'inputAmount', data: '100.01' },
            ],
        });
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
            { action: 'inputAmount', data: '99.99' },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Submit conditions with non-intersecting value regions', 2);
        await ImportTests.updateRuleCondition({
            pos: 2,
            action: { action: 'changeOperator', data: IMPORT_COND_OP_LESS },
        });
        await ImportTests.submitRule();
        await ImportTests.updateRuleCondition({
            pos: 2,
            action: { action: 'inputAmount', data: '999.99' },
        });
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_NOT_EQUAL },
            { action: 'inputAmount', data: '5' },
        ]);
        await ImportTests.submitRule();
        await ImportTests.deleteRuleCondition(3);

        this.environment.setBlock('Submit duplicate actions', 2);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: 'New comment' },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Submit empty amount action', 2);
        await ImportTests.updateRuleAction({
            pos: 1,
            action: { action: 'changeAction', data: IMPORT_ACTION_SET_SRC_AMOUNT },
        });
        await ImportTests.submitRule();
        await ImportTests.updateRuleAction({
            pos: 1,
            action: { action: 'changeAction', data: IMPORT_ACTION_SET_DEST_AMOUNT },
        });
        await ImportTests.submitRule();

        this.environment.setBlock('Submit zero amount action', 2);
        await ImportTests.updateRuleAction({
            pos: 1,
            action: { action: 'inputAmount', data: '0.' },
        });
        await ImportTests.submitRule();
        await ImportTests.updateRuleAction({
            pos: 1,
            action: { action: 'changeAction', data: IMPORT_ACTION_SET_SRC_AMOUNT },
        });
        await ImportTests.submitRule();

        this.environment.setBlock('Submit negative amount action', 2);
        await ImportTests.updateRuleAction({
            pos: 1,
            action: { action: 'inputAmount', data: '-10.' },
        });
        await ImportTests.submitRule();
        await ImportTests.updateRuleAction({
            pos: 1,
            action: { action: 'changeAction', data: IMPORT_ACTION_SET_DEST_AMOUNT },
        });
        await ImportTests.submitRule();
        await ImportTests.deleteRuleAction(1);

        this.environment.setBlock('Submit rule without conditions', 2);
        await ImportTests.deleteRuleCondition(2);
        await ImportTests.deleteRuleCondition(1);
        await ImportTests.deleteRuleCondition(0);
        await ImportTests.submitRule();

        this.environment.setBlock('Submit `Comment includes` condition with empty value', 2);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Submit date condition with empty value', 2);
        await ImportTests.updateRuleCondition({
            pos: 0,
            action: [
                { action: 'changeFieldType', data: IMPORT_COND_FIELD_DATE },
                { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
            ],
        });

        this.environment.setBlock('Submit Date condition with invalid value', 2);
        await ImportTests.updateRuleCondition({
            pos: 0,
            action: { action: 'inputValue', data: '01xx' },
        });
        await ImportTests.submitRule();

        await ImportTests.cancelRule();
    }

    // Create import rule tests
    async runCreateImportRuleTests() {
        this.environment.setBlock('Create import rules', 1);

        this.environment.setBlock('Create import rule #1', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'MOBILE' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'income' },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Create import rule #2', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
            { action: 'inputAmount', data: '80' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'transferfrom' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
            { action: 'changeAccount', data: this.ACC_EUR },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Create import rule #3', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'SIGMA' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'transferto' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
            { action: 'changeAccount', data: this.ACC_USD },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: 'Local shop' },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Create import rule #4', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'TAXI' },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
            { action: 'inputAmount', data: '100' },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_LESS },
            { action: 'inputAmount', data: '500' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'debtfrom' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
            { action: 'changePerson', data: this.MARIA },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: '' },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Create import rule #5', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'MAGAZIN' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'debtto' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
            { action: 'changePerson', data: this.ALEX },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Create import rule #6', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'AMSTERDAM' },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'BOOKING' },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_NOT_EQUAL },
            { action: 'togglePropValue' },
            { action: 'changeProperty', data: IMPORT_COND_FIELD_TR_AMOUNT },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: 'Hotel, Booking' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_DEST_AMOUNT },
            { action: 'inputAmount', data: '500.5' },
        ]);
        await ImportTests.submitRule();
    }

    // Update import rule tests
    async runUpdateImportRuleTests() {
        this.environment.setBlock('Update import rules', 1);

        this.environment.setBlock('Update import rule #1', 2);
        await ImportTests.updateRule(0);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_MAIN_ACCOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
            { action: 'changeAccount', data: this.ACC_3 },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: 'Mobile' },
        ]);
        await ImportTests.submitRule();

        this.environment.setBlock('Update import rule #4', 2);
        await ImportTests.updateRule(3);
        await ImportTests.updateRuleCondition({
            pos: 1,
            action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
        });
        await ImportTests.updateRuleCondition({
            pos: 2,
            action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
        });
        await ImportTests.updateRuleAction({
            pos: 2,
            action: { action: 'inputValue', data: 'Taxi for Maria' },
        });
        await ImportTests.submitRule();

        this.environment.setBlock('Update import rule #6', 2);
        await ImportTests.updateRule(5);
        await ImportTests.deleteRuleCondition(0);
        await ImportTests.deleteRuleAction(0);
        await ImportTests.submitRule();
    }

    // Delete import rule tests
    async runDeleteImportRuleTests() {
        this.environment.setBlock('Delete import rules', 1);
        // Delete rule #3
        await ImportTests.deleteRule(2);
    }
}
