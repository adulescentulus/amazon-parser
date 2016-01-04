var amazonUri = "https://www.amazon.de/gp/css/order-history";

function addError( object, msg ) 
{
    object.errors.push( msg );
}

function getShortDate( date )
{
    return date
       .replace( 'Januar', 'Jan' )
       .replace( 'Februar', 'Feb' )
       .replace( 'März', 'Mär' )
       .replace( 'April', 'Apr' )
       .replace( 'Juni', 'Jun' )
       .replace( 'Juli', 'Jul' )
       .replace( 'August', 'Aug' )
       .replace( 'September', 'Sep' )
       .replace( 'Oktober', 'Okt' )
       .replace( 'November', 'Nov' )
       .replace( 'Dezember', 'Dez' );
}

function getCsvDate( date )
{
    return date;
}

function getCsvName( name )
{
    return name
       .replace( /[\n]/g, "" )
       .replace( /[\r]/g, "" )
       .replace( /;/g, "," )
       .replace( /"/g, "'" );
}

function getPriceString( x )
{
    if( x == '?' )
    {
        return '?';
    }
    
    var eurocent = ( ( x / 100 ).toFixed( 2 ) + "" ).split( "." );
    var euro = eurocent[ 0 ];
    var euroTsd = "";
    
    for( var i = 0; i < euro.length - 1; i++ )
    {
        euroTsd += euro.charAt( i );
        if( ( ( euro.length - i ) % 3 ) == 1 )
        {
            euroTsd += ".";
        }
    }
    euroTsd += euro.charAt( euro.length - 1 );
    
    return euroTsd + "," + eurocent[ 1 ];
}

function getOverviewLine( data )
{
    return "<tr>" +
        "<td align=\"right\">" + data.name + "</td>" + 
        "<td align=\"right\">" + getPriceString( data.cent ) + "</td>" +
        "<td align=\"right\">" + data.orders + "</td>" +
        "<td align=\"right\">" + data.products + "</td>" +
        "<td align=\"right\">" + ( data.products > 0 ? getPriceString( data.cent / data.products ) : 0 ) + "</td>" +
        "<td align=\"right\">" + getPriceString( data.cent / data.month ) + "</td>" +
        "</tr>";
}

function getOrderLine( data )
{
    var nameList = "<ul style=\"margin:0; padding:0 0 0 2em\">";
    for( var i = 0; i < data.names.length; i++ )
    {
        nameList += "<li>" + data.names[ i ] + "</li>";
    }
    nameList += "</ul>";
    
    return "<tr>" +
        "<td align=\"right\" valign=\"top\" style=\"white-space:nowrap;\">" + getShortDate( data.date ) + "</td>" +
        "<td align=\"center\" valign=\"top\">" + data.products + "</td>" +
        "<td align=\"right\" valign=\"top\">" + getPriceString( data.price )+ "</td>" +
        "<td align=\"left\" valign=\"top\">" + nameList + "</td>" +
        "<td align=\"center\" valign=\"top\"><a href=\"" + data.link + "\">" + data.id + "</a></td>" + 
        "<td align=\"left\" valign=\"top\"><a href=\"" + data.uri + "\">" + data.page + "</a></td>" +
        "</tr>";
}

function getCsvOrderLine( data )
{
    var nameList = '"';
    for( var i = 0; i < data.names.length; i++ )
    {
        nameList += ( i > 0 ? ', ' : '' ) + getCsvName( data.names[ i ] );
    }
    nameList += '"';
    
    return "" + 
       getCsvDate( data.date ) + ";" +
       data.products + ";" +
       getPriceString( data.price ) + ";" +
       nameList + "<br>\n";
}

function showAsCsv( doc, allOrders )
{
    var text = "Datum;Produktanzahl;Preis;Beschreibung<br>\n";

    for( var i = 0; i < allOrders.length; i++ )
    {
        text += getCsvOrderLine( allOrders[ i ] );
    }
    
    doc.body.innerHTML = text;
}

function printOrders()
{
    var now = new Date();
    var thisYear = "" + ( 1900 + now.getYear() );
    var thisYearMonthCount = now.getMonth() + 1;

    var allOrders = [];
    var years = [];
    var overall = { "name" : "Insg.", "cent" : 0, "orders" : 0, "products" : 0, "month" : 0 };

    var errorString = '';
    
    for( var i = 0; i < orders.length; i++ )
    {
        var yearStr = orders[ i ].yearStr;
        var year = { "name" : yearStr, "cent" : 0, "orders" : 0, "products" : 0, "month" : ( yearStr == thisYear ? thisYearMonthCount : 12 ) };

        for( var e = 0; e < orders[ i ].errors.length; e++ )
        {
            errorString += '<li>' + yearStr + ': ' + orders[ i ].errors[ e ] + '</li>';
        }
        
        for( var j = 0; j < orders[ i ].pages.length; j++ )
        {
            for( var e = 0; e < orders[ i ].pages[ j ].errors.length; e++ )
            {
                errorString += '<li><a href="' + orders[ i ].pages[ j ].uri + '">' + yearStr + '/' + j + '</a>: ' + orders[ i ].pages[ j ].errors[ e ] + '</li>';
            }
            
            for( var k = 0; k < orders[ i ].pages[ j ].entries.length; k++ )
            {
                var entry = orders[ i ].pages[ j ].entries[ k ];
                entry.page = yearStr + '/' + j + '/' + k;
                entry.uri = orders[ i ].pages[ j ].uri;
                
                for( var e = 0; e < entry.errors.length; e++ )
                {
                    errorString += '<li><a href="' + entry.uri + '">' + yearStr + '/' + j + '/' + k + '</a>: ' + entry.errors[ e ] + '</li>';
                }
                
                year.cent += ( entry.price == '?' ? 0 : entry.price );
                year.products += entry.products;
                year.orders++;

                allOrders.push( entry );
            }
        }

        if( year.orders > 0 )
        {
            overall.cent += year.cent;
            overall.products += year.products;
            overall.orders += year.orders;
            overall.month += year.month;

            years.push( year );
        }
    }
    
    var text = 
        '<input type="button" id="showcsv" name="showcsv" value="Als CSV anzeigen (beta)" /><br><br>' +
        "<h2>Übersicht</h2>";
    
    text += "<div><table cellspacing=\"0\" cellpadding=\"4\" border=\"1\"><tr>" +
        "<th>Jahr</th>" +
        "<th>Preis</th>" + 
        "<th>Bestell.</th>" +
        "<th>Produkte</th>" +
        "<th>Preis/Prod.</th>" +
        "<th>Preis/Monat</th>" +
        "</tr>";
        
    text += getOverviewLine( overall );
    for( var i = 0; i < years.length; i++ )
    {
        text += getOverviewLine( years[ i ] );
    }
    text += "</table></div>";
    
    text += "<h2>Einzel-Bestellungen</h2>";
    
    text += "<div><table cellspacing=\"0\" cellpadding=\"4\" border=\"1\"><tr>" +
        "<th>Datum</th>" + 
        "<th>Prod.</th>" +
        "<th>Preis</th>" +
        "<th>Produktbeschreibungen</th>" +
        "<th>Link</th>" +
        "<th>Seite</th>" +
        "</tr>";
        
    for( var i = 0; i < allOrders.length; i++ )
    {
        text += getOrderLine( allOrders[ i ] );
    }
    text += "</table></div>";
    
    text += "<h2>Fehler</h2>";
    text += '<ul>' + ( errorString == '' ? '<li>Keine</li>' : errorString ) + '</ul>';        
    
    resultBrowser.contentDocument.body.innerHTML = text;
    
    resultBrowser.contentDocument.getElementById( 'showcsv' ).addEventListener( 'click', function() { showAsCsv( resultBrowser.contentDocument, allOrders ); } );
}

function printState()
{
    var s = '';
    for( var i = 0; i < orders.length; i++ )
    {
        s += '<b>' + orders[ i ].yearStr + ':</b> ';
        if( orders[ i ].pages.length == 0 )
        {
            s += 'Warte auf Bestellseiten...';
        }
        else
        {
            var pageCount = 0;
            for( var j = 0; j < orders[ i ].pages.length; j++ )
            {
                if( orders[ i ].pages[ j ].done )
                {
                    pageCount++
                }
            }
            if( orders[ i ].pages.length == pageCount )
            {
                s += 'Fertig';
            }
            else
            {
                for( var k = 0; k < orders[ i ].pages.length; k++ )
                {
                    s += '<span style="padding:0 10px;border:1px black solid';
                    if( k < pageCount )
                    {
                        s += ';background-color:#0a0';
                    }
                    s += '">&nbsp;</span>';
                } 
            }
        }
        s += '<br>';
    }
    
    resultBrowser.contentDocument.body.innerHTML = '<h2>Warte auf Bestellungen...</h2>' + s;
}

function waitForFinish()
{
    if( !resultBrowser || !resultBrowser.contentDocument )
    {
        return;
    }
    
	  printState();
	
    if( orders.length == 0 )
    {
        setTimeout( function() { waitForFinish(); }, 1000 );
        return;
    }
    
    for( var i = 0; i < orders.length; i++ )
    {
        if( orders[ i ].pages.length == 0 ) 
        {
            setTimeout( function() { waitForFinish(); }, 1000 );
            return;
        }
        for( var j = 0; j < orders[ i ].pages.length; j++ )
        {
            if( !orders[ i ].pages[ j ].done ) 
            {
                setTimeout( function() { waitForFinish(); }, 1000 );
                return;
            }
        }
    }

    printOrders();
}

function findOrders( doc, year, page, uri )
{
    orders[ year ].pages[ page ].done = true;
    orders[ year ].pages[ page ].uri = uri;

    var orderIt = doc.evaluate( 
        ".//div[@id='ordersContainer']/div[@class='a-box-group a-spacing-base order']", doc.body, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );

    var orderDiv = orderIt.iterateNext();
    if( orderDiv == null )
    {
        addError( orders[ year ].pages[ page ], 'Keine Bestellungen gefunden' );
        return;
    }
    
    while( orderDiv )
    {
        var order = { "price" : "?", "date" : "?", "link" : "", "id" : "?", "names" : [], "products" : 0, "errors" : [] };
 
        var nameIt = doc.evaluate( 
            "./div[contains(@class,'a-box')]" + 
            "/div[@class='a-box-inner']" + 
            "/div[contains(@class,'a-fixed-right-grid')]" +
            "/div[@class='a-fixed-right-grid-inner']" +
            "/div[@class='a-fixed-right-grid-col a-col-left']" +
            "/div[@class='a-row']" +
            "/div[contains(@class,'a-fixed-left-grid')]" +
            "/div[@class='a-fixed-left-grid-inner']" +
            "/div[@class='a-fixed-left-grid-col a-col-right']" +
            "/div[@class='a-row'][1]" +
            "/*[self::a or self::span]", orderDiv, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
        
        var nameLink = nameIt.iterateNext();
        if( nameLink == null )
        {
            addError( order, 'Kein Name gefunden' );
        }
        
        while( nameLink )
        {
            order.names.push( nameLink.innerHTML.trim() );
            order.products += 1;
            
            nameLink = nameIt.iterateNext();
        }
        
        var otherXP = doc.evaluate( 
            "./div[contains(@class,'a-box')]" + 
            "/div[@class='a-box-inner']" + 
            "/div[contains(@class,'a-fixed-right-grid')]" +
            "/div[@class='a-fixed-right-grid-inner']" +
            "/div[@class='a-fixed-right-grid-col a-col-left']" +
            "/div[@class='a-row']" +
            "/div[contains(@class,'a-section')]" +
            "/a[@class='a-size-medium a-link-emphasis']", orderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );

        if( otherXP.singleNodeValue )
        {
            var regex = /Alle ([0-9]*) Artikel/;
            var result = regex.exec( otherXP.singleNodeValue.innerHTML );
            if( result )
            {
                var totalProducts = parseInt( result[ 1 ] );
                var restProducts = totalProducts - order.products;

                order.names.push( '...und ' + restProducts + ( restProducts == 1 ? ' weiteres Produkt' : ' weitere Produkte' ) );
                order.products += restProducts;
            }
        }
      
        var priceXP = doc.evaluate( 
            "./div[contains(@class,'a-box')]" + 
            "/div[@class='a-box-inner']" + 
            "/div[@class='a-fixed-right-grid']" +
            "/div[@class='a-fixed-right-grid-inner']" +
            "/div[@class='a-fixed-right-grid-col a-col-left']" +
            "/div[@class='a-row']" +
            "/div[@class='a-column a-span2']" +
            "/div[@class='a-row a-size-base']" +
            "/span[@class='a-color-secondary value']", orderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
        
        if( priceXP.singleNodeValue )
        {
            order.price = parseInt( priceXP.singleNodeValue.innerHTML.replace( /EUR|$|£/, "" ).replace( /[,.]/g, "" ).trim() );
        }
        else
        {
            addError( order, 'Kein Preis gefunden' );
        }

        var dateXP = doc.evaluate( 
            "./div[contains(@class,'a-box')]" + 
            "/div[@class='a-box-inner']" + 
            "/div[@class='a-fixed-right-grid']" +
            "/div[@class='a-fixed-right-grid-inner']" +
            "/div[@class='a-fixed-right-grid-col a-col-left']" +
            "/div[@class='a-row']" +
            "/div[@class='a-column a-span4']" +
            "/div[@class='a-row a-size-base']" +
            "/span[@class='a-color-secondary value']", orderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
        
        if( dateXP.singleNodeValue )
        {
            order.date = dateXP.singleNodeValue.innerHTML.trim();
        }
        else
        {
            addError( order, 'Kein Datum gefunden' );
        }
        
        var linkXP = doc.evaluate( 
            "./div[contains(@class,'a-box')]" + 
            "/div[@class='a-box-inner']" + 
            "/div[@class='a-fixed-right-grid']" +
            "/div[@class='a-fixed-right-grid-inner']" +
            "/div[@class='a-fixed-right-grid-col actions a-col-right']" +
            "/div[@class='a-row a-size-base']" +
            "/ul[@class='a-nostyle a-vertical']" +
            "/a[@class='a-link-normal']", orderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
        
        if( linkXP.singleNodeValue )
        {
            order.link = linkXP.singleNodeValue.href;
            var regex = /orderID=([0-9-]*)/;
            var result = regex.exec( linkXP.singleNodeValue.href );
            if( result )
            {
                order.id = result[ 1 ];
            }
        }
        else
        {
            addError( order, 'Keinen Link gefunden' );
        }
        
        orders[ year ].pages[ page ].entries.push( order );

        orderDiv = orderIt.iterateNext();           
    }
}

function loadOrders( event ) 
{
    if( event.currentTarget.onlyOnce )
    {
        return;
    }
    event.currentTarget.onlyOnce = true;
    
    findOrders( event.currentTarget.contentDocument, event.currentTarget.yearIndex, event.currentTarget.pageIndex, event.currentTarget.pageUri + ( event.currentTarget.pageIndex * 10 ) );

    if( event.currentTarget.pageIndex < event.currentTarget.maxIndex )
    {
        var pageTab = gBrowser.getBrowserForTab( gBrowser.addTab( event.currentTarget.pageUri + ( ( event.currentTarget.pageIndex + 1 ) * 10 ) ) );
        pageTab.yearIndex = event.currentTarget.yearIndex;
        pageTab.pageIndex = event.currentTarget.pageIndex + 1;
        pageTab.maxIndex = event.currentTarget.maxIndex;
        pageTab.pageUri = event.currentTarget.pageUri;
        pageTab.addEventListener( "load", loadOrders, true );
    }

    event.currentTarget.contentWindow.close();
}

function loadYear( event ) 
{
    if( event.currentTarget.onlyOnce )
    {
        return;
    }
    event.currentTarget.onlyOnce = true;
    
    var doc = event.currentTarget.contentDocument;
    
    var maxIndex = 0;
    var naviIt = doc.evaluate( ".//ul[@class='a-pagination']/li/a", doc.body, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
    var naviLink = naviIt.iterateNext();
    while( naviLink )
    {
        if( naviLink.href.match( /startIndex=(\d+)/ ) )
        {
            maxIndex = Math.max( maxIndex, parseInt( RegExp.$1 ) );
        }
        naviLink = naviIt.iterateNext();           
    }
    
//maxIndex = 20;
    
    var year = event.currentTarget.yearIndex;
    for( var i = 0; i <= maxIndex; i += 10 )
    {
        orders[ year ].pages.push( { "done" : false, "entries" : [], "errors" : [] } );
    }

    var pageUri = amazonUri + "/ref=oh_aui_pagination_1_2?ie=UTF8&orderFilter=" + orders[ year ].year + "&search=&startIndex=";
    
    findOrders( doc, year, 0, pageUri + 0 );

    if( maxIndex >= 10 )
    {
//alert( pageUri + maxIndex );

        var startIndex = 10;

//startIndex = 30;
//maxIndex = 30;
        
        var pageTab = gBrowser.getBrowserForTab( gBrowser.addTab( pageUri + startIndex ) );
        pageTab.yearIndex = year;
        pageTab.pageIndex = startIndex /10;
        pageTab.maxIndex = maxIndex / 10;
        pageTab.pageUri = pageUri;
        pageTab.addEventListener( "load", loadOrders, true );
    }
    
    event.currentTarget.contentWindow.close();
}

function loadAllOrders( doc, count, yearUri )
{
    var anythingSelected = false;
    for( var i = 0; i < count; i++ )
    {
        if( doc.getElementById( 'year' + i ).checked )
        {
            anythingSelected = true;
            break;
        }
    }
    if( !anythingSelected )
    {
        return;
    }

    var index = 0;
    for( var i = 0; i < count; i++ )
    {
        if( doc.getElementById( 'year' + i ).checked )
        {
            index++;
        }
        else
        {
            orders.splice( index, 1 );
        }
    }
    
    for( var i = 0; i < orders.length; i++ )
    {
        var yearTab = gBrowser.getBrowserForTab( gBrowser.addTab( yearUri + orders[ i ].year ) );
        yearTab.yearIndex = i;
        yearTab.addEventListener( "load", loadYear, true );
    }
    
    waitForFinish();
}

function selectAllYears( doc, count )
{
    for( var i = 0; i < count; i++ )
    {
       doc.getElementById( 'year' + i ).checked = true;
    }
}

function loadYearCount( event ) 
{
    if( event.currentTarget.onlyOnce )
    {
        return;
    }
    event.currentTarget.onlyOnce = true;
    
    var doc = event.currentTarget.contentDocument;
    
    var filter = null;
    var yearUri = amazonUri + "?";

    var yearFormXP = doc.evaluate( 
        ".//form[@id='timePeriodForm']", doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
    
    if( yearFormXP.singleNodeValue )
    {
        for( var i = 0; i < yearFormXP.singleNodeValue.elements.length; i++ )
        {
            var element = yearFormXP.singleNodeValue.elements[ i ];
            if( element.name == 'orderFilter' )
            {
                 filter = element;
                 continue;
            }

            yearUri += encodeURIComponent( element.name ) + "=" + encodeURIComponent( element.value ) + "&";
        }
        yearUri += "orderFilter=";
    }

    var doc = event.currentTarget.resultBrowser.contentDocument;

    if( filter == null )
    {
        doc.body.innerHTML = "<h2>Fehler: Keine Jahresauswahl gefunden</h2>";
        return;
    }

    for( var i = 0; i < filter.options.length; i++ )
    {
        var regex = /year-(\d\d\d\d)/;
        if( regex.exec( filter.options[ i ].value ) )
        {
            var year = filter.options[ i ].value;
            
            orders.push( { "year" : year, "yearStr" : year.substr( 5 ), "pages" : [], "errors" : [] } );
        }
    }

    var yearsString = '<h2>Jahre mit Bestellungen</h2><form action="">';
    yearsString += '<input type="button" id="selectall" name="selectall" value="Alle selektieren" /><br><br>';
    for( var i = 0; i < orders.length; i++ )
    {
        var name = 'year' + i;
        var checked = ( i == 0 ? 'checked="checked"' : '' );
        yearsString += '<label><input type="checkbox" id="' + name + '" name="' + name + '" value="1" ' + checked + ' /> ' + orders[ i ].yearStr + '</label><br>';
    }
    yearsString += '<br><input type="button" id="loadorders" name="loadorders" value="Bestellungen laden" />';
    yearsString += '</form>';

    doc.body.innerHTML = yearsString;
    doc.getElementById( 'selectall' ).addEventListener( 'click', function() { selectAllYears( doc, orders.length ); } );
    doc.getElementById( 'loadorders' ).addEventListener( 'click', function() { loadAllOrders( doc, orders.length, yearUri ); } );
   
    event.currentTarget.contentWindow.close();
}

var orders = [];

var resultTab = gBrowser.addTab( null );
gBrowser.selectedTab = resultTab;
var resultBrowser = gBrowser.getBrowserForTab( resultTab );
resultBrowser.addEventListener( "load", function( event ) { event.currentTarget.contentDocument.body.innerHTML = '<h2>Warte auf Jahre...</h2>'; }, true );

var yearBrowser = gBrowser.getBrowserForTab( gBrowser.addTab( amazonUri + "/ref=ya_orders_css" ) );
yearBrowser.resultBrowser = resultBrowser;
yearBrowser.addEventListener( "load", loadYearCount, true );
