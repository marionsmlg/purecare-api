import { receiveMessageOnPort } from "worker_threads";
import db from "./insertDataInDatabase.js";
import { slugifyWithCounter } from "@sindresorhus/slugify";
const slugify = slugifyWithCounter();

// db.transaction(async (trx) => {
//   await trx.schema.table("physical_trait", function (table) {
//     table.string("slug").unique();
//   });

//   // Obtenez toutes les recettes de la base de données
//   const recipes = await trx("physical_trait").select("id", "name");

//   const updatePromises = recipes.map(async (recipe) => {
//     const slug = slugify(recipe.name);

//     // Mettez à jour la recette avec le slug généré
//     await trx("physical_trait").where("id", recipe.id).update({ slug });
//   });

//   await Promise.all(updatePromises);
// })
//   .then(() => {
//     console.log(
//       "Transaction réussie : Slugs générés et mis à jour avec succès."
//     );
//   })
//   .catch((err) => {
//     console.error("Une erreur s'est produite lors de la transaction :", err);
//   })
//   .finally(() => {
//     db.destroy(); // Fermez la connexion à la base de données
//   });

async function fetchBeautyProfile(searchParams) {
  try {
    const skinType = await db("physical_trait")
      .select("physical_trait.id", "physical_trait.name")
      .where("id", searchParams.skin_type_id);

    const hairType = await db("physical_trait")
      .select("physical_trait.id", "physical_trait.name")
      .where("id", searchParams.hair_type_id);

    const hairIssue = await db("beauty_issue")
      .select("beauty_issue.id", "beauty_issue.name")
      .whereIn("id", [
        "72491516-9c47-423f-b777-6a416a5cc3bc",
        "6063051d-4b4d-400a-843b-389402c7f389",
      ]);
    const skinIssue = await db("beauty_issue")
      .select("beauty_issue.id", "beauty_issue.name")
      .whereIn("id", [
        "46bddcbc-c699-498c-8ad0-27a88b573e3a",
        "3828c0af-567a-4232-ae5d-e96f7ee3cd17",
      ]);

    return {
      skinType: skinType,
      hairType: hairType,
      skinIssue: skinIssue,
      hairIssue: hairIssue,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
const data = await fetchPhysicalTraits({
  skin_type_id: "b9f90678-ea3f-4fde-952f-a26a88e13259",
  hair_type_id: "d5ff6060-6707-4fe7-b437-4c0a5aa621fa",
});

console.log(data.skinType[0].name);
