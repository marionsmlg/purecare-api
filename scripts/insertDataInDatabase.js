import fs from "fs/promises";
import { readFile } from "fs/promises";
import db from "src/db.js";

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
