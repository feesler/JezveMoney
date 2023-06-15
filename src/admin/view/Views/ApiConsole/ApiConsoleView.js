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
    show,
} from 'jezvejs';
import { Offcanvas } from 'jezvejs/Offcanvas';
import * as apiTypes from '../../../../view/API/types.js';
import { App } from '../../../../view/Application/App.js';
import '../../../../view/Application/Application.scss';
import '../../utils/AdminView/AdminView.scss';
import { AdminView } from '../../utils/AdminView/AdminView.js';
import { ApiRequest } from './components/ApiRequest/ApiRequest.js';
import './ApiConsoleView.scss';

/**
 * Admin currecny list view
 */
class AdminApiConsoleView extends AdminView {
    constructor(...args) {
        super(...args);

        this.activeController = null;
        this.activeFormLink = null;
        this.activeForm = null;

        this.defaultSubmitHandler = (e) => this.onFormSubmit(e);
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
        this.closeMethodsBtn = apiMenuContainer.querySelector('.close-btn');
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
    }

    /** Initialization of checkboxes of specified form */
    initCheckboxes(form) {
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((elem) => setEvents(elem, { change: (e) => this.onCheck(e) }));
    }

    /** Initialization of create/update form */
    initForm(selector, handler = null) {
        const form = document.querySelector(selector);
        if (!form) {
            throw new Error('Failed to initialize form');
        }

        setEvents(form, { submit: handler ?? this.defaultSubmitHandler });
        this.initCheckboxes(form);
    }

    /** Initialization of delete form */
    initIdsForm(selector) {
        this.initForm(selector, (e) => this.onDeleteItemsSubmit(e));
    }

    /** Initialization of forms for State API controller */
    initCommonForms() {
        this.initForm('#readStateForm > form');
        this.initForm('#mainStateForm > form');
        this.initForm('#dbVersionForm > form');
    }

    /** Initialization of forms for Account API controller */
    initAccountForms() {
        this.initForm('#listAccForm > form', this.getVerifyHandler(apiTypes.isAccountsArray));

        const readaccbtn = ge('readaccbtn');
        if (!readaccbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readaccbtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readaccid', 'account/', apiTypes.isAccountsArray)
            ),
        });

        this.initForm('#createAccForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateAccForm > form');
        this.initIdsForm('#showAccForm > form');
        this.initIdsForm('#hideAccForm > form');
        this.initIdsForm('#delAccForm > form');
        this.initForm('#setAccPosForm > form');
    }

    /** Initialization of forms for Person API controller */
    initPersonForms() {
        this.initForm('#listPersonsForm > form', this.getVerifyHandler(apiTypes.isPersonsArray));

        const readpersonbtn = ge('readpersonbtn');
        if (!readpersonbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readpersonbtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_person_id', 'person/', apiTypes.isPersonsArray)
            ),
        });

        this.initForm('#createPersonForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updatePersonForm > form');
        this.initIdsForm('#showPersonForm > form');
        this.initIdsForm('#hidePersonForm > form');
        this.initIdsForm('#delPersonForm > form');
        this.initForm('#setPersonPosForm > form');
    }

    /** Initialization of forms for Category API controller */
    initCategoryForms() {
        this.initForm(
            '#listCategoriesForm > form',
            this.getVerifyHandler(apiTypes.isCategoriesArray),
        );

        const readCategoryBtn = ge('readCategoryBtn');
        if (!readCategoryBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readCategoryBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_category_id', 'category/', apiTypes.isCategoriesArray)
            ),
        });

        this.initForm('#createCategoryForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateCategoryForm > form');
        this.initForm('#delCategoryForm > form', (e) => this.onDeleteCategoriesSubmit(e));
        this.initForm('#setCategoryPosForm > form');
    }

    /** Initialization of forms for Transaction API controller */
    initTransactionForms() {
        this.initForm('#listTrForm > form', (e) => this.onListTransactionSubmit(e));

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

        this.initForm('#createTrForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#createDebtForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateTrForm > form');
        this.initForm('#updateDebtForm > form');
        this.initIdsForm('#delTrForm > form');
        this.initForm('#setTrCategoryForm > form', (e) => this.onSetCategorySubmit(e));
        this.initForm('#setTrPosForm > form');
        this.initForm('#statisticsForm > form', (e) => this.onStatisticsSubmit(e));

        const statisticsFilter = ge('statistics-filter');
        setEvents(statisticsFilter, {
            change: () => {
                const { value } = statisticsFilter;
                enable('statistics_curr', (value === 'currency'));
                enable('statistics_acc', (value === 'account'));
                enable('statistics_cat', (value === 'category'));
            },
        });
    }

    /** Initialization of forms for Scheduled Transaction API controller */
    initScheduledTransactionForms() {
        this.initForm(
            '#listScheduledTrForm > form',
            this.getVerifyHandler(apiTypes.isScheduledTransactionsArray),
        );

        // Read scheduled transactions by ids form
        const readtransbtn = ge('readScheduledTransBtn');
        if (!readtransbtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readtransbtn, {
            click: (e) => this.onReadItemsSubmit(
                e,
                'read_scheduled_trans_id',
                'schedule/',
                apiTypes.isScheduledTransactionsArray,
            ),
        });

        this.initForm('#createScheduledTrForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateScheduledTrForm > form');
        this.initIdsForm('#delScheduledTrForm > form');
    }

    /** Initialization of forms for Reminder API controller */
    initRemindersForms() {
        this.initForm(
            '#listReminderForm > form',
            this.getVerifyHandler(apiTypes.isRemindersArray),
        );

        // Read reminders by ids form
        const readRemindersBtn = ge('readRemindersBtn');
        if (!readRemindersBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readRemindersBtn, {
            click: (e) => this.onReadItemsSubmit(
                e,
                'read_reminder_id',
                'reminder/',
                apiTypes.isRemindersArray,
            ),
        });

        this.initForm('#confirmReminderForm > form');
        this.initForm('#cancelReminderForm > form');
    }

    /** Initialization of forms for Import template API controller */
    initTemplateForms() {
        this.initForm('#listTplForm > form', this.getVerifyHandler(apiTypes.isTemplatesArray));

        const readBtn = ge('readtplbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readtplid', 'importtpl/', apiTypes.isTemplatesArray)
            ),
        });

        this.initForm('#createTplForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateTplForm > form');
        this.initIdsForm('#delTplForm > form');
    }

    /** Initialization of forms for Import rules API controller */
    initRuleForms() {
        this.initForm('#listRuleForm > form', this.getVerifyHandler(apiTypes.isImportRulesArray));

        const readBtn = ge('readrulebtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readruleid', 'importrule/', apiTypes.isImportRulesArray)
            ),
        });

        this.initForm('#createRuleForm > form', (e) => this.onRuleFormSubmit(e, apiTypes.isCreateResult));
        this.initForm('#updateRuleForm > form', (e) => this.onRuleFormSubmit(e));
        this.initIdsForm('#delRuleForm > form');
    }

    /** Initialization of forms for Import conditions API controller */
    initConditionForms() {
        this.initForm('#listCondForm > form', this.getVerifyHandler(apiTypes.isConditionsArray));

        const readBtn = ge('readcondbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readcondid', 'importcond/', apiTypes.isConditionsArray)
            ),
        });

        this.initForm('#createCondForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateCondForm > form');
        this.initIdsForm('#delCondForm > form');
    }

    /** Initialization of forms for Import actions API controller */
    initActionForms() {
        this.initForm('#listActForm > form', this.getVerifyHandler(apiTypes.isActionsArray));

        const readBtn = ge('readactbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'readactid', 'importaction/', apiTypes.isActionsArray)
            ),
        });

        this.initForm('#createActForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateActForm > form');
        this.initIdsForm('#delActForm > form');
    }

    /** Initialization of forms for Currency API controller */
    initCurrencyForms() {
        this.initForm('#listCurrForm > form', this.getVerifyHandler(apiTypes.isCurrenciesArray));

        const readCurrBtn = ge('readcurrbtn');
        if (!readCurrBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readCurrBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_curr_id', 'currency/', apiTypes.isCurrenciesArray)
            ),
        });

        this.initForm('#createCurrForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateCurrForm > form');
        this.initIdsForm('#delCurrForm > form');
    }

    /** Initialization of forms for Icon API controller */
    initIconForms() {
        this.initForm('#listIconForm > form', this.getVerifyHandler(apiTypes.isIconsArray));

        const readIconBtn = ge('read_icon_btn');
        if (!readIconBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readIconBtn, {
            click: (e) => (
                this.onReadItemsSubmit(e, 'read_icon_id', 'icon/', apiTypes.isIconsArray)
            ),
        });

        this.initForm('#createIconForm > form', this.getVerifyHandler(apiTypes.isCreateResult));
        this.initForm('#updateIconForm > form');
        this.initIdsForm('#delIconForm > form');
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

    /** Initialization of forms for User Currencies API controller */
    initUserCurrencyForms() {
        this.initForm(
            '#listUserCurrencyForm > form',
            this.getVerifyHandler(apiTypes.isUserCurrenciesArray),
        );

        const readBtn = ge('readUserCurrencyBtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        setEvents(readBtn, {
            click: (e) => (
                this.onReadItemsSubmit(
                    e,
                    'read_user_currency_id',
                    'usercurrency/',
                    apiTypes.isUserCurrenciesArray,
                )
            ),
        });

        this.initForm(
            '#createUserCurrencyForm > form',
            this.getVerifyHandler(apiTypes.isCreateResult),
        );
        this.initForm('#updateUserCurrencyForm > form');
        this.initIdsForm('#delUserCurrencyForm > form');
        this.initForm('#setUserCurrencyPosForm > form');
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
    onDeleteItemsSubmit(e, verifyCallback) {
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
