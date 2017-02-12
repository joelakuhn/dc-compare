var http = require('http');
var fs = require('fs');

function sleepSync(millis) {
  var waitTill = new Date(new Date().getTime() + millis);
  while (waitTill > new Date()) ;
}

function post_chapter(chapter, next) {

  var request = http.request({
    host: '127.0.0.1',
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


global.window = {};

var texts = fs.readdirSync('../texts/');
texts.forEach((textpath) => {
  require('../texts/' + textpath);
});

var post_objects = [];

for (var text_key in window) {
  var text = window[text_key];
  var year = text.year;

  for (var chapter_number in text.chapters) {
    var chapter = text.chapters[chapter_number];
    var title = chapter.title;
    var intro = chapter.intro;

    post_objects.push({
      year: year,
      chapter: chapter_number,
      verse: 'intro',
      title: title,
      text: chapter.intro
    });

    for (var i=0; i<chapter.verses.length; i++) {
      post_objects.push({
        year: year,
        chapter: chapter_number,
        verse: "" + i,
        title: title,
        text: chapter.verses[i]
      });
    }
  }
}

var post_index = 0;

function post_next_chapter() {
  if (post_index < post_objects.length) {
    post_chapter(post_objects[post_index], post_next_chapter);
    post_index++;
  };
}

post_next_chapter();
