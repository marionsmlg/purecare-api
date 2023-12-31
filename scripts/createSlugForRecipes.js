import db from "src/db.js";
import { slugifyWithCounter } from "@sindresorhus/slugify";
const slugify = slugifyWithCounter();

db.transaction(async (trx) => {
  await trx.schema.table("physical_trait", function (table) {
    table.string("slug").unique();
  });

  // Obtenez toutes les recettes de la base de données
  const recipes = await trx("physical_trait").select("id", "name");

  const updatePromises = recipes.map(async (recipe) => {
    const slug = slugify(recipe.name);

    // Mettez à jour la recette avec le slug généré
    await trx("physical_trait").where("id", recipe.id).update({ slug });
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
