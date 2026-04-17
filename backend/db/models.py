from typing import Type
from sqlmodel import SQLModel, Field, Relationship
from datetime import date

db_tables: list[Type[SQLModel]] = []

# TODO : check if some columns need to be indexed in DB
# TODO : Add Unit table to define available units
# Why classes are declared like that ? See https://sqlmodel.tiangolo.com/tutorial/fastapi/relationships/

# ---------------------------------------------------------------------------- #

class ShelfBase(SQLModel):
    name: str

class Shelf(ShelfBase, table=True):
    id: int | None = Field(default=None, primary_key=True)   # see https://sqlmodel.tiangolo.com/tutorial/create-db-and-table/#primary-key-id

    ingredients: list[Ingredient] = Relationship(back_populates="shelf")   # see https://sqlmodel.tiangolo.com/tutorial/relationship-attributes/back-populates/#relationship-with-back_populates
db_tables.append(Shelf)

class ShelfCreate(ShelfBase):
    pass

class ShelfPublic(ShelfBase):
    id: int

class ShelfUpdate(SQLModel):
    name: str | None = None

# ---------------------------------------------------------------------------- #

class BrandBase(SQLModel):
    name: str

class Brand(BrandBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    ingredients: list[Ingredient] = Relationship(back_populates="brand")
db_tables.append(Brand)

class BrandCreate(BrandBase):
    pass

class BrandPublic(BrandBase):
    id: int

class BrandUpdate(SQLModel):
    name: str | None = None

# ---------------------------------------------------------------------------- #

class MealBase(SQLModel):
    name: str
    veggy: bool

class Meal(MealBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    meal_productions: list[MealProduction] = Relationship(back_populates="meal")
    recipe_items: list[RecipeItem] = Relationship(back_populates="meal")
db_tables.append(Meal)

class MealCreate(MealBase):
    pass

class MealPublic(MealBase):
    id: int

class MealUpdate(SQLModel):
    name: str | None = None
    veggy: bool

# ---------------------------------------------------------------------------- #

class IngredientBase(SQLModel):
    name: str = Field(index=True)
    unit: str
    remark: str | None = Field(default=None)
    shelf_id: int | None = Field(default=None, foreign_key="shelf.id", ondelete="SET NULL")
    brand_id: int | None = Field(default=None, foreign_key="brand.id", ondelete="SET NULL")

class Ingredient(IngredientBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    shelf: Shelf | None = Relationship(back_populates="ingredients")
    brand: Brand | None = Relationship(back_populates="ingredients")
    recipe_items: list[RecipeItem] = Relationship(back_populates="ingredient")
db_tables.append(Ingredient)

class IngredientCreate(IngredientBase):
    pass

class IngredientPublic(IngredientBase):
    id: int

class IngredientPublicVerbose(IngredientPublic):
    shelf: ShelfPublic | None = None
    brand: BrandPublic | None = None
    recipe_items: list[RecipeItemPublic] = []

class IngredientUpdate(SQLModel):
    name: str | None = None
    unit: str | None = None
    remark: str | None = None
    shelf_id: int | None = None
    brand_id: int | None = None

# ---------------------------------------------------------------------------- #

class RecipeItemBase(SQLModel):
    quantity: float

class RecipeItem(RecipeItemBase, table=True):
    meal_id: int | None = Field(default=None, primary_key=True, foreign_key="meal.id", ondelete="RESTRICT")
    ingredient_id: int | None = Field(default=None, primary_key=True, foreign_key="ingredient.id", ondelete="RESTRICT")

    meal: Meal = Relationship(back_populates="recipe_items")
    ingredient: Ingredient = Relationship(back_populates="recipe_items")
db_tables.append(RecipeItem)

class RecipeItemCreate(RecipeItemBase):
    meal_id: int
    ingredient_id: int

class RecipeItemPublic(RecipeItemBase):
    meal_id: int
    ingredient_id: int

class RecipeItemPublicVerbose(RecipeItemPublic):
    meal: Meal
    ingredient: Ingredient

class RecipeItemUpdate(SQLModel):
    quantity: int | None = None

# ---------------------------------------------------------------------------- #

class MealProductionBase(SQLModel):
    date: date
    quantity: int
    cost_per_meal: float | None = Field(default=None)

class MealProduction(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    meal_id: int = Field(foreign_key="meal.id", ondelete="RESTRICT")
    meal: Meal = Relationship(back_populates="meal_productions")
db_tables.append(MealProduction)

class MealProductionCreate(MealProductionBase):
    meal_id: int

class MealProductionPublic(MealProductionBase):
    id: int
    meal_id: int

class MealProductionVerbose(MealProductionPublic):
    meal: Meal
