import { CoKey, Status, charIconRgx, coNameFromKey } from './officer';

export class Character {
    key: CoKey | null;
    name: string;
    icon: string;
    status: Status;

    baseAppearance: boolean;
    alias: string;
    customUrl: string;
    lostUrl: string;

    iconElement: HTMLImageElement | null;
    nameElement: HTMLElement | null;

    constructor(iconTag: HTMLImageElement, nameTag?: HTMLElement) {
        this.key = null;
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

    setImgElement(element: HTMLImageElement) {
        if (!element)
            return;

        const match = element.src.match(charIconRgx);
        if (!match?.groups)
            return;

        this.iconElement = element;
        this.icon = element.src;
        this.key = match.groups.character as CoKey;

        // set the size after identifying it to prevent larger icons from 
        // causing the frame to grow out of proportion
        let dimension: number;

        switch (match.groups.size) {
            case "small":
                dimension = 24;
                break;
            default:
                dimension = 32;
        }

        element.height = dimension;
        element.width = dimension
    }

    setNameElement(element?: HTMLElement) {
        if (!element?.textContent)
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

        if (!match?.groups)
            return;

        const coKey = match.groups.character as CoKey;
        this.name = coNameFromKey(coKey);
    }

    // TODO: This should only be accessed by the user with a toggle
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

        if (!match?.groups) {
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
