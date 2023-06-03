import { assert } from 'jezve-test';

/** Account model */
export class Account {
    static availProps = [
        'type',
        'name',
        'balance',
        'initbalance',
        'limit',
        'initlimit',
        'curr_id',
        'icon_id',
        'flags',
    ];

    static defaultProps = {
        type: 0,
        initlimit: 0,
        icon_id: 0,
        flags: 0,
    };

    constructor(props) {
        assert.isObject(props, 'Invalid props');

        if (props.id) {
            this.id = props.id;
        }

        Account.availProps.forEach((propName) => {
            assert(propName in props, `Property '${propName}' not found.`);
            this[propName] = props[propName];
        });
    }
}
