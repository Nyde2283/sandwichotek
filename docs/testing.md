# Testing doc

Link to [Documentation index](doc_index.md).

To contribute, it is required that you write tests for your code.

## How to write tests

For examplen, let's say we have implemented a new entity `SuperObject` in the DB and that we have also implemented all the path operations for it in the file `backend/routers/superobject.py`.

The convention is to create a test file called `test_superobject.py` in the folder `tests`. We named it like that because the file it tests is called ***superobject***.py.

For each test, you write a function which have a really explicit name. You really want the name to be clear because this is what pytest will use to tell you which test failed.

The DB is wiped and inited for you before each test (each test function) so that the DB state you get is independant of the call order.

<!-- TODO : Parler de la fixture qui feed la DB -->

For the rest, you can read the existing tests to get inspiration.

## Run tests
To run the tests, you can simply run :
```
docker compose --profile test up --build --abort-on-container-exit
```
