import { assert } from '@jezvejs/assert';
import { asArray } from '@jezvejs/types';
import { formatDate, getWeek } from '@jezvejs/datetime';
import {
    createCSV,
    cutDate,
    dateToSeconds,
    secondsToDate,
    MONTHS_IN_YEAR,
    secondsToTime,
    DAYS_IN_WEEK,
} from '../common.js';
import { App } from '../Application.js';
import { api } from './api.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
    LIMIT_CHANGE,
} from './Transaction.js';
import { ACCOUNT_TYPE_CREDIT_CARD, AccountListModel } from './AccountListModel.js';
import { SortableListModel } from './SortableListModel.js';
import { __ } from './locale.js';

const WEEKS_IN_YEAR = 52;
const MS_IN_DAY = 86400000;

const availFilters = ['type', 'accounts', 'persons', 'categories', 'startDate', 'endDate', 'search'];
const arrayFilters = ['type', 'accounts', 'persons', 'categories'];

const availGroupTypes = ['day', 'week', 'month', 'year'];

const defaultReportType = 'category';
const defaultTransactionType = EXPENSE;
const defaultGroupType = 'week';

/**
 * Transactions list model class
 */
export class TransactionListModel extends SortableListModel {
    /** Returns expected list of transactions after update specified account */
    static onUpdateAccount(list, accList, account) {
        const origAcc = accList.find((item) => item.id === account.id);
        assert(origAcc, 'Specified account not found in the original list');

        if (
            origAcc.curr_id === account.curr_id
            && origAcc.type === account.type
        ) {
            return list;
        }

        const isCreditCard = account.type === ACCOUNT_TYPE_CREDIT_CARD;

        return list.map((item) => {
            const res = { ...item };

            if (res.src_id === account.id) {
                res.src_curr = account.curr_id;
                if (res.dest_curr === account.curr_id) {
                    res.src_amount = res.dest_amount;
                }

                if (res.type === LIMIT_CHANGE && !isCreditCard) {
                    res.type = EXPENSE;
                }
            }

            if (res.dest_id === account.id) {
                res.dest_curr = account.curr_id;
                if (res.src_curr === account.curr_id) {
                    res.dest_amount = res.src_amount;
                }

                if (res.type === LIMIT_CHANGE && !isCreditCard) {
                    res.type = INCOME;
                }
            }

            return res;
        });
    }

    /** Returns expected list of transactions after delete specified accounts */
    static onDeleteAccounts(list, accList, ids) {
        const res = [];

        const itemIds = asArray(ids);
        for (const trans of list) {
            const srcRemoved = itemIds.includes(trans.src_id);
            const destRemoved = itemIds.includes(trans.dest_id);

            if (
                (trans.type === EXPENSE || trans.type === LIMIT_CHANGE)
                && srcRemoved
            ) {
                continue;
            }
            if (
                (trans.type === INCOME || trans.type === LIMIT_CHANGE)
                && destRemoved
            ) {
                continue;
            }
            if (
                (trans.type === TRANSFER || trans.type === DEBT)
                && srcRemoved
                && destRemoved
            ) {
                continue;
            }
            if (trans.type === DEBT && srcRemoved && trans.dest_id === 0) {
                continue;
            }
            if (trans.type === DEBT && destRemoved && trans.src_id === 0) {
                continue;
            }

            const convTrans = structuredClone(trans);
            if (convTrans.type === TRANSFER) {
                if (itemIds.includes(convTrans.src_id)) {
                    convTrans.type = INCOME;
                    convTrans.src_id = 0;
                } else if (itemIds.includes(convTrans.dest_id)) {
                    convTrans.type = EXPENSE;
                    convTrans.dest_id = 0;
                }
            } else if (convTrans.type === DEBT) {
                for (const accountId of itemIds) {
                    const acc = accList.find((item) => item.id === accountId);

                    if (convTrans.src_id === accountId) {
                        if (acc.owner_id !== App.owner_id) {
                            convTrans.type = INCOME;
                        }
                        convTrans.src_id = 0;
                    } else if (convTrans.dest_id === accountId) {
                        if (acc.owner_id !== App.owner_id) {
                            convTrans.type = EXPENSE;
                        }
                        convTrans.dest_id = 0;
                    }
                }
            }

            res.push(convTrans);
        }

        return res;
    }

    /** Returns expected list of transactions after delete specified categories */
    static onDeleteCategories(list, ids) {
        const itemIds = asArray(ids);
        return list.map((item) => (
            (item.category_id && itemIds.includes(item.category_id))
                ? { ...item, category_id: 0 }
                : item
        ));
    }

    async fetch() {
        return api.transaction.list();
    }

    defaultSort() {
        this.setData(this.sortItems(this, true));
    }

    getExpectedPos(params) {
        const pos = this.getLastestPos(params.date);

        return pos + 1;
    }

    getLastestPos(date = null) {
        if (date) {
            assert.isInteger(date, `Invalid date timestamp: ${date}`);
        }

        const checkList = (date) ? this.filter((item) => item.date <= date) : this;
        const res = checkList.reduce((r, item) => Math.max(r, (item.pos) ? item.pos : 0), 0);

        return res;
    }

    isMoveUpAllowed(item, nextItem) {
        return item.date <= nextItem.date;
    }

    isMoveDownAllowed(item, prevItem) {
        return item.date >= prevItem.date;
    }

    update(data) {
        if (!data?.id) {
            return false;
        }

        const { id } = data;
        const origObj = this.getItem(id);
        if (!origObj) {
            return false;
        }

        let transObj = data;
        if (origObj.date === transObj.date) {
            transObj.pos = origObj.pos;
        }

        if (!super.update(transObj)) {
            return false;
        }

        if (origObj.date !== transObj.date) {
            transObj = this.find((item) => item.id === id);

            transObj.pos = 0;
            const newPos = this.getExpectedPos(transObj);
            this.updatePos(transObj.id, newPos);
        }

        return true;
    }

    setCategory(ids, category) {
        const itemIds = asArray(ids);
        const categoryId = parseInt(category, 10);
        assert.isInteger(categoryId, 'Invalid category id');

        itemIds.forEach((id) => {
            const item = this.getItem(id);
            this.update({
                ...item,
                category_id: categoryId,
            });
        });

        return true;
    }

    updateResults(accountsList) {
        assert.instanceOf(accountsList, AccountListModel, 'Invalid accounts list specified');

        let accounts = accountsList.toInitial();
        const list = this.sortItems(this, false);

        for (const trans of list) {
            accounts = AccountListModel.applyTransaction(accounts, trans);

            trans.src_result = 0;
            if (trans.src_id) {
                const srcAcc = accounts.getItem(trans.src_id);
                if (srcAcc) {
                    trans.src_result = srcAcc.balance;
                }
            }

            trans.dest_result = 0;
            if (trans.dest_id) {
                const destAcc = accounts.getItem(trans.dest_id);
                if (destAcc) {
                    trans.dest_result = destAcc.balance;
                }
            }
        }

        this.setData(list);
        this.defaultSort();
    }

    // Filter list of transactions by specified types
    // Empty array, zero or undefined assumed filter is set as ALL
    getItemsByType(list, type) {
        let types = asArray(type);
        types = types.filter((item) => Transaction.availTypes.includes(item));
        if (!types.length) {
            return list;
        }

        return list.filter((item) => types.includes(item.type));
    }

    filterByType(type) {
        const items = this.getItemsByType(this, type);
        if (items === this) {
            return this;
        }

        return TransactionListModel.create(items);
    }

    getItemsByAccounts(list, ids) {
        assert(ids, 'Invalid account ids specified');

        const accounts = asArray(ids);
        if (!accounts.length) {
            return list;
        }

        return list.filter(
            (item) => accounts.includes(item.src_id) || accounts.includes(item.dest_id),
        );
    }

    filterByAccounts(ids) {
        const items = this.getItemsByAccounts(this, ids);
        if (items === this) {
            return this;
        }

        return TransactionListModel.create(items);
    }

    getItemsByCategories(list, ids) {
        assert.isDefined(ids, 'Invalid category ids specified');

        const categories = asArray(ids);
        if (!categories.length) {
            return list;
        }

        return list.filter((item) => categories.includes(item.category_id));
    }

    filterByCategories(ids) {
        const items = this.getItemsByCategories(this, ids);
        if (items === this) {
            return this;
        }

        return TransactionListModel.create(items);
    }

    getItemsByDate(list, start, end) {
        if (!start && !end) {
            return list;
        }

        let fStart = start ?? null;
        let fEnd = end ?? null;
        if (fStart && fEnd && fStart > fEnd) {
            const tmp = fEnd;
            fEnd = fStart;
            fStart = tmp;
        }

        return list.filter((item) => (
            !!item.date
            && (!fStart || item.date >= fStart)
            && (!fEnd || item.date <= fEnd)
        ));
    }

    filterByDate(start, end) {
        const items = this.getItemsByDate(this, start, end);
        if (items === this) {
            return this;
        }

        return TransactionListModel.create(items);
    }

    getItemsByAmount(list, min, max) {
        if (!min && !max) {
            return list;
        }

        const fMin = parseFloat(min) ?? null;
        const fMax = parseFloat(max) ?? null;

        return list.filter((item) => (
            ((fMin === null) || (item.src_amount >= fMin) || (item.dest_amount >= fMin))
            && ((fMax === null) || (item.src_amount <= fMax) || (item.dest_amount <= fMax))
        ));
    }

    filterByAmount(min, max) {
        const items = this.getItemsByAmount(this, min, max);
        if (items === this) {
            return this;
        }

        return TransactionListModel.create(items);
    }

    getItemsByQuery(list, query) {
        if (!query) {
            return list;
        }

        const lcQuery = query.toLowerCase().trim();

        return list.filter((item) => item.comment.toLowerCase().includes(lcQuery));
    }

    filterByQuery(query) {
        const items = this.getItemsByQuery(this, query);
        if (items === this) {
            return this;
        }

        return TransactionListModel.create(items);
    }

    getItemsPage(list, num, limit, range, desc = false) {
        const onPage = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;
        const pagesRange = (typeof range !== 'undefined') ? range : 1;

        const totalPages = this.getExpectedPages(list, onPage);
        assert(num >= 1 && num <= totalPages, `Invalid page number: ${num}`);

        const offset = (num - 1) * onPage;

        const res = this.sortItems(list, desc);

        return res.slice(offset, Math.min(offset + onPage * pagesRange, res.length));
    }

    getPage(num, limit, range, desc = false) {
        const items = this.getItemsPage(this, num, limit, range, desc);
        if (items === this) {
            return this;
        }

        return TransactionListModel.create(items);
    }

    filterItems(list, params = {}) {
        let res = list;

        const isDesc = params.order?.toLowerCase() === 'desc';

        res = this.sortItems(res, isDesc);

        if ('type' in params) {
            res = this.getItemsByType(res, params.type);
        }
        if ('categories' in params) {
            res = this.getItemsByCategories(res, params.categories);
        }
        if ('accounts' in params || 'persons' in params) {
            const filterAccounts = [];
            if ('persons' in params) {
                const personsFilter = asArray(params.persons);
                personsFilter.forEach((personId) => {
                    const personAccounts = App.state.getPersonAccounts(personId);
                    if (personAccounts.length > 0) {
                        filterAccounts.push(...personAccounts);
                    } else {
                        filterAccounts.push(-1);
                    }
                });
            }

            if ('accounts' in params) {
                const accountsFilter = asArray(params.accounts);
                filterAccounts.push(...accountsFilter);
            }

            res = this.getItemsByAccounts(res, filterAccounts);
        }
        if ('startDate' in params || 'endDate' in params) {
            res = this.getItemsByDate(res, params.startDate, params.endDate);
        }
        if ('minAmount' in params || 'maxAmount' in params) {
            res = this.getItemsByAmount(res, params.minAmount, params.maxAmount);
        }
        if ('search' in params) {
            res = this.getItemsByQuery(res, params.search);
        }

        return res;
    }

    applyFilter(params) {
        const items = this.filterItems(this, params);
        if (items === this) {
            return this;
        }

        const res = TransactionListModel.create(items);
        return res;
    }

    getFilter(params) {
        const res = {};

        for (const filter in params) {
            if (availFilters.includes(filter)) {
                const filterValue = params[filter];

                res[filter] = (arrayFilters.includes(filter))
                    ? asArray(filterValue)
                    : filterValue;
            }
        }

        return res;
    }

    sortItems(list, desc = false) {
        assert.isArray(list, 'Invalid list specified');

        const res = TransactionListModel.create(list);

        if (desc) {
            return res.sort((a, b) => {
                const diff = (b.date - a.date);
                return (diff === 0) ? (b.pos - a.pos) : diff;
            });
        }

        return res.sort((a, b) => {
            const diff = (a.date - b.date);
            return (diff === 0) ? (a.pos - b.pos) : diff;
        });
    }

    getExpectedPages(list, limit) {
        const onPage = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;

        return Math.max(Math.ceil(list.length / onPage), 1);
    }

    expectedPages(limit) {
        return this.getExpectedPages(this, limit);
    }

    /** Returns expected list of transactions after update specified account */
    updateAccount(accList, account) {
        const res = TransactionListModel.onUpdateAccount(this, accList, account);

        return TransactionListModel.create(res);
    }

    /** Returns expected list of transactions after delete specified accounts */
    deleteAccounts(accList, ids) {
        const res = TransactionListModel.onDeleteAccounts(this, accList, ids);

        return TransactionListModel.create(res);
    }

    /** Returns expected list of transactions after delete specified categories */
    deleteCategories(ids) {
        const res = TransactionListModel.onDeleteCategories(this, ids);

        return TransactionListModel.create(res);
    }

    getDateGroups() {
        let prevDate = null;
        const groups = [];
        let group = null;

        this.forEach((item) => {
            const currentDate = dateToSeconds(secondsToDate(item.date));
            if (currentDate !== prevDate) {
                group = {
                    id: currentDate,
                    date: currentDate,
                    items: [],
                };
                groups.push(group);
                prevDate = currentDate;
            }

            if (currentDate === prevDate) {
                group.items.push(item);
            }
        });

        return groups;
    }

    exportToCSV() {
        const header = [
            'ID',
            __('transactions.type'),
            __('transactions.sourceAmount'),
            __('transactions.destAmount'),
            __('transactions.sourceResult'),
            __('transactions.destResult'),
            __('transactions.date'),
            __('transactions.comment'),
        ];

        const data = this.sortItems(this, false).map((transaction) => [
            transaction.id,
            Transaction.typeToString(transaction.type),
            App.currency.format(transaction.src_curr, transaction.src_amount),
            App.currency.format(transaction.dest_curr, transaction.dest_amount),
            App.currency.format(transaction.src_curr, transaction.src_result),
            App.currency.format(transaction.dest_curr, transaction.dest_result),
            App.formatDate(
                secondsToDate(transaction.date),
                { locales: App.state.getDateFormatLocale() },
            ),
            transaction.comment,
        ]);

        return createCSV({ header, data });
    }

    getFixedWeekYear(date) {
        const res = date.getFullYear();
        const month = date.getMonth();
        const week = getWeek(date.getTime());

        if (month === 0 && week >= WEEKS_IN_YEAR - 2) {
            return res - 1;
        }
        if (month === MONTHS_IN_YEAR - 1 && week === 1) {
            return res + 1;
        }

        return res;
    }

    getDateInfo(time, groupType) {
        const date = new Date(time);
        const res = { time, date };

        if (groupType === 'day') {
            res.id = formatDate(date, { locales: App.view.locale });
        } else if (groupType === 'week') {
            const week = getWeek(time);
            const fixedYear = this.getFixedWeekYear(date);
            res.id = `${week}.${fixedYear}`;
        } else if (groupType === 'month') {
            const month = date.getMonth();
            const year = date.getFullYear();
            res.id = `${month}.${year}`;
        } else if (groupType === 'year') {
            res.id = date.getFullYear().toString();
        }

        return res;
    }

    getDateDiff(itemA, itemB, groupType) {
        const dateA = new Date(cutDate(itemA.date));
        const dateB = new Date(cutDate(itemB.date));

        if (groupType === 'day') {
            return (dateB - dateA) / MS_IN_DAY;
        }

        if (groupType === 'week') {
            const yearA = this.getFixedWeekYear(dateA);
            const yearB = this.getFixedWeekYear(dateB);

            return (
                (yearB - yearA) * WEEKS_IN_YEAR
                + (getWeek(dateB) - getWeek(dateA))
            );
        }

        if (groupType === 'month') {
            return (
                (dateB.getFullYear() - dateA.getFullYear()) * MONTHS_IN_YEAR
                + (dateB.getMonth() - dateA.getMonth())
            );
        }

        if (groupType === 'year') {
            return dateB.getFullYear() - dateA.getFullYear();
        }

        throw new Error('Invalid group type');
    }

    getGroupStart(date, groupType) {
        assert.isDate(date);
        assert(availGroupTypes.includes(groupType), 'Invalid group type');

        const year = date.getFullYear();
        const month = date.getMonth();
        const monthDay = date.getDate();
        let timestamp = 0;

        if (groupType === 'day') {
            timestamp = Date.UTC(year, month, monthDay);
        }
        if (groupType === 'week') {
            let weekday = date.getDay();
            weekday = (weekday === 0) ? 6 : (weekday - 1);
            timestamp = Date.UTC(year, month, monthDay - weekday);
        }
        if (groupType === 'month') {
            timestamp = Date.UTC(year, month, 1);
        }
        if (groupType === 'year') {
            timestamp = Date.UTC(year, 0, 1);
        }

        return new Date(timestamp);
    }

    getNextDate(date, groupType) {
        assert.isDate(date);
        assert(availGroupTypes.includes(groupType), 'Invalid group type');

        let timestamp = 0;
        if (groupType === 'day') {
            timestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        }
        if (groupType === 'week') {
            timestamp = Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + DAYS_IN_WEEK,
            );
        }
        if (groupType === 'month') {
            timestamp = Date.UTC(date.getFullYear(), date.getMonth() + 1, 1);
        }
        if (groupType === 'year') {
            timestamp = Date.UTC(date.getFullYear() + 1, 0, 1);
        }

        return new Date(timestamp);
    }

    getLimitStartDate(endDate, limit, groupType) {
        assert.isDate(endDate);
        assert(availGroupTypes.includes(groupType), 'Invalid group type');

        let timestamp = 0;
        if (groupType === 'day') {
            timestamp = Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate() - limit,
            );
        }
        if (groupType === 'week') {
            timestamp = Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate() - (DAYS_IN_WEEK * limit),
            );
        }
        if (groupType === 'month') {
            timestamp = Date.UTC(endDate.getFullYear(), endDate.getMonth() - limit, 1);
        }
        if (groupType === 'year') {
            timestamp = Date.UTC(endDate.getFullYear() - limit, 0, 1);
        }

        return new Date(timestamp);
    }

    getStatisticsLabel(date) {
        return dateToSeconds(date);
    }

    getStatistics(params) {
        const report = params?.report ?? defaultReportType;
        const amountArr = {};
        let groupArr = [];
        let sumDate = null;
        let curDate = null;
        let groupStart = null;
        const curSum = {};
        let currId = params.curr_id;
        const accountId = asArray(params.accounts);
        const categoryId = asArray(params.categories);
        const categoryGroups = [];

        const res = {
            values: [],
            series: [],
        };

        const categories = [];
        if (report === 'currency') {
            if (!currId) {
                const curr = App.currency.getItemByIndex(0);
                currId = curr?.id;
            }
            if (!currId) {
                return res;
            }
            categories.push(currId);
        } else if (report === 'account') {
            if (accountId.length === 0) {
                return res;
            }

            categories.push(...accountId);
        } else if (report === 'category') {
            if (categoryId.length === 0) {
                const mainCategories = App.state.categories.findByParent();
                const mainIds = mainCategories.map((item) => item.id);
                categoryId.push(0, ...mainIds);
            }

            categories.push(...categoryId);

            categories.forEach((id) => {
                if (id === 0) {
                    categoryGroups.push([0]);
                    return;
                }

                const children = App.state.categories.findByParent(id);
                const childIds = children.map((item) => item.id);
                categoryGroups.push([id, ...childIds]);
            });
        }

        const transType = params.type ?? defaultTransactionType;
        const transTypes = asArray(transType);
        for (const type of transTypes) {
            amountArr[type] = {};
            curSum[type] = {};
            for (const category of categories) {
                amountArr[type][category] = [];
                curSum[type][category] = 0;
            }
        }

        const groupType = params.group ?? defaultGroupType;
        const limit = params.limit ?? 0;

        const itemsFilter = {
            order: 'asc',
            type: transTypes,
        };
        if (accountId.length > 0) {
            itemsFilter.accounts = accountId;
        }
        if (categoryId.length > 0) {
            itemsFilter.categories = categoryId;
        }

        if (params.startDate) {
            itemsFilter.startDate = params.startDate;
        }
        if (params.endDate) {
            itemsFilter.endDate = params.endDate;
        }

        if (limit > 0) {
            const endTime = itemsFilter.endDate ?? new Date();
            itemsFilter.startDate = this.getLimitStartDate(endTime, limit, groupType);
            itemsFilter.endDate = endTime;
        }

        const list = this.applyFilter(itemsFilter);
        list.forEach((item) => {
            if (!transTypes.includes(item.type)) {
                return;
            }

            let category = 0;
            let isSource = true;
            if (report === 'currency') {
                isSource = (item.type === EXPENSE);
                category = (isSource) ? item.src_curr : item.dest_curr;
                if (!categories.includes(category)) {
                    return;
                }
            } else if (report === 'account') {
                if (categories.includes(item.src_id)) {
                    category = item.src_id;
                } else if (categories.includes(item.dest_id)) {
                    category = item.dest_id;
                    isSource = false;
                } else {
                    return;
                }
            } else if (report === 'category') {
                const itemGroup = categoryGroups.find((group) => group.includes(item.category_id));
                if (!itemGroup) {
                    return;
                }

                [category] = itemGroup;
            }

            const time = secondsToTime(item.date);
            const dateInfo = this.getDateInfo(time, groupType);
            const amount = (isSource) ? item.src_amount : item.dest_amount;
            curDate = dateInfo;

            if (!sumDate) {
                sumDate = curDate;
                groupStart = this.getGroupStart(sumDate.date, groupType);
            } else if (sumDate && sumDate.id !== curDate.id) {
                const dateDiff = this.getDateDiff(sumDate, curDate, groupType);
                for (const type of transTypes) {
                    for (const cat of categories) {
                        amountArr[type][cat].push(curSum[type][cat]);
                        curSum[type][cat] = 0;
                        // Append empty values after saved value
                        for (let i = 1; i < dateDiff; i += 1) {
                            amountArr[type][cat].push(0);
                        }
                    }
                }

                groupArr.push(this.getStatisticsLabel(groupStart, groupType));
                // Append series for empty values
                let groupDate = groupStart;
                for (let i = 1; i < dateDiff; i += 1) {
                    groupDate = this.getNextDate(groupDate, groupType);
                    groupArr.push(this.getStatisticsLabel(groupDate, groupType));
                }

                sumDate = curDate;
                groupStart = this.getGroupStart(sumDate.date, groupType);
            }

            curSum[item.type][category] += amount;
        });

        // save remain value
        const valuesRemain = transTypes.some((type) => (
            categories.some((cat) => curSum[type][cat] > 0)
        ));

        if (valuesRemain) {
            for (const type of transTypes) {
                for (const cat of categories) {
                    amountArr[type][cat].push(curSum[type][cat]);
                }
            }

            groupArr.push(this.getStatisticsLabel(groupStart, groupType));
        }

        const dataSets = [];
        Object.keys(amountArr).forEach((type) => {
            const typeCategories = amountArr[type];
            Object.keys(typeCategories).forEach((cat) => {
                dataSets.push({
                    group: parseInt(type, 10),
                    category: parseInt(cat, 10),
                    data: typeCategories[cat],
                });
            });
        });

        if (limit > 0) {
            let amountCount = 0;
            for (const dataSet of dataSets) {
                amountCount = Math.max(amountCount, dataSet.data.length);
            }
            const limitCount = Math.min(amountCount, limit);

            dataSets.forEach((dataSet, index) => {
                dataSets[index].data = dataSet.data.slice(-limitCount);
            });

            groupArr = groupArr.slice(-limitCount);
        }

        return {
            values: dataSets,
            series: groupArr,
        };
    }
}
