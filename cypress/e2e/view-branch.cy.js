describe("visits visuals9 and views some snapshots", () => {
  beforeEach(() => {
    cy.visit("/project/dcb5df26?branch=visuals9");
  });

  it("shows the branch", () => {
    cy.contains("visuals9");
    cy.url().should("include", "/project/dcb5df26?branch=visuals9");
  });

  it("can select the first result", () => {
    cy.contains("log point highlighted")
      .click()
      .should("have.attr", "data-selected", "true");
  });

  it("can select the multiple results", () => {
    cy.contains("log point highlighted")
      .click()
      .should("have.attr", "data-selected", "true");

    cy.contains("error stack collapsed")
      .click()
      .should("have.attr", "data-selected", "true");
  });
});
