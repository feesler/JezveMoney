import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../model/Transaction.js';
import { api } from '../model/api.js';
import * as TransactionTests from '../run/transaction/common.js';
import * as ExpenseTransactionTests from '../run/transaction/expense.js';
import * as IncomeTransactionTests from '../run/transaction/income.js';
import * as TransferTransactionTests from '../run/transaction/transfer.js';
import * as DebtTransactionTests from '../run/transaction/debt.js';
import { transactionsListTests, initTransactionListTests } from './transactionList.js';
import { importTests, initImportTests } from './import.js';
import { App } from '../Application.js';
import { setBlock } from '../env.js';

let scenario = null;

async function runCreateExpenseTests() {
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

async function runCreateIncomeTests() {
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

async function runCreateTransferTests() {
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

async function runCreateDebtTests() {
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

async function runUpdateExpenseTests() {
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

async function runUpdateIncomeTests() {
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

async function runUpdateTransferTests() {
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

async function runUpdateDebtTests() {
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

async function runDeleteExpenseTests() {
    setBlock('Delete expense transactions', 2);

    const data = [
        [0],
        [0, 1, 11, 13],
    ];

    await scenario.runner.runGroup((items) => TransactionTests.del(EXPENSE, items), data);
}

async function runDeleteIncomeTests() {
    setBlock('Delete income transactions', 2);

    const data = [
        [0],
        [0, 1, 2, 15],
    ];

    await scenario.runner.runGroup((items) => TransactionTests.del(INCOME, items), data);
}

async function runDeleteTransferTests() {
    setBlock('Delete transfer transactions', 2);

    const data = [
        [1],
        [0, 2],
    ];

    await scenario.runner.runGroup((items) => TransactionTests.del(TRANSFER, items), data);
}

async function runDeleteDebtTests() {
    setBlock('Delete debt transactions', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await scenario.runner.runGroup((items) => TransactionTests.del(DEBT, items), data);
}

async function transactionStateLoopTests() {
    setBlock('Transaction view state loops', 1);

    await ExpenseTransactionTests.stateLoop();
    await IncomeTransactionTests.stateLoop();
    await TransferTransactionTests.stateLoop();
    await DebtTransactionTests.stateLoop();

    await TransactionTests.typeChangeLoop();
}

async function createTransactionTests() {
    setBlock('Create transaction', 1);

    await runCreateExpenseTests();
    await runCreateIncomeTests();
    await runCreateTransferTests();
    await runCreateDebtTests();
}

async function updateTransactionTests() {
    setBlock('Update transaction', 1);

    await runUpdateExpenseTests();
    await runUpdateIncomeTests();
    await runUpdateTransferTests();
    await runUpdateDebtTests();
}

async function deleteTransactionTests() {
    setBlock('Delete transaction', 1);

    await runDeleteExpenseTests();
    await runDeleteIncomeTests();
    await runDeleteTransferTests();
    await runDeleteDebtTests();
}

/** Create accounts and persons required for transaction view tests */
export async function prepareTransactionTests() {
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
}

/** Run transaction view tests */
export async function transactionTests() {
    setBlock('Transactions', 1);

    await prepareTransactionTests();

    await transactionStateLoopTests();
    await createTransactionTests();
    await updateTransactionTests();

    initTransactionListTests(scenario);
    await transactionsListTests();

    initImportTests(scenario);
    await importTests();

    await deleteTransactionTests();
}

/** Initialize tests */
export function initTransactionTests(scenarioInstance) {
    scenario = scenarioInstance;
}
