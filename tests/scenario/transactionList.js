import { copyObject } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
    availTransTypes,
} from '../model/Transaction.js';
import { api } from '../model/api.js';
import * as TransactionListTests from '../run/transactions.js';
import { App } from '../Application.js';
import { setBlock } from '../env.js';

let scenario = null;

async function setupAccounts() {
    const { RUB, USD, EUR } = scenario;
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

async function setupPersons() {
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

async function setupTransactions(accountIds, personIds) {
    const [ACC_4, ACC_5, CASH_USD, CASH_EUR] = accountIds;
    const [ALEX, NONAME] = personIds;
    const {
        RUB,
        USD,
        EUR,
        PLN,
    } = scenario;

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

async function prepareTrListData() {
    await api.user.login(App.config.testUser);
    await App.state.fetch();

    const accIds = await setupAccounts();
    const personIds = await setupPersons();
    const transIds = await setupTransactions(accIds, personIds);

    await App.state.fetch();

    const res = {
        accounts: accIds,
        persons: personIds,
        transactions: transIds,
    };

    return res;
}

export async function transactionsListTests() {
    setBlock('Transaction List view', 1);

    const data = await prepareTrListData();

    await scenario.runner.runTasks([
        { action: TransactionListTests.checkInitialState },
        { action: TransactionListTests.goToNextPage },
        { action: TransactionListTests.setDetailsMode },
        { action: TransactionListTests.goToNextPage },
    ]);

    const toggleSelectData = [
        0,
        [1, 2],
    ];

    await scenario.runner.runGroup(TransactionListTests.toggleSelect, toggleSelectData);

    await scenario.runner.runGroup(TransactionListTests.filterByType, availTransTypes);

    await scenario.runner.runTasks([{
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

    await scenario.runner.runGroup(TransactionListTests.search, searchData);

    await scenario.runner.runTasks([
        { action: TransactionListTests.clearSearchForm },
        { action: TransactionListTests.clearDateRange },
    ]);
}

/** Initialize tests */
export function initTransactionListTests(scenarioInstance) {
    scenario = scenarioInstance;
}
