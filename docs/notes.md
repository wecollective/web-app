# convert SVG to JSX

https://svg2jsx.com/

### Build source map

cd into `build/static/js`
run `source-map-explorer *.js --html result.html` to generate source map as result.html file

### Restore Postgres DB from SQL text dump file (MM Forum)

Open Window Command Prompt as administrator and cd into folder with unzipped dump file

`C:\Users\jhwei\Desktop\<folder>`

run `psql -U postgres dbname < dump.sql`

where 'postgres' = the username used in PGAdmin
and 'dbname' = the database name used in PGAdmin

# Check for updates in package.json dependencies

npx npm-check-updates -u

### Run eslint on all files in src folder

npx eslint --fix src
