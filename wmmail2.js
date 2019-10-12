function autocomplete() {
	var snippets = ['video', 'spoiler'];
	var txt = gebi('comm') || gebi("itext");;
	var patt = /\S+$/;

	txt.addEventListener('keydown', e => {
		if (e.key !== 'Tab') {
			return;
		}
		e.preventDefault();
		var start = txt.selectionStart;
		var seg = txt.value.slice(0, start);
		var match = (seg.match(patt) || [])[0];
		if (!match) {
			return;
		}
		var idx = snippets.findIndex(x => x.startsWith(match));
		if (idx < 0) {
			return;
		}
		var replace = idx === 0 ? '[video]  [/video]' : '[spoiler=Спойлер] [/spoiler]';
		var newSeg = seg.replace(patt, replace);
		txt.value = newSeg + txt.value.slice(start);
		txt.setSelectionRange(newSeg.length, newSeg.length);
	});
}

var textError = false;

var getFixed = gebi('fixed');
getFixed.addEventListener('DOMSubtreeModified', checkForComm);

function checkForComm() {
	if (gebi('addcomm') && gebi('comm')) {
    var form = document.querySelector("form[onkeypress]");
		form.setAttribute('onsubmit', 'event.preventDefault(); checkBeforeSend(this);');
		form.setAttribute('onkeypress', 'return checkBeforeSendUseCtrlEnter(event, this);');
    autocomplete();
    var comm = gebi('comm');
		checkText(comm);
		if (comm.addEventListener) {
			['input', 'focus'].forEach(function(evt) {
				comm.addEventListener(evt, function() {checkText(comm)}, false);
			});
		} else if (txt.attachEvent) {
			comm.attachEvent('onpropertychange', function() {
				checkText(comm);
			});
		}
	}
}

var getTheme = gebi("itext");
if(getTheme) {
  var form = document.querySelector("form[onkeypress]");
  form.setAttribute('onsubmit', 'event.preventDefault(); checkBeforeSend(this);');
  form.setAttribute('onkeypress', 'return checkBeforeSendUseCtrlEnter(event, this);');
  autocomplete();
  checkText(getTheme);
  if (getTheme.addEventListener) {
    ['input', 'focus'].forEach(function(evt) {
      getTheme.addEventListener(evt, function() {checkText(getTheme)}, false);
    });
  } else if (getTheme.attachEvent) {
    getTheme.attachEvent('onpropertychange', function() {
      checkText(getTheme);
    });
  }
}

function checkBeforeSend(formElem) {
	if (textError) {
		alert(textError);
	} else {
		formElem.submit();
	}
}

function checkBeforeSendUseCtrlEnter(event, formElem) {
	if (event.ctrlKey && (event.keyCode == 0xa || event.keyCode == 0xd)) {
		if (textError) {
			alert(textError);
		} else {
			if (gebi('comm').value == '') {
				alert('Ошибка! Не указан комментарий!');
				return false;
			}
			formElem.submit();
		}
	}
}


function checkText(text) {
  var txt = text.value;
	var arr = [];
	var longlink;
	if (txt.length > 5000) {
		arr.push('символов');
	}
	if (txt.match(/(:\w*:\w*?){6,}/g) || (txt.match(/(:\w*:)/g) && txt.match(/(:\w*:)/g).length > 15)) {
		arr.push('смайлов');
	}
	if (txt.match(/(\[quote=\d+\])/g) && txt.match(/(\[quote=\d+\])/g).length > 5) {
		arr.push('цитат');
  }
  function long_string(arr) {
    let longest = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i].length > longest.length) {
            longest = arr[i];
        }
    }
    return longest;
}
var arrlinks = txt.match(
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g);
	if (arrlinks && long_string(arrlinks).length > 100) {
		longlink = 'Текст комментария содержит слишком длинную ссылку. Воспользуйтесь сократителем.';
	}
	var error = arr
		.reduce(function(prev, curr, i) {
			return prev + curr + (i === arr.length - 2 ? ' и ' : ', ');
		}, '')
		.slice(0, -2);
	if (error || longlink) {
		if (error) {
			textError = 'Текст комментария содержит слишком большое количество ' + error + '.';
		}
		if (longlink) { 
			if (error) {
				textError = textError + longlink;
			} else {
				textError = longlink; 
			}
		}
	} else {
		textError = false;
	}
}
