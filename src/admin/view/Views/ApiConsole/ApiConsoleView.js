import 'jezvejs/style';
import 'jezvejs/style/Checkbox';
import 'jezvejs/style/Radio';
import {
    ge,
    enable,
    setEvents,
    isObject,
    isFunction,
    removeChilds,
} from 'jezvejs';
import { Offcanvas } from 'jezvejs/Offcanvas';
import * as apiTypes from '../../../../view/js/api/types.js';
import { Application } from '../../../../view/js/Application.js';
import '../../../../view/css/app.scss';
import '../../css/admin.scss';
import { AdminView } from '../../js/AdminView.js';
import { ApiRequest } from './components/ApiRequest/ApiRequest.js';
import './style.scss';

/**
 * Admin currecny list view
 */
class AdminApiConsoleView extends AdminView {
    constructor(...args) {
        super(...args);

        this.activeController = null;
        this.activeFormLink = null;
        this.activeForm = null;
    }

    /**
     * View initialization
     */
    onStart(...args) {
        super.onStart(...args);

        const apiMenuContainer = ge('apiMenu');
        this.apiMenu = Offcanvas.create({
            content: apiMenuContainer,
            className: 'navigation methods-menu',
        });

        this.toggleMethodsBtn = ge('toggleMethodsBtn');
        setEvents(this.toggleMethodsBtn, { click: () => this.toggleMethodsMenu() });
        this.closeMethodsBtn = apiMenuContainer.querySelector('.navigation__close-btn');
        setEvents(this.closeMethodsBtn, { click: () => this.hideMethodsMenu() });

        this.controllersList = ge('controllersList');
        if (!this.controllersList) {
            throw new Error('Fail to init view');
        }
        setEvents(this.controllersList, { click: (e) => this.onContrClick(e) });

        this.activeForm = document.querySelector('.request-data-form.active');
        this.activeController = document.querySelector('#controllersList > li.active');
        this.activeFormLink = document.querySelector('#controllersList > li.active > .sub-menu-list > li.active');

        this.resultsContainer = ge('results');
        this.clearResultsBtn = ge('clearResultsBtn');
        if (!this.resultsContainer || !this.clearResultsBtn) {
            throw new Error('Fail to init view');
        }

        setEvents(this.clearResultsBtn, { click: () => this.clearResults() });

        this.initCommonForms();
        this.initAccountForms();
        this.initPersonForms();
        this.initCategoryForms();
        this.initTransactionForms();
        this.initTemplateForms();
        this.initRuleForms();
        this.initConditionForms();
        this.initActionForms();
        this.initCurrencyForms();
        this.initIconForms();
        this.initUserForms();
        this.initProfileForms();
    }

    /** Initialization of checkboxes of specified form */
    initCheckboxes(form) {
        const checkboxes = Array.from(form.querySelectorAll('input[type="checkbox"]'));
        checkboxes.forEach((elem) => setEvents(elem, { change: (e) => this.onCheck(e) }));
    }

    /** Initialization of forms for State API controller */
    initCommonForms() {
        const readStateForm = document.querySelector('#readStateForm > form');
        if (!readStateForm) {
            throw new Error('Fail to init view');
        }
        setEvents(readStateForm, { submit: (e) => this.onFormSubmit(e) });

        const mainStateForm = document.querySelector('#mainStateForm > form');
        if (!mainStateForm) {
            throw new Error('Fail to init view');
        }
        setEvents(mainStateForm, { submit: (e) => this.onFormSubmit(e) });
    }

    /** Initialization of forms for Account API controller */
    initAccountForms() {
        const listAccForm = document.querySelector('#listAccForm > form');
        if (!listAccForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listAccForm, { submit: this.getVerifyHandler(apiTypes.isAccountsArray) });
        this.initCheckboxes(listAccForm);

        const readaccbtn = ge('readaccbtn');
        if (!readaccbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readaccbtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readaccid', 'account/', apiTypes.isAccountsArray)
            ),
        });

        const createAccForm = document.querySelector('#createAccForm > form');
        if (!createAccForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createAccForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updateAccForm = document.querySelector('#updateAccForm > form');
        if (!updateAccForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateAccForm, { submit: (e) => this.onFormSubmit(e) });

        const delaccbtn = ge('delaccbtn');
        if (!delaccbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delaccbtn, { click: (e) => this.onDeleteItemsSubmit(e, 'delaccounts', 'account/delete') });

        // Set account position form
        const setPosForm = document.querySelector('#setAccPosForm > form');
        if (!setPosForm) {
            throw new Error('Fail to init view');
        }
        setEvents(setPosForm, { submit: (e) => this.onFormSubmit(e) });
    }

    /** Initialization of forms for Person API controller */
    initPersonForms() {
        const listPersonsForm = document.querySelector('#listPersonsForm > form');
        if (!listPersonsForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listPersonsForm, { submit: this.getVerifyHandler(apiTypes.isPersonsArray) });
        this.initCheckboxes(listPersonsForm);

        const readpersonbtn = ge('readpersonbtn');
        if (!readpersonbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readpersonbtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_person_id', 'person/', apiTypes.isPersonsArray)
            ),
        });

        const createPersonForm = document.querySelector('#createPersonForm > form');
        if (!createPersonForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createPersonForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updatePersonForm = document.querySelector('#updatePersonForm > form');
        if (!updatePersonForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updatePersonForm, { submit: (e) => this.onFormSubmit(e) });

        const delpersonbtn = ge('delpersonbtn');
        if (!delpersonbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delpersonbtn, { click: (e) => this.onDeleteItemsSubmit(e, 'delpersons', 'person/delete') });

        // Set person position form
        const setPosForm = document.querySelector('#setPersonPosForm > form');
        if (!setPosForm) {
            throw new Error('Fail to init view');
        }
        setEvents(setPosForm, { submit: (e) => this.onFormSubmit(e) });
    }

    /** Initialization of forms for Category API controller */
    initCategoryForms() {
        const listCategoriesForm = document.querySelector('#listCategoriesForm > form');
        if (!listCategoriesForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listCategoriesForm, {
            submit: this.getVerifyHandler(apiTypes.isCategoriesArray),
        });
        this.initCheckboxes(listCategoriesForm);

        const readCategoryBtn = ge('readCategoryBtn');
        if (!readCategoryBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readCategoryBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_category_id', 'category/', apiTypes.isCategoriesArray)
            ),
        });

        const createCategoryForm = document.querySelector('#createCategoryForm > form');
        if (!createCategoryForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createCategoryForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updateCategoryForm = document.querySelector('#updateCategoryForm > form');
        if (!updateCategoryForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateCategoryForm, { submit: (e) => this.onFormSubmit(e) });

        const delCategoriesBtn = ge('delCategoriesBtn');
        if (!delCategoriesBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delCategoriesBtn, {
            click: (e) => this.onDeleteCategoriesSubmit(e, 'delCategories', 'category/delete'),
        });

        // Set category position form
        const setPosForm = document.querySelector('#setCategoryPosForm > form');
        if (!setPosForm) {
            throw new Error('Fail to init view');
        }
        setEvents(setPosForm, { submit: (e) => this.onFormSubmit(e) });
    }

    /** Initialization of forms for Transaction API controller */
    initTransactionForms() {
        // Transactions list form
        const listTrForm = document.querySelector('#listTrForm > form');
        if (!listTrForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listTrForm, { submit: (e) => this.onListTransactionSubmit(e) });
        this.initCheckboxes(listTrForm);

        // Read transactions by ids form
        const readtransbtn = ge('readtransbtn');
        if (!readtransbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readtransbtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_trans_id', 'transaction/', apiTypes.isTransactionsArray)
            ),
        });

        // Create transaction form
        const createTrForm = document.querySelector('#createTrForm > form');
        if (!createTrForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createTrForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        // Create debt transaction form
        const createDebtForm = document.querySelector('#createDebtForm > form');
        if (!createDebtForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createDebtForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        // Update transaction form
        const updateTrForm = document.querySelector('#updateTrForm > form');
        if (!updateTrForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateTrForm, { submit: (e) => this.onFormSubmit(e) });

        // Update debt transaction form
        const updateDebtForm = document.querySelector('#updateDebtForm > form');
        if (!updateDebtForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateDebtForm, { submit: (e) => this.onFormSubmit(e) });

        // Delete transactions form
        const deltransbtn = ge('deltransbtn');
        if (!deltransbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(deltransbtn, {
            click: (e) => this.onDeleteItemsSubmit(e, 'deltransactions', 'transaction/delete'),
        });

        // Set transactions category form
        const setTrCategoryForm = document.querySelector('#setTrCategoryForm > form');
        if (!setTrCategoryForm) {
            throw new Error('Fail to init view');
        }
        setEvents(setTrCategoryForm, { submit: (e) => this.onSetCategorySubmit(e) });

        // Set transaction position form
        const setTrPosForm = document.querySelector('#setTrPosForm > form');
        if (!setTrPosForm) {
            throw new Error('Fail to init view');
        }
        setEvents(setTrPosForm, { submit: (e) => this.onFormSubmit(e) });

        // Statistics form
        const statisticsForm = document.querySelector('#statisticsForm > form');
        if (!statisticsForm) {
            throw new Error('Fail to init view');
        }
        setEvents(statisticsForm, { submit: (e) => this.onStatisticsSubmit(e) });
        this.initCheckboxes(statisticsForm);
        const statisticsFilter = ge('statistics-filter');
        setEvents(statisticsFilter, {
            change: () => {
                const { value } = statisticsFilter;
                enable('statistics_curr', (value === 'currency'));
                enable('statistics_acc', (value === 'account'));
                enable('statistics_cat', (value === 'account'));
            },
        });
    }

    /** Initialization of forms for Import template API controller */
    initTemplateForms() {
        const listForm = document.querySelector('#listTplForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listForm, { submit: this.getVerifyHandler(apiTypes.isTemplatesArray) });

        const readBtn = ge('readtplbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readtplid', 'importtpl/', apiTypes.isTemplatesArray)
            ),
        });

        const createForm = document.querySelector('#createTplForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updateForm = document.querySelector('#updateTplForm > form');
        if (!updateForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateForm, { submit: (e) => this.onFormSubmit(e) });

        const delBtn = ge('deltplbtn');
        if (!delBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delBtn, {
            click: (e) => (
                this.onDeleteItemsSubmit(e, 'deltemplates', 'importtpl/delete')
            ),
        });
    }

    /** Initialization of forms for Import rules API controller */
    initRuleForms() {
        const listForm = document.querySelector('#listRuleForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listForm, { submit: this.getVerifyHandler(apiTypes.isImportRulesArray) });

        const readBtn = ge('readrulebtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readruleid', 'importrule/', apiTypes.isImportRulesArray)
            ),
        });

        const createForm = document.querySelector('#createRuleForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updateForm = document.querySelector('#updateRuleForm > form');
        if (!updateForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateForm, { submit: (e) => this.onFormSubmit(e) });

        const delBtn = ge('delrulebtn');
        if (!delBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delBtn, {
            click: (e) => this.onDeleteItemsSubmit(e, 'delrules', 'importrule/delete'),
        });
    }

    /** Initialization of forms for Import conditions API controller */
    initConditionForms() {
        const listForm = document.querySelector('#listCondForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listForm, { submit: this.getVerifyHandler(apiTypes.isConditionsArray) });
        this.initCheckboxes(listForm);

        const readBtn = ge('readcondbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readcondid', 'importcond/', apiTypes.isConditionsArray)
            ),
        });

        const createForm = document.querySelector('#createCondForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updateForm = document.querySelector('#updateCondForm > form');
        if (!updateForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateForm, { submit: (e) => this.onFormSubmit(e) });

        const delBtn = ge('delcondbtn');
        if (!delBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delBtn, {
            click: (e) => this.onDeleteItemsSubmit(e, 'delconds', 'importcond/delete'),
        });
    }

    /** Initialization of forms for Import actions API controller */
    initActionForms() {
        const listForm = document.querySelector('#listActForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listForm, { submit: this.getVerifyHandler(apiTypes.isActionsArray) });
        this.initCheckboxes(listForm);

        const readBtn = ge('readactbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readactid', 'importaction/', apiTypes.isActionsArray)
            ),
        });

        const createForm = document.querySelector('#createActForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updateForm = document.querySelector('#updateActForm > form');
        if (!updateForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateForm, { submit: (e) => this.onFormSubmit(e) });

        const delBtn = ge('delactbtn');
        if (!delBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delBtn, {
            click: (e) => this.onDeleteItemsSubmit(e, 'delactions', 'importaction/delete'),
        });
    }

    /** Initialization of forms for Currency API controller */
    initCurrencyForms() {
        const getCurrForm = document.querySelector('#listCurrForm > form');
        if (!getCurrForm) {
            throw new Error('Fail to init view');
        }
        setEvents(getCurrForm, { submit: this.getVerifyHandler(apiTypes.isCurrenciesArray) });

        const readCurrBtn = ge('readcurrbtn');
        if (!readCurrBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readCurrBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_curr_id', 'currency/', apiTypes.isCurrenciesArray)
            ),
        });

        const createCurrForm = document.querySelector('#createCurrForm > form');
        if (!createCurrForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createCurrForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updateCurrForm = document.querySelector('#updateCurrForm > form');
        if (!updateCurrForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateCurrForm, { submit: (e) => this.onFormSubmit(e) });

        const delCurrBtn = ge('delcurrbtn');
        if (!delCurrBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delCurrBtn, {
            click: (e) => this.onDeleteItemsSubmit(e, 'delcurrencies', 'currency/delete'),
        });
    }

    /** Initialization of forms for Icon API controller */
    initIconForms() {
        const listIconForm = document.querySelector('#listIconForm > form');
        if (!listIconForm) {
            throw new Error('Fail to init view');
        }
        setEvents(listIconForm, { submit: this.getVerifyHandler(apiTypes.isIconsArray) });

        const readIconBtn = ge('read_icon_btn');
        if (!readIconBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readIconBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_icon_id', 'icon/', apiTypes.isIconsArray)
            ),
        });

        const createIconForm = document.querySelector('#createIconForm > form');
        if (!createIconForm) {
            throw new Error('Fail to init view');
        }
        setEvents(createIconForm, { submit: this.getVerifyHandler(apiTypes.isCreateResult) });

        const updateIconForm = document.querySelector('#updateIconForm > form');
        if (!updateIconForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateIconForm, { submit: (e) => this.onFormSubmit(e) });

        const delIconBtn = ge('deliconbtn');
        if (!delIconBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(delIconBtn, {
            click: (e) => this.onDeleteItemsSubmit(e, 'del_icons', 'icon/delete'),
        });
    }

    /** Initialization of forms for User API controller */
    initUserForms() {
        const loginForm = document.querySelector('#loginForm > form');
        if (!loginForm) {
            throw new Error('Fail to init view');
        }
        setEvents(loginForm, { submit: (e) => this.onFormSubmit(e) });

        const logoutForm = document.querySelector('#logoutForm > form');
        if (!logoutForm) {
            throw new Error('Fail to init view');
        }
        setEvents(logoutForm, { submit: (e) => this.onFormSubmit(e) });

        const registerForm = document.querySelector('#registerForm > form');
        if (!registerForm) {
            throw new Error('Fail to init view');
        }
        setEvents(registerForm, { submit: (e) => this.onFormSubmit(e) });
    }

    /** Initialization of forms for Profile API controller */
    initProfileForms() {
        const readProfileForm = document.querySelector('#readProfileForm > form');
        if (!readProfileForm) {
            throw new Error('Fail to init view');
        }
        setEvents(readProfileForm, { submit: this.getVerifyHandler(apiTypes.isProfile) });

        const changeNameForm = document.querySelector('#changeNameForm > form');
        if (!changeNameForm) {
            throw new Error('Fail to init view');
        }
        setEvents(changeNameForm, { submit: (e) => this.onFormSubmit(e) });

        const changePwdForm = document.querySelector('#changePwdForm > form');
        if (!changePwdForm) {
            throw new Error('Fail to init view');
        }
        setEvents(changePwdForm, { submit: (e) => this.onFormSubmit(e) });

        const updateSettingsForm = document.querySelector('#updateSettingsForm > form');
        if (!updateSettingsForm) {
            throw new Error('Fail to init view');
        }
        setEvents(updateSettingsForm, { submit: (e) => this.onUpdateSettingsSubmit(e) });

        const resetForm = document.querySelector('#resetForm > form');
        if (!resetForm) {
            throw new Error('Fail to init view');
        }
        setEvents(resetForm, { submit: (e) => this.onFormSubmit(e) });
        this.initCheckboxes(resetForm);
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

    /**
     * Activate specified menu item, expand sub menu if available
     * and collapse submenus of other items
     * @param {Element} menuElem - menu item element to activate
     */
    activateMenu(menuElem) {
        if (!menuElem || !menuElem.parentNode) {
            return;
        }

        if (menuElem.tagName === 'BUTTON') {
            if (this.activeController) {
                this.activeController.classList.remove('active');
            }
            if (menuElem.parentNode) {
                menuElem.parentNode.classList.add('active');
            }
            this.activeController = menuElem.parentNode;
        } else if (menuElem.tagName === 'LI'
            && menuElem.parentNode
            && menuElem.parentNode.classList.contains('sub-menu-list')) {
            if (this.activeFormLink) {
                this.activeFormLink.classList.remove('active');
            }
            this.activeFormLink = menuElem;
            this.activeFormLink.classList.add('active');

            const parentElem = menuElem.parentNode.parentNode;
            if (parentElem && !parentElem.classList.contains('active')) {
                if (this.activeController) {
                    this.activeController.classList.remove('active');
                }
                parentElem.classList.add('active');
                this.activeController = parentElem;
            }
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
     * Controller title click event handler
     * @param {Event} e - click event object
     */
    onContrClick(e) {
        const targetEl = e.target;

        this.activateMenu(targetEl);
        this.activateView(targetEl.dataset.target);
    }

    /**
     * Clear all items from request log container
     */
    clearResults() {
        removeChilds(this.resultsContainer);
        enable(this.clearResultsBtn, false);
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
                }
            } else {
                el.disabled = disableElements;
            }
        }
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
        const { baseURL } = window.app;
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
        enable(this.clearResultsBtn);

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
    onReadItemsSubmit(e, inputId, method, verifyFunc) {
        if (typeof method !== 'string') {
            throw new Error('Invalid parameters');
        }

        e.preventDefault();
        const itemsInp = ge(inputId);
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
    onDeleteItemsSubmit(e, inputId, method) {
        if (typeof method !== 'string') {
            throw new Error('Invalid parameters');
        }

        e.preventDefault();
        const itemsInp = ge(inputId);
        if (!itemsInp) {
            return;
        }

        this.apiRequest({
            httpMethod: 'POST',
            method,
            data: this.parseIds(itemsInp.value),
        });
    }

    /** Update settings form 'submit' event handler */
    onUpdateSettingsSubmit(e) {
        e.preventDefault();

        const nameInput = ge('upd_settings_name');
        const valueInput = ge('upd_settings_value');

        const name = nameInput.value;
        if (name.length === 0) {
            return;
        }

        this.apiRequest({
            httpMethod: 'POST',
            method: 'profile/updateSettings',
            data: {
                [name]: valueInput.value,
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
        if ('acc_id' in frmData) {
            frmData.acc_id = this.parseIds(frmData.acc_id).id;
        }
        if ('person_id' in frmData) {
            frmData.person_id = this.parseIds(frmData.person_id).id;
        }
        if ('category_id' in frmData) {
            frmData.category_id = this.parseIds(frmData.category_id).id;
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
        if ('acc_id' in frmData) {
            frmData.acc_id = this.parseIds(frmData.acc_id).id;
        }
        if ('category_id' in frmData) {
            frmData.category_id = this.parseIds(frmData.category_id).id;
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

        this.apiRequest({
            httpMethod: 'post',
            method: 'transaction/setCategory',
            data: frmData,
        });
    }

    /** Send delete categories request */
    onDeleteCategoriesSubmit(e, inputId, method) {
        if (typeof method !== 'string') {
            throw new Error('Invalid parameters');
        }

        e.preventDefault();
        const itemsInp = ge(inputId);
        if (!itemsInp) {
            return;
        }

        const data = this.parseIds(itemsInp.value);

        const checkbox = document.querySelector('#delSubCategoriesCheck > input');
        data.removeChild = checkbox.checked;

        this.apiRequest({
            httpMethod: 'POST',
            method,
            data,
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(AdminApiConsoleView);
