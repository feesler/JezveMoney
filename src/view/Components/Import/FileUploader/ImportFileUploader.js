import { ge, show, isFunction } from 'jezvejs';
import { Component } from 'jezvejs/Component';
import { Checkbox } from 'jezvejs/Checkbox';
import { API } from '../../../js/API.js';

/** Strings */
const MSG_UPLOAD_FAIL = 'Fail to process file';

/**
 * ImportFileUploader component constructor
 */
export class ImportFileUploader extends Component {
    constructor(...args) {
        super(...args);

        this.uploadStartHandler = this.props.onUploadStart;
        this.uploadErrorHandler = this.props.onUploadError;
        this.uploadedHandler = this.props.onUploaded;
        this.state = {
            fileName: null,
            collapsed: false,
        };

        this.formElem = ge('fileimportfrm');
        this.inputElem = ge('fileInp');
        this.filenameElem = this.elem.querySelector('.upload-form__filename');
        this.isEncodeCheck = Checkbox.fromElement(ge('isEncodeCheck'));
        if (!this.formElem || !this.inputElem || !this.filenameElem || !this.isEncodeCheck) {
            throw new Error('Failed to initialize import file uploader');
        }

        this.inputElem.addEventListener('change', () => this.onChangeUploadFile());

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
    onImportSuccess(data) {
        try {
            if (!Array.isArray(data)) {
                throw new Error(MSG_UPLOAD_FAIL);
            }

            this.state.collapsed = true;
            this.render(this.state);

            if (isFunction(this.uploadedHandler)) {
                this.uploadedHandler(data);
            }
        } catch (e) {
            this.onImportError(e.message);
        }
    }

    /** Import error callback */
    onImportError(message) {
        if (isFunction(this.uploadErrorHandler)) {
            this.uploadErrorHandler(message);
        }
    }

    /** Upload file to server */
    async uploadFile(file) {
        if (!file) {
            return;
        }

        const isEncoded = this.isEncodeCheck.checked;
        const fileType = file.name.substr(file.name.lastIndexOf('.') + 1);
        const data = new FormData();
        data.append('file', file);

        this.sendUploadRequst(data, {
            'X-File-Type': fileType,
            'X-File-Tpl': 0,
            'X-File-Encode': isEncoded ? 1 : 0,
        });
    }

    /** Setup extra controls of file upload dialog */
    initUploadExtras() {
        this.useServerCheck = Checkbox.fromElement(
            ge('useServerCheck'),
            { onChange: (checked) => this.onCheckServer(checked) },
        );
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

        this.formElem.addEventListener('reset', () => this.onResetUploadAdmin());
        this.uploadBtn.addEventListener('click', () => this.uploadFromServer());
    }

    /** Upload form 'reset' event handler */
    onResetUploadAdmin() {
        setTimeout(() => this.setUseServerAddress(false));
    }

    /** Use server checkbox 'change' event handler */
    onCheckServer(useServer) {
        this.setUseServerAddress(useServer);
    }

    setUseServerAddress(value) {
        this.useServerCheck.check(value);

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
    async uploadFromServer() {
        const useServer = this.useServerCheck.checked;
        const isEncoded = this.isEncodeCheck.checked;

        if (!useServer) {
            return;
        }

        const filename = this.serverAddressInput.value;
        if (!filename.length) {
            return;
        }

        const reqParams = {
            filename,
            template: 0,
            encode: isEncoded ? 1 : 0,
        };

        this.sendUploadRequst(reqParams);
    }

    async sendUploadRequst(data, headers = {}) {
        if (isFunction(this.uploadStartHandler)) {
            this.uploadStartHandler();
        }

        try {
            const result = await API.import.upload(data, headers);
            this.onImportSuccess(result.data);
        } catch (e) {
            this.onImportError(e.message);
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
