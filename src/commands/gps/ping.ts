import Discord, { CommandInteraction, DiscordAPIError } from "discord.js";
import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { WrappedCheck } from "jshaiku";
import generateEmbed from "../../utils/generateEmbed.js";

const command = (builder: SlashCommandSubcommandBuilder) =>
    builder
    .setName("ping")
    .setDescription("*Taps microphone* Is this thing on?")

const callback = async(interaction: CommandInteraction) => {
    let initial = new Date().getTime();
    await interaction.reply({embeds: [new generateEmbed()
        .setTitle("Ping")
        .setDescription(`Checking ping times...`)
        .setStatus("Danger")
    ], ephemeral: true});
    let ping = new Date().getTime() - initial;
    interaction.editReply({embeds: [new generateEmbed()
        .setTitle("Ping")
        .setDescription(
            `**Ping:** \`${ping}ms\`\n` +
            `**To Discord:** \`${interaction.client.ws.ping}ms\`\n` +
            `**From Expected:** \`±${Math.abs((ping / 2) - interaction.client.ws.ping)}ms\``
        )
        .setStatus("Info")
    ]})
}

const check = (interaction: CommandInteraction, defaultCheck: WrappedCheck) => {
    return true;
}

export { command };
export { callback };
export { check };