// import MidiWriter from '/midiwriter.js';
const numCols = 32;
const numRows = 6;
const defaultChoices = ["step", "half", "random","step", "random", "step"];
const x = Array.from(Array(numCols).keys());
let matrix = Array(numRows).fill().map(()=> Array(numCols).fill(0));
let avoidOpts = [null,null,null,4,3,null];
let syncOpts = Array(numRows).fill(null);
// console.log(matrix);

let frozen = new Array(numRows).fill(false);
/* all elements of arr1 not in arr2, both arr1 and arr2 sorted*/
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
	// console.log(indexStart, indexEnd, audioBoxes[indexStart]);
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
		default: 
			genTrack(row, audioBoxes,defaultChoices[row],stepNum, addon, avoid, sync, offset);
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
	upperLimit = Math.min(curStepNum/5+1, curStepNum);
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
	// console.log(newSteps);
}

function clearTrack(row, audioBoxes){
	var indexStart = row*numCols
		for(let index = indexStart; index < indexStart + numCols; index++){
			$(audioBoxes[index]).removeClass("active");
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
	
	var audioSources = document.getElementsByTagName("audio");
	var labels = document.getElementsByClassName('f_in');

	var audioBoxes = document.getElementsByClassName("audio_box");
	var audio2Boxes = document.getElementsByClassName("audio_box2");

	var addBtn = document.querySelector("#addBtn")
	var HHChoice = document.querySelector("#Hatopts");
	var start = document.querySelector("#start");
	var stop = document.querySelector("#stop");
	var genAllBtn = document.querySelector("#genall");
	var clear = document.querySelector("#clear");

	
	var sliders = document.getElementsByClassName("slider");
	var sliderVals = document.getElementsByClassName("sliderVal")

	var freezeChoices = document.getElementsByClassName("freezechoice");
	var genTracksBtn = document.getElementsByClassName("gen_btn");
	var genChoiceSel = document.getElementsByClassName("sel");
	var moveLeft = document.getElementsByClassName("move_left");
	var moveRight = document.getElementsByClassName("move_right");
	var BPM = document.querySelector("#BPM");
	var interval = 15000/BPM.value;

	function getTrack(i){
		if(!genTracksBtn[i].hasAttribute("disabled")){
			var method = genChoiceSel[i].value;
			var stepNum = sliders[i].value;
			// console.log(i, "avoidTrack ", avoidOpts[i], "gen with", method);
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
		}else{
			this.value = "Scratch";
			$(addBtn).removeClass("addmode");
		}
	});
	for(let i = 0; i < numRows; i++){
		$(freezeChoices[i]).change(function(){
			if(this.checked){
				genTracksBtn[parseInt(this.name)].setAttribute("disabled", "");
			}else{
				genTracksBtn[parseInt(this.name)].removeAttribute("disabled");
			}
		});
 
		$(labels[i]).change(function(){
			// console.log($(this).val());
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
		$(moveLeft[i]).click(function(){
			switch_left(i, freezeChoices[i].checked, audioBoxes)
		});
		$(moveRight[i]).click(function(){
			switch_right(i, freezeChoices[i].checked, audioBoxes)
		});
	}
	
	


	BPM.addEventListener("change", function(){
		if( parseInt(this.value)<20 ){
			alert("can't be smaller than 20");
			this.value=120;
		}
		interval = 15000/BPM.value;
		clearInterval(controlfun);
		controlfun = null;
		controlfun = setInterval(timeControl,interval);
	});
	let index = 0;


	let timeControl = function(){
		for (var i=0;i<numRows;i++){
			if($(audioBoxes[index + numCols * i]).hasClass("active")){
				audioSources[i].currentTime = 0;
				audioSources[i].play();
			}
		}
		setTimeout(function(){
			$(audio2Boxes[(index+31)%32]).removeClass("active");
			if(index+1>31){
				index=0;
			}else{
				index++;
			}
			$(audio2Boxes[(index+31)%32]).addClass("active");
		},interval);
	}
	
	let controlfun = null;
	var startFlag = false;
	start.addEventListener("click",function(){

		if(!startFlag){
			controlfun = setInterval(timeControl,interval);
			$(audio2Boxes[0]).addClass("active");
			startFlag = true;

		}
		
	});
	
	stop.addEventListener("click",function(){
		clearInterval(controlfun);
		$(audio2Boxes[(index+31)%32]).removeClass("active");
		index = 0;
		startFlag = false;
		controlfun = null;
	});
	clear.addEventListener("click", function(){
		$(audio2Boxes[(index+31)%32]).removeClass("active");
		// index = 0;
		// startFlag = false;
		// controlfun = null;
		reset();
	});
	function reset(){
		// matrix.fill(0);
		for(let i = 0; i < numRows; i++){
			if(!freezeChoices[i].checked){
				clearTrack(i,audioBoxes);
			}
		}
		// for(var i=0;i<audioBoxes.length;i++){
		// 	$(audioBoxes[i]).removeClass("active");
		// }
		// for(var i=0;i<audio2Boxes.length;i++){
		// 	$(audio2Boxes[i]).removeClass("active");
		// }
	}

	genAllBtn.addEventListener("click",function(){
		for(let i = 0; i < numRows; i++){
			getTrack(i);
		}
	});
});


function switch_left(row, freezed, audioBoxes){
	if(freezed) return;
	var indexStart = row * 32;
	var tmp = $(audioBoxes[row*numCols]).hasClass("active");
	var cur, prev;
	// console.log(tmp);
	for(var i = 0; i < numCols-1; i++){
		// matrix[row][i] = matrix[row][i+1];
		next = $(audioBoxes[indexStart+i+1]).hasClass("active");
		set_audiobox(audioBoxes[indexStart+i], next);
	}
	// matrix[row][numCols -1] = tmp;
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
