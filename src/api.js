import http from "http";
import db from "./scripts/insertDataInDatabase.js";

const PORT = 3000;
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.info(`Server started on port ${PORT}`);
});

async function handleRequest(request, response) {
  try {
    const requestURLData = new URL(request.url, `http://localhost:${PORT}`);
    console.info(`\n---\nRequest ${new Date().getTime()}`, {
      method: request.method,
      url: request.url,
      requestURLData,
    });

    if (request.method === "GET") {
      const apiEndpoints = {
        "/api/test": "recipe",
        "/api/recipe": "recipe",
        "/api/recipe-category": "recipe_category",
        "/api/ingredient": "ingredient",
        "/api/beauty-issue": "beauty_issue",
        "/api/physical-trait": "physical_trait",
        "/api/product-allergen": "product_allergen",
        "/api/product-benefit": "product_benefit",
        "/api/product-texture-type": "product_texture_type",
        "/api/recipe-ingredient": "recipe__ingredient",
        "/api/recipe-step": "recipe__step",
        "/api/recipe-product-benefit": "recipe__product_benefit",
        "/api/recipe-product-allergen": "recipe__product_allergen",
        "/api/recipe-beauty-issue": "recipe__beauty_issue",
        "/api/recipe-physical-trait": "recipe__physical_trait",
        "/api/user-physical-trait-fetch": "user_physical_trait",
        "/api/user-physical-trait": "user_physical_trait",
        "/api/user-hair-issue": "user__hair_issue",
        "/api/user-skin-issue": "user__skin_issue",
        "/api/user": "user__physical_trait",
        "/api/quiz-data-exists": "physical_trait",
        "/api/user-update-beauty-profile": "user_physical_trait",
        "/api/user-delete": "user_physical_trait",
      };

      for (const path in apiEndpoints) {
        if (requestURLData.pathname === path) {
          const tableName = apiEndpoints[path];
          const searchParams = Object.fromEntries(requestURLData.searchParams);
          let data;

          if (path === "/api/recipe") {
            data = searchParams.id
              ? await fetchRecipeById(searchParams)
              : await fetchDataAndJoinLeft(searchParams);
          } else if (path === "/api/recipe-ingredient") {
            data = await fetchRecipeIngredients(searchParams);
          } else if (path === "/api/recipe-step") {
            data = await fetchRecipeSteps(searchParams);
          } else if (path === "/api/recipe-product-benefit") {
            data = await fetchRecipeBenefits(searchParams);
          } else if (path === "/api/recipe-product-allergen") {
            data = await fetchRecipeAllergens(searchParams);
          } else if (path === "/api/recipe-beauty-issue") {
            data = await fetchRecipeBeautyIssues(searchParams);
          } else if (path === "/api/recipe-physical-trait") {
            data = await fetchRecipePhysicalTrait(searchParams);
          } else if (path === "/api/user-physical-trait-fetch") {
            data = await fetchUserPhysicalTraits(searchParams);
          } else if (path === "/api/user-physical-trait") {
            await insertUserPhysicalTrait(searchParams);
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader(
              "Access-Control-Allow-Methods",
              "GET, POST, PUT, DELETE"
            );
            response.setHeader("Access-Control-Allow-Headers", "*");
            response.statusCode = 302;
            response.end();
            return;
          } else if (path === "/api/user-update-beauty-profile") {
            await updateUserBeautyProfile(searchParams);
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader(
              "Access-Control-Allow-Methods",
              "GET, POST, PUT, DELETE"
            );
            response.setHeader("Access-Control-Allow-Headers", "*");
            response.statusCode = 302;
            response.end();
            return;
          } else if (path === "/api/user-delete") {
            await deleteUserBeautyProfile(searchParams);
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader(
              "Access-Control-Allow-Methods",
              "GET, POST, PUT, DELETE"
            );
            response.setHeader("Access-Control-Allow-Headers", "*");
            response.statusCode = 302;
            response.end();
            return;
          } else if (path === "/api/user-hair-issue") {
            data = await fetchUserHairIssueId(searchParams);
          } else if (path === "/api/user-skin-issue") {
            data = await fetchUserSkinIssueId(searchParams);
          } else if (path === "/api/user") {
            data = await userExists(searchParams);
          } else if (path === "/api/quiz-data-exists") {
            data = await physicalTraitsAndBeautyIssuesExists(searchParams);
          } else {
            data = await fetchDataFromTable(tableName);
          }
          response.setHeader("Access-Control-Allow-Origin", "*");
          response.setHeader(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE"
          );
          response.setHeader("Access-Control-Allow-Headers", "*");
          response.statusCode = 200;
          response.end(JSON.stringify(data));
          return;
        }
      }
    } else {
      response.statusCode = 404;
      response.end("Erreur 404");
    }
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.end("Internal server error");
  }
}

async function physicalTraitsAndBeautyIssuesExists(searchParams) {
  const arrOfSkinIssueIds = searchParams.skin_issue_id.split(",");
  const arrOfHairIssueIds = searchParams.hair_issue_id.split(",");

  try {
    const resultSkinType = await db("physical_trait")
      .select("id")
      .where("id", searchParams.skin_type_id);

    const resultHairType = await db("physical_trait")
      .select("id")
      .where("id", searchParams.hair_type_id);
    for (const skinIssueId of arrOfSkinIssueIds) {
      const resultSkinIssue = await db("beauty_issue")
        .select("id")
        .where("id", skinIssueId);

      if (resultSkinIssue.length === 0) {
        return false;
      }
    }
    for (const hairIssueId of arrOfHairIssueIds) {
      const resultHairIssue = await db("beauty_issue")
        .select("id")
        .where("id", hairIssueId);

      if (resultHairIssue.length === 0) {
        return false;
      }
    }
    return resultSkinType.length > 0 && resultHairType.length > 0;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function userExists(searchParams) {
  try {
    const result = await db("user_physical_trait")
      .select("user_id")
      .where("user_id", searchParams.user_id);
    return result.length > 0;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
async function fetchUserHairIssueId(searchParams) {
  return await db("user__hair_issue")
    .select("hair_issue_id")
    .where("user_id", searchParams.user_id);
}
async function fetchUserSkinIssueId(searchParams) {
  return await db("user__skin_issue")
    .select("skin_issue_id")
    .where("user_id", searchParams.user_id);
}
async function fetchUserPhysicalTraits(searchParams) {
  return await db("user_physical_trait")
    .select("skin_type_id", "hair_type_id")
    .where("user_id", searchParams.user_id);
}

async function deleteUserBeautyProfile(searchParams) {
  await db("user_physical_trait").where("user_id", searchParams.user_id).del();
  await db("user__skin_issue").where("user_id", searchParams.user_id).del();
  await db("user__hair_issue").where("user_id", searchParams.user_id).del();
  return;
}

async function updateUserBeautyProfile(searchParams) {
  const arrOfSkinIssueIds = searchParams.skin_issue_id.split(",");
  const arrOfHairIssueIds = searchParams.hair_issue_id.split(",");
  await db("user_physical_trait")
    .where("user_id", searchParams.user_id)
    .update({
      skin_type_id: searchParams.skin_type_id,
      hair_type_id: searchParams.hair_type_id,
    });
  await db("user__skin_issue").where("user_id", searchParams.user_id).del();
  for (const skinIssueId of arrOfSkinIssueIds) {
    await db("user__skin_issue").insert({
      user_id: searchParams.user_id,
      skin_issue_id: skinIssueId,
    });
  }
  await db("user__hair_issue").where("user_id", searchParams.user_id).del();
  for (const hairIssueId of arrOfHairIssueIds) {
    await db("user__hair_issue").insert({
      user_id: searchParams.user_id,
      hair_issue_id: hairIssueId,
    });
  }
  return;
}

async function insertUserPhysicalTrait(searchParams) {
  const arrOfSkinIssueIds = searchParams.skin_issue_id.split(",");
  const arrOfHairIssueIds = searchParams.hair_issue_id.split(",");
  await db("user_physical_trait").insert({
    user_id: searchParams.user_id,
    skin_type_id: searchParams.skin_type_id,
    hair_type_id: searchParams.hair_type_id,
  });
  for (const skinIssueId of arrOfSkinIssueIds) {
    await db("user__skin_issue").insert({
      user_id: searchParams.user_id,
      skin_issue_id: skinIssueId,
    });
  }
  for (const hairIssueId of arrOfHairIssueIds) {
    await db("user__hair_issue").insert({
      user_id: searchParams.user_id,
      hair_issue_id: hairIssueId,
    });
  }
  return;
}

async function fetchDataFromTable(tableName) {
  return await db(tableName).select("*").orderBy("created_at", "desc");
}

async function fetchRecipeIngredients(searchParams) {
  return await db("recipe__ingredient")
    .select("*")
    .where("recipe_id", searchParams.recipe_id)
    .leftJoin("ingredient", "recipe__ingredient.ingredient_id", "ingredient.id")
    .orderBy("ingredient_priority_number");
}
async function fetchRecipeSteps(searchParams) {
  return await db("recipe__step")
    .select("*")
    .where("recipe_id", searchParams.recipe_id)
    .orderBy("step_number");
}

async function fetchRecipeBenefits(searchParams) {
  return await db("recipe__product_benefit")
    .select("name")
    .where("recipe_id", searchParams.recipe_id)
    .leftJoin(
      "product_benefit",
      "recipe__product_benefit.product_benefit_id",
      "product_benefit.id"
    )
    .orderBy("name");
}
async function fetchRecipeAllergens(searchParams) {
  return await db("recipe__product_allergen")
    .select("name")
    .where("recipe_id", searchParams.recipe_id)
    .leftJoin(
      "product_allergen",
      "recipe__product_allergen.product_allergen_id",
      "product_allergen.id"
    )
    .orderBy("name");
}

async function fetchRecipeBeautyIssues(searchParams) {
  return await db("recipe__beauty_issue")
    .select("name")
    .where("recipe_id", searchParams.recipe_id)
    .leftJoin(
      "beauty_issue",
      "recipe__beauty_issue.beauty_issue_id",
      "beauty_issue.id"
    )
    .orderBy("name");
}
async function fetchRecipePhysicalTrait(searchParams) {
  return await db("recipe__physical_trait")
    .select("name")
    .where("recipe_id", searchParams.recipe_id)
    .leftJoin(
      "physical_trait",
      "recipe__physical_trait.physical_trait_id",
      "physical_trait.id"
    )
    .orderBy("name");
}

async function fetchDataAndJoinLeft(searchParams) {
  const arrOfPhysicalTraitIds = searchParams.physical_trait_id.split(",");
  const arrOfBeautyIssueIds = searchParams.beauty_issue_id.split(",");
  console.log({ arrOfPhysicalTraitIds, arrOfBeautyIssueIds });
  let query = db("recipe")
    .select(
      "recipe.id",
      "recipe.title",
      "recipe_category.name as recipe_category_name",
      "recipe.img_url",
      "recipe.preparation_time"
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
    )
    .whereIn("recipe__physical_trait.physical_trait_id", arrOfPhysicalTraitIds)
    .whereIn("recipe__beauty_issue.beauty_issue_id", arrOfBeautyIssueIds)
    .groupBy(
      "recipe.id",
      "recipe.title",
      "recipe.recipe_category_id",
      "recipe_category.name",
      "recipe.img_url",
      "recipe.preparation_time"
    )
    .limit(searchParams.limit);

  return await query;
}

async function fetchRecipeById(searchParams) {
  return await db
    .select(
      "recipe.id",
      "recipe.title",
      "recipe.recipe_category_id",
      "recipe.product_quantity",
      "recipe.product_quantity_unit",
      "recipe.img_url",
      "recipe.preparation_time",
      "recipe.product_texture_type_id",
      "recipe.instructions",
      "recipe.storage_time",
      "recipe.storage_method",
      "recipe.safety_precautions",
      "product_texture_type.name as product_texture_type_name",
      "recipe_category.name as recipe_category_name"
    )
    .from("recipe")
    .join(
      "product_texture_type",
      "recipe.product_texture_type_id",
      "product_texture_type.id"
    )
    .join("recipe_category", "recipe.recipe_category_id", "recipe_category.id")
    .where("recipe.id", searchParams.id);
}
