import { assert } from '@jezvejs/assert';

/** Person model */
export class Person {
    static availProps = [
        'name',
        'flags',
    ];

    static defaultProps = {
        flags: 0,
    };

    constructor(props) {
        assert.isObject(props, 'Invalid props');

        if (props.id) {
            this.id = props.id;
        }

        Person.availProps.forEach((propName) => {
            assert(propName in props, `Property '${propName}' not found.`);
            this[propName] = props[propName];
        });
    }
}
