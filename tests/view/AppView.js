import { TestView } from 'jezve-test';
import { Header } from './component/Header.js';
import { MessagePopup } from './component/MessagePopup.js';
import {
    url,
    navigation,
    query,
    click,
} from '../env.js';

export class AppView extends TestView {
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

    async goToProfile() {
        if (!this.isUserLoggedIn()) {
            throw new Error('User is not logged in');
        }

        await navigation(() => this.content.header.clickProfileMenuItem());
    }

    async goToAbout() {
        if (!this.isUserLoggedIn()) {
            throw new Error('User is not logged in');
        }

        await navigation(() => this.content.header.clickAboutMenuItem());
    }

    async logoutUser() {
        await navigation(() => this.content.header.clickLogoutMenuItem());
    }

    async goToMainView() {
        if (!this.isUserLoggedIn()) {
            throw new Error('User not logged in');
        }

        await navigation(() => this.content.header.clickLogo());
    }
}
