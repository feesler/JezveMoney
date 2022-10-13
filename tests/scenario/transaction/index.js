import { setBlock, assert } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../model/Transaction.js';
import { api } from '../../model/api.js';
import * as TransactionTests from '../../run/transaction/index.js';
import * as ExpenseTransactionTests from '../../run/transaction/expense.js';
import * as IncomeTransactionTests from '../../run/transaction/income.js';
import * as TransferTransactionTests from '../../run/transaction/transfer.js';
import * as DebtTransactionTests from '../../run/transaction/debt.js';
import * as AccountTests from '../../run/account.js';
import { App } from '../../Application.js';
import { ACCOUNT_HIDDEN } from '../../model/AccountsList.js';
import { PERSON_HIDDEN } from '../../model/PersonsList.js';

import * as expenseTests from './expense.js';
import * as incomeTests from './income.js';
import * as transferTests from './transfer.js';
import * as debtTests from './debt.js';

const createExpenseTests = async () => {
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
};

const createIncomeTests = async () => {
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
};

const createTransferTests = async () => {
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
};

const createDebtTests = async () => {
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
};

const updateExpenseTests = async () => {
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
};

const updateIncomeTests = async () => {
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
};

const updateTransferTests = async () => {
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
};

const updateDebtTests = async () => {
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
};

const deleteExpenseTests = async () => {
    setBlock('Delete expense transactions', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await App.scenario.runner.runGroup((items) => TransactionTests.del(EXPENSE, items), data);
};

const deleteIncomeTests = async () => {
    setBlock('Delete income transactions', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await App.scenario.runner.runGroup((items) => TransactionTests.del(INCOME, items), data);
};

const deleteTransferTests = async () => {
    setBlock('Delete transfer transactions', 2);

    const data = [
        [1],
        [0, 2],
    ];

    await App.scenario.runner.runGroup((items) => TransactionTests.del(TRANSFER, items), data);
};

const deleteDebtTests = async () => {
    setBlock('Delete debt transactions', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await App.scenario.runner.runGroup((items) => TransactionTests.del(DEBT, items), data);
};

const typeChangeLoop = async () => {
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
};

const stateLoopTests = async () => {
    setBlock('Transaction view state loops', 1);

    await expenseTests.stateLoop();
    await incomeTests.stateLoop();
    await transferTests.stateLoop();
    await debtTests.stateLoop();

    await typeChangeLoop();
};

const createTests = async () => {
    setBlock('Create transaction', 1);

    await createExpenseTests();
    await createIncomeTests();
    await createTransferTests();
    await createDebtTests();
};

const updateTests = async () => {
    setBlock('Update transaction', 1);

    await updateExpenseTests();
    await updateIncomeTests();
    await updateTransferTests();
    await updateDebtTests();
};

const deleteTests = async () => {
    setBlock('Delete transaction', 1);

    await deleteExpenseTests();
    await deleteIncomeTests();
    await deleteTransferTests();
    await deleteDebtTests();
};

const deleteFromUpdateTests = async () => {
    setBlock('Delete transaction from update view', 2);

    const data = [
        0,
    ];

    await App.scenario.runner.runGroup(
        (pos) => TransactionTests.delFromUpdate(DEBT, pos),
        data,
    );
};

const createFromPersonAccount = async () => {
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
};

const availabilityTests = async (directNavigate) => {
    const { RUB } = App.scenario;

    if (directNavigate) {
        setBlock('Transaction availability: direct navigation', 1);
    } else {
        setBlock('Transaction availability: manual navigation', 1);
    }

    // Remove all accounts and persons
    await api.profile.resetData({ accounts: true, persons: true });

    // Create first account
    await api.account.create({
        name: 'Account 1',
        curr_id: RUB,
        initbalance: '1',
        icon_id: 1,
        flags: 0,
    });
    await App.state.fetch();
    const [account1] = App.state.accounts.getIds();

    setBlock('1 account and no person', 2);
    // Only Expense and Income must be available
    await TransactionTests.checkTransactionAvailable(EXPENSE, directNavigate);
    await TransactionTests.checkTransactionAvailable(INCOME, directNavigate);
    await TransactionTests.checkTransactionAvailable(TRANSFER, directNavigate);
    await TransactionTests.checkTransactionAvailable(DEBT, directNavigate);

    if (!directNavigate) {
        // Navigate from not available Debt to available Expense
        await TransactionTests.checkTransactionAvailable(EXPENSE, directNavigate);
        await TransactionTests.checkTransactionAvailable(DEBT, directNavigate);
        // Navigate from not available Debt to available Income
        await TransactionTests.checkTransactionAvailable(INCOME, directNavigate);
    }

    // Create second account
    await api.account.create({
        name: 'Account 2',
        curr_id: RUB,
        initbalance: '2',
        icon_id: 1,
        flags: 0,
    });
    await App.state.fetch();
    const [, account2] = App.state.accounts.getIds();

    setBlock('2 accounts and no person', 2);
    // Expense, Income and Transfer must be available
    await TransactionTests.checkTransactionAvailable(EXPENSE, directNavigate);
    await TransactionTests.checkTransactionAvailable(INCOME, directNavigate);
    await TransactionTests.checkTransactionAvailable(TRANSFER, directNavigate);
    await TransactionTests.checkTransactionAvailable(DEBT, directNavigate);

    if (!directNavigate) {
        // Navigate from not available Debt to available Transfer
        await TransactionTests.checkTransactionAvailable(TRANSFER, directNavigate);
    }

    // Create person
    await api.person.create({
        name: 'Person 1',
        flags: 0,
    });
    await App.state.fetch();
    const [person1] = App.state.persons.getIds();

    setBlock('2 accounts and 1 person', 2);
    // All transaction types must be available
    await TransactionTests.checkTransactionAvailable(EXPENSE, directNavigate);
    await TransactionTests.checkTransactionAvailable(INCOME, directNavigate);
    await TransactionTests.checkTransactionAvailable(TRANSFER, directNavigate);
    await TransactionTests.checkTransactionAvailable(DEBT, directNavigate);

    // Remove account
    await api.account.del(account2);
    await App.state.fetch();

    setBlock('1 account and 1 person', 2);
    // Expense, Income and Debt must be available
    await TransactionTests.checkTransactionAvailable(EXPENSE, directNavigate);
    await TransactionTests.checkTransactionAvailable(INCOME, directNavigate);
    await TransactionTests.checkTransactionAvailable(TRANSFER, directNavigate);
    await TransactionTests.checkTransactionAvailable(DEBT, directNavigate);

    // Remove account
    await api.account.del(account1);
    await App.state.fetch();

    setBlock('No accounts and 1 person', 2);
    // Only Debt must be available
    await TransactionTests.checkTransactionAvailable(EXPENSE, directNavigate);
    await TransactionTests.checkTransactionAvailable(INCOME, directNavigate);
    await TransactionTests.checkTransactionAvailable(TRANSFER, directNavigate);
    // Navigate from not available Transfer to available Debt
    await TransactionTests.checkTransactionAvailable(DEBT, directNavigate);

    // Remove person
    await api.person.del(person1);
    await App.state.fetch();

    setBlock('No accounts and no persons', 2);
    // Expected no transaction available
    await TransactionTests.checkTransactionAvailable(EXPENSE, directNavigate);
    await TransactionTests.checkTransactionAvailable(INCOME, directNavigate);
    await TransactionTests.checkTransactionAvailable(TRANSFER, directNavigate);
    await TransactionTests.checkTransactionAvailable(DEBT, directNavigate);
};

export const transactionTests = {
    /** Create accounts and persons required for transaction view tests */
    async prepare() {
        const HIDDEN_ACCOUNT_NAME = 'HIDDEN_ACC';
        const HIDDEN_PERSON_NAME = 'Hidden person';
        const { RUB, USD, EUR } = App.scenario;

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
            name: HIDDEN_ACCOUNT_NAME,
            curr_id: RUB,
            initbalance: '100',
            icon_id: 0,
            flags: ACCOUNT_HIDDEN,
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
        }, {
            name: HIDDEN_PERSON_NAME,
            flags: PERSON_HIDDEN,
        }];

        for (const person of personsList) {
            if (App.state.persons.findByName(person.name)) {
                continue;
            }

            await api.person.create(person);
        }

        await App.state.fetch();

        const [hiddenAccountInd] = App.state.getAccountIndexesByNames(HIDDEN_ACCOUNT_NAME);
        assert(hiddenAccountInd !== -1, `Account '${HIDDEN_ACCOUNT_NAME}' not found`);
        App.scenario.HIDDEN_ACCOUNT_IND = hiddenAccountInd;
        const [hiddenPersonInd] = App.state.getPersonIndexesByNames(HIDDEN_PERSON_NAME);
        assert(hiddenPersonInd !== -1, `Person '${HIDDEN_PERSON_NAME}' not found`);
        App.scenario.HIDDEN_PERSON_IND = hiddenPersonInd;
    },

    /** Run transaction view tests */
    async run() {
        setBlock('Transactions', 1);

        await this.prepare();

        await TransactionTests.securityTests();
        await stateLoopTests();
        await createTests();
        await updateTests();
        await deleteTests();
        await deleteFromUpdateTests();
    },

    async runAvailabilityTests() {
        await createFromPersonAccount();
        await availabilityTests(false);
        await availabilityTests(true);
    },
};
