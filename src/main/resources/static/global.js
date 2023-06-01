//Updated JS by @Pallavi Deore for Project and Branch Filter....and removed the old hyperlink of project to download csv...New Generate CSV Report button provided to download csv
// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
var urlParameters = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

var options;

window.registerExtension('csvexport/global', function (opts) {
    var stillOpen = true;
    options = opts;

    window.SonarRequest.getJSON('/api/components/search?qualifiers=TRK&ps=500'
	).then(function (response) {
        if (stillOpen) {
            showProjects(response.components);
        }
    }).catch(function (error) {
    	alert("An error occurred trying to read the projects" + getError(error));
    });;

    // return a function, which is called when the page is being closed
    return function () {
        options.el.textContent = '';
        stillOpen = false;
    };
});

function getError(error){
	if ( typeof(error) == 'string' ){
		return ": " + error;
	}
	return '';
}
function addElements(select, items){
	for ( i in items ){
		var item = items[i];
		var opt = document.createElement('option');
		opt.setAttribute('name', i);
		opt.textContent = item;
		select.appendChild(opt);
	}
}

function addConfig(configList, title, name, el){
	var titleEl = document.createElement('span');
	titleEl.textContent = title;
	titleEl.setAttribute('class', 'csv-title');
	configList.appendChild(titleEl);

    el.setAttribute('name', name);
    el.setAttribute('class', 'csv-options');
    
	configList.appendChild(el);
	configList.appendChild(document.createElement('br'));
}

function addStyle(css){
	var style = document.createElement('style');
	style.type = 'text/css';
	if (style.styleSheet){
	  style.styleSheet.cssText = css;
	} else {
	  style.appendChild(document.createTextNode(css));
	}
	options.el.appendChild(style);
}
function showProjects(responseProjects) {
	options.el.textContent = '';
	
	
	addStyle(
	"   .csv-projectList {\n" +
	"       padding-left: 1em;\n" +
	"       padding-top: 1em;\n" +
	"	}\n" +
	"	.csv-header {\n" +
	"		padding-left: 1em;\n" +
	"	}\n" +
	"	.csv-title {\n" +
	"		height: 2em;\n" +
	"		padding-left: 2em;\n" +
	"		width: 200px;\n" +
	"		display: inline-block;\n" +
	"		vertical-align: top;\n" +
	"	}\n" +
	"	.csv-options {\n" +
	"		width: 200px;\n" +
	"	}\n" +
	"	.csv-options[multiple] {\n" +
	"		height: 5em;\n" +
	"		width: 200px;\n" +
	"	}\n"
	);
	
    var myHeader = document.createElement('h1');
    myHeader.setAttribute('class', 'csv-header');
    myHeader.textContent = 'Project and Branch Filters';
    myHeader.style.fontWeight = 'bold';
    var myRegion = options.el;
    options.el.appendChild(myHeader);
    
    var configList = document.createElement('div');
    options.el.appendChild(configList);
    
	//Projects
	var projects = document.createElement('select');
	projects.id = 'projectId';
	
	//sort the project array alphabetically
	responseProjects.sort(function(a, b) {
    var textA = a.name.toUpperCase();
    var textB = b.name.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
     });
    
    //push the project details to project dropdown
	for(var i in responseProjects) {
        var projectKey = responseProjects[i].key;
        var projectName = responseProjects[i].name;
		var label = projectName + " (" + projectKey + ")";
		var newOption = document.createElement("option");
        newOption.text = label;
        newOption.value = projectKey;
        projects.appendChild(newOption);
	}
	
    addConfig(configList, 'Projects', 'projects', projects);
    
    //Branches
    var branches = document.createElement('select');
	branches.id = 'branchesId';
	addConfig(configList, 'Branch', 'branches', branches);
	
	//push branch details to Branch dropdown	
	var branchesNode;
	var branchesNodeOnChange;
	branchesNode=document.getElementById("projectId").addEventListener("load",updateBranchesDropdown(configList)); 
    var projectID = document.getElementById("projectId");
	projectID.setAttribute('Onchange','updateBranchesDropdown("+configList+");');
	
	//Optional Filters
	var titleEl = document.createElement('span');
	titleEl.textContent = "Optional Filters";
	titleEl.setAttribute('class', 'csv-title');
	titleEl.style.fontWeight = 'bold';
	configList.appendChild(titleEl);
	configList.appendChild(document.createElement('br'));
	
    //assignee...
    var assignee = document.createElement('select');
    addElements(assignee, {
    	'': '-- select --',
        '__me__': 'Me'
    });
    addConfig(configList, 'Assignee', 'assignee', assignee);
    
    //createdAfter
    var createdAfter = document.createElement('input');
    createdAfter.setAttribute('placeholder', '2017-10-19 or 2017-10-19T13:00:00+0200');
    addConfig(configList, 'Created After', 'createdAfter', createdAfter);
    
    //createdBefore
    var createdBefore = document.createElement('input');
    createdBefore.setAttribute('placeholder', '2017-10-19 or 2017-10-19T13:00:00+0200');
    addConfig(configList, 'Created Before', 'createdBefore', createdBefore);

    //resolution
    var resolutions = document.createElement('select');
    resolutions.setAttribute('multiple', 'multiple');
    addElements(resolutions, {
    	'FALSE-POSITIVE': 'FALSE-POSITIVE',
    	'WONTFIX': 'WONTFIX',
    	'FIXED': 'FIXED',
    	'REMOVED': 'REMOVED',
    });
    addConfig(configList, 'Resolution', 'resolutions', resolutions);

    //resolved
    var resolved = document.createElement('select');
    addElements(resolved, {
    	'': 'All',
    	'false': 'Unresolved',
    	'true': 'Resolved',
    });
    resolved.selectedIndex = 1;
    addConfig(configList, 'Is Resolved', 'resolved', resolved);

    //severities
    var severities = document.createElement('select');
    severities.setAttribute('multiple', 'multiple');
    addElements(severities, {
    	'INFO': 'INFO',
    	'MINOR': 'MINOR',
    	'MAJOR': 'MAJOR',
    	'CRITICAL': 'CRITICAL',
    	'BLOCKER': 'BLOCKER',
    });
    addConfig(configList, 'Severities', 'severities', severities);


    //statuses
    var statuses = document.createElement('select');
    statuses.setAttribute('multiple', 'multiple');
    addElements(statuses, {
    	'OPEN': 'OPEN',
    	'CONFIRMED': 'CONFIRMED',
    	'REOPENED': 'REOPENED',
    	'RESOLVED': 'RESOLVED',
    	'CLOSED': 'CLOSED',
    });
    addConfig(configList, 'Statuses', 'statuses', statuses);
    
    //tags
    var tags = document.createElement('input');
    tags.setAttribute('placeholder', 'e.g. security,convention');
    addConfig(configList, 'Tags', 'tags', tags);

    //types
    var types = document.createElement('select');
    types.setAttribute('multiple', 'multiple');
    addElements(types, {
    	'CODE_SMELL': 'CODE_SMELL',
    	'BUG': 'BUG',
    	'VULNERABILITY': 'VULNERABILITY',
    });
    addConfig(configList, 'Types', 'types', types);

    var generateCSV = document.createElement("BUTTON");
    generateCSV.id = 'generateCSV';
	generateCSV.innerHTML = "Generate CSV Report";
    configList.appendChild(generateCSV);
	configList.appendChild(document.createElement('br'));
	var generateCSVButton = document.getElementById("generateCSV");
	var projectKey = getProjectKeyDropdownValues("projectId");
	generateCSVButton.setAttribute('onclick','projectOnClick();');

}

function updateBranchesDropdown(configList)
{
    
	var branchesNode = document.getElementById("branchesId");
	var branchLength = branchesNode.options.length;
	
	for (i = branchLength-1; i >= 0; i--) {
		branchesNode.options[i] = null;
	}
	var newlenth=branchesNode.options.length;
	var projectKey = getProjectKeyDropdownValues("projectId");
	//removed the old location.hostname with latest code
	window.SonarRequest.getJSON('/api/project_branches/list?project='+projectKey).then(function (response) {
    	branchesNode = showBranches(response, options, branchesNode);
    }).catch(function (error) {
    	alert("An error occurred trying to read the first page" + getError(error));
    });;	
	return branchesNode;
}

function getProjectKeyDropdownValues(projectId)
{
    var projectKey = document.getElementById(projectId).value;
	return projectKey;
}

function showBranches(response, options, branchesNode)
{
   var responseBranches = response.branches;
   for(var j in responseBranches) {
        var branchName = responseBranches[j].name;
		var newOption = document.createElement("option");
        newOption.text = branchName;
        newOption.value = branchName;
        branchesNode.appendChild(newOption);
    } 
	return branchesNode;
}

function getBranchDropdownValues(branchesId)
{
    var getBranchValue = document.getElementById(branchesId).selectedOptions[0].value;
	return getBranchValue;  
}

function toString(row){
	var newLine = '';
	var quote = '"';
	var delimiter = ',';
	var escape = '"';
	
	for ( var i in row ){
		field = row[i];
		if (typeof field === 'string') {
		} else if (typeof field === 'number') {
			field = '' + field;
		} else if (typeof field === 'boolean') {
		    field = this.options.formatters.bool(field);
		} else if (typeof field === 'object' && field !== null) {
		    throw "Unhandled type: " + (typeof field);
		}
		if (field) {
		  containsdelimiter = field.indexOf(delimiter) >= 0;
		  containsQuote = field.indexOf(quote) >= 0;
		  containsEscape = field.indexOf(escape) >= 0 && (escape !== quote);
		  containsLinebreak = field.indexOf('\r') >= 0 || field.indexOf('\n') >= 0;
		  shouldQuote = containsQuote || containsdelimiter || containsLinebreak || this.options.quoted || (this.options.quotedString && typeof line[i] === 'string');
		  if (shouldQuote && containsEscape) {
		    regexp = escape === '\\' ? new RegExp(escape + escape, 'g') : new RegExp(escape, 'g');
			field = field.replace(regexp, escape + escape);
		  }
		  if (containsQuote) {
			  regexp = new RegExp(quote, 'g');
		      field = field.replace(regexp, escape + quote);
		  }
		  if (shouldQuote) {
		      field = quote + field + quote;
		  }
		  newLine += field;
		} else {
		  newLine += quote + quote;
		}
		if (i != row.length - 1) {
		  newLine += delimiter;
		}
	}

	return newLine + "\n";
}

function projectOnClick(projectKey){
    var projectKey = getProjectKeyDropdownValues("projectId");
    var branch = document.getElementById("branchesId").selectedOptions[0].value;
	var options = {componentKeys: projectKey, branch: branch, p: 1, ps: 500, additionalFields: "_all"};
	
	var els = document.getElementsByClassName('csv-options');
	Array.prototype.forEach.call(els, function(el) {
		var val = '';
		if ( el.tagName.toLowerCase() == 'select' ){
			var selected = [];
			for (var i = 0; i < el.length; i++) {
		        if (el.options[i].selected) 
		        	selected.push(el.options[i].getAttribute('name'));
		    }
			
			val = selected.join(',');
		}else if ( el.tagName.toLowerCase() == 'input' && el.type.toLowerCase() == 'text' ){
			val = el.value;
		}else{
			console.error('Unhandled type: ' + el.tagName);
		}
		if ( typeof(val) == 'string' && val != '' ){
			options[el.getAttribute('name')] = val;
		};
	});
	var branch = getBranchDropdownValues("branchesId");
	var projectKey = getProjectKeyDropdownValues("projectId");
	window.SonarRequest.getJSON('/api/issues/search', options).then(function (response) {
    showIssues(response, options);
    }).catch(function (error) {
    	alert("An error occurred trying to read the first page" + getError(error));
    });;
}

function openCsv(){
	window.csvContent = "";
	var row = [];
    row.push("Creation Date");
    row.push("Update Date");
    row.push("Rule");
    row.push("Status");
    row.push("Severity");
    row.push("File");
    row.push("Line");
    row.push("Message");
	row.push("Comment");
	row.push("User");
	row.push("Comment Date");
	row.push("Branch Name");
    window.csvContent += toString(row);
}

function showIssues(responseIssues, options) {
    var issues = responseIssues['issues'];
    var row = [];
    //var maxLength = 997737;
    if ( options.p == 1 ){
    	openCsv();
    }else if ( issues.length == 0 ) { //}|| window.csvContent.length >= maxLength ){
    	//no more data...
    	var encodedUri = encodeURI(window.csvContent);
    	var link = document.createElement("a");
    	link.setAttribute("href",'data:text/csv;charset=utf-8,' + encodeURIComponent(window.csvContent));
    	link.setAttribute("download", options.componentKeys + "-" + options.p + ".csv");
    	document.body.appendChild(link); // Required for FF
    	link.click(); // This will download the data file named "my_data.csv".
    	
    	if ( issues.length == 0 ){
    		return;
    	}else{
    		//we have a very large file...
        	openCsv();
    	}
    }
    
    for(var k in issues) {
        row = [];
        row.push(issues[k].creationDate);
        row.push(issues[k].updateDate);
        row.push(issues[k].rule);
        row.push(issues[k].status);
        row.push(issues[k].severity);
        row.push(issues[k].component);
        row.push(issues[k].line);
        row.push(issues[k].message);
        
        var commentJSON = issues[k].comments;
        let comment;
        let user;
        let createdAt;
        if(typeof commentJSON != "undefined" 
                        && commentJSON != null 
                        && commentJSON.length != null 
                        && commentJSON.length > 0) {
	    comment = commentJSON[0].htmlText;
		user = commentJSON[0].login;
		createdAt = commentJSON[0].createdAt;
		row.push(comment);
		row.push(user);
		row.push(createdAt);
        }
        else
        {
	    row.push(comment);
		row.push(user);
		row.push(createdAt);
        }
		var branch = getBranchDropdownValues("branchesId");
		row.push(branch);
        window.csvContent += toString(row);
    }
    

    options.p++;
    window.SonarRequest.getJSON('/api/issues/search',options).then(function (response) {
        showIssues(response, options);
    }).catch(function (error) {
    	alert("An error occurred trying to read the next page. This can occur if there are too many results. Reduce your request to less than 10,000 results" + getError(error));
    });
}

// cd src\main\resources\static
// http-server

//test:
//window.SonarRequest.getJSON('/api/projects/index' ).then(showProjects).catch(function (error) {
//	alert("An error occurred trying to read the projects" + getError(error));
//});
