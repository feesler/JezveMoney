'use strict';

/* global ge, isFunction, extend */
/* global createMessage */
/* global Component, Uploader */

/**
 * ImportFileUploader component constructor
 * @param {Object} props
 */
function ImportFileUploader() {
    ImportFileUploader.parent.constructor.apply(this, arguments);

    this.uploadStartHandler = this.props.uploadStarted;
    this.uploadedHandler = this.props.uploaded;
    this.state = {
        fileName: null,
        collapsed: false
    };

    this.formElem = ge('fileimportfrm');
    this.inputElem = ge('fileInp');
    this.filenameElem = this.elem.querySelector('.upload-form__filename');
    this.isEncodeCheck = ge('isEncodeCheck');
    if (!this.formElem || !this.inputElem || !this.filenameElem || !this.isEncodeCheck) {
        throw new Error('Failed to initialize import file uploader');
    }

    this.inputElem.addEventListener('change', this.onChangeUploadFile.bind(this));

    if (isFunction(this.initUploadExtras)) {
        this.initUploadExtras();
    }
}

extend(ImportFileUploader, Component);

/** Return file name from file input */
ImportFileUploader.prototype.getUploadFileName = function () {
    var pos;
    var fileName;

    fileName = this.inputElem.value;
    if (fileName.includes('fakepath')) {
        pos = fileName.lastIndexOf('\\');
        fileName = fileName.substr(pos + 1);
    }

    return fileName;
};

/**
 * File input 'change' event handler
 * Update displayng file name and show control of form
 */
ImportFileUploader.prototype.onChangeUploadFile = function () {
    var value = this.getUploadFileName();

    if (!value || !value.length) {
        return;
    }

    this.state.fileName = value;
    this.state.collapsed = true;
    this.render(this.state);

    this.uploadFile();
};

/** Reset file upload form */
ImportFileUploader.prototype.reset = function () {
    this.formElem.reset();
    this.state = {
        fileName: null,
        collapsed: false
    };
    this.render(this.state);
};

/**
 * Import data request callback
 * @param {string} response - data for import request
 */
ImportFileUploader.prototype.onImportSuccess = function (response) {
    var jsonParseErrorMessage = 'Fail to parse server response';
    var defErrorMessage = 'Fail to process file';
    var jsonData;

    try {
        jsonData = JSON.parse(response);
    } catch (e) {
        createMessage(jsonParseErrorMessage, 'msg_error');
        return;
    }

    try {
        if (!jsonData || jsonData.result !== 'ok' || !Array.isArray(jsonData.data)) {
            throw new Error((jsonData && 'msg' in jsonData) ? jsonData.msg : defErrorMessage);
        }

        if (isFunction(this.uploadedHandler)) {
            this.uploadedHandler(jsonData.data);
        }
    } catch (e) {
        createMessage(e.message, 'msg_error');
    }
};

/** Import error callback */
ImportFileUploader.prototype.onImportError = function () {
    this.importLoadCallback(null);
};

/** Import progress callback */
ImportFileUploader.prototype.onImportProgress = function () {
};

/** Upload file to server */
ImportFileUploader.prototype.uploadFile = function () {
    var file;
    var uploader;
    var isEncoded = this.isEncodeCheck.checked;

    file = this.inputElem.files[0];
    if (!file) {
        return;
    }

    uploader = new Uploader(
        file,
        { template: 0, encode: isEncoded },
        this.onImportSuccess.bind(this),
        this.onImportError.bind(this),
        this.onImportProgress.bind(this)
    );
    uploader.upload();

    if (isFunction(this.uploadStartHandler)) {
        this.uploadStartHandler();
    }
};

/** Render component */
ImportFileUploader.prototype.render = function (state) {
    var collapsedClass = 'upload-form__collapsed';
    if (state.collapsed) {
        this.elem.classList.add(collapsedClass);
    } else {
        this.elem.classList.remove(collapsedClass);
    }

    this.filenameElem.textContent = state.fileName ? state.fileName : '';
};
