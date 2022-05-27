import { MessageEmbed } from "discord.js";

const colors = {
    "Danger": 0xF27878,
    "Warning": 0xF2D478,
    "Success": 0x68D49E,

    "General": 0x71AEF5,
    "Update": 0x6576CC,
    "Info": 0x775EBF,
    "Prompt": 0x6576CC
}

class Embed extends MessageEmbed {
    _title: string;
    _emoji: string;

    // @ts-ignore
    get title() {
        return `${this._title}`;
    }

    set title(title: string) {
        this._title = title;
    }

    setTitle(title: string) { this._title = title; return this }
    setStatus(color: string) { this.setColor(colors[color]); return this }
}

export default Embed;