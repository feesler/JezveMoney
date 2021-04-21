import {
    copyObject,
    convDate,
    fixDate,
} from '../common.js';
import { App } from '../app.js';
import { api } from './api.js';
import { List } from './list.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    availTransTypes,
} from './transaction.js';
import { AccountsList } from './accountslist.js';

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
        if (ind === -1) {
            throw new Error(`Transaction ${itemId} not found`);
        }

        return this.updatePos(ind, pos);
    }

    updatePos(ind, pos) {
        if (ind < 0 || ind >= this.length) {
            throw new Error(`Wrong transaction index: ${ind}`);
        }

        const trObj = this.data[ind];
        if (!trObj) {
            throw new Error('Transaction not found');
        }

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
        if (!(accountsList instanceof AccountsList)) {
            throw new Error('Invalid accounts list specified');
        }

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
        if (!ids) {
            throw new Error('Invalid account ids specified');
        }

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
        if (num < 1 || num > totalPages) {
            throw new Error(`Invalid page number: ${num}`);
        }

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

        if ('order' in params && typeof params.order === 'string') {
            const lorder = params.order.toLowerCase();
            if (lorder === 'asc') {
                res = this.sortItems(res, false);
            } else if (lorder === 'desc') {
                res = this.sortItems(res, true);
            }
        }
        if ('type' in params) {
            res = this.getItemsByType(res, params.type);
        }
        if ('accounts' in params) {
            res = this.getItemsByAccounts(res, params.accounts);
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

        return new TransactionsList(items);
    }

    sortItems(list, desc = false) {
        if (!Array.isArray(list)) {
            throw new Error('Invalid list specified');
        }

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
        if (!origAcc) {
            throw new Error('Specified account not found in the original list');
        }

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
}
