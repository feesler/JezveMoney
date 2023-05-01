import {
    ge,
    show,
    isFunction,
    Component,
    setEvents,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { __ } from '../../../../../utils/utils.js';
import { API } from '../../../../../API/index.js';

/** CSS classes */
const FILE_NAME_CLASS = 'upload-form__filename';

/**
 * ImportFileUploader component
 */
export class ImportFileUploader extends Component {
    constructor(...args) {
        super(...args);

        this.state = {
            filename: null,
            isEncoded: true,
        };

        this.formElem = ge('fileimportfrm');
        this.inputElem = ge('fileInp');
        this.filenameElem = this.elem.querySelector(`.${FILE_NAME_CLASS}`);
        this.isEncodeCheck = Checkbox.fromElement(ge('isEncodeCheck'), {
            onChange: (checked) => this.onCheckEncode(checked),
        });
        if (!this.formElem || !this.inputElem || !this.filenameElem || !this.isEncodeCheck) {
            throw new Error('Failed to initialize import file uploader');
        }

        setEvents(this.inputElem, { change: () => this.onChangeUploadFile() });

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
                throw new Error(__('ERR_UPLOAD'));
            }

            if (isFunction(this.props.onUploaded)) {
                this.props.onUploaded(data, this.state.filename);
            }
        } catch (e) {
            this.onImportError(e.message);
        }
    }

    /** Import error callback */
    onImportError(message) {
        this.reset();

        if (isFunction(this.props.onUploadError)) {
            this.props.onUploadError(message);
        }
    }

    /** Upload file to server */
    async uploadFile(file) {
        if (!file) {
            return;
        }

        const { isEncoded } = this.state;
        const fileType = file.name.substring(file.name.lastIndexOf('.') + 1);
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
        this.useServerCheck = Checkbox.fromElement(ge('useServerCheck'), {
            onChange: (checked) => this.onCheckServer(checked),
        });
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

        setEvents(this.serverAddressInput, { input: () => this.onInputServerAddress() });
        setEvents(this.uploadBtn, { click: () => this.uploadFromServer() });

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
        if (!filename?.length) {
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
        if (isFunction(this.props.onUploadStart)) {
            this.props.onUploadStart();
        }

        try {
            const result = await API.import.upload(data, { headers });
            this.onImportSuccess(result.data);
        } catch (e) {
            this.onImportError(e.message);
        }
    }

    /** Render component */
    render(state) {
        this.filenameElem.textContent = state.filename ?? '';

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
