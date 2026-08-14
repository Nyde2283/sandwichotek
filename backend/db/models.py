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

    ingredients: list[Ingredient] = Relationship(back_populates="shelf", passive_deletes="all")   # see https://sqlmodel.tiangolo.com/tutorial/relationship-attributes/back-populates/#relationship-with-back_populates
db_tables.append(Shelf)

class ShelfCreate(ShelfBase):
    pass

class ShelfPublic(ShelfBase):
    id: int

class ShelfPublicVerbose(ShelfPublic):
    ingredients: list[IngredientPublic]

class ShelfUpdate(SQLModel):
    name: str | None = None

# ---------------------------------------------------------------------------- #

class BrandBase(SQLModel):
    name: str

class Brand(BrandBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    ingredients: list[Ingredient] = Relationship(back_populates="brand", passive_deletes="all")
db_tables.append(Brand)

class BrandCreate(BrandBase):
    pass

class BrandPublic(BrandBase):
    id: int

class BrandPublicVerbose(BrandPublic):
    ingredients: list[IngredientPublic]

class BrandUpdate(SQLModel):
    name: str | None = None

# ---------------------------------------------------------------------------- #

class MealBase(SQLModel):
    name: str = Field(index=True)
    veggy: bool

class Meal(MealBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    meal_productions: list[MealProduction] = Relationship(back_populates="meal", passive_deletes="all")
    recipe_items: list[RecipeItem] = Relationship(back_populates="meal", passive_deletes="all")
db_tables.append(Meal)

class MealCreate(MealBase):
    pass

class MealPublic(MealBase):
    id: int

class MealUpdate(SQLModel):
    name: str | None = None
    veggy: bool | None = None

# ---------------------------------------------------------------------------- #

class IngredientBase(SQLModel):
    name: str = Field(index=True)
    unit: str
    remark: str | None = Field(default=None)
    shelf_id: int | None = Field(default=None, foreign_key="shelf.id", ondelete="RESTRICT")
    brand_id: int | None = Field(default=None, foreign_key="brand.id", ondelete="RESTRICT")

class Ingredient(IngredientBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    shelf: Shelf | None = Relationship(back_populates="ingredients")
    brand: Brand | None = Relationship(back_populates="ingredients")
    recipe_items: list[RecipeItem] = Relationship(back_populates="ingredient", passive_deletes="all")
    shopping_items: list[ShoppingItem] = Relationship(back_populates="ingredient", passive_deletes="all")
db_tables.append(Ingredient)

class IngredientCreate(IngredientBase):
    pass

class IngredientPublic(IngredientBase):
    id: int

class IngredientPublicVerbose(IngredientPublic):
    shelf: ShelfPublic | None = None
    brand: BrandPublic | None = None

class IngredientUpdate(SQLModel):
    name: str | None = None
    unit: str | None = None
    remark: str | None = None
    shelf_id: int | None = None
    brand_id: int | None = None

# ---------------------------------------------------------------------------- #

class RecipeItemBase(SQLModel):
    meal_id: int = Field(primary_key=True, foreign_key="meal.id", ondelete="CASCADE")
    ingredient_id: int = Field(primary_key=True, foreign_key="ingredient.id", ondelete="RESTRICT")
    quantity: float

class RecipeItem(RecipeItemBase, table=True):
    meal: Meal = Relationship(back_populates="recipe_items")
    ingredient: Ingredient = Relationship(back_populates="recipe_items")
db_tables.append(RecipeItem)

class RecipeItemPublic(RecipeItemBase):
    pass

# Abstract representation of recipes for the API

class IngredientItem(SQLModel):
    ingredient: IngredientPublicVerbose
    quantity: float

class Recipe(SQLModel):
    meal_id: int
    items: list[IngredientItem]

class IngredientItemUpdate(SQLModel):
    ingredient_id: int
    quantity: float

class RecipeDeleteItems(SQLModel):
    ingredients_id: list[int]

# ---------------------------------------------------------------------------- #

class MealProductionBase(SQLModel):
    meal_id: int = Field(foreign_key="meal.id", nullable=False, ondelete="RESTRICT")
    date: date
    quantity: int

class MealProduction(MealProductionBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    meal: Meal = Relationship(back_populates="meal_productions")
db_tables.append(MealProduction)

class MealProductionCreate(MealProductionBase):
    pass

class MealProductionPublic(MealProductionBase):
    id: int

class MealProductionPublicVerbose(MealProductionPublic):
    meal: MealPublic | None

class MealProductionUpdate(SQLModel):
    meal_id: int | None = None
    date: date | None = None
    quantity: int | None = None

# ---------------------------------------------------------------------------- #

class ShoppingListBase(SQLModel):
    shopping_date: date
    range_begin: date
    range_end: date

class ShoppingList(ShoppingListBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    shopping_items: list[ShoppingItem] = Relationship(back_populates="shopping_list", passive_deletes="all")
db_tables.append(ShoppingList)

class ShoppingListCreate(ShoppingListBase):
    pass

class ShoppingListPublic(ShoppingListBase):
    id: int
    shopping_items: list[ShoppingItemPublicVerbose]

class ShoppingListUpdate(SQLModel):
    shopping_date: date

# ---------------------------------------------------------------------------- #

class ShoppingItemBase(SQLModel):
    shopping_list_id: int = Field(primary_key=True, foreign_key="shoppinglist.id", nullable=False, ondelete="CASCADE")
    ingredient_id: int = Field(primary_key=True, foreign_key="ingredient.id", nullable=False, ondelete="RESTRICT")
    quantity: float = 0
    bought: bool = False

class ShoppingItem(ShoppingItemBase, table=True):
    shopping_list: ShoppingList = Relationship(back_populates="shopping_items")
    ingredient: Ingredient = Relationship(back_populates="shopping_items")
db_tables.append(ShoppingItem)

class ShoppingItemCreate(ShoppingItemBase):
    pass

class ShoppingItemPublic(ShoppingItemBase):
    pass

class ShoppingItemPublicVerbose(ShoppingItemPublic):
    ingredient: IngredientPublicVerbose

class ShoppingItemUpdate(SQLModel):
    quantity: float | None = None
    bought: bool | None = None
