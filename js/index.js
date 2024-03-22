const numCols = 32;
const numRows = 6;
let matrix = Array(numRows).fill().map(()=> Array(numCols).fill(0));
window.addEventListener('load',function(){

	var bpmInput = document.getElementsByTagName("input");
	// var body = document.getElementsByTagName('body');
	// var rowDiv = document.createElement('div');
	// var audioBox = document.createElement('div');
	// audioBox.className = 'audio_box';
	// rowDiv.style.cssText = '';
	// rowDiv.appendChild(audioBox);
	// document.body.appendChild(rowDiv);
	var audioBoxes = document.getElementsByClassName("audio_box");
	var audio2Boxes = document.getElementsByClassName("audio_box2");
	var start = document.querySelector("#start");
	var stop = document.querySelector("#stop");
	var random = document.querySelector("#random");
	var clear = document.querySelector("#clear");
	var audioSources = document.getElementsByTagName("audio");
	var labels = document.getElementsByTagName('input');
	console.log(labels);
	var BPM = document.querySelector("#BPM");
	// var Kick = document.querySelector("#KickLabel");
	// var KickFile = document.querySelector("#KickFile");
	var interval = 15000/BPM.value;
	// https://stackoverflow.com/questions/49971247/drag-and-drop-a-file-on-label

	// KickFile.addEventListener("change", function(){
	// 	console.log(this.files[0]);
	// });
	// KickLabel.addEventListener("dragenter", function(){
	// 	KickLabel.addClass("dragged-over");
	// });
	// KickLabel.addEventListener("dragend drop dragexit dragleave", function(){
	// 	this.removeClass('dragged-over');
	// });

	// for(var i = 0; i < numRows; i++){
	// 	labels[i].addEventListener("change", function(){
	// 		console.log($(this.val()));
	// 		var url = null;
	// 		url = URL.createObjectURL(this.files[0]);
	// 		audioSources[i].src = url;
	// 	});
	// }
	console.log(labels[0]);
	for(let i = 0; i < numRows; i++){
		$(labels[i]).change(function(){
			// console.log($(this).val());
			var url = null;
			url = URL.createObjectURL(this.files[0]);
			audioSources[i].src=url;
		});
	}
	
	
	for(let i = 0; i < audioBoxes.length; i++){
		audioBoxes[i].addEventListener("click",function(){
			if($(audioBoxes[i]).hasClass("active")){
				$(audioBoxes[i]).removeClass("active");
			}else{
				$(audioBoxes[i]).addClass("active");
			}
		});
	}
	BPM.addEventListener("change", function(){
		if( parseInt(this.value)<20 ){
			alert("can't be smaller than 20");
			this.value=120;
		}
		interval = 15000/BPM.value;
		console.log(interval);
		console.log(BPM.value);

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
				// reset();
				// getRandom();
			}else{
				index++;
			}
			$(audio2Boxes[(index+31)%32]).addClass("active");
		},interval);
	}
	
	let controlfun = null;
	

	var startFlag = false;
	start.addEventListener("click",function(){
		controlfun = setInterval(timeControl,interval);
		if(!startFlag){
			$(audio2Boxes[0]).addClass("active");
			startFlag = true;

		}
		
	});
	
	stop.addEventListener("click",function(){
		clearInterval(controlfun);
		// reset();
		$(audio2Boxes[(index+31)%32]).removeClass("active");
		index = 0;
		startFlag = false;
		controlfun = null;
	});
	clear.addEventListener("click", function(){
		reset();
	});
	function reset(){
		for(var i=0;i<audioBoxes.length;i++){
			$(audioBoxes[i]).removeClass("active");
		}
		for(var i=0;i<audio2Boxes.length;i++){
			$(audio2Boxes[i]).removeClass("active");
		}
	}
	


	random.addEventListener("click",function(){
		getRandom(audioBoxes)
		// clearInterval(controlfun);
	});
});
function getRandom(audioBoxes){
	var thres = 0.2
	for (var row = 0; row < numRows; row++){
		var indexStart = row * 32;
		for (var col = 0; col < numCols; col++){
			if(Math.random() > thres){
				$(audioBoxes[indexStart + col]).removeClass("active");
				matrix[row][col] = 0;
			}else{
				$(audioBoxes[indexStart + col]).addClass("active");
				matrix[row][col] = 1;
			}
		}
	}
}