import {
    isFunction,
    isObject,
} from 'jezvejs';
import { checkObjValue } from 'jezve-test';
import { AppComponent } from './component/AppComponent.js';
import { Header } from './component/Header.js';
import { MessagePopup } from './component/MessagePopup.js';
import {
    url,
    navigation,
    query,
    click,
    isVisible,
} from '../env.js';

export class AppView extends AppComponent {
    isUserLoggedIn() {
        const loggedOutLocations = ['login', 'register'];

        return loggedOutLocations.every((item) => !this.location.includes(`/${item}`));
    }

    async postParse() {
        this.location = await url();

        this.content.header = await Header.create(this, await query('.page > .page_wrapper > .header'));

        const msgElem = await query('.popup__content.msg');
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

        await click(this.content.header.content.user.menuBtn); // open user menu

        await navigation(() => click(this.content.header.content.user.profileBtn));
    }

    /** Click on logout link from user menu and return navigation promise */
    async logoutUser() {
        await click(this.content.header.content.user.menuBtn);

        await navigation(() => click(this.content.header.content.user.logoutBtn));
    }

    async goToMainView() {
        if (!this.isUserLoggedIn()) {
            throw new Error('User not logged in');
        }

        await navigation(() => click(this.content.header.content.logo.linkElem));
    }
}
