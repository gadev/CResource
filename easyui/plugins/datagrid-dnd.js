(function($){
	$.extend($.fn.datagrid.defaults, {
		onBeforeDrag: function(row){},	// return false to deny drag
		onStartDrag: function(row){},
		onStopDrag: function(row){},
		onDragEnter: function(targetRow, sourceRow){},	// return false to deny drop
		onDragOver: function(targetRow, sourceRow){},	// return false to deny drop
		onDragLeave: function(targetRow, sourceRow){},
		onBeforeDrop: function(targetRow, sourceRow, point){},
		onDrop: function(targetRow, sourceRow, point){},	// point:'append','top','bottom'
	});
	
	var disabledDroppingRows = [];
	
	$.extend($.fn.datagrid.methods, {
		enableDnd: function(jq, index){
			return jq.each(function(){
				var target = this;
				var state = $.data(this, 'datagrid');
				var dg = $(this);
				var opts = state.options;
				
				var draggableOptions = {
					disabled: false,
					revert: true,
					cursor: 'pointer',
					proxy: function(source) {
						var index = $(source).attr('datagrid-row-index');
						var tr1 = opts.finder.getTr(target, index, 'body', 1);
						var tr2 = opts.finder.getTr(target, index, 'body', 2);
						var p = $('<div style="z-index:9999999999999"></div>').appendTo('body');
						tr2.clone().removeAttr('id').removeClass('droppable').appendTo(p);
						tr1.clone().removeAttr('id').removeClass('droppable').find('td').insertBefore(p.find('td:first'));
						$('<td><span class="tree-dnd-icon tree-dnd-no" style="position:static">&nbsp;</span></td>').insertBefore(p.find('td:first'));
						p.find('td').css('vertical-align','middle');
						p.hide();
						return p;
					},
					deltaX: 15,
					deltaY: 15,
					onBeforeDrag:function(e){
						if (opts.onBeforeDrag.call(target, getRow(this)) == false){return false;}
						if ($(e.target).parent().hasClass('datagrid-cell-check')){return false;}
						if (e.which != 1){return false;}
						opts.finder.getTr(target, $(this).attr('datagrid-row-index')).droppable({accept:'no-accept'});
					},
					onStartDrag: function() {
						$(this).draggable('proxy').css({
							left: -10000,
							top: -10000
						});
						var row = getRow(this);
						opts.onStartDrag.call(target, row);
						state.draggingRow = row;
					},
					onDrag: function(e) {
						var x1=e.pageX,y1=e.pageY,x2=e.data.startX,y2=e.data.startY;
						var d = Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
						if (d>3){	// when drag a little distance, show the proxy object
							$(this).draggable('proxy').show();
							var tr = opts.finder.getTr(target, parseInt($(this).attr('datagrid-row-index')), 'body');
							$.extend(e.data, {
								startX: tr.offset().left,
								startY: tr.offset().top,
								offsetWidth: 0,
								offsetHeight: 0
							});
						}
						this.pageY = e.pageY;
					},
					onStopDrag:function(){
						$.map(disabledDroppingRows, function(row){
							var r = $(row);
							if (r.hasClass('datagrid-row')){
								r.droppable('enable');
							} else if (r.find('tr.datagrid-row:first').length == 0){
								r.droppable('enable');
							}
						});
						disabledDroppingRows = [];
						
						var index = dg.datagrid('getRowIndex', state.draggingRow);
						dg.datagrid('enableDnd', index);
						opts.onStopDrag.call(target, state.draggingRow);
					}
				};
				var droppableOptions = {
					accept: 'tr.datagrid-row',
					onDragEnter: function(e, source){
						if (opts.onDragEnter.call(target, getRow(this), getRow(source)) == false){
							allowDrop(source, false);
							var tr = opts.finder.getTr(target, $(this).attr('datagrid-row-index'));
							tr.find('td').css('border', '');
							tr.droppable('disable');
							$(this).droppable('disable');
							disabledDroppingRows.push(this);
						}
					},
					onDragOver: function(e, source) {
						if ($(this).droppable('options').disabled){
							return;
						}
						if ($.inArray(this, disabledDroppingRows) >= 0){
							return;
						}
						var pageY = source.pageY;
						var top = $(this).offset().top;
						var bottom = top + $(this).outerHeight();
						
						allowDrop(source, true);
						var tr = opts.finder.getTr(target, $(this).attr('datagrid-row-index'));
						tr.children('td').css('border','');
						if (pageY > top + (bottom - top) / 2) {
							tr.children('td').css('border-bottom','1px solid red');
						} else {
							tr.children('td').css('border-top','1px solid red');
						}
						
						if (opts.onDragOver.call(target, getRow(this), getRow(source)) == false){
							allowDrop(source, false);
							tr.find('td').css('border', '');
							tr.droppable('disable');
							$(this).droppable('disable');
							disabledDroppingRows.push(this);
						}
					},
					onDragLeave: function(e, source) {
						if ($(this).droppable('options').disabled){
							return;
						}
						allowDrop(source, false);
						var tr = opts.finder.getTr(target, $(this).attr('datagrid-row-index'));
						tr.children('td').css('border','');
						opts.onDragLeave.call(target, getRow(this), getRow(source));
					},
					onDrop: function(e, source) {
						if ($(this).droppable('options').disabled){
							return;
						}
						
						var tr = opts.finder.getTr(target, $(this).attr('datagrid-row-index'));
						var td = tr.children('td');
						var point =  parseInt(td.css('border-top-width')) ? 'top' : 'bottom';
						td.css('border','');
						var dRow = getRow(this);
						var sRow = getRow(source);
						
						if (opts.onBeforeDrop.call(target, dRow, sRow, point) == false){
							return;
						}
						insert.call(this);
						opts.onDrop.call(target, dRow, sRow, point);
						
						function insert(){
							var sourceIndex = parseInt($(source).attr('datagrid-row-index'));
							var destIndex = parseInt($(this).attr('datagrid-row-index'));
							var sourceTarget = $(source).closest('div.datagrid-view').children('table')[0];
							var target = $(this).closest('div.datagrid-view').children('table')[0];
							
							if ($(this).hasClass('datagrid-view')){
								$(target).datagrid('appendRow', sRow);
								$(target).datagrid('enableDnd');
								$(sourceTarget).datagrid('deleteRow', sourceIndex);
								if ($(sourceTarget).datagrid('getRows').length == 0){
									$(sourceTarget).datagrid('enableDnd');
								}
							} else if (target != sourceTarget){
								var index = point == 'top' ? destIndex : (destIndex+1);
								if (index >= 0){
									$(sourceTarget).datagrid('deleteRow', sourceIndex);
									$(target).datagrid('insertRow',{
										index: index,
										row: sRow
									});
									$(target).datagrid('enableDnd', index);
								}
							} else {
								var dg = $(target);
								var index = point == 'top' ? destIndex : (destIndex+1);
								if (index >= 0){
									if (index < sourceIndex){
										dg.datagrid('deleteRow', sourceIndex).datagrid('insertRow', {
											index: index,
											row: sRow
										});
										dg.datagrid('enableDnd', index);
									} else {
										dg.datagrid('insertRow', {
											index: index,
											row: sRow
										}).datagrid('deleteRow', sourceIndex);
										dg.datagrid('enableDnd', index-1);
									}
								}
							}
						}
					}
				}
				
				if (index != undefined){
					var trs = opts.finder.getTr(this, index);
				} else {
					var trs = opts.finder.getTr(this, 0, 'allbody');
				}
				trs.draggable(draggableOptions);
				trs.droppable(droppableOptions);
				setDroppable(target);
				
				function allowDrop(source, allowed){
					var icon = $(source).draggable('proxy').find('span.tree-dnd-icon');
					icon.removeClass('tree-dnd-yes tree-dnd-no').addClass(allowed ? 'tree-dnd-yes' : 'tree-dnd-no');
				}
				function getRow(tr){
					if (!$(tr).hasClass('datagrid-row')){return null}
					var target = $(tr).closest('div.datagrid-view').children('table')[0];
					var opts = $(target).datagrid('options');
					return opts.finder.getRow(target, $(tr));
				}
				function setDroppable(target){
					var c = $(target).datagrid('getPanel').find('div.datagrid-view');
					c.droppable(droppableOptions);
					if (c.find('tr.datagrid-row:first').length){
						c.droppable('disable');
					} else {
						c.droppable('enable');
					}
				}
			});
		}
		
	});
})(jQuery);
