import 'jezvejs/style';
import {
    ge,
    isObject,
    isFunction,
    removeChilds,
    show,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Checkbox } from 'jezvejs/Checkbox';
import { Offcanvas } from 'jezvejs/Offcanvas';

import * as apiTypes from '../../../../view/API/types.js';
import { App } from '../../../../view/Application/App.js';
import '../../../../view/Application/Application.scss';
import '../../utils/AdminView/AdminView.scss';
import { AdminView } from '../../utils/AdminView/AdminView.js';

import { Heading } from '../../../../view/Components/Heading/Heading.js';
import { InputField } from '../../../../view/Components/InputField/InputField.js';

import { ApiRequest } from './components/ApiRequest/ApiRequest.js';
import { ControllersMenu } from './components/ControllersMenu/ControllersMenu.js';

import { ApiRequestForm } from './components/Forms/Common/ApiRequestForm/ApiRequestForm.js';
import { ItemIdsForm } from './components/Forms/Common/ItemIdsForm/ItemIdsForm.js';
import { SetPositionForm } from './components/Forms/Common/SetPositionForm/SetPositionForm.js';

import { AccountForm } from './components/Forms/Accounts/AccountForm.js';
import { AccountsListForm } from './components/Forms/Accounts/AccountsListForm.js';
import { PersonsListForm } from './components/Forms/Persons/PersonsListForm.js';
import { PersonForm } from './components/Forms/Persons/PersonForm.js';
import { CategoriesListForm } from './components/Forms/Categories/CategoriesListForm.js';
import { CategoryForm } from './components/Forms/Categories/CategoryForm.js';
import { TransactionForm } from './components/Forms/Transactions/TransactionForm.js';
import { TransactionsListForm } from './components/Forms/Transactions/TransactionsListForm.js';
import { SetTransactionCategoryForm } from './components/Forms/Transactions/SetTransactionCategoryForm.js';
import { StatisticsForm } from './components/Forms/Transactions/StatisticsForm.js';
import { ScheduledTransactionForm } from './components/Forms/Schedule/ScheduledTransactionForm.js';
import { RemindersListForm } from './components/Forms/Reminders/RemindersListForm.js';
import { ImportTemplateForm } from './components/Forms/ImportTemplates/ImportTemplateForm.js';
import { ImportRuleForm } from './components/Forms/ImportRules/ImportRuleForm.js';
import { ImportConditionForm } from './components/Forms/ImportConditions/ImportConditionForm.js';
import { ImportActionForm } from './components/Forms/ImportActions/ImportActionForm.js';
import { CurrencyForm } from './components/Forms/Currencies/CurrencyForm.js';
import { IconForm } from './components/Forms/Icons/IconForm.js';
import { UserCurrencyForm } from './components/Forms/UserCurrencies/UserCurrencyForm.js';

import './ApiConsoleView.scss';

const defaultProps = {
    activeController: 'account',
    activeMethod: 'listAccForm',
};

/**
 * Admin currecny list view
 */
class AdminApiConsoleView extends AdminView {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.activeForm = null;

        this.defaultSubmitHandler = (e) => this.onFormSubmit(e);
    }

    /**
     * View initialization
     */
    onStart(...args) {
        super.onStart(...args);

        this.loadElementsByIds([
            'heading',
            'formsContainer',
            'apiMenu',
            'apiMenuContent',
            'apiMenuControls',
            'resultsHeading',
            'resultsContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: 'API console',
        });

        this.apiMenu = Offcanvas.create({
            content: this.apiMenu,
            className: 'navigation methods-menu',
        });

        // Show API menu button
        const toggleMethodsBtn = Button.create({
            className: 'action-button methods-toggle-btn',
            title: 'Methods',
            onClick: () => this.toggleMethodsMenu(),
        });
        this.heading.actionsContainer.append(toggleMethodsBtn.elem);

        // Hide API menu button
        const closeMethodsBtn = Button.create({
            icon: 'back',
            className: 'back-btn',
            onClick: () => this.hideMethodsMenu(),
        });
        this.apiMenuControls.prepend(closeMethodsBtn.elem);

        this.initCommonForms();
        this.initAccountForms();
        this.initPersonForms();
        this.initCategoryForms();
        this.initTransactionForms();
        this.initScheduledTransactionForms();
        this.initRemindersForms();
        this.initTemplateForms();
        this.initRuleForms();
        this.initConditionForms();
        this.initActionForms();
        this.initCurrencyForms();
        this.initIconForms();
        this.initUserForms();
        this.initUserCurrencyForms();
        this.initProfileForms();

        // API controllers menu
        this.controllersList = ControllersMenu.create({
            id: 'controllersList',
            activeController: this.props.activeController,
            activeMethod: this.props.activeMethod,
            onMethodSelect: (formId) => this.activateView(formId),
        });
        this.apiMenuContent.append(this.controllersList.elem);

        this.activateView(this.props.activeMethod);

        // Clear results button
        this.clearResultsBtn = Button.create({
            title: 'Clear',
            disabled: true,
            className: 'link-btn',
            onClick: () => this.clearResults(),
        });
        this.resultsHeading.append(this.clearResultsBtn.elem);
    }

    /** Initialization of forms for State API controller */
    initCommonForms() {
        const readStateForm = ApiRequestForm.create({
            id: 'readStateForm',
            title: 'Read state',
            action: this.getRequestURL('state'),
            onSubmit: this.defaultSubmitHandler,
        });

        const mainStateForm = ApiRequestForm.create({
            id: 'mainStateForm',
            title: 'Read main state',
            action: this.getRequestURL('state/main'),
            onSubmit: this.defaultSubmitHandler,
        });

        const dbVersionForm = ApiRequestForm.create({
            id: 'dbVersionForm',
            title: 'Read DB version',
            action: this.getRequestURL('state/version'),
            onSubmit: this.defaultSubmitHandler,
        });

        this.formsContainer.append(
            readStateForm.elem,
            mainStateForm.elem,
            dbVersionForm.elem,
        );
    }

    getRequestURL(apiMethod) {
        return `${App.baseURL}api/${apiMethod}`;
    }

    /** Initialization of forms for Account API controller */
    initAccountForms() {
        const listForm = AccountsListForm.create({
            id: 'listAccForm',
            onSubmit: this.getVerifyHandler(apiTypes.isAccountsArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readAccForm',
            title: 'Read accounts by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'account/', apiTypes.isAccountsArray)
            ),
        });

        const createForm = AccountForm.create({
            id: 'createAccForm',
            title: 'Create account',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = AccountForm.create({
            id: 'updateAccForm',
            title: 'Update account',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const showForm = ItemIdsForm.create({
            id: 'showAccForm',
            title: 'Show accounts',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('account/show'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        const hideForm = ItemIdsForm.create({
            id: 'hideAccForm',
            title: 'Hide accounts',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('account/hide'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        const delForm = ItemIdsForm.create({
            id: 'delAccForm',
            title: 'Delete accounts',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('account/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        const setPosForm = SetPositionForm.create({
            id: 'setAccPosForm',
            title: 'Set position of account',
            returnStateField: true,
            action: this.getRequestURL('account/setpos'),
            onSubmit: this.defaultSubmitHandler,
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            showForm.elem,
            hideForm.elem,
            delForm.elem,
            setPosForm.elem,
        );
    }

    /** Initialization of forms for Person API controller */
    initPersonForms() {
        const listForm = PersonsListForm.create({
            id: 'listPersonsForm',
            onSubmit: this.getVerifyHandler(apiTypes.isPersonsArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readPersonForm',
            title: 'Read persons by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'person/', apiTypes.isPersonsArray)
            ),
        });

        const createForm = PersonForm.create({
            id: 'createPersonForm',
            title: 'Create person',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = PersonForm.create({
            id: 'updatePersonForm',
            title: 'Update person',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const showForm = ItemIdsForm.create({
            id: 'showPersonForm',
            title: 'Show persons',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('person/show'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        const hideForm = ItemIdsForm.create({
            id: 'hidePersonForm',
            title: 'Hide persons',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('person/hide'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        const delForm = ItemIdsForm.create({
            id: 'delPersonForm',
            title: 'Delete persons',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('person/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        const setPosForm = SetPositionForm.create({
            id: 'setPersonPosForm',
            title: 'Set position of person',
            returnStateField: true,
            action: this.getRequestURL('person/setpos'),
            onSubmit: this.defaultSubmitHandler,
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            showForm.elem,
            hideForm.elem,
            delForm.elem,
            setPosForm.elem,
        );
    }

    /** Initialization of forms for Category API controller */
    initCategoryForms() {
        const listForm = CategoriesListForm.create({
            id: 'listCategoriesForm',
            onSubmit: this.getVerifyHandler(apiTypes.isCategoriesArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readCategoryForm',
            title: 'Read categories by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'category/', apiTypes.isCategoriesArray)
            ),
        });

        const createForm = CategoryForm.create({
            id: 'createCategoryForm',
            title: 'Create category',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = CategoryForm.create({
            id: 'updateCategoryForm',
            title: 'Update category',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delCategoryForm',
            title: 'Delete categories',
            method: 'post',
            additionalFields: [
                Checkbox.create({
                    label: 'Delete child categories',
                    name: 'removeChild',
                    className: 'checkbox-field form-row',
                }).elem,
            ],
            returnStateField: true,
            action: this.getRequestURL('category/delete'),
            onSubmit: (e) => this.onDeleteCategoriesSubmit(e),
        });

        const setPosForm = SetPositionForm.create({
            id: 'setCategoryPosForm',
            title: 'Set position of category',
            additionalFields: [
                InputField.create({
                    title: 'Parent category',
                    name: 'parent_id',
                    className: 'form-row',
                }).elem,
            ],
            returnStateField: true,
            action: this.getRequestURL('category/setpos'),
            onSubmit: this.defaultSubmitHandler,
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            delForm.elem,
            setPosForm.elem,
        );
    }

    /** Initialization of forms for Transaction API controller */
    initTransactionForms() {
        const listForm = TransactionsListForm.create({
            id: 'listTrForm',
            onSubmit: (e) => this.onListTransactionSubmit(e),
        });

        const readForm = ItemIdsForm.create({
            id: 'readTrForm',
            title: 'Read transactions by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'transaction/', apiTypes.isTransactionsArray)
            ),
        });

        const createForm = TransactionForm.create({
            id: 'createTrForm',
            title: 'Create transaction',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const createDebtForm = TransactionForm.create({
            id: 'createDebtForm',
            title: 'Create debt',
            isDebt: true,
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = TransactionForm.create({
            id: 'updateTrForm',
            title: 'Update transaction',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const updateDebtForm = TransactionForm.create({
            id: 'updateDebtForm',
            title: 'Update debt',
            isUpdate: true,
            isDebt: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delTrForm',
            title: 'Delete transactions',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('transaction/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        const setCategoryForm = SetTransactionCategoryForm.create({
            id: 'setTrCategoryForm',
            onSubmit: (e) => this.onSetCategorySubmit(e),
        });

        const setPosForm = SetPositionForm.create({
            id: 'setTrPosForm',
            title: 'Set position of transaction',
            returnStateField: true,
            action: this.getRequestURL('transaction/setpos'),
            onSubmit: this.defaultSubmitHandler,
        });

        const statisticsForm = StatisticsForm.create({
            id: 'statisticsForm',
            onSubmit: (e) => this.onStatisticsSubmit(e),
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            createDebtForm.elem,
            updateForm.elem,
            updateDebtForm.elem,
            delForm.elem,
            setPosForm.elem,
            setCategoryForm.elem,
            statisticsForm.elem,
        );
    }

    /** Initialization of forms for Scheduled Transaction API controller */
    initScheduledTransactionForms() {
        const listForm = ApiRequestForm.create({
            id: 'listScheduledTrForm',
            action: this.getRequestURL('schedule/list'),
            onSubmit: this.getVerifyHandler(apiTypes.isScheduledTransactionsArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readScheduledTrForm',
            title: 'Read scheduled transactions by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'schedule/', apiTypes.isScheduledTransactionsArray)
            ),
        });

        const createForm = ScheduledTransactionForm.create({
            id: 'createScheduledTrForm',
            title: 'Create scheduled transaction',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const createDebtForm = ScheduledTransactionForm.create({
            id: 'createScheduledDebtForm',
            title: 'Create scheduled debt',
            isDebt: true,
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = ScheduledTransactionForm.create({
            id: 'updateScheduledTrForm',
            title: 'Update scheduled transaction',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const updateDebtForm = ScheduledTransactionForm.create({
            id: 'updateScheduledDebtForm',
            title: 'Update scheduled debt',
            isUpdate: true,
            isDebt: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delScheduledTrForm',
            title: 'Delete scheduled transactions',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('schedule/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            createDebtForm.elem,
            updateForm.elem,
            updateDebtForm.elem,
            delForm.elem,
        );
    }

    /** Initialization of forms for Reminder API controller */
    initRemindersForms() {
        const listForm = RemindersListForm.create({
            id: 'listReminderForm',
            title: 'List reminders',
            onSubmit: this.getVerifyHandler(apiTypes.isRemindersArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readReminderForm',
            title: 'Read reminders by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'reminder/', apiTypes.isRemindersArray)
            ),
        });

        const confirmForm = ApiRequestForm.create({
            id: 'confirmReminderForm',
            title: 'Confirm reminder',
            method: 'post',
            action: this.getRequestURL('reminder/confirm/'),
            inputFields: [
                { title: 'Id', name: 'id' },
            ],
            optionalFields: [
                { title: 'Transaction id', name: 'transaction_id' },
            ],
            returnStateField: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const cancelForm = ApiRequestForm.create({
            id: 'cancelReminderForm',
            title: 'Cancel reminder',
            method: 'post',
            action: this.getRequestURL('reminder/cancel/'),
            inputFields: [
                { title: 'Id', name: 'id' },
            ],
            returnStateField: true,
            onSubmit: this.defaultSubmitHandler,
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            confirmForm.elem,
            cancelForm.elem,
        );
    }

    /** Initialization of forms for Import template API controller */
    initTemplateForms() {
        const listForm = ApiRequestForm.create({
            id: 'listTplForm',
            title: 'List import templates',
            action: this.getRequestURL('importtpl/list/'),
            onSubmit: this.getVerifyHandler(apiTypes.isTemplatesArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readTplForm',
            title: 'Read templates by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'importtpl/', apiTypes.isTemplatesArray)
            ),
        });

        const createForm = ImportTemplateForm.create({
            id: 'createTplForm',
            title: 'Create import template',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = ImportTemplateForm.create({
            id: 'updateTplForm',
            title: 'Update import template',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delTplForm',
            title: 'Delete import templates',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('importtpl/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            delForm.elem,
        );
    }

    /** Initialization of forms for Import rules API controller */
    initRuleForms() {
        const listForm = ApiRequestForm.create({
            id: 'listRuleForm',
            title: 'List import rules',
            action: this.getRequestURL('importrule/list/'),
            additionalFields: [
                Checkbox.create({
                    label: 'List for all users',
                    name: 'full',
                    className: 'checkbox-field form-row',
                }).elem,
                Checkbox.create({
                    label: 'Return extended objects',
                    name: 'extended',
                    className: 'checkbox-field form-row',
                }).elem,
            ],
            onSubmit: this.getVerifyHandler(apiTypes.isImportRulesArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readRuleForm',
            title: 'Read import rules by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'importrule/', apiTypes.isImportRulesArray)
            ),
        });

        const createForm = ImportRuleForm.create({
            id: 'createRuleForm',
            title: 'Create import rule',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = ImportRuleForm.create({
            id: 'updateRuleForm',
            title: 'Update import rule',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delRuleForm',
            title: 'Delete import rules',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('importrule/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            delForm.elem,
        );
    }

    /** Initialization of forms for Import conditions API controller */
    initConditionForms() {
        const listForm = ApiRequestForm.create({
            id: 'listCondForm',
            title: 'List import conditions',
            action: this.getRequestURL('importcond/list/'),
            optionalFields: [
                { title: 'Import rule id', name: 'rule' },
            ],
            additionalFields: [
                Checkbox.create({
                    label: 'List for all users',
                    name: 'full',
                    className: 'checkbox-field form-row',
                }).elem,
            ],
            onSubmit: this.getVerifyHandler(apiTypes.isConditionsArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readCondForm',
            title: 'Read import conditions by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'importcond/', apiTypes.isConditionsArray)
            ),
        });

        const createForm = ImportConditionForm.create({
            id: 'createCondForm',
            title: 'Create import condition',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = ImportConditionForm.create({
            id: 'updateCondForm',
            title: 'Update import condition',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delCondForm',
            title: 'Delete import conditions',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('importcond/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            delForm.elem,
        );
    }

    /** Initialization of forms for Import actions API controller */
    initActionForms() {
        const listForm = ApiRequestForm.create({
            id: 'listActForm',
            title: 'List import actions',
            action: this.getRequestURL('importaction/list/'),
            optionalFields: [
                { title: 'Import rule id', name: 'rule' },
            ],
            additionalFields: [
                Checkbox.create({
                    label: 'List for all users',
                    name: 'full',
                    className: 'checkbox-field form-row',
                }).elem,
            ],
            onSubmit: this.getVerifyHandler(apiTypes.isActionsArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readActForm',
            title: 'Read import actions by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'importaction/', apiTypes.isActionsArray)
            ),
        });

        const createForm = ImportActionForm.create({
            id: 'createActForm',
            title: 'Create import action',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = ImportActionForm.create({
            id: 'updateActForm',
            title: 'Update import action',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delActForm',
            title: 'Delete import actions',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('importaction/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            delForm.elem,
        );
    }

    /** Initialization of forms for Currency API controller */
    initCurrencyForms() {
        const listForm = ApiRequestForm.create({
            id: 'listCurrForm',
            title: 'List currencies',
            action: this.getRequestURL('currency/list/'),
            onSubmit: this.getVerifyHandler(apiTypes.isCurrenciesArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readCurrForm',
            title: 'Read currencies by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'currency/', apiTypes.isCurrenciesArray)
            ),
        });

        const createForm = CurrencyForm.create({
            id: 'createCurrForm',
            title: 'Create currency',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = CurrencyForm.create({
            id: 'updateCurrForm',
            title: 'Update currency',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delCurrForm',
            title: 'Delete currencies',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('currency/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            delForm.elem,
        );
    }

    /** Initialization of forms for Icon API controller */
    initIconForms() {
        const listForm = ApiRequestForm.create({
            id: 'listIconForm',
            title: 'List icons',
            action: this.getRequestURL('icon/list/'),
            onSubmit: this.getVerifyHandler(apiTypes.isIconsArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readIconForm',
            title: 'Read icons by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'icon/', apiTypes.isIconsArray)
            ),
        });

        const createForm = IconForm.create({
            id: 'createIconForm',
            title: 'Create icon',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = IconForm.create({
            id: 'updateIconForm',
            title: 'Update icon',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delIconForm',
            title: 'Delete icons',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('icon/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            delForm.elem,
        );
    }

    /** Initialization of forms for User API controller */
    initUserForms() {
        const loginForm = ApiRequestForm.create({
            id: 'loginForm',
            title: 'Login',
            action: this.getRequestURL('login/'),
            method: 'post',
            inputFields: [
                { title: 'Login', name: 'login' },
                { title: 'Password', name: 'password' },
            ],
            onSubmit: this.defaultSubmitHandler,
        });

        const logoutForm = ApiRequestForm.create({
            id: 'logoutForm',
            title: 'Log out',
            action: this.getRequestURL('logout'),
            method: 'post',
            onSubmit: this.defaultSubmitHandler,
        });

        const registerForm = ApiRequestForm.create({
            id: 'registerForm',
            title: 'Registration',
            action: this.getRequestURL('register/'),
            method: 'post',
            inputFields: [
                { title: 'Login', name: 'login' },
                { title: 'Password', name: 'password' },
                { title: 'Name', name: 'name' },
            ],
            onSubmit: this.defaultSubmitHandler,
        });

        this.formsContainer.append(
            loginForm.elem,
            logoutForm.elem,
            registerForm.elem,
        );
    }

    /** Initialization of forms for User Currencies API controller */
    initUserCurrencyForms() {
        const listForm = ApiRequestForm.create({
            id: 'listUserCurrencyForm',
            title: 'List currencies',
            action: this.getRequestURL('usercurrency/list/'),
            optionalFields: [
                { title: 'Currency id', name: 'curr_id' },
            ],
            onSubmit: this.getVerifyHandler(apiTypes.isUserCurrenciesArray),
        });

        const readForm = ItemIdsForm.create({
            id: 'readUserCurrencyForm',
            title: 'Read user currencies by ids',
            onSubmit: (e) => (
                this.onReadItemsSubmit(e, 'usercurrency/', apiTypes.isUserCurrenciesArray)
            ),
        });

        const createForm = UserCurrencyForm.create({
            id: 'createUserCurrencyForm',
            title: 'Create user currency',
            onSubmit: this.getVerifyHandler(apiTypes.isCreateResult),
        });

        const updateForm = UserCurrencyForm.create({
            id: 'updateUserCurrencyForm',
            title: 'Update user currency',
            isUpdate: true,
            onSubmit: this.defaultSubmitHandler,
        });

        const delForm = ItemIdsForm.create({
            id: 'delUserCurrencyForm',
            title: 'Delete user currencies',
            method: 'post',
            returnStateField: true,
            action: this.getRequestURL('usercurrency/delete'),
            onSubmit: (e) => this.onSubmitItemIds(e),
        });

        const setPosForm = SetPositionForm.create({
            id: 'setUserCurrencyPosForm',
            title: 'Set position of user currency',
            returnStateField: true,
            action: this.getRequestURL('usercurrency/setpos'),
            onSubmit: this.defaultSubmitHandler,
        });

        this.formsContainer.append(
            listForm.elem,
            readForm.elem,
            createForm.elem,
            updateForm.elem,
            delForm.elem,
            setPosForm.elem,
        );
    }

    /** Initialization of forms for Profile API controller */
    initProfileForms() {
        const readForm = ApiRequestForm.create({
            id: 'readProfileForm',
            title: 'Read profile',
            action: this.getRequestURL('profile/read'),
            onSubmit: this.getVerifyHandler(apiTypes.isProfile),
        });

        const changeNameForm = ApiRequestForm.create({
            id: 'changeNameForm',
            title: 'Change name',
            action: this.getRequestURL('profile/changename'),
            method: 'post',
            inputFields: [
                { title: 'Name', name: 'name' },
            ],
            onSubmit: this.defaultSubmitHandler,
        });

        const changePwdForm = ApiRequestForm.create({
            id: 'changePwdForm',
            title: 'Change password',
            action: this.getRequestURL('profile/changepass'),
            method: 'post',
            inputFields: [
                { title: 'Current password', name: 'current' },
                { title: 'New password', name: 'new' },
            ],
            onSubmit: this.defaultSubmitHandler,
        });

        const updateSettingsForm = ApiRequestForm.create({
            id: 'updateSettingsForm',
            title: 'Update settings',
            action: this.getRequestURL('profile/updateSettings'),
            method: 'post',
            inputFields: [
                { title: 'Setting name', name: 'name' },
                { title: 'New value', name: 'value' },
            ],
            onSubmit: (e) => this.onUpdateSettingsSubmit(e),
        });

        const resetForm = ApiRequestForm.create({
            id: 'resetForm',
            title: 'Reset data',
            action: this.getRequestURL('profile/reset'),
            method: 'post',
            additionalFields: [
                Checkbox.create({
                    label: 'Currencies',
                    name: 'currencies',
                    className: 'checkbox-field form-row',
                }).elem,
                Checkbox.create({
                    label: 'Accounts',
                    name: 'accounts',
                    className: 'checkbox-field form-row',
                }).elem,
                Checkbox.create({
                    label: 'Persons',
                    name: 'persons',
                    className: 'checkbox-field form-row',
                }).elem,
                Checkbox.create({
                    label: 'Categories',
                    name: 'categories',
                    className: 'checkbox-field form-row',
                }).elem,
                Checkbox.create({
                    label: 'Transactions',
                    name: 'transactions',
                    className: 'checkbox-field form-row',
                }).elem,
                Checkbox.create({
                    label: 'Keep current balance of accounts',
                    name: 'keepbalance',
                    className: 'checkbox-field form-row suboption',
                }).elem,
                Checkbox.create({
                    label: 'Scheduled transactions',
                    name: 'schedule',
                    className: 'checkbox-field form-row',
                }).elem,
                Checkbox.create({
                    label: 'Import templates',
                    name: 'importtpl',
                    className: 'checkbox-field form-row',
                }).elem,
                Checkbox.create({
                    label: 'Import rules',
                    name: 'importrules',
                    className: 'checkbox-field form-row',
                }).elem,
            ],
            onSubmit: this.defaultSubmitHandler,
        });

        this.formsContainer.append(
            readForm.elem,
            changeNameForm.elem,
            changePwdForm.elem,
            updateSettingsForm.elem,
            resetForm.elem,
        );
    }

    /**
     * Return form submit event handler binded to specified verification function
     * @param {function} verifyFunc
     */
    getVerifyHandler(verifyFunc) {
        return (e) => this.onFormSubmit(e, verifyFunc);
    }

    /**
     * Activate view
     * @param {string} viewTarget
     */
    activateView(viewTarget) {
        if (!viewTarget) {
            return;
        }

        const newForm = ge(viewTarget);
        if (newForm) {
            if (this.activeForm) {
                this.activeForm.classList.remove('active');
            }
            newForm.classList.add('active');
            this.activeForm = newForm;
        }
    }

    /** Show API methods menu */
    toggleMethodsMenu() {
        this.apiMenu.toggle();
    }

    /** Hides API methods menu */
    hideMethodsMenu() {
        this.apiMenu.close();
    }

    /**
     * Clear all items from request log container
     */
    clearResults() {
        removeChilds(this.resultsContainer);
        this.clearResultsBtn.enable(false);
    }

    /**
     * Form submit event handler
     * @param {Event} e - submit event object
     * @param {Function} verifyCallback - response verification callback
     */
    onFormSubmit(e, verifyCallback) {
        e.preventDefault();

        const formEl = e.target;
        const frmData = this.getFormData(formEl);
        if (!frmData) {
            return;
        }

        if (frmData.returnState?.length > 0) {
            frmData.returnState = JSON.parse(frmData.returnState);
        }

        const request = {
            httpMethod: formEl.method,
            method: formEl.action,
            data: frmData,
            verify: verifyCallback,
        };

        this.apiRequest(request);
    }

    /**
     * Checkbox change event handler
     * @param {Event} e - submit event object
     */
    onCheck(e) {
        if (!e.target || !e.target.form) {
            return;
        }

        const elName = e.target.dataset.target;
        if (!elName) {
            return;
        }

        const disableElements = !e.target.checked;
        const frm = e.target.form;
        if (frm.elements[elName]) {
            const el = frm.elements[elName];
            if (el instanceof NodeList) {
                for (let i = 0; i < el.length; i += 1) {
                    el[i].disabled = disableElements;
                    this.showFormField(el[i], !disableElements);
                }
            } else {
                el.disabled = disableElements;
                this.showFormField(el, !disableElements);
            }
        }
    }

    /**
     * Shows/hides specified form field
     * @param {Element} elem
     * @param {boolean} value
     * @returns
     */
    showFormField(elem, value) {
        if (!elem) {
            return;
        }

        let el = elem;

        const inputType = elem.type?.toLowerCase();
        if (inputType === 'radio') {
            el = elem.closest('.radio');
        } else if (inputType === 'checkbox') {
            el = elem.closest('.checkbox');
        }

        show(el, value);
    }

    /**
     * Concatenate specified ids to URL base
     * @param {*} values
     */
    parseIds(values) {
        if (typeof values !== 'string') {
            throw new Error('Invalid values specified');
        }

        // Check correctness of ids
        const ids = values.split(',');

        return { id: ids };
    }

    /**
     * Check request data is single id case { id : value | [ value ] }
     * @param {object} data - request data object
     * @returns id value if match and false overwise
     */
    singleIdData(data) {
        const keys = Object.keys(data);
        if (keys.length !== 1 && keys[0] !== 'id') {
            return false;
        }

        if (!Array.isArray(data.id)) {
            return data.id;
        }

        if (data.id.length !== 1) {
            return false;
        }

        return data.id[0];
    }

    /**
     * Convert API request object to request item
     * @param {object} request - API request object
     * @param {boolean} isPOST - if set to true POST request method is assumed
     */
    getRequestItem(request, isPOST) {
        const { baseURL } = App;
        const prefix = `${baseURL}api/`;

        if (!isObject(request)) {
            throw new Error('Invalid request');
        }
        if (typeof request.method !== 'string' || !request.method.length) {
            throw new Error('Invalid API request method');
        }

        const apiMethodURL = (request.method.includes(prefix))
            ? request.method
            : prefix + request.method;

        const singleId = (request.data && !isPOST)
            ? this.singleIdData(request.data)
            : false;

        const requestURL = (singleId)
            ? `${apiMethodURL}${singleId}`
            : apiMethodURL;

        const url = new URL(requestURL);
        const res = {
            url,
            options: {
                headers: ('headers' in request) ? request.headers : {},
            },
        };

        if (request.data) {
            if (isPOST) {
                res.options.method = 'POST';
                res.options.body = JSON.stringify(request.data);
                res.options.headers['Content-Type'] = 'application/json';
            } else if (!singleId) {
                Object.entries(request.data).forEach(([name, value]) => {
                    if (Array.isArray(value)) {
                        const arrayName = `${name}[]`;
                        value.forEach((item) => url.searchParams.append(arrayName, item));
                    } else if (typeof value !== 'undefined' && value !== null) {
                        url.searchParams.set(name, value.toString());
                    }
                });
            }
        }

        return res;
    }

    /**
     * Send POST request to API
     * @param {object} request - API request object
     */
    async apiRequest(request) {
        const isPOST = request.httpMethod?.toLowerCase() === 'post';
        const requestItem = this.getRequestItem(request, isPOST);
        const reqContainer = ApiRequest.create({ request: requestItem });

        this.resultsContainer.append(reqContainer.elem);
        this.clearResultsBtn.enable();

        try {
            const response = await fetch(requestItem.url, requestItem.options);
            const text = await response.text();

            const apiResult = JSON.parse(text);
            let res = false;
            let resText = 'Fail result';

            if (apiResult?.result === 'ok') {
                res = isFunction(request.verify)
                    ? request.verify(apiResult.data)
                    : true;

                resText = (res) ? 'Valid response' : 'Invalid response format';
            }

            reqContainer.addResult(res, resText, text);
        } catch (e) {
            /* eslint-disable-next-line no-console */
            console.log(e.message);
            reqContainer.addResult(false, 'Fail to parse response from server', null);
        }
    }

    /** Send read items request */
    onReadItemsSubmit(e, method, verifyFunc) {
        if (typeof method !== 'string') {
            throw new Error('Invalid parameters');
        }

        e.preventDefault();
        const itemsInp = e.target.elements.id;
        if (!itemsInp) {
            return;
        }

        this.apiRequest({
            method,
            data: this.parseIds(itemsInp.value),
            verify: verifyFunc,
        });
    }

    /** Send delete items request */
    onSubmitItemIds(e, verifyCallback) {
        e.preventDefault();

        const formEl = e.target;
        const frmData = this.getFormData(formEl);
        if (!frmData) {
            return;
        }

        frmData.id = this.parseIds(frmData.id).id;

        if (typeof frmData.returnState === 'string') {
            frmData.returnState = JSON.parse(frmData.returnState);
        }

        const request = {
            httpMethod: formEl.method,
            method: formEl.action,
            data: frmData,
            verify: verifyCallback,
        };

        this.apiRequest(request);
    }

    /** Update settings form 'submit' event handler */
    onUpdateSettingsSubmit(e) {
        e.preventDefault();

        const frmData = this.getFormData(e.target);
        const { name, value } = frmData;

        if (name.length === 0) {
            return;
        }

        this.apiRequest({
            httpMethod: 'POST',
            method: 'profile/updateSettings',
            data: {
                [name]: value,
            },
        });
    }

    /** List transactions form 'submit' event handler */
    onListTransactionSubmit(e) {
        e.preventDefault();

        const frmData = this.getFormData(e.target);
        if (!frmData) {
            return;
        }

        if (('type' in frmData) && frmData.type) {
            frmData.type = this.parseIds(frmData.type).id;
        }
        if ('accounts' in frmData) {
            frmData.accounts = this.parseIds(frmData.accounts).id;
        }
        if ('persons' in frmData) {
            frmData.persons = this.parseIds(frmData.persons).id;
        }
        if ('categories' in frmData) {
            frmData.categories = this.parseIds(frmData.categories).id;
        }

        this.apiRequest({
            method: 'transaction/list',
            data: frmData,
            verify: apiTypes.isTransactionsList,
        });
    }

    /** Statistics form 'submit' event handler */
    onStatisticsSubmit(e) {
        e.preventDefault();

        const frmData = this.getFormData(e.target);
        if (!frmData) {
            return;
        }

        if (('type' in frmData) && frmData.type) {
            frmData.type = this.parseIds(frmData.type).id;
        }
        if ('accounts' in frmData) {
            frmData.accounts = this.parseIds(frmData.accounts).id;
        }
        if ('categories' in frmData) {
            frmData.categories = this.parseIds(frmData.categories).id;
        }

        this.apiRequest({
            method: 'transaction/statistics',
            data: frmData,
            verify: apiTypes.isStatistics,
        });
    }

    /** Set category 'submit' event handler */
    onSetCategorySubmit(e) {
        e.preventDefault();

        const frmData = this.getFormData(e.target);
        if (!frmData) {
            return;
        }

        frmData.id = this.parseIds(frmData.id).id;

        if (typeof frmData.returnState === 'string') {
            frmData.returnState = JSON.parse(frmData.returnState);
        }

        this.apiRequest({
            httpMethod: 'post',
            method: 'transaction/setCategory',
            data: frmData,
        });
    }

    /** Send delete categories request */
    onDeleteCategoriesSubmit(e, verifyCallback) {
        e.preventDefault();

        const formEl = e.target;
        const frmData = this.getFormData(formEl);
        if (!frmData) {
            return;
        }

        frmData.id = this.parseIds(frmData.id).id;
        frmData.removeChild = !!frmData.removeChild;

        if (typeof frmData.returnState === 'string') {
            frmData.returnState = JSON.parse(frmData.returnState);
        }

        const request = {
            httpMethod: formEl.method,
            method: formEl.action,
            data: frmData,
            verify: verifyCallback,
        };

        this.apiRequest(request);
    }

    /**
     * Import rule form submit event handler
     * @param {Event} e - submit event object
     * @param {Function} verifyCallback - response verification callback
     */
    onRuleFormSubmit(e, verifyCallback) {
        e.preventDefault();

        const formEl = e.target;
        const frmData = this.getFormData(formEl);
        if (!frmData) {
            return;
        }

        if (typeof frmData.conditions === 'string') {
            frmData.conditions = JSON.parse(frmData.conditions);
        }
        if (typeof frmData.actions === 'string') {
            frmData.actions = JSON.parse(frmData.actions);
        }
        if (typeof frmData.returnState === 'string') {
            frmData.returnState = JSON.parse(frmData.returnState);
        }

        const request = {
            httpMethod: formEl.method,
            method: formEl.action,
            data: frmData,
            verify: verifyCallback,
        };

        this.apiRequest(request);
    }
}

App.createView(AdminApiConsoleView);
