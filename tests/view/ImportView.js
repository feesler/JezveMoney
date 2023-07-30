import {
    assert,
    query,
    closest,
    prop,
    click,
    wait,
    waitForFunction,
    asArray,
    evaluate,
} from 'jezve-test';
import {
    Button,
    DropDown,
    PopupMenu,
} from 'jezvejs-test';
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

const listMenuSelector = '#listMenu';

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

    get listMenu() {
        return this.content.listMenu;
    }

    get contextMenu() {
        return this.content.contextMenu;
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

        res.listMenu = await PopupMenu.create(this, await query(listMenuSelector));

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
        res.contextMenu = await PopupMenu.create(this, await query('#contextMenu'));
        if (res.contextMenu?.elem) {
            const contextParent = await closest(res.contextMenu.elem, '.import-item');
            if (contextParent) {
                res.contextMenu.content.itemIndex = res.itemsList.model.contextMenuIndex;
                assert(res.contextMenu.content.itemIndex !== -1, 'Invalid context menu');
            }
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

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            enabled: !cont.notAvailMsg.visible,
            listMenuVisible: cont.listMenu?.visible,
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
            const rulesCheck = cont.listMenu?.findItemById('rulesCheck');
            res.rulesEnabled = rulesCheck?.checked ?? true;

            const similarCheck = cont.listMenu?.findItemById('similarCheck');
            res.checkSimilarEnabled = similarCheck?.checked ?? true;
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
        res.contextItemIndex = (res.enabled) ? cont.contextMenu?.content?.itemIndex : -1;
        res.contextMenuVisible = res.enabled && cont.contextMenu?.visible;

        res.submitInProgress = res.enabled && cont.submitProgress.visible;

        return res;
    }

    getExpectedState(model = this.model, state = App.state) {
        const listMode = model.listMode === 'list';
        const selectMode = model.listMode === 'select';
        const showMenuItems = model.enabled && model.listMenuVisible;
        const showListItems = showMenuItems && listMode;
        const showSelectItems = showMenuItems && selectMode;
        const hasItems = this.items.length > 0;

        const res = {
            header: this.getHeaderExpectedState(state),
            notAvailMsg: { visible: !model.enabled },
            menuBtn: { visible: model.enabled },
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

        const showPaginator = hasItems && model.pagination.pages > 1;
        res.itemsList = {
            visible: true,
            noDataMsg: { visible: !hasItems },
            showMoreBtn: { visible: hasItems && pageNum < model.pagination.pages },
            paginator: { visible: showPaginator },
        };

        if (showPaginator) {
            res.itemsList.paginator.pages = model.pagination.pages;
            res.itemsList.paginator.active = pageNum;
        }

        res.submitBtn.disabled = !(listMode && hasItems && enabledItems.length > 0);

        // Main menu
        if (model.listMenuVisible) {
            res.listMenu = {
                visible: true,
                createItemBtn: { visible: showListItems },
                selectModeBtn: { visible: showListItems && hasItems },
                sortModeBtn: { visible: showListItems && this.items.length > 1 },
                selectAllBtn: {
                    visible: showSelectItems && selectedItems.length < this.items.length,
                },
                deselectAllBtn: { visible: showSelectItems && selectedItems.length > 0 },
                enableSelectedBtn: { visible: showMenuItems && hasDisabled },
                disableSelectedBtn: { visible: showMenuItems && hasEnabled },
                deleteSelectedBtn: { visible: showMenuItems && selectedItems.length > 0 },
                deleteAllBtn: { visible: showMenuItems, disabled: !hasItems },
                rulesCheck: { checked: model.rulesEnabled, visible: showListItems },
                similarCheck: { checked: model.checkSimilarEnabled, visible: showListItems },
                rulesBtn: { visible: showListItems },
            };
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
                ctxRestoreBtn: { visible: itemRestoreAvail },
                ctxEnableBtn: { visible: true },
                ctxUpdateBtn: { visible: true },
                ctxDeleteBtn: { visible: true },
            };
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

        if (this.model.listMenuVisible) {
            return true;
        }

        this.model.listMenuVisible = true;
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
        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;

        await this.waitForList(() => this.listMenu.select('rulesCheck'));

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
        this.model.listMenuVisible = false;
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

        await this.waitForList(() => this.listMenu.select('similarCheck'));

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

    async selectTemplateDateFormat(locale) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateDateFormat(locale));

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

    /** Clicks on 'Back' button at upload dialog to return to select file stage */
    async backToSelectFile() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.backToSelectFile());

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

        await this.performAction(() => this.listMenu.select('rulesBtn'));
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

    async goToFirstRulesPage() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.goToFirstPage());
        return true;
    }

    async goToLastRulesPage() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.goToLastPage());
        return true;
    }

    async goToPrevRulesPage() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.goToPrevPage());
        return true;
    }

    async goToNextRulesPage() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.goToNextPage());
        return true;
    }

    async showMoreRules() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.showMore());
        return true;
    }

    async iterateRulesList() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.iteratePages());
        return true;
    }

    async toggleExpandRule(index) {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.toggleExpandRule(index));

        this.expectedState = this.getExpectedState();
        return this.checkState();
    }

    async createRule() {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.createRule());

        this.expectedState = this.getExpectedState();
        return this.checkState();
    }

    async updateRule(index) {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.updateRule(index));

        this.expectedState = this.getExpectedState();
        return this.checkState();
    }

    async duplicateRule(index) {
        this.checkRulesListState();

        await this.performAction(() => this.rulesDialog.duplicateRule(index));

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
        return structuredClone(ruleForm.model.conditions);
    }

    getRuleActions() {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        return structuredClone(ruleForm.model.actions);
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
        const isValid = App.state.validateTransaction(expectedTransaction);
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

        const date = App.isValidDateString(formModel.date);
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
            date: App.formatDate(new Date()),
            category_id: 0,
            comment: '',
        });
        this.formIndex = this.items.length;

        this.model.listMenuVisible = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        this.expectedState.transactionForm = ImportTransactionForm.getInitialState(form);

        await this.performAction(() => this.listMenu.select('createItemBtn'));

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
        this.expectedState.transactionForm = ImportTransactionForm.getInitialState(form);

        await this.performAction(() => this.contextMenu.select('ctxUpdateBtn'));

        return this.checkState(expected);
    }

    async duplicateItemByPos(pos) {
        this.checkMainState();
        this.checkValidIndex(pos);

        await this.openContextMenu(pos);

        const item = structuredClone(this.items[pos]);
        delete item.id;

        const form = new ImportTransaction(item);
        form.enabled = true;

        this.formIndex = this.items.length;
        this.model.contextMenuVisible = false;
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;
        this.expectedState.transactionForm = ImportTransactionForm.getInitialState(form);

        await this.performAction(() => this.contextMenu.select('ctxDuplicateBtn'));

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

        this.items.forEach((_, ind) => {
            const item = this.items[ind];
            item.selected = false;
            item.selectMode = listMode === 'select';
        });

        this.model.listMenuVisible = false;
        this.model.listMode = listMode;
        this.expectedState = this.getExpectedState();

        if (listMode === 'list') {
            await this.performAction(() => this.content.listModeBtn.click());
        } else if (listMode === 'select') {
            await this.performAction(() => this.listMenu.select('selectModeBtn'));
        } else if (listMode === 'sort') {
            await this.performAction(() => this.listMenu.select('sortModeBtn'));
        }
        await this.performAction(async () => {
            await wait(async () => {
                const mode = await ImportList.getListMode(this.itemsList.elem);
                return mode === listMode;
            });
        });

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

        this.model.listMenuVisible = false;
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

        this.model.listMenuVisible = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.listMenu.select('selectAllBtn'));

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

        this.model.listMenuVisible = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.listMenu.select('deselectAllBtn'));

        return this.checkState();
    }

    async enableSelectedItems(value) {
        assert(this.itemsList, 'No items available');
        this.checkSelectMode();

        await this.openListMenu();
        const enable = !!value;
        const buttonName = (enable) ? 'enableSelectedBtn' : 'disableSelectedBtn';

        this.items.forEach((_, ind) => {
            const item = this.items[ind];
            if (item.selected) {
                item.enabled = enable;
            }
        });

        this.model.listMenuVisible = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.performAction(() => this.listMenu.select(buttonName));

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
            await this.performAction(() => this.contextMenu.select('ctxRestoreBtn'));
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
            await this.performAction(() => this.contextMenu.select('ctxEnableBtn'));
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
            await this.performAction(async () => {
                await this.contextMenu.select('ctxDeleteBtn');
                await wait('#contextMenu', { hidden: true });
                await this.parse();
            });

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
        this.model.listMenuVisible = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.waitForList(() => this.listMenu.select('deleteSelectedBtn'));

        return this.checkState();
    }

    async deleteAllItems() {
        this.checkMainState();
        await this.openListMenu();

        this.items = [];
        this.formIndex = -1;
        this.model.listMode = 'list';
        this.model.listMenuVisible = false;
        this.expectedState = this.getExpectedState();
        const expectedList = this.getExpectedList();
        this.expectedState.itemsList.items = expectedList.items;

        await this.waitForList(() => this.listMenu.select('deleteAllBtn'));

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
            expected.notification.message = __('import.successMessage', this.locale);
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

    onPageChanged(page) {
        this.checkMainState();
        assert(page >= 1 && page <= this.model.pagination.pages, `Invalid page: ${page}`);

        this.model.pagination.page = page;
        this.model.pagination.range = 1;
        const res = this.getExpectedState();
        const expectedList = this.getExpectedList();
        res.itemsList.items = expectedList.items;

        return res;
    }

    async goToFirstPage() {
        if (this.isFirstPage()) {
            return true;
        }

        const expected = this.onPageChanged(1);

        await this.performAction(() => this.itemsList.paginator.goToFirstPage());

        return this.checkState(expected);
    }

    async goToNextPage() {
        assert(!this.isLastPage(), 'Can\'t go to next page');

        const expected = this.onPageChanged(this.currentPage() + 1);

        await this.performAction(() => this.itemsList.paginator.goToNextPage());

        return this.checkState(expected);
    }

    async goToPrevPage() {
        assert(!this.isFirstPage(), 'Can\'t go to previous page');

        const expected = this.onPageChanged(this.currentPage() - 1);

        await this.performAction(() => this.itemsList.paginator.goToPrevPage());

        return this.checkState(expected);
    }

    async showMore() {
        assert(!this.isLastPage(), 'Can\'t show more items');

        this.model.pagination.range += 1;
        const expected = this.getExpectedState();
        const expectedList = this.getExpectedList();
        expected.itemsList.items = expectedList.items;

        await this.performAction(() => click(this.itemsList.showMoreBtn.elem));

        return this.checkState(expected);
    }
}
