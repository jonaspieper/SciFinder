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
});
