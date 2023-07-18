$(document).ready(function() {
    // Load the ent_ids JSON file
    $.getJSON('/ent_ids.json', function(data) {
        // Flatten the ent_ids dictionary to an array of objects
        const entities = Object.entries(data).map(([key, values]) => ({ entity_id: key, values }));

        let timer = null;
        // Initialize the autocomplete
        $('.searchInput').autocomplete({
            delay: 200,
            source: function(request, response) {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    const term = request.term.toLowerCase();
                    if (term.length < 3) {  // minimum character limit
                        response([]);
                        return;
                    }
                    const suggestions = entities.filter(function(entity) {
                        return entity.entity_id.toLowerCase().includes(term);
                    });

                    // Limit the number of suggestions to 10
                    const limitedSuggestions = suggestions.slice(0, 10).map(function(entity) {
                        return {
                            label: entity.entity_id,
                            value: entity.entity_id
                        };
                    });

                    // Provide the suggestions to the autocomplete
                    response(limitedSuggestions);
                }, 300);  // delay in milliseconds
            },
            select: function(event, ui) {
                // Set the input value to the selected entity ID
                $(this).val(ui.item.value);
                
                // Check if we're on the index page
                const url = window.location.pathname;
                if (url === '/' || url.endsWith('index.html')) {
                    // On index page, redirect to results page
                    window.location.href = 'results?ent_id=' + encodeURIComponent(ui.item.value);
                } else {
                    // On other pages, submit the form
                    $(this).closest('form').submit();
                }

                return false; // Prevent default selection behavior
            }
        });
    });

    // Event when form is submitted
    $('.searchForm').on('submit', function(e) {
        e.preventDefault(); // Stop form from submitting normally
        var ent_id = $(this).find('.searchInput').val(); // Get the input value
        // Redirect to results.html with the selected entity ID as a query parameter
        window.location.href = 'results?ent_id=' + encodeURIComponent(ent_id);
        return false; // Prevent default action
    });

    // AJAX request to add item to basket
    $(document).on('click', '.addToBasket', function() {
        var button = $(this);
        var ent_id = button.data('entId');
        var title = button.closest('.result-item').find('h3').text();  // Get the title of the article
        $.post('/add_to_basket', { ent_id: ent_id, title: title }, function(response) {  // Send the title along with the ent_id
            if (response.success) {
                button.closest('.result-item').addClass('in-basket');
                updateBasketContent();  // Update the basket content
            }
        });
    });

    // AJAX request to remove item from basket
    $(document).on('click', '.removeFromBasket', function() {
        var button = $(this);
        var ent_id = button.data('entId');
        var title = button.closest('.result-item').find('h3').text();  // Get the title of the article
        $.post('/remove_from_basket', { ent_id: ent_id, title: title }, function(response) {  // Send the title along with the ent_id
            if (response.success) {
                button.closest('.result-item').removeClass('in-basket');
                updateBasketContent();  // Update the basket content
            }
        });
    });

    // Function to update the basket content
    function updateBasketContent() {
        $.get('/get_basket_contents', function(response) {
            if (response.success) {
                // Update the basket list with the titles of the selected articles
                $('#basket-list').html(response.basket_contents.join('<br>'));
                // Update the basket count with the number of selected articles
                $('#basket-count').text(response.basket_contents.length);
            }
        });
    }

    // Function to display the basket modal
    $('#basket-icon').click(function() {
        // display the modal
        $('#basket-modal').show();
    });

    // Function to hide the modal when the 'x' button is clicked
    $('.close').click(function() {
        $('#basket-modal').hide();
    });

    updateBasketContent();  // Populate the basket when the page loads
});