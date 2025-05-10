class Student {
  constructor(login, firstName, lastName, middleName, year, group) {
    this.login = login;
    this.firstName = firstName;
    this.lastName = lastName;
    this.middleName = middleName;
    this.year = year;
    this.group = group;
  }

  toHtml() {
    return `
      <div>
        <h2>${this.firstName} ${this.middleName} ${this.lastName}</h2>
        <p>Логін: ${this.login}</p>
        <p>Курс: ${this.year}</p>
        <p>Група: ${this.group}</p>
      </div>
    `;
  }

  static fromJSON(jsonData) {
    return new Student(
      jsonData.login,
      jsonData.firstname,
      jsonData.lastname,
      jsonData.middlename,
      jsonData.year,
      jsonData.group
    );
  }
}

module.exports = Student;
