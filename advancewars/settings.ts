import { coNameFromKey, coNames } from './officer';

export class Settings {
    enabled: boolean;
    window: HTMLElement | null;

    constructor() {
        this.enabled = false;
        this.window = null;
    }

    async buildWindow(saveFunction: () => void) {
        const window = document.createElement("div");
        const wrapper1 = document.createElement("div");
        window.id = "editor-settings";
        this.window = window;
        wrapper1.classList.add("wrapper");

        window.appendChild(wrapper1);

        const saveButton = document.createElement("input");
        const titlebar = document.createElement("div");
        titlebar.id = "editor-title";
        titlebar.innerText = "Display editor";
        saveButton.id = "save-settings";
        saveButton.type = "button";
        saveButton.value = "Save";
        saveButton.onclick = saveFunction;
        wrapper1.appendChild(titlebar);
        wrapper1.appendChild(saveButton);

        const coCategory = document.createElement("div");
        const coHeader = document.createElement("div");
        const coTable = document.createElement("div");
        const wrapper2 = document.createElement("div");
        coCategory.id = "co-category";
        coTable.id = "co-table";
        coHeader.id = "co-header";
        coHeader.innerText = "CO";
        coHeader.classList.add("header");
        wrapper2.classList.add("wrapper");

        wrapper2.appendChild(coTable);
        coCategory.appendChild(coHeader);
        coCategory.appendChild(wrapper2);
        wrapper1.appendChild(coCategory);

        for (const coKey of coNames) {
            const coRow = document.createElement("div");
            coRow.classList.add("co-row");
            coRow.dataset.coKey = coKey;

            const cell1 = document.createElement("div");
            const icon = document.createElement("img");
            icon.classList.add("base-co-icon");
            icon.dataset.preview = "true";
            icon.dataset.src = `https://awbw.amarriner.com/terrain/aw2/ds${coKey}.png`;
            cell1.appendChild(icon);

            const cell2 = document.createElement("div");
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.name = "alias";
            nameInput.placeholder = coNameFromKey(coKey);
            cell2.appendChild(nameInput);

            const cell3 = document.createElement("div");
            const urlInput = document.createElement("input");
            urlInput.type = "text";
            urlInput.name = "customUrl";
            urlInput.placeholder = "Icon URL";
            cell3.appendChild(urlInput);

            const cell4 = document.createElement("div");
            const lostInput = document.createElement("input");
            lostInput.type = "text";
            lostInput.name = "lostUrl";
            lostInput.placeholder = "Defeat URL";
            cell4.appendChild(lostInput);

            const cells = [cell1, cell2, cell3, cell4];
            for (const cell of cells) {
                cell.classList.add("co-cell");
                coRow.appendChild(cell);
            }

            coTable.appendChild(coRow);
        }

        this.enabled = await GM.getValue("optionsOpen", false);
        if (!this.enabled) {
            window.classList.add("hidden");
        } else {
            this.loadContent();
        }

        document.body.appendChild(window);
    }

    displayWindow() {
        if (!this.window)
            return;

        if (!("fullyLoaded" in this.window.dataset)) {
            this.loadContent();
        }

        this.window.classList.remove("hidden");
        // also remove focus
    }

    hideWindow() {
        if (!this.window)
            return;

        this.window.classList.add("hidden");
    }

    async toggleWindow() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.displayWindow();
        } else {
            this.hideWindow();
        }
        await GM.setValue("optionsOpen", this.enabled);
    }

    loadContent() {
        // load icons if window is active
        if (!this.window)
            return;

        const icons: NodeListOf<HTMLImageElement> = this.window.querySelectorAll(".base-co-icon");
        for (const icon of icons) {
            const imgSrc = icon.dataset.src;
            if (imgSrc)
                icon.src = imgSrc;
        }
        this.window.dataset.fullyLoaded = "true";
    }
}
