import { copyObject, assert, formatDate } from 'jezve-test';
import { convDate, fixDate, getWeek } from '../common.js';
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

export class TransactionsList extends List {
    async fetch() {
        return api.transaction.list();
    }

    setData(data) {
        super.setData(data);

        this.sort();
    }

    clone() {
        const res = new TransactionsList(this.data);
        res.autoincrement = this.autoincrement;

        return res;
    }

    getExpectedPos(params) {
        const pos = this.getLastestPos(params.date);

        return pos + 1;
    }

    getLastestPos(date = null) {
        const cmpDate = convDate(date);
        let checkList;
        if (cmpDate) {
            checkList = this.filter((item) => convDate(item.date) <= cmpDate);
        } else {
            checkList = this.data;
        }
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

    update(id, data) {
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
        let types = Array.isArray(type) ? type : [type];
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

        return new TransactionsList(items);
    }

    getItemsByAccounts(list, ids) {
        assert(ids, 'Invalid account ids specified');

        const accounts = Array.isArray(ids) ? ids : [ids];
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

        return new TransactionsList(items);
    }

    getItemsByDate(list, start, end) {
        if (!start && !end) {
            return list;
        }

        let fStart = fixDate(start);
        let fEnd = fixDate(end);
        if (fStart > fEnd) {
            const tmp = fEnd;
            fEnd = fStart;
            fStart = tmp;
        }

        return list.filter((item) => {
            const date = convDate(item.date);
            if (!date) {
                return false;
            }

            if (fStart && date < fStart) {
                return false;
            }
            if (fEnd && date > fEnd) {
                return false;
            }

            return true;
        });
    }

    filterByDate(start, end) {
        const items = this.getItemsByDate(this.data, start, end);
        if (items === this.data) {
            return this;
        }

        return new TransactionsList(items);
    }

    getItemsByQuery(list, query) {
        if (!query) {
            return list;
        }

        const lcQuery = query.toLowerCase();

        return list.filter((item) => item.comment.toLowerCase().includes(lcQuery));
    }

    filterByQuery(query) {
        const items = this.getItemsByQuery(this.data, query);
        if (items === this.data) {
            return this;
        }

        return new TransactionsList(items);
    }

    getItemsPage(list, num, limit) {
        const pageLimit = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;

        const totalPages = this.getExpectedPages(list, pageLimit);
        assert(num >= 1 && num <= totalPages, `Invalid page number: ${num}`);

        const offset = (num - 1) * pageLimit;

        const res = copyObject(list);

        res.sort((a, b) => a.pos - b.pos);

        return res.slice(offset, Math.min(offset + pageLimit, res.length));
    }

    getPage(num, limit) {
        const items = this.getItemsPage(this.data, num, limit);
        if (items === this.data) {
            return this;
        }

        return new TransactionsList(items);
    }

    getItems(list, par) {
        let res = list;
        const params = par || {};

        const isDesc = params.order?.toLowerCase() === 'desc';
        res = this.sortItems(res, isDesc);

        if ('type' in params) {
            res = this.getItemsByType(res, params.type);
        }
        if ('accounts' in params || 'persons' in params) {
            const filterAccounts = [];
            if ('persons' in params) {
                const personsFilter = Array.isArray(params.persons)
                    ? params.persons
                    : [params.persons];

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
                const accountsFilter = Array.isArray(params.accounts)
                    ? params.accounts
                    : [params.accounts];

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
        const items = this.getItems(this.data, params);
        if (items === this.data) {
            return this;
        }

        const res = new TransactionsList(items);
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

        const res = [];
        for (const trans of list) {
            const convTrans = copyObject(trans);

            if (convTrans.src_id === account.id) {
                convTrans.src_curr = account.curr_id;
                if (convTrans.dest_curr === account.curr_id) {
                    convTrans.src_amount = convTrans.dest_amount;
                }
            }
            if (convTrans.dest_id === account.id) {
                convTrans.dest_curr = account.curr_id;
                if (convTrans.src_curr === account.curr_id) {
                    convTrans.dest_amount = convTrans.src_amount;
                }
            }

            res.push(convTrans);
        }

        return res;
    }

    // Return expected list of transactions after update specified account
    updateAccount(accList, account) {
        const res = this.onUpdateAccount(this.data, accList, account);

        return new TransactionsList(res);
    }

    /** Return expected list of transactions after delete specified accounts */
    onDeleteAccounts(list, accList, ids) {
        const res = [];

        const itemIds = Array.isArray(ids) ? ids : [ids];
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

        return new TransactionsList(res);
    }

    getStatisticsLabel(date, groupType) {
        if (!date) {
            return null;
        }

        if (groupType === 'none' || groupType === 'day' || groupType === 'week') {
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
        let amountArr = [];
        let groupArr = [];
        let sumDate = null;
        let curDate = null;
        let prevDate = null;
        const curSum = [];
        let itemsInGroup = 0;
        let transDate = null;
        let currId = params.curr_id;
        let accId = params.acc_id;

        const byCurrency = params.report === 'currency';
        if (byCurrency) {
            if (!currId) {
                const curr = App.currency.getItemByIndex(0);
                currId = curr?.id;
            }
            if (!currId) {
                return null;
            }
        } else {
            if (!accId) {
                const [account] = App.state.getAccountsByIndexes(0);
                accId = account.id;
            }
            if (!accId) {
                return null;
            }
        }

        const transType = params.type ?? [EXPENSE];
        if (!transType) {
            return null;
        }
        const transTypes = Array.isArray(transType) ? transType : [transType];
        for (const type of transTypes) {
            amountArr[type] = [];
            curSum[type] = 0;
        }

        const groupType = params.group ?? 'none';
        const limit = params.limit ?? 0;

        const itemsFilter = {
            order: 'asc',
            type: transTypes,
        };
        if (accId) {
            itemsFilter.accounts = accId;
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

            if (byCurrency) {
                const transCurr = (item.type === EXPENSE) ? item.src_curr : item.dest_curr;
                if (transCurr !== currId) {
                    return;
                }
            } else {
                const transAcc = (item.type === EXPENSE) ? item.src_id : item.dest_id;
                if (transAcc !== accId) {
                    return;
                }
            }

            const time = convDate(item.date);
            transDate = new Date(time);
            itemsInGroup += 1;

            if (groupType === 'none') {
                if (item.type === EXPENSE) {
                    amountArr[item.type].push(item.src_amount);
                } else {
                    amountArr[item.type].push(item.dest_amount);
                }

                if (prevDate == null || prevDate !== transDate.getDate()) {
                    groupArr.push([formatDate(transDate), itemsInGroup]);
                    itemsInGroup = 0;
                }
                prevDate = transDate.getDate();
            } else if (groupType === 'day') {
                curDate = transDate.getDate();
            } else if (groupType === 'week') {
                curDate = getWeek(time);
            } else if (groupType === 'month') {
                curDate = transDate.getMonth();
            } else if (groupType === 'year') {
                curDate = transDate.getFullYear();
            }

            if (sumDate == null) {
                sumDate = curDate;
            } else if (sumDate != null && sumDate !== curDate) {
                sumDate = curDate;
                for (const type of transTypes) {
                    amountArr[type].push(curSum[type]);
                    curSum[type] = 0;
                }

                const label = this.getStatisticsLabel(transDate, groupType);
                groupArr.push([label, 1]);
            }

            if (item.type === EXPENSE) {
                curSum[item.type] += item.src_amount;
            } else {
                curSum[item.type] += item.dest_amount;
            }
        });

        // save remain value
        if (groupType !== 'none' && list.length > 0) {
            if (sumDate != null && sumDate !== curDate) {
                for (const type of transTypes) {
                    amountArr[type].push(curSum[type]);
                    curSum[type] = 0;
                }

                const label = this.getStatisticsLabel(transDate, groupType);
                groupArr.push([label, 1]);
            } else {
                for (const type of transTypes) {
                    const { length } = amountArr[type];
                    if (length === 0) {
                        amountArr[type].push(curSum[type]);
                    } else {
                        amountArr[type][length - 1] += curSum[type];
                    }
                }

                if (groupArr.length === 0) {
                    const label = this.getStatisticsLabel(transDate, groupType);
                    groupArr.push([label, 1]);
                }
            }
        }

        if (limit > 0) {
            let amountCount = 0;
            for (const type of transTypes) {
                amountCount = Math.max(amountCount, amountArr[type].length);
            }

            const limitCount = Math.min(amountCount, limit);

            const trimAmounts = [];
            for (const type of transTypes) {
                trimAmounts[type] = amountArr[type].slice(-limitCount);
            }
            amountArr = trimAmounts;

            let newGroupsCount = 0;
            let groupLimit = 0;
            let i = groupArr.length - 1;
            while (i >= 0 && groupLimit < limitCount) {
                groupLimit += groupArr[i][1];
                newGroupsCount += 1;
                i -= 1;
            }

            groupArr = groupArr.slice(-newGroupsCount);
        }

        let resultValues = [];
        for (const type of transTypes) {
            resultValues.push({ data: amountArr[type] });
        }
        if (transTypes.length === 1) {
            resultValues = resultValues[0].data;
        }

        return {
            values: resultValues,
            series: groupArr,
        };
    }
}
