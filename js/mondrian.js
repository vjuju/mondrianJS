
/*
// A Mondrian structure can be seen as a full binary tree where each node is a box, leaves are endBoxes
// Each node of the binary tree has two attributes :
- a position Left, Right, Bottom, Top
- a initial size in percent
(- a color in the case of a Mondrian)
// One elegant way to define a binary tree is to define an object
// Here we see that with only one child we can define the other one
// In our case the root is the only node with no
// The size of two nodes issued from the same node should always be equal to 100


// For the navigation we need to introduce the notion of aggregate in the model
// The rest is only in the view and the controller
// 

*/


/// VIEW SETTINGS

var BORDER_SIZE = 7;
var BORDER_COLOR = "white";
var DETAILS_FADE_IN_DELAY = 200;
var REFRESHING_RATE = 50;//in ms
var NB_PAINTING_BOX = 20;


/// HELPERS

function compare_contents_areas(a, b) {
	var number = b.area - a.area
	var sign = number && number / Math.abs(number);
	return sign
}

function pickInArray(array) {
		return array[Math.floor(Math.random() * (array.length))]
}

function pickAnIntegerBetween(min, max) {
		return Math.floor(Math.random()*(max-min+1)+min);
}

var positions = ["left", "right", "top", "bottom"];

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

function getContentIdFromUrl(){
	var temp = document.URL.lastIndexOf("#");
	if(temp !== -1){
		pageName = document.URL.substring(temp + 1, document.URL.length);
		return pageName
	}
	return ""
}

function isContentFocusable(contentId){
	var is_focusable = ($("#"+contentId).attr('class').indexOf('non_focusable') < 0);
	return is_focusable
}



var mondrian = {
	initialStructure : {},
	structure : {},
	frame : $('#frame'),
	mode : "painting",
	focusedId : null,
	show_focused_details : false,
	updateRequired : true,
	structure_drawn : false,

	create_initial_structure : function() {
		var root = new Structure();
		switch(this.mode) {
		    case "custom": build_custom_structure(root); break
		    case "painting": build_random_mondrian(root);  break
		    case "contents_with_area" : build_structure_from_contents_with_areas(root); break
		}
		return root
	},

	init_structure : function() {
		this.initialStructure = this.create_initial_structure();
		this.structure =  this.initialStructure.clone();
	},

	render : function() {
		setTimeout(function(){
			mondrian.render();
		}, REFRESHING_RATE); 
		if (this.mode != "painting") {
			mondrian.focusContents(getContentIdFromUrl());
		}
		mondrian.setShowFocusedDetails(mondrian.is_focused_full_frame(0.8));
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
		$(".endBox, .aggregate").mouseenter(on_mouse_enter);
		$(".endBox, .aggregate").mouseleave(on_mouse_leave);
	},

	requireUpdate : function() {
		this.updateRequired = true;
	},

	setFocusId : function(id) {
		if (this.focusedId != id) {
			if(id != null) {
				this.focusedId = id;
				if(this.structure.getById(id).contents){
					document.location.href = "#" + this.structure.getById(id).contents.id ;
				}
				this.structure.getById(id).setAggregate(false);
				this.structure.getById(id).applyAllParents(mondrian.structure, function (struct) {
					struct.setSize(100);
					struct.setAggregate(false);
				}, false);
			} else {
				this.focusedId = null;
				document.location.href = "#";
				this.structure = this.initialStructure.clone();
				this.requireUpdate();
			}
		}
	},

	setShowFocusedDetails : function(value) {
		if (this.show_focused_details != value) {
			this.show_focused_details = value;
			if (value && this.focusedId ) {
				if(this.structure.getById(this.focusedId).contents) {
					if (isContentFocusable(this.structure.getById(this.focusedId).contents.id)) {
						$("#"+ this.focusedId).find("> .innerBox").find(".content").append($("#closeButton"));
						$("#closeButton").fadeIn(DETAILS_FADE_IN_DELAY)
					}
				} else {
					$("#"+this.focusedId).append($("#closeButton"));
					$("#closeButton").fadeIn(DETAILS_FADE_IN_DELAY)
				}
			} else {
				$("#closeButton").fadeOut(DETAILS_FADE_IN_DELAY) ;
			}
			if(this.focusedId && this.structure.getById(this.focusedId)) {
				this.structure.getById(this.focusedId).setShowDetails(value);
			}
		}
	},

	focusContents : function(contentsId) {
		var struct_to_focus = mondrian.structure.getByContentsId(contentsId);
		if (struct_to_focus.length > 0) {
			this.setFocusId(struct_to_focus[0].id);
		} else {
			this.setFocusId(null);
		}
	},

	unfocus : function() {
		mondrian.setFocusId(null);
	},

	//Animation events aren't fired well so those are hacks to identify the view state
	is_focused_full_frame : function (full_frame_ratio){
		if (this.focusedId) {
			var longEnough = $("#" + this.focusedId).width() >= $('#frame').width() * full_frame_ratio ;
			var largeEnough = $("#" + this.focusedId).height() >= $('#frame').height()* full_frame_ratio;
			var isFullFrame = longEnough && largeEnough;
			return isFullFrame
		}
		return false
	}
}

function Structure(obj) {
	this.id = (obj && obj.id) ? obj.id : "0";
	this.position = (obj && obj.position) ? obj.position : "top";
	this.size = (obj && obj.size >= 0) ? obj.size : 100;
	this.color = (obj && obj.color) ? obj.color : 'white';
	this.contents = (obj && obj.contents) ? obj.contents : null;
	this.aggregate = (obj && obj.aggregate) ? obj.aggregate : false;
	this.show_details = (obj && obj.show_details) ? obj.show_details : false;
	//this.parent = parent ? parent : null; // we create here a circular structure
	this.child1 = (obj && obj.child1) ? new Structure(obj.child1) : null;
	this.child2 = (obj && obj.child2) ? new Structure(obj.child2) : null;
}

Structure.prototype.insert = function(struct) {
	//struct.parent = this;
	var positionFirstLetter = struct.position.substr(0,1)
	var oppositePositionFirstLetter = opposite(struct.position).substr(0,1)
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

Structure.prototype.getByContentsId = function(contentsId) { 
	var structs = []
	this.applyAllChidren(function(struct) {
		if (struct.contents && struct.contents.id == contentsId) {
			structs.push(struct);
		}
	});
	return structs;
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
		'size' : (100-this.size)
	}
	return new Structure(complementary);
};

Structure.prototype.getParent = function(root) {
	if (this == root) {
		return null
	} 
	return root.getById(this.id.substr(0, this.id.length - 1))
};

Structure.prototype.getArea = function(root) {
	if(this == root) {
		return 100;
	}
	var area = this.size;
	this.applyAllParents(root, function (struct) { 
		if(struct != root) {
			area = area*struct.size/100
		}
	}, true);
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

Structure.prototype.setAggregate = function(value) {
	if (this.aggregate != value) {
		this.aggregate = value;
		mondrian.requireUpdate();
	}
};

Structure.prototype.setShowDetails = function(value) {
	if (this.show_details != value) {
		this.show_details = value;
		mondrian.requireUpdate();
	}
};

Structure.prototype.applyAllParents = function(root, callback, post) {
	if (post) {
		if(this.getParent(root)){
			callback(this.getParent(root));
			this.getParent(root).applyAllParents(root, callback, post);
		}
	} else {
		callback(this);
		if(this.getParent(root)){
			this.getParent(root).applyAllParents(root, callback, post);
		}
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

Structure.prototype.applyAllChidren = function(callback) {
	callback(this);
	if(this.child1){
		this.child1.applyAllChidren(callback);
	}
	if(this.child2){
		this.child2.applyAllChidren(callback);
	}
}

Structure.prototype.isParent = function(id) {
	return 	id.indexOf(this.id) == 0 
}

Structure.prototype.listEndLeavesIds = function(id) { 
	var ids = [];
	this.applyEndLeaves(function (struct) { ids.push(struct.id)});
	return ids;
}

function build_structure_from_contents_with_areas(root, contents){
	// TO DO : Complex version not ordered
	// In the complex version we create a structure for each content, then pick randomly two of them to create a commun parent structure with the right area and adapt the size of the two children structure and do that recursively. A bit like in a dendogram
	// Simplest version here where we order the area and split recursively the structure to obtain the area we are looking for
	var ordered_contents = contents.sort(compare_contents_areas);
	j = 0 
	var leave_to_insert = root;
	var position = pickInArray(positions);
	for ( var j = 0 ; j < ordered_contents.length; j++ ) {
		var content = ordered_contents[j];
		var struct_with_content;
		if(j < ordered_contents.length-1) {
			position = alternate(position);
			struct_with_content = new Structure ({
					'position' : position,
					'size' : content.area / (leave_to_insert.getArea(root)) * 100
					})
			leave_to_insert.insert(struct_with_content);
			leave_to_insert = struct_with_content.getComplementary(root);
			console.log(struct_with_content)
			console.log(leave_to_insert)
		} else {
			struct_with_content = leave_to_insert
		}
		struct_with_content.contents = content;
		if(content.contents && content.contents.length > 0) {
			struct_with_content.aggregate = true;
			build_structure_from_contents_with_areas(struct_with_content, content.contents);
		}
	}
}

function build_random_mondrian(root){
	BORDER_COLOR = "black";
	BORDER_SIZE = 4;
	var leave_to_insert = root;
	for ( var j = 0 ; j < NB_PAINTING_BOX; j++ ) {
		var position = pickInArray(positions);
		var struct_to_insert = new Structure ({
				'position' : position,
				'size' : pickAnIntegerBetween(20,80),
				'color' : pickInArray(["white", "black", "red", "blue", "yellow"])
				})
		leave_to_insert.insert(struct_to_insert);
		leave_to_insert = root.getById(pickInArray(root.listEndLeavesIds()));
		console.log(leave_to_insert)
	}
}

function createBoxFromStruct(struct, parentBox) {
	var box = $("<div class='box transition endBox'></div>");
	var innerBox = $("<div class='innerBox'></div>");
	box.css("background-color", BORDER_COLOR);
	innerBox.css("background-color", struct.color);
	innerBox.css('top', BORDER_SIZE + 'px'); 
	innerBox.css('bottom', BORDER_SIZE + 'px'); 
	innerBox.css('right', BORDER_SIZE + 'px'); 
	innerBox.css('left', BORDER_SIZE + 'px'); 
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
	if (struct.aggregate) {
		box.addClass('aggregate');
	} else {
		box.removeClass('aggregate');
		box.off();
	}
	if (struct.show_details) {		
		box.find("> .innerBox").find(".details").fadeIn(DETAILS_FADE_IN_DELAY);
	} else {
		box.find("> .innerBox").find(".details").fadeOut(DETAILS_FADE_IN_DELAY);
	}
}

function updateBoxFromStruct(struct, parentBox) {
	var box = $("#"+struct.id);
	setBox(box,struct);
	if (struct.child1) {updateBoxFromStruct(struct.child1, box)};
	if (struct.child2) {updateBoxFromStruct(struct.child2, box)};
}


//////// CONTROLLER

function on_mouse_enter() {
	if($(this).find(".content").length > 0) {
		if($(this).find(".content").attr('class').indexOf('non_focusable') < 0){
			mondrian.setFocusId($(this).attr('id'));
		}
	} else {
		mondrian.setFocusId($(this).attr('id'));
	}
}

function on_mouse_leave() {
	if(!mondrian.show_focused_details){
		mondrian.unfocus();
	}
}

function setUrl(location) {
	document.location.href = "#" + location ;
	mondrian.requireUpdate();
}

$(window).resize(function () {
	adjust_background_sizes();
});

$(window).load(function () {
	adjust_background_sizes();
	$.getScript("./js/jquery.touchSwipe.min.js" );
	$.getScript("https://www.weezevent.com/js/widget/min/widget.min.js");
});

// FOR THE BACKGROUNDS TO COVER THE FRAME AND NOT THEIR OWN BOX

function adjust_background_sizes() {
	$('.frame_cover').each(function(i,obj) {
		imitate_background_cover_behaviour(obj, true);
	});
}

function imitate_background_cover_behaviour(obj, cover_window){
	var image_url = $(obj).css('background-image');
	if (image_url != 'none'){
		var image = getImage(image_url);

		var window_width = cover_window ? parseInt(window.innerWidth)-2*BORDER_SIZE : $(obj).width() ;
		var window_height = cover_window ? parseInt(window.innerHeight)-2*BORDER_SIZE : $(obj).height()  ;

		var backgroundSize = getAdaptedBackgroundSize(image, window_width, window_height);
		var bgSizeString = backgroundSize[0]+ 'px ' + backgroundSize[1] + 'px'
		$(obj).css('background-size', bgSizeString);

		/*
		var offset = getAdaptedBackgroundOffset(backgroundSize[0], backgroundSize[1], window_width, window_height);
		var offsetString =  offset[0]+ 'px ' + offset[1] + 'px'
		$(obj).css('background-position', offsetString);
		*/

		if(cover_window){
			$(obj).css('background-attachment', 'fixed'); 
		} else {
			$(obj).css('background-attachment', 'initial'); 
		}
	}
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

function getAdaptedBackgroundSize(image, window_width, window_height){
	var ratio_image = image.width/image.height;
	var ratio_window = window_width/ window_height;
	var required_image_width ;
	var required_image_height ;
	if (ratio_window > ratio_image) {
			required_image_width  = window_width;
			required_image_height = window_width/ratio_image;
		} else {
			required_image_height = window_height;
			required_image_width = window_height * ratio_image ;
		}
	return [required_image_width, required_image_height]
}

function getAdaptedBackgroundOffset(required_image_width, required_image_height, window_width, window_height){
	var required_image_offset_x ;
	var required_image_offset_y ;
	var difference_height = window_height - required_image_height;
	var difference_width= window_width - required_image_width;
	required_image_offset_x = difference_width/2;
	required_image_offset_y = difference_height/2;	
	return [required_image_offset_x, required_image_offset_y]
}


