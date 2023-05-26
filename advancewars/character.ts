import { Status, charIconRgx, coNameFromKey } from './officer';

export class Character {
    key: string;
    name: string;
    icon: string;
    status: Status;

    baseAppearance: boolean;
    alias: string;
    customUrl: string;
    lostUrl: string;

    iconElement: HTMLImageElement | null;
    nameElement: HTMLElement | null | undefined;

    constructor(iconTag: HTMLImageElement | null, nameTag?: HTMLElement | null | undefined) {
        this.key = "";
        this.name = "";
        this.icon = "";
        this.status = Status.UNDEFINED;

        this.baseAppearance = true;
        this.alias = "";
        this.customUrl = "";
        this.lostUrl = "";

        this.iconElement = null;
        this.nameElement = null;

        this.setImgElement(iconTag);
        this.setNameElement(nameTag);
        this.getStatus();

        if (!this.name) {
            this.inferName();
        }
    }

    setImgElement(element: HTMLImageElement | null) {
        if (!element)
            return;

        const match = element.src.match(charIconRgx);
        if (!match || !match.groups)
            return;

        this.iconElement = element;
        this.icon = element.src;
        this.key = match.groups.character;

        // set the size after identifying it to prevent larger icons from 
        // causing the frame to grow out of proportion
        switch (match.groups.size) {
            case "small":
                element.height = 24;
                element.width = 24;
                break;
            default:
                element.height = 32;
                element.width = 32;
        }
    }

    setNameElement(element: HTMLElement | null | undefined) {
        if (!element)
            return;

        if (!element.textContent)
            return;

        this.nameElement = element;
        this.name = element.textContent;
    }

    // example char urls
    // https://awbw.amarriner.com/terrain/aw1/dsmax.png
    // https://awbw.amarriner.com/terrain/aw1/dseagle.png
    inferName() {
        if (!this.iconElement)
            return;

        const match = this.iconElement.src.match(charIconRgx);

        if (!match || !match.groups)
            return;

        this.name = coNameFromKey(match.groups.character);
    }

    displayCustom(turnOn: boolean) {
        this.baseAppearance = turnOn;
        if (turnOn) {
            if (this.iconElement) {
                this.iconElement.title = this.name;

                switch (this.status) {
                    case Status.LOST:
                        this.iconElement.classList.add("co-defeat");
                        break;
                    default:
                        this.iconElement.classList.remove("co-defeat");
                }

                if (this.lostUrl && this.status == Status.LOST) {
                    this.iconElement.src = this.lostUrl;
                } else if (this.customUrl) {
                    this.iconElement.src = this.customUrl;
                } else {
                    this.iconElement.src = this.icon;
                }
            }

            if (this.nameElement) {
                if (this.alias) {
                    this.nameElement.textContent = this.alias;
                } else {
                    this.nameElement.textContent = this.name;
                }
            }
        } else {
            if (this.iconElement) {
                this.iconElement.title = "";
                this.iconElement.src = this.icon;
            }

            if (this.nameElement) {
                this.nameElement.textContent = this.name;
            }
        }
    }

    getStatus() {
        if (!this.iconElement) {
            this.status = Status.UNDEFINED;
            return;
        }

        const match = this.iconElement.src.match(charIconRgx);

        if (!match || !match.groups) {
            this.status = Status.UNDEFINED;
            return;
        }

        switch (match.groups.status) {
            case "gs_":
                this.status = Status.LOST;
                break;
            default:
                this.status = Status.DEFAULT;
        }
    }

    setAlias(alias: string) {
        this.alias = alias;
    }

    clearAlias() {
        this.alias = "";
    }

    setCustomUrl(url: string) {
        this.customUrl = url;
    }

    clearCustomUrl() {
        this.customUrl = "";
    }

    setLostUrl(url: string) {
        this.lostUrl = url;
    }

    clearLostUrl() {
        this.lostUrl = "";
    }

    clearAll() {
        this.clearAlias();
        this.clearCustomUrl();
        this.clearLostUrl();
        this.displayCustom(false);
    }
}
