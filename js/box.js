function box(content) {
  $('.box').remove();

  $box = $('<div class="box">')
  $box.html(content);
  $box.appendTo('body');

  $box.append('<div class="close-box close-button">&#x00D7;</div>');

  $box.find('.close-box').click(function() {
    $('.box').remove();
  });
}



$(window).keydown(function(e) {
  if (e.keyCode === 27) {
    $('.box').remove();
  }
});
