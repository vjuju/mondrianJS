
/*
// A Mondrian structure can be seen as a full binary tree where each node is a box, leaves are endBoxes
// Each node of the binary tree has two attributes :
- a position Left, Right, Bottom, Top
- a initial size in percent 
// One elegant way to define a binary tree is to define an object
// Here we see that with only one child we can define the other one
// In our case the root is the only node with no
// The size of two nodes issued from the same node should always be equal to 100



// What could be interesting as well would be to be able to generate a Mondrian with the right areas
// It isn't difficult, one simple way to do it is to order the value and generate 


// For the navigation we need to introduce the notion of aggregate in the model
// The rest is only in the view and the controller
// 

*/

var NB_BOXES = 5;
var contents = [{id:'Coucool', area:30},
				{id:'Participations', area:30},
				{id:'Infos', area:15},
				{id:'Benevoles', area:10},
				{id:'Principes', area:10},
				{id:'Curiosites', area:5,
					contents: [{id:'Eros', area:30},
					{id:'Definitions', area:30},
					{id:'Links', area:40}
					]
				}
				]
				
var root_test = new Structure();

// We will need to do that recursively in the contents

function compare_contents_areas(a, b) {
	var number = b.area - a.area
	var sign = number && number / Math.abs(number);
	return sign
}

function building_structure_from_contents(root, contents){
	// var contents_array = Object.keys(contents).map(function (key) { return {'key':key, 'size':; });
	// In the complex version we pick randomly two contents to create a structure that contains those 2 contents than
	
	// Simplest version where we order the area and split recursively the structure to obtain the area we are looking for
	var ordered_contents = contents.sort(compare_contents_areas);
	console.log(ordered_contents);
	console.log(root.getArea());
	
	j = 0 
	var leave_to_insert = root;
	var position = pickInArray(positions);
	for ( var j = 0 ; j < ordered_contents.length-1; j++ ) {
		var content = ordered_contents[j];
		var struct = new Structure ({
					'position' : position,
					'size' : content.area/leave_to_insert.getArea(root) * 100,
					'contents' : content
					})
		leave_to_insert.insert(struct);
		position = alternate(position)
		leave_to_insert = struct.getComplementary(root);
	}
	leave_to_insert.contents = ordered_contents[j];
	console.log(leave_to_insert);
}

function building_random_structure_with_content(root, contents){
	// Random with content
	var contents_array = Object.keys(contents).map(function (key) { return key; });
	for ( var j = 1 ; j < NB_BOXES; j++ ) {
		var content = ( j < (contents.length + 1) ) ? contents[j-1] : null
		console.log(content);
		var random_struct = {
			'position' : pickInArray(positions),
			'size' : pickAnIntegerBetween(40, 60),
			'color' : pickInArray(["yellow","pink","blue","green"]),
			'contents' : content
			}
		var struct = new Structure(random_struct); 
		var leavesIds = root.listChildrenLeavesIds();
		var leaveIdToInsert = pickInArray(leavesIds);
		var leaveToInsert = root.getById(leaveIdToInsert);
		leaveToInsert.insert(struct);
	}
}
				
/*
var contents = [$("#Coucool"),
			$("#Participations"),
			$("#Infos"),
			$("#Benevoles"),
			$("#Principes"),
			$("#Curiosites"),
			$("#Eros"),
			$("#Definitions")];
*/

var positions = ["left", "right", "top", "bottom"];
var polling_delay = 1;

function pickInArray(array) {
		return array[Math.floor(Math.random() * (array.length))]
}

function pickAnIntegerBetween(min, max) {
		return Math.floor(Math.random()*(max-min+1)+min);
}

function opposite(position) {
	switch(position) {
	    case "left": return "right";
	    case "right": return "left";
	    case "top": return "bottom";
	    case "bottom": return "top";
	}
}

function alternate(position) {
	var horizontal = ["top","bottom"]
	var vertical = ["left","right"]
	console.log(position)
	console.log(horizontal.indexOf(position))
	if (horizontal.indexOf(position)>=0) {
		return pickInArray(vertical)
	}
	return pickInArray(horizontal);
}

function complementaryId(id) {
	var id_last_caracter = id.substr(id.length - 1);
	var id_trunk = id.substr(0, id.length - 1);
	var complementary_character;
	switch(id_last_caracter) {
	    case "t": complementary_character="b"; break;
	    case "b": complementary_character="t"; break;
	    case "l": complementary_character="r"; break;
	    case "r": complementary_character="l"; break;
	}
	return (id_trunk + complementary_character);
}

var mondrian = {
	initialStructure : {},
	structure : {},
	frame : $('#frame'),
	contents : [],
	focusedId : null,
	updateRequired : true,
	structure_drawn : false,

	create_initial_structure : function() {
		var root = new Structure();
		building_structure_from_contents(root, contents);
		//building_random_structure_with_content(root, contents)
		return root
	},

	init_structure : function() {
		this.initialStructure = this.create_initial_structure();
		this.structure =  this.initialStructure.clone();
	},

	render : function() {
		// Need to find a way to pass "this" 
		setTimeout(function(){
			mondrian.render();
		}, polling_delay); //requestAnimationFrame( render );
		if (mondrian.updateRequired) {
			mondrian.update();
		}
	},

	update : function() {
		this.draw();
		this.animate();
		this.updateRequired = false;
	},

	draw : function() {
		if (this.structure_drawn) {
			updateBoxFromStruct(this.structure, $('#frame'));
		} else {
			createBoxFromStruct(this.structure, $('#frame'));
			this.structure_drawn = true;
		}
	},

	animate : function() {
		$(".endBox").click(onBoxClick);
	},

	requireUpdate : function() {
		this.updateRequired = true;
	},

	setFocusId : function(id) {
		if (this.focusedId != id) {
			this.focusedId = id;
			//this.structure.getById(id).increase();
			this.structure.getById(id).applyAllParents(mondrian.structure, function (struct) {struct.setSize(100);});
		}
	},

	backToInitial : function() {
		if (!this.structure.equal(this.initialStructure)) {
			this.focusedId = null;
			this.structure = this.initialStructure.clone();
			this.requireUpdate();
		}
	}
}

function Structure(obj) {
	this.id = (obj && obj.id) ? obj.id : "0";
	this.position = (obj && obj.position) ? obj.position : "top";
	this.size = (obj && obj.size) ? obj.size : 100;
	this.color = (obj && obj.color) ? obj.color : 'white';
	this.contents = (obj && obj.contents) ? obj.contents : null;
	//this.parent = parent ? parent : null; // we create here a circular structure
	this.child1 = (obj && obj.child1) ? new Structure(obj.child1) : null;
	this.child2 = (obj && obj.child2) ? new Structure(obj.child2) : null;
}

Structure.prototype.insert = function(struct) {
	//struct.parent = this;
	var positionFirstLetter = this.position.substr(0,1)
	var oppositePositionFirstLetter = opposite(this.position).substr(0,1)
	this.child1 = struct;
	this.child2 = struct.complementary();
	this.child1.id = this.id + positionFirstLetter;
	this.child2.id = this.id + oppositePositionFirstLetter;
};

Structure.prototype.getById = function(id) { 
	if (this.id == id) {
		return this;
	} else if(this.child1 && this.child1.isParent(id)){
		return this.child1.getById(id);
	} else if (this.child2 && this.child2.isParent(id)){
		return this.child2.getById(id);
	} else {
		return null;
	}
}

Structure.prototype.clone = function() {
	return new Structure(JSON.parse(JSON.stringify(this)));
};

Structure.prototype.equal = function(struct) {
	return JSON.stringify(this) == JSON.stringify(struct) ;
};

Structure.prototype.complementary = function() {
	var complementary = {
		'position' : opposite(this.position),
		'size' : (100-this.size),
		'color' : pickInArray(["yellow","pink","blue","green"])
	}
	return new Structure(complementary);
};

Structure.prototype.getParent = function(root) {
	if (this.id.length > 1) {
		return root.getById(this.id.substr(0, this.id.length - 1))
	} else {
		return null
	}
};

Structure.prototype.getArea = function(root) {
	var area = 100;
	this.applyAllParents(root, function (struct) { area = area*struct.size/100});
	return area;
};

Structure.prototype.getComplementary = function(root) {
	return root.getById(complementaryId(this.id))
};

Structure.prototype.setSize = function(size) {
	if (this.id != mondrian.structure.id) {
		this.size = size;
		this.getComplementary(mondrian.structure).size = (100 - size);
	}
	mondrian.requireUpdate();
};

Structure.prototype.increase = function() {
	var id = this.id;
	console.log(id);
	this.size = this.size+1;
	this.getComplementary(mondrian.structure).size = (100 - this.size - 1);
	if (this.id != mondrian.structure.id && this.size < 100) {
		setTimeout(function(){
			mondrian.structure.getById(id).increase()
		}, polling_delay*20);
	}
	mondrian.requireUpdate();
};


Structure.prototype.applyAllParents = function(root, callback) {
	console.log(this.id)
	callback(this);
	if(this.getParent(root)){
		this.getParent(root).applyAllParents(root, callback);
	}
}

Structure.prototype.applyEndLeaves = function(callback) {
	if(!this.child1 && !this.child2){
		callback(this);
	} else {
		if(this.child1){
			this.child1.applyEndLeaves(callback);
		}
		if(this.child2){
			this.child2.applyEndLeaves(callback);
		}
	}
}

Structure.prototype.isParent = function(id) {
	return 	id.indexOf(this.id) == 0 
}

Structure.prototype.listChildrenLeavesIds = function(id) { 
	var ids = [];
	this.applyEndLeaves(function (struct) { ids.push(struct.id)});
	return ids;
}


function createBoxFromStruct(struct, parentBox) {
	var box = $("<div class='box transition endBox'></div>");
	var innerBox = $("<div class='innerBox'></div>");
	innerBox.css("background-color", struct.color);
	box.append(innerBox);
	if (struct.contents) {
		var contents = $("#" + struct.contents.id);
		innerBox.append(contents)
	}

	setBox(box,struct);
	parentBox.append(box);
	parentBox.removeClass("endBox");
	if (struct.child1) {createBoxFromStruct(struct.child1, box)};
	if (struct.child2) {createBoxFromStruct(struct.child2, box)};
}

function setBox(box,struct){
	var attributeToApplySize = (struct.position == "bottom" || struct.position == "top") ? 'height' : 'width';
	box.css(attributeToApplySize, struct.size + "%");
	box.addClass(struct.position);
	box.attr("id",struct.id);
}


function updateBoxFromStruct(struct, parentBox) {
	//console.log("updating")
	//console.log(struct.size)
	//console.log(struct.id)
	var box = $("#"+struct.id);
	setBox(box,struct);
	if (struct.child1) {updateBoxFromStruct(struct.child1, box)};
	if (struct.child2) {updateBoxFromStruct(struct.child2, box)};
}


////////// MAIN

$(document).ready(function () {
	mondrian.init_structure();
	mondrian.render();
	//adjust_background_sizes();

	//building_structure_from_contents(root_test, contents);
	//$('#frame').append($("<div></div>"))

});

$(window).resize(function () {
	adjust_background_sizes();
});

$(window).load(function () {
	adjust_background_sizes();
});

function adjust_background_sizes(){
	console.log('adjusting_sizes');
	$('.content').each(function(i,obj) {
		var image_url = $(obj).css('background-image');
		if (image_url != 'none'){
			console.log(image_url);
			var image = getImage(image_url);
			$(obj).css('background-size', getAdaptedBackgroundSize(image));
		}
		//css('background-size','100% auto' );
	});
	//background-size: 100% auto;/*3432px 1931px ;*/
}

function getImage(image_url){
	var sizes = "";
	var image_url = image_url.match(/^url\("?(.+?)"?\)$/);
	if (image_url[1]) {
		image_url = image_url[1];
		image = new Image();
		image.src = image_url;
	}
	return image;
}

function getAdaptedBackgroundSize(image){
	//To do retrieve this function from previous work
	return image.width + 'px ' + image.height + 'px'
}


//////// CONTROLLER

function onBoxClick() {
	console.log("pouet");
	console.log($(this).attr('id'));
	mondrian.setFocusId($(this).attr('id'))
}

/*

Structure.prototype.listChildrenIds = function(id) { 
	var ids = [];
	this.applyAllChidren(function (struct) { ids.push(struct.id)});
	return ids;
}

Structure.prototype.applyAllChidren = function(callback) {
	callback(this);
	if(this.child1){
		this.child1.applyAllChidren(callback);
	}
	if(this.child2){
		this.child2.applyAllChidren(callback);
	}
}

Structure.prototype.applyInternalChildren = function(callback) {
	if(this.child1 || this.child2){
		callback(this);
		if(this.child1){
			this.child1.applyInternalChildren(callback);
		}
		if(this.child2){
			this.child2.applyInternalChildren(callback);
		}
	}
}


$( ".box" )
		.mouseenter(increaseOnHover)
	  	.mouseleave(decreaseOnHover)
		.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
});
*/

//console.log(mondrian.structure.child1.id());
/*

var ids = mondrian.structure.listChildrenIds();
console.log(ids)

var leaves_ids = mondrian.structure.listChildrenLeavesIds();
console.log(leaves_ids)

var node = mondrian.structure.getById(ids[0])
console.log(node);

var ids = []
mondrian.structure.applyDown(function (struct) { ids.push(struct.id())});
console.log(ids)

console.log(mondrian.structure.child1.size);
mondrian.structure.child1.size += 5;
console.log(mondrian.structure.child1.size);
*/



