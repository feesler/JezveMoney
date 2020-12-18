'use strict';

/* global ge, show, ajax, urlJoin, baseURL */
/* global ImportFileUploader */

/** Setup extra controls of file upload dialog */
ImportFileUploader.prototype.initUploadExtras = function () {
    this.useServerCheck = ge('useServerCheck');
    this.serverAddressBlock = ge('serverAddressBlock');
    this.serverAddressInput = ge('serverAddress');
    this.uploadBtn = ge('serverUploadBtn');
    if (
        !this.useServerCheck
        || !this.serverAddressBlock
        || !this.serverAddressInput
        || !this.uploadBtn
    ) {
        throw new Error('Failed to initialize extras of file upload dialog');
    }

    this.formElem.addEventListener('reset', this.onResetUploadAdmin.bind(this));
    this.useServerCheck.addEventListener('change', this.onCheckServer.bind(this));
    this.serverAddressInput.addEventListener('input', this.onInputServerAddress.bind(this));
    this.uploadBtn.addEventListener('click', this.uploadFromServer.bind(this));
};

/** Copy file name from server address input */
ImportFileUploader.prototype.updateServerFileName = function () {
    var pos;
    var fileName;

    if (!this.serverAddressInput) {
        throw new Error('Upload dialog not initialized');
    }
    fileName = this.serverAddressInput.value;
    pos = fileName.lastIndexOf('/');
    if (pos !== -1) {
        fileName = fileName.substr(pos + 1);
    }

    this.filenameElem.textContent = fileName;
};

/** Server address input 'input' event handler */
ImportFileUploader.prototype.onInputServerAddress = function () {
/*
    var showOptions;

    this.updateServerFileName();

    showOptions = this.filenameElem.textContent.length > 0;

    this.enableUploadButton(showOptions);
    show(this.importControls, showOptions);
*/
};

/** Upload form 'reset' event handler */
ImportFileUploader.prototype.onResetUploadAdmin = function () {
    setTimeout(function () {
        show(this.serverAddressBlock, false);
    }.bind(this));
};

/** Use server checkbox 'change' event handler */
ImportFileUploader.prototype.onCheckServer = function () {
    var useServer = this.useServerCheck.checked;

    show(this.serverAddressBlock, useServer);
    if (useServer) {
        show(this.formElem, false);
        show(this.serverAddressBlock, true);
    } else {
        show(this.formElem, true);
        show(this.serverAddressBlock, false);
    }
};

/** Send file upload request using address on server */
ImportFileUploader.prototype.uploadFromServer = function () {
    var reqObj;
    var useServer = this.useServerCheck.checked;
    var isEncoded = this.isEncodeCheck.checked;

    if (!useServer) {
        return;
    }

    reqObj = {
        filename: this.serverAddressInput.value,
        template: 0,
        encode: (isEncoded ? 1 : 0)
    };

    ajax.post({
        url: baseURL + 'api/import/upload/',
        data: urlJoin(reqObj),
        callback: this.onImportSuccess.bind(this)
    });
};
