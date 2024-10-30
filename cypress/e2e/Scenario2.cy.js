describe("Verify the Banking showcase result list for Desktop 720p and iPhone 6", () => {
    // Define the specific viewports you want to test
    const viewports = [
        { name: 'Desktop', dimensions: [1280, 720] },
        // { name: 'Phone', dimensions: 'iphone-6' }
    ];
    let loanAmount; // Declare the loanAmount variable 
    let loanDuration; // Declare the loanDuration variable 


    viewports.forEach(({ name, dimensions }) => {
        context(`Testing on ${name}`, () => {
            beforeEach(() => {
                // Set the viewport for the current test
                if (Array.isArray(dimensions)) {
                    // If dimensions is an array, use width and height
                    cy.viewport(dimensions[0], dimensions[1]);
                } else {
                    // Otherwise, assume it's a string preset
                    cy.viewport(dimensions);
                }

                cy.visit('https://www.verivox.de/');
                handleCookies(); // Helper function to handle cookies
            });

            it(`Verify the URL start with and end ${name}`, () => {
                navigateToBankProducts(); //function to navigate to products
            });
        });
    });

    // function to handle cookie consent
    function handleCookies() {
        cy.get('body').then(($body) => {
            cy.intercept('POST', 'https://consent-api.service.consent.usercentrics.eu/consent/uw/3')
                .as('consentModal');
            cy.wait('@consentModal');
            // Check if the consent banner exists before trying to interact with it
            if ($body.find('#uc-btn-accept-banner').length) {
                cy.get('#uc-btn-accept-banner').click();
            }

        });
        cy.get('label#mps-label-3')
            .should('be.visible')  // Ensure the parent is visible
            .click();
    }

    function extractNumber(amountString) {
        //  Remove the Euro sign and trim whitespace
        let cleanedString = amountString.replace('€', '').trim();

        // : Remove the dot used for thousand separators
        cleanedString = cleanedString.replace(/\./g, '');

        //  Replace the comma with a dot (for decimal)
        cleanedString = cleanedString.replace(',', '.');

        // Convert the cleaned string to a float
        return parseFloat(cleanedString);
    }

    // Helper function to navigate to bank products
    function navigateToBankProducts() {
       cy.wait(3000);

        // Get the visible calculator-form because there are hidden forms
        cy.get('form.calculator-form[action="/ratenkredit/anmeldung/"]').should('be.visible')
            .first() // Get the first matching form element
            .within(() => {


                // Input loan details
                cy.get('input[name="kreditbetrag"]')
                    .clear()
                    .type('25000') // Type the loan amount
                    .invoke('val') // Get the value of the input field
                    .then((value) => {
                        loanAmount = value; // Store the value in the variable
                        cy.log('Loan Amount:', loanAmount); // Log the value for debugging

                        // Loan duration
                        cy.get('select[name="kreditlaufzeit"]').select(7).invoke('val').then((value) => {
                            loanDuration = value; // Store the value of the selected duration
                            cy.log('Loan Duration:', loanDuration);
                        });
                    });
                // Click the "Jetzt Vergleichen" button
                cy.get('.page-default-signup > .page-button').click();
            });


        // Click the "ALLE BANKEN VERGLEICHEN" button
       // cy.wait(2000); // Adjust the wait time as necessary
        cy.contains('button', 'Alle Banken vergleichen')
            .should('be.visible') // Ensure the button is visible
            .click();

        // Verify the URL 
        cy.url().should('include', 'https://www.verivox.de/ratenkredit/vergleich/')
            .and('include', '/signup10');

        cy.url().then((currentUrl) => {
            // Log the URL to Cypress log
            cy.log('Current URL:', currentUrl);
            expect(currentUrl).to.match(/^https:\/\/www\.verivox\.de\/ratenkredit\/vergleich\/.*\/signup10$/);


            cy.get('ul.shopping-cart-data li.data strong.ng-binding')
                .invoke('text')
                .then((text) => {
                    const loanAmountText = text.trim(); // Clean up any whitespace
                    const numericValue = extractNumber(loanAmountText);

                    cy.log('Extracted Numeric Value:', numericValue); // Log the numeric value
                    expect(numericValue).to.equal(Number(loanAmount));

                });

            // Check and log the loan duration
            cy.get('ul.shopping-cart-data li.runtime strong.ng-binding')
                .invoke('text')
                .then((text) => {
                    const durationText = text.trim(); // Clean up any whitespace
                    cy.log('Loan Duration Text:', durationText); // Log the loan duration text
                    expect(durationText).to.include(loanDuration + ' Monate');// loan amount doesen't have month so adding here

                    // Assert the loan duration is correct
                });
        });



    }
});
