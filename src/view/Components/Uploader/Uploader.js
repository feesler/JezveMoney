import { isFunction } from 'jezvejs';
import { createMessage } from '../../js/app.js';

/** Strings */
const MSG_JSON_PARSE = 'Fail to parse server response';

/**
* Obtain 32-bit integer from string
* @param {string} str - string to create hash from
*/
/* eslint-disable no-bitwise */
function hashCode(str) {
    let hash = 0;

    if (str.length === 0) {
        return 0;
    }

    for (let i = 0; i < str.length; i += 1) {
        const chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; /* Convert to 32bit integer */
    }

    return Math.abs(hash);
}
/* eslint-enable no-bitwise */

/** Uploader constructor */
export class Uploader {
    constructor(file, options, onSuccess, onError, onProgress) {
        this.fileId = null;
        this.fileType = null;
        this.errorCount = 0;
        this.MAX_ERROR_COUNT = 6;
        this.startByte = 0;
        this.xhrUpload = null;
        this.xhrStatus = null;
        this.options = { ...options };
        this.onSuccess = onSuccess;
        this.onError = onError;
        this.onProgress = onProgress;
        this.file = file;

        /* fileId is unique file identificator */
        this.fileId = `${file.name}-${file.size}-${+file.lastModifiedDate}`;
        this.fileType = file.name.substr(file.name.lastIndexOf('.') + 1);

        /**
         * make integer from file id to send in header
         * only ASCII symbols is available in headers
         */
        this.fileId = hashCode(this.fileId);
    }

    abort() {
        if (this.xhrStatus) {
            this.xhrStatus.abort();
        }
        if (this.xhrUpload) {
            this.xhrUpload.abort();
        }
    }

    send() {
        const { baseURL } = window.app;

        this.xhrUpload = new XMLHttpRequest();
        this.xhrUpload.onload = () => {
            if (this.xhrUpload.status === 200) {
                if (isFunction(this.onSuccess)) {
                    try {
                        const jsonData = JSON.parse(this.xhrUpload.response);
                        this.onSuccess(jsonData);
                    } catch (e) {
                        createMessage(MSG_JSON_PARSE, 'msg_error');
                    }
                }
            } else if (this.xhrUpload.status === 401) {
                this.abort();
                window.location = `${baseURL}login/`;
            } else {
                /** Try again if failed */
                this.errorCount += 1;
                if (this.errorCount <= this.MAX_ERROR_COUNT) {
                    setTimeout(() => this.send(), 1000 * this.errorCount);
                } else if (isFunction(this.onError)) {
                    this.onError(this.xhrUpload.statusText);
                }
            }
        };
        this.xhrUpload.onerror = this.xhrUpload.onload;

        this.xhrUpload.open('POST', `${baseURL}api/import/upload`, true);
        // which file upload
        this.xhrUpload.setRequestHeader('X-File-Id', this.fileId);
        this.xhrUpload.setRequestHeader('X-File-Type', this.fileType);
        this.xhrUpload.setRequestHeader('X-File-Tpl', this.options.template);
        if (this.options.encode) {
            this.xhrUpload.setRequestHeader('X-File-Encode', 1);
        }

        this.xhrUpload.upload.onprogress = (e) => {
            this.errorCount = 0;
            if (isFunction(this.onProgress)) {
                this.onProgress(this.startByte + e.loaded, this.startByte + e.total);
            }
        };

        // send from startByte
        this.xhrUpload.send(this.file.slice(this.startByte));
    }

    upload() {
        const { baseURL } = window.app;

        this.xhrStatus = new XMLHttpRequest();

        this.xhrStatus.onload = () => {
            if (this.xhrStatus.status === 200) {
                this.startByte = +this.xhrStatus.responseText || 0;
                this.send();
            } else if (this.xhrStatus.status === 401) {
                this.abort();
                window.location = `${baseURL}login/`;
            } else {
                /* on fail try again after 1 second */
                this.errorCount += 1;
                if (this.errorCount <= this.MAX_ERROR_COUNT) {
                    setTimeout(() => this.upload(), 1000 * this.errorCount);
                } else if (isFunction(this.onError)) {
                    this.onError(this.xhrStatus.statusText);
                }
            }
        };

        this.xhrStatus.onerror = this.xhrStatus.onload;

        this.xhrStatus.open('GET', `${baseURL}api/import/uploadstatus`, true);
        this.xhrStatus.setRequestHeader('X-File-Id', this.fileId);
        this.xhrStatus.setRequestHeader('X-File-Type', this.fileType);
        this.xhrStatus.send();
    }
}
