import { copyObject } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../model/Transaction.js';
import {
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_ACC_AMOUNT,
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_COMMENT,
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_STRING_INCLUDES,
    IMPORT_COND_OP_FIELD_FLAG,
} from '../model/ImportCondition.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_COMMENT,
} from '../model/ImportAction.js';
import { api } from '../model/api.js';
import * as ApiTests from '../run/api.js';
import * as AccountApiTests from '../run/api/account.js';
import * as PersonApiTests from '../run/api/person.js';
import * as TransactionApiTests from '../run/api/transaction.js';
import * as ImportTemplateApiTests from '../run/api/importtemplate.js';
import * as ImportRuleApiTests from '../run/api/importrule.js';
import { App } from '../Application.js';
import { setBlock } from '../env.js';

let scenario = null;

async function prepareApiSecurityTests() {
    setBlock('Prepare data for security tests', 2);

    const { RUB, USD } = scenario;

    [
        scenario.API_USER_ACC_RUB,
        scenario.API_USER_ACC_USD,
    ] = await scenario.runner.runGroup(AccountApiTests.create, [{
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
        scenario.API_USER_PERSON,
    ] = await scenario.runner.runGroup(PersonApiTests.create, [{
        name: 'API user Person',
        flags: 0,
    }]);

    [
        scenario.API_USER_TRANSACTION,
    ] = await scenario.runner.runGroup(TransactionApiTests.extractAndCreate, [{
        type: EXPENSE,
        src_id: scenario.API_USER_ACC_RUB,
        src_amount: 100,
    }]);
}

async function apiAccountsSecurity() {
    setBlock('Accounts security', 2);

    const { EUR } = scenario;

    await AccountApiTests.update({
        id: scenario.API_USER_ACC_RUB,
        name: 'EUR',
        curr_id: EUR,
        initbalance: 10,
        icon_id: 2,
        flags: 0,
    });
    await AccountApiTests.del(scenario.API_USER_ACC_RUB);
}

async function apiPersonsSecurity() {
    setBlock('Persons security', 2);

    await PersonApiTests.update({
        id: scenario.API_USER_PERSON,
        name: 'API Person',
        flags: 0,
    });
    await PersonApiTests.del(scenario.API_USER_PERSON);
}

async function apiCreateTransactionSecurity() {
    setBlock('Create', 3);

    const { RUB } = scenario;
    const data = [{
        type: EXPENSE,
        src_id: scenario.API_USER_ACC_RUB,
        dest_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: INCOME,
        src_id: 0,
        dest_id: scenario.API_USER_ACC_RUB,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: TRANSFER,
        src_id: scenario.CASH_RUB,
        dest_id: scenario.API_USER_ACC_RUB,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: DEBT,
        op: 1,
        person_id: scenario.API_USER_PERSON,
        acc_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }];

    await scenario.runner.runGroup(TransactionApiTests.create, data);
}

async function apiUpdateTransactionSecurity() {
    setBlock('Update', 3);

    const { RUB } = scenario;

    const data = [{
        id: scenario.TR_EXPENSE_1,
        src_id: scenario.API_USER_ACC_RUB,
    }, {
        id: scenario.TR_INCOME_1,
        dest_id: scenario.API_USER_ACC_RUB,
    }, {
        id: scenario.TR_TRANSFER_1,
        src_id: scenario.API_USER_ACC_RUB,
        dest_id: scenario.API_USER_ACC_USD,
    }, {
        // Trying to update transaction of another user
        id: scenario.API_USER_TRANSACTION,
        type: EXPENSE,
        src_id: scenario.CASH_RUB,
        dest_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        // Trying to set person of another user
        id: scenario.TR_DEBT_1,
        person_id: scenario.API_USER_PERSON,
    }, {
        // Trying to set account of another user
        id: scenario.TR_DEBT_2,
        acc_id: scenario.API_USER_ACC_RUB,
    }, {
        // Trying to set both person and account of another user
        id: scenario.TR_DEBT_3,
        person_id: scenario.API_USER_PERSON,
        acc_id: scenario.API_USER_ACC_RUB,
    }];

    await scenario.runner.runGroup(TransactionApiTests.update, data);
}

async function apiDeleteTransactionSecurity() {
    setBlock('Delete', 3);

    const data = [
        [scenario.API_USER_TRANSACTION],
    ];

    await scenario.runner.runGroup(TransactionApiTests.del, data);
}

async function apiTransactionsSecurity() {
    setBlock('Transaction security', 2);

    await apiCreateTransactionSecurity();
    await apiUpdateTransactionSecurity();
    await apiDeleteTransactionSecurity();
}

async function apiSecurityTests() {
    await apiAccountsSecurity();
    await apiPersonsSecurity();
    await apiTransactionsSecurity();
}

async function apiCreateAccounts() {
    const { RUB, USD } = scenario;

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
        scenario.ACC_RUB,
        scenario.CASH_RUB,
        scenario.ACC_USD,
    ] = await scenario.runner.runGroup(AccountApiTests.create, data);
}

async function apiUpdateAccounts() {
    const { USD } = scenario;

    const data = [{
        id: scenario.ACC_RUB,
        name: 'acc rub',
        curr_id: USD,
        initbalance: 101,
        icon_id: 2,
    }, {
        // Try to update name of account to an existing one
        id: scenario.CASH_RUB,
        name: 'acc rub',
    }];

    return scenario.runner.runGroup(AccountApiTests.update, data);
}

async function apiDeleteAccounts() {
    const data = [
        [scenario.ACC_USD, scenario.CASH_RUB],
    ];

    return scenario.runner.runGroup(AccountApiTests.del, data);
}

async function apiCreatePersons() {
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

    [
        scenario.PERSON_X,
        scenario.PERSON_Y,
    ] = await scenario.runner.runGroup(PersonApiTests.create, data);
}

async function apiUpdatePersons() {
    const data = [
        { id: scenario.PERSON_X, name: 'XX!' },
        // Try to update name of person to an existing one
        { id: scenario.PERSON_X, name: 'XX!' },
        { id: scenario.PERSON_X, name: '' },
    ];

    return scenario.runner.runGroup(PersonApiTests.update, data);
}

async function apiDeletePersons() {
    const data = [
        [scenario.PERSON_Y],
        [],
    ];

    return scenario.runner.runGroup(PersonApiTests.del, data);
}

async function apiCreateTransactions() {
    setBlock('Create', 3);

    const { RUB, USD, EUR } = scenario;

    const data = [{
        type: EXPENSE,
        src_id: scenario.ACC_RUB,
        src_amount: 100,
        comment: '11',
    }, {
        type: EXPENSE,
        src_id: scenario.ACC_RUB,
        src_amount: 7608,
        dest_amount: 100,
        dest_curr: EUR,
        comment: '22',
    }, {
        type: EXPENSE,
        src_id: scenario.ACC_USD,
        src_amount: 1,
        date: App.dates.yesterday,
    }, {
        type: INCOME,
        dest_id: scenario.ACC_RUB,
        dest_amount: 1000.50,
        comment: 'lalala',
    }, {
        type: INCOME,
        dest_id: scenario.ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
        src_curr: RUB,
        comment: 'la',
    }, {
        type: TRANSFER,
        src_id: scenario.ACC_RUB,
        dest_id: scenario.CASH_RUB,
        src_amount: 500,
        dest_amount: 500,
    }, {
        type: TRANSFER,
        src_id: scenario.ACC_RUB,
        dest_id: scenario.ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
    }, {
        type: DEBT,
        op: 1,
        person_id: scenario.PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'к кк',
    }, {
        type: DEBT,
        op: 2,
        person_id: scenario.PERSON_Y,
        acc_id: 0,
        src_amount: 1000,
        src_curr: USD,
        comment: 'к',
    }, {
        type: DEBT,
        op: 1,
        person_id: scenario.PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'ппп',
    }, {
        type: DEBT,
        op: 2,
        person_id: scenario.PERSON_Y,
        acc_id: 0,
        src_amount: 1000,
        src_curr: USD,
    }];

    [
        scenario.TR_EXPENSE_1,
        scenario.TR_EXPENSE_2,
        scenario.TR_EXPENSE_3,
        scenario.TR_INCOME_1,
        scenario.TR_INCOME_2,
        scenario.TR_TRANSFER_1,
        scenario.TR_TRANSFER_2,
        scenario.TR_DEBT_1,
        scenario.TR_DEBT_2,
        scenario.TR_DEBT_3,
    ] = await scenario.runner.runGroup(TransactionApiTests.extractAndCreate, data);

    const invData = [{
        type: EXPENSE,
        src_id: 0,
        src_amount: 100,
    }, {
        type: EXPENSE,
        src_id: scenario.ACC_RUB,
        src_amount: 0,
    }, {
        type: EXPENSE,
        src_id: 0,
        dest_id: scenario.ACC_RUB,
        src_amount: 100,
    }, {
        type: INCOME,
        dest_id: 0,
        dest_amount: 100,
    }, {
        type: INCOME,
        src_id: scenario.ACC_RUB,
        dest_id: 0,
        dest_amount: 100,
    }, {
        type: INCOME,
        dest_id: scenario.ACC_RUB,
        dest_amount: '',
    }, {
        type: INCOME,
        dest_id: scenario.ACC_RUB,
        dest_amount: 99.1,
        date: '1f1f',
    }, {
        type: TRANSFER,
        src_id: 0,
        dest_id: 0,
        src_amount: 100,
    }, {
        type: TRANSFER,
        src_id: scenario.ACC_RUB,
        dest_id: 0,
        src_amount: 100,
    }, {
        type: TRANSFER,
        src_id: 0,
        dest_id: scenario.ACC_RUB,
        src_amount: 100,
    }, {
        type: DEBT,
        op: 0,
        person_id: scenario.PERSON_X,
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
        person_id: scenario.PERSON_X,
        acc_id: 0,
        src_amount: '',
        src_curr: RUB,
    }, {
        type: DEBT,
        op: 1,
        person_id: scenario.PERSON_X,
        acc_id: 0,
        src_amount: 10,
        src_curr: 9999,
    }];
    await scenario.runner.runGroup(TransactionApiTests.create, invData);
}

async function apiUpdateTransactions() {
    setBlock('Update', 3);

    const {
        RUB,
        USD,
        EUR,
        PLN,
    } = scenario;

    const data = [{
        id: scenario.TR_EXPENSE_1,
        src_id: scenario.CASH_RUB,
    }, {
        id: scenario.TR_EXPENSE_2,
        dest_amount: 7608,
        dest_curr: RUB,
    }, {
        id: scenario.TR_EXPENSE_3,
        dest_amount: 0.89,
        dest_curr: EUR,
        date: App.dates.weekAgo,
    }, {
        id: scenario.TR_INCOME_1,
        dest_id: scenario.CASH_RUB,
    }, {
        id: scenario.TR_INCOME_2,
        src_amount: 100,
        src_curr: USD,
    }, {
        id: scenario.TR_TRANSFER_1,
        dest_id: scenario.ACC_USD,
        dest_curr: USD,
        dest_amount: 8,
    }, {
        id: scenario.TR_TRANSFER_2,
        dest_id: scenario.CASH_RUB,
        dest_curr: RUB,
        dest_amount: 6500,
        date: App.dates.yesterday,
    }, {
        id: scenario.TR_DEBT_1,
        op: 2,
    }, {
        id: scenario.TR_DEBT_2,
        person_id: scenario.PERSON_Y,
        acc_id: 0,
    }, {
        id: scenario.TR_DEBT_3,
        op: 1,
        acc_id: scenario.ACC_RUB,
    }];

    await scenario.runner.runGroup(TransactionApiTests.update, data);

    const invData = [{
        id: scenario.TR_EXPENSE_1,
        src_id: 0,
    }, {
        id: scenario.TR_EXPENSE_2,
        dest_amount: 0,
        dest_curr: PLN,
    }, {
        id: scenario.TR_EXPENSE_3,
        date: '',
    }, {
        id: scenario.TR_INCOME_1,
        dest_id: 0,
    }, {
        id: scenario.TR_INCOME_2,
        src_amount: 0,
        src_curr: EUR,
    }, {
        id: scenario.TR_TRANSFER_1,
        src_id: 0,
    }, {
        id: scenario.TR_TRANSFER_1,
        dest_id: 0,
    }, {
        id: scenario.TR_TRANSFER_1,
        src_curr: 0,
    }, {
        id: scenario.TR_TRANSFER_1,
        dest_curr: 9999,
    }, {
        id: scenario.TR_TRANSFER_1,
        dest_id: scenario.ACC_USD,
        dest_curr: PLN,
    }, {
        id: scenario.TR_TRANSFER_2,
        dest_id: scenario.CASH_RUB,
        dest_curr: RUB,
        dest_amount: 0,
        date: 'x',
    }, {
        id: scenario.TR_DEBT_1,
        op: 0,
    }, {
        id: scenario.TR_DEBT_2,
        person_id: 0,
    }, {
        id: scenario.TR_DEBT_3,
        op: 1,
        acc_id: 9999,
    }];

    await scenario.runner.runGroup(TransactionApiTests.update, invData);
}

async function apiDeleteTransactions() {
    return scenario.runner.runGroup(TransactionApiTests.del, [
        [scenario.TR_EXPENSE_2, scenario.TR_TRANSFER_1, scenario.TR_DEBT_3],
        [],
        [9999],
    ]);
}

async function apiSetTransactionPos() {
    return scenario.runner.runGroup(TransactionApiTests.setPos, [
        { id: scenario.TR_EXPENSE_2, pos: 5 },
        { id: scenario.TR_INCOME_2, pos: 10 },
        { id: scenario.TR_TRANSFER_1, pos: 100 },
    ]);
}

async function apiFilterTransactions() {
    setBlock('Filter transactions', 2);

    const data = [{
        order: 'desc',
    }, {
        order: 'asc',
    }, {
        type: DEBT,
    }, {
        type: [EXPENSE, INCOME, TRANSFER],
    }, {
        accounts: scenario.ACC_RUB,
    }, {
        accounts: [scenario.ACC_RUB, scenario.ACC_USD],
    }, {
        accounts: scenario.ACC_RUB,
        order: 'desc',
    }, {
        type: DEBT,
        accounts: scenario.ACC_RUB,
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

    return scenario.runner.runGroup(TransactionApiTests.filter, data);
}

async function apiCreateImportTemplateTests() {
    setBlock('Create import template', 2);

    const data = [{
        name: 'Template 1',
        type: 0,
        account_amount_col: 1,
        account_curr_col: 2,
        trans_amount_col: 3,
        trans_curr_col: 4,
        date_col: 5,
        comment_col: 6,
    }, {
        name: 'Template 2',
        type: 1,
        account_amount_col: 1,
        account_curr_col: 2,
        trans_amount_col: 1,
        trans_curr_col: 2,
        date_col: 5,
        comment_col: 5,
    }, {
        name: 'Template 3',
        type: 0,
        account_amount_col: 10,
        account_curr_col: 20,
        trans_amount_col: 30,
        trans_curr_col: 40,
        date_col: 50,
        comment_col: 60,
    }, {
        // Invalid templates
        name: 'Invalid template',
    }, {
        name: null,
    }, {
        account_amount_col: 1,
        account_curr_col: 2,
        trans_amount_col: 3,
        trans_curr_col: 4,
        date_col: 5,
        comment_col: 6,
    }, {
        name: 'Invalid template',
        account_amount_col: 0,
        account_curr_col: 2,
        trans_amount_col: 3,
        trans_curr_col: 4,
        date_col: 5,
        comment_col: 6,
    }];

    [
        scenario.TEMPLATE_1,
        scenario.TEMPLATE_2,
        scenario.TEMPLATE_3,
    ] = await scenario.runner.runGroup(ImportTemplateApiTests.create, data);
}

async function apiUpdateImportTemplateTests() {
    setBlock('Update import template', 2);

    const data = [{
        id: scenario.TEMPLATE_1,
        name: 'TPL',
        type: 1,
        comment_col: 8,
    }, {
        id: scenario.TEMPLATE_2,
        name: null,
    }, {
        id: scenario.TEMPLATE_2,
        account_amount_col: 0,
    }];

    await scenario.runner.runGroup(ImportTemplateApiTests.update, data);
}

async function apiDeleteImportTemplateTests() {
    setBlock('Delete import template', 2);

    const data = [
        [scenario.TEMPLATE_3],
        [scenario.TEMPLATE_1, scenario.TEMPLATE_2],
    ];

    await scenario.runner.runGroup(ImportTemplateApiTests.del, data);
}

async function apiImportTemplateTests() {
    setBlock('Import template', 2);

    await apiCreateImportTemplateTests();
    await apiUpdateImportTemplateTests();
    await apiDeleteImportTemplateTests();
}

async function apiCreateImportRuleTests() {
    setBlock('Create import rule', 2);

    const taxiCondition = {
        field_id: IMPORT_COND_FIELD_COMMENT,
        operator: IMPORT_COND_OP_STRING_INCLUDES,
        value: 'BANK MESSAGE',
        flags: 0,
    };
    const taxiAction = {
        action_id: IMPORT_ACTION_SET_COMMENT,
        value: 'Rule',
    };

    const data = [{
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_MAIN_ACCOUNT,
            operator: IMPORT_COND_OP_NOT_EQUAL,
            value: scenario.CASH_RUB,
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_COMMENT,
            value: 'Rule',
        }],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_TR_AMOUNT,
            operator: IMPORT_COND_OP_NOT_EQUAL,
            value: IMPORT_COND_FIELD_ACC_AMOUNT,
            flags: IMPORT_COND_OP_FIELD_FLAG,
        }, {
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'BANK MESSAGE',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_TR_TYPE,
            value: 'transferfrom',
        }, {
            action_id: IMPORT_ACTION_SET_COMMENT,
            value: 'Bank',
        }],
    }, {
        flags: 0,
        conditions: [taxiCondition],
        actions: [taxiAction],
    }, {
        // Invalid rules
        flags: 0,
    }, {
        flags: 0,
        conditions: null,
    }, {
        flags: 0,
        actions: null,
    }, {
        flags: 0,
        conditions: [],
        actions: [],
    }, {
        flags: 0,
        conditions: [taxiCondition],
        actions: [],
    }, {
        flags: 0,
        conditions: [],
        actions: [taxiAction],
    }, {
        flags: 0,
        conditions: [null],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: 100,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: 100,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: null,
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_COMMENT,
        }],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [{
            value: 'Rule',
        }],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [{
            action_id: 100,
            value: 'Rule',
        }],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_TR_TYPE,
            value: 100,
        }],
    }];

    [
        scenario.RULE_1,
        scenario.RULE_2,
        scenario.RULE_3,
    ] = await scenario.runner.runGroup(ImportRuleApiTests.create, data);
}

async function apiUpdateImportRuleTests() {
    setBlock('Update import rule', 2);

    const diffAmountCondition = {
        field_id: IMPORT_COND_FIELD_TR_AMOUNT,
        operator: IMPORT_COND_OP_NOT_EQUAL,
        value: IMPORT_COND_FIELD_ACC_AMOUNT,
        flags: IMPORT_COND_OP_FIELD_FLAG,
    };
    const debtAction = {
        action_id: IMPORT_ACTION_SET_TR_TYPE,
        value: 'debtto',
    };

    const data = [{
        id: scenario.RULE_1,
        conditions: [{
            field_id: IMPORT_COND_FIELD_MAIN_ACCOUNT,
            operator: IMPORT_COND_OP_EQUAL,
            value: scenario.CASH_RUB,
            flags: 0,
        }, {
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'MARKET',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_TR_TYPE,
            value: 'transferto',
        }],
    }, {
        id: scenario.RULE_2,
        conditions: null,
        actions: [debtAction],
    }, {
        id: scenario.RULE_2,
        conditions: [],
        actions: [debtAction],
    }, {
        id: scenario.RULE_2,
        conditions: [null],
        actions: [debtAction],
    }, {
        id: scenario.RULE_2,
        conditions: [diffAmountCondition],
        actions: null,
    }, {
        id: scenario.RULE_2,
        conditions: [diffAmountCondition],
        actions: [],
    }, {
        id: scenario.RULE_2,
        conditions: [diffAmountCondition],
        actions: [null],
    }];

    await scenario.runner.runGroup(ImportRuleApiTests.update, data);
}

async function apiDeleteImportRuleTests() {
    setBlock('Delete import rule', 2);

    const data = [
        [scenario.RULE_3],
        [scenario.RULE_1, scenario.RULE_2],
    ];

    await scenario.runner.runGroup(ImportRuleApiTests.del, data);
}

async function apiImportRuleTests() {
    setBlock('Import rule', 2);

    await apiCreateImportRuleTests();
    await apiUpdateImportRuleTests();
    await apiDeleteImportRuleTests();
}

async function apiProfile() {
    setBlock('Profile', 2);

    const tasks = [{
        action: ApiTests.resetAccounts,
    }, {
        action: ApiTests.resetAll,
    }, {
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

    return scenario.runner.runTasks(tasks);
}

export const apiTests = {
    /** Initialize tests */
    init(scenarioInstance) {
        scenario = scenarioInstance;
    },

    /** Run API tests */
    async run() {
        setBlock('API tests', 1);
        setBlock('User', 2);

        // Register API test user and prepare data for security tests
        await ApiTests.registerAndLogin(App.config.apiTestUser);
        await App.setupUser();
        scenario.setupCurrencies();
        await prepareApiSecurityTests();

        await ApiTests.loginTest({ login: '', password: App.config.testUser.password });
        await ApiTests.loginTest({ login: App.config.testUser.login, password: '' });

        // Register and login main test user
        await ApiTests.registerAndLogin(App.config.testUser);
        // Set 'Tester' access level for test user
        const testUserId = App.state.profile.user_id;
        await ApiTests.loginTest(App.config.testAdminUser);
        const testUserData = copyObject(App.config.testUser);
        testUserData.id = testUserId;
        testUserData.access = 2;
        await api.user.update(testUserData);
        await ApiTests.loginTest(App.config.testUser);
        await App.setupUser();

        setBlock('Accounts', 2);

        await ApiTests.resetAccounts();

        await apiCreateAccounts();
        await apiCreatePersons();
        await apiCreateTransactions();

        await apiSecurityTests();

        await apiUpdateTransactions();
        await apiSetTransactionPos();

        await apiImportTemplateTests();
        await apiImportRuleTests();

        await apiFilterTransactions();

        await apiUpdateAccounts();
        await apiDeleteAccounts();

        await apiUpdatePersons();
        await apiDeletePersons();

        await apiDeleteTransactions();

        await apiProfile();

        await api.user.login(App.config.testUser);
    },

    /** Initialize and run tests */
    async initAndRun(scenarioInstance) {
        this.init(scenarioInstance);
        await this.run();
    },
};
