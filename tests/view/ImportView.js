import {
    assert,
    query,
    closest,
    prop,
    hasAttr,
    click,
    wait,
    waitForFunction,
    copyObject,
    asArray,
    asyncMap,
} from 'jezve-test';
import { DropDown, Checkbox, IconButton } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { ImportList } from './component/Import/ImportList.js';
import { ImportUploadDialog } from './component/Import/ImportUploadDialog.js';
import { ImportRulesDialog } from './component/Import/ImportRulesDialog.js';
import { findSimilarTransaction } from '../model/import.js';
import { App } from '../Application.js';
import { ImportTransaction } from '../model/ImportTransaction.js';
import { ImportTransactionForm } from './component/Import/ImportTransactionForm.js';
import { ImportTransactionItem } from './component/Import/ImportTransactionItem.js';

const ITEMS_ON_PAGE = 20;
const defaultPagination = {
    page: 1,
    pages: 1,
};

const modeButtons = {
    list: 'listModeBtn',
    select: 'selectModeBtn',
    sort: 'sortModeBtn',
};

const menuItems = [
    'createItemBtn',
    'listModeBtn',
    'selectModeBtn',
    'sortModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'enableSelectedBtn',
    'disableSelectedBtn',
    'deleteSelectedBtn',
    'deleteAllBtn',
    'rulesBtn',
];

const contextMenuItems = [
    'ctxEnableBtn', 'ctxUpdateBtn', 'ctxDeleteBtn',
];

/** Import view class */
export class ImportView extends AppView {
    constructor(...args) {
        super(...args);

        this.uploadPopupId = '#fileupload_popup';
        this.rulesPopupId = '#rules_popup';
        this.originalItemData = null;
        this.items = [];
        this.formIndex = -1;
    }

    async parseContent() {
        const res = {
            title: { elem: await query('.content_wrap > .heading > h1') },
            uploadBtn: await IconButton.create(this, await query('#uploadBtn')),
            totalCount: { elem: await query('#trcount') },
            enabledCount: { elem: await query('#entrcount') },
            submitBtn: { elem: await query('#submitbtn') },
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of import view: ${child} component not found`)
        ));

        res.notAvailMsg = { elem: await query('#notavailmsg') };
        const importEnabled = !res.notAvailMsg.elem;

        // Heading
        res.title.value = await prop(res.title.elem, 'textContent');
        res.totalCount.value = await prop(res.totalCount.elem, 'textContent');
        res.enabledCount.value = await prop(res.enabledCount.elem, 'textContent');
        res.submitBtn.disabled = await prop(res.submitBtn.elem, 'disabled');
        res.uploadBtn.content.disabled = await hasAttr(res.uploadBtn.elem, 'disabled');

        // Main account select
        if (importEnabled) {
            res.mainAccountSelect = await DropDown.createFromChild(this, await query('#acc_id'));
            assert(res.mainAccountSelect, 'Invalid structure of import view');
        }

        // List menu
        res.listMenuContainer = {
            elem: await query('#listMenu'),
            menuBtn: await query('#listMenu .popup-menu-btn'),
        };
        res.listMenu = { elem: await query('#listMenu .popup-menu-list') };
        if (res.listMenu.elem) {
            await this.parseMenuItems(res, menuItems);
            res.deleteAllBtn.content.disabled = await hasAttr(res.deleteAllBtn.elem, 'disabled');
        }
        res.rulesCheck = await Checkbox.create(this, await query('#rulesCheck'));
        res.similarCheck = await Checkbox.create(this, await query('#similarCheck'));

        // Import list
        const rowsContainer = await query('#rowsContainer');
        res.renderTime = await prop(rowsContainer, 'dataset.time');
        if (importEnabled) {
            const mainAccountId = res.mainAccountSelect.content.value;
            const listContainer = await query('.data-form');
            res.itemsList = await ImportList.create(this, listContainer, mainAccountId);
            assert(res.itemsList, 'Invalid structure of import view');
        }
        res.submitProgress = { elem: await query('.content_wrap > .loading-indicator') };

        // Context menu
        res.contextMenu = { elem: await query('#contextMenu') };
        const contextParent = await closest(res.contextMenu.elem, '.import-item,.import-form');
        if (contextParent) {
            res.contextMenu.itemIndex = res.itemsList.model.contextMenuIndex;
            assert(res.contextMenu.itemIndex !== -1, 'Invalid context menu');

            await this.parseMenuItems(res, contextMenuItems);
        }

        const uploadDialogPopup = await query(this.uploadPopupId);
        res.uploadDialog = await ImportUploadDialog.create(this, uploadDialogPopup);

        const rulesDialogPopup = await query(this.rulesPopupId);
        res.rulesDialog = await ImportRulesDialog.create(this, rulesDialogPopup);

        return res;
    }

    async parseMenuItems(cont, ids) {
        const itemIds = asArray(ids);
        if (!itemIds.length) {
            return cont;
        }

        const res = cont;
        await asyncMap(itemIds, async (id) => {
            res[id] = await IconButton.create(this, await query(`#${id}`));
            assert(res[id], `Menu item '${id}' not found`);
            return res[id];
        });

        return res;
    }

    async buildModel(cont) {
        const res = {
            enabled: !cont.notAvailMsg.visible,
            menuOpen: cont.listMenu.visible,
            contextItemIndex: cont.contextMenu.itemIndex,
            contextMenuVisible: cont.contextMenu.visible,
        };

        const uploadVisible = !!cont.uploadDialog?.content?.visible;
        const rulesVisible = !!cont.rulesDialog?.content?.visible;
        if (!res.enabled) {
            res.state = 'notavailable';
        } else if (uploadVisible && !rulesVisible) {
            res.state = 'upload';
        } else if (!uploadVisible && rulesVisible) {
            res.state = 'rules';
        } else if (!uploadVisible && !rulesVisible) {
            res.state = 'main';
        } else {
            throw new Error('Invalid state of import view');
        }

        res.title = cont.title.value;
        res.totalCount = (res.enabled) ? parseInt(cont.totalCount.value, 10) : 0;
        res.enabledCount = (res.enabled) ? parseInt(cont.enabledCount.value, 10) : 0;
        res.mainAccount = (res.enabled) ? parseInt(cont.mainAccountSelect.content.value, 10) : 0;
        res.rulesEnabled = (res.enabled) ? cont.rulesCheck.checked : false;
        res.checkSimilarEnabled = (res.enabled) ? cont.similarCheck.checked : false;
        res.renderTime = cont.renderTime;
        res.listMode = (cont.itemsList) ? cont.itemsList.listMode : 'list';
        res.items = (cont.itemsList) ? cont.itemsList.getItems() : [];
        res.pagination = (cont.itemsList)
            ? cont.itemsList.getPagination()
            : { ...defaultPagination };

        res.invalidated = (cont.itemsList) ? cont.itemsList.model.invalidated : false;
        res.submitInProgress = cont.submitProgress.visible;

        return res;
    }

    getExpectedState(model = this.model) {
        const listMode = model.listMode === 'list';
        const selectMode = model.listMode === 'select';
        const showMenuItems = model.enabled && model.menuOpen;
        const showListItems = showMenuItems && listMode;
        const showSelectItems = showMenuItems && selectMode;
        const hasItems = this.items.length > 0;

        const res = {
            notAvailMsg: { visible: !model.enabled },
            listMenuContainer: { visible: model.enabled && hasItems },
            listMenu: { visible: showMenuItems },
            uploadBtn: { visible: model.enabled, disabled: !model.enabled },
            title: { value: model.title.toString(), visible: true },
            totalCount: { value: model.totalCount.toString(), visible: model.enabled },
            enabledCount: { value: model.enabledCount.toString(), visible: model.enabled },
            submitBtn: { visible: model.enabled },
        };

        if (!model.enabled) {
            return res;
        }

        const selectedItems = (selectMode) ? this.items.filter((item) => item.selected) : [];
        const hasEnabled = (selectMode) ? selectedItems.some((item) => item.enabled) : false;
        const hasDisabled = (selectMode) ? selectedItems.some((item) => !item.enabled) : false;

        res.createItemBtn = { visible: showListItems };
        res.listModeBtn = { visible: showMenuItems && !listMode };
        res.selectModeBtn = { visible: showListItems && hasItems };
        res.sortModeBtn = { visible: showListItems && this.items.length > 1 };

        res.selectAllBtn = {
            visible: showSelectItems && selectedItems.length < this.items.length,
        };
        res.deselectAllBtn = { visible: showSelectItems && selectedItems.length > 0 };
        res.enableSelectedBtn = { visible: showMenuItems && hasDisabled };
        res.disableSelectedBtn = { visible: showMenuItems && hasEnabled };
        res.deleteSelectedBtn = { visible: showMenuItems && selectedItems.length > 0 };
        res.deleteAllBtn = { visible: showMenuItems, disabled: !hasItems };

        res.rulesCheck = { checked: model.rulesEnabled, visible: showListItems };
        res.similarCheck = { checked: model.checkSimilarEnabled, visible: showListItems };
        res.rulesBtn = { visible: showListItems };

        res.mainAccountSelect = { value: model.mainAccount.toString(), visible: true };
        res.itemsList = { visible: true };
        res.submitBtn.disabled = !hasItems || !this.items.some((item) => item.enabled);

        if (model.contextMenuVisible) {
            const firstItem = ITEMS_ON_PAGE * (model.pagination.page - 1);
            const absIndex = firstItem + model.contextItemIndex;
            assert.arrayIndex(this.items, absIndex, 'Invalid state');

            const item = this.items[absIndex];
            res.contextMenu = {
                visible: true,
                itemIndex: model.contextItemIndex,
            };

            res.ctxEnableBtn = { visible: true };
            res.ctxUpdateBtn = { visible: !item.isForm };
            res.ctxDeleteBtn = { visible: true };
        }

        return res;
    }

    getExpectedList(model = this.model) {
        const firstItem = ITEMS_ON_PAGE * (model.pagination.page - 1);
        const lastItem = firstItem + ITEMS_ON_PAGE;
        const pageItems = this.items.slice(firstItem, lastItem);

        let relFormIndex = -1;
        if (this.formIndex !== -1) {
            const pos = this.getPositionByIndex(this.formIndex);
            if (pos.page === model.pagination.page) {
                relFormIndex = pos.index;
            }
        }

        return ImportList.render(pageItems, App.state, relFormIndex);
    }

    updateItemsCount(model = this.model) {
        const res = model;

        res.totalCount = this.items.length;
        const enabledItems = this.items.filter((item) => item.enabled);
        res.enabledCount = enabledItems.length;

        return res;
    }

    getPositionByIndex(index) {
        return {
            page: Math.floor(index / ITEMS_ON_PAGE) + 1,
            index: index % ITEMS_ON_PAGE,
        };
    }

    get rulesDialog() {
        return this.content.rulesDialog;
    }

    get uploadDialog() {
        return this.content.uploadDialog;
    }

    get itemsList() {
        return this.content.itemsList;
    }

    get rulesEnabled() {
        return this.model.rulesEnabled;
    }

    get checkSimilarEnabled() {
        return this.model.checkSimilarEnabled;
    }

    isRulesState() {
        return this.model.state === 'rules';
    }

    assertStateId(state) {
        assert(this.model.state === state, `Invalid state of import view: ${this.model.state}. ${state} is expected`);
    }

    assertListMode(listMode) {
        assert(this.model.listMode === listMode, `Invalid list mode: ${this.model.listMode}. ${listMode} is expected`);
    }

    checkMainState() {
        this.assertStateId('main');
    }

    checkListMode() {
        this.assertListMode('list');
    }

    checkSelectMode() {
        this.assertListMode('select');
    }

    checkSortMode() {
        this.assertListMode('sort');
    }

    checkUploadState() {
        this.assertStateId('upload');
    }

    checkRulesState() {
        this.assertStateId('rules');
    }

    checkValidIndex(index) {
        const pos = this.getPositionByIndex(index);
        assert(
            pos.page === this.model.pagination.page,
            `Invalid page ${this.model.pagination.page}, expected: ${pos.page}`,
        );
    }

    async openContextMenu(index) {
        await this.setListMode();

        const pos = this.getPositionByIndex(index);

        this.model.contextMenuVisible = true;
        this.model.contextItemIndex = pos.index;
        const expected = this.getExpectedState();

        const item = this.itemsList.getItem(pos.index);
        await this.performAction(() => item.clickMenu());
        assert(this.content.contextMenu.visible, 'Context menu not visible');

        return this.checkState(expected);
    }

    async openActionsMenu() {
        if (this.model.menuOpen) {
            return true;
        }

        this.model.menuOpen = true;
        this.expectedState = this.getExpectedState();
        await this.performAction(() => click(this.content.listMenuContainer.menuBtn));

        return this.checkState();
    }

    async enableRules(value) {
        this.checkMainState();

        const enable = !!value;
        assert(
            enable !== this.rulesEnabled,
            enable ? 'Already enabled' : 'Already disabled',
        );

        // Apply rules or restore original import data according to enable flag
        // and convert to expected state of ImportTransactionForm component
        const itemsData = this.itemsList.items.map((item) => {
            if (!item.model.original) {
                return item.getExpectedState(item.model);
            }

            if (!enable) {
                let model = item.restoreOriginal();
                if (this.model.mainAccount !== model.mainAccount.id) {
                    model = item.onChangeMainAccount(model, this.model.mainAccount);
                }

                return item.getExpectedState(model);
            }

            const expTrans = item.getExpectedTransaction(item.model);
            const origMainAccount = App.state.accounts.findByName(
                item.model.original.mainAccount,
            );
            const importTrans = new ImportTransaction({
                ...expTrans,
                enabled: item.model.enabled,
                mainAccount: origMainAccount,
                type: item.model.type,
                original: {
                    ...item.model.original,
                    mainAccount: origMainAccount,
                },
            });

            App.state.rules.applyTo(importTrans);

            return (
                (item.model.isForm)
                    ? ImportTransactionForm.render(importTrans, App.state)
                    : ImportTransactionItem.render(importTrans, App.state)
            );
        });

        await this.openActionsMenu();

        this.model.rulesEnabled = !this.model.rulesEnabled;
        this.model.menuOpen = false;
        const expected = this.getExpectedState();
        expected.itemsList.items = itemsData;

        await this.performAction(() => this.content.rulesCheck.toggle());

        return this.checkState(expected);
    }

    async enableCheckSimilar(value) {
        this.checkMainState();

        const enable = !!value;
        assert(
            enable !== this.checkSimilarEnabled,
            enable ? 'Already enabled' : 'Already disabled',
        );

        await this.openActionsMenu();

        const skipList = [];
        this.model.checkSimilarEnabled = enable;
        this.model.menuOpen = false;
        this.items.forEach((item) => {
            if (enable) {
                const tr = findSimilarTransaction(item, skipList);
                if (tr) {
                    skipList.push(tr.id);
                }

                item.setSimilarTransaction(tr);
            } else {
                item.setSimilarTransaction(null);
            }
        });

        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.waitForList(() => this.content.similarCheck.toggle());

        return this.checkState();
    }

    async launchUploadDialog() {
        this.checkMainState();

        this.expectedState = this.getExpectedState();
        this.expectedState.uploadDialog = {
            visible: true,
            initialAccount: { value: this.model.mainAccount.toString() },
        };

        await this.performAction(() => this.content.uploadBtn.click());
        await this.performAction(() => wait(this.uploadPopupId, { visible: true }));

        return this.checkState();
    }

    async closeUploadDialog() {
        this.checkUploadState();

        this.expectedState = this.getExpectedState();
        this.expectedState.uploadDialog = { visible: false };

        await this.performAction(() => this.uploadDialog.close());
        await this.performAction(() => wait(this.uploadPopupId, { hidden: true }));

        return this.checkState();
    }

    async setUploadFile(name, data) {
        this.checkUploadState();

        this.uploadFilename = name;
        this.fileData = data;

        await this.performAction(() => this.uploadDialog.setFile(name));
    }

    async selectUploadTemplateById(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateById(val));

        return this.checkState();
    }

    async selectUploadTemplateByIndex(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateByIndex(val));

        return this.checkState();
    }

    async selectUploadAccount(val) {
        this.checkUploadState();

        this.model.mainAccount = parseInt(val, 10);
        this.expectedState = this.getExpectedState();

        this.items.forEach((item) => item.setMainAccount(val));

        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.uploadDialog.selectAccount(val));

        return this.checkState();
    }

    async selectUploadEncoding(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectEncoding(val));
    }

    /** Select file to upload */
    async upload() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.upload());
    }

    async inputTemplateName(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.inputTemplateName(val));

        return this.checkState();
    }

    async selectTemplateColumn(name, index) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateColumn(name, index));

        return this.checkState();
    }

    async inputTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.inputTemplateFirstRow(val));

        return this.checkState();
    }

    async decreaseTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.decreaseTemplateFirstRow(val));

        return this.checkState();
    }

    async increaseTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.increaseTemplateFirstRow(val));

        return this.checkState();
    }

    async toggleTemplateAccount() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.toggleTemplateAccount());

        return this.checkState();
    }

    async selectTemplateAccountById(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateAccountById(val));

        return this.checkState();
    }

    async selectTemplateAccountByIndex(index) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateAccountByIndex(index));

        return this.checkState();
    }

    /** Create new import template */
    async createTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.createTemplate());

        return this.checkState();
    }

    /** Update currently selected template */
    async updateTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.updateTemplate());

        return this.checkState();
    }

    /** Delete currently selected template */
    async deleteTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.deleteTemplate());

        return this.checkState();
    }

    /** Submit template */
    async submitTemplate() {
        this.checkUploadState();

        const template = this.getExpectedTemplate();
        const updateMainAccount = (
            this.uploadDialog.isValidTemplate()
            && template?.account_id
            && this.model.mainAccount !== template.account_id
        );

        if (updateMainAccount) {
            this.model.mainAccount = template.account_id;
        }
        this.expectedState = this.getExpectedState();
        if (updateMainAccount) {
            this.items.forEach((item) => item.setMainAccount(template.account_id));
        }
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.uploadDialog.submitTemplate());

        return this.checkState();
    }

    /** Cancel create/update template */
    async cancelTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.cancelTemplate());

        return this.checkState();
    }

    /** Run action and wait until list finish to load */
    async waitForList(action) {
        const prevTime = this.model.renderTime;

        await action.call(this);

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.itemsList.model.isLoading
                && prevTime !== this.content.renderTime
            );
        });
    }

    /** Submit converted file data */
    async submitUploaded(importData) {
        this.checkUploadState();

        const expectedUpload = this.uploadDialog.getExpectedUploadResult(importData);
        const isValid = expectedUpload != null;
        if (isValid) {
            const skipList = [];
            expectedUpload.forEach((item) => {
                // Apply rules if enabled
                if (this.rulesEnabled) {
                    App.state.rules.applyTo(item);
                }

                // Disable transactions similar to already existing
                if (this.checkSimilarEnabled) {
                    const tr = findSimilarTransaction(item, skipList);
                    if (tr) {
                        skipList.push(tr.id);
                    }
                    item.setSimilarTransaction(tr);
                }
            });

            // Append uploaded items
            this.items = this.items.concat(expectedUpload);
        }

        const expectedList = this.getExpectedList();
        const pagesCount = Math.ceil(this.items.length / ITEMS_ON_PAGE);
        this.model.pagination.pages = pagesCount;
        this.updateItemsCount();

        this.expectedState = this.getExpectedState();
        this.expectedState.itemsList.items = expectedList.items;
        this.expectedState.uploadDialog = { visible: !isValid };

        if (isValid) {
            await this.waitForList(async () => {
                await this.uploadDialog.submit();
                await wait(this.uploadPopupId, { hidden: true });
            });
        } else {
            await this.performAction(() => this.uploadDialog.submit());
        }

        return this.checkState();
    }

    /** Return current state of upload dialog */
    getUploadState() {
        this.checkUploadState();

        return this.uploadDialog.getCurrentState();
    }

    /** Return expected template object */
    getExpectedTemplate() {
        this.checkUploadState();

        return this.uploadDialog.getExpectedTemplate();
    }

    async selectMainAccount(val) {
        this.checkMainState();

        const accountId = parseInt(val, 10);
        const skipList = [];
        this.items.forEach((_, ind) => {
            const item = App.view.items[ind];

            if (!item.original || !App.view.rulesEnabled) {
                item.setMainAccount(accountId);
                return;
            }

            // Reapply rules
            item.restoreOriginal();
            item.setMainAccount(accountId);
            App.state.rules.applyTo(item);

            const tr = findSimilarTransaction(item, skipList);
            if (tr) {
                skipList.push(tr.id);
            }
            item.setSimilarTransaction(tr);
        });

        this.model.mainAccount = accountId;
        this.model.totalCount = this.items.length;
        const enabledItems = this.items.filter((item) => item.enabled);
        this.model.enabledCount = enabledItems.length;

        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.waitForList(
            () => this.content.mainAccountSelect.selectItem(val),
        );

        return this.checkState();
    }

    checkRulesFormState() {
        this.checkRulesState();
        assert(this.rulesDialog.isFormState(), 'Invalid state');
    }

    checkRulesListState() {
        this.checkRulesState();
        assert(this.rulesDialog.isListState(), 'Invalid state');
    }

    async launchRulesDialog() {
        this.checkMainState();
        await this.openActionsMenu();

        await this.performAction(() => click(this.content.rulesBtn.elem));
        await this.performAction(() => wait(this.rulesPopupId, { visible: true }));

        this.checkRulesListState();

        return true;
    }

    async closeRulesDialog() {
        this.checkRulesState();

        await this.performAction(() => this.rulesDialog.close());
        await this.performAction(() => wait(this.rulesPopupId, { hidden: true }));

        this.checkMainState();

        return true;
    }

    async inputRulesSearch(value) {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.inputSearch(value));
        return true;
    }

    async clearRulesSearch() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.clearSearch());
        return true;
    }

    async iterateRulesList() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.iteratePages());
        return true;
    }

    async createRule() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.createRule());
        return true;
    }

    async updateRule(index) {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.updateRule(index));

        this.expectedState = this.getExpectedState();
        return this.checkState();
    }

    async deleteRule(index) {
        this.checkRulesListState();

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.rulesDialog.deleteRule(index));

        return this.checkState();
    }

    async addRuleCondition() {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        await this.performAction(() => ruleForm.addCondition());

        this.expectedState = this.getExpectedState();
        return this.checkState();
    }

    async deleteRuleCondition(index) {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        await this.performAction(() => ruleForm.deleteCondition(index));

        this.expectedState = this.getExpectedState();
        return this.checkState();
    }

    async runOnRuleCondition(index, action) {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        await this.performAction(() => ruleForm.runOnCondition(index, action));

        return true;
    }

    getRuleConditions() {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        return copyObject(ruleForm.model.conditions);
    }

    getRuleActions() {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        return copyObject(ruleForm.model.actions);
    }

    async addRuleAction() {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        await this.performAction(() => ruleForm.addAction());

        this.expectedState = this.getExpectedState();
        return this.checkState();
    }

    async deleteRuleAction(index) {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        await this.performAction(() => ruleForm.deleteAction(index));

        this.expectedState = this.getExpectedState();
        return this.checkState();
    }

    async runOnRuleAction(index, action) {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        await this.performAction(() => ruleForm.runOnAction(index, action));

        return true;
    }

    isValidRule() {
        this.checkRulesFormState();

        return this.rulesDialog.isValidRule();
    }

    async submitRule() {
        this.checkRulesFormState();

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.rulesDialog.submitRule());

        return this.checkState();
    }

    async cancelRule() {
        this.checkRulesFormState();

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.rulesDialog.cancelRule());

        return this.checkState();
    }

    getRulesState() {
        this.checkRulesState();

        return this.rulesDialog.getState();
    }

    /** Return expected import rule object */
    getExpectedRule() {
        this.checkRulesState();

        return this.rulesDialog.getExpectedRule();
    }

    /**
     * Validate current form if active
     * If invalid form expected, then run action and check expected state
     * @param {Function} action
     * @returns form validation result
     */
    async validateSaveForm(action) {
        if (this.formIndex === -1) {
            return true;
        }

        const formItem = this.items[this.formIndex];
        const expectedTransaction = formItem.getExpectedTransaction();
        const isValid = App.state.checkTransactionCorrectness(expectedTransaction);
        if (isValid) {
            return true;
        }

        this.model.invalidated = true;
        this.model.menuOpen = false;

        const formPos = this.getPositionByIndex(this.formIndex);
        this.model.pagination.page = formPos.page;

        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await action();

        this.checkState();

        return false;
    }

    async addItem() {
        this.checkMainState();
        await this.openActionsMenu();

        const addAction = () => this.performAction(() => this.content.createItemBtn.click());
        const isValid = await this.validateSaveForm(addAction);
        if (!isValid) {
            return true;
        }

        const mainAccount = App.state.accounts.getItem(this.model.mainAccount);

        if (this.formIndex !== -1) {
            const currentForm = this.items[this.formIndex];
            currentForm.isForm = false;
        }

        this.model.menuOpen = false;

        const newItem = new ImportTransaction({
            enabled: true,
            isForm: true,
            mainAccount,
            type: 'expense',
            src_id: mainAccount.id,
            dest_id: 0,
            src_curr: mainAccount.curr_id,
            dest_curr: mainAccount.curr_id,
            src_amount: '',
            dest_amount: '',
            date: App.dates.now,
            comment: '',
        });
        this.formIndex = this.items.length;
        this.items.push(newItem);
        this.updateItemsCount();

        const pagesCount = Math.ceil(this.items.length / ITEMS_ON_PAGE);
        this.model.pagination.pages = pagesCount;
        this.model.pagination.page = pagesCount;

        const firstItem = ITEMS_ON_PAGE * (this.model.pagination.page - 1);
        const lastItem = firstItem + ITEMS_ON_PAGE;
        const pageItems = this.items.slice(firstItem, lastItem);

        const relIndex = this.formIndex - firstItem;
        const expectedItems = ImportList.render(pageItems, App.state, relIndex);

        this.expectedState = this.getExpectedState();
        this.expectedState.itemsList.items = expectedItems.items;
        this.expectedState.submitBtn.disabled = false;
        this.originalItemData = null;

        await addAction();

        return this.checkState();
    }

    async updateItemByPos(pos) {
        this.checkMainState();
        this.checkValidIndex(pos);

        const item = this.items[pos];
        if (item.isForm) {
            return true;
        }

        const updateAction = () => this.performAction(() => this.content.ctxUpdateBtn.click());

        await this.openContextMenu(pos);
        const isValid = await this.validateSaveForm(updateAction);
        if (!isValid) {
            return true;
        }

        if (this.formIndex !== -1) {
            const currentForm = this.items[this.formIndex];
            currentForm.isForm = false;
        }

        const newForm = this.items[pos];
        this.originalItemData = new ImportTransaction(newForm);

        newForm.isForm = true;
        this.formIndex = pos;
        this.model.contextMenuVisible = false;
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;

        await updateAction();

        return this.checkState(expected);
    }

    async saveItem() {
        this.checkMainState();

        const { formIndex } = this;
        assert(formIndex !== -1, 'Invalid state: import transaction form not available');
        this.checkValidIndex(formIndex);

        const saveAction = () => this.runItemAction(formIndex, { action: 'clickSave' });

        const isValid = await this.validateSaveForm(saveAction);
        if (!isValid) {
            return true;
        }

        const currentForm = this.items[this.formIndex];
        currentForm.isForm = false;
        this.formIndex = -1;

        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await saveAction();

        return this.checkState();
    }

    async cancelItem() {
        this.checkMainState();

        const { formIndex } = this;
        assert(formIndex !== -1, 'Invalid state: import transaction form not available');
        this.checkValidIndex(formIndex);

        const cancelAction = () => this.runItemAction(formIndex, { action: 'clickCancel' });

        const isValid = await this.validateSaveForm(cancelAction);
        if (!isValid) {
            return true;
        }

        if (this.originalItemData) {
            const transaction = new ImportTransaction(this.originalItemData);
            this.items[this.formIndex] = transaction;
        } else {
            this.items.splice(this.formIndex, 1);
        }
        this.formIndex = -1;
        this.updateItemsCount();

        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;
        this.originalItemData = null;

        await cancelAction();

        return this.checkState();
    }

    async changeListMode(listMode) {
        this.checkMainState();

        if (this.model.listMode === listMode) {
            return true;
        }

        assert(
            this.model.listMode === 'list' || listMode === 'list',
            `Can't change list mode from ${this.model.listMode} to ${listMode}.`,
        );

        await this.openActionsMenu();

        this.model.menuOpen = false;
        this.model.listMode = listMode;
        this.expectedState = this.getExpectedState();

        const buttonName = modeButtons[listMode];
        const button = this.content[buttonName];
        assert(button, `Button ${buttonName} not found`);

        await this.performAction(() => button.click());

        return this.checkState();
    }

    async setListMode() {
        return this.changeListMode('list');
    }

    async setSelectMode() {
        return this.changeListMode('select');
    }

    async setSortMode() {
        return this.changeListMode('sort');
    }

    async toggleSelectItems(index) {
        await this.setSelectMode();

        const indexes = asArray(index);
        assert(indexes.length > 0, 'No items specified');
        assert(this.itemsList, 'No items available');

        indexes.forEach((ind) => {
            const item = this.items[ind];
            item.selected = !item.selected;
        });

        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        for (const ind of indexes) {
            await this.performAction(async () => {
                const item = this.itemsList.getItem(ind);
                await item.toggleSelect();
            });
        }

        return this.checkState();
    }

    async selectAllItems() {
        assert(this.itemsList, 'No items available');

        await this.setSelectMode();
        await this.openActionsMenu();

        this.items.forEach((_, ind) => {
            const item = this.items[ind];
            item.selected = true;
        });

        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.content.selectAllBtn.click());

        return this.checkState();
    }

    async deselectAllItems() {
        assert(this.itemsList, 'No items available');

        await this.setSelectMode();
        await this.openActionsMenu();

        this.items.forEach((_, ind) => {
            const item = this.items[ind];
            item.selected = false;
        });

        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.content.deselectAllBtn.click());

        return this.checkState();
    }

    async enableSelectedItems(value) {
        assert(this.itemsList, 'No items available');
        this.checkSelectMode();

        await this.openActionsMenu();
        const enable = !!value;
        const button = (enable) ? this.content.enableSelectedBtn : this.content.disableSelectedBtn;

        this.items.forEach((_, ind) => {
            const item = this.items[ind];
            if (item.selected) {
                item.enabled = enable;
            }
        });

        this.updateItemsCount();
        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => button.click());

        return this.checkState();
    }

    async enableItems(index, value) {
        this.checkMainState();
        this.checkListMode();

        const indexes = asArray(index);
        assert(indexes.length > 0, 'No items specified');
        const enable = !!value;

        assert(this.itemsList, 'No items available');

        indexes.forEach((ind) => {
            const item = this.items[ind];
            assert(item.enabled !== enable, `Item ${ind} already ${enable ? 'enabled' : 'disabled'}`);
            item.enabled = enable;
        });

        this.updateItemsCount();
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;

        for (const ind of indexes) {
            await this.openContextMenu(ind);
            await this.performAction(() => this.content.ctxEnableBtn.click());
        }

        return this.checkState(expected);
    }

    async runItemAction(index, { action, data }) {
        this.checkMainState();
        this.checkValidIndex(index);

        const position = this.getPositionByIndex(index);
        const item = this.itemsList.getItem(position.index);

        await this.performAction(() => item.runAction(action, data));

        const updatedItem = this.itemsList.getItem(position.index);
        const itemData = this.itemsList.getItemData(updatedItem);
        itemData.type = itemData.importType;
        delete itemData.importType;
        itemData.isForm = updatedItem.model.isForm;

        if (itemData.original) {
            const origMainAccount = App.state.accounts.findByName(
                updatedItem.model.original.mainAccount,
            );
            itemData.original.mainAccount = origMainAccount;
        }

        this.items[index] = new ImportTransaction(itemData);

        return true;
    }

    async deleteItem(index) {
        this.checkMainState();
        this.checkListMode();

        const items = asArray(index);
        assert(items.length > 0, 'No items specified');
        items.sort();
        if (items.includes(this.formIndex)) {
            this.originalItemData = null;
        }

        let removed = 0;
        for (const ind of items) {
            await this.openContextMenu(ind - removed);
            await this.performAction(() => this.content.ctxDeleteBtn.click());

            this.items.splice(ind - removed, 1);

            removed += 1;
        }

        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        return this.checkState();
    }

    async deleteSelectedItems() {
        assert(this.itemsList, 'No items available');
        this.checkSelectMode();

        await this.openActionsMenu();

        const selectedIndexes = [];
        this.items.forEach((item, ind) => {
            if (item.selected) {
                selectedIndexes.push(ind);
            }
        });
        assert(selectedIndexes.length > 0, 'Not items selected');

        let removed = 0;
        selectedIndexes.forEach((ind) => {
            this.items.splice(ind - removed, 1);
            removed += 1;
        });

        if (this.items.length === 0) {
            this.model.listMode = 'list';
        }
        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.content.deleteSelectedBtn.click());

        return this.checkState();
    }

    async deleteAllItems() {
        this.checkMainState();
        await this.openActionsMenu();

        this.items = [];
        this.formIndex = -1;
        this.originalItemData = null;
        this.model.listMode = 'list';
        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.deleteAllBtn.click());

        return this.checkState();
    }

    async submit() {
        this.checkMainState();

        const enabledItems = this.items.filter((item) => item.enabled);
        const disabled = await prop(this.content.submitBtn.elem, 'disabled');
        assert(disabled === (enabledItems.length === 0), 'Submit is not available');
        if (disabled) {
            return true;
        }

        const submitAction = () => this.performAction(() => click(this.content.submitBtn.elem));
        const isValid = await this.validateSaveForm(submitAction);
        if (!isValid) {
            return true;
        }

        enabledItems.forEach((item) => {
            const expectedTransaction = item.getExpectedTransaction();
            const createRes = App.state.createTransaction(expectedTransaction);
            assert(createRes, 'Failed to create transaction');
        });

        await submitAction();

        await waitForFunction(async () => {
            await this.parse();

            if (this.model.invalidated) {
                return true;
            }

            const notification = this.content.msgPopup?.content?.visible;
            if (notification && !this.model.submitInProgress) {
                return true;
            }

            return false;
        });

        this.expectedState = {
            msgPopup: {
                success: true,
                message: 'All transactions have been successfully imported',
            },
            itemsList: { items: [] },
        };

        this.items = [];
        this.formIndex = -1;
        this.originalItemData = null;

        await this.checkState();
        await this.closeNotification();
        return true;
    }

    isFirstPage() {
        this.checkMainState();

        return !this.itemsList.paginator || this.itemsList.paginator.isFirstPage();
    }

    isLastPage() {
        this.checkMainState();

        return !this.itemsList.paginator || this.itemsList.paginator.isLastPage();
    }

    async goToFirstPage() {
        this.checkMainState();

        if (this.isFirstPage()) {
            return true;
        }

        this.model.pagination.page = 1;
        this.expectedState = this.getExpectedState(this.model);
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.itemsList.paginator.goToNextPage());

        return this.checkState();
    }

    async goToNextPage() {
        this.checkMainState();
        assert(!this.isLastPage(), 'Can\'t go to next page');

        this.model.pagination.page += 1;
        this.expectedState = this.getExpectedState(this.model);
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.itemsList.paginator.goToNextPage());

        return this.checkState();
    }

    async goToPrevPage() {
        this.checkMainState();
        assert(!this.isFirstPage(), 'Can\'t go to previous page');

        this.model.pagination.page -= 1;
        this.expectedState = this.getExpectedState(this.model);
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.itemsList.paginator.goToPrevPage());

        return this.checkState();
    }
}
