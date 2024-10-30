describe("Verify the Banking showcase result list for Desktop 720p and iPhone 6", () => {
    // Define the specific viewports you want to test
    const viewports = [
        { name: 'Desktop', dimensions: [1280, 720] },
        { name: 'Phone', dimensions: 'iphone-6' }
    ];

    viewports.forEach(({ name, dimensions }) => {
        context(`Testing on ${name}`, () => {
            beforeEach(() => {
                // Set the viewport for the current test
                if (Array.isArray(dimensions)) {
                    // If dimensions is an array, use width and height
                    cy.viewport(dimensions[0], dimensions[1]);
                } else {

                    cy.viewport(dimensions);
                }

                cy.visit('https://www.verivox.de/');
                handleCookies(); // Helper function to handle cookies
            });

            it(`Verify Result List Contains at Least 10 Bank Products on ${name}`, () => {
                navigateToBankProducts(); // Helper function to navigate to the bank products
                checkBankProducts(name == "Desktop");
            });
        });
    });

    // Helper function to handle cookie consent
    function handleCookies() {
        cy.get('body').then(($body) => {
            cy.intercept('POST', 'https://consent-api.service.consent.usercentrics.eu/consent/uw/3')
                .as('consentModal');
            cy.wait('@consentModal');
            cy.get('#uc-btn-accept-banner').click();
        });
    }

    // Helper function to navigate to bank products
    function navigateToBankProducts() {
        // Click on Kredit product

        cy.get('#mps-label-3') // Increase timeout if necessary
            .should('be.visible') // Wait until it is visible
            .click(); // Click the element

        cy.wait(3000);
        // get the visible calculator-form
        cy.get('form.calculator-form[action="/ratenkredit/anmeldung/"]').should('be.visible')
            .first()
            .within(() => {

                // Input loan details
                cy.get('input[name="kreditbetrag"]').clear().type('25000');


                // Loan duration
                cy.get('select[name="kreditlaufzeit"]').select(7);

                // Click the "Jetzt Vergleichen" button
                cy.get('.page-default-signup > .page-button').click();
            })

    }

    // Function to check the number of bank products and the presence of "Sofortauszahlung"
    function checkBankProducts(isDesktop) {
        let previousItemCount = 0;
        let sofortauszahlungFound = false;

        function scrollIncrementally() {
            cy.get('.product-list vx-srl-base-product-card').then($items => {
                const currentItemCount = $items.length;

                // Log current count and loaded items text
                cy.log(`Current item count: ${currentItemCount}`);
                cy.log(`Loaded items text: ${$items.text()}`);

                // Check for "Sofortauszahlung"
                if (!sofortauszahlungFound) {
                    sofortauszahlungFound = $items.text().includes('Sofortauszahlung');

                    // Log the status if "Sofortauszahlung" is found
                    if (sofortauszahlungFound) {
                        cy.log(`"Sofortauszahlung" found in the list with a total item count of: ${currentItemCount}`);
                    }
                }

                // If more items are loaded, continue scrolling
                if (currentItemCount > previousItemCount) {
                    previousItemCount = currentItemCount;

                    // Scroll to bottom
                    cy.scrollTo('bottom');
                    cy.wait(3000); // Wait for lazy loading

                    // Recursively scroll
                    scrollIncrementally();
                } else {
                    // All items loaded
                    cy.log(`All items loaded. Total items: ${currentItemCount}`);

                    // Assert the item count
                    expect(currentItemCount).to.be.gte(10);
                    cy.log(`Assertion passed: There are at least 10 items in the list. Current count: ${currentItemCount}`);

                    if (isDesktop) {
                        // Assert that "Sofortauszahlung" was found
                        expect(sofortauszahlungFound).to.be.true;
                        cy.log(`Assertion passed: "Sofortauszahlung" was found.`);
                    }
                }
            });
        }

        // Start scrolling
        scrollIncrementally();
    }
});
