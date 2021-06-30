import {
    ge,
    show,
    isFunction,
    urlJoin,
    ajax,
    Component,
} from 'jezvejs';
import { createMessage } from '../../js/app.js';
import { Uploader } from '../../js/component/uploader.js';

/* global baseURL */

/**
 * ImportFileUploader component constructor
 */
export class ImportFileUploader extends Component {
    constructor(...args) {
        super(...args);

        this.uploadStartHandler = this.props.uploadStarted;
        this.uploadedHandler = this.props.uploaded;
        this.state = {
            fileName: null,
            collapsed: false,
        };

        this.formElem = ge('fileimportfrm');
        this.inputElem = ge('fileInp');
        this.filenameElem = this.elem.querySelector('.upload-form__filename');
        this.isEncodeCheck = ge('isEncodeCheck');
        if (!this.formElem || !this.inputElem || !this.filenameElem || !this.isEncodeCheck) {
            throw new Error('Failed to initialize import file uploader');
        }

        this.inputElem.addEventListener('change', this.onChangeUploadFile.bind(this));

        this.initUploadExtras();
    }

    /**
     * File input 'change' event handler
     * Update displayng file name and show control of form
     */
    onChangeUploadFile() {
        this.setFile(this.inputElem.files[0]);
    }

    /** Set upload file */
    setFile(file) {
        if (!file) {
            return;
        }

        this.state.fileName = file.name;
        this.state.collapsed = true;
        this.render(this.state);

        this.uploadFile(file);
    }

    /** Reset file upload form */
    reset() {
        this.formElem.reset();
        this.state = {
            fileName: null,
            collapsed: false,
        };
        this.render(this.state);
    }

    /**
     * Import data request callback
     * @param {string} response - data for import request
     */
    onImportSuccess(response) {
        const jsonParseErrorMessage = 'Fail to parse server response';
        const defErrorMessage = 'Fail to process file';

        let jsonData;
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
    }

    /** Import error callback */
    onImportError() {
        this.importLoadCallback(null);
    }

    /** Import progress callback */
    onImportProgress() {
    }

    /** Upload file to server */
    uploadFile(file) {
        if (!file) {
            return;
        }

        const isEncoded = this.isEncodeCheck.checked;
        const uploader = new Uploader(
            file,
            { template: 0, encode: isEncoded },
            this.onImportSuccess.bind(this),
            this.onImportError.bind(this),
            this.onImportProgress.bind(this),
        );
        uploader.upload();

        if (isFunction(this.uploadStartHandler)) {
            this.uploadStartHandler();
        }
    }

    /** Setup extra controls of file upload dialog */
    initUploadExtras() {
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
            return;
        }

        this.formElem.addEventListener('reset', this.onResetUploadAdmin.bind(this));
        this.useServerCheck.addEventListener('change', this.onCheckServer.bind(this));
        this.uploadBtn.addEventListener('click', this.uploadFromServer.bind(this));
    }

    /** Upload form 'reset' event handler */
    onResetUploadAdmin() {
        setTimeout(() => this.setUseServerAddress(false));
    }

    /** Use server checkbox 'change' event handler */
    onCheckServer() {
        const useServer = this.useServerCheck.checked;

        this.setUseServerAddress(useServer);
    }

    setUseServerAddress(value) {
        this.useServerCheck.checked = value;

        show(this.serverAddressBlock, value);
        if (value) {
            show(this.formElem, false);
            show(this.serverAddressBlock, true);
        } else {
            show(this.formElem, true);
            show(this.serverAddressBlock, false);
        }
    }

    /** Send file upload request using address on server */
    uploadFromServer() {
        const useServer = this.useServerCheck.checked;
        const isEncoded = this.isEncodeCheck.checked;

        if (!useServer) {
            return;
        }

        const reqObj = {
            filename: this.serverAddressInput.value,
            template: 0,
            encode: (isEncoded ? 1 : 0),
        };

        if (!reqObj.filename.length) {
            return;
        }

        this.state.collapsed = true;
        this.render(this.state);

        ajax.post({
            url: `${baseURL}api/import/upload/`,
            data: urlJoin(reqObj),
            callback: this.onImportSuccess.bind(this),
        });

        if (isFunction(this.uploadStartHandler)) {
            this.uploadStartHandler();
        }
    }

    /** Render component */
    render(state) {
        const collapsedClass = 'upload-form__collapsed';
        if (state.collapsed) {
            this.elem.classList.add(collapsedClass);
        } else {
            this.elem.classList.remove(collapsedClass);
        }

        this.filenameElem.textContent = state.fileName ? state.fileName : '';
    }
}
