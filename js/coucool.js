//mondrian.mode = "custom";


////////// MAIN

$(document).ready(function () {
	mondrian.mode = "custom";
	mondrian.init_structure();
	if(getContentIdFromUrl() != ""){
		mondrian.focusContents(getContentIdFromUrl());
	} else {
		mondrian.focusContents("Coucool");
		setTimeout(function(){mondrian.setFocusId(null)}, 2000);
	}
	mondrian.render();
});

$(window).load(function () {
	adjust_background_sizes();
	$.getScript("./js/jquery.touchSwipe.min.js" );
	$.getScript("https://www.weezevent.com/js/widget/min/widget.min.js");
});


function build_custom_structure(root) {
	contents_without_Coucool = [
			{id:'Participations', area:50},
			{id:'Infos', area:15},
			{id:'Benevoles', area:15},
			{id:'Principes', area:10},
			{id:'Curiosites', area:10},
			{id:'Eros', area:0},
			{id:'Definitions', area:0}
			];
	
	contents_without_Coucool_and_participations = [
				{id:'Infos', area:30},
				{id:'Benevoles', area:30},
				{id:'Principes', area:20},
				{id:'Curiosites', area:20},
				{id:'Eros', area:0},
				{id:'Definitions', area:0}
				];
	
	var image_ratio = 1.8046499873641648; //image.width/image.height;
	var window_width = $("#frame").width();
	var window_height = $("#frame").height();
	var position_coucool, size_coucool, struct_coucool, struct_participations;
	// If the width is too small, we want Coucool box to be the first one 
	if(parseInt(window.innerWidth)<768) {
		//var image = getImage($(".artwork").css('background-image')); We need the ratio before the load
		position_coucool = pickInArray(["top","bottom"]);
		size_coucool = (window_width/image_ratio)/window_height * 100;
		struct_coucool = new Structure ({
					'position' : position_coucool,
					'size' : size_coucool,
					'contents' : {id:"Coucool", area:size_coucool}
					})
		root.insert(struct_coucool);	
		build_structure_from_contents_with_areas(struct_coucool.getComplementary(root), contents_without_Coucool)
	} else {
		// Let's assume 
		var first_size = 60;
		var first_struct = new Structure ({
					'position' : pickInArray(["left","right"]),
					'size' : first_size
					})
		root.insert(first_struct);

		position_coucool = pickInArray(["top","bottom"]);
		width_coucool = first_size * window_width / 100 - 2 * BORDER_SIZE;
		requested_height_coucool = width_coucool/image_ratio;
		size_coucool = (requested_height_coucool + 2 * BORDER_SIZE) / (window_height) * 100;

		struct_coucool = new Structure ({
					'position' : position_coucool,
					'size' : size_coucool,
					'contents' : {id:"Coucool", area: size_coucool * first_size /100 }
					})
		first_struct.insert(struct_coucool);
		struct_coucool.getComplementary(root).contents = {id:"Participations", area: (100-size_coucool) * first_size /100 };
		struct_coucool.getComplementary(root).color = pickInArray(["yellow","pink","blue","green"]);
		build_structure_from_contents_with_areas(first_struct.getComplementary(root), contents_without_Coucool_and_participations);
	}
}
