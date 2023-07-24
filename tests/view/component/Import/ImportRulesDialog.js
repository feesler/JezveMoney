import {
    TestComponent,
    assert,
    hasFlag,
    query,
    queryAll,
    evaluate,
    click,
    wait,
    waitForFunction,
    asyncMap,
} from 'jezve-test';
import { Button, Paginator } from 'jezvejs-test';
import { IMPORT_COND_OP_FIELD_FLAG, ImportCondition } from '../../../model/ImportCondition.js';
import { ImportRuleForm } from './ImportRuleForm.js';
import { ImportRuleItem } from './ImportRuleItem.js';
import { WarningPopup } from '../WarningPopup.js';
import { App } from '../../../Application.js';
import { SearchInput } from '../Fields/SearchInput.js';
import { __ } from '../../../model/locale.js';

const ITEMS_ON_PAGE = 20;

export class ImportRulesDialog extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import rules dialog element');

        const res = {
            closeBtn: await query(this.elem, '.close-btn'),
            header: {
                elem: await query(this.elem, '.rules-header'),
                labelElem: await query(this.elem, '.rules-header label'),
                createBtn: await query(this.elem, '.create-btn'),
            },
            loadingIndicator: { elem: await query(this.elem, '.loading-indicator') },
            searchField: await SearchInput.create(this, await query(this.elem, '.search-field')),
            clearSearchBtn: { elem: await query(this.elem, '.search-field .clear-btn') },
            rulesList: { elem: await query(this.elem, '.rules-list') },
            contextMenu: { elem: await query(this.elem, '.popup-menu-list') },
        };

        assert(
            res.closeBtn
            && res.header.elem
            && res.header.labelElem
            && res.header.createBtn
            && res.loadingIndicator.elem
            && res.searchField.elem
            && res.rulesList.elem,
            'Failed to initialize import rules dialog',
        );

        [
            res.contextMenu.itemId,
            res.rulesList.renderTime,
            res.header.title,
        ] = await evaluate((menuEl, listEl, hdrEl) => {
            const contextParent = menuEl?.closest('.rule-item');
            const contextId = (contextParent)
                ? parseInt(contextParent.dataset.id, 10)
                : null;

            return [
                contextId,
                listEl?.dataset?.time,
                hdrEl?.textContent,
            ];
        }, res.contextMenu.elem, res.rulesList.elem, res.header.labelElem);

        if (res.contextMenu.itemId) {
            const updateBtnElem = await query(res.contextMenu.elem, '.update-btn');
            res.updateBtn = await Button.create(this, updateBtnElem);
            const duplicateBtnElem = await query(res.contextMenu.elem, '.duplicate-btn');
            res.duplicateBtn = await Button.create(this, duplicateBtnElem);
            const deleteBtnElem = await query(res.contextMenu.elem, '.delete-btn');
            res.deleteBtn = await Button.create(this, deleteBtnElem);
        }

        const listItems = await queryAll(res.rulesList.elem, '.rule-item');
        res.items = await asyncMap(
            listItems,
            (item) => ImportRuleItem.create(this.parent, item),
        );

        res.showMoreBtn = { elem: await query(this.elem, '.show-more-btn') };
        res.paginator = await Paginator.create(this, await query(this.elem, '.paginator'));

        const ruleFormElem = await query(this.elem, '.rule-form');
        if (ruleFormElem) {
            res.ruleForm = await ImportRuleForm.create(this.parent, ruleFormElem);
        }

        res.ruleDeletePopupId = '#rule_delete_warning';
        const popupElem = await query(res.ruleDeletePopupId);
        res.delete_warning = await WarningPopup.create(this, popupElem);

        return res;
    }

    buildModel(cont) {
        const res = {};

        res.loading = cont.loadingIndicator.visible;
        res.renderTime = cont.rulesList.renderTime;
        res.filter = cont.searchField.value;
        res.rules = cont.items.map((item) => structuredClone(item.model));

        res.contextMenuVisible = cont.contextMenu.visible;

        res.pagination = {
            page: cont.paginator?.active ?? 1,
            pages: cont.paginator?.pages ?? 1,
            range: Math.max(Math.ceil(cont.items.length / ITEMS_ON_PAGE), 1),
        };

        const importRulesTok = __('import.rules.listTitle', App.view.locale);
        const updateRuleTok = __('import.rules.update', App.view.locale);
        const isListState = cont.rulesList.visible && cont.header.title === importRulesTok;
        if (isListState) {
            res.state = 'list';
        } else {
            const isUpdate = (cont.header.title === updateRuleTok);
            res.state = (isUpdate) ? 'update' : 'create';
            if (cont.ruleForm) {
                res.rule = structuredClone(cont.ruleForm.model);
                res.ruleItem = cont.ruleForm.getExpectedRule();
            }
        }

        return res;
    }

    getExpectedState(model = this.model) {
        const isForm = this.isFormState(model);
        const isList = this.isListState(model);
        const res = {
            header: {},
            searchField: { visible: isList },
            rulesList: { visible: isList },
        };

        res.contextMenu = {
            visible: model.contextMenuVisible,
        };

        if (isList) {
            res.header.title = __('import.rules.listTitle', App.view.locale);

            const filteredRules = (model.filter !== '')
                ? App.state.rules.filter((rule) => rule.isMatchFilter(model.filter))
                : App.state.rules.data;

            const pageNum = this.currentPage(model);

            const pagesCount = Math.ceil(filteredRules.length / ITEMS_ON_PAGE);
            const firstItem = ITEMS_ON_PAGE * (model.pagination.page - 1);
            const lastItem = firstItem + ITEMS_ON_PAGE * model.pagination.range;
            const pageItems = filteredRules.slice(firstItem, lastItem);
            const hasItems = pageItems.length > 0;

            res.items = pageItems.map((rule) => ImportRuleItem.render(rule));

            if (pagesCount > 1) {
                res.paginator = {
                    visible: true,
                    active: pageNum,
                    pages: pagesCount,
                };
            }

            res.showMoreBtn = {
                visible: hasItems && pageNum < model.pagination.pages,
            };
        } else if (isForm) {
            const titleToken = (model.state === 'create')
                ? 'import.rules.create'
                : 'import.rules.update';
            res.header.title = __(titleToken, App.view.locale);

            res.ruleForm = ImportRuleForm.getExpectedState(model.rule);
        }

        return res;
    }

    currentPage(model = this.model) {
        return model.pagination.page + model.pagination.range - 1;
    }

    getState(model = this.model) {
        return model.state;
    }

    isListState(model = this.model) {
        return (model.state === 'list');
    }

    isFormState(model = this.model) {
        return (model.state === 'create' || model.state === 'update');
    }

    /** Return expected import rule object */
    getExpectedRule() {
        assert(this.isFormState(), 'Invalid state');

        return this.content.ruleForm.getExpectedRule();
    }

    /** Returns validation result for expected import rule */
    validateRule() {
        assert(this.isFormState(), 'Invalid state');

        return this.content.ruleForm.validate();
    }

    isFirstPage() {
        assert(this.isListState(), 'Invalid state');

        return !this.content.paginator || this.content.paginator.isFirstPage();
    }

    isLastPage() {
        assert(this.isListState(), 'Invalid state');

        return !this.content.paginator || this.content.paginator.isLastPage();
    }

    async close() {
        await click(this.content.closeBtn);
    }

    onPageChanged(page) {
        assert(this.isListState(), 'Invalid state');
        assert(page >= 1 && page <= this.model.pagination.pages, `Invalid page: ${page}`);

        this.model.pagination.page = page;
        this.model.pagination.range = 1;
        return this.getExpectedState();
    }

    async goToFirstPage() {
        if (this.isFirstPage()) {
            return true;
        }

        const expected = this.onPageChanged(1);

        await this.performAction(() => this.content.paginator.goToFirstPage());

        return this.checkState(expected);
    }

    async goToLastPage() {
        if (this.isLastPage()) {
            return true;
        }

        const expected = this.onPageChanged(this.model.pagination.pages);

        await this.performAction(() => this.content.paginator.goToLastPage());

        return this.checkState(expected);
    }

    async goToPrevPage() {
        assert(!this.isFirstPage(), 'Can\'t go to previous page');

        const expected = this.onPageChanged(this.currentPage() - 1);

        await this.performAction(() => this.content.paginator.goToPrevPage());

        return this.checkState(expected);
    }

    async goToNextPage() {
        assert(!this.isLastPage(), 'Can\'t go to next page');

        const expected = this.onPageChanged(this.currentPage() + 1);

        await this.performAction(() => this.content.paginator.goToNextPage());

        return this.checkState(expected);
    }

    async showMore() {
        assert(this.isListState(), 'Invalid state');
        assert(!this.isLastPage(), 'Can\'t show more items');

        this.model.pagination.range += 1;
        const expected = this.getExpectedState();

        await this.performAction(() => click(this.content.showMoreBtn.elem));

        return this.checkState(expected);
    }

    async iteratePages() {
        assert(this.isListState(), 'Invalid state');

        if (!this.isFirstPage()) {
            await this.goToFirstPage();
        }

        while (!this.isLastPage()) {
            await this.goToNextPage();
        }
    }

    async inputSearch(value) {
        assert(this.isListState(), 'Invalid state');

        const strValue = value.toString();
        if (this.model.filter === strValue) {
            return true;
        }

        this.model.filter = strValue;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.searchField.input(strValue));

        return this.checkState();
    }

    async clearSearch() {
        assert(this.isListState(), 'Invalid state');

        if (this.model.filter === '') {
            return true;
        }

        this.model.filter = '';
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.searchField.clear());

        return this.checkState();
    }

    async createRule() {
        assert(this.isListState(), 'Invalid state');

        this.model.state = 'create';
        this.model.rule = {
            conditions: [],
            actions: [],
        };
        this.expectedState = this.getExpectedState();

        await click(this.content.header.createBtn);
        await waitForFunction(async () => {
            await this.parse();
            return this.model.state === 'create';
        });

        return this.checkState();
    }

    async openContextMenu(index) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.items, ind);

        assert(this.isListState(), 'Invalid state');

        this.model.contextMenuVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.items[ind].openMenu());

        return this.checkState(expected);
    }

    ruleToModel(rule) {
        const ruleConditions = rule.conditions.map((item) => {
            const condition = {
                fieldType: item.field_id,
                operator: item.operator,
                value: item.value,
                isFieldValue: hasFlag(item.flags, IMPORT_COND_OP_FIELD_FLAG),
            };

            if (ImportCondition.isDateField(item.field_id)) {
                condition.value = App.secondsToDateString(parseInt(condition.value, 10));
            }

            return condition;
        });

        const ruleActions = rule.actions.map((item) => ({
            actionType: item.action_id,
            value: item.value,
        }));

        return {
            id: rule.id,
            conditions: ruleConditions,
            actions: ruleActions,
        };
    }

    async updateRule(index) {
        await this.openContextMenu(index);

        this.model.state = 'update';
        const ruleItem = App.state.rules.getItemByIndex(index);
        this.model.rule = this.ruleToModel(ruleItem);
        this.model.contextMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.updateBtn.click());

        await waitForFunction(async () => {
            await this.parse();
            return this.model.state === 'update';
        });

        return this.checkState(expected);
    }

    async duplicateRule(index) {
        await this.openContextMenu(index);

        this.model.state = 'create';
        const ruleItem = App.state.rules.getItemByIndex(index);
        const { conditions, actions } = this.ruleToModel(ruleItem);
        this.model.rule = {
            conditions,
            actions,
        };

        this.model.contextMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.duplicateBtn.click());

        await waitForFunction(async () => {
            await this.parse();
            return this.model.state === 'create';
        });

        return this.checkState(expected);
    }

    async deleteRule(index) {
        await this.openContextMenu(index);

        this.model.contextMenuVisible = false;
        let expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        await this.performAction(() => wait(this.content.ruleDeletePopupId, { visible: true }));

        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete template warning popup not appear');

        const prevTime = this.model.renderTime;

        const id = App.state.rules.indexToId(index);
        App.state.deleteRules({ id });
        expected = this.getExpectedState();

        await this.content.delete_warning.clickOk();
        await wait(this.content.ruleDeletePopupId, { hidden: true });
        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && this.isListState()
                && prevTime !== this.model.renderTime
            );
        });

        await App.state.fetchAndTest();
        return this.checkState(expected);
    }

    async submitRule() {
        assert(this.isFormState(), 'Invalid state');

        const validation = this.validateRule();
        const isInvalid = (
            validation
            && !validation.valid
            && !('conditionIndex' in validation)
            && !('actionIndex' in validation)
        );
        const isInvalidCondition = (
            validation
            && !validation.valid
            && ('conditionIndex' in validation)
            && validation.conditionIndex !== -1
        );
        const isInvalidAction = (
            validation
            && !validation.valid
            && ('actionIndex' in validation)
            && validation.actionIndex !== -1
        );

        if (validation?.valid) {
            if (this.model.state === 'create') {
                const createResult = App.state.createRule(this.model.ruleItem);
                assert(createResult, 'Failed to update import rule');
            } else {
                const updateResult = App.state.updateRule(this.model.ruleItem);
                assert(updateResult, 'Failed to update import rule');
            }
            this.model.state = 'list';
        } else {
            this.model.rule.feedbackVisible = isInvalid;

            if (isInvalidCondition) {
                const invalidCondition = this.model.rule.conditions[validation.conditionIndex];
                invalidCondition.feedbackVisible = true;
            }

            if (isInvalidAction) {
                const invalidAction = this.model.rule.actions[validation.actionIndex];
                invalidAction.feedbackVisible = true;
            }
        }
        const expected = this.getExpectedState();

        const prevTime = this.model.renderTime;

        await this.content.ruleForm.submit();
        await waitForFunction(async () => {
            await this.parse();
            return (
                isInvalid
                || isInvalidCondition
                || isInvalidAction
                || (
                    !this.model.loading
                    && this.model.renderTime !== prevTime
                    && this.isListState()
                )
            );
        });

        await App.state.fetchAndTest();
        return this.checkState(expected);
    }

    async cancelRule() {
        assert(this.isFormState(), 'Invalid state');

        this.model.state = 'list';
        this.expectedState = this.getExpectedState();

        await this.content.ruleForm.cancel();
        await waitForFunction(async () => {
            await this.parse();
            return !this.model.loading && this.isListState();
        });

        return this.checkState();
    }
}
