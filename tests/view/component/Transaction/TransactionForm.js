import {
    assert,
    url,
    query,
    prop,
    navigation,
    click,
    asyncMap,
    isObject,
    formatDate,
    isValidDateString,
    TestComponent,
    asArray,
} from 'jezve-test';
import { DropDown, LinkMenu } from 'jezvejs-test';
import {
    correct,
    correctExch,
    normalize,
    isValidValue,
    normalizeExch,
    trimToDigitsLimit,
    EXCHANGE_PRECISION,
    dateStringToSeconds,
} from '../../../common.js';
import { TransactionTypeMenu } from '../LinkMenu/TransactionTypeMenu.js';
import { InputRow } from '../InputRow.js';
import { WarningPopup } from '../WarningPopup.js';
import { DatePickerRow } from '../DatePickerRow.js';
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
import {
    INTERVAL_DAY,
    INTERVAL_MONTH,
    INTERVAL_NONE,
    INTERVAL_WEEK,
    INTERVAL_YEAR,
    ScheduledTransaction,
} from '../../../model/ScheduledTransaction.js';
import { DatePickerFilter } from '../DatePickerFilter.js';

export const TRANSACTION_FORM = 'transaction';
export const SCHEDULE_ITEM_FORM = 'scheduleItem';

const infoItemSelectors = [
    '#srcAmountInfo',
    '#destAmountInfo',
    '#srcResBalanceInfo',
    '#destResBalanceInfo',
    '#exchangeInfo',
];
const inputRowSelectors = [
    '#srcAmountRow',
    '#destAmountRow',
    '#exchangeRow',
    '#srcResBalanceRow',
    '#destResBalanceRow',
    '#commentRow',
];

/** Create or update transaction form class */
export class TransactionForm extends TestComponent {
    static getExpectedState(model) {
        const state = parseInt(model.state, 10);
        assert(!Number.isNaN(state), 'Invalid state specified');

        const isTransactionForm = (model.formType === TRANSACTION_FORM);
        const isScheduleItemForm = (model.formType === SCHEDULE_ITEM_FORM);

        const isExpense = model.type === EXPENSE;
        const isIncome = model.type === INCOME;
        const isTransfer = model.type === TRANSFER;
        const isDebt = model.type === DEBT;
        const isLimitChange = model.type === LIMIT_CHANGE;
        const { isAvailable, isDiffCurr } = model;
        const { locale } = App.view;

        const res = {
            typeMenu: { value: model.type },
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
            srcAmountRow: {},
            destAmountRow: {},
            srcResBalanceRow: {},
            destResBalanceRow: {},
            exchangeRow: {},
            srcAmountInfo: {},
            destAmountInfo: {},
            srcResBalanceInfo: {},
            destResBalanceInfo: {},
            exchangeInfo: {},
        };

        if (isAvailable) {
            res.srcAmountRow.value = model.srcAmount.toString();
            res.srcAmountRow.currSign = (model.srcCurr) ? model.srcCurr.sign : '';
            res.srcAmountRow.isCurrActive = (isIncome || (isDebt && model.debtType));
            res.srcAmountRow.isInvalid = model.srcAmountInvalidated;

            res.destAmountRow.value = model.destAmount.toString();
            res.destAmountRow.currSign = (model.destCurr) ? model.destCurr.sign : '';
            res.destAmountRow.isCurrActive = (isExpense || (isDebt && !model.debtType));
            res.destAmountRow.isInvalid = model.destAmountInvalidated;

            if (model.destCurr && model.srcCurr) {
                const exchRateValue = (model.useBackExchange)
                    ? model.backExchRate
                    : model.exchRate;
                const exchSign = (model.useBackExchange)
                    ? model.backExchSign
                    : model.exchSign;

                res.exchangeRow.value = exchRateValue.toString();
                res.exchangeRow.currSign = exchSign;
                res.exchangeInfo.value = model.fmtExch;
            }

            if (isTransactionForm) {
                res.datePicker = {
                    visible: true,
                    value: App.reformatDate(model.date),
                    isInvalid: model.dateInvalidated,
                };
            } else if (isScheduleItemForm) {
                const isRepeat = model.intervalType !== INTERVAL_NONE;

                res.dateRangeInput = {
                    visible: true,
                    startInputGroup: { visible: true },
                    endInputGroup: { visible: isRepeat },
                    value: {
                        startDate: App.reformatDate(model.startDate),
                        endDate: App.reformatDate(model.endDate),
                    },
                    invalidated: model.dateRangeInvalidated,
                };
                res.intervalStepRow = {
                    visible: isRepeat,
                    value: model.intervalStep,
                    isInvalid: model.intervalStepInvalidated,
                };
                res.intervalTypeSelect = {
                    visible: true,
                    value: model.intervalType.toString(),
                };

                res.weekDayOffsetSelect = {
                    visible: model.intervalType === INTERVAL_WEEK,
                };
                if (res.weekDayOffsetSelect.visible) {
                    const offset = asArray(model.intervalOffset).map((item) => item?.toString());
                    res.weekDayOffsetSelect.value = offset;
                }

                const dayOffsetIntervals = [INTERVAL_MONTH, INTERVAL_YEAR];

                res.monthDayOffsetSelect = {
                    visible: dayOffsetIntervals.includes(model.intervalType),
                };
                res.monthOffsetSelect = {
                    visible: model.intervalType === INTERVAL_YEAR,
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

            const visibleCategories = App.view.appState()
                .getCategoriesForType(model.type)
                .map((item) => ({ id: item.id.toString() }));

            res.categorySelect = {
                visible: true,
                items: visibleCategories,
                value: model.categoryId.toString(),
            };
            res.commentRow = {
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

        if ((isExpense || isTransfer || isDebt) && isAvailable) {
            res.srcResBalanceRow.value = model.srcResBal.toString();
            res.srcResBalanceRow.isCurrActive = false;

            res.srcResBalanceInfo.value = (model.srcCurr)
                ? model.srcCurr.format(model.fSrcResBal)
                : '';
        }

        if (model.type !== EXPENSE && isAvailable) {
            res.srcAmountInfo.value = (model.srcCurr) ? model.srcCurr.format(model.fSrcAmount) : '';
            res.destResBalanceRow.value = model.destResBal.toString();

            res.destResBalanceRow.isCurrActive = false;

            res.destResBalanceInfo.value = (model.destCurr)
                ? model.destCurr.format(model.fDestResBal)
                : '';
        }
        if (model.type !== DEBT && isAvailable) {
            res.destAmountInfo.value = (model.destCurr) ? model.destCurr.format(model.fDestAmount) : '';
        }

        if (isAvailable) {
            if (model.type === LIMIT_CHANGE) {
                res.srcAmountRow.label = '';
                res.destAmountRow.label = __('TR_LIMIT_DELTA', locale);
            } else {
                res.srcAmountRow.label = (isDiffCurr) ? __('TR_SRC_AMOUNT', locale) : __('TR_AMOUNT', locale);
                res.destAmountRow.label = (isDiffCurr) ? __('TR_DEST_AMOUNT', locale) : __('TR_AMOUNT', locale);
            }
        }

        const resultBalanceTok = __('TR_RESULT', locale);

        if (isExpense) {
            assert(state >= -1 && state <= 4, 'Invalid state specified');

            if (isAvailable && isTransactionForm) {
                res.srcResBalanceRow.label = resultBalanceTok;
            }

            res.srcAmountInfo.visible = false;
            if (isScheduleItemForm) {
                this.hideInputRow(res, 'srcResBalance');
            }
            this.hideInputRow(res, 'destResBalance');

            if (state === -1) {
                this.hideInputRow(res, 'srcAmount');
                this.hideInputRow(res, 'destAmount');
                this.hideInputRow(res, 'srcResBalance');
                this.hideInputRow(res, 'exchange');
            } else if (state === 0) {
                this.hideInputRow(res, 'srcAmount');
                this.showInputRow(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                }
                this.hideInputRow(res, 'exchange');
            } else if (state === 1 && isTransactionForm) {
                this.hideInputRow(res, 'srcAmount');
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', true);
                this.hideInputRow(res, 'exchange');
            } else if (state === 2) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                }
                this.showInputRow(res, 'exchange', false);
            } else if (state === 3) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', false);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                }
                this.showInputRow(res, 'exchange', true);
            } else if (state === 4 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'exchange', false);
            }
        }

        if (isIncome) {
            assert(state >= -1 && state <= 4, 'Invalid state specified');

            if (isAvailable && isTransactionForm) {
                res.destResBalanceRow.label = resultBalanceTok;
            }

            this.hideInputRow(res, 'srcResBalance');
            if (isScheduleItemForm) {
                this.hideInputRow(res, 'destResBalance');
            }

            if (state === -1) {
                this.hideInputRow(res, 'srcAmount');
                this.hideInputRow(res, 'destAmount');
                this.hideInputRow(res, 'destResBalance');
                this.hideInputRow(res, 'exchange');
            } else if (state === 0) {
                this.showInputRow(res, 'srcAmount', true);
                this.hideInputRow(res, 'destAmount');
                if (isTransactionForm) {
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.hideInputRow(res, 'exchange');
            } else if (state === 1 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.hideInputRow(res, 'destAmount');
                this.showInputRow(res, 'destResBalance', true);
                this.hideInputRow(res, 'exchange');
            } else if (state === 2) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.showInputRow(res, 'exchange', false);
            } else if (state === 3) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', false);
                if (isTransactionForm) {
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.showInputRow(res, 'exchange', true);
            } else if (state === 4 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'destResBalance', true);
                this.showInputRow(res, 'exchange', false);
            }
        }

        if (isTransfer) {
            assert(state >= -1 && state <= 8, 'Invalid state specified');

            if (isAvailable && isTransactionForm) {
                res.srcResBalanceRow.label = `${resultBalanceTok} (${__('TR_SOURCE', locale)})`;
                res.destResBalanceRow.label = `${resultBalanceTok} (${__('TR_DESTINATION', locale)})`;
            }

            if (isScheduleItemForm) {
                this.hideInputRow(res, 'srcResBalance');
                this.hideInputRow(res, 'destResBalance');
            }

            if (state === -1) {
                this.hideInputRow(res, 'srcAmount');
                this.hideInputRow(res, 'destAmount');
                this.hideInputRow(res, 'srcResBalance');
                this.hideInputRow(res, 'destResBalance');
                this.hideInputRow(res, 'exchange');
            } else if (state === 0) {
                this.showInputRow(res, 'srcAmount', true);
                this.hideInputRow(res, 'destAmount');
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.hideInputRow(res, 'exchange');
            } else if (state === 1 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.hideInputRow(res, 'destAmount');
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', false);
                this.hideInputRow(res, 'exchange');
            } else if (state === 2 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.hideInputRow(res, 'destAmount');
                this.showInputRow(res, 'srcResBalance', false);
                this.showInputRow(res, 'destResBalance', true);
                this.hideInputRow(res, 'exchange');
            } else if (state === 3) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.showInputRow(res, 'exchange', false);
            } else if (state === 4 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', true);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', false);
                this.showInputRow(res, 'exchange', false);
            } else if (state === 5 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', false);
                this.showInputRow(res, 'destResBalance', true);
                this.showInputRow(res, 'exchange', false);
            } else if (state === 6 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', true);
                this.showInputRow(res, 'exchange', false);
            } else if (state === 7) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', false);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.showInputRow(res, 'exchange', true);
            } else if (state === 8 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', false);
                this.showInputRow(res, 'exchange', true);
            }
        }

        if (isDebt) {
            assert(state >= -1 && state <= 21, 'Invalid state specified');

            const { debtType, noAccount } = model;
            const userAccounts = App.view.appState().getUserAccounts();
            const accountsAvailable = userAccounts.length > 0;

            res.selaccount = { visible: isAvailable && noAccount && accountsAvailable };
            res.noacc_btn = { visible: isAvailable && !noAccount };
            res.noAccountsMsg = { visible: isAvailable && !accountsAvailable };

            if (isAvailable && isTransactionForm) {
                const personTok = __('TR_PERSON', locale);
                const accountTok = __('TR_ACCOUNT', locale);

                res.srcResBalanceRow.label = (debtType)
                    ? `${resultBalanceTok} (${personTok})`
                    : `${resultBalanceTok} (${accountTok})`;
                res.destResBalanceRow.label = (debtType)
                    ? `${resultBalanceTok} (${accountTok})`
                    : `${resultBalanceTok} (${personTok})`;
            }

            if (debtType) {
                if (isAvailable) {
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

            if (state < 10) {
                this.hideInputRow(res, 'exchange');
            }

            if (isScheduleItemForm) {
                this.hideInputRow(res, 'srcResBalance');
                this.hideInputRow(res, 'destResBalance');
            }

            if (state === -1) {
                this.hideInputRow(res, 'srcAmount');
                this.hideInputRow(res, 'destAmount');
                this.hideInputRow(res, 'srcResBalance');
                this.hideInputRow(res, 'destResBalance');
            } else if (state === 0) {
                this.showInputRow(res, 'srcAmount', true);
                this.hideInputRow(res, 'destAmount');
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                    this.showInputRow(res, 'destResBalance', false);
                }
            } else if (state === 1 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.hideInputRow(res, 'destAmount');
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', false);
            } else if (state === 2 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.hideInputRow(res, 'destAmount');
                this.showInputRow(res, 'srcResBalance', false);
                this.showInputRow(res, 'destResBalance', true);
            } else if (state === 3) {
                this.hideInputRow(res, 'srcAmount');
                this.showInputRow(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                    this.showInputRow(res, 'destResBalance', false);
                }
            } else if (state === 4 && isTransactionForm) {
                this.hideInputRow(res, 'srcAmount');
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', false);
                this.showInputRow(res, 'destResBalance', true);
            } else if (state === 5 && isTransactionForm) {
                this.hideInputRow(res, 'srcAmount');
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', false);
            } else if (state === 6) {
                this.showInputRow(res, 'srcAmount', true);
                this.hideInputRow(res, 'destAmount');
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                }
                this.hideInputRow(res, 'destResBalance');
            } else if (state === 7) {
                this.hideInputRow(res, 'srcAmount');
                this.showInputRow(res, 'destAmount', true);
                this.hideInputRow(res, 'srcResBalance');
                if (isTransactionForm) {
                    this.showInputRow(res, 'destResBalance', false);
                }
            } else if (state === 8 && isTransactionForm) {
                this.hideInputRow(res, 'srcAmount');
                this.showInputRow(res, 'destAmount', false);
                this.hideInputRow(res, 'srcResBalance');
                this.showInputRow(res, 'destResBalance', true);
            } else if (state === 9 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.hideInputRow(res, 'destAmount');
                this.showInputRow(res, 'srcResBalance', true);
                this.hideInputRow(res, 'destResBalance');
            } else if (state === 10 || state === 16) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.showInputRow(res, 'exchange', false);
            } else if (state === 11 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', true);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', false);
                this.showInputRow(res, 'exchange', false);
            } else if (state === 12) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', false);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.showInputRow(res, 'exchange', true);
            } else if (state === 13 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', false);
                this.showInputRow(res, 'exchange', true);
            } else if ((state === 14 || state === 20) && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', true);
                this.showInputRow(res, 'exchange', false);
            } else if ((state === 15 || state === 17) && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', true);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', false);
                this.showInputRow(res, 'destResBalance', true);
                this.showInputRow(res, 'exchange', false);
            } else if (state === 18) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputRow(res, 'srcResBalance', false);
                    this.showInputRow(res, 'destResBalance', false);
                }
                this.showInputRow(res, 'exchange', true);
            } else if (state === 19 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'srcResBalance', false);
                this.showInputRow(res, 'destResBalance', true);
                this.showInputRow(res, 'exchange', true);
            } else if (state === 21 && isTransactionForm) {
                this.showInputRow(res, 'srcAmount', false);
                this.showInputRow(res, 'destAmount', true);
                this.showInputRow(res, 'srcResBalance', true);
                this.showInputRow(res, 'destResBalance', false);
                this.showInputRow(res, 'exchange', false);
            }
        }

        if (isLimitChange) {
            this.hideInputRow(res, 'srcAmount');
            this.hideInputRow(res, 'exchange');
            this.hideInputRow(res, 'srcResBalance');
            if (isScheduleItemForm) {
                this.hideInputRow(res, 'destResBalance');
            }

            if (state === -1) {
                this.hideInputRow(res, 'destAmount');
                this.hideInputRow(res, 'destResBalance');
            } else if (state === 0 && isTransactionForm) {
                this.showInputRow(res, 'destAmount', false);
                this.showInputRow(res, 'destResBalance', true);
            } else if (state === 1) {
                this.showInputRow(res, 'destAmount', true);
                if (isTransactionForm) {
                    this.showInputRow(res, 'destResBalance', false);
                }
            }
        }

        return res;
    }

    static showInputRow(model, name, showInput) {
        const res = model;
        const rowName = `${name}Row`;
        const infoName = `${name}Info`;
        assert(isObject(res[rowName]) && isObject(res[infoName]), `Invalid row name: ${name}`);

        res[rowName].visible = showInput;
        res[infoName].visible = !showInput;

        return res;
    }

    static hideInputRow(model, name) {
        const res = model;
        const rowName = `${name}Row`;
        const infoName = `${name}Info`;
        assert(isObject(res[rowName]) && isObject(res[infoName]), `Invalid row name: ${name}`);

        res[rowName].visible = false;
        res[infoName].visible = false;

        return res;
    }

    constructor(parent, elem, formType = TRANSACTION_FORM) {
        super(parent, elem);
        this.formType = formType;
    }

    isTransactionForm() {
        return this.formType === TRANSACTION_FORM;
    }

    isScheduleItemForm() {
        return this.formType === SCHEDULE_ITEM_FORM;
    }

    async parseContent() {
        const res = {};

        res.isUpdate = (await url()).includes('/update/');

        if (res.isUpdate) {
            const hiddenEl = await query('#idInp');
            assert(hiddenEl, 'Transaction id field not found');

            res.id = parseInt(await prop(hiddenEl, 'value'), 10);
            assert(res.id, 'Wrong transaction id');
        }

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        assert(!res.typeMenu.multi, 'Invalid transaction type menu');

        res.notAvailMsg = { elem: await query('#notAvailMsg') };
        assert(res.notAvailMsg.elem, 'No available transaction message element not found');
        res.notAvailMsg.message = await prop(res.notAvailMsg.elem, 'textContent');

        res.personContainer = await TileBlock.create(this, await query('#personContainer'));
        if (res.personContainer) {
            const personIdInp = await query('#personIdInp');
            res.personContainer.content.id = parseInt(await prop(personIdInp, 'value'), 10);
        }

        const srcCurrInp = await query('#srcCurrInp');
        res.srcCurrId = parseInt(await prop(srcCurrInp, 'value'), 10);

        const destCurrInp = await query('#destCurrInp');
        res.destCurrId = parseInt(await prop(destCurrInp, 'value'), 10);

        const debtOperationInp = await query('#debtOperationInp');
        res.debtOperation = parseInt(await prop(debtOperationInp, 'value'), 10);

        const accountBlock = await query('#debtAccountContainer');
        res.debtAccountContainer = await TileBlock.create(this, accountBlock);
        const debtAccountInp = await query('#debtAccountInp');
        res.debtAccountContainer.content.id = parseInt(await prop(debtAccountInp, 'value'), 10);

        res.selaccount = { elem: await query(accountBlock, '.account-toggler .btn') };
        assert(res.selaccount.elem, 'Select account button not found');

        res.swapBtn = { elem: await query('#swapBtn') };
        assert(res.swapBtn.elem, 'Swap button not found');

        res.noacc_btn = { elem: await query(accountBlock, '.close-btn') };
        assert(res.noacc_btn.elem, 'Disable account button not found');
        res.noAccountsMsg = { elem: await query(accountBlock, '.nodata-message') };

        res.sourceContainer = await TileBlock.create(this, await query('#sourceContainer'));
        if (res.sourceContainer) {
            const srcIdInp = await query('#srcIdInp');
            res.sourceContainer.content.id = parseInt(await prop(srcIdInp, 'value'), 10);
        }
        res.destContainer = await TileBlock.create(this, await query('#destContainer'));
        if (res.destContainer) {
            const destIdInp = await query('#destIdInp');
            res.destContainer.content.id = parseInt(await prop(destIdInp, 'value'), 10);
        }

        [
            res.srcAmountInfo,
            res.destAmountInfo,
            res.srcResBalanceInfo,
            res.destResBalanceInfo,
            res.exchangeInfo,
        ] = await asyncMap(
            infoItemSelectors,
            async (selector) => TileInfoItem.create(this, await query(selector)),
        );

        [
            res.srcAmountRow,
            res.destAmountRow,
            res.exchangeRow,
            res.srcResBalanceRow,
            res.destResBalanceRow,
            res.commentRow,
        ] = await asyncMap(
            inputRowSelectors,
            async (selector) => InputRow.create(this, await query(selector)),
        );

        if (this.isTransactionForm()) {
            res.datePicker = await DatePickerRow.create(this, await query('#dateRow'));
        } else if (this.isScheduleItemForm()) {
            res.dateRangeInput = await DatePickerFilter.create(this, await query('#dateRangeInput'));
            res.intervalStepRow = await InputRow.create(this, await query('#intervalStepRow'));
            const intervalTypeSel = await query('.interval-type-select');
            res.intervalTypeSelect = await DropDown.create(this, intervalTypeSel);

            res.weekDayOffsetSelect = await LinkMenu.create(this, await query('.weekday-select'));
            res.monthDayOffsetSelect = await DropDown.create(this, await query('.month-day-select'));
            res.monthOffsetSelect = await DropDown.create(this, await query('.month-select'));
        }

        res.categorySelect = await DropDown.createFromChild(this, await query('#categorySelect'));

        res.submitBtn = await query('#submitBtn');
        assert(res.submitBtn, 'Submit button not found');
        res.cancelBtn = await query('#cancelBtn');
        assert(res.cancelBtn, 'Cancel button not found');

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    appState(model = this.model) {
        return App.view.appState(model);
    }

    buildModel(cont) {
        const res = this.model;

        res.formType = this.formType;

        res.type = cont.typeMenu.value;
        assert(Transaction.availTypes.includes(res.type), 'Invalid type selected');

        res.isAvailable = !cont.notAvailMsg.visible;

        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

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

        res.srcAmount = cont.srcAmountRow.value;
        res.srcAmountInvalidated = cont.srcAmountRow.isInvalid;
        res.fSrcAmount = (res.isAvailable && isValidValue(res.srcAmount))
            ? normalize(res.srcAmount, res.srcCurr.precision)
            : res.srcAmount;

        res.destAmount = cont.destAmountRow.value;
        res.destAmountInvalidated = cont.destAmountRow.isInvalid;
        res.fDestAmount = (res.isAvailable && isValidValue(res.destAmount))
            ? normalize(res.destAmount, res.destCurr.precision)
            : res.destAmount;

        res.srcResBal = cont.srcResBalanceRow.value;
        res.fSrcResBal = (res.isAvailable && isValidValue(res.srcResBal))
            ? normalize(res.srcResBal, res.srcCurr.precision)
            : res.srcResBal;

        res.destResBal = cont.destResBalanceRow.value;
        res.fDestResBal = (res.isAvailable && isValidValue(res.destResBal))
            ? normalize(res.destResBal, res.destCurr.precision)
            : res.destResBal;

        if (res.isAvailable) {
            res.exchSign = `${res.destCurr.sign}/${res.srcCurr.sign}`;
            res.backExchSign = `${res.srcCurr.sign}/${res.destCurr.sign}`;

            res.useBackExchange = (res.isDiffCurr)
                ? (cont.exchangeRow.currSign === res.backExchSign)
                : false;

            if (res.useBackExchange) {
                res.backExchRate = cont.exchangeRow.value;
                res.exchRate = this.calcExchange(res);
            } else {
                res.exchRate = cont.exchangeRow.value;
                res.backExchRate = this.calcBackExchange(res);
            }

            this.updateExch();
        }

        const srcAmountRowVisible = cont.srcAmountRow?.content?.visible;
        const destAmountRowVisible = cont.destAmountRow?.content?.visible;
        const srcResRowVisible = cont.srcResBalanceRow?.content?.visible;
        const destResRowVisible = cont.destResBalanceRow?.content?.visible;
        const exchRowVisible = cont.exchangeRow?.content?.visible;

        if (res.type === EXPENSE) {
            if (res.isAvailable) {
                assert(res.srcAccount, 'Source account not found');
            }

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.isDiffCurr) {
                if (exchRowVisible) {
                    res.state = 3;
                } else {
                    res.state = (srcResRowVisible) ? 4 : 2;
                }
            } else {
                res.state = (srcResRowVisible) ? 1 : 0;
            }
        }

        if (res.type === INCOME) {
            if (res.isAvailable) {
                assert(res.destAccount, 'Destination account not found');
            }

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.isDiffCurr) {
                if (exchRowVisible) {
                    res.state = 3;
                } else {
                    res.state = (destResRowVisible) ? 4 : 2;
                }
            } else {
                res.state = (destResRowVisible) ? 1 : 0;
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
                if (srcAmountRowVisible && destAmountRowVisible) {
                    res.state = 3;
                } else if (destAmountRowVisible && srcResRowVisible) {
                    res.state = 4;
                } else if (srcAmountRowVisible && destResRowVisible) {
                    res.state = 5;
                } else if (srcResRowVisible && destResRowVisible) {
                    res.state = 6;
                } else if (srcAmountRowVisible && exchRowVisible) {
                    res.state = 7;
                } else if (srcResRowVisible && exchRowVisible) {
                    res.state = 8;
                } else {
                    throw new Error('Unexpected state');
                }
            } else if (!res.isDiffCurr) {
                if (srcAmountRowVisible) {
                    res.state = 0;
                } else if (srcResRowVisible) {
                    res.state = 1;
                } else if (destResRowVisible) {
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
                if (srcAmountRowVisible && res.debtType) {
                    res.state = 6;
                } else if (destAmountRowVisible && !res.debtType) {
                    res.state = 7;
                } else if (srcResRowVisible && res.debtType) {
                    res.state = 9;
                } else if (destResRowVisible && !res.debtType) {
                    res.state = 8;
                } else {
                    throw new Error('Unexpected state');
                }
            } else if (!res.noAccount) {
                if (res.isDiffCurr) {
                    if (srcAmountRowVisible && destAmountRowVisible) {
                        res.state = (res.debtType) ? 10 : 16;
                    } else if (destAmountRowVisible && srcResRowVisible) {
                        res.state = (res.debtType) ? 11 : 21;
                    } else if (srcAmountRowVisible && exchRowVisible && res.debtType) {
                        res.state = 12;
                    } else if (destAmountRowVisible && exchRowVisible && !res.debtType) {
                        res.state = 18;
                    } else if (srcResRowVisible && exchRowVisible && res.debtType) {
                        res.state = 13;
                    } else if (destResRowVisible && exchRowVisible && !res.debtType) {
                        res.state = 19;
                    } else if (srcResRowVisible && destResRowVisible) {
                        res.state = (res.debtType) ? 14 : 20;
                    } else if (srcAmountRowVisible && destResRowVisible) {
                        res.state = (res.debtType) ? 15 : 17;
                    } else if (destAmountRowVisible && srcResRowVisible && !res.debtType) {
                        res.state = 21;
                    } else {
                        throw new Error('Unexpected state');
                    }
                } else if (srcAmountRowVisible && res.debtType) {
                    res.state = 0;
                } else if (destAmountRowVisible && !res.debtType) {
                    res.state = 3;
                } else if (srcResRowVisible) {
                    res.state = res.debtType ? 1 : 5;
                } else if (destResRowVisible) {
                    res.state = res.debtType ? 2 : 4;
                } else {
                    throw new Error('Unexpected state');
                }
            }
        }

        if (res.type === LIMIT_CHANGE) {
            if (!res.isAvailable) {
                res.state = -1;
            } else if (destResRowVisible && !destAmountRowVisible) {
                res.state = 0;
            } else if (destAmountRowVisible && !destResRowVisible) {
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
        } else if (this.isScheduleItemForm()) {
            res.startDate = cont.dateRangeInput.value.startDate;
            res.endDate = cont.dateRangeInput.value.endDate;
            res.dateRangeInvalidated = cont.dateRangeInput.invalidated;

            res.intervalStep = cont.intervalStepRow.value;
            res.intervalStepInvalidated = cont.intervalStepRow.isInvalid;
            res.intervalType = parseInt(cont.intervalTypeSelect.value, 10);

            if (res.intervalType === INTERVAL_DAY) {
                res.intervalOffset = 0;
            } else if (res.intervalType === INTERVAL_WEEK) {
                res.intervalOffset = cont.weekDayOffsetSelect.value;
            } else if (res.intervalType === INTERVAL_MONTH) {
                const offset = parseInt(cont.monthDayOffsetSelect.value, 10);
                res.intervalOffset = offset;
            } else if (res.intervalType === INTERVAL_YEAR) {
                const dayIndex = parseInt(cont.monthDayOffsetSelect.value, 10);
                const monthIndex = parseInt(cont.monthOffsetSelect.value, 10);
                res.intervalOffset = (monthIndex * 100) + dayIndex;
            }
        }

        res.categoryId = parseInt(cont.categorySelect.value, 10);
        res.comment = cont.commentRow.value;

        return res;
    }

    isValidAmount(value) {
        return value > 0;
    }

    isValidDate(value) {
        const locales = this.appState().getDateFormatLocale();
        return isValidDateString(value, { locales, options: App.dateFormatOptions });
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
        } else if (this.isScheduleItemForm()) {
            if (!this.isValidDate(this.model.startDate)) {
                return false;
            }
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
        return (model.type === LIMIT_CHANGE) ? Math.abs(model.fSrcAmount) : model.fSrcAmount;
    }

    getExpectedDestAmount(model = this.model) {
        return (model.type === LIMIT_CHANGE) ? Math.abs(model.fDestAmount) : model.fDestAmount;
    }

    getExpectedTransaction() {
        const res = {};

        if (this.model.isUpdate) {
            res.id = this.model.id;
        }

        res.type = this.model.type;
        if (res.type === DEBT) {
            res.person_id = this.model.person.id;
            res.acc_id = this.model.noAccount ? 0 : this.model.account.id;
            res.op = this.model.debtType ? 1 : 2;
        } else if (res.type === LIMIT_CHANGE) {
            const increaseLimit = this.model.fDestAmount > 0;
            res.src_id = (increaseLimit) ? 0 : this.model.destAccount.id;
            res.dest_id = (increaseLimit) ? this.model.destAccount.id : 0;
        } else {
            res.src_id = (this.model.srcAccount) ? this.model.srcAccount.id : 0;
            res.dest_id = (this.model.destAccount) ? this.model.destAccount.id : 0;
        }

        res.src_amount = this.getExpectedSourceAmount();
        res.dest_amount = this.getExpectedDestAmount();
        res.src_curr = this.model.src_curr_id;
        res.dest_curr = this.model.dest_curr_id;
        res.date = dateStringToSeconds(this.model.date, {
            locales: this.appState().getDateFormatLocale(),
            options: App.dateFormatOptions,
        });
        res.category_id = this.model.categoryId;
        res.comment = this.model.comment;

        return res;
    }

    getExpectedState(model = this.model) {
        return TransactionForm.getExpectedState(model);
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
        if (model.fSrcAmount === 0 || model.fDestAmount === 0) {
            return 1;
        }

        return correctExch(Math.abs(this.model.fDestAmount / this.model.fSrcAmount));
    }

    calcBackExchange(model = this.model) {
        if (model.fSrcAmount === 0 || model.fDestAmount === 0) {
            return 1;
        }

        return correctExch(Math.abs(this.model.fSrcAmount / this.model.fDestAmount));
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
        const currency = App.currency.getItem(currencyId);
        if (!currency) {
            return null;
        }

        const personAccount = this.appState().getPersonAccount(personId, currencyId);
        if (personAccount) {
            return personAccount;
        }

        return {
            balance: 0,
            curr_id: currencyId,
        };
    }

    getFirstCurrency() {
        return App.currency.getItemByIndex(0);
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.typeMenu.select(type));

        return this.checkState();
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
        } else if (this.isScheduleItemForm()) {
            const { startDate, endDate, intervalStep } = this.model;

            const startDateValid = this.isValidDate(startDate);
            const endDateValid = !endDate || this.isValidDate(endDate);

            this.model.dateRangeInvalidated = (!startDateValid || !endDateValid);

            const intervalStepValid = parseInt(intervalStep, 10) > 0;
            this.model.intervalStepInvalidated = !intervalStepValid;

            isValid = isValid && startDateValid && endDateValid && intervalStepValid;
        }

        const action = () => click(this.content.submitBtn);

        if (isValid) {
            await navigation(action);
        } else {
            const expected = this.getExpectedState();

            await this.performAction(action);

            this.checkState(expected);
        }
    }

    async cancel() {
        await navigation(() => click(this.content.cancelBtn));
    }

    async inputStartDate(val) {
        this.model.startDate = val.toString();
        this.model.dateRangeInvalidated = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dateRangeInput.inputStart(val));

        return this.checkState();
    }

    async selectStartDate(val) {
        assert.isDate(val, 'Invalid date');

        const locales = this.appState().getDateFormatLocale();
        this.model.startDate = formatDate(val, { locales, options: App.dateFormatOptions });
        this.model.dateRangeInvalidated = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dateRangeInput.selectStart(val));

        return this.checkState();
    }

    async inputEndDate(val) {
        this.model.endDate = val.toString();
        this.model.dateRangeInvalidated = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dateRangeInput.inputEnd(val));

        return this.checkState();
    }

    async selectEndDate(val) {
        assert.isDate(val, 'Invalid date');

        const locales = this.appState().getDateFormatLocale();
        this.model.endDate = formatDate(val, { locales, options: App.dateFormatOptions });
        this.model.dateRangeInvalidated = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dateRangeInput.selectEnd(val));

        return this.checkState();
    }

    async clearEndDate() {
        assert(this.model.endDate.length > 0, 'End date field is already empty');

        this.model.endDate = '';
        this.model.dateRangeInvalidated = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dateRangeInput.clearEnd());

        return this.checkState();
    }

    async changeIntervalType(val) {
        const type = parseInt(val, 10);
        const typeName = ScheduledTransaction.intervalTypes[type];
        assert.notEqual(this.model.intervalType, type, `Interval type is already '${typeName}'`);

        this.model.intervalType = type;
        if (type === INTERVAL_NONE) {
            this.model.endDate = '';
        }

        this.model.intervalOffset = 0;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.intervalTypeSelect.setSelection(val));

        return this.checkState();
    }

    async inputIntervalStep(val) {
        this.model.intervalStep = val;
        this.model.intervalStepInvalidated = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.intervalStepRow.input(val));

        return this.checkState();
    }

    async selectWeekDayOffset(val) {
        const { intervalType } = this.model;
        assert.equal(intervalType, INTERVAL_WEEK, `Invalid interval type: ${intervalType}`);

        const weekDays = asArray(val).map((item) => parseInt(item, 10));
        const currentSelection = asArray(this.model.intervalOffset);

        const itemsToDeselect = currentSelection.filter((item) => !weekDays.includes(item));
        const itemsToSelect = weekDays.filter((item) => !currentSelection.includes(item));

        this.model.intervalOffset = weekDays;
        const expected = this.getExpectedState();

        for (const item of itemsToSelect) {
            await this.performAction(() => this.content.weekDayOffsetSelect.toggle(item));
        }
        for (const item of itemsToDeselect) {
            await this.performAction(() => this.content.weekDayOffsetSelect.toggle(item));
        }

        return this.checkState(expected);
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.monthDayOffsetSelect.setSelection(dayIndex));

        return this.checkState();
    }

    async selectMonthOffset(val) {
        const { intervalType, intervalOffset } = this.model;

        assert.equal(intervalType, INTERVAL_YEAR, `Invalid interval type: ${intervalType}`);

        const monthIndex = parseInt(val, 10);
        const monthDay = (intervalOffset % 100);
        const offset = (monthIndex * 100) + monthDay;
        this.model.intervalOffset = offset;

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.monthOffsetSelect.setSelection(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.sourceContainer.selectAccount(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.destContainer.selectAccount(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.srcAmountRow.input(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.srcAmountInfo.click());

        return this.checkState();
    }

    async inputDestAmount(val) {
        assert(this.content.destAmountRow?.content?.visible, 'Destination amount field not visible');

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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.destAmountRow.input(val));

        return this.checkState();
    }

    async clickSrcResultBalance() {
        assert(this.model.type !== INCOME, 'Unexpected action: can\'t click by source result balance');

        if (this.model.type === EXPENSE) {
            this.stateTransition(this.model, {
                0: 1, // Transition 2
                2: 4, // Transition 6
                3: 4, // Transition 18
            });
        } else if (this.model.type === TRANSFER) {
            this.stateTransition(this.model, {
                0: 1, // Transition 1
                2: 1, // Transition 10
                3: 4, // Transition 31
                5: 6, // Transition 19
                7: 8, // Transition 22
            });
        } else if (this.model.type === DEBT) {
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.srcResBalanceInfo.click());

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.destResBalanceInfo.click());

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.destAmountInfo.click());

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.srcResBalanceRow.input(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.destResBalanceRow.input(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.srcAmountRow.selectCurr(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.destAmountRow.selectCurr(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.exchangeInfo.click());

        return this.checkState();
    }

    isExchangeInputVisible() {
        return !!this.content.exchangeRow?.content?.visible;
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.exchangeRow.input(val));

        return this.checkState();
    }

    async toggleExchange() {
        assert(this.isExchangeInputVisible(), `Unexpected state ${this.model.state} to input exchange rate`);

        this.model.useBackExchange = !this.model.useBackExchange;
        this.updateExch();
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.exchangeRow.clickButton());

        return this.checkState();
    }

    async inputDate(val) {
        this.model.date = val.toString();
        this.model.dateInvalidated = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.datePicker.input(val));

        return this.checkState();
    }

    async selectDate(val) {
        assert.isDate(val, 'Invalid date');

        const locales = this.appState().getDateFormatLocale();
        this.model.date = formatDate(val, { locales, options: App.dateFormatOptions });
        this.model.dateInvalidated = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.datePicker.selectDate(val));

        return this.checkState();
    }

    async changeCategory(val) {
        const category = this.appState().categories.getItem(val);
        const categoryId = category?.id ?? 0;
        if (this.model.categoryId === categoryId) {
            return true;
        }

        this.model.categoryId = categoryId;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.categorySelect.setSelection(val));

        return this.checkState();
    }

    async inputComment(val) {
        this.model.comment = val.toString();
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.commentRow.input(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.personContainer.selectAccount(val));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        const action = (this.model.noAccount)
            ? () => click(this.content.noacc_btn.elem)
            : () => click(this.content.selaccount.elem);

        await this.performAction(action);

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.debtAccountContainer.selectAccount(accountId));

        return this.checkState();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => click(this.content.swapBtn.elem));

        return this.checkState();
    }
}
