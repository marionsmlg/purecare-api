import { receiveMessageOnPort } from "worker_threads";
import db from "./insertDataInDatabase.js";
import { slugifyWithCounter } from "@sindresorhus/slugify";
const slugify = slugifyWithCounter();

db.transaction(async (trx) => {
  await trx.schema.table("recipe", function (table) {
    table.string("slug").unique();
  });

  // Obtenez toutes les recettes de la base de données
  const recipes = await trx("recipe").select("id", "title");

  const updatePromises = recipes.map(async (recipe) => {
    const slug = slugify(recipe.title);

    // Mettez à jour la recette avec le slug généré
    await trx("recipe").where("id", recipe.id).update({ slug });
  });

  await Promise.all(updatePromises);
})
  .then(() => {
    console.log(
      "Transaction réussie : Slugs générés et mis à jour avec succès."
    );
  })
  .catch((err) => {
    console.error("Une erreur s'est produite lors de la transaction :", err);
  })
  .finally(() => {
    db.destroy(); // Fermez la connexion à la base de données
  });
