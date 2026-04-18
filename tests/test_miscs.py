def test_ping(client):
    response = client.get("/ping")
    assert response.status_code == 200
    assert response.json() == "pong"

def test_schema_diagram(client):
    response = client.get("/schema_diagram")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/svg+xml"
