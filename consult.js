import Database from 'better-sqlite3';

// Conecta-se à mesma base de dados que o bot usa
const db = new Database('servidor.sqlite', { readonly: true });

console.log('Consultando a base de dados...');

try {
  // Prepara a consulta para buscar todos os aniversários, ordenados por mês e depois por dia
  const query = db.prepare(`
    SELECT name, user_id, birthday, image_url 
    FROM birthdays 
    ORDER BY SUBSTR(birthday, 4, 2), SUBSTR(birthday, 1, 2)
  `);

  // Executa a consulta
  const allBirthdays = query.all();

  if (allBirthdays.length === 0) {
    console.log('Nenhum aniversário encontrado na base de dados.');
  } else {
    console.log('--- LISTA DE ANIVERSÁRIOS ---');
    
    // Mostra cada aniversário de forma organizada
    for (const bday of allBirthdays) {
      console.log(
        `- Nome: ${bday.name}, Data: ${bday.birthday.replace('-', '/')}, ID: ${bday.user_id}, Imagem: ${bday.image_url || 'Nenhuma'}`
      );
    }
    
    console.log('-----------------------------');
    console.log(`Total: ${allBirthdays.length} aniversários encontrados.`);
  }
} catch (err) {
  console.error('Ocorreu um erro ao consultar a base de dados:', err.message);
}