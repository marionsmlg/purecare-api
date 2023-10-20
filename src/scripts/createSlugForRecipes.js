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

async function fetchRecipes(searchParams) {
  let query = db("recipe")
    .select(
      "recipe.id",
      "recipe.title",
      "recipe_category.name as recipe_category_name",
      "recipe.img_url",
      "recipe.preparation_time",
      "recipe.slug",
      "recipe_category.slug as recipe_category_slug"
    )
    .countDistinct("recipe__ingredient.ingredient_id as ingredient_count")
    .innerJoin(
      "recipe__beauty_issue",
      "recipe.id",
      "recipe__beauty_issue.recipe_id"
    )
    .innerJoin(
      "recipe__physical_trait",
      "recipe.id",
      "recipe__physical_trait.recipe_id"
    )
    .leftJoin("recipe__ingredient", "recipe.id", "recipe__ingredient.recipe_id")
    .leftJoin(
      "recipe_category",
      "recipe.recipe_category_id",
      "recipe_category.id"
    );

  if (searchParams.skin_type_id && searchParams.skin_issue_id) {
    const arrOfSkinIssueIds = searchParams.skin_issue_id.split(",");
    const arrOfSkinIssueIdsAndNoProbId = arrOfSkinIssueIds.push(
      "1ddab218-5489-4891-8fbb-1c7061271dc8"
    );
    console.log(arrOfSkinIssueIdsAndNoProbId);
    query
      .whereIn("recipe__physical_trait.physical_trait_id", [
        searchParams.skin_type_id,
        "b9f90678-ea3f-4fde-952f-a26a88e13259",
      ])
      .whereIn("recipe__beauty_issue.beauty_issue_id", arrOfSkinIssueIds)
      .groupBy(
        "recipe.id",
        "recipe.title",
        "recipe.recipe_category_id",
        "recipe_category.name",
        "recipe.img_url",
        "recipe.preparation_time",
        "recipe_category_slug"
      )
      .limit(searchParams.limit);
    return await query;
  } else if (searchParams.hair_type_id && searchParams.hair_issue_id) {
    const arrOfHairIssueIds = searchParams.hair_issue_id.split(",");
    const arrOfHairIssueIdsAndNoProbId = arrOfHairIssueIds.push(
      "77b4ae6d-a31f-4de5-a731-1249cd87eeff"
    );
    console.log(arrOfHairIssueIdsAndNoProbId);

    query
      .whereIn("recipe__physical_trait.physical_trait_id", [
        searchParams.hair_type_id,
        "c8898a24-04cb-4b1f-bb8b-38633aa3c670",
      ])
      .whereIn("recipe__beauty_issue.beauty_issue_id", arrOfHairIssueIds)
      .groupBy(
        "recipe.id",
        "recipe.title",
        "recipe.recipe_category_id",
        "recipe_category.name",
        "recipe.img_url",
        "recipe.preparation_time",
        "recipe_category_slug"
      )
      .limit(searchParams.limit);

    return await query;
  }
}
console.log(
  await fetchRecipes({
    skin_type_id: "4956b63e-b848-40b4-bc92-02c4b3d9abe9",
    skin_issue_id: "bb83b3da-fb57-44db-8d4e-e5e8276b30f9",
    hair_type_id: "f59480ff-faf5-4664-a897-743c60c1b8c2",
    hair_issue_id: "72491516-9c47-423f-b777-6a416a5cc3bc",
    limit: 5,
  })
);
