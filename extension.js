const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;
const Gio = imports.gi.Gio
const Pango = imports.gi.Pango;
const extension = imports.misc.extensionUtils.getCurrentExtension();
const Utils = extension.imports.utils;


// options
let LABELSHOWTIME	= 15/100;
let LABELHIDETIME 	= 10/100;
let HOVERDELAY		= 300;
let ALWAYSSHOW		= true;
let APPDESCRIPTION	= true;

// private variables
let _old_addItem = null;		// used to restore monkey patched function on disable
let _tooltips = null;			// used to disconnect events on disable
let _labelTimeoutId = 0;		// id of timer waiting for start
let _resetHoverTimeoutId = 0;	// id of last (cancellable) timer
let _label = null;				// actor for displaying the tooltip (or null)
let _labelShowing = false;		// self explainatory

let _settings;					// will store settings from the schema


function init() {
	// Read settings and apply them now
	_settings = Utils.getSettings();
	_applySettings();
}


function enable() {

	_tooltips = new Array();

	// Enabling tooltips for already loaded icons
	let appIcons = Main.overview.viewSelector.appDisplay._views[1].view._items;
	for (let i in appIcons) {
		_connect(appIcons[i].actor);
	}

	// monkeypatching for future icons (includes search results app icons)
	_old_addItem = imports.ui.iconGrid.IconGrid.prototype.addItem;
	imports.ui.iconGrid.IconGrid.prototype.addItem = function(item, index){
		_connect(item.actor);
		// original part of the function I'm overwriting
		_old_addItem.apply(this, arguments);
	};

}


function disable() {

	//restore the original addItem function
	imports.ui.iconGrid.IconGrid.prototype.addItem = _old_addItem;

	// disconnects from all loaded icons
	for (let i = 0; i < _tooltips.length; i++) {
		_tooltips[i].actor.disconnect(_tooltips[i].connection);
	}
	_tooltips=null;

}


function _applySettings() {

	LABELSHOWTIME = _settings.get_int("labelshowtime")/100 ;
	LABELHIDETIME = _settings.get_int("labelhidetime")/100 ;
	HOVERDELAY = _settings.get_int("hoverdelay") ;
	ALWAYSSHOW = _settings.get_boolean("alwaysshow") ;
	APPDESCRIPTION = _settings.get_boolean("appdescription") ;

}


function _onHover(actor){

	// checks if cursor is over the icon
	if (actor.get_hover()) {
	
		// it is : let's setup a toolip display
		// unless it's already set
		if (_labelTimeoutId == 0) {

			// if the tooltip is already show (on another icon)
			// we simply update it
			let timeout = _labelShowing ? 0 : HOVERDELAY;
			_labelTimeoutId = Mainloop.timeout_add(timeout, function() {
					_labelShowing = true;
					_showTooltip(actor);
					return false;
				} );

			// do not hide tooltip while cursor is on icon
			if (_resetHoverTimeoutId > 0) {
				Mainloop.source_remove(_resetHoverTimeoutId);
				_resetHoverTimeoutId = 0;
			}
		}

	} else {
	
		// cursor is no more on an icon

		// unset label display timer if needed
		if (_labelTimeoutId > 0){
			Mainloop.source_remove(_labelTimeoutId);
			_labelTimeoutId = 0;
		}

		// hide the tooltip now (if visible)
		_hideTooltip();

		// but give a chance to skip hover delay if the cursor hovers another icon within 1sec
		if (_labelShowing) {
			_resetHoverTimeoutId = Mainloop.timeout_add(1000,  function() {
					_labelShowing = false;
					return false;
				} );
		}

	}

}


function _showTooltip(actor) {

	let icontext = '';
	let should_display = false;

	if (actor._delegate.app){
		//applications overview
		icontext = actor._delegate.app.get_name();

		if (APPDESCRIPTION) {
			let appDescription = actor._delegate.app.get_description();
			if (appDescription){
				icontext = icontext.concat(" :\n",appDescription);
			}
		}

	} else if (actor._delegate.hasOwnProperty('_folder')){
		// folder in the application overview
		icontext = 'Group: '.concat(actor._delegate['name']);

	} else {
		//app and settings searchs results
		icontext = actor._delegate.metaInfo['name'];

	}

	// If there's something to show ..
	if ( icontext && ( ALWAYSSHOW || actor._delegate.icon.label.get_clutter_text().get_layout().is_ellipsized() ) ){

		// Create a new tooltip if needed
		if (!_label) {
			_label = new St.Label({ style_class: 'app-tooltip', text: icontext });
			Main.uiGroup.add_actor(_label);
		} else {
			_label.text = icontext;
		}

		_label.clutter_text.line_wrap = true;
		_label.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
		_label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

		[stageX, stageY] = actor.get_transformed_position();
		[iconWidth, iconHeight] = actor.get_transformed_size();
		let y = stageY + iconHeight + 5;
		let x = stageX - Math.round((_label.get_width() - iconWidth)/2);

		// setup animation
		// TODO : animate tooltip moving from one icon to another ?
		_label.opacity = 0;
		_label.set_position(x, y);
		Tweener.addTween(_label,{
			opacity: 255,
			time: LABELSHOWTIME,
			transition: 'easeOutQuad',
		});

	}

}


function _hideTooltip() {

	if (_label){
		Tweener.addTween(_label, {
			opacity: 0,
			time: LABELHIDETIME,
			transition: 'easeOutQuad',
			onComplete: function() {
				Main.uiGroup.remove_actor(_label);
				_label = null;
			}
		});
	}

}


function _connect(actr){

	let con = actr.connect('notify::hover', _onHover);
	_tooltips.push({actor: actr, connection: con});

}
