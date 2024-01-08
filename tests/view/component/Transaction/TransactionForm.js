import { isObject, asArray } from '@jezvejs/types';
import { assert } from '@jezvejs/assert';
import {
    formatDate,
    isValidDateString,
} from '@jezvejs/datetime';
import {
    url,
    query,
    navigation,
    click,
    asyncMap,
    TestComponent,
    evaluate,
    waitForFunction,
} from 'jezve-test';
import { DropDown, LinkMenu, Switch } from 'jezvejs-test';
import {
    correct,
    correctExch,
    normalize,
    isValidValue,
    normalizeExch,
    trimToDigitsLimit,
    EXCHANGE_PRECISION,
    dateStringToSeconds,
    secondsToTime,
    INTERVAL_DAY,
    INTERVAL_MONTH,
    INTERVAL_NONE,
    INTERVAL_WEEK,
    INTERVAL_YEAR,
} from '../../../common.js';
import { TransactionTypeMenu } from '../Fields/TransactionTypeMenu.js';
import { InputField } from '../Fields/InputField.js';
import { WarningPopup } from '../WarningPopup.js';
import { DatePickerField } from '../Fields/DatePickerField.js';
import { TileInfoItem } from '../Tiles/TileInfoItem.js';
import { TileBlock } from '../Tiles/TileBlock.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
    Transaction,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';
import { __ } from '../../../model/locale.js';
import { ScheduledTransaction, getIntervalOffset } from '../../../model/ScheduledTransaction.js';
import { DatePickerFilter } from '../Fields/DatePickerFilter.js';
import { ReminderField } from '../Fields/ReminderField.js';
import { SelectReminderDialog } from '../Reminder/SelectReminderDialog.js';
import { REMINDER_ACTIVE } from '../../../model/Reminder.js';
import { getCurrencyPrecision } from '../../../model/import.js';
import { ACCOUNT_TYPE_CREDIT_CARD } from '../../../model/AccountsList.js';

export const TRANSACTION_FORM = 'transaction';
export const SCHEDULE_ITEM_FORM = 'scheduleItem';

const hiddenInputs = [
    'idInp',
    'personIdInp',
    'srcCurrInp',
    'destCurrInp',
    'debtOperationInp',
    'debtAccountInp',
    'srcIdInp',
    'destIdInp',
];

const infoItemSelectors = [
    '#srcAmountInfo',
    '#destAmountInfo',
    '#srcResultInfo',
    '#destResultInfo',
    '#exchangeInfo',
];

const inputFieldSelectors = [
    '#srcAmountField',
    '#destAmountField',
    '#exchangeField',
    '#srcResultField',
    '#destResultField',
    '#commentField',
    '#scheduleNameField',
];

/** Create or update transaction form class */
export class TransactionForm extends TestComponent {
    static getInitialState(options = {}, state = App.state) {
        const availActions = ['create', 'update'];
        const {
            id = 0,
            action = 'create',
            formType = TRANSACTION_FORM,
            type = EXPENSE,
            from = 0,
            fromAccount = 0,
            fromPerson = 0,
            fromReminder = 0,
        } = options;

        assert(availActions.includes(action), 'Invalid action');

        const isCreate = action === 'create';
        const model = {
            formType,
            type,
            isUpdate: action === 'update',
            srcAmountInvalidated: false,
            destAmountInvalidated: false,
            dateInvalidated: false,
            useBackExchange: false,
            repeatEnabled: false,
            startDate: '',
            endDate: '',
            dateRangeInvalidated: false,
            intervalStep: '',
            intervalStepInvalidated: false,
            intervalType: 0,
            intervalOffset: 0,
        };

        const userAccounts = state.getUserAccounts();
        const transactionOptions = {
            formType,
            transaction: null,
            isDuplicate: false,
            isReminder: false,
        };
        let reminder = null;
        let transaction = null;

        if (isCreate && from) {
            const item = (formType === SCHEDULE_ITEM_FORM)
                ? state.schedule.getItem(from)
                : state.transactions.getItem(from);
            assert(item, 'Transaction not found');

            transaction = structuredClone(item);
            delete transaction.id;

            model.isAvailable = true;
            model.isReminder = false;

            transactionOptions.transaction = transaction;
            transactionOptions.isDuplicate = true;

            Object.assign(model, this.transactionToModel(transactionOptions, state));
        } else if (isCreate && !from) {
            if (type === EXPENSE || type === INCOME) {
                model.isAvailable = userAccounts.length > 0;
            } else if (type === TRANSFER) {
                model.isAvailable = userAccounts.length > 1;
            } else if (type === DEBT) {
                model.isAvailable = state.persons.length > 0;
            }

            if (fromAccount || (!fromPerson && !fromReminder)) {
                const account = (fromAccount)
                    ? state.accounts.getItem(fromAccount)
                    : state.getFirstAccount();
                assert(account, 'Account not found');

                model.src_curr_id = account.curr_id;
                model.dest_curr_id = account.curr_id;

                if (type === EXPENSE) {
                    model.srcAccount = account;
                    model.destAccount = null;
                } else if (type === INCOME) {
                    model.srcAccount = null;
                    model.destAccount = account;
                } else if (type === TRANSFER) {
                    model.srcAccount = account;

                    const nextAccountId = state.getNextAccount(fromAccount);
                    assert(nextAccountId, 'Next account not found');

                    model.destAccount = state.accounts.getItem(nextAccountId);
                    model.dest_curr_id = model.destAccount.curr_id;
                }
            } else if (fromPerson) {
                model.person = state.persons.getItem(fromPerson);
                assert(model.person, 'Person not found');

                model.type = DEBT;
                model.debtType = true;
                model.noAccount = userAccounts.length === 0;

                if (model.noAccount) {
                    model.account = null;

                    const personAccounts = state.getPersonAccounts(model.person.id);
                    if (personAccounts.length > 0) {
                        model.personAccount = personAccounts.getItemByIndex(0);
                    } else {
                        const firstCurrency = App.currency.getItemByIndex(0);
                        model.personAccount = TransactionForm.getPersonAccount(
                            model.person.id,
                            firstCurrency.id,
                            state,
                        );
                    }
                } else {
                    model.account = userAccounts.getItemByIndex(0);
                    assert(model.account, 'Account not found');

                    model.personAccount = TransactionForm.getPersonAccount(
                        model.person.id,
                        model.account.curr_id,
                        state,
                    );
                }

                model.srcAccount = model.personAccount;
                model.destAccount = model.account;

                model.src_curr_id = model.personAccount.curr_id;
                model.dest_curr_id = model.personAccount.curr_id;
            } else if (fromReminder) {
                const isUpcoming = isObject(fromReminder);
                transaction = (
                    (isUpcoming)
                        ? state.getDefaultReminderTransactionBySchedule(
                            fromReminder.schedule_id,
                            fromReminder.date,
                        )
                        : state.getDefaultReminderTransaction(fromReminder)
                );
                assert(transaction, 'Invalid reminder');

                transactionOptions.transaction = transaction;
                transactionOptions.isReminder = true;

                reminder = (isUpcoming)
                    ? fromReminder
                    : state.reminders.getItem(fromReminder);
            }

            if (transaction !== null) {
                const typeChanged = options.type && options.type !== transaction.type;

                if (typeChanged) {
                    const mainAccount = (transaction.src_id !== 0)
                        ? transaction.src_id
                        : transaction.dest_id;

                    if (options.type === EXPENSE) {
                        transaction.src_id = mainAccount;
                        transaction.dest_id = 0;
                    } else if (options.type === INCOME) {
                        transaction.src_id = 0;
                        transaction.dest_id = mainAccount;
                    } else if (options.type === TRANSFER) {
                        transaction.src_id = mainAccount;
                        transaction.dest_id = state.getNextAccount();
                        if (transaction.dest_id === mainAccount) {
                            transaction.dest_id = state.getNextAccount(mainAccount);
                        }
                    } else if (options.type === DEBT) {
                        transaction.src_id = 0;
                        transaction.dest_id = mainAccount;

                        transaction.debtType = true;
                        model.person = state.getFirstPerson();
                        transaction.person_id = model.person?.id ?? 0;

                        transaction.acc_id = mainAccount;
                    }

                    if (transaction.src_id) {
                        const srcAccount = state.accounts.getItem(transaction.src_id);
                        if (srcAccount) {
                            transaction.src_curr = srcAccount.curr_id;
                        }
                    }

                    if (transaction.dest_id) {
                        const destAccount = state.accounts.getItem(transaction.dest_id);
                        if (destAccount) {
                            transaction.dest_curr = destAccount.curr_id;
                        }
                    }

                    if (options.type === EXPENSE) {
                        transaction.dest_curr = transaction.src_curr;
                    } else if (options.type === INCOME || options.type === LIMIT_CHANGE) {
                        transaction.src_curr = transaction.dest_curr;
                    } else if (options.type === DEBT && transaction.src_id === 0) {
                        if (transaction.dest_curr === 0) {
                            const currency = this.getFirstCurrency();
                            if (currency) {
                                transaction.dest_curr = currency.id;
                            }
                        }

                        transaction.src_curr = transaction.dest_curr;
                    }

                    transaction.type = options.type;
                }

                Object.assign(model, this.transactionToModel(transactionOptions, state));
            }

            model.isDiffCurr = (model.src_curr_id !== model.dest_curr_id);
            model.srcCurr = App.currency.getItem(model.src_curr_id);
            model.destCurr = App.currency.getItem(model.dest_curr_id);

            if (!fromReminder) {
                model.fSrcAmount = 0;
                model.srcAmount = '';

                model.fDestAmount = 0;
                model.destAmount = '';

                model.fSrcResBal = model.srcAccount?.balance ?? '';
                model.fDestResBal = model.destAccount?.balance ?? '';

                model.categoryId = 0;
                model.comment = '';
            }

            if (formType === TRANSACTION_FORM && !fromReminder) {
                model.date = App.datesFmt.now;
            } else if (formType === SCHEDULE_ITEM_FORM) {
                model.scheduleName = '';
                model.repeatEnabled = true;
                model.startDate = App.datesFmt.now;
                model.endDate = '';
                model.intervalStep = '1';
                model.intervalType = INTERVAL_MONTH;
                model.intervalOffset = App.dates.now.getDate() - 1;
            }

            model.isReminder = !!fromReminder;
        } else if (model.isUpdate) {
            transaction = (formType === SCHEDULE_ITEM_FORM)
                ? state.schedule.getItem(id)
                : state.transactions.getItem(id);
            assert(transaction, 'Transaction not found');

            model.isAvailable = true;
            model.isReminder = false;

            Object.assign(model, this.transactionToModel({ transaction, formType }, state));
        }

        model.srcResBal = model.fSrcResBal.toString();
        model.destResBal = model.fDestResBal.toString();

        model.reminderId = reminder?.id ?? 0;
        model.scheduleId = reminder?.schedule_id ?? 0;
        model.reminderDate = reminder?.date ?? 0;

        if (model.isAvailable) {
            model.exchSign = `${model.destCurr.sign}/${model.srcCurr.sign}`;
            model.backExchSign = `${model.srcCurr.sign}/${model.destCurr.sign}`;

            model.fExchRate = TransactionForm.calcExchange(model);
            model.exchRate = model.fExchRate.toString();

            model.fBackExchRate = TransactionForm.calcBackExchange(model);
            model.backExchRate = model.fBackExchRate.toString();

            model.fmtExch = `${model.fExchRate} ${model.exchSign}`;

            if (model.type === EXPENSE || model.type === INCOME) {
                model.state = (model.isDiffCurr) ? 2 : 0;
            }

            if (model.type === TRANSFER) {
                model.state = (model.isDiffCurr) ? 3 : 0;
            }

            if (model.type === DEBT) {
                const { debtType, noAccount } = model;

                if (model.isDiffCurr) {
                    model.state = (debtType) ? 10 : 16;
                } else if (debtType) {
                    model.state = (noAccount) ? 6 : 0;
                } else {
                    model.state = (noAccount) ? 7 : 3;
                }
            }

            if (model.type === LIMIT_CHANGE) {
                model.state = (formType === SCHEDULE_ITEM_FORM) ? 1 : 0;
            }
        } else {
            model.state = -1;
        }

        return this.getExpectedState(model, state);
    }

    static transactionToModel(options = {}, state) {
        const {
            transaction,
            formType = TRANSACTION_FORM,
            isReminder = false,
            isDuplicate = false,
        } = options;

        const model = {};

        const appState = (formType === TRANSACTION_FORM && !isReminder)
            ? state.createCancelled({ id: transaction.id })
            : state;

        model.type = transaction.type;

        model.fSrcAmount = transaction.src_amount;
        model.fDestAmount = transaction.dest_amount;

        let srcAccountAfter = state.accounts.getItem(transaction.src_id);
        let destAccountAfter = state.accounts.getItem(transaction.dest_id);

        model.srcAccount = appState.accounts.getItem(transaction.src_id);
        model.destAccount = appState.accounts.getItem(transaction.dest_id);

        model.src_curr_id = transaction.src_curr;
        model.dest_curr_id = transaction.dest_curr;

        model.isDiffCurr = (model.src_curr_id !== model.dest_curr_id);
        model.srcCurr = App.currency.getItem(model.src_curr_id);
        model.destCurr = App.currency.getItem(model.dest_curr_id);

        model.categoryId = transaction.category_id;
        if (formType === TRANSACTION_FORM) {
            model.date = App.reformatDate(secondsToTime(transaction.date));
        }
        model.comment = transaction.comment;

        if (model.type === DEBT) {
            model.debtType = transaction.debtType ?? (
                !!model.srcAccount
                && model.srcAccount.owner_id !== state.profile.owner_id
            );

            const personId = transaction.person_id ?? (
                (model.debtType)
                    ? model.srcAccount.owner_id
                    : model.destAccount.owner_id
            );
            const personCurrId = (model.debtType)
                ? model.src_curr_id
                : model.dest_curr_id;

            model.person = appState.persons.getItem(personId);
            assert(model.person, 'Person not found');

            model.noAccount = (model.debtType)
                ? !model.destAccount
                : !model.srcAccount;

            model.personAccount = TransactionForm.getPersonAccount(
                model.person.id,
                personCurrId,
                appState,
            );

            if (model.debtType) {
                model.srcAccount = model.personAccount;
            } else {
                model.destAccount = model.personAccount;
            }

            if (model.noAccount) {
                const lastAcc = (isReminder)
                    ? state.accounts.getItem(transaction.lastAcc_id)
                    : state.getFirstAccount();

                if (model.debtType) {
                    destAccountAfter = lastAcc ?? { balance: 0 };
                } else {
                    srcAccountAfter = lastAcc ?? { balance: 0 };
                }

                if (srcAccountAfter && (!model.debtType || isReminder)) {
                    srcAccountAfter.balance = normalize(
                        srcAccountAfter.balance - model.fSrcAmount,
                        model.srcCurr.precision,
                    );
                }

                if (destAccountAfter && (model.debtType || isReminder)) {
                    destAccountAfter.balance = normalize(
                        destAccountAfter.balance + model.fDestAmount,
                        model.destCurr.precision,
                    );
                }
            } else {
                model.account = (model.debtType)
                    ? model.destAccount
                    : model.srcAccount;
            }
        } else if (model.type === LIMIT_CHANGE) {
            if (model.srcAccount) {
                model.destAccount = model.srcAccount;
                model.srcAccount = null;
                model.destCurr = model.srcCurr;

                srcAccountAfter = null;
                destAccountAfter = state.accounts.getItem(model.destAccount.id);

                model.dest_curr_id = model.src_curr_id;
                model.dest_curr = model.src_curr;
                model.fSrcAmount = -model.fSrcAmount;
                model.fDestAmount = model.fSrcAmount;
            }
        }

        model.srcAmount = model.fSrcAmount.toString();
        model.destAmount = model.fDestAmount.toString();

        const useAfter = (
            (model.type === DEBT && model.noAccount)
            || (model.type === LIMIT_CHANGE && model.srcAccount)
        );

        if (!useAfter && (isReminder || isDuplicate)) {
            model.fSrcResBal = (model.srcAccount)
                ? normalize(
                    model.srcAccount.balance - model.fSrcAmount,
                    model.srcCurr.precision,
                )
                : '';

            model.fDestResBal = (model.destAccount)
                ? normalize(
                    model.destAccount.balance + model.fDestAmount,
                    model.destCurr.precision,
                )
                : '';
        } else {
            model.fSrcResBal = srcAccountAfter?.balance ?? '';
            model.fDestResBal = destAccountAfter?.balance ?? '';
        }

        if (formType === SCHEDULE_ITEM_FORM) {
            model.scheduleName = transaction.name;
            model.repeatEnabled = transaction.interval_type !== INTERVAL_NONE;
            model.startDate = App.reformatDate(secondsToTime(transaction.start_date));
            model.endDate = (transaction.end_date)
                ? App.reformatDate(secondsToTime(transaction.end_date))
                : '';
            model.intervalStep = transaction.interval_step;
            model.intervalType = transaction.interval_type;
            model.intervalOffset = transaction.interval_offset;
        }

        return model;
    }

    static getExpectedState(model, state) {
        const stateId = parseInt(model.state, 10);
        assert(!Number.isNaN(stateId), 'Invalid state id');

        assert(state, 'Invalid state');

        const isTransactionForm = (model.formType === TRANSACTION_FORM);
        const isScheduleItemForm = (model.formType === SCHEDULE_ITEM_FORM);

        const isExpense = model.type === EXPENSE;
        const isIncome = model.type === INCOME;
        const isTransfer = model.type === TRANSFER;
        const isDebt = model.type === DEBT;
        const isLimitChange = model.type === LIMIT_CHANGE;
        const { isAvailable, isDiffCurr } = model;

        const allowCreditLimit = (
            model.srcAccount?.type === ACCOUNT_TYPE_CREDIT_CARD
            || model.destAccount?.type === ACCOUNT_TYPE_CREDIT_CARD
        );

        const res = {
            typeMenu: {
                value: model.type,
                items: [
                    {
                        id: 'all',
                        title: __('actions.showAll'),
                        hidden: true,
                    },
                    {
                        id: EXPENSE.toString(),
                        title: __('transactions.types.expense'),
                        hidden: false,
                    },
                    {
                        id: INCOME.toString(),
                        title: __('transactions.types.income'),
                        hidden: false,
                    },
                    {
                        id: TRANSFER.toString(),
                        title: __('transactions.types.transfer'),
                        hidden: false,
                    },
                    {
                        id: DEBT.toString(),
                        title: __('transactions.types.debt'),
                        hidden: false,
                    },
                    {
                        id: LIMIT_CHANGE.toString(),
                        title: __('transactions.types.creditLimit'),
                        hidden: !allowCreditLimit,
                    },
                ],
            },
            personContainer: {
                tile: {},
                visible: isAvailable && isDebt,
            },
            debtAccountContainer: {
                tile: {
                    visible: (
                        isAvailable
                        && isDebt
                        && !model.noAccount
                    ),
                },
                visible: isAvailable && isDebt,
            },
            sourceContainer: {
                visible: (
                    isAvailable
                    && (isExpense || isTransfer)
                ),
            },
            destContainer: {
                visible: (
                    isAvailable
                    && (isIncome || isTransfer || isLimitChange)
                ),
            },
            swapBtn: {
                visible: (
                    isAvailable
                    && (isTransfer || isDebt)
                ),
            },
            srcAmountField: {},
            destAmountField: {},
            srcResultField: {},
            destResultField: {},
            exchangeField: {},
            srcAmountInfo: {},
            destAmountInfo: {},
            srcResultInfo: {},
            destResultInfo: {},
            exchangeInfo: {},
            reminderField: null,
            reminderDialog: {},
        };

        if (isAvailable) {
            res.srcAmountField.value = model.srcAmount?.toString() ?? '';
            res.srcAmountField.currSign = (model.srcCurr) ? model.srcCurr.sign : '';
            res.srcAmountField.isCurrActive = (isIncome || (isDebt && model.debtType));
            res.srcAmountField.isInvalid = model.srcAmountInvalidated;

            res.destAmountField.value = model.destAmount?.toString() ?? '';
            res.destAmountField.currSign = (model.destCurr) ? model.destCurr.sign : '';
            res.destAmountField.isCurrActive = (isExpense || (isDebt && !model.debtType));
            res.destAmountField.isInvalid = model.destAmountInvalidated;

            if (model.destCurr && model.srcCurr) {
                const exchRateValue = (model.useBackExchange)
                    ? model.backExchRate
                    : model.exchRate;
                const exchSign = (model.useBackExchange)
                    ? model.backExchSign
                    : model.exchSign;

                res.exchangeField.value = exchRateValue.toString();
                res.exchangeField.currSign = exchSign;
                res.exchangeInfo.value = model.fmtExch;
            }

            if (isTransactionForm) {
                res.datePicker = {
                    visible: true,
                    value: App.reformatDate(model.date),
                    isInvalid: model.dateInvalidated,
                };
            }

            // Reminder field
            const remindersAvailable = isTransactionForm && state.schedule.length > 0;
            const reminderId = parseInt(model.reminderId, 10);
            const scheduleId = parseInt(model.scheduleId, 10);
            const { repeatEnabled } = model;

            if (remindersAvailable && !repeatEnabled) {
                res.reminderField = {
                    visible: true,
                    closeBtn: {
                        visible: !!(reminderId || scheduleId),
                    },
                    selectBtn: {
                        visible: true,
                    },
                    value: {
                        reminder_id: (model.reminderId ?? 0).toString(),
                        schedule_id: (model.scheduleId ?? 0).toString(),
                        reminder_date: (model.reminderDate ?? 0).toString(),
                    },
                };
            }

            // Select reminder dialog
            res.reminderDialog = {
                visible: model.reminderDialogVisible,
            };

            res.repeatSwitch = {
                visible: !model.isReminder,
                checked: repeatEnabled,
            };

            if (isScheduleItemForm || repeatEnabled) {
                res.scheduleNameField = {
                    visible: true,
                    value: model.scheduleName,
                };

                res.dateRangeInput = {
                    visible: true,
                    startInputGroup: { visible: true },
                    endInputGroup: { visible: repeatEnabled },
                    value: {
                        startDate: App.reformatDate(model.startDate),
                        endDate: App.reformatDate(model.endDate),
                    },
                    invalidated: model.dateRangeInvalidated,
                };

                res.intervalStepField = {
                    visible: repeatEnabled,
                    isInvalid: model.intervalStepInvalidated,
                };
                res.intervalTypeSelect = {
                    visible: repeatEnabled,
                };

                if (repeatEnabled) {
                    res.intervalStepField.value = model.intervalStep.toString();
                    res.intervalTypeSelect.value = model.intervalType.toString();
                }

                res.weekDayOffsetSelect = {
                    visible: repeatEnabled && model.intervalType === INTERVAL_WEEK,
                };
                if (res.weekDayOffsetSelect.visible) {
                    const offset = asArray(model.intervalOffset).map((item) => item?.toString());
                    offset.sort();
                    res.weekDayOffsetSelect.value = offset;
                }

                const dayOffsetIntervals = [INTERVAL_MONTH, INTERVAL_YEAR];

                res.monthDayOffsetSelect = {
                    visible: repeatEnabled && dayOffsetIntervals.includes(model.intervalType),
                };
                res.monthOffsetSelect = {
                    visible: repeatEnabled && model.intervalType === INTERVAL_YEAR,
                };

                if (model.intervalType === INTERVAL_MONTH) {
                    res.monthDayOffsetSelect.value = model.intervalOffset.toString();
                } else if (model.intervalType === INTERVAL_YEAR) {
                    const dayIndex = (model.intervalOffset % 100);
                    const monthIndex = Math.floor(model.intervalOffset / 100);

                    res.monthDayOffsetSelect.value = dayIndex.toString();
                    res.monthOffsetSelect.value = monthIndex.toString();
                }
            }

            res.categorySelect = {
                visible: true,
                value: model.categoryId.toString(),
            };

            if (model.categorySelectOpen) {
                const visibleCategories = state
                    .getCategoriesForType(model.type)
                    .map((item) => ({ id: item.id.toString() }));

                res.categorySelect.items = visibleCategories;
            }

            res.commentField = {
                visible: true,
                value: model.comment,
            };
        }

        if (isExpense || isTransfer) {
            res.sourceContainer.tile = {
                visible: isAvailable,
            };

            if (isAvailable) {
                res.sourceContainer.tile.title = (model.srcAccount) ? model.srcAccount.name : '';
                res.sourceContainer.tile.subtitle = (model.srcAccount)
                    ? model.srcCurr.format(model.srcAccount.balance)
                    : '';
            }
        }

        if (isIncome || isTransfer || isLimitChange) {
            res.destContainer.tile = {
                visible: isAvailable,
            };

            if (isAvailable) {
                res.destContainer.tile.title = (model.destAccount) ? model.destAccount.name : '';
                res.destContainer.tile.subtitle = (model.destAccount)
                    ? model.destCurr.format(model.destAccount.balance)
                    : '';
            }
        }

        if ((isExpense || isTransfer || isDebt) && isAvailable && isTransactionForm) {
            res.srcResultField.value = model.srcResBal.toString();
            res.srcResultField.isCurrActive = false;

            res.srcResultInfo.value = (model.srcCurr)
                ? model.srcCurr.format(model.fSrcResBal)
                : '';
        }

        if (model.type !== EXPENSE && isAvailable) {
            res.srcAmountInfo.value = (model.srcCurr) ? model.srcCurr.format(model.fSrcAmount) : '';

            if (isTransactionForm) {
                res.destResultField.value = model.destResBal.toString();

                res.destResultField.isCurrActive = false;

                res.destResultInfo.value = (model.destCurr)
                    ? model.destCurr.format(model.fDestResBal)
                    : '';
            }
        }
        if (model.type !== DEBT && isAvailable) {
            res.destAmountInfo.value = (model.destCurr) ? model.destCurr.format(model.fDestAmount) : '';
        }

        if (isAvailable) {
            if (model.type === LIMIT_CHANGE) {
                res.srcAmountField.label = '';
                res.destAmountField.label = __('transactions.limitDelta');
            } else {
                res.srcAmountField.label = (isDiffCurr) ? __('transactions.sourceAmount') : __('transactions.amount');
                res.destAmountField.label = (isDiffCurr) ? __('transactions.destAmount') : __('transactions.amount');
            }
        }

        const resultBalanceTok = __('transactions.result');

        if (isExpense) {
            assert(stateId >= -1 && stateId <= 4, 'Invalid state specified');

            if (isAvailable && isTransactionForm) {
                res.srcResultField.label = resultBalanceTok;
            }

            res.srcAmountInfo.visible = false;
            if (isScheduleItemForm) {
                this.hideInputField(res, 'srcResult');
            }
            this.hideInputField(res, 'destResult');

            if (stateId === -1) {
                this.hideInputField(res, 'srcAmount');
                this.hideInputField(res, 'destAmount');
                this.hideInputField(res, 'srcResult');
                this.hideInputField(res, 'exchange');
            } else if (stateId === 0) {
                this.hideInputField(res, 'srcAmount');
                this.showInputField(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                }
                this.hideInputField(res, 'exchange');
            } else if (stateId === 1 && isTransactionForm) {
                this.hideInputField(res, 'srcAmount');
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', true);
                this.hideInputField(res, 'exchange');
            } else if (stateId === 2) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                }
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 3) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', false);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                }
                this.showInputField(res, 'exchange', true);
            } else if (stateId === 4 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'exchange', false);
            }
        }

        if (isIncome) {
            assert(stateId >= -1 && stateId <= 4, 'Invalid state specified');

            if (isAvailable && isTransactionForm) {
                res.destResultField.label = resultBalanceTok;
            }

            this.hideInputField(res, 'srcResult');
            if (isScheduleItemForm) {
                this.hideInputField(res, 'destResult');
            }

            if (stateId === -1) {
                this.hideInputField(res, 'srcAmount');
                this.hideInputField(res, 'destAmount');
                this.hideInputField(res, 'destResult');
                this.hideInputField(res, 'exchange');
            } else if (stateId === 0) {
                this.showInputField(res, 'srcAmount', true);
                this.hideInputField(res, 'destAmount');
                if (isTransactionForm) {
                    this.showInputField(res, 'destResult', false);
                }
                this.hideInputField(res, 'exchange');
            } else if (stateId === 1 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.hideInputField(res, 'destAmount');
                this.showInputField(res, 'destResult', true);
                this.hideInputField(res, 'exchange');
            } else if (stateId === 2) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputField(res, 'destResult', false);
                }
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 3) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', false);
                if (isTransactionForm) {
                    this.showInputField(res, 'destResult', false);
                }
                this.showInputField(res, 'exchange', true);
            } else if (stateId === 4 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'destResult', true);
                this.showInputField(res, 'exchange', false);
            }
        }

        if (isTransfer) {
            assert(stateId >= -1 && stateId <= 8, 'Invalid state specified');

            if (isAvailable && isTransactionForm) {
                res.srcResultField.label = `${resultBalanceTok} (${__('transactions.source')})`;
                res.destResultField.label = `${resultBalanceTok} (${__('transactions.destination')})`;
            }

            if (isScheduleItemForm) {
                this.hideInputField(res, 'srcResult');
                this.hideInputField(res, 'destResult');
            }

            if (stateId === -1) {
                this.hideInputField(res, 'srcAmount');
                this.hideInputField(res, 'destAmount');
                this.hideInputField(res, 'srcResult');
                this.hideInputField(res, 'destResult');
                this.hideInputField(res, 'exchange');
            } else if (stateId === 0) {
                this.showInputField(res, 'srcAmount', true);
                this.hideInputField(res, 'destAmount');
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                    this.showInputField(res, 'destResult', false);
                }
                this.hideInputField(res, 'exchange');
            } else if (stateId === 1 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.hideInputField(res, 'destAmount');
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', false);
                this.hideInputField(res, 'exchange');
            } else if (stateId === 2 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.hideInputField(res, 'destAmount');
                this.showInputField(res, 'srcResult', false);
                this.showInputField(res, 'destResult', true);
                this.hideInputField(res, 'exchange');
            } else if (stateId === 3) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                    this.showInputField(res, 'destResult', false);
                }
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 4 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', true);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', false);
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 5 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', false);
                this.showInputField(res, 'destResult', true);
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 6 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', true);
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 7) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', false);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                    this.showInputField(res, 'destResult', false);
                }
                this.showInputField(res, 'exchange', true);
            } else if (stateId === 8 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', false);
                this.showInputField(res, 'exchange', true);
            }
        }

        if (isDebt) {
            assert(stateId >= -1 && stateId <= 21, 'Invalid state specified');

            const { debtType, noAccount } = model;
            const userAccounts = state.getUserAccounts();
            const accountsAvailable = userAccounts.length > 0;

            res.selaccount = { visible: isAvailable && noAccount && accountsAvailable };
            res.noacc_btn = { visible: isAvailable && !noAccount };
            res.noAccountsMsg = { visible: isAvailable && !accountsAvailable };

            if (isAvailable && isTransactionForm) {
                res.srcResultField.label = `${__('transactions.sourceResult')}`;
                res.destResultField.label = `${__('transactions.destResult')}`;
            }

            if (debtType) {
                if (isAvailable) {
                    res.personContainer.label = __('transactions.sourcePerson');
                    res.personContainer.tile.title = (model.person) ? model.person.name : '';
                    res.personContainer.tile.subtitle = (model.srcAccount)
                        ? model.srcCurr.format(model.srcAccount.balance)
                        : '';
                }

                if (!model.noAccount) {
                    if (isAvailable) {
                        res.debtAccountContainer.tile.title = (model.destAccount) ? model.destAccount.name : '';
                        res.debtAccountContainer.tile.subtitle = (model.destAccount)
                            ? model.destCurr.format(model.destAccount.balance)
                            : '';
                    }
                }
            } else {
                if (isAvailable) {
                    res.personContainer.label = __('transactions.destPerson');
                    res.personContainer.tile.title = (model.person) ? model.person.name : '';
                    res.personContainer.tile.subtitle = (model.destAccount)
                        ? model.destCurr.format(model.destAccount.balance)
                        : '';
                }

                if (!model.noAccount) {
                    if (isAvailable) {
                        res.debtAccountContainer.tile.title = (model.srcAccount) ? model.srcAccount.name : '';
                        res.debtAccountContainer.tile.subtitle = (model.srcAccount)
                            ? model.srcCurr.format(model.srcAccount.balance)
                            : '';
                    }
                }
            }

            if (stateId < 10) {
                this.hideInputField(res, 'exchange');
            }

            if (isScheduleItemForm) {
                this.hideInputField(res, 'srcResult');
                this.hideInputField(res, 'destResult');
            }

            if (stateId === -1) {
                this.hideInputField(res, 'srcAmount');
                this.hideInputField(res, 'destAmount');
                this.hideInputField(res, 'srcResult');
                this.hideInputField(res, 'destResult');
            } else if (stateId === 0) {
                this.showInputField(res, 'srcAmount', true);
                this.hideInputField(res, 'destAmount');
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                    this.showInputField(res, 'destResult', false);
                }
            } else if (stateId === 1 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.hideInputField(res, 'destAmount');
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', false);
            } else if (stateId === 2 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.hideInputField(res, 'destAmount');
                this.showInputField(res, 'srcResult', false);
                this.showInputField(res, 'destResult', true);
            } else if (stateId === 3) {
                this.hideInputField(res, 'srcAmount');
                this.showInputField(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                    this.showInputField(res, 'destResult', false);
                }
            } else if (stateId === 4 && isTransactionForm) {
                this.hideInputField(res, 'srcAmount');
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', false);
                this.showInputField(res, 'destResult', true);
            } else if (stateId === 5 && isTransactionForm) {
                this.hideInputField(res, 'srcAmount');
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', false);
            } else if (stateId === 6) {
                this.showInputField(res, 'srcAmount', true);
                this.hideInputField(res, 'destAmount');
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                }
                this.hideInputField(res, 'destResult');
            } else if (stateId === 7) {
                this.hideInputField(res, 'srcAmount');
                this.showInputField(res, 'destAmount', true);
                this.hideInputField(res, 'srcResult');
                if (isTransactionForm) {
                    this.showInputField(res, 'destResult', false);
                }
            } else if (stateId === 8 && isTransactionForm) {
                this.hideInputField(res, 'srcAmount');
                this.showInputField(res, 'destAmount', false);
                this.hideInputField(res, 'srcResult');
                this.showInputField(res, 'destResult', true);
            } else if (stateId === 9 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.hideInputField(res, 'destAmount');
                this.showInputField(res, 'srcResult', true);
                this.hideInputField(res, 'destResult');
            } else if (stateId === 10 || stateId === 16) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                    this.showInputField(res, 'destResult', false);
                }
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 11 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', true);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', false);
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 12) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', false);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                    this.showInputField(res, 'destResult', false);
                }
                this.showInputField(res, 'exchange', true);
            } else if (stateId === 13 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', false);
                this.showInputField(res, 'exchange', true);
            } else if ((stateId === 14 || stateId === 20) && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', true);
                this.showInputField(res, 'exchange', false);
            } else if ((stateId === 15 || stateId === 17) && isTransactionForm) {
                this.showInputField(res, 'srcAmount', true);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', false);
                this.showInputField(res, 'destResult', true);
                this.showInputField(res, 'exchange', false);
            } else if (stateId === 18) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputField(res, 'srcResult', false);
                    this.showInputField(res, 'destResult', false);
                }
                this.showInputField(res, 'exchange', true);
            } else if (stateId === 19 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'srcResult', false);
                this.showInputField(res, 'destResult', true);
                this.showInputField(res, 'exchange', true);
            } else if (stateId === 21 && isTransactionForm) {
                this.showInputField(res, 'srcAmount', false);
                this.showInputField(res, 'destAmount', true);
                this.showInputField(res, 'srcResult', true);
                this.showInputField(res, 'destResult', false);
                this.showInputField(res, 'exchange', false);
            }
        }

        if (isLimitChange) {
            this.hideInputField(res, 'srcAmount');
            this.hideInputField(res, 'exchange');
            this.hideInputField(res, 'srcResult');
            if (isScheduleItemForm) {
                this.hideInputField(res, 'destResult');
            }

            if (stateId === -1) {
                this.hideInputField(res, 'destAmount');
                this.hideInputField(res, 'destResult');
            } else if (stateId === 0 && isTransactionForm) {
                this.showInputField(res, 'destAmount', false);
                this.showInputField(res, 'destResult', true);
            } else if (stateId === 1) {
                this.showInputField(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputField(res, 'destResult', false);
                }
            }
        }

        return res;
    }

    static showInputField(model, name, showInput) {
        const res = model;
        const fieldName = `${name}Field`;
        const infoName = `${name}Info`;
        assert(isObject(res[fieldName]) && isObject(res[infoName]), `Invalid row name: ${name}`);

        res[fieldName].visible = showInput;
        res[infoName].visible = !showInput;

        return res;
    }

    static hideInputField(model, name) {
        const res = model;
        const fieldName = `${name}Field`;
        const infoName = `${name}Info`;
        assert(isObject(res[fieldName]) && isObject(res[infoName]), `Invalid row name: ${name}`);

        res[fieldName].visible = false;
        res[infoName].visible = false;

        return res;
    }

    static calcExchange(model) {
        if (model.fSrcAmount === 0 || model.fDestAmount === 0) {
            return 1;
        }

        return correctExch(Math.abs(model.fDestAmount / model.fSrcAmount));
    }

    static calcBackExchange(model) {
        if (model.fSrcAmount === 0 || model.fDestAmount === 0) {
            return 1;
        }

        return correctExch(Math.abs(model.fSrcAmount / model.fDestAmount));
    }

    static getPersonAccount(personId, currencyId, state) {
        const currency = App.currency.getItem(currencyId);
        if (!currency) {
            return null;
        }

        const personAccount = state.getPersonAccount(personId, currencyId);
        if (personAccount) {
            return personAccount;
        }

        return {
            balance: 0,
            curr_id: currencyId,
        };
    }

    constructor(parent, elem, formType = TRANSACTION_FORM) {
        super(parent, elem);
        this.formType = formType;
    }

    get reminderDialog() {
        return this.content.reminderDialog;
    }

    isTransactionForm() {
        return this.formType === TRANSACTION_FORM;
    }

    isScheduleItemForm() {
        return this.formType === SCHEDULE_ITEM_FORM;
    }

    async parseContent() {
        const res = {
            reminderDialog: { elem: await query('.popup.select-reminder-dialog') },
        };

        [
            res.renderTime,
            res.notAvailMsg,
            res.id,
            res.personId,
            res.srcCurrId,
            res.destCurrId,
            res.debtOperation,
            res.debtAccountId,
            res.srcId,
            res.destId,
            res.reminderDialog.visible,
        ] = await evaluate((el, inputs, reminderDialogEl) => {
            const notAvailMsg = document.getElementById('notAvailMsg');

            return [
                el.dataset.time,
                {
                    visible: notAvailMsg && !notAvailMsg.hidden,
                    message: notAvailMsg.textContent,
                },
                ...inputs.map((id) => (parseInt(document.getElementById(id)?.value, 10))),
                reminderDialogEl && !reminderDialogEl.hidden,
            ];
        }, this.elem, hiddenInputs, res.reminderDialog.elem);

        const location = await url();
        res.isUpdate = location.includes('/update/');
        if (res.isUpdate) {
            assert(res.id, 'Wrong transaction id');
        }
        res.isReminder = location.includes('reminder_id=') || location.includes('schedule_id=');

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        assert(!res.typeMenu.multi, 'Invalid transaction type menu');

        res.personContainer = await TileBlock.create(this, await query('#personContainer'));
        if (res.personContainer) {
            res.personContainer.content.id = res.personId;
        }

        const accountBlock = await query('#debtAccountContainer');
        res.debtAccountContainer = await TileBlock.create(this, accountBlock);
        if (res.debtAccountContainer) {
            res.debtAccountContainer.content.id = res.debtAccountId;
        }

        res.selaccount = { elem: await query(accountBlock, '.account-toggler .btn') };
        assert(res.selaccount.elem, 'Select account button not found');

        res.swapBtn = { elem: await query('#swapBtn') };
        assert(res.swapBtn.elem, 'Swap button not found');

        res.noacc_btn = { elem: await query(accountBlock, '.close-btn') };
        assert(res.noacc_btn.elem, 'Disable account button not found');
        res.noAccountsMsg = { elem: await query(accountBlock, '.nodata-message') };

        res.sourceContainer = await TileBlock.create(this, await query('#sourceContainer'));
        if (res.sourceContainer) {
            res.sourceContainer.content.id = res.srcId;
        }
        res.destContainer = await TileBlock.create(this, await query('#destContainer'));
        if (res.destContainer) {
            res.destContainer.content.id = res.destId;
        }

        [
            res.srcAmountInfo,
            res.destAmountInfo,
            res.srcResultInfo,
            res.destResultInfo,
            res.exchangeInfo,
        ] = await asyncMap(
            infoItemSelectors,
            async (selector) => TileInfoItem.create(this, await query(selector)),
        );

        [
            res.srcAmountField,
            res.destAmountField,
            res.exchangeField,
            res.srcResultField,
            res.destResultField,
            res.commentField,
            res.scheduleNameField,
        ] = await asyncMap(
            inputFieldSelectors,
            async (selector) => InputField.create(this, await query(selector)),
        );

        if (this.isTransactionForm()) {
            res.datePicker = await DatePickerField.create(this, await query('#dateField'));
        }

        res.dateRangeInput = await DatePickerFilter.create(this, await query('.date-range-input'));

        const repeatSwitchEl = await query(this.elem, '.repeat-switch-field');
        res.repeatSwitch = await Switch.create(this, repeatSwitchEl);

        res.reminderField = await ReminderField.create(this, await query('.reminder-field'));
        if (res.reminderDialog.visible) {
            res.reminderDialog = await SelectReminderDialog.create(this, res.reminderDialog.elem);
        }

        res.intervalStepField = await InputField.create(this, await query('#intervalStepField'));
        const intervalTypeSel = await query('.interval-type-select');
        res.intervalTypeSelect = await DropDown.create(this, intervalTypeSel);

        res.weekDayOffsetSelect = await LinkMenu.create(this, await query('.weekday-select'));
        res.weekDayOffsetSelect.content.value.sort();
        res.weekdaysBtn = { elem: await query('.field-header-btn[data-value="weekdays"]') };
        res.weekendBtn = { elem: await query('.field-header-btn[data-value="weekend"]') };

        res.monthDayOffsetSelect = await DropDown.create(this, await query('.month-day-select'));

        res.monthOffsetSelect = await DropDown.create(this, await query('.month-select'));

        res.categorySelect = await DropDown.createFromChild(this, await query('#categorySelect'));

        res.submitBtn = await query('.form-controls .submit-btn');
        assert(res.submitBtn, 'Submit button not found');
        res.cancelBtn = await query('.form-controls .cancel-btn');
        assert(res.cancelBtn, 'Cancel button not found');

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    appState(model = this.model) {
        return App.view.appState(model);
    }

    buildModel(cont) {
        const res = this.model;

        res.renderTime = cont.renderTime;
        res.formType = this.formType;

        res.type = cont.typeMenu.value;
        assert(Transaction.availTypes.includes(res.type), 'Invalid type selected');

        res.isAvailable = !cont.notAvailMsg.visible;

        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }
        res.isReminder = cont.isReminder;

        const appState = this.appState(res);

        res.srcAccount = (cont.sourceContainer)
            ? appState.accounts.getItem(cont.sourceContainer.content.id)
            : null;
        res.destAccount = (cont.destContainer)
            ? appState.accounts.getItem(cont.destContainer.content.id)
            : null;

        res.src_curr_id = cont.srcCurrId;
        res.dest_curr_id = cont.destCurrId;

        res.srcCurr = App.currency.getItem(res.src_curr_id);
        res.destCurr = App.currency.getItem(res.dest_curr_id);
        if (res.isAvailable) {
            assert(res.srcCurr, 'Source currency not found');
            assert(res.destCurr, 'Destination currency not found');
        }
        res.isDiffCurr = (res.src_curr_id !== res.dest_curr_id);

        res.srcAmount = cont.srcAmountField.value;
        res.srcAmountInvalidated = cont.srcAmountField.isInvalid;
        res.fSrcAmount = (res.isAvailable && isValidValue(res.srcAmount))
            ? normalize(res.srcAmount, res.srcCurr.precision)
            : res.srcAmount;

        res.destAmount = cont.destAmountField.value;
        res.destAmountInvalidated = cont.destAmountField.isInvalid;
        res.fDestAmount = (res.isAvailable && isValidValue(res.destAmount))
            ? normalize(res.destAmount, res.destCurr.precision)
            : res.destAmount;

        res.srcResBal = cont.srcResultField.value;
        res.fSrcResBal = (res.isAvailable && isValidValue(res.srcResBal))
            ? normalize(res.srcResBal, res.srcCurr.precision)
            : res.srcResBal;

        res.destResBal = cont.destResultField.value;
        res.fDestResBal = (res.isAvailable && isValidValue(res.destResBal))
            ? normalize(res.destResBal, res.destCurr.precision)
            : res.destResBal;

        if (res.isAvailable) {
            res.exchSign = `${res.destCurr.sign}/${res.srcCurr.sign}`;
            res.backExchSign = `${res.srcCurr.sign}/${res.destCurr.sign}`;

            res.useBackExchange = (res.isDiffCurr)
                ? (cont.exchangeField.currSign === res.backExchSign)
                : false;

            if (res.useBackExchange) {
                res.backExchRate = cont.exchangeField.value;
                res.exchRate = this.calcExchange(res);
            } else {
                res.exchRate = cont.exchangeField.value;
                res.backExchRate = this.calcBackExchange(res);
            }

            this.updateExch();
        }

        const srcAmountFieldVisible = cont.srcAmountField?.visible;
        const destAmountFieldVisible = cont.destAmountField?.visible;
        const srcResFieldVisible = cont.srcResultField?.visible;
        const destResFieldVisible = cont.destResultField.visible;
        const exchFieldVisible = cont.exchangeField?.visible;

        if (res.type === EXPENSE) {
            if (res.isAvailable) {
                assert(res.srcAccount, 'Source account not found');
            }

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.isDiffCurr) {
                if (exchFieldVisible) {
                    res.state = 3;
                } else {
                    res.state = (srcResFieldVisible) ? 4 : 2;
                }
            } else {
                res.state = (srcResFieldVisible) ? 1 : 0;
            }
        }

        if (res.type === INCOME) {
            if (res.isAvailable) {
                assert(res.destAccount, 'Destination account not found');
            }

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.isDiffCurr) {
                if (exchFieldVisible) {
                    res.state = 3;
                } else {
                    res.state = (destResFieldVisible) ? 4 : 2;
                }
            } else {
                res.state = (destResFieldVisible) ? 1 : 0;
            }
        }

        if (res.type === TRANSFER) {
            if (res.isAvailable) {
                assert(res.srcAccount, 'Source account not found');
                assert(res.destAccount, 'Destination account not found');
            }

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.isDiffCurr) {
                if (srcAmountFieldVisible && destAmountFieldVisible) {
                    res.state = 3;
                } else if (destAmountFieldVisible && srcResFieldVisible) {
                    res.state = 4;
                } else if (srcAmountFieldVisible && destResFieldVisible) {
                    res.state = 5;
                } else if (srcResFieldVisible && destResFieldVisible) {
                    res.state = 6;
                } else if (srcAmountFieldVisible && exchFieldVisible) {
                    res.state = 7;
                } else if (srcResFieldVisible && exchFieldVisible) {
                    res.state = 8;
                } else {
                    throw new Error('Unexpected state');
                }
            } else if (!res.isDiffCurr) {
                if (srcAmountFieldVisible) {
                    res.state = 0;
                } else if (srcResFieldVisible) {
                    res.state = 1;
                } else if (destResFieldVisible) {
                    res.state = 2;
                } else {
                    throw new Error('Unexpected state');
                }
            }
        }

        if (res.type === DEBT) {
            res.person = appState.persons.getItem(cont.personContainer.content.id);
            if (res.isAvailable) {
                assert(res.person, 'Person not found');
            }

            res.debtType = cont.debtOperation === 1;

            const personAccountCurr = (res.debtType) ? res.src_curr_id : res.dest_curr_id;
            res.personAccount = this.getPersonAccount(res.person?.id, personAccountCurr);

            const isSelectAccountVisible = cont.selaccount.visible;
            res.noAccount = isSelectAccountVisible || cont.noAccountsMsg.visible;

            res.account = appState.accounts.getItem(cont.debtAccountContainer.content.id);
            if (res.isAvailable && !res.noAccount) {
                assert(res.account, 'Account not found');
                const accountCurrency = (res.debtType) ? res.dest_curr_id : res.src_curr_id;
                assert(res.account.curr_id === accountCurrency, 'Invalid currency of account');
            }

            if (this.model && this.model.lastAccount_id) {
                res.lastAccount_id = this.model.lastAccount_id;
            }

            if (res.debtType) {
                res.srcAccount = res.personAccount;
                res.destAccount = (res.noAccount) ? null : res.account;
            } else {
                res.srcAccount = (res.noAccount) ? null : res.account;
                res.destAccount = res.personAccount;
            }

            if (res.src_curr_id === res.dest_curr_id) {
                assert(res.fSrcAmount === res.fDestAmount, 'Source and destination amount are different');
            }

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.noAccount) {
                if (srcAmountFieldVisible && res.debtType) {
                    res.state = 6;
                } else if (destAmountFieldVisible && !res.debtType) {
                    res.state = 7;
                } else if (srcResFieldVisible && res.debtType) {
                    res.state = 9;
                } else if (destResFieldVisible && !res.debtType) {
                    res.state = 8;
                } else {
                    throw new Error('Unexpected state');
                }
            } else if (!res.noAccount) {
                if (res.isDiffCurr) {
                    if (srcAmountFieldVisible && destAmountFieldVisible) {
                        res.state = (res.debtType) ? 10 : 16;
                    } else if (destAmountFieldVisible && srcResFieldVisible) {
                        res.state = (res.debtType) ? 11 : 21;
                    } else if (srcAmountFieldVisible && exchFieldVisible && res.debtType) {
                        res.state = 12;
                    } else if (destAmountFieldVisible && exchFieldVisible && !res.debtType) {
                        res.state = 18;
                    } else if (srcResFieldVisible && exchFieldVisible && res.debtType) {
                        res.state = 13;
                    } else if (destResFieldVisible && exchFieldVisible && !res.debtType) {
                        res.state = 19;
                    } else if (srcResFieldVisible && destResFieldVisible) {
                        res.state = (res.debtType) ? 14 : 20;
                    } else if (srcAmountFieldVisible && destResFieldVisible) {
                        res.state = (res.debtType) ? 15 : 17;
                    } else if (destAmountFieldVisible && srcResFieldVisible && !res.debtType) {
                        res.state = 21;
                    } else {
                        throw new Error('Unexpected state');
                    }
                } else if (srcAmountFieldVisible && res.debtType) {
                    res.state = 0;
                } else if (destAmountFieldVisible && !res.debtType) {
                    res.state = 3;
                } else if (srcResFieldVisible) {
                    res.state = res.debtType ? 1 : 5;
                } else if (destResFieldVisible) {
                    res.state = res.debtType ? 2 : 4;
                } else {
                    throw new Error('Unexpected state');
                }
            }
        }

        if (res.type === LIMIT_CHANGE) {
            if (!res.isAvailable) {
                res.state = -1;
            } else if (destResFieldVisible && !destAmountFieldVisible) {
                res.state = 0;
            } else if (destAmountFieldVisible && !destResFieldVisible) {
                res.state = 1;
            } else {
                throw new Error('Unexpected state');
            }
        }

        if (res.isAvailable && res.srcAccount) {
            assert(
                res.srcAccount.curr_id === res.src_curr_id,
                `Unexpected destination currency ${res.dest_curr_id}(${res.srcAccount.curr_id} is expected)`,
            );
        }
        if (res.isAvailable && res.destAccount) {
            assert(
                res.destAccount.curr_id === res.dest_curr_id,
                `Unexpected destination currency ${res.dest_curr_id}(${res.destAccount.curr_id} is expected)`,
            );
        }

        if (this.isTransactionForm()) {
            res.date = cont.datePicker.value;
            res.dateInvalidated = cont.datePicker.isInvalid;
        }

        // Reminder
        const reminder = cont.reminderField?.value;
        res.reminderId = reminder?.reminder_id ?? 0;
        res.scheduleId = reminder?.schedule_id ?? 0;
        res.reminderDate = reminder?.reminder_date ?? 0;
        res.reminderDialogVisible = cont.reminderDialog.visible;

        // Schedule
        res.repeatEnabled = cont.repeatSwitch.checked;

        res.scheduleName = cont.scheduleNameField.value;
        res.scheduleNameInvalidated = cont.scheduleNameField.isInvalid;

        res.startDate = cont.dateRangeInput.value.startDate;
        res.endDate = cont.dateRangeInput.value.endDate;
        res.dateRangeInvalidated = cont.dateRangeInput.invalidated;

        res.intervalStep = cont.intervalStepField.value;
        res.intervalStepInvalidated = cont.intervalStepField.isInvalid;

        res.intervalType = parseInt(cont.intervalTypeSelect.value, 10);

        if (res.intervalType === INTERVAL_DAY) {
            res.intervalOffset = 0;
        } else if (res.intervalType === INTERVAL_WEEK) {
            res.intervalOffset = structuredClone(cont.weekDayOffsetSelect.value);
            res.intervalOffset.sort();
        } else if (res.intervalType === INTERVAL_MONTH) {
            const offset = parseInt(cont.monthDayOffsetSelect.value, 10);
            res.intervalOffset = offset;
        } else if (res.intervalType === INTERVAL_YEAR) {
            const dayIndex = parseInt(cont.monthDayOffsetSelect.value, 10);
            const monthIndex = parseInt(cont.monthOffsetSelect.value, 10);
            res.intervalOffset = (monthIndex * 100) + dayIndex;
        }

        res.categoryId = parseInt(cont.categorySelect.value, 10);
        res.categorySelectOpen = !!cont.categorySelect.listContainer?.visible;

        res.comment = cont.commentField.value;

        return res;
    }

    isValidAmount(value) {
        return value > 0;
    }

    isValidDate(value) {
        const locales = this.appState().getDateFormatLocale();
        return isValidDateString(value, { locales, options: App.dateFormatOptions });
    }

    isValidScheduleName(value, model = this.model, state = App.state) {
        if (typeof value !== 'string' || value === '') {
            return false;
        }

        const scheduleItem = state.schedule.findByName(value);
        if (scheduleItem && (!model.id || (model.id && model.id !== scheduleItem.id))) {
            return false;
        }

        return true;
    }

    isValid() {
        const startFromDestAmount = (
            (this.model.type === EXPENSE || this.model.type === LIMIT_CHANGE)
            || (this.model.type === DEBT && !this.model.debtType)
        );

        const srcAmount = this.getExpectedSourceAmount();
        const srcAmountValid = this.isValidAmount(srcAmount);

        const destAmount = this.getExpectedDestAmount();
        const destAmountValid = this.isValidAmount(destAmount);

        if (startFromDestAmount) {
            if (!destAmountValid || (this.model.isDiffCurr && !srcAmountValid)) {
                return false;
            }
        } else if (!srcAmountValid || (this.model.isDiffCurr && !destAmountValid)) {
            return false;
        }

        if (this.isTransactionForm()) {
            if (!this.isValidDate(this.model.date)) {
                return false;
            }
        }

        if (this.isScheduleItemForm() || this.model.repeatEnabled) {
            if (!this.isValidScheduleName(this.model.scheduleName)) {
                return false;
            }

            if (!this.isValidDate(this.model.startDate)) {
                return false;
            }
        }

        if (this.model.repeatEnabled) {
            if (this.model.endDate && !this.isValidDate(this.model.endDate)) {
                return false;
            }
            const intervalStep = parseInt(this.model.intervalStep, 10);
            if (!(intervalStep > 0)) {
                return false;
            }
        }

        return true;
    }

    getExpectedSourceAmount(model = this.model) {
        const precision = getCurrencyPrecision(model.src_curr_id);
        const amount = (model.type === LIMIT_CHANGE)
            ? Math.abs(model.fSrcAmount)
            : model.fSrcAmount;
        return normalize(amount, precision);
    }

    getExpectedDestAmount(model = this.model) {
        const precision = getCurrencyPrecision(model.dest_curr_id);
        const amount = (model.type === LIMIT_CHANGE)
            ? Math.abs(model.fDestAmount)
            : model.fDestAmount;
        return normalize(amount, precision);
    }

    getExpectedTransaction() {
        if (!this.isValid()) {
            return null;
        }

        const res = {
            type: this.model.type,
            src_amount: this.getExpectedSourceAmount(),
            dest_amount: this.getExpectedDestAmount(),
            src_curr: this.model.src_curr_id,
            dest_curr: this.model.dest_curr_id,
            category_id: this.model.categoryId,
            comment: this.model.comment,
        };

        if (this.model.isUpdate) {
            res.id = this.model.id;
        }

        if (res.type === DEBT) {
            res.person_id = this.model.person.id;
            res.acc_id = this.model.noAccount ? 0 : this.model.account.id;
            res.op = this.model.debtType ? 1 : 2;
        } else if (res.type === LIMIT_CHANGE) {
            const increaseLimit = this.model.fDestAmount > 0;
            res.src_id = (increaseLimit) ? 0 : this.model.destAccount.id;
            res.dest_id = (increaseLimit) ? this.model.destAccount.id : 0;
        } else {
            res.src_id = this.model.srcAccount?.id ?? 0;
            res.dest_id = this.model.destAccount?.id ?? 0;
        }

        if (this.isTransactionForm()) {
            res.date = dateStringToSeconds(this.model.date, {
                locales: this.appState().getDateFormatLocale(),
                options: App.dateFormatOptions,
            });
        }

        const reminderId = parseInt(this.model.reminderId, 10);
        const scheduleId = parseInt(this.model.scheduleId, 10);
        const { repeatEnabled } = this.model;

        if (
            this.isScheduleItemForm()
            || (repeatEnabled && !reminderId && !scheduleId)
        ) {
            res.name = this.model.scheduleName;
            res.start_date = App.dateStringToSeconds(this.model.startDate);
            res.end_date = App.dateStringToSeconds(this.model.endDate);

            res.interval_type = (repeatEnabled)
                ? parseInt(this.model.intervalType, 10)
                : INTERVAL_NONE;

            res.interval_step = (repeatEnabled)
                ? parseInt(this.model.intervalStep, 10)
                : 0;

            res.interval_offset = (repeatEnabled)
                ? asArray(this.model.intervalOffset).map((item) => parseInt(item, 10))
                : [];
        }

        if (reminderId !== 0) {
            res.reminder_id = reminderId;
        } else if (scheduleId !== 0) {
            res.schedule_id = scheduleId;
            res.reminder_date = parseInt(this.model.reminderDate, 10);
        }

        return res;
    }

    getExpectedState(model = this.model) {
        return TransactionForm.getExpectedState(model, this.appState());
    }

    stateTransition(model, stateMap, throwOnNotFound = true) {
        const res = model;
        const newState = stateMap[res.state];
        if (throwOnNotFound) {
            assert.isDefined(newState, `Invalid state ${res.state}`);
        }
        if (typeof newState !== 'undefined') {
            res.state = newState;
        }

        return res;
    }

    /**
     * Set source amount value and calculate source result
     * @param {number|string} val - new source amount value
     */
    setSrcAmount(val) {
        this.model.srcAmount = val;
        this.model.fSrcAmount = (this.model.isAvailable && this.model.srcCurr)
            ? normalize(val, this.model.srcCurr.precision)
            : val;
        this.calculateSourceResult();
    }

    /**
     * Set destination amount value and destination source result
     * @param {number|string} val - new destination amount value
     */
    setDestAmount(val) {
        this.model.destAmount = val;
        this.model.fDestAmount = (this.model.isAvailable && this.model.destCurr)
            ? normalize(val, this.model.destCurr.precision)
            : val;
        this.calculateDestResult();
    }

    /**
     * Set source result value
     * @param {number|string} val - new source result value
     */
    setSourceResult(val) {
        this.model.srcResBal = val;
        this.model.fSrcResBal = (this.model.isAvailable && this.model.srcCurr)
            ? normalize(val, this.model.srcCurr.precision)
            : val;
    }

    /**
     * Set destination result value
     * @param {number|string} val - new destination result value
     */
    setDestResult(val) {
        this.model.destResBal = val;
        this.model.fDestResBal = (this.model.isAvailable && this.model.destCurr)
            ? normalize(val, this.model.destCurr.precision)
            : val;
    }

    getLastAccountBalance() {
        if (!this.model.lastAccount_id) {
            return 0;
        }

        const account = this.appState().accounts.getItem(this.model.lastAccount_id);
        assert(account, 'Last account not found');

        return account.balance;
    }

    calculateSourceResult() {
        if (this.model.type === INCOME || !this.model.isAvailable) {
            return;
        }

        const sourceAmount = this.model.fSrcAmount;
        const { precision } = this.model.srcCurr;
        let sourceResult;

        if (this.model.type === EXPENSE || this.model.type === TRANSFER) {
            sourceResult = normalize(
                this.model.srcAccount.balance - sourceAmount,
                precision,
            );
        } else if (this.model.type === DEBT) {
            if (this.model.srcAccount && !this.model.noAccount) {
                sourceResult = normalize(
                    this.model.srcAccount.balance - sourceAmount,
                    precision,
                );
            } else if (this.model.noAccount) {
                if (this.model.debtType) {
                    sourceResult = normalize(
                        this.model.personAccount.balance - sourceAmount,
                        precision,
                    );
                } else {
                    sourceResult = normalize(
                        this.getLastAccountBalance() - sourceAmount,
                        precision,
                    );
                }
            }
        }

        if (this.model.fSrcResBal !== sourceResult) {
            this.setSourceResult(sourceResult);
        }
    }

    calculateDestResult() {
        if (this.model.type === EXPENSE || !this.model.isAvailable) {
            return;
        }

        const destAmount = this.model.fDestAmount;
        const { precision } = this.model.destCurr;
        let destResult;

        if ([INCOME, TRANSFER, LIMIT_CHANGE].includes(this.model.type)) {
            destResult = normalize(
                this.model.destAccount.balance + destAmount,
                precision,
            );
        } else if (this.model.type === DEBT) {
            if (this.model.destAccount && !this.model.noAccount) {
                destResult = normalize(
                    this.model.destAccount.balance + destAmount,
                    precision,
                );
            } else if (this.model.noAccount) {
                if (this.model.debtType) {
                    destResult = normalize(
                        this.getLastAccountBalance() + destAmount,
                        precision,
                    );
                } else {
                    destResult = normalize(
                        this.model.personAccount.balance + destAmount,
                        precision,
                    );
                }
            }
        }

        if (this.model.fDestResBal !== destResult) {
            this.setDestResult(destResult);
        }
    }

    calcExchange(model = this.model) {
        return TransactionForm.calcExchange(model);
    }

    calcBackExchange(model = this.model) {
        return TransactionForm.calcBackExchange(model);
    }

    calcExchByAmounts() {
        this.model.exchRate = this.calcExchange();
        this.model.backExchRate = this.calcBackExchange();
    }

    updateExch() {
        if (!this.model.srcCurr || !this.model.destCurr) {
            return;
        }

        this.model.fExchRate = isValidValue(this.model.exchRate)
            ? normalizeExch(this.model.exchRate)
            : this.model.exchRate;
        this.model.fBackExchRate = isValidValue(this.model.backExchRate)
            ? normalizeExch(this.model.backExchRate)
            : this.model.backExchRate;

        this.model.exchSign = `${this.model.destCurr.sign}/${this.model.srcCurr.sign}`;
        this.model.backExchSign = `${this.model.srcCurr.sign}/${this.model.destCurr.sign}`;

        if (this.model.useBackExchange) {
            this.model.fmtExch = `${this.model.fBackExchRate} ${this.model.backExchSign}`;
        } else {
            this.model.fmtExch = `${this.model.fExchRate} ${this.model.exchSign}`;
        }
    }

    setNextSourceAccount(accountId) {
        const nextAccountId = this.appState().getNextAccount(accountId);
        const newSrcAcc = this.appState().accounts.getItem(nextAccountId);
        assert(newSrcAcc, 'Next account not found');

        this.model.srcAccount = newSrcAcc;
        this.model.src_curr_id = this.model.srcAccount.curr_id;
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);

        this.calculateSourceResult();
    }

    setNextDestAccount(accountId) {
        const nextAccountId = this.appState().getNextAccount(accountId);
        assert(nextAccountId, 'Next account not found');

        this.model.destAccount = this.appState().accounts.getItem(nextAccountId);
        this.model.dest_curr_id = this.model.destAccount.curr_id;
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        this.calculateDestResult();
    }

    getPersonAccount(personId, currencyId) {
        return TransactionForm.getPersonAccount(personId, currencyId, this.appState());
    }

    getFirstCurrency() {
        return App.currency.getItemByIndex(0);
    }

    async waitForLoad() {
        await waitForFunction(async () => {
            await this.parse();
            return !!this.model.renderTime;
        });

        await this.parse();
    }

    async changeTransactionType(type) {
        const currentType = this.model.type;
        const isAvailableBefore = this.model.isAvailable;

        if (currentType === type) {
            return true;
        }

        this.model.type = type;
        this.model.isAvailable = this.appState().isAvailableTransactionType(type);

        if (type === EXPENSE) {
            if (!this.model.isAvailable) {
                this.model.state = -1;
            } else if (currentType === INCOME || currentType === LIMIT_CHANGE) {
                if (currentType === LIMIT_CHANGE) {
                    this.stateTransition(this.model, {
                        0: 1,
                        1: 0,
                    }, false);
                }

                const srcCurrId = this.model.src_curr_id;
                const { srcCurr, srcAmount, destAmount } = this.model;

                this.model.srcAccount = this.model.destAccount;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.dest_curr_id = srcCurrId;
                this.model.srcCurr = this.model.destCurr;
                this.model.destCurr = srcCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(srcAmount);
            } else if (currentType === TRANSFER) {
                const { srcAmount } = this.model;

                this.model.state = 0;
                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;

                this.setSrcAmount(srcAmount);
                this.setDestAmount(srcAmount);
            } else if (currentType === DEBT) {
                let fromAccount = this.model.account;
                if (!fromAccount) {
                    fromAccount = this.appState().getFirstAccount();
                }

                this.model.state = 0;
                this.model.srcAccount = fromAccount;
                this.model.src_curr_id = fromAccount.curr_id;
                this.model.dest_curr_id = fromAccount.curr_id;
                this.model.srcCurr = App.currency.getItem(fromAccount.curr_id);
                this.model.destCurr = this.model.srcCurr;

                this.calculateSourceResult();
            }

            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

            if (this.model.isAvailable) {
                this.updateExch();
            }

            this.model.destAccount = null;
        }

        if (type === INCOME) {
            if (!this.model.isAvailable) {
                this.model.state = -1;
            } else if (currentType === EXPENSE) {
                const { srcCurr, srcAmount, destAmount } = this.model;
                const srcCurrId = this.model.src_curr_id;

                this.model.destAccount = this.model.srcAccount;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.dest_curr_id = srcCurrId;
                this.model.srcCurr = this.model.destCurr;
                this.model.destCurr = srcCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(srcAmount);
            } else if (currentType === TRANSFER) {
                const { destAmount } = this.model;

                this.model.state = 0;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.srcCurr = this.model.destCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(destAmount);
            } else if (currentType === DEBT) {
                let fromAccount = this.model.account;
                if (!fromAccount) {
                    fromAccount = this.appState().getFirstAccount();
                }

                this.model.state = 0;
                this.model.destAccount = fromAccount;
                this.model.dest_curr_id = fromAccount.curr_id;
                this.model.src_curr_id = fromAccount.curr_id;
                this.model.destCurr = App.currency.getItem(fromAccount.curr_id);
                this.model.srcCurr = this.model.destCurr;

                this.calculateDestResult();
            } else if (currentType === LIMIT_CHANGE) {
                this.stateTransition(this.model, {
                    0: 1,
                    1: 0,
                }, false);
            }

            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

            if (this.model.isAvailable) {
                this.updateExch();
            }

            this.model.srcAccount = null;
        }

        if (type === TRANSFER) {
            if (!this.model.isAvailable) {
                this.model.state = -1;
            } else if (currentType === EXPENSE) {
                this.setNextDestAccount(this.model.srcAccount.id);
            } else if (currentType === INCOME || currentType === LIMIT_CHANGE) {
                this.setNextSourceAccount(this.model.destAccount.id);
            } else if (currentType === DEBT) {
                if (this.model.account && this.model.debtType) {
                    this.model.destAccount = this.model.account;
                    this.model.dest_curr_id = this.model.account.curr_id;
                    this.model.destCurr = App.currency.getItem(this.model.account.curr_id);

                    this.setNextSourceAccount(this.model.destAccount.id);
                } else {
                    let scrAccount = this.model.account;
                    if (!scrAccount) {
                        scrAccount = this.appState().getFirstAccount();
                    }

                    this.model.srcAccount = scrAccount;
                    this.model.src_curr_id = scrAccount.curr_id;
                    this.model.srcCurr = App.currency.getItem(scrAccount.curr_id);

                    this.setNextDestAccount(scrAccount.id);
                }
            }

            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
            if (this.model.isAvailable) {
                this.model.state = (this.model.isDiffCurr) ? 3 : 0;
            }

            const { srcAmount, destAmount } = this.model;
            this.setSrcAmount(srcAmount);
            this.setDestAmount(destAmount);
            this.updateExch();
        }

        if (type === DEBT) {
            if (!isAvailableBefore && this.model.isAvailable) {
                this.model.debtType = true;
                this.model.srcCurr = this.getFirstCurrency();
                this.model.src_curr_id = this.model.srcCurr.id;

                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;

                this.model.account = null;
            } else if (!this.model.isAvailable) {
                this.model.state = -1;
            } else if (currentType === EXPENSE || currentType === TRANSFER) {
                this.model.debtType = false;
                this.model.account = this.model.srcAccount;
                if (this.model.srcAccount) {
                    this.model.src_curr_id = this.model.srcAccount.curr_id;
                } else {
                    this.model.srcCurr = this.getFirstCurrency();
                    this.model.src_curr_id = this.model.srcCurr.id;
                }

                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;
            } else if (currentType === INCOME || currentType === LIMIT_CHANGE) {
                this.model.debtType = true;
                this.model.account = this.model.destAccount;
                if (this.model.destAccount) {
                    this.model.dest_curr_id = this.model.destAccount.curr_id;
                } else {
                    this.model.destCurr = this.getFirstCurrency();
                    this.model.dest_curr_id = this.model.destCurr.id;
                }

                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.srcCurr = this.model.destCurr;
            }

            if (this.model.isAvailable) {
                this.model.person = this.appState().getFirstPerson();
                this.model.personAccount = this.getPersonAccount(
                    this.model.person?.id,
                    this.model.src_curr_id,
                );
            } else {
                this.model.person = null;
                this.model.personAccount = null;
            }

            if (this.model.debtType) {
                this.model.srcAccount = this.model.personAccount;
            } else {
                this.model.destAccount = this.model.personAccount;
            }

            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
            this.model.noAccount = (this.model.account === null);
            if (this.model.isAvailable) {
                if (this.model.noAccount) {
                    this.model.state = (this.model.debtType) ? 6 : 7;
                } else {
                    this.model.state = (this.model.debtType) ? 0 : 3;
                }
            }
            const { srcAmount, destAmount } = this.model;
            this.setSrcAmount(srcAmount);
            this.setDestAmount(destAmount);
            this.calcExchByAmounts();
            this.updateExch();
        }

        if (type === LIMIT_CHANGE) {
            if (currentType === EXPENSE) {
                this.stateTransition(this.model, {
                    0: 1,
                    1: 0,
                    2: 1,
                    3: 1,
                    4: 0,
                }, false);

                this.model.destAccount = this.model.srcAccount;
                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;
            } else if (currentType === INCOME) {
                this.stateTransition(this.model, {
                    0: 1,
                    1: 0,
                    2: 1,
                    3: 1,
                    4: 0,
                }, false);

                this.setDestAmount(this.model.srcAmount);
            } else if (currentType === TRANSFER) {
                this.stateTransition(this.model, {
                    0: 1,
                    1: 0,
                    2: 0,
                    3: 1,
                    4: 0,
                    5: 0,
                    6: 0,
                    7: 1,
                    8: 0,
                }, false);
            } else if (currentType === DEBT) {
                this.stateTransition(this.model, {
                    0: 1,
                    1: 0,
                    2: 0,
                    3: 1,
                    4: 0,
                    5: 0,
                    6: 1,
                    7: 1,
                    8: 0,
                    9: 0,
                    10: 1,
                    11: 0,
                    12: 1,
                    13: 0,
                    14: 0,
                    15: 0,
                    16: 1,
                    17: 0,
                    18: 1,
                    19: 0,
                    20: 0,
                    21: 1,
                }, false);

                let { account } = this.model;
                if (!account) {
                    account = this.appState().getFirstAccount();
                }

                this.model.destAccount = account;
            }

            this.model.state = 1;

            this.model.srcAccount = null;
            this.model.src_curr_id = this.model.dest_curr_id;
            this.model.srcCurr = this.model.destCurr;

            this.setSrcAmount(this.model.destAmount);
            this.calcExchByAmounts();
            this.updateExch();
        }

        // Delete Debt specific fields
        if (currentType === DEBT) {
            delete this.model.account;
            delete this.model.person;
            delete this.model.personAccount;
            delete this.model.debtType;
            delete this.model.noAccount;
            delete this.model.lastAcc_id;
        }

        if (this.model.categoryId !== 0) {
            const category = this.appState().categories.getItem(this.model.categoryId);
            assert(category, `Category not found: '${this.model.categoryId}'`);

            if (category.type !== 0 && category.type !== type) {
                this.model.categoryId = 0;
            }
        }

        return this.runTestAction(() => this.content.typeMenu.select(type));
    }

    validateSourceAmount() {
        const sourceAmount = this.getExpectedSourceAmount();
        this.model.srcAmountInvalidated = !this.isValidAmount(sourceAmount);
        if (!this.model.srcAmountInvalidated) {
            return;
        }

        if (this.model.type === INCOME) {
            this.stateTransition(this.model, {
                1: 0,
            }, false);
        } else if (this.model.type === TRANSFER) {
            this.stateTransition(this.model, {
                1: 0,
                2: 0,
                4: 3,
                6: 5,
                8: 7,
            }, false);
        } else if (this.model.type === DEBT) {
            this.stateTransition(this.model, {
                1: 0,
                2: 0,
                4: 3,
                9: 6,
                11: 10,
                13: 12,
                14: 15,
                18: 16,
                19: 17,
                20: 17,
            }, false);
        }
    }

    validateDestAmount() {
        const destAmount = this.getExpectedDestAmount();
        this.model.destAmountInvalidated = !this.isValidAmount(destAmount);
        if (!this.model.destAmountInvalidated) {
            return;
        }

        if (this.model.type === EXPENSE) {
            this.stateTransition(this.model, {
                1: 0,
                3: 2,
                4: 2,
            }, false);
        } else if (this.model.type === INCOME) {
            this.stateTransition(this.model, {
                3: 2,
                4: 2,
            }, false);
        } else if (this.model.type === TRANSFER) {
            this.stateTransition(this.model, {
                5: 3,
                6: 4,
                7: 3,
                8: 4,
            }, false);
        } else if (this.model.type === DEBT) {
            this.stateTransition(this.model, {
                4: 3,
                5: 3,
                8: 7,
                12: 10,
                13: 11,
                14: 11,
                15: 10,
                17: 16,
                19: 18,
                20: 21,
            }, false);
        }
    }

    async submit() {
        const startFromDestAmount = (
            (this.model.type === EXPENSE || this.model.type === LIMIT_CHANGE)
            || (this.model.type === DEBT && !this.model.debtType)
        );

        if (startFromDestAmount) {
            this.validateDestAmount();
            if (this.model.isDiffCurr) {
                this.validateSourceAmount();
            }
        } else {
            this.validateSourceAmount();
            if (this.model.isDiffCurr) {
                this.validateDestAmount();
            }
        }

        let isValid = (
            !this.model.srcAmountInvalidated
            && !this.model.destAmountInvalidated
        );

        if (this.isTransactionForm()) {
            const dateValid = this.isValidDate(this.model.date);
            this.model.dateInvalidated = !dateValid;

            isValid = isValid && dateValid;
        }

        let scheduleNameValid = true;
        let startDateValid = true;
        let endDateValid = true;

        if (this.isScheduleItemForm() || this.model.repeatEnabled) {
            const { startDate, scheduleName } = this.model;
            scheduleNameValid = this.isValidScheduleName(scheduleName);

            isValid = isValid && scheduleNameValid;
            this.model.scheduleNameInvalidated = !scheduleNameValid;

            startDateValid = this.isValidDate(startDate);
            isValid = isValid && startDateValid;
        }

        if (this.model.repeatEnabled) {
            const { endDate, intervalStep } = this.model;
            endDateValid = !endDate || this.isValidDate(endDate);

            const intervalStepValid = parseInt(intervalStep, 10) > 0;
            this.model.intervalStepInvalidated = !intervalStepValid;

            isValid = isValid && endDateValid && intervalStepValid;
        }

        this.model.dateRangeInvalidated = (!startDateValid || !endDateValid);

        const action = () => click(this.content.submitBtn);

        return (isValid)
            ? navigation(action)
            : this.runTestAction(action);
    }

    async cancel() {
        await navigation(() => click(this.content.cancelBtn));
    }

    async openReminderDialog() {
        assert(this.content.reminderField?.content?.visible, 'Reminder field not available');

        this.model.reminderDialogVisible = true;

        const dialogModel = {
            filter: {
                state: REMINDER_ACTIVE,
                startDate: null,
                endDate: null,
            },
            list: {
                page: 1,
                range: 1,
                pages: 0,
                items: [],
            },
            filtersVisible: false,
        };

        const filteredItems = SelectReminderDialog.getFilteredItems(dialogModel);
        const reminders = SelectReminderDialog.getExpectedList(dialogModel);
        dialogModel.list.items = reminders.items;
        dialogModel.list.page = (reminders.items.length > 0) ? 1 : 0;
        dialogModel.list.pages = filteredItems.expectedPages();
        this.model.reminderDialog = dialogModel;

        return this.runTestAction(() => this.content.reminderField.selectReminder());
    }

    async closeReminderDialog() {
        assert(this.reminderDialog?.content?.visible, 'Reminder dialog not visible');

        this.model.reminderDialogVisible = false;

        return this.runTestAction(() => this.reminderDialog.close());
    }

    async selectReminderByIndex(index) {
        const item = this.reminderDialog.getItemByIndex(index);

        this.model.reminderDialogVisible = false;
        this.model.reminderId = item?.id ?? 0;
        this.model.scheduleId = item?.schedule_id ?? 0;
        this.model.reminderDate = item?.date ?? 0;
        this.model.isReminder = true;

        return this.runTestAction(() => this.reminderDialog.selectItemByIndex(index));
    }

    async removeReminder() {
        assert(this.content.reminderField?.content?.visible, 'Reminder field not available');

        this.model.reminderId = 0;
        this.model.scheduleId = 0;
        this.model.reminderDate = 0;
        this.model.isReminder = false;

        return this.runTestAction(() => this.content.reminderField.removeReminder());
    }

    async filterRemindersByState(state) {
        assert(this.reminderDialog?.content?.visible, 'Reminder field not available');

        return this.runTestAction(() => this.reminderDialog.filterByState(state));
    }

    async selectRemindersStartDateFilter(value) {
        return this.runTestAction(() => this.reminderDialog.selectStartDateFilter(value));
    }

    async selectRemindersEndDateFilter(value) {
        return this.runTestAction(() => this.reminderDialog.selectEndDateFilter(value));
    }

    async clearRemindersStartDateFilter() {
        return this.runTestAction(() => this.reminderDialog.clearStartDateFilter());
    }

    async clearRemindersEndDateFilter() {
        return this.runTestAction(() => this.reminderDialog.clearEndDateFilter());
    }

    async clearAllRemindersFilters() {
        return this.runTestAction(() => this.reminderDialog.clearAllFilters());
    }

    async goToRemindersFirstPage() {
        return this.runTestAction(() => this.reminderDialog.goToFirstPage());
    }

    async goToRemindersLastPage() {
        return this.runTestAction(() => this.reminderDialog.goToLastPage());
    }

    async goToRemindersPrevPage() {
        return this.runTestAction(() => this.reminderDialog.goToPrevPage());
    }

    async goToRemindersNextPage() {
        return this.runTestAction(() => this.reminderDialog.goToNextPage());
    }

    async showMoreReminders() {
        return this.runTestAction(() => this.reminderDialog.showMore());
    }

    async setRemindersClassicMode() {
        return this.runTestAction(() => this.reminderDialog.setClassicMode());
    }

    async setRemindersDetailsMode() {
        return this.runTestAction(() => this.reminderDialog.setDetailsMode());
    }

    async inputStartDate(val) {
        this.model.startDate = val.toString();
        this.model.dateRangeInvalidated = false;

        return this.runTestAction(() => this.content.dateRangeInput.inputStart(val));
    }

    async selectStartDate(val) {
        assert.isDate(val, 'Invalid date');

        const locales = this.appState().getDateFormatLocale();
        this.model.startDate = formatDate(val, { locales, options: App.dateFormatOptions });
        this.model.dateRangeInvalidated = false;

        return this.runTestAction(() => this.content.dateRangeInput.selectStart(val));
    }

    async inputEndDate(val) {
        this.model.endDate = val.toString();
        this.model.dateRangeInvalidated = false;

        return this.runTestAction(() => this.content.dateRangeInput.inputEnd(val));
    }

    async selectEndDate(val) {
        assert.isDate(val, 'Invalid date');

        const locales = this.appState().getDateFormatLocale();
        this.model.endDate = formatDate(val, { locales, options: App.dateFormatOptions });
        this.model.dateRangeInvalidated = false;

        return this.runTestAction(() => this.content.dateRangeInput.selectEnd(val));
    }

    async clearEndDate() {
        assert(this.model.endDate.length > 0, 'End date field is already empty');

        this.model.endDate = '';
        this.model.dateRangeInvalidated = false;

        return this.runTestAction(() => this.content.dateRangeInput.clearEnd());
    }

    async toggleEnableRepeat() {
        this.model.repeatEnabled = !this.model.repeatEnabled;
        if (this.model.repeatEnabled) {
            const type = INTERVAL_MONTH;
            const startDate = App.parseDate(this.model.startDate);

            this.model.intervalStep = 1;
            this.model.intervalType = type;
            this.model.intervalOffset = getIntervalOffset(new Date(startDate), type);
        }

        return this.runTestAction(() => this.content.repeatSwitch.toggle());
    }

    async changeIntervalType(val) {
        const type = parseInt(val, 10);
        assert(type !== INTERVAL_NONE && ScheduledTransaction.isValidIntervalType(type), 'Invalid interval type');

        const typeName = ScheduledTransaction.intervalTypes[type];
        assert.notEqual(this.model.intervalType, type, `Interval type is already '${typeName}'`);

        this.model.intervalType = type;
        this.model.intervalOffset = getIntervalOffset(App.dates.now, type);

        return this.runTestAction(() => this.content.intervalTypeSelect.setSelection(val));
    }

    async inputIntervalStep(val) {
        this.model.intervalStep = val;
        this.model.intervalStepInvalidated = false;

        return this.runTestAction(() => this.content.intervalStepField.input(val));
    }

    async selectWeekDayOffset(val) {
        const { intervalType } = this.model;
        assert.equal(intervalType, INTERVAL_WEEK, `Invalid interval type: ${intervalType}`);

        const weekDays = asArray(val).map((item) => parseInt(item, 10));
        const currentSelection = asArray(this.model.intervalOffset);

        const itemsToDeselect = currentSelection.filter((item) => !weekDays.includes(item));
        const itemsToSelect = weekDays.filter((item) => !currentSelection.includes(item));

        this.model.intervalOffset = weekDays;

        return this.runTestAction(async () => {
            for (const item of itemsToSelect) {
                await this.performAction(() => this.content.weekDayOffsetSelect.toggle(item));
            }
            for (const item of itemsToDeselect) {
                await this.performAction(() => this.content.weekDayOffsetSelect.toggle(item));
            }
        });
    }

    async selectWeekdaysOffset() {
        const { intervalType } = this.model;
        assert.equal(intervalType, INTERVAL_WEEK, `Invalid interval type: ${intervalType}`);

        this.model.intervalOffset = [1, 2, 3, 4, 5];

        return this.runTestAction(() => click(this.content.weekdaysBtn.elem));
    }

    async selectWeekendOffset() {
        const { intervalType } = this.model;
        assert.equal(intervalType, INTERVAL_WEEK, `Invalid interval type: ${intervalType}`);

        this.model.intervalOffset = [0, 6];

        return this.runTestAction(() => click(this.content.weekendBtn.elem));
    }

    async selectMonthDayOffset(val) {
        const availIntervalTypes = [INTERVAL_MONTH, INTERVAL_YEAR];
        const { intervalType, intervalOffset } = this.model;

        assert(availIntervalTypes.includes(intervalType), `Invalid interval type: ${intervalType}`);

        const monthDay = parseInt(val, 10);
        const dayIndex = monthDay - 1;
        if (intervalType === INTERVAL_MONTH) {
            this.model.intervalOffset = dayIndex;
        } else if (intervalType === INTERVAL_YEAR) {
            const monthIndex = Math.floor(intervalOffset / 100);
            const offset = (monthIndex * 100) + dayIndex;
            this.model.intervalOffset = offset;
        }

        return this.runTestAction(() => this.content.monthDayOffsetSelect.setSelection(dayIndex));
    }

    async selectMonthOffset(val) {
        const { intervalType, intervalOffset } = this.model;

        assert.equal(intervalType, INTERVAL_YEAR, `Invalid interval type: ${intervalType}`);

        const monthIndex = parseInt(val, 10);
        const monthDay = (intervalOffset % 100);
        const offset = (monthIndex * 100) + monthDay;
        this.model.intervalOffset = offset;

        return this.runTestAction(() => this.content.monthOffsetSelect.setSelection(val));
    }

    async changeSrcAccount(val) {
        assert(
            this.model.type === EXPENSE || this.model.type === TRANSFER,
            'Unexpected action: can\'t change source account',
        );

        const newAcc = this.appState().accounts.getItem(val);
        if (!this.model.srcAccount || !newAcc || newAcc.id === this.model.srcAccount.id) {
            return true;
        }

        this.model.srcAccount = newAcc;
        this.model.src_curr_id = this.model.srcAccount.curr_id;
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);

        // Update result balance of source
        this.calculateSourceResult();

        // Copy source currency to destination currency if needed
        // Transition 1 or 12
        if (this.model.type === EXPENSE && (this.model.state === 0 || this.model.state === 1)) {
            this.model.dest_curr_id = this.model.src_curr_id;
            this.model.destCurr = this.model.srcCurr;
        }

        if (this.model.type === TRANSFER && newAcc.id === this.model.destAccount.id) {
            this.setNextDestAccount(newAcc.id);
        }

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.type === EXPENSE) {
            if (this.model.isDiffCurr) {
                const sameStates = [2, 3, 4]; // Transition 5, 17 or 10
                assert(sameStates.includes(this.model.state), `Unexpected state ${this.model.state} with different currencies`);
            } else if (!this.model.isDiffCurr) {
                const stateMap = {
                    2: 0, // Transition 14
                    3: 0, // Transition 15
                    4: 1, // Transition 11
                };
                if (this.model.state in stateMap) {
                    this.setDestAmount(this.model.srcAmount);
                }

                const sameStates = [0, 1]; // Transition 1 or 12
                if (!sameStates.includes(this.model.state)) {
                    this.stateTransition(this.model, stateMap);
                }
            }
        } else if (this.model.type === TRANSFER) {
            if (this.model.isDiffCurr) {
                const sameStates = [3, 4, 5, 6, 7, 8]; // Transition 43, 36, 26, 49, 51 or 57
                if (!sameStates.includes(this.model.state)) {
                    this.stateTransition(this.model, {
                        0: 3, // Transition 6
                        1: 4, // Transition 12
                        2: 5, // Transition 16
                    });
                }
            } else {
                if (this.model.fSrcAmount !== this.model.fDestAmount) {
                    this.setDestAmount(this.model.fSrcAmount);
                }

                const sameStates = [0, 1, 2]; // Transition 5, 11 or 15
                if (!sameStates.includes(this.model.state)) {
                    this.stateTransition(this.model, {
                        3: 0, // Transition 3
                        7: 0, // Transition 58
                        4: 1, // Transition 37
                        6: 1, // Transition 50
                        8: 1, // Transition 52
                        5: 2, // Transition 27
                    });
                }
            }
        }

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        return this.runTestAction(() => this.content.sourceContainer.selectAccount(val));
    }

    async changeDestAccount(val) {
        const availTypes = [INCOME, TRANSFER, LIMIT_CHANGE];
        assert(availTypes.includes(this.model.type), 'Unexpected action: can\'t change destination account');

        const newAcc = this.appState().accounts.getItem(val);
        if (!this.model.destAccount || !newAcc || newAcc.id === this.model.destAccount.id) {
            return true;
        }

        this.model.destAccount = newAcc;
        this.model.dest_curr_id = this.model.destAccount.curr_id;
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        // Update result balance of destination
        this.calculateDestResult();

        // Copy destination currency to source currency if needed
        if (
            (this.model.type === INCOME && !this.model.isDiffCurr)
            || (this.model.type === LIMIT_CHANGE)
        ) {
            this.model.src_curr_id = this.model.dest_curr_id;
            this.model.srcCurr = this.model.destCurr;
        }
        // Change source account if same
        if (this.model.type === TRANSFER && newAcc.id === this.model.srcAccount.id) {
            this.setNextSourceAccount(newAcc.id);
        }

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.type === INCOME) {
            if (this.model.isDiffCurr) {
                const sameStates = [2, 3, 4]; // Transition 5, 11 or 17
                assert(sameStates.includes(this.model.state), `Unexpected state ${this.model.state} with different currencies`);
            } else if (!this.model.isDiffCurr) {
                const stateMap = {
                    2: 0, // Transition 6
                    3: 0, // Transition 12
                    4: 1, // Transition 18
                };
                if (this.model.state in stateMap) {
                    this.setSrcAmount(this.model.destAmount);
                }

                const sameStates = [0, 1]; // Transition 1 or 23
                if (!sameStates.includes(this.model.state)) {
                    this.stateTransition(this.model, stateMap);
                }
            }
        } else if (this.model.type === TRANSFER) {
            if (this.model.isDiffCurr) {
                const sameStates = [3, 4, 5, 6, 7, 8]; // Transition 41, 38, 28, 47, 59 or 53
                if (!sameStates.includes(this.model.state)) {
                    this.stateTransition(this.model, {
                        0: 3, // Transition 8
                        1: 4, // Transition 14
                        2: 5, // Transition 18
                    });
                }
            } else {
                if (this.model.fSrcAmount !== this.model.fDestAmount) {
                    this.setDestAmount(this.model.fSrcAmount);
                }

                const sameStates = [0, 1, 2]; // Transition 7, 13 or 17
                if (!sameStates.includes(this.model.state)) {
                    this.stateTransition(this.model, {
                        3: 0, // Transition 42
                        7: 0, // Transition 60
                        4: 1, // Transition 39
                        8: 1, // Transition 54
                        5: 2, // Transition 29
                        6: 2, // Transition 48
                    });
                }
            }
        } else if (this.model.type === LIMIT_CHANGE) {
            const { precision } = this.model.destCurr;
            const cutVal = trimToDigitsLimit(this.model.destAmount, precision);
            this.model.destAmount = normalize(cutVal, precision);

            this.setDestAmount(this.model.destAmount);
            this.setSrcAmount(this.model.destAmount);
        }

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        return this.runTestAction(() => this.content.destContainer.selectAccount(val));
    }

    async inputSrcAmount(val) {
        if (this.model.type === EXPENSE) {
            assert(this.model.isDiffCurr, `Invalid state: can't input source amount on state ${this.model.state}`);
        }
        const trAvailStates = [0, 3, 4, 7];
        if (this.model.type === TRANSFER) {
            assert(
                trAvailStates.includes(this.model.state),
                `Unexpected state ${this.model.state} to input source amount`,
            );
        }
        const debtAvailStates = [0, 6, 10, 12, 15, 16, 17];
        if (this.model.type === DEBT) {
            assert(
                debtAvailStates.includes(this.model.state),
                `Unexpected state ${this.model.state} to input source amount`,
            );
        }

        assert(
            this.model.type !== LIMIT_CHANGE,
            'Invalid state: can\'t input source amount at Credit limit transaction type',
        );

        const { precision } = this.model.srcCurr;
        const cutVal = trimToDigitsLimit(val, precision);
        this.model.srcAmount = cutVal;
        const fNewValue = normalize(cutVal, precision);
        if (this.model.fSrcAmount !== fNewValue) {
            this.setSrcAmount(cutVal);

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.fSrcAmount);
            }
        }
        this.model.srcAmountInvalidated = false;

        return this.runTestAction(() => this.content.srcAmountField.input(val));
    }

    async clickSrcAmount() {
        assert(this.model.type !== EXPENSE, 'Unexpected action: can\'t click by source amount');

        if (this.model.type === INCOME) {
            assert(this.model.state === 1, `Unexpected state ${this.model.state} for clickSrcAmount action`);
            this.model.state = 0; // Transition 4
        } else if (this.model.type === TRANSFER) {
            this.stateTransition(this.model, {
                1: 0, // Transition 2
                2: 0, // Transition 4
                4: 3, // Transition 30
                6: 5, // Transition 20
                8: 7, // Transition 23
            });
        } else if (this.model.type === DEBT) {
            this.stateTransition(this.model, {
                1: 0, // Transition 2
                2: 0, // Transition 4
                9: 6, // Transition 35
                11: 10, // Transition 56
                13: 12, // Transition 72
                14: 15, // Transition 82
                18: 16, // Transition 94
                19: 17, // Transition 102
                20: 17, // Transition 100
                21: 16, // Transition 90
            });
        }

        return this.runTestAction(() => this.content.srcAmountInfo.click());
    }

    async inputDestAmount(val) {
        assert(this.content.destAmountField?.content?.visible, 'Destination amount field not visible');

        if (this.model.type === INCOME) {
            assert(this.model.isDiffCurr, `Invalid state: can't input destination amount on state ${this.model.state}`);
        }

        const trAvailStates = [3, 4];
        if (this.model.type === TRANSFER) {
            assert(
                trAvailStates.includes(this.model.state),
                `Unexpected state ${this.model.state} to input destination amount`,
            );
        }

        const debtAvailStates = [3, 7, 10, 11, 16, 18, 21];
        if (this.model.type === DEBT) {
            assert(
                debtAvailStates.includes(this.model.state),
                `Unexpected state ${this.model.state} to input destination amount`,
            );
        }

        const { precision } = this.model.destCurr;
        const cutVal = trimToDigitsLimit(val, precision);
        const fNewValue = normalize(cutVal, precision);
        this.model.destAmount = cutVal;
        if (this.model.fDestAmount !== fNewValue) {
            this.setDestAmount(cutVal);

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setSrcAmount(this.model.fDestAmount);
            }
        }
        this.model.destAmountInvalidated = false;

        return this.runTestAction(() => this.content.destAmountField.input(val));
    }

    async clickSrcResultBalance() {
        const { type } = this.model;

        assert(
            type !== INCOME && type !== LIMIT_CHANGE,
            'Unexpected action: can\'t click by source result balance',
        );

        if (type === EXPENSE) {
            this.stateTransition(this.model, {
                0: 1, // Transition 2
                2: 4, // Transition 6
                3: 4, // Transition 18
            });
        } else if (type === TRANSFER) {
            this.stateTransition(this.model, {
                0: 1, // Transition 1
                2: 1, // Transition 10
                3: 4, // Transition 31
                5: 6, // Transition 19
                7: 8, // Transition 22
            });
        } else if (type === DEBT) {
            this.stateTransition(this.model, {
                0: 1, // Transition 1
                2: 1, // Transition 4
                3: 5, // Transition 13
                4: 5, // Transition 11
                6: 9, // Transition 36
                10: 11, // Transition 55
                12: 13, // Transition 71
                15: 14, // Transition 83
                16: 21, // Transition 89
                17: 20, // Transition 99
                18: 21, // Transition 109
                19: 20, // Transition 114
            });
        }

        return this.runTestAction(() => this.content.srcResultInfo.click());
    }

    async clickDestResultBalance() {
        assert(this.model.type !== EXPENSE, 'Unexpected action: can\'t click by destination result balance');

        if (this.model.type === INCOME) {
            this.stateTransition(this.model, {
                0: 1, // Transition 2
                2: 4, // Transition 7
                3: 4, // Transition 14
            });
        } else if (this.model.type === TRANSFER) {
            this.stateTransition(this.model, {
                0: 2, // Transition 3
                1: 2, // Transition 9
                3: 5, // Transition 25
                7: 5, // Transition 56
                4: 6, // Transition 32
                8: 6, // Transition 46
            });
        } else if (this.model.type === DEBT) {
            this.stateTransition(this.model, {
                0: 2, // Transition 3
                1: 2, // Transition 5
                3: 4, // Transition 9
                5: 4, // Transition 11
                7: 8, // Transition 30
                10: 15, // Transition 59
                11: 14, // Transition 63
                12: 15, // Transition 73
                13: 14, // Transition 78
                16: 17, // Transition 91
                18: 19, // Transition 107
                21: 20, // Transition 119
            });
        } else if (this.model.type === LIMIT_CHANGE) {
            this.stateTransition(this.model, {
                1: 0, // Transition 2
            });
        }

        return this.runTestAction(() => this.content.destResultInfo.click());
    }

    async clickDestAmount() {
        if (this.model.type === EXPENSE) {
            this.stateTransition(this.model, {
                1: 0, // Transition 3
                3: 2, // Transition 16
                4: 2, // Transition 7
            });
        } else if (this.model.type === INCOME) {
            this.stateTransition(this.model, {
                3: 2, // Transition 13
                4: 2, // Transition 19
            });
        } else if (this.model.type === TRANSFER) {
            this.stateTransition(this.model, {
                5: 3, // Transition 24
                7: 3, // Transition 55
                6: 4, // Transition 33
                8: 4, // Transition 35
            });
        } else if (this.model.type === DEBT) {
            this.stateTransition(this.model, {
                4: 3, // Transition 10
                5: 3, // Transition 12
                8: 7, // Transition 31
                12: 10, // Transition 58
                13: 11, // Transition 66
                14: 11, // Transition 64
                15: 10, // Transition 60
                17: 16, // Transition 92
                19: 18, // Transition 108
                20: 21, // Transition 118
            });
        } else if (this.model.type === LIMIT_CHANGE) {
            this.stateTransition(this.model, {
                0: 1, // Transition 1
            });
        }

        return this.runTestAction(() => this.content.destAmountInfo.click());
    }

    async inputResBalance(val) {
        assert(this.model.type !== INCOME, 'Unexpected action: can\'t input source result balance');

        const { precision } = this.model.srcCurr;
        const cutVal = trimToDigitsLimit(val, precision);
        const fNewValue = isValidValue(cutVal)
            ? normalize(cutVal, precision)
            : cutVal;

        this.model.srcResBal = cutVal;
        if (this.model.fSrcResBal !== fNewValue) {
            this.model.fSrcResBal = fNewValue;

            const newSrcAmount = normalize(
                this.model.srcAccount.balance - fNewValue,
                precision,
            );

            this.model.srcAmount = newSrcAmount;
            this.model.fSrcAmount = newSrcAmount;

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.srcAmount);
            }
        }

        return this.runTestAction(() => this.content.srcResultField.input(val));
    }

    async inputDestResBalance(val) {
        assert(this.model.type !== EXPENSE, 'Unexpected action: can\'t input destination result balance');

        const { precision } = this.model.destCurr;
        const cutVal = trimToDigitsLimit(val, precision);
        const fNewValue = isValidValue(cutVal)
            ? normalize(cutVal, precision)
            : cutVal;

        this.model.destResBal = cutVal;
        const valueChanged = this.model.fDestResBal !== fNewValue;
        if (valueChanged) {
            this.model.fDestResBal = fNewValue;

            if (this.model.type === INCOME) {
                const newSrcAmount = normalize(
                    fNewValue - this.model.destAccount.balance,
                    precision,
                );

                this.model.srcAmount = newSrcAmount;
                this.model.fSrcAmount = newSrcAmount;

                if (this.model.isDiffCurr) {
                    this.calcExchByAmounts();
                    this.updateExch();
                } else {
                    this.setDestAmount(this.model.fSrcAmount);
                }
            } else if ([TRANSFER, DEBT, LIMIT_CHANGE].includes(this.model.type)) {
                const newDestAmount = normalize(
                    fNewValue - this.model.destAccount.balance,
                    precision,
                );

                this.model.destAmount = newDestAmount;
                this.model.fDestAmount = newDestAmount;

                if (this.model.isDiffCurr) {
                    this.calcExchByAmounts();
                    this.updateExch();
                } else {
                    this.setSrcAmount(this.model.destAmount);
                }
            }
        }

        return this.runTestAction(() => this.content.destResultField.input(val));
    }

    async changeSourceCurrency(val) {
        const availTypes = [INCOME, DEBT];
        assert(availTypes.includes(this.model.type), 'Unexpected action: can\'t change source currency');
        if (this.model.type === DEBT) {
            assert(this.model.debtType, 'Invalid state');
        }

        if (this.model.src_curr_id === val) {
            return true;
        }

        const isDiffBefore = this.model.isDiffCurr;

        this.model.src_curr_id = parseInt(val, 10);
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);

        if (this.model.type === DEBT) {
            this.model.personAccount = this.getPersonAccount(
                this.model.person.id,
                this.model.src_curr_id,
            );
            this.model.srcAccount = this.model.personAccount;
            this.calculateSourceResult();

            if (this.model.noAccount) {
                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;
            }
        }

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (isDiffBefore && !this.model.isDiffCurr) {
            this.setDestAmount(this.model.srcAmount);
            this.calcExchByAmounts();
        }
        this.updateExch();

        if (this.model.type === INCOME && isDiffBefore !== this.model.isDiffCurr) {
            if (this.model.isDiffCurr) {
                this.stateTransition(this.model, {
                    0: 2, // Transition 3
                });
            } else {
                this.stateTransition(this.model, {
                    2: 0, // Transition 10
                    3: 0, // Transition 16
                    4: 1, // Transition 22
                });
            }
        }

        if (this.model.type === DEBT && isDiffBefore !== this.model.isDiffCurr) {
            if (this.model.isDiffCurr) {
                this.stateTransition(this.model, {
                    0: 10, // Transition 53
                });
            } else {
                this.stateTransition(this.model, {
                    10: 0, // Transition 54
                    12: 0, // Transition 76
                    15: 0, // Transition 86
                });
            }
        }

        return this.runTestAction(() => this.content.srcAmountField.selectCurr(val));
    }

    async changeDestCurrency(val) {
        const availTypes = [EXPENSE, DEBT];
        assert(availTypes.includes(this.model.type), 'Unexpected action: can\'t change destination currency');
        if (this.model.type === DEBT) {
            assert(!this.model.debtType, 'Invalid state');
        }

        if (this.model.dest_curr_id === val) {
            return true;
        }

        const isDiffBefore = this.model.isDiffCurr;

        this.model.dest_curr_id = parseInt(val, 10);
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        if (this.model.type === DEBT) {
            this.model.personAccount = this.getPersonAccount(
                this.model.person.id,
                this.model.dest_curr_id,
            );
            this.model.destAccount = this.model.personAccount;
            this.calculateDestResult();

            if (this.model.noAccount) {
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.srcCurr = this.model.destCurr;
            }
        }
        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (isDiffBefore && !this.model.isDiffCurr) {
            this.setSrcAmount(this.model.fDestAmount);
            this.calcExchByAmounts();
        }
        this.updateExch();

        if (this.model.type === EXPENSE && isDiffBefore !== this.model.isDiffCurr) {
            if (this.model.isDiffCurr) {
                this.stateTransition(this.model, {
                    0: 2, // Transition 4
                });
            } else {
                this.stateTransition(this.model, {
                    2: 0, // Transition 9
                });
            }
        }

        if (this.model.type === DEBT && isDiffBefore !== this.model.isDiffCurr) {
            if (this.model.isDiffCurr) {
                this.stateTransition(this.model, {
                    3: 16, // Transition 96
                });
            } else {
                this.stateTransition(this.model, {
                    16: 3, // Transition 95
                    18: 3, // Transition 111
                    21: 3, // Transition 122
                });
            }
        }

        return this.runTestAction(() => this.content.destAmountField.selectCurr(val));
    }

    async clickExchRate() {
        if (this.model.type === EXPENSE || this.model.type === INCOME) {
            this.model.state = 3;
        } else if (this.model.type === TRANSFER) {
            this.stateTransition(this.model, {
                3: 7, // Transition 40
                5: 7, // Transition 21
                4: 8, // Transition 34
                6: 8, // Transition 45
            });
        } else if (this.model.type === DEBT) {
            this.stateTransition(this.model, {
                10: 12, // Transition 57
                11: 13, // Transition 65
                15: 12, // Transition 74
                14: 13, // Transition 79
                16: 18, // Transition 93
                17: 19, // Transition 101
                21: 18, // Transition 110
                20: 19, // Transition 115
            });
        }

        return this.runTestAction(() => this.content.exchangeInfo.click());
    }

    isExchangeInputVisible() {
        return !!this.content.exchangeField?.content?.visible;
    }

    async inputExchRate(val) {
        assert(this.isExchangeInputVisible(), `Unexpected state ${this.model.state} to input exchange rate`);

        const { useBackExchange } = this.model;
        const cutVal = trimToDigitsLimit(val, EXCHANGE_PRECISION, false);
        if (useBackExchange) {
            this.model.backExchRate = cutVal;
        } else {
            this.model.exchRate = cutVal;
        }

        const fNewValue = normalizeExch(cutVal);
        const valueChanged = (
            (useBackExchange && this.model.fBackExchRate !== fNewValue)
            || (!useBackExchange && this.model.fExchRate !== fNewValue)
        );

        if (valueChanged) {
            if (useBackExchange) {
                this.model.fBackExchRate = fNewValue;
            } else {
                this.model.fExchRate = fNewValue;
            }

            if (isValidValue(this.model.srcAmount)) {
                let newDestAmount;
                if (useBackExchange) {
                    newDestAmount = (fNewValue === 0)
                        ? 0
                        : correct(this.model.fSrcAmount / fNewValue);
                } else {
                    newDestAmount = correct(this.model.fSrcAmount * fNewValue);
                }

                this.setDestAmount(newDestAmount);
            } else if (isValidValue(this.model.destAmount)) {
                let newSrcAmount;
                if (useBackExchange) {
                    newSrcAmount = correct(this.model.fDestAmount * fNewValue);
                } else {
                    newSrcAmount = (fNewValue === 0)
                        ? 0
                        : correct(this.model.fDestAmount / fNewValue);
                }

                this.setSrcAmount(newSrcAmount);
            }

            if (useBackExchange) {
                this.model.exchRate = this.calcExchange();
            } else {
                this.model.backExchRate = this.calcBackExchange();
            }

            this.updateExch();
        }

        return this.runTestAction(() => this.content.exchangeField.input(val));
    }

    async toggleExchange() {
        assert(this.isExchangeInputVisible(), `Unexpected state ${this.model.state} to input exchange rate`);

        this.model.useBackExchange = !this.model.useBackExchange;
        this.updateExch();

        return this.runTestAction(() => this.content.exchangeField.clickButton());
    }

    async inputDate(val) {
        this.model.date = val.toString();
        this.model.dateInvalidated = false;

        return this.runTestAction(() => this.content.datePicker.input(val));
    }

    async selectDate(val) {
        assert.isDate(val, 'Invalid date');

        const locales = this.appState().getDateFormatLocale();
        this.model.date = formatDate(val, { locales, options: App.dateFormatOptions });
        this.model.dateInvalidated = false;

        return this.runTestAction(() => this.content.datePicker.selectDate(val));
    }

    async changeCategory(val) {
        const category = this.appState().categories.getItem(val);
        const categoryId = category?.id ?? 0;
        if (this.model.categoryId === categoryId) {
            return true;
        }

        this.model.categoryId = categoryId;

        return this.runTestAction(() => this.content.categorySelect.setSelection(val));
    }

    async inputScheduleName(val) {
        this.model.scheduleNameInvalidated = false;
        this.model.scheduleName = val.toString();

        return this.runTestAction(() => this.content.scheduleNameField.input(val));
    }

    async inputComment(val) {
        this.model.comment = val.toString();

        return this.runTestAction(() => this.content.commentField.input(val));
    }

    async changePerson(val) {
        this.model.person = this.appState().persons.getItem(val);

        const personAccCurrencyId = (this.model.debtType)
            ? this.model.srcCurr.id
            : this.model.destCurr.id;
        this.model.personAccount = this.getPersonAccount(
            this.model.person.id,
            personAccCurrencyId,
        );

        if (this.model.debtType) {
            this.model.srcAccount = this.model.personAccount;
            this.calculateSourceResult();
        } else {
            this.model.destAccount = this.model.personAccount;
            this.calculateDestResult();
        }

        return this.runTestAction(() => this.content.personContainer.selectAccount(val));
    }

    async toggleAccount() {
        this.model.noAccount = !this.model.noAccount;

        if (this.model.noAccount) {
            this.model.lastAccount_id = this.model.account.id;
            if (this.model.debtType) {
                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;
                this.setDestAmount(this.model.fSrcAmount);
            } else {
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.srcCurr = this.model.destCurr;
                this.setSrcAmount(this.model.fDestAmount);
            }

            this.model.account = null;

            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

            this.stateTransition(this.model, {
                0: 6, // Transition 25
                1: 9, // Transition 38
                2: 6, // Transition 41
                3: 7, // Transition 40
                4: 8, // Transition 39
                5: 7, // Transition 50
                10: 6, // Transition 61
                11: 9, // Transition 69
                12: 6, // Transition 77
                13: 9, // Transition 81
                14: 9, // Transition 85
                15: 6, // Transition 88
                16: 7, // Transition 97
                17: 8, // Transition 105
                18: 7, // Transition 113
                19: 8, // Transition 117
                20: 8, // Transition 121
                21: 7, // Transition 124
            });
        } else {
            if (this.model.lastAccount_id) {
                this.model.account = this.appState().accounts.getItem(this.model.lastAccount_id);
            } else {
                this.model.account = this.appState().getFirstAccount();
            }
            assert(this.model.account, 'Account not found');

            this.model.personAccount = this.getPersonAccount(
                this.model.person.id,
                this.model.account.curr_id,
            );

            if (this.model.debtType) {
                this.model.srcAccount = this.model.personAccount;
                this.model.destAccount = this.model.account;
                this.calculateDestResult();
            } else {
                this.model.srcAccount = this.model.account;
                this.model.destAccount = this.model.personAccount;
                this.calculateSourceResult();
            }
            this.model.src_curr_id = this.model.srcAccount.curr_id;
            this.model.dest_curr_id = this.model.destAccount.curr_id;
            this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);
            this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);
            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

            if (!this.model.isDiffCurr) {
                this.stateTransition(this.model, {
                    6: 0, // Transition 26
                    7: 3, // Transition 29
                    8: 4, // Transition 32
                    9: 1, // Transition 37
                });
            }
        }

        this.calcExchByAmounts();
        this.updateExch();

        const action = (this.model.noAccount)
            ? () => click(this.content.noacc_btn.elem)
            : () => click(this.content.selaccount.elem);

        return this.runTestAction(action);
    }

    async changeAccount(accountId) {
        const newAcc = this.appState().accounts.getItem(accountId);

        if (!this.model.account || !newAcc || newAcc.id === this.model.account.id) {
            return true;
        }

        this.model.account = newAcc;

        const isDiffBefore = this.model.isDiffCurr;
        if (!isDiffBefore && this.model.personAccount.curr_id !== newAcc.curr_id) {
            this.model.personAccount = this.getPersonAccount(
                this.model.person.id,
                this.model.account.curr_id,
            );
        }

        if (this.model.debtType) {
            this.model.srcAccount = this.model.personAccount;
            this.model.destAccount = this.model.account;
        } else {
            this.model.srcAccount = this.model.account;
            this.model.destAccount = this.model.personAccount;
        }
        this.model.src_curr_id = this.model.srcAccount.curr_id;
        this.model.dest_curr_id = this.model.destAccount.curr_id;
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);
        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        this.calculateSourceResult();
        this.calculateDestResult();
        this.updateExch();

        if (isDiffBefore !== this.model.isDiffCurr && !this.model.isDiffCurr) {
            this.stateTransition(this.model, {
                10: 0, // Transition 137
                11: 1, // Transition 67
                12: 0, // Transition 75
                13: 1, // Transition 80
                14: 1, // Transition 84
                15: 0, // Transition 87
                16: 3, // Transition 139
                17: 4, // Transition 103
                18: 3, // Transition 111
                19: 4, // Transition 116
                20: 4, // Transition 120
                21: 3, // Transition 123
            });
        }

        return this.runTestAction(() => this.content.debtAccountContainer.selectAccount(accountId));
    }

    async swapSourceAndDest() {
        const availTypes = [TRANSFER, DEBT];
        assert(availTypes.includes(this.model.type), 'Invalid transaction type: can\'t swap source and destination');

        const srcCurrId = this.model.src_curr_id;
        const { srcAmount, fSrcAmount, srcAccount } = this.model;

        this.model.srcAccount = this.model.destAccount;
        this.model.destAccount = srcAccount;

        this.model.src_curr_id = this.model.dest_curr_id;
        this.model.dest_curr_id = srcCurrId;
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        this.model.srcAmount = this.model.destAmount;
        this.model.fSrcAmount = this.model.fDestAmount;
        this.model.destAmount = srcAmount;
        this.model.fDestAmount = fSrcAmount;

        if (this.model.type === DEBT) {
            this.model.debtType = !this.model.debtType;

            this.stateTransition(this.model, {
                0: 3, // Transition 7
                1: 4, // Transition 15
                2: 5, // Transition 18
                3: 0, // Transition 8
                4: 1, // Transition 16
                5: 2, // Transition 17
                6: 7, // Transition 27
                7: 6, // Transition 28
                8: 9, // Transition 33
                9: 8, // Transition 34
                10: 16, // Transition 125
                16: 10, // Transition 126
                11: 17, // Transition 127
                17: 11, // Transition 128
                12: 18, // Transition 129
                18: 12, // Transition 130
                13: 19, // Transition 131
                19: 13, // Transition 132
                14: 20, // Transition 133
                20: 14, // Transition 134
                15: 21, // Transition 135
                21: 15, // Transition 136
            });
        }

        this.calculateSourceResult();
        this.calculateDestResult();
        this.calcExchByAmounts();
        this.updateExch();

        return this.runTestAction(() => click(this.content.swapBtn.elem));
    }
}
