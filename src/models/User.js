/**
 * Модель пользователя
 */
export class User {
    constructor(id, email, username, isAuthenticated = false) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.isAuthenticated = isAuthenticated;
    }

    static fromJSON(json) {
        return new User(
            json.id,
            json.email,
            json.username,
            true
        );
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            username: this.username
        };
    }
} 