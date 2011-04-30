var log = Ti.API.info;

var gtts = (function () { 
    var my = {},
    headers,
    fnCallback,
    bufferSize = 0,
    beatbox = false,
    bufferCounter = 1,
    files = [];
    
    headers = {
        'Host': 'translate.google.com',
        'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:2.0.0) Gecko/20110320 Firefox/4.0.0',
       'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-us,en;q=0.5',
        'Accept-Encoding': 'gzip,deflate',
        'Accept-Charset': 'utf-8;q=0.7,*;q=0.7'
    };
    
    
    function timestamp () {
       return new Date().getTime();
    }

    
    function split(text, maxlength) {
      var len = text.length;
      var pos = -1;
      for (var i=maxlength; i<len; i += maxlength) {
        var separator = "\n";
        for (pos = i; text.charAt(pos) != " "; pos--) {
          if (pos == i-maxlength){
            pos = i;
            separator += text.charAt(pos);
            len++;
            break;
          }
        }
        text = text.substring(0, pos) + separator + text.substring(pos+1, len-1);
        i = pos;
      }
      return text;
    }
    
    function download(url, number) {
        var xhr = Ti.Network.createHTTPClient();
        xhr.open('GET', url, false);
        xhr.setTimeout(1000);
        for (var key in headers ) { 
            if (headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key]);
            }
        }
        xhr.onerror = function () {
            Ti.API.info('gtts: Download error');
        };
        xhr.onload = function () {
        	if (Ti.Platform.name == 'android') {
        		var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'tmp_'+timestamp()+'_'+number+'.mp3');
        		f.write(xhr.responseData);
        		files.push(f);
        	} else {
        		files.push(xhr.file);	
        	}
            downloadFinished();
        };
        if (Ti.Platform.name != 'android') {
        	xhr.file = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory,'tmp_'+timestamp()+'_'+number+'.mp3');
        }
        xhr.send();
    }
    
    function buildUrls(buffer, language) {
        var baseurl = 'http://translate.google.com/translate_tts?';
        if (beatbox) {
            baseurl +='format=bb&';
        }
        var urls = [];
        for (var i=0;i < buffer.length;i++) {
            urls.push(baseurl+'q='+encodeURIComponent(buffer[i])+'&tl='+encodeURIComponent(language));
        }	
        return urls;
    }
    
    function downloadFinished () {
        if(bufferSize == bufferCounter) {
            my.mp3_files = files;
            mergeFiles();
        } else {
            bufferCounter++;
        }
    }
    
    function mergeFiles () {
        var finalFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'final_'+timestamp()+'.mp3');
//        finalFile.createFile();
		finalFile.write("");
		if (Ti.Platform.name == 'android') {
	    	var firstFile = Ti.Filesystem.getFile(files[0].nativePath);
		} else {
			var firstFile = Ti.Filesystem.getFile(files[0]);
		}
        finalFile.write(firstFile);
        firstFile.deleteFile();
        for (var i = 1; i < files.length; i++) {
            var nextFile = Ti.Filesystem.getFile(files[i]);
            finalFile.append(nextFile.read.blob);
            nextFile.deleteFile();
        }
        fnCallback(finalFile.nativePath);
    }
    
    my.mp3_files = [];
    my.run = function(text, language, callback, bb) { 
       fnCallback = callback;
       bufferCounter = 1;
       files = [];
       beatbox = bb;
       var buffer = split(text, 95);
       var urls = buildUrls(buffer.split('\n'), language);
       bufferSize = urls.length;
        for (var i = 0; i < urls.length;i++ ) {
            download(urls[i], i);
        }
    };  
    return my; 
}());


Titanium.UI.setBackgroundColor('#000');
//var appWin = Ti.UI.createWindow();

var tabGroup = Titanium.UI.createTabGroup({buttom:-65});

var win = Ti.UI.createWindow({
    title:'gtts example',
    navBarHidden: false,
    backgroundColor: 'white',
    tabBarHidden: true 
});

var tab1 = Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Tab 1',
    window:win
});


/*var nav = Ti.UI.iPhone.createNavigationGroup({
    window: win
});
*/

var text = Ti.UI.createTextArea({
    value: 'Hello world! I\'m robot. Kill all humans!',
    height:250,
    width:290,
    font:{fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
    top:15,
    left:15,
    borderWidth:2,
    borderColor:'#bbb',
    borderRadius:8,
    borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED
});

var sayButton = Ti.UI.createButton({
    title: 'Say it!',
    height:30,
    width:270,
    font:{fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
    top:280,
    left:30,
    borderWidth:2,
    borderColor:'#bbb',
    color: 'black',
    borderRadius:8
});

var sendButton = Ti.UI.createButton({
    title: 'Send it!',
    height:30,
    width:270,
    font:{fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
    top:330,
    left:30,
    borderWidth:2,
    borderColor:'#bbb',
    color: 'black',
    borderRadius:8
});

var bbButton = Ti.UI.createButton({
    title: 'Give the beat!',
    height:30,
    width:270,
    font:{fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
    top:380,
    left:30,
    borderWidth:2,
    borderColor:'#bbb',
    color: 'black',
    borderRadius:8
});


function play(file) {
	Ti.API.info(file);
	var sound = Ti.Filesystem.getFile(file);
    var player = Ti.Media.createSound({url:file});
    player.url = file;
    player.play();
//    log('mp3 file: ' + file);
}

function send(file) {
    var emailDialog = Titanium.UI.createEmailDialog();
    emailDialog.subject = 'Check this';
    emailDialog.toRecipients = [];
    emailDialog.messageBody = 'Check this';
    var f = Ti.Filesystem.getFile(file);
    emailDialog.addAttachment(f);
    emailDialog.open();
}

sayButton.addEventListener('click', function(e){
    text.blur();
    gtts.run(text.value, 'en', play);    
});

sendButton.addEventListener('click', function(e){
    text.blur();
    gtts.run(text.value, 'en', send);     
});

bbButton.addEventListener('click', function(e){
    text.blur();
    gtts.run('pv zk pv pv zk pv zk kz zk pv pv pv zk pv zk zk pzk pzk pvzkpkzvpvzk kkkkkk bsch', 'en', play, true);    
    
});


win.add(sayButton);
win.add(bbButton);
win.add(sendButton);
win.add(text);

tabGroup.addTab(tab1); 
tabGroup.open();
//appWin.add(win);

//appWin.open();