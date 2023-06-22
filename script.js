$(document).ready(function() {
    let ontology = [];

    // Load the ontology from the JSON file
    $.getJSON('ontology.json', function(data) {
        ontology = data;
        populateDropdown(ontology);
    });

    // Function to flatten the hierarchy of the ontology
    function flattenHierarchy(ontology) {
        return ontology.flatMap(category => {
            const categoryName = Object.keys(category)[0];
            const subcategories = Object.values(category)[0];
            const terms = [];

            subcategories.forEach(subcategory => {
                if (typeof subcategory === 'string') {
                    terms.push(subcategory);
                } else {
                    terms.push(...flattenHierarchy([subcategory]));
                }
            });

            return [categoryName, ...terms];
        });
    }

    // Function to populate the drop-down menu with ontology categories
    function populateDropdown(ontology) {
        const dropdownMenu = $('.dropdown-menu');
        dropdownMenu.empty();

        // Add an "All Categories" option
        dropdownMenu.append(`<a class="dropdown-item" href="#" data-category="all">All Categories</a>`);

        // Iterate through the ontology and add each category to the drop-down menu
        ontology.forEach(category => {
            const categoryName = Object.keys(category)[0];
            dropdownMenu.append(`<a class="dropdown-item" href="#" data-category="${categoryName}">${categoryName}</a>`);
        });
    }

    // Function to handle the search
    function performSearch(category, query) {
        // Placeholder implementation
        console.log('Search Category:', category);
        console.log('Search Query:', query);
    }

    // Event listener for category selection in the drop-down menu
    $('.dropdown-menu').on('click', '.dropdown-item', function() {
        const selectedCategory = $(this).data('category');
        $('#categoryDropdown').text($(this).text());
        $('#categoryDropdown').data('category', selectedCategory);
    });

    // Event listener for form submission
    $('form').submit(function(event) {
        event.preventDefault();
        const selectedCategory = $('#categoryDropdown').data('category');
        const query = $('#searchInput').val();
        performSearch(selectedCategory, query);
    });

    // Initialize the Autocomplete plugin on the search input
    $('#searchInput').autocomplete({
        source: function(request, response) {
            const selectedCategory = $('#categoryDropdown').data('category');
            let filteredData = [];

            if (selectedCategory === 'all') {
                // Flatten the ontology and use it as the autocomplete source
                filteredData = flattenHierarchy(ontology);
            } else {
                // Filter the ontology based on the selected category and flatten it
                const category = ontology.find(item => Object.keys(item)[0] === selectedCategory);
                if (category) {
                    const subcategories = Object.values(category)[0];
                    const terms = subcategories.flatMap(subcategory => {
                        if (typeof subcategory === 'string') {
                            return subcategory;
                        } else {
                            return flattenHierarchy([subcategory]);
                        }
                    });
                    filteredData = [selectedCategory, ...terms];
                }
            }

            response($.ui.autocomplete.filter(filteredData, request.term));
        }
    });
});
