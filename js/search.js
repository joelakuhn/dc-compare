$('#search').keydown(function(e) {
  if (e.keyCode === 13) {
    search($(this).val());
  }
});

function search(term) {
  var query = {
    "query" : {
        "match": { "text": term }
    },
    "highlight" : {
        "fields" : {
            "text" : {}
        }
    }
  };
  $.ajax({
    url: 'http://104.131.73.224:9200/dc/texts/_search',
    data: JSON.stringify(query),
    dataType: "json",
    type: 'POST',
    crossDomain: true,
    success: function(data, status, xhr) {
      show_search_results(data);
    },
    error: function() {
    }
  });
}

function show_search_results(data) {
  var contents = $('<div class="search-results"></div>');
  var hits = data.hits.hits;
  var results = [];
  for (var i=0; i<hits.length; i++) {
    var highlight = hits[i].highlight.text.join("<br><br>");
    var verse = hits[i]._source.verse.match(/^\d+$/) ? (+hits[i]._source.verse + 1) : 'intro'
    var title = '<h2>' + hits[i]._source.chapter
      + ':' + verse
      + ' (' + hits[i]._source.year + ')</h2>';
    var result_text = '<p class="search-result">' + highlight + '</p>';
    var links = '<p class="search-links">'
      + '<a class="close-box update-revelation" href="#L'
        + 'Y' + hits[i]._source.year
        + 'C' + hits[i]._source.chapter
        + 'V' + verse
        + '">Open on Left</a>'
      + '&nbsp;&nbsp;'
      + '<a class="close-box update-revelation" href="#R'
        + 'Y' + hits[i]._source.year
        + 'C' + hits[i]._source.chapter
        + 'V' + verse
        + '">Open on Right</a>'
      + '</p>';
    var result = title + result_text + links;
    results.push(result);
  }
  var search_content = '<div class="search-results">' + results.join('') + '</div>';
  box(search_content);
}
