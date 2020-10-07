

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
  });

const port = 3000;
const express = require('express');
var app = express();
app.set('port', port);
app.listen(port, () => { console.log(`Express App Listening on port: ${port}`) });


const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://test:Test@123@13.126.116.162:5432/data' });
client.connect();




let query_select = `
SELECT
	company."CompanyId" AS "company.CompanyId",
	company."Company" AS "company.Company",
	company."Speciality" AS "company.Speciality",
	company."IndustryType1" AS "company.IndustryType",
	company."SubIndustryType1" AS "company.SubIndustryType",
	contact."FirstName" AS "contact.FirstName",
	contact."LastName" AS "contact.LastName",
	contact."JobTitle1" AS "contact.JobTitle",
	contact."JobLevel1" AS "contact.JobLevel",
	contact."JobFunction1" AS "contact.JobFunction",
	contact."Contact Country" AS "contact.ContactCountry"

FROM company INNER JOIN contact ON company."CompanyId" = contact."CompanyId"`;

app.post('/filterContacts', function (req, res, next) {
    
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString(); 
    });

    req.on('end', () => {

        let data = JSON.parse(body);

        if (data && data.filter && data.filter.length > 0) {

            whereClauseString = '';

            for (let i = 0; i < data.filter.length; i++) {

                if (data.filter[i].filters.length == 0) continue;
                let filterString = data.filter[i].filters[0];
                for (let f = 1; f < data.filter[i].filters.length; f++) {
                    filterString += `|${ data.filter[i].filters[f] }`;
                }

                while (filterString.includes(' ')) {
                    filterString = filterString.replace(' ','&');
                }

                whereClauseString += (whereClauseString != '') ? ' AND ' : '';
                let tableName = data.filter[i].title.substring(0,data.filter[i].title.indexOf('.'));
                let colName = data.filter[i].title.substr(data.filter[i].title.indexOf('.') + 1, 
                    data.filter[i].title.length - data.filter[i].title.indexOf('.') - 1);
                whereClauseString +=  `tsv_${ colName } @@ to_tsquery('${ filterString }')`;
            }

            queryString = `
            ${query_select} WHERE ${ whereClauseString } LIMIT ${ data.pagesize } OFFSET ${ (data.pageno - 1) * data.pagesize };`;
        }

        console.log(queryString);
        
        
        client.query(queryString, [], function (err, result) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            res.status(200).send(result && result.rows ? result.rows : []);
        });
        


    });
});




