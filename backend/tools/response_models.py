from pydantic import BaseModel
from ..db.models import *

class HTTPNotFound(BaseModel):
    detail: str

class __HTTPUnprocessableContent_Base(BaseModel):
    msg: str
    original_error: str

class HTTPUnprocessableContent_Brand(__HTTPUnprocessableContent_Base):
    blocking_ingredients: list[IngredientPublic]

class HTTPUnprocessableContent_Shelf(__HTTPUnprocessableContent_Base):
    blocking_ingredients: list[IngredientPublic]

class HTTPUnprocessableContent_Ingredient(__HTTPUnprocessableContent_Base):
    blocking_recipe_items: list[RecipeItemPublic]

class HTTPUnprocessableContent_Meal(__HTTPUnprocessableContent_Base):
    blocking_recipe_items: list[RecipeItemPublic]
    blocking_meal_productions: list[MealProductionPublic]
