/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, browser, mocha*/
/*globals Tautologistics */
define([
'chai/chai',
'mocha/mocha', //global export, stays last
'htmlparser/htmlparser'  //stays last, exports into global scope
], function(chai) {
    /* eslint-disable no-console */
    var assert = chai.assert;
	
	function assertResults(results, expected) {
		assert(results, 'the parser did not return an AST');
		var str = JSON.stringify(results);
		assert(str, 'Failed to stringify the results');
		assert.equal(expected, str, 'The produced AST does not match the expected results');
	}
	
	function parse(text) {
	    var domResult;
		var handler = new Tautologistics.NodeHtmlParser.HtmlBuilder(function(error, dom) {
			if (!error) {
				//parsing done
				domResult = dom;
			}
		}, {ignoreWhitespace: true, includeLocation: true, verbose: false});
		var parser = new Tautologistics.NodeHtmlParser.Parser(handler);
		parser.parseComplete(text);
		domResult.source = text;
		var val = JSON.stringify(domResult);
		console.log(val);
		return domResult;
	}
	
	describe("HTML parser tests", function() {

		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !doctype 1", function() {
			var results = parse('<!doctype html></html>');
		    assertResults(results, 
		    	'[{"type":"doctype","range":[9,14],"data":" html","location":{"line":1,"col":1}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !doctype public... 2", function() {
			var results = parse('<!doctype PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"></html>');
		    assertResults(results, 
		    	'[{"type":"doctype","range":[9,84],"data":" PUBLIC \\"-//W3C//DTD HTML 4.01//EN\\" \\"http://www.w3.org/TR/html4/strict.dtd\\"","location":{"line":1,"col":1}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !doCtypE public... 3", function() {
			var results = parse('<!doCtypE PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"></html>');
		    assertResults(results, 
		    	'[{"type":"doctype","range":[9,84],"data":" PUBLIC \\"-//W3C//DTD HTML 4.01//EN\\" \\"http://www.w3.org/TR/html4/strict.dtd\\"","location":{"line":1,"col":1}}]');
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !Doctype 4", function() {
			var results = parse('<!Doctype html></html>');
		    assertResults(results, 
		    	'[{"type":"doctype","range":[9,14],"data":" html","location":{"line":1,"col":1}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !DOCTYPE 5", function() {
			var results = parse('<!DOCTYPE html></html>');
		    assertResults(results, 
		    	'[{"type":"doctype","range":[9,14],"data":" html","location":{"line":1,"col":1}}]'
		    );
		});
	});
	
	describe("HTML Recoverable Parsing Tests", function() {
		//TODO
	});
});