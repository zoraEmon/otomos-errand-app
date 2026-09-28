erDiagram
    USER ||--o{ CONNECTION : "initiates (userA)"
    USER ||--o{ CONNECTION : "receives (userB)"
    USER ||--o{ ERRAND : "commands (commander)"
    USER ||--o{ ERRAND : "executes (runner)"
    ERRAND ||--|{ ERRAND_ITEM : "contains"

    USER {
        string id PK "UUID"
        string username UK "Unique username"
        string code7 UK "7-character friend code"
        string passwordHash "Bcrypt hashed password"
        datetime createdAt "Timestamp"
    }

    CONNECTION {
        string id PK "UUID"
        string userAId FK "User initiating connection"
        string userBId FK "Target user"
        string status "pending | connected"
        datetime createdAt "Timestamp"
    }

    ERRAND {
        string id PK "UUID"
        string commanderId FK "User issuing errand"
        string runnerId FK "User executing errand"
        string status "pending_acceptance | active | rejected | completed_by_runner | closed"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    ERRAND_ITEM {
        string id PK "UUID"
        string errandId FK "Parent Errand"
        string itemName "Item description"
        int quantity "Item count"
        boolean isBought "Item check-off status"
    }