window.onload = function(e){

    $('.db_table input').each(toggleColumn);
    $('td input').removeAttr('checked');
    $('input.select_all').removeAttr('checked');
    
    $('.select_all').change(function(e){
        if( $('td.id').length<1 ){ return; }

        if( !$(this).is(':checked') ){
            $('td.select_row input').each(function(i,o){ 
                $(o).removeAttr('checked'); 
                $(o).closest('tr').toggleClass('highlight', false);
            });
        }else{
            $('td.select_row input').each(function(i,o){ 
                $(o).prop('checked', true); 
                $(o).closest('tr').toggleClass('highlight', true);
            });
        }
    });
    
    $('.expand-btn').click(function(e){
        e.preventDefault();
        $(this).closest('li').toggleClass('open');
    });
    
    $('.db_table input').on('change', toggleColumn);
    
    $('.edit').click(activate_edit);
    $('.cancel-edit').click(cancel_edit);
    $('.save').click(submit_save);
    $('.refresh').click(submit_refresh);
    $('.delete_rows').click(submit_delete);

    $('td input').change(function(e){
        var row = $(this).closest('tr');
        if( row.find('td.id').length>0 ){
            row.toggleClass('highlight', $(this).is(':checked'));
        }
    });

    SearchQuery.init();

};

var SearchQuery = {

    bind: function(){
        $('.ddn.double-action .ddn-list>a').off('click').on('click', function(e){
            e.preventDefault();
            var ddn = $(this).closest(".ddn");
            var a = $(this);
            SearchQuery.setDdnValue( ddn, a );
        });
        $('.btn.search').off('click').on('click', function(e){
            e.preventDefault();
            var params = getUrlParams();
            if( 'undefined' != typeof( params.table ) ){
                var url = window.location.href.replace(/\?.*/,'').replace(/\#.*/,'');
                window.location = url + '?table=' + params.table + '&' + $('#query-form').serialize();
            }
        });
    },
    
    bind_inputs: function(){
        $('.query-param a.close').off('click').on('click', function(e){
            e.preventDefault();
            $(this).closest('div').remove();
            if( $(".query-param").length < 1 ){ $(".table-query").hide(); }
        });
        $('.order-span a.close').off('click').on('click', function(e){
            e.preventDefault();
            $(this).closest('.order-span').remove();
            if( $('.query-order-holder .order-span').length <1 ){
                $('.query-order-holder').remove();
                if( $(".query-param").length < 1 ){ $(".table-query").hide(); }
            }
        });
        $('.order-direction').off('click').on('click', function(e){
            e.preventDefault();
            $(this).toggleClass('icon-arrow-circle-up').toggleClass('icon-arrow-circle-down');
            var inp = $(this).siblings('input');
            inp.val( (inp.val()=='DESC')? 'ASC' : 'DESC' );
        });
    },
    
    init: function(){
        if( $(".query-param").length < 1 ){ $(".table-query").hide(); }
        SearchQuery.bind();
        SearchQuery.bind_inputs();
    },

    setDdnValue: function(ddn, a){
        if( !a || a.hasClass('column-info-btn')){ return; }

        var col_name = ddn.data('column');
        var direction = a.data('order');

        ddn.find(".ddn-list a").removeClass("active");

        if(''== direction){
            var search_type= a.data('search');
            if('clear'== search_type){
            }else if('equal'== search_type){
                SearchQuery.addEqualNode(col_name);
            }else if('like'== search_type){
                SearchQuery.addLikeNode(col_name);
            }else if('range'== search_type){
                SearchQuery.addRangeNode(col_name, ddn.data('type'));
            }
        }else if('clear'== direction){
        }else{
            ddn.data('order', direction);
            a.addClass("active");
            ddn.find(".ddn-btn").html( (('DESC' == direction)? '<i class="order-direction icon-arrow-circle-down"></i>':
                                          '<i class="order-direction icon-arrow-circle-up"></i>') 
                                       + " &#9662;" );
            SearchQuery.addOrderNode(col_name, direction );
        }

    },

    setDdnAppearenceById: function( ddn, id ){
        var a_li = ddn.find(".ddn-list a");
        var a = null;
        a_li.each(function(i,o){ if( $(o).data('id') == id ){ a = $(o); } });
        SearchQuery.setDdnValue(ddn, a);
    },

    addEqualNode: function( col_name ){
        if( $('.equal-'+ col_name).length >0 ){ return; }
        $('<div class="query-param equal-'+ col_name +'">'
            + '<span class="column">' + col_name 
                + '</span> = <input form="query-form" name="query[equal][' + col_name + ']" value=""/>'
            + '<a class="close">&times;</a>'
        + '</div>').appendTo($(".table-queries-list"));

        SearchQuery.bind_inputs();
        $(".table-query").show();
    },

    addRangeNode: function(col_name, data_type){
        if( $('.range-'+ col_name).length >0 ){ return; }
        if( 'datetime' == data_type ){ SearchQuery.addDateRangeNode(col_name); return; }
        $('<div class="query-param range-'+ col_name +'">'
            + '<span class="column">' + col_name + '</span> between '
            + '<input form="query-form" name="query[range][' + col_name + '][start]" value=""/>'
            + ' and '
            + '<input form="query-form" name="query[range][' + col_name + '][end]" value=""/>'
            + '<a class="close">&times;</a>'
        + '</div>').appendTo($(".table-queries-list"));


        SearchQuery.bind_inputs();
        $(".table-query").show();
    },

    addDateRangeNode: function(col_name){
        var node = $('<div class="query-param range-'+ col_name +'">'
            + '<span class="column">' + col_name + '</span> '
            + '<input form="query-form" class="query-date-start" type="hidden" name="query[range][' + col_name + '][start]" value=""/>'
            + '<input form="query-form" class="query-date-end" type="hidden" name="query[range][' + col_name + '][end]" value=""/>'
            + '<span class="range-calendar-holder"></span>'
            + '<a class="close">&times;</a>'
        + '</div>').appendTo($(".table-queries-list"));
        var pa = node.find(".range-calendar-holder");
        new RangeCalendar({'pa': pa, 'callback': SearchQuery.setDateRangeInput });
        SearchQuery.bind_inputs();
        $(".table-query").show();
    },

    addLikeNode: function(col_name){
        if( $('.like-'+ col_name).length >0 ){ return; }
        $('<div class="query-param like-'+ col_name +'">'
            + '<span class="column">' + col_name + '</span> like <input form="query-form" name="query[like][' + col_name + ']" value=""/>'
            + '<a class="close">&times;</a>'
        + '</div>').appendTo($(".table-queries-list"));

        SearchQuery.bind_inputs();
        $(".table-query").show();
    },

    addOrderNode: function(col_name, direction){
        var holder = $(".query-order-holder");
        if( holder.length < 1 ){
            holder = $('<div class="query-param  query-order-holder"><b>Order by:</b></div>')
                .appendTo($(".table-queries-list"));
        }

        var ind = holder.find(".order-span").length;

        if( $('.order-'+ col_name).length >0 ){
            node = $('.order-'+ col_name).remove();
        }
        holder.append( '<span class="order-span order-'+ col_name +'">'
           + '<span class="column">' + col_name + '</span>'
           + '<input form="query-form" type="hidden" name="query[order][' + ind + '][' + col_name+ ']" value="' + direction + '"/>'
           + ( ('DESC' == direction)? '<a class="order-direction icon-arrow-circle-down"></a>':
                                       '<a class="order-direction icon-arrow-circle-up"></a>')
           + '<a class="close">&times;</a>'
        + '</span>');

        SearchQuery.bind_inputs();
        $(".table-query").show();
    },

    setDateRangeInput: function(range){
        var inp_start = range.pa.siblings(".query-date-start");
        var inp_end = range.pa.siblings(".query-date-end");
        inp_start.val( range.from.format('Y-MM-DD HH:mm:ss'));
        inp_end.val( range.to.format('Y-MM-DD HH:mm:ss'));
console.log(range.from.format('Y-MM-DD HH:mm:ss'), range.to.format('Y-MM-DD HH:mm:ss') );
    }

};

var flashCard = {
    dismiss: function(){
        var this_card = $(this);
        this_card.addClass( 'way-to-the-right' );
        setTimeout(function(){ this_card.remove(); }, 500 );
    },

    add: function( type, note ){
       var box = $('.flash-box');
       var card  = $(
         '<div class="flash-card way-below ' + type + '">\
            <div class="flash-card-icon"><i class="icon3-flash"></i></div>\
            <div class="flash-card-text">' + note + '</div>\
         </div>').appendTo( box );
       setTimeout(function(){ card.removeClass('way-below'); }, 100 );
       card.bind('click', flashCard.dismiss);
       setTimeout(function(){ card.fadeOut(600, function(){ card.remove(); }) }, 45000 );
    }
};

function toggleColumn(){
console.log(this);
    var li = $(this).closest('li.db_table');
    var table_name = li.children('a').text().trim();
    var col_name = $(this).data('col');
    var col_class = '.' + table_name + ' .' + col_name;
console.log(col_class, $(this).is(':checked'));
    $( col_class ).toggle( $(this).is(':checked') );
}

function activate_edit(e){
    e.preventDefault();
    $('.edit').addClass('hidden');
    $('.edit-save-span').removeClass('hidden');
    $('.my_table td').each(function(i,o){
        if( $(o).hasClass('select_row') || $(o).hasClass('id') || $(o).hasClass('fkey') ){
            // do nothing, just skip
        }else if( $(o).find('.thumbnail').length > 0 ){
            o.savedThumb = $(o).html();
            $(o).html( $(o).data('value') );
            $(o).prop('contenteditable', true);
        }else{
            $(o).prop('contenteditable', true);
        }
    });
}

function cancel_edit(e){
    e.preventDefault();
    $('.edit').removeClass('hidden');
    $('.edit-save-span').addClass('hidden');
    $('.my_table td').each(function(i,o){
        $(o).removeAttr('contenteditable');
        if( 'undefined' != typeof( o.savedThumb ) ){
            $(o).html( o.savedThumb );
        }
    });
}

function submit_refresh(){
    $.post('', 'refresh_prefs_table=1' )
     .done( function(r){
        console.log(r);
        flashCard.add('success', JSON.stringify(r) );
    });
}
function submit_save(){
    $.post('', $('form.prefs').serialize() )
     .done( function(r){
        console.log(r);
        flashCard.add('success', JSON.stringify(r) );
    });
}

function submit_delete(){
    $.post('', $('form.my_table').serialize() )
     .done( function(r){
        $('form.my_table tr.highlight').remove();
        console.log(r);
        flashCard.add('danger', JSON.stringify(r) );
    });
}

function onNewQuery(col, query_type, val){
    var params = getUrlParams();

    if( 'sort' == query_type ){
    }else if( 'equal' == query_type ){
    }else if( 'like' == query_type ){
    }else if( 'range' == query_type ){
    }
}

function getUrlParams(){
    var queryDict = {};
    location.search.substr(1).split("&")
        .forEach(function(item) {
            var arr = item.split("=");
            queryDict[arr[0]] = arr[1];
        });
return queryDict;
}
