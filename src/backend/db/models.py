from sqlmodel import SQLModel, Field

# Why classes are declared like that ? See https://sqlmodel.tiangolo.com/tutorial/fastapi/relationships/

class ShelfBase(SQLModel):
    name: str

class Shelf(ShelfBase, table=True):
    id: int | None = Field(default=None, primary_key=True)   # see https://sqlmodel.tiangolo.com/tutorial/create-db-and-table/#primary-key-id

class ShelfCreate(ShelfBase):
    pass

class ShelfPublic(ShelfBase):
    id: int

class ShelfUpdate(SQLModel):
    name: str | None = None
