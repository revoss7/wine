function autocomplete() {
	var snippets = ['video', 'spoiler'];
	var txt = gebi('comm') || gebi('itext');
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

var getJSON = function(url, videoid, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'json';
	xhr.onload = function() {
		var status = xhr.status;
		if (status === 200) {
			callback(null, xhr.response);
		} else {
			callback(status, xhr.response);
		}
	};
	xhr.send();
};

var textError = false;
var longVideo = [];

var getFixed = gebi('fixed');
getFixed.addEventListener('DOMSubtreeModified', checkForComm);

function checkForComm() {
	if (gebi('addcomm') && gebi('comm')) {
		var form = document.querySelector('form[onkeypress]');
		form.setAttribute('onsubmit', 'event.preventDefault(); checkBeforeSend(this);');
		form.setAttribute('onkeypress', 'return checkBeforeSendUseCtrlEnter(event, this);');
		autocomplete();
		var comm = gebi('comm');
		checkText(comm);
		if (comm.addEventListener) {
			['input', 'focus'].forEach(function(evt) {
				comm.addEventListener(
					evt,
					function() {
						checkText(comm);
					},
					false
				);
			});
		} else if (txt.attachEvent) {
			comm.attachEvent('onpropertychange', function() {
				checkText(comm);
			});
		}
	}
}

var getTheme = gebi('itext');
if (getTheme) {
	var form = document.querySelector('form[onkeypress]');
	form.setAttribute('onsubmit', 'event.preventDefault(); checkBeforeSend(this);');
	form.setAttribute('onkeypress', 'return checkBeforeSendUseCtrlEnter(event, this);');
	autocomplete();
	checkText(getTheme);
	if (getTheme.addEventListener) {
		['input', 'focus'].forEach(function(evt) {
			getTheme.addEventListener(
				evt,
				function() {
					checkText(getTheme);
				},
				false
			);
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
	} else if (longVideo.length > 0) {
		alert('Длительность видео, которое вы пытаетесь опубликовать, превышает допустимую правилами.');
		var text = gebi('comm') || gebi('itext');
		var arrayLength = longVideo.length;
		for (var i = 0; i < arrayLength; i++) {
			var regEx = new RegExp(longVideo[i].replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'), 'g');
			text.value = text.value.replace(regEx, '');
		}
		longVideo = false;
	} else {
		formElem.submit();
	}
}

function checkBeforeSendUseCtrlEnter(event, formElem) {
	if (event.ctrlKey && (event.keyCode == 0xa || event.keyCode == 0xd)) {
		if (textError) {
			alert(textError);
		} else if (longVideo.length > 0) {
			alert('Длительность видео, которое вы пытаетесь опубликовать, превышает допустимую правилами.');
			var text = gebi('comm') || gebi('itext');
			var arrayLength = longVideo.length;
			for (var i = 0; i < arrayLength; i++) {
				var regEx = new RegExp(longVideo[i].replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'), 'g');
				text.value = text.value.replace(regEx, '');
			}
			longVideo = false;
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
	var longLink;
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
		/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
	);
	if (arrlinks) {
		console.log();
		var youtubeRegex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
		var youtubeLinks = [];
		var arrayLength = arrlinks.length;
		for (var i = 0; i < arrayLength; i++) {
			var link = arrlinks[i].match(youtubeRegex);
			if (link) {
				youtubeLinks.push(link);
			}
		}
		if (youtubeLinks.length > 0) {
			var arrayLength = youtubeLinks.length;
			for (var i = 0; i < arrayLength; i++) {
				text.value = txt.replace(youtubeLinks[i][0], 'https://www.youtube.com/watch?v=' + youtubeLinks[i][1]);
				try {
					var youtubeAPIUrl =
						'https://www.googleapis.com/youtube/v3/videos?id=' +
						youtubeLinks[i][1] +
						'&key=AIzaSyBJmo25rFulm88O0lrhG14glSAWcXfr_JY&part=snippet,contentDetails';
					var videoid = youtubeLinks[i][0];
					function compare(time, videoid) {
						var formatted = time.match(/(\d+)(?=[MHS])/gi) || [];
						if ((formatted[0] && formatted[0] > 29) || formatted[2]) {
							if (longVideo.indexOf(videoid) === -1) {
								longVideo.push(videoid);
							}
						}
					}
					getJSON(youtubeAPIUrl, videoid, function(err, data) {
						if (err !== null) {
							alert('Не удалось проверить длительность видео');
						} else {
							var time = data.items[0].contentDetails.duration;
							if (time) {
								compare(time, videoid);
							}
						}
					});
				} catch (e) {}
			}
		}
		if (long_string(arrlinks).length > 100) {
			longLink = 'Текст комментария содержит слишком длинную ссылку. Воспользуйтесь сократителем.';
		}
	}
	function makeString(arr) {
		if (arr.length === 1) return arr[0];
		const firsts = arr.slice(0, arr.length - 1);
		const last = arr[arr.length - 1];
		if (last) {
			return firsts.join(', ') + ' и ' + last;
		} else {
			return false;
		}
	}
	var error = makeString(arr);

	if (error || longLink) {
		if (error) {
			textError = 'Текст комментария содержит слишком большое количество ' + error + '.';
		}
		if (longLink) {
			if (error) {
				textError = textError + longLink;
			} else {
				textError = longLink;
			}
		}
	} else {
		textError = false;
	}
}

var isMobile = false;
if (
	/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
		navigator.userAgent
	) ||
	/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
		navigator.userAgent.substr(0, 4)
	)
) {
	isMobile = true;
}
if (isMobile && gebi('zdtext')) {
	gebi('textarea').style['fontSize'] = '12px';
}
