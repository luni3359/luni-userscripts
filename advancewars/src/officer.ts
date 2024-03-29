import { capitalize } from './utils';

export const coNames = [
    "andy", "hachi", "jake", "max", "nell", "rachel", "sami", "colin", "grit",
    "olaf", "sasha", "drake", "eagle", "javier", "jess", "grimm", "kanbei",
    "sensei", "sonja", "adder", "flak", "hawke", "jugger", "kindle", "koal",
    "lash", "sturm", "vonbolt"] as const;

export type CoKey = typeof coNames[number];

export const charIconRgx = /\/(?<status>gs_)*(?<size>small)*(?<game>aw2|ds)*(?<character>[a-zA-Z]+)\.png(?:\?.*)?$/;

export enum Status {
    UNDEFINED,
    DEFAULT,
    LOST,
}

export function coNameFromKey(key: CoKey): string {
    switch (key) {
        case "vonbolt":
            return "Von Bolt";
        default:
            return capitalize(key);
    }
}

export function coKeyFromName(name: string): CoKey {
    switch (name) {
        case "Von Bolt":
            name = name.replace(/\s/g, "");
        default:
            return name.toLowerCase() as CoKey;
    }
}