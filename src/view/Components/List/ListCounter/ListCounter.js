import { getClassName } from 'jezvejs';
import { Field } from '../../Common/Field/Field.js';

import './ListCounter.scss';

const COUNTER_CLASS = 'counter';

/**
 * List counter component
 */
export class ListCounter extends Field {
    constructor(props = {}) {
        super({
            ...props,
            className: getClassName(COUNTER_CLASS, props.className),
        });
    }
}
