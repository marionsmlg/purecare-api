CREATE TABLE recipe_category (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO recipe_category (name)
VALUES ('hygiène');

CREATE TABLE product_texture_type (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);


CREATE TABLE product_benefit (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE physical_trait (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  recipe_category_id UUID NOT NULL,
  description TEXT,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE beauty_issue (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  recipe_category_id UUID NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);


CREATE TABLE user_physical_trait (
 user_id VARCHAR(28) PRIMARY KEY,
  skin_type_id UUID NOT NULL,
  hair_type_id UUID NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE user__skin_issue (
 id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
 user_id VARCHAR(28)NOT NULL,
  skin_issue_id UUID NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE user__hair_issue (
 id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
 user_id VARCHAR(28) NOT NULL,
  hair_issue_id UUID NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);

-- CREATE TABLE utensil (
--   id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
--   name VARCHAR(50) NOT NULL,
--   "created_at" TIMESTAMPTZ DEFAULT (now()),
--   "updated_at" TIMESTAMPTZ
-- );

CREATE TABLE product_allergen (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE ingredient (
   id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    img_url TEXT,
    product_url TEXT,
    description TEXT,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE recipe (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    recipe_category_id UUID NOT NULL,
    product_quantity NUMERIC NOT NULL,
    product_quantity_unit VARCHAR(50) NOT NULL,
    img_url TEXT,
    preparation_time VARCHAR(30) NOT NULL,
    product_texture_type_id UUID NOT NULL,
    instructions TEXT NOT NULL,
    storage_time VARCHAR(50) NOT NULL,
    storage_method TEXT NOT NULL,
    safety_precautions TEXT,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ
);



-- TABLES DE LIAISON

CREATE TABLE recipe__product_benefit (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  recipe_id UUID NOT NULL,
   product_benefit_id UUID NOT NULL
);

CREATE TABLE recipe__product_allergen (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  recipe_id UUID,
   product_allergen_id UUID NOT NULL
);

CREATE TABLE recipe__beauty_issue (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  recipe_id UUID NOT NULL,
   beauty_issue_id UUID NOT NULL
);

CREATE TABLE recipe__physical_trait (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  recipe_id UUID NOT NULL,
   physical_trait_id UUID NOT NULL
);


-- CREATE TABLE recipe__utensil (
--   id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
--   recipe_id UUID NOT NULL,
--   utensil_id UUID NOT NULL
-- );


CREATE TABLE recipe__ingredient (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    recipe_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    ingredient_priority_number INT,
    ingredient_quantity TEXT
);

CREATE TABLE recipe__step (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
   recipe_id UUID NOT NULL,
    step_number INT NOT NULL,
    step TEXT NOT NULL
);
