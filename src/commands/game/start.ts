import Discord, { CommandInteraction, MessageActionRow, MessageButton, Modal, ModalActionRowComponent, TextInputComponent } from "discord.js";
import { SelectMenuOption, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import generateEmbed from "../../utils/generateEmbed.js";
import humanizeDuration from "humanize-duration";
import { WrappedCheck } from "jshaiku";


class Embed {
    embed: Discord.MessageEmbed;
    title: string;
    description: string = "";
    pageId: number = 0;
    components: any = [];
    setEmbed(embed: Discord.MessageEmbed) { this.embed = embed; return this; }
    setTitle(title: string) { this.title = title; return this; }
    setDescription(description: string) { this.description = description; return this; }
    setPageId(pageId: number) { this.pageId = pageId; return this; }
    setComponents(components: any) { this.components = components; return this; }
}


const command = (builder: SlashCommandSubcommandBuilder) =>
    builder
        .setName("start")
        .setDescription("Let's play!")

function chooseDecks() {
    return []
}


async function chooseNumber(interaction: CommandInteraction, m, min: number, max: number, data) {
    await interaction.editReply({embeds: [new generateEmbed()
        .setTitle(data.display)
        .setDescription(`${data.description}\nPick a number between ${min} and ${max} | Default: ${data.default.length ? data.default[1] : data.default}`)
        .setStatus("Prompt")
    ], components: [
        new MessageActionRow().addComponents([
            new MessageButton().setLabel("Back").setStyle("DANGER").setCustomId("back")
        ].concat(
            data.options ? data.options.map(
                (option, index) => new MessageButton().setLabel(option.text).setStyle("SECONDARY").setCustomId(index.toString())
            ) : []
        ).concat([new MessageButton().setLabel(data.default.length ? data.default[1] : data.default).setStyle("PRIMARY").setCustomId("default")])
    )]})
    let out;
    //
    try {
        out = await new Promise((resolve, reject) => {
            let mes, int;
            mes = m.createMessageComponentCollector({filter: (m) => m.user.id == interaction.user.id, time: 3000})
            .on("collect", (m) => { resolve(m); })
            int = m.channel.createMessageCollector({filter: (m) => m.user.id == interaction.user.id && m.content.match(/^[0-9]+$/), time: 3000})
            .on("collect", (m) => { resolve(m); })
            mes.on("end", () => { int.stop(); console.log(mes.endReason); })
            int.on("end", () => { mes.stop(); console.log(int.endReason); })
        })
    } catch(e) { console.log(e);
    } finally {
    }
    return data;
}


const callback = async (interaction: CommandInteraction) => {
    // @ts-ignore
    let game = interaction.client.gameManager.fetch(interaction.channel.id);
    if (game) {
        interaction.reply({
            embeds: [new generateEmbed()
                .setTitle("Uhh...")
                .setDescription(`There's already a game running in this channel, so you can't create a new one :/\n`
                    + (game.players[interaction.user.id] ? "You can end it with `/game end`" : "You can join it with `/game join`"))
                .setStatus("Danger")
            ], ephemeral: true
        });
        return;
    }
    let m = (await interaction.reply({
        embeds: [new generateEmbed()
            .setTitle("Setting up your game...")
            .setDescription("We are currently loading default settings and packs")
            .setStatus("Update")
        ], ephemeral: true, fetchReply: true
    }) as unknown as Discord.Message);
    // @ts-ignore
    game = interaction.client.gameManager.create(interaction.channel.id, interaction.user.id);
    let typeDefs = {
        "maxRounds": { type: "number", min: 1, max: 1000, default: [0, "Unlimited"], description: "The limit on the number of rounds that will be played.", display: "Total Rounds" },
        "maxPoints": { type: "number", min: 1, max: 1000, default: 7, description: "How many points a player needs to win.", display: "Points to Win", options: [{text: "Unlimited", value: 0}] },
        "maxPlayers": { type: "number", min: 2, max: 50, default: 50, description: "The maximum number of players that can be in the game at once.", display: "Max Players" },
        "choose": { type: "number", min: 1, max: 1000, default: [120, "2 Minutes"], option: "timeouts.choose", description: "How long to wait for a player to choose a card.", display: "Choose Timeout" },
        "vote": { type: "number", min: 1, max: 1000, default: [240, "4 Minutes"], option: "timeouts.vote", description: "How long the judge has to pick a winner.", display: "Vote Timeout" },
        "roundDelay": { type: "number", min: 1, max: 1000, default: 5, option: "timeouts.roundDelay", description: "How long to wait between rounds.", display: "Round Delay" },
        "handSize": { type: "number", min: 1, max: 1000, default: 10, description: "How many cards each player gets to pick from.", display: "Hand Size" },
        "shuffles": { type: "number", min: 0, max: 1000, default: 3, description: "How many points it costs to shuffle your cards.", options: [{text: "No cost", value: "-1"}, {text: "Free", value: "0"}, {text: "Disabled", value: "-1"}], display: "Shuffle Cost" },
        "anonymous": { type: "boolean", default: false },
        "blanks": { type: "select", options: { 0: "None", 1: "Rare", "2": "Some", "3": "Many" }, default: 0, description: "How many blank cards to add to the deck. These cards allow players to write their own cards."},
        "decks": { type: "special", callback: chooseDecks }
    }
    let page = 0;
    while (true) {
        let embeds = [
            new Embed()
                .setEmbed(new generateEmbed()
                    .setTitle("Settings: General")
                    .setDescription(
                        `**Max Rounds:** ${game.maxRounds || "Unlimited"}\n` +
                        `**Points to Win:** ${game.maxPoints || "Unlimited"}\n`
                    )
                    .setStatus("Info")
                ).setTitle("General").setDescription("General game settings").setPageId(0).setComponents([
                    ["maxRounds", "Max rounds"], ["maxPoints", "Points to win"]
                ]),
            new Embed()
                .setEmbed(new generateEmbed()
                    .setTitle("Settings: Players")
                    .setDescription(
                        `**Max Players:** ${game.maxPlayers}\n`
                    )
                    .setStatus("Info")
                ).setTitle("Players").setDescription("Players related settings").setPageId(1).setComponents([
                    ["maxPlayers", "Max players"]
                ]),
            new Embed()
                .setEmbed(new generateEmbed()
                    .setTitle("Settings: Timeouts")
                    .setDescription(
                        `**Picking cards:** ${humanizeDuration(game.timeouts.choose * 1000)}\n` +
                        `**Picking a winner:** ${humanizeDuration(game.timeouts.vote * 1000)}\n` +
                        `**Between rounds:** ${humanizeDuration(game.timeouts.roundDelay * 1000)}\n`
                    )
                    .setStatus("Info")
                ).setTitle("Timeouts").setDescription("How long should users have to do certain actions").setPageId(2).setComponents([
                    ["choose", "Picking cards"], ["vote", "Picking a winner"], ["roundDelay", "Between rounds"]
                ]),
            new Embed()
                .setEmbed(new generateEmbed()
                    .setTitle("Settings: Deck")
                    .setDescription(
                        `${game.decks.length} pack${game.decks.length === 1 ? " is" : "s are"} currently in use\n` +
                        `(` +
                        game.decks.map(deck => deck.questions.length).reduce((a, b) => a + b, 0) + ` questions, ` +
                        game.decks.map(deck => deck.answers.length).reduce((a, b) => a + b, 0) + ` answers)\n\n` +
                        `**Blank cards:** ${typeDefs.blanks.options[game.blanks]}\n`
                    )
                    .setStatus("Info")
                ).setTitle("Deck").setDescription("The cards that will be in play").setPageId(3).setComponents([
                    ["decks", "Customise deck..."],
                    ["blanks", "Blank cards"]
                ]),
            new Embed()
                .setEmbed(new generateEmbed()
                    .setTitle("Settings: Add-ons")
                    .setDescription(
                        `**Anonymous voting:** ${game.anonymous ? "Yes" : "No"}\n` +
                        `**Shuffles:** ${game.shuffles ? "Enabled" : "Disabled"}` + (game.shuffles ? `\n> **Cost:** ${game.shuffles} points` : "") + "\n" +
                        `**Hand size:** ${game.handSize}`
                    )
                    .setStatus("Info")
                ).setTitle("Add-ons").setDescription("Spice up your game with add-ons").setPageId(4).setComponents([
                    ["shuffles", "Shuffles", game.shuffles !== -1],
                    ["shufflesCost", "Shuffle cost", undefined, game.shuffles === -1], null,
                    ["anonymousVoting", "Anonymous voting", game.anonymousVoting === true],
                    ["handSize", "Hand size"]
                ])
        ];
        let rows: Discord.MessageActionRow[] = [];
        let row: Discord.MessageButton[] = [];
        for (let i = 0; i < embeds[page].components.length; i++) {
            let component = embeds[page].components[i];
            if (component === null) {
                rows.push(new Discord.MessageActionRow().addComponents(row));
                row = [];
                continue;
            }
            row.push(new Discord.MessageButton()
                .setLabel(component[1])
                .setCustomId(component[0])
                .setStyle(component[2] === undefined ? "SECONDARY" : (component[2] === true ? "SUCCESS" : "DANGER"))
                .setDisabled(component[3] || false)
            );
            if (row.length == 5 || i == embeds[page].components.length - 1) {
                rows.push(new Discord.MessageActionRow().addComponents(row));
                row = [];
            }
        }
        let options = [];
        embeds.forEach(embed => {
            options.push(new SelectMenuOption({
                label: embed.title,
                value: embed.pageId.toString(),
                description: embed.description || "",
            }))
        })
        let selectPane = [new Discord.MessageActionRow().addComponents([
            new Discord.MessageSelectMenu()
                .addOptions(options)
                .setCustomId("page")
                .setMaxValues(1)
                .setPlaceholder("Choose a page...")
        ])]
        rows.forEach(row => selectPane.push(row));
        await interaction.editReply({
            embeds: [
                embeds[page].embed.setFooter({
                    text: game.decks.length ? "Your game is ready to start" : "You need to add at least one deck before you can play"
                })
            ],
            components: selectPane.concat([
                new Discord.MessageActionRow().addComponents([new Discord.MessageButton()
                    .setLabel("Start game")
                    .setStyle("PRIMARY")
                    .setDisabled(!game.decks.length)
                    .setCustomId("start")
                ])
            ])
        });

        let i;
        try { i = await m.awaitMessageComponent({ time: 600000 }); }
        catch (e) { break }
        i.deferUpdate()
        if (i.component.customId == "page") {
            page = parseInt(i.values[0]);
        } else {
            await chooseNumber(interaction, m, 0, 1, typeDefs.maxRounds)
            return;
        }
    }
}

const check = (interaction: CommandInteraction, defaultCheck: WrappedCheck) => {
    return true;
}

export { command };
export { callback };
export { check };