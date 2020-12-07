'use strict';

/* global isFunction, baseURL */
/* exported Uploader */
/* eslint no-bitwise: "off" */

/** Uploader constructor */
function Uploader(file, options, onSuccess, onError, onProgress) {
    var fileId;
    var fileType;
    var errorCount = 0;
    var MAX_ERROR_COUNT = 6;
    var startByte = 0;
    var xhrUpload;
    var xhrStatus;

    /**
    * Obtain 32-bit integer from string
    * @param {string} str - string to create hash from
    */
    function hashCode(str) {
        var i;
        var chr;
        var hash = 0;

        if (str.length === 0) {
            return 0;
        }

        for (i = 0; i < str.length; i += 1) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; /* Convert to 32bit integer */
        }

        return Math.abs(hash);
    }

    /* fileId is unique file identificator */
    fileId = file.name + '-' + file.size + '-' + +file.lastModifiedDate;
    fileType = file.name.substr(file.name.lastIndexOf('.') + 1);

    /**
     * make integer from file id to send in header
     * only ASCII symbols is available in headers
     */
    fileId = hashCode(fileId);

    function send() {
        xhrUpload = new XMLHttpRequest();
        xhrUpload.onreadystatechange = function () {
            if (this.readyState === 2
                && this.responseURL === baseURL + 'login/') {
                this.abort();
                window.location = this.responseURL;
            }
        };

        xhrUpload.onload = function () {
            if (this.status === 200) {
                if (isFunction(onSuccess)) {
                    onSuccess(this.response);
                }
            } else {
                /** Try again if failed */
                errorCount += 1;
                if (errorCount <= MAX_ERROR_COUNT) {
                    setTimeout(send, 1000 * errorCount);
                } else if (isFunction(onError)) {
                    onError(this.statusText);
                }
            }
        };
        xhrUpload.onerror = xhrUpload.onload;

        xhrUpload.open('POST', baseURL + 'import/upload', true);
        // which file upload
        xhrUpload.setRequestHeader('X-File-Id', fileId);
        xhrUpload.setRequestHeader('X-File-Type', fileType);
        xhrUpload.setRequestHeader('X-File-Tpl', options.template);
        if (options.encode) {
            xhrUpload.setRequestHeader('X-File-Encode', 1);
        }

        xhrUpload.upload.onprogress = function (e) {
            errorCount = 0;
            if (isFunction(onProgress)) {
                onProgress(startByte + e.loaded, startByte + e.total);
            }
        };

        // send from startByte
        xhrUpload.send(file.slice(startByte));
    }

    function upload() {
        xhrStatus = new XMLHttpRequest();

        xhrStatus.onload = function () {
            if (this.status === 200) {
                startByte = +this.responseText || 0;
                send();
            } else {
                /* on fail try again after 1 second */
                errorCount += 1;
                if (errorCount <= MAX_ERROR_COUNT) {
                    setTimeout(upload, 1000 * errorCount);
                } else if (isFunction(onError)) {
                    onError(this.statusText);
                }
            }
        };

        xhrStatus.onerror = xhrStatus.onload;

        xhrStatus.open('GET', baseURL + 'import/uploadstatus', true);
        xhrStatus.setRequestHeader('X-File-Id', fileId);
        xhrStatus.setRequestHeader('X-File-Type', fileType);
        xhrStatus.send();
    }

    function pause() {
        if (xhrStatus) {
            xhrStatus.abort();
        }
        if (xhrUpload) {
            xhrUpload.abort();
        }
    }

    this.upload = upload;
    this.pause = pause;
}
