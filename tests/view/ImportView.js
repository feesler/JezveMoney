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
    evaluate,
    formatDate,
    isValidDateString,
} from 'jezve-test';
import { DropDown, Checkbox, Button } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { ImportList } from './component/Import/ImportList.js';
import { ImportUploadDialog } from './component/Import/ImportUploadDialog.js';
import { ImportRulesDialog } from './component/Import/ImportRulesDialog.js';
import { findSimilarTransaction } from '../model/import.js';
import { App } from '../Application.js';
import { ImportTransaction } from '../model/ImportTransaction.js';
import { ImportTransactionForm } from './component/Import/ImportTransactionForm.js';
import { Counter } from './component/Counter.js';
import { fixFloat } from '../common.js';
import { __ } from '../model/locale.js';

const defaultPagination = {
    page: 1,
    pages: 1,
};

const modeButtons = {
    list: 'listModeBtn',
    select: 'selectModeBtn',
    sort: 'sortModeBtn',
};

const listMenuSelector = '#listMenu';
const menuItems = [
    'createItemBtn',
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
    'ctxRestoreBtn', 'ctxEnableBtn', 'ctxUpdateBtn', 'ctxDeleteBtn',
];

const transactionPopupId = '#transactionFormPopup';

/** Import view class */
export class ImportView extends AppView {
    constructor(...args) {
        super(...args);

        this.transactionPopupId = '#transactionFormPopup';
        this.uploadPopupId = '#fileupload_popup';
        this.rulesPopupId = '#rules_popup';
        this.items = [];
        this.formIndex = -1;
    }

    async parseContent() {
        const res = {
            totalCounter: await Counter.create(this, await query('#itemsCounter')),
            enabledCounter: await Counter.create(this, await query('#enabledCounter')),
            selectedCounter: await Counter.create(this, await query('#selectedCounter')),
            submitBtn: { elem: await query('#submitBtn') },
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of view: ${child} component not found`)
        ));

        res.notAvailMsg = { elem: await query('#notAvailMsg') };
        const importEnabled = !res.notAvailMsg.elem;

        // Heading
        [
            res.submitBtn.disabled,
        ] = await evaluate((submitBtn) => ([
            submitBtn.disabled,
        ]), res.submitBtn.elem);

        res.listModeBtn = await Button.create(this, await query('#listModeBtn'));

        // List menu
        res.menuBtn = { elem: await query('.heading-actions .menu-btn') };
        res.listMenu = { elem: await query(listMenuSelector) };
        if (res.listMenu.elem) {
            await this.parseMenuItems(res, menuItems);

            res.rulesCheck = await Checkbox.create(this, await query('#rulesCheck'));
            res.similarCheck = await Checkbox.create(this, await query('#similarCheck'));
        }

        if (!importEnabled) {
            return res;
        }

        res.uploadBtn = await Button.create(this, await query('#uploadBtn'));

        // Main account select
        res.mainAccountSelect = await DropDown.createFromChild(this, await query('#acc_id'));
        assert(res.mainAccountSelect, 'Invalid structure of import view');
        const mainAccountId = res.mainAccountSelect.value;

        // Import list
        const rowsContainer = await query('.import-list');
        res.renderTime = await prop(rowsContainer, 'dataset.time');

        const listContainer = await query('.data-form');
        res.itemsList = await ImportList.create(this, listContainer, mainAccountId);
        assert(res.itemsList, 'Invalid structure of import view');
        res.submitProgress = { elem: await query('.content_wrap > .loading-indicator') };

        // Context menu
        res.contextMenu = { elem: await query('#contextMenu') };
        const contextParent = await closest(res.contextMenu.elem, '.import-item');
        if (contextParent) {
            res.contextMenu.itemIndex = res.itemsList.model.contextMenuIndex;
            assert(res.contextMenu.itemIndex !== -1, 'Invalid context menu');

            await this.parseMenuItems(res, contextMenuItems);
        }

        const transactionFormDialog = await query(transactionPopupId);
        res.transactionForm = await ImportTransactionForm.create(
            this,
            transactionFormDialog,
            mainAccountId,
        );

        const uploadDialogPopup = await query(this.uploadPopupId);
        const rulesDialogPopup = await query(this.rulesPopupId);

        const [
            uploadDialogVisible,
            rulesDialogVisible,
        ] = await evaluate((uploadDialog, rulesDialog) => ([
            uploadDialog && !uploadDialog.hidden,
            rulesDialog && !rulesDialog.hidden,
        ]), uploadDialogPopup, rulesDialogPopup);

        if (uploadDialogVisible) {
            res.uploadDialog = await ImportUploadDialog.create(this, uploadDialogPopup);
        } else {
            res.uploadDialog = { elem: null };
        }

        if (rulesDialogVisible) {
            res.rulesDialog = await ImportRulesDialog.create(this, rulesDialogPopup);
        } else {
            res.rulesDialog = { elem: null };
        }

        return res;
    }

    async parseMenuItems(cont, ids) {
        const itemIds = asArray(ids);
        if (!itemIds.length) {
            return cont;
        }

        const res = cont;
        await asyncMap(itemIds, async (id) => {
            res[id] = await Button.create(this, await query(`#${id}`));
            assert(res[id], `Menu item '${id}' not found`);
            res[id].content.disabled = await hasAttr(res[id].elem, 'disabled');

            return res[id];
        });

        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            enabled: !cont.notAvailMsg.visible,
            menuOpen: cont.listMenu.visible,
        };

        const transactionFormVisible = !!cont.transactionForm?.content?.visible;
        const uploadVisible = !!cont.uploadDialog?.content?.visible;
        const rulesVisible = !!cont.rulesDialog?.content?.visible;
        if (!res.enabled) {
            res.state = 'notavailable';
        } else if (transactionFormVisible) {
            assert(!uploadVisible && !rulesVisible, 'Invalid state');
            res.state = 'form';
        } else if (uploadVisible) {
            assert(!transactionFormVisible && !rulesVisible, 'Invalid state');
            res.state = 'upload';
        } else if (rulesVisible) {
            assert(!transactionFormVisible && !uploadVisible, 'Invalid state');
            res.state = 'rules';
        } else {
            res.state = 'main';
        }

        res.mainAccount = (res.enabled) ? parseInt(cont.mainAccountSelect.content.value, 10) : 0;

        if (res.enabled) {
            res.rulesEnabled = cont.rulesCheck?.checked ?? true;
            res.checkSimilarEnabled = cont.similarCheck?.checked ?? true;
        } else {
            res.rulesEnabled = false;
            res.checkSimilarEnabled = false;
        }

        res.renderTime = cont.renderTime;
        res.listMode = (cont.itemsList) ? cont.itemsList.listMode : 'list';
        res.items = (cont.itemsList) ? cont.itemsList.getItems() : [];
        res.pagination = (cont.itemsList)
            ? cont.itemsList.getPagination()
            : { ...defaultPagination };
        res.contextItemIndex = (res.enabled) ? cont.contextMenu.itemIndex : -1;
        res.contextMenuVisible = (res.enabled) ? cont.contextMenu.visible : false;

        res.submitInProgress = (res.enabled) ? cont.submitProgress.visible : false;

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
            menuBtn: { visible: model.enabled },
            listMenu: { visible: showMenuItems },
            totalCounter: { visible: model.enabled },
            enabledCounter: { visible: model.enabled },
            selectedCounter: { visible: model.enabled && selectMode },
            submitBtn: { visible: model.enabled },
        };

        if (!model.enabled) {
            return res;
        }

        const enabledItems = this.getEnabledItems();
        const selectedItems = (selectMode) ? this.getSelectedItems() : [];
        const hasEnabled = (selectMode) ? selectedItems.some((item) => item.enabled) : false;
        const hasDisabled = (selectMode) ? selectedItems.some((item) => !item.enabled) : false;

        const pageNum = this.currentPage(model);

        res.uploadBtn = { visible: listMode };
        res.listModeBtn = { visible: !listMode };

        // Counters
        res.totalCounter.value = this.items.length;
        res.enabledCounter.value = enabledItems.length;
        res.selectedCounter.value = selectedItems.length;

        res.mainAccountSelect = {
            value: model.mainAccount.toString(),
            visible: model.enabled,
            disabled: !listMode,
        };
        res.itemsList = {
            visible: true,
            noDataMsg: { visible: !hasItems },
            showMoreBtn: { visible: hasItems && pageNum < model.pagination.pages },
            paginator: { visible: hasItems && model.pagination.pages > 1 },
        };
        res.submitBtn.disabled = !(listMode && hasItems && enabledItems.length > 0);

        // Main menu
        if (model.menuOpen) {
            res.createItemBtn = { visible: showListItems };
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
        }

        if (model.contextMenuVisible) {
            const itemsOnPage = App.config.importTransactionsOnPage;
            const firstItem = itemsOnPage * (model.pagination.page - 1);
            const absIndex = firstItem + model.contextItemIndex;
            assert.arrayIndex(this.items, absIndex, 'Invalid state');

            const item = this.items[absIndex];
            const itemRestoreAvail = (
                !!item.original && (item.rulesApplied || item.modifiedByUser)
            );

            res.contextMenu = {
                visible: true,
                itemIndex: model.contextItemIndex,
            };
            res.ctxRestoreBtn = { visible: itemRestoreAvail };
            res.ctxEnableBtn = { visible: true };
            res.ctxUpdateBtn = { visible: true };
            res.ctxDeleteBtn = { visible: true };
        }

        return res;
    }

    getExpectedList(model = this.model) {
        const itemsOnPage = App.config.importTransactionsOnPage;
        const firstItem = itemsOnPage * (model.pagination.page - 1);
        const lastItem = firstItem + itemsOnPage * model.pagination.range;
        const pageItems = this.items.slice(firstItem, lastItem);

        return ImportList.render(pageItems, App.state);
    }

    currentPage(model = this.model) {
        return model.pagination.page + model.pagination.range - 1;
    }

    getEnabledItems() {
        return this.items.filter((item) => item.enabled);
    }

    getSelectedItems() {
        return this.items.filter((item) => item.selected);
    }

    getPositionByIndex(index, model = this.model) {
        assert.arrayIndex(this.items, index, 'Invalid index');

        const onPage = App.config.importTransactionsOnPage;
        const startPage = model.pagination.page;
        const page = Math.floor(index / onPage) + 1;
        const relIndex = index % onPage;

        return {
            page,
            index: relIndex,
            rangeIndex: relIndex + (page - startPage) * onPage,
        };
    }

    get transactionForm() {
        return this.content.transactionForm;
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

    checkFormState() {
        this.assertStateId('form');
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
        const startPage = this.model.pagination.page;
        const endPage = this.currentPage();

        assert(
            pos.page >= startPage && pos.page <= endPage,
            `Invalid page ${pos.page}, expected in range: [${startPage} - ${endPage}]`,
        );
    }

    async openContextMenu(index) {
        this.checkValidIndex(index);

        const pos = this.getPositionByIndex(index);

        await this.setListMode();

        this.model.contextMenuVisible = true;
        this.model.contextItemIndex = pos.rangeIndex;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            const item = this.itemsList.getItem(pos.rangeIndex);
            await item.clickMenu();
            await wait('#contextMenu', { visible: true });
            await this.parse();
        });

        return this.checkState(expected);
    }

    async openListMenu() {
        this.checkMainState();

        if (this.model.menuOpen) {
            return true;
        }

        this.model.menuOpen = true;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            await click(this.content.menuBtn.elem);
            return wait(listMenuSelector, { visible: true });
        });

        return this.checkState(expected);
    }

    async enableRules(value) {
        this.checkMainState();

        const enable = !!value;
        assert(
            enable !== this.rulesEnabled,
            enable ? 'Already enabled' : 'Already disabled',
        );

        await this.openListMenu();

        this.items.forEach((item) => {
            if (!item.original || item.modifiedByUser) {
                return;
            }

            if (item.rulesApplied) {
                item.restoreOriginal();
            }
            if (enable) {
                App.state.rules.applyTo(item);
            }
        });

        this.model.rulesEnabled = !this.model.rulesEnabled;
        this.model.menuOpen = false;
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;

        await this.waitForList(() => this.content.rulesCheck.toggle());

        return this.checkState(expected);
    }

    async enableCheckSimilar(value) {
        this.checkMainState();

        const enable = !!value;
        assert(
            enable !== this.checkSimilarEnabled,
            enable ? 'Already enabled' : 'Already disabled',
        );

        await this.openListMenu();

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
        this.expectedState.uploadDialog = { visible: true };

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

        this.getStateOnTemplateSelected();

        return this.checkState();
    }

    async selectUploadTemplateByIndex(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateByIndex(val));

        this.getStateOnTemplateSelected();

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

        const { mainAccount } = this.model;
        this.uploadDialog.model.initialAccount = App.state.accounts.getItem(mainAccount);

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

    getStateOnTemplateSelected() {
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
    }

    /** Delete currently selected template */
    async deleteTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.deleteTemplate());

        this.getStateOnTemplateSelected();

        return this.checkState();
    }

    /** Submit template */
    async submitTemplate() {
        this.checkUploadState();

        this.getStateOnTemplateSelected();

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
        await this.parse();
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
        const itemsOnPage = App.config.importTransactionsOnPage;
        const pagesCount = Math.ceil(this.items.length / itemsOnPage);
        this.model.pagination.pages = pagesCount;
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
        this.items.forEach((item) => {
            if (!item.original || item.modifiedByUser || !this.rulesEnabled) {
                item.setMainAccount(accountId);
                return;
            }

            if (item.rulesApplied) {
                item.restoreOriginal();
            }
            item.setMainAccount(accountId);
            App.state.rules.applyTo(item);

            if (!this.checkSimilarEnabled) {
                return;
            }

            const tr = findSimilarTransaction(item, skipList);
            if (tr) {
                skipList.push(tr.id);
            }
            item.setSimilarTransaction(tr);
        });

        this.model.mainAccount = accountId;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        const action = () => this.content.mainAccountSelect.selectItem(val);

        if (this.items.length > 0) {
            await this.waitForList(action);
        } else {
            await this.performAction(action);
        }

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
        await this.openListMenu();

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

    /** Validate amount value */
    isValidAmount(value) {
        const amount = parseFloat(fixFloat(value));
        return (!Number.isNaN(amount) && amount > 0);
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

        const expectedTransaction = this.transactionForm.getExpectedTransaction();
        const isValid = App.state.checkTransactionCorrectness(expectedTransaction);
        if (isValid) {
            return true;
        }

        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        const formModel = this.transactionForm.model;
        const isExpense = (formModel.type === 'expense');
        const isDiff = formModel.isDifferent;

        const srcAmount = (!isExpense || isDiff)
            ? this.isValidAmount(formModel.srcAmount)
            : true;
        const destAmount = (isExpense || isDiff)
            ? this.isValidAmount(formModel.destAmount)
            : true;

        const dateLocale = App.state.getDateFormatLocale();
        const date = isValidDateString(formModel.date, dateLocale, App.dateFormatOptions);
        assert(!(srcAmount && destAmount && date), 'Invalid state');

        formModel.validation = {
            srcAmount,
            destAmount,
            date,
        };

        formModel.invalidated = true;
        this.expectedState.transactionForm = ImportTransactionForm.getExpectedState(formModel);

        await action();

        this.checkState();

        return false;
    }

    async addItem() {
        this.checkMainState();
        await this.openListMenu();

        const dateLocale = App.state.getDateFormatLocale();
        const mainAccount = App.state.accounts.getItem(this.model.mainAccount);
        const form = new ImportTransaction({
            enabled: true,
            mainAccount,
            rulesApplied: false,
            modifiedByUser: false,
            type: 'expense',
            src_id: mainAccount.id,
            dest_id: 0,
            src_curr: mainAccount.curr_id,
            dest_curr: mainAccount.curr_id,
            src_amount: '',
            dest_amount: '',
            date: formatDate(new Date(), dateLocale, App.dateFormatOptions),
            comment: '',
        });
        this.formIndex = this.items.length;

        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        this.expectedState.transactionForm = ImportTransactionForm.render(form, App.state);

        await this.performAction(() => this.content.createItemBtn.click());

        return this.checkState();
    }

    async updateItemByPos(pos) {
        this.checkMainState();
        this.checkValidIndex(pos);

        await this.openContextMenu(pos);

        const form = new ImportTransaction(this.items[pos]);
        form.enabled = true;

        this.formIndex = pos;
        this.model.contextMenuVisible = false;
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;
        this.expectedState.transactionForm = ImportTransactionForm.render(form, App.state);

        await this.performAction(() => this.content.ctxUpdateBtn.click());

        return this.checkState(expected);
    }

    async saveItem() {
        this.checkFormState();

        const saveAction = () => this.runFormAction({ action: 'clickSave' });

        const isValid = await this.validateSaveForm(saveAction);
        if (!isValid) {
            return true;
        }

        const itemData = this.transactionForm.data;
        itemData.type = itemData.importType;
        delete itemData.importType;

        if (itemData.original) {
            const origMainAccount = App.state.accounts.findByName(
                this.transactionForm.model.original.mainAccount,
            );
            itemData.original.mainAccount = origMainAccount;
        }

        const origItem = this.items[this.formIndex];
        const savedItem = new ImportTransaction({
            ...origItem,
            ...itemData,
        });
        const isAppend = (this.formIndex === this.items.length);
        if (isAppend || savedItem.isChanged(origItem)) {
            savedItem.setModified(true);
        }

        this.items[this.formIndex] = savedItem;

        const itemsOnPage = App.config.importTransactionsOnPage;
        const pagesCount = Math.ceil(this.items.length / itemsOnPage);
        this.model.pagination.pages = pagesCount;
        const pos = this.getPositionByIndex(this.formIndex);

        const startPage = this.model.pagination.page;
        const endPage = this.currentPage();
        if (pos.page < startPage || pos.page > endPage) {
            this.model.pagination.page = pos.page;
            this.model.pagination.range = 1;
        }

        this.formIndex = -1;

        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await saveAction();

        return this.checkState();
    }

    async cancelItem() {
        this.checkFormState();

        this.formIndex = -1;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.runFormAction({ action: 'clickCancel' });

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

        if (listMode !== 'list') {
            await this.openListMenu();
        }

        const buttonName = modeButtons[listMode];
        const button = this.content[buttonName];
        assert(button, `Button ${buttonName} not found`);
        const menuAction = () => this.performAction(async () => {
            await button.click();
            await wait(async () => {
                const mode = await ImportList.getListMode(this.itemsList.elem);
                return mode === listMode;
            });
        });

        this.items.forEach((_, ind) => {
            const item = this.items[ind];
            item.selected = false;
        });

        this.model.menuOpen = false;
        this.model.listMode = listMode;
        this.expectedState = this.getExpectedState();

        await menuAction();

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
        const indexes = asArray(index);
        assert(indexes.length > 0, 'No items specified');
        assert(this.itemsList, 'No items available');

        await this.setSelectMode();

        indexes.forEach((ind) => {
            this.checkValidIndex(ind);

            const item = this.items[ind];
            item.selected = !item.selected;
        });

        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        for (const ind of indexes) {
            await this.performAction(async () => {
                const pos = this.getPositionByIndex(ind);
                const item = this.itemsList.getItem(pos.rangeIndex);
                await item.toggleSelect();
            });
        }

        return this.checkState();
    }

    async selectAllItems() {
        assert(this.itemsList, 'No items available');

        await this.setSelectMode();
        await this.openListMenu();

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
        await this.openListMenu();

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

        await this.openListMenu();
        const enable = !!value;
        const button = (enable) ? this.content.enableSelectedBtn : this.content.disableSelectedBtn;

        this.items.forEach((_, ind) => {
            const item = this.items[ind];
            if (item.selected) {
                item.enabled = enable;
            }
        });

        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => button.click());

        return this.checkState();
    }

    async restoreItems(index) {
        this.checkMainState();
        this.checkListMode();

        const indexes = asArray(index);
        assert(indexes.length > 0, 'No items specified');
        assert(this.itemsList, 'No items available');

        const expectedItems = this.items.map((item) => new ImportTransaction(item));
        indexes.forEach((ind) => {
            assert.arrayIndex(expectedItems, ind);
            const item = expectedItems[ind];
            assert(item.original, 'Item not imported');
            assert(item.rulesApplied || item.modifiedByUser, 'Item not modified');

            item.restoreOriginal();
        });

        for (const ind of indexes) {
            await this.openContextMenu(ind);
            await this.performAction(() => this.content.ctxRestoreBtn.click());
        }

        this.items = expectedItems;
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;

        return this.checkState(expected);
    }

    async enableItems(index, value) {
        this.checkMainState();
        this.checkListMode();

        const indexes = asArray(index);
        assert(indexes.length > 0, 'No items specified');
        const enable = !!value;

        assert(this.itemsList, 'No items available');

        const expectedItems = this.items.map((item) => new ImportTransaction(item));
        indexes.forEach((ind) => {
            assert.arrayIndex(expectedItems, ind);
            const item = expectedItems[ind];
            assert(item.enabled !== enable, `Item ${ind} already ${enable ? 'enabled' : 'disabled'}`);
            item.enabled = enable;
        });

        for (const ind of indexes) {
            await this.openContextMenu(ind);
            await this.performAction(() => this.content.ctxEnableBtn.click());
        }

        this.items = expectedItems;
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;

        return this.checkState(expected);
    }

    async runFormAction({ action, data }) {
        this.checkFormState();

        await this.performAction(() => this.transactionForm.runAction(action, data));

        return true;
    }

    async deleteItem(index) {
        this.checkMainState();
        this.checkListMode();

        const items = asArray(index);
        assert(items.length > 0, 'No items specified');
        items.sort();

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

        await this.openListMenu();

        assert(!this.content.deleteSelectedBtn.content.disabled, '\'Delete all\' menu item is disabled');

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

        await this.waitForList(() => this.content.deleteSelectedBtn.click());

        return this.checkState();
    }

    async deleteAllItems() {
        this.checkMainState();
        await this.openListMenu();

        assert(!this.content.deleteAllBtn.content.disabled, '\'Delete all\' menu item is disabled');

        this.items = [];
        this.formIndex = -1;
        this.model.listMode = 'list';
        this.model.menuOpen = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.waitForList(() => this.content.deleteAllBtn.click());

        return this.checkState();
    }

    async submit() {
        this.checkMainState();
        await this.setListMode();

        const enabledItems = this.getEnabledItems();
        const { disabled } = this.content.submitBtn;
        assert(disabled === (enabledItems.length === 0), 'Submit is not available');
        if (disabled) {
            return true;
        }

        const expState = App.state.clone();
        await expState.fetch();
        const origState = expState.clone();

        const resExpected = enabledItems.every((item) => {
            const expectedTransaction = item.getExpectedTransaction();
            return expState.createTransaction(expectedTransaction);
        });

        if (!resExpected) {
            expState.setState(origState);
        }

        await this.performAction(() => click(this.content.submitBtn.elem));

        await waitForFunction(async () => {
            await this.parse();

            const notificationVisible = this.content.notification?.content?.visible;
            return (notificationVisible && !this.model.submitInProgress);
        });

        if (resExpected) {
            this.items = [];
            this.formIndex = -1;
        }

        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;

        expected.notification = {
            success: resExpected,
        };
        if (resExpected) {
            expected.notification.message = __('MSG_IMPORT_SUCCESS', this.locale);
        }

        this.checkState(expected);

        await this.closeNotification();

        App.state.setState(expState);
        return App.state.fetchAndTest();
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
        this.model.pagination.range = 1;
        this.expectedState = this.getExpectedState(this.model);
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.itemsList.paginator.goToFirstPage());

        return this.checkState();
    }

    async goToNextPage() {
        this.checkMainState();
        assert(!this.isLastPage(), 'Can\'t go to next page');

        this.model.pagination.page = this.currentPage() + 1;
        this.model.pagination.range = 1;
        this.expectedState = this.getExpectedState(this.model);
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.itemsList.paginator.goToNextPage());

        return this.checkState();
    }

    async goToPrevPage() {
        this.checkMainState();
        assert(!this.isFirstPage(), 'Can\'t go to previous page');

        this.model.pagination.page = this.currentPage() - 1;
        this.model.pagination.range = 1;
        this.expectedState = this.getExpectedState(this.model);
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.itemsList.paginator.goToPrevPage());

        return this.checkState();
    }

    async showMore() {
        assert(!this.isLastPage(), 'Can\'t show more items');

        this.model.pagination.range += 1;
        this.expectedState = this.getExpectedState(this.model);
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => click(this.itemsList.showMoreBtn.elem));

        return this.checkState();
    }
}
