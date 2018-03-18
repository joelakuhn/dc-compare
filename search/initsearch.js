var http = require('http');
var fs = require('fs');

function sleepSync(millis) {
  var waitTill = new Date(new Date().getTime() + millis);
  while (waitTill > new Date()) ;
}

function post_chapter(chapter, next) {
  console.log(chapter.title);
  var request = http.request({
    // host: '127.0.0.1',
    host: '104.131.73.224', // sharonkuhn.com
    port: 9200,
    path: '/dc/texts/',
    method: 'Post'
  }, function() {

  });
  request.write(JSON.stringify(chapter));
  request.end(undefined, undefined, function() {
    next();
  });

  request.on('error', function(e) {
    console.log(e);
  });

}


function parse_section(section) {
  var intro = section.match(/\[intro\]\n*([\s\S]*?)\n*\[.+?\]\n*/m)[1];
  var title = '';
  var title_match = section.match(/\[title\]\n*([\s\S]*?)\n*\[.+?\]\n*/m);
  if (title_match) title = title_match[1];
  var verses = section.match(/\[verses\]\n*([\s\S]*)/m)[1];
  return {
    intro: intro,
    title: title,
    verses: verses,
  };
}


global.window = {};

var years = [ 1833, 1835, 1844, 1876, 1921, 2013 ];
var sections = []
for (var i=0; i<years.length; i++) {
  var textpaths = fs.readdirSync('../texts/' + years[i]);
  for (var j=0; j<textpaths.length; j++) {
    var section_content = fs.readFileSync('../texts/' + years[i] + '/' + textpaths[j]).toString();
    var section = parse_section(section_content);
    section.year = years[i];
    section.chapter = j;
    sections.push(section);
  }
}


var post_objects = [];

sections.forEach(function(section) {

  post_objects.push({
    year: section.year,
    chapter: section.chapter,
    verse: 'intro',
    title: section.title,
    text: section.intro
  });

  var c = 1;
  section.verses += "\n\n__EOF__";
  for (;;) {
    var verse_match = section.verses.match(new RegExp('^(' + c + '[^\d].*)\n*(?:\d|__EOF__)', 'm'))
    if (verse_match) {
      post_objects.push({
        year: section.year,
        chapter: section.chapter,
        verse: "" + c,
        title: section.title,
        text: verse_match[1]
      });
    }
    else {
      break;
    }
    c++;
  }

});


var post_index = 0;

function post_next_chapter() {
  if (post_index < post_objects.length) {
    post_chapter(post_objects[post_index], post_next_chapter);
    post_index++;
  };
}

post_next_chapter();
