/* DESCRIPTION: Get x-Height from selected text */ 

/*
	
		+	Adobe InDesign Version: CS6+
		+	Autor: Roland Dreger
		+	Datum: 9. Mai 2015
		
		+	Zuletzt aktualisiert: 22. August 2021
		

		+	License (MIT)

			Copyright 2021 Roland Dreger

			Permission is hereby granted, free of charge, to any person obtaining 
			a copy of this software and associated documentation files (the "Software"), 
			to deal in the Software without restriction, including without limitation 
			the rights to use, copy, modify, merge, publish, distribute, sublicense, 
			and/or sell copies of the Software, and to permit persons to whom the 
			Software is furnished to do so, subject to the following conditions:

			The above copyright notice and this permission notice shall be included 
			in all copies or substantial portions of the Software.

			THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
			OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
			FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
			THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
			LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
			FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
			DEALINGS IN THE SOFTWARE.
		
*/

//@targetengine "getXHeight"

var _global = {};


__defineLocalizeStrings();
__showUI();


function __showUI() {
	
	var _icons = __defineIconsForUI();
	
	var _ui = new Window("palette", localize(_global.uiHeadLabel));
	with (_ui) { 
		alignChildren = ["fill","fill"];
		margins = [15,20,20,15]; 
		spacing = 25;	 
		var _valuesGroup = add("group");
		with(_valuesGroup) {
			margins = [30,0,0,0];
			spacing = 20;
			try {
				var _xHeightIcon = add("image", undefined, _icons.xHeight);
			} catch(_error){
				var _xHeightIcon = add("statictext", undefined, "x"); 
			}
			var _xHeightLabelGroup = add("group");
			with(_xHeightLabelGroup) {
				margins.top = 8;
				spacing = 6;
				var _xHeightLabel = add("statictext");
				with(_xHeightLabel) {
					text = localize(_global.xHeightLabel) + ": ";
				} /* END _xHeightLabel */
				var _xHeightValue = add("statictext");
				with(_xHeightValue) {
					text = "0" + localize(_global.decimalMark) + "000 mm" + "\u2002|\u2002" + "0" + localize(_global.decimalMark) + "00 pt";
					characters = 19;
				} /* END _xHeightValue */ 
				try { 
					var _warningIcon = add("image", undefined, _icons.warning);
					with(_warningIcon) {
						helpTip = "";
						visible = false;
					}
				} catch(_error){
					var _warningIcon = add("statictext"); 
					with(_warningIcon) {
						text = "(" + localize(_global.substituteFontHelpTip) + ")";
						visible = false;
					}	 
				} /* END _warningIcon */
			} /* END _xHeightLabelGroup */
		} /* END _valuesGroup */ 
		var _buttonGroup = add("group");
		with(_buttonGroup) {
			spacing = 10;
			var _cancelButton = add("button", undefined, localize(_global.cancelLabel));
			with(_cancelButton) {
				alignment = ["left","bottom"];
				helpTip = localize(_global.closeWindowHelpTip);
			} /* END _cancelButton */
			var _copyButton = add("button", undefined, localize(_global.copyLabel));
			with(_copyButton) {
				alignment = ["right","bottom"];
				helpTip = localize(_global.copyXHeightHelpTip);
			} /* END _copyButton */
			var _measureButton = add ("button", undefined, localize(_global.measureLabel), { name:"OK" });
			with(_measureButton) {
				alignment = ["right","bottom"];
			} /* END _copyButton */
		} /* END _buttonGroup */
	} /* END palette _ui */
 
 
	/* Callbacks */
	_measureButton.onClick = function() {
		__measureXHeight(_ui, _xHeightValue, _warningIcon);
	};
	
	_copyButton.onClick = function() {
		__copyXHeightValue(_xHeightValue);
	};

	_cancelButton.onClick = function() {
		_ui.close(2);
	};
	
	_ui.onClose = function() {
		_global = null;
	};
	/* END Callbacks */


	_ui.show();
	
	return true;
} /* END function __showUI */



/* ++++++++++++++++++++ */
/* + Measure x-height + */
/* ++++++++++++++++++++ */
function __measureXHeight(_ui, _xHeightValue, _warningIcon) {
	
	if(!_global) { return false; }
	if(!_ui || !(_ui instanceof Window)) { return false; }
	if(!_xHeightValue || !(_xHeightValue instanceof StaticText)) { return false; }
	if(!_warningIcon || !(_warningIcon instanceof Image)) { return false; }

	var _doc;
	var _selection;
	var _targetIP;
	var _targetFont;
	var _targetFontName;
	var _targetPointSize;
	var _xHeight = 0;
	var _xHeigthMM;
	var _xHeigthPT;
	var _argArray = [];

	if(app.documents.length === 0 || app.layoutWindows.length === 0) {
		return false; 
	}

	_doc = app.documents.firstItem();
	if(!_doc.isValid) {
		return false;
	}
	
	_selection = app.properties.selection && app.selection[0];
	if(!_selection || app.selection.length !== 1 || !app.selection[0].hasOwnProperty("insertionPoints")) {
		alert(localize(_global.noInsertionPointAlert)); 
		return false;
	}
	
	if(_selection.insertionPoints.length > 1) {
		_targetIP = _selection.insertionPoints[1];
	} else {
		_targetIP = _selection.insertionPoints[0];
	}
	
	_warningIcon.visible = false;
	_warningIcon.helpTip = "";

	if(!_targetIP || !_targetIP.isValid) {
		__displayErrorLabel(_ui, _xHeightValue);
		return false;
	}

	_targetFont = _targetIP.properties.appliedFont;
	_targetFontName = _targetFont.name;
	_targetPointSize = _targetIP.properties.pointSize;

	/* Check: Font installed? */
	if(!__isFontInstalled(_targetFont)) { 
		_warningIcon.visible = true;
		_warningIcon.helpTip = localize(_global.substituteFontHelpTip);
	} 
	
	/* Check: Textframe vertical scaled? */
	if(!__isUnscaled(_targetIP, "verticalScale") || !__isUnscaled(_targetIP, "absoluteVerticalScale")) {
		_warningIcon.visible = true;
		if(_warningIcon.helpTip != "") { 
			_warningIcon.helpTip += " + "; 
		}
		_warningIcon.helpTip += localize(_global.scaledTextframeHelpTip);
	} 

	/* Execute measurement */
	_argArray = [_doc.toSpecifier(), _targetIP.toSpecifier()];
	_xHeight = app.doScript(__measureFont, ScriptLanguage.JAVASCRIPT, _argArray, UndoModes.ENTIRE_SCRIPT, localize(_global.measureGoBackLabel));
	if(!_xHeight || _xHeight.constructor !== Number) {
		__displayErrorLabel(_ui, _xHeightValue);
		_xHeight = 0;
	}

	/* Avoid text wrapping changes */
	if(_doc.undoName === localize(_global.measureGoBackLabel)) {
		_doc.undo();
	}
	
	/* Fill script labels */
	_ui.text = _targetFontName.replace("\\t", " | ", "g");
	_ui.text += " | " + (Math.round(_targetPointSize * 100) / 100) + " pt";
	
	_xHeigthPT = (Math.round(_xHeight * 100) / 100) + " pt";

	_xHeigthMM = UnitValue(_xHeight, MeasurementUnits.POINTS).as(MeasurementUnits.MILLIMETERS);
	_xHeigthMM = (Math.round(_xHeigthMM * 1000) / 1000) + " mm";
	
	_xHeightValue.text = _xHeigthMM + "\u2003|\u2003" + _xHeigthPT;
	
	if($.locale == "de_DE") {
		_ui.text = _ui.text.replace("\\.", ",", "g");
		_xHeightValue.text = _xHeightValue.text.replace("\\.", ",", "g");
	}

	return true;
} /* END function __measureXHeight */


function __measureFont(_argArray) {

	if(!_argArray || !(_argArray instanceof Array) || _argArray.length !== 2) { 
		return false; 
	}

	var _userEnableRedraw;
	var _doc;
	var _targetIP;
	var _parentStory;
	var _xChar;
	var _xPath;
	var _anchorPointTopLeft;
	var _anchorPointBottomLeft;
	var _xHeight;

	_userEnableRedraw = app.scriptPreferences.enableRedraw;
	app.scriptPreferences.enableRedraw = false; /* Ansicht nicht aktualisieren */

	try {

		_doc = resolve(_argArray[0]);
		_targetIP = resolve(_argArray[1]);

		if(!_doc || !(_doc instanceof Document) || !_doc.isValid) {
			throw new Error("Error: " + localize(_global.objectInvalidErrorMessage, "Document"));
		}
		if(!_targetIP || !(_targetIP instanceof InsertionPoint) || !_targetIP.isValid) {
			throw new Error("Error: " + localize(_global.objectInvalidErrorMessage, "Insertion Point"));
		}

		/* Check: Insertion point in text overflow? */
		if(!_targetIP.properties.baseline) {
			throw new Error("Error: " + localize(localize(_global.oversetErrorMessage)));
		}

		/* Switch: Parent is cell or footnote? */
		if(_targetIP.parent instanceof Footnote || _targetIP.parent instanceof Cell) {
			_parentStory = _targetIP.parent;
		} else {
			_parentStory = _targetIP.parentStory;
		}
		if(!_parentStory || !_parentStory.isValid) {
			throw new Error("Error: " + localize(localize(_global.invalidStoryErrorMessage)));
		}

		/* Insert character x for measurement */
		_targetIP.contents = "x";
		_xChar = _parentStory.characters.item(_targetIP.index);
		if(!_xChar.isValid || _xChar.contents !== "x") {
			throw new Error("Error: " + localize(_global.referenceCharacterErrorMessage));
		}
		
		/* Convert x character to Outlines */
		_xPath = _xChar.createOutlines()[0];
		
		_anchorPointTopLeft = _xPath.resolve(AnchorPoint.topLeftAnchor, CoordinateSpaces.parentCoordinates)[0];
		_anchorPointBottomLeft = _xPath.resolve(AnchorPoint.bottomLeftAnchor, CoordinateSpaces.parentCoordinates)[0];
		
		/* Calculate x-height */
		_xHeight = Math.abs(_anchorPointBottomLeft[1] - _anchorPointTopLeft[1]);
		
	} catch(_error) {
		alert(_error.message);
		return false;
	} finally {
		if(_xPath && _xPath.hasOwnProperty("remove") && _xPath.isValid) {
			_xPath.remove();
		} 
		else if(_xChar && _xChar.hasOwnProperty("remove") && _xChar.isValid) {
			_xChar.remove();
		}
		app.scriptPreferences.enableRedraw = _userEnableRedraw;
	}
	
	return _xHeight;
} /* END function __measureFont */



/* +++++++++++++++++++++++ */
/* + Copy x-height value + */
/* +++++++++++++++++++++++ */
function __copyXHeightValue(_xHeightStatictext) {
	
	if(!_xHeightStatictext || !(_xHeightStatictext instanceof StaticText)) { return false; }

	var _xHeightValue = _xHeightStatictext.text.replace("(mm).+$","$1","i");

	app.doScript(
		__pushValueToClipboard, 
		ScriptLanguage.JAVASCRIPT, 
		[_xHeightValue], 
		UndoModes.ENTIRE_SCRIPT, 
		localize(_global.copyGoBackLabel)
	);

	return true;
} /* END function __copyXHeightValue */

function __pushValueToClipboard(_argArray) {

	if(!_argArray || !(_argArray instanceof Array) || _argArray.length !== 1) { return false; }

	var _doc;
	var _tempTextFrame;
	var _tempStory;
	var _texts;
	var _xHeightValue;

	if(app.documents.length === 0 || app.layoutWindows.length === 0) {
		return false; 
	}

	_doc = app.documents.firstItem();
	if(!_doc.isValid) {
		return false;
	}

	_tempTextFrame = __createTextFrame(_doc);
	if(!_tempTextFrame) { 
		return false; 
	}

	_xHeightValue = _argArray[0];
	
	try {
		_tempStory = _tempTextFrame.parentStory;
		_tempStory.insertionPoints[0].alignToBaseline = false;
		_tempStory.insertionPoints[0].contents = _xHeightValue;
		_texts = _tempStory.texts.everyItem();
		_doc.select(_texts);
		app.copy();
	} catch(_error) {
		alert(_error.message);
		return false;
	} finally {
		if(_tempTextFrame && _tempTextFrame.hasOwnProperty("remove") && _tempTextFrame.isValid) {
			_tempTextFrame.remove();
		}
	}

	return true;
} /* END function __pushValueToClipboard */


function __displayErrorLabel(_ui, _xHeightValue) {
	
	if(!_global) { return false; }
	if(!_ui || !(_ui instanceof Window)) { return false; }
	if(!_xHeightValue || !(_xHeightValue instanceof StaticText)) { return false; }
	
	_ui.text = localize(_global.fontNotEvaluableAlert);
	_xHeightValue.text = "0" + localize(_global.decimalMark) + "000 mm" + "\u2002|\u2002" + "0" + localize(_global.decimalMark) + "00 pt";

	return true;
} /* END function __displayErrorLabel */
		

function __createTextFrame(_doc) {
	
	if(!_doc || !(_doc instanceof Document) || !_doc.isValid) { return false; }
	
	var _unlockedLayer;
	var _tempTextFrame;
	
	_unlockedLayer = __searchUnlockedLayer();
	if(!_unlockedLayer) {
		return false;
	}

	_tempTextFrame = _doc.textFrames.add(_unlockedLayer, { nonprinting:true }); 
	_tempTextFrame.baselineFrameGridOptions.properties = {
		useCustomBaselineFrameGrid: false 
	};
	_tempTextFrame.textFramePreferences.properties = { 
		ignoreWrap:true,
		firstBaselineOffset:FirstBaseline.X_HEIGHT,
		insetSpacing:[0,0,0,0],
		autoSizingType:AutoSizingTypeEnum.OFF,
		minimumFirstBaselineOffset:0,
		verticalJustification:VerticalJustification.TOP_ALIGN
	};
	
	return _tempTextFrame;
} /* END function __createTextFrame */


function __searchUnlockedLayer() {
	
	var _doc;
	var _layerArray;
	var _layer;
	
	var i;
	
	_doc = app.documents.firstItem();
	if(!_doc.isValid) {
		return false;
	}

	_layerArray = _doc.layers.everyItem().getElements();

	for(i=0; i<_layerArray.length; i+=1) { 
		if(_layerArray[i].locked === false){
			 return _layerArray[i];
		} 
	}

	_layer = _layerArray[0];
	_layer.locked = false;
	
	return _layer;
} /* END function __searchUnlockedLayer */


function __containsMissingGlyph(_font, _frame) {
	
	if(!_font || (!(_font instanceof Font) && _font.constructor !== String)) { return true; }
	if(!_frame || !_frame.hasOwnProperty("findGlyph") || !_frame.isValid) { return true; }

	var _results = [];
	
	app.findGlyphPreferences = NothingEnum.nothing;

	try {
		app.findGlyphPreferences.appliedFont = _font;
		app.findGlyphPreferences.glyphID = 0;
		_results = _frame.findGlyph();
	} catch(_error) {
		return true;
	} finally {
		app.findGlyphPreferences = NothingEnum.nothing;
	}

	if(_results.length === 0) {
		return false;
	} 
		
	return true;
} /* END function __containsMissingGlyph */


function __isFontInstalled(_font) {
	
	if(!_font || (!(_font instanceof Font) && _font.constructor !== String)) { return false; }

	const _statusValue = FontStatus.INSTALLED;

	var _doc;
	var _fontArray;
	var _curFont;

	var i;
	

	_doc = app.documents.firstItem();
	if(!_doc.isValid) {
		return false;
	}

	_fontArray = _doc.fonts.everyItem().getElements();
	
	for(i=0; i<_fontArray.length; i+=1) {
		
		_curFont = _fontArray[i];
		if(!_curFont || !_curFont.isValid) {
			continue;
		}
		
		if(_curFont.name === _font.name) {
			if(_curFont.status === _statusValue) {
				return true;
			}
		}
	}

	return false;
} /* END function __isFontInstalled */


function __isUnscaled(_targetIP, _prop) {
	
	if(!_targetIP || !(_targetIP instanceof InsertionPoint) || !_targetIP.isValid) { return false; }
	if(!_prop || _prop.constructor !== String) { return false; }

	var _parentTextFrame = _targetIP.parentTextFrames[0];
	if(!_parentTextFrame || !_parentTextFrame.hasOwnProperty(_prop) || !_parentTextFrame.isValid) {
		return false;
	}
			
	if(_parentTextFrame[_prop] !== 100) {
		return false;
	}	 
	 
	return true;
} /* END function __isUnscaled */



/* Icons fuer User Interface */
function __defineIconsForUI() {
	return { 
		warning: "\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\r\x00\x00\x00\f\b\x06\x00\x00\x00\u00B9\u00B77\u00D9\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x00wIDATx\u00DAb|\u00B3_\u009A\x01\x0B(\x06\u00E2\u00FF@\u00DC\u0087M\u0092\x05\u008B\u0098=\x10\u00F7@\u00D9\u00E7\u0080\u00F8\x00\u00BA\x02&,\u009A\x1A\u0090\u00D8\u00F5\u00D8lb\u00C2b\u008B\x03\x12\u00DF\x01\u008D\u008FU\x13\u00DC\x16\x11\u00C7\u00A78mc\u00C2c\x0BN\u00DB\u0098p\u00F8\x05\x1D\u00D4c\u00D3\u0084\u00CB\x16\u00AC\u00B61\u00E1\u00B2\x05K\u00FC\u00D5#k\u00C2j\x0BR@`\u00D8\u00C6\u0084\u00CB/8RJ=L\x13\x0B\x03\u00F1\u0080\x15D\x00\x04\x18\x00\u00FA\u00CB\x1599\x03W\u00CF\x00\x00\x00\x00IEND\u00AEB`\u0082",
		xHeight: "\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00Z\x00\x00\x00$\b\x06\x00\x00\x00\t\u0080-\u00B3\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03\u00CEIDATx\u00DA\u00ECZQr\u00DA0\x105\u0099\x1C\u00C0\u00B9\u0081{\u0082\u00D2\x13\u0094L\u00FB\x1Fs\u0082\u0098\x13\u0080\u00BF\x1A\u00BEL\u00BEH\u00BF\u00A0'\b9\x01\u00FC\u00B7\u0099\u00D0\x13\u00E0\x1B\u00E0\x1B\u00D47\u00A0+F\u00EA\bE\u00D6\u00AE$c\u00E8\u00E0\u009D\u00D1\u00C0`[\u0092\u009F\u009Ev\u00DF\u00AE\u00E8\u00ECv\u00BB\u00C0\u00C7\u00C6\u00E31\u00E5\u00B6\x10Z\x04-\x0F\u00CE\u00CC\u00A6\u00D3i#\u00E3\\50F\x17\u00DA\x16\u00DA\x06Z\x16\\\u00A8]\u00D7\u00DC_\u00C4\u009B\x00\u00F8#\u00B4D\u00BA\u00CE\u00BE?\u00B6@\u00FB\u00DB\u009B\x04t\u00D5B\u00C4\u00D0V\u0097\x06t\u00DD\u00AE\u00A3 \u00DCsw\u0089\u008C\u00BE:\u00C1\u00981\x0F\u008E-\u00D0\u008E\u00C6\u00C0\u00EB\x11\u00EF\u008B[\u00A0\u00FD\u0098J\u00B5\u00FB\x16hw\x1BZ\u00DC\u00DBC\u0082f\x0B\u00B4A+w\u0095\u00DF\x165.L\x0Bt\x05h\f\u00E4\x01\u00B4uM\u00AE\u00E6\u00BF\u00B7N\u00F0\u00F4\u00D3\u00AB\u0083\u0087\u00F25\u00E4\u0099\u009F\u00AC$><\u0085_\n\u00B8\u00D6\u00E3\u00DA\u00BA\u00CA\u00FAp\u00DF\u00EAR\u0080\u00DE\x05\u00AD5\u0092\x19v<\x19\u00BDQ\u00FC\u00F3'`i.]\x1F\u00C1\u00C7\u00CC\u00D0\u00C5\u009E\u00FD\u0096cn\x1D\u0083\u00E9\x02\u00C6\x1A\u00C0\u00F3\x11\u00DF\u0085d\u0083\u00E7\u00A88\u00EDt\u0098v|\u00AAw\u00E3\u00F1\u0098\x01\u00BC\u0091~b>\u00F9V\u00A3\u009B\u00FF\x18\u00BA\u0099\x04\u00F6\u00F5\u008F\u008D&\u00F8\u0092\u0080\u00E6\u00B1\u00C3\x16\u00E8r:\u009D\u00DE\u00A0\u00EE\u00E1\u00FB\u00AF\u00DD\x01\u00B6\u00DF\u00BE\u00D6\x16\f\u00D5 \u00F8\u00A2\u009B$\u00A2@\x12\u0087q\u00FB|\u0081&H\u00C0\x15\u00C6\u00E2@\u00CA\u009B(\x15\u0088>\u00CA\u008Agr\u00DE\u00B7\u008E<\x18\u00C8\u0082\u00D9\u00FE\u008C\x066\u00ABA\u0090M\u00F8\u00C6\u00A0\u009BMAq@\u0090\u0083&[\"*\u00C6\u00B4k\u00D4\u00DD\u00C1\u00DE\u00A3\x0F\f^\u00DBL\x00\u0080~\u00E7:\u00EAbt\u00A2(\r\x13P\u00EB\u00C0\\p\u00F2\u00CD\x14\x07\x06f2\x1BU\u00D4W\x12\r\u00C8\u00B7\u00B6 \x1F[GS\u00DC\x065\u0081\u00F1\u00CD\x14K\u00EE\nL\u00F5\u0095g\u00E5\u00B7H\x13\u00A4\x19\u0093\u009DN\u0081\x18{\x05\u0083\u00E5\u00EF^@\u0083\u00DBP\u0081)\x02\u00FC\u0098\u00EA\u00C5r\u00E1l\u008D\u00B1p\u008E$H\u0089\x04\u00FCRayz\f&\u00FB2z\u00A8a\x14f\u00A1\u00A5+r\u00B1\x14Yp\u00C6\u00E0\u008C\u0083,\u00BB\u008C\x05\u0080<?\u00B6\u008E\u00B6es\u00A4\t<\u00E2\\\u00B00\u00B8\x06\u00CAB\u00C4\u009EAQ\u00F8\u00EB\u008Da\u008C\u0089F]\u00A4M$,\u00BEl\u0096}^\u00E49\u009Fa\r@\x0B\u00E0f\u00C4\u00FB\x1F\u0081\u00CD\u00E5\u00B1\u0081\u00BE\u00B2ds\u00E8\u00A8{\u00A9\u00D6%\u00B2\x1F\u00B39Q_S\u00DD^\u00E3\u008C\u00D6\x1DC\x15\x04\u00F9&\u00B3\x1E;\u00CA\u00BA\u00B7\x00\u00C9\u00C8T\u00E2\u00A2\rk\x1A\u00AFV\u00A03M\u00A4\u00BF\u00B5\u00EC\u00E3\x05I^\x12\x0ER\u00E1\u00F9nT7\x16\u00C3N\u008D\u00C1}\u00AC\u00CE\u00C2uh$]\x10\u00B8\u00FDGcM\u0090\u0082\u00BE\tLh\u00E1\u00A3\u0099=\u00F3 \x7F\x16>Zes\u00EE\u00A1;\x7F \u00D7G\u009ERO\u00D5\u00C8+${\x14\u00BA\u00FA\u00B4@s6\u00F7,\u00C1\u00C2\u008A<\x18#]\u0083n\u00A6\u00CC5\u0097j)\x03S \u0086\u00F7\u009C\u009D\u009A\u00D1\u0099\x03XX\u00A4\u00C7d\u009CK\u00A6\x18+:\u00B9T\u0098\u00BCB\u00B2\u00C7\x11\u0080\u009D\u009C\x04\u00E8\n6\u00AFk\u00D0\u009E\u00BF\t\u00C1\u00CC\u00E6\u00A5\u00BB\u009Az\u00C6\u00A3&\x1E`\u0081v\u00C6\u00EB\u00EC\u00CD\x01\u00CDu\u00F3\u00CC!\u009D\u00A6\x18EU\u00CC\u0088cu\u00B9\u0092\t\u0095\u00FE\u00E7\x15\u00BB)E\u00DC\u00D6[\u00DD`k\u00EB\u00D1|\u0090\u0088\u00BB\u008C\u00AA\x01\x17\u00C1a\u00A1\u00A8 \u0080'g\u008F\x19Q\u00E7\u00E6\u009C\u0085%\u00FF^J\u00FD0P\u00EE*\u0098_p\u00B7\u00A1\u00CEK\u00BC\x1B%\u00F8M\u00C4\u00CE\u00C3\x02\u00BF\u00A6\u00F0\u00CF*x\u009DJ\u00A0\x01\u00E4LS\x0F\u00A0\u00FA\u00DD\x1B\u0084)[\u00CF\u00DD |\u00EE\u00D2q^\u00B1\u0087\u00BA\u0098\x03\u00D8\u00A9\x01\u00E8=\u00B6\x07$\u0096J\u00A5\u00D7\u00D2\u00C9\u00C0\u00DE\x1E\u00DCS\u00E0\u00FD\u00BF\u00FA\u00AB\x0EZ\x1F\u00CA\u00D7n\r.'t\b\u0092\u00FF\u00E6\x05s\u00F8\u00EC1v\fXa\u00C5\u00A7N \u009D\u00B0\u00C8\u00D8\u00B6\x7F7h\u00C8\u00FE\n0\x00\u00B5\u00BF+\u00FB\u00B5\u00AD\f\x05\x00\x00\x00\x00IEND\u00AEB`\u0082"
	};
} /* END function __defineIconsForUI */



/* Deutsch-Englische Dialogtexte und Fehlermeldungen */
function __defineLocalizeStrings() {
	
	_global.uiHeadLabel = {
		en:"Get x-Height (v 3.0)",
		de:"Get X-Height (v 3.0)"
	};
	
	_global.measureGoBackLabel = { 
		en:"Measure x-height",
		de:"x-Höhe messen" 
	};
	
	_global.copyGoBackLabel = { 
		en:"Copy x-height",
		de:"x-Höhe kopieren" 
	};
	
	_global.measureLabel = {
		en:"Measure",
		de:"Messen"
	};
	
	_global.cancelLabel = {
		en:"Close",
		de:"Schlie\u00dfen"
	};
	
	_global.copyLabel= {
		en:"Copy",
		de:"Kopieren"
	};
	
	_global.closeWindowHelpTip = {
		en:"Close Window",
		de:"Fenster schlie\u00dfen"
	};
	
	_global.noInsertionPointAlert = {
		en:"Please select some text!",
		de:"Bitte eine Textstelle ausw\u00e4hlen!"
	};
	
	_global.fontNotEvaluableAlert = {
		en:"Font not evaluable!",
		de:"Schrift nicht auswertbar!"
	};
	
	_global.measureXHeightUndoLabel = {
		en:"Measure x-height",
		de:"x-H\u00f6he berechen"
	};
	
	_global.copyXHeightValueUndoLabel = {
		en:"Copy x-height value to clipboard",
		de:"x-H\u00f6he in Zwischenablage kopieren"
	};

	_global.copyXHeightHelpTip = {
		en:"Copy x-height value to clipboard",
		de:"Wert f\u00FCr x-H\u00f6he in Zwischenablage kopieren"
	};
	
	_global.xHeightLabel = {
		en:"x-Height",
		de:"x-H\u00f6he"
	};
	
	_global.decimalMark =	{
		en:".",
		de:","
	};

	_global.substituteFontHelpTip = {
		en:"Substitute Font!",
		de:"Ersetzte Schriftart!"
	};
	
	_global.scaledTextframeHelpTip = {
		en:"Scaled Text Frame!",
		de:"Skalierter Textrahmen!"
	};

	_global.referenceCharacterErrorMessage = {
		en:"Reference characters could not be inserted correctly.",
		de:"Referenzzeichen konnten nicht korrekt eingefügt werden."
	};

	_global.oversetErrorMessage = {
		en:"Measurement point in overset.",
		de:"Messpunkt im Übersatz."
	};

	_global.invalidStoryErrorMessage = {
		en:"Story not valid.",
		de:"Textabschnitt nicht (mehr) valide."
	};

	_global.objectInvalidErrorMessage = {
		en:"%1 not valid.",
		de:"%1 nicht (mehr) valide."
	};

} /* END function __defineLocalizeStrings */