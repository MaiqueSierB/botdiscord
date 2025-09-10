import { Client, Events, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import 'dotenv/config';
import db from "./db.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
const BIRTHDAY_CHANNEL_ID = process.env.BIRTHDAY_CHANNEL_ID;
const monthNames = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// --- LISTAS DE MENSAGENS ALEATÓRIAS ---
const publicMessages = [
    "🎉 Pessoal, hoje é o aniversário de {user}! Vamos todos desejar um feliz aniversário! 🥳🎂",
    "Atenção, galera! Hoje o parabéns vai para o(a) maior resenhudo(a) do servidor: {user}! Bora comemorar!",
    "Hoje pode até ter bolo, porque o aniversariante {user} não é zoião e divide com a galera! Parabéns, meu nobre!",
    "Opa, parece que {user} subiu de nível hoje! Parabéns por completar mais uma volta ao sol. 🎈",
    "Se preparem! A lenda {user} está fazendo aniversário hoje. O servidor está em festa! 🥳",
    "Por decreto deste canal, fica estabelecido que hoje é o dia oficial de parabenizar {user}! Felicidades!",
    "Nem é meme: hoje é mesmo o aniversário de {user}! Mandem os parabéns aí, pessoal!"
];
const privateMessages = [
    "🎉 Parabéns, {name}! Tenha um feliz aniversário! 🥳🎂",
    "E aí, resenhudo(a)! Passando para desejar um feliz aniversário na moral. Que seu dia seja top!",
    "Feliz aniversário, {name}! A gente sabe que você não é zoião, então que a vida te dê tudo em dobro! Tamo junto!",
    "Parabéns, {name}! Tá ficando experiente, hein? Que hoje não te faltem bolo e presentes! 🎁",
    "Feliz dia, {name}! Muita paz, saúde e que a resenha nunca acabe. Parabéns!"
];

// --- FUNÇÃO PARA VERIFICAR ANIVERSÁRIOS ---
async function checkBirthdays(client) {
    console.log('⏰ Verificando aniversários do dia...');
    const now = new Date();
    const today_ddmm = `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    const today_full = now.toISOString().split('T')[0];

    db.prepare('DELETE FROM sent_messages WHERE date != ?').run(today_full);
    const birthdays = db.prepare(`SELECT name, user_id, image_url FROM birthdays WHERE birthday = ?`).all(today_ddmm);
    if (birthdays.length > 0) {
        const channel = await client.channels.fetch(BIRTHDAY_CHANNEL_ID);
        for (const row of birthdays) {
            const alreadySent = db.prepare('SELECT * FROM sent_messages WHERE user_id = ? AND date = ?').get(row.user_id, today_full);
            if (alreadySent) {
                console.log(`[INFO] Mensagem para ${row.name} já foi enviada hoje. A ignorar.`);
                continue;
            }
            console.log(`🎂 Encontrado aniversariante: ${row.name}. A enviar mensagem...`);
            if (row.user_id) {
                try {
                    const user = await client.users.fetch(row.user_id);
                    const publicMessageTemplate = publicMessages[Math.floor(Math.random() * publicMessages.length)];
                    const privateMessageTemplate = privateMessages[Math.floor(Math.random() * privateMessages.length)];
                    const finalPublicMessage = publicMessageTemplate.replace('{user}', `<@${row.user_id}>`);
                    const finalPrivateMessage = privateMessageTemplate.replace('{name}', `**${row.name}**`);
                    if (row.image_url) {
                        const birthdayEmbed = new EmbedBuilder().setTitle(`Feliz Aniversário, ${row.name}!`).setColor('#FFD700').setImage(row.image_url).setTimestamp();
                        await user.send({ content: finalPrivateMessage, embeds: [birthdayEmbed] });
                        await channel.send({ content: finalPublicMessage, embeds: [birthdayEmbed] });
                    } else {
                        await user.send(finalPrivateMessage);
                        await channel.send(finalPublicMessage);
                    }
                    db.prepare('INSERT INTO sent_messages (user_id, date) VALUES (?, ?)').run(row.user_id, today_full);
                    console.log(`✅ Mensagem para ${row.name} enviada e registada.`);
                } catch (err) {
                    console.error(`Falha ao processar aniversário para ${row.name} (ID: ${row.user_id}):`, err);
                }
            }
        }
    } else {
        console.log('✅ Nenhum aniversariante hoje.');
    }
}

// --- Bot pronto ---
client.once(Events.ClientReady, c => {
    console.log(`✅ Bot de aniversários online como ${c.user.tag}`);
    checkBirthdays(c);
});

// --- Lógica dos comandos (Interactions) ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;

    if (commandName === 'addbirthday') {
        const user = interaction.options.getUser('usuario');
        const dateString = interaction.options.getString('data');
        const imageUrl = interaction.options.getString('imagem');
        const regex = /^(\d{2})\/(\d{2})$/;
        const match = dateString.match(regex);
        if (!match) {
            await interaction.reply({ content: 'Formato de data inválido. Por favor, use `DD/MM`.', ephemeral: true });
            return;
        }
        const day = match[1];
        const month = match[2];
        const date = `${day}-${month}`;
        try {
            db.prepare(`
                INSERT INTO birthdays (name, user_id, birthday, image_url)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET 
                    birthday = excluded.birthday, 
                    name = excluded.name,
                    image_url = excluded.image_url
            `).run(user.username, user.id, date, imageUrl);
            await interaction.reply({ content: `🎂 Aniversário de **${user.username}** (ID: \`${user.id}\`) registado para ${day}/${month}!`, ephemeral: true });
            checkBirthdays(interaction.client);
        } catch (err) {
            console.error("Erro ao adicionar aniversário:", err);
            await interaction.reply({ content: 'Ocorreu um erro ao registar o aniversário.', ephemeral: true });
        }
    }

    if (commandName === 'addphoto') {
        const user = interaction.options.getUser('usuario');
        const imageUrl = interaction.options.getString('imagem');
        try {
            const result = db.prepare('UPDATE birthdays SET image_url = ? WHERE user_id = ?').run(imageUrl, user.id);
            if (result.changes > 0) {
                await interaction.reply({ content: `🖼️ Foto do aniversário de ${user.username} atualizada com sucesso!`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ Não foi possível atualizar a foto. O utilizador ${user.username} não tem um aniversário registado. Use o comando \`/addbirthday\` primeiro.`, ephemeral: true });
            }
        } catch (err) {
            console.error("Erro ao adicionar foto:", err);
            await interaction.reply({ content: 'Ocorreu um erro ao tentar atualizar a foto.', ephemeral: true });
        }
    }

    if (commandName === 'removebirthday') {
        const user = interaction.options.getUser('usuario');
        try {
            const result = db.prepare('DELETE FROM birthdays WHERE user_id = ?').run(user.id);
            if (result.changes > 0) {
                await interaction.reply({ content: `Aniversário de ${user.username} removido com sucesso.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `Nenhum aniversário encontrado para ${user.username}.`, ephemeral: true });
            }
        } catch (err) {
            console.error("Erro ao remover aniversário:", err);
            await interaction.reply({ content: 'Ocorreu um erro ao remover o aniversário.', ephemeral: true });
        }
    }

    if (commandName === 'birthdaylist') {
        const month = interaction.options.getInteger('mes');
        try {
            let query = 'SELECT user_id, name, birthday FROM birthdays';
            const params = [];
            let responseTitle = '**Lista de Aniversários:**\n';
            if (month) {
                const formattedMonth = month.toString().padStart(2, '0');
                query += ' WHERE birthday LIKE ?';
                params.push(`%-${formattedMonth}`);
                responseTitle = `**Aniversários em ${monthNames[month]}:**\n`;
            }
            query += ' ORDER BY SUBSTR(birthday, 4, 2), SUBSTR(birthday, 1, 2)';
            const birthdays = db.prepare(query).all(params);
            if (birthdays.length === 0) {
                await interaction.reply(month ? `Nenhum aniversário registado para ${monthNames[month]}!` : 'Nenhum aniversário registado ainda!');
                return;
            }
            const list = birthdays.map(b => `🎂 **${b.name}** (ID: \`${b.user_id}\`) - ${b.birthday.replace('-', '/')}`).join('\n');
            await interaction.reply(responseTitle + list);
        } catch (err) {
            console.error("Erro ao procurar aniversários:", err);
            await interaction.reply({ content: 'Ocorreu um erro ao procurar a lista de aniversários.', ephemeral: true });
        }
    }

    if (commandName === 'nextbirthday') {
        try {
            const allBirthdays = db.prepare('SELECT name, birthday FROM birthdays ORDER BY SUBSTR(birthday, 4, 2), SUBSTR(birthday, 1, 2)').all();
            if (allBirthdays.length === 0) {
                await interaction.reply('Nenhum aniversário registado para que eu possa verificar.');
                return;
            }
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentDay = now.getDate();
            let nextBirthday = null;
            for (const bday of allBirthdays) {
                const [day, month] = bday.birthday.split('-').map(Number);
                if (month > currentMonth || (month === currentMonth && day >= currentDay)) {
                    nextBirthday = bday;
                    break;
                }
            }
            if (!nextBirthday) {
                nextBirthday = allBirthdays[0];
            }
            await interaction.reply(`🎉 O próximo aniversário é o de **${nextBirthday.name}** no dia **${nextBirthday.birthday.replace('-', '/')}**!`);
        } catch (err) {
            console.error("Erro ao verificar o próximo aniversário:", err);
            await interaction.reply({ content: 'Ocorreu um erro ao tentar encontrar o próximo aniversário.', ephemeral: true });
        }
    }

    if (commandName === 'bulkadd') {
        const listString = interaction.options.getString('lista');
        const lines = listString.split('\n');
        const successes = [];
        const failures = [];
        const insert = db.prepare(`
            INSERT INTO birthdays (name, user_id, birthday)
            VALUES (?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET birthday = excluded.birthday
        `);
        const insertMany = db.transaction((entries) => {
            for (const entry of entries) {
                insert.run(entry.name, null, entry.date);
            }
        });
        const entriesToInsert = [];
        for (const line of lines) {
            if (line.trim() === '') continue;
            const regex = /^(.+?)\s*-\s*(\d{2})[\/\-](\d{2})$/;
            const match = line.match(regex);
            if (match) {
                const name = match[1].trim();
                const day = match[2];
                const month = match[3];
                const date = `${day}-${month}`;
                entriesToInsert.push({ name, date });
                successes.push(line.trim());
            } else {
                failures.push(line.trim());
            }
        }
        if (entriesToInsert.length > 0) {
            try {
                insertMany(entriesToInsert);
            } catch (err) {
                console.error("Erro na transação de inserção em massa:", err);
                await interaction.reply({ content: 'Ocorreu um erro grave ao salvar os dados no banco.', ephemeral: true });
                return;
            }
        }
        let response = `✅ **${successes.length} aniversários processados com sucesso!**\n`;
        if (failures.length > 0) {
            response += `\n❌ **${failures.length} linhas falharam por não estarem no formato correto (Nome - DD/MM):**\n\`\`\`\n${failures.join('\n')}\n\`\`\``;
        }
        await interaction.reply({ content: response, ephemeral: true });
    }
});

// --- Verificar aniversários diariamente (a cada 24 horas) ---
setInterval(() => checkBirthdays(client), 24 * 60 * 60 * 1000);

// --- Login ---
client.login(TOKEN);
