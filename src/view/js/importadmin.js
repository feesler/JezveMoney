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
    this.uploadBtn.addEventListener('click', this.uploadFromServer.bind(this));
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

    if (!reqObj.filename.length) {
        return;
    }

    this.state.collapsed = true;
    this.render(this.state);

    ajax.post({
        url: baseURL + 'api/import/upload/',
        data: urlJoin(reqObj),
        callback: this.onImportSuccess.bind(this)
    });
};
