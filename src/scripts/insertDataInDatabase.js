import knex from "knex";
import fs from "fs/promises";
import { readFile } from "fs/promises";
import "dotenv/config";

const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  },
});
export default db;

async function insertData() {
  // const data = await readJSON(jsonPath)
  const trx = await db.transaction();
  try {
    await trx("recipe__step").insert(data);

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  } finally {
    await trx.destroy();
  }
}

// await insertData()

export async function readJSON(jsonPath) {
  const dataStr = await fs.readFile(jsonPath);
  console.log(dataStr);
  const data = JSON.parse(dataStr);
  return data;
}
