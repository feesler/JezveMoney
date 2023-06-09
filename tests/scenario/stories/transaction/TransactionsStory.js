import { assert, setBlock, TestStory } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
    Transaction,
} from '../../../model/Transaction.js';
import { api } from '../../../model/api.js';
import { App } from '../../../Application.js';
import * as Actions from '../../actions/transaction.js';
import * as expenseActions from './expense.js';
import * as incomeActions from './income.js';
import * as transferActions from './transfer.js';
import * as debtActions from './debt.js';
import * as creditLimitActions from './creditLimit.js';
import * as accountActions from '../../actions/account.js';
import { testLocales } from '../../actions/locale.js';
import { testDateLocales, testDecimalLocales } from '../../actions/settings.js';

export class TransactionsStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
        });

        await App.scenario.createAccounts();
        await App.scenario.createPersons();
        await App.scenario.createCategories();
    }

    async run() {
        setBlock('Transactions', 1);

        await Actions.securityTests();
        await this.stateLoops();
        await this.create();
        await this.update();
        await this.updateFromMainView();
        await this.setCategoryFromMainView();
        await this.locales();
        await this.deleteFromContextMenu();
        await this.del();
        await this.deleteFromUpdate();
        await this.deleteFromMainView();
        await this.createFromPersonAccount();
        await this.noAccountURL();
        await this.availability(false);
        await this.availability(true);
    }

    async stateLoops() {
        setBlock('Transaction view state loops', 1);

        await expenseActions.stateLoop();
        await incomeActions.stateLoop();
        await transferActions.stateLoop();
        await debtActions.stateLoop();
        await creditLimitActions.stateLoop();

        await this.typeChangeLoop();
    }

    async create() {
        setBlock('Create transaction', 1);

        await this.createExpense();
        await this.createIncome();
        await this.createTransfer();
        await this.createDebt();
        await this.createLimitChange();
    }

    async update() {
        setBlock('Update transaction', 1);

        await this.updateExpense();
        await this.updateIncome();
        await this.updateTransfer();
        await this.updateDebt();
        await this.updateLimitChange();
    }

    async del() {
        setBlock('Delete transaction', 1);

        await this.deleteExpense();
        await this.deleteIncome();
        await this.deleteTransfer();
        await this.deleteDebt();
        await this.deleteLimitChange();
    }

    async createExpense() {
        setBlock('Create expense transactions', 1);
        const {
            FOOD_CATEGORY,
            TRANSPORT_CATEGORY,
            RUB,
            KRW,
            CARD_RUB,
            HIDDEN_ACC,
        } = App.scenario;

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'inputDestAmount', data: '123.7801' },
            { action: 'changeCategory', data: FOOD_CATEGORY },
            { action: 'inputComment', data: 'buy' },
        ]);

        await Actions.createFromAccountAndSubmit(3, [
            { action: 'changeDestCurrency', data: RUB },
            { action: 'inputDestAmount', data: '7013.21' },
            { action: 'inputSrcAmount', data: '100' },
            { action: 'changeCategory', data: TRANSPORT_CATEGORY },
        ]);

        await Actions.createFromAccountAndSubmit(1, [
            { action: 'inputDestAmount', data: '0.01' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.yesterday) },
        ]);

        await Actions.createFromAccountAndSubmit(1, [
            { action: 'changeSrcAccount', data: CARD_RUB },
            { action: 'inputDestAmount', data: '99.99' },
            { action: 'selectDate', data: App.dates.monthAgo },
        ]);

        // Check create transaction with hidden account
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeSrcAccount', data: HIDDEN_ACC },
            { action: 'inputDestAmount', data: '0.01' },
        ]);

        // Try to submit expense with invalid destination amount
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'inputDestAmount', data: '' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'inputDestAmount', data: '-100' },
        ]);

        // Check invalidated destination amount field is shown on submit
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'inputDestAmount', data: '' },
            { action: 'clickSrcResultBalance' },
        ]);

        // Try to submit expense with invalid source amount
        await Actions.createFromAccountAndSubmit(1, [
            { action: 'changeDestCurrency', data: KRW },
            { action: 'inputDestAmount', data: '1' },
            { action: 'inputSrcAmount', data: '' },
        ]);

        await Actions.createFromAccountAndSubmit(1, [
            { action: 'changeDestCurrency', data: KRW },
            { action: 'inputDestAmount', data: '1' },
            { action: 'inputSrcAmount', data: '-100' },
        ]);

        // Check invalidated source amount field is shown on submit
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeDestCurrency', data: KRW },
            { action: 'inputDestAmount', data: '1' },
            { action: 'inputSrcAmount', data: '' },
            { action: 'clickExchRate' },
        ]);

        // Try to submit expense with invalid date
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'inputDestAmount', data: '100' },
            { action: 'inputDate', data: '' },
        ]);
    }

    async createIncome() {
        setBlock('Create income transactions', 1);

        const {
            USD,
            KRW,
            CARD_RUB,
            HIDDEN_ACC,
            INVEST_CATEGORY,
        } = App.scenario;

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '10023.7801' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.yesterday) },
            { action: 'inputComment', data: 'some income' },
        ]);

        await Actions.createFromAccountAndSubmit(3, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeSourceCurrency', data: USD },
            { action: 'inputSrcAmount', data: '7013.21' },
            { action: 'inputDestAmount', data: '100' },
            { action: 'changeCategory', data: INVEST_CATEGORY },
        ]);

        await Actions.createFromAccountAndSubmit(1, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '0.01' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.weekAgo) },
            { action: 'changeCategory', data: INVEST_CATEGORY },
        ]);

        await Actions.createFromAccountAndSubmit(1, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeDestAccount', data: CARD_RUB },
            { action: 'inputSrcAmount', data: '99.99' },
            { action: 'selectDate', data: App.dates.monthAgo },
        ]);

        // Check create transaction with hidden account
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeDestAccount', data: HIDDEN_ACC },
            { action: 'inputSrcAmount', data: '0.01' },
        ]);

        // Try to submit income with invalid source amount
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '-100' },
        ]);

        // Check invalidated source amount field is shown on submit
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '' },
            { action: 'clickDestResultBalance' },
        ]);

        // Try to submit income with invalid destination amount
        await Actions.createFromAccountAndSubmit(1, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeSourceCurrency', data: KRW },
            { action: 'inputSrcAmount', data: '1' },
            { action: 'inputDestAmount', data: '' },
        ]);

        await Actions.createFromAccountAndSubmit(1, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeSourceCurrency', data: KRW },
            { action: 'inputSrcAmount', data: '1' },
            { action: 'inputDestAmount', data: '-100' },
        ]);

        // Check invalidated destination amount field is shown on submit
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeSourceCurrency', data: KRW },
            { action: 'inputSrcAmount', data: '1' },
            { action: 'inputDestAmount', data: '' },
            { action: 'clickExchRate' },
        ]);

        // Try to submit income with invalid date
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '100' },
            { action: 'inputDate', data: '' },
        ]);
    }

    async createTransfer() {
        setBlock('Create transfer transactions', 1);

        const {
            ACC_RUB,
            ACC_USD,
            ACC_EUR,
            HIDDEN_ACC,
        } = App.scenario;

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'inputSrcAmount', data: '1000' },
            { action: 'inputComment', data: 'xxxx 1234 ц' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeDestAccount', data: ACC_USD },
            { action: 'inputSrcAmount', data: '11.4' },
            { action: 'inputDestAmount', data: '10' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeSrcAccount', data: ACC_RUB },
            { action: 'changeDestAccount', data: ACC_EUR },
            { action: 'inputSrcAmount', data: '5.0301' },
            { action: 'inputDestAmount', data: '4.7614' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeSrcAccount', data: ACC_USD },
            { action: 'inputSrcAmount', data: '10' },
            { action: 'inputDestAmount', data: '9.75' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeDestAccount', data: ACC_EUR },
            { action: 'inputSrcAmount', data: '10' },
            { action: 'inputDestAmount', data: '9.50' },
        ]);

        // Check create transaction with hidden account
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeSrcAccount', data: ACC_USD },
            { action: 'changeDestAccount', data: HIDDEN_ACC },
            { action: 'inputSrcAmount', data: '1' },
            { action: 'inputDestAmount', data: '75' },
        ]);

        // Try to submit transfer with invalid source amount
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'inputSrcAmount', data: '' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'inputSrcAmount', data: '-100' },
        ]);

        // Check invalidated source amount field is shown on submit
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'inputSrcAmount', data: '' },
            { action: 'clickDestResultBalance' },
        ]);

        // Try to submit transfer with invalid destination amount
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeDestAccount', data: ACC_USD },
            { action: 'inputSrcAmount', data: '11.4' },
            { action: 'inputDestAmount', data: '' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeDestAccount', data: ACC_USD },
            { action: 'inputSrcAmount', data: '11.4' },
            { action: 'inputDestAmount', data: '-100' },
        ]);

        // Check invalidated destination amount field is shown on submit
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeDestAccount', data: ACC_USD },
            { action: 'inputSrcAmount', data: '11.4' },
            { action: 'inputDestAmount', data: '' },
            { action: 'clickExchRate' },
        ]);

        // Try to submit transfer with invalid date
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeDestAccount', data: ACC_USD },
            { action: 'inputSrcAmount', data: '100' },
            { action: 'inputDate', data: '' },
        ]);
    }

    async createDebt() {
        setBlock('Create debt transactions', 1);

        const {
            USD,
            EUR,
            ACC_USD,
            ACC_EUR,
            HIDDEN_ACC,
            HIDDEN_PERSON,
        } = App.scenario;

        await Actions.createFromPersonAndSubmit(0, [
            { action: 'inputSrcAmount', data: '100' },
        ]);

        await Actions.createFromPersonAndSubmit(0, [
            { action: 'changeAccount', data: ACC_USD },
            { action: 'swapSourceAndDest' },
            { action: 'inputDestAmount', data: '100' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.weekAgo) },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: DEBT },
            { action: 'changeAccount', data: ACC_EUR },
            { action: 'inputDestAmount', data: '100.0101' },
        ]);

        await Actions.createFromPersonAndSubmit(1, [
            { action: 'changeAccount', data: ACC_EUR },
            { action: 'swapSourceAndDest' },
            { action: 'inputDestAmount', data: '10' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.yesterday) },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: DEBT },
            { action: 'toggleAccount' },
            { action: 'inputDestAmount', data: '105' },
            { action: 'selectDate', data: App.dates.yesterday },
        ]);

        await Actions.createFromPersonAndSubmit(1, [
            { action: 'toggleAccount' },
            { action: 'swapSourceAndDest' },
            { action: 'changeAccount', data: ACC_EUR },
            { action: 'inputDestAmount', data: '105' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.yesterday) },
        ]);

        await Actions.createFromPersonAndSubmit(0, [
            { action: 'changeSourceCurrency', data: USD },
            { action: 'inputSrcAmount', data: '10' },
            { action: 'inputDestAmount', data: '650' },
        ]);

        await Actions.createFromPersonAndSubmit(1, [
            { action: 'swapSourceAndDest' },
            { action: 'changeDestCurrency', data: EUR },
            { action: 'inputSrcAmount', data: '11.5' },
            { action: 'inputDestAmount', data: '714' },
        ]);

        await Actions.createFromPersonAndSubmit(0, [
            { action: 'toggleAccount' },
            { action: 'changeSourceCurrency', data: USD },
            { action: 'inputSrcAmount', data: '20' },
        ]);

        await Actions.createFromPersonAndSubmit(0, [
            { action: 'toggleAccount' },
            { action: 'swapSourceAndDest' },
            { action: 'changeDestCurrency', data: EUR },
            { action: 'inputDestAmount', data: '22.75' },
        ]);

        // Check create transaction with hidden person
        await Actions.createFromPersonAndSubmit(0, [
            { action: 'changePerson', data: HIDDEN_PERSON },
            { action: 'inputSrcAmount', data: '0.01' },
        ]);

        // Check create transaction with hidden account
        await Actions.createFromPersonAndSubmit(1, [
            { action: 'changeAccount', data: HIDDEN_ACC },
            { action: 'inputSrcAmount', data: '105' },
        ]);

        // Try to submit debt with invalid destination amount
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: DEBT },
            { action: 'inputDestAmount', data: '' },
        ]);

        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: DEBT },
            { action: 'inputDestAmount', data: '-100' },
        ]);

        // Check invalidated destination amount field is shown on submit
        await Actions.createFromAccountAndSubmit(0, [
            { action: 'changeTransactionType', data: DEBT },
            { action: 'inputDestAmount', data: '' },
            { action: 'clickDestResultBalance' },
        ]);

        // Try to submit debt with invalid source amount
        await Actions.createFromPersonAndSubmit(0, [
            { action: 'inputSrcAmount', data: '' },
        ]);

        await Actions.createFromPersonAndSubmit(0, [
            { action: 'inputSrcAmount', data: '-200' },
        ]);

        // Check invalidated source amount field is shown on submit
        await Actions.createFromPersonAndSubmit(0, [
            { action: 'inputSrcAmount', data: '' },
            { action: 'clickSrcResultBalance' },
        ]);

        // Try to submit debt with invalid date
        await Actions.createFromPersonAndSubmit(0, [
            { action: 'inputSrcAmount', data: '100' },
            { action: 'inputDate', data: '' },
        ]);
    }

    async createLimitChange() {
        setBlock('Create credit limit change transactions', 1);

        const {
            CREDIT_CARD,
        } = App.scenario;

        const accounts = App.state.getSortedUserAccounts();
        const index = accounts.getIndexById(CREDIT_CARD);
        assert(index !== -1, 'Account not found');

        await Actions.createFromAccountAndSubmit(index, [
            { action: 'changeTransactionType', data: LIMIT_CHANGE },
            { action: 'inputDestAmount', data: '10000' },
        ]);

        await Actions.createFromAccountAndSubmit(index, [
            { action: 'changeTransactionType', data: LIMIT_CHANGE },
            { action: 'inputDestAmount', data: '-5000' },
        ]);
    }

    async updateExpense() {
        setBlock('Update expense transactions', 2);

        const {
            USD,
            ACC_EUR,
            HIDDEN_ACC,
            CAFE_CATEGORY,
        } = App.scenario;

        await Actions.updateAndSubmit(EXPENSE, 3, [
            { action: 'inputDestAmount', data: '124.7701' },
            { action: 'changeCategory', data: CAFE_CATEGORY },
        ]);

        await Actions.updateAndSubmit(EXPENSE, 0, [
            { action: 'changeDestCurrency', data: USD },
            { action: 'inputDestAmount', data: '7065.30' },
            { action: 'inputSrcAmount', data: '101' },
        ]);

        await Actions.updateAndSubmit(EXPENSE, 2, [
            { action: 'inputDestAmount', data: '0.02' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.weekAgo) },
        ]);

        await Actions.updateAndSubmit(EXPENSE, 3, [
            { action: 'changeSrcAccount', data: ACC_EUR },
            { action: 'inputDestAmount', data: '99.9' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.yesterday) },
        ]);

        // Check update transaction with hidden account
        await Actions.updateAndSubmit(EXPENSE, 4, [
            { action: 'changeSrcAccount', data: HIDDEN_ACC },
            { action: 'inputDestAmount', data: '99.9' },
        ]);
    }

    async updateIncome() {
        setBlock('Update income transactions', 2);

        const {
            USD,
            ACC_EUR,
            HIDDEN_ACC,
            TAXES_CATEGORY,
        } = App.scenario;

        await Actions.updateAndSubmit(INCOME, 1, [
            { action: 'inputSrcAmount', data: '100.001' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.weekAgo) },
            { action: 'changeCategory', data: TAXES_CATEGORY },
        ]);

        await Actions.updateAndSubmit(INCOME, 2, [
            { action: 'inputSrcAmount', data: '0.02' },
        ]);

        await Actions.updateAndSubmit(INCOME, 0, [
            { action: 'changeSourceCurrency', data: USD },
            { action: 'inputSrcAmount', data: '7065.30' },
            { action: 'inputDestAmount', data: '101' },
        ]);

        await Actions.updateAndSubmit(INCOME, 3, [
            { action: 'changeDestAccount', data: ACC_EUR },
            { action: 'inputSrcAmount', data: '99.9' },
        ]);

        // Check update transaction with hidden account
        await Actions.updateAndSubmit(INCOME, 4, [
            { action: 'changeDestAccount', data: HIDDEN_ACC },
            { action: 'inputSrcAmount', data: '99.9' },
        ]);
    }

    async updateTransfer() {
        setBlock('Update transfer transactions', 2);

        const {
            ACC_3,
            ACC_USD,
            ACC_EUR,
            HIDDEN_ACC,
        } = App.scenario;

        await Actions.updateAndSubmit(TRANSFER, 0, [
            { action: 'changeDestAccount', data: ACC_3 },
            { action: 'inputSrcAmount', data: '11' },
        ]);

        await Actions.updateAndSubmit(TRANSFER, 1, [
            { action: 'changeSrcAccount', data: ACC_USD },
            { action: 'inputSrcAmount', data: '100' },
            { action: 'inputDestAmount', data: '97.55' },
        ]);

        await Actions.updateAndSubmit(TRANSFER, 2, [
            { action: 'changeSrcAccount', data: ACC_EUR },
            { action: 'inputSrcAmount', data: '5.0301' },
        ]);

        await Actions.updateAndSubmit(TRANSFER, 3, [
            { action: 'changeSrcAccount', data: ACC_3 },
            { action: 'inputSrcAmount', data: '50' },
            { action: 'inputDestAmount', data: '0.82' },
        ]);

        await Actions.updateAndSubmit(TRANSFER, 4, [
            { action: 'inputSrcAmount', data: '1050.01' },
        ]);

        // Check update transaction with hidden account
        await Actions.updateAndSubmit(TRANSFER, 5, [
            { action: 'changeSrcAccount', data: HIDDEN_ACC },
            { action: 'inputSrcAmount', data: '1000' },
        ]);
    }

    async updateDebt() {
        setBlock('Update debt transactions', 2);

        const {
            USD,
            ACC_RUB,
            ACC_USD,
            MARIA,
            HIDDEN_ACC,
            HIDDEN_PERSON,
        } = App.scenario;

        await Actions.updateAndSubmit(DEBT, 0, [
            { action: 'changePerson', data: MARIA },
            { action: 'inputSrcAmount', data: '105' },
        ]);

        await Actions.updateAndSubmit(DEBT, 3, [
            { action: 'changeAccount', data: ACC_RUB },
            { action: 'inputSrcAmount', data: '105' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.now) },
        ]);

        await Actions.updateAndSubmit(DEBT, 4, [
            { action: 'swapSourceAndDest' },
            { action: 'changeSourceCurrency', data: USD },
            { action: 'inputSrcAmount', data: '10' },
        ]);

        await Actions.updateAndSubmit(DEBT, 1, [
            { action: 'changeAccount', data: ACC_USD },
            { action: 'swapSourceAndDest' },
            { action: 'changeDestCurrency', data: USD },
            { action: 'inputDestAmount', data: '200.0202' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.monthAgo) },
        ]);

        await Actions.updateAndSubmit(DEBT, 6, [
            { action: 'toggleAccount' },
            { action: 'inputSrcAmount', data: '200' },
        ]);

        await Actions.updateAndSubmit(DEBT, 2, [
            { action: 'inputSrcAmount', data: '1001' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.weekAgo) },
        ]);

        // Check update transaction with hidden person
        await Actions.updateAndSubmit(DEBT, 0, [
            { action: 'changePerson', data: HIDDEN_PERSON },
            { action: 'inputSrcAmount', data: '105' },
        ]);

        // Check update transaction with hidden account
        await Actions.updateAndSubmit(DEBT, 1, [
            { action: 'changeAccount', data: HIDDEN_ACC },
            { action: 'inputDestAmount', data: '105' },
        ]);
    }

    async updateLimitChange() {
        setBlock('Update credit limit transactions', 2);

        await Actions.updateAndSubmit(LIMIT_CHANGE, 0, [
            { action: 'clickDestAmount' },
            { action: 'inputDestAmount', data: '100000' },
        ]);
        await Actions.updateAndSubmit(LIMIT_CHANGE, 1, [
            { action: 'clickDestAmount' },
            { action: 'inputDestAmount', data: '5000' },
            { action: 'changeDestAccount', data: App.scenario.BTC_CREDIT },
        ]);
    }

    async updateFromMainView() {
        setBlock('Update transactions from main view', 2);

        const { MARIA } = App.scenario;

        await Actions.updateFromMainViewAndSubmit(2, [
            { action: 'changePerson', data: MARIA },
            { action: 'inputSrcAmount', data: '105' },
        ]);

        await Actions.updateFromMainViewAndSubmit(4, [
            { action: 'inputSrcAmount', data: '555' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.yesterday) },
        ]);
    }

    async setCategoryFromMainView() {
        setBlock('Set transaction category from main view', 2);

        const { TAXES_CATEGORY } = App.scenario;

        const data = [
            { index: 0, category: TAXES_CATEGORY },
            { index: 2, category: 0 },
        ];

        return App.scenario.runner.runGroup(Actions.setTransactionCategory, data);
    }

    async deleteFromContextMenu() {
        setBlock('Delete transaction from context menu', 1);

        await Actions.deleteFromContextMenu(1);
    }

    async deleteExpense() {
        setBlock('Delete expense transactions', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup((items) => Actions.del(EXPENSE, items), data);
    }

    async deleteIncome() {
        setBlock('Delete income transactions', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup((items) => Actions.del(INCOME, items), data);
    }

    async deleteTransfer() {
        setBlock('Delete transfer transactions', 2);

        const data = [
            [1],
            [0, 2],
        ];

        await App.scenario.runner.runGroup((items) => Actions.del(TRANSFER, items), data);
    }

    async deleteDebt() {
        setBlock('Delete debt transactions', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup((items) => Actions.del(DEBT, items), data);
    }

    async deleteLimitChange() {
        setBlock('Delete credit limit transactions', 2);

        await Actions.del(LIMIT_CHANGE, [0]);
    }

    async deleteFromMainView() {
        setBlock('Delete transactions from main view', 2);

        const data = [
            0,
            1,
        ];

        await App.scenario.runner.runGroup(Actions.deleteFromMainView, data);
    }

    async typeChangeLoop() {
        setBlock('Change transaction type tests', 2);

        // Hide first account
        let userVisibleAccounts = App.state.accounts.getUserVisible();
        const account = userVisibleAccounts.getItemByIndex(0);
        await accountActions.hide(0);

        await App.goToMainView();
        await App.view.goToNewTransactionByAccount(0);

        const { CREDIT_CARD, CAFE_CATEGORY } = App.scenario;

        // Start from Expense type
        await Actions.runActions([
            // Select Expense category to check state on change type of transaction
            { action: 'changeCategory', data: CAFE_CATEGORY },
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeTransactionType', data: EXPENSE },
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeTransactionType', data: EXPENSE },
            { action: 'changeTransactionType', data: DEBT },
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeTransactionType', data: DEBT },
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeTransactionType', data: DEBT },
            // Disable account to check obtaining first visible account on switch to expense
            { action: 'toggleAccount' },
            { action: 'changeTransactionType', data: EXPENSE },
            { action: 'changeSrcAccount', data: CREDIT_CARD },
            { action: 'changeTransactionType', data: LIMIT_CHANGE },
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeTransactionType', data: LIMIT_CHANGE },
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'changeTransactionType', data: LIMIT_CHANGE },
            { action: 'changeTransactionType', data: DEBT },
            { action: 'changeTransactionType', data: LIMIT_CHANGE },
            { action: 'changeTransactionType', data: EXPENSE },
        ]);

        // Show previously hidden account
        userVisibleAccounts = App.state.accounts.getUserVisible();
        const userHiddenAccounts = App.state.accounts.getUserHidden();
        const index = userHiddenAccounts.getIndexById(account.id);
        await accountActions.show(userVisibleAccounts.length + index);
    }

    async deleteFromUpdate() {
        setBlock('Delete transaction from update view', 2);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(
            (pos) => Actions.delFromUpdate(DEBT, pos),
            data,
        );
    }

    async createFromPersonAccount() {
        setBlock('Create transaction from person account', 2);

        const { RUB } = App.scenario;

        // Remove all accounts and persons
        await api.profile.resetData({ accounts: true, persons: true });

        // Create user account
        const account = await api.account.create({
            name: 'Account 1',
            curr_id: RUB,
            initbalance: '1000',
            icon_id: 1,
        });
        // Create person
        const person = await api.person.create({
            name: 'Person 1',
        });
        // Create debt transaction to obtain account of person
        await api.transaction.create({
            type: DEBT,
            person_id: person.id,
            acc_id: account.id,
            op: 1,
            src_amount: 111,
            dest_amount: 111,
            src_curr: RUB,
            dest_curr: RUB,
            date: App.datesSec.now,
        });

        await App.state.fetch();
        const personAccount = App.state.getPersonAccount(person.id, RUB);

        const data = [
            { type: EXPENSE, accountId: personAccount.id },
            { type: INCOME, accountId: personAccount.id },
            { type: TRANSFER, accountId: personAccount.id },
            { type: DEBT, accountId: personAccount.id },
        ];
        await App.scenario.runner.runGroup(Actions.createFromPersonAccount, data);
    }

    async noAccountURL() {
        setBlock('Handling URL parameters', 1);

        await Actions.checkDebtNoAccountURL();
    }

    async locales() {
        setBlock('Transaction view locales', 1);

        await testLocales((locale) => this.checkLocale(locale));
        await testDateLocales(['es', 'ko'], (locale) => this.checkLocale(locale));
        await testDecimalLocales(['es', 'hi'], (locale) => this.checkLocale(locale));
    }

    async checkLocale(locale) {
        setBlock(`Locale: '${locale}'`, 1);

        const { CARD_RUB } = App.scenario;

        await Actions.createFromAccountAndSubmit(1, [
            { action: 'inputDestAmount', data: '0.01' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.yesterday) },
        ]);

        await Actions.createFromAccountAndSubmit(1, [
            { action: 'changeTransactionType', data: INCOME },
            { action: 'changeDestAccount', data: CARD_RUB },
            { action: 'inputSrcAmount', data: '99.99' },
            { action: 'selectDate', data: App.dates.monthAgo },
        ]);
    }

    async availability(directNavigate) {
        const { RUB } = App.scenario;

        const checkAvailable = (type) => (
            Actions.checkTransactionAvailable(type, directNavigate)
        );

        const navType = (directNavigate) ? 'direct' : 'manual';
        setBlock(`Transaction availability: ${navType} navigation`, 1);

        // Remove all accounts and persons
        await api.profile.resetData({ accounts: true, persons: true });

        // Create first account
        const { id: account1 } = await api.account.create({
            name: 'Account 1',
            curr_id: RUB,
            initbalance: '1',
            icon_id: 1,
        });
        await App.state.fetch();

        setBlock('1 account and no person', 2);
        // Only Expense and Income must be available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);

        if (!directNavigate) {
            // Navigate from not available Debt to available Expense
            await checkAvailable(EXPENSE);
            await checkAvailable(DEBT);
            // Navigate from not available Debt to available Income
            await checkAvailable(INCOME);
        }

        // Create second account
        const { id: account2 } = await api.account.create({
            name: 'Account 2',
            curr_id: RUB,
            initbalance: '2',
            icon_id: 1,
        });
        await App.state.fetch();

        setBlock('2 accounts and no person', 2);
        // Expense, Income and Transfer must be available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);

        if (!directNavigate) {
            // Navigate from not available Debt to available Transfer
            await Actions.checkTransactionAvailable(TRANSFER, directNavigate);
        }

        // Create person
        const { id: person1 } = await api.person.create({
            name: 'Person 1',
        });
        await App.state.fetch();

        setBlock('2 accounts and 1 person', 2);
        // All transaction types must be available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);

        // Hide first account
        await api.account.hide({ id: account1 });
        await App.state.fetch();

        setBlock('1 visible, 1 hidden account and 1 person', 2);
        // All transaction types must be available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);

        // Hide second account
        await api.account.hide({ id: account2 });
        await App.state.fetch();

        setBlock('2 hidden accounts and 1 person', 2);
        // All transaction types must be available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);

        // Remove account
        await api.account.show({ id: account1 });
        await api.account.del({ id: account2 });
        await App.state.fetch();

        setBlock('1 account and 1 person', 2);
        // Expense, Income and Debt must be available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);

        // Remove account
        await api.account.del({ id: account1 });
        await App.state.fetch();

        setBlock('No accounts and 1 person', 2);
        // Only Debt must be available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);

        // Hide person
        await api.person.hide({ id: person1 });
        await App.state.fetch();

        setBlock('No accounts and 1 hidden person', 2);
        // Only Debt must be available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);
        // Check state of Debt transaction after swap source and destination
        await Actions.runAction({ action: 'swapSourceAndDest' });

        // Remove person
        await api.person.del({ id: person1 });
        await App.state.fetch();

        setBlock('No accounts and no persons', 2);
        // Expected no transaction available
        await App.scenario.runner.runGroup(checkAvailable, Transaction.basicTypes);
    }
}
