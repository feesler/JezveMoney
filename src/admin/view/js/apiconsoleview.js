'use strict';

/* global ge, ce, isObject, isFunction, isInt, isNum, checkDate */
/* global removeChilds, urlJoin, extend, AdminView, ajax, baseURL */

/**
 * Verify fields of specified object
 * @param {Object} obj - object to check
 * @param {Object} expected - object with mandatory fields
 * @param {Object} optional - object with optional fields
 */
function verifyObject(obj, expected, optional) {
    var objectKeys;
    var expectedKeys;
    var optionalKeys;
    var res;

    if (!isObject(obj) || !isObject(expected)) {
        return false;
    }

    // Check no excess members in the object
    objectKeys = Object.keys(obj);
    res = objectKeys.every(function (key) {
        if (!(key in expected) && optional && !(key in optional)) {
            console.log('Unexpected key: ' + key);
            return false;
        }

        return true;
    });
    if (!res) {
        return false;
    }

    // Check all expected members are present in the object and have correct types
    expectedKeys = Object.keys(expected);
    res = expectedKeys.every(function (key) {
        var verifyFunc;

        if (!(key in obj)) {
            console.log('Not found expected key: ' + key);
            return false;
        }

        verifyFunc = expected[key];
        if (!isFunction(verifyFunc) || !verifyFunc(obj[key])) {
            console.log('Wrong type of value ' + key);
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

    optionalKeys = Object.keys(optional);
    res = optionalKeys.every(function (key) {
        var verifyFunc;

        if (key in obj) {
            verifyFunc = optional[key];
            if (!isFunction(verifyFunc) || !verifyFunc(obj[key])) {
                console.log('Wrong type of value ' + key);
                return false;
            }
        }

        return true;
    });

    return res;
}

/** Verify object is create result */
function isCreateResult(obj) {
    return verifyObject(obj, { id: isInt });
}

/** Verify object is string */
function isString(obj) {
    return (typeof obj === 'string');
}

/**
 * Verify object is array and each item of it pass verification
 * @param {Object} data - object to verify
 * @param {Function} verifyFunc - item verification callback
 */
function isArrayOf(data, verifyFunc) {
    if (!Array.isArray(data) || !isFunction(verifyFunc)) {
        return false;
    }

    return data.every(verifyFunc);
}

/** Verify object is date string in DD.MM.YYYY format */
function isDateString(obj) {
    return checkDate(obj);
}

/** Verify object is account */
function isAccount(obj) {
    return verifyObject(obj, {
        id: isInt,
        owner_id: isInt,
        curr_id: isInt,
        balance: isNum,
        initbalance: isNum,
        name: isString,
        icon_id: isInt,
        flags: isInt
    }, {
        user_id: isInt,
        createdate: isInt,
        updatedate: isInt
    });
}

/** Verify object is array of accounts */
function isAccountsArray(obj) { return isArrayOf(obj, isAccount); }

/** Verify object is transaction */
function isTransaction(obj) {
    return verifyObject(obj, {
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
        pos: isInt
    }, {
        user_id: isInt,
        createdate: isInt,
        updatedate: isInt
    });
}

/** Verify object is array of transactions */
function isTransactionsArray(obj) { return isArrayOf(obj, isTransaction); }

/** Verify object is currency */
function isCurrency(obj) {
    return verifyObject(obj, {
        id: isInt,
        name: isString,
        sign: isString,
        flags: isInt
    }, {
        createdate: isInt,
        updatedate: isInt
    });
}

/** Verify object is array of currencies */
function isCurrenciesArray(obj) { return isArrayOf(obj, isCurrency); }

/** Verify object is icon */
function isIcon(obj) {
    return verifyObject(obj, {
        id: isInt,
        name: isString,
        file: isString,
        type: isInt
    }, {
        createdate: isInt,
        updatedate: isInt
    });
}

/** Verify object is array of icons */
function isIconsArray(obj) { return isArrayOf(obj, isIcon); }

/** Verify object is account of person */
function isPersonAccount(obj) {
    return verifyObject(obj, {
        id: isInt,
        curr_id: isInt,
        balance: isNum
    }, {
        owner_id: isInt,
        initbalance: isNum,
        name: isString,
        icon: isInt,
        flags: isInt,
        user_id: isInt,
        createdate: isInt,
        updatedate: isInt
    });
}

/** Verify object is array of accounts of person */
function isPersonAccountsArray(obj) { return isArrayOf(obj, isPersonAccount); }

/** Verify object is person */
function isPerson(obj) {
    return verifyObject(obj, {
        id: isInt,
        name: isString,
        flags: isInt
    }, {
        accounts: isPersonAccountsArray,
        user_id: isInt,
        createdate: isInt,
        updatedate: isInt
    });
}

/** Verify object is array of persons */
function isPersonsArray(obj) { return isArrayOf(obj, isPerson); }

/** Verify object is profile */
function isProfile(obj) {
    return verifyObject(obj, {
        login: isString,
        user_id: isInt,
        owner_id: isInt,
        name: isString
    });
}

/**
 * Admin currecny list view
 */
function AdminApiConsoleView() {
    AdminApiConsoleView.parent.constructor.apply(this, arguments);

    this.activeController = null;
    this.activeFormLink = null;
    this.activeForm = null;
}

extend(AdminApiConsoleView, AdminView);

/**
 * View initialization
 */
AdminApiConsoleView.prototype.onStart = function () {
    AdminApiConsoleView.parent.onStart.apply(this, arguments);

    this.controllersList = ge('controllersList');
    if (!this.controllersList) {
        throw new Error('Fail to init view');
    }
    this.controllersList.addEventListener('click', this.onContrClick.bind(this));

    this.activeForm = document.querySelector('.request-data-form.active');
    this.activeController = document.querySelector('#controllersList > li.active');
    this.activeFormLink = document.querySelector('#controllersList > li.active > .sub-menu-list > li.active');

    this.resultsContainer = ge('results');
    this.clearResultsBtn = ge('clearResultsBtn');
    if (!this.resultsContainer || !this.clearResultsBtn) {
        throw new Error('Fail to init view');
    }

    this.clearResultsBtn.addEventListener('click', this.clearResults.bind(this));

    this.initCommonForms();
    this.initAccountForms();
    this.initPersonForms();
    this.initTransactionForms();
    this.initCurrencyForms();
    this.initIconForms();
    this.initUserForms();
    this.initProfileForms();
};

/** Initialization of forms for State API controller */
AdminApiConsoleView.prototype.initCommonForms = function () {
    var readStateForm = document.querySelector('#readStateForm > form');
    if (!readStateForm) {
        throw new Error('Fail to init view');
    }
    readStateForm.addEventListener('submit', this.onFormSubmit.bind(this));
};

/** Initialization of forms for Account API controller */
AdminApiConsoleView.prototype.initAccountForms = function () {
    var checkboxes;
    var listAccForm;
    var readaccbtn;
    var createAccForm;
    var updateAccForm;
    var delaccbtn;
    var resetAccForm;

    listAccForm = document.querySelector('#listAccForm > form');
    if (!listAccForm) {
        throw new Error('Fail to init view');
    }
    listAccForm.addEventListener('submit', this.getVerifyHandler(isAccountsArray));

    checkboxes = listAccForm.querySelectorAll('input[type="checkbox"]');
    checkboxes = Array.from(checkboxes);
    checkboxes.forEach(function (elem) {
        elem.addEventListener('change', this.onCheck.bind(this));
    }.bind(this));

    readaccbtn = ge('readaccbtn');
    if (!readaccbtn) {
        throw new Error('Fail to init view');
    }
    readaccbtn.addEventListener('click', this.onReadAccountSubmit.bind(this));

    createAccForm = document.querySelector('#createAccForm > form');
    if (!createAccForm) {
        throw new Error('Fail to init view');
    }
    createAccForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

    updateAccForm = document.querySelector('#updateAccForm > form');
    if (!updateAccForm) {
        throw new Error('Fail to init view');
    }
    updateAccForm.addEventListener('submit', this.onFormSubmit.bind(this));

    delaccbtn = ge('delaccbtn');
    if (!delaccbtn) {
        throw new Error('Fail to init view');
    }
    delaccbtn.addEventListener('click', this.onDeleteAccountSubmit.bind(this));

    resetAccForm = document.querySelector('#resetAccForm > form');
    if (!resetAccForm) {
        throw new Error('Fail to init view');
    }
    resetAccForm.addEventListener('submit', this.onFormSubmit.bind(this));
};

/** Initialization of forms for Person API controller */
AdminApiConsoleView.prototype.initPersonForms = function () {
    var checkboxes;
    var listPersonsForm;
    var readpersonbtn;
    var createPersonForm;
    var updatePersonForm;
    var delpersonbtn;

    listPersonsForm = document.querySelector('#listPersonsForm > form');
    if (!listPersonsForm) {
        throw new Error('Fail to init view');
    }
    listPersonsForm.addEventListener('submit', this.getVerifyHandler(isPersonsArray));

    checkboxes = listPersonsForm.querySelectorAll('input[type="checkbox"]');
    checkboxes = Array.from(checkboxes);
    checkboxes.forEach(function (elem) {
        elem.addEventListener('change', this.onCheck.bind(this));
    }.bind(this));

    readpersonbtn = ge('readpersonbtn');
    if (!readpersonbtn) {
        throw new Error('Fail to init view');
    }
    readpersonbtn.addEventListener('click', this.onReadPersonSubmit.bind(this));

    createPersonForm = document.querySelector('#createPersonForm > form');
    if (!createPersonForm) {
        throw new Error('Fail to init view');
    }
    createPersonForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

    updatePersonForm = document.querySelector('#updatePersonForm > form');
    if (!updatePersonForm) {
        throw new Error('Fail to init view');
    }
    updatePersonForm.addEventListener('submit', this.onFormSubmit.bind(this));

    delpersonbtn = ge('delpersonbtn');
    if (!delpersonbtn) {
        throw new Error('Fail to init view');
    }
    delpersonbtn.addEventListener('click', this.onDeletePersonSubmit.bind(this));
};

/** Initialization of forms for Transaction API controller */
AdminApiConsoleView.prototype.initTransactionForms = function () {
    var checkboxes;
    var listTrForm;
    var readtransbtn;
    var createTrForm;
    var createDebtForm;
    var updateTrForm;
    var updateDebtForm;
    var deltransbtn;
    var setTrPosForm;

    listTrForm = document.querySelector('#listTrForm > form');
    if (!listTrForm) {
        throw new Error('Fail to init view');
    }
    listTrForm.addEventListener('submit', this.onListTransactionSubmit.bind(this));

    checkboxes = listTrForm.querySelectorAll('input[type="checkbox"]');
    checkboxes = Array.from(checkboxes);
    checkboxes.forEach(function (elem) {
        elem.addEventListener('change', this.onCheck.bind(this));
    }.bind(this));

    readtransbtn = ge('readtransbtn');
    if (!readtransbtn) {
        throw new Error('Fail to init view');
    }
    readtransbtn.addEventListener('click', this.onReadTransactionSubmit.bind(this));

    createTrForm = document.querySelector('#createTrForm > form');
    if (!createTrForm) {
        throw new Error('Fail to init view');
    }
    createTrForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

    createDebtForm = document.querySelector('#createDebtForm > form');
    if (!createDebtForm) {
        throw new Error('Fail to init view');
    }
    createDebtForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

    updateTrForm = document.querySelector('#updateTrForm > form');
    if (!updateTrForm) {
        throw new Error('Fail to init view');
    }
    updateTrForm.addEventListener('submit', this.onFormSubmit.bind(this));

    updateDebtForm = document.querySelector('#updateDebtForm > form');
    if (!updateDebtForm) {
        throw new Error('Fail to init view');
    }
    updateDebtForm.addEventListener('submit', this.onFormSubmit.bind(this));

    deltransbtn = ge('deltransbtn');
    if (!deltransbtn) {
        throw new Error('Fail to init view');
    }
    deltransbtn.addEventListener('click', this.onDeleteTransactionSubmit.bind(this));

    setTrPosForm = document.querySelector('#setTrPosForm > form');
    if (!setTrPosForm) {
        throw new Error('Fail to init view');
    }
    setTrPosForm.addEventListener('submit', this.onFormSubmit.bind(this));
};

/** Initialization of forms for Currency API controller */
AdminApiConsoleView.prototype.initCurrencyForms = function () {
    var getCurrForm;
    var readCurrBtn;
    var createCurrForm;
    var updateCurrForm;
    var delCurrBtn;

    getCurrForm = document.querySelector('#listCurrForm > form');
    if (!getCurrForm) {
        throw new Error('Fail to init view');
    }
    getCurrForm.addEventListener('submit', this.getVerifyHandler(isCurrenciesArray));

    readCurrBtn = ge('readcurrbtn');
    if (!readCurrBtn) {
        throw new Error('Fail to init view');
    }
    readCurrBtn.addEventListener('click', this.onCurrencyReadSubmit.bind(this));

    createCurrForm = document.querySelector('#createCurrForm > form');
    if (!createCurrForm) {
        throw new Error('Fail to init view');
    }
    createCurrForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

    updateCurrForm = document.querySelector('#updateCurrForm > form');
    if (!updateCurrForm) {
        throw new Error('Fail to init view');
    }
    updateCurrForm.addEventListener('submit', this.onFormSubmit.bind(this));

    delCurrBtn = ge('delcurrbtn');
    if (!delCurrBtn) {
        throw new Error('Fail to init view');
    }
    delCurrBtn.addEventListener('click', this.onDeleteCurrencySubmit.bind(this));
};

/** Initialization of forms for Icon API controller */
AdminApiConsoleView.prototype.initIconForms = function () {
    var listIconForm;
    var readIconBtn;
    var createIconForm;
    var updateIconForm;
    var delIconBtn;

    listIconForm = document.querySelector('#listIconForm > form');
    if (!listIconForm) {
        throw new Error('Fail to init view');
    }
    listIconForm.addEventListener('submit', this.getVerifyHandler(isIconsArray));

    readIconBtn = ge('read_icon_btn');
    if (!readIconBtn) {
        throw new Error('Fail to init view');
    }
    readIconBtn.addEventListener('click', this.onIconReadSubmit.bind(this));

    createIconForm = document.querySelector('#createIconForm > form');
    if (!createIconForm) {
        throw new Error('Fail to init view');
    }
    createIconForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

    updateIconForm = document.querySelector('#updateIconForm > form');
    if (!updateIconForm) {
        throw new Error('Fail to init view');
    }
    updateIconForm.addEventListener('submit', this.onFormSubmit.bind(this));

    delIconBtn = ge('deliconbtn');
    if (!delIconBtn) {
        throw new Error('Fail to init view');
    }
    delIconBtn.addEventListener('click', this.onDeleteIconsSubmit.bind(this));
};

/** Initialization of forms for User API controller */
AdminApiConsoleView.prototype.initUserForms = function () {
    var loginForm;
    var logoutForm;
    var registerForm;

    loginForm = document.querySelector('#loginForm > form');
    if (!loginForm) {
        throw new Error('Fail to init view');
    }
    loginForm.addEventListener('submit', this.onFormSubmit.bind(this));

    logoutForm = document.querySelector('#logoutForm > form');
    if (!logoutForm) {
        throw new Error('Fail to init view');
    }
    logoutForm.addEventListener('submit', this.onFormSubmit.bind(this));

    registerForm = document.querySelector('#registerForm > form');
    if (!registerForm) {
        throw new Error('Fail to init view');
    }
    registerForm.addEventListener('submit', this.onFormSubmit.bind(this));
};

/** Initialization of forms for Profile API controller */
AdminApiConsoleView.prototype.initProfileForms = function () {
    var readProfileForm;
    var changeNameForm;
    var changePwdForm;
    var resetAllForm;

    readProfileForm = document.querySelector('#readProfileForm > form');
    if (!readProfileForm) {
        throw new Error('Fail to init view');
    }
    readProfileForm.addEventListener('submit', this.getVerifyHandler(isProfile));

    changeNameForm = document.querySelector('#changeNameForm > form');
    if (!changeNameForm) {
        throw new Error('Fail to init view');
    }
    changeNameForm.addEventListener('submit', this.onFormSubmit.bind(this));

    changePwdForm = document.querySelector('#changePwdForm > form');
    if (!changePwdForm) {
        throw new Error('Fail to init view');
    }
    changePwdForm.addEventListener('submit', this.onFormSubmit.bind(this));

    resetAllForm = document.querySelector('#resetAllForm > form');
    if (!resetAllForm) {
        throw new Error('Fail to init view');
    }
    resetAllForm.addEventListener('submit', this.onFormSubmit.bind(this));
};

/**
 * Return form submit event handler binded to specified verification function
 * @param {function} verifyFunc
 */
AdminApiConsoleView.prototype.getVerifyHandler = function (verifyFunc) {
    return function (e) {
        return this.onFormSubmit(e, verifyFunc);
    }.bind(this);
};

/**
 * Activate view
 * @param {string} viewTarget
 */
AdminApiConsoleView.prototype.activateView = function (viewTarget) {
    var newForm;

    if (!viewTarget) {
        return;
    }

    newForm = ge(viewTarget);
    if (newForm) {
        if (this.activeForm) {
            this.activeForm.classList.remove('active');
        }
        newForm.classList.add('active');
        this.activeForm = newForm;
    }
};

/**
 * Activate specified menu item, expand sub menu if available and collapse submenus of other items
 * @param {Element} menuElem - menu item element to activate
 */
AdminApiConsoleView.prototype.activateMenu = function (menuElem) {
    var parentElem;

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
    } else if (
        menuElem.tagName === 'LI'
        && menuElem.parentNode
        && menuElem.parentNode.classList.contains('sub-menu-list')
    ) {
        if (this.activeFormLink) {
            this.activeFormLink.classList.remove('active');
        }
        this.activeFormLink = menuElem;
        this.activeFormLink.classList.add('active');

        parentElem = menuElem.parentNode.parentNode;
        if (parentElem && !parentElem.classList.contains('active')) {
            if (this.activeController) {
                this.activeController.classList.remove('active');
            }
            parentElem.classList.add('active');
            this.activeController = parentElem;
        }
    }
};

/**
 * Controller title click event handler
 * @param {Event} e - click event object
 */
AdminApiConsoleView.prototype.onContrClick = function (e) {
    var targetEl = e.target;

    this.activateMenu(targetEl);
    this.activateView(targetEl.dataset.target);
};

/**
 * Clear all items from request log container
 */
AdminApiConsoleView.prototype.clearResults = function () {
    removeChilds(this.resultsContainer);
    this.clearResultsBtn.disabled = true;
};

/**
 * Form submit event handler
 * @param {Event} e - submit event object
 * @param {Function} verifyCallback - response verification callback
 */
AdminApiConsoleView.prototype.onFormSubmit = function (e, verifyCallback) {
    var formEl;
    var frmData;
    var request;

    e.preventDefault();

    formEl = e.target;
    frmData = this.getFormData(formEl);
    if (!frmData) {
        return;
    }

    request = {
        method: formEl.action,
        data: frmData
    };

    if (formEl.method === 'get') {
        this.apiGet(request, verifyCallback);
    } else if (formEl.method === 'post') {
        this.apiPost(request, verifyCallback);
    }
};

/**
 * Checkbox change event handler
 * @param {Event} e - submit event object
 * @param {Function} verifyCallback - response verification callback
 */
AdminApiConsoleView.prototype.onCheck = function (e) {
    var elName;
    var el;
    var disableElements;
    var frm;
    var i;

    if (!e.target || !e.target.form) {
        return;
    }

    elName = e.target.dataset.target;
    if (!elName) {
        return;
    }

    disableElements = !e.target.checked;
    frm = e.target.form;
    if (frm.elements[elName]) {
        el = frm.elements[elName];
        if (el instanceof NodeList) {
            for (i = 0; i < el.length; i += 1) {
                el[i].disabled = disableElements;
            }
        } else {
            el.disabled = disableElements;
        }
    }
};

/**
 * Concatenate specified ids to URL base
 * @param {*} values
 */
AdminApiConsoleView.prototype.parseIds = function (values) {
    var ids;

    if (typeof values !== 'string') {
        throw new Error('Invalid values specified');
    }

    // Check correctness of ids
    ids = values.split(',');

    return { id: ids };
};

/** Create new request item object */
AdminApiConsoleView.prototype.addRequestItem = function (reqData) {
    var reqText;
    var reqItem = {
        view: this
    };

    reqItem.itemContainer = ce('div', { className: 'request-item' });

    reqItem.requestContainer = ce('div', { className: 'request-container collapsed' });
    reqItem.requestContainer.addEventListener('click', function () {
        this.requestContainer.classList.toggle('collapsed');
    }.bind(reqItem));

    reqText = reqData.url;
    if (reqText.indexOf(baseURL) === 0) {
        reqText = reqText.substr(baseURL.length);
    }

    reqItem.requestContainer.append(ce('div', { className: 'title', textContent: reqData.method + ' ' + reqText }));
    if (reqData.data) {
        reqItem.requestContainer.append(ce('div', { className: 'request-details', textContent: reqData.data }));
    }

    reqItem.resultContainer = ce('div', { className: 'response-container response-container_pending', textContent: 'Pending...' });

    reqItem.itemContainer.append(reqItem.requestContainer, reqItem.resultContainer);

    reqItem.addResult = function (res, title, rawResult) {
        var titleEl;

        this.resultContainer.classList.remove('response-container_pending');
        this.resultContainer.classList.add('response-container', 'collapsed', (res ? 'ok-result' : 'fail-result'));
        removeChilds(this.resultContainer);

        titleEl = ce('div', { className: 'title', textContent: title });
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
};

/**
 * API request callback
 * @param {string} text - response text
 * @param {object} reqItem - request item object
 * @param {Function} verifyCallback - verification function
 */
AdminApiConsoleView.prototype.ajaxCallback = function (text, reqItem, verifyCallback) {
    var respObj;
    var resText;
    var rawResult = null;
    var res = true;

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
    rawResult = text;

    reqItem.addResult(res, resText, rawResult);
};

/**
 * Convert data for POST request
 * @param {object} data - request data object
 */
AdminApiConsoleView.prototype.postData = function (data) {
    return JSON.stringify(data);
};

/**
 * Check request data is single id case { id : value | [ value ] }
 * @param {object} data - request data object
 * @returns id value if match and false overwise
 */
AdminApiConsoleView.prototype.singleIdData = function (data) {
    var keys = Object.keys(data);

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
};

/**
 * Convert API request object to request item
 * @param {object} request - API request object
 * @param {boolean} isPOST - if set to true POST request method is assumed
 */
AdminApiConsoleView.prototype.getRequestItem = function (request, isPOST) {
    var prefix = baseURL + 'api/';
    var res = {};
    var id;
    var params;

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
            id = this.singleIdData(request.data);
            if (id) {
                res.url += id;
            } else {
                params = urlJoin(request.data);
                if (params.length) {
                    res.url += '?' + params;
                }
            }
        }
    }

    return res;
};

/**
 * Send GET request to API
 * @param {object} request - API request object
 * @param {Function} callback - user callback function
 */
AdminApiConsoleView.prototype.apiGet = function (request, callback) {
    var requestItem;
    var reqContainer;

    requestItem = this.getRequestItem(request);
    reqContainer = this.addRequestItem(requestItem);

    requestItem.callback = function (text) {
        this.ajaxCallback(text, reqContainer, callback);
    }.bind(this);

    ajax.get(requestItem);
};

/**
 * Send POST request to API
 * @param {object} request - API request object
 * @param {Function} callback - user callback function
 */
AdminApiConsoleView.prototype.apiPost = function (request, callback) {
    var requestItem;
    var reqContainer;

    requestItem = this.getRequestItem(request, true);
    reqContainer = this.addRequestItem(requestItem);

    requestItem.callback = function (text) {
        this.ajaxCallback(text, reqContainer, callback);
    }.bind(this);

    ajax.post(requestItem);
};

/** Read account form 'submit' event handler */
AdminApiConsoleView.prototype.onReadAccountSubmit = function (e) {
    var accInp;

    e.preventDefault();
    accInp = ge('readaccid');
    if (!accInp) {
        return;
    }

    this.apiGet({
        method: 'account/',
        data: this.parseIds(accInp.value),
        verify: isAccountsArray
    });
};

/** Delete accounts form 'submit' event handler */
AdminApiConsoleView.prototype.onDeleteAccountSubmit = function (e) {
    var accountsInp;

    e.preventDefault();
    accountsInp = ge('delaccounts');
    if (!accountsInp) {
        return;
    }

    this.apiPost({
        method: 'account/delete',
        data: this.parseIds(accountsInp.value)
    });
};

/** Read currency form 'submit' event handler */
AdminApiConsoleView.prototype.onCurrencyReadSubmit = function (e) {
    var currIdInp;

    e.preventDefault();
    currIdInp = ge('read_curr_id');
    if (!currIdInp) {
        return;
    }

    this.apiGet({
        method: 'currency/',
        data: this.parseIds(currIdInp.value),
        verify: isCurrenciesArray
    });
};

/** Delete currencies form 'submit' event handler */
AdminApiConsoleView.prototype.onDeleteCurrencySubmit = function (e) {
    var idInp;

    e.preventDefault();
    idInp = ge('delcurrencies');
    if (!idInp) {
        return;
    }

    this.apiPost({
        method: 'currency/delete',
        data: this.parseIds(idInp.value)
    });
};

/** Read icon form 'submit' event handler */
AdminApiConsoleView.prototype.onIconReadSubmit = function (e) {
    var iconIdInp;

    e.preventDefault();
    iconIdInp = ge('read_icon_id');
    if (!iconIdInp) {
        return;
    }

    this.apiGet({
        method: 'icon/',
        data: this.parseIds(iconIdInp.value),
        verify: isIconsArray
    });
};

/** Delete icons form 'submit' event handler */
AdminApiConsoleView.prototype.onDeleteIconsSubmit = function (e) {
    var idInp;

    e.preventDefault();
    idInp = ge('del_icons');
    if (!idInp) {
        return;
    }

    this.apiPost({
        method: 'icon/delete',
        data: this.parseIds(idInp.value)
    });
};

/** Read person form 'submit' event handler */
AdminApiConsoleView.prototype.onReadPersonSubmit = function (e) {
    var idInp;

    e.preventDefault();
    idInp = ge('read_person_id');
    if (!idInp) {
        return;
    }

    this.apiGet({
        method: 'person/',
        data: this.parseIds(idInp.value),
        verify: isPersonsArray
    });
};

/** Delete persons form 'submit' event handler */
AdminApiConsoleView.prototype.onDeletePersonSubmit = function (e) {
    var persondInp;

    e.preventDefault();
    persondInp = ge('delpersons');
    if (!persondInp) {
        return;
    }

    this.apiPost({
        method: 'person/delete',
        data: this.parseIds(persondInp.value)
    });
};

/** List transactions form 'submit' event handler */
AdminApiConsoleView.prototype.onListTransactionSubmit = function (e) {
    var frmData;

    e.preventDefault();

    frmData = this.getFormData(e.target);
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
        verify: isTransactionsArray
    });

    return false;
};

/** Read transactions form 'submit' event handler */
AdminApiConsoleView.prototype.onReadTransactionSubmit = function (e) {
    var transInp;

    e.preventDefault();
    transInp = ge('read_trans_id');
    if (!transInp) {
        return;
    }

    this.apiGet({
        method: 'transaction/',
        data: this.parseIds(transInp.value),
        verify: isTransactionsArray
    });
};

/** Delete transactions form 'submit' event handler */
AdminApiConsoleView.prototype.onDeleteTransactionSubmit = function (e) {
    var transInp;

    e.preventDefault();
    transInp = ge('deltransactions');
    if (!transInp) {
        return;
    }

    this.apiPost({
        method: 'transaction/delete',
        data: this.parseIds(transInp.value)
    });
};
