<link rel="stylesheet" type="text/css" href="<?=$dir;?>easyui/themes/ga/easyui.css">
<link rel="stylesheet" type="text/css" href="<?=$dir;?>easyui/themes/icon.css">
<link rel="stylesheet" type="text/css" href="<?=$dir;?>easyui/demo/demo.css">
<script type="text/javascript" src="<?=$dir;?>easyui/jquery.easyui.min.js"></script>
<script type="text/javascript" src="<?=$dir;?>easyui/plugins/jquery.edatagrid.js"></script>
<script type="text/javascript" src="<?=$dir;?>easyui/plugins/datagrid-filter.js"></script>
<script type="text/javascript">
    (function($){
        $.extend($.fn.datebox.defaults,{
            formatter:function(date){
                var y = date.getFullYear();
                var m = date.getMonth()+1;
                var d = date.getDate();
                return y + '-' + (m<10?('0'+m):m) + '-' + (d<10?('0'+d):d);
            },
            parser:function(s){
                if (!s) return new Date();
                var ss = s.split('-');
                var d = parseInt(ss[2],10);
                var m = parseInt(ss[1],10);
                var y = parseInt(ss[0],10);
                if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
                    return new Date(y,m-1,d);
                } else {
                    return new Date();
                }
            }
        });

        $.extend($.fn.pagination.defaults,{
            pageList:[10,20,30,50,100,200,500,1000]
        });
    })(jQuery);
</script>
<style>
    .datagrid-cell
    {
        color:#000;
    }
</style>
<div id="tt" class="easyui-tabs" style="height:auto;">
    <div title="Документы" style="padding:10px" data-options="closable:false" >
        <table class="easyui-datagrid" 
              id="dataGrid" 
              title="Полный список"
              data-options="idField:'<?=$idField;?>',
              toolbar:'#tbar',
              singleSelect:true,
              pagination:true,
              pageSize:<?=$display;?>,
              pageList:[10,20,30,50,100,200,500,1000]
         ">
            <thead>
            <tr>
                <?=$header;?>
            </tr>
            </thead>
        </table>
    </div>

</div>

<div id="tbar" style="padding:5px;height:auto">
    <div style="margin-bottom:5px">
        <a href="#" class="easyui-linkbutton l-btn" onclick="addBtn()" iconCls="icon-add" > Добавить</a>
        <a href="#" class="easyui-linkbutton l-btn" onclick="editBtn()" iconCls="icon-edit" > Редактировать</a>
        <span style="margin-left:20px">&nbsp;</span>
        <a href="#" class="easyui-linkbutton"  iconCls="icon-remove" onclick="javascript:<?=$jqname;?>('#dataGrid').edatagrid('destroyRow')"> Удалить</a> 
        <!--
		<a href="#" class="easyui-linkbutton" iconCls="icon-save" plain="true" onclick="updatePos()">Сохранить порядок</a>-->
        <span style="margin-left:20px">&nbsp;</span>
        <input class="textsearch" name="search" id="search" style="width:180px">
        <a href="#" class="easyui-linkbutton l-btn" onclick="findBtn()" iconCls="icon-search">Найти</a>
    </div>
</div>

<script type="text/javascript">
    var index = 0;
    function addPanel(id){
        index++;
        var url = window.location.href.replace(/#[^#]*$/, "");
        if(id>0){
            title = '<?=$docEditName;?>' + id;
            url = '<?=$docEditURL;?>' + id;
        }else{
            title = '<?=$docNewName;?>';
            url = '<?=$docNewURL;?>';
        }
        <?=$jqname;?>('#tt').tabs('add',{
            title: title,
            content: '<iframe scrolling="yes" frameborder="0"  src="'+ url +'" style="width:100%;min-height:700px;height:100%"></iframe>',
            height: '100%',
            closable: true
        });
    }
    function removePanel(){
        var tab = <?=$jqname;?>('#tt').tabs('getSelected');
        if (tab){
            var index = <?=$jqname;?>('#tt').tabs('getTabIndex', tab);
            <?=$jqname;?>('#tt').tabs('close', index);
        }
    }

    //var pager = <?=$jqname;?>('#dataGrid').datagrid().datagrid('getPager');
	
	
    var editIndex = undefined;
    <?=$jqname;?>('#dataGrid').edatagrid({
            url: '<?=$listURL;?>',
            saveUrl: '<?=$saveURL;?>',
            updateUrl: '<?=$updateURL;?>',
            destroyUrl: '<?=$delURL;?>',
            errorMSG:{
                title:"Ошибка"
            },
            destroyMsg:{
                norecord:{
                    title:'Ошибка',
                    msg:'Необходимо выбрать запись для удаления'
                },
                confirm:{
                    title:'Подтверждение удаления',
                    msg:'Вы действительно хотите удалить запись?'
                }
            },
            onSave: function(index, row){
                <?=$jqname;?>(this).datagrid('reload');
            }
        }).edatagrid('enableFilter');
		

    function addBtn(){
        addPanel(0);
    }

    function editBtn(){
        var row = <?=$jqname;?>('#dataGrid').datagrid('getSelected');
        if (row){
            addPanel(row.<?=$idField;?>);
        }else{
            <?=$jqname;?>.messager.show({
                title: "Ошибка",
                msg: "Необходимо выбрать документ для редактирования"
            });
        }
    }

    function findBtn(){
        var like = <?=$jqname;?>('#search').val();
		 <?=$jqname;?>('#dataGrid').edatagrid('load',{
			search: like
		});
    }
	
	function updatePos(){
		var ids = [];
		<?=$jqname;?>('#dataGrid').datagrid('selectAll');
		var rows = <?=$jqname;?>('#dataGrid').datagrid('getSelections');  
		for(var i=0; i<rows.length; i++){
			ids.push(rows[i].id);
		}
		//console.log(ids);
		<?=$jqname;?>('#dataGrid').datagrid('unselectAll');
		<?=$jqname;?>.post('<?=$setposURL;?>',{newpos:ids},function(result){
			if (result.success){
				<?=$jqname;?>.messager.show({  
					title: 'Success',
					msg: 'Порядок сохранен'
				});
				<?=$jqname;?>('#dataGrid').datagrid('reload'); 
			} else {
				<?=$jqname;?>.messager.show({  
					title: 'Error',
					msg: result.msg
				});
			}
		},'json');
	}
</script>

