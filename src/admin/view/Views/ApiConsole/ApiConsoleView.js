import 'jezvejs/style';
import 'jezvejs/style/Checkbox';
import {
    ge,
    enable,
    setEvents,
    isObject,
    isFunction,
    removeChilds,
} from 'jezvejs';
import { Application } from '../../../../view/js/Application.js';
import '../../../../view/css/app.scss';
import { AdminView } from '../../js/AdminView.js';
import '../../css/admin.scss';
import './style.scss';
import * as apiTypes from '../../../../view/js/api/types.js';
import { ApiRequest } from '../../Components/ApiRequest/ApiRequest.js';

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

        this.controllersList = ge('controllersList');
        if (!this.controllersList) {
            throw new Error('Fail to init view');
        }
        this.controllersList.addEventListener('click', (e) => this.onContrClick(e));

        this.activeForm = document.querySelector('.request-data-form.active');
        this.activeController = document.querySelector('#controllersList > li.active');
        this.activeFormLink = document.querySelector('#controllersList > li.active > .sub-menu-list > li.active');

        this.resultsContainer = ge('results');
        this.clearResultsBtn = ge('clearResultsBtn');
        if (!this.resultsContainer || !this.clearResultsBtn) {
            throw new Error('Fail to init view');
        }

        this.clearResultsBtn.addEventListener('click', () => this.clearResults());

        this.initCommonForms();
        this.initAccountForms();
        this.initPersonForms();
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
    initCheckboxed(form) {
        const checkboxes = Array.from(form.querySelectorAll('input[type="checkbox"]'));
        checkboxes.forEach((elem) => setEvents(elem, { change: (e) => this.onCheck(e) }));
    }

    /** Initialization of forms for State API controller */
    initCommonForms() {
        const readStateForm = document.querySelector('#readStateForm > form');
        if (!readStateForm) {
            throw new Error('Fail to init view');
        }
        readStateForm.addEventListener('submit', (e) => this.onFormSubmit(e));
    }

    /** Initialization of forms for Account API controller */
    initAccountForms() {
        const listAccForm = document.querySelector('#listAccForm > form');
        if (!listAccForm) {
            throw new Error('Fail to init view');
        }
        listAccForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isAccountsArray));
        this.initCheckboxed(listAccForm);

        const readaccbtn = ge('readaccbtn');
        if (!readaccbtn) {
            throw new Error('Fail to init view');
        }
        readaccbtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readaccid', 'account/', apiTypes.isAccountsArray),
        );

        const createAccForm = document.querySelector('#createAccForm > form');
        if (!createAccForm) {
            throw new Error('Fail to init view');
        }
        createAccForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updateAccForm = document.querySelector('#updateAccForm > form');
        if (!updateAccForm) {
            throw new Error('Fail to init view');
        }
        updateAccForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const delaccbtn = ge('delaccbtn');
        if (!delaccbtn) {
            throw new Error('Fail to init view');
        }
        delaccbtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'delaccounts', 'account/delete'),
        );
    }

    /** Initialization of forms for Person API controller */
    initPersonForms() {
        const listPersonsForm = document.querySelector('#listPersonsForm > form');
        if (!listPersonsForm) {
            throw new Error('Fail to init view');
        }
        listPersonsForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isPersonsArray));
        this.initCheckboxed(listPersonsForm);

        const readpersonbtn = ge('readpersonbtn');
        if (!readpersonbtn) {
            throw new Error('Fail to init view');
        }
        readpersonbtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'read_person_id', 'person/', apiTypes.isPersonsArray),
        );

        const createPersonForm = document.querySelector('#createPersonForm > form');
        if (!createPersonForm) {
            throw new Error('Fail to init view');
        }
        createPersonForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updatePersonForm = document.querySelector('#updatePersonForm > form');
        if (!updatePersonForm) {
            throw new Error('Fail to init view');
        }
        updatePersonForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const delpersonbtn = ge('delpersonbtn');
        if (!delpersonbtn) {
            throw new Error('Fail to init view');
        }
        delpersonbtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'delpersons', 'person/delete'),
        );
    }

    /** Initialization of forms for Transaction API controller */
    initTransactionForms() {
        const listTrForm = document.querySelector('#listTrForm > form');
        if (!listTrForm) {
            throw new Error('Fail to init view');
        }
        listTrForm.addEventListener('submit', (e) => this.onListTransactionSubmit(e));
        this.initCheckboxed(listTrForm);

        const readtransbtn = ge('readtransbtn');
        if (!readtransbtn) {
            throw new Error('Fail to init view');
        }
        readtransbtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'read_trans_id', 'transaction/', apiTypes.isTransactionsArray),
        );

        const createTrForm = document.querySelector('#createTrForm > form');
        if (!createTrForm) {
            throw new Error('Fail to init view');
        }
        createTrForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const createDebtForm = document.querySelector('#createDebtForm > form');
        if (!createDebtForm) {
            throw new Error('Fail to init view');
        }
        createDebtForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updateTrForm = document.querySelector('#updateTrForm > form');
        if (!updateTrForm) {
            throw new Error('Fail to init view');
        }
        updateTrForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const updateDebtForm = document.querySelector('#updateDebtForm > form');
        if (!updateDebtForm) {
            throw new Error('Fail to init view');
        }
        updateDebtForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const deltransbtn = ge('deltransbtn');
        if (!deltransbtn) {
            throw new Error('Fail to init view');
        }
        deltransbtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'deltransactions', 'transaction/delete'),
        );

        const setTrPosForm = document.querySelector('#setTrPosForm > form');
        if (!setTrPosForm) {
            throw new Error('Fail to init view');
        }
        setTrPosForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const statisticsForm = document.querySelector('#statisticsForm > form');
        if (!statisticsForm) {
            throw new Error('Fail to init view');
        }
        statisticsForm.addEventListener('submit', (e) => this.onFormSubmit(e));
        const statisticsFilter = ge('statistics-filter');
        statisticsFilter.addEventListener('change', () => {
            const isByCurrency = statisticsFilter.value === 'currency';
            enable('statistics_curr', isByCurrency);
            enable('statistics_acc', !isByCurrency);
        });
    }

    /** Initialization of forms for Import template API controller */
    initTemplateForms() {
        const listForm = document.querySelector('#listTplForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        listForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isTemplatesArray));

        const readBtn = ge('readtplbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        readBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readtplid', 'importtpl/', apiTypes.isTemplatesArray),
        );

        const createForm = document.querySelector('#createTplForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        createForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updateForm = document.querySelector('#updateTplForm > form');
        if (!updateForm) {
            throw new Error('Fail to init view');
        }
        updateForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const delBtn = ge('deltplbtn');
        if (!delBtn) {
            throw new Error('Fail to init view');
        }
        delBtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'deltemplates', 'importtpl/delete'),
        );
    }

    /** Initialization of forms for Import rules API controller */
    initRuleForms() {
        const listForm = document.querySelector('#listRuleForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        listForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isImportRulesArray));

        const readBtn = ge('readrulebtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        readBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readruleid', 'importrule/', apiTypes.isImportRulesArray),
        );

        const createForm = document.querySelector('#createRuleForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        createForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updateForm = document.querySelector('#updateRuleForm > form');
        if (!updateForm) {
            throw new Error('Fail to init view');
        }
        updateForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const delBtn = ge('delrulebtn');
        if (!delBtn) {
            throw new Error('Fail to init view');
        }
        delBtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'delrules', 'importrule/delete'),
        );
    }

    /** Initialization of forms for Import conditions API controller */
    initConditionForms() {
        const listForm = document.querySelector('#listCondForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        listForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isConditionsArray));
        this.initCheckboxed(listForm);

        const readBtn = ge('readcondbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        readBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readcondid', 'importcond/', apiTypes.isConditionsArray),
        );

        const createForm = document.querySelector('#createCondForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        createForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updateForm = document.querySelector('#updateCondForm > form');
        if (!updateForm) {
            throw new Error('Fail to init view');
        }
        updateForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const delBtn = ge('delcondbtn');
        if (!delBtn) {
            throw new Error('Fail to init view');
        }
        delBtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'delconds', 'importcond/delete'),
        );
    }

    /** Initialization of forms for Import actions API controller */
    initActionForms() {
        const listForm = document.querySelector('#listActForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        listForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isActionsArray));
        this.initCheckboxed(listForm);

        const readBtn = ge('readactbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        readBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readactid', 'importaction/', apiTypes.isActionsArray),
        );

        const createForm = document.querySelector('#createActForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        createForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updateForm = document.querySelector('#updateActForm > form');
        if (!updateForm) {
            throw new Error('Fail to init view');
        }
        updateForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const delBtn = ge('delactbtn');
        if (!delBtn) {
            throw new Error('Fail to init view');
        }
        delBtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'delactions', 'importaction/delete'),
        );
    }

    /** Initialization of forms for Currency API controller */
    initCurrencyForms() {
        const getCurrForm = document.querySelector('#listCurrForm > form');
        if (!getCurrForm) {
            throw new Error('Fail to init view');
        }
        getCurrForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCurrenciesArray));

        const readCurrBtn = ge('readcurrbtn');
        if (!readCurrBtn) {
            throw new Error('Fail to init view');
        }
        readCurrBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'read_curr_id', 'currency/', apiTypes.isCurrenciesArray),
        );

        const createCurrForm = document.querySelector('#createCurrForm > form');
        if (!createCurrForm) {
            throw new Error('Fail to init view');
        }
        createCurrForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updateCurrForm = document.querySelector('#updateCurrForm > form');
        if (!updateCurrForm) {
            throw new Error('Fail to init view');
        }
        updateCurrForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const delCurrBtn = ge('delcurrbtn');
        if (!delCurrBtn) {
            throw new Error('Fail to init view');
        }
        delCurrBtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'delcurrencies', 'currency/delete'),
        );
    }

    /** Initialization of forms for Icon API controller */
    initIconForms() {
        const listIconForm = document.querySelector('#listIconForm > form');
        if (!listIconForm) {
            throw new Error('Fail to init view');
        }
        listIconForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isIconsArray));

        const readIconBtn = ge('read_icon_btn');
        if (!readIconBtn) {
            throw new Error('Fail to init view');
        }
        readIconBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'read_icon_id', 'icon/', apiTypes.isIconsArray),
        );

        const createIconForm = document.querySelector('#createIconForm > form');
        if (!createIconForm) {
            throw new Error('Fail to init view');
        }
        createIconForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isCreateResult));

        const updateIconForm = document.querySelector('#updateIconForm > form');
        if (!updateIconForm) {
            throw new Error('Fail to init view');
        }
        updateIconForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const delIconBtn = ge('deliconbtn');
        if (!delIconBtn) {
            throw new Error('Fail to init view');
        }
        delIconBtn.addEventListener(
            'click',
            (e) => this.onDeleteItemsSubmit(e, 'del_icons', 'icon/delete'),
        );
    }

    /** Initialization of forms for User API controller */
    initUserForms() {
        const loginForm = document.querySelector('#loginForm > form');
        if (!loginForm) {
            throw new Error('Fail to init view');
        }
        loginForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const logoutForm = document.querySelector('#logoutForm > form');
        if (!logoutForm) {
            throw new Error('Fail to init view');
        }
        logoutForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const registerForm = document.querySelector('#registerForm > form');
        if (!registerForm) {
            throw new Error('Fail to init view');
        }
        registerForm.addEventListener('submit', (e) => this.onFormSubmit(e));
    }

    /** Initialization of forms for Profile API controller */
    initProfileForms() {
        const readProfileForm = document.querySelector('#readProfileForm > form');
        if (!readProfileForm) {
            throw new Error('Fail to init view');
        }
        readProfileForm.addEventListener('submit', this.getVerifyHandler(apiTypes.isProfile));

        const changeNameForm = document.querySelector('#changeNameForm > form');
        if (!changeNameForm) {
            throw new Error('Fail to init view');
        }
        changeNameForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const changePwdForm = document.querySelector('#changePwdForm > form');
        if (!changePwdForm) {
            throw new Error('Fail to init view');
        }
        changePwdForm.addEventListener('submit', (e) => this.onFormSubmit(e));

        const resetForm = document.querySelector('#resetForm > form');
        if (!resetForm) {
            throw new Error('Fail to init view');
        }
        resetForm.addEventListener('submit', (e) => this.onFormSubmit(e));
        this.initCheckboxed(resetForm);
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

        const res = {
            url: new URL(requestURL),
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
                Object.entries(request.data).forEach(
                    ([name, value]) => res.url.searchParams.set(name, value),
                );
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

    /** List transactions form 'submit' event handler */
    onListTransactionSubmit(e) {
        e.preventDefault();

        const frmData = this.getFormData(e.target);
        if (!frmData) {
            return false;
        }

        if (('type' in frmData) && frmData.type) {
            frmData.type = this.parseIds(frmData.type).id;
        }
        if ('acc_id' in frmData) {
            frmData.acc_id = this.parseIds(frmData.acc_id).id;
        }

        this.apiRequest({
            method: 'transaction/list',
            data: frmData,
            verify: apiTypes.isTransactionsList,
        });

        return false;
    }
}

window.app = new Application(window.appProps);
window.app.createView(AdminApiConsoleView);
