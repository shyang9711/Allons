class User {
    constructor(userId, username, email, password, age, nationality, phoneNumber, languagePreferences = []) {
      this.userId = userId;
      this.username = username;
      this.email = email;
      this.passwordHash = this.encryptPassword(password);
      this.age = age;
      this.nationality = nationality;
      this.phoneNumber = phoneNumber;
      this.languagePreferences = languagePreferences;
    }
  
    // Method to hash the password
    async encryptPassword(password) {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    }
  
    // Method to update the email of the user
    updateEmail(newEmail) {
      this.email = newEmail;
    }
  
    // Method to update the password securely
    async updatePassword(newPassword) {
      this.passwordHash = await this.encryptPassword(newPassword);
    }
  
    // Method to get user info (without the password for security reasons)
    getUserInfo() {
      return {
        userId: this.userId,
        username: this.username,
        email: this.email,
        age: this.age,
        nationality: this.nationality,
        phoneNumber: this.phoneNumber,
        languagePreferences: this.languagePreferences,
      };
    }
  
    // Method to validate the user’s password by comparing the entered password with the stored hash
    async validatePassword(inputPassword) {
      return await bcrypt.compare(inputPassword, this.passwordHash);
    }

    // New method to add a language preference
    addLanguagePreference(language) {
      if (!this.languagePreferences.includes(language)) {
        this.languagePreferences.push(language);
      }
    }

    // New method to remove a language preference
    removeLanguagePreference(language) {
      this.languagePreferences = this.languagePreferences.filter(lang => lang !== language);
    }
}

export default User;
