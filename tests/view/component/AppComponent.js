import {
    isFunction,
    isObject,
} from 'jezvejs';
import { checkObjValue } from 'jezve-test';

export class AppComponent {
    constructor(parent, elem) {
        if (!parent) {
            throw new Error('Invalid parent specified');
        }
        if (!elem) {
            throw new Error('Invalid element specified');
        }

        this.elem = elem;
        this.parent = parent;

        this.environment = parent.environment;
        if (this.environment) {
            this.environment.inject(this);
        }
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
        await this.updateModel();
    }

    static async create(...args) {
        if (args.length < 2 || !args[1]) {
            return null;
        }

        const instance = new this(...args);
        await instance.parse();

        return instance;
    }

    static async isVisible(item) {
        if (!item || !item.elem || !item.environment) {
            return false;
        }

        return item.environment.isVisible(item.elem, true);
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
                factVisible = !!control && await this.isVisible(control.elem, true);
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
                    value: (isObj) ? control.value : control,
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

        await this.checkVisibility(this.content, stateObj.visibility);
        this.checkValues(stateObj.values);

        return true;
    }
}
