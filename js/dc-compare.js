if (!('localStorage' in window)) {
  var localStorage = {};
}

var version_a = localStorage.version_a || 1833;
var version_b = localStorage.version_b || 2013;
var chapter   = localStorage.chapter   || 1;
var piece_index = 0;

function assign_values(diff) {
  for (var i=0; i<(diff.length - 1); i++) {
    diff[i].same = !diff[i]['added'] && !diff[i]['removed'];
    diff[i].index = piece_index++;
  }
}

function combine(diff, which) {
  var combined = []
  for (var i=0; i<(diff.length - 1);) {
    var d = diff[i];
    var next = diff[i + 1];
    if (diff[i][which] && diff[i + 1].same) {
      if (diff[i + 1].count <= 3) {
        diff[i].value = diff[i].value + diff[i + 1].value;
        combined.push(diff[i]);
        i += 2;
      }
      else {
        combined.push(diff[i]);
        i++;
      }
    }
    else {
      combined.push(diff[i]);
      i++;
    }
  }
  combined.push(diff[diff.length - 1])
  return combined;
}

function mark_same_case(diff) {
  for (var i=0; i<(diff.length - 1); i++) {
    if (diff[i].removed && diff[i+1].added) {
      if (diff[i].value.toLowerCase() == diff[i+1].value.toLowerCase()) {
        diff[i].same_case   = true;
        diff[i+1].same_case = true;
      }
    }
  }
}

function cleanup(diff, which) {
  var ony_relevant = diff.filter(function(d) {
    return d.same || d[which];
  });
  assign_values(ony_relevant, which);
  mark_same_case(diff);
  return ony_relevant
}

function format_text(text) {
  return text
  .replace(/(verily)/ig, '$1 <span class="drink">&#x1F37A;</span>')
  .replace(/(behold)/ig, '$1 <span class="drink">&#x1F37A;</span>')
  .replace(/(came to pass)/ig, '$1 <span class="drink">&#x1F37A;</span>')
  .replace(/(\byea\b)/ig, '$1 <span class="drink">&#x1F37A;</span>')
  .replace(/(come|bring) (to pass)/ig, '$1 $2 <span class="nowrap drink">&macr;\\_(ツ)_/&macr; &#x1F37A;</span>')
}

function show_verse(out_id, diff) {
  var output = '<div class="divider"></div>';
  for (var i=0; i<diff.length; i++) {
    var d = diff[i];
    var pieces = d.value.split("\n");

    var is_first_piece = true;
    for (var p=0; p<pieces.length; p++) {

      if (p > 0 && !is_first_piece) {
        output += '<div class="divider"></div>';
      }
      is_first_piece = false;

      if (pieces[p].length == 0) continue;

      var el = $('<span>');

      if (d.added) {
        el.addClass('added').html(format_text(pieces[p]))
      }
      else if (d.removed) {
        el.addClass('removed').html(format_text(pieces[p]))
      }
      else {
        el.addClass('same')
        .addClass('index-' + d.index + '_' + p)
        .attr('data-index', d.index + '_' + p)
        .html(format_text(pieces[p]))
      }

      if (d.same_case) el.addClass('same-case')

      output += el[0].outerHTML;
    }
  }
  document.getElementById(out_id).innerHTML = output
}

function compare_texts(t1, t2, o1, o2) {
  var diff = JsDiff.diffWords(t1, t2);
  assign_values(diff);
  var removed = cleanup(diff, 'removed');
  var added   = cleanup(diff, 'added');
  removed = combine(removed, 'removed');
  added = combine(added, 'added');
  show_verse(o1, removed);
  show_verse(o2, added);
}

function level_intros() {
  $('.intro').height('auto');
  var a_height = $('#intro_a').height();
  var b_height = $('#intro_b').height();
  var max_height = Math.max(a_height, b_height);
  $('#intro_a').height(max_height);
  $('#intro_b').height(max_height);
}

function level_paragraphs() {
  var common_dividers = [];
  $('#output_a > .same').each(function(_, lh) {
    lh = $(lh);
    var rh = $('#output_b > [data-index="' + lh.attr('data-index') + '"]');
    var lhd = lh.prevAll('.divider:first');
    var rhd = rh.prevAll('.divider:first');
    if (!lhd.data('adjusted') && !rhd.data('adjusted')) {
      common_dividers.push({ lhd: lhd, rhd: rhd });
      lhd.data('adjusted', true);
      rhd.data('adjusted', true);
    }
  });
  common_dividers.forEach(function(divs) {
    var lhd_offset = divs.lhd.offset()
    var rhd_offset = divs.rhd.offset()
    if (lhd_offset && rhd_offset) {
      if (lhd_offset.top > rhd_offset.top) {
        divs.rhd.css('padding-bottom', lhd_offset.top - rhd_offset.top);
      }
      else {
        divs.lhd.css('padding-bottom', rhd_offset.top - lhd_offset.top);
      }
    }
  });
  $('.divider').data('adjusted', false);
}

function add_drink_count() {
  var drink_count_a = $('#output_a').find('.drink').length;
  var drink_count_a_text = '(' + drink_count_a + (drink_count_a == 1 ? ' drink)' : ' drinks)')
  $('#drink-count-a').text(drink_count_a_text);
  var drink_count_b = $('#output_b').find('.drink').length;
  var drink_count_b_text = '(' + drink_count_b + (drink_count_b == 1 ? ' drink)' : ' drinks)')
  $('#drink-count-b').text(drink_count_b_text);
}

function compare_verses() {
  $('.cover').show();
  setTimeout(function() {
    try {
      var a = window['dc' + version_a]
      var b = window['dc' + version_b]
      if (!a.chapters[chapter] || !b.chapters[chapter]) {
        if (!a.chapters[chapter]) {
          $('#output_a').text("The " + version_a + " edition does not contain this passage.");
          $('#output_b').html(b.chapters[chapter].verses.join("\n"));
        }
        if (!b.chapters[chapter]) {
          $('#output_a').html(a.chapters[chapter].verses.join("\n"));
          $('#output_b').text("The " + version_b + " edition does not contain this passage.");
        }
      }
      else {
        compare_texts (
          a.chapters[chapter].verses.join("\n"),
          b.chapters[chapter].verses.join("\n"),
          'output_a',
          'output_b' );
        compare_texts (
          a.chapters[chapter].intro,
          b.chapters[chapter].intro,
          'intro_a',
          'intro_b' );
        level_intros();
        level_paragraphs();
        attach_events();
        ignore_punctuation();
        ignore_numbering();
        ignore_case();
        add_drink_count();
        show_hide_drinks();
      }
    } catch (e) {
      console.log(e);
    }
    $('.cover').hide();
  });
}

function same_hover() {
  var index = this.dataset.index;
  var related = document.getElementsByClassName('index-' + index)
  if (related.length > 1) {
    $(related[0]).add(related[1]).addClass('highlighted');
  }
}

function same_unhover() {
  var index = this.dataset.index;
  var related = document.getElementsByClassName('index-' + index)
  if (related.length > 1) {
    $(related[0]).add(related[1]).removeClass('highlighted');
  }
}

function attach_events() {
  setTimeout(function() {
    var same = document.getElementsByClassName('same');
    for (var i=0; i<same.length; i++) {
      same[i].addEventListener('mouseover', same_hover);
      same[i].addEventListener('mouseout', same_unhover);
    }
  });
}


/*
CHAPTER SELECT
*/

function fill_chapter_select(books) {
  var chapter_assoc = {};
  for (var i=0; i<books.length; i++) {
    var book = books[i];
    for (var ch in book.chapters) {
      if (!ch.match(/^\d+/))
        continue;
      if (!(ch in chapter_assoc)) {
        chapter_assoc[ch] = []
      }
      chapter_assoc[ch].push(book.year)
    }
  }

  var chapters_array = [];
  for (var ch in chapter_assoc) {
    chapters_array.push({
      chapter: ch,
      books: chapter_assoc[ch]
    });
  }

  chapters_array = chapters_array.sort(function(a, b) {
    return a.chapter - b.chapter;
  });

  var chapter_select = $('#chapter_select');
  for (var i=0; i<chapters_array.length; i++) {
    var opt = $('<option>')
    opt.val(chapters_array[i].chapter);
    opt.text(chapters_array[i].chapter + ' (' + chapters_array[i].books.join(', ') + ')');
    chapter_select.append(opt);
  }

  chapter_select.val(chapter);

  chapter_select.change(change_chapters);
}

function change_chapters() {
  chapter = $(this).val().match(/^(\d+)/)[1];
  localStorage.chapter = chapter;
  compare_verses();
}

/*
VERSION SELECTORS
*/

function init_version_selectors() {
  var version_a_select = $('#version_a_select');
  var version_b_select = $('#version_b_select');

  version_a_select.val(version_a);
  version_b_select.val(version_b);

  version_a_select.change(change_version_a);
  version_b_select.change(change_version_b);
}

function change_version_a() {
  version_a = $(this).val();
  localStorage.version_a = version_a;
  compare_verses();
}

function change_version_b() {
  version_b = $(this).val();
  localStorage.version_b = version_b;
  compare_verses();
}

/*
IGNORE PUNCTUATION
*/

function ignore_punctuation() {
  var ignore_punctuation = $('#ignore-punctuation').prop('checked');
  if (ignore_punctuation) {
    var punct = $('.added,.removed').filter(function() {
      return $(this).text().match(/^[^\w\d]+$/);
    }).css('background', 'transparent');
  }
  else {
    $('.added,.removed').css('background', '');
  }
}

$('#ignore-punctuation').change(ignore_punctuation);

/*
IGNORE CASE
*/

function ignore_case() {
  var background = $('#ignore-case').prop('checked')
    ? 'transparent'
    : '';
  $('.same-case').css('background', background);
}

$('#ignore-case').change(ignore_case);

/*
SHOW/HIDE Drinks
*/

function show_hide_drinks() {
  if ($('#show-drinks').prop('checked')) {
    $('.drink').show();
    $('#drink-count-a,#drink-count-b').show();
  }
  else {
    $('.drink').hide();
    $('#drink-count-a,#drink-count-b').hide();
  }
}

$('#show-drinks').change(show_hide_drinks);

function ignore_numbering() {
  var ignore_numbering = $('#ignore-numbering').prop('checked');
  if (ignore_numbering) {
    var numbers = $('.added,.removed').filter(function() {
      return $(this).text().match(/^\d+\s*/);
    }).each(function(element) {
      $(element).html($(element).text().replace(/(^\d+\s*)(.*)/, "$1" + '<span style="background-color:' + $(element).css('background-color') + '">$2</span>'));
    })
  }
  else {
    $('.added,.removed').css('background', '');
  }
}

/*
*/

function toggle_dark_mode() {
  if ($('#dark-mode').prop('checked')) {
    $('html').addClass('dark');
    console.log('dark');
  }
  else {
    $('html').removeClass('dark');
    console.log('light');
  }
}

$('#dark-mode').change(toggle_dark_mode);

/*
WINDOW ADJUSTMENTS
*/

$(window).resize(function() {
  level_intros();
  level_paragraphs();
});

/*
Preserve Options
*/
$('input[type="checkbox"].preserve').each(function() {
  $(this).change(function() {
    localStorage[$(this).attr('id')] = $(this).prop('checked');
  });

  $(this).prop('checked', localStorage[$(this).attr('id')] != "false");
});

/*
START
*/

fill_chapter_select([dc1833, dc1835, dc1844, dc2013]);
init_version_selectors();
compare_verses();
toggle_dark_mode();

setTimeout(function() {
  $('html').removeClass('innitial');
}, 200);

$('#chapter_select').select2({
  width: '200px',
});
$('#version_a_select,#version_b_select').select2({
  width: '70px',
  minimumResultsForSearch: -1
})
