const numCols = 32;
const numRows = 6;
const defaultChoices = ["step", "half", "random","step", "random", "step"];
const x = Array.from(Array(numCols).keys());
const audioFolder = "audio/";
const audioFilenames = [["1-kick.wav","2-snare.wav","3-tom.wav", "4-ch.wav","5-oh.wav","6-perc.wav"]];

let multiPlayer = [];
// 
let matrix = Array(numRows).fill().map(()=> Array(numCols).fill(0));
let avoidOpts = [null,null,null,4,3,null];
let syncOpts = Array(numRows).fill(null);
// const midiNoteMap = [36, 40, 47, 44, 46, 56];
const midiNoteMap = ["C2", "E2", "B2", "G#2", "A#2", "G#3"];

let frozen = new Array(numRows).fill(false);

function load_audio(Index){
	for(let i = 0; i < numRows; i++){
		let player = new Tone.Player(audioFolder+audioFilenames[Index][i]);//.toDestination();
		multiPlayer.push(player);
	}
}


//all elements of arr1 not in arr2, both arr1 and arr2 sorted
function getComplement(arr1, arr2){
	let end2 = arr2.length;
	if(end2 == 0) return arr1;
	let ans = [], i = 0, i2 = 0;
	let end = arr1.length;
	while(i < end && i2 < end2){
		if(arr1[i] < arr2[i2]){
			ans.push(arr1[i]);
			i += 1;
		}else if(arr1[i] > arr2[i2]){
			i2 += 1;
		}else{
			i += 1;
		}
	}
	while(i < end){
		ans.push(arr1[i]);
		i += 1;
	}
	return ans;
}


function getCurTrack(row, audioBoxes){
	var i = 0, indexStart = row * numCols;
	var indexEnd = indexStart + numCols;
	let arr = [], arr2 = Array(numCols).fill(0);

	while(indexStart < indexEnd){
		if($(audioBoxes[indexStart]).hasClass("active")) {
			arr.push(i);
			arr2[i] = 1;
		}
		i++;
		indexStart++;
	}
	return [arr, arr2];
}

function getRandomSubarray(arr, size) {
	if (size >= arr.length) return arr;
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}



function getRandom(audioBoxes, freezeChoices){
	var thres = 0.2
	for (var row = 0; row < numRows; row++){
		if(freezeChoices[row].checked > 0){
			continue;
		}
		getRandomTrack(row,audioBoxes,thres);
	}
}


function genTrack(row, audioBoxes, method = "random", stepNum = 0, addon = false, avoid = null, sync = null, offset = 0){
	let arr = getCurTrack(row, audioBoxes);
	switch (method){
		case "clear": clearTrack(row, audioBoxes); break;
		case "random": getRandomTrack(row, audioBoxes,0.2, addon, avoid); break;
		case "addrand": break;
		case "whole": var ptn = 16;
			if(row == 1){offset = ptn/2;}
			getFixedPtn(row, audioBoxes, ptn, offset, addon, avoid);
			break;
		case "half": 
			var ptn = 8;
			if(row == 1){offset = ptn/2;}
			getFixedPtn(row, audioBoxes, ptn, offset, addon, avoid);
			break;
		case "4th": 
			var ptn = 4;
			if(row == 1){offset = ptn/2;}
			getFixedPtn(row, audioBoxes, ptn, offset, addon, avoid);
			break;
		case "4thadd":
			var ptn = 4;
			if(row == 1){offset = ptn/2;}
			getFixedPtn(row, audioBoxes, ptn, offset, true, avoid);
			break;
		case "8th": 
			var ptn = 2;
			getFixedPtn(row, audioBoxes, ptn, offset, addon, avoid);
			break;
		case "16th": 
			getFixedPtn(row, audioBoxes, 1, 0, addon, avoid);
			break;
		case "step": getRandombyStep(row, audioBoxes, stepNum,addon, avoid); break;
		case "halfadd": var ptn = 8;
			if(row == 1){offset = ptn/2;}
			getFixedPtn(row, audioBoxes, ptn, offset, true, avoid); break;
		case "switchrand": switchfromTrack(row,audioBoxes);
			break;
		case "switchstep": switchbyStep(row,audioBoxes, stepNum, addon);
			break;
		case "switchstepadd": switchbyStep(row,audioBoxes, stepNum,true); break;
		case "eu": getEuclidean(row, audioBoxes, stepNum, addon); break;
		default: 
			genTrack(row, audioBoxes,defaultChoices[row],stepNum, addon, avoid, sync, offset);
	}
}


function getEuclidean(row, audioBoxes, stepNum, addon){
	let num = numCols;
	var indexStart = row * numCols;
	matrix[row] = euclidean_rhythm(num, stepNum);
	if(!addon){
		clearTrack(row, audioBoxes);
	}
	for(var col = 0; col < numCols; col++){
		if(matrix[row][col]){
			$(audioBoxes[indexStart + col]).addClass("active");
		}
	}
	
}

function getRandomTrack(row, audioBoxes, thres = 0.2, addon = false, avoid = null){
	var indexStart = row * numCols;
	var avoidTrack, avoidTrackB;
	if(!addon){
		clearTrack(row, audioBoxes);
	}
	if(avoid != null){
		if(avoid < numRows && avoid >= 0){
			[avoidTrack, avoidTrackB] = getCurTrack(avoid,audioBoxes);
		}
	}else{
		avoidTrack = []
		avoidTrackB = Array(numCols).fill(0);
	}
	
	for(var col = 0; col < numCols; col++){
		if(Math.random() < thres && avoidTrackB[col] == 0) {
			// if(!$(audioBoxes[indexStart + col]).hasClass("active")) 
			matrix[row][col] = 1
			$(audioBoxes[indexStart + col]).addClass("active");
		}else{
			matrix[row][col] = 0;
		}
	}
	
	
}

function switchfromTrack(row,audioBoxes, thres = 0.2, addon = false, fromrow = 3){
	[curTrack, curTrackB] = getCurTrack(fromrow, audioBoxes);
	let curStepNum = curTrack.length, curNum = 0, index = 0;
	upperLimit = Math.min(curStepNum/5+1, curStepNum, 6);
	if(!addon){
		clearTrack(row, audioBoxes);
	}
	let indexStart = row * numCols;
	let fromStart = fromrow * numCols;
	for(let i = 0; i < curStepNum; i++){
		if (Math.random() < thres){
			index = curTrack[i];
			$(audioBoxes[fromStart + index]).removeClass("active");
			$(audioBoxes[indexStart + index]).addClass("active");
			curNum += 1;
		}
		if(curNum == upperLimit) break;
	}

}

function switchbyStep(row,audioBoxes, stepNum = 2, addon = false, fromrow = 3){
	[curTrack, curTrackB] = getCurTrack(fromrow, audioBoxes);
	let index = 0;
	
	if(!addon){
		clearTrack(row, audioBoxes);
	}

	let indexStart = row * numCols, fromStart = fromrow * numCols;
	let newSteps = getRandomSubarray(curTrack,stepNum);
	for(let i = 0; i < newSteps.length; i++){
		index = newSteps[i];
		$(audioBoxes[fromStart + index]).removeClass("active");
		$(audioBoxes[indexStart + index]).addClass("active");
	}
}

function getRandombyStep(row, audioBoxes, stepNum, addon = false, avoid = null){
	var indexStart = row * numCols;
	[curTrack, curTrackB] = getCurTrack(row, audioBoxes);
	var avoidTrack, avoidTrackB;
	let curStepNum = curTrackB.reduce((partialSum, a) => partialSum + a, 0);
	if(addon){
		stepNum -= curStepNum;
	}else{
		clearTrack(row, audioBoxes);
		curTrack = []
		curTrackB = Array(numCols).fill(0);
	}
	if(avoid != null){
		if(avoid < numRows && avoid >= 0){
			[avoidTrack, avoidTrackB] = getCurTrack(avoid,audioBoxes);
		}
	}else{
		avoidTrack = []
		avoidTrackB = Array(numCols).fill(0);
	}
	if(stepNum <= 0) return;
	let remain = getComplement(x,curTrack);
	remain = getComplement(remain.sort(function(a, b){return a - b}), avoidTrack);
	matrix[row] = curTrackB;
	newSteps = getRandomSubarray(remain,stepNum);
	// activate the new steps
	for(let i = 0; i < newSteps.length; i++){
		matrix[row][newSteps[i]] = 1;
		$(audioBoxes[indexStart+newSteps[i]]).addClass("active");
	}
}

function clearTrack(row, audioBoxes){
	var indexStart = row*numCols
		for(let index = indexStart; index < indexStart + numCols; index++){
			$(audioBoxes[index]).removeClass("active");
			$(audioBoxes[index]).removeClass("accent");
		}
}

function getFixedPtn(row, audioBoxes, step = 8, offset = 0, addon = false, avoid = null){
	var avoidTrack, avoidTrackB, indexStart = row * numCols;
	var index = offset % step + indexStart;
	if(!addon){
		clearTrack(row, audioBoxes);
	}
	if(avoid != null){
		if(avoid < numRows && avoid >= 0){
			[avoidTrack, avoidTrackB] = getCurTrack(avoid,audioBoxes);
		}
	}else{
		avoidTrack = []
		avoidTrackB = Array(numCols).fill(0);
	}
	while(index < indexStart + numCols){
		if(!avoidTrackB[index-indexStart]){
			$(audioBoxes[index]).addClass("active");
		}
		index += step;
	}
}


window.addEventListener('load',function(){
	load_audio(0);

	var audioSources = document.getElementsByTagName("audio");
	var labels = document.getElementsByClassName('f_in');

	var audioBoxes = document.getElementsByClassName("audio_box");
	var audio2Boxes = document.getElementsByClassName("audio_box2");

	var addBtn = document.querySelector("#addBtn");
	var addlbl = document.querySelector("#addlbl");
	var HHChoice = document.querySelector("#Hatopts");
	var start = document.querySelector("#start");
	var stop = document.querySelector("#stop");
	var genAllBtn = document.querySelector("#genall");
	var clear = document.querySelector("#clear");
	
	var sliders = document.getElementsByClassName("slider");
	var sliderVals = document.getElementsByClassName("sliderVal")
	var trackVolSliders = document.getElementsByClassName("sliderVol");
	var trackVolLbls = document.getElementsByClassName("Volumelbl");
	var trackVerbs = document.getElementsByClassName("verb");
	var trackVerblbls = document.getElementsByClassName("verblbl");

	var freezeChoices = document.getElementsByClassName("freezechoice");
	var genTracksBtn = document.getElementsByClassName("gen_btn");
	var genChoiceSel = document.getElementsByClassName("sel");
	var moveLeft = document.getElementsByClassName("move_left");
	var moveRight = document.getElementsByClassName("move_right");
	var BPM = document.querySelector("#BPM");
	var resetMixbtn = document.querySelector("#resetMix");
	var downloadContent = document.querySelector("#dlContent")
	var downloadBtn = document.querySelector("#dlBtn")
	// var interval = 15000/BPM.value;



	Tone.Transport.bpm.value = BPM.value;
	var verbs = []
	for(let i = 0; i < numRows; i++){
		verbs.push(new Tone.Freeverb(0.6,3000).toDestination());
	}


	
	Tone.Transport.scheduleRepeat((time) => {
		let current;
		for (var i = 0; i < numRows; i++){
			current = index + numCols * i
			if($(audioBoxes[current]).hasClass("active")){
				let accnt = $(audioBoxes[current]).hasClass("accent");
				// if(!accnt){multiPlayer[i].volume.value -= 12;}
				// multiPlayer[i].start(time).stop(time + interval/1000);
				multiPlayer[i].start(time);
				// if(!accnt){multiPlayer[i].volume.value += 12;}
			}
		}
		$(audio2Boxes[(index+31)%32]).removeClass("active");
		if(index+1>31){
			index=0;
		}else{
			index++;
		}
		$(audio2Boxes[(index+31)%32]).addClass("active");
		
	}, "16n");
	// transport must be started before it starts invoking events



	document.addEventListener('keydown', (event) => {
		// alert(`Keydown: The key pressed is ${keyName} and its code value is ${keyCode}`);
		switch(event.code){
			case "Space": startPlayback(); break;
			case "Enter": 
				for(let i = 0; i < numRows; i++){getTrack(i);}
				break;
			case "Digit1": if(!event.ctrlKey){
				if(event.shiftKey)getTrack(0);}
				else{changeFrzStatus(0);} break;
			case "Digit2": if(!event.ctrlKey){
				if(event.shiftKey)getTrack(1);}
				else{changeFrzStatus(1);} break;
			case "Digit3": if(!event.ctrlKey){
				if(event.shiftKey)getTrack(2);}
				else{changeFrzStatus(2);} break;
			case "Digit4": if(!event.ctrlKey){
				if(event.shiftKey)getTrack(3);}
				else{changeFrzStatus(3);} break;
			case "Digit5": if(!event.ctrlKey){
				if(event.shiftKey)getTrack(4);}
				else{changeFrzStatus(4);} break;
			case "Digit6": if(!event.ctrlKey){
				if(event.shiftKey)getTrack(5);}
				else{changeFrzStatus(5);} break;
			case "KeyS": if(event.ctrlKey){downloadMIDI();} break;
		}
  	}, false);

	function changeFrzStatus(i){
		let frzCh = freezeChoices[i]
		if(!frzCh.checked){
			genTracksBtn[i].setAttribute("disabled", "");
			frzCh.checked = true;
		}else{
			genTracksBtn[i].removeAttribute("disabled");
			frzCh.checked = false;
		}
		
	}

	function getTrack(i){
		if(!genTracksBtn[i].hasAttribute("disabled")){
			var method = genChoiceSel[i].value;
			var stepNum = sliders[i].value;
			let sync = syncOpts[i];
			genTrack(i, audioBoxes, method, stepNum, $(addBtn).hasClass("addmode"), avoidOpts[i]);
			if(sync){
				if(sync[1])	genTrack(sync[0], audioBoxes, "switchrand");
			}
			
		}
	}
	HHChoice.addEventListener("change", function(){
		switch(this.value){
			case "brutal": 	avoidOpts[3] = null;	avoidOpts[4] = null; 
				syncOpts[3] = null; 	syncOpts[4] = null;	
				sliderVals[4].style.visibility = "visible";
				sliders[4].style.visibility = "visible";	break;	
			case "sync": avoidOpts[3] = 4; avoidOpts[4] = 3; 
				syncOpts[3] = [4,1];	syncOpts[4] = [3,0];	
				sliderVals[4].style.visibility = "hidden";
				sliders[4].style.visibility = "hidden";		break;
			default: avoidOpts[3] = 4;	avoidOpts[4] = 3; 
				syncOpts[3] = null; 	syncOpts[4] = null;	
				sliderVals[4].style.visibility = "visible";
				sliders[4].style.visibility = "visible";	break;
		}
	});
	addBtn.addEventListener("click",function(){
		if(this.value == "Scratch"){
			this.value = "Add";
			$(addBtn).addClass("addmode");
			addlbl.textContent = "Tracks not cleared before generation."
		}else{
			this.value = "Scratch";
			$(addBtn).removeClass("addmode");
			addlbl.textContent = "Tracks cleared before generation."
		}
	});

	resetMixbtn.addEventListener("click", function(){
		for(let i = 0; i < numRows; i++){
			trackVolSliders[i].value = "0";
			trackVolLbls[i].textContent = "0dB";
			trackVerbs[i].value = "0";
			trackVerblbls[i].textContent = "0% reverb";
		}
	});
	
	for(let i = 0; i < numRows; i++){
		multiPlayer[i].connect(verbs[i]);

		$(freezeChoices[i]).change(function(){
			if(this.checked){
				genTracksBtn[parseInt(this.name)].setAttribute("disabled", "");
			}else{
				genTracksBtn[parseInt(this.name)].removeAttribute("disabled");
			}
		});
 
		$(labels[i]).change(function(){
			var url = null;
			url = URL.createObjectURL(this.files[0]);
			audioSources[i].src=url;
		});

		$(sliders[i]).on("input change", function() { 
			sliderVals[parseInt(this.name)].textContent = this.value;
		});

		genTracksBtn[i].addEventListener("click",function(){
			getTrack(i);
		});

		for(let j = 0; j < numCols; j++){
			let index = i*numCols + j;
			audioBoxes[index].addEventListener("click",function(){
				if($(audioBoxes[index]).hasClass("active")){
					$(audioBoxes[index]).removeClass("active");
				}else{
					$(audioBoxes[index]).addClass("active");
				}
			});
		}
		// for(let j = 0; j < numCols; j++){
		// 	let index = i*numCols + j;
		// 	audioBoxes[index].addEventListener("click",function(){
		// 		if($(audioBoxes[index]).hasClass("active")){
		// 			if($(audioBoxes[index]).hasClass("accent")){
		// 				$(audioBoxes[index]).removeClass("active");
		// 				$(audioBoxes[index]).removeClass("accent");
		// 			}else{$(audioBoxes[index]).addClass("accent");}
		// 		}else{
		// 			$(audioBoxes[index]).addClass("active");
		// 		}
		// 	});
		// }


		$(moveLeft[i]).click(function(){
			switch_left(i, freezeChoices[i].checked, audioBoxes)
		});
		$(moveRight[i]).click(function(){
			switch_right(i, freezeChoices[i].checked, audioBoxes)
		});

		$(trackVolSliders[i]).change(function(){
			var suffix = "";
			if(parseInt(this.value) > 0) suffix = "+";
			trackVolLbls[i].textContent = suffix + this.value + "dB";
			multiPlayer[i].volume.value = parseInt(this.value);
		});

		verbs[i].wet.value = 0; 
		$(trackVerbs[i]).change(function(){
			trackVerblbls[i].textContent = this.value + "% reverb";
			verbs[i].wet.value = parseFloat(this.value/100);
			console.log(i, verbs[i].wet.value);
		});
	}
	
	


	BPM.addEventListener("change", function(){
		if( parseInt(this.value)<20 ){
			alert("can't be smaller than 20");
			this.value=120;
			Tone.Transport.bpm.value = 120;
		}
		Tone.Transport.bpm.value = BPM.value;
		interval = 15000/BPM.value;


	});

	let index = 0;

	
	let controlfun = null;
	var startFlag = false;
	function startPlayback(){
		if(!startFlag){
			$(audio2Boxes[index]).addClass("active");
			startFlag = true;
			start.textContent = "Pause";
			Tone.Transport.start();
		}
		else{
			pausePlayback();
			
		}
	}
	function pausePlayback(){
		startFlag = false;
		start.textContent = "Play";
		Tone.Transport.stop();
	}
	function stopPlayback(){
		$(audio2Boxes[(index+31)%32]).removeClass("active");
		index = 0;
		startFlag = false;
		start.textContent = "Play";
		Tone.Transport.stop();
	}
	
	start.addEventListener("click", startPlayback);
	stop.addEventListener("click", stopPlayback);

	clear.addEventListener("click", function(){
		$(audio2Boxes[(index+31)%32]).removeClass("active");
		
		reset();
	});
	function reset(){
		for(let i = 0; i < numRows; i++){
			if(!freezeChoices[i].checked){
				clearTrack(i,audioBoxes);
			}
		}
	}

	genAllBtn.addEventListener("click",function(){
		for(let i = 0; i < numRows; i++){
			getTrack(i);
		}
	});
	downloadBtn.addEventListener("click", downloadMIDI);
	function downloadMIDI(){
		let uri = get_midi(audioBoxes,BPM.value);
		downloadContent.href = uri;
		downloadContent.click();
	}
	
});


function switch_left(row, freezed, audioBoxes){
	if(freezed) return;
	var indexStart = row * 32;
	var tmp = $(audioBoxes[row*numCols]).hasClass("active");
	for(var i = 0; i < numCols-1; i++){
		next = $(audioBoxes[indexStart+i+1]).hasClass("active");
		set_audiobox(audioBoxes[indexStart+i], next);
	}
	set_audiobox(audioBoxes[indexStart+numCols -1], tmp);
}

function switch_right(row, freezed, audioBoxes){
	if(freezed) return;
	var indexStart = row * 32;
	var tmp = $(audioBoxes[(row+1)*numCols -1]).hasClass("active"); 
	for(var i = numCols-1; i >0; i--){
		next = $(audioBoxes[indexStart+i-1]).hasClass("active");
		set_audiobox(audioBoxes[indexStart+i], next);
	}
	set_audiobox(audioBoxes[indexStart], tmp);
}

function set_audiobox(audiobox, box_on){
	if($(audiobox).hasClass("active")){
		if(!box_on) $(audiobox).removeClass("active");
	}else{
		if(box_on) $(audiobox).addClass("active");
	}	
}

function get_midi(audioBoxes, speed = 120){
	for(let i = 0; i < numRows; i++){
		[unused, matrix[i]] = getCurTrack(i, audioBoxes);
	}
	const track = new MidiWriter.Track();
	track.setTempo(speed, 0);
	track.addTrackName("drum pattern");
	track.addCopyright("©github.com/KwDing");
	let waitTime = [], rest = true;
	for(let j = 0; j < numCols; j++){
		let arr = []
		rest = true;
		for(let i = 0; i < numRows; i++){
			if(matrix[i][j]){
				rest = false
				arr.push(midiNoteMap[i]);
			}
		}
		if(rest){
			waitTime.push("16");
		}else{
			let e = new MidiWriter.NoteEvent({pitch: arr, duration: "16", wait: waitTime, channel: 10})
			track.addEvent(e);
			waitTime = [];
		}
	}
	const write = new MidiWriter.Writer(track);
	return write.dataUri();
}

function euclidean_rhythm(num, step){
	let i = 0, r = step, r_prev = num, list_of_steps = [], r_cur = 0, delNum = 0;
	for(i=0;i<step;i++){
		list_of_steps.push([1]);
	}
	while(i<num){
		list_of_steps.push([0]);
		i+=1;
	}
	
	while(r > 1){
		q = parseInt(r_prev / r);
		r_cur = r;
		r = r_prev - q * r;
		
		delNum = (q-1)*r_cur;
		
		for(i = 0; i < r_cur; i++){
			for(let j = 0; j < q-1; j++){
				list_of_steps[i].push(...list_of_steps[r_cur]);
			}
		}
		if(delNum>0)list_of_steps.splice(-delNum);
		for(i = 0; i < r; i++){
			list_of_steps[i].push(...list_of_steps[r_cur]);
		}
		if(r>0) list_of_steps.splice(-r);		
		r_prev = r_cur;
	}
	for(i = 1; i < list_of_steps.length;i++){
		list_of_steps[0].push(...list_of_steps[i]);
	}
	// console.log(list_of_steps[0]);
	return list_of_steps[0];

}