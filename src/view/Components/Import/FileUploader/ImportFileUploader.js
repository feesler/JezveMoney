import {
    ge,
    show,
    isFunction,
    Component,
    Checkbox,
} from 'jezvejs';
import { API } from '../../../js/API.js';

/** CSS classes */
const FORM_COLLAPSED_CLASS = 'upload-form__collapsed';

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
            filename: null,
            collapsed: false,
            isEncoded: true,
        };

        this.formElem = ge('fileimportfrm');
        this.inputElem = ge('fileInp');
        this.filenameElem = this.elem.querySelector('.upload-form__filename');
        this.isEncodeCheck = Checkbox.fromElement(
            ge('isEncodeCheck'),
            { onChange: (checked) => this.onCheckEncode(checked) },
        );
        if (!this.formElem || !this.inputElem || !this.filenameElem || !this.isEncodeCheck) {
            throw new Error('Failed to initialize import file uploader');
        }

        this.inputElem.addEventListener('change', () => this.onChangeUploadFile());

        this.initUploadExtras();
    }

    onCheckEncode(checked) {
        if (this.state.isEncoded === checked) {
            return;
        }

        this.state.isEncoded = checked;
        this.render(this.state);
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

        this.state.filename = file.name;
        this.render(this.state);

        this.uploadFile(file);
    }

    /** Reset file upload form */
    reset() {
        this.formElem.reset();
        this.state = {
            ...this.state,
            filename: null,
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
        this.reset();

        if (isFunction(this.uploadErrorHandler)) {
            this.uploadErrorHandler(message);
        }
    }

    /** Upload file to server */
    async uploadFile(file) {
        if (!file) {
            return;
        }

        const { isEncoded } = this.state;
        const fileType = file.name.substr(file.name.lastIndexOf('.') + 1);
        const data = new FormData();
        data.append('file', file);

        this.sendUploadRequest(data, {
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

        this.serverAddressInput.addEventListener('input', () => this.onInputServerAddress());
        this.uploadBtn.addEventListener('click', () => this.uploadFromServer());

        this.state = {
            ...this.state,
            useServer: false,
        };
    }

    /** Use server checkbox 'change' event handler */
    onCheckServer(useServer) {
        this.setUseServerAddress(useServer);
    }

    onInputServerAddress() {
        this.state.filename = this.serverAddressInput.value;
        this.render(this.state);
    }

    setUseServerAddress(value) {
        if (this.state.useServer === value) {
            return;
        }
        this.state.useServer = value;
        this.render(this.state);
    }

    /** Send file upload request using address on server */
    async uploadFromServer() {
        const { useServer, isEncoded } = this.state;
        if (!useServer) {
            return;
        }

        const { filename } = this.state;
        if (!filename.length) {
            return;
        }

        const reqParams = {
            filename,
            template: 0,
            encode: isEncoded ? 1 : 0,
        };

        this.sendUploadRequest(reqParams);
    }

    async sendUploadRequest(data, headers = {}) {
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
        if (state.collapsed) {
            this.elem.classList.add(FORM_COLLAPSED_CLASS);
        } else {
            this.elem.classList.remove(FORM_COLLAPSED_CLASS);
        }

        this.filenameElem.textContent = state.filename ? state.filename : '';

        if (this.useServerCheck) {
            this.useServerCheck.check(state.useServer);

            show(this.serverAddressBlock, state.useServer);
            if (state.useServer) {
                show(this.formElem, false);
                show(this.serverAddressBlock, true);
                this.serverAddressInput.value = state.filename;
            } else {
                show(this.formElem, true);
                show(this.serverAddressBlock, false);
                this.serverAddressInput.value = '';
            }
        }
    }
}
