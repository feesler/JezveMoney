'use strict';

/* global ge, show, ajax, urlJoin, baseURL */
/* global ImportUploadDialog */

/** Setup extra controls of file upload dialog */
ImportUploadDialog.prototype.initDialogExtras = function () {
    this.useServerCheck = ge('useServerCheck');
    this.serverAddressBlock = ge('serverAddressBlock');
    this.serverAddressInput = ge('serverAddress');
    if (
        !this.useServerCheck
        || !this.serverAddressBlock
        || !this.serverAddressInput
    ) {
        throw new Error('Failed to initialize extras of file upload dialog');
    }

    this.useServerCheck.addEventListener('change', this.onCheckServer.bind(this));
    this.serverAddressInput.addEventListener('input', this.onInputServerAddress.bind(this));
};

/** Copy file name from server address input */
ImportUploadDialog.prototype.updateServerFileName = function () {
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
ImportUploadDialog.prototype.onInputServerAddress = function () {
    var showOptions;

    this.updateServerFileName();

    showOptions = this.filenameElem.textContent.length > 0;

    this.enableUploadButton(showOptions);
    show(this.importControls, showOptions);
};

/** Use server checkbox 'change' event handler */
ImportUploadDialog.prototype.onCheckServer = function () {
    var useServer = this.useServerCheck.checked;

    show(this.serverAddressBlock, useServer);
    if (useServer) {
        this.updateServerFileName();
    } else {
        this.updateUploadFileName();
    }
};

/** Use server checkbox 'change' event handler */
ImportUploadDialog.prototype.beforeUpload = function () {
    var reqObj;
    var useServer = this.useServerCheck.checked;
    var templateId = this.templateSel.value;
    var isEncoded = this.isEncodeCheck.checked;

    if (!useServer) {
        return true;
    }

    reqObj = {
        filename: this.serverAddressInput.value,
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
