from fastapi import status

def test_ping(client):
    response = client.get("/ping")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == "pong"

def test_schema_diagram(client):
    response = client.get("/schema_diagram")
    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "image/png"

def test_get_favicon(client):
    response = client.get("/favicon.ico")
    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "image/png"
