/* Applications overview tooltip
 *
 * Preferences dialog for gnome-shell-extensions-prefs tool
 */
 
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Lang from 'gi://Lang';
import * as ExtensionUtils from 'resource:///org/gnome/Shell/Extensions/js/misc/extensionUtils.js';
const Me = ExtensionUtils.getCurrentExtension();

import { gettext } from 'resource:///org/gnome/Shell/Extensions/js/extensions/extension.js';
const _ = gettext.domain('application-overview-tooltip');

function init() {
	settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.applications-overview-tooltip');
	ExtensionUtils.initTranslations("applications-overview-tooltip");
}

function buildPrefsWidget(){

	// Prepare labels and controls
	let buildable = new Gtk.Builder();
	buildable.add_from_file( Me.dir.get_path() + '/prefs.xml' );
	let box = buildable.get_object('prefs_widget');

	// Bind fields to settings
	settings.bind('hoverdelay', buildable.get_object('field_hoverdelay'), 'value', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('labelshowtime', buildable.get_object('field_labelshowtime'), 'value', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('labelhidetime', buildable.get_object('field_labelhidetime'), 'value', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('appdescription', buildable.get_object('field_appdescription'), 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('groupappcount', buildable.get_object('field_groupappcount'), 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('borders', buildable.get_object('field_borders'), 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('keyboard', buildable.get_object('field_keyboard'), 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('title', buildable.get_object('field_title'), 'active', Gio.SettingsBindFlags.DEFAULT);

	return box;
};
