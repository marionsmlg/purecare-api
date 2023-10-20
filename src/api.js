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
        if (searchParams.beauty_issue_slug) {
          data = await fetchRecipesByProblem(searchParams);
        } else {
          const [skinRecipes, hairRecipes] = await Promise.all([
            fetchSkinRecipes(searchParams),
            fetchHairRecipes(searchParams),
          ]);

          data = { skinRecipe: skinRecipes, hairRecipe: hairRecipes };
        }
      } else if (requestURLData.pathname === "/api/v1/beauty-issue") {
        const [hairIssue, skinIssue] = await Promise.all([
          fetchBeautyIssues("Cheveux"),
          fetchBeautyIssues("Visage"),
        ]);

        data = { hairIssue: hairIssue, skinIssue: skinIssue };
      } else if (requestURLData.pathname === "/api/quiz-data-exists") {
        data = await physicalTraitsAndBeautyIssuesExists(searchParams);
      } else if (requestURLData.pathname === "/api/v1/users") {
        const [userPhysicalTrait, userHairIssue, userSkinIssue] =
          await Promise.all([
            fetchUserPhysicalTraits(searchParams),
            fetchUserHairIssueId(searchParams),
            await fetchUserSkinIssueId(searchParams),
          ]);

        data = {
          physicalTrait: userPhysicalTrait,
          hairIssue: userHairIssue,
          skinIssue: userSkinIssue,
        };
      } else if (requestURLData.pathname === "/api/v1/recipe") {
        const recipeId = await fetchIdFromSlug("recipe", searchParams.slug);
        const [
          recipe,
          recipePhysicalTrait,
          recipeBeautyIssue,
          recipeIngredient,
          recipeAllergen,
          recipeStep,
          recipeBenefit,
        ] = await Promise.all([
          fetchRecipeById(recipeId),
          fetchRecipePhysicalTrait(recipeId),
          fetchRecipeBeautyIssues(recipeId),
          fetchRecipeIngredients(recipeId),
          fetchRecipeAllergens(recipeId),
          fetchRecipeSteps(recipeId),
          fetchRecipeBenefits(recipeId),
        ]);

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

async function fetchBeautyIssues(categoryName) {
  return await db("beauty_issue")
    .select(
      "beauty_issue.id",
      "beauty_issue.name",
      "beauty_issue.slug",
      "recipe_category.name as recipe_category_name"
    )
    .leftJoin(
      "recipe_category",
      "beauty_issue.recipe_category_id",
      "recipe_category.id"
    )
    .where("recipe_category.name", categoryName);
}

async function fetchIdFromSlug(tableName, slug) {
  const arrWithId = await db(tableName).select("id").where("slug", slug);
  const id = arrWithId[0].id;
  return id;
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

async function fetchUserHairIssueId(searchParams) {
  try {
    const query = await db("user__hair_issue")
      .select("hair_issue_id")
      .where("user_id", searchParams.user_id);
    return query;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function fetchUserSkinIssueId(searchParams) {
  try {
    const query = await db("user__skin_issue")
      .select("skin_issue_id")
      .where("user_id", searchParams.user_id);
    return query;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
async function fetchUserPhysicalTraits(searchParams) {
  try {
    const query = await db("user_physical_trait")
      .select("skin_type_id", "hair_type_id")
      .where("user_id", searchParams.user_id);
    return query;
  } catch (error) {
    console.error(error);
    throw error;
  }
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

async function fetchRecipeIngredients(recipeId) {
  return await db("recipe__ingredient")
    .select("*")
    .where("recipe_id", recipeId)
    .leftJoin("ingredient", "recipe__ingredient.ingredient_id", "ingredient.id")
    .orderBy("ingredient_priority_number");
}
async function fetchRecipeSteps(recipeId) {
  return await db("recipe__step")
    .select("*")
    .where("recipe_id", recipeId)
    .orderBy("step_number");
}

async function fetchRecipeBenefits(recipeId) {
  return await db("recipe__product_benefit")
    .select("name")
    .where("recipe_id", recipeId)
    .leftJoin(
      "product_benefit",
      "recipe__product_benefit.product_benefit_id",
      "product_benefit.id"
    )
    .orderBy("name");
}
async function fetchRecipeAllergens(recipeId) {
  return await db("recipe__product_allergen")
    .select("name")
    .where("recipe_id", recipeId)
    .leftJoin(
      "product_allergen",
      "recipe__product_allergen.product_allergen_id",
      "product_allergen.id"
    )
    .orderBy("name");
}

async function fetchRecipeBeautyIssues(recipeId) {
  return await db("recipe__beauty_issue")
    .select("name")
    .where("recipe_id", recipeId)
    .leftJoin(
      "beauty_issue",
      "recipe__beauty_issue.beauty_issue_id",
      "beauty_issue.id"
    )
    .orderBy("name");
}
async function fetchRecipePhysicalTrait(recipeId) {
  return await db("recipe__physical_trait")
    .select("name")
    .where("recipe_id", recipeId)
    .leftJoin(
      "physical_trait",
      "recipe__physical_trait.physical_trait_id",
      "physical_trait.id"
    )
    .orderBy("name");
}

async function fetchSkinRecipes(searchParams) {
  const arrOfSkinIssueIds = searchParams.skin_issue_id.split(",");
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
    )

    .where(function () {
      this.where(function () {
        this.whereIn(
          "recipe__beauty_issue.beauty_issue_id",
          arrOfSkinIssueIds
        ).orWhere(
          "recipe__beauty_issue.beauty_issue_id",
          "1ddab218-5489-4891-8fbb-1c7061271dc8"
        );
      }).andWhere(function () {
        this.whereIn("recipe__physical_trait.physical_trait_id", [
          searchParams.skin_type_id,
          "b9f90678-ea3f-4fde-952f-a26a88e13259",
        ]);
      });
    })
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

async function fetchHairRecipes(searchParams) {
  const arrOfHairIssueIds = searchParams.hair_issue_id.split(",");

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
    )
    .where(function () {
      this.where(function () {
        this.whereIn(
          "recipe__beauty_issue.beauty_issue_id",
          arrOfHairIssueIds
        ).orWhere(
          "recipe__beauty_issue.beauty_issue_id",
          "77b4ae6d-a31f-4de5-a731-1249cd87eeff"
        );
      }).andWhere(function () {
        this.whereIn("recipe__physical_trait.physical_trait_id", [
          searchParams.hair_type_id,
          "c8898a24-04cb-4b1f-bb8b-38633aa3c670",
        ]);
      });
    })
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
async function fetchRecipesByProblem(searchParams) {
  const beautyIssueId = await fetchIdFromSlug(
    "beauty_issue",
    searchParams.beauty_issue_slug
  );
  let query = db("recipe")
    .select(
      "recipe.id",
      "recipe.title",
      "recipe_category.name as recipe_category_name",
      "recipe.img_url",
      "recipe.preparation_time",
      "recipe.slug",
      "recipe_category.slug as recipe_category_slug",
      "beauty_issue.name as beauty_issue_name"
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
    .leftJoin("beauty_issue", function () {
      this.on("beauty_issue.id", "=", "recipe__beauty_issue.beauty_issue_id");
    })
    .where("recipe__beauty_issue.beauty_issue_id", beautyIssueId)

    .groupBy(
      "recipe.id",
      "recipe.title",
      "recipe.recipe_category_id",
      "recipe_category.name",
      "recipe.img_url",
      "recipe.preparation_time",
      "recipe_category_slug",
      "beauty_issue.name"
    )
    .limit(searchParams.limit);

  return await query;
}

async function fetchRecipeById(recipeId) {
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
    .where("recipe.id", recipeId);
}
