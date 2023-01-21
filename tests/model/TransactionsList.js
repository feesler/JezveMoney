import {
    copyObject,
    assert,
    formatDate,
    asArray,
} from 'jezve-test';
import {
    cutDate,
    getWeek,
    MS_IN_SECOND,
} from '../common.js';
import { App } from '../Application.js';
import { api } from './api.js';
import { List } from './List.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    availTransTypes,
} from './Transaction.js';
import { AccountsList } from './AccountsList.js';

const WEEKS_IN_YEAR = 52;
const MONTHS_IN_YEAR = 12;
const DAYS_IN_WEEK = 7;
const MS_IN_DAY = 86400000;

const availGroupTypes = ['day', 'week', 'month', 'year'];

const defaultReportType = 'category';
const defaultTransactionType = EXPENSE;
const defaultGroupType = 'week';

export class TransactionsList extends List {
    async fetch() {
        return api.transaction.list();
    }

    setData(data) {
        super.setData(data);

        this.sort();
    }

    getExpectedPos(params) {
        const pos = this.getLastestPos(params.date);

        return pos + 1;
    }

    getLastestPos(date = null) {
        if (date) {
            assert.isInteger(date, `Invalid date timestamp: ${date}`);
        }

        const checkList = (date) ? this.filter((item) => item.date <= date) : this.data;
        const res = checkList.reduce((r, item) => Math.max(r, (item.pos) ? item.pos : 0), 0);

        return res;
    }

    updatePosById(itemId, pos) {
        const ind = this.getIndexById(itemId);
        assert(ind !== -1, `Transaction ${itemId} not found`);

        return this.updatePos(ind, pos);
    }

    updatePos(ind, pos) {
        assert(ind >= 0 && ind < this.length, `Wrong transaction index: ${ind}`);

        const trObj = this.data[ind];
        assert(trObj, 'Transaction not found');

        const oldPos = trObj.pos;
        if (oldPos === pos) {
            return;
        }

        if (this.find((item) => item.pos === pos)) {
            for (const item of this.data) {
                if (oldPos === 0) { // insert with specified position
                    if (item.pos >= pos) {
                        item.pos += 1;
                    }
                } else if (pos < oldPos) { // moving up
                    if (item.pos >= pos && item.pos < oldPos) {
                        item.pos += 1;
                    }
                } else if (pos > oldPos) { // moving down
                    if (item.pos > oldPos && item.pos <= pos) {
                        item.pos -= 1;
                    }
                }
            }
        }

        trObj.pos = pos;
    }

    create(data) {
        const item = data;
        item.pos = 0;

        const ind = super.create(item);
        const transObj = this.data[ind];
        const expPos = this.getExpectedPos(transObj);
        this.updatePos(ind, expPos);

        this.sort();

        return this.getIndexById(transObj.id);
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
            this.updatePosById(transObj.id, newPos);

            this.sort();
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

    setPos(id, pos) {
        this.updatePosById(id, pos);
        this.sort();

        return true;
    }

    updateResults(accountsList) {
        assert.instanceOf(accountsList, AccountsList, 'Invalid accounts list specified');

        const accounts = accountsList.toInitial();
        const list = this.sortAsc();

        for (const trans of list) {
            accounts.data = AccountsList.applyTransaction(accounts.data, trans);

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
    }

    // Filter list of transactions by specified types
    // Empty array, zero or undefined assumed filter is set as ALL
    getItemsByType(list, type) {
        let types = asArray(type);
        types = types.filter((item) => availTransTypes.includes(item));
        if (!types.length) {
            return list;
        }

        return list.filter((item) => types.includes(item.type));
    }

    filterByType(type) {
        const items = this.getItemsByType(this.data, type);
        if (items === this.data) {
            return this;
        }

        return TransactionsList.create(items);
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
        const items = this.getItemsByAccounts(this.data, ids);
        if (items === this.data) {
            return this;
        }

        return TransactionsList.create(items);
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
        const items = this.getItemsByCategories(this.data, ids);
        if (items === this.data) {
            return this;
        }

        return TransactionsList.create(items);
    }

    getItemsByDate(list, start, end) {
        if (!start && !end) {
            return list;
        }

        assert.isInteger(start, `Invalid start date timestamp: ${start}`);
        assert.isInteger(end, `Invalid start date timestamp: ${end}`);

        let fStart = start;
        let fEnd = end;
        if (fStart > fEnd) {
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
        const items = this.getItemsByDate(this.data, start, end);
        if (items === this.data) {
            return this;
        }

        return TransactionsList.create(items);
    }

    getItemsByQuery(list, query) {
        if (!query) {
            return list;
        }

        const lcQuery = query.toLowerCase().trim();

        return list.filter((item) => item.comment.toLowerCase().includes(lcQuery));
    }

    filterByQuery(query) {
        const items = this.getItemsByQuery(this.data, query);
        if (items === this.data) {
            return this;
        }

        return TransactionsList.create(items);
    }

    getItemsPage(list, num, limit, range) {
        const onPage = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;
        const pagesRange = (typeof range !== 'undefined') ? range : 1;

        const totalPages = this.getExpectedPages(list, onPage);
        assert(num >= 1 && num <= totalPages, `Invalid page number: ${num}`);

        const offset = (num - 1) * onPage;

        const res = copyObject(list);

        res.sort((a, b) => a.pos - b.pos);

        return res.slice(offset, Math.min(offset + onPage * pagesRange, res.length));
    }

    getPage(num, limit, range) {
        const items = this.getItemsPage(this.data, num, limit, range);
        if (items === this.data) {
            return this;
        }

        return TransactionsList.create(items);
    }

    filterItems(list, par) {
        let res = list;
        const params = par || {};

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
        if ('startDate' in params && 'endDate' in params) {
            res = this.getItemsByDate(res, params.startDate, params.endDate);
        }
        if ('search' in params) {
            res = this.getItemsByQuery(res, params.search);
        }

        return res;
    }

    applyFilter(params) {
        const items = this.filterItems(this.data, params);
        if (items === this.data) {
            return this;
        }

        const res = TransactionsList.create(items);
        // Sort again if asc order was requested
        // TODO: think how to avoid automatic sort at setData()
        const isDesc = params.order?.toLowerCase() === 'desc';
        if (!isDesc) {
            res.data = res.sortAsc();
        }

        return res;
    }

    sortItems(list, desc = false) {
        assert.isArray(list, 'Invalid list specified');

        const res = copyObject(list);

        if (desc) {
            return res.sort((a, b) => b.pos - a.pos);
        }

        return res.sort((a, b) => a.pos - b.pos);
    }

    sort() {
        this.data = this.sortItems(this.data, true);
    }

    sortAsc() {
        return this.sortItems(this.data);
    }

    sortDesc() {
        return this.sortItems(this.data, true);
    }

    getExpectedPages(list, limit) {
        const onPage = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;

        return Math.max(Math.ceil(list.length / onPage), 1);
    }

    expectedPages(limit) {
        return this.getExpectedPages(this.data, limit);
    }

    // Return expected list of transactions after update specified account
    onUpdateAccount(list, accList, account) {
        const origAcc = accList.find((item) => item.id === account.id);
        assert(origAcc, 'Specified account not found in the original list');

        if (origAcc.curr_id === account.curr_id) {
            return list;
        }

        return list.map((item) => {
            const res = { ...item };

            if (res.src_id === account.id) {
                res.src_curr = account.curr_id;
                if (res.dest_curr === account.curr_id) {
                    res.src_amount = res.dest_amount;
                }
            }
            if (res.dest_id === account.id) {
                res.dest_curr = account.curr_id;
                if (res.src_curr === account.curr_id) {
                    res.dest_amount = res.src_amount;
                }
            }

            return res;
        });
    }

    // Return expected list of transactions after update specified account
    updateAccount(accList, account) {
        const res = this.onUpdateAccount(this.data, accList, account);

        return TransactionsList.create(res);
    }

    /** Return expected list of transactions after delete specified accounts */
    onDeleteAccounts(list, accList, ids) {
        const res = [];

        const itemIds = asArray(ids);
        for (const trans of list) {
            const srcRemoved = itemIds.includes(trans.src_id);
            const destRemoved = itemIds.includes(trans.dest_id);

            if (trans.type === EXPENSE && srcRemoved) {
                continue;
            }
            if (trans.type === INCOME && destRemoved) {
                continue;
            }
            if ((trans.type === TRANSFER || trans.type === DEBT)
                && srcRemoved && destRemoved) {
                continue;
            }
            if (trans.type === DEBT && srcRemoved && trans.dest_id === 0) {
                continue;
            }
            if (trans.type === DEBT && destRemoved && trans.src_id === 0) {
                continue;
            }

            const convTrans = copyObject(trans);
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

    deleteAccounts(accList, ids) {
        const res = this.onDeleteAccounts(this.data, accList, ids);

        return TransactionsList.create(res);
    }

    /** Return expected list of transactions after delete specified categories */
    onDeleteCategories(list, ids) {
        const itemIds = asArray(ids);
        return list.map((item) => (
            (item.category_id && itemIds.includes(item.category_id))
                ? { ...item, category_id: 0 }
                : item
        ));
    }

    deleteCategories(ids) {
        const res = this.onDeleteCategories(this.data, ids);

        return TransactionsList.create(res);
    }

    getDateInfo(time, groupType) {
        const date = new Date(time);
        const res = { time, date };

        if (groupType === 'day') {
            res.id = formatDate(date);
        } else if (groupType === 'week') {
            const week = getWeek(time);
            const year = date.getFullYear();
            res.id = `${week}.${year}`;
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
            return (
                (dateB.getFullYear() - dateA.getFullYear()) * WEEKS_IN_YEAR
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

    getStatisticsLabel(date, groupType) {
        if (!date) {
            return null;
        }

        if (groupType === 'day' || groupType === 'week') {
            return formatDate(date);
        }

        if (groupType === 'month') {
            const month = date.getMonth() + 1;
            const monthStr = (month < 10) ? `0${month}` : month;
            const yearStr = date.getFullYear();

            return `${monthStr}.${yearStr}`;
        }

        if (groupType === 'year') {
            return date.getFullYear().toString();
        }

        return null;
    }

    getStatistics(params) {
        const report = params?.report ?? defaultReportType;
        const amountArr = {};
        let groupArr = [];
        let sumDate = null;
        let curDate = null;
        const curSum = {};
        let currId = params.curr_id;
        const accId = asArray(params.acc_id);
        const categoryId = asArray(params.category_id);
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
            if (accId.length === 0) {
                return res;
            }

            categories.push(...accId);
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
        if (accId.length > 0) {
            itemsFilter.accounts = accId;
        }
        if (categoryId.length > 0) {
            itemsFilter.categories = categoryId;
        }
        if (params.startDate && params.endDate) {
            itemsFilter.startDate = params.startDate;
            itemsFilter.endDate = params.endDate;
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

            const time = item.date * MS_IN_SECOND;
            const dateInfo = this.getDateInfo(time, groupType);
            const amount = (isSource) ? item.src_amount : item.dest_amount;
            curDate = dateInfo;

            if (!sumDate) {
                sumDate = curDate;
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

                let label = this.getStatisticsLabel(sumDate.date, groupType);
                groupArr.push([label, 1]);
                // Append series for empty values
                let groupDate = sumDate.date;
                for (let i = 1; i < dateDiff; i += 1) {
                    groupDate = this.getNextDate(groupDate, groupType);
                    label = this.getStatisticsLabel(groupDate, groupType);
                    groupArr.push([label, 1]);
                }

                sumDate = curDate;
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

            const label = this.getStatisticsLabel(sumDate.date, groupType);
            groupArr.push([label, 1]);
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

            let newGroupsCount = 0;
            let groupLimit = 0;
            let firstSerieSize = 0;
            let i = groupArr.length - 1;
            while (i >= 0 && groupLimit < limitCount) {
                firstSerieSize = limitCount - groupLimit;
                groupLimit += groupArr[i][1];
                newGroupsCount += 1;
                i -= 1;
            }

            groupArr = groupArr.slice(-newGroupsCount);
            groupArr[0][1] = firstSerieSize;
        }

        return {
            values: dataSets,
            series: groupArr,
        };
    }
}
