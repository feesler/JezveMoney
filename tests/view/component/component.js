export class Component {
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

    async parse() {
        throw new Error('Not implemented');
    }

    static async create(...args) {
        if (args.length < 2 || !args[1]) {
            return null;
        }

        let instance;
        try {
            instance = new this(...args);
            await instance.parse();
        } catch (e) {
            return null;
        }

        return instance;
    }

    static async isVisible(item) {
        if (!item || !item.elem || !item.environment) {
            return false;
        }

        return item.environment.isVisible(item.elem);
    }
}
