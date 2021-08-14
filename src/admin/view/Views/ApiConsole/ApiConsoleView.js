import 'jezvejs/style';
import {
    ge,
    ce,
    setEvents,
    isObject,
    isFunction,
    isInt,
    isNum,
    checkDate,
    removeChilds,
    urlJoin,
    ajax,
} from 'jezvejs';
import { AdminView } from '../../js/AdminView.js';
import '../../../../view/css/app.css';
import '../../css/admin.css';
import './style.css';

/* global baseURL */

/**
 * Verify fields of specified object
 * @param {Object} obj - object to check
 * @param {Object} expected - object with mandatory fields
 * @param {Object} optional - object with optional fields
 */
function verifyObject(obj, expected, optional) {
    if (!isObject(obj) || !isObject(expected)) {
        return false;
    }

    // Check no excess members in the object
    const objectKeys = Object.keys(obj);
    let res = objectKeys.every((key) => {
        if (!(key in expected) && optional && !(key in optional)) {
            console.log(`Unexpected key: ${key}`);
            return false;
        }

        return true;
    });
    if (!res) {
        return false;
    }

    // Check all expected members are present in the object and have correct types
    const expectedKeys = Object.keys(expected);
    res = expectedKeys.every((key) => {
        if (!(key in obj)) {
            console.log(`Not found expected key: ${key}`);
            return false;
        }

        const verifyFunc = expected[key];
        if (!isFunction(verifyFunc) || !verifyFunc(obj[key])) {
            console.log(`Wrong type of value ${key}`);
            return false;
        }

        return true;
    });
    if (!res) {
        return false;
    }

    // Check optional members have correct types if present in the object
    if (!optional) {
        return true;
    }

    const optionalKeys = Object.keys(optional);
    res = optionalKeys.every((key) => {
        if (key in obj) {
            const verifyFunc = optional[key];
            if (!isFunction(verifyFunc) || !verifyFunc(obj[key])) {
                console.log(`Wrong type of value ${key}`);
                return false;
            }
        }

        return true;
    });

    return res;
}

/** Verify object is create result */
const isCreateResult = (obj) => verifyObject(obj, { id: isInt });

/** Verify object is string */
const isString = (obj) => (typeof obj === 'string');

/**
 * Returns function to verify object is array and each item of it pass verification
 * @param {Object} data - object to verify
 * @param {Function} verifyFunc - item verification callback
 */
const isArrayOf = (verifyFunc) => {
    if (!isFunction(verifyFunc)) {
        throw new Error('Invalid verify function');
    }

    return (obj) => Array.isArray(obj) && obj.every(verifyFunc);
};


/** Verify object is array of integers */
const isIntArray = isArrayOf(isInt);

/** Verify object is date string in DD.MM.YYYY format */
const isDateString = (obj) => checkDate(obj);

/** Verify object is account */
const isAccount = (obj) => verifyObject(obj, {
    id: isInt,
    owner_id: isInt,
    curr_id: isInt,
    balance: isNum,
    initbalance: isNum,
    name: isString,
    icon_id: isInt,
    flags: isInt,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of accounts */
const isAccountsArray = isArrayOf(isAccount);

/** Verify object is transaction */
const isTransaction = (obj) => verifyObject(obj, {
    id: isInt,
    type: isInt,
    src_id: isInt,
    dest_id: isInt,
    src_amount: isNum,
    dest_amount: isNum,
    src_curr: isInt,
    dest_curr: isInt,
    src_result: isNum,
    dest_result: isNum,
    date: isDateString,
    comment: isString,
    pos: isInt,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is transactions filter */
const isTransactionsFilter = (obj) => verifyObject(obj, {}, {
    type: isIntArray,
    accounts: isIntArray,
    stdate: isString,
    enddate: isString,
    search: isString,
});

/** Verify object is array of transactions */
const isTransactionsArray = isArrayOf(isTransaction);

/** Verify object is list paginator */
const isPaginator = (obj) => verifyObject(obj, {
    total: isInt,
    onPage: isInt,
    pagesCount: isInt,
    page: isInt,
});

/** Verify object is transactions list response */
const isTransactionsList = (obj) => verifyObject(obj, {
    items: isTransactionsArray,
    filter: isTransactionsFilter,
    paginator: isPaginator,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is import template */
const isTemplateColumns = (obj) => verifyObject(obj, {
    accountAmount: isInt,
    accountCurrency: isInt,
    transactionAmount: isInt,
    transactionCurrency: isInt,
    date: isInt,
    comment: isInt,
});

/** Verify object is import template */
const isTemplate = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    type_id: isInt,
    columns: isTemplateColumns,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of import templates */
const isTemplatesArray = isArrayOf(isTemplate);

/** Verify object is import condition */
const isImportCondition = (obj) => verifyObject(obj, {
    id: isInt,
    rule_id: isInt,
    field_id: isInt,
    operator: isInt,
    value: isString,
    flags: isInt,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of import conditions */
const isConditionsArray = isArrayOf(isImportCondition);

/** Verify object is import action */
const isImportAction = (obj) => verifyObject(obj, {
    id: isInt,
    rule_id: isInt,
    action_id: isInt,
    value: isString,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of import conditions */
const isActionsArray = isArrayOf(isImportAction);

/** Verify object is import rule */
const isImportRule = (obj) => verifyObject(obj, {
    id: isInt,
    flags: isInt,
}, {
    user_id: isInt,
    actions: isActionsArray,
    conditions: isConditionsArray,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of import templates */
const isImportRulesArray = isArrayOf(isImportRule);

/** Verify object is currency */
const isCurrency = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    sign: isString,
    flags: isInt,
}, {
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of currencies */
const isCurrenciesArray = isArrayOf(isCurrency);

/** Verify object is icon */
const isIcon = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    file: isString,
    type: isInt,
}, {
    createdate: isInt,
    updatedate: isInt,
});


/** Verify object is array of icons */
const isIconsArray = isArrayOf(isIcon);

/** Verify object is account of person */
const isPersonAccount = (obj) => verifyObject(obj, {
    id: isInt,
    curr_id: isInt,
    balance: isNum,
}, {
    owner_id: isInt,
    initbalance: isNum,
    name: isString,
    icon: isInt,
    flags: isInt,
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of accounts of person */
const isPersonAccountsArray = isArrayOf(isPersonAccount);

/** Verify object is person */
const isPerson = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    flags: isInt,
}, {
    accounts: isPersonAccountsArray,
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});


/** Verify object is array of persons */
const isPersonsArray = isArrayOf(isPerson);

/** Verify object is profile */
const isProfile = (obj) => verifyObject(obj, {
    login: isString,
    user_id: isInt,
    owner_id: isInt,
    name: isString,
});


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
        listAccForm.addEventListener('submit', this.getVerifyHandler(isAccountsArray));
        this.initCheckboxed(listAccForm);

        const readaccbtn = ge('readaccbtn');
        if (!readaccbtn) {
            throw new Error('Fail to init view');
        }
        readaccbtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readaccid', 'account/', isAccountsArray),
        );

        const createAccForm = document.querySelector('#createAccForm > form');
        if (!createAccForm) {
            throw new Error('Fail to init view');
        }
        createAccForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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

        const resetAccForm = document.querySelector('#resetAccForm > form');
        if (!resetAccForm) {
            throw new Error('Fail to init view');
        }
        resetAccForm.addEventListener('submit', (e) => this.onFormSubmit(e));
    }

    /** Initialization of forms for Person API controller */
    initPersonForms() {
        const listPersonsForm = document.querySelector('#listPersonsForm > form');
        if (!listPersonsForm) {
            throw new Error('Fail to init view');
        }
        listPersonsForm.addEventListener('submit', this.getVerifyHandler(isPersonsArray));
        this.initCheckboxed(listPersonsForm);

        const readpersonbtn = ge('readpersonbtn');
        if (!readpersonbtn) {
            throw new Error('Fail to init view');
        }
        readpersonbtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'read_person_id', 'person/', isPersonsArray),
        );

        const createPersonForm = document.querySelector('#createPersonForm > form');
        if (!createPersonForm) {
            throw new Error('Fail to init view');
        }
        createPersonForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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
            (e) => this.onReadItemsSubmit(e, 'read_trans_id', 'transaction/', isTransactionsArray),
        );

        const createTrForm = document.querySelector('#createTrForm > form');
        if (!createTrForm) {
            throw new Error('Fail to init view');
        }
        createTrForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

        const createDebtForm = document.querySelector('#createDebtForm > form');
        if (!createDebtForm) {
            throw new Error('Fail to init view');
        }
        createDebtForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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
    }

    /** Initialization of forms for Import template API controller */
    initTemplateForms() {
        const listForm = document.querySelector('#listTplForm > form');
        if (!listForm) {
            throw new Error('Fail to init view');
        }
        listForm.addEventListener('submit', this.getVerifyHandler(isTemplatesArray));

        const readBtn = ge('readtplbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        readBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readtplid', 'importtpl/', isTemplatesArray),
        );

        const createForm = document.querySelector('#createTplForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        createForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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
        listForm.addEventListener('submit', this.getVerifyHandler(isImportRulesArray));

        const readBtn = ge('readrulebtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        readBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readruleid', 'importrule/', isImportRulesArray),
        );

        const createForm = document.querySelector('#createRuleForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        createForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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
        listForm.addEventListener('submit', this.getVerifyHandler(isConditionsArray));
        this.initCheckboxed(listForm);

        const readBtn = ge('readcondbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        readBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readcondid', 'importcond/', isConditionsArray),
        );

        const createForm = document.querySelector('#createCondForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        createForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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
        listForm.addEventListener('submit', this.getVerifyHandler(isActionsArray));
        this.initCheckboxed(listForm);

        const readBtn = ge('readactbtn');
        if (!readBtn) {
            throw new Error('Fail to init view');
        }
        readBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'readactid', 'importaction/', isActionsArray),
        );

        const createForm = document.querySelector('#createActForm > form');
        if (!createForm) {
            throw new Error('Fail to init view');
        }
        createForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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
        getCurrForm.addEventListener('submit', this.getVerifyHandler(isCurrenciesArray));

        const readCurrBtn = ge('readcurrbtn');
        if (!readCurrBtn) {
            throw new Error('Fail to init view');
        }
        readCurrBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'read_curr_id', 'currency/', isCurrenciesArray),
        );

        const createCurrForm = document.querySelector('#createCurrForm > form');
        if (!createCurrForm) {
            throw new Error('Fail to init view');
        }
        createCurrForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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
        listIconForm.addEventListener('submit', this.getVerifyHandler(isIconsArray));

        const readIconBtn = ge('read_icon_btn');
        if (!readIconBtn) {
            throw new Error('Fail to init view');
        }
        readIconBtn.addEventListener(
            'click',
            (e) => this.onReadItemsSubmit(e, 'read_icon_id', 'icon/', isIconsArray),
        );

        const createIconForm = document.querySelector('#createIconForm > form');
        if (!createIconForm) {
            throw new Error('Fail to init view');
        }
        createIconForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

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
        readProfileForm.addEventListener('submit', this.getVerifyHandler(isProfile));

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

        const resetAllForm = document.querySelector('#resetAllForm > form');
        if (!resetAllForm) {
            throw new Error('Fail to init view');
        }
        resetAllForm.addEventListener('submit', (e) => this.onFormSubmit(e));
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
        this.clearResultsBtn.disabled = true;
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
            method: formEl.action,
            data: frmData,
        };

        if (formEl.method === 'get') {
            this.apiGet(request, verifyCallback);
        } else if (formEl.method === 'post') {
            this.apiPost(request, verifyCallback);
        }
    }

    /**
     * Checkbox change event handler
     * @param {Event} e - submit event object
     * @param {Function} verifyCallback - response verification callback
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

    /** Create new request item object */
    addRequestItem(reqData) {
        const reqItem = {
            view: this,
        };

        reqItem.itemContainer = ce('div', { className: 'request-item' });

        reqItem.requestContainer = ce('div', { className: 'request-container collapsed' });
        reqItem.requestContainer.addEventListener('click', function () {
            this.requestContainer.classList.toggle('collapsed');
        }.bind(reqItem));

        let reqText = reqData.url;
        if (reqText.indexOf(baseURL) === 0) {
            reqText = reqText.substr(baseURL.length);
        }

        reqItem.requestContainer.append(ce('div', { className: 'title', textContent: `${reqData.method} ${reqText}` }));
        if (reqData.data) {
            reqItem.requestContainer.append(ce('div', { className: 'request-details', textContent: reqData.data }));
        }

        reqItem.resultContainer = ce('div', { className: 'response-container response-container_pending', textContent: 'Pending...' });

        reqItem.itemContainer.append(reqItem.requestContainer, reqItem.resultContainer);

        reqItem.addResult = function (res, title, rawResult) {
            this.resultContainer.classList.remove('response-container_pending');
            this.resultContainer.classList.add('response-container', 'collapsed', (res ? 'ok-result' : 'fail-result'));
            removeChilds(this.resultContainer);

            const titleEl = ce('div', { className: 'title', textContent: title });
            titleEl.addEventListener('click', function () {
                this.resultContainer.classList.toggle('collapsed');
            }.bind(reqItem));

            this.resultContainer.append(titleEl);

            if (rawResult) {
                this.resultContainer.append(ce('div', { className: 'response-details', textContent: rawResult }));
            }

            this.view.clearResultsBtn.disabled = false;
        };

        this.resultsContainer.append(reqItem.itemContainer);

        return reqItem;
    }

    /**
     * API request callback
     * @param {string} text - response text
     * @param {object} reqItem - request item object
     * @param {Function} verifyCallback - verification function
     */
    ajaxCallback(text, reqItem, verifyCallback) {
        let respObj;
        let resText;
        let res = true;

        try {
            respObj = JSON.parse(text);
        } catch (e) {
            console.log(e.message);
            reqItem.addResult(false, 'Fail to parse response from server', null);
            return;
        }

        if (respObj && respObj.result === 'ok') {
            if (isFunction(verifyCallback)) {
                res = verifyCallback(respObj.data);
            }
            resText = res ? 'Valid response' : 'Invalid response format';
        } else {
            res = false;
            resText = 'Fail result';
        }

        reqItem.addResult(res, resText, text);
    }

    /**
     * Convert data for POST request
     * @param {object} data - request data object
     */
    postData(data) {
        return JSON.stringify(data);
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
        const prefix = `${baseURL}api/`;
        const res = {};

        if (!isObject(request)) {
            throw new Error('Invalid request');
        }
        if (typeof request.method !== 'string' || !request.method.length) {
            throw new Error('Invalid API request method');
        }

        if (request.method.indexOf(prefix) === -1) {
            res.url = prefix + request.method;
        } else {
            res.url = request.method;
        }

        res.headers = ('headers' in request) ? request.headers : {};

        if (request.data) {
            if (isPOST) {
                res.method = 'POST';
                res.data = this.postData(request.data);
                res.headers['Content-Type'] = 'application/json';
            } else {
                res.method = 'GET';
                const id = this.singleIdData(request.data);
                if (id) {
                    res.url += id;
                } else {
                    const params = urlJoin(request.data);
                    if (params.length) {
                        res.url += `?${params}`;
                    }
                }
            }
        }

        return res;
    }

    /**
     * Send GET request to API
     * @param {object} request - API request object
     * @param {Function} callback - user callback function
     */
    apiGet(request, callback) {
        const requestItem = this.getRequestItem(request);
        const reqContainer = this.addRequestItem(requestItem);

        requestItem.callback = (text) => this.ajaxCallback(text, reqContainer, callback);

        ajax.get(requestItem);
    }

    /**
     * Send POST request to API
     * @param {object} request - API request object
     * @param {Function} callback - user callback function
     */
    apiPost(request, callback) {
        const requestItem = this.getRequestItem(request, true);
        const reqContainer = this.addRequestItem(requestItem);

        requestItem.callback = (text) => this.ajaxCallback(text, reqContainer, callback);

        ajax.post(requestItem);
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

        this.apiGet({
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

        this.apiPost({
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

        this.apiGet({
            method: 'transaction/list',
            data: frmData,
            verify: isTransactionsList,
        });

        return false;
    }
}

window.view = new AdminApiConsoleView(window.app);
