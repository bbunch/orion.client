/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*eslint-env amd, browser*/
define([
'orion/objects',
'javascript/finder',
'orion/Deferred',
'i18n!javascript/nls/messages'
], function(Objects, Finder, Deferred, Messages) {
	
	var cachedContext;
	var deferred;
	var origin;
	
	/**
	 * @description Creates a new open declaration command
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} ASTManager The backing AST manager
	 * @param {javascript.ScriptResolver} Resolver The backing script resolver 
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @param {javascript.CUProvider} cuProvider
	 * @returns {javascript.commands.OpenDeclarationCommand} A new command
	 * @since 8.0
	 */
	function OpenDeclarationCommand(ASTManager, Resolver, ternWorker, cuProvider) {
		this.astManager = ASTManager;
		this.resolver = Resolver;
		this.ternworker = ternWorker;
		this.cuprovider = cuProvider;
		this.ternworker.addEventListener('message', function(evnt) {
			if(typeof(evnt.data) === 'object') {
				var _d = evnt.data;
				if(_d.request === 'definition') {
					if(_d.declaration && (typeof(_d.declaration.start) === 'number' && typeof(_d.declaration.end) === 'number')) {
						if(origin !== _d.declaration.file) {
							var options = {start: _d.declaration.start,
											end: _d.declaration.end,
											};
							deferred.resolve(cachedContext.openEditor(_d.declaration.file, options));
						} else {
							deferred.resolve(cachedContext.setSelection(_d.declaration.start, _d.declaration.end, true));
						}
					} else {
						deferred.resolve(cachedContext.setStatus(Messages['noDeclFound']));
					}
				}
			}
		});
	}
	
	Objects.mixin(OpenDeclarationCommand.prototype, {
		/* override */
		execute: function(editorContext, options) {
		    var that = this;
		    if(options.contentType.id === 'application/javascript') {
		        return that.astManager.getAST(editorContext).then(function(ast) {
    				return that._findDecl(editorContext, options, ast);
    			});
		    } else {
		        return editorContext.getText().then(function(text) {
		            var offset = options.offset;
		            var blocks = Finder.findScriptBlocks(text);
		            if(blocks && blocks.length > 0) {
		                var cu = that.cuprovider.getCompilationUnit(blocks, {location:options.input, contentType:options.contentType});
    			        if(cu.validOffset(offset)) {
    			            return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
    			               return that._findDecl(editorContext, options, ast); 
    			            });
    			        }
			        }
		        });
		    }
		},
		
		_findDecl: function(editorContext, options, ast) {
			cachedContext = editorContext;
			deferred = new Deferred();
			origin = options.input;
			var files = [{type: 'full', name: options.input, text: ast.source}]; //$NON-NLS-1$
			this.ternworker.postMessage({request:'definition', args:{params:{offset: options.offset}, files: files, meta:{location: options.input}}}); //$NON-NLS-1$
			return deferred;
		}
	});
	
	return {
		OpenDeclarationCommand : OpenDeclarationCommand
	};
});