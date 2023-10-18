import http from "http";
import db from "./scripts/insertDataInDatabase.js";
import { readBody } from "./utils.js";
import { firebaseApp } from "./firebaseconfig.js";
import { getAuth } from "firebase-admin/auth";
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
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.setHeader("Access-Control-Allow-Credentials", true);

    const body = await readBody(request);

    const apiEndpoints = {
      "/api/recipe-category": "recipe_category",
      "/api/beauty-issue": "beauty_issue",
      "/api/physical-trait": "physical_trait",
    };

    if (requestURLData.pathname === "/") {
      response.statusCode = 200;
      response.end("Status : ok");
    }

    const token = request.headers.authorization;

    if (request.method === "GET") {
      const searchParams = Object.fromEntries(requestURLData.searchParams);
      let data;

      for (const path in apiEndpoints) {
        if (requestURLData.pathname === path) {
          const tableName = apiEndpoints[path];
          data = await fetchDataFromTable(tableName);
        }
      }
      if (requestURLData.pathname === "/api/v1/recipes") {
        if (searchParams.physical_trait_id && searchParams.beauty_issue_id) {
          const arrOfPhysicalTraitIds =
            searchParams.physical_trait_id.split(",");
          const arrOfBeautyIssueIds = searchParams.beauty_issue_id.split(",");
          data = await fetchRecipes(
            searchParams,
            arrOfPhysicalTraitIds,
            arrOfBeautyIssueIds
          );
        } else {
          const arrOfSkinTypeIds = searchParams.skin_type_id.split(",");
          const arrOfSkinIssueIds = searchParams.skin_issue_id.split(",");
          const arrOfHairTypeIds = searchParams.hair_type_id.split(",");
          const arrOfHairIssueIds = searchParams.hair_issue_id.split(",");
          const skinRecipes = await fetchRecipes(
            searchParams,
            arrOfSkinTypeIds,
            arrOfSkinIssueIds
          );
          const hairRecipes = await fetchRecipes(
            searchParams,
            arrOfHairTypeIds,
            arrOfHairIssueIds
          );
          data = { skinRecipe: skinRecipes, hairRecipe: hairRecipes };
        }
      } else if (requestURLData.pathname === "/api/user") {
        data = await userExists(searchParams);
      } else if (requestURLData.pathname === "/api/quiz-data-exists") {
        data = await physicalTraitsAndBeautyIssuesExists(searchParams);
      } else if (requestURLData.pathname === "/api/v1/users") {
        const userPhysicalTrait = await fetchUserPhysicalTraits(searchParams);
        const userHairIssue = await fetchUserHairIssueId(searchParams);
        const userSkinIssue = await fetchUserSkinIssueId(searchParams);
        data = {
          physicalTrait: userPhysicalTrait,
          hairIssue: userHairIssue,
          skinIssue: userSkinIssue,
        };
      } else if (requestURLData.pathname === "/api/v1/recipe") {
        const recipe = await fetchRecipeById(searchParams);
        const recipePhysicalTrait = await fetchRecipePhysicalTrait(
          searchParams
        );
        const recipeBeautyIssue = await fetchRecipeBeautyIssues(searchParams);
        const recipeIngredient = await fetchRecipeIngredients(searchParams);
        const recipeAllergen = await fetchRecipeAllergens(searchParams);
        const recipeStep = await fetchRecipeSteps(searchParams);
        const recipeBenefit = await fetchRecipeBenefits(searchParams);
        data = {
          recipe: recipe,
          physicalTrait: recipePhysicalTrait,
          beautyIssue: recipeBeautyIssue,
          ingredient: recipeIngredient,
          allergen: recipeAllergen,
          step: recipeStep,
          benefit: recipeBenefit,
        };
      }
      response.statusCode = 200;
      response.end(JSON.stringify(data));
    } else if (request.method === "POST") {
      const form = JSON.parse(body);
      if (requestURLData.pathname === "/api/v1/users") {
        if (!token || !token.startsWith("Bearer ")) {
          response.statusCode = 401;
          response.end("Missing token");

          return;
        }

        const userToken = token.split("Bearer ")[1];

        try {
          const decodedToken = await getAuth(firebaseApp).verifyIdToken(
            userToken
          );
          const currentUserId = decodedToken.uid;
          await insertUserPhysicalTrait(form, currentUserId);

          response.statusCode = 302;
          response.end();
        } catch (error) {
          console.error(error);
          response.statusCode = 401;
          response.end("Forbidden");
        }
      }
    } else if (request.method === "OPTIONS") {
      response.statusCode = 200;
      response.end();
    } else if (request.method === "PUT") {
      const form = JSON.parse(body);
      if (requestURLData.pathname === "/api/v1/users") {
        if (!token || !token.startsWith("Bearer ")) {
          response.statusCode = 401;
          response.end("Missing token");

          return;
        }
        const userToken = token.split("Bearer ")[1];

        try {
          const decodedToken = await getAuth(firebaseApp).verifyIdToken(
            userToken
          );
          const currentUserId = decodedToken.uid;
          await updateUserBeautyProfile(form, currentUserId);
          response.statusCode = 302;
          response.end();
        } catch (error) {
          console.error(error);
          response.statusCode = 401;
          response.end("Forbidden");
        }
      }
    } else if (request.method === "DELETE") {
      if (requestURLData.pathname === "/api/v1/users") {
        if (!token || !token.startsWith("Bearer ")) {
          response.statusCode = 401;
          response.end("Missing token");

          return;
        }
        const userToken = token.split("Bearer ")[1];

        try {
          const decodedToken = await getAuth(firebaseApp).verifyIdToken(
            userToken
          );
          const currentUserId = decodedToken.uid;
          await deleteUserBeautyProfile(currentUserId);
          response.statusCode = 302;
          response.end();
        } catch (error) {
          console.error(error);
          response.statusCode = 401;
          response.end("Forbidden");
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

async function deleteUserBeautyProfile(userId) {
  await db("user_physical_trait").where("user_id", userId).del();
  await db("user__skin_issue").where("user_id", userId).del();
  await db("user__hair_issue").where("user_id", userId).del();
  return;
}

async function updateUserBeautyProfile(form, userId) {
  const arrOfSkinIssueIds = form.skin_issue_id.split(",");
  const arrOfHairIssueIds = form.hair_issue_id.split(",");
  await db("user_physical_trait").where("user_id", userId).update({
    skin_type_id: form.skin_type_id,
    hair_type_id: form.hair_type_id,
  });
  await db("user__skin_issue").where("user_id", userId).del();
  for (const skinIssueId of arrOfSkinIssueIds) {
    await db("user__skin_issue").insert({
      user_id: userId,
      skin_issue_id: skinIssueId,
    });
  }
  await db("user__hair_issue").where("user_id", userId).del();
  for (const hairIssueId of arrOfHairIssueIds) {
    await db("user__hair_issue").insert({
      user_id: userId,
      hair_issue_id: hairIssueId,
    });
  }
  return;
}

async function insertUserPhysicalTrait(form, userId) {
  const arrOfSkinIssueIds = form.skin_issue_id.split(",");
  const arrOfHairIssueIds = form.hair_issue_id.split(",");
  await db("user_physical_trait").insert({
    user_id: userId,
    skin_type_id: form.skin_type_id,
    hair_type_id: form.hair_type_id,
  });
  for (const skinIssueId of arrOfSkinIssueIds) {
    await db("user__skin_issue").insert({
      user_id: userId,
      skin_issue_id: skinIssueId,
    });
  }
  for (const hairIssueId of arrOfHairIssueIds) {
    await db("user__hair_issue").insert({
      user_id: userId,
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

async function fetchRecipes(
  searchParams,
  arrOfPhysicalTraitIds,
  arrOfBeautyIssueIds
) {
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
    .where("recipe.id", searchParams.recipe_id);
}
