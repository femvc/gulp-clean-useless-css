var gulp = require('gulp')
var concat = require('gulp-concat')
var through2 = require('through2')
var cleanCSS = require('gulp-clean-css')
var cssformat = require('css-format-new')
 
function cleanUselessCSS (source) {
  return through2.obj(function(file2, encoding, next2) {

    gulp.src(source)
    .pipe(concat('alltxt.txt'))
    .pipe(through2.obj(function(file1, encoding, next1) {
      // 注：将所有可能引用到 css 的 html，js 合并成一个临时文件便于后面检索
      var fulltxt = String(file1.contents)
      // 注：获取源 css （一般也是合并后的)
      // 另注：css代码需要格式化后处理，模式Compact 参照：http://jsformat.com/css-format.html
      var csstxt = cssformat.formatCSSText(String(file2.contents), {
        type: 'compact',
        break_selectors: 0,
        no_spaces: 0,
        remove_comment: 1
      })
      csstxt = csstxt.replace(/\r/g, '\n').replace(/\n\n+/g, '\n')
      //csslist.replace(/[\n\r]/g, '').replace(/[\s]+\}/g, '}').replace(/\}/g, '\n}').replace(/\{/g, '{\n')
      var csslist = csstxt.split('\n')
      // 注：逐行处理 css
      var result = []
      for (var i = 0, len1 = csslist.length; i < len1; i++) {
        var row1 = csslist[i]
        if (!row1 || row1.indexOf('{') == -1) continue

        var rules = row1.split('{')[0].split(',')
        var keepit = false
        for (var j = 0, len2 = rules.length; j < len2; j++) {
          var rule = rules[j]
          // console.log('================ rule ===================')
          // console.log(rule)
          var subs = rule.match(/[\.\#][a-zA-Z0-9\-\_]+/g) || []
          var valid = true
          for (var k = 0, len3 = subs.length; k < len3; k++) {
            var clazz = subs[k]
            clazz = clazz.replace('.', '').replace('#', '')
            // console.log('================ clazz ===================')
            // console.log(clazz)
            if (fulltxt.indexOf(clazz) === -1) valid = false
          }
          if (valid) keepit = true
        }
        if (keepit) result.push(row1)
      }

      file2.contents = new Buffer(String(result.join('\n')))

      // @keyframes and @media
      csstxt = String(file2.contents)
      csslist = csstxt.split('\n')

      result = []
      for (i = 0, len1 = csslist.length; i < len1; i++) {
        var row2 = csslist[i]
        if (!row2) continue

        if (row2.indexOf('keyframes') > -1) {
          var kname = row2.split('keyframes ')[1].split('{')[0]
          if (csstxt.split(kname).length < 4) {
            while (csslist[++i] !== '}' && i < len1) {}
            continue
          }
        } else if (row2.indexOf('@media') > -1 && csslist[i + 1] === '}') {
          i += 1
          continue
        }
        result.push(row2)
      }

      file2.contents = new Buffer(String(result.join('\r\n')))

      next2(null, file2)
    }))
  })
}

module.exports = cleanUselessCSS