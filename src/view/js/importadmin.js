'use strict';

/* global ge, show, ajax, urlJoin, baseURL */
/* global ImportView */

/** Setup extra controls of file upload dialog */
ImportView.prototype.initDialogExtras = function () {
    if (!this.uploadDialog) {
        throw new Error('Invalid state');
    }

    this.uploadDialog.useServerCheck = ge('useServerCheck');
    this.uploadDialog.serverAddressBlock = ge('serverAddressBlock');
    this.uploadDialog.serverAddressInput = ge('serverAddress');
    if (
        !this.uploadDialog.useServerCheck
        || !this.uploadDialog.serverAddressBlock
        || !this.uploadDialog.serverAddressInput
    ) {
        throw new Error('Failed to initialize extras of file upload dialog');
    }

    this.uploadDialog.useServerCheck.addEventListener('change', this.onCheckServer.bind(this));
    this.uploadDialog.serverAddressInput.addEventListener('input', this.onInputServerAddress.bind(this));
};

/** Copy file name from server address input */
ImportView.prototype.updateServerFileName = function () {
    var pos;
    var fileName;

    if (!this.uploadDialog || !this.uploadDialog.serverAddressInput) {
        throw new Error('Upload dialog not initialized');
    }
    fileName = this.uploadDialog.serverAddressInput.value;
    pos = fileName.lastIndexOf('/');
    if (pos !== -1) {
        fileName = fileName.substr(pos + 1);
    }

    this.uploadDialog.filenameElem.textContent = fileName;
};

/** Server address input 'input' event handler */
ImportView.prototype.onInputServerAddress = function () {
    var showOptions;

    this.updateServerFileName();

    showOptions = this.uploadDialog.filenameElem.textContent.length > 0;

    this.enableUploadButton(showOptions);
    show(this.uploadDialog.importControls, showOptions);
};

/** Use server checkbox 'change' event handler */
ImportView.prototype.onCheckServer = function () {
    var useServer = this.uploadDialog.useServerCheck.checked;

    show(this.uploadDialog.serverAddressBlock, useServer);
    if (useServer) {
        this.updateServerFileName();
    } else {
        this.updateUploadFileName();
    }
};

/** Use server checkbox 'change' event handler */
ImportView.prototype.beforeUpload = function () {
    var reqObj;
    var useServer = this.uploadDialog.useServerCheck.checked;
    var templateId = this.uploadDialog.templateSel.value;
    var isEncoded = this.uploadDialog.isEncodeCheck.checked;

    if (!useServer) {
        return true;
    }

    reqObj = {
        filename: this.uploadDialog.serverAddressInput.value,
        template: templateId,
        encode: (isEncoded ? 1 : 0)
    };

    ajax.post({
        url: baseURL + 'import/upload/',
        data: urlJoin(reqObj),
        callback: this.onImportSuccess.bind(this)
    });

    return false;
};
