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
import { DropDown, Checkbox } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { IconButton } from './component/IconButton.js';
import { ImportList } from './component/Import/ImportList.js';
import { ImportUploadDialog } from './component/Import/ImportUploadDialog.js';
import { ImportRulesDialog } from './component/Import/ImportRulesDialog.js';
import { findSimilarTransaction } from '../model/import.js';
import { App } from '../Application.js';
import { ImportTransaction } from '../model/ImportTransaction.js';

const ITEMS_ON_PAGE = 20;
const defaultPagination = {
    page: 1,
    pages: 1,
};

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
            actionsMenuBtn: { elem: await query('#toggleActionsMenuBtn') },
            actionsList: { elem: await query('#actionsList') },

            addBtn: await IconButton.create(this, await query('#newItemBtn')),
            selectModeBtn: await IconButton.create(this, await query('#selectModeBtn')),
            selectAllBtn: await IconButton.create(this, await query('#selectAllBtn')),
            deselectAllBtn: await IconButton.create(this, await query('#deselectAllBtn')),
            enableSelectedBtn: await IconButton.create(this, await query('#enableSelectedBtn')),
            disableSelectedBtn: await IconButton.create(this, await query('#disableSelectedBtn')),
            deleteSelectedBtn: await IconButton.create(this, await query('#deleteSelectedBtn')),
            deleteAllBtn: await IconButton.create(this, await query('#deleteAllBtn')),

            totalCount: { elem: await query('#trcount') },
            enabledCount: { elem: await query('#entrcount') },
            rulesCheck: await Checkbox.create(this, await query('#rulesCheck')),
            rulesBtn: { elem: await query('#rulesBtn') },
            similarCheck: await Checkbox.create(this, await query('#similarCheck')),
            submitBtn: { elem: await query('#submitbtn') },

        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of import view: ${child} component not found`)
        ));

        res.submitProgress = { elem: await query('.content_wrap > .loading-indicator') };
        res.notAvailMsg = { elem: await query('#notavailmsg') };
        const importEnabled = !res.notAvailMsg.elem;

        res.title.value = await prop(res.title.elem, 'textContent');

        res.uploadBtn.content.disabled = await hasAttr(res.uploadBtn.elem, 'disabled');
        res.totalCount.value = await prop(res.totalCount.elem, 'textContent');
        res.enabledCount.value = await prop(res.enabledCount.elem, 'textContent');
        res.submitBtn.disabled = await prop(res.submitBtn.elem, 'disabled');
        res.deleteAllBtn.content.disabled = await hasAttr(res.deleteAllBtn.elem, 'disabled');

        if (importEnabled) {
            res.mainAccountSelect = await DropDown.createFromChild(this, await query('#acc_id'));
            assert(res.mainAccountSelect, 'Invalid structure of import view');
        }

        const rowsContainer = await query('#rowsContainer');
        res.renderTime = await prop(rowsContainer, 'dataset.time');

        if (importEnabled) {
            const mainAccountId = res.mainAccountSelect.content.value;
            res.itemsList = await ImportList.create(this, rowsContainer, mainAccountId);
            assert(res.itemsList, 'Invalid structure of import view');
        }

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
            menuOpen: cont.actionsList.visible,
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
        res.rulesEnabled = cont.rulesCheck.checked;
        res.checkSimilarEnabled = cont.similarCheck.checked;
        res.renderTime = cont.renderTime;
        res.selectMode = !!(cont.itemsList?.selectMode);
        res.items = (cont.itemsList) ? cont.itemsList.getItems() : [];
        res.pagination = (cont.itemsList)
            ? cont.itemsList.getPagination()
            : { ...defaultPagination };

        res.invalidated = (cont.itemsList) ? cont.itemsList.model.invalidated : false;
        res.submitInProgress = cont.submitProgress.visible;

        return res;
    }

    getExpectedState(model = this.model) {
        const showMenuItems = model.enabled && model.menuOpen;
        const showListItems = showMenuItems && !model.selectMode;
        const showSelectItems = showMenuItems && model.selectMode;
        const hasItems = this.items.length > 0;

        const res = {
            notAvailMsg: { visible: !model.enabled },
            actionsMenuBtn: { visible: model.enabled && hasItems },
            uploadBtn: { visible: model.enabled, disabled: !model.enabled },
            title: { value: model.title.toString(), visible: true },
            totalCount: { value: model.totalCount.toString(), visible: model.enabled },
            enabledCount: { value: model.enabledCount.toString(), visible: model.enabled },
            rulesCheck: { checked: model.rulesEnabled, visible: showListItems },
            similarCheck: { checked: model.checkSimilarEnabled, visible: showListItems },
            rulesBtn: { visible: showListItems },
            submitBtn: { visible: model.enabled },
        };

        if (!model.enabled) {
            return res;
        }

        const selectedItems = (model.selectMode) ? this.items.filter((item) => item.selected) : [];
        const hasEnabled = selectedItems.some((item) => item.enabled);
        const hasDisabled = selectedItems.some((item) => !item.enabled);

        res.addBtn = { visible: showListItems };
        res.selectModeBtn = { visible: showMenuItems && hasItems };
        res.selectAllBtn = {
            visible: showSelectItems && selectedItems.length < this.items.length,
        };
        res.deselectAllBtn = { visible: showSelectItems && selectedItems.length > 0 };
        res.enableSelectedBtn = { visible: showMenuItems && hasDisabled };
        res.disableSelectedBtn = { visible: showMenuItems && hasEnabled };
        res.deleteSelectedBtn = { visible: showMenuItems && selectedItems.length > 0 };
        res.deleteAllBtn = { visible: showMenuItems, disabled: !hasItems };

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
            page: Math.max(1, Math.ceil(index / ITEMS_ON_PAGE)),
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

    checkMainState() {
        this.assertStateId('main');
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
        await this.cancelSelectMode();

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
        await this.performAction(() => click(this.content.actionsMenuBtn.elem));

        return this.checkState();
    }

    async enableRules(value) {
        this.checkMainState();
        const enable = !!value;
        assert(
            enable !== this.rulesEnabled,
            enable ? 'Already enabled' : 'Already disabled',
        );
        await this.openActionsMenu();
        await this.performAction(() => this.content.rulesCheck.toggle());
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
    }

    async selectUploadTemplateByIndex(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateByIndex(val));
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
    }

    async selectTemplateColumn(name, index) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.selectTemplateColumn(name, index));
    }

    async inputTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.inputTemplateFirstRow(val));
    }

    async decreaseTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.decreaseTemplateFirstRow(val));
    }

    async increaseTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.increaseTemplateFirstRow(val));
    }

    /** Create new import template */
    async createTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.createTemplate());
    }

    /** Update currently selected template */
    async updateTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.updateTemplate());
    }

    /** Delete currently selected template */
    async deleteTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.deleteTemplate());
    }

    /** Submit template */
    async submitTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.submitTemplate());
    }

    /** Cancel create/update template */
    async cancelTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.uploadDialog.cancelTemplate());
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

        await this.waitForList(
            () => this.content.mainAccountSelect.selectItem(val),
        );
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
        return true;
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

        return true;
    }

    async deleteRuleCondition(index) {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        await this.performAction(() => ruleForm.deleteCondition(index));

        return true;
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

        return true;
    }

    async deleteRuleAction(index) {
        this.checkRulesFormState();

        const { ruleForm } = this.rulesDialog.content;
        await this.performAction(() => ruleForm.deleteAction(index));

        return true;
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

        const addAction = () => this.performAction(() => this.content.addBtn.click());
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

    async toggleSelectMode() {
        this.checkMainState();
        await this.openActionsMenu();

        this.model.menuOpen = false;
        this.model.selectMode = !this.model.selectMode;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.selectModeBtn.click());

        return this.checkState();
    }

    async setSelectMode() {
        if (this.model.selectMode) {
            return true;
        }

        return this.toggleSelectMode();
    }

    async cancelSelectMode() {
        if (!this.model.selectMode) {
            return true;
        }

        return this.toggleSelectMode();
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
        assert(this.model.selectMode, 'Invalid state: not in select mode');

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
        assert(!this.model.selectMode, 'Invalid state: not in list mode');

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

        const transaction = new ImportTransaction(itemData);
        this.items[index] = transaction;

        return true;
    }

    async deleteItem(index) {
        this.checkMainState();
        assert(!this.model.selectMode, 'Invalid state: not in list mode');

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
    }

    async deleteSelectedItems() {
        assert(this.model.selectMode, 'Invalid state: not in select mode');
        assert(this.itemsList, 'No items available');

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
            this.model.selectMode = false;
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
        this.model.selectMode = false;
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
