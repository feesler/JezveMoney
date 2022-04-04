import {
    isFunction,
    isObject,
} from 'jezvejs';
import { checkObjValue } from 'jezve-test';
import { Header } from './component/Header.js';
import { MessagePopup } from './component/MessagePopup.js';

export class AppView {
    constructor({ environment }) {
        this.environment = environment;
        if (this.environment) {
            this.environment.inject(this);
        }

        this.model = {};
    }

    isUserLoggedIn() {
        const loggedOutLocations = ['login', 'register'];

        return loggedOutLocations.every((item) => !this.location.includes(`/${item}`));
    }

    async parseContent() {
        return {};
    }

    async buildModel() {
        return {};
    }

    async updateModel() {
        this.model = await this.buildModel(this.content);
    }

    async parse() {
        this.content = await this.parseContent();
        await this.postParse();

        await this.updateModel();
    }

    async postParse() {
        this.location = await this.url();

        this.content.header = await Header.create(this, await this.query('.page > .page_wrapper > .header'));

        const msgElem = await this.query('.popup__content.msg');
        this.content.msgPopup = (msgElem) ? await MessagePopup.create(this, msgElem) : null;
    }

    async closeNotification() {
        if (!this.content.msgPopup) {
            return;
        }

        await this.performAction(() => this.content.msgPopup.close());
    }

    /** Click on profile menu item and return navigation promise */
    async goToProfile() {
        if (!this.isUserLoggedIn()) {
            throw new Error('User is not logged in');
        }

        await this.click(this.content.header.content.user.menuBtn); // open user menu

        await this.navigation(() => this.click(this.content.header.content.user.profileBtn));
    }

    /** Click on logout link from user menu and return navigation promise */
    async logoutUser() {
        await this.click(this.content.header.content.user.menuBtn);

        await this.navigation(() => this.click(this.content.header.content.user.logoutBtn));
    }

    async goToMainView() {
        if (!this.isUserLoggedIn()) {
            throw new Error('User not logged in');
        }

        await this.navigation(() => this.click(this.content.header.content.logo.linkElem));
    }

    async performAction(action) {
        if (!isFunction(action)) {
            throw new Error('Wrong action specified');
        }

        if (!this.content) {
            await this.parse();
        }

        await action.call(this);

        await this.parse();
    }

    isActionAvailable(action) {
        return (typeof action === 'string' && isFunction(this[action]));
    }

    async runAction(action, data) {
        if (!this.isActionAvailable(action)) {
            throw new Error('Invalid action specified');
        }

        return this[action].call(this, data);
    }

    /**
     * Compare visibiliy of specified controls with expected mask
     * In the controls object each value must be an object with 'elem' property containing pointer
     *  to DOM element
     * In the expected object each value must be a boolean value
     * For false expected control may be null or invisible
     * Both controls and expected object may contain nested objects
     * Example:
     *     controls : {
     *         control_1 : { elem : Element },
     *         control_2 : { childControl : { elem : Element } }
     *     }
     *     expected : {
     *         control_1 : true,
     *         control_2 : { childControl : true, invControl : false },
     *         control_3 : false
     *     }
     * @param {Object} controls
     * @param {Object} expected
     */
    async checkVisibility(controls, expected) {
        let res;

        if (!controls) {
            throw new Error('Wrong parameters');
        }

        // Undefined expected value is equivalent to empty object
        if (typeof expected === 'undefined') {
            return true;
        }

        for (const countrolName in expected) {
            if (!Object.prototype.hasOwnProperty.call(expected, countrolName)) {
                continue;
            }

            let factVisible;
            const expVisible = expected[countrolName];
            const control = controls[countrolName];

            if (isObject(expVisible)) {
                if (control && isFunction(control.checkVisibility)) {
                    res = await control.checkVisibility(control.content, expVisible);
                } else {
                    res = await this.checkVisibility(control, expVisible);
                }
            } else {
                factVisible = !!(control && await this.isVisible(control.elem, true));
                res = (expVisible === factVisible);
            }

            if (!res) {
                throw new Error(`Not expected visibility(${factVisible}) of "${countrolName}" control`);
            }
        }

        return true;
    }

    checkValues(controls, ret = false) {
        let res = true;

        for (const countrolName in controls) {
            if (!Object.prototype.hasOwnProperty.call(controls, countrolName)) {
                continue;
            }

            if (!(countrolName in this.content)) {
                throw new Error(`Control (${countrolName}) not found`);
            }
            const expected = controls[countrolName];
            const control = this.content[countrolName];
            const isObj = isObject(control);

            if (isObject(expected)) {
                if (control && isFunction(control.checkValues)) {
                    res = control.checkValues(expected, true);
                } else {
                    res = checkObjValue(control, expected, true);
                }
                if (res !== true) {
                    res.key = `${countrolName}.${res.key}`;
                    break;
                }
            } else if (Array.isArray(expected)) {
                for (let ind = 0; ind < expected.length; ind += 1) {
                    const expectedArrayItem = expected[ind];
                    const controlArrayItem = control[ind];

                    if (controlArrayItem && isFunction(controlArrayItem.checkValues)) {
                        res = controlArrayItem.checkValues(expectedArrayItem, true);
                    } else {
                        res = checkObjValue(controlArrayItem, expectedArrayItem, true);
                    }

                    if (res !== true) {
                        res.key = `${countrolName}[${ind}].${res.key}`;
                        break;
                    }
                }
            } else if (
                (isObj && control.content && control.content.value !== expected)
                || (!isObj && control !== expected)
            ) {
                res = {
                    key: countrolName,
                    value: (isObj) ? control.content.value : control,
                    expected,
                };
                break;
            }
        }

        if (res !== true && !ret) {
            let msg;
            if ('expected' in res) {
                msg = `Not expected value "${res.value}" for (${res.key}) "${res.expected}" is expected`;
            } else {
                msg = `Path (${res.key}) not found`;
            }
            throw new Error(msg);
        }

        return res;
    }

    async checkState(state) {
        const stateObj = (typeof state === 'undefined') ? this.expectedState : state;
        if (!stateObj) {
            throw new Error('Invalid expected state object');
        }

        if (!stateObj.msgPopup) {
            stateObj.msgPopup = null;
        }

        await this.checkVisibility(this.content, stateObj.visibility);
        this.checkValues(stateObj.values);

        return true;
    }
}
