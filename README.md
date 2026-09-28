# sandwichotek
Sandwichotèque du bar de TELECOM Nancy

## Installation

1. **Cloner le repository :**

    ```bash
    git clone <repository-url>
    cd sandwichotek
    ```

2. **Installer les dépendances :**

    Backend:
    ```bash
    uv sync
    ```

    Frontend:
    ```bash
    cd frontend
    yarn install # ou npm install
    ```

3. **Créer le client Oauth Google**

    Se connecter à Google Cloud Console, créer un projet, puis créer un client OAuth 2.0 pour une application web.
    
    Ajouter `http://localhost:3000` comme *URI de redirection autorisés* et *Origines JavaScript autorisées*.
    
    Copier l'ID du client et le mettre dans les 2 fichiers `.env` du backend et du frontend. (Id sous la forme `123456789-abdefghijk.apps.googleusercontent.com`)

    Renseigner aussi `ALLOWED_EMAILS` avec un email que vous souhaitez autoriser à se connecter via Google OAuth. Si vous voulez autoriser plusieurs emails, vous pouvez les séparer par des virgules.

4. **Initialiser les fichiers d'environnement :**

    Backend : 
    ```bash
    cp .env.example .env
    ```

    Frontend : 
    ```bash
    cp frontend/.env.example frontend/.env
    ```

    Et modifier les deux `.env` pour y mettre les bonnes valeurs (notamment l'ID OAuth pour le frontend). 

    Modifier au besoin le fichier `config.js` du frontend.

5. **Démarrer la base de données :**

    Utilisez une base de données PostgreSQL déja configurée ou utilisez Docker :

    ```bash
    docker-compose --profile dev up -d
    ```

6. **Run the application:**

    Backend :
    ```bash
    dotenv run -- python -m backend
    ```

    Frontend :
    ```bash
    cd frontend
    yarn dev # ou npm run dev
    ```