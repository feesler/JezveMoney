import { setBlock, assert, TestStory } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    availTransTypes,
} from '../../../model/Transaction.js';
import { api } from '../../../model/api.js';
import * as TransactionTests from '../../../run/transaction/index.js';
import * as ExpenseTransactionTests from '../../../run/transaction/expense.js';
import * as IncomeTransactionTests from '../../../run/transaction/income.js';
import * as TransferTransactionTests from '../../../run/transaction/transfer.js';
import * as DebtTransactionTests from '../../../run/transaction/debt.js';
import * as AccountTests from '../../../run/account.js';
import { App } from '../../../Application.js';

import * as expenseTests from './expense.js';
import * as incomeTests from './income.js';
import * as transferTests from './transfer.js';
import * as debtTests from './debt.js';

export class TransactionsStory extends TestStory {
    async beforeRun() {
        const HIDDEN_ACCOUNT_NAME = 'HIDDEN_ACC';
        const HIDDEN_PERSON_NAME = 'Hidden person';

        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
        });

        await App.scenario.createAccounts();
        await App.scenario.createPersons();

        const [hiddenAccountInd] = App.state.getAccountIndexesByNames(HIDDEN_ACCOUNT_NAME);
        assert(hiddenAccountInd !== -1, `Account '${HIDDEN_ACCOUNT_NAME}' not found`);
        App.scenario.HIDDEN_ACCOUNT_IND = hiddenAccountInd;
        const [hiddenPersonInd] = App.state.getPersonIndexesByNames(HIDDEN_PERSON_NAME);
        assert(hiddenPersonInd !== -1, `Person '${HIDDEN_PERSON_NAME}' not found`);
        App.scenario.HIDDEN_PERSON_IND = hiddenPersonInd;
    }

    async run() {
        setBlock('Transactions', 1);

        await TransactionTests.securityTests();
        await this.stateLoops();
        await this.create();
        await this.update();
        await this.del();
        await this.deleteFromUpdate();
        await this.createFromPersonAccount();
        await this.availability(false);
        await this.availability(true);
    }

    async stateLoops() {
        setBlock('Transaction view state loops', 1);

        await expenseTests.stateLoop();
        await incomeTests.stateLoop();
        await transferTests.stateLoop();
        await debtTests.stateLoop();

        await this.typeChangeLoop();
    }

    async create() {
        setBlock('Create transaction', 1);

        await this.createExpense();
        await this.createIncome();
        await this.createTransfer();
        await this.createDebt();
    }

    async update() {
        setBlock('Update transaction', 1);

        await this.updateExpense();
        await this.updateIncome();
        await this.updateTransfer();
        await this.updateDebt();
    }

    async del() {
        setBlock('Delete transaction', 1);

        await this.deleteExpense();
        await this.deleteIncome();
        await this.deleteTransfer();
        await this.deleteDebt();
    }

    async createExpense() {
        setBlock('Create expense transactions', 1);
        const { RUB, KRW } = App.scenario;

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
            // Check available to create transaction with hidden account
            fromAccount: 0,
            srcAcc: App.scenario.HIDDEN_ACCOUNT_IND,
            destAmount: '0.01',
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

        await App.scenario.runner.runGroup(ExpenseTransactionTests.create, data);
    }

    async createIncome() {
        setBlock('Create income transactions', 1);

        const { USD, KRW } = App.scenario;
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
            // Check available to create transaction with hidden account
            fromAccount: 0,
            destAcc: App.scenario.HIDDEN_ACCOUNT_IND,
            srcAmount: '0.01',
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

        await App.scenario.runner.runGroup(IncomeTransactionTests.create, data);
    }

    async createTransfer() {
        setBlock('Create transfer transactions', 1);

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
            // Check available to create transaction with hidden account
            fromAccount: 0,
            srcAcc: 2,
            destAcc: App.scenario.HIDDEN_ACCOUNT_IND,
            srcAmount: '1',
            destAmount: '75',
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

        await App.scenario.runner.runGroup(TransferTransactionTests.create, data);
    }

    async createDebt() {
        setBlock('Create debt transactions', 1);

        const data = [{
            fromPerson: 0,
            srcAmount: '1000',
        }, {
            fromPerson: 0,
            debtType: false,
            acc: 2,
            srcAmount: '200',
            date: App.dates.weekAgo,
        }, {
            debtType: true,
            acc: 3,
            srcAmount: '100.0101',
        }, {
            fromPerson: 1,
            debtType: false,
            acc: 3,
            srcAmount: '10',
            date: App.dates.yesterday,
        }, {
            acc: null,
            srcAmount: '105',
            date: App.dates.yesterday,
        }, {
            fromPerson: 1,
            debtType: false,
            acc: null,
            srcAmount: '105',
        }, {
            // Check available to create transaction with hidden person
            fromPerson: 0,
            person: App.scenario.HIDDEN_PERSON_IND,
            srcAmount: '0.01',
        }, {
            // Check available to create transaction with hidden account
            fromPerson: 1,
            acc: App.scenario.HIDDEN_ACCOUNT_IND,
            srcAmount: '105',
        }, {
            // Try to submit debt with invalid amount
            srcAmount: '',
        }, {
            // Try to submit debt with invalid date
            srcAmount: '100',
            date: '0921-dd.0',
        }];

        await App.scenario.runner.runGroup(DebtTransactionTests.create, data);
    }

    async updateExpense() {
        setBlock('Update expense transactions', 2);

        const { USD } = App.scenario;
        const data = [{
            pos: 3,
            destAmount: '124.7701',
        }, {
            pos: 0,
            srcAmount: '101',
            destAmount: '7065.30',
            destCurr: USD,
        }, {
            pos: 2,
            destAmount: '0.02',
            date: App.dates.weekAgo,
        }, {
            pos: 3,
            srcAcc: 3,
            destAmount: '99.9',
            date: App.dates.yesterday,
        }, {
            // Check available to update transaction with hidden account
            pos: 4,
            srcAcc: App.scenario.HIDDEN_ACCOUNT_IND,
            destAmount: '99.9',
        }];

        await App.scenario.runner.runGroup(ExpenseTransactionTests.update, data);
    }

    async updateIncome() {
        setBlock('Update income transactions', 2);

        const { USD } = App.scenario;
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
            srcCurr: USD,
        }, {
            pos: 3,
            destAcc: 3,
            srcAmount: '99.9',
        }, {
            // Check available to update transaction with hidden account
            pos: 4,
            destAcc: App.scenario.HIDDEN_ACCOUNT_IND,
            srcAmount: '99.9',
        }];

        await App.scenario.runner.runGroup(IncomeTransactionTests.update, data);
    }

    async updateTransfer() {
        setBlock('Update transfer transactions', 2);

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
        }, {
            // Check available to update transaction with hidden account
            pos: 5,
            srcAcc: App.scenario.HIDDEN_ACCOUNT_IND,
            srcAmount: '1000',
        }];

        await App.scenario.runner.runGroup(TransferTransactionTests.update, data);
    }

    async updateDebt() {
        setBlock('Update debt transactions', 2);

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
        }, {
            // Check available to update transaction with hidden person
            pos: 0,
            acc: App.scenario.HIDDEN_PERSON_IND,
            srcAmount: '105',
        }, {
            // Check available to update transaction with hidden account
            pos: 1,
            acc: App.scenario.HIDDEN_ACCOUNT_IND,
            srcAmount: '105',
        }];

        await App.scenario.runner.runGroup(DebtTransactionTests.update, data);
    }

    async deleteExpense() {
        setBlock('Delete expense transactions', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup((items) => TransactionTests.del(EXPENSE, items), data);
    }

    async deleteIncome() {
        setBlock('Delete income transactions', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup((items) => TransactionTests.del(INCOME, items), data);
    }

    async deleteTransfer() {
        setBlock('Delete transfer transactions', 2);

        const data = [
            [1],
            [0, 2],
        ];

        await App.scenario.runner.runGroup((items) => TransactionTests.del(TRANSFER, items), data);
    }

    async deleteDebt() {
        setBlock('Delete debt transactions', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup((items) => TransactionTests.del(DEBT, items), data);
    }

    async typeChangeLoop() {
        setBlock('Change transaction type tests', 2);

        // Hide first account
        let userVisibleAccounts = App.state.accounts.getUserVisible();
        const account = userVisibleAccounts.getItemByIndex(0);
        await AccountTests.hide(0);

        await App.goToMainView();
        await App.view.goToNewTransactionByAccount(0);

        // Start from Expense type
        await TransactionTests.runActions([
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
        ]);

        // Show previously hidden account
        userVisibleAccounts = App.state.accounts.getUserVisible();
        const userHiddenAccounts = App.state.accounts.getUserHidden();
        const index = userHiddenAccounts.getIndexById(account.id);
        await AccountTests.show(userVisibleAccounts.length + index);
    }

    async deleteFromUpdate() {
        setBlock('Delete transaction from update view', 2);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(
            (pos) => TransactionTests.delFromUpdate(DEBT, pos),
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
            flags: 0,
        });
        // Create person
        const person = await api.person.create({
            name: 'Person 1',
            flags: 0,
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
            date: '22.05.2022',
            comment: '',
        });

        await App.state.fetch();
        const personAccount = App.state.getPersonAccount(person.id, RUB);

        const data = [
            { type: EXPENSE, accountId: personAccount.id },
            { type: INCOME, accountId: personAccount.id },
            { type: TRANSFER, accountId: personAccount.id },
            { type: DEBT, accountId: personAccount.id },
        ];
        await App.scenario.runner.runGroup(TransactionTests.createFromPersonAccount, data);
    }

    async availability(directNavigate) {
        const { RUB } = App.scenario;

        const checkAvailable = (type) => (
            TransactionTests.checkTransactionAvailable(type, directNavigate)
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
            flags: 0,
        });
        await App.state.fetch();

        setBlock('1 account and no person', 2);
        // Only Expense and Income must be available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);

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
            flags: 0,
        });
        await App.state.fetch();

        setBlock('2 accounts and no person', 2);
        // Expense, Income and Transfer must be available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);

        if (!directNavigate) {
            // Navigate from not available Debt to available Transfer
            await TransactionTests.checkTransactionAvailable(TRANSFER, directNavigate);
        }

        // Create person
        const { id: person1 } = await api.person.create({
            name: 'Person 1',
            flags: 0,
        });
        await App.state.fetch();

        setBlock('2 accounts and 1 person', 2);
        // All transaction types must be available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);

        // Hide first account
        await api.account.hide(account1);
        await App.state.fetch();

        setBlock('1 visible, 1 hidden account and 1 person', 2);
        // All transaction types must be available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);

        // Hide second account
        await api.account.hide(account2);
        await App.state.fetch();

        setBlock('2 hidden accounts and 1 person', 2);
        // All transaction types must be available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);

        // Remove account
        await api.account.show(account1);
        await api.account.del(account2);
        await App.state.fetch();

        setBlock('1 account and 1 person', 2);
        // Expense, Income and Debt must be available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);

        // Remove account
        await api.account.del(account1);
        await App.state.fetch();

        setBlock('No accounts and 1 person', 2);
        // Only Debt must be available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);

        // Hide person
        await api.person.hide(person1);
        await App.state.fetch();

        setBlock('No accounts and 1 hidden person', 2);
        // Only Debt must be available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);
        // Check state of Debt transaction after swap source and destination
        await TransactionTests.runAction({ action: 'swapSourceAndDest' });

        // Remove person
        await api.person.del(person1);
        await App.state.fetch();

        setBlock('No accounts and no persons', 2);
        // Expected no transaction available
        await App.scenario.runner.runGroup(checkAvailable, availTransTypes);
    }
}
