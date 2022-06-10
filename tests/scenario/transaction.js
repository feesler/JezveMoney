import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../model/Transaction.js';
import { api } from '../model/api.js';
import * as TransactionTests from '../run/transaction/index.js';
import * as ExpenseTransactionTests from '../run/transaction/expense.js';
import * as IncomeTransactionTests from '../run/transaction/income.js';
import * as TransferTransactionTests from '../run/transaction/transfer.js';
import * as DebtTransactionTests from '../run/transaction/debt.js';
import { transactionsListTests } from './transactionList.js';
import { importTests } from './import.js';
import { App } from '../Application.js';
import { setBlock } from '../env.js';

let scenario = null;

async function createExpenseTests() {
    setBlock('Create expense transactions', 1);

    const { RUB, KRW } = scenario;
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

    await scenario.runner.runGroup(ExpenseTransactionTests.create, data);
}

async function createIncomeTests() {
    setBlock('Create income transactions', 1);

    const { USD, KRW } = scenario;
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

    await scenario.runner.runGroup(IncomeTransactionTests.create, data);
}

async function createTransferTests() {
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

    await scenario.runner.runGroup(TransferTransactionTests.create, data);
}

async function createDebtTests() {
    setBlock('Create debt transactions', 1);

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

    await scenario.runner.runGroup(DebtTransactionTests.create, data);
}

async function updateExpenseTests() {
    setBlock('Update expense transactions', 2);

    const { RUB } = scenario;
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

    await scenario.runner.runGroup(ExpenseTransactionTests.update, data);
}

async function updateIncomeTests() {
    setBlock('Update income transactions', 2);

    const { RUB } = scenario;
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

    await scenario.runner.runGroup(IncomeTransactionTests.update, data);
}

async function updateTransferTests() {
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
    }];

    await scenario.runner.runGroup(TransferTransactionTests.update, data);
}

async function updateDebtTests() {
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
    }];

    await scenario.runner.runGroup(DebtTransactionTests.update, data);
}

async function deleteExpenseTests() {
    setBlock('Delete expense transactions', 2);

    const data = [
        [0],
        [0, 1, 11, 13],
    ];

    await scenario.runner.runGroup((items) => TransactionTests.del(EXPENSE, items), data);
}

async function deleteIncomeTests() {
    setBlock('Delete income transactions', 2);

    const data = [
        [0],
        [0, 1, 2, 15],
    ];

    await scenario.runner.runGroup((items) => TransactionTests.del(INCOME, items), data);
}

async function deleteTransferTests() {
    setBlock('Delete transfer transactions', 2);

    const data = [
        [1],
        [0, 2],
    ];

    await scenario.runner.runGroup((items) => TransactionTests.del(TRANSFER, items), data);
}

async function deleteDebtTests() {
    setBlock('Delete debt transactions', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await scenario.runner.runGroup((items) => TransactionTests.del(DEBT, items), data);
}

async function stateLoopTests() {
    setBlock('Transaction view state loops', 1);

    await ExpenseTransactionTests.stateLoop();
    await IncomeTransactionTests.stateLoop();
    await TransferTransactionTests.stateLoop();
    await DebtTransactionTests.stateLoop();

    await TransactionTests.typeChangeLoop();
}

async function createTests() {
    setBlock('Create transaction', 1);

    await createExpenseTests();
    await createIncomeTests();
    await createTransferTests();
    await createDebtTests();
}

async function updateTests() {
    setBlock('Update transaction', 1);

    await updateExpenseTests();
    await updateIncomeTests();
    await updateTransferTests();
    await updateDebtTests();
}

async function deleteTests() {
    setBlock('Delete transaction', 1);

    await deleteExpenseTests();
    await deleteIncomeTests();
    await deleteTransferTests();
    await deleteDebtTests();
}

async function deleteFromUpdateTests() {
    setBlock('Delete transaction from update view', 2);

    const data = [
        0,
    ];

    await scenario.runner.runGroup(
        (pos) => TransactionTests.delFromUpdate(DEBT, pos),
        data,
    );
}

async function availabilityTests(directNavigate) {
    const { RUB } = scenario;

    if (directNavigate) {
        setBlock('Transaction availability: direct navigation', 1);
    } else {
        setBlock('Transaction availability: manual navigation', 1);
    }

    // Remove all accounts and persons
    await api.account.reset();
    const personIds = App.state.persons.getIds();
    if (personIds.length > 0) {
        await api.person.del(personIds);
    }

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
}

export const transactionTests = {
    /** Initialize tests */
    init(scenarioInstance) {
        scenario = scenarioInstance;
    },

    /** Create accounts and persons required for transaction view tests */
    async prepare() {
        const { RUB, USD, EUR } = scenario;

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
    },

    /** Run transaction view tests */
    async run() {
        setBlock('Transactions', 1);

        await this.prepare();

        await TransactionTests.securityTests();
        await stateLoopTests();
        await createTests();
        await updateTests();

        await transactionsListTests.initAndRun(scenario);
        await importTests.initAndRun(scenario);

        await deleteTests();
        await deleteFromUpdateTests();
    },

    async runAvailabilityTests() {
        await availabilityTests(false);
        await availabilityTests(true);
    },

    /** Initialize and run tests */
    async initAndRun(scenarioInstance) {
        this.init(scenarioInstance);
        await this.run();
    },
};
