doc = File.read('index.html');

expanded = doc.gsub /<script src=".+"><\/script>/ do |m|
  "<script>\n" + File.read(m.match(/"(.+)"/)[1]) + "\n</script>"
end

expanded = expanded.gsub /<link.+>/ do |m|
  "<style>\n" + File.read(m.match(/href="(.*)"/)[1]) + "\n</style>"
end

File.write('dc-compare.html', expanded);
