import { REST, Routes, SlashCommandBuilder } from "discord.js";
import 'dotenv/config';

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [
  new SlashCommandBuilder()
    .setName("addbirthday")
    .setDescription("Adiciona ou atualiza o aniversário de um usuário")
    .addUserOption(option =>
      option.setName("usuario")
        .setDescription("O usuário para adicionar o aniversário")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("data")
        .setDescription("A data de aniversário no formato DD/MM (ex: 23/05)")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("imagem")
        .setDescription("URL de uma imagem para o cartão de aniversário (opcional)")
        .setRequired(false)),
  
  new SlashCommandBuilder()
    .setName("removebirthday")
    .setDescription("Remove o aniversário de um usuário")
    .addUserOption(option =>
        option.setName("usuario")
            .setDescription("O usuário para remover o aniversário")
            .setRequired(true)),

  new SlashCommandBuilder()
    .setName("birthdaylist")
    .setDescription("Mostra a lista de aniversários cadastrados")
    .addIntegerOption(option =>
      option.setName("mes")
        .setDescription("Filtra a lista por um mês específico")
        .setRequired(false)
        .addChoices(
            { name: 'Janeiro', value: 1 }, { name: 'Fevereiro', value: 2 },
            { name: 'Março', value: 3 }, { name: 'Abril', value: 4 },
            { name: 'Maio', value: 5 }, { name: 'Junho', value: 6 },
            { name: 'Julho', value: 7 }, { name: 'Agosto', value: 8 },
            { name: 'Setembro', value: 9 }, { name: 'Outubro', value: 10 },
            { name: 'Novembro', value: 11 }, { name: 'Dezembro', value: 12 }
        )
    ),
  
  // NOVO COMANDO ADICIONADO AQUI
  new SlashCommandBuilder()
    .setName("nextbirthday")
    .setDescription("Mostra qual é o próximo aniversário"),

  new SlashCommandBuilder()
    .setName("bulkadd")
    .setDescription("Adiciona vários aniversários de uma vez (não salva imagens)")
    .addStringOption(option => 
      option.setName("lista")
        .setDescription("Copie e cole a lista aqui. Formato: Nome - DD/MM (um por linha)")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`⏳ Registrando ${commands.length} comando(s)...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log(`✅ ${data.length} comando(s) registrado(s) com sucesso!`);
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
})();